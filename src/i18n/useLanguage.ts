import { useCallback, useMemo } from 'react';
import { useLanguageStore, Language } from '../store/languageStore';
import { enTranslations, arTranslations, interpolate, translate } from './index';
import { TranslationsSchema, InterpolationParams } from './types';

export function useLanguage() {
  const language = useLanguageStore((state) => state.language);
  const isRTL = useLanguageStore((state) => state.isRTL);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const isLoading = useLanguageStore((state) => state.isLoading);

  const strings: TranslationsSchema = useMemo(() => {
    return language === 'ar' ? arTranslations : enTranslations;
  }, [language]);

  const t = useCallback(
    (keyPath: string, params?: InterpolationParams) => {
      return translate(keyPath, params, language);
    },
    [language]
  );

  return {
    language,
    isRTL,
    isLoading,
    setLanguage,
    strings,
    t,
  };
}

export const useTranslation = useLanguage;
