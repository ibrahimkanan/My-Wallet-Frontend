import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokens';
import { useAuthStore } from '../store/authStore';

/**
 * Dynamically resolves the API base URL.
 * When running on a physical device via Expo Go or an emulator,
 * 'localhost' refers to the phone/emulator itself, not your PC!
 * This function extracts the host machine's IP from Expo's hostUri.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // 1. If user provided a specific non-localhost URL in .env, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. On Web, localhost works directly
  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:3000';
  }

  // 3. For Expo Go / Development builds on physical devices or emulators,
  // hostUri contains the IP of the machine running Metro (e.g. "192.168.1.102:8081")
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  // 4. Android Emulator loopback alias to host machine
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // 5. Default fallback to current local machine LAN IP or localhost
  return 'http://192.168.1.102:3000';
}

export const BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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

// Request Interceptor: Attach dynamic base URL and Bearer token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ensure baseURL is up to date with the latest resolved address
    config.baseURL = getApiBaseUrl();

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

      const activeBaseUrl = getApiBaseUrl();

      // Backend endpoint: POST /auth/refresh  body: { refreshToken }
      // Using a raw axios instance to prevent recursive interceptor calls
      const response = await axios.post<{
        status: string;
        accessToken: string;
        refreshToken: string;
      }>(`${activeBaseUrl}/auth/refresh`, {
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
