import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useChatStore } from '../stores/chatStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { mqttClient } from '../lib/mqtt.js';
import { Conversation, Message } from '../types/index.js';

export function useChat() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    activeConversationId,
    activeConversation,
    conversations,
    messagesByConversation,
    typingUsers,
    setActiveConversationId,
    setActiveConversation,
    setConversations,
    setMessages,
    addMessage,
    setTyping,
    updateUserPresence,
  } = useChatStore();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Conversations List
  const {
    data: fetchedConversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/conversations');
      const list: Conversation[] = res.data?.data || [];
      setConversations(list);
      return list;
    },
    staleTime: 1000 * 15,
  });

  // 2. Fetch Messages for Active Conversation
  const {
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return [];
      const res = await api.get(`/conversations/${activeConversationId}/messages`);
      const msgs: Message[] = res.data?.data?.messages || [];
      setMessages(activeConversationId, msgs);

      // Auto mark conversation as read
      api.put(`/conversations/${activeConversationId}/read`).catch(() => {});
      return msgs;
    },
    enabled: !!activeConversationId,
  });

  // 3. Real-time MQTT Subscription for Active Conversation
  useEffect(() => {
    if (!activeConversationId || !user) return;

    // Subscribe to messages topic
    const unsubsMsg = mqttClient.subscribe(
      `orbit/chat/${activeConversationId}/messages`,
      (topic, payload) => {
        if (payload?.type === 'MESSAGE_RECEIVED' && payload.data) {
          addMessage(activeConversationId, payload.data);
          // Refresh conversation preview
          refetchConversations();
        }
      }
    );

    // Subscribe to typing topic
    const unsubsTyping = mqttClient.subscribe(
      `orbit/chat/${activeConversationId}/typing`,
      (topic, payload) => {
        if (payload && payload.userId !== user.id) {
          setTyping(
            activeConversationId,
            payload.userId,
            payload.username,
            payload.isTyping
          );
        }
      }
    );

    // Subscribe to presence of other user if direct chat
    let unsubsPresence: (() => void) | null = null;
    if (activeConversation?.other_user) {
      unsubsPresence = mqttClient.subscribe(
        `orbit/user/${activeConversation.other_user.id}/status`,
        (topic, payload) => {
          if (payload?.userId) {
            updateUserPresence(payload.userId, payload.isOnline, payload.lastSeen);
          }
        }
      );
    }

    return () => {
      unsubsMsg();
      unsubsTyping();
      if (unsubsPresence) unsubsPresence();
    };
  }, [activeConversationId, user?.id, activeConversation?.other_user?.id]);

  // 4. Send Message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      content?: string;
      media_url?: string;
      media_type?: string;
      reply_to_id?: string | null;
    }) => {
      if (!activeConversationId) throw new Error('No active conversation');
      const res = await api.post(`/conversations/${activeConversationId}/messages`, data);
      return res.data?.data as Message;
    },
    onSuccess: (newMsg) => {
      if (activeConversationId) {
        addMessage(activeConversationId, newMsg);
        refetchConversations();
      }
    },
  });

  // 5. Send Typing Status
  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId || !user) return;

      mqttClient.publish(`orbit/chat/${activeConversationId}/typing`, {
        conversationId: activeConversationId,
        userId: user.id,
        username: user.display_name,
        isTyping,
      });

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          mqttClient.publish(`orbit/chat/${activeConversationId}/typing`, {
            conversationId: activeConversationId,
            userId: user.id,
            username: user.display_name,
            isTyping: false,
          });
        }, 3000);
      }
    },
    [activeConversationId, user]
  );

  // 6. Create or Open Conversation
  const startConversation = async (recipientId: string) => {
    const res = await api.post('/conversations', {
      type: 'direct',
      recipient_id: recipientId,
    });
    if (res.data?.success) {
      const conv: Conversation = res.data.data;
      setActiveConversation(conv);
      refetchConversations();
      return conv;
    }
    return null;
  };

  const currentMessages = activeConversationId
    ? messagesByConversation[activeConversationId] || []
    : [];

  const currentTyping = activeConversationId
    ? typingUsers[activeConversationId] || []
    : [];

  return {
    conversations: conversations.length > 0 ? conversations : fetchedConversations || [],
    activeConversationId,
    activeConversation,
    messages: currentMessages,
    typingUsers: currentTyping,
    isLoadingConversations,
    isLoadingMessages,
    setActiveConversationId,
    setActiveConversation,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    emitTyping,
    startConversation,
    refetchConversations,
    refetchMessages,
  };
}
