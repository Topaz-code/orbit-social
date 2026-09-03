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
  // Accepts null so callers can explicitly clear the session (e.g. logout)
  // without going through the full `logout()` flow.
  setUser: (user: User | null) => void;
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

  setUser: (user: User | null) => {
    // Clearing the user must also flip `isAuthenticated`, otherwise screens
    // guarded on that flag keep rendering with a null user.
    set(user ? { user, isAuthenticated: true } : { user, isAuthenticated: false });
  },

  logout: async () => {
    /**
     * FIX 4 — logout must be ORDERED and must ALWAYS finish with a cleared
     * session, no matter which step throws.
     *
     * The white-screen/half-cleared state came from the old order: it fired
     * `POST /auth/logout` FIRST and awaited it. On a slow or cold backend that
     * await hung (axios timeout is 60s), so `set({ user: null, ... })` never
     * ran. The UI had already started tearing down from the button press, the
     * store still held a user, and nothing ever navigated — leaving the app
     * stuck between authenticated and logged-out.
     *
     * New order:
     *   1. Snapshot + clear the in-memory session immediately (UI reacts).
     *   2. Best-effort server logout — fire and forget, never awaited by the
     *      critical path, so a dead backend cannot block sign-out.
     *   3. AWAIT the SecureStore deletions (these are fast and must complete
     *      before we navigate, or `checkAuth` on the login screen would find
     *      the old token and log the user straight back in).
     *   4. `finally` re-asserts the cleared state even if 2 or 3 threw.
     */
    const clearedSession = {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    };

    // 1. Clear in-memory state first so the UI unblocks immediately.
    set(clearedSession);

    // 2. Best-effort server-side revocation. Not awaited: a hanging request
    //    must never be able to trap the user in a half-logged-out state.
    try {
      void api.post('/auth/logout').catch(() => {});
    } catch {
      // Swallow — local sign-out is what matters.
    }

    try {
      // 3. Delete the persisted tokens and tear down the realtime socket.
      try {
        await SecureStore.deleteItemAsync('access_token');
      } catch (e) {
        console.warn('[Auth] Could not delete access_token:', e);
      }
      try {
        await SecureStore.deleteItemAsync('refresh_token');
      } catch (e) {
        console.warn('[Auth] Could not delete refresh_token:', e);
      }
      try {
        mqttClient.disconnect();
      } catch (e) {
        console.warn('[Auth] MQTT disconnect failed:', e);
      }
    } finally {
      // 4. Guarantee the cleared state — this is what stops the desync.
      set(clearedSession);
    }
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
