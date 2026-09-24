// src/components/admin/CompanyManagement/CompanyForm.tsx
import React, { useState } from "react";
import type { Category, SubCategory, HeadCompany } from "../../../types";
import LocationPickerModal from "./LocationPickerModal";
// import { CustomSelect } from "../../ui/CustomSelect";
import { MapPin, Building2, FileText, Camera, XCircle, Check, Phone, Mail, MapPinned, Palette, FileCheck2, Image as ImageIcon, Eye } from "lucide-react";
import { CustomSelect } from "../../ui/CustomSelect";

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
  is_featured: boolean;
  supports_table_service: boolean;
  show_order_queue: boolean;
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
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category === formData.category,
  );

  const [showMapPicker, setShowMapPicker] = useState(false);

  const inputClassName = (error?: string) => `
    w-full border rounded-xl p-2.5 text-sm 
    ${error ? "border-red-500" : "border-gray-300"}
    focus:ring-2 focus:ring-secondary/30 focus:border-secondary 
    outline-none transition
    ${isEditingActive ? "bg-white" : "bg-gray-50 text-gray-700 cursor-not-allowed"}
  `;

  const labelClassName = "block text-sm font-medium text-gray-700 mb-1.5";

  // Business Type Options
  const businessTypeOptions = [
    { value: "", label: "Select Business Type" },
    { value: "brand", label: "Brand" },
    { value: "store", label: "Store" },
    { value: "factory", label: "Factory" },
    { value: "service", label: "Service Provider" },
    { value: "delivery_service", label: "Delivery Service" },
    { value: "other", label: "Other" },
  ];

  // Head Company Options
  const headCompanyOptions = [
    { value: "", label: "Select Head Company (Optional)" },
    ...headCompanies.map((hc) => ({
      value: String(hc.id),
      label: hc.name,
    })),
  ];

  // Category Options
  const categoryOptions = [
    { value: "0", label: "Select Category" },
    ...categories.map((cat) => ({
      value: String(cat.id),
      label: cat.name,
    })),
  ];

  // Subcategory Options
  const subcategoryOptions = [
    { value: "0", label: "Select Subcategory" },
    ...filteredSubcategories.map((sub) => ({
      value: String(sub.id),
      label: sub.name,
    })),
  ];

  // Tax Type Options
  const taxTypeOptions = [
    { value: "none", label: "No Tax" },
    { value: "vat", label: "VAT (15%)" },
    { value: "turnover_goods", label: "Turnover Tax - Goods (2%)" },
    { value: "turnover_services", label: "Turnover Tax - Services (10%)" },
  ];

  // ==================== STEP 1: BASIC INFORMATION ====================
  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Business Information Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Business Information</h3>
          <p className="text-xs text-gray-500">Core company details and classification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
        </div>
        <div>
          <label className={labelClassName}>Company Name (Amharic)</label>
          <input
            type="text"
            placeholder="Enter company name in Amharic"
            value={formData.name_am}
            onChange={(e) => setFormData({ ...formData, name_am: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
        </div>
        <div>
          <label className={labelClassName}>
            Business Type <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={formData.business_type}
            onChange={(value) => setFormData({ ...formData, business_type: value })}
            options={businessTypeOptions}
            placeholder="Select Business Type"
            className={formErrors.business_type ? "border-red-500" : ""}
          />
          {formErrors.business_type && <p className="text-red-500 text-xs mt-1">{formErrors.business_type}</p>}
        </div>
      </div>

      {/* Head Company */}
      <div>
        <label className={labelClassName}>Head Company (Optional)</label>
        <CustomSelect
          value={formData.head_company ? String(formData.head_company) : ""}
          onChange={(value) => setFormData({ ...formData, head_company: value ? Number(value) : null })}
          options={headCompanyOptions}
          placeholder="Select Head Company (Optional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
        </div>
        <div>
          <label className={labelClassName}>
            Subcategory <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            value={String(formData.sub_category)}
            onChange={(value) => setFormData({ ...formData, sub_category: Number(value) })}
            options={subcategoryOptions}
            placeholder="Select Subcategory"
            className={formErrors.sub_category ? "border-red-500" : ""}
          />
          {formErrors.sub_category && <p className="text-red-500 text-xs mt-1">{formErrors.sub_category}</p>}
        </div>
      </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   <div>
        <label className={labelClassName}>Description</label>
        <textarea
          placeholder="Enter company description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, description_am: e.target.value })}
          rows={3}
          disabled={!isEditingActive}
          className={`${inputClassName()} resize-none`}
        />
      </div>
        
      </div>
     

      {/* Verification + Toggles */}
      {canManageActiveStatus && editingSlug && (
        <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${
          isCompanyVerified
            ? "bg-blue-50 border-blue-200"
            : "bg-amber-50 border-amber-200"
        }`}>
          <div>
            <p className="text-sm font-semibold text-gray-900">Company Verification</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isCompanyVerified
                ? "Verified. The active status can now be changed."
                : "Verify this company before activating it."}
            </p>
            {/* <p className="text-[10px] text-gray-400 mt-1">Frontend-only verification state</p> */}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isCompanyVerified}
              onChange={(e) => onVerificationChange?.(e.target.checked)}
              disabled={!isEditingActive}
            />
            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
              isCompanyVerified ? "bg-blue-500" : "bg-gray-300"
            } ${!isEditingActive ? "opacity-60" : ""}`}></div>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${formData.is_active ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
          <label className={`relative inline-flex items-center ${
            isEditingActive && canManageActiveStatus && isCompanyVerified
              ? "cursor-pointer"
              : "cursor-not-allowed"
          }`}>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={!isEditingActive || !canManageActiveStatus || !isCompanyVerified}
            />
            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.is_active ? "bg-emerald-500" : "bg-gray-300"} ${
              !isEditingActive || !canManageActiveStatus || !isCompanyVerified ? "opacity-60" : ""
            }`}></div>
          </label>
          <div>
            <p className="text-sm font-medium text-gray-900">Is Active</p>
            <p className="text-xs text-gray-500">
              {!canManageActiveStatus
                ? "Only super admin can change this setting"
                : !isCompanyVerified
                  ? "Verify the company before activation"
                  : formData.is_active
                    ? "Visible to customers"
                    : "Hidden from customers"}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-xl border ${formData.is_featured ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              disabled={!isEditingActive}
            />
            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.is_featured ? "bg-amber-500" : "bg-gray-300"} ${!isEditingActive ? "opacity-60" : ""}`}></div>
          </label>
          <div>
            <p className="text-sm font-medium text-gray-900">Is Featured</p>
            <p className="text-xs text-gray-500">{formData.is_featured ? "Highlighted on homepage" : "Standard listing"}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 p-3 rounded-xl border ${formData.supports_table_service ? "bg-secondary/10 border-secondary/30" : "bg-gray-50 border-gray-200"}`}>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.supports_table_service}
              onChange={(e) => setFormData({ ...formData, supports_table_service: e.target.checked })}
              disabled={!isEditingActive}
            />
            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.supports_table_service ? "bg-secondary" : "bg-gray-300"} ${!isEditingActive ? "opacity-60" : ""}`}></div>
          </label>
          <div>
            <p className="text-sm font-medium text-gray-900">Table Service</p>
            <p className="text-xs text-gray-500">{formData.supports_table_service ? "Available" : "Not available"}</p>
          </div>
        </div>

        {/* Live Order Queue Toggle (Shown when Table Service is active) */}
        {formData.supports_table_service && (
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${formData.show_order_queue ? "bg-secondary/10 border-secondary/30" : "bg-gray-50 border-gray-200"}`}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.show_order_queue}
                onChange={(e) => setFormData({ ...formData, show_order_queue: e.target.checked })}
                disabled={!isEditingActive}
              />
              <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.show_order_queue ? "bg-secondary" : "bg-gray-300"} ${!isEditingActive ? "opacity-60" : ""}`}></div>
            </label>
            <div>
              <p className="text-sm font-medium text-gray-900">Show Order Queue</p>
              <p className="text-xs text-gray-500">{formData.show_order_queue ? "Live kitchen queue visible to customers" : "Hidden from customers"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== STEP 2: LOCATION & CONTACT ====================
  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
          <MapPinned className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Location & Contact</h3>
          <p className="text-xs text-gray-500">Address, contact details, and geographical information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClassName}>
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Address <span className="text-red-500">*</span></span>
          </label>
          <input
            type="text"
            placeholder="Street, city, area..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName(formErrors.address)}
          />
          {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
        </div>
        <div>
          <label className={labelClassName}>Address (Amharic)</label>
          <input
            type="text"
            placeholder="Enter address in Amharic"
            value={formData.address_am}
            onChange={(e) => setFormData({ ...formData, address_am: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClassName}>
            <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-red-500">*</span></span>
          </label>
          <input
            type="tel"
            placeholder="+251 911 234 567"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName(formErrors.contact_phone)}
          />
          {formErrors.contact_phone && <p className="text-red-500 text-xs mt-1">{formErrors.contact_phone}</p>}
        </div>
        <div>
          <label className={labelClassName}>
            <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email Address <span className="text-red-500">*</span></span>
          </label>
          <input
            type="email"
            placeholder="info@company.com"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName(formErrors.contact_email)}
          />
          {formErrors.contact_email && <p className="text-red-500 text-xs mt-1">{formErrors.contact_email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClassName}>Minimum Order Total</label>
          <input
            type="text"
            placeholder="0.00"
            value={formData.minimum_order_total}
            onChange={(e) => setFormData({ ...formData, minimum_order_total: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, maximum_cod_total: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, delivery_fee_per_km: e.target.value })}
            disabled={!isEditingActive}
            className={inputClassName()}
          />
        </div>
      </div>

      {/* <div>
        <label className={labelClassName}>
          <span className="inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Chapa Sub-account ID</span>
        </label>
        <input
          type="text"
          placeholder="Enter Chapa sub-account ID"
          value={formData.chapa_sub_account_id}
          onChange={(e) => setFormData({ ...formData, chapa_sub_account_id: e.target.value })}
          disabled={!isEditingActive}
          className={inputClassName()}
        />
      </div> */}

      <div>
        <label className={labelClassName}>
          <span className="inline-flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Theme Colors</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Primary", value: formData.theme_primary, key: "theme_primary" },
            { label: "Dark", value: formData.theme_dark, key: "theme_dark" },
            { label: "Light", value: formData.theme_light, key: "theme_light" },
          ].map((theme) => (
            <div key={theme.key} className="flex items-center gap-2">
              <input
                type="color"
                value={theme.value || "#674FA3"}
                onChange={(e) => setFormData({ ...formData, [theme.key]: e.target.value })}
                disabled={!isEditingActive}
                className={`h-10 w-12 rounded-lg border border-gray-300 flex-shrink-0 ${!isEditingActive ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 mb-0.5">{theme.label}</p>
                <input
                  type="text"
                  value={theme.value}
                  onChange={(e) => setFormData({ ...formData, [theme.key]: e.target.value })}
                  disabled={!isEditingActive}
                  className={`${inputClassName()} font-mono text-xs`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClassName}>📍 Company Location (GPS)</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              disabled={!isEditingActive}
              className={`${inputClassName()} pr-12`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LAT</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              disabled={!isEditingActive}
              className={`${inputClassName()} pr-12`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">LON</span>
          </div>
        </div>
        {isEditingActive && (
          <button
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="mt-2 w-full py-2.5 border-2 border-dashed border-secondary/40 hover:border-secondary hover:bg-purple-50/30 text-secondary rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Choose Location on Map Picker
          </button>
        )}
      </div>
    </div>
  );

  // ==================== STEP 3: MEDIA & DOCUMENTS ====================
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Company Media</h3>
          <p className="text-xs text-gray-500">Upload logo, cover image, and license documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Logo Upload */}
        <div>
          <label className={labelClassName}>Company Logo</label>
          <div className={`bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center min-h-[180px] ${isEditingActive ? "border-gray-200 hover:border-secondary hover:bg-gray-50/80 cursor-pointer" : "border-gray-200"}`}>
            <input
              type="file"
              id="logo-upload"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={!isEditingActive}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert("File must be smaller than 5MB");
                    return;
                  }
                  setFormData((prev) => ({ ...prev, logo: file }));
                  if (onLogoFileChange) onLogoFileChange(file);
                }
              }}
            />
            {logoPreview ? (
              <div className="relative w-full flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-2 ring-secondary/20">
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                </div>
                {isEditingActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, logo: null }));
                      onLogoFileChange?.(null);
                      const fileInput = document.getElementById("logo-upload") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <label htmlFor="logo-upload" className={`flex flex-col items-center justify-center w-full py-4 ${isEditingActive ? "cursor-pointer group" : ""}`}>
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {isEditingActive ? "Upload Logo" : "No logo uploaded"}
                </span>
                {isEditingActive && (
                  <>
                    <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                    <span className="text-xs text-gray-400 mt-1">Square image recommended (1:1)</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* Cover Upload */}
        <div>
          <label className={labelClassName}>Cover Image</label>
          <div className={`bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center min-h-[180px] ${isEditingActive ? "border-gray-200 hover:border-secondary hover:bg-gray-50/80 cursor-pointer" : "border-gray-200"}`}>
            <input
              type="file"
              id="cover-upload"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={!isEditingActive}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 10 * 1024 * 1024) {
                    alert("File must be smaller than 10MB");
                    return;
                  }
                  setFormData((prev) => ({ ...prev, cover_image: file }));
                  if (onCoverFileChange) onCoverFileChange(file);
                }
              }}
            />
            {coverPreview ? (
              <div className="relative w-full flex flex-col items-center">
                <div className="w-full max-h-32 overflow-hidden rounded-xl shadow-lg">
                  <img src={coverPreview} alt="Cover Preview" className="w-full object-cover" />
                </div>
                {isEditingActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, cover_image: null }));
                      onCoverFileChange?.(null);
                      const fileInput = document.getElementById("cover-upload") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <label htmlFor="cover-upload" className={`flex flex-col items-center justify-center w-full py-4 ${isEditingActive ? "cursor-pointer group" : ""}`}>
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2">
                  <Camera className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {isEditingActive ? "Upload Cover Image" : "No cover image uploaded"}
                </span>
                {isEditingActive && (
                  <>
                    <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                    <span className="text-xs text-gray-400 mt-1">Wide banner recommended (16:9)</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </div>

      {/* License & Tax Information */}
      <div>
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">License & Tax Information</h3>
            <p className="text-xs text-gray-500">Legal documents and tax registration details</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClassName}>License Document</label>
            {formData.license && typeof formData.license === "string" ? (
              <div className="bg-blue-50 border border-blue-300 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">Existing license</p>
                  <a href={formData.license} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View file</a>
                </div>
                {isEditingActive && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, license: null }))}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : formData.license instanceof File ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{formData.license.name}</p>
                  <p className="text-xs text-emerald-600">✓ Uploaded ({(formData.license.size / 1024).toFixed(1)} KB)</p>
                </div>
                {isEditingActive && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, license: null }))}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-5 h-5" />
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
                  className={`w-full border rounded-xl p-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 ${formErrors.license ? "border-red-500" : "border-gray-300"} ${!isEditingActive ? "bg-gray-50" : ""}`}
                />
                {isEditingActive && !formData.license && (
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className={labelClassName}>TIN Number</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter TIN number"
                value={formData.tin_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, tin_number: e.target.value }))}
                disabled={!isEditingActive}
                className={`${inputClassName(formErrors.tin_number)} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>VAT Registration Number</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter VAT registration number"
                value={formData.vat_registration_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, vat_registration_number: e.target.value }))}
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
            onChange={(value) => setFormData((prev) => ({ ...prev, tax_type: value }))}
            options={taxTypeOptions}
            placeholder="Select Tax Type"
          />
        </div>
      </div>
    </div>
  );

  // ==================== STEP 4: REVIEW & SUMMARY ====================
  const renderStep4 = () => (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Review Your Company Details</h3>
          <p className="text-xs text-gray-500">Verify all information before submitting</p>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-secondary" />
            Business Information
          </h4>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Company Name</p>
            <p className="text-sm font-semibold text-gray-900">{formData.name || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Slug</p>
            <p className="text-sm font-mono text-gray-700">{formData.slug || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Business Type</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{formData.business_type || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Category</p>
            <p className="text-sm font-semibold text-gray-900">{categories.find((c) => c.id === formData.category)?.name || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Subcategory</p>
            <p className="text-sm font-semibold text-gray-900">{subcategories.find((s) => s.id === formData.sub_category)?.name || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Head Company</p>
            <p className="text-sm font-semibold text-gray-900">
              {headCompanies.find((hc) => hc.id === formData.head_company)?.name || headCompanyName || "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Description</p>
            <p className="text-sm text-gray-700">{formData.description || "—"}</p>
          </div>
          {formData.description_am && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Description (Amharic)</p>
              <p className="text-sm text-gray-700">{formData.description_am}</p>
            </div>
          )}
        </div>
      </div>

      {/* Location Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <MapPinned className="w-4 h-4 text-secondary" />
            Location & Contact
          </h4>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Address</p>
            <p className="text-sm font-semibold text-gray-900">{formData.address || "—"}</p>
          </div>
          {formData.address_am && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Address (Amharic)</p>
              <p className="text-sm text-gray-700">{formData.address_am}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Phone</p>
            <p className="text-sm font-semibold text-gray-900">{formData.contact_phone || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Email</p>
            <p className="text-sm font-semibold text-gray-900">{formData.contact_email || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Minimum Order Total</p>
            <p className="text-sm font-semibold text-gray-900">{formData.minimum_order_total || "0.00"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Maximum COD Limit</p>
            <p className="text-sm font-semibold text-gray-900">{formData.maximum_cod_total || "0.00 (Unlimited)"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Delivery Fee/KM</p>
            <p className="text-sm font-semibold text-gray-900">{formData.delivery_fee_per_km || "0.00"}</p>
          </div>
          {formData.latitude && formData.longitude && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">GPS Coordinates</p>
              <p className="text-sm font-semibold text-gray-900">{formData.latitude}, {formData.longitude}</p>
            </div>
          )}
        </div>
      </div>

      {/* Media Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-secondary" />
            Media & Documents
          </h4>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Logo</p>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
            ) : (
              <p className="text-sm text-gray-500">No logo uploaded</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Cover Image</p>
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-24 rounded-xl object-cover border border-gray-200" />
            ) : (
              <p className="text-sm text-gray-500">No cover image uploaded</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">TIN Number</p>
            <p className="text-sm font-semibold text-gray-900">{formData.tin_number || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">VAT Number</p>
            <p className="text-sm font-semibold text-gray-900">{formData.vat_registration_number || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tax Type</p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.tax_type === "vat" ? "VAT (15%)" : 
               formData.tax_type === "turnover_goods" ? "Turnover Tax - Goods (2%)" : 
               formData.tax_type === "turnover_services" ? "Turnover Tax - Services (10%)" : "No Tax"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">License</p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.license ? (formData.license instanceof File ? formData.license.name : "Uploaded") : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Theme & Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-2">
            <Palette className="w-4 h-4 text-secondary" />
            Theme & Status
          </h4>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Theme Primary</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-6 h-6 rounded-lg border border-gray-200" style={{ backgroundColor: formData.theme_primary }} />
                <span className="text-sm font-mono">{formData.theme_primary}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Theme Dark</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-6 h-6 rounded-lg border border-gray-200" style={{ backgroundColor: formData.theme_dark }} />
                <span className="text-sm font-mono">{formData.theme_dark}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Theme Light</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-6 h-6 rounded-lg border border-gray-200" style={{ backgroundColor: formData.theme_light }} />
                <span className="text-sm font-mono">{formData.theme_light}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
              {formData.is_active ? "Active" : "Inactive"}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.is_featured ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
              {formData.is_featured ? "Featured" : "Not Featured"}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.supports_table_service ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
              {formData.supports_table_service ? "Table Service" : "No Table Service"}
            </span>
            {formData.supports_table_service && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.show_order_queue ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                {formData.show_order_queue ? "Queue Visible" : "Queue Hidden"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ready Footer */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-emerald-700">✅ Ready to Submit</span>
          <span className="text-xs text-emerald-600">All steps completed</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-600">{formData.name ? "✅" : "❌"} Name</span>
          <span className="text-xs text-gray-600">{formData.slug ? "✅" : "❌"} Slug</span>
          <span className="text-xs text-gray-600">{formData.contact_phone ? "✅" : "❌"} Phone</span>
          <span className="text-xs text-gray-600">{formData.contact_email ? "✅" : "❌"} Email</span>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  return (
    <form onSubmit={onSubmit} className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-100 pb-10 " >
      <div className="flex-1 p-4 space-y-3 pb-20">
        {!isEditingActive && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">You are viewing this company in read-only mode</span>
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