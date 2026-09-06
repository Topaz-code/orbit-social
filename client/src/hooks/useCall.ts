import { useEffect, useRef, useCallback } from 'react';
import { useCallStore, CallStoreState } from '../stores/callStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { getLiveKitManager, LiveKitManager } from '../lib/livekit.js';
import { api } from '../lib/api.js';
import { useDialogStore } from '../stores/dialogStore.js';
import { mqttClient } from '../lib/mqtt.js';
import { requestNativeCallPermissions, cancelNativeCallNotification, notifyNativeCallStarted } from './useShellBridge.js';
import {
  showCallBrowserNotification,
  dismissCallBrowserNotification,
  requestBrowserNotificationPermission,
} from '../lib/browserNotifications.js';

export function getCallManager(): LiveKitManager {
  return getLiveKitManager({
    onLocalStream: (stream) => {
      useCallStore.getState().setLocalStream(stream);
    },
    onRemoteStream: (stream) => {
      useCallStore.getState().setRemoteStream(stream);
    },
    onCallConnected: () => {
      dismissCallBrowserNotification();
      useCallStore.setState((state) => ({
        activeCall: state.activeCall
          ? { ...state.activeCall, status: 'connected' }
          : null,
      }));
    },
    onCallEnded: () => {
      dismissCallBrowserNotification();
      useCallStore.getState().endCall();
    },
    onError: (err) => {
      console.error('[Call] LiveKit error:', err);
    },
  });
}

// Backward compatibility alias
export { getCallManager as getPeerManager };

export function hangUpCall(): void {
  dismissCallBrowserNotification();
  const lk = getCallManager();
  lk.disconnect().catch(() => {});
  useCallStore.getState().endCall();
}

