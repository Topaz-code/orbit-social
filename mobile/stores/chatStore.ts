import { create } from 'zustand';
import { Conversation, Message } from '../types';

interface ChatState {
  activeConversations: Record<string, Conversation>;
  unreadCounts: Record<string, number>;
  typingStates: Record<string, string[]>;
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversations: {},
  unreadCounts: {},
  typingStates: {},
  setConversations: (conversations) => set((state) => {
    const acc: Record<string, Conversation> = {};
    conversations.forEach(c => acc[c.id] = c);
    return { activeConversations: { ...state.activeConversations, ...acc } };
  }),
  addMessage: (conversationId, message) => set((state) => {
    const convo = state.activeConversations[conversationId];
    if (!convo) return state;
    return {
      activeConversations: {
        ...state.activeConversations,
        [conversationId]: {
          ...convo,
          last_message: message,
          updated_at: new Date().toISOString()
        }
      }
    };
  }),
  setTyping: (conversationId, userId, isTyping) => set((state) => {
    const typingUsers = state.typingStates[conversationId] || [];
    const newTyping = isTyping 
      ? Array.from(new Set([...typingUsers, userId]))
      : typingUsers.filter(id => id !== userId);
    return {
      typingStates: {
        ...state.typingStates,
        [conversationId]: newTyping
      }
    };
  }),
  markAsRead: (conversationId) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [conversationId]: 0 }
  }))
}));
