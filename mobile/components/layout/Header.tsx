import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Bell } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import OrbitLogo from '../ui/OrbitLogo';
import { Image } from 'expo-image';

interface HeaderProps {
  onSearchPress?: () => void;
}

export default function Header({ onSearchPress }: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const handleSearch = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/search');
    }
  };

  return (
    <View className="flex-row items-center justify-between px-3.5 py-2.5 bg-[#141819] border-b border-[#3A4B4D]/60">
      {/* Left: Orbit Logo */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)')}
        className="flex-row items-center mr-2 active:opacity-80"
      >
        <OrbitLogo size={28} />
      </TouchableOpacity>

      {/* Middle: Global Search Bar */}
      <TouchableOpacity
        onPress={handleSearch}
        activeOpacity={0.85}
        className="flex-1 flex-row items-center h-9 px-3 bg-[#2B3940] border border-[#3A4B4D] rounded-[10px] mx-1.5"
      >
        <Search size={15} color="#7F8B86" className="mr-2" />
        <Text className="text-xs text-[#7F8B86] flex-1 truncate" numberOfLines={1}>
          Search people, posts, or groups...
        </Text>
      </TouchableOpacity>

      {/* Right: Notifications & Profile Avatar */}
      <View className="flex-row items-center space-x-2 ml-1">
        {/* Bell Button */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/notifications')}
          className="relative w-9 h-9 items-center justify-center rounded-[10px] bg-[#202A2D] border border-[#3A4B4D]/60 active:bg-[#2B3940]"
        >
          <Bell size={18} color="#D9D0B8" />
          {unreadCount > 0 && (
            <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D0A56A] ring-1 ring-[#141819]" />
          )}
        </TouchableOpacity>

        {/* User Avatar */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          className="relative ml-2 active:opacity-85"
        >
          <Image
            source={{
              uri:
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.display_name || 'Orbit'
                )}&background=2B3940&color=D9D0B8`,
            }}
            style={{ width: 34, height: 34, borderRadius: 17 }}
            contentFit="cover"
          />
          {/* Green Online Dot */}
          <View className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22c55e] border-2 border-[#141819]" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
