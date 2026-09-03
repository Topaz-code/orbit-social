import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  RadialGradient,
} from 'react-native-svg';

export function AnimatedSplash() {
  const pulse = useSharedValue(0);
  const orbitRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Breathing pulse glow
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Continuous smooth orbit rotation
    orbitRotation.value = withRepeat(
      withTiming(360, {
        duration: 5000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Fade in text
    textOpacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    });
  }, [pulse, orbitRotation, textOpacity]);

  const animatedGlowStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.9, 1.25]);
    const opacity = interpolate(pulse.value, [0, 1], [0.3, 0.7]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const animatedSatelliteStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${orbitRotation.value}deg` }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Ambient Pulsing Glow behind Planet */}
      <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
        <Svg width={220} height={220} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="glowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#D0A56A" stopOpacity="0.5" />
              <Stop offset="60%" stopColor="#496D6B" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#171A1C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="90" fill="url(#glowGrad)" />
        </Svg>
      </Animated.View>

      {/* Orbit Central Planet & Rings */}
      <View style={styles.logoWrapper}>
        <Svg viewBox="0 0 100 100" width={110} height={110}>
          <Defs>
            <LinearGradient id="splashPlanetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#D0A56A" />
              <Stop offset="100%" stopColor="#71877B" />
            </LinearGradient>
            <LinearGradient id="splashRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#496D6B" />
              <Stop offset="100%" stopColor="#D0A56A" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="22" fill="url(#splashPlanetGrad)" />
          <Circle cx="43" cy="43" r="6" fill="#D9D0B8" opacity={0.65} />
          <Ellipse
            cx="50"
            cy="50"
            rx="44"
            ry="18"
            fill="none"
            stroke="url(#splashRingGrad)"
            strokeWidth="4"
            transform="rotate(-30, 50, 50)"
            strokeDasharray="180 8"
          />
        </Svg>

        {/* Orbiting Satellite Dot */}
        <Animated.View style={[styles.satelliteOrbit, animatedSatelliteStyle]}>
          <View style={styles.satelliteBody} />
        </Animated.View>
      </View>

      {/* Brand Typography */}
      <Animated.View style={[styles.textWrapper, animatedTextStyle]}>
        <Text style={styles.title}>ORBIT</Text>
        <Text style={styles.subtitle}>Private Social Network</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  satelliteOrbit: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  satelliteBody: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0A56A',
    borderWidth: 1.5,
    borderColor: '#D9D0B8',
    shadowColor: '#D0A56A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#D9D0B8',
  },
  subtitle: {
    fontSize: 12,
    color: '#A8AAA0',
    letterSpacing: 1.5,
    marginTop: 6,
    textTransform: 'uppercase',
  },
});

export default AnimatedSplash;
