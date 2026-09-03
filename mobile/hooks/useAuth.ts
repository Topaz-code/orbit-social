import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { login, register, logout, user, isAuthenticated, isLoading } = useAuthStore();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { identifier: string; password: string }) => {
      await login(credentials.identifier, credentials.password);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      await register(userData);
    },
  });

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    loginMutation,
    registerMutation,
    logout: handleLogout,
  };
}
