import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokens';
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh token queue to prevent race conditions during token rotation
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check in-memory Zustand store first for performance, fallback to SecureStore
    const token = useAuthStore.getState().accessToken || (await getAccessToken());

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 with token refresh & queueing
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If there is no response or error is not 401, reject immediately
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt to refresh if the failed request was an auth route itself
    const requestUrl = originalRequest.url || '';
    const isAuthRoute =
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/request-otp');

    if (isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If another request is currently refreshing the token, enqueue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const currentRefreshToken = await getRefreshToken();

      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Backend endpoint: POST /auth/refresh  body: { refreshToken }
      // Using a raw axios instance to prevent recursive interceptor calls
      const response = await axios.post<{
        status: string;
        accessToken: string;
        refreshToken: string;
      }>(`${BASE_URL}/auth/refresh`, {
        refreshToken: currentRefreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data;

      // Backend rotates the refresh token on every use; persist both!
      await setTokens(newAccessToken, newRefreshToken);
      await useAuthStore.getState().setAccessToken(newAccessToken);

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      await useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
