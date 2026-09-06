# Orbit — Android WebView Shell



Production Android shell for **https://orbit-web-6z3b.onrender.com/** built with Expo SDK 52.



| Capability | How it is delivered |

| --- | --- |

| Animated cold-start splash | `components/SplashScreen.tsx` (Reanimated, tracks `onLoadProgress`, fades on `onLoadEnd`) |

| Render cold-start handling | 5xx / network errors during first load trigger exponential auto-retries with "Waking up the Orbit servers" copy |

| Offline screen | `components/OfflineScreen.tsx` driven by NetInfo + `onError`/`onHttpError` |

| Camera / mic / photos / notifications | Requested sequentially at boot (`services/permissions.ts`); WebRTC `getUserMedia` then works inside the WebView |

| Pull-to-refresh, back button, file uploads | Native WebView features (`pullToRefreshEnabled`, `BackHandler`, Android file chooser) |

| **Calls that wake a locked phone** | FCM high-priority *data* push → headless task → Notifee full-screen call notification (Accept / Decline) |

| Push notifications when app is closed | FCM via `expo-notifications`, tap → deep link into the WebView |

| Deep links | `orbit://…` and `https://orbit-web-6z3b.onrender.com/…` (App Links) |



## How background calls work without draining battery



The shell **does not** run a persistent background service or keep the WebView / MQTT socket alive.

Instead it relies on Firebase Cloud Messaging, which is the OS-level, shared, battery-optimised push

channel. The app process is asleep (0% CPU) until FCM wakes it for a few hundred milliseconds:



```

Orbit backend ──FCM data message (priority HIGH)──▶ Android OS

                                                      │ wakes com.orbit.app (headless JS, ~300ms)

                                                      ▼

                       tasks/backgroundNotificationTask.ts ──▶ services/calls.ts showIncomingCall()

                                                      │ Notifee: category CALL + fullScreenAction

                                                      ▼

                    Screen turns on over the lock screen (showWhenLocked / turnScreenOn)

                    Ringtone loops, Accept / Decline buttons

                                                      │ Accept

                                                      ▼

                    MainActivity launches → App.tsx navigates WebView to call.url?action=accept

```



This is the same architecture WhatsApp / Telegram use on Android. Battery cost while idle is

effectively zero; the only requirement is that the **backend sends the push**.



## 1. Prerequisites



```bash

npm install -g eas-cli

cd mobile

npm install

npx expo install --fix          # aligns every package with SDK 52

node scripts/generate-assets.mjs

```



### Firebase (required for push + calls)



1. Create a Firebase project → add an Android app with package `com.orbit.app`.

2. Download `google-services.json` into `mobile/` (path already referenced in `app.json`).

3. In Firebase → Project settings → Cloud Messaging, note the **FCM HTTP v1** service account (backend).

4. If you also want Expo's push service: `eas init` (adds `extra.eas.projectId`) and upload the FCM

   service-account key with `eas credentials`.



## 2. Build



```bash

npx expo prebuild --platform android --clean   # applies plugins/withOrbitCallActivity.js

npx expo run:android                            # local debug build on a device

eas build -p android --profile preview          # installable APK

eas build -p android --profile production       # Play Store AAB

```



Expo Go is **not** supported (Notifee, custom manifest attributes, FCM need a dev/production build).



## 3. Backend contract



### 3a. Store the device token



The shell hands the token to the web app three ways — implement whichever is easiest:



* `window.OrbitNative.pushToken` + `window.addEventListener('orbit:native-ready', e => e.detail)`

* `localStorage.getItem('orbit_native_push')` → `{ platform, provider, token, expoPushToken, deviceHash, capabilities }`

* An automatic `POST /api/push/register` with the WebView's session cookies and body:



```json

{

  "platform": "android",

  "provider": "fcm",

  "token": "<fcm token>",

  "expoPushToken": null,

  "deviceHash": "<sha256 of device secret>",

  "capabilities": { "fullScreenIntent": true },

  "shellVersion": "1.0.0"

}

```



Store **`deviceHash`** alongside the FCM token — it is what authenticates cookieless

declines from the headless layer (see §5).



### 3b. Ring the device (FCM HTTP v1)



Send a **data-only** message with `priority: HIGH` (a `notification` block would let Android render a

plain banner and skip the headless task):



```json

{

  "message": {

    "token": "<fcm token>",

    "android": { "priority": "HIGH", "ttl": "45s" },

    "data": {

      "type": "incoming_call",

      "callId": "c_8f2a",

      "callerName": "Ada Lovelace",

      "callerAvatar": "https://orbit-web-6z3b.onrender.com/avatars/ada.png",

      "isVideo": "true",

      "url": "/calls/c_8f2a",

      "declineUrl": "/api/calls/c_8f2a/decline",

      "startedAt": "1730000000000"

    }

  }

}

```



* `url` is opened in the WebView when the user accepts (the shell appends `?action=accept&native=1`).

* `declineUrl` (optional) receives a POST authenticated by the cookieless device proof — see

  **§5 Decline authentication (headless)** for the exact payload and server recipe.

* `startedAt` lets the shell ignore pushes older than 45 s (missed call).

* When the caller hangs up, send another data message with `type: "call_cancelled"` **or** simply let the

  45 s `timeoutAfter` expire; the notification auto-dismisses either way.



### 3c. Ordinary notifications (messages, mentions)



