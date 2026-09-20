import { Ionicons } from '@expo/vector-icons';
import { Strings } from '../constants/strings';
import { getStrings } from '../i18n';
import { useLanguageStore, Language } from '../store/languageStore';

/**
 * Formats a monetary amount using Western Arabic numerals (0-9)
 * and appends the active localized currency label (e.g., "500.00 JOD" or "500.00 د.أ").
 */
export function formatCurrency(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
    language?: Language;
  }
): string {
  const num = Number(amount) || 0;
  const minDigits = options?.minimumFractionDigits ?? 2;
  const maxDigits = options?.maximumFractionDigits ?? 2;
  const showSymbol = options?.showSymbol ?? true;

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });

  const currencySymbol = options?.language
    ? getStrings(options.language).common.currency
    : Strings.common.currency;

  return showSymbol ? `${formattedNum} ${currencySymbol}` : formattedNum;
}

/**
 * Formats a plain numeric value with comma separators using Western Arabic numerals (0-9).
 */
export function formatNumber(value: number): string {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US');
}

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

export const ENGLISH_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function getLocalizedMonths(lang?: Language): readonly string[] {
  const currentLang = lang || useLanguageStore.getState().language;
  return currentLang === 'ar' ? ARABIC_MONTHS : ENGLISH_MONTHS;
}

export function getLocalizedDays(lang?: Language): readonly string[] {
  const currentLang = lang || useLanguageStore.getState().language;
  return currentLang === 'ar' ? ARABIC_DAYS : ENGLISH_DAYS;
}

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatDateToISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into a localized display format.
 * e.g. "18 September 2026" in EN, or "18 سبتمبر 2026" in AR.
 */
export function formatDateDisplay(dateStr: string, lang?: Language): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const months = getLocalizedMonths(lang);
    const monthName = months[month] || '';
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date string (YYYY-MM-DD) into a localized header for transaction groups.
 * e.g. "Today • Friday, 18 September" or "اليوم • الجمعة، 18 سبتمبر"
 */
export function formatTransactionGroupDate(dateStr: string, lang?: Language): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    const days = getLocalizedDays(lang);
    const months = getLocalizedMonths(lang);

    const dayOfWeek = days[date.getDay()] || '';
    const monthName = months[month] || '';

    const todayStr = formatDateToISO(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToISO(yesterday);

    const isAr = (lang || useLanguageStore.getState().language) === 'ar';
    const dateFormatted = `${day} ${monthName}`;

    if (dateStr === todayStr) {
      return isAr
        ? `اليوم • ${dayOfWeek}، ${dateFormatted}`
        : `Today • ${dayOfWeek}, ${dateFormatted}`;
    }
    if (dateStr === yesterdayStr) {
      return isAr
        ? `أمس • ${dayOfWeek}، ${dateFormatted}`
        : `Yesterday • ${dayOfWeek}, ${dateFormatted}`;
    }

    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
      return isAr
        ? `${dayOfWeek}، ${dateFormatted}`
        : `${dayOfWeek}, ${dateFormatted}`;
    }
    return isAr
      ? `${dayOfWeek}، ${dateFormatted} ${year}`
      : `${dayOfWeek}, ${dateFormatted} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats a transaction date into a relative label (Today / Yesterday / YYYY/MM/DD).
 */
export function formatRelativeDate(dateStr: string, language: Language = 'en'): string {
  if (!dateStr) return '';
  try {
    const txDate = new Date(dateStr);
    const now = new Date();
    const isToday =
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() === now.getMonth() &&
      txDate.getDate() === now.getDate();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      txDate.getFullYear() === yesterday.getFullYear() &&
      txDate.getMonth() === yesterday.getMonth() &&
      txDate.getDate() === yesterday.getDate();

    const s = getStrings(language);
    if (isToday) return s.home.todayLabel;
    if (isYesterday) return s.home.yesterdayLabel;

    return `${txDate.getFullYear()}/${txDate.getMonth() + 1}/${txDate.getDate()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns standard Ionicons icon name for a wallet type.
 */
export function getWalletIcon(type?: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'bank':
      return 'business-outline';
    case 'card':
      return 'card-outline';
    case 'cash':
    default:
      return 'cash-outline';
  }
}
