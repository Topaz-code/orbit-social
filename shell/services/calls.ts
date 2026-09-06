import { Platform } from "react-native";
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  type EventDetail,
} from "@notifee/react-native";

import * as SecureStore from "expo-secure-store";

import { CALL_NOTIFICATION_ID, CALL_RING_TIMEOUT_MS, CHANNELS, COLORS, ORBIT_URL, SERVICE_NOTIFICATION_ID, STORAGE_KEYS } from "../constants/config";

import { buildDeclineProof } from "./deviceIdentity";



export interface IncomingCall {
  callId: string;
  callerId?: string;
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  /** Absolute or relative URL the WebView should open to join the call. */
  url: string;
  /** Optional absolute or relative URL the shell will POST to when the user declines from the lock screen. */
  declineUrl?: string;
  /** Epoch millis when the call was placed; used to drop stale pushes. */
  startedAt: number;
  livekitToken?: string;
  livekitUrl?: string;
}

export type CallAction = "accept" | "decline" | "timeout";
type CallActionListener = (action: CallAction, call: IncomingCall) => void;

let foregroundListener: CallActionListener | null = null;

export function setCallActionListener(listener: CallActionListener | null): void {
  foregroundListener = listener;
}

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url.replace(/^\//, ""), ORBIT_URL).toString();
}

/**
 * Normalises whatever the backend/web app sends into a strict IncomingCall.
 * Accepts both the FCM data payload shape and the postMessage shape from the web bridge.
 */
export function parseIncomingCall(raw: Record<string, unknown> | undefined | null): IncomingCall | null {
  if (!raw) return null;

  const type = String(raw.type ?? raw.kind ?? "").toLowerCase();
  if (type !== "incoming_call" && type !== "incoming-call" && type !== "call") return null;

  const callId = String(raw.callId ?? raw.call_id ?? raw.roomId ?? raw.id ?? "");
  if (!callId) return null;

  const callerId = String(raw.callerId ?? raw.caller_id ?? raw.fromId ?? raw.from ?? "");

  const startedAt = Number(raw.startedAt ?? raw.timestamp ?? Date.now());
  const url = String(raw.url ?? raw.callUrl ?? `${ORBIT_URL}?incomingCall=${encodeURIComponent(callId)}`);
  const livekitToken = typeof raw.livekitToken === "string" && raw.livekitToken.length > 0 ? raw.livekitToken : undefined;
  const livekitUrl = typeof raw.livekitUrl === "string" && raw.livekitUrl.length > 0 ? raw.livekitUrl : undefined;

  return {
    callId,
    callerId: callerId.length > 0 ? callerId : undefined,
    callerName: String(raw.callerName ?? raw.caller ?? "Orbit user"),
    callerAvatar: typeof raw.callerAvatar === "string" && raw.callerAvatar.length > 0 ? raw.callerAvatar : undefined,
    isVideo: raw.isVideo === true || raw.isVideo === "true" || String(raw.callType ?? "") === "video",
    url: toAbsoluteUrl(url),
    declineUrl:
      typeof raw.declineUrl === "string" && raw.declineUrl.length > 0 ? toAbsoluteUrl(raw.declineUrl) : undefined,
    startedAt: Number.isFinite(startedAt) ? startedAt : Date.now(),
    livekitToken,
    livekitUrl,
  };
}



export function isCallStale(call: IncomingCall): boolean {

  return Date.now() - call.startedAt > CALL_RING_TIMEOUT_MS;

}



export async function ensureNotificationChannels(): Promise<void> {

  await notifee.createChannel({

    id: CHANNELS.CALLS,

    name: "Incoming calls",

    description: "Rings for voice and video calls, even when your phone is locked.",

    importance: AndroidImportance.HIGH,

    visibility: AndroidVisibility.PUBLIC,

    sound: "ringtone",

    vibration: true,

    vibrationPattern: [400, 800, 400, 800],

    bypassDnd: true,

    lights: true,

    lightColor: COLORS.gold,

    badge: false,

  });



  await notifee.createChannel({

    id: CHANNELS.MESSAGES,

    name: "Messages & activity",

    description: "Direct messages, mentions, and orbit activity.",

    importance: AndroidImportance.HIGH,

    visibility: AndroidVisibility.PRIVATE,

    sound: "default",
    vibration: true,
    lights: true,
    lightColor: COLORS.gold,
    badge: true,
  });

  await notifee.createChannel({
    id: CHANNELS.SERVICE,
    name: "Orbit Background Connection",
    description: "Keeps Orbit connected in the background to receive calls and messages instantly.",
    importance: AndroidImportance.MIN,
    visibility: AndroidVisibility.SECRET,
    lights: false,
    vibration: false,
    badge: false,
  });
}

