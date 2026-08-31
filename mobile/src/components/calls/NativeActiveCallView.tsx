import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useCallStore } from '../../stores/callStore';

export const NativeActiveCallView: React.FC = () => {
  const { activeCall, localStream, remoteStream, endCall, toggleMute, toggleVideo } = useCallStore();

  // AppState Listener: Disable camera track when app is backgrounded to protect Android camera service
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const isBackground = nextAppState !== 'active';
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isBackground;
        }
      }
    });

    return () => subscription.remove();
  }, [localStream]);

  if (!activeCall) return null;

  return (
    <View style={styles.container}>
      {/* Remote Video Stream View */}
      {activeCall.type === 'video' && remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.voiceStage}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {activeCall.remoteUser?.display_name?.charAt(0)?.toUpperCase() || 'O'}
            </Text>
          </View>
          <Text style={styles.callerName}>{activeCall.remoteUser?.display_name || 'Orbit User'}</Text>
          <Text style={styles.callStatus}>
            {activeCall.status === 'connected' ? 'Call Active' : 'Calling...'}
          </Text>
        </View>
      )}

      {/* Local Video Stream Picture-in-Picture */}
      {activeCall.type === 'video' && localStream && !activeCall.isVideoOff && (
        <View style={styles.localVideoWrapper}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            zOrder={1}
          />
        </View>
      )}

      {/* Floating Action Controls Bar */}
      <View style={styles.controlsWrapper}>
        <View style={styles.buttonRow}>
          {/* Mute Audio Button */}
          <TouchableOpacity
            onPress={toggleMute}
            style={[styles.circleButton, activeCall.isMuted && styles.activeButton]}
          >
            <Text style={styles.buttonText}>{activeCall.isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* Toggle Camera Button (Video Calls) */}
          {activeCall.type === 'video' && (
            <TouchableOpacity
              onPress={toggleVideo}
              style={[styles.circleButton, activeCall.isVideoOff && styles.activeButton]}
            >
              <Text style={styles.buttonText}>{activeCall.isVideoOff ? 'Cam On' : 'Cam Off'}</Text>
            </TouchableOpacity>
          )}

          {/* End Call Button */}
          <TouchableOpacity
            onPress={() => endCall(activeCall.callId)}
            style={[styles.circleButton, styles.endButton]}
          >
            <Text style={[styles.buttonText, styles.endButtonText]}>End</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  voiceStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2B3940',
    borderWidth: 3,
    borderColor: '#D0A56A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#D9D0B8',
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D9D0B8',
  },
  callStatus: {
    fontSize: 14,
    color: '#D0A56A',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  localVideoWrapper: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 105,
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3A4B4D',
    elevation: 8,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  controlsWrapper: {
    position: 'absolute',
    bottom: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  circleButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#202A2D',
    borderWidth: 1,
    borderColor: '#3A4B4D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  activeButton: {
    backgroundColor: '#496D6B',
    borderColor: '#71877B',
  },
  endButton: {
    backgroundColor: '#B87568',
    borderColor: '#C98679',
  },
  buttonText: {
    color: '#D9D0B8',
    fontSize: 12,
    fontWeight: '600',
  },
  endButtonText: {
    color: '#171A1C',
    fontWeight: 'bold',
  },
});
