import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert, Linking } from 'react-native';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status === 'granted') return true;
  showPermissionDeniedAlert('Camera', 'Orbit needs camera access for stories, profile photos, and video calls.');
  return false;
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  if (status === 'granted') return true;
  showPermissionDeniedAlert('Microphone', 'Orbit needs microphone access for voice notes and calls.');
  return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') return true;
    showPermissionDeniedAlert('Notifications', 'Orbit needs notification permission to alert you about messages and calls.');
    return false;
  }
  return true;
}

export async function requestCallPermissions(type: 'voice' | 'video'): Promise<boolean> {
  const micGranted = await requestMicrophonePermission();
  if (!micGranted) return false;
  if (type === 'video') {
    const camGranted = await requestCameraPermission();
    if (!camGranted) return false;
  }
  return true;
}

function showPermissionDeniedAlert(permission: string, message: string) {
  Alert.alert(
    `${permission} Permission Required`,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() }
    ]
  );
}
