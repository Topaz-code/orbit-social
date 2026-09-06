const { withAndroidManifest, AndroidConfig } = require("@expo/config-plugins");



/**

 * Orbit config plugin.

 *

 * Android only launches a full-screen intent (incoming call UI) over the lock screen

 * and turns the display on when the target Activity opts in. Expo does not expose these

 * attributes in app.json, so we patch the generated AndroidManifest.xml here.

 *

 * - showWhenLocked  -> the call screen is rendered above the keyguard

 * - turnScreenOn    -> the display wakes when the call notification fires

 * - launchMode      -> singleTask so Accept/Decline re-uses the running WebView instead of stacking activities

 * - USE_FULL_SCREEN_INTENT permission (Android 14+ requires it to be declared explicitly)

 */

const withOrbitCallActivity = (config) =>

  withAndroidManifest(config, (mod) => {

    const manifest = mod.modResults;

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);



    mainActivity.$["android:showWhenLocked"] = "true";

    mainActivity.$["android:turnScreenOn"] = "true";

    mainActivity.$["android:launchMode"] = "singleTask";

    mainActivity.$["android:exported"] = "true";

    mainActivity.$["android:screenOrientation"] = "portrait";



    const requiredPermissions = [

      "android.permission.USE_FULL_SCREEN_INTENT",

      "android.permission.WAKE_LOCK",

      "android.permission.VIBRATE",

    ];



    manifest.manifest["uses-permission"] = manifest.manifest["uses-permission"] || [];

    for (const name of requiredPermissions) {

      const exists = manifest.manifest["uses-permission"].some((p) => p.$["android:name"] === name);

      if (!exists) {

        manifest.manifest["uses-permission"].push({ $: { "android:name": name } });

      }

    }



    // Hardware acceleration is required for smooth WebRTC video rendering inside the WebView.

    app.$["android:hardwareAccelerated"] = "true";

    app.$["android:usesCleartextTraffic"] = "false";



    return mod;

  });



module.exports = withOrbitCallActivity;
