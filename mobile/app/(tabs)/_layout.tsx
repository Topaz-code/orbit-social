import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/layout/Header';
import TopNavigation from '../../components/layout/TopNavigation';

export default function TabsLayout() {
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
