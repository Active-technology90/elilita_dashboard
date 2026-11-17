import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type SupportedLanguage,
  isSupportedLanguage,
} from "./languages";

export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isSupportedLanguage(storedLanguage) ? storedLanguage : null;
}

export async function storeLanguage(language: SupportedLanguage) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  const baseLanguage = language?.split("-")[0]?.toLowerCase();
  return isSupportedLanguage(baseLanguage) ? baseLanguage : DEFAULT_LANGUAGE;
}