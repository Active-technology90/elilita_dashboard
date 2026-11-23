// src/utils/currency.ts
import i18n from "../i18n";

/**
 * Language-aware currency formatter.
 *   en → "ETB 1,220.00"
 *   am → "1,220.00 ብር"
 */
export function formatCurrency(
  amount: number | string,
  options: { decimals?: number } = {},
): string {
  const decimals = options.decimals ?? 2;
  const num = Number(amount || 0);
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return i18n.language?.startsWith("am")
    ? `${formatted} ብር`
    : `ETB ${formatted}`;
}