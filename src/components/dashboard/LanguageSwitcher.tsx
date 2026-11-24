
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../../i18n/languages";
import { storeLanguage } from "../../i18n/storage";
import {
  Globe,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PRIMARY_COLOR = "#6750A4";

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  am: "🇪🇹",
};

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.97,
    filter: "blur(3px)",
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

const optionVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18 },
  },
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("dashboard");

  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentLanguage =
    i18n.resolvedLanguage?.split("-")[0] ||
    i18n.language?.split("-")[0] ||
    "en";

  const selectedLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === currentLanguage
  );

  // Close dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
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
      <motion.button
        ref={triggerRef}
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isChanging}
        aria-label={t("languageSwitcher.title", {
          defaultValue: "Select language",
        })}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          group relative flex h-9 sm:h-10 items-center
          gap-1.5 sm:gap-2
          rounded-xl border px-2.5 sm:px-3
          bg-white dark:bg-[#211b30]
          text-gray-800 dark:text-gray-100
          text-xs font-semibold
          shadow-sm hover:shadow-md
          transition-all duration-200
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#6750A4]/30
          disabled:cursor-wait disabled:opacity-60
          ${
            isOpen
              ? "border-[#6750A4]/50 bg-[#6750A4]/[0.05] dark:bg-[#6750A4]/15 shadow-sm"
              : "border-gray-200 dark:border-white/10 hover:border-[#6750A4]/40"
          }
        `}
      >
        <Globe
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:rotate-12"
          style={{ color: PRIMARY_COLOR }}
        />

        <span className="text-base leading-none">
          {LANGUAGE_FLAGS[currentLanguage] || "🌐"}
        </span>

        <span className="font-bold tracking-wide">
          {currentLanguage.toUpperCase()}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />

        {isChanging && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6750A4] opacity-40" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#6750A4]" />
          </span>
        )}
      </motion.button>

      {/* Animated dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              absolute right-0 top-full z-[9999]
              mt-2.5
              w-[min(260px,calc(100vw-24px))]
              max-h-[min(70vh,420px)]
              overflow-hidden
              rounded-2xl
              border border-gray-200/80
              dark:border-white/10
              bg-white dark:bg-[#211b30]
              text-gray-900 dark:text-white
              shadow-[0_16px_50px_rgba(30,20,60,0.18)]
              dark:shadow-[0_16px_50px_rgba(0,0,0,0.4)]
              origin-top-right
            "
            role="listbox"
            aria-label={t("languageSwitcher.title", {
              defaultValue: "Select language",
            })}
            aria-busy={isChanging}
          >
            {/* Header */}
            <div className="relative overflow-hidden px-4 pb-3 pt-4">
              <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[#6750A4]/[0.08] blur-2xl" />

              <div className="relative flex items-center gap-3">
                <div className="
                  flex h-10 w-10 shrink-0 items-center justify-center
                  rounded-xl bg-[#6750A4]/10
                  dark:bg-[#6750A4]/20
                ">
                  <Globe
                    className="h-5 w-5"
                    style={{ color: PRIMARY_COLOR }}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {t("languageSwitcher.title", {
                      defaultValue: "Select language",
                    })}
                  </p>

                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {t("languageSwitcher.description", {
                      defaultValue: "Choose your preferred language",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-3 border-t border-gray-100 dark:border-white/10" />

            {/* Language options */}
            <div className="
              max-h-[min(45vh,280px)]
              space-y-1 overflow-y-auto
              overscroll-contain p-2
            ">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLanguage;

                return (
                  <motion.button
                    key={lang.code}
                    variants={optionVariants}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isChanging}
                    onClick={() => handleChange(lang.code)}
                    whileHover={!isChanging ? { x: 2 } : undefined}
                    whileTap={!isChanging ? { scale: 0.98 } : undefined}
                    className={`
                      relative flex w-full items-center
                      gap-3 rounded-xl
                      px-3 py-2.5
                      text-left
                      transition-colors duration-200
                      disabled:cursor-wait disabled:opacity-60
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[#6750A4]/40
                      ${
                        isSelected
                          ? "bg-[#6750A4]/[0.09] dark:bg-[#6750A4]/20"
                          : "hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                      }
                    `}
                  >
                    {/* Flag */}
                    <span className={`
                      flex h-10 w-10 shrink-0 items-center justify-center
                      rounded-xl text-xl
                      transition-colors duration-200
                      ${
                        isSelected
                          ? "bg-[#6750A4]/10 dark:bg-[#6750A4]/25"
                          : "bg-gray-100 dark:bg-white/[0.07]"
                      }
                    `}>
                      {LANGUAGE_FLAGS[lang.code] || "🌐"}
                    </span>

                    {/* Language name */}
                    <span className="min-w-0 flex-1">
                      <span className={`
                        block truncate text-sm font-semibold
                        ${
                          isSelected
                            ? "text-[#6750A4] dark:text-[#C4B5FD]"
                            : "text-gray-800 dark:text-gray-100"
                        }
                      `}>
                        {lang.nativeLabel}
                      </span>

                      <span className="mt-0.5 block truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {t(
                          `languageSwitcher.languages.${lang.code}`,
                          { defaultValue: lang.code.toUpperCase() }
                        )}
                      </span>
                    </span>

                    {/* Selected indicator */}
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="
                              flex h-6 w-6 items-center justify-center
                              rounded-full bg-[#6750A4]
                              text-white shadow-sm
                            "
                          >
                            <Check className="h-3.5 w-3.5" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer / loading */}
            <div className="
              border-t border-gray-100
              px-4 py-2.5
              dark:border-white/10
            ">
              <AnimatePresence mode="wait">
                {isChanging ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      style={{ color: PRIMARY_COLOR }}
                    />
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      {t("languageSwitcher.changing", {
                        defaultValue: "Changing language...",
                      })}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="current"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {t("languageSwitcher.current", {
                        defaultValue: "Current language",
                      })}
                    </span>

                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6750A4] dark:text-[#C4B5FD]">
                      {LANGUAGE_FLAGS[currentLanguage] || "🌐"}
                      {selectedLanguage?.nativeLabel || currentLanguage.toUpperCase()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
