import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import mqttClient from '../lib/mqtt';

import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    display_name: string;
    email: string;
    password: string;
    phone?: string;
    security_question?: string;
    security_answer?: string;
  }) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', {
      identifier: identifier.trim(),
      password,
      rememberMe: true,
    });

    if (res.data?.success && res.data?.data) {
      const { user, accessToken, refreshToken } = res.data.data;
      if (accessToken) {
        await SecureStore.setItemAsync('access_token', accessToken);
      }
      if (refreshToken) {
        await SecureStore.setItemAsync('refresh_token', refreshToken);
      }

      // Connect MQTT for real-time presence/notifications
      try {
        mqttClient.connect(user.id, accessToken);
      } catch (err) {
        console.warn('MQTT connect error:', err);
      }

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      throw new Error(res.data?.message || 'Login failed');
    }
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.success && res.data?.data) {
      const { user, accessToken, refreshToken } = res.data.data;
      if (accessToken) {
        await SecureStore.setItemAsync('access_token', accessToken);
      }
      if (refreshToken) {
        await SecureStore.setItemAsync('refresh_token', refreshToken);
      }

      try {
        mqttClient.connect(user.id, accessToken);
      } catch (err) {
        console.warn('MQTT connect error:', err);
      }

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      throw new Error(res.data?.message || 'Registration failed');
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    } catch {}
    try {
      mqttClient.disconnect();
    } catch {}

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!token) {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.data) {
        const user = response.data.data;
        try {
          mqttClient.connect(user.id, token);
        } catch {}
        set({
          user,
          accessToken: token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      }
    } catch (e) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
