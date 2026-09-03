import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({
  className = '',
  style,
  width,
  height,
  borderRadius = 12,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 1], [0.35, 0.85]);
    return {
      opacity,
    };
  });

  const customStyle: ViewStyle = {
    borderRadius,
    ...(width !== undefined && { width: typeof width === 'number' ? width : (width as any) }),
    ...(height !== undefined && { height: typeof height === 'number' ? height : (height as any) }),
  };

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#2B3940',
        },
        customStyle,
        animatedStyle,
        style,
      ]}
      className={className}
    />
  );
}

export function SkeletonPost() {
  return (
    <View className="rounded-2xl border border-[#3A4B4D] bg-[#202A2D] p-4 mb-4 shadow-sm">
      {/* Author Header */}
      <View className="flex-row items-center mb-3">
        <Skeleton width={42} height={42} borderRadius={21} className="mr-3" />
        <View className="flex-1">
          <Skeleton width={130} height={14} borderRadius={6} className="mb-1.5" />
          <Skeleton width={80} height={10} borderRadius={4} />
        </View>
      </View>

      {/* Post Text */}
      <View className="mb-3 space-y-2">
        <Skeleton width="100%" height={12} borderRadius={4} className="mb-1.5" />
        <Skeleton width="92%" height={12} borderRadius={4} className="mb-1.5" />
        <Skeleton width="65%" height={12} borderRadius={4} />
      </View>

      {/* Media Box */}
      <Skeleton width="100%" height={180} borderRadius={16} className="mb-3" />

      {/* Action Bar */}
      <View className="flex-row items-center justify-between pt-3 border-t border-[#3A4B4D]/50">
        <View className="flex-row items-center space-x-6">
          <Skeleton width={45} height={16} borderRadius={8} className="mr-4" />
          <Skeleton width={45} height={16} borderRadius={8} className="mr-4" />
          <Skeleton width={45} height={16} borderRadius={8} />
        </View>
        <Skeleton width={20} height={20} borderRadius={6} />
      </View>
    </View>
  );
}

export function SkeletonMessage({ isMine = false }: { isMine?: boolean }) {
  return (
    <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`px-4 py-3 rounded-2xl max-w-[75%] ${
          isMine
            ? 'bg-[#496D6B]/40 rounded-br-xs'
            : 'bg-[#2B3940] border border-[#3A4B4D] rounded-bl-xs'
        }`}
      >
        <Skeleton width={isMine ? 120 : 160} height={12} borderRadius={4} className="mb-1.5" />
        <Skeleton width={isMine ? 80 : 110} height={12} borderRadius={4} />
      </View>
    </View>
  );
}

export function SkeletonUser() {
  return (
    <View className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
      <View className="flex-row items-center flex-1">
        <Skeleton width={44} height={44} borderRadius={22} className="mr-3" />
        <View className="flex-1 mr-2">
          <Skeleton width={120} height={14} borderRadius={6} className="mb-1.5" />
          <Skeleton width={80} height={10} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={75} height={32} borderRadius={10} />
    </View>
  );
}

export function SkeletonConversation() {
  return (
    <View className="flex-row items-center p-3.5 mb-2 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
      <Skeleton width={48} height={48} borderRadius={24} className="mr-3" />
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1.5">
          <Skeleton width={110} height={14} borderRadius={6} />
          <Skeleton width={40} height={10} borderRadius={4} />
        </View>
        <Skeleton width={160} height={11} borderRadius={4} />
      </View>
    </View>
  );
}

export function SkeletonNotification() {
  return (
    <View className="flex-row items-start p-3.5 mx-4 mb-2.5 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
      <Skeleton width={36} height={36} borderRadius={12} className="mr-3 mt-0.5" />
      <View className="flex-1">
        <Skeleton width="70%" height={12} borderRadius={4} className="mb-2" />
        <Skeleton width="40%" height={10} borderRadius={4} />
      </View>
      <Skeleton width={8} height={8} borderRadius={4} className="mt-2 ml-2" />
    </View>
  );
}

export function SkeletonGroup() {
  return (
    <View className="p-4 mb-3 rounded-2xl bg-[#202A2D] border border-[#3A4B4D]">
      <View className="flex-row items-center mb-3">
        <Skeleton width={44} height={44} borderRadius={14} className="mr-3" />
        <View className="flex-1">
          <Skeleton width={140} height={15} borderRadius={6} className="mb-1.5" />
          <Skeleton width={70} height={10} borderRadius={4} />
        </View>
        <Skeleton width={60} height={28} borderRadius={8} />
      </View>
      <Skeleton width="100%" height={11} borderRadius={4} className="mb-1.5" />
      <Skeleton width="70%" height={11} borderRadius={4} />
    </View>
  );
}
