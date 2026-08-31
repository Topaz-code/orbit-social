import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../../services/api';
import { User, Message } from '../../types';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../stores/authStore';
import { startOutgoingCall } from '../../services/callService';

interface Props {
  targetUser: User;
  onBack: () => void;
}

export const ChatConversationView: React.FC<Props> = ({ targetUser, onBack }) => {
  const { user: currentUser } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await api.get(`/messages/${targetUser.id}`).catch(async () => {
          // Fallback to conversation messages
          const convRes = await api.get(`/conversations`);
          const conv = convRes.data?.data?.find(
            (c: any) => c.user?.id === targetUser.id
          );
          if (conv?.id) {
            return await api.get(`/conversations/${conv.id}/messages`);
          }
          return { data: { success: true, data: [] } };
        });

        if (res.data?.success && Array.isArray(res.data.data)) {
          setMessages(res.data.data);
        }
      } catch (e) {
        console.warn('[Chat] Load messages error:', e);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();

    const handleIncomingMessage = (msg: any) => {
      if (
        msg &&
        (msg.sender_id === targetUser.id || msg.receiver_id === targetUser.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socketService.on('chat_message', handleIncomingMessage);
    return () => {
      socketService.off('chat_message', handleIncomingMessage);
    };
  }, [targetUser.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUser?.id || '',
      receiver_id: targetUser.id,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      socketService.send('chat_message', {
        receiver_id: targetUser.id,
        content,
      });

      await api.post(`/messages`, {
        receiver_id: targetUser.id,
        content,
      }).catch(async () => {
        // Fallback to conversations endpoint
        const convRes = await api.get(`/conversations`);
        const conv = convRes.data?.data?.find(
          (c: any) => c.user?.id === targetUser.id
        );
        if (conv?.id) {
          await api.post(`/conversations/${conv.id}/messages`, { content });
        }
      });
    } catch (e) {
      console.warn('[Chat] Send error:', e);
    } finally {
      setSending(false);
    }
  };

  const handleCall = (type: 'voice' | 'video') => {
    startOutgoingCall(targetUser.id, targetUser.display_name || targetUser.username, type);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle}>{targetUser.display_name || targetUser.username}</Text>
          <Text style={styles.headerStatus}>
            {targetUser.is_online ? '🟢 Online' : 'Offline'}
          </Text>
        </View>

        {/* Call Action Buttons */}
        <View style={styles.callButtonsRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall('voice')}
            activeOpacity={0.7}
          >
            <Text style={styles.callButtonIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall('video')}
            activeOpacity={0.7}
          >
            <Text style={styles.callButtonIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#D0A56A" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUser?.id;
            return (
              <View
                style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
                  {item.content}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>
                No messages yet with {targetUser.display_name}. Say hello! 👋
              </Text>
            </View>
          }
        />
      )}

      {/* Input Row */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171A1C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202428',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#2D3339',
  },
  backButton: {
    padding: 8,
    marginRight: 6,
  },
  backText: {
    color: '#D0A56A',
    fontSize: 22,
    fontWeight: '700',
  },
  headerMeta: {
    flex: 1,
  },
  headerTitle: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  callButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C3238',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  callButtonIcon: {
    fontSize: 16,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#D0A56A',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#24282C',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2D3339',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: '#171A1C',
    fontWeight: '500',
  },
  theirText: {
    color: '#F3F4F6',
  },
  messageTime: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202428',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#2D3339',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#171A1C',
    color: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#374151',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#D0A56A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#171A1C',
    fontWeight: '700',
    fontSize: 14,
  },
});
