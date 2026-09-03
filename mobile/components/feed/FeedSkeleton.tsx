import React from 'react';
import { View } from 'react-native';
import SkeletonLoader from '../SkeletonLoader';

export default function FeedSkeleton() {
  return (
    <View className="bg-white p-4 mb-2 shadow-sm border-b border-slate-100">
      <View className="flex-row items-center mb-4">
        <SkeletonLoader width={40} height={40} style={{ borderRadius: 20 }} />
        <View className="ml-3 flex-1">
          <SkeletonLoader width={120} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width={80} height={12} />
        </View>
      </View>
      <SkeletonLoader height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader height={16} width="80%" style={{ marginBottom: 16 }} />
      <SkeletonLoader height={200} style={{ borderRadius: 8, marginBottom: 16 }} />
      <View className="flex-row justify-between pt-3 border-t border-slate-100">
        <SkeletonLoader width={60} height={20} />
        <SkeletonLoader width={60} height={20} />
        <SkeletonLoader width={60} height={20} />
        <SkeletonLoader width={60} height={20} />
      </View>
    </View>
  );
}
