export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "@qine_deliveryapp_language";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "am", label: "Amharic", nativeLabel: "አማርኛ" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(
  (language) => language.code,
);

export function isSupportedLanguage(
  language?: string | null,
): language is SupportedLanguage {
  return !!language && supportedLanguageCodes.includes(language as SupportedLanguage);
}
