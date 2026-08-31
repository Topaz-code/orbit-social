import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { api } from './api';

export async function setupNotificationChannels(): Promise<void> {
  // Direct & Group Messages Channel
  await notifee.createChannel({
    id: 'messages',
    name: 'Direct & Group Messages',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  // Voice & Video Calls Channel (High Priority with Call Category)
  await notifee.createChannel({
    id: 'calls',
    name: 'Voice & Video Calls',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function registerDeviceToken(): Promise<string | null> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('[FCM] Notification permissions were not granted');
      return null;
    }

    const token = await messaging().getToken();
    if (token) {
      await api.post('/device/token', { token, platform: 'android' }).catch((err) => {
        console.warn('[FCM] Initial token sync warning:', err.message);
      });
    }

    // Proactive token rotation listener
    messaging().onTokenRefresh(async (newToken) => {
      console.log('[FCM] Device Token Refreshed:', newToken);
      await api.post('/device/token', { token: newToken, platform: 'android' }).catch(() => {});
    });

    return token;
  } catch (err) {
    console.error('[FCM] Token Registration Error:', err);
    return null;
  }
}
