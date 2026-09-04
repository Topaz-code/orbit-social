# Orbit — Android WebView Shell

A lightweight, production-grade Android shell that embeds the Orbit web app
(https://orbit-web-6z3b.onrender.com/) and layers native Android capabilities on
top of it: automatic hardware permissions, an animated cold-start splash, an
offline screen, pull-to-refresh, and deep-linking for calls and push
notifications.

**Stack:** React Native · Expo SDK 52 · `react-native-webview` 13 · NetInfo ·
Reanimated 3 · `expo-linear-gradient` · `expo-secure-store` · `expo-camera` ·
`expo-av` · `expo-notifications`.

---

## Project layout

```
orbit-shell/
├── App.tsx                      # Entry point: WebView + NetInfo + permissions + deep links
├── app.json                     # Expo / Android configuration & permissions
├── package.json                 # Pinned SDK 52 dependency versions
├── babel.config.js              # babel-preset-expo (auto-includes reanimated plugin)
├── tsconfig.json
├── google-services.json         # Firebase (package com.orbit.app, project orbit-social-c90ed)
├── assets/
│   ├── icon.png                 # 1024×1024 launcher icon
│   ├── adaptive-icon.png        # Adaptive icon foreground (safe-zone scaled)
│   └── splash-icon.png          # Native splash image
└── components/
    ├── SplashScreen.tsx         # Animated space-themed cold-start screen
    ├── OfflineScreen.tsx        # "You are out of Orbit" screen
    └── PullToRefresh.tsx        # Gesture-driven Android pull-to-refresh
```

## Run it

```bash
npm install
npx expo prebuild -p android        # generates the android/ project (needed for custom packages)
npx expo run:android                # build + install on a device/emulator
```

For a release build:

```bash
cd android && ./gradlew assembleRelease
# or build with EAS:
npx eas build -p android --profile preview
```

> The package id `com.orbit.app` matches the `google-services.json` you
> provided, so FCM push will bind correctly during `expo prebuild`.

---

## How the requirements are implemented

### 1. Animated splash & cold-start screen (`components/SplashScreen.tsx`)
- Deep slate background `#0f172a`, gold/tan planet with a tilted orbital ring
  and an orbiting satellite, twinkling starfield, "ORBIT" wordmark and a
  pulsing "Connecting to Orbit…" line (all Reanimated).
- A thin gold progress bar at the bottom tracks `onLoadProgress` (width is
  animated from a measured track, so it's pixel-accurate).
- `onLoadEnd` calls `splashRef.hide()`, which fades the overlay out and then
  unmounts it via `onHidden`.
- **Cold-start handling:** Render's free tier returns `503` while the backend
  boots. `onHttpError` detects `status >= 500`, keeps the splash visible and
  auto-retries with exponential backoff (2.5s → ~35s, 5 attempts) before
  falling back to the offline screen.

### 2. WebView & hardware permissions (`App.tsx`)
The WebView is configured with `javaScriptEnabled`, `domStorageEnabled`,
`allowFileAccess`, `allowsInlineMediaPlayback`,
`mediaPlaybackRequiresUserAction={false}`, `thirdPartyCookiesEnabled`,
`allowsFullscreenVideo`, `setSupportMultipleWindows={false}` (so OAuth/popup
windows load in the same WebView) and `originWhitelist={['*']}`.

> **Important API note:** `react-native-webview` v13 **removed the
> `onPermissionRequest` JS prop** (the `event.grant()` API from v12). In v13,
> WebRTC permission is handled natively by `RNCWebChromeClient.onPermissionRequest`,
> which maps `RESOURCE_VIDEO_CAPTURE → CAMERA` and
> `RESOURCE_AUDIO_CAPTURE → RECORD_AUDIO` and shows the Android runtime dialog
> automatically — then grants the WebView request. So the correct v13 recipe is:
>
> 1. Declare `CAMERA` / `RECORD_AUDIO` in the manifest (done in `app.json`), and
> 2. Pre-grant them from JS so the WebView path sees "already granted" and
>    grants synchronously with **no** double-prompt.
>
> `ensureCallPermissions()` (via `expo-av` + `expo-camera`) runs automatically
> when a call/room deep link is opened. If the user starts a call directly in
> the web UI, the WebView's native permission flow still prompts correctly.

- **File uploads** are handled natively in v13 as well — tapping an
  `<input type="file">` in the web chat opens the Android system file
  picker / photo picker automatically (no `onShowFileChooser` JS wiring or
  `expo-image-picker` needed).

### 3. Offline screen (`components/OfflineScreen.tsx`)
- `useNetInfo()` monitors connectivity. When `isConnected === false` — or the
  WebView raises `onError` / a non-5xx `onHttpError` while the device is online
  — the WebView is hidden and the dark, space-themed offline screen is shown.
- "Try Again" refreshes NetInfo and calls `webviewRef.current.reload()`.
- The app auto-reloads when connectivity returns (no tap required).

### 4. Pull-to-refresh (`components/PullToRefresh.tsx`)
`react-native-webview`'s `pullToRefreshEnabled` prop is **iOS-only**, so Android
gets a real native-feeling implementation: a Reanimated + Gesture Handler pan
that only activates while the WebView is scrolled to the very top (tracked via
the WebView's native `onScroll`). Pull past the threshold and it reloads; any
other scroll is left completely untouched.

### 5. Deep linking & push
- Custom scheme `orbit://…` is registered (`app.json` `scheme` + intent filter).
  `orbit://call/<roomId>` opens the web app, pre-requests camera/mic, and
  navigates the WebView to the matching URL.
- `https://orbit-web-6z3b.onrender.com/…` links are also registered. To make
  them real Android **App Links** (open the app instead of the browser), publish
  `/.well-known/assetlinks.json` on that host and flip `autoVerify` to `true`.
- Push: with `google-services.json` in place, `expo-notifications` receives FCM
  messages. Tapping a notification reads `data.url` (or `data.deepLink`) and
  deep-links into the app. The raw FCM device token is logged from
  `Notifications.getDevicePushTokenAsync()`.

### 6. System chrome
Status bar and Android navigation bar are forced to `#0f172a` with light
content (via `expo-status-bar`, `expo-navigation-bar`, and `app.json`
`androidStatusBar` / `androidNavigationBar`) for a seamless full-screen look.

---

## Testing deep links

```bash
# cold start via a link
adb shell am start -W -a android.intent.action.VIEW -d "orbit://call/room-123" com.orbit.app
# push notification tap is exercised by sending an FCM message with data.url
```

## Incoming calls / push notifications

Calls ring **in-app** when the app is open (the web app's socket handles that).
When the app is **backgrounded or killed**, the WebView's JavaScript is frozen,
so the only way to alert the user is a native FCM push. That requires three
pieces:

1. **Shell (done):** registers the FCM device token and hands it to the web app
   by dispatching a `window` event named `orbit:push-token` on every load (plus
   whenever FCM rotates the token). It also creates a `calls` notification
   channel with `MAX` importance (heads-up + sound + vibration) and suppresses
   the duplicate banner while the app is open.
2. **Web app:** listen for `orbit:push-token` and POST the token to your
   backend (see `server/push-example.js` for the snippet).
3. **Backend:** when a call starts, send an FCM **notification** message to the
   callee's tokens targeting the `calls` channel (see `server/push-example.js`).
   It must use the same Firebase project (`orbit-social-c90ed`) as the
   `google-services.json` in the APK.

Android 14+ also gates "wake the screen" behind the full-screen-notifications
toggle; the shell asks for it once (and declares `USE_FULL_SCREEN_INTENT`).
Heads-up + sound works regardless; fully lighting the screen requires that
toggle to be on.

### Foreground fallback + missed calls

- **Foreground fallback:** if a push arrives while the app is *open*, the shell
  suppresses the duplicate system banner and instead forwards the payload to
  the web app via a `orbit:call-push` window event. That way an incoming call
  still rings in-app even when the web app's socket is dead or reconnecting.
  The web app should **dedup by `callId`** so a live socket + forwarded push
  don't double-ring (snippet in `server/push-example.js`).
- **Missed calls:** when a call is never answered, the backend sends a second
  `type: "missed_call"` push on the normal-priority `default` channel, which
  taps through to the chat/conversation. See `sendMissedCallPush()` in
  `server/push-example.js`.

All FCM `data` values arrive as **strings** (e.g. `type`, `callId`,
`callerName`, `url`).

> Push is the one feature that does **not** work in Expo Go (Expo Go uses its
> own Firebase config). It works in the real `eas build` APK.

## Notes

- `expo-av` is the SDK 52 audio/permission module (it's replaced by
  `expo-audio`/`expo-video` from SDK 53 onward — this project pins SDK 52).
- If any legacy dependency misbehaves on the new architecture, flip
  `"newArchEnabled": false` in `app.json` and rebuild.
- The native splash (`assets/splash-icon.png`) shows the Orbit logo centered on
  `#0f172a` before React loads, so there's no white flash at launch.
