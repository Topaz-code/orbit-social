import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, Text, View, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '../src/config/theme';

const GOLD = THEME.colors.gold;
const GOLD_LIGHT = THEME.colors.goldLight;
const SLATE = THEME.colors.textSecondary;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/** Deterministic PRNG so the starfield is stable across renders. */
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260903);
const STARS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: rand() * 100,
  top: rand() * 100,
  size: 1 + rand() * 2.2,
  opacity: 0.1 + rand() * 0.45,
  twinkle: i % 4 === 0,
}));

type StarProps = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  twinkle: boolean;
};

function Star({ left, top, size, opacity, twinkle }: StarProps) {
  const tw = useSharedValue(opacity);

  useEffect(() => {
    if (!twinkle) return;
    tw.value = withRepeat(
      withSequence(
        withTiming(opacity * 0.25, { duration: 900 + size * 200 }),
        withTiming(opacity, { duration: 900 + size * 200 }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(tw);
  }, [twinkle, opacity, size, tw]);

  const style = useAnimatedStyle(() => ({ opacity: tw.value }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${left}%`,
          top: `${top}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
}

function EllipsisDot({ delay }: { delay: number }) {
  const o = useSharedValue(0.2);

  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(1, { duration: 320 })),
        withTiming(0.2, { duration: 420 }),
        withDelay(760, withTiming(0.2, { duration: 1 })),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(o);
  }, [delay, o]);

  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return <Animated.Text style={[styles.dot, style]}>•</Animated.Text>;
}

export type SplashScreenHandle = {
  /** Fade the overlay out and notify the parent once it's fully gone. */
  hide: () => void;
  /** Bring the overlay back — used while the backend cold-starts. */
  show: () => void;
};

type Props = {
  /** WebView onLoadProgress value, 0..1. */
  progress: number;
  /** Whether the overlay should intercept touches. */
  active: boolean;
  onHidden: () => void;
};

const SplashScreen = forwardRef<SplashScreenHandle, Props>(
  ({ progress, active, onHidden }, ref) => {
    const overlay = useSharedValue(1);
    const glow = useSharedValue(0);
    const orbit = useSharedValue(0);
    const breathe = useSharedValue(0);
    const bar = useSharedValue(0);
    const trackW = useSharedValue(0);
    const onHiddenRef = useRef(onHidden);
    onHiddenRef.current = onHidden;

    // Ambient animation loops.
    useEffect(() => {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      orbit.value = withRepeat(
        withTiming(360, { duration: 9000, easing: Easing.linear }),
        -1,
        false,
      );
      breathe.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      );
      return () => {
        cancelAnimation(glow);
        cancelAnimation(orbit);
        cancelAnimation(breathe);
      };
    }, [glow, orbit, breathe]);

    // Smoothly track the WebView progress prop.
    useEffect(() => {
      bar.value = withTiming(clamp01(progress), {
        duration: 240,
        easing: Easing.out(Easing.quad),
      });
    }, [progress, bar]);

    const hide = () => {
      cancelAnimation(overlay);
      overlay.value = withTiming(
        0,
        { duration: 480, easing: Easing.inOut(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(onHiddenRef.current)();
        },
      );
    };

    const show = () => {
      cancelAnimation(overlay);
      bar.value = 0;
      overlay.value = withTiming(1, { duration: 200 });
    };

    useImperativeHandle(ref, () => ({ hide, show }), []);

    const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

    const glowStyle = useAnimatedStyle(() => ({
      opacity: interpolate(glow.value, [0, 1], [0.18, 0.5], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(glow.value, [0, 1], [0.9, 1.18], Extrapolation.CLAMP) },
      ],
    }));

    const orbitStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${orbit.value}deg` }],
    }));

    const textStyle = useAnimatedStyle(() => ({
      opacity: interpolate(breathe.value, [0, 1], [0.82, 1], Extrapolation.CLAMP),
    }));

    const barStyle = useAnimatedStyle(() => ({
      width: bar.value * trackW.value,
    }));

    const onTrackLayout = (event: LayoutChangeEvent) => {
      trackW.value = event.nativeEvent.layout.width;
    };

    return (
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        pointerEvents={active ? 'auto' : 'none'}
        accessibilityElementsHidden={!active}
        importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
      >
        {STARS.map((s) => (
          <Star key={s.id} {...s} />
        ))}

        <View style={styles.center}>
          <View style={styles.planetWrap}>
            <View style={styles.glowSoft} />
            <Animated.View style={[styles.glow, glowStyle]} />
            <View style={[styles.ring, styles.ringBack]} />
            <LinearGradient
              colors={[GOLD_LIGHT, GOLD, '#8a5a1e']}
              start={{ x: 0.2, y: 0.1 }}
              end={{ x: 0.85, y: 0.9 }}
              style={styles.planet}
            >
              <View style={styles.planetHighlight} />
            </LinearGradient>
            <View style={[styles.ring, styles.ringFront]} />
            <Animated.View style={[styles.orbitContainer, orbitStyle]}>
              <View style={styles.satellite} />
            </Animated.View>
          </View>

          <Animated.Text style={[styles.title, textStyle]}>ORBIT</Animated.Text>
          <View style={styles.connectingRow}>
            <Animated.Text style={[styles.connecting, textStyle]}>
              Connecting to Orbit
            </Animated.Text>
            <View style={styles.dots}>
              <EllipsisDot delay={0} />
              <EllipsisDot delay={180} />
              <EllipsisDot delay={360} />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.percent}>{`${Math.round(clamp01(progress) * 100)}%`}</Text>
          <View style={styles.track} onLayout={onTrackLayout}>
            <Animated.View style={[styles.barFill, barStyle]} />
          </View>
        </View>
      </Animated.View>
    );
  },
);

SplashScreen.displayName = 'SplashScreen';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#e2e8f0',
  },
  center: { alignItems: 'center' },
  planetWrap: { width: 210, height: 210, alignItems: 'center', justifyContent: 'center' },
  glowSoft: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: GOLD,
    opacity: 0.08,
  },
  glow: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: GOLD,
  },
  ring: {
    position: 'absolute',
    top: 60,
    left: -15,
    width: 240,
    height: 90,
    borderRadius: 45,
  },
  ringBack: {
    borderWidth: 2,
    borderColor: 'rgba(212,162,78,0.85)',
    transform: [{ rotate: '18deg' }],
  },
  ringFront: {
    borderWidth: 1.5,
    borderColor: 'rgba(212,162,78,0.45)',
    transform: [{ rotate: '-14deg' }],
  },
  planet: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 18,
  },
  planetHighlight: {
    position: 'absolute',
    top: 14,
    left: 20,
    width: 46,
    height: 30,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.28)',
    transform: [{ rotate: '-24deg' }],
  },
  orbitContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 210,
    height: 210,
  },
  satellite: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GOLD_LIGHT,
    shadowColor: GOLD_LIGHT,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    marginTop: 30,
    fontSize: 42,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 6,
    textAlign: 'center',
  },
  connectingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  connecting: { fontSize: 15, fontWeight: '500', color: SLATE },
  dots: { flexDirection: 'row', marginLeft: 4 },
  dot: { fontSize: 18, color: GOLD, marginHorizontal: 1 },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    alignItems: 'center',
  },
  percent: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: SLATE,
  },
  track: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(212,162,78,0.16)',
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default SplashScreen;
