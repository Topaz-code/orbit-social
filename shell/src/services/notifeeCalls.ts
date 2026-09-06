import notifee, {
  AndroidCategory,
  AndroidImportance,
  EventType,
  Event,
} from '@notifee/react-native';
import { CALLS_CHANNEL_ID } from '../config/constants';
import { THEME } from '../config/theme';

export interface IncomingCallPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
  conversationId?: string;
}

/**
 * Configure Notifee Android Notification Channel for High-Priority Incoming Calls.
 */
export async function setupNotifeeCallChannel(): Promise<string> {
  return await notifee.createChannel({
    id: CALLS_CHANNEL_ID,
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [0, 600, 300, 600],
    lights: true,
    lightColor: THEME.colors.gold,
    bypassDnd: true,
  });
}

/**
 * Display a Heads-Up & Full-Screen Incoming Call Notification on Android.
 * Turns on the screen when locked and presents Accept/Decline action buttons.
 */
export async function displayNotifeeIncomingCall(
  payload: IncomingCallPayload,
): Promise<string> {
  const channelId = await setupNotifeeCallChannel();

  return await notifee.displayNotification({
    id: payload.callId,
    title: `Incoming ${payload.callType === 'video' ? 'Video' : 'Voice'} Call`,
    body: `${payload.callerName} is calling you...`,
    data: {
      type: 'call',
      callId: String(payload.callId),
      callerId: String(payload.callerId),
      callerName: String(payload.callerName),
      callerAvatar: String(payload.callerAvatar || ''),
      callType: String(payload.callType),
      conversationId: String(payload.conversationId || ''),
    },
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      color: THEME.colors.gold,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      fullScreenAction: {
        id: 'default',
        launchActivity: 'default',
      },
      actions: [
        {
          title: 'Decline',
          pressAction: {
            id: 'decline',
          },
        },
        {
          title: 'Accept',
          pressAction: {
            id: 'accept',
            launchActivity: 'default',
          },
        },
      ],
    },
  });
}

/**
 * Dismiss and cancel the active incoming call notification remotely.
 */
export async function cancelNotifeeIncomingCall(callId: string): Promise<void> {
  try {
    await notifee.cancelNotification(callId);
  } catch (err) {
    console.warn('[Notifee] Could not cancel notification:', err);
  }
}

/**
 * Background Event Handler for Notifee Action Buttons (Accept / Decline).
 */
export async function handleNotifeeBackgroundEvent({ type, detail }: Event): Promise<void> {
  if (type === EventType.ACTION_PRESS) {
    const callId = detail.notification?.data?.callId as string | undefined;
    if (!callId) return;

    if (detail.pressAction?.id === 'decline') {
      console.log('[Notifee] Decline pressed on lockscreen for call:', callId);
      await notifee.cancelNotification(callId);

      // Notify backend directly from background
      try {
        await fetch(`https://orbit-social.onrender.com/api/calls/${callId}/decline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.warn('[Notifee] Background decline network notice:', err);
      }
    } else if (detail.pressAction?.id === 'accept') {
      console.log('[Notifee] Accept pressed on lockscreen for call:', callId);
      await notifee.cancelNotification(callId);
    }
  }
}
