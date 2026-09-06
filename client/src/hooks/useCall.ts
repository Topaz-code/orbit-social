import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../stores/callStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { PeerManager, CallMetadata } from '../lib/webrtc.js';
import { api } from '../lib/api.js';
import { MediaConnection } from 'peerjs';
import { useDialogStore } from '../stores/dialogStore.js';
import { mqttClient } from '../lib/mqtt.js';
import { requestNativeCallPermissions, cancelNativeCallNotification, notifyNativeCallStarted } from './useShellBridge.js';
import {
  showCallBrowserNotification,
  dismissCallBrowserNotification,
  requestBrowserNotificationPermission,
} from '../lib/browserNotifications.js';

// Hold single MediaConnection reference for incoming call answering
let currentIncomingMediaConnection: MediaConnection | null = null;
let peerManagerInstance: PeerManager | null = null;

export function getPeerManager(): PeerManager {
  if (!peerManagerInstance) {
    peerManagerInstance = new PeerManager({
      onIncomingCall: (mediaConn, metadata) => {
        requestNativeCallPermissions();
        const active = useCallStore.getState().activeCall;
        if (active && active.status === 'connected') {
          console.log('[Call] Active call already connected, answering duplicate offer in background');
          const localStream = useCallStore.getState().localStream;
          if (localStream && (!peerManagerInstance?.getCurrentCall() || !peerManagerInstance.getCurrentCall()?.open)) {
            peerManagerInstance?.answerCall(mediaConn, localStream);
          }
          return;
        }

        currentIncomingMediaConnection = mediaConn;
        const callId = metadata.callId || `call-${Date.now()}`;
        const caller = metadata.caller || {
          id: mediaConn.peer,
          username: 'User',
          display_name: 'Orbit Friend',
          avatar_url: '',
        };
        useCallStore.getState().setIncomingCall({
          callId,
          caller,
          type: metadata.type || 'voice',
          conversationId: metadata.conversationId,
        });
        showCallBrowserNotification({
          callId,
          callerName: caller.display_name,
          callerAvatar: caller.avatar_url,
          callType: metadata.type || 'voice',
        });
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
        currentIncomingMediaConnection = null;
        useCallStore.getState().endCall();
      },
      onError: (err) => {
        console.error('[Call] PeerManager error:', err);
      },
    });
  }
  return peerManagerInstance;
}

export function hangUpCall(): void {
  dismissCallBrowserNotification();
  const pm = getPeerManager();
  pm.hangUp();
  currentIncomingMediaConnection = null;
  useCallStore.getState().endCall();
}

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};


