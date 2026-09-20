import { Ionicons } from '@expo/vector-icons';
import { Strings } from '../constants/strings';

/**
 * Formats a monetary amount using Western Arabic numerals (0-9)
 * and appends the compact Jordanian Dinar label (د.أ).
 *
 * Example:
 * formatCurrency(500) => "500.00 د.أ"
 * formatCurrency(1250.5) => "1,250.50 د.أ"
 */
export function formatCurrency(
  amount: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
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

  return showSymbol ? `${formattedNum} ${Strings.common.currency}` : formattedNum;
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

export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

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
 * Formats a date string (YYYY-MM-DD) into an Arabic display format.
 * e.g. "18 سبتمبر 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const monthName = ARABIC_MONTHS[month] || '';
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats a date string (YYYY-MM-DD) into an Arabic header for transaction groups.
 * e.g. "اليوم - الجمعة، 18 سبتمبر" or "أمس - الخميس، 17 سبتمبر" or "الأربعاء، 16 سبتمبر 2026"
 */
export function formatTransactionGroupDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    const dayOfWeek = ARABIC_DAYS[date.getDay()] || '';
    const monthName = ARABIC_MONTHS[month] || '';

    const todayStr = formatDateToISO(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToISO(yesterday);

    if (dateStr === todayStr) {
      return `اليوم • ${dayOfWeek}، ${day} ${monthName}`;
    }
    if (dateStr === yesterdayStr) {
      return `أمس • ${dayOfWeek}، ${day} ${monthName}`;
    }

    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
      return `${dayOfWeek}، ${day} ${monthName}`;
    }
    return `${dayOfWeek}، ${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats a transaction date into a relative label (اليوم / أمس / YYYY/MM/DD).
 */
export function formatRelativeDate(dateStr: string): string {
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

    if (isToday) return Strings.home.todayLabel;
    if (isYesterday) return Strings.home.yesterdayLabel;

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

