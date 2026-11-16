import type { TFunction } from "i18next";

/**
 * Returns the localized variant of a field if the current language
 * is Amharic and the *_am variant exists; otherwise falls back to the base field.
 */
export function localizeField(
  base: string | undefined | null,
  am: string | undefined | null,
  lang: string,
): string {
  if (lang?.toLowerCase().startsWith("am")) {
    return (am && am.trim()) || base || "";
  }
  return base || "";
}

/**
 * Translate a unit code (e.g. "pc", "pcs", "kg") through i18n.
 * Falls back to the raw unit string if no translation is found.
 */
export function translateUnit(
  unit: string | undefined | null,
  t: TFunction,
): string {
  if (!unit) return "";
  // Normalize singular "pc" → "pcs" bucket
  const key = unit === "pc" ? "pcs" : unit;
  const translated = t(`common.units.${key}`, { defaultValue: "" });
  return translated || unit;
}