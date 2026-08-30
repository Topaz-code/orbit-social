import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import { Notification } from '../types/index.js';

export function useNotifications() {
  const queryClient = useQueryClient();
  const {
    notifications,
    unreadCount,
    setNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const { isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      const items: Notification[] = res.data?.data?.notifications || [];
      const unread: number = res.data?.data?.unread_count || 0;
      setNotifications(items, unread);
      return { notifications: items, unreadCount: unread };
    },
    staleTime: 1000 * 30,
  });

  const markSingleRead = async (id: string) => {
    markAsRead(id);
    try {
      await api.put(`/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Ignored
    }
  };

  const markAllRead = async () => {
    markAllAsRead();
    try {
      await api.put('/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Ignored
    }
  };

  const deleteSingleNotification = async (id: string) => {
    removeNotification(id);
    try {
      await api.delete(`/notifications/${id}`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Ignored
    }
  };

  const clearAllNotifications = async () => {
    clearAll();
    try {
      await api.delete('/notifications/clear-all');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Ignored
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markSingleRead,
    markAllRead,
    deleteSingleNotification,
    clearAllNotifications,
    refetch,
  };
}
