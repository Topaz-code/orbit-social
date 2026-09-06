import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppState, type AppStateStatus, BackHandler, Platform, StyleSheet, Vibration, View } from "react-native";

import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";

import type {

  ShouldStartLoadRequest,

  WebViewErrorEvent,

  WebViewHttpErrorEvent,

  WebViewProgressEvent,

  WebViewRenderProcessGoneEvent,

} from "react-native-webview/lib/WebViewTypes";

import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

import * as ExpoSplash from "expo-splash-screen";

import * as Notifications from "expo-notifications";

import * as NavigationBar from "expo-navigation-bar";

import * as Linking from "expo-linking";

import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

import { StatusBar } from "expo-status-bar";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import notifee from "@notifee/react-native";



import SplashScreen, { type SplashStatus } from "./components/SplashScreen";

import OfflineScreen, { type OfflineReason } from "./components/OfflineScreen";

import { CALL_NOTIFICATION_ID, COLD_START, COLORS, ORBIT_HOST, ORBIT_URL, SHELL_USER_AGENT_SUFFIX } from "./constants/config";

import {

  configureCallAudioSession,

  getPermissionSnapshot,

  openBatteryOptimisationSettings,

  openFullScreenIntentSettings,

  requestCorePermissions,

} from "./services/permissions";

import {
  buildCallAcceptUrl,
  getCachedPushTokens,
  handleForegroundPush,
  registerBackgroundNotificationTask,
  registerForPush,
  resolveLaunchRoute,
  routeFromNotificationResponse,
  type PushTokens,
} from "./services/notifications";

import {

  cancelIncomingCall,

  consumePendingRoute,

  ensureNotificationChannels,

  handleCallNotificationEvent,

  handleCallTimeout,

  parseIncomingCall,

  setCallActionListener,

  showIncomingCall,

} from "./services/calls";

import {

  INJECTED_BEFORE_CONTENT_LOADED,

  buildCallEndedInjection,

  buildNavigateInjection,

  buildPermissionsStateInjection,

  buildPushTokenInjection,

  parseWebMessage,

} from "./services/bridge";



ExpoSplash.preventAutoHideAsync().catch(() => undefined);



const KEEP_AWAKE_TAG = "orbit-call";



function toOrbitUrl(incoming: string | null | undefined): string | null {

  if (!incoming) return null;

  try {

    const parsed = Linking.parse(incoming);

    if (parsed.scheme === "orbit") {

      // expo-linking treats the first segment of a custom-scheme URL as the hostname:

      // orbit://calls/abc -> hostname "calls", path "abc". Re-join them into a web path.

      const path = [parsed.hostname, parsed.path]

        .filter((part): part is string => typeof part === "string" && part.length > 0)

        .join("/")

        .replace(/^\/+/, "");

      const target = new URL(path, ORBIT_URL);

      Object.entries(parsed.queryParams ?? {}).forEach(([key, value]) => {

        if (typeof value === "string") target.searchParams.set(key, value);

      });

      return target.toString();

    }

    const url = new URL(incoming);

    if (url.host === ORBIT_HOST) return url.toString();

  } catch {

    return null;

  }

  return null;

}



