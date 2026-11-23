
import { useTranslation } from "react-i18next";
import { X, ShieldCheck, Check } from "lucide-react";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  alreadyAgreed: boolean;
}

interface TermsSection {
  title: string;
  paragraphs: string[];
}

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  alreadyAgreed,
}: TermsAndConditionsModalProps) {
  const { t } = useTranslation("terms");

  if (!isOpen) return null;

  const sections = t("termsSections", {
    returnObjects: true,
  }) as TermsSection[];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="flex h-[90vh] max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </div>

            <div>
              <h2
                id="terms-title"
                className="text-lg font-bold text-gray-900"
              >
                {t("termsTitle")}
              </h2>

              <p className="text-xs text-gray-500">
                {t("termsVersion")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-gray-700">
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700">

            <h1 className="mb-2 text-2xl font-extrabold text-gray-900">
              ELILITA
            </h1>

            <p className="mb-6 text-base font-semibold text-gray-700">
              {t("termsSubtitle")}
            </p>

            <p className="mb-4">
              {t("termsIntroduction")}
            </p>

            <p className="mb-6 font-medium">
              {t("termsNotice")}
            </p>

            {/* All 24 Terms Sections */}
            {sections.map((section, index) => (
              <Section
                key={index}
                title={section.title}
                paragraphs={section.paragraphs}
              />
            ))}

            {/* Document Version */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("termsDocumentVersion")}
              </p>

              <p className="text-sm font-bold text-gray-900">
                {t("termsEffectiveDate")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="text-xs text-gray-500">
            {alreadyAgreed ? (
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <Check className="h-4 w-4" />
                {t("alreadyAgreed")}
              </span>
            ) : (
              <span>{t("reviewTermsNotice")}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t("close")}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!alreadyAgreed) {
                  onAccept();
                }
                onClose();
              }}
              className="rounded-xl bg-secondary px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5b4694]"
            >
              {alreadyAgreed
                ? t("closeAccepted")
                : t("agreeAccept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable Terms Section */
function Section({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-base font-bold text-gray-900">
        {title}
      </h3>

      <div className="space-y-2.5">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
