import { create } from 'zustand';
import { User } from '../types/index.js';
import { mqttClient } from '../lib/mqtt.js';
import { destroyPeerInstance } from '../lib/peer.js';
import { api, setAccessToken, silentRefresh } from '../lib/api.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, _refreshToken) => {
    // Security: Session tokens MUST NEVER be stored in localStorage (XSS mitigation)
    localStorage.removeItem('orbit_access_token');
    localStorage.removeItem('orbit_refresh_token');

    // Store in-memory token for API calls
    setAccessToken(accessToken);

    // Connect MQTT client for this user (with JWT for broker auth)
    mqttClient.connect(user.id, accessToken);

    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    const fcmToken = localStorage.getItem('orbit_fcm_token');
    if (fcmToken) {
      api.delete('/device/token', { data: { token: fcmToken } }).catch(() => {});
    }

    // Inform server to clear HttpOnly refresh cookie
    api.post('/auth/logout').catch(() => {});

    // Wipe any lingering localStorage auth keys
    localStorage.removeItem('orbit_access_token');
    localStorage.removeItem('orbit_refresh_token');
    localStorage.removeItem('orbit_user');

    // Wipe in-memory token
    setAccessToken(null);

    mqttClient.disconnect();
    destroyPeerInstance();

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: async () => {
    // Purge any tokens that might have been stored in legacy versions
    localStorage.removeItem('orbit_access_token');
    localStorage.removeItem('orbit_refresh_token');

    try {
      // Attempt silent session recovery using HttpOnly cookie
      const token = await silentRefresh();
      if (token) {
        setAccessToken(token);

        // Fetch fresh user profile
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.data) {
          const freshUser = res.data.data;
          mqttClient.connect(freshUser.id, token);
          set({
            user: freshUser,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // Session expired or unauthenticated
    }

    // Clean up if recovery failed
    localStorage.removeItem('orbit_user');
    setAccessToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
