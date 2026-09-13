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
