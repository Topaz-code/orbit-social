import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

/**
 * FIX 4 — the ONLY correct login route in this app.
 *
 * The auth screens live under the `(auth)` group: `mobile/app/(auth)/login.tsx`.
 * `router.replace('/login')` does NOT resolve — expo-router has no top-level
 * `/login` route, so it falls through to `app/+not-found.tsx` and the user
 * ends up on a dead screen that still thinks it is signed out. Always use the
 * grouped path.
 */
export const AUTH_LOGIN_ROUTE = '/(auth)/login' as const;

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

  /**
   * FIX 4 — the single logout entry point. Every sign-out button in the app
   * must call THIS, not `useAuthStore().logout` directly.
   *
   * Guaranteed order:
   *   1. Clear the Zustand auth state (`setUser(null)` + full session reset).
   *   2. Await the SecureStore token deletion (inside `logout()`).
   *   3. `router.replace(AUTH_LOGIN_ROUTE)` — in a `finally`, so the redirect
   *      happens even if a step above threw. The user can never be stranded.
   *
   * `replace` (not `push`) is deliberate: it removes the tabs from the history
   * stack, so the Android back button cannot walk the user back into a screen
   * that no longer has a user object — which is how Profile ended up blank.
   */
  const handleLogout = async () => {
    try {
      // 1 + 2 — clears in-memory state and awaits SecureStore deletion.
      await logout();

      // Drop every cached server response so the next account cannot see the
      // previous user's feed / chats / notifications.
      try {
        queryClient.clear();
      } catch (e) {
        console.warn('[Auth] queryClient.clear failed:', e);
      }
    } catch (err) {
      // A failed logout must still log the user out locally.
      console.error('[Auth] logout failed, forcing local sign-out:', err);
      try {
        useAuthStore.getState().setUser(null);
      } catch {
        // Nothing else we can do.
      }
    } finally {
      // 3 — ALWAYS navigate. This is the line that was missing entirely from
      // the Profile screen's logout button, which called `logout()` and then
      // simply stopped, leaving the protected layout mounted with no user.
      try {
        router.replace(AUTH_LOGIN_ROUTE);
      } catch (navErr) {
        console.error('[Auth] router.replace failed:', navErr);
      }
    }
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
