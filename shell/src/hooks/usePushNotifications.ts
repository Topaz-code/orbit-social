import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { CALLS_CHANNEL_ID, DEFAULT_CHANNEL_ID } from '../config/constants';
import { THEME } from '../config/theme';
import { displayNotifeeIncomingCall, cancelNotifeeIncomingCall } from '../services/notifeeCalls';

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

  // Push notification listener (triggers Notifee full screen heads-up for calls)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (data) {
        if ((data.type === 'call' || data.type === 'incoming_call') && data.callId) {
          void displayNotifeeIncomingCall({
            callId: String(data.callId),
            callerId: String(data.callerId || ''),
            callerName: String(data.callerName || 'Orbit Friend'),
            callerAvatar: data.callerAvatar ? String(data.callerAvatar) : undefined,
            callType: (data.callType as 'voice' | 'video') || 'voice',
            conversationId: data.conversationId ? String(data.conversationId) : undefined,
          });
        } else if ((data.type === 'call_cancelled' || data.type === 'call-cancelled') && data.callId) {
          void cancelNotifeeIncomingCall(String(data.callId));
        }
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
