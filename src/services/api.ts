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

/**
 * Single shared in-flight refresh promise.
 * Prevents race conditions during token rotation when multiple concurrent
 * requests receive 401 Unauthorized responses.
 */
let refreshPromise: Promise<string> | null = null;

// Request Interceptor: Always attach the current access token dynamically at request time
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();

    // Do not attach Authorization header to unauthenticated auth endpoints
    const requestUrl = config.url || '';
    const isUnauthRoute =
      requestUrl.includes('/auth/request-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/refresh');

    if (!isUnauthRoute) {
      // Dynamically read the current access token at request time (in-memory Zustand store first, fallback to SecureStore)
      const token = useAuthStore.getState().accessToken || (await getAccessToken());
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401s, coordinate single refresh promise, retry failed requests
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check for authentication failures: HTTP 401 or HTTP 403 with 'invalid or expired token'
    const status = error.response?.status;
    const responseData = error.response?.data as { error?: string } | undefined;
    const isAuthError =
      status === 401 ||
      (status === 403 && responseData?.error === 'invalid or expired token');

    if (!isAuthError || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isAuthRoute =
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/request-otp');

    // Never retry auth routes or requests that have already been retried once
    if (isAuthRoute || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Check if the access token was ALREADY refreshed by another request while this request was in flight
    const authHeader = (originalRequest.headers?.Authorization as string) || '';
    const sentToken = authHeader.replace(/^Bearer\s+/i, '');
    const currentToken = useAuthStore.getState().accessToken;

    if (currentToken && sentToken && currentToken !== sentToken) {
      console.log(
        `[Auth] 401 on ${requestUrl}, but access token was already rotated. Retrying immediately with fresh token...`
      );
      originalRequest.headers.Authorization = `Bearer ${currentToken}`;
      return api(originalRequest);
    }

    // If a refresh is ALREADY in progress, queue this request to await the existing promise
    if (refreshPromise) {
      console.log(
        `[Auth] 401 on ${requestUrl}. Refresh already in flight — queueing request to wait for shared promise...`
      );
      try {
        const newAccessToken = await refreshPromise;
        console.log(
          `[Auth] Shared refresh promise resolved for queued request: ${requestUrl}. Retrying...`
        );
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (queueErr) {
        return Promise.reject(queueErr);
      }
    }

    // No refresh in flight: initiate single shared refresh promise
    console.log(`[Auth] 401 encountered on ${requestUrl}. Starting token refresh flow...`);

    refreshPromise = (async () => {
      try {
        const currentRefreshToken = await getRefreshToken();

        if (!currentRefreshToken) {
          throw new Error('No refresh token available in storage');
        }

        const activeBaseUrl = getApiBaseUrl();
        console.log('[Auth] Calling POST /auth/refresh with current refresh token...');

        // Use raw axios instance to prevent recursive interceptor loops
        const response = await axios.post<{
          status: string;
          accessToken: string;
          refreshToken: string;
        }>(`${activeBaseUrl}/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        console.log('[Auth] Token refresh succeeded! Rotating tokens in SecureStore and AuthStore...');

        // (a) Write new tokens to SecureStore & memoryStorage
        await setTokens(newAccessToken, newRefreshToken);

        // (b) Update Zustand auth store
        await useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

        console.log('[Auth] Both tokens successfully rotated and persisted. Resuming requests...');
        return newAccessToken;
      } catch (refreshErr) {
        console.error('[Auth] Token refresh failed! Clearing vault and redirecting to login...', refreshErr);

        // Clear stored tokens and reset Zustand auth store
        await clearTokens();
        await useAuthStore.getState().clearAuth();

        // Flag session expiration to show clear user-facing message on login screen
        useAuthStore.getState().setSessionExpired(true);

        throw refreshErr;
      } finally {
        // Reset shared promise when settled so subsequent expirations can refresh cleanly
        refreshPromise = null;
      }
    })();

    try {
      const newAccessToken = await refreshPromise;
      // (c) Retry the original initiating request with new access token
      console.log(`[Auth] Retrying original request with newly refreshed token: ${requestUrl}`);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (err) {
      return Promise.reject(err);
    }
  }
);

export default api;
