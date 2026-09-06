import { PUSH_REGISTER_ENDPOINT, SHELL_VERSION } from "../constants/config";

import type { PushTokens } from "./notifications";



export type WebToNativeMessage =

  | { type: "INCOMING_CALL"; payload: Record<string, unknown> }

  | { type: "CALL_ENDED"; payload?: { callId?: string } }

  | { type: "CALL_STARTED"; payload?: { callId?: string } }

  | { type: "REGISTER_PUSH" }

  | { type: "REQUEST_PERMISSIONS" }

  | { type: "GET_PERMISSIONS_STATE" }

  | { type: "OPEN_EXTERNAL"; payload: { url: string } }

  | { type: "OPEN_NOTIFICATION_SETTINGS" }

  | { type: "OPEN_BATTERY_SETTINGS" }

  | { type: "HAPTIC"; payload?: { style?: "light" | "medium" | "heavy" } }

  | { type: "BRIDGE_READY" };



export function parseWebMessage(raw: string): WebToNativeMessage | null {

  try {

    const parsed = JSON.parse(raw) as { type?: string; payload?: unknown };

    if (!parsed || typeof parsed.type !== "string") return null;

    return parsed as WebToNativeMessage;

  } catch {

    return null;

  }

}



/**

 * Runs before any page script. Establishes `window.OrbitNative`, routes `window.open`

 * back into the WebView (needed because setSupportMultipleWindows is false), and installs

 * a DOM heuristic that detects the web app's own "Incoming call" UI so the shell can ring

 * natively while the app is backgrounded but still alive — even if the web app never calls

 * the formal `OrbitNative.incomingCall()` API.

 */

export const INJECTED_BEFORE_CONTENT_LOADED = `

(function () {

  if (window.OrbitNative && window.OrbitNative.__installed) { return; }



  var post = function (type, payload) {

    try {

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));

    } catch (e) {}

  };



  var readyCallbacks = [];

  var native = {

    __installed: true,

    isNativeShell: true,

    platform: 'android',

    shellVersion: '${SHELL_VERSION}',

    pushToken: null,

    expoPushToken: null,

    ready: function (cb) {

      if (typeof cb !== 'function') return;

      if (native.pushToken) { cb(native); } else { readyCallbacks.push(cb); }

    },

    __flushReady: function () {

      var cbs = readyCallbacks.splice(0, readyCallbacks.length);

      for (var i = 0; i < cbs.length; i++) { try { cbs[i](native); } catch (e) {} }

    },

    incomingCall: function (call) { post('INCOMING_CALL', call); },

    callStarted: function (callId) { post('CALL_STARTED', { callId: callId }); },

    callEnded: function (callId) { post('CALL_ENDED', { callId: callId }); },

    registerPush: function () { post('REGISTER_PUSH'); },

    requestPermissions: function () { post('REQUEST_PERMISSIONS'); },

    getPermissionsState: function () { post('GET_PERMISSIONS_STATE'); },

    openExternal: function (url) { post('OPEN_EXTERNAL', { url: url }); },

    openNotificationSettings: function () { post('OPEN_NOTIFICATION_SETTINGS'); },

    openBatterySettings: function () { post('OPEN_BATTERY_SETTINGS'); },

    haptic: function (style) { post('HAPTIC', { style: style || 'light' }); }

  };

  window.OrbitNative = native;



  window.open = function (url) {

    if (typeof url === 'string' && url.length) {

      try {

        var target = new URL(url, window.location.href);

        if (target.host === window.location.host) { window.location.href = target.href; }

        else { post('OPEN_EXTERNAL', { url: target.href }); }

      } catch (e) {}

    }

    return null;

  };




  document.addEventListener('DOMContentLoaded', function () {

    document.documentElement.classList.add('orbit-native-shell');

    post('BRIDGE_READY');

  });

})();

true;

`;



/**

 * Injected once tokens are known (and again after every navigation), so the web app can

 * persist the device token against the signed-in user. Three delivery paths:

 *  1. window.OrbitNative.pushToken + `orbit:native-ready` event (for apps that integrate the bridge)

 *  2. localStorage['orbit_native_push'] (zero-integration fallback the web app can read on login)

 *  3. Best-effort POST to PUSH_REGISTER_ENDPOINT with the WebView's session cookies.

 */

