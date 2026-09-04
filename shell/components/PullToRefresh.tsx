import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { THEME } from '../src/config/theme';

const GOLD = THEME.colors.gold;
const MAX_PULL = 120;
const REFRESH_THRESHOLD = 70;
const HOLD_OFFSET = 64;

export type PullToRefreshHandle = {
  /** Called from the WebView's onScroll with the current contentOffset.y. */
  setScrollY: (y: number) => void;
};

type Props = {
  children: React.ReactNode;
  onRefresh: () => void;
  refreshing: boolean;
};

/**
 * Native-feeling pull-to-refresh for Android.
 *
 * react-native-webview's `pullToRefreshEnabled` prop is iOS-only, so we drive
 * the gesture ourselves: a Pan gesture that only activates while the WebView
 * is scrolled to the very top. Any other scroll is left untouched, so page
 * scrolling stays fully native.
 */
const PullToRefresh = forwardRef<PullToRefreshHandle, Props>(
  ({ children, onRefresh, refreshing }, ref) => {
    const translateY = useSharedValue(0);
    const [atTop, setAtTop] = useState(true);
    const atTopRef = useRef(true);
    const startAtTop = useRef(true);
    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;

    const setScrollY = useCallback((y: number) => {
      const next = y <= 1; // small tolerance for float rounding
      atTopRef.current = next;
      setAtTop((prev) => (prev === next ? prev : next));
    }, []);

    useImperativeHandle(ref, () => ({ setScrollY }), [setScrollY]);

    const pan = useMemo(
      () =>
        Gesture.Pan()
          .enabled(atTop && !refreshing)
          .activeOffsetY([6, 9999])
          .failOffsetY([-9999, -6])
          .onBegin(() => {
            startAtTop.current = atTopRef.current;
          })
          .onUpdate((event) => {
            if (!startAtTop.current) return;
            if (event.translationY <= 0) {
              translateY.value = 0;
              return;
            }
            translateY.value = Math.min(event.translationY * 0.5, MAX_PULL);
          })
          .onEnd(() => {
            if (!startAtTop.current) {
              translateY.value = withTiming(0, { duration: 180 });
              return;
            }
            if (translateY.value >= REFRESH_THRESHOLD) {
              translateY.value = withTiming(HOLD_OFFSET, {
                duration: 160,
                easing: Easing.out(Easing.quad),
              });
              runOnJS(onRefreshRef.current)();
            } else {
              translateY.value = withTiming(0, {
                duration: 220,
                easing: Easing.out(Easing.quad),
              });
            }
          })
          .onFinalize(() => {
            if (!startAtTop.current) {
              translateY.value = withTiming(0, { duration: 140 });
            }
          }),
      [atTop, refreshing, translateY],
    );

    // Collapse the spinner once the reload has finished.
    useEffect(() => {
      if (!refreshing) {
        translateY.value = withTiming(0, { duration: 220 });
      }
    }, [refreshing, translateY]);

    const wrapperStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const arrowStyle = useAnimatedStyle(() => ({
      transform: [
        {
          rotate: `${interpolate(
            translateY.value,
            [0, REFRESH_THRESHOLD],
            [0, 180],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    }));

    return (
      <View style={styles.container}>
        <GestureDetector gesture={pan}>
          <View style={styles.childWrap} collapsable={false}>
            {children}
          </View>
        </GestureDetector>

        <Animated.View pointerEvents="none" style={[styles.spinner, wrapperStyle]}>
          <View style={styles.badge}>
            {refreshing ? (
              <ActivityIndicator color={GOLD} size="small" />
            ) : (
              <Animated.Text style={[styles.arrow, arrowStyle]}>↓</Animated.Text>
            )}
          </View>
        </Animated.View>
      </View>
    );
  },
);

PullToRefresh.displayName = 'PullToRefresh';

const styles = StyleSheet.create({
  container: { flex: 1 },
  childWrap: { flex: 1 },
  spinner: {
    position: 'absolute',
    top: -64,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  arrow: { fontSize: 22, color: GOLD, fontWeight: '800', lineHeight: 24 },
});

export default PullToRefresh;
