import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { username: string; email: string; display_name: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        set({
          user: res.data.data,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        await AsyncStorage.removeItem('access_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem('access_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data?.success && res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        await AsyncStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refresh_token', refreshToken);
        }
        set({ user, token: accessToken, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials';
      return { success: false, message: msg };
    }
  },

  register: async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data?.success && res.data?.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        await AsyncStorage.setItem('access_token', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refresh_token', refreshToken);
        }
        set({ user, token: accessToken, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
