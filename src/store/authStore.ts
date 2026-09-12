import { create } from 'zustand';
import { User } from '../types/models';
import {
  getAccessToken,
  getRefreshToken,
  getUser,
  setTokens,
  setUser as persistUser,
  setAccessToken as persistAccessToken,
  clearTokens,
} from '../services/tokens';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  setAccessToken: (accessToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user: User, accessToken: string, refreshToken: string) => {
    await setTokens(accessToken, refreshToken);
    await persistUser(user);
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: async (user: User) => {
    await persistUser(user);
    set({ user });
  },

  setAccessToken: async (accessToken: string) => {
    await persistAccessToken(accessToken);
    set({ accessToken });
  },

  clearAuth: async () => {
    await clearTokens();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const user = await getUser();

      if (accessToken && refreshToken) {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.warn('[AuthStore] Error initializing auth:', error);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
