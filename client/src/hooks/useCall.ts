import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../stores/callStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { getPeerInstance } from '../lib/peer.js';
import { api } from '../lib/api.js';
import { mqttClient } from '../lib/mqtt.js';

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
    setRemoteStream,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    incrementDuration,
    endCall,
  } = useCallStore();

  const currentCallRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize duration timer when activeCall status is connected
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
  }, [activeCall?.status]);

  // PeerJS listener for incoming media calls
  useEffect(() => {
    if (!user) return;
    const peer = getPeerInstance(user.id);

    peer.on('call', async (mediaConnection) => {
      currentCallRef.current = mediaConnection;

      // When remote side closes
      mediaConnection.on('close', () => {
        handleEndCall();
      });

      mediaConnection.on('error', (err) => {
        console.error('[PeerJS] Media connection error:', err);
        handleEndCall();
      });
    });

    return () => {
      // Cleanup
    };
  }, [user?.id]);

  // Start outgoing call
  const startCall = async (
    targetUser: { id: string; username: string; display_name: string; avatar_url: string },
    type: 'voice' | 'video',
    conversationId?: string
  ) => {
    if (!user) return;

    try {
      // 1. Get user media stream
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // 2. Initiate Call Record in DB & push MQTT incoming alert
      const res = await api.post('/calls', {
        receiver_id: targetUser.id,
        conversation_id: conversationId || '',
        type,
      });

      const callId = res.data?.data?.id || `call-${Date.now()}`;

      // 3. Set Active Call State (Ringing)
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

      // 4. Dial with PeerJS
      const peer = getPeerInstance(user.id);
      const call = peer.call(targetUser.id, stream);
      currentCallRef.current = call;

      call.on('stream', (remoteMediaStream) => {
        setRemoteStream(remoteMediaStream);
        setActiveCall({
          callId,
          type,
          isIncoming: false,
          isCaller: true,
          remoteUser: targetUser,
          status: 'connected',
          isMuted: false,
          isVideoOff: false,
          isSpeakerOn: true,
          duration: 0,
        });
      });

      call.on('close', () => {
        handleEndCall();
      });

      call.on('error', (err) => {
        console.error('[PeerJS] Outgoing call error:', err);
        handleEndCall();
      });

      // Subscribe to signal updates
      mqttClient.subscribe(`orbit/call/${callId}/signal`, (topic, payload) => {
        if (payload?.type === 'CALL_STATUS_CHANGED' && payload.status === 'rejected') {
          handleEndCall();
        }
      });
    } catch (error: any) {
      console.error('Failed to start call:', error);
      alert(error.message || 'Could not access microphone/camera');
      endCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall || !user) return;

    try {
      const constraints = {
        audio: true,
        video: incomingCall.type === 'video' ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (currentCallRef.current) {
        currentCallRef.current.answer(stream);

        currentCallRef.current.on('stream', (remoteMediaStream: MediaStream) => {
          setRemoteStream(remoteMediaStream);
        });
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

      // Update call status to ongoing in backend
      api.put(`/calls/${incomingCall.callId}`, { status: 'ongoing' }).catch(() => {});
    } catch (error: any) {
      console.error('Failed to accept call:', error);
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (incomingCall) {
      api.put(`/calls/${incomingCall.callId}`, { status: 'rejected' }).catch(() => {});
      mqttClient.publish(`orbit/call/${incomingCall.callId}/signal`, {
        type: 'CALL_STATUS_CHANGED',
        callId: incomingCall.callId,
        status: 'rejected',
      });
      setIncomingCall(null);
    }
  };

  // End active call
  const handleEndCall = useCallback(() => {
    if (activeCall) {
      api.put(`/calls/${activeCall.callId}`, {
        status: 'completed',
        duration: activeCall.duration,
      }).catch(() => {});

      mqttClient.publish(`orbit/call/${activeCall.callId}/signal`, {
        type: 'CALL_STATUS_CHANGED',
        callId: activeCall.callId,
        status: 'completed',
        duration: activeCall.duration,
      });
    }

    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }

    endCall();
  }, [activeCall, endCall]);

  return {
    activeCall,
    localStream,
    remoteStream,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall: handleEndCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  };
}
