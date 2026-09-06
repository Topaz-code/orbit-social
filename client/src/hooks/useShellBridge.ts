import { useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import { useCallStore } from '../stores/callStore.js';

declare global {
  interface Window {
    isOrbitShell?: boolean;
    orbitPlatform?: string;
    orbitShellVersion?: string;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Request camera and microphone runtime permissions from the native Android shell.
 */
export function requestNativeCallPermissions() {
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'ORBIT_REQUEST_CALL_PERMISSIONS' }),
    );
  }
}

/**
 * Trigger native haptic feedback on Android if running in shell.
 */
export function triggerNativeHaptic(pattern: number = 40) {
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'ORBIT_HAPTIC', pattern }),
    );
  }
}

/**
 * Request the current FCM push token from the native Android shell.
 */
export function requestNativePushToken() {
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'ORBIT_GET_PUSH_TOKEN' }),
    );
  }
}

/**
 * Dismiss native Android heads-up / lock-screen call notification.
 */
export function cancelNativeCallNotification(callId?: string) {
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'CALL_ENDED', payload: { callId } }),
    );
  }
  if (typeof window !== 'undefined' && (window as any).OrbitNative?.callEnded) {
    try {
      (window as any).OrbitNative.callEnded(callId);
    } catch {}
  }
}

/**
 * Notify native Android shell that a call has started/connected.
 * Cancels heads-up/lockscreen ring notification and keeps the screen awake.
 */
export function notifyNativeCallStarted(callId?: string) {
  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'CALL_STARTED', payload: { callId } }),
    );
  }
  if (typeof window !== 'undefined' && (window as any).OrbitNative?.callStarted) {
    try {
      (window as any).OrbitNative.callStarted(callId);
    } catch {}
  }
}

export function useShellBridge() {
  const { user, isAuthenticated } = useAuthStore();
  const registeredTokenRef = useRef<string | null>(null);

  // Register push token with the backend
  const registerToken = async (token: string) => {
    if (!token || registeredTokenRef.current === token) return;
    try {
      await api.post('/device/token', {
        token,
        platform: 'android',
      });
      registeredTokenRef.current = token;
      localStorage.setItem('orbit_fcm_token', token);
      console.log('[ShellBridge] Device token registered successfully');
    } catch (err) {
      console.warn('[ShellBridge] Failed to register device token:', err);
    }
  };

  useEffect(() => {
    // If not running in native shell or user not logged in, nothing to bridge
    if (!isAuthenticated || !user?.id) return;

    // 1. If we already have a cached token from a previous session, register it immediately
    const cachedToken = localStorage.getItem('orbit_fcm_token');
    if (cachedToken) {
      registerToken(cachedToken);
    }

    // 2. Ask the shell for the current FCM token
    requestNativePushToken();

    // 3. Listen for token dispatched from native shell
    const handlePushToken = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const token = customEvent.detail;
      if (token) {
        registerToken(token);
      }
    };

    // 4. Listen for foreground push notifications forwarded by native shell
    const handleCallPush = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      const payload = customEvent.detail;
      if (!payload) return;

      console.log('[ShellBridge] Received call push event:', payload);

      const { activeCall, incomingCall, setIncomingCall } = useCallStore.getState();

      // Only mount incoming call if no active or incoming call is underway
      if (!activeCall && !incomingCall && payload.callId) {
        let caller = payload.caller;
        if (typeof caller === 'string') {
          try {
            caller = JSON.parse(caller);
          } catch {
            caller = null;
          }
        }

        setIncomingCall({
          callId: String(payload.callId),
          caller: (caller as any) || {
            id: String(payload.callerId || 'unknown'),
            username: String(payload.callerName || 'Orbit Friend'),
            display_name: String(payload.callerName || 'Orbit Friend'),
            avatar_url: String(payload.callerAvatar || ''),
          },
          type: (payload.callType as 'voice' | 'video') || 'voice',
          conversationId: payload.conversationId ? String(payload.conversationId) : undefined,
        });

        // Pre-emptively request native call permissions for smooth pickup
        requestNativeCallPermissions();
      }
    };

    // 5. Listen for call accept action from native shell notification
    const handleCallAccept = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const detail = customEvent.detail;
      console.log('[ShellBridge] Received call accept event:', detail);
      window.dispatchEvent(new CustomEvent('orbit:trigger-accept-call', { detail }));
    };

    // 6. Listen for native call dismissal
    const handleCallDismissed = () => {
      const { incomingCall, setIncomingCall } = useCallStore.getState();
      if (incomingCall) {
        setIncomingCall(null);
      }
    };

    // 7. Listen for native ready token broadcast
    const handleNativeReady = (event: Event) => {
      const customEvent = event as CustomEvent<{ token?: string; expoPushToken?: string }>;
      const token = customEvent.detail?.token || customEvent.detail?.expoPushToken;
      if (token) {
        registerToken(token);
      }
    };

    window.addEventListener('orbit:push-token', handlePushToken);
    window.addEventListener('orbit:call-push', handleCallPush);
    window.addEventListener('orbit:call-accept', handleCallAccept);
    window.addEventListener('orbit:native-call-dismissed', handleCallDismissed);
    window.addEventListener('orbit:native-ready', handleNativeReady);

    return () => {
      window.removeEventListener('orbit:push-token', handlePushToken);
      window.removeEventListener('orbit:call-push', handleCallPush);
      window.removeEventListener('orbit:call-accept', handleCallAccept);
      window.removeEventListener('orbit:native-call-dismissed', handleCallDismissed);
      window.removeEventListener('orbit:native-ready', handleNativeReady);
    };
  }, [isAuthenticated, user?.id]);
}
