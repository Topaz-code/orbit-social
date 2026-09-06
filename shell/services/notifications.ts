import { AppState, Platform } from "react-native";

import * as Notifications from "expo-notifications";

import * as TaskManager from "expo-task-manager";

import * as Device from "expo-device";

import * as SecureStore from "expo-secure-store";

import Constants from "expo-constants";

import notifee from "@notifee/react-native";

import { BACKGROUND_NOTIFICATION_TASK, ORBIT_URL, STORAGE_KEYS } from "../constants/config";

import { cancelIncomingCall, consumePendingRoute, parseIncomingCall, showIncomingCall, type IncomingCall } from "./calls";



import { canUseFullScreenIntent } from "./permissions";

import { getDeviceIdentity } from "./deviceIdentity";



export interface PushTokens {

  fcmToken: string | null;

  expoPushToken: string | null;

  /** SHA-256 of the device secret — the cookieless identity the backend stores with the push token. */

  deviceHash: string | null;

  /** Whether Android currently allows our full-screen incoming-call notification. */

  canUseFullScreenIntent: boolean;

}



/**

 * Foreground presentation policy.

 * Incoming-call pushes are never shown by expo-notifications itself: when the app is

 * active the web app rings on its own, and when it is not, the Notifee full-screen

 * notification takes over (see App.tsx `addNotificationReceivedListener`).

 */

Notifications.setNotificationHandler({

  handleNotification: async (notification) => {

    const call = parseIncomingCall(notification.request.content.data as Record<string, unknown>);

    const isCall = call !== null;

    const isActive = AppState.currentState === "active";

    return {

      shouldShowAlert: !isCall && !isActive,

      shouldPlaySound: !isCall && !isActive,

      shouldSetBadge: !isCall,

    };

  },

});



export async function registerBackgroundNotificationTask(): Promise<void> {

  if (Platform.OS !== "android") return;

  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);

  if (!registered) {

    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

  }

}



/**

 * Obtains the native FCM registration token (what the Orbit backend must target with

 * high-priority data messages) and, when an EAS projectId is configured, the Expo push

 * token as a convenience for Expo's push service.

 */

export async function registerForPush(): Promise<PushTokens> {

  const identity = await getDeviceIdentity().catch(() => null);

  const fsi = await canUseFullScreenIntent();

  const result: PushTokens = {

    fcmToken: null,

    expoPushToken: null,

    deviceHash: identity?.hash ?? null,

    canUseFullScreenIntent: fsi,

  };

  if (!Device.isDevice) return result;



  const permission = await Notifications.getPermissionsAsync();

  if (permission.status !== "granted") return result;



  try {

    const deviceToken = await Notifications.getDevicePushTokenAsync();

    result.fcmToken = typeof deviceToken.data === "string" ? deviceToken.data : JSON.stringify(deviceToken.data);

    await SecureStore.setItemAsync(STORAGE_KEYS.PUSH_TOKEN, result.fcmToken);

  } catch (error) {

    console.warn("[Orbit] Unable to obtain FCM token — is google-services.json present?", error);

  }



  const projectId: string | undefined =

    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;



  if (projectId) {

    try {

      const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });

      result.expoPushToken = expoToken.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.EXPO_PUSH_TOKEN, expoToken.data);

    } catch (error) {

      console.warn("[Orbit] Unable to obtain Expo push token", error);

    }

  }



  return result;

}



export async function getCachedPushTokens(): Promise<PushTokens> {

  const [fcmToken, expoPushToken, identity, fsi] = await Promise.all([

    SecureStore.getItemAsync(STORAGE_KEYS.PUSH_TOKEN),

    SecureStore.getItemAsync(STORAGE_KEYS.EXPO_PUSH_TOKEN),

    getDeviceIdentity().catch(() => null),

    canUseFullScreenIntent(),

  ]);

  return {

    fcmToken,

    expoPushToken,

    deviceHash: identity?.hash ?? null,

    canUseFullScreenIntent: fsi,

  };

}



function extractUrl(data: Record<string, unknown> | undefined | null): string | null {

  if (!data) return null;

  const candidate = data.url ?? data.link ?? data.deepLink ?? data.path;

  if (typeof candidate !== "string" || candidate.length === 0) return null;

  if (/^https?:\/\//i.test(candidate)) return candidate;

  return new URL(candidate.replace(/^\//, ""), ORBIT_URL).toString();

}



export function buildCallAcceptUrl(call: IncomingCall): string {
  const connector = call.url.includes("?") ? "&" : "?";
  const lkParams = call.livekitToken && call.livekitUrl
    ? `&livekitToken=${encodeURIComponent(call.livekitToken)}&livekitUrl=${encodeURIComponent(call.livekitUrl)}`
    : "";
  return `${call.url}${connector}action=accept&native=1${call.callerId ? `&callerId=${encodeURIComponent(call.callerId)}` : ""}&callerName=${encodeURIComponent(call.callerName)}${call.callerAvatar ? `&callerAvatar=${encodeURIComponent(call.callerAvatar)}` : ""}&callId=${encodeURIComponent(call.callId)}&callType=${call.isVideo ? "video" : "voice"}${lkParams}`;
}

/** Maps a tapped (non-call) notification to the URL the WebView should open. */
export function routeFromNotificationResponse(response: Notifications.NotificationResponse | null): string | null {
  if (!response) return null;

  const data = response.notification.request.content.data as Record<string, unknown>;
  const call = parseIncomingCall(data);
  if (call) return buildCallAcceptUrl(call);

  return extractUrl(data);
}

/**
 * Resolves where the app should navigate on cold launch, checking (in priority order):
 * 1. A route persisted by the Notifee background handler (Accept from the lock screen).
 * 2. The Notifee notification that launched the activity via full-screen intent.
 * 3. The last expo-notifications response (message push tap).
 */
export async function resolveLaunchRoute(): Promise<string | null> {
  const pending = await consumePendingRoute();
  if (pending) return pending;

  const initial = await notifee.getInitialNotification();
  if (initial?.notification?.data) {
    const call = parseIncomingCall(initial.notification.data as Record<string, unknown>);
    if (call) {
      const declined = initial.pressAction?.id === "decline";
      if (!declined) return buildCallAcceptUrl(call);
    }
    const url = extractUrl(initial.notification.data as Record<string, unknown>);
    if (url) return url;
  }

  const lastResponse = await Notifications.getLastNotificationResponseAsync();
  return routeFromNotificationResponse(lastResponse);
}



/**

 * Called for pushes that arrive while the JS runtime is alive (foreground or warm background).

 * If the app is not on screen we escalate calls to the full-screen ringing notification.

 */

export async function handleForegroundPush(notification: Notifications.Notification): Promise<void> {
  const data = notification.request.content.data as Record<string, unknown>;

  if (data?.type === "call_cancelled" || data?.type === "call-cancelled") {
    await cancelIncomingCall();
    return;
  }

  const call = parseIncomingCall(data);
  if (!call) return;
  if (AppState.currentState === "active") return;
  await showIncomingCall(call);
}
