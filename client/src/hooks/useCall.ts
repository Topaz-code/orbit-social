import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../stores/callStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { PeerManager, CallMetadata } from '../lib/webrtc.js';
import { api } from '../lib/api.js';
import { MediaConnection } from 'peerjs';

// Hold single MediaConnection reference for incoming call answering
let currentIncomingMediaConnection: MediaConnection | null = null;
let peerManagerInstance: PeerManager | null = null;

function getPeerManager(): PeerManager {
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

const LOW_LATENCY_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1, // Mono stream: cuts processing latency and buffer in half
  sampleRate: 48000,
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
      api.put(`/calls/${currentActive.callId}`, {
        status: 'completed',
        duration: currentActive.duration,
      }).catch(() => {});
    }

    const pm = getPeerManager();
    pm.hangUp();
    currentIncomingMediaConnection = null;
    storeEndCall();
  }, [storeEndCall]);

  // Start outgoing call
  const startCall = async (
    targetUser: { id: string; username: string; display_name: string; avatar_url: string },
    type: 'voice' | 'video',
    conversationId?: string
  ) => {
    if (!user) return;

    try {
      // 1. Acquire media stream with low-latency audio constraints
      const constraints: MediaStreamConstraints = {
        audio: LOW_LATENCY_AUDIO_CONSTRAINTS,
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
      alert(error.message || 'Could not access microphone/camera');
      endCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !user) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: LOW_LATENCY_AUDIO_CONSTRAINTS,
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
      api.put(`/calls/${incomingCall.callId}`, { status: 'rejected' }).catch(() => {});
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

