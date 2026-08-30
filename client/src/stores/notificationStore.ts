import { create } from 'zustand';
import { Notification } from '../types/index.js';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications, unreadCount) => {
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const newUnread = updated.filter((n) => !n.is_read).length;
      return { notifications: updated, unreadCount: newUnread };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const removed = state.notifications.find((n) => n.id === id);
      const updated = state.notifications.filter((n) => n.id !== id);
      const newUnread = removed && !removed.is_read ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
      return { notifications: updated, unreadCount: newUnread };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
