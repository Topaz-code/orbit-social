import { create } from 'zustand';
import { ActiveCallState } from '../types/index.js';

interface CallStoreState {
  activeCall: ActiveCallState | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: {
    callId: string;
    caller: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string;
    };
    type: 'voice' | 'video';
    conversationId?: string;
  } | null;

  setIncomingCall: (call: CallStoreState['incomingCall']) => void;
  setActiveCall: (call: ActiveCallState | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  incrementDuration: () => void;
  endCall: () => void;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  activeCall: null,
  localStream: null,
  remoteStream: null,
  incomingCall: null,

  setIncomingCall: (call) => set({ incomingCall: call }),
  setActiveCall: (call) => set({ activeCall: call }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  toggleMute: () => {
    const { localStream, activeCall } = get();
    if (localStream && activeCall) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        set({
          activeCall: {
            ...activeCall,
            isMuted: !audioTrack.enabled,
          },
        });
      }
    }
  },

  toggleVideo: () => {
    const { localStream, activeCall } = get();
    if (localStream && activeCall) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({
          activeCall: {
            ...activeCall,
            isVideoOff: !videoTrack.enabled,
          },
        });
      }
    }
  },

  toggleSpeaker: () => {
    const { activeCall } = get();
    if (activeCall) {
      set({
        activeCall: {
          ...activeCall,
          isSpeakerOn: !activeCall.isSpeakerOn,
        },
      });
    }
  },

  incrementDuration: () => {
    const { activeCall } = get();
    if (activeCall && activeCall.status === 'connected') {
      set({
        activeCall: {
          ...activeCall,
          duration: activeCall.duration + 1,
        },
      });
    }
  },

  endCall: () => {
    const { localStream, remoteStream } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    set({
      activeCall: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
    });
  },
}));
