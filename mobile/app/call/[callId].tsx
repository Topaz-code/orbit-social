import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { WebRTCHelper } from '../../lib/webrtc';
import { useAuthStore } from '../../stores/authStore';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react-native';

export default function CallScreen() {
  const { callId, isInitiator } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [rtcHelper, setRtcHelper] = useState<WebRTCHelper | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  useEffect(() => {
    if (!user || !callId) return;

    let helper = new WebRTCHelper(callId as string, user.id, (stream) => {
      setRemoteStream(stream);
    });
    setRtcHelper(helper);

    const initCall = async () => {
      try {
        InCallManager.start({ media: 'video' });

        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: 1280,
            height: 720,
            frameRate: 30,
            facingMode: 'user',
          },
        });
        
        setLocalStream(stream);

        if (isInitiator === 'true') {
          await helper.startCall(stream);
        } else {
          await helper.setup(); // Wait for offer
        }
      } catch (err) {
        console.error('Failed to init call', err);
      }
    };

    initCall();

    return () => {
      helper.cleanup();
      if (localStream) {
        localStream.getTracks().forEach((t: any) => t.stop());
      }
      InCallManager.stop();
    };
  }, [callId, user, isInitiator]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t: any) => {
        t.enabled = !t.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t: any) => {
        t.enabled = !t.enabled;
      });
      setIsVideoEnabled(localStream.getVideoTracks()[0].enabled);
    }
  };

  const endCall = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Remote Video */}
      {remoteStream ? (
        <RTCView 
          streamURL={remoteStream.toURL()} 
          style={StyleSheet.absoluteFill} 
          objectFit="cover" 
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl">Connecting...</Text>
        </View>
      )}

      {/* Local Video (PiP) */}
      {localStream && isVideoEnabled && (
        <View className="absolute top-16 right-4 w-24 h-36 rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-900">
          <RTCView 
            streamURL={localStream.toURL()} 
            style={StyleSheet.absoluteFill} 
            objectFit="cover" 
            zOrder={1}
          />
        </View>
      )}

      {/* Controls */}
      <View className="absolute bottom-12 w-full flex-row justify-evenly px-8">
        <TouchableOpacity 
          className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-slate-700/80'}`}
          onPress={toggleMute}
        >
          {isMuted ? <MicOff color="white" /> : <Mic color="white" />}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-16 h-16 rounded-full items-center justify-center bg-red-600"
          onPress={endCall}
        >
          <PhoneOff color="white" size={30} />
        </TouchableOpacity>

        <TouchableOpacity 
          className={`w-14 h-14 rounded-full items-center justify-center ${!isVideoEnabled ? 'bg-red-500' : 'bg-slate-700/80'}`}
          onPress={toggleVideo}
        >
          {!isVideoEnabled ? <VideoOff color="white" /> : <Video color="white" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
