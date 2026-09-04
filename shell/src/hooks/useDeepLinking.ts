import { useCallback, useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { APP_SCHEME, CALL_PATH_RE, ORBIT_URL } from '../config/constants';

interface DeepLinkingOptions {
  onNavigate: (url: string) => void;
  onCallRouteDetected?: () => void;
  onPushPayload?: (data: Record<string, unknown>) => void;
}

export function useDeepLinking({ onNavigate, onCallRouteDetected, onPushPayload }: DeepLinkingOptions) {
  const pendingDeepLinkRef = useRef<string | null>(null);

  const handleDeepLink = useCallback(
    (rawUrl: string) => {
      if (!rawUrl) return;

      let url = rawUrl;
      if (url.startsWith(`${APP_SCHEME}://`)) {
        const path = url.slice(`${APP_SCHEME}://`.length).replace(/^\/+/, '');
        const base = ORBIT_URL.endsWith('/') ? ORBIT_URL : `${ORBIT_URL}/`;
        url = `${base}${path}`;
      } else if (!/^https?:\/\//i.test(url)) {
        return;
      }

      if (CALL_PATH_RE.test(url)) {
        onCallRouteDetected?.();
      }

      onNavigate(url);
    },
    [onNavigate, onCallRouteDetected],
  );

  useEffect(() => {
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      if (data) {
        onPushPayload?.(data);
      }
      const url = (data?.url ?? data?.deepLink ?? data?.link) as string | undefined;
      if (url) {
        handleDeepLink(url);
      }
    };

    // Cold start via deep link or tapped notification
    void Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    const notifSub =
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      linkSub.remove();
      notifSub.remove();
    };
  }, [handleDeepLink]);

  return {
    pendingDeepLinkRef,
    handleDeepLink,
  };
}
