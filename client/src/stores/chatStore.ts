import { create } from 'zustand';
import { Conversation, Message } from '../types/index.js';

interface ChatState {
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  typingUsers: Record<string, { userId: string; username: string; timestamp: number }[]>;

  setActiveConversationId: (id: string | null) => void;
  setActiveConversation: (conv: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setTyping: (conversationId: string, userId: string, username: string, isTyping: boolean) => void;
  updateUserPresence: (userId: string, isOnline: boolean, lastSeen?: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  activeConversation: null,
  conversations: [],
  messagesByConversation: {},
  typingUsers: {},

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setActiveConversation: (conv) => set({ activeConversation: conv, activeConversationId: conv?.id || null }),

  setConversations: (conversations) => set({ conversations }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messagesByConversation[conversationId] || [];
      // Deduplicate if already present
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...existing, message],
        },
      };
    }),

  setTyping: (conversationId, userId, username, isTyping) =>
    set((state) => {
      const currentList = state.typingUsers[conversationId] || [];
      let updatedList = currentList.filter((u) => u.userId !== userId);

      if (isTyping) {
        updatedList.push({ userId, username, timestamp: Date.now() });
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedList,
        },
      };
    }),

  updateUserPresence: (userId, isOnline, lastSeen) =>
    set((state) => {
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.other_user && conv.other_user.id === userId) {
          return {
            ...conv,
            other_user: {
              ...conv.other_user,
              is_online: isOnline,
              last_seen: lastSeen || conv.other_user.last_seen,
            },
          };
        }
        return conv;
      });

      return { conversations: updatedConversations };
    }),
}));
