import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Phone, Video, ArrowLeft, MessageSquare } from 'lucide-react-native';
import { useMessages, useSendMessage, useConversations } from '../../hooks/useChat';
import { useCall } from '../../hooks/useCall';
import { useMQTT } from '../../hooks/useMQTT';
import { useAuthStore } from '../../stores/authStore';
import ChatInput from '../../components/chat/ChatInput';
import MessageBubble from '../../components/chat/MessageBubble';
import { Message } from '../../types';
import { SkeletonMessage } from '../../components/ui/Skeleton';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();
  const router = useRouter();
  const { data: initialMessages, isLoading } = useMessages(conversationId as string);
  const { data: conversations } = useConversations();
  const [messages, setMessages] = useState<Message[]>([]);
  const mqtt = useMQTT();
  const { user } = useAuthStore();
  const sendMessageMutation = useSendMessage();
  const { startCall } = useCall();
  const flatListRef = useRef<FlatList>(null);

  const activeConv = conversations?.find((c: any) => c.id === conversationId);
  const otherUser = activeConv?.other_user || activeConv?.members?.find((m: any) => m.id !== user?.id)?.user;
  const conversationTitle = activeConv?.name || otherUser?.display_name || otherUser?.username || 'Direct Chat';
  const isOnline = otherUser?.is_online || false;

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const topic = `orbit/chat/${conversationId}/messages`;
    const unsubscribe = mqtt.subscribe(topic, (t, messageBuf) => {
      try {
        const msg = JSON.parse(messageBuf.toString());
        if (msg.sender_id !== user?.id && msg.user_id !== user?.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      } catch (e) {
        console.error('Failed to parse incoming chat message', e);
      }
    });

    return () => unsubscribe();
  }, [conversationId, mqtt, user?.id]);

  const handleSendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      conversation_id: conversationId as string,
      sender_id: user?.id || '',
      content: content,
      media_url: mediaUrl,
      media_type: mediaType || (mediaUrl ? 'image' : 'text'),
      created_at: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        display_name: user?.display_name || '',
        avatar_url: user?.avatar_url || '',
      },
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const serverMsg = await sendMessageMutation.mutateAsync({
        conversationId: conversationId as string,
        content: content,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (serverMsg && serverMsg.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? serverMsg : m))
        );
      }
    } catch (e) {
      console.error('Failed to send message', e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#171A1C]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Chat Custom Header */}
      <View className="flex-row items-center justify-between px-3.5 py-3 bg-[#141819] border-b border-[#3A4B4D]">
        <View className="flex-row items-center space-x-2.5 flex-1 mr-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1.5 rounded-lg active:bg-[#2B3940] mr-1"
          >
            <ArrowLeft size={20} color="#D9D0B8" />
          </TouchableOpacity>

          <View className="relative">
            <Image
              source={{
                uri:
                  activeConv?.avatar_url ||
                  otherUser?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    conversationTitle
                  )}&background=2B3940&color=D9D0B8`,
              }}
              style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#3A4B4D' }}
              contentFit="cover"
            />
            {isOnline && (
              <View className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] rounded-full border border-[#141819]" />
            )}
          </View>

          <View className="ml-2 flex-1">
            <Text className="text-sm font-bold text-[#D9D0B8]" numberOfLines={1}>
              {conversationTitle}
            </Text>
            <Text className="text-[11px] text-[#A8AAA0]">
              {isOnline ? 'Active now' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Action icons: Voice & Video Call */}
        <View className="flex-row items-center space-x-1.5">
          <TouchableOpacity
            className="w-9 h-9 items-center justify-center rounded-[10px] bg-[#202A2D] border border-[#3A4B4D] active:bg-[#2B3940]"
            onPress={async () => {
              if (!otherUser?.id) return;
              try {
                await startCall(otherUser.id, 'voice', conversationId as string);
              } catch (err: any) {
                Alert.alert('Call Failed to Connect', err?.message || 'Could not start voice call.');
              }
            }}
          >
            <Phone size={17} color="#D9D0B8" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-9 h-9 items-center justify-center rounded-[10px] bg-[#202A2D] border border-[#3A4B4D] active:bg-[#2B3940] ml-1.5"
            onPress={async () => {
              if (!otherUser?.id) return;
              try {
                await startCall(otherUser.id, 'video', conversationId as string);
              } catch (err: any) {
                Alert.alert('Call Failed to Connect', err?.message || 'Could not start video call.');
              }
            }}
          >
            <Video size={17} color="#D0A56A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Messages Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-1 bg-[#171A1C]">
          {isLoading ? (
            <View className="flex-1 p-4 justify-end">
              <SkeletonMessage isMine={false} />
              <SkeletonMessage isMine={true} />
              <SkeletonMessage isMine={false} />
              <SkeletonMessage isMine={true} />
            </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center p-6">
              <View className="w-14 h-14 rounded-2xl bg-[#202A2D] border border-[#3A4B4D] items-center justify-center mb-3">
                <MessageSquare size={28} color="#D0A56A" />
              </View>
              <Text className="text-base font-bold text-[#D9D0B8] mb-1">
                Say hello in Orbit
              </Text>
              <Text className="text-xs text-[#A8AAA0] text-center max-w-xs">
                Direct messages are end-to-end synchronized without algorithmic indexing.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageBubble message={item} />}
              contentContainerStyle={{ paddingVertical: 14, paddingHorizontal: 14 }}
              style={{ flex: 1 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          )}

          {/* Chat Input Bar */}
          <ChatInput
            onSend={handleSendMessage}
            isSending={sendMessageMutation.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
