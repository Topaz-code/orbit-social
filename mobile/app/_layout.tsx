import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../stores/authStore';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnimatedSplash from '../components/shared/AnimatedSplash';

import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../lib/notifications';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    registerForPushNotificationsAsync();

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.url) {
        // Deep link handling
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827' }}>
        <StatusBar style="light" backgroundColor="#111827" />
        <AnimatedSplash />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider config={config}>
        <StatusBar style="light" backgroundColor="#141819" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#171A1C' },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[conversationId]" options={{ headerShown: false }} />
          <Stack.Screen name="calls/index" options={{ headerShown: false }} />
          <Stack.Screen name="search/index" options={{ headerShown: false }} />
          <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
          <Stack.Screen name="groups/[groupId]" options={{ headerShown: false }} />
          <Stack.Screen name="post/[postId]" options={{ headerShown: false }} />
          <Stack.Screen name="stories/create" options={{ headerShown: false }} />
          <Stack.Screen name="stories/viewer" options={{ headerShown: false }} />
        </Stack>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
