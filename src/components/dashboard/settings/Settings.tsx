import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Building2,
  RotateCcw,
  Save,
  SwatchBook,
  Palette,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AVAILABLE_THEMES,
  DEFAULT_THEME,
  type CompanyTheme,
  useTheme,
} from "../../../context/ThemeContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { updateCompany } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CompanySelector } from "../company-products/CompanySelector";
import type { CompanyListItem } from "../../../types";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type Notice = {
  message: string;
  type: "success" | "error";
};

const getApiErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null) {
      if ("detail" in data && typeof data.detail === "string") return data.detail;
      return Object.entries(data)
        .map(([key, value]) => {
          const text = Array.isArray(value) ? value.join(", ") : String(value);
          return `${key}: ${text}`;
        })
        .join(" ");
    }
  }
  return error instanceof Error ? error.message : "Unknown error";
};

const colorFields: Array<{
  key: keyof CompanyTheme;
  label: string;
  description: string;
}> = [
  { key: "primary", label: "Primary", description: "Buttons, active states, links" },
  { key: "dark", label: "Dark", description: "Sidebar gradients and deep accents" },
  { key: "light", label: "Light", description: "Glows, gradients, soft highlights" },
];

const toCompanyTheme = (theme: CompanyTheme): CompanyTheme => ({
  primary: theme.primary,
  dark: theme.dark,
  light: theme.light,
});