function stripQuery(url: string): string {

  return url.split(/[?#]/)[0].replace(/\/+$/, "");

}



/** Module scope — must be declared before App() executes its first useRef (Temporal Dead Zone). */

const EMPTY_TOKENS: PushTokens = {

  fcmToken: null,

  expoPushToken: null,

  deviceHash: null,

  canUseFullScreenIntent: false,

};



export default function App() {

  const webviewRef = useRef<WebView>(null);

  const canGoBackRef = useRef(false);

  const currentUrlRef = useRef(ORBIT_URL);

  const hasLoadedOnceRef = useRef(false);

  const loadFailedRef = useRef(false);

  const attemptRef = useRef(0);

  const pushTokensRef = useRef<PushTokens>(EMPTY_TOKENS);

  const pendingRouteRef = useRef<string | null>(null);

  const isConnectedRef = useRef(true);

  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);



  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  const [webKey, setWebKey] = useState(0);

  const [progress, setProgress] = useState(0);

  const [splashVisible, setSplashVisible] = useState(true);

  const [splashMounted, setSplashMounted] = useState(true);

  const [splashStatus, setSplashStatus] = useState<SplashStatus>("connecting");

  const [attempt, setAttempt] = useState(0);

  const [offlineReason, setOfflineReason] = useState<OfflineReason | null>(null);

  const [retrying, setRetrying] = useState(false);



  const clearTimers = useCallback(() => {

    if (hintTimer.current) clearTimeout(hintTimer.current);

    if (retryTimer.current) clearTimeout(retryTimer.current);

    if (hardTimer.current) clearTimeout(hardTimer.current);

    hintTimer.current = null;

    retryTimer.current = null;

    hardTimer.current = null;

  }, []);



  const armLoadingTimers = useCallback(() => {

    clearTimers();

    hintTimer.current = setTimeout(() => {

      setSplashStatus((current) => (current === "connecting" ? "waking" : current));

    }, COLD_START.hintAfterMs);

    hardTimer.current = setTimeout(() => {

      if (!hasLoadedOnceRef.current) {

        setSplashVisible(false);

        setOfflineReason("timeout");

        setRetrying(false);

      }

    }, COLD_START.hardTimeoutMs);

  }, [clearTimers]);



  const reloadWebView = useCallback(() => {

    loadFailedRef.current = false;

    setRetrying(true);

    if (webviewRef.current) {

      webviewRef.current.reload();

    } else {

      setWebKey((key) => key + 1);

    }

  }, []);



  const showSplashAgain = useCallback(

    (status: SplashStatus) => {

      setOfflineReason(null);

      setSplashStatus(status);

      setSplashMounted(true);

      setSplashVisible(true);

      armLoadingTimers();

    },

    [armLoadingTimers],

  );



  const navigateTo = useCallback((url: string) => {

    currentUrlRef.current = url;

    if (hasLoadedOnceRef.current && webviewRef.current) {

      webviewRef.current.injectJavaScript(buildNavigateInjection(url));

    } else {

      pendingRouteRef.current = url;

    }

  }, []);



  const injectPushTokens = useCallback(() => {

    const tokens = pushTokensRef.current;

    if (!tokens.fcmToken && !tokens.expoPushToken && !tokens.deviceHash) return;

    webviewRef.current?.injectJavaScript(buildPushTokenInjection(tokens));

  }, []);



  const scheduleColdStartRetry = useCallback(

    (reason: OfflineReason) => {

      const index = attemptRef.current;

      const delay = COLD_START.retryDelaysMs[index];

      if (delay === undefined || !isConnectedRef.current) {

        clearTimers();

        setSplashVisible(false);

        setOfflineReason(isConnectedRef.current ? reason : "offline");

        setRetrying(false);

        return;

      }

      attemptRef.current = index + 1;

      setAttempt(index + 1);

      setSplashStatus("retrying");

      retryTimer.current = setTimeout(() => {

        loadFailedRef.current = false;

        webviewRef.current?.reload();

      }, delay);

    },

    [clearTimers],

  );



  const handleManualRetry = useCallback(() => {

    attemptRef.current = 0;

    setAttempt(0);

    if (!hasLoadedOnceRef.current) {

      showSplashAgain("connecting");

    }

    reloadWebView();

  }, [reloadWebView, showSplashAgain]);



  /* ---------------------------------------------------------------- boot */

  useEffect(() => {

    let cancelled = false;



    const boot = async () => {

      if (Platform.OS === "android") {

        await NavigationBar.setBackgroundColorAsync(COLORS.bg).catch(() => undefined);

        await NavigationBar.setButtonStyleAsync("light").catch(() => undefined);

      }



      const [deepLink, launchRoute, cachedTokens] = await Promise.all([

        Linking.getInitialURL(),

        resolveLaunchRoute(),

        getCachedPushTokens(),

      ]);

      pushTokensRef.current = cachedTokens;



      const startUrl = launchRoute ?? toOrbitUrl(deepLink) ?? ORBIT_URL;

      currentUrlRef.current = startUrl;

      if (!cancelled) setInitialUrl(startUrl);

      armLoadingTimers();

      await ExpoSplash.hideAsync().catch(() => undefined);



      await ensureNotificationChannels();

      await requestCorePermissions();

      await configureCallAudioSession().catch(() => undefined);

      await registerBackgroundNotificationTask().catch((error) =>

        console.warn("[Orbit] background task registration failed", error),

      );



      const tokens = await registerForPush();

      if (tokens.fcmToken || tokens.expoPushToken || tokens.deviceHash) {

        pushTokensRef.current = tokens;

        if (hasLoadedOnceRef.current) injectPushTokens();

      }

    };



    boot().catch((error) => console.warn("[Orbit] boot failed", error));

    return () => {

      cancelled = true;

      clearTimers();

    };

  }, [armLoadingTimers, clearTimers, injectPushTokens]);



  /* ----------------------------------------------------------- network */

  useEffect(() => {

    const onState = (state: NetInfoState) => {

      const online = state.isConnected !== false && state.isInternetReachable !== false;

      const wasOnline = isConnectedRef.current;

      isConnectedRef.current = online;



      if (!online) {

        clearTimers();

        setSplashVisible(false);

        setOfflineReason("offline");

        setRetrying(false);

        return;

      }

      if (!wasOnline) {

        attemptRef.current = 0;

        setAttempt(0);

        if (!hasLoadedOnceRef.current) showSplashAgain("connecting");

        reloadWebView();

      }

    };



    const unsubscribe = NetInfo.addEventListener(onState);

    NetInfo.fetch().then(onState).catch(() => undefined);

    return unsubscribe;

  }, [clearTimers, reloadWebView, showSplashAgain]);



  /* --------------------------------------------------------- back button */

  useEffect(() => {

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {

      if (offlineReason) return false;

      if (canGoBackRef.current && webviewRef.current) {

        webviewRef.current.goBack();

        return true;

      }

      return false;

    });

    return () => sub.remove();

  }, [offlineReason]);



  /* ----------------------------------------------------------- deep links */

  useEffect(() => {

    const sub = Linking.addEventListener("url", ({ url }) => {

      const target = toOrbitUrl(url);

      if (target) navigateTo(target);

    });

    return () => sub.remove();

  }, [navigateTo]);



  /* -------------------------------------------------- notifications & calls */

  useEffect(() => {

    setCallActionListener((action, call) => {
      if (action === "accept") {
        consumePendingRoute().then((route) => {
          const acceptUrl = route ?? buildCallAcceptUrl(call);
          navigateTo(acceptUrl);
        });
        return;
      }
      webviewRef.current?.injectJavaScript(buildCallEndedInjection());
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      handleCallNotificationEvent(type, detail).catch(() => undefined);
    });

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      handleForegroundPush(notification).catch(() => undefined);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeFromNotificationResponse(response);
      if (route) navigateTo(route);
    });

    const appStateSub = AppState.addEventListener("change", async (state: AppStateStatus) => {
      if (state !== "active") return;
      await handleCallTimeout();

      // Check if user tapped Accept on notification while app was backgrounded
      const pending = await consumePendingRoute();
      if (pending) {
        navigateTo(pending);
        return;
      }

      const displayed = await notifee.getDisplayedNotifications();
      const ringing = displayed.find((n) => n.id === CALL_NOTIFICATION_ID);
      if (!ringing?.notification.data) return;
      const call = parseIncomingCall(ringing.notification.data as Record<string, unknown>);
      if (!call) return;
      if (stripQuery(currentUrlRef.current) !== stripQuery(call.url)) {
        navigateTo(call.url);
      }
    });



    return () => {

      setCallActionListener(null);

      unsubscribeNotifee();

      receivedSub.remove();

      responseSub.remove();

      appStateSub.remove();

    };

  }, [navigateTo]);



  /* ------------------------------------------------------- webview events */

  const onLoadStart = useCallback(() => {

    loadFailedRef.current = false;

  }, []);



  const onLoadProgress = useCallback((event: WebViewProgressEvent) => {

    setProgress(event.nativeEvent.progress);

  }, []);



  const onLoadEnd = useCallback(() => {

    if (loadFailedRef.current) return;

    clearTimers();

    hasLoadedOnceRef.current = true;

    attemptRef.current = 0;

    setAttempt(0);

    setProgress(1);

    setRetrying(false);

    setOfflineReason(null);

    setSplashStatus("ready");

    setSplashVisible(false);

    injectPushTokens();



    const pending = pendingRouteRef.current;

    if (pending) {

      pendingRouteRef.current = null;

      webviewRef.current?.injectJavaScript(buildNavigateInjection(pending));

    }

  }, [clearTimers, injectPushTokens]);



  const onError = useCallback(

    (event: WebViewErrorEvent) => {

      loadFailedRef.current = true;

      const { description } = event.nativeEvent;

      const looksOffline = !isConnectedRef.current || /ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|ERR_ADDRESS_UNREACHABLE/i.test(description ?? "");

      if (looksOffline) {

        clearTimers();

        setSplashVisible(false);

        setOfflineReason("offline");

        setRetrying(false);

        return;

      }

      if (hasLoadedOnceRef.current) {

        setOfflineReason("server");

        setRetrying(false);

        return;

      }

      scheduleColdStartRetry("server");

    },

    [clearTimers, scheduleColdStartRetry],

  );



  const onHttpError = useCallback(

    (event: WebViewHttpErrorEvent) => {

      const { statusCode, url } = event.nativeEvent;

      if (statusCode < 500) return;

      if (stripQuery(url) !== stripQuery(currentUrlRef.current) && !url.startsWith(ORBIT_URL)) return;

      loadFailedRef.current = true;

      if (hasLoadedOnceRef.current) {

        setOfflineReason("server");

        setRetrying(false);

        return;

      }

      setSplashStatus("waking");

      scheduleColdStartRetry("server");

    },

    [scheduleColdStartRetry],

  );



  const onRenderProcessGone = useCallback((_event: WebViewRenderProcessGoneEvent) => {

    hasLoadedOnceRef.current = false;

    setWebKey((key) => key + 1);

    setSplashStatus("connecting");

    setSplashMounted(true);

    setSplashVisible(true);

  }, []);



  const onNavigationStateChange = useCallback((nav: WebViewNavigation) => {

    canGoBackRef.current = nav.canGoBack;

    if (nav.url) currentUrlRef.current = nav.url;

  }, []);



  const onShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest) => {

    const { url } = request;

    if (/^(about:blank|blob:|data:|javascript:)/i.test(url)) return true;

    try {

      const parsed = new URL(url);

      if (parsed.host === ORBIT_HOST) return true;

      if (parsed.protocol === "http:" || parsed.protocol === "https:") {

        Linking.openURL(url).catch(() => undefined);

        return false;

      }

      Linking.openURL(url).catch(() => undefined);

      return false;

    } catch {

      return true;

    }

  }, []);



  const onMessage = useCallback(

    (event: WebViewMessageEvent) => {

      const message = parseWebMessage(event.nativeEvent.data);

      if (!message) return;



      switch (message.type) {

        case "BRIDGE_READY":

          injectPushTokens();

          break;

        case "INCOMING_CALL": {

          const call = parseIncomingCall({ type: "incoming_call", ...message.payload });

          if (!call) break;

          if (AppState.currentState === "active") break;

          showIncomingCall(call).catch(() => undefined);

          break;

        }

        case "CALL_STARTED":

          activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);

          cancelIncomingCall().catch(() => undefined);

          break;

        case "CALL_ENDED":

          deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);

          cancelIncomingCall().catch(() => undefined);

          break;

        case "REGISTER_PUSH":
        case "ORBIT_GET_PUSH_TOKEN" as any:

          registerForPush()

            .then((tokens) => {

              if (tokens.fcmToken || tokens.expoPushToken || tokens.deviceHash) {

                pushTokensRef.current = tokens;

                injectPushTokens();

              }

            })

            .catch(() => undefined);

          break;

        case "GET_PERMISSIONS_STATE":

          getPermissionSnapshot()

            .then((snapshot) => {

              webviewRef.current?.injectJavaScript(

                buildPermissionsStateInjection({

                  camera: snapshot.camera,

                  microphone: snapshot.microphone,

                  mediaLibrary: snapshot.mediaLibrary,

                  notifications: snapshot.notifications,

                  fullScreenIntent: snapshot.fullScreenIntent,

                }),

              );

            })

            .catch(() => undefined);

          break;

        case "REQUEST_PERMISSIONS":
        case "ORBIT_REQUEST_CALL_PERMISSIONS" as any:

          requestCorePermissions().catch(() => undefined);

          break;

        case "OPEN_EXTERNAL":

          if (message.payload?.url) Linking.openURL(message.payload.url).catch(() => undefined);

          break;

        case "OPEN_NOTIFICATION_SETTINGS":

          openFullScreenIntentSettings().catch(() => undefined);

          break;

        case "OPEN_BATTERY_SETTINGS":

          openBatteryOptimisationSettings().catch(() => undefined);

          break;

        case "HAPTIC":
        case "ORBIT_HAPTIC" as any: {
          const style = (message as any).payload?.style ?? "light";
          const pattern = (message as any).pattern;
          if (pattern && typeof pattern === "number") {
            Vibration.vibrate(pattern);
          } else {
            Vibration.vibrate(style === "heavy" ? 40 : style === "medium" ? 20 : 10);
          }
          break;
        }

        default:

          break;

      }

    },

    [injectPushTokens],

  );



  const source = useMemo(() => ({ uri: initialUrl ?? ORBIT_URL }), [initialUrl]);



  return (

    <SafeAreaProvider>

      <StatusBar style="light" backgroundColor={COLORS.bg} translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>

        <View style={styles.container}>

          {initialUrl && (

            <WebView

              key={webKey}

              ref={webviewRef}

              source={source}

              style={styles.webview}

              containerStyle={styles.webviewContainer}

              originWhitelist={["https://*", "http://*", "about:*", "blob:*", "data:*"]}

              applicationNameForUserAgent={SHELL_USER_AGENT_SUFFIX}

              javaScriptEnabled

              domStorageEnabled

              allowFileAccess

              allowFileAccessFromFileURLs={false}

              allowUniversalAccessFromFileURLs={false}

              allowsInlineMediaPlayback

              mediaPlaybackRequiresUserAction={false}

              allowsFullscreenVideo

              allowsProtectedMedia

              mediaCapturePermissionGrantType="grant"

              javaScriptCanOpenWindowsAutomatically

              setSupportMultipleWindows={false}

              sharedCookiesEnabled

              thirdPartyCookiesEnabled

              cacheEnabled

              cacheMode="LOAD_DEFAULT"

              mixedContentMode="never"

              geolocationEnabled

              pullToRefreshEnabled

              overScrollMode="never"

              textZoom={100}

              setBuiltInZoomControls={false}

              setDisplayZoomControls={false}

              nestedScrollEnabled

              androidLayerType="hardware"

              startInLoadingState={false}

              keyboardDisplayRequiresUserAction={false}

              webviewDebuggingEnabled={__DEV__}

              injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE_CONTENT_LOADED}

              injectedJavaScriptBeforeContentLoadedForMainFrameOnly

              onMessage={onMessage}

              onLoadStart={onLoadStart}

              onLoadProgress={onLoadProgress}

              onLoadEnd={onLoadEnd}

              onError={onError}

              onHttpError={onHttpError}

              onRenderProcessGone={onRenderProcessGone}

              onNavigationStateChange={onNavigationStateChange}

              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}

            />

          )}



          {offlineReason && (

            <OfflineScreen reason={offlineReason} retrying={retrying} onRetry={handleManualRetry} attempt={attempt} />

          )}



          {splashMounted && (

            <SplashScreen

              visible={splashVisible}

              progress={progress}

              status={splashStatus}

              attempt={attempt}

              onHidden={() => setSplashMounted(false)}

            />

          )}

        </View>

      </SafeAreaView>

    </SafeAreaProvider>

  );

}



const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor: COLORS.bg,

  },

  container: {

    flex: 1,

    backgroundColor: COLORS.bg,

  },

  webview: {

    flex: 1,

    backgroundColor: COLORS.bg,

  },

  webviewContainer: {

    backgroundColor: COLORS.bg,

  },

});
