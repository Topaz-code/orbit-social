import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

import SplashScreen, { SplashScreenHandle } from './components/SplashScreen';
import OfflineScreen from './components/OfflineScreen';
import PullToRefresh, { PullToRefreshHandle } from './components/PullToRefresh';

import {
  COLD_START_BASE_DELAY_MS,
  COLD_START_MAX_RETRIES,
  ORBIT_URL,
} from './src/config/constants';
import { THEME } from './src/config/theme';
import { useCallPermissions } from './src/hooks/useCallPermissions';
import { useDeepLinking } from './src/hooks/useDeepLinking';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { INJECTED_INIT_SCRIPT, WebBridge } from './src/services/bridge';

// react-native-webview event types
type WebViewErrorEvent = Parameters<NonNullable<React.ComponentProps<typeof WebView>['onError']>>[0];
type WebViewHttpErrorEvent = Parameters<NonNullable<React.ComponentProps<typeof WebView>['onHttpError']>>[0];
type WebViewProgressEvent = Parameters<NonNullable<React.ComponentProps<typeof WebView>['onLoadProgress']>>[0];
type WebViewScrollEvent = Parameters<NonNullable<React.ComponentProps<typeof WebView>['onScroll']>>[0];
type WebViewNavigation = Parameters<NonNullable<React.ComponentProps<typeof WebView>['onNavigationStateChange']>>[0];
type WebViewMessageEvent = Parameters<NonNullable<React.ComponentProps<typeof WebView>['onMessage']>>[0];

// Configure background vs foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const foreground = AppState.currentState === 'active';
    return {
      shouldShowAlert: !foreground,
      shouldPlaySound: !foreground,
      shouldSetBadge: false,
    };
  },
});

