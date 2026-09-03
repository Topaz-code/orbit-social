import { useEffect } from 'react';
import { mqttService } from '../lib/mqtt';
import { useAuthStore } from '../stores/authStore';

export function useMQTT() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // FIX 5 — pass the user id so the clientId is attributable in the broker
      // logs, and catch the rejection: `connect()` rejects on an auth failure
      // or timeout, and an unhandled rejection here would surface as a red-box
      // in dev and a silent no-op in release.
      mqttService.connect(user.id).catch((err) => {
        console.warn('[Orbit] MQTT connect failed:', err?.message || err);
      });
    } else {
      mqttService.disconnect();
    }

    return () => {
      // Don't disconnect on unmount, let the auth store handle it
    };
  }, [user]);

  return mqttService;
}
