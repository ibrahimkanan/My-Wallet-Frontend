import enTranslations from './translations/en.json';
import arTranslations from './translations/ar.json';
import { useLanguageStore, Language } from '../store/languageStore';
import { TranslationsSchema, InterpolationParams } from './types';

export { enTranslations, arTranslations };
export type { TranslationsSchema, InterpolationParams };
export type { Language };

/**
 * Replaces {{param}} tokens in a translation string with provided values.
 */
export function interpolate(template: string, params?: InterpolationParams): string {
  if (!template || !params) return template || '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

/**
 * Returns the translations object for the requested language
 * (or current active language from store if omitted).
 */
export function getStrings(lang?: Language): TranslationsSchema {
  const currentLang = lang || useLanguageStore.getState().language;
  return currentLang === 'ar' ? arTranslations : enTranslations;
}

/**
 * Resolves a nested translation key (e.g. 'common.cancel', 'budgets.spentOf')
 * and performs parameter interpolation.
 */
export function translate(
  keyPath: string,
  params?: InterpolationParams,
  lang?: Language
): string {
  const strings = getStrings(lang);
  const keys = keyPath.split('.');
  let current: any = strings;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      console.warn(`[i18n] Missing translation key: ${keyPath}`);
      return keyPath;
    }
  }

  if (typeof current === 'string') {
    return interpolate(current, params);
  }

  return String(current);
}

export { useLanguage, useTranslation } from './useLanguage';
