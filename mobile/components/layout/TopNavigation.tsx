import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Home, Compass, MessageSquare, Phone, Bell, User } from 'lucide-react-native';
import { useNotificationStore } from '../../stores/notificationStore';

const ACTIVE = '#D9D0B8';
const INACTIVE = '#7F8B86';
const UNDERLINE = '#496D6B';

const NAV_ITEMS = [
  { key: 'home', href: '/(tabs)' as const, match: ['/', '/(tabs)', '/(tabs)/index'], Icon: Home },
  { key: 'explore', href: '/(tabs)/explore' as const, match: ['/explore', '/(tabs)/explore'], Icon: Compass },
  { key: 'messages', href: '/(tabs)/messages' as const, match: ['/messages', '/(tabs)/messages'], Icon: MessageSquare },
  { key: 'calls', href: '/(tabs)/calls' as const, match: ['/calls', '/(tabs)/calls'], Icon: Phone },
  { key: 'notifications', href: '/(tabs)/notifications' as const, match: ['/notifications', '/(tabs)/notifications'], Icon: Bell },
  { key: 'profile', href: '/(tabs)/profile' as const, match: ['/profile', '/(tabs)/profile'], Icon: User },
];

function pathIsActive(pathname: string, match: string[]) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return match.some((m) => normalized === m || normalized.endsWith(m));
}

export default function TopNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);

  return (
    <View className="flex-row items-center h-14 w-full border-b border-[#3A4B4D] bg-[#141819]">
      {NAV_ITEMS.map((item) => {
        const focused = pathIsActive(pathname, item.match);
        const color = focused ? ACTIVE : INACTIVE;
        const Icon = item.Icon;

        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => router.push(item.href)}
            activeOpacity={0.75}
            className="flex-1 h-full items-center justify-center pt-1.5 pb-2.5"
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.key}
          >
            <View className="relative items-center justify-center">
              <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} />
              {item.key === 'notifications' && unreadNotifications > 0 && (
                <View className="absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-[#B87568] items-center justify-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-white" />
                </View>
              )}
            </View>
            {focused && (
              <View
                className="absolute bottom-0 left-2.5 right-2.5 h-[2px] rounded-full"
                style={{ backgroundColor: UNDERLINE }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
