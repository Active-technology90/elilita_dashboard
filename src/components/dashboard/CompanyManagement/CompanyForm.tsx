import React, { useState, useMemo } from "react";
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
  Palette,
  FileCheck2,
  Image as ImageIcon,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { CustomSelect } from "../../ui/CustomSelect";
import MealCategoryIcon, {
  MEAL_ICON_OPTIONS,
} from "../../ui/MealCategoryIcon";

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
  theme_primary: string;
  theme_dark: string;
  theme_light: string;
  tin_number: string;
  vat_registration_number: string;
  tax_type: string;
  license: File | string | null;
  contact_phone: string;
  contact_email: string;
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
  isCompanyVerified?: boolean;
  onVerificationChange?: (verified: boolean) => void;
  submitting: boolean;
  editingSlug: string | null;
  headCompanyName?: string | null;
  headCompanies?: HeadCompany[];
  currentStep?: number;
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
    return { valid: false, error: "Phone number is required" };
  }

  const cleaned = raw.replace(/[\s\-()]/g, "");

  if (!ETHIOPIAN_PHONE_REGEX.test(cleaned)) {
    return {
      valid: false,
      error:
        "Enter a valid Ethiopian phone number (e.g. 0911234567, 0711234567, or +251911234567)",
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

const BUSINESS_TYPE_OPTIONS = [
  { value: "", label: "Select Business Type" },
  { value: "brand", label: "Brand" },
  { value: "store", label: "Store" },
  { value: "factory", label: "Factory" },
  { value: "service", label: "Service Provider" },
  { value: "delivery_service", label: "Delivery Service" },
  { value: "other", label: "Other" },
];

const TAX_TYPE_OPTIONS = [
  { value: "none", label: "No Tax" },
  { value: "vat", label: "VAT (15%)" },
  { value: "turnover_goods", label: "Turnover Tax - Goods (2%)" },
  { value: "turnover_services", label: "Turnover Tax - Services (10%)" },
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
  isCompanyVerified = false,
  onVerificationChange,
  submitting: _submitting,
  editingSlug,
  headCompanyName,
  headCompanies = [],
  currentStep = 0,
  onSubmit,
  onClose: _onClose,
}: CompanyFormProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameAm, setNewCatNameAm] = useState("");
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

  const showVerificationBlock = canManageActiveStatus && !!editingSlug;

  const blockedByVerification = showVerificationBlock && !isCompanyVerified;

  /* ------------------------------ Option lists ---------------------------- */

  const headCompanyOptions = [
    { value: "", label: "Select Head Company (Optional)" },
    ...headCompanies.map((hc) => ({ value: String(hc.id), label: hc.name })),
  ];

  const categoryOptions = [
    { value: "0", label: "Select Category" },
    ...categories.map((cat) => ({ value: String(cat.id), label: cat.name })),
  ];

  const subcategoryOptions = [
    { value: "0", label: "Select Subcategory" },
    ...filteredSubcategories.map((sub) => ({
      value: String(sub.id),
      label: sub.name,
    })),
  ];

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
    setFormData((prev) => ({ ...prev, meal_periods: DEFAULT_MEAL_CATEGORIES }));
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
      alert("File must be smaller than 5MB");
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
      alert("File must be smaller than 10MB");
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
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
          <Building2 className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Business Information
          </h3>
          <p className="text-xs text-gray-500">
            Core company details and classification
          </p>
        </div>
      </div>

      {/* Name / Name (Amharic) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter company name"
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
          <label className={labelClassName}>Company Name (Amharic)</label>
          <input
            type="text"
            placeholder="Enter company name in Amharic"
            value={formData.name_am}
            onChange={(e) =>
              setFormData({ ...formData, name_am: e.target.value })
            }
            disabled={!isEditingActive}
            className={inputClassName()}
          />
        </div>
      </div>

      {/* Slug / Business Type */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., my-company-slug"
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
            Business Type <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.business_type}
            onChange={(value) =>
              setFormData({ ...formData, business_type: value })
            }
            options={BUSINESS_TYPE_OPTIONS}
            placeholder="Select Business Type"
            className={formErrors.business_type ? "border-red-500" : ""}
          />
          {formErrors.business_type && (
            <p className="mt-1 text-xs text-red-500">
              {formErrors.business_type}
            </p>
          )}
        </div>
      </div>

      {/* Head Company */}
      <div>
        <label className={labelClassName}>Head Company (Optional)</label>
        <CustomSelect
          value={formData.head_company ? String(formData.head_company) : ""}
          onChange={(value) =>
            setFormData({
              ...formData,
              head_company: value ? Number(value) : null,
            })
          }
          options={headCompanyOptions}
          placeholder="Select Head Company (Optional)"
        />
      </div>

      {/* Category / Subcategory */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>
            Category <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={String(formData.category)}
            onChange={(value) => {
              const catId = Number(value);
              setFormData({ ...formData, category: catId, sub_category: 0 });
            }}
            options={categoryOptions}
            placeholder="Select Category"
            className={formErrors.category ? "border-red-500" : ""}
          />
          {formErrors.category && (
            <p className="mt-1 text-xs text-red-500">{formErrors.category}</p>
          )}
        </div>
        <div>
          <label className={labelClassName}>
            Subcategory <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={String(formData.sub_category)}
            onChange={(value) =>
              setFormData({ ...formData, sub_category: Number(value) })
            }
            options={subcategoryOptions}
            placeholder="Select Subcategory"
            className={formErrors.sub_category ? "border-red-500" : ""}
          />
          {formErrors.sub_category && (
            <p className="mt-1 text-xs text-red-500">
              {formErrors.sub_category}
            </p>
          )}
        </div>
      </div>

      {/* Description (English / Amharic) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClassName}>Description</label>
          <textarea
            placeholder="Enter company description"
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
          <label className={labelClassName}>Description (Amharic)</label>
          <textarea
            placeholder="Enter company description in Amharic"
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

      {/* Status toggles — Is Active only shown to super admin */}
      <div
        className={`grid grid-cols-1 gap-4 pt-2 ${
          canManageActiveStatus ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {/* Is Active — super admin only */}
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
              <p className="text-sm font-medium text-gray-900">Is Active</p>
              <p className="text-xs text-gray-500">
                {!isCompanyVerified
                  ? "Verify the company (Step 4) before activation"
                  : formData.is_active
                  ? "Visible to customers"
                  : "Hidden from customers"}
              </p>
            </div>
          </div>
        )}

        {/* Table Service */}
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
            <p className="text-sm font-medium text-gray-900">Table Service</p>
            <p className="text-xs text-gray-500">
              {formData.supports_table_service ? "Available" : "Not available"}
            </p>
          </div>
        </div>

        {/* Show Order Queue — only when table service is on */}
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
                Show Order Queue
              </p>
              <p className="text-xs text-gray-500">
                {formData.show_order_queue
                  ? "Live kitchen queue visible to customers"
                  : "Hidden from customers"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meal periods card */}
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
                    Meal Periods &amp; Menu Schedule
                  </h4>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                    {activeCategories.length}{" "}
                    {activeCategories.length === 1 ? "Period" : "Periods"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Define dining shifts and categories (e.g. Breakfast, Lunch,
                  Dinner, Late Night) so customers can filter products on the
                  mobile menu.
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
                Reset to Defaults
              </button>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Configured Meal Categories
            </label>

            {activeCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-xs font-medium text-gray-500">
                  No meal categories configured yet.
                </p>
                <button
                  type="button"
                  onClick={handleResetCategories}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Load default categories (Breakfast, Lunch, Dinner)
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
                          Catalog ID: {cat.id}
                        </p>
                      </div>
                    </div>

                    {isEditingActive && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat.id)}
                        className="rounded-lg p-1.5 text-gray-400 opacity-70 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        title={`Remove ${cat.name}`}
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
                  Add Custom Meal Category
                </span>
                {calculatedSlug && (
                  <span className="rounded border border-gray-200 bg-white px-2 py-0.5 font-mono text-[10px] text-gray-400">
                    Catalog ID:{" "}
                    <span className="font-semibold text-secondary">
                      {calculatedSlug}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Icon
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
                    Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brunch, Late Night"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Name (Amharic - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ብራንች, የፆም"
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
                    Add
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

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <MapPinned className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Location &amp; Contact
            </h3>
            <p className="text-xs text-gray-500">
              Address, contact details, and geographical information
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Address{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Street, city, area..."
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
            <label className={labelClassName}>Address (Amharic)</label>
            <input
              type="text"
              placeholder="Enter address in Amharic"
              value={formData.address_am}
              onChange={(e) =>
                setFormData({ ...formData, address_am: e.target.value })
              }
              disabled={!isEditingActive}
              className={inputClassName()}
            />
          </div>
        </div>

        {/* Phone / Email */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Phone Number{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0911 234 567  or  +251 911 234 567"
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
              <p className="mt-1 text-xs text-red-500">{phoneCheck.error}</p>
            ) : formData.contact_phone && phoneCheck.valid ? (
              <p className="mt-1 text-xs text-emerald-600">
                ✓ Valid Ethiopian number (
                {phoneCheck.operator?.replace("_", " ")})
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                Formats: 0911234567 · 0711234567 · +251911234567
              </p>
            )}
          </div>

          <div>
            <label className={labelClassName}>
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="email"
              placeholder="info@company.com"
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

        {/* Order limits */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className={labelClassName}>Minimum Order Total</label>
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
            <label className={labelClassName}>Maximum COD Limit</label>
            <input
              type="text"
              placeholder="0.00 (0 for unlimited)"
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
            <label className={labelClassName}>Delivery Fee Per KM</label>
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

        {/* Theme colors */}
        <div>
          <label className={labelClassName}>
            <span className="inline-flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" /> Theme Colors
            </span>
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                label: "Primary",
                value: formData.theme_primary,
                key: "theme_primary" as const,
              },
              {
                label: "Dark",
                value: formData.theme_dark,
                key: "theme_dark" as const,
              },
              {
                label: "Light",
                value: formData.theme_light,
                key: "theme_light" as const,
              },
            ].map((theme) => (
              <div key={theme.key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.value || "#674FA3"}
                  onChange={(e) =>
                    setFormData({ ...formData, [theme.key]: e.target.value })
                  }
                  disabled={!isEditingActive}
                  className={`h-10 w-12 flex-shrink-0 rounded-lg border border-gray-300 ${
                    !isEditingActive
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  }`}
                />
                <div className="flex-1">
                  <p className="mb-0.5 text-[10px] text-gray-500">
                    {theme.label}
                  </p>
                  <input
                    type="text"
                    value={theme.value}
                    onChange={(e) =>
                      setFormData({ ...formData, [theme.key]: e.target.value })
                    }
                    disabled={!isEditingActive}
                    className={`${inputClassName()} font-mono text-xs`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GPS */}
        <div>
          <label className={labelClassName}>📍 Company Location (GPS)</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
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
                placeholder="Longitude"
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
              Choose Location on Map Picker
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ======================================================================== */
  /*                       STEP 3 — MEDIA & DOCUMENTS                         */
  /* ======================================================================== */

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
          <ImageIcon className="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Company Media</h3>
          <p className="text-xs text-gray-500">
            Upload logo, cover image, and license documents
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LOGO */}
        <div>
          <label className={labelClassName}>Company Logo</label>
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
                    Remove
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
                  {isEditingActive ? "Upload Logo" : "No logo uploaded"}
                </span>
                {isEditingActive && (
                  <>
                    <span className="text-xs text-gray-400">
                      PNG, JPG up to 5MB
                    </span>
                    <span className="mt-1 text-xs text-gray-400">
                      Square image recommended (1:1)
                    </span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* COVER */}
        <div>
          <label className={labelClassName}>Cover Image</label>
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
                    Remove
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
                    ? "Upload Cover Image"
                    : "No cover image uploaded"}
                </span>
                {isEditingActive && (
                  <>
                    <span className="text-xs text-gray-400">
                      PNG, JPG up to 10MB
                    </span>
                    <span className="mt-1 text-xs text-gray-400">
                      Wide banner recommended (16:9)
                    </span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </div>

      {/* LICENSE & TAX */}
      <div>
        <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <FileCheck2 className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              License &amp; Tax Information
            </h3>
            <p className="text-xs text-gray-500">
              Legal documents and tax registration details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* LICENSE */}
          <div>
            <label className={labelClassName}>License Document</label>
            {formData.license && typeof formData.license === "string" ? (
              <div className="flex items-center gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    Existing license
                  </p>
                  <a
                    href={formData.license}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline"
                  >
                    View file
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
                    ✓ Uploaded ({(formData.license.size / 1024).toFixed(1)} KB)
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
                    PDF, JPG, PNG up to 5MB
                  </p>
                )}
              </div>
            )}
          </div>

          {/* TIN */}
          <div>
            <label className={labelClassName}>TIN Number</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter TIN number"
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

          {/* VAT */}
          <div>
            <label className={labelClassName}>VAT Registration Number</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter VAT registration number"
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
        </div>

        <div className="mt-4">
          <label className={labelClassName}>Tax Type</label>
          <CustomSelect
            value={formData.tax_type}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, tax_type: value }))
            }
            options={TAX_TYPE_OPTIONS}
            placeholder="Select Tax Type"
          />
        </div>
      </div>
    </div>
  );

  /* ======================================================================== */
  /*                       STEP 4 — REVIEW & SUMMARY                          */
  /* ======================================================================== */

  const renderStep4 = () => (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
          <Check className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Review Your Company Details
          </h3>
          <p className="text-xs text-gray-500">
            Verify all information before submitting
          </p>
        </div>
      </div>

      {/* Business info */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <Building2 className="h-4 w-4 text-secondary" />
            Business Information
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Company Name
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Slug
            </p>
            <p className="font-mono text-sm text-gray-700">
              {formData.slug || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Business Type
            </p>
            <p className="text-sm font-semibold capitalize text-gray-900">
              {formData.business_type || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Category
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {categories.find((c) => c.id === formData.category)?.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Subcategory
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {subcategories.find((s) => s.id === formData.sub_category)?.name ||
                "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Head Company
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
              Description
            </p>
            <p className="text-sm text-gray-700">
              {formData.description || "—"}
            </p>
          </div>
          {formData.description_am && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                Description (Amharic)
              </p>
              <p className="text-sm text-gray-700">{formData.description_am}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <MapPinned className="h-4 w-4 text-secondary" />
            Location &amp; Contact
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Address
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.address || "—"}
            </p>
          </div>
          {formData.address_am && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                Address (Amharic)
              </p>
              <p className="text-sm text-gray-700">{formData.address_am}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Phone
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.contact_phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Email
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.contact_email || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Minimum Order Total
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.minimum_order_total || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Maximum COD Limit
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.maximum_cod_total || "0.00 (Unlimited)"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Delivery Fee/KM
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.delivery_fee_per_km || "0.00"}
            </p>
          </div>
          {formData.latitude && formData.longitude && (
            <div className="col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">
                GPS Coordinates
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formData.latitude}, {formData.longitude}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <ImageIcon className="h-4 w-4 text-secondary" />
            Media &amp; Documents
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-400">
              Logo
            </p>
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
              />
            ) : (
              <p className="text-sm text-gray-500">No logo uploaded</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-400">
              Cover Image
            </p>
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover"
                className="h-24 w-full rounded-xl border border-gray-200 object-cover"
              />
            ) : (
              <p className="text-sm text-gray-500">No cover image uploaded</p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              TIN Number
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.tin_number || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              VAT Number
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.vat_registration_number || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              Tax Type
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.tax_type === "vat"
                ? "VAT (15%)"
                : formData.tax_type === "turnover_goods"
                ? "Turnover Tax - Goods (2%)"
                : formData.tax_type === "turnover_services"
                ? "Turnover Tax - Services (10%)"
                : "No Tax"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">
              License
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.license
                ? formData.license instanceof File
                  ? formData.license.name
                  : "Uploaded"
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Theme + Status */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <h4 className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <Palette className="h-4 w-4 text-secondary" />
            Theme &amp; Status
          </h4>
        </div>
        <div className="p-4">
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { label: "Theme Primary", value: formData.theme_primary },
              { label: "Theme Dark", value: formData.theme_dark },
              { label: "Theme Light", value: formData.theme_light },
            ].map((t) => (
              <div key={t.label}>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                  {t.label}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-lg border border-gray-200"
                    style={{ backgroundColor: t.value }}
                  />
                  <span className="font-mono text-sm">{t.value}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Active status pill — shown to everyone so they can see current state */}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                formData.is_active
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              {formData.is_active ? "Active" : "Inactive"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                formData.supports_table_service
                  ? "border border-secondary/20 bg-secondary/10 text-secondary"
                  : "border border-gray-200 bg-gray-50 text-gray-500"
              }`}
            >
              {formData.supports_table_service
                ? "Table Service"
                : "No Table Service"}
            </span>
            {formData.supports_table_service && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  formData.show_order_queue
                    ? "border border-purple-200 bg-purple-50 text-purple-700"
                    : "border border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {formData.show_order_queue ? "Queue Visible" : "Queue Hidden"}
              </span>
            )}
            {formData.supports_table_service && activeCategories.length > 0 && (
              <div className="mt-2 flex w-full flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5">
                <span className="text-xs font-semibold text-gray-500">
                  Meal Periods:
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

      {/* Company Verification — super admin only */}
      {showVerificationBlock && (
        <div
          className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
            isCompanyVerified
              ? "border-blue-200 bg-blue-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isCompanyVerified ? "bg-blue-100" : "bg-amber-100"
              }`}
            >
              {isCompanyVerified ? (
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Company Verification
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {isCompanyVerified
                  ? "Verified. The active status can now be changed."
                  : "Verify this company before activating it."}
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
                isCompanyVerified ? "bg-blue-500" : "bg-gray-300"
              } ${!isEditingActive ? "opacity-60" : ""}`}
            />
          </label>
        </div>
      )}

      {/* Ready footer — reacts to verification status */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
          blockedByVerification
            ? "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50"
            : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-bold ${
              blockedByVerification ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {blockedByVerification
              ? "⚠️ Verify the company before submitting"
              : "✅ Ready to Submit"}
          </span>
          <span
            className={`text-xs ${
              blockedByVerification ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {blockedByVerification
              ? "Toggle Company Verification above"
              : "All steps completed"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-600">
            {formData.name ? "✅" : "❌"} Name
          </span>
          <span className="text-xs text-gray-600">
            {formData.slug ? "✅" : "❌"} Slug
          </span>
          <span className="text-xs text-gray-600">
            {isValidEthiopianPhone(formData.contact_phone) ? "✅" : "❌"} Phone
          </span>
          <span className="text-xs text-gray-600">
            {formData.contact_email ? "✅" : "❌"} Email
          </span>
          {showVerificationBlock && (
            <span className="text-xs text-gray-600">
              {isCompanyVerified ? "✅" : "❌"} Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );

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
              You are viewing this company in read-only mode
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
    </form>
  );
}