export function useCall() {
  const { user } = useAuthStore();
  const {
    activeCall,
    localStream,
    remoteStream,
    incomingCall,
    setIncomingCall,
    setActiveCall,
    setLocalStream,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    incrementDuration,
    endCall: storeEndCall,
  } = useCallStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Peer connection when user is authenticated
  useEffect(() => {
    if (user?.id) {
      const pm = getPeerManager();
      pm.init(user.id);
    }
  }, [user?.id]);

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

      // 3. Teardown media connection
      if (currentIncomingMediaConnection) {
        try {
          currentIncomingMediaConnection.close();
        } catch {}
        currentIncomingMediaConnection = null;
      }
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

          // If caller's WebRTC media connection is not active yet, dial the newly online receiver
          const pm = getPeerManager();
          const currentCall = pm.getCurrentCall();
          const currentLocalStream = useCallStore.getState().localStream;
          if ((!currentCall || !currentCall.open) && currentLocalStream && activeCall.remoteUser?.id && user) {
            const metadata: CallMetadata = {
              callId: activeCall.callId,
              caller: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                avatar_url: user.avatar_url || '',
              },
              type: activeCall.type,
            };
            pm.makeCall(activeCall.remoteUser.id, currentLocalStream, metadata);
          }
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
        if (callData) {
          if (callData.status === 'ongoing' && activeCall.status === 'ringing') {
            notifyNativeCallStarted(activeCall.callId);
            useCallStore.setState((state) => ({
              activeCall: state.activeCall
                ? { ...state.activeCall, status: 'connected' }
                : null,
            }));

            // Redial PeerJS if media is not established yet
            const pm = getPeerManager();
            const currentCall = pm.getCurrentCall();
            const currentLocalStream = useCallStore.getState().localStream;
            if ((!currentCall || !currentCall.open) && currentLocalStream && activeCall.remoteUser?.id && user) {
              const metadata: CallMetadata = {
                callId: activeCall.callId,
                caller: {
                  id: user.id,
                  username: user.username,
                  display_name: user.display_name,
                  avatar_url: user.avatar_url || '',
                },
                type: activeCall.type,
              };
              pm.makeCall(activeCall.remoteUser.id, currentLocalStream, metadata);
            }
          } else if (callData.status === 'rejected') {
            useDialogStore.getState().toast.info('Call declined');
            hangUpCall();
          } else if (callData.status === 'missed' || callData.status === 'completed') {
            useDialogStore.getState().toast.info('Call ended');
            hangUpCall();
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
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
        if (callData) {
          if (callData.status === 'missed' || callData.status === 'rejected' || callData.status === 'completed') {
            useCallStore.getState().setIncomingCall(null);
            dismissCallBrowserNotification(incomingCall.callId);
            if (currentIncomingMediaConnection) {
              try {
                currentIncomingMediaConnection.close();
              } catch {}
              currentIncomingMediaConnection = null;
            }
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
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

      // 1. Acquire media stream with standard high-compatibility audio constraints
      const constraints: MediaStreamConstraints = {
        audio: AUDIO_CONSTRAINTS,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // 2. Create DB record for call history tracking
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

      // 3. Set Active Call state to 'ringing'
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

      // 4. Dial via PeerJS
      const pm = getPeerManager();
      const metadata: CallMetadata = {
        callId,
        caller: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url || '',
        },
        type,
        conversationId,
      };

      const call = pm.makeCall(targetUser.id, stream, metadata);
      if (!call) {
        throw new Error('Signaling server is not ready. Please try again.');
      }
    } catch (error: any) {
      console.error('[Call] Failed to start call:', error);
      useDialogStore.getState().toast.error(error.message || 'Could not access microphone/camera');
      endCall();
    }
  };


  // Accept incoming call
  const acceptCall = async () => {
    let callToAccept = useCallStore.getState().incomingCall;
    const currentUser = user || useAuthStore.getState().user;
    if (!currentUser) return;

    // Fallback: if incomingCall is not in store, check if targetCallId is in query params
    if (!callToAccept && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetCallId = params.get('incomingCall') || params.get('callId');
      if (targetCallId) {
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

      const constraints: MediaStreamConstraints = {
        audio: AUDIO_CONSTRAINTS,
        video: callToAccept.type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      useCallStore.getState().setLocalStream(stream);

      const pm = getPeerManager();
      if (currentIncomingMediaConnection) {
        pm.answerCall(currentIncomingMediaConnection, stream);
      } else if (callToAccept.caller?.id && callToAccept.caller.id !== 'unknown') {
        // Reverse dial if incoming PeerJS connection was not initialized while device was asleep
        const metadata: CallMetadata = {
          callId: callToAccept.callId,
          caller: {
            id: currentUser.id,
            username: currentUser.username,
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url || '',
          },
          type: callToAccept.type,
          conversationId: callToAccept.conversationId,
        };
        pm.makeCall(callToAccept.caller.id, stream, metadata);
      }

      // 1. Broadcast instant CALL_ACCEPTED signal over MQTT so caller stops ringing
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

      // 2. Update call status to ongoing in DB
      api.put(`/calls/${callToAccept.callId}`, { status: 'ongoing' }).catch(() => {});
    } catch (error: any) {
      console.error('[Call] Failed to accept call:', error);
      rejectCall();
    }
  };

  // Listen for native shell call-accept action trigger (with cold start fetch fallback)
  useEffect(() => {
    const handleTriggerAccept = async (event?: Event) => {
      const customEvent = event as CustomEvent<{ callId?: string }>;
      let targetCallId = customEvent?.detail?.callId;

      // Fallback: check query params or pathname
      if (!targetCallId && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        targetCallId = params.get('incomingCall') || params.get('callId') || '';
        if (!targetCallId) {
          const match = window.location.pathname.match(/\/calls\/([^/?#]+)/);
          if (match) targetCallId = match[1];
        }
      }

      // 1. If incomingCall is already mounted in store, accept immediately
      const storeIncoming = useCallStore.getState().incomingCall;
      if (storeIncoming) {
        acceptCall();
        return;
      }

      // 2. If targetCallId exists, fetch call metadata from server API
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
            useCallStore.getState().setIncomingCall({
              callId: targetCallId,
              caller,
              type: callData.type || 'voice',
              conversationId: callData.conversation_id,
            });
            setTimeout(() => {
              acceptCall();
            }, 50);
            return;
          }
        } catch (err) {
          console.warn('[Call] Failed to fetch call for trigger-accept:', err);
        }
      }

      // 3. Polling retry loop in case call store is populated asynchronously
      let attempts = 0;
      const checkAndAccept = () => {
        const incoming = useCallStore.getState().incomingCall;
        if (incoming) {
          acceptCall();
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

