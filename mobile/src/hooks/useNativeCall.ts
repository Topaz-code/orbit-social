import { useEffect, useRef } from 'react';
import RNCallKeep from 'react-native-callkeep';
import { useCallStore } from '../stores/callStore';
import { NativePeerManager } from '../services/webrtc';

export function useNativeCall() {
  const { activeCall, localStream, setActiveCall, setLocalStream, setRemoteStream, endCall } = useCallStore();
  const peerManagerRef = useRef<NativePeerManager | null>(null);

  useEffect(() => {
    peerManagerRef.current = new NativePeerManager();
    peerManagerRef.current.onRemoteStream = (stream) => {
      setRemoteStream(stream);
    };

    const answerHandler = async ({ callUUID }: { callUUID: string }) => {
      console.log('[CallKeep] Answering call:', callUUID);
      RNCallKeep.backToForeground();
      RNCallKeep.setCurrentCallActive(callUUID);

      try {
        const isVideo = activeCall?.type === 'video';
        const stream = await peerManagerRef.current?.getLocalStream(isVideo);
        if (stream) setLocalStream(stream);

        if (activeCall) {
          setActiveCall({ ...activeCall, status: 'connected' });
        }
      } catch (err) {
        console.error('[Call] Error answering incoming call stream:', err);
      }
    };

    const endHandler = ({ callUUID }: { callUUID: string }) => {
      console.log('[CallKeep] Ending call:', callUUID);
      peerManagerRef.current?.close();
      endCall(callUUID);
      RNCallKeep.endCall(callUUID);
    };

    const muteHandler = ({ muted, callUUID }: { muted: boolean; callUUID: string }) => {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = !muted;
      }
    };

    RNCallKeep.addEventListener('answerCall', answerHandler);
    RNCallKeep.addEventListener('endCall', endHandler);
    RNCallKeep.addEventListener('didPerformSetMutedCallAction', muteHandler);

    return () => {
      RNCallKeep.removeEventListener('answerCall', answerHandler);
      RNCallKeep.removeEventListener('endCall', endHandler);
      RNCallKeep.removeEventListener('didPerformSetMutedCallAction', muteHandler);
      peerManagerRef.current?.close();
    };
  }, [activeCall?.type, localStream]);

  return {
    peerManager: peerManagerRef.current,
  };
}
