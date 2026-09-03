import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useNotificationStore } from '../stores/notificationStore';

/** How many rows to ask the API for. Matches the server default (30). */
const NOTIFICATION_LIMIT = 30;

/**
 * FIX 3 — notification loading.
 *
 * Two separate defects made this screen feel frozen / permanently empty:
 *
 * 1. SHAPE. `GET /notifications` returns an ENVELOPE, not an array:
 *      { success: true, data: { notifications: [...], unread_count: 12 } }
 *    (see server/src/controllers/notifications.controller.ts line 10).
 *    This hook read `res.data.data`, i.e. the whole object, and handed it to
 *    `setNotifications()` — which immediately calls `.filter()` on it and
 *    throws "notifications.filter is not a function". React Query swallowed
 *    the throw as a query error, so `isLoading` flipped to false and the list
 *    was always `[]`. The web client reads `.data.data.notifications`; mobile
 *    now does the same.
 *
 * 2. CACHING. There was no `staleTime`, so TanStack Query's default of 0 made
 *    every mount / tab switch / app refocus refire the request. A 30s window
 *    (the same value the web client uses) makes the tab render instantly from
 *    cache instead of showing skeletons on every single visit.
 */
export function useNotifications() {
  const queryClient = useQueryClient();
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  const query = useQuery({
    queryKey: ['notifications', NOTIFICATION_LIMIT],
    queryFn: async () => {
      const res = await api.get('/notifications', {
        params: { limit: NOTIFICATION_LIMIT },
      });

      // Accept BOTH shapes so a backend change can never blank the screen:
      // the envelope `{ notifications: [...] }` and a bare array.
      const payload = res.data?.data;
      const raw = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.notifications)
        ? payload.notifications
        : [];

      // Coerce ids to strings — the FlatList keyExtractor and the store's
      // `markAsRead` compare by `===` against a string id.
      const list = raw
        .filter((n: any) => n && typeof n === 'object')
        .map((n: any) => ({
          ...n,
          id: String(n.id),
          is_read: Boolean(n.is_read),
          type: typeof n.type === 'string' ? n.type : 'general',
          content: typeof n.content === 'string' ? n.content : '',
          created_at: n.created_at || new Date().toISOString(),
        }));

      setNotifications(list);
      return list;
    },
    // 30s of freshness -> instant renders on tab switches and refocuses.
    staleTime: 30 * 1000,
    // Keep the last page around for 5 minutes so a back-navigation is instant.
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: Array.isArray(query.data) ? query.data : [],
    // `isLoading` is only true when there is no cached data yet, so returning
    // to the tab renders the cached list instead of four skeletons.
    isLoading: query.isLoading,
    isRefetching: query.isFetching && !query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
