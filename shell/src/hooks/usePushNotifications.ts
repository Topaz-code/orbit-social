import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { CALLS_CHANNEL_ID, DEFAULT_CHANNEL_ID } from '../config/constants';
import { THEME } from '../config/theme';

interface PushNotificationsOptions {
  onTokenReady: (token: string) => void;
  onForegroundPush: (data: Record<string, unknown>) => void;
}

export function usePushNotifications({
  onTokenReady,
  onForegroundPush,
}: PushNotificationsOptions) {
  const fcmTokenRef = useRef<string | null>(null);

  const registerPushToken = useCallback(async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('[PushNotifications] Notification permission not granted');
      }

      const deviceToken = await Notifications.getDevicePushTokenAsync();
      fcmTokenRef.current = deviceToken.data;
      console.log('[PushNotifications] FCM device token acquired:', deviceToken.data);
      onTokenReady(deviceToken.data);
    } catch (error) {
      console.warn('[PushNotifications] FCM token unavailable (non-fatal):', error);
    }
  }, [onTokenReady]);

  // Setup Android notification channels
  useEffect(() => {
    void (async () => {
      try {
        // MAX importance = heads-up banner + sound + vibration for incoming calls
        await Notifications.setNotificationChannelAsync(CALLS_CHANNEL_ID, {
          name: 'Incoming calls',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: THEME.colors.gold,
          sound: 'default',
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          showBadge: true,
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
          },
        });

        // High importance for standard messages & notifications
        await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
          name: 'Orbit notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: THEME.colors.gold,
          sound: 'default',
        });
      } catch (err) {
        console.warn('[PushNotifications] Channel setup error:', err);
      }

      void registerPushToken();
    })();
  }, [registerPushToken]);

  // FCM token rotation listener
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(({ data }) => {
      fcmTokenRef.current = data;
      onTokenReady(data);
    });
    return () => subscription.remove();
  }, [onTokenReady]);

  // Foreground push notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (data) {
        onForegroundPush(data);
      }
    });
    return () => subscription.remove();
  }, [onForegroundPush]);

  return {
    fcmTokenRef,
    registerPushToken,
  };
}
