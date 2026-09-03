import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/layout/Header';
import TopNavigation from '../../components/layout/TopNavigation';
import { useAuthStore } from '../../stores/authStore';
import { AUTH_LOGIN_ROUTE } from '../../hooks/useAuth';

export default function TabsLayout() {
  // FIX 4 — safety net for the logout desync.
  //
  // This layout had NO auth guard, so when logout cleared `user` without a
  // navigation the tabs stayed mounted with `user === null`. Every screen read
  // `user?.something`, rendered nothing, and Profile went blank — while the
  // Login screen never appeared. Guarding the layout means the protected tree
  // cannot exist without a user, so even if a `router.replace` call is ever
  // skipped or throws, React itself redirects on the next render.
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Only redirect once the initial `checkAuth()` has settled — redirecting
  // during the splash would bounce a signed-in user to the login screen.
  if (!isLoading && !user) {
    return <Redirect href={AUTH_LOGIN_ROUTE} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#141819' }} edges={['top']}>
      <View style={{ backgroundColor: '#141819' }}>
        <Header />
        <TopNavigation />
      </View>

      <View style={{ flex: 1, backgroundColor: '#171A1C' }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none', height: 0, overflow: 'hidden' },
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#D9D0B8',
            tabBarInactiveTintColor: '#7F8B86',
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Feed' }} />
          <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
          <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
          <Tabs.Screen name="calls" options={{ title: 'Calls' }} />
          <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