/**
 * Starts a persistent low-priority Android Foreground Service.
 * This instructs the Linux kernel to assign com.orbit.app foreground priority,
 * preventing OEM task managers (Xiaomi, Samsung, HiOS) from killing the app process
 * when the user navigates away or turns off the screen (the F-Droid/Rythm/OkHi pattern).
 */
export async function startPersistentBackgroundService(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await ensureNotificationChannels();

    const displayed = await notifee.getDisplayedNotifications();
    const alreadyRunning = displayed.some((n) => n.id === SERVICE_NOTIFICATION_ID);
    if (alreadyRunning) return;

    await notifee.displayNotification({
      id: SERVICE_NOTIFICATION_ID,
      title: "Orbit",
      body: "Connected in background for instant calls & messages",
      android: {
        channelId: CHANNELS.SERVICE,
        asForegroundService: true,
        ongoing: true,
        autoCancel: false,
        smallIcon: "notification_icon",
        color: COLORS.gold,
        importance: AndroidImportance.MIN,
        visibility: AndroidVisibility.SECRET,
        pressAction: {
          id: "default",
          launchActivity: "default",
        },
      },
    });
    console.log("[Orbit] Persistent background foreground service active");
  } catch (error) {
    console.warn("[Orbit] Failed to start persistent background service:", error);
  }
}



/**

 * Displays the lock-screen-waking incoming call notification.

 *

 * - `fullScreenAction` + `category: CALL` -> Android launches MainActivity over the keyguard

 *   (MainActivity has showWhenLocked/turnScreenOn via the config plugin).

 * - `ongoing` + `autoCancel: false` -> it cannot be swiped away while ringing.

 * - `loopSound` + custom ringtone -> rings like a phone call, respecting the user's ringer.

 * - `timeoutAfter` -> auto-dismisses as a missed call.

 */

export async function showIncomingCall(call: IncomingCall): Promise<void> {

  if (isCallStale(call)) return;

  await ensureNotificationChannels();

  await SecureStore.setItemAsync(STORAGE_KEYS.LAST_CALL, JSON.stringify(call));



  const remainingMs = Math.max(5_000, CALL_RING_TIMEOUT_MS - (Date.now() - call.startedAt));



  await notifee.displayNotification({

    id: CALL_NOTIFICATION_ID,

    title: `${call.isVideo ? "Video" : "Voice"} call`,

    body: `${call.callerName} is calling you on Orbit`,

    data: {
      type: "incoming_call",
      callId: call.callId,
      callerId: call.callerId ?? "",
      callerName: call.callerName,
      callerAvatar: call.callerAvatar ?? "",
      isVideo: call.isVideo ? "true" : "false",
      url: call.url,
      declineUrl: call.declineUrl ?? "",
      startedAt: call.startedAt,
      livekitToken: call.livekitToken ?? "",
      livekitUrl: call.livekitUrl ?? "",
    },

    android: {

      channelId: CHANNELS.CALLS,

      category: AndroidCategory.CALL,

      importance: AndroidImportance.HIGH,

      visibility: AndroidVisibility.PUBLIC,

      smallIcon: "notification_icon",

      color: COLORS.gold,

      colorized: true,

      largeIcon: call.callerAvatar,

      circularLargeIcon: true,

      ongoing: true,

      autoCancel: false,

      onlyAlertOnce: false,

      loopSound: true,

      sound: "ringtone",

      vibrationPattern: [400, 800, 400, 800],

      lightUpScreen: true,

      showTimestamp: true,

      timestamp: call.startedAt,

      timeoutAfter: remainingMs,

      fullScreenAction: {

        id: "accept",

        launchActivity: "default",

      },

      pressAction: {

        id: "accept",

        launchActivity: "default",

      },

      actions: [

        {

          title: "<b><font color=\"#22c55e\">Accept</font></b>",

          pressAction: { id: "accept", launchActivity: "default" },

        },

        {

          title: "<b><font color=\"#ef4444\">Decline</font></b>",

          pressAction: { id: "decline" },

        },

      ],

    },

  });

}



