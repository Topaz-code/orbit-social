import { create } from 'zustand';
import { User } from '../types/index.js';
import { mqttClient } from '../lib/mqtt.js';
import { destroyPeerInstance } from '../lib/peer.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('orbit_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('orbit_refresh_token', refreshToken);
    }
    localStorage.setItem('orbit_user', JSON.stringify(user));

    // Connect MQTT client for this user (with JWT for broker auth)
    mqttClient.connect(user.id, accessToken);


    set({
      user,
      accessToken,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => {
    localStorage.setItem('orbit_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('orbit_access_token');
    localStorage.removeItem('orbit_refresh_token');
    localStorage.removeItem('orbit_user');

    mqttClient.disconnect();
    destroyPeerInstance();

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: () => {
    try {
      const token = localStorage.getItem('orbit_access_token');
      const refreshToken = localStorage.getItem('orbit_refresh_token');
      const userStr = localStorage.getItem('orbit_user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        mqttClient.connect(user.id, token);
        set({
          user,
          accessToken: token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
