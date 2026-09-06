import axios from 'axios';
import { API_BASE_URL } from './constants.js';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

/** Decode JWT payload without verification (client-side only, for expiry pre-check). */
function getTokenExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Returns true if the token expires within the next 60 seconds. */
function isTokenExpiringSoon(token: string): boolean {
  const exp = getTokenExp(token);
  if (!exp) return false;
  return Date.now() / 1000 >= exp - 60; // refresh 60 s before actual expiry
}

let refreshInFlight: Promise<string | null> | null = null;

export async function silentRefresh(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      // Browser automatically transmits HttpOnly 'orbit_refresh_token' cookie with withCredentials: true
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      if (res.data?.data?.accessToken) {
        const newAccessToken = res.data.data.accessToken;
        setAccessToken(newAccessToken);
        return newAccessToken;
      }
      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// Request interceptor — attach in-memory JWT and proactively refresh if expiring soon
api.interceptors.request.use(
  async (config) => {
    let token = getAccessToken();

    // Proactively refresh token if it expires within 60 seconds
    if (token && isTokenExpiringSoon(token)) {
      const refreshed = await silentRefresh();
      if (refreshed) token = refreshed;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — fallback refresh on unexpected 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/2fa');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      const newToken = await silentRefresh();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 403) {
      const msg = error.response.data?.message?.toLowerCase() || '';
      if (msg.includes('banned') || msg.includes('suspended') || msg.includes('timeout')) {
        try {
          const userStr = localStorage.getItem('orbit_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.is_banned = true;
            if (error.response.data?.banned_until) {
              user.banned_until = error.response.data.banned_until;
            }
            if (error.response.data?.message) {
              user.ban_reason = error.response.data.message;
            }
            localStorage.setItem('orbit_user', JSON.stringify(user));
          }
        } catch {}
        if (window.location.pathname !== '/banned') {
          window.location.href = '/banned';
        }
      }
    }

    return Promise.reject(error);
  }
);
