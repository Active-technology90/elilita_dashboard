
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../../i18n/languages";
import { storeLanguage } from "../../i18n/storage";
import { Globe, Check, ChevronDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PRIMARY_COLOR = "#6750A4";

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  am: "🇪🇹",
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("dashboard");

  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    i18n.resolvedLanguage?.split("-")[0] ||
    i18n.language?.split("-")[0] ||
    "en";

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleChange = async (code: SupportedLanguage) => {
    if (code === currentLanguage || isChanging) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);

    try {
      await i18n.changeLanguage(code);
      await storeLanguage(code);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to change language:", error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative shrink-0">
      {/* Language trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isChanging}
        aria-label={t("languageSwitcher.title", {
          defaultValue: "Select language",
        })}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          group flex h-9 items-center gap-1.5 sm:gap-2
          rounded-lg border px-2 sm:px-2.5
          bg-white
          text-gray-800
          text-xs font-semibold
          transition-all duration-200
          hover:bg-[#6750A4]/[0.04]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#6750A4]/30
          disabled:cursor-wait disabled:opacity-60
          ${
            isOpen
              ? "border-[#6750A4]/40 bg-[#6750A4]/[0.04]"
              : "border-gray-200 hover:border-[#6750A4]/30"
          }
        `}
      >
        <Globe
          className="h-4 w-4 shrink-0"
          style={{ color: PRIMARY_COLOR }}
        />

        <span className="text-sm leading-none">
          {LANGUAGE_FLAGS[currentLanguage] || "🌐"}
        </span>

        <span>{currentLanguage.toUpperCase()}</span>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Responsive dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="
              absolute right-0 top-full z-[9999]
              mt-2

              w-[200px]
              sm:w-[220px]

              max-w-[calc(100vw-16px)]
              max-h-[min(70vh,400px)]

              overflow-y-auto overscroll-contain
              rounded-xl
              border border-[#6750A4]/15

              bg-white text-gray-900

              shadow-[0_12px_35px_rgba(30,20,60,0.16)]

              dark:border-white/10
              dark:bg-[#211b30]
              dark:text-white
            "
            role="listbox"
            aria-label={t("languageSwitcher.title", {
              defaultValue: "Select language",
            })}
            aria-busy={isChanging}
          >
            {/* Header */}
            <div className="px-3 pb-2 pt-3 sm:px-3.5 sm:pb-2.5 sm:pt-3.5">
              <p className="text-xs md:text-xl font-bold text-[#6750A4]">
                {t("languageSwitcher.title", {
                  defaultValue: "Select language",
                })}
              </p>

              <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-[11px]">
                {t("languageSwitcher.description", {
                  defaultValue: "Choose your preferred language",
                })}
              </p>
            </div>

            <div className="mx-3 border-t border-gray-100 dark:border-white/10" />

            {/* Language options */}
            <div className="space-y-1 p-1.5 sm:p-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLanguage;

                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isChanging}
                    onClick={() => handleChange(lang.code)}
                    className={`
                      flex w-full items-center gap-2.5
                      rounded-lg px-2.5 py-2
                      text-left
                      transition-colors duration-150

                      sm:gap-3 sm:py-2.5

                      disabled:cursor-wait disabled:opacity-60

                      ${
                        isSelected
                          ? "bg-[#6750A4]/[0.09]"
                          : "hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-white/[0.06]"
                      }
                    `}
                  >
                    {/* Flag */}
                    <span className="
                      flex h-8 w-8 shrink-0 items-center justify-center
                      rounded-lg bg-gray-100 text-base
                      dark:bg-white/10
                      sm:h-9 sm:w-9 sm:text-lg
                    ">
                      {LANGUAGE_FLAGS[lang.code] || "🌐"}
                    </span>

                    {/* Language name */}
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs font-semibold ${
                          isSelected
                            ? "text-[#6750A4] dark:text-[#B9A5F5]"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {lang.nativeLabel}
                      </span>

                      <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                        {t(
                          `languageSwitcher.languages.${lang.code}`,
                          { defaultValue: lang.code.toUpperCase() }
                        )}
                      </span>
                    </span>

                    {/* Selected indicator */}
                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0"
                        style={{ color: PRIMARY_COLOR }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Loading state */}
            {isChanging && (
              <div className="
                flex items-center gap-2
                border-t border-gray-100
                px-3 py-2
                dark:border-white/10
              ">
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  style={{ color: PRIMARY_COLOR }}
                />

                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t("languageSwitcher.changing", {
                    defaultValue: "Changing language...",
                  })}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
