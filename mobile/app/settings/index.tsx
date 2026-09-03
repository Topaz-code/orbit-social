import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import api from '../../lib/api';
import { Shield, Bell, Moon, Trash2, LogOut, ChevronRight, Lock } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  // FIX 4 — same rule as the Profile screen: use the hook, not the store.
  const { logout } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(
    user?.privacy_settings?.private_account || false
  );

  const handleTogglePrivacy = async (value: boolean) => {
    setPrivateAccount(value);
    try {
      await api.put(`/users/${user?.id}`, {
        privacy_settings: { ...user?.privacy_settings, private_account: value },
      });
    } catch {
      setPrivateAccount(!value);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out of Orbit?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // FIX 4 — `logout()` from useAuth() already redirects to
          // '/(auth)/login' in a `finally`, so a throw can no longer skip the
          // navigation and strand the user on a half-cleared screen.
          try {
            await logout();
          } catch (err) {
            console.error('[Settings] logout error:', err);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: 'Settings & Privacy',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      <View className="p-4">
        {/* Privacy Section */}
        <Text className="text-xs font-bold uppercase tracking-wider text-[#A8AAA0] mb-2.5 ml-2">
          Privacy & Circle Controls
        </Text>
        <View className="bg-[#202A2D] rounded-2xl border border-[#3A4B4D] mb-5 overflow-hidden">
          <View className="p-4 flex-row justify-between items-center border-b border-[#3A4B4D]">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-semibold text-[#D9D0B8]">Private Orbit</Text>
              <Text className="text-xs text-[#A8AAA0] mt-0.5">
                Only approved connections can view your posts and stories
              </Text>
            </View>
            <Switch
              value={privateAccount}
              onValueChange={handleTogglePrivacy}
              trackColor={{ true: '#D0A56A', false: '#3A4B4D' }}
              thumbColor={privateAccount ? '#171A1C' : '#A8AAA0'}
            />
          </View>

          <View className="p-4 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-semibold text-[#D9D0B8]">Push Notifications</Text>
              <Text className="text-xs text-[#A8AAA0] mt-0.5">
                Receive instant alerts for calls and messages
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ true: '#D0A56A', false: '#3A4B4D' }}
              thumbColor={pushEnabled ? '#171A1C' : '#A8AAA0'}
            />
          </View>
        </View>

        {/* Account Section */}
        <Text className="text-xs font-bold uppercase tracking-wider text-[#A8AAA0] mb-2.5 ml-2">
          About & Security
        </Text>
        <View className="bg-[#202A2D] rounded-2xl border border-[#3A4B4D] mb-6 overflow-hidden">
          <View className="p-4 border-b border-[#3A4B4D]">
            <Text className="text-sm font-semibold text-[#D9D0B8]">Orbit Platform</Text>
            <Text className="text-xs text-[#A8AAA0] mt-0.5">Version 1.0.0 • Zero Ad-Tracking</Text>
          </View>
          <View className="p-4">
            <Text className="text-sm font-semibold text-[#D9D0B8]">Encrypted In Transit</Text>
            <Text className="text-xs text-[#A8AAA0] mt-0.5">TLS 1.3 & Secure WebRTC</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-[#202A2D] border border-[#B87568]/50 rounded-2xl p-4 flex-row items-center justify-center gap-2 mb-8"
          onPress={handleLogout}
        >
          <LogOut size={16} color="#B87568" />
          <Text className="text-sm font-bold text-[#B87568]">Sign Out of Orbit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
