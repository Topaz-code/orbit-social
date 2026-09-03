import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { PhoneMissed, PhoneOutgoing, Video, PhoneCall } from 'lucide-react-native';
import { SkeletonConversation } from '../../components/ui/Skeleton';

export default function CallHistoryScreen() {
  const { data: calls, isLoading } = useQuery({
    queryKey: ['calls', 'history'],
    queryFn: async () => {
      const res = await api.get('/calls/history');
      return res.data?.data || [];
    },
  });

  const renderIcon = (call: any) => {
    if (call.status === 'missed') return <PhoneMissed color="#B87568" size={18} />;
    if (call.type === 'video') return <Video color="#D0A56A" size={18} />;
    return <PhoneOutgoing color="#496D6B" size={18} />;
  };

  return (
    <View className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: 'Call History',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      {isLoading ? (
        <View className="p-4 space-y-2">
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
        </View>
      ) : (
        <FlatList
          data={calls || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <PhoneCall size={36} color="#496D6B" className="mb-3" />
              <Text className="text-base font-bold text-[#D9D0B8]">No call history</Text>
              <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                Connect directly with friends using private peer-to-peer audio & video calls.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-[#202A2D] border border-[#3A4B4D] p-3.5 rounded-2xl mb-2.5 flex-row items-center justify-between active:bg-[#2B3940]"
              onPress={() => router.push(`/calls`)}
            >
              <View className="flex-row items-center space-x-3">
                <Image
                  source={{
                    uri:
                      item.caller?.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  }}
                  style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#3A4B4D' }}
                  contentFit="cover"
                />
                <View className="ml-3">
                  <Text
                    className={`font-bold text-sm ${
                      item.status === 'missed' ? 'text-[#B87568]' : 'text-[#D9D0B8]'
                    }`}
                  >
                    {item.caller?.display_name || item.caller?.username || 'Orbit Call'}
                  </Text>
                  <Text className="text-[11px] text-[#A8AAA0] mt-0.5">
                    {new Date(item.started_at || item.created_at || Date.now()).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              <View className="w-9 h-9 items-center justify-center bg-[#2B3940] border border-[#3A4B4D] rounded-xl">
                {renderIcon(item)}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
