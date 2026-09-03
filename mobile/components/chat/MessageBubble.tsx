import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { X, Play, Pause, FileText, Check, CheckCheck } from 'lucide-react-native';
import { Message } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const user = useAuthStore((state) => state.user);
  const isMine =
    (message.sender_id && message.sender_id === user?.id) ||
    (message.user_id && message.user_id === user?.id) ||
    (message.sender?.id && message.sender?.id === user?.id);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const senderName =
    message.sender?.display_name ||
    message.sender?.username ||
    message.user?.display_name ||
    'Friend';

  const timeString = new Date(message.created_at || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className={`mb-3 flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {/* Sender Name for group / incoming messages */}
      {!isMine && (
        <Text className="text-[11px] font-semibold text-[#A8AAA0] mb-1 ml-2">
          {senderName}
        </Text>
      )}

      {/* Main Bubble Container */}
      <View
        className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
          isMine
            ? 'bg-[#496D6B] rounded-br-xs'
            : 'bg-[#2B3940] border border-[#3A4B4D] rounded-bl-xs'
        }`}
      >
        {/* Replied Message Preview */}
        {message.reply_to && (
          <View
            className={`mb-2 rounded-xl p-2 border-l-2 ${
              isMine
                ? 'bg-black/20 border-[#D0A56A]'
                : 'bg-[#202A2D] border-[#496D6B]'
            }`}
          >
            <Text className="text-[10px] font-bold text-[#D0A56A]">
              {message.reply_to.sender?.display_name || 'Replied'}
            </Text>
            <Text className="text-[11px] text-[#D9D0B8] opacity-90 truncate" numberOfLines={1}>
              {message.reply_to.content || 'Media'}
            </Text>
          </View>
        )}

        {/* Media Image Attachment with expo-image */}
        {message.media_url ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setImagePreviewOpen(true)}
            className="mb-2 rounded-xl overflow-hidden border border-[#3A4B4D]/60 bg-[#141819]"
          >
            <Image
              source={{ uri: message.media_url }}
              style={{ width: 220, height: 180 }}
              contentFit="cover"
              onError={(e) => console.warn('Chat Image load error:', e.error)}
              transition={200}
            />
          </TouchableOpacity>
        ) : null}

        {/* Text Message Content */}
        {message.content ? (
          <Text className="text-sm text-[#D9D0B8] leading-relaxed">
            {message.content}
          </Text>
        ) : null}

        {/* Footer: Timestamp & Read Status */}
        <View className="flex-row items-center justify-end space-x-1 mt-1">
          <Text className="text-[10px] text-[#D9D0B8]/70 mr-1">{timeString}</Text>
          {isMine && (
            <CheckCheck size={12} color="#D0A56A" />
          )}
        </View>
      </View>

      {/* Full-Screen Image Viewer Modal */}
      {message.media_url && imagePreviewOpen && (
        <Modal
          visible={imagePreviewOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setImagePreviewOpen(false)}
        >
          <View className="flex-1 bg-black/95 justify-center items-center p-4">
            <TouchableOpacity
              className="absolute top-12 right-6 p-2.5 bg-[#202A2D] rounded-full z-20 border border-[#3A4B4D]"
              onPress={() => setImagePreviewOpen(false)}
            >
              <X size={20} color="#D9D0B8" />
            </TouchableOpacity>
            <Image
              source={{ uri: message.media_url }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
}
