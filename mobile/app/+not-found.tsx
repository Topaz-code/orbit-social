import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Rocket } from 'lucide-react-native';
import OrbitLogo from '../components/ui/OrbitLogo';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-[#171A1C]" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center mb-6">
            <OrbitLogo size={72} animated />
            <View className="mt-4 w-14 h-14 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] items-center justify-center">
              <Rocket size={26} color="#D0A56A" />
            </View>
          </View>

          <Text className="text-[#D0A56A] text-xs font-bold tracking-[3px] uppercase mb-2">
            Transmission lost
          </Text>
          <Text className="text-[#D9D0B8] text-3xl font-extrabold text-center">
            404 — Lost in Space
          </Text>
          <Text className="text-[#A8AAA0] text-sm text-center mt-3 max-w-xs leading-5">
            This orbit doesn&apos;t exist. The page drifted past the event horizon.
          </Text>

          <Link href="/(tabs)" asChild>
            <TouchableOpacity
              className="mt-10 bg-[#D0A56A] px-8 py-3.5 rounded-xl active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel="Return to Orbit Home"
            >
              <Text className="text-[#171A1C] font-bold text-sm">Return to Orbit (Home)</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
