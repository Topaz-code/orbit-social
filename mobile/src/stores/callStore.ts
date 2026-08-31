import { create } from 'zustand';
import { MediaStream } from 'react-native-webrtc';

export interface ActiveCallState {
  callId: string;
  type: 'voice' | 'video';
  isIncoming: boolean;
  isCaller: boolean;
  remoteUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  status: 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  duration: number;
}

interface CallStore {
  activeCall: ActiveCallState | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  setActiveCall: (call: ActiveCallState | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  endCall: (callId?: string) => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  activeCall: null,
  localStream: null,
  remoteStream: null,
  setActiveCall: (call) => set({ activeCall: call }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  toggleMute: () => {
    const { activeCall, localStream } = get();
    if (!activeCall || !localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = activeCall.isMuted; // Invert
    }
    set({ activeCall: { ...activeCall, isMuted: !activeCall.isMuted } });
  },
  toggleVideo: () => {
    const { activeCall, localStream } = get();
    if (!activeCall || !localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = activeCall.isVideoOff; // Invert
    }
    set({ activeCall: { ...activeCall, isVideoOff: !activeCall.isVideoOff } });
  },
  endCall: () => {
    const { localStream, remoteStream } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());
    set({ activeCall: null, localStream: null, remoteStream: null });
  },
}));
