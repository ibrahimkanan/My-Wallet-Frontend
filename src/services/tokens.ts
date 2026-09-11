import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'my_wallet_access_token';
const REFRESH_TOKEN_KEY = 'my_wallet_refresh_token';

// In-memory fallback for environments where SecureStore is unavailable (e.g. standard SSR or certain web configs)
const memoryStorage = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  return await SecureStore.isAvailableAsync();
}

/**
 * Retrieve the current access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
    return memoryStorage.get(ACCESS_TOKEN_KEY) ?? null;
  } catch (error) {
    console.warn('[Tokens] Error reading access token:', error);
    return memoryStorage.get(ACCESS_TOKEN_KEY) ?? null;
  }
}

/**
 * Retrieve the current refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
    return memoryStorage.get(REFRESH_TOKEN_KEY) ?? null;
  } catch (error) {
    console.warn('[Tokens] Error reading refresh token:', error);
    return memoryStorage.get(REFRESH_TOKEN_KEY) ?? null;
  }
}

/**
 * Save both access and refresh tokens (e.g., after login or rotation)
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  try {
    memoryStorage.set(ACCESS_TOKEN_KEY, accessToken);
    memoryStorage.set(REFRESH_TOKEN_KEY, refreshToken);

    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('[Tokens] Error persisting tokens:', error);
    throw error;
  }
}

/**
 * Update only the access token in storage
 */
export async function setAccessToken(accessToken: string): Promise<void> {
  try {
    memoryStorage.set(ACCESS_TOKEN_KEY, accessToken);
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    }
  } catch (error) {
    console.error('[Tokens] Error updating access token:', error);
    throw error;
  }
}

/**
 * Delete both tokens from SecureStore and memory
 */
export async function clearTokens(): Promise<void> {
  try {
    memoryStorage.delete(ACCESS_TOKEN_KEY);
    memoryStorage.delete(REFRESH_TOKEN_KEY);

    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.warn('[Tokens] Error clearing tokens:', error);
  }
}
