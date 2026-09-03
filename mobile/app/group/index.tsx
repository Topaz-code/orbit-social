import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import api from '../../lib/api';
import { Group } from '../../types';
import { Users, Plus } from 'lucide-react-native';
import { SkeletonGroup } from '../../components/ui/Skeleton';

export default function GroupsScreen() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await api.get('/groups');
      return res.data?.data || [];
    },
  });

  return (
    <View className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: 'Micro Circles',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      {isLoading ? (
        <View className="p-4 space-y-2">
          <SkeletonGroup />
          <SkeletonGroup />
          <SkeletonGroup />
        </View>
      ) : (
        <FlatList
          data={groups || []}
          keyExtractor={(item: Group) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <Users size={36} color="#496D6B" className="mb-3" />
              <Text className="text-base font-bold text-[#D9D0B8]">No groups yet</Text>
              <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                Explore circles or create a private group with up to 10 friends.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-[#202A2D] p-4 rounded-2xl mb-3 border border-[#3A4B4D] active:bg-[#2B3940]"
              onPress={() => router.push(`/groups/${item.id}`)}
            >
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri:
                      item.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        item.name
                      )}&background=2B3940&color=D9D0B8`,
                  }}
                  style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#3A4B4D' }}
                  contentFit="cover"
                />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-[#D9D0B8] text-base">{item.name}</Text>
                  <Text className="text-[#A8AAA0] text-xs mt-0.5">
                    {item.members_count || item.members?.length || 1}/10 members
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#D0A56A] rounded-full items-center justify-center shadow-lg active:opacity-85"
        onPress={() => router.push('/group/create')}
      >
        <Plus size={24} color="#171A1C" />
      </TouchableOpacity>
    </View>
  );
}
