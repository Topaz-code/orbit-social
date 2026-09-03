import { useEffect } from 'react';
import { mqttService } from '../lib/mqtt';
import { useAuthStore } from '../stores/authStore';

export function useMQTT() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      mqttService.connect();
    } else {
      mqttService.disconnect();
    }
    
    return () => {
      // Don't disconnect on unmount, let the auth store handle it
    };
  }, [user]);

  return mqttService;
}
