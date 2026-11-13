import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../i18n/languages";
import { storeLanguage } from "../../i18n/storage";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("dashboard");

  const handleChange = async (code: SupportedLanguage) => {
    await i18n.changeLanguage(code);
    await storeLanguage(code);
  };

  return (
    <div className="relative">
      <select
        value={i18n.language?.split("-")[0] || "en"}
        onChange={(e) => handleChange(e.target.value as SupportedLanguage)}
        title={t("language")}
        className="
          h-8
          cursor-pointer
          appearance-none
          rounded-lg
          border
          border-secondary/10
          bg-secondary/[0.035]
          pl-7
          pr-2
          text-[11px]
          font-semibold
          text-secondary
          outline-none
          transition-colors
          hover:border-secondary/20
          hover:bg-secondary/[0.08]
          focus:ring-2
          focus:ring-secondary/20
        "
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeLabel}
          </option>
        ))}
      </select>
      <Globe className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary" />
    </div>
  );
}