export default function Settings() {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const { companies, isLoading: companiesLoading } = useCompaniesList();
  const {
    currentTheme,
    applyCompanyTheme,
    rememberCompanyTheme,
    refreshCompanyTheme,
  } = useTheme();
  const isSuperAdmin = !user?.memberships?.length;

  const [targetCompany, setTargetCompany] = useState<CompanyListItem | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [loadingTargetTheme, setLoadingTargetTheme] = useState(false);
  const [draftTheme, setDraftTheme] = useState<CompanyTheme>({
    primary: currentTheme.primary,
    dark: currentTheme.dark,
    light: currentTheme.light,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const targetCompanySlug = isSuperAdmin ? targetCompany?.slug : company?.slug;
  const targetCompanyName = isSuperAdmin ? targetCompany?.name : company?.name;
  const canEditTheme =
    isSuperAdmin || company?.role === "owner" || company?.role === "admin";

  const hasInvalidColor = useMemo(
    () => colorFields.some((field) => !HEX_COLOR_PATTERN.test(draftTheme[field.key])),
    [draftTheme],
  );

  const saveDisabledReason = useMemo(() => {
    if (!canEditTheme) return "Only company owners, admins, and superadmins can save themes.";
    if (!targetCompanySlug) return "Choose a company before saving.";
    if (loadingTargetTheme) return "Wait until the selected company theme finishes loading.";
    if (hasInvalidColor) return "Fix invalid hex colors before saving.";
    if (saving) return "Saving theme...";
    return "";
  }, [canEditTheme, hasInvalidColor, loadingTargetTheme, saving, targetCompanySlug]);

  const isSaveDisabled = Boolean(saveDisabledReason);

  useEffect(() => {
    if (isSuperAdmin) return;
    setDraftTheme({
      primary: currentTheme.primary,
      dark: currentTheme.dark,
      light: currentTheme.light,
    });
  }, [currentTheme.primary, currentTheme.dark, currentTheme.light, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || targetCompany || companies.length === 0) return;

    const fromContext = company?.slug
      ? companies.find((c) => c.slug === company.slug)
      : null;

    setTargetCompany(fromContext ?? companies[0]);
  }, [companies, company?.slug, isSuperAdmin, targetCompany]);

  useEffect(() => {
    if (!isSuperAdmin || !targetCompany?.slug) return;

    setNotice(null);

    const found = companies.find((c) => c.slug === targetCompany.slug);
    if (found) {
      setDraftTheme({
        primary: found.theme_primary || DEFAULT_THEME.primary,
        dark: found.theme_dark || DEFAULT_THEME.dark,
        light: found.theme_light || DEFAULT_THEME.light,
      });
    } else {
      setDraftTheme(DEFAULT_THEME);
    }
    setLoadingTargetTheme(false);
  }, [isSuperAdmin, targetCompany?.slug, companies]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const updateDraftColor = (key: keyof CompanyTheme, value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setDraftTheme((previous) => {
      const nextTheme = { ...previous, [key]: normalized };
      if (!isSuperAdmin && HEX_COLOR_PATTERN.test(normalized)) {
        applyCompanyTheme(nextTheme, false);
      }
      return nextTheme;
    });
  };

  const applyPreset = (theme: CompanyTheme) => {
    const nextTheme = toCompanyTheme(theme);
    setDraftTheme(nextTheme);
    if (!isSuperAdmin) {
      applyCompanyTheme(nextTheme, false);
    }
  };

  const resetToDefault = () => applyPreset(DEFAULT_THEME);

  const saveTheme = async () => {
    if (!targetCompanySlug || hasInvalidColor || !canEditTheme) return;

    setSaving(true);
    setNotice(null);
    try {
      const response = await updateCompany(targetCompanySlug, {
        theme_primary: draftTheme.primary,
        theme_dark: draftTheme.dark,
        theme_light: draftTheme.light,
      });

      if (
        !response.data.theme_primary ||
        !response.data.theme_dark ||
        !response.data.theme_light
      ) {
        throw new Error(
          "The backend response does not include company theme fields. Run/deploy the backend theme migration and serializer changes first.",
        );
      }

      const savedTheme = {
        primary: response.data.theme_primary,
        dark: response.data.theme_dark,
        light: response.data.theme_light,
      };

      if (isSuperAdmin) {
        rememberCompanyTheme(targetCompanySlug, savedTheme);
        if (company?.slug === targetCompanySlug) {
          applyCompanyTheme(savedTheme, true);
        }
      } else {
        applyCompanyTheme(savedTheme, true);
      }

      setDraftTheme(savedTheme);
      setNotice({
        message: `Theme saved for ${targetCompanyName || "the selected company"}.`,
        type: "success",
      });
    } catch (error) {
      console.error("Theme save failed:", error);
      if (!isSuperAdmin) {
        await refreshCompanyTheme();
      }
      setNotice({
        message: `Could not save theme. ${getApiErrorMessage(error)}`,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTargetCompany = (slug: string) => {
    const selected = companies.find((item) => item.slug === slug);
    if (selected) {
      setTargetCompany(selected);
      setShowCompanySelector(false);
    }
  };

  if (isSuperAdmin && showCompanySelector) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-10">
        <CompanySelector
          companies={companies}
          isLoading={companiesLoading}
          onSelect={handleSelectTargetCompany}
          onBack={() => setShowCompanySelector(false)}
          disableProductSearch
          title="Choose Company Theme"
          subtitle="Select exactly one company to edit its dashboard theme"
          searchPlaceholder="Search companies by name..."
        />
      </div>
    );
  }

  const isThemeDirty =
    draftTheme.primary !== currentTheme.primary ||
    draftTheme.dark !== currentTheme.dark ||
    draftTheme.light !== currentTheme.light;

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-4xl px-3 pb-28 pt-4 sm:px-6 sm:pb-24 sm:pt-6 lg:px-10 lg:pt-10">
        {/* ========== PAGE HEADER ========== */}
        <header className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary sm:h-12 sm:w-12">
            <SwatchBook className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              Settings
            </h1>
            <p className="mt-0.5 text-[12px] text-gray-500 sm:text-sm">
              Manage appearance and branding for{" "}
              <span className="font-semibold text-gray-700">
                {targetCompanyName || "your company"}
              </span>
              .
            </p>
          </div>
        </header>

        {/* ========== NOTICE ========== */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`mb-4 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[12px] font-medium shadow-sm sm:mb-5 sm:px-4 sm:py-3.5 sm:text-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {notice.type === "success" ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <span className="leading-relaxed">{notice.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== MAIN CARD ========== */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          {/* Company context row (superadmin only) */}
          {isSuperAdmin && (
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white sm:h-11 sm:w-11">
                  {targetCompany?.logo ? (
                    <img
                      src={targetCompany.logo}
                      alt={targetCompany.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-secondary sm:h-5 sm:w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Editing company
                  </p>
                  <p className="truncate text-sm font-bold text-gray-900">
                    {targetCompany?.name || "No company selected"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanySelector(true)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-secondary/20 bg-white px-3.5 py-2 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.06] sm:w-auto sm:text-sm"
              >
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Change company
              </button>
            </div>
          )}

          {/* Section: Presets */}
          <section className="border-b border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-start gap-3 sm:mb-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary sm:h-9 sm:w-9">
                <Palette className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                  Theme presets
                </h2>
                <p className="mt-0.5 text-[12px] text-gray-500 sm:text-sm">
                  Pick a starting palette. You can fine-tune the colors below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {AVAILABLE_THEMES.map((theme) => {
                const isSelected =
                  theme.primary === draftTheme.primary &&
                  theme.dark === draftTheme.dark &&
                  theme.light === draftTheme.light;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => applyPreset(theme)}
                    disabled={!canEditTheme || loadingTargetTheme}
                    className={`group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:p-3 ${
                      isSelected
                        ? "border-secondary bg-secondary/[0.04] shadow-sm ring-1 ring-secondary/30"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {/* Swatch preview bar */}
                    <span
                      className="h-12 w-full rounded-lg shadow-inner sm:h-14"
                      style={{
                        background: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.primary} 55%, ${theme.light} 100%)`,
                      }}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[12px] font-bold sm:text-sm ${
                          isSelected ? "text-secondary" : "text-gray-800"
                        }`}
                      >
                        {theme.name}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-black/5"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="font-mono text-[10px] uppercase text-gray-400">
                        {theme.primary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section: Custom colors */}
          <section className="border-b border-gray-100 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-start gap-3 sm:mb-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary sm:h-9 sm:w-9">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                  Custom colors
                </h2>
                <p className="mt-0.5 text-[12px] text-gray-500 sm:text-sm">
                  Tune each token individually. Use hex (#RRGGBB).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {colorFields.map((field) => {
                const value = draftTheme[field.key];
                const invalid = !HEX_COLOR_PATTERN.test(value);

                return (
                  <div
                    key={field.key}
                    className={`rounded-2xl border bg-white p-3.5 transition sm:p-4 ${
                      invalid ? "border-red-200" : "border-gray-200"
                    }`}
                  >
                    {/* Top: label + color picker */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <label className="block text-[13px] font-bold text-gray-900 sm:text-sm">
                          {field.label}
                        </label>
                        <p className="mt-0.5 text-[11px] leading-snug text-gray-500 sm:text-xs">
                          {field.description}
                        </p>
                      </div>
                      <div className="relative shrink-0">
                        <input
                          type="color"
                          value={
                            HEX_COLOR_PATTERN.test(value)
                              ? value
                              : DEFAULT_THEME[field.key]
                          }
                          disabled={!canEditTheme || loadingTargetTheme}
                          onChange={(event) =>
                            updateDraftColor(field.key, event.target.value)
                          }
                          className="h-10 w-10 cursor-pointer rounded-xl border border-gray-200 bg-white p-1 transition hover:border-gray-300 disabled:cursor-not-allowed sm:h-11 sm:w-11"
                        />
                      </div>
                    </div>

                    {/* Bottom: hex input + swatch */}
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-inset ring-black/5"
                        style={{
                          backgroundColor: HEX_COLOR_PATTERN.test(value)
                            ? value
                            : DEFAULT_THEME[field.key],
                        }}
                      />
                      <input
                        value={value}
                        disabled={!canEditTheme || loadingTargetTheme}
                        onChange={(event) =>
                          updateDraftColor(field.key, event.target.value)
                        }
                        spellCheck={false}
                        className={`h-9 w-full rounded-lg border px-3 font-mono text-[12px] uppercase outline-none transition focus:ring-2 focus:ring-secondary/25 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 sm:h-10 sm:text-sm ${
                          invalid
                            ? "border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-200"
                            : "border-gray-200 bg-white text-gray-800 focus:border-secondary"
                        }`}
                      />
                    </div>

                    {invalid && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        Use #RRGGBB format
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: Live preview */}
          <section className="border-b border-gray-100 bg-gray-50/50 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-start gap-3 sm:mb-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary sm:h-9 sm:w-9">
                <Info className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 sm:text-base">
                  Live preview
                </h2>
                <p className="mt-0.5 text-[12px] text-gray-500 sm:text-sm">
                  See how your colors look on real components.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {/* Buttons & badges preview */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Buttons & badges
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition sm:text-sm"
                    style={{ backgroundColor: draftTheme.primary }}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-2 text-xs font-bold transition sm:text-sm"
                    style={{
                      borderColor: draftTheme.primary,
                      color: draftTheme.primary,
                      backgroundColor: `${draftTheme.primary}0A`,
                    }}
                  >
                    Outline
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${draftTheme.primary}1A`,
                      color: draftTheme.primary,
                    }}
                  >
                    Active
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                    Inactive
                  </span>
                </div>
              </div>

              {/* Gradient preview */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <p className="px-4 pt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Gradient surface
                </p>
                <div
                  className="mt-3 flex h-24 items-end px-4 pb-3 sm:h-28"
                  style={{
                    background: `linear-gradient(135deg, ${draftTheme.dark} 0%, ${draftTheme.primary} 60%, ${draftTheme.light} 100%)`,
                  }}
                >
                  <div className="w-full rounded-lg bg-white/15 px-3 py-2 backdrop-blur-sm">
                    <p className="text-[11px] font-bold text-white drop-shadow-sm">
                      Sidebar / header preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Save disabled reason */}
          {saveDisabledReason && !saving && !loadingTargetTheme && (
            <div className="flex items-start gap-2 border-b border-gray-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-800 sm:px-6 sm:text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span className="leading-relaxed">{saveDisabledReason}</span>
            </div>
          )}

          {/* Section: Danger / reset */}
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Reset to default</p>
              <p className="mt-0.5 text-[12px] text-gray-500 sm:text-sm">
                Reverts the draft to Qine's default palette. Save to publish.
              </p>
            </div>
            <button
              type="button"
              onClick={resetToDefault}
              disabled={!canEditTheme || loadingTargetTheme}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
            >
              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Reset colors
            </button>
          </div>
        </div>
      </div>

      {/* ========== STICKY SAVE BAR ========== */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div className="pointer-events-auto border-t border-gray-200/80 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-3.5 lg:px-10">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 shrink-0 rounded-full transition-colors ${
                  isThemeDirty ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <p className="truncate text-[12px] font-medium text-gray-600 sm:text-sm">
                {isThemeDirty ? "Unsaved changes" : "All changes saved"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetToDefault}
                disabled={!canEditTheme || loadingTargetTheme || !isThemeDirty}
                className="hidden h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={saveTheme}
                disabled={isSaveDisabled}
                title={saveDisabledReason || "Save theme"}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}