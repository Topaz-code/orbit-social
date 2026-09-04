import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { THEME } from '../src/config/theme';

const GOLD = THEME.colors.gold;
const GOLD_LIGHT = THEME.colors.goldLight;
const GOLD_DARK = THEME.colors.goldDark;
const SLATE = THEME.colors.textSecondary;

type Props = {
  onRetry: () => void;
  retrying?: boolean;
};

const OfflineScreen = ({ onRetry, retrying = false }: Props) => {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(glow);
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.12, 0.3], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(glow.value, [0, 1], [0.94, 1.12], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <View style={[styles.ring, styles.ringBack]} />
        <LinearGradient
          colors={[GOLD_LIGHT, GOLD, '#8a5a1e']}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.85, y: 0.9 }}
          style={styles.planet}
        />
        <View style={[styles.ring, styles.ringFront]} />
        <View style={styles.satellite} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>!</Text>
        </View>
      </View>

      <Text style={styles.title}>You are out of Orbit</Text>
      <Text style={styles.subtitle}>Check your internet connection and try again.</Text>

      <Pressable
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        style={({ pressed }) => [styles.buttonWrap, pressed && styles.buttonPressed]}
      >
        <LinearGradient
          colors={[GOLD_LIGHT, GOLD]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {retrying ? (
            <ActivityIndicator color={THEME.colors.void} />
          ) : (
            <Text style={styles.buttonText}>Try Again</Text>
          )}
        </LinearGradient>
      </Pressable>

      <Text style={styles.hint}>We'll reconnect automatically when you're back online.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.void,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: GOLD,
  },
  ring: {
    position: 'absolute',
    top: 53,
    left: -15,
    width: 220,
    height: 84,
    borderRadius: 42,
  },
  ringBack: {
    borderWidth: 1.5,
    borderColor: 'rgba(212,162,78,0.5)',
    transform: [{ rotate: '18deg' }],
  },
  ringFront: {
    borderWidth: 1,
    borderColor: 'rgba(212,162,78,0.28)',
    transform: [{ rotate: '-14deg' }],
  },
  planet: { width: 110, height: 110, borderRadius: 55, opacity: 0.92 },
  satellite: {
    position: 'absolute',
    top: 22,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GOLD_LIGHT,
    opacity: 0.9,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: THEME.colors.card,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: GOLD, fontSize: 16, fontWeight: '800' },
  title: {
    marginTop: 26,
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: SLATE,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonWrap: {
    marginTop: 32,
    borderRadius: 26,
    shadowColor: GOLD,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  button: {
    minWidth: 190,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: THEME.colors.void, fontWeight: '800', fontSize: 16, letterSpacing: 0.4 },
  hint: { marginTop: 28, fontSize: 13, color: THEME.colors.textMuted, textAlign: 'center' },
});

export default OfflineScreen;
