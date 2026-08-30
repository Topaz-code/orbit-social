import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../stores/callStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { WebRTCManager } from '../lib/webrtc.js';
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

  const webrtcRef = useRef<WebRTCManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep localStreamRef in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // End call handler
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

    if (webrtcRef.current) {
      webrtcRef.current.close();
      webrtcRef.current = null;
    }
    pendingOfferRef.current = null;

    endCall();
  }, [activeCall, endCall]);

  const getOrCreateWebRTC = useCallback((callId: string) => {
    if (webrtcRef.current) return webrtcRef.current;

    const webrtc = new WebRTCManager({
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
        useCallStore.setState((state) => ({
          activeCall: state.activeCall ? { ...state.activeCall, status: 'connected' } : null,
        }));
      },
      onConnectionStateChange: (state) => {
        if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          handleEndCall();
        }
      },
      onSendSignal: (signalData) => {
        mqttClient.publish(`orbit/call/${callId}/signal`, signalData);
      },
      onError: (err) => {
        console.error('[WebRTC] Error:', err);
      },
    });

    webrtcRef.current = webrtc;
    return webrtc;
  }, [handleEndCall, setRemoteStream]);

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
  }, [activeCall?.status, incrementDuration]);

  // MQTT Signal Handler
  useEffect(() => {
    const currentCallId = activeCall?.callId || incomingCall?.callId;
    if (!currentCallId) return;

    const topic = `orbit/call/${currentCallId}/signal`;
    const handleSignal = async (_: string, payload: any) => {
      if (!payload) return;

      if (payload.type === 'CALL_STATUS_CHANGED') {
        if (payload.status === 'rejected' || payload.status === 'completed') {
          handleEndCall();
        }
        return;
      }

      const webrtc = getOrCreateWebRTC(currentCallId);

      if (payload.type === 'SDP_OFFER') {
        if (localStreamRef.current) {
          webrtc.setLocalStream(localStreamRef.current);
          await webrtc.handleOffer(payload.sdp);
        } else {
          pendingOfferRef.current = payload.sdp;
        }
      } else if (payload.type === 'SDP_ANSWER') {
        await webrtc.handleAnswer(payload.sdp);
      } else if (payload.type === 'ICE_CANDIDATE') {
        await webrtc.handleCandidate(payload.candidate);
      }
    };

    mqttClient.subscribe(topic, handleSignal);

    return () => {
      mqttClient.unsubscribe(topic);
    };
  }, [activeCall?.callId, incomingCall?.callId, getOrCreateWebRTC, handleEndCall]);

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
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

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

      // 4. Dial with WebRTC
      const webrtc = getOrCreateWebRTC(callId);
      webrtc.setLocalStream(stream);
      await webrtc.createOffer();
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
        video: incomingCall.type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

      const webrtc = getOrCreateWebRTC(incomingCall.callId);
      webrtc.setLocalStream(stream);

      if (pendingOfferRef.current) {
        await webrtc.handleOffer(pendingOfferRef.current);
        pendingOfferRef.current = null;
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
