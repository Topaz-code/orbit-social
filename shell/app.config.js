// app.config.js — dynamic Expo config
// google-services.json is NEVER committed to git.
// On EAS Build it is injected via the GOOGLE_SERVICES_JSON secret file env var.
// Locally it can live at ./google-services.json (gitignored).

const IS_EAS = !!process.env.EAS_BUILD;
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || './google-services.json';

module.exports = {
  expo: {
    name: 'Orbit',
    slug: 'orbit',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'orbit',
    userInterfaceStyle: 'dark',
    backgroundColor: '#0f172a',
    newArchEnabled: false,
    assetBundlePatterns: ['**/*'],
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f172a',
    },
    androidStatusBar: {
      backgroundColor: '#0f172a',
      barStyle: 'light-content',
      translucent: false,
    },
    androidNavigationBar: {
      backgroundColor: '#0f172a',
      barStyle: 'light-content',
    },
    android: {
      package: 'com.orbit.app',
      versionCode: 1,
      allowBackup: false,
      softwareKeyboardLayoutMode: 'resize',
      googleServicesFile,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f172a',
      },
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
        'android.permission.USE_FULL_SCREEN_INTENT',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.BLUETOOTH_CONNECT',
        'com.google.android.c2dm.permission.RECEIVE',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'orbit-web-6z3b.onrender.com',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: [{ scheme: 'orbit' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#d4a24c',
          defaultChannel: 'orbit_messages',
          sounds: ['./assets/sounds/ringtone.wav'],
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Orbit uses your camera for video calls and to share photos.',
          microphonePermission: 'Orbit uses your microphone for voice and video calls.',
          recordAudioAndroid: true,
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Orbit uses your microphone for voice and video calls.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Orbit needs access to your photos so you can share them in chats.',
          cameraPermission: 'Orbit uses your camera to take photos for your posts and chats.',
        },
      ],
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 34,
            minSdkVersion: 24,
            buildToolsVersion: '35.0.0',
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            extraProguardRules:
              '-keep class com.reactnativecommunity.webview.** { *; }\n-keep class io.invertase.notifee.** { *; }\n-keep class app.notifee.** { *; }\n-keep class expo.modules.notifications.** { *; }\n-keep class expo.modules.taskManager.** { *; }',
          },
        },
      ],
      './plugins/withOrbitCallActivity',
    ],
    owner: 'emmy_rabs',
    extra: {
      eas: {
        projectId: '91a24fbb-a70e-4993-a47a-bfdeb2df7304',
      },
    },
  },
};
