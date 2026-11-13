
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE } from "./languages";
import { defaultNS, resources } from "./resources";
import { getStoredLanguage, normalizeLanguage } from "./storage";

let initPromise: Promise<typeof i18n> | null = null;

export async function initI18n() {
  if (i18n.isInitialized) return i18n;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!resources || !resources.en) {
        throw new Error(
          "Invalid i18n resources: English translations are missing."
        );
      }

      const storedLanguage = await getStoredLanguage();

      const deviceLanguage = normalizeLanguage(
        navigator.languages?.[0] ?? navigator.language
      );

      const supportedLanguages = Object.keys(resources);
      const namespaces = Object.keys(resources.en);

      await i18n.use(initReactI18next).init({
        compatibilityJSON: "v4",
        defaultNS,
        fallbackLng: DEFAULT_LANGUAGE,
        interpolation: {
          escapeValue: false,
        },
        lng: storedLanguage ?? deviceLanguage,
        ns: namespaces,
        resources,
        supportedLngs: supportedLanguages,
        react: {
          useSuspense: false,
        },
      });

      return i18n;
    } catch (error) {
      initPromise = null;
      console.error("i18n initialization error:", error);
      throw error;
    }
  })();

  return initPromise;
}

export default i18n;
