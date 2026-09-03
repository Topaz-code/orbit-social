import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mediaDevices, RTCView } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { WebRTCHelper } from '../../lib/webrtc';
import { mqttClient } from '../../lib/mqtt';
import { useAuthStore } from '../../stores/authStore';
import { requestCallPermissions } from '../../lib/permissions';
import api from '../../lib/api';
import { Mic, MicOff, Video, VideoOff, PhoneOff, PhoneMissed, RefreshCw } from 'lucide-react-native';

const CONNECT_TIMEOUT_MS = 30000;

export default function CallScreen() {
  const { callId, isInitiator, type } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(type !== 'voice');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [failReason, setFailReason] = useState('');
  const helperRef = useRef<WebRTCHelper | null>(null);
  const localStreamRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedRef = useRef(false);

  const callType = (Array.isArray(type) ? type[0] : type) === 'video' ? 'video' : 'voice';
  const initiator = (Array.isArray(isInitiator) ? isInitiator[0] : isInitiator) === 'true';
  const resolvedCallId = Array.isArray(callId) ? callId[0] : callId;

  const fail = (reason: string) => {
    console.error('[Orbit] Call failed:', reason);
    setFailReason(reason);
    setStatus('failed');
    cleanupMedia();
  };

  const cleanupMedia = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    helperRef.current?.cleanup();
    helperRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks?.().forEach((t: any) => t.stop());
      localStreamRef.current = null;
    }
    try {
      InCallManager.stop();
    } catch {}
  };

  const initCall = async () => {
    if (!user || !resolvedCallId) {
      fail('Missing call session.');
      return;
    }

    setStatus('connecting');
    setFailReason('');
    setRemoteStream(null);
    connectedRef.current = false;

    try {
      const granted = await requestCallPermissions(callType);
      if (!granted) {
        fail('Camera or microphone permission was denied.');
        return;
      }

      // FIX 5 — actually WAIT for the signaling socket.
      //
      // `connect()` returns immediately when an earlier attempt is still in
      // flight, so the old `if (!isConnected())` check below frequently ran
      // against a socket that was mid-handshake and reported "signaling (MQTT)
      // is offline" even though the broker was fine. `waitForConnection` polls
      // until the socket is live and the failure message carries the real
      // reason (expired token, unreachable broker, blocked upgrade, ...).
      try {
        await mqttClient.connect(user.id);
      } catch (mqttErr: any) {
        console.error('[Orbit] MQTT connect error during call:', mqttErr?.message || mqttErr);
      }

      const signalingReady = await mqttClient.waitForConnection(8000);
      if (!signalingReady) {
        const reason = mqttClient.getLastError();
        fail(
          reason
            ? `Call Failed to Connect — signaling (MQTT) is offline: ${reason}`
            : 'Call Failed to Connect — signaling (MQTT) is offline.'
        );
        return;
      }

      const helper = new WebRTCHelper(resolvedCallId, user.id, (stream) => {
        connectedRef.current = true;
        setRemoteStream(stream);
        setStatus('connected');
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });
      helper.onError = (err) => {
        fail(err?.message || 'WebRTC signaling failed.');
      };
      helperRef.current = helper;

      InCallManager.start({ media: callType === 'video' ? 'video' : 'audio' });

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video:
          callType === 'video'
            ? {
                width: 1280,
                height: 720,
                frameRate: 30,
                facingMode: 'user',
              }
            : false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (initiator) {
        await helper.startCall(stream);
      } else {
        await helper.setup();
        stream.getTracks().forEach((track: any) => {
          (helper.peerConnection as any)?.addTrack(track, stream);
        });
      }

      timeoutRef.current = setTimeout(() => {
        if (!connectedRef.current) {
          fail('Call Failed to Connect — no response from the other peer.');
        }
      }, CONNECT_TIMEOUT_MS);
    } catch (err: any) {
      fail(err?.message || 'Could not start camera/microphone for this call.');
    }
  };

  useEffect(() => {
    initCall();
    return () => {
      cleanupMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedCallId, user?.id]);

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
      setIsVideoEnabled(!!localStream.getVideoTracks()[0]?.enabled);
    }
  };

  const endCall = () => {
    if (resolvedCallId) {
      api.put(`/calls/${resolvedCallId}`, { status: 'completed' }).catch(() => {});
    }
    cleanupMedia();
    router.back();
  };

  if (status === 'failed') {
    return (
      <SafeAreaView className="flex-1 bg-[#171A1C]" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-[#202A2D] border border-[#3A4B4D] items-center justify-center mb-5">
            <PhoneMissed size={32} color="#B87568" />
          </View>
          <Text className="text-[#D9D0B8] text-xl font-bold text-center">Call Failed to Connect</Text>
          <Text className="text-[#A8AAA0] text-sm text-center mt-2 leading-5">
            {failReason || 'WebRTC signaling failed. Check your connection and try again.'}
          </Text>

          <TouchableOpacity
            className="mt-8 flex-row items-center bg-[#D0A56A] px-6 py-3 rounded-xl active:opacity-90"
            onPress={initCall}
          >
            <RefreshCw size={16} color="#171A1C" />
            <Text className="text-[#171A1C] font-bold text-sm ml-2">Retry Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-3 flex-row items-center bg-[#202A2D] border border-[#3A4B4D] px-6 py-3 rounded-xl"
            onPress={endCall}
          >
            <PhoneOff size={16} color="#B87568" />
            <Text className="text-[#D9D0B8] font-semibold text-sm ml-2">Hang Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      ) : (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-[#D9D0B8] text-xl font-bold">Connecting...</Text>
          <Text className="text-[#A8AAA0] text-xs mt-2 text-center">
            Establishing a private peer-to-peer {callType} link
          </Text>
        </View>
      )}

      {localStream && isVideoEnabled && callType === 'video' && (
        <View className="absolute top-16 right-4 w-24 h-36 rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-900">
          <RTCView
            streamURL={localStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
            zOrder={1}
          />
        </View>
      )}

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

        {callType === 'video' && (
          <TouchableOpacity
            className={`w-14 h-14 rounded-full items-center justify-center ${!isVideoEnabled ? 'bg-red-500' : 'bg-slate-700/80'}`}
            onPress={toggleVideo}
          >
            {!isVideoEnabled ? <VideoOff color="white" /> : <Video color="white" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
