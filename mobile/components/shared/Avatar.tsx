import React from 'react';
import { View, Image, Text } from 'react-native';
import { User } from '../../types';

interface AvatarProps {
  user?: User;
  size?: number;
  showOnlineIndicator?: boolean;
}

export default function Avatar({ user, size = 40, showOnlineIndicator = false }: AvatarProps) {
  return (
    <View style={{ width: size, height: size }}>
      <View className="w-full h-full rounded-full bg-slate-200 overflow-hidden items-center justify-center">
        {user?.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} className="w-full h-full" />
        ) : (
          <Text className="text-indigo-600 font-bold" style={{ fontSize: size * 0.4 }}>
            {user?.display_name?.charAt(0) || '?'}
          </Text>
        )}
      </View>
      {showOnlineIndicator && (
        <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </View>
  );
}
