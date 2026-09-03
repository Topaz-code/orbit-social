import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { MessageSquare, Plus } from 'lucide-react-native';

export default function ConversationList({ conversations }: { conversations: any[] }) {
  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 14 }}
      renderItem={({ item }) => {
        const otherUser = item.other_user || item.members?.find((m: any) => m.id !== item.user_id)?.user;
        const name = item.name || otherUser?.display_name || otherUser?.username || 'Orbit Member';
        const isOnline = otherUser?.is_online || false;
        const avatar =
          item.avatar_url ||
          otherUser?.avatar_url ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2B3940&color=D9D0B8`;

        return (
          <TouchableOpacity
            className="flex-row items-center p-3.5 mb-2.5 bg-[#202A2D] border border-[#3A4B4D] rounded-2xl active:bg-[#2B3940] shadow-sm"
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <View className="relative">
              <Image
                source={{ uri: avatar }}
                style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#3A4B4D' }}
                contentFit="cover"
              />
              {isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#202A2D]" />
              )}
            </View>
            <View className="ml-3.5 flex-1">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-bold text-sm text-[#D9D0B8]" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-[11px] text-[#7F8B86]">
                  {item.last_message_at
                    ? new Date(item.last_message_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </Text>
              </View>
              <Text className="text-xs text-[#A8AAA0]" numberOfLines={1}>
                {item.last_message?.content || item.last_message || 'Start chatting privately'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <View className="items-center justify-center py-20 px-6">
          <View className="w-14 h-14 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] items-center justify-center mb-3">
            <MessageSquare size={28} color="#D0A56A" />
          </View>
          <Text className="text-base font-bold text-[#D9D0B8]">No conversations yet</Text>
          <Text className="text-xs text-[#A8AAA0] text-center mt-1 max-w-xs mb-4">
            Find people in Explore or start a conversation with your connections!
          </Text>
          <TouchableOpacity
            className="flex-row items-center px-4 py-2.5 bg-[#D0A56A] rounded-xl active:opacity-85"
            onPress={() => router.push('/chat/new')}
          >
            <Plus size={16} color="#171A1C" />
            <Text className="text-xs font-bold text-[#171A1C] ml-1.5">New Message</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}
