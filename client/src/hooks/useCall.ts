import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../stores/callStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { PeerManager, CallMetadata } from '../lib/webrtc.js';
import { api } from '../lib/api.js';
import { MediaConnection } from 'peerjs';
import { useDialogStore } from '../stores/dialogStore.js';
import { mqttClient } from '../lib/mqtt.js';

// Hold single MediaConnection reference for incoming call answering
let currentIncomingMediaConnection: MediaConnection | null = null;
let peerManagerInstance: PeerManager | null = null;

export function getPeerManager(): PeerManager {
  if (!peerManagerInstance) {
    peerManagerInstance = new PeerManager({
      onIncomingCall: (mediaConn, metadata) => {
        currentIncomingMediaConnection = mediaConn;
        useCallStore.getState().setIncomingCall({
          callId: metadata.callId || `call-${Date.now()}`,
          caller: metadata.caller || {
            id: mediaConn.peer,
            username: 'User',
            display_name: 'Orbit Friend',
            avatar_url: '',
          },
          type: metadata.type || 'voice',
          conversationId: metadata.conversationId,
        });
      },
      onRemoteStream: (stream) => {
        useCallStore.getState().setRemoteStream(stream);
      },
      onCallConnected: () => {
        useCallStore.setState((state) => ({
          activeCall: state.activeCall
            ? { ...state.activeCall, status: 'connected' }
            : null,
        }));
      },
      onCallEnded: () => {
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

  // End Call handler
  const endCall = useCallback(() => {
    const currentActive = useCallStore.getState().activeCall;
    if (currentActive) {
      const isRinging = currentActive.status === 'ringing';
      const newStatus = isRinging ? 'missed' : 'completed';
      const signalType = isRinging ? 'CALL_CANCELLED' : 'CALL_ENDED';

      const payload = {
        type: signalType,
        callId: currentActive.callId,
        status: newStatus,
        by: user?.id,
      };

      // Notify remote peer instantly over MQTT so ringing or active call halts immediately
      mqttClient.publish(`orbit/call/${currentActive.callId}/signal`, payload);
      if (currentActive.remoteUser?.id) {
        mqttClient.publish(`orbit/call/${currentActive.remoteUser.id}/signal`, payload);
      }

      api.put(`/calls/${currentActive.callId}`, {
        status: newStatus,
        duration: currentActive.duration,
      }).catch(() => {});
    }

    hangUpCall();
  }, [user?.id]);

  // Listen for signals targeting the active call specifically (e.g. CALL_DECLINED)
  useEffect(() => {
    if (!activeCall?.callId) return;

    const unsubs = mqttClient.subscribe(
      `orbit/call/${activeCall.callId}/signal`,
      (topic, payload) => {
        if (
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
  }, [activeCall?.callId, activeCall?.status]);

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
    if (!incomingCall || !user) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: AUDIO_CONSTRAINTS,
        video: incomingCall.type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);


      const pm = getPeerManager();
      if (currentIncomingMediaConnection) {
        pm.answerCall(currentIncomingMediaConnection, stream);
      }

      setActiveCall({
        callId: incomingCall.callId,
        type: incomingCall.type,
        isIncoming: true,
        isCaller: false,
        remoteUser: incomingCall.caller,
        status: 'connected',
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: true,
        duration: 0,
      });

      setIncomingCall(null);

      // Update call status to ongoing in DB
      api.put(`/calls/${incomingCall.callId}`, { status: 'ongoing' }).catch(() => {});
    } catch (error: any) {
      console.error('[Call] Failed to accept call:', error);
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (incomingCall) {
      const callData = incomingCall;

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

      // 2. Persist to DB
      api.put(`/calls/${callData.callId}`, { status: 'rejected' }).catch(() => {});

      // 3. Teardown media connection
      if (currentIncomingMediaConnection) {
        try {
          currentIncomingMediaConnection.close();
        } catch {}
        currentIncomingMediaConnection = null;
      }
      setIncomingCall(null);
    }
  };

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

