import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mqttClient } from '../lib/mqtt.js';
import { useAuthStore } from '../stores/authStore.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { useCallStore } from '../stores/callStore.js';
import { Post } from '../types/index.js';

export function useMQTT() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const { addMessage, setTyping, updateUserPresence } = useChatStore();
  const { setIncomingCall } = useCallStore();

  useEffect(() => {
    if (!user) return;

    // Connect client
    mqttClient.connect(user.id);

    // 1. Listen for user personal notifications
    const unsubsNotif = mqttClient.subscribe(
      `orbit/user/${user.id}/notifications`,
      (topic, payload) => {
        if (payload?.type === 'NOTIFICATION_RECEIVED' && payload.data) {
          addNotification(payload.data);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } else if (payload?.type === 'new_message' && payload.sender) {
          // Push notification toast for messages
          addNotification({
            id: `msg-${Date.now()}`,
            user_id: user.id,
            type: 'new_message',
            reference_id: payload.reference_id,
            reference_type: 'conversation',
            content: payload.content,
            is_read: false,
            created_at: new Date().toISOString(),
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      }
    );

    // 2. Listen for incoming calls
    const unsubsCall = mqttClient.subscribe(
      `orbit/call/${user.id}/incoming`,
      (topic, payload) => {
        if (payload?.type === 'INCOMING_CALL' && payload.data) {
          setIncomingCall(payload.data);
        }
      }
    );

    // 3. Listen for global feed creations
    const unsubsNewPost = mqttClient.subscribe('orbit/feed/new', (topic, payload) => {
      if (payload?.type === 'POST_CREATED' && payload.data) {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    });

    // 4. Listen for real-time post likes and comment count updates
    const unsubsPostUpdate = mqttClient.subscribe('orbit/feed/update', (topic, payload) => {
      if (payload?.type === 'POST_UPDATED' && payload.postId) {
        const updateLikes = (list: Post[] | undefined) =>
          list?.map((p) => {
            if (p.id === payload.postId) {
              return {
                ...p,
                likes_count:
                  payload.data?.likes_count !== undefined
                    ? payload.data.likes_count
                    : p.likes_count,
                comments_count:
                  payload.data?.comments_count !== undefined
                    ? payload.data.comments_count
                    : p.comments_count,
              };
            }
            return p;
          });

        queryClient.setQueryData(['posts', 'feed'], updateLikes);
        queryClient.setQueryData(['posts', 'explore'], updateLikes);
      }
    });

    return () => {
      unsubsNotif();
      unsubsCall();
      unsubsNewPost();
      unsubsPostUpdate();
    };
  }, [user?.id, queryClient]);

  return {
    publish: (topic: string, message: any) => mqttClient.publish(topic, message),
    subscribe: (topic: string, cb: (topic: string, payload: any) => void) =>
      mqttClient.subscribe(topic, cb),
  };
}