export async function cancelIncomingCall(): Promise<void> {
  await notifee.cancelNotification(CALL_NOTIFICATION_ID);
}



/**

 * Headless-safe decline notification.

 *

 * A headless React Native fetch does not share the WebView cookie jar, so cookie-based

 * session auth is unavailable here. Instead we send the device identity + HMAC proof

 * (see services/deviceIdentity.ts), both as query params (works with simple GET/POST

 * endpoints) and as JSON body + headers. The backend should accept any of these forms.

 */

export async function notifyBackendOfDecline(call: IncomingCall): Promise<void> {

  const declineUrl = call.declineUrl || `https://orbit-api-m5ah.onrender.com/api/calls/${call.callId}/decline`;

  try {

    const proof = await buildDeclineProof(call.callId);

    const connector = declineUrl.includes("?") ? "&" : "?";

    const url =

      `${declineUrl}${connector}` +

      `callId=${encodeURIComponent(call.callId)}` +

      `&deviceHash=${encodeURIComponent(proof.deviceHash)}` +

      `&ts=${proof.ts}` +

      `&proof=${encodeURIComponent(proof.proof)}`;



    await fetch(url, {

      method: "POST",

      credentials: "omit",

      headers: {

        "Content-Type": "application/json",

        "X-Orbit-Device-Hash": proof.deviceHash,

        "X-Orbit-Decline-Proof": proof.proof,

        "X-Orbit-Decline-Ts": String(proof.ts),

      },

      body: JSON.stringify({

        callId: call.callId,

        reason: "declined_from_notification",

        deviceHash: proof.deviceHash,

        ts: proof.ts,

        proof: proof.proof,

      }),

    });

  } catch {

    // Backend unreachable — the call will time out server-side; nothing else to do offline.

  }

}



/** Stores a route so that a freshly-launched App can navigate the WebView straight into the call. */

export async function setPendingRoute(url: string): Promise<void> {

  await SecureStore.setItemAsync(STORAGE_KEYS.PENDING_ROUTE, url);

}



export async function consumePendingRoute(): Promise<string | null> {

  const route = await SecureStore.getItemAsync(STORAGE_KEYS.PENDING_ROUTE);

  if (route) await SecureStore.deleteItemAsync(STORAGE_KEYS.PENDING_ROUTE);

  return route;

}



/**

 * Shared handler for Notifee foreground + background events.

 * In the background (app killed) there is no React tree, so we persist the intent and let App.tsx

 * pick it up on launch. In the foreground we hand it to the live listener immediately.

 */

export async function handleCallNotificationEvent(type: EventType, detail: EventDetail): Promise<void> {

  const notification = detail.notification;

  if (!notification || notification.id !== CALL_NOTIFICATION_ID) return;



  const call = parseIncomingCall(notification.data as Record<string, unknown>);

  if (!call) return;



  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {

    const actionId = type === EventType.PRESS ? "accept" : detail.pressAction?.id ?? "accept";



    if (actionId === "decline") {

      await cancelIncomingCall();

      await notifyBackendOfDecline(call);

      foregroundListener?.("decline", call);

      return;

    }



    const connector = call.url.includes("?") ? "&" : "?";
    const lkParams = call.livekitToken && call.livekitUrl
      ? `&livekitToken=${encodeURIComponent(call.livekitToken)}&livekitUrl=${encodeURIComponent(call.livekitUrl)}`
      : "";
    const acceptUrl = `${call.url}${connector}action=accept&native=1${call.callerId ? `&callerId=${encodeURIComponent(call.callerId)}` : ""}&callerName=${encodeURIComponent(call.callerName)}${call.callerAvatar ? `&callerAvatar=${encodeURIComponent(call.callerAvatar)}` : ""}&callId=${encodeURIComponent(call.callId)}&callType=${call.isVideo ? "video" : "voice"}${lkParams}`;

    await setPendingRoute(acceptUrl);

    await cancelIncomingCall();

    foregroundListener?.("accept", call);

    return;

  }



  if (type === EventType.DISMISSED && isCallStale(call)) {

    foregroundListener?.("timeout", call);

  }

}



export async function handleCallTimeout(): Promise<void> {

  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_CALL);

  if (!raw) return;

  const call = parseIncomingCall({ ...(JSON.parse(raw) as Record<string, unknown>), type: "incoming_call" });

  if (call && isCallStale(call)) {

    await cancelIncomingCall();

    foregroundListener?.("timeout", call);

  }

}
