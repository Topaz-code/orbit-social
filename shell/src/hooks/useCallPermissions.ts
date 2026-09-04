import { useCallback, useRef } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { FULL_SCREEN_FLAG, NOTIF_PROMPT_FLAG } from '../config/constants';

export function useCallPermissions() {
  const notifPromptedRef = useRef(false);

  // Restore the persisted notification-prompt flag
  const initPromptFlag = useCallback(async () => {
    try {
      const value = await SecureStore.getItemAsync(NOTIF_PROMPT_FLAG);
      notifPromptedRef.current = value === '1';
    } catch {}
  }, []);

  const ensureNotificationPermission = useCallback(async () => {
    if (notifPromptedRef.current) return;
    notifPromptedRef.current = true;
    try {
      const current = await Notifications.getPermissionsAsync();
      if (!current.granted && current.canAskAgain) {
        await Notifications.requestPermissionsAsync();
      }
      await SecureStore.setItemAsync(NOTIF_PROMPT_FLAG, '1');
    } catch {
      // Non-fatal
    }
  }, []);

  /**
   * Android 14+ gates the full-screen intent (wake screen + expand incoming call over lock screen)
   */
  const ensureFullScreenIntent = useCallback(async () => {
    if (Platform.OS !== 'android' || Platform.Version < 34) return;
    try {
      const granted = await PermissionsAndroid.check(
        'android.permission.USE_FULL_SCREEN_INTENT' as any,
      );
      if (granted) return;
      const prompted = await SecureStore.getItemAsync(FULL_SCREEN_FLAG);
      if (prompted === '1') return;
      await SecureStore.setItemAsync(FULL_SCREEN_FLAG, '1');
      Alert.alert(
        'Wake Screen for Incoming Calls',
        'To allow incoming Orbit calls to light up your screen and ring like a phone call, please allow "Full-screen notifications" in Android settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => void Linking.openSettings() },
        ],
      );
    } catch {}
  }, []);

  /**
   * Pre-grants Camera and Microphone runtime permissions and configures high-priority audio mode.
   */
  const ensureCallPermissions = useCallback(async () => {
    try {
      const [audioStatus, cameraStatus] = await Promise.all([
        Audio.requestPermissionsAsync(),
        Camera.requestCameraPermissionsAsync(),
      ]);

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
      });

      return audioStatus.granted && cameraStatus.granted;
    } catch (err) {
      console.warn('[CallPermissions] Pre-grant notice:', err);
      return false;
    }
  }, []);

  return {
    initPromptFlag,
    ensureNotificationPermission,
    ensureFullScreenIntent,
    ensureCallPermissions,
  };
}