```json

{

  "message": {

    "token": "<fcm token>",

    "android": { "priority": "HIGH", "notification": { "channel_id": "orbit_messages" } },

    "notification": { "title": "Ada", "body": "See you in orbit 🚀" },

    "data": { "url": "/messages/ada" }

  }

}

```



Tapping the notification opens `data.url` inside the WebView (cold or warm start).



## 4. Web-app hooks (optional but recommended)



```ts

// Anywhere in the Orbit web client

const native = (window as any).OrbitNative;

if (native?.isNativeShell) {

  native.ready((n) => api.registerPushToken(n.pushToken));   // token hand-off

  socket.on('call:incoming', (call) => native.incomingCall({ ...call, type: 'incoming_call' }));

  socket.on('call:started', (id) => native.callStarted(id)); // keeps the screen awake during the call

  socket.on('call:ended',   (id) => native.callEnded(id));   // dismisses the native ringer

}

window.addEventListener('orbit:native-call-dismissed', () => callStore.dismiss());

```



If the web app never integrates, a DOM heuristic in `services/bridge.ts` still detects "Incoming call /

… is calling" UI while the app is backgrounded-but-alive and rings natively.



## 5. Android 14+ notes & production edge cases



### Decline authentication (headless)



A headless React Native `fetch` does not share the WebView's cookie jar, so a decline endpoint

protected only by session cookies will 401. The shell authenticates cookielessly:



1. On first launch it generates a 48-byte secret in the Android Keystore (SecureStore).

2. `deviceHash = SHA-256(secret)` — the public identifier, registered to the backend alongside

   the FCM token (see `POST /api/push/register` body, now includes `deviceHash`).

3. On decline, the shell computes

   `proof = HMAC-SHA256(key = SHA-256(deviceHash), data = \`${callId}:${ts}\`)` and sends

   `callId + deviceHash + ts + proof` as query params (works with simple GET/POST endpoints)

   and as JSON body + `X-Orbit-*` headers.

4. The backend verifies with only what it already knows. **Use the raw 32-byte digest as the

   HMAC key — not the hex string.** Inside the shell, `hmacSha256Hex(keyHex, …)` decodes the key

   from hex into bytes, so the server must do the same:



```js

const crypto = require("crypto");

// deviceHash is the 64-char hex string the shell registered with the push token.

// sha256(deviceHash) as a raw Buffer — passing digest("hex") here would use 64 ASCII

// bytes as the key and the proof would never match.

const key = crypto.createHash("sha256").update(deviceHash).digest(); // <-- NO "hex"

const expected = crypto.createHmac("sha256", key).update(`${callId}:${ts}`).digest("hex");

crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(proof));

```



Rejects stale timestamps (> 5 min) to fence replay.



### Full-screen intent (Android 14)



`USE_FULL_SCREEN_INTENT` is granted by default to sideloaded / internal-track builds only.

For public Play releases, declare the app as a **calling app** in the Play Console, or let

users re-enable it: the shell reads the live state at boot via Notifee

(`getNotificationSettings().android.fullScreenIntent`) and exposes it through the bridge as

`OrbitNative.permissions.fullScreenIntent` + the `orbit:native-permissions` event. Call

`OrbitNative.openNotificationSettings()` to deep-link into the exact system toggle.



### OEM battery killers



Aggressive OEM battery managers (Xiaomi, Huawei, Samsung "Deep sleeping apps") can delay FCM.

Expose `OrbitNative.openBatterySettings()` in the web app's settings page to open the system

**Ignore battery optimizations** screen.



### WebRTC permissions



`react-native-webview`'s native WebChromeClient grants `onPermissionRequest` automatically once

OS-level `CAMERA` / `RECORD_AUDIO` are granted. `requestCorePermissions()` runs sequentially at

first boot (Android silently drops overlapping dialogs), so `getUserMedia()` works with no

second in-page prompt. `mediaCapturePermissionGrantType="grant"` additionally covers the

iOS-shaped embedder API.



## 6. Testing the call flow



```bash

# From a machine with a Firebase service account token:

curl -X POST https://fcm.googleapis.com/v1/projects/<project-id>/messages:send \

  -H "Authorization: Bearer $(gcloud auth print-access-token)" \

  -H "Content-Type: application/json" \

  -d @test-call.json     # payload from section 3b

```



Lock the phone, send the request: the screen lights up with the ringing notification; **Accept** opens

the call inside the WebView, **Decline** dismisses it and POSTs to `declineUrl`.



## Project layout



```

mobile/

├── App.tsx                          # WebView container, NetInfo, cold-start loader, offline screen, bridge

├── index.ts                         # Registers headless task + Notifee background handler

├── app.json                         # Expo / Android config, permissions, intent filters, plugins

├── eas.json

├── components/

│   ├── SplashScreen.tsx             # Animated Orbit splash (Reanimated + LinearGradient)

│   └── OfflineScreen.tsx            # "You are out of Orbit" screen

├── constants/config.ts

├── services/

│   ├── bridge.ts                    # window.OrbitNative + injected scripts

│   ├── calls.ts                     # Notifee full-screen call notification + Accept/Decline handling

│   ├── notifications.ts             # FCM token, background task registration, launch routing

│   └── permissions.ts               # Camera / mic / media / notifications + audio session

├── tasks/backgroundNotificationTask.ts

├── plugins/withOrbitCallActivity.js # showWhenLocked / turnScreenOn / USE_FULL_SCREEN_INTENT

├── scripts/generate-assets.mjs

└── assets/                          # icon, adaptive-icon, splash, notification-icon, sounds/ringtone.wav

```
