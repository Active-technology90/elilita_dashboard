import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  Category,
  SubCategory,
  HeadCompany,
  MealPeriodCategory,
} from "../../../types";
import LocationPickerModal from "./LocationPickerModal";
import {
  MapPin,
  Building2,
  FileText,
  Camera,
  XCircle,
  Check,
  Phone,
  Mail,
  MapPinned,
  FileCheck2,
  Image as ImageIcon,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle,
  ScrollText,
  Palette,
} from "lucide-react";
import { CustomSelect } from "../../ui/CustomSelect";
import MealCategoryIcon, { MEAL_ICON_OPTIONS } from "../../ui/MealCategoryIcon";
import TermsAndConditionsModal from "../../ui/TermsAndConditionsModal";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

export interface CompanyFormData {
  name: string;
  name_am: string;
  slug: string;
  head_company: number | null;
  category: number;
  sub_category: number;
  business_type: string;
  address: string;
  address_am: string;
  description: string;
  description_am: string;
  minimum_order_total: string;
  maximum_cod_total: string;
  latitude: string;
  longitude: string;
  delivery_fee_per_km: string;
  is_active: boolean;
  supports_table_service: boolean;
  show_order_queue: boolean;
  meal_periods?: MealPeriodCategory[];
  logo: File | null;
  cover_image: File | null;
  chapa_sub_account_id: string;
  tin_number: string;
  vat_registration_number: string;
  fan_number: string;
  tax_type: string;
  show_vat: boolean;
  license: File | string | null;
  moa_file: File | string | null;
  contact_phone: string;
  contact_email: string;
  terms_signatory_name?: string;
  terms_signatory_role?: string;
}

interface CompanyFormProps {
  formData: CompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
  formErrors: Record<string, string>;
  categories: Category[];
  subcategories: SubCategory[];
  logoPreview: string | null;
  coverPreview: string | null;
  onLogoFileChange?: (file: File | null) => void;
  onCoverFileChange?: (file: File | null) => void;
  isEditingActive: boolean;
  canManageActiveStatus?: boolean;
  isSuperAdmin?: boolean;
  isMarketing?: boolean;
  isCompanyVerified?: boolean;
  onVerificationChange?: (verified: boolean) => void;
  submitting: boolean;
  editingSlug: string | null;
  headCompanyName?: string | null;
  headCompanies?: HeadCompany[];
  currentStep?: number;
  agreedToTerms?: boolean;
  onAgreedToTermsChange?: (agreed: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*                         ETHIOPIAN PHONE VALIDATION                         */
/* -------------------------------------------------------------------------- */

export const ETHIOPIAN_PHONE_REGEX = /^(?:\+?251|0)(9|7)\d{8}$/;

export interface PhoneValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
  operator?: "ethio_telecom" | "safaricom" | "unknown";
}

export function validateEthiopianPhone(raw: string): PhoneValidationResult {
  if (!raw || !raw.trim()) {
    return { valid: false, error: "phoneRequired" };
  }

  const cleaned = raw.replace(/[\s\-()]/g, "");

  if (!ETHIOPIAN_PHONE_REGEX.test(cleaned)) {
    return {
      valid: false,
      error: "phoneInvalidFormat",
    };
  }

  let normalized: string;
  if (cleaned.startsWith("+251")) {
    normalized = cleaned;
  } else if (cleaned.startsWith("251")) {
    normalized = "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    normalized = "+251" + cleaned.slice(1);
  } else {
    normalized = "+251" + cleaned;
  }

  const operatorDigit = normalized.charAt(4);
  const operator: PhoneValidationResult["operator"] =
    operatorDigit === "9"
      ? "ethio_telecom"
      : operatorDigit === "7"
        ? "safaricom"
        : "unknown";

  return { valid: true, normalized, operator };
}

export const isValidEthiopianPhone = (value: string): boolean =>
  validateEthiopianPhone(value).valid;

/* -------------------------------------------------------------------------- */
/*                              STATIC CONSTANTS                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_MEAL_CATEGORIES: MealPeriodCategory[] = [
  { id: "breakfast", name: "Breakfast", name_am: "ቁርስ", icon: "coffee" },
  { id: "lunch", name: "Lunch", name_am: "ምሳ", icon: "sun" },
  { id: "dinner", name: "Dinner", name_am: "እራት", icon: "moon" },
];

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function CompanyForm({
  formData,
  setFormData,
  formErrors,
  categories,
  subcategories,
  logoPreview,
  coverPreview,
  onLogoFileChange,
  onCoverFileChange,
  isEditingActive,
  canManageActiveStatus = false,
  isSuperAdmin = false,
  isMarketing = false,
  isCompanyVerified = false,
  onVerificationChange,
  submitting: _submitting,
  editingSlug,
  headCompanyName,
  headCompanies = [],
  currentStep = 0,
  agreedToTerms = false,
  onAgreedToTermsChange,
  onSubmit,
  onClose: _onClose,
}: CompanyFormProps) {
  const { t } = useTranslation("company");

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameAm, setNewCatNameAm] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [newCatIcon, setNewCatIcon] = useState("utensils");
  const [phoneTouched, setPhoneTouched] = useState(false);

  /* ----------------------------- Derived data ----------------------------- */

  const filteredSubcategories = useMemo(
    () => subcategories.filter((sub) => sub.category === formData.category),
    [subcategories, formData.category],
  );

