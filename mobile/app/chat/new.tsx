import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Search, ArrowLeft, MessageSquare } from 'lucide-react-native';
import api from '../../lib/api';
import { SkeletonUser } from '../../components/ui/Skeleton';

export default function NewChatScreen() {
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['searchUsers', search],
    queryFn: async () => {
      if (!search.trim()) {
        const res = await api.get('/users/discover');
        return res.data?.data || [];
      }
      const res = await api.get(`/search?q=${encodeURIComponent(search.trim())}&type=people`);
      return res.data?.data || [];
    },
  });

  const startChat = async (userId: string) => {
    try {
      const res = await api.post('/conversations', {
        type: 'direct',
        recipient_id: userId,
      });
      const convId = res.data?.data?.id || res.data?.id;
      if (convId) {
        router.replace(`/chat/${convId}`);
      }
    } catch (e) {
      console.error('Failed to start chat', e);
    }
  };

  return (
    <View className="flex-1 bg-[#171A1C]">
      <Stack.Screen
        options={{
          title: 'New Conversation',
          headerStyle: { backgroundColor: '#141819' },
          headerTintColor: '#D9D0B8',
          headerBackTitle: 'Back',
        }}
      />

      <View className="p-4 bg-[#141819] border-b border-[#3A4B4D]">
        <View className="flex-row items-center bg-[#2B3940] border border-[#3A4B4D] rounded-xl px-3.5 py-2">
          <Search size={16} color="#D0A56A" className="mr-2" />
          <TextInput
            className="flex-1 text-xs text-[#D9D0B8] ml-2"
            placeholder="Search connections by name or @username..."
            placeholderTextColor="#7F8B86"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      </View>

      {isLoading ? (
        <View className="p-4 space-y-2">
          <SkeletonUser />
          <SkeletonUser />
          <SkeletonUser />
        </View>
      ) : (
        <FlatList
          data={users || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="p-3.5 mb-2.5 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] flex-row items-center justify-between active:bg-[#2B3940]"
              onPress={() => startChat(item.id)}
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Image
                  source={{
                    uri:
                      item.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        item.display_name || item.username
                      )}&background=2B3940&color=D9D0B8`,
                  }}
                  style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#3A4B4D' }}
                  contentFit="cover"
                />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-sm text-[#D9D0B8]">{item.display_name}</Text>
                  <Text className="text-xs text-[#A8AAA0]">@{item.username}</Text>
                </View>
              </View>
              <View className="px-3 py-1.5 rounded-xl bg-[#D0A56A]">
                <Text className="text-xs font-bold text-[#171A1C]">Chat</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <MessageSquare size={36} color="#496D6B" className="mb-3" />
              <Text className="text-base font-bold text-[#D9D0B8]">No users found</Text>
              <Text className="text-xs text-[#A8AAA0] text-center mt-1">
                Try searching with a different username.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