export function useCall() {
  const { user } = useAuthStore();
  const {
    activeCall,
    localStream,
    remoteStream,
    incomingCall,
    setIncomingCall,
    setActiveCall,
    toggleMute: storeToggleMute,
    toggleVideo: storeToggleVideo,
    toggleSpeaker,
    incrementDuration,
  } = useCallStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Duration timer for active connected call
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      timerRef.current = setInterval(() => {
        incrementDuration();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall?.status, incrementDuration]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const callData = useCallStore.getState().incomingCall;
    if (callData) {
      dismissCallBrowserNotification(callData.callId);
      cancelNativeCallNotification(callData.callId);

      // 1. Instantly broadcast decline signal over MQTT so caller stops ringing immediately
      const payload = {
        type: 'CALL_DECLINED',
        callId: callData.callId,
        callerId: callData.caller?.id,
        by: user?.id,
      };
      mqttClient.publish(`orbit/call/${callData.callId}/signal`, payload);
      if (callData.caller?.id) {
        mqttClient.publish(`orbit/call/${callData.caller.id}/signal`, payload);
      }

      // 2. Persist to DB with dedicated decline endpoint + PUT fallback
      api.post(`/calls/${callData.callId}/decline`).catch(() => {
        api.put(`/calls/${callData.callId}`, { status: 'rejected' }).catch(() => {});
      });

      // 3. Teardown call
      hangUpCall();
      setIncomingCall(null);
    }
  }, [user?.id, setIncomingCall]);

  // End Call handler
  const endCall = useCallback(() => {
    dismissCallBrowserNotification();

    const currentIncoming = useCallStore.getState().incomingCall;
    const currentActive = useCallStore.getState().activeCall;

    if (currentIncoming) {
      cancelNativeCallNotification(currentIncoming.callId);
      rejectCall();
    }

    if (currentActive) {
      cancelNativeCallNotification(currentActive.callId);
      const isRinging = currentActive.status === 'ringing';
      const newStatus = isRinging ? 'missed' : 'completed';
      const signalType = isRinging ? 'CALL_CANCELLED' : 'CALL_ENDED';

      const payload = {
        type: signalType,
        callId: currentActive.callId,
        status: newStatus,
        by: user?.id,
        callerId: user?.id,
      };

      // Notify remote peer instantly over MQTT so ringing or active call halts immediately
      mqttClient.publish(`orbit/call/${currentActive.callId}/signal`, payload);
      if (currentActive.remoteUser?.id) {
        mqttClient.publish(`orbit/call/${currentActive.remoteUser.id}/signal`, payload);
      }

      if (isRinging) {
        api.post(`/calls/${currentActive.callId}/cancel`).catch(() => {
          api.put(`/calls/${currentActive.callId}`, { status: 'missed' }).catch(() => {});
        });
      } else {
        api.put(`/calls/${currentActive.callId}`, {
          status: newStatus,
          duration: currentActive.duration,
        }).catch(() => {});
      }
    }

    hangUpCall();
  }, [user?.id, rejectCall]);

  // Listen for signals targeting the active call specifically (e.g. CALL_ACCEPTED, CALL_DECLINED)
  useEffect(() => {
    if (!activeCall?.callId) return;

    const unsubs = mqttClient.subscribe(
      `orbit/call/${activeCall.callId}/signal`,
      (topic, payload) => {
        if (
          payload?.type === 'CALL_ACCEPTED' ||
          (payload?.type === 'CALL_STATUS_CHANGED' && payload.status === 'ongoing')
        ) {
          notifyNativeCallStarted(activeCall.callId);
          useCallStore.setState((state) => ({
            activeCall: state.activeCall
              ? { ...state.activeCall, status: 'connected' }
              : null,
          }));
        } else if (
          payload?.type === 'CALL_DECLINED' ||
          payload?.type === 'CALL_CANCELLED' ||
          payload?.type === 'CALL_ENDED' ||
          (payload?.type === 'CALL_STATUS_CHANGED' &&
            (payload.status === 'rejected' || payload.status === 'completed' || payload.status === 'missed'))
        ) {
          if (activeCall.status === 'ringing') {
            useDialogStore.getState().toast.info('Call declined');
          } else {
            useDialogStore.getState().toast.info('Call ended');
          }
          hangUpCall();
        }
      }
    );

    return () => {
      unsubs();
    };
  }, [activeCall?.callId, activeCall?.status, activeCall?.remoteUser?.id, activeCall?.type, user]);

  // Request browser desktop notification permissions on user authentication
  useEffect(() => {
    if (user?.id) {
      requestBrowserNotificationPermission().catch(() => {});
    }
  }, [user?.id]);

  // Fail-safe HTTP Polling Heartbeat while call is active (ringing OR connected)
  useEffect(() => {
    if (!activeCall?.callId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/calls/${activeCall.callId}`);
        const callData = res.data?.data;
        const currentActive = useCallStore.getState().activeCall;

        if (callData && currentActive?.callId === activeCall.callId) {
          if (callData.status === 'rejected') {
            useDialogStore.getState().toast.info('Call declined');
            hangUpCall();
          } else if (callData.status === 'missed' || callData.status === 'completed') {
            useDialogStore.getState().toast.info('Call ended');
            hangUpCall();
          }
        }
      } catch (err: any) {
        const currentActive = useCallStore.getState().activeCall;
        if (err?.response?.status === 404 && currentActive?.callId === activeCall.callId) {
          useDialogStore.getState().toast.info('Call ended');
          hangUpCall();
        }
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [activeCall?.callId, activeCall?.status, activeCall?.remoteUser?.id, activeCall?.type, user]);

  // Fail-safe HTTP Polling Heartbeat while receiver is receiving a call
  useEffect(() => {
    if (!incomingCall?.callId) return;

    // Show browser notification if tab is hidden/in background
    showCallBrowserNotification({
      callId: incomingCall.callId,
      callerName: incomingCall.caller.display_name,
      callerAvatar: incomingCall.caller.avatar_url,
      callType: incomingCall.type,
    });

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/calls/${incomingCall.callId}`);
        const callData = res.data?.data;
        const currentIncoming = useCallStore.getState().incomingCall;
        if (callData && currentIncoming?.callId === incomingCall.callId) {
          if (callData.status === 'missed' || callData.status === 'rejected' || callData.status === 'completed') {
            useCallStore.getState().setIncomingCall(null);
            dismissCallBrowserNotification(incomingCall.callId);
            hangUpCall();
          }
        }
      } catch (err: any) {
        const currentIncoming = useCallStore.getState().incomingCall;
        if (err?.response?.status === 404 && currentIncoming?.callId === incomingCall.callId) {
          useCallStore.getState().setIncomingCall(null);
          dismissCallBrowserNotification(incomingCall.callId);
        }
      }
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      dismissCallBrowserNotification(incomingCall.callId);
    };
  }, [incomingCall?.callId]);

  // Outgoing ringing auto-timeout (45 seconds)
  useEffect(() => {
    if (activeCall?.status === 'ringing') {
      const timer = setTimeout(() => {
        useDialogStore.getState().toast.info('No answer');
        endCall();
      }, 45000);
      return () => clearTimeout(timer);
    }
  }, [activeCall?.status, endCall]);

  // Start outgoing call
  const startCall = async (
    targetUser: { id: string; username: string; display_name: string; avatar_url: string },
    type: 'voice' | 'video',
    conversationId?: string
  ) => {
    if (!user) return;

    try {
      requestNativeCallPermissions();

      // 1. Create DB record for call history tracking
      let callId = `call-${Date.now()}`;
      try {
        const res = await api.post('/calls', {
          receiver_id: targetUser.id,
          conversation_id: conversationId || '',
          type,
        });
        if (res.data?.data?.id) {
          callId = res.data.data.id;
        }
      } catch (err) {
        console.warn('[Call] Could not create call record in DB:', err);
      }

      // 2. Set Active Call state to 'ringing'
      setActiveCall({
        callId,
        type,
        isIncoming: false,
        isCaller: true,
        remoteUser: targetUser,
        status: 'ringing',
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: true,
        duration: 0,
      });

      // Subscribe to signal topic for this call specifically
      mqttClient.subscribe(`orbit/call/${callId}/signal`);

      // 3. Fetch LiveKit room join token
      const tokenRes = await api.get(`/calls/${callId}/token`);
      const { token, url } = tokenRes.data.data;

      // 4. Connect to LiveKit Room and publish local tracks
      const lk = getCallManager();
      await lk.connect({
        url,
        token,
        isVideo: type === 'video',
      });
    } catch (error: any) {
      console.error('[Call] Failed to start call:', error);
      const msg = error?.message || 'Could not connect call';
      useDialogStore.getState().toast.error(msg);
      endCall();
    }
  };

  // Accept incoming call
  const acceptCall = async (overrideCall?: CallStoreState['incomingCall']) => {
    let callToAccept = overrideCall || useCallStore.getState().incomingCall;

    // Wait briefly for authenticated user if cold starting
    let currentUser = user || useAuthStore.getState().user;
    if (!currentUser) {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 200));
        currentUser = useAuthStore.getState().user;
        if (currentUser) break;
      }
    }
    if (!currentUser) {
      console.warn('[Call] Cannot accept call: user is not authenticated');
      return;
    }

    // Fallback: if incomingCall is not in store, check if targetCallId is in query params
    if (!callToAccept && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetCallId = params.get('incomingCall') || params.get('callId');
      const callerId = params.get('callerId');
      const callerName = params.get('callerName') || 'Orbit Friend';
      const callerAvatar = params.get('callerAvatar') || '';
      const callType = (params.get('callType') as 'voice' | 'video') || 'voice';

      if (targetCallId) {
        if (callerId) {
          callToAccept = {
            callId: targetCallId,
            caller: {
              id: callerId,
              username: callerName,
              display_name: callerName,
              avatar_url: callerAvatar,
            },
            type: callType,
          };
        } else {
          try {
            const res = await api.get(`/calls/${targetCallId}`);
            const callData = res.data?.data;
            if (callData) {
              callToAccept = {
                callId: targetCallId,
                caller: callData.caller || {
                  id: callData.caller_id,
                  username: 'Orbit Friend',
                  display_name: 'Orbit Friend',
                  avatar_url: '',
                },
                type: callData.type || 'voice',
                conversationId: callData.conversation_id,
              };
            }
          } catch (err) {}
        }
      }
    }

    if (!callToAccept) return;

    try {
      requestNativeCallPermissions();

      // Immediately switch UI to active call so the screen does not lag or show feed
      useCallStore.getState().setActiveCall({
        callId: callToAccept.callId,
        type: callToAccept.type,
        isIncoming: true,
        isCaller: false,
        remoteUser: callToAccept.caller,
        status: 'connected',
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: true,
        duration: 0,
      });

      dismissCallBrowserNotification(callToAccept.callId);
      cancelNativeCallNotification(callToAccept.callId);
      notifyNativeCallStarted(callToAccept.callId);
      useCallStore.getState().setIncomingCall(null);

      // Clean up URL query parameters
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('action');
        url.searchParams.delete('native');
        url.searchParams.delete('incomingCall');
        url.searchParams.delete('callId');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }

      // 1. Fetch LiveKit room join token
      const tokenRes = await api.get(`/calls/${callToAccept.callId}/token`);
      const { token, url } = tokenRes.data.data;

      // 2. Connect to LiveKit Room and publish local tracks
      const lk = getCallManager();
      await lk.connect({
        url,
        token,
        isVideo: callToAccept.type === 'video',
      });

      // 3. Broadcast instant CALL_ACCEPTED signal over MQTT so caller stops ringing
      const payload = {
        type: 'CALL_ACCEPTED',
        callId: callToAccept.callId,
        callerId: callToAccept.caller?.id,
        by: currentUser.id,
      };
      mqttClient.publish(`orbit/call/${callToAccept.callId}/signal`, payload);
      if (callToAccept.caller?.id) {
        mqttClient.publish(`orbit/call/${callToAccept.caller.id}/signal`, payload);
      }

      // 4. Update call status to ongoing in DB
      api.put(`/calls/${callToAccept.callId}`, { status: 'ongoing' }).catch(() => {});
    } catch (error: any) {
      console.error('[Call] Failed to accept call:', error);
      rejectCall();
    }
  };

  // Listen for native shell call-accept action trigger (with instant payload support)
  useEffect(() => {
    const handleTriggerAccept = async (event?: Event) => {
      const customEvent = event as CustomEvent<{
        callId?: string;
        callerId?: string;
        callerName?: string;
        callerAvatar?: string;
        type?: 'voice' | 'video';
        caller?: any;
        conversationId?: string;
      }>;
      const detail = customEvent?.detail;
      let targetCallId = detail?.callId;

      // Fallback: check query params or pathname
      let paramCallerId = '';
      let paramCallerName = '';
      let paramCallerAvatar = '';
      let paramCallType: 'voice' | 'video' = 'voice';

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (!targetCallId) {
          targetCallId = params.get('incomingCall') || params.get('callId') || '';
          if (!targetCallId) {
            const match = window.location.pathname.match(/\/calls\/([^/?#]+)/);
            if (match) targetCallId = match[1];
          }
        }
        paramCallerId = params.get('callerId') || '';
        paramCallerName = params.get('callerName') || '';
        paramCallerAvatar = params.get('callerAvatar') || '';
        paramCallType = (params.get('callType') as 'voice' | 'video') || 'voice';
      }

      // 1. If incomingCall is already mounted in store, accept immediately
      const storeIncoming = useCallStore.getState().incomingCall;
      if (storeIncoming) {
        acceptCall();
        return;
      }

      // 2. If caller details are present from notification payload or URL, build and accept immediately!
      const finalCallerId = detail?.callerId || detail?.caller?.id || paramCallerId;
      const finalCallerName = detail?.callerName || detail?.caller?.display_name || paramCallerName || 'Orbit Friend';
      const finalCallerAvatar = detail?.callerAvatar || detail?.caller?.avatar_url || paramCallerAvatar || '';
      const finalType = detail?.type || paramCallType || 'voice';

      if (targetCallId && finalCallerId) {
        const callObj = {
          callId: targetCallId,
          caller: {
            id: finalCallerId,
            username: finalCallerName,
            display_name: finalCallerName,
            avatar_url: finalCallerAvatar,
          },
          type: finalType,
          conversationId: detail?.conversationId,
        };
        useCallStore.getState().setIncomingCall(callObj);
        acceptCall(callObj);
        return;
      }

      // 3. If targetCallId exists but no caller info, fetch metadata from server API
      if (targetCallId) {
        try {
          const res = await api.get(`/calls/${targetCallId}`);
          const callData = res.data?.data;
          if (callData) {
            const caller = callData.caller || {
              id: callData.caller_id,
              username: 'Orbit Friend',
              display_name: 'Orbit Friend',
              avatar_url: '',
            };
            const fetchedCall = {
              callId: targetCallId,
              caller,
              type: callData.type || 'voice',
              conversationId: callData.conversation_id,
            };
            useCallStore.getState().setIncomingCall(fetchedCall);
            acceptCall(fetchedCall);
            return;
          }
        } catch (err) {
          console.warn('[Call] Failed to fetch call for trigger-accept:', err);
        }
      }

      // 4. Polling retry loop in case call store is populated asynchronously
      let attempts = 0;
      const checkAndAccept = () => {
        const incoming = useCallStore.getState().incomingCall;
        if (incoming) {
          acceptCall(incoming);
        } else if (attempts < 15) {
          attempts++;
          setTimeout(checkAndAccept, 300);
        }
      };
      checkAndAccept();
    };

    // On mount, if URL has action=accept from cold launch, auto-trigger
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'accept') {
        handleTriggerAccept();
      }
    }

    window.addEventListener('orbit:trigger-accept-call', handleTriggerAccept);
    window.addEventListener('orbit:call-accept', handleTriggerAccept);
    return () => {
      window.removeEventListener('orbit:trigger-accept-call', handleTriggerAccept);
      window.removeEventListener('orbit:call-accept', handleTriggerAccept);
    };
  }, [acceptCall]);

  const toggleMute = useCallback(() => {
    storeToggleMute();
    getCallManager().toggleMute().catch(() => {});
  }, [storeToggleMute]);

  const toggleVideo = useCallback(() => {
    storeToggleVideo();
    getCallManager().toggleVideo().catch(() => {});
  }, [storeToggleVideo]);

  return {
    activeCall,
    localStream,
    remoteStream,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  };
}
