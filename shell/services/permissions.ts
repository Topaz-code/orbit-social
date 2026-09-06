import { Platform } from "react-native";
import { Camera } from "expo-camera";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as IntentLauncher from "expo-intent-launcher";
import notifee, { AndroidNotificationSetting } from "@notifee/react-native";
import Constants from "expo-constants";
import { STORAGE_KEYS } from "../constants/config";

export interface PermissionSnapshot {
  camera: boolean;
  microphone: boolean;
  mediaLibrary: boolean;
  notifications: boolean;
  /** Whether Android will launch our full-screen incoming-call notification (Android 14+ policy). */
  fullScreenIntent: boolean;
}

/**
 * Requests every hardware permission the WebView will need up-front, sequentially.
 * Android drops overlapping permission dialogs, so these must never run in parallel.
 *
 * Once CAMERA and RECORD_AUDIO are granted at the OS level, react-native-webview's
 * native WebChromeClient automatically grants WebRTC `onPermissionRequest` calls from
 * the page, which is what makes getUserMedia() work for voice/video calls.
 */
export async function requestCorePermissions(): Promise<PermissionSnapshot> {
  const camera = await Camera.requestCameraPermissionsAsync();
  const microphone = await Audio.requestPermissionsAsync();
  const mediaLibrary = await ImagePicker.requestMediaLibraryPermissionsAsync();
  const notifications = await Notifications.requestPermissionsAsync({
    android: {},
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  const snapshot: PermissionSnapshot = {
    camera: camera.status === "granted",
    microphone: microphone.status === "granted",
    mediaLibrary: mediaLibrary.status === "granted",
    notifications: notifications.status === "granted",
    fullScreenIntent: await canUseFullScreenIntent(),
  };

  await SecureStore.setItemAsync(STORAGE_KEYS.PERMISSIONS_PROMPTED, JSON.stringify(snapshot));
  return snapshot;
}

/**
 * Android 14 (API 34) only grants USE_FULL_SCREEN_INTENT by default to calling/alarm
 * apps — and Play Store review can revoke it for other categories. Notifee exposes the
 * effective state so the shell can prompt the user to re-enable it in system settings.
 */
export async function canUseFullScreenIntent(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const settings = await notifee.getNotificationSettings();
    return (settings.android as any).fullScreenIntent === AndroidNotificationSetting.ENABLED;
  } catch {
    return true;
  }
}

export async function getPermissionSnapshot(): Promise<PermissionSnapshot> {
  const [camera, microphone, mediaLibrary, notifications, fullScreenIntent] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    Audio.getPermissionsAsync(),
    ImagePicker.getMediaLibraryPermissionsAsync(),
    Notifications.getPermissionsAsync(),

    canUseFullScreenIntent(),

  ]);

  return {

    camera: camera.status === "granted",

    microphone: microphone.status === "granted",

    mediaLibrary: mediaLibrary.status === "granted",

    notifications: notifications.status === "granted",

    fullScreenIntent,

  };

}



/**

 * Configures the Android audio session for two-way communication so the WebView's

 * WebRTC audio uses the voice-call route (earpiece/speaker/bluetooth) and keeps

 * playing when the screen turns off mid-call.

 */

export async function configureCallAudioSession(): Promise<void> {

  await Audio.setAudioModeAsync({

    allowsRecordingIOS: true,

    playsInSilentModeIOS: true,

    staysActiveInBackground: true,

    shouldDuckAndroid: false,

    playThroughEarpieceAndroid: false,

    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,

    interruptionModeIOS: InterruptionModeIOS.DoNotMix,

  });

}



/**

 * Android 14+ only grants USE_FULL_SCREEN_INTENT automatically to apps whose primary

 * purpose is calling/alarms when installed from the Play Store. Sideloaded builds and

 * dev clients get it by default. This opens the system screen so the user can enable

 * "Full screen notifications" if the OS revoked it.

 */

export async function openFullScreenIntentSettings(): Promise<void> {

  if (Platform.OS !== "android") return;

  const packageName = Constants.expoConfig?.android?.package ?? "com.orbit.app";

  if (Number(Platform.Version) >= 34) {

    await IntentLauncher.startActivityAsync("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT", {

      data: `package:${packageName}`,

    });

    return;

  }

  await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS, {

    extra: { "android.provider.extra.APP_PACKAGE": packageName },

  });

}



/**

 * Opens the battery optimisation screen. Orbit does NOT run a background service (FCM

 * wakes the app instead), but aggressive OEM battery managers (Xiaomi, Huawei, Samsung

 * "sleeping apps") can delay high-priority pushes. Users can whitelist Orbit here.

 */

export async function openBatteryOptimisationSettings(): Promise<void> {

  if (Platform.OS !== "android") return;

  await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);

}
