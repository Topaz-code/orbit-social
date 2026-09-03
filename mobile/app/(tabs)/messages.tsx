import React from 'react';
import { View, Text } from 'react-native';
import { useConversations } from '../../hooks/useChat';
import ConversationList from '../../components/chat/ConversationList';
import { SkeletonConversation } from '../../components/ui/Skeleton';

export default function MessagesScreen() {
  const { data: conversations, isLoading, isError } = useConversations();

  return (
    <View className="flex-1 bg-[#171A1C]">
      {isLoading ? (
        <View className="p-4 space-y-2">
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
          <SkeletonConversation />
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center bg-[#171A1C] px-6">
          <Text className="text-[#B87568] text-sm font-medium">Failed to load conversations</Text>
        </View>
      ) : (
        <ConversationList conversations={conversations || []} />
      )}
    </View>
  );
}
