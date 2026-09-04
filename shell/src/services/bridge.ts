import { RefObject } from 'react';
import { Vibration } from 'react-native';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { BRIDGE_EVENTS } from '../config/constants';

/**
 * Script injected into WebView before any DOM content loads.
 * Identifies the host environment as the native Android Orbit Shell.
 */
export const INJECTED_INIT_SCRIPT = `
(function() {
  window.isOrbitShell = true;
  window.orbitPlatform = 'android';
  window.orbitShellVersion = '1.0.0';
})();
true;
`;

export class WebBridge {
  /**
   * Dispatch the FCM push token into the WebView via a window CustomEvent.
   */
  static sendPushToken(webviewRef: RefObject<WebView | null>, token: string) {
    if (!webviewRef.current) return;
    const script = `
      window.dispatchEvent(new CustomEvent(${JSON.stringify(BRIDGE_EVENTS.PUSH_TOKEN)}, {
        detail: ${JSON.stringify(token)}
      }));
      true;
    `;
    webviewRef.current.injectJavaScript(script);
  }

  /**
   * Forward a foreground push notification payload to the WebView.
   */
  static forwardPushPayload(webviewRef: RefObject<WebView | null>, data: Record<string, unknown>) {
    if (!webviewRef.current) return;
    const script = `
      window.dispatchEvent(new CustomEvent(${JSON.stringify(BRIDGE_EVENTS.CALL_PUSH)}, {
        detail: ${JSON.stringify(data)}
      }));
      true;
    `;
    webviewRef.current.injectJavaScript(script);
  }

  /**
   * Parse incoming messages from the web app (sent via window.ReactNativeWebView.postMessage)
   */
  static handleIncomingMessage(
    rawMessage: string,
    options: {
      onGetToken: () => void;
      onRequestCallPermissions: () => void;
    },
  ) {
    try {
      const parsed = JSON.parse(rawMessage);
      switch (parsed?.type) {
        case 'ORBIT_GET_PUSH_TOKEN':
          options.onGetToken();
          break;
        case 'ORBIT_REQUEST_CALL_PERMISSIONS':
          options.onRequestCallPermissions();
          break;
        case 'ORBIT_HAPTIC':
          Vibration.vibrate(parsed.pattern || 40);
          break;
        case 'ORBIT_OPEN_EXTERNAL':
          if (parsed.url && typeof parsed.url === 'string') {
            Linking.openURL(parsed.url).catch(() => {});
          }
          break;
        default:
          break;
      }
    } catch {
      // Ignore non-JSON postMessage payloads
    }
  }
}
