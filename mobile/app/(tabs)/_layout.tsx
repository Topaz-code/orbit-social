import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Compass, MessageSquare, Phone, Bell, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';
import { useNotificationStore } from '../../stores/notificationStore';

export default function TabsLayout() {
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#141819',
          borderTopWidth: 1,
          borderTopColor: '#3A4B4D',
          height: Platform.OS === 'ios' ? 76 : 58,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#D9D0B8',
        tabBarInactiveTintColor: '#7F8B86',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center w-12 h-10 relative">
              <Home size={22} color={focused ? '#D9D0B8' : '#7F8B86'} />
              {focused && (
                <View className="absolute bottom-0 w-6 h-[2.5px] bg-[#496D6B] rounded-full" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center w-12 h-10 relative">
              <Compass size={22} color={focused ? '#D9D0B8' : '#7F8B86'} />
              {focused && (
                <View className="absolute bottom-0 w-6 h-[2.5px] bg-[#496D6B] rounded-full" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center w-12 h-10 relative">
              <MessageSquare size={22} color={focused ? '#D9D0B8' : '#7F8B86'} />
              {focused && (
                <View className="absolute bottom-0 w-6 h-[2.5px] bg-[#496D6B] rounded-full" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center w-12 h-10 relative">
              <Phone size={22} color={focused ? '#D9D0B8' : '#7F8B86'} />
              {focused && (
                <View className="absolute bottom-0 w-6 h-[2.5px] bg-[#496D6B] rounded-full" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center w-12 h-10 relative">
              <Bell size={22} color={focused ? '#D9D0B8' : '#7F8B86'} />
              {unreadNotifications > 0 && (
                <View className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#B87568]" />
              )}
              {focused && (
                <View className="absolute bottom-0 w-6 h-[2.5px] bg-[#496D6B] rounded-full" />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center w-12 h-10 relative">
              <User size={22} color={focused ? '#D9D0B8' : '#7F8B86'} />
              {focused && (
                <View className="absolute bottom-0 w-6 h-[2.5px] bg-[#496D6B] rounded-full" />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