export function buildPushTokenInjection(tokens: PushTokens): string {

  const payload = JSON.stringify({

    platform: "android",

    provider: "fcm",

    token: tokens.fcmToken,

    expoPushToken: tokens.expoPushToken,

    deviceHash: tokens.deviceHash,

    capabilities: {

      fullScreenIntent: tokens.canUseFullScreenIntent,

    },

    shellVersion: SHELL_VERSION,

    registeredAt: Date.now(),

  });



  return `

(function () {

  var payload = ${payload};

  if (!payload.token && !payload.expoPushToken) { return; }

  try {

    if (window.OrbitNative) {

      window.OrbitNative.pushToken = payload.token;

      window.OrbitNative.expoPushToken = payload.expoPushToken;

      if (window.OrbitNative.__flushReady) { window.OrbitNative.__flushReady(); }

    }

    window.localStorage.setItem('orbit_native_push', JSON.stringify(payload));
    window.localStorage.setItem('orbit_fcm_token', payload.token || payload.expoPushToken || '');
    window.dispatchEvent(new CustomEvent('orbit:native-ready', { detail: payload }));
    window.dispatchEvent(new CustomEvent('orbit:push-token', { detail: payload.token || payload.expoPushToken }));

  } catch (e) {}



  try {

    var key = 'orbit_native_push_synced';

    var last = window.localStorage.getItem(key);

    var stamp = String(payload.token || payload.expoPushToken);

    if (last !== stamp) {

      fetch(${JSON.stringify(PUSH_REGISTER_ENDPOINT)}, {

        method: 'POST',

        credentials: 'include',

        headers: { 'Content-Type': 'application/json', 'X-Orbit-Shell': payload.shellVersion },

        body: JSON.stringify(payload)

      }).then(function (res) {

        if (res.ok) { window.localStorage.setItem(key, stamp); }

      }).catch(function () {});

    }

  } catch (e) {}

})();

true;

`;

}



export function buildNavigateInjection(url: string): string {
  return `
(function () {
  try {
    var targetUrl = ${JSON.stringify(url)};
    if (window.OrbitNative && typeof window.OrbitNative.onNavigate === 'function') {
      window.OrbitNative.onNavigate(targetUrl);
    }
    window.dispatchEvent(new CustomEvent('orbit:navigate', { detail: { url: targetUrl } }));

    var match = targetUrl.match(/callId=([^&]+)/) || targetUrl.match(/incomingCall=([^&]+)/) || targetUrl.match(/calls\/([^/?#]+)/);
    var callId = match ? decodeURIComponent(match[1]) : '';
    var callerIdMatch = targetUrl.match(/callerId=([^&]+)/);
    var callerId = callerIdMatch ? decodeURIComponent(callerIdMatch[1]) : '';
    var callerNameMatch = targetUrl.match(/callerName=([^&]+)/);
    var callerName = callerNameMatch ? decodeURIComponent(callerNameMatch[1]) : 'Orbit Friend';
    var callerAvatarMatch = targetUrl.match(/callerAvatar=([^&]+)/);
    var callerAvatar = callerAvatarMatch ? decodeURIComponent(callerAvatarMatch[1]) : '';
    var callTypeMatch = targetUrl.match(/callType=([^&]+)/);
    var callType = callTypeMatch ? decodeURIComponent(callTypeMatch[1]) : 'voice';

    var callDetail = {
      callId: callId,
      callerId: callerId,
      callerName: callerName,
      callerAvatar: callerAvatar,
      type: callType,
      caller: {
        id: callerId,
        username: callerName,
        display_name: callerName,
        avatar_url: callerAvatar,
      }
    };

    if (callId) {
      window.dispatchEvent(new CustomEvent('orbit:call-push', { detail: callDetail }));
    }
    if (targetUrl.indexOf('action=accept') !== -1 || targetUrl.indexOf('incomingCall=') !== -1) {
      window.dispatchEvent(new CustomEvent('orbit:call-accept', { detail: callDetail }));
      window.dispatchEvent(new CustomEvent('orbit:trigger-accept-call', { detail: callDetail }));
    }

    try {
      var current = new URL(window.location.href);
      var next = new URL(targetUrl, window.location.href);
      if (current.origin === next.origin) {
        if (current.pathname !== next.pathname || current.search !== next.search) {
          window.history.pushState({}, '', next.pathname + next.search + next.hash);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } else {
        window.location.href = targetUrl;
      }
    } catch(e) {
      // Keep page alive
    }
  } catch (e) {}
})();
true;
`;
}



export function buildCallEndedInjection(): string {

  return `

(function () {

  try { window.dispatchEvent(new CustomEvent('orbit:native-call-dismissed')); } catch (e) {}

})();

true;

`;

}



export interface PermissionsStatePayload {

  camera: boolean;

  microphone: boolean;

  mediaLibrary: boolean;

  notifications: boolean;

  fullScreenIntent: boolean;

}



export function buildPermissionsStateInjection(state: PermissionsStatePayload): string {

  return `

(function () {

  var payload = ${JSON.stringify(state)};

  try {

    if (window.OrbitNative) {

      window.OrbitNative.permissions = payload;

    }

    window.dispatchEvent(new CustomEvent('orbit:native-permissions', { detail: payload }));

  } catch (e) {}

})();

true;

`;

}
