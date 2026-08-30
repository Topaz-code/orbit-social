import { useEffect } from 'react';
import { mqttClient } from '../lib/mqtt.js';
import { useAuthStore } from '../stores/authStore.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { useCallStore } from '../stores/callStore.js';

export function useMQTT() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { addMessage, setTyping, updateUserPresence } = useChatStore();
  const { setIncomingCall } = useCallStore();

  useEffect(() => {
    if (!user) return;

    // Connect client
    mqttClient.connect(user.id);

    // 1. Listen for user notifications
    const unsubsNotif = mqttClient.subscribe(
      `orbit/user/${user.id}/notifications`,
      (topic, payload) => {
        if (payload?.type === 'NOTIFICATION_RECEIVED' && payload.data) {
          addNotification(payload.data);
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

    return () => {
      unsubsNotif();
      unsubsCall();
    };
  }, [user?.id]);

  return {
    publish: (topic: string, message: any) => mqttClient.publish(topic, message),
    subscribe: (topic: string, cb: (topic: string, payload: any) => void) =>
      mqttClient.subscribe(topic, cb),
  };
}
