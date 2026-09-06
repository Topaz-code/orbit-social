import { registerRootComponent } from "expo";

import notifee from "@notifee/react-native";



import "./tasks/backgroundNotificationTask";

import { handleCallNotificationEvent } from "./services/calls";

import App from "./App";



/**

 * Must be registered at module scope (outside React) so Accept / Decline taps on the

 * lock-screen call notification are handled even when the app process was killed.

 */

notifee.onBackgroundEvent(async ({ type, detail }) => {
  await handleCallNotificationEvent(type, detail);
});

/**
 * Keeps the foreground service running indefinitely in the background so the Linux kernel
 * treats com.orbit.app as an active foreground service (F-Droid / Rythm / OkHi pattern).
 */
notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Keep alive permanently while app process lives
  });
});



registerRootComponent(App);
