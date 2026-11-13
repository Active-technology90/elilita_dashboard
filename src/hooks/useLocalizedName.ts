import { useTranslation } from "react-i18next";

/**
 * Returns the Amharic value when the current language is "am"
 * AND the Amharic value is non-empty. Otherwise falls back to English.
 */
export function useLocalizedName() {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language?.split("-")[0] === "am";

  const pick = (
    english: string | undefined | null,
    amharic: string | undefined | null,
  ): string => {
    if (isAmharic && amharic && String(amharic).trim() !== "") {
      return String(amharic);
    }
    return english ? String(english) : "";
  };

  return { pick, isAmharic };
}