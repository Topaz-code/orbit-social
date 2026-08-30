import { useAuthStore } from '../stores/authStore.js';
import { api } from '../lib/api.js';
import { User } from '../types/index.js';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    setAuth,
    setUser,
    logout,
    initializeAuth,
  } = useAuthStore();

  const register = async (formData: any) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  };

  const login = async (formData: any) => {
    const res = await api.post('/auth/login', formData);
    if (res.data.success) {
      setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.refreshToken);
    }
    return res.data;
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch {
      // Ignored
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const res = await api.put(`/users/${user.id}`, data);
    if (res.data.success) {
      setUser(res.data.data);
    }
    return res.data;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    refreshProfile,
    updateProfile,
    initializeAuth,
  };
}
