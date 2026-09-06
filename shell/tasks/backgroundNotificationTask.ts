import * as TaskManager from "expo-task-manager";

import * as Notifications from "expo-notifications";

import { BACKGROUND_NOTIFICATION_TASK } from "../constants/config";

import { cancelIncomingCall, parseIncomingCall, showIncomingCall } from "../services/calls";



/**

 * Headless task executed by expo-task-manager when a *data-only* FCM message arrives and the

 * app is in the background or fully killed. The OS wakes the process for a few seconds — long

 * enough to post the full-screen call notification — and then lets it sleep again. No

 * persistent service, no polling, effectively zero battery cost while idle.

 *

 * Backend contract (FCM HTTP v1):

 * {

 *   "message": {

 *     "token": "<device fcm token>",

 *     "android": { "priority": "HIGH", "ttl": "45s" },

 *     "data": {

 *       "type": "incoming_call",

 *       "callId": "c_123",

 *       "callerName": "Ada Lovelace",

 *       "callerAvatar": "https://.../ada.png",

 *       "isVideo": "true",

 *       "url": "/calls/c_123",

 *       "declineUrl": "/api/calls/c_123/decline",

 *       "startedAt": "1730000000000"

 *     }

 *   }

 * }

 */

type BackgroundTaskData = {

  notification?: Notifications.Notification & { data?: Record<string, unknown> };

  data?: Record<string, unknown>;

  actionIdentifier?: string;

};



TaskManager.defineTask<BackgroundTaskData>(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {

  if (error) {

    console.warn("[Orbit] background notification task error", error);

    return;

  }

  if (!data) return;



  const payload: Record<string, unknown> | undefined =

    data.notification?.request?.content?.data ??

    (data.notification as { data?: Record<string, unknown> } | undefined)?.data ??

    data.data;



  if (payload?.type === "call_cancelled" || payload?.type === "call-cancelled") {
    await cancelIncomingCall();
    return;
  }

  const call = parseIncomingCall(payload);

  if (!call) return;

  await showIncomingCall(call);

});