export default function App() {
  const netInfo = useNetInfo();
  const offline = netInfo.isConnected === false;

  const webviewRef = useRef<React.ElementRef<typeof WebView>>(null);
  const splashRef = useRef<SplashScreenHandle>(null);
  const pullRef = useRef<PullToRefreshHandle>(null);

  const navRef = useRef({ canGoBack: false });
  const offlineRef = useRef(offline);
  offlineRef.current = offline;

  const loadEndedRef = useRef(false);
  const serverRecoveringRef = useRef(false);
  const lastHttpStatusRef = useRef<number | null>(null);
  const coldStartRetriesRef = useRef(0);
  const coldStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPushRef = useRef<Record<string, unknown> | null>(null);

  const [progress, setProgress] = useState(0);
  const [splashActive, setSplashActive] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const showOffline = offline || connectionError;

  const clearColdStartTimer = useCallback(() => {
    if (coldStartTimerRef.current) {
      clearTimeout(coldStartTimerRef.current);
      coldStartTimerRef.current = null;
    }
  }, []);

  // Hook 1: Call, Camera, Mic, and Notification Permissions
  const {
    initPromptFlag,
    ensureNotificationPermission,
    ensureFullScreenIntent,
    ensureCallPermissions,
  } = useCallPermissions();

  useEffect(() => {
    void initPromptFlag();
  }, [initPromptFlag]);

  // Hook 2: Push Notifications & FCM Token handling
  const { fcmTokenRef } = usePushNotifications({
    onTokenReady: (token) => {
      if (loadEndedRef.current) {
        WebBridge.sendPushToken(webviewRef, token);
      }
    },
    onForegroundPush: (data) => {
      if (loadEndedRef.current) {
        WebBridge.forwardPushPayload(webviewRef, data);
      } else {
        pendingPushRef.current = data;
      }
    },
  });

  // Hook 3: Deep Linking
  const { pendingDeepLinkRef, handleDeepLink } = useDeepLinking({
    onNavigate: (url) => {
      if (loadEndedRef.current && webviewRef.current) {
        webviewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
      } else {
        pendingDeepLinkRef.current = url;
      }
    },
    onCallRouteDetected: () => {
      void ensureCallPermissions();
    },
  });

  // Handle messages from the Web App via window.ReactNativeWebView.postMessage
  const handleWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      WebBridge.handleIncomingMessage(event.nativeEvent.data, {
        onGetToken: () => {
          if (fcmTokenRef.current) {
            WebBridge.sendPushToken(webviewRef, fcmTokenRef.current);
          }
        },
        onRequestCallPermissions: () => {
          void ensureCallPermissions();
        },
      });
    },
    [ensureCallPermissions, fcmTokenRef],
  );

  // Status & Navigation bar styling (Orbit Void Theme)
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(THEME.colors.void).catch(() => {});
    NavigationBar.setButtonStyleAsync('light').catch(() => {});
  }, []);

  // Hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navRef.current.canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  // Auto-reconnect when back online
  const prevOfflineRef = useRef(offline);
  useEffect(() => {
    const wasOffline = prevOfflineRef.current;
    prevOfflineRef.current = offline;
    if (wasOffline && !offline) {
      setConnectionError(false);
      setSplashActive(true);
      splashRef.current?.show();
      webviewRef.current?.reload();
    }
  }, [offline]);

  useEffect(() => () => clearColdStartTimer(), [clearColdStartTimer]);

  // Cold-start recovery (handling Render free-tier spin up)
  const scheduleColdStartRetry = useCallback(() => {
    clearColdStartTimer();

    const attempt = coldStartRetriesRef.current;
    coldStartRetriesRef.current += 1;

    if (attempt >= COLD_START_MAX_RETRIES) {
      serverRecoveringRef.current = false;
      splashRef.current?.hide();
      setConnectionError(true);
      return;
    }

    serverRecoveringRef.current = true;
    setSplashActive(true);
    splashRef.current?.show();

    const delay = COLD_START_BASE_DELAY_MS * Math.pow(1.7, attempt);
    coldStartTimerRef.current = setTimeout(() => {
      coldStartTimerRef.current = null;
      webviewRef.current?.reload();
    }, delay);
  }, [clearColdStartTimer]);

  // WebView Event Handlers
  const handleLoadStart = useCallback(() => {
    lastHttpStatusRef.current = null;
    setConnectionError(false);
    setRetrying(false);
  }, []);

  const handleLoadProgress = useCallback((event: WebViewProgressEvent) => {
    setProgress(event.nativeEvent?.progress ?? 0);
  }, []);

  const handleLoadEnd = useCallback(() => {
    loadEndedRef.current = true;
    setRefreshing(false);
    setRetrying(false);

    if ((lastHttpStatusRef.current ?? 0) >= 500) {
      return;
    }

    serverRecoveringRef.current = false;
    coldStartRetriesRef.current = 0;
    clearColdStartTimer();
    splashRef.current?.hide();

    void ensureNotificationPermission();
    void ensureFullScreenIntent();

    // Flush current FCM token into the web app
    if (fcmTokenRef.current) {
      WebBridge.sendPushToken(webviewRef, fcmTokenRef.current);
    }

    // Flush pending push notification
    if (pendingPushRef.current) {
      const data = pendingPushRef.current;
      pendingPushRef.current = null;
      WebBridge.forwardPushPayload(webviewRef, data);
    }

    // Flush pending deep link
    if (pendingDeepLinkRef.current && webviewRef.current) {
      const url = pendingDeepLinkRef.current;
      pendingDeepLinkRef.current = null;
      webviewRef.current.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
    }
  }, [
    clearColdStartTimer,
    ensureFullScreenIntent,
    ensureNotificationPermission,
    fcmTokenRef,
    pendingDeepLinkRef,
  ]);

  const handleHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      const status = event.nativeEvent?.statusCode ?? 0;
      lastHttpStatusRef.current = status;
      if (status >= 500) {
        scheduleColdStartRetry();
      }
    },
    [scheduleColdStartRetry],
  );

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      lastHttpStatusRef.current = null;
      clearColdStartTimer();
      serverRecoveringRef.current = false;
      if (!offlineRef.current) {
        setConnectionError(true);
      }
    },
    [clearColdStartTimer],
  );

  const handleNavState = useCallback((state: WebViewNavigation) => {
    navRef.current = { canGoBack: !!state.canGoBack };
  }, []);

  const handleScroll = useCallback((event: WebViewScrollEvent) => {
    const y = event.nativeEvent?.contentOffset?.y ?? 0;
    pullRef.current?.setScrollY(y);
  }, []);

  // External link interception: Keep Orbit contained; open external URLs in Chrome/system browser
  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (!url) return true;

    if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) {
      return true;
    }

    try {
      const parsed = new URL(url);
      const targetHost = new URL(ORBIT_URL).host;
      if (parsed.host === targetHost || parsed.host.endsWith(`.${targetHost}`)) {
        return true;
      }
    } catch {
      if (url.startsWith(ORBIT_URL)) {
        return true;
      }
    }

    // Handle system intent schemes
    if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    // External web URLs
    if (/^https?:\/\//i.test(url)) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    return true;
  }, []);

  const retryConnection = useCallback(() => {
    void NetInfo.refresh();
    setConnectionError(false);
    setRetrying(true);
    if (!offlineRef.current) {
      setSplashActive(true);
      splashRef.current?.show();
    }
    webviewRef.current?.reload();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setConnectionError(false);
    serverRecoveringRef.current = false;
    coldStartRetriesRef.current = 0;
    clearColdStartTimer();
    webviewRef.current?.reload();
  }, [clearColdStartTimer]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" backgroundColor={THEME.colors.void} translucent={false} />
      <View style={styles.root}>
        <PullToRefresh ref={pullRef} onRefresh={handleRefresh} refreshing={refreshing}>
          <View style={styles.webviewContainer} pointerEvents={showOffline ? 'none' : 'auto'}>
            <WebView
              ref={webviewRef}
              source={{ uri: ORBIT_URL }}
              style={styles.webview}
              originWhitelist={['*']}
              injectedJavaScriptBeforeContentLoaded={INJECTED_INIT_SCRIPT}
              javaScriptEnabled
              domStorageEnabled
              allowFileAccess
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              thirdPartyCookiesEnabled
              cacheEnabled
              overScrollMode="never"
              setSupportMultipleWindows={false}
              onLoadStart={handleLoadStart}
              onLoadProgress={handleLoadProgress}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              onHttpError={handleHttpError}
              onScroll={handleScroll}
              onNavigationStateChange={handleNavState}
              onMessage={handleWebMessage}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              renderError={() => <View style={styles.errorFallback} />}
            />
          </View>
        </PullToRefresh>

        <SplashScreen
          ref={splashRef}
          progress={progress}
          active={splashActive && !showOffline}
          onHidden={() => setSplashActive(false)}
        />

        {showOffline ? <OfflineScreen onRetry={retryConnection} retrying={retrying} /> : null}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.colors.void },
  webviewContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: THEME.colors.void },
  errorFallback: { flex: 1, backgroundColor: THEME.colors.void },
});
