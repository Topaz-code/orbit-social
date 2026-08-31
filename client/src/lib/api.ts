import axios from 'axios';
import { API_BASE_URL } from './constants.js';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

async function silentRefresh(): Promise<string | null> {
  // Deduplicate concurrent refresh attempts
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem('orbit_refresh_token');
    if (!refreshToken) return null;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      if (res.data?.data?.accessToken) {
        const newAccessToken = res.data.data.accessToken;
        localStorage.setItem('orbit_access_token', newAccessToken);
        if (res.data.data.refreshToken) {
          localStorage.setItem('orbit_refresh_token', res.data.data.refreshToken);
        }
        return newAccessToken;
      }
      return null;
    } catch {
      localStorage.removeItem('orbit_access_token');
      localStorage.removeItem('orbit_refresh_token');
      localStorage.removeItem('orbit_user');
      window.location.href = '/login';
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// Request interceptor — attach JWT and proactively refresh if expiring soon
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('orbit_access_token');

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await silentRefresh();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
