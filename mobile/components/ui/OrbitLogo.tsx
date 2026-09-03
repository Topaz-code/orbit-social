import React, { useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface OrbitLogoProps {
  size?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function OrbitLogo({ size = 32, animated = false, style }: OrbitLogoProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 6000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [animated, rotation]);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {animated ? (
        <Animated.View style={[{ width: size, height: size }, animatedRingStyle]}>
          <Svg viewBox="0 0 100 100" width={size} height={size}>
            <Defs>
              <LinearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#D0A56A" />
                <Stop offset="100%" stopColor="#71877B" />
              </LinearGradient>
              <LinearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#496D6B" />
                <Stop offset="100%" stopColor="#D0A56A" />
              </LinearGradient>
            </Defs>
            <Circle cx="50" cy="50" r="22" fill="url(#orbitGrad)" />
            <Circle cx="43" cy="43" r="6" fill="#D9D0B8" opacity={0.6} />
            <Ellipse
              cx="50"
              cy="50"
              rx="44"
              ry="18"
              fill="none"
              stroke="url(#accentGrad)"
              strokeWidth="4.5"
              transform="rotate(-30, 50, 50)"
              strokeDasharray="180 8"
            />
            <Circle cx="82" cy="32" r="5.5" fill="#D0A56A" />
            <Circle cx="80" cy="30" r="1.5" fill="#D9D0B8" />
          </Svg>
        </Animated.View>
      ) : (
        <Svg viewBox="0 0 100 100" width={size} height={size}>
          <Defs>
            <LinearGradient id="orbitGradStatic" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#D0A56A" />
              <Stop offset="100%" stopColor="#71877B" />
            </LinearGradient>
            <LinearGradient id="accentGradStatic" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#496D6B" />
              <Stop offset="100%" stopColor="#D0A56A" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="50" r="22" fill="url(#orbitGradStatic)" />
          <Circle cx="43" cy="43" r="6" fill="#D9D0B8" opacity={0.6} />
          <Ellipse
            cx="50"
            cy="50"
            rx="44"
            ry="18"
            fill="none"
            stroke="url(#accentGradStatic)"
            strokeWidth="4.5"
            transform="rotate(-30, 50, 50)"
            strokeDasharray="180 8"
          />
          <Circle cx="82" cy="32" r="5.5" fill="#D0A56A" />
          <Circle cx="80" cy="30" r="1.5" fill="#D9D0B8" />
        </Svg>
      )}
    </View>
  );
}
export default OrbitLogo;