  const activeCategories: MealPeriodCategory[] =
    formData.meal_periods && formData.meal_periods.length > 0
      ? formData.meal_periods
      : DEFAULT_MEAL_CATEGORIES;

  const calculatedSlug = newCatName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");

  const phoneCheck = useMemo(
    () => validateEthiopianPhone(formData.contact_phone),
    [formData.contact_phone],
  );

  const effectiveIsSuperAdmin = isSuperAdmin || canManageActiveStatus;
  const showVerificationBlock = effectiveIsSuperAdmin && !!editingSlug;

  const isTermsRequired = isMarketing && !editingSlug;
  const blockedByTerms =
    isTermsRequired &&
    (!agreedToTerms || !formData.terms_signatory_name?.trim());

  /* ------------------------------ Option lists ---------------------------- */

  const BUSINESS_TYPE_OPTIONS = useMemo(
    () => [
      { value: "", label: t("businessTypePlaceholder") },
      { value: "brand", label: t("btBrand") },
      { value: "store", label: t("btStore") },
      { value: "factory", label: t("btFactory") },
      { value: "service", label: t("btService") },
      { value: "delivery_service", label: t("btDelivery") },
      { value: "other", label: t("btOther") },
    ],
    [t],
  );

  const headCompanyOptions = useMemo(
    () => [
      { value: "", label: t("headCompanyPlaceholder") },
      ...headCompanies.map((hc) => ({
        value: String(hc.id),
        label: hc.name,
      })),
    ],
    [headCompanies, t],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "0", label: t("categoryPlaceholder") },
      ...categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
      })),
    ],
    [categories, t],
  );

  const subcategoryOptions = useMemo(
    () => [
      { value: "0", label: t("subcategoryPlaceholder") },
      ...filteredSubcategories.map((sub) => ({
        value: String(sub.id),
        label: sub.name,
      })),
    ],
    [filteredSubcategories, t],
  );

  /* ------------------------------- Helpers -------------------------------- */

  const inputClassName = (error?: string) => `
    w-full border rounded-xl p-2.5 text-sm 
    ${error ? "border-red-500" : "border-gray-300"}
    focus:ring-2 focus:ring-secondary/30 focus:border-secondary 
    outline-none transition
    ${isEditingActive ? "bg-white" : "bg-gray-50 text-gray-700 cursor-not-allowed"}
  `;

  const labelClassName = "block text-sm font-medium text-gray-700 mb-1.5";

  /* ---------------------- Meal category CRUD handlers --------------------- */

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const slug = calculatedSlug;
    if (!slug) return;
    if (activeCategories.some((c) => c.id === slug)) return;

    setFormData((prev) => ({
      ...prev,
      meal_periods: [
        ...activeCategories,
        {
          id: slug,
          name: newCatName.trim(),
          name_am: newCatNameAm.trim() || undefined,
          icon: newCatIcon || "utensils",
        },
      ],
    }));
    setNewCatName("");
    setNewCatNameAm("");
    setNewCatIcon("utensils");
  };

  const handleRemoveCategory = (idToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      meal_periods: activeCategories.filter((c) => c.id !== idToRemove),
    }));
  };

  const handleResetCategories = () => {
    setFormData((prev) => ({
      ...prev,
      meal_periods: DEFAULT_MEAL_CATEGORIES,
    }));
  };

  /* ------------------------- Phone input handlers ------------------------- */

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d+\s()-]/g, "");
    setFormData((prev) => ({ ...prev, contact_phone: cleaned }));
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const result = validateEthiopianPhone(formData.contact_phone);
    if (result.valid && result.normalized) {
      setFormData((prev) => ({
        ...prev,
        contact_phone: result.normalized!,
      }));
    }
  };

  /* ---------------------- Image / license file helpers -------------------- */

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(t("logoHint1"));
      e.target.value = "";
      return;
    }
    setFormData((prev) => ({ ...prev, logo: file }));
    onLogoFileChange?.(file);
  };

  const handleLogoRemove = () => {
    setFormData((prev) => ({ ...prev, logo: null }));
    onLogoFileChange?.(null);
    const input = document.getElementById(
      "logo-upload",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(t("coverHint1"));
      e.target.value = "";
      return;
    }
    setFormData((prev) => ({ ...prev, cover_image: file }));
    onCoverFileChange?.(file);
  };

  const handleCoverRemove = () => {
    setFormData((prev) => ({ ...prev, cover_image: null }));
    onCoverFileChange?.(null);
    const input = document.getElementById(
      "cover-upload",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  /* ======================================================================== */
  /*                       STEP 1 — BASIC INFORMATION                         */
  /* ======================================================================== */

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
          <Building2 className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {t("businessInformation")}
          </h3>
          <p className="text-xs text-gray-500">
            {t("businessInformationDesc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            {t("companyName")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder={t("companyNamePlaceholder")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName(formErrors.name)}
          />
          {formErrors.name && (
            <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
          )}
        </div>
        <div>
          <label className={labelClassName}>{t("companyNameAm")}</label>
          <input
            type="text"
            placeholder={t("companyNameAmPlaceholder")}
            value={formData.name_am}
            onChange={(e) =>
              setFormData({ ...formData, name_am: e.target.value })
            }
            disabled={!isEditingActive}
            className={inputClassName()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            {t("slug")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder={t("slugPlaceholder")}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            disabled={!!editingSlug || !isEditingActive}
            className={`${inputClassName(formErrors.slug)} font-mono`}
          />
          {formErrors.slug && (
            <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>
          )}
        </div>
        <div>
          <label className={labelClassName}>
            {t("businessType")} <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.business_type}
            onChange={(value) =>
              setFormData({ ...formData, business_type: value })
            }
            options={BUSINESS_TYPE_OPTIONS}
            placeholder={t("businessTypePlaceholder")}
            className={formErrors.business_type ? "border-red-500" : ""}
          />
          {formErrors.business_type && (
            <p className="mt-1 text-xs text-red-500">
              {formErrors.business_type}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className={labelClassName}>{t("headCompanyOptional")}</label>
        <CustomSelect
          value={formData.head_company ? String(formData.head_company) : ""}
          onChange={(value) =>
            setFormData({
              ...formData,
              head_company: value ? Number(value) : null,
            })
          }
          options={headCompanyOptions}
          placeholder={t("headCompanyPlaceholder")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            {t("categoryRequired")} <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={String(formData.category)}
            onChange={(value) => {
              const catId = Number(value);
              setFormData({ ...formData, category: catId, sub_category: 0 });
            }}
            options={categoryOptions}
            placeholder={t("categoryPlaceholder")}
            className={formErrors.category ? "border-red-500" : ""}
          />
          {formErrors.category && (
            <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>
          )}
        </div>
        <div>
          <label className={labelClassName}>
            {t("subcategoryRequired")} <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={String(formData.sub_category)}
            onChange={(value) =>
              setFormData({ ...formData, sub_category: Number(value) })
            }
            options={subcategoryOptions}
            placeholder={t("subcategoryPlaceholder")}
            className={formErrors.sub_category ? "border-red-500" : ""}
          />
          {formErrors.sub_category && (
            <p className="mt-1 text-xs text-red-500">
              {formErrors.sub_category}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>{t("description")}</label>
          <textarea
            placeholder={t("descriptionPlaceholder")}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            disabled={!isEditingActive}
            className={`${inputClassName()} resize-none`}
          />
        </div>
        <div>
          <label className={labelClassName}>{t("descriptionAm")}</label>
          <textarea
            placeholder={t("descriptionAmPlaceholder")}
            value={formData.description_am}
            onChange={(e) =>
              setFormData({ ...formData, description_am: e.target.value })
            }
            rows={3}
            disabled={!isEditingActive}
            className={`${inputClassName()} resize-none`}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 pt-2 ${
          canManageActiveStatus ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {canManageActiveStatus && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              formData.is_active
                ? "border-emerald-200 bg-emerald-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <label
              className={`relative inline-flex items-center ${
                isEditingActive && isCompanyVerified
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={!isEditingActive || !isCompanyVerified}
              />
              <div
                className={`h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${
                  formData.is_active ? "bg-emerald-500" : "bg-gray-300"
                } ${!isEditingActive || !isCompanyVerified ? "opacity-60" : ""}`}
              />
            </label>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("isActive")}
              </p>
              <p className="text-xs text-gray-500">
                {!isCompanyVerified
                  ? t("isActiveVerifyHint")
                  : formData.is_active
                    ? t("isActiveVisible")
                    : t("isActiveHidden")}
              </p>
            </div>
          </div>
        )}

        <div
          className={`flex items-center gap-3 rounded-xl border p-3 ${
            formData.supports_table_service
              ? "border-secondary/30 bg-secondary/10"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.supports_table_service}
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData({
                  ...formData,
                  supports_table_service: checked,
                  meal_periods:
                    checked &&
                    (!formData.meal_periods ||
                      formData.meal_periods.length === 0)
                      ? DEFAULT_MEAL_CATEGORIES
                      : formData.meal_periods,
                });
              }}
              disabled={!isEditingActive}
            />
            <div
              className={`h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${
                formData.supports_table_service ? "bg-secondary" : "bg-gray-300"
              } ${!isEditingActive ? "opacity-60" : ""}`}
            />
          </label>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t("tableService")}
            </p>
            <p className="text-xs text-gray-500">
              {formData.supports_table_service
                ? t("tableServiceAvailable")
                : t("tableServiceUnavailable")}
            </p>
          </div>
        </div>

        {formData.supports_table_service && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
              formData.show_order_queue
                ? "border-secondary/30 bg-secondary/10"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_order_queue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    show_order_queue: e.target.checked,
                  })
                }
                disabled={!isEditingActive}
              />
              <div
                className={`h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${
                  formData.show_order_queue ? "bg-secondary" : "bg-gray-300"
                } ${!isEditingActive ? "opacity-60" : ""}`}
              />
            </label>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t("showOrderQueue")}
              </p>
              <p className="text-xs text-gray-500">
                {formData.show_order_queue
                  ? t("showOrderQueueVisible")
                  : t("showOrderQueueHidden")}
              </p>
            </div>
          </div>
        )}
      </div>

      {formData.supports_table_service && (
        <div className="space-y-5 rounded-2xl border border-secondary/20 bg-gradient-to-b from-secondary/[0.02] to-white p-5 shadow-xs">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">
                    {t("mealPeriodsTitle")}
                  </h4>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                    {activeCategories.length}{" "}
                    {activeCategories.length === 1
                      ? t("mealPeriodPeriod")
                      : t("mealPeriodPeriods")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t("mealPeriodsDesc")}
                </p>
              </div>
            </div>

            {isEditingActive && (
              <button
                type="button"
                onClick={handleResetCategories}
                className="inline-flex items-center gap-1.5 self-start rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-xs transition-all hover:border-secondary/30 hover:text-secondary sm:self-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("resetToDefaults")}
              </button>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t("configuredMealCategories")}
            </label>

            {activeCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-xs font-medium text-gray-500">
                  {t("noMealCategories")}
                </p>
                <button
                  type="button"
                  onClick={handleResetCategories}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("loadDefaultCategories")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {activeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="group flex items-center justify-between rounded-xl border border-gray-200/80 bg-white p-3 transition-all hover:border-secondary/30 hover:shadow-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-secondary/20 bg-secondary/10 text-secondary">
                        <MealCategoryIcon
                          icon={cat.icon}
                          className="h-4 w-4 text-secondary"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {cat.name}
                          {cat.name_am && (
                            <span className="ml-1 font-normal text-gray-400">
                              ({cat.name_am})
                            </span>
                          )}
                        </p>
                        <p className="truncate font-mono text-[10px] text-gray-400">
                          {t("catalogId")}: {cat.id}
                        </p>
                      </div>
                    </div>

                    {isEditingActive && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="rounded-lg p-1.5 text-gray-400 opacity-70 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        title={t("removeCategoryTitle", { name: cat.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isEditingActive && (
            <div className="space-y-3 rounded-xl border border-gray-200/80 bg-gray-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <Plus className="h-3.5 w-3.5 text-secondary" />
                  {t("addCustomMealCategory")}
                </span>
                {calculatedSlug && (
                  <span className="rounded border border-gray-200 bg-white px-2 py-0.5 font-mono text-[10px] text-gray-400">
                    {t("catalogId")}:{" "}
                    <span className="font-semibold text-secondary">
                      {calculatedSlug}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    {t("iconLabel")}
                  </label>
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  >
                    {MEAL_ICON_OPTIONS.map((opt) => (
                      <option key={opt.token} value={opt.token}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    {t("nameEnglishLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("mealNamePlaceholder")}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    {t("nameAmharicOptional")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("mealNameAmPlaceholder")}
                    value={newCatNameAm}
                    onChange={(e) => setNewCatNameAm(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim()}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 text-xs font-bold text-white shadow-xs transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("addBtn")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ======================================================================== */
  /*                       STEP 2 — LOCATION & CONTACT                        */
  /* ======================================================================== */

  const renderStep2 = () => {
    const showPhoneError =
      (phoneTouched || !!formData.contact_phone) && !phoneCheck.valid;

    const operatorLabel =
      phoneCheck.operator === "ethio_telecom"
        ? "ethio telecom"
        : phoneCheck.operator === "safaricom"
          ? "safaricom"
          : phoneCheck.operator || "";

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <MapPinned className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {t("locationContact")}
            </h3>
            <p className="text-xs text-gray-500">{t("locationContactDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {t("addressLabel")}{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder={t("addressPlaceholder")}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              disabled={!isEditingActive}
              className={inputClassName(formErrors.address)}
            />
            {formErrors.address && (
              <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
            )}
          </div>
          <div>
            <label className={labelClassName}>{t("addressAm")}</label>
            <input
              type="text"
              placeholder={t("addressAmPlaceholder")}
              value={formData.address_am}
              onChange={(e) =>
                setFormData({ ...formData, address_am: e.target.value })
              }
              disabled={!isEditingActive}
              className={inputClassName()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {t("phoneLabel")}{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              value={formData.contact_phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={handlePhoneBlur}
              disabled={!isEditingActive}
              className={inputClassName(
                formErrors.contact_phone ||
                  (showPhoneError ? "err" : undefined),
              )}
            />

            {formErrors.contact_phone ? (
              <p className="mt-1 text-xs text-red-500">
                {formErrors.contact_phone}
              </p>
            ) : showPhoneError ? (
              <p className="mt-1 text-xs text-red-500">
                {phoneCheck.error === "phoneRequired"
                  ? t("phoneRequired")
                  : phoneCheck.error === "phoneInvalidFormat"
                    ? t("phoneInvalidFormat")
                    : phoneCheck.error}
              </p>
            ) : formData.contact_phone && phoneCheck.valid ? (
              <p className="mt-1 text-xs text-emerald-600">
                {t("phoneValidHint", { operator: operatorLabel })}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                {t("phoneFormatsHint")}
              </p>
            )}
          </div>

          <div>
            <label className={labelClassName}>
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {t("emailLabel")}{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={formData.contact_email}
              onChange={(e) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              disabled={!isEditingActive}
              className={inputClassName(formErrors.contact_email)}
            />
            {formErrors.contact_email && (
              <p className="mt-1 text-xs text-red-500">
                {formErrors.contact_email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelClassName}>{t("minimumOrderTotal")}</label>
            <input
              type="text"
              placeholder="0.00"
              value={formData.minimum_order_total}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minimum_order_total: e.target.value,
                })
              }
              disabled={!isEditingActive}
              className={inputClassName()}
            />
          </div>
          <div>
            <label className={labelClassName}>{t("maximumCodLimit")}</label>
            <input
              type="text"
              placeholder={t("maximumCodPlaceholder")}
              value={formData.maximum_cod_total}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maximum_cod_total: e.target.value,
                })
              }
              disabled={!isEditingActive}
              className={inputClassName()}
            />
          </div>
          <div>
            <label className={labelClassName}>{t("deliveryFeePerKm")}</label>
            <input
              type="text"
              placeholder="0.00"
              value={formData.delivery_fee_per_km}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delivery_fee_per_km: e.target.value,
                })
              }
              disabled={!isEditingActive}
              className={inputClassName()}
            />
          </div>
        </div>

        <div>
          <label className={labelClassName}>{t("gpsLocation")}</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder={t("latitudePlaceholder")}
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                disabled={!isEditingActive}
                className={`${inputClassName()} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                LAT
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder={t("longitudePlaceholder")}
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                disabled={!isEditingActive}
                className={`${inputClassName()} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                LON
              </span>
            </div>
          </div>
          {isEditingActive && (
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-secondary/40 py-2.5 text-sm font-bold text-secondary transition-all hover:border-secondary hover:bg-purple-50/30"
            >
              <MapPin className="h-4 w-4" />
              {t("chooseLocationOnMap")}
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ======================================================================== */
  /*                       STEP 3 — MEDIA & DOCUMENTS                         */
  /* ======================================================================== */

  const renderStep3 = () => {
    const isFanEmpty = !formData.fan_number || formData.fan_number.length === 0;
    const isFanComplete = formData.fan_number.length === 16;
    const fanError = isFanEmpty
      ? undefined
      : !isFanComplete
        ? t("fanInvalid")
        : formErrors.fan_number !== t("fanInvalid")
          ? formErrors.fan_number
          : undefined;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <ImageIcon className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {t("companyMedia")}
            </h3>
            <p className="text-xs text-gray-500">{t("companyMediaDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>{t("companyLogo")}</label>
            <div
              className={`flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gradient-to-br from-gray-50 to-white p-4 ${
                isEditingActive
                  ? "cursor-pointer border-gray-200 hover:border-secondary hover:bg-gray-50/80"
                  : "border-gray-200"
              }`}
            >
              <input
                type="file"
                id="logo-upload"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={!isEditingActive}
                onChange={handleLogoChange}
              />
              {logoPreview ? (
                <div className="relative flex w-full flex-col items-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-2xl shadow-lg ring-2 ring-secondary/20">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {isEditingActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogoRemove();
                      }}
                      className="mt-2 rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                    >
                      {t("removeBtn")}
                    </button>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className={`flex w-full flex-col items-center justify-center py-4 ${
                    isEditingActive ? "group cursor-pointer" : ""
                  }`}
                >
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                    <Camera className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {isEditingActive ? t("uploadLogo") : t("noLogoUploaded")}
                  </span>
                  {isEditingActive && (
                    <>
                      <span className="text-xs text-gray-400">
                        {t("logoHint1")}
                      </span>
                      <span className="mt-1 text-xs text-gray-400">
                        {t("logoHint2")}
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          <div>
            <label className={labelClassName}>{t("coverImage")}</label>
            <div
              className={`flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gradient-to-br from-gray-50 to-white p-4 ${
                isEditingActive
                  ? "cursor-pointer border-gray-200 hover:border-secondary hover:bg-gray-50/80"
                  : "border-gray-200"
              }`}
            >
              <input
                type="file"
                id="cover-upload"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={!isEditingActive}
                onChange={handleCoverChange}
              />
              {coverPreview ? (
                <div className="relative flex w-full flex-col items-center">
                  <div className="max-h-32 w-full overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-full object-cover"
                    />
                  </div>
                  {isEditingActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCoverRemove();
                      }}
                      className="mt-2 rounded-lg bg-red-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                    >
                      {t("removeBtn")}
                    </button>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="cover-upload"
                  className={`flex w-full flex-col items-center justify-center py-4 ${
                    isEditingActive ? "group cursor-pointer" : ""
                  }`}
                >
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                    <Camera className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {isEditingActive
                      ? t("uploadCoverImage")
                      : t("noCoverUploaded")}
                  </span>
                  {isEditingActive && (
                    <>
                      <span className="text-xs text-gray-400">
                        {t("coverHint1")}
                      </span>
                      <span className="mt-1 text-xs text-gray-400">
                        {t("coverHint2")}
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <FileCheck2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {t("licenseTaxInfo")}
              </h3>
              <p className="text-xs text-gray-500">{t("licenseTaxDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelClassName}>{t("tinNumber")}</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("tinPlaceholder")}
                  value={formData.tin_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tin_number: e.target.value,
                    }))
                  }
                  disabled={!isEditingActive}
                  className={`${inputClassName(formErrors.tin_number)} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClassName}>{t("vatNumber")}</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("vatPlaceholder")}
                  value={formData.vat_registration_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      vat_registration_number: e.target.value,
                    }))
                  }
                  disabled={!isEditingActive}
                  className={`${inputClassName()} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClassName}>
                {t("fanNumber")}{" "}
                <span className="text-xs font-normal text-gray-400">
                  {t("optionalSuffix")}
                </span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  placeholder={t("fanPlaceholder")}
                  value={formData.fan_number}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 16);
                    setFormData((prev) => ({
                      ...prev,
                      fan_number: digitsOnly,
                    }));
                  }}
                  disabled={!isEditingActive}
                  className={`${inputClassName(fanError)} pl-10 font-mono tracking-wider`}
                />
              </div>
              {fanError ? (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <p className="text-red-500">{fanError}</p>
                  <span className="font-mono text-red-500">
                    {formData.fan_number.length}/16
                  </span>
                </div>
              ) : formData.fan_number ? (
                <p className="mt-1 text-xs text-emerald-600">
                  {t("fanDigitsEntered")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  {t("fanOptionalHint")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-800">
                  {t("showVatBreakdown")}
                </label>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={Boolean(formData.show_vat)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      show_vat: e.target.checked,
                    }))
                  }
                  disabled={!isEditingActive}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#6750A4] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-disabled:cursor-not-allowed peer-disabled:opacity-60" />
              </label>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-800">
                    {t("chapaSplitSettlement")}
                  </label>
                  {formData.chapa_sub_account_id ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t("chapaLinkedTitle2")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {t("chapaNotConfiguredTitle2")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {formData.chapa_sub_account_id
                    ? t("chapaLinkedDesc", {
                        id: formData.chapa_sub_account_id,
                      })
                    : t("chapaNotConfiguredDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName}>{t("licenseDocument")}</label>
              {formData.license && typeof formData.license === "string" ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {t("existingLicense")}
                    </p>
                    <a
                      href={formData.license}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      {t("viewFile")}
                    </a>
                  </div>
                  {isEditingActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, license: null }))
                      }
                      className="flex-shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ) : formData.license instanceof File ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {formData.license.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      ✓ {t("uploadedLabel")} (
                      {(formData.license.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                  {isEditingActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, license: null }))
                      }
                      className="flex-shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id="license-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={!isEditingActive}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData((prev) => ({ ...prev, license: file }));
                    }}
                    className={`w-full rounded-xl border p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary hover:file:bg-secondary/20 ${
                      formErrors.license ? "border-red-500" : "border-gray-300"
                    } ${!isEditingActive ? "bg-gray-50" : ""}`}
                  />
                  {isEditingActive && !formData.license && (
                    <p className="mt-1 text-xs text-gray-400">
                      {t("licenseHint")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={labelClassName}>
                <span className="inline-flex items-center gap-1">
                  <ScrollText className="h-3.5 w-3.5" /> {t("moaDocument")}
                </span>
              </label>
              {formData.moa_file && typeof formData.moa_file === "string" ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <ScrollText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {t("existingMoa")}
                    </p>
                    <a
                      href={formData.moa_file}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline"
                    >
                      {t("viewFile")}
                    </a>
                  </div>
                  {isEditingActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, moa_file: null }))
                      }
                      className="flex-shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ) : formData.moa_file instanceof File ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <ScrollText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {formData.moa_file.name}
                    </p>
                    <p className="text-xs text-emerald-600">
                      ✓ {t("uploadedLabel")} (
                      {(formData.moa_file.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                  {isEditingActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, moa_file: null }))
                      }
                      className="flex-shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    id="moa-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={!isEditingActive}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData((prev) => ({ ...prev, moa_file: file }));
                    }}
                    className={`w-full rounded-xl border p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary hover:file:bg-secondary/20 ${
                      formErrors.moa_file ? "border-red-500" : "border-gray-300"
                    } ${!isEditingActive ? "bg-gray-50" : ""}`}
                  />
                  {isEditingActive && !formData.moa_file && (
                    <p className="mt-1 text-xs text-gray-400">{t("moaHint")}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ======================================================================== */
  /*                       STEP 4 — REVIEW & SUMMARY                          */
  /* ======================================================================== */

  const renderStep4 = () => {
    const isFanValid =
      !formData.fan_number || /^\d{16}$/.test(formData.fan_number);

    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {t("reviewTitle")}
            </h3>
            <p className="text-xs text-gray-500">{t("reviewDesc")}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <Building2 className="h-4 w-4 text-secondary" />
              {t("businessInformation")}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("companyName")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("slug")}
              </p>
              <p className="font-mono text-sm text-gray-700">
                {formData.slug || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("businessType")}
              </p>
              <p className="text-sm font-semibold capitalize text-gray-900">
                {formData.business_type || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelCategoryShort")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {categories.find((c) => c.id === formData.category)?.name ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelSubcategoryShort")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {subcategories.find((s) => s.id === formData.sub_category)
                  ?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelHeadCompany")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {headCompanies.find((hc) => hc.id === formData.head_company)
                  ?.name ||
                  headCompanyName ||
                  "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelDescription")}
              </p>
              <p className="text-sm text-gray-700">
                {formData.description || "—"}
              </p>
            </div>
            {formData.description_am && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {t("descriptionAm")}
                </p>
                <p className="text-sm text-gray-700">
                  {formData.description_am}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <MapPinned className="h-4 w-4 text-secondary" />
              {t("locationContact")}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelAddress")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.address || "—"}
              </p>
            </div>
            {formData.address_am && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {t("addressAm")}
                </p>
                <p className="text-sm text-gray-700">{formData.address_am}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelPhone")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.contact_phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelEmail")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.contact_email || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelMinOrder")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.minimum_order_total || "0.00"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelMaxCod")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.maximum_cod_total || "0.00"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelDeliveryFee")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.delivery_fee_per_km || "0.00"}
              </p>
            </div>
            {formData.latitude && formData.longitude && (
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {t("labelGps")}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formData.latitude}, {formData.longitude}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <ImageIcon className="h-4 w-4 text-secondary" />
              {t("companyMedia")}
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelLogo")}
              </p>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                />
              ) : (
                <p className="text-sm text-gray-500">{t("noLogoUploaded")}</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelCover")}
              </p>
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="h-24 w-full rounded-xl border border-gray-200 object-cover"
                />
              ) : (
                <p className="text-sm text-gray-500">{t("noCoverUploaded")}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelTin")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.tin_number || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelVat")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.vat_registration_number || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelShowVat")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.show_vat ? t("showVatYes") : t("showVatNo")}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelFan")}
              </p>
              <p
                className={`font-mono text-sm font-semibold tracking-wider ${
                  !formData.fan_number
                    ? "text-gray-500"
                    : isFanValid
                      ? "text-gray-900"
                      : "text-red-500"
                }`}
              >
                {formData.fan_number || t("fanOptionalDash")}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("chapaSplitSettlement")}
              </p>
              {formData.chapa_sub_account_id ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t("chapaLinkedTitle2")}
                  </span>
                  <span
                    className="font-mono text-xs text-gray-600 truncate"
                    title={formData.chapa_sub_account_id}
                  >
                    {formData.chapa_sub_account_id}
                  </span>
                </div>
              ) : (
                <div className="mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {t("chapaNotConfiguredTitle2")}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t("notConfiguredViaBank")}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelLicense")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.license
                  ? formData.license instanceof File
                    ? formData.license.name
                    : t("uploadedLabel")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                {t("labelMoa")}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.moa_file
                  ? formData.moa_file instanceof File
                    ? formData.moa_file.name
                    : t("uploadedLabel")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <Palette className="h-4 w-4 text-secondary" />
              {t("reviewStatusTitle")}
            </h4>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  formData.is_active
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {formData.is_active ? t("reviewActive") : t("reviewInactive")}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  formData.supports_table_service
                    ? "border border-secondary/20 bg-secondary/10 text-secondary"
                    : "border border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {formData.supports_table_service
                  ? t("reviewTableService")
                  : t("reviewNoTableService")}
              </span>
              {formData.supports_table_service && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    formData.show_order_queue
                      ? "border border-purple-200 bg-purple-50 text-purple-700"
                      : "border border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {formData.show_order_queue
                    ? t("reviewQueueVisible")
                    : t("reviewQueueHidden")}
                </span>
              )}
              {formData.supports_table_service &&
                activeCategories.length > 0 && (
                  <div className="mt-2 flex w-full flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5">
                    <span className="text-xs font-semibold text-gray-500">
                      {t("reviewMealPeriods")}
                    </span>
                    {activeCategories.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800"
                      >
                        <span>{c.icon || "🍽️"}</span>
                        <span>{c.name}</span>
                        {c.name_am && (
                          <span className="text-gray-400">({c.name_am})</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {showVerificationBlock && (
          <div
            className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
              isCompanyVerified
                ? "border-emerald-200 bg-emerald-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isCompanyVerified ? "bg-emerald-100" : "bg-blue-100"
                }`}
              >
                {isCompanyVerified ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {t("verificationTitle")}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {isCompanyVerified
                    ? t("verificationVerifiedDesc")
                    : t("verificationUnverifiedDesc")}
                </p>
              </div>
            </div>

            <label
              className={`relative inline-flex items-center ${
                isEditingActive ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isCompanyVerified}
                onChange={(e) => onVerificationChange?.(e.target.checked)}
                disabled={!isEditingActive}
              />
              <div
                className={`h-6 w-11 rounded-full after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${
                  isCompanyVerified ? "bg-emerald-500" : "bg-gray-300"
                } ${!isEditingActive ? "opacity-60" : ""}`}
              />
            </label>
          </div>
        )}

        {isTermsRequired && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-950">
                {t("marketingPendingTitle")}
              </p>
              <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                {t("marketingPendingDesc")}
              </p>
            </div>
          </div>
        )}

        {effectiveIsSuperAdmin ? (
          <div
            className={`rounded-xl border p-4 transition-colors ${
              agreedToTerms
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    agreedToTerms
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {agreedToTerms ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {t("termsTitle")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {agreedToTerms
                      ? t("termsAcceptedBy", {
                          name: formData.terms_signatory_name || t("roleOwner"),
                          role: formData.terms_signatory_role || t("roleOwner"),
                        })
                      : t("termsPending")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/30 bg-white px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/5"
              >
                <ScrollText className="h-3.5 w-3.5" />
                {t("readTerms")}
              </button>
            </div>
          </div>
        ) : !isMarketing && agreedToTerms ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {t("termsElilitaTitle")}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    {t("termsAcceptedReview")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/30 bg-white px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-secondary/5"
              >
                <ScrollText className="h-3.5 w-3.5" />
                {t("readTerms")}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-xl border p-5 transition-colors ${
              agreedToTerms && formData.terms_signatory_name?.trim()
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-secondary/20 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <ScrollText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    {t("termsSignatoryTitle")}{" "}
                    {isTermsRequired && <span className="text-red-500">*</span>}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t("termsSignatoryDesc")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/30 bg-white px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm hover:bg-secondary/5 transition-colors"
              >
                <ScrollText className="h-3.5 w-3.5" />
                {t("readFullTerms")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t("signatoryName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.terms_signatory_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      terms_signatory_name: e.target.value,
                    })
                  }
                  placeholder={t("signatoryNamePlaceholder")}
                  className={inputClassName(
                    formErrors.terms_signatory_name ||
                      (!formData.terms_signatory_name?.trim() && agreedToTerms
                        ? t("signatoryRequired")
                        : undefined),
                  )}
                  disabled={!isEditingActive}
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  {t("signatoryNameHint")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t("signatoryRole")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.terms_signatory_role || t("roleOwner")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      terms_signatory_role: e.target.value,
                    })
                  }
                  className={inputClassName()}
                  disabled={!isEditingActive}
                >
                  <option value="Owner">{t("roleOwner")}</option>
                  <option value="General Manager">
                    {t("roleGeneralManager")}
                  </option>
                  <option value="Managing Director">
                    {t("roleManagingDirector")}
                  </option>
                  <option value="CEO">{t("roleCEO")}</option>
                  <option value="Authorized Representative">
                    {t("roleAuthorizedRep")}
                  </option>
                  <option value="Branch Manager">
                    {t("roleBranchManager")}
                  </option>
                </select>
                <p className="mt-1 text-[11px] text-gray-500">
                  {t("signatoryRoleHint")}
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-secondary/20 bg-secondary/[0.04] p-3.5 hover:bg-secondary/[0.08] transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => onAgreedToTermsChange?.(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
              />
              <div className="text-xs text-gray-800 leading-relaxed">
                <span className="font-bold text-gray-900">
                  {t("bindingDeclaration")}
                </span>{" "}
                {t("bindingConfirm1")}{" "}
                <strong className="text-secondary font-bold">
                  {formData.terms_signatory_name?.trim() ||
                    t("bindingAuthorizedRep")}
                </strong>{" "}
                {t("bindingConfirm2")}{" "}
                <strong className="text-gray-900">
                  {formData.terms_signatory_role || t("roleOwner")}
                </strong>{" "}
                {t("bindingConfirm3")}{" "}
                <strong className="text-gray-900">
                  {formData.name || t("bindingThisCompany")}
                </strong>{" "}
                {t("bindingConfirm4")}
              </div>
            </label>
          </div>
        )}

        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
            blockedByTerms
              ? "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50"
              : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold ${
                blockedByTerms ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {blockedByTerms
                ? t("blockedReadyTitle")
                : editingSlug
                  ? t("readyToSave")
                  : t("readyToSubmit")}
            </span>
            <span
              className={`text-xs ${
                blockedByTerms ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {blockedByTerms
                ? t("blockedReadyDesc")
                : effectiveIsSuperAdmin && isCompanyVerified
                  ? t("readyVerified")
                  : isMarketing && !editingSlug
                    ? t("readyMarketing")
                    : t("readyComplete")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-600">
              {formData.name ? "✅" : "❌"} {t("checkName")}
            </span>
            <span className="text-xs text-gray-600">
              {formData.slug ? "✅" : "❌"} {t("checkSlug")}
            </span>
            <span className="text-xs text-gray-600">
              {isValidEthiopianPhone(formData.contact_phone) ? "✅" : "❌"}{" "}
              {t("checkPhone")}
            </span>
            <span className="text-xs text-gray-600">
              {isFanValid ? "✅" : "❌"} {t("checkFan")}
            </span>
            <span className="text-xs text-gray-600">
              {formData.contact_email ? "✅" : "❌"} {t("checkEmail")}
            </span>
            {isTermsRequired && (
              <span className="text-xs text-gray-600">
                {formData.terms_signatory_name?.trim() ? "✅" : "❌"}{" "}
                {t("checkSignatory")}
              </span>
            )}
            <span className="text-xs text-gray-600">
              {agreedToTerms ? "✅" : isTermsRequired ? "❌" : "⚪"}{" "}
              {t("checkTerms")}
            </span>
            {showVerificationBlock ? (
              <span className="text-xs text-gray-600">
                {isCompanyVerified ? "✅" : "⚪"} {t("checkVerified")}
              </span>
            ) : (
              <span className="text-xs text-blue-600 font-medium">
                {t("checkPendingVerification")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ======================================================================== */
  /*                               MAIN RENDER                                */
  /* ======================================================================== */

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col pb-10 lg:flex-row lg:divide-x lg:divide-gray-100"
    >
      <div className="flex-1 space-y-3 p-4 pb-20">
        {!isEditingActive && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              {t("readOnlyNotice")}
            </span>
          </div>
        )}
        {currentStep === 0 && renderStep1()}
        {currentStep === 1 && renderStep2()}
        {currentStep === 2 && renderStep3()}
        {currentStep === 3 && isEditingActive && renderStep4()}
      </div>

      {showMapPicker && isEditingActive && (
        <LocationPickerModal
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelect={(selectedLat, selectedLon) => {
            setFormData((prev) => ({
              ...prev,
              latitude: selectedLat,
              longitude: selectedLon,
            }));
          }}
          onSelectAddress={(address) => {
            setFormData((prev) => ({
              ...prev,
              address: address,
            }));
          }}
          initialLat={formData.latitude}
          initialLon={formData.longitude}
          initialAddress={formData.address}
        />
      )}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => onAgreedToTermsChange?.(true)}
        alreadyAgreed={agreedToTerms}
      />
    </form>
  );
}
