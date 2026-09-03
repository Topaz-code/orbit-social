import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

export function usePushNotifications() {
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    async function setupPush() {
      if (user) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          try {
            await api.post('/auth/register-push-token', { token });
          } catch (e) {
            console.error('Failed to register push token', e);
          }
        }
      }
    }

    setupPush();
  }, [user]);
}
