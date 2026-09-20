import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'ar';

export const LANGUAGE_STORAGE_KEY = '@my_wallet_language';

interface LanguageState {
  language: Language;
  isRTL: boolean;
  isLoading: boolean;

  // Actions
  setLanguage: (lang: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en', // English by default
  isRTL: false,
  isLoading: true,

  setLanguage: async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.warn('[LanguageStore] Failed to save language preference:', error);
    }
    set({
      language: lang,
      isRTL: lang === 'ar',
    });
  },

  initializeLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        set({
          language: saved,
          isRTL: saved === 'ar',
          isLoading: false,
        });
        return;
      }
    } catch (error) {
      console.warn('[LanguageStore] Failed to load language preference:', error);
    }

    // Default to English if not previously set
    set({
      language: 'en',
      isRTL: false,
      isLoading: false,
    });
  },
}));
