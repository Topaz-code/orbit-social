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



registerRootComponent(App);
