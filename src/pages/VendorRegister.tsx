// src/pages/VendorRegister.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Info,
  Copy,
  Check,
  FileCheck,
  Sparkles,
} from "lucide-react";
import {
  getCategories,
  getSubCategories,
  submitVendorRegistration,
} from "../services/api";
import type { Category, SubCategory } from "../types";
import LocationPickerModal from "../components/dashboard/CompanyManagement/LocationPickerModal";
import TermsAndConditionsModal from "../components/ui/TermsAndConditionsModal";
import { CustomSelect, type SelectOption } from "../components/ui/CustomSelect";

const BUSINESS_TYPE_OPTIONS = [
  { value: "store", label: "Retail / Wholesale Store" },
  { value: "brand", label: "Brand / Manufacturer" },
  { value: "factory", label: "Factory / Production" },
  { value: "service", label: "Service Provider" },
  { value: "delivery_service", label: "Delivery Service" },
  { value: "other", label: "Other" },
];

const TAX_TYPE_OPTIONS = [
  { value: "none", label: "No Tax (Exempt or below threshold)" },
  { value: "vat", label: "VAT (15% - Annual turnover > 2M ETB)" },
  { value: "turnover_goods", label: "Turnover Tax - Goods (2%)" },
  { value: "turnover_services", label: "Turnover Tax - Services (10%)" },
];

const STEPS = [
  { num: 1, title: "Contact" },
  { num: 2, title: "Business" },
  { num: 3, title: "Location" },
  { num: 4, title: "Compliance" },
];

const NEXT_STEPS = [
  {
    title: "Compliance Review",
    desc: "Our compliance team reviews your business license and documents within 24–48 business hours.",
  },
  {
    title: "Approval & Invitation",
    desc: "Once approved, you will receive an invitation email with a secure link to set your account password.",
  },
  {
    title: "Dashboard Access",
    desc: "After setting your password, access your management dashboard to add products, staff, and start selling.",
  },
];

const baseInput =
  "w-full h-10 rounded-lg border bg-white text-sm text-[#111827] placeholder:text-gray-400 outline-none transition-all disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

const inputState = (err?: string) =>
  err
    ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
    : "border-[#E5E7EB] focus:border-[#6750A4] focus:ring-4 focus:ring-[#6750A4]/10";
const inputCls = (err?: string, extra = "") =>
  `${baseInput} ${inputState(err)} ${extra}`;

const baseTextarea =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 outline-none transition-all resize-none";
const textareaCls = (err?: string) => `${baseTextarea} ${inputState(err)}`;

const labelCls = "mb-1 block text-xs font-semibold text-[#111827]";
const helpCls = "mt-1.5 text-[11px] leading-relaxed text-[#6B7280]";
const errorCls = "mt-1.5 text-xs font-medium text-red-600";
const optionalCls = "ml-1 text-[11px] font-normal text-[#6B7280]";

// Shared className that visually aligns the CustomSelect trigger with native inputs
const customSelectCls = (hasError?: boolean, disabled?: boolean) =>
  [
    "[&>button]:h-11 [&>button]:rounded-lg [&>button]:bg-white [&>button]:px-3.5 [&>button]:text-sm [&>button]:text-[#111827]",
    hasError
      ? "[&>button]:border-red-300 [&>button]:focus:border-red-400 [&>button]:focus:ring-4 [&>button]:focus:ring-red-100"
      : "[&>button]:border-[#E5E7EB] [&>button]:focus:border-[#6750A4] [&>button]:focus:ring-4 [&>button]:focus:ring-[#6750A4]/10",
    disabled
      ? "pointer-events-none [&>button]:opacity-60 [&>button]:cursor-not-allowed"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

export default function VendorRegister(): React.JSX.Element {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Categories & SubCategories
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);

  // Form Fields
  // Step 1: Contact & Ownership
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryRole, setSignatoryRole] = useState("Owner");

  // Step 2: Proposed Business Info
  const [companyName, setCompanyName] = useState("");
  const [companyNameAm, setCompanyNameAm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | "">(
    "",
  );
  const [businessType, setBusinessType] = useState("store");
  const [description, setDescription] = useState("");
  const [descriptionAm, setDescriptionAm] = useState("");

  // Step 3: Location
  const [address, setAddress] = useState("");
  const [addressAm, setAddressAm] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Step 4: Tax & Legal Compliance
  const [tinNumber, setTinNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [fanNumber, setFanNumber] = useState("");
  const [taxType, setTaxType] = useState("none");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [moaFile, setMoaFile] = useState<File | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Bot Protection (Honeypot)
  const [hpCompanyField, setHpCompanyField] = useState("");

  // Step 5: Success
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch Categories on mount
  useEffect(() => {
    let mounted = true;
    const fetchCats = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await getCategories();
        if (mounted) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.results || [];
          setCategories(list);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    };
    fetchCats();
    return () => {
      mounted = false;
    };
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    let mounted = true;
    if (!selectedCategory) {
      setSubCategories([]);
      setSelectedSubCategory("");
      return;
    }

    const catObj = categories.find((c) => c.id === Number(selectedCategory));
    if (
      catObj &&
      Array.isArray((catObj as any).subcategories) &&
      (catObj as any).subcategories.length > 0
    ) {
      setSubCategories((catObj as any).subcategories);
      return;
    }

    const fetchSubCats = async () => {
      try {
        const slug = catObj?.slug;
        const res = await getSubCategories(slug);
        if (mounted) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.results || [];
          setSubCategories(list);
        }
      } catch (err) {
        console.error("Failed to load subcategories:", err);
      }
    };
    fetchSubCats();

    return () => {
      mounted = false;
    };
  }, [selectedCategory, categories]);

  // Step validation helpers
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!contactName.trim()) errs.contactName = "Full legal name is required";
    if (!contactEmail.trim()) {
      errs.contactEmail = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errs.contactEmail = "Please enter a valid email address";
    }
    if (!contactPhone.trim()) {
      errs.contactPhone = "Phone number is required";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Business name is required";
    if (!selectedCategory) errs.category = "Please select a primary category";
    if (!selectedSubCategory) errs.subCategory = "Please select a sub-category";
    if (!businessType) errs.businessType = "Please select a business type";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = "Physical business address is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs: Record<string, string> = {};
    if (!tinNumber.trim())
      errs.tinNumber = "Taxpayer Identification Number (TIN) is required";
    if (!licenseFile) {
      errs.licenseFile =
        "A valid Trade License / Registration Certificate file is required";
    } else {
      if (licenseFile.size > 5 * 1024 * 1024) {
        errs.licenseFile = "License file exceeds 5MB limit";
      }
    }
    if (moaFile && moaFile.size > 5 * 1024 * 1024) {
      errs.moaFile = "MOA file exceeds 5MB limit";
    }
    if (!termsAgreed) {
      errs.termsAgreed =
        "You must review and agree to the platform Terms and Conditions";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    setGlobalError(null);
    if (step === 1 && validateStep1()) {
      if (!signatoryName.trim()) {
        setSignatoryName(contactName.trim());
      }
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setGlobalError(null);
    setFieldErrors({});
    if (step > 1) setStep(step - 1);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    try {
      setIsSubmitting(true);
      setGlobalError(null);

      const formData = new FormData();
      formData.append("contact_name", contactName.trim());
      formData.append("contact_email", contactEmail.trim().toLowerCase());
      formData.append("contact_phone", contactPhone.trim());
      formData.append(
        "terms_signatory_name",
        (signatoryName || contactName).trim(),
      );
      formData.append(
        "terms_signatory_role",
        (signatoryRole || "Owner").trim(),
      );

      formData.append("name", companyName.trim());
      if (companyNameAm.trim())
        formData.append("name_am", companyNameAm.trim());
      formData.append("category", String(selectedCategory));
      formData.append("sub_category", String(selectedSubCategory));
      formData.append("business_type", businessType);
      if (description.trim())
        formData.append("description", description.trim());
      if (descriptionAm.trim())
        formData.append("description_am", descriptionAm.trim());

      formData.append("address", address.trim());
      if (addressAm.trim()) formData.append("address_am", addressAm.trim());
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);

      formData.append("tin_number", tinNumber.trim());
      if (vatNumber.trim())
        formData.append("vat_registration_number", vatNumber.trim());
      if (fanNumber.trim()) formData.append("fan_number", fanNumber.trim());
      formData.append("tax_type", taxType);

      if (licenseFile) formData.append("license_file", licenseFile);
      if (moaFile) formData.append("moa_file", moaFile);

      formData.append("terms_agreed", "true");

      if (hpCompanyField) {
        formData.append("hp_company_field", hpCompanyField);
      }

      const res = await submitVendorRegistration(formData);
      setReferenceCode(res.data.reference_code || "APP-PENDING");
      setStep(5);
    } catch (err: any) {
      console.error("Submission failed:", err);
      const data = err.response?.data;
      if (data) {
        if (typeof data === "string") {
          setGlobalError(data);
        } else if (data.detail) {
          setGlobalError(data.detail);
        } else {
          const errMap: Record<string, string> = {};
          Object.keys(data).forEach((key) => {
            const val = data[key];
            errMap[key] = Array.isArray(val) ? val.join(" ") : String(val);
          });
          setFieldErrors(errMap);
          setGlobalError(
            "Please correct the errors indicated below before submitting.",
          );
        }
      } else {
        setGlobalError(
          "A network error occurred while submitting your application. Please check your connection and try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReferenceCode = () => {
    if (referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Build SelectOption lists for CustomSelect
  const categoryOptions: SelectOption[] = categories.map((c) => ({
    label: c.name_am ? `${c.name} (${c.name_am})` : c.name,
    value: String(c.id),
  }));

  const subCategoryOptions: SelectOption[] = subCategories.map((sc) => ({
    label: sc.name_am ? `${sc.name} (${sc.name_am})` : sc.name,
    value: String(sc.id),
  }));

  const taxTypeOptions: SelectOption[] = TAX_TYPE_OPTIONS.map((t) => ({
    label: t.label,
    value: t.value,
  }));

  const subCategoryPlaceholder = !selectedCategory
    ? "Select a category first..."
    : subCategories.length === 0
      ? "No subcategories available"
      : "Select Sub-Category...";

  return (
    <div className="min-h-screen bg-[#EEF4FA] text-gray-900 selection:bg-[#6750A4]/20">
      {step < 5 ? (
        <div className="min-h-screen p-0 sm:p-3 lg:h-screen lg:min-h-0 lg:p-4">
          <div className="mx-auto grid min-h-screen max-w-[1000px] overflow-hidden bg-white shadow-xl sm:min-h-[calc(100vh-24px)] sm:rounded-2xl lg:h-[calc(100vh-32px)] lg:min-h-0 lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* LEFT PURPLE SIDEBAR */}
            <aside className="relative flex min-h-0 flex-col overflow-hidden bg-[#6750A4] px-4 py-4 text-white sm:px-5 lg:h-full">
              {/* DECORATIVE BACKGROUND */}
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -bottom-20 left-20 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute -right-28 top-20 h-64 w-64 rounded-full border border-white/10" />

              {/* BRAND */}
              <Link
                to="/"
                className="relative z-10 flex shrink-0 items-center gap-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                  <img
                    src="/elilta1.jpg"
                    alt="Elilita Logo"
                    className="h-full w-full object-contain p-0.5"
                  />
                </span>
                <span>
                  <span className="block text-base font-bold tracking-tight">
                    Elilita
                  </span>
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.13em] text-white/65">
                    Vendor Partner Network
                  </span>
                </span>
              </Link>

              {/* DESKTOP VERTICAL STEPS */}
              <div className="relative z-10 mt-5 hidden min-h-0 shrink lg:block">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55">
                  Registration steps
                </p>

                <div className="relative space-y-3">
                  <div className="absolute bottom-6 left-[15px] top-6 w-px bg-white/20" />

                  {STEPS.map((s) => {
                    const isActive = step === s.num;
                    const isDone = step > s.num;

                    return (
                      <div
                        key={s.num}
                        className="relative flex items-center gap-2.5"
                      >
                        <div
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isDone
                              ? "border-white bg-white text-[#6750A4]"
                              : isActive
                                ? "border-white bg-white text-[#6750A4] ring-2 ring-white/20"
                                : "border-white/25 bg-white/10 text-white/60"
                          }`}
                        >
                          {isDone ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[11px] font-bold">
                              {s.num}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold ${
                              isActive || isDone
                                ? "text-white"
                                : "text-white/55"
                            }`}
                          >
                            {s.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-white/55">
                            {isActive
                              ? "Currently in progress"
                              : isDone
                                ? "Completed"
                                : "Not started"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SIDEBAR PROGRESS */}
                <div className="mt-4 border-t border-white/15 pt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/65">Overall progress</span>
                    <span className="font-bold text-white">
                      {Math.round((step / STEPS.length) * 100)}%
                    </span>
                  </div>

                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{
                        width: `${(step / STEPS.length) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-white/60">
                    Step {step} of {STEPS.length}
                  </p>
                </div>
              </div>

              {/* MOBILE PROGRESS */}
              <div className="relative z-10 mt-4 shrink-0 lg:hidden">
                <div className="flex items-center justify-between gap-1">
                  {STEPS.map((s, index) => {
                    const isActive = step === s.num;
                    const isDone = step > s.num;

                    return (
                      <React.Fragment key={s.num}>
                        <div className="flex min-w-0 flex-col items-center gap-1">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                              isActive || isDone
                                ? "bg-white text-[#6750A4]"
                                : "border border-white/30 bg-white/10 text-white/60"
                            }`}
                          >
                            {isDone ? <Check className="h-3 w-3" /> : s.num}
                          </div>

                          <span
                            className={`max-w-[65px] truncate text-center text-[8px] ${
                              isActive
                                ? "font-bold text-white"
                                : "text-white/60"
                            }`}
                          >
                            {s.title}
                          </span>
                        </div>

                        {index < STEPS.length - 1 && (
                          <div
                            className={`mb-3 h-px min-w-2 flex-1 ${
                              step > s.num ? "bg-white" : "bg-white/20"
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* SIDEBAR FOOTER */}
              <div className="relative z-10 mt-auto shrink-0 border-t border-white/15 pt-3 lg:pt-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/70" />
                  <p className="text-[9px] leading-3.5 text-white/65">
                    Your business information and documents are securely handled
                    during the verification process.
                  </p>
                </div>

                <p className="mt-2.5 text-[9px] text-white/50">
                  © {new Date().getFullYear()} Elilita. All rights reserved.
                </p>
              </div>
            </aside>

            {/* RIGHT FORM AREA */}
            <main className="min-h-0 min-w-0 overflow-y-auto bg-white">
              <div className="mx-auto w-full max-w-[1100px] px-4 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4">
                {/* TOP RIGHT SIGN IN */}
                <div className="mb-3 flex items-center justify-end gap-3">
                  <span className="text-xs text-gray-500 sm:text-sm">
                    Already registered?
                  </span>
                  <Link
                    to="/signin"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#6750A4] hover:text-[#6750A4] sm:text-sm"
                  >
                    Sign in
                  </Link>
                </div>

                {/* STEP HEADING */}
                <div className="mb-3">
                  <p className="text-[11px] font-medium text-[#6750A4]">
                    Step {step}/{STEPS.length}
                  </p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    {step === 1
                      ? "Contact information"
                      : step === 2
                        ? "Business information"
                        : step === 3
                          ? "Business location"
                          : "Verification and compliance"}
                  </h1>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500 sm:text-sm">
                    {step === 1
                      ? "Tell us who will represent and manage this business."
                      : step === 2
                        ? "Tell us about the business you want to register."
                        : step === 3
                          ? "Add the physical address of your store or business."
                          : "Provide your tax information and required business documents."}
                  </p>
                </div>

                {/* GLOBAL ERROR */}
                {globalError && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <p className="text-xs leading-5 text-red-700">
                      {globalError}
                    </p>
                  </div>
                )}

                {/* FORM */}
                <div className="min-w-0">
                  <form
                    onSubmit={
                      step === 4
                        ? handleSubmit
                        : (e) => {
                            e.preventDefault();
                            handleNextStep();
                          }
                    }
                  >
                    {/* HONEYPOT */}
                    <input
                      type="text"
                      name="hp_company_field"
                      value={hpCompanyField}
                      onChange={(e) => setHpCompanyField(e.target.value)}
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        opacity: 0,
                        height: 0,
                        width: 0,
                      }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    {/* STEP CONTENT */}
                    <div className="min-h-0">
                      {/* STEP 1 - CONTACT INFORMATION */}
                      {step === 1 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
                            {/* FULL NAME */}
                            <div>
                              <label className={labelCls}>
                                Full legal name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  required
                                  value={contactName}
                                  onChange={(e) =>
                                    setContactName(e.target.value)
                                  }
                                  placeholder="e.g. Abebe Bikila"
                                  className={inputCls(
                                    fieldErrors.contactName,
                                    "pl-10",
                                  )}
                                />
                              </div>
                              {fieldErrors.contactName && (
                                <p className={errorCls}>
                                  {fieldErrors.contactName}
                                </p>
                              )}
                            </div>

                            {/* EMAIL */}
                            <div>
                              <label className={labelCls}>
                                Email address{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="email"
                                  required
                                  value={contactEmail}
                                  onChange={(e) =>
                                    setContactEmail(e.target.value)
                                  }
                                  placeholder="owner@yourcompany.com"
                                  className={inputCls(
                                    fieldErrors.contactEmail,
                                    "pl-10",
                                  )}
                                />
                              </div>
                              <p className={helpCls}>
                                We will send application updates to this email.
                              </p>
                              {fieldErrors.contactEmail && (
                                <p className={errorCls}>
                                  {fieldErrors.contactEmail}
                                </p>
                              )}
                            </div>

                            {/* PHONE */}
                            <div>
                              <label className={labelCls}>
                                Phone number{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="tel"
                                  required
                                  value={contactPhone}
                                  onChange={(e) =>
                                    setContactPhone(e.target.value)
                                  }
                                  placeholder="e.g. +251 91 123 4567"
                                  className={inputCls(
                                    fieldErrors.contactPhone,
                                    "pl-10",
                                  )}
                                />
                              </div>
                              {fieldErrors.contactPhone && (
                                <p className={errorCls}>
                                  {fieldErrors.contactPhone}
                                </p>
                              )}
                            </div>

                            {/* ROLE */}
                            <div>
                              <label className={labelCls}>
                                Your role
                                <span className={optionalCls}>(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={signatoryRole}
                                onChange={(e) =>
                                  setSignatoryRole(e.target.value)
                                }
                                placeholder="Owner, General Manager..."
                                className={inputCls()}
                              />
                            </div>
                          </div>

                          <div className="rounded-lg border border-[#6750A4]/10 bg-[#F8F7FB] p-3">
                            <div className="flex gap-2.5">
                              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6750A4]" />
                              <p className="text-xs leading-5 text-gray-600">
                                Make sure your contact details are correct. We
                                will use them to communicate with you during the
                                verification process.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 2 - BUSINESS INFORMATION */}
                      {step === 2 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
                            {/* BUSINESS NAME ENGLISH */}
                            <div>
                              <label className={labelCls}>
                                Business name (English){" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Bole Fresh Grocery"
                                className={inputCls(
                                  fieldErrors.companyName,
                                  "pl-10",
                                )}
                              />
                              {fieldErrors.companyName && (
                                <p className={errorCls}>
                                  {fieldErrors.companyName}
                                </p>
                              )}
                            </div>

                            {/* BUSINESS NAME AMHARIC */}
                            <div>
                              <label className={labelCls}>
                                Business name (Amharic)
                                <span className={optionalCls}>(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={companyNameAm}
                                onChange={(e) =>
                                  setCompanyNameAm(e.target.value)
                                }
                                placeholder="የንግድ ስም"
                                className={inputCls()}
                              />
                            </div>

                            {/* PRIMARY CATEGORY */}
                            <div>
                              <label className={labelCls}>
                                Primary category{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <CustomSelect
                                value={String(selectedCategory)}
                                onChange={(val) =>
                                  setSelectedCategory(Number(val) || "")
                                }
                                options={categoryOptions}
                                placeholder={
                                  isLoadingCategories
                                    ? "Loading categories..."
                                    : "Choose a category"
                                }
                                ariaLabel="Primary Category"
                                className={customSelectCls(
                                  !!fieldErrors.category,
                                  isLoadingCategories,
                                )}
                              />
                              {fieldErrors.category && (
                                <p className={errorCls}>
                                  {fieldErrors.category}
                                </p>
                              )}
                            </div>

                            {/* SUB CATEGORY */}
                            <div>
                              <label className={labelCls}>
                                Sub-category{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <CustomSelect
                                value={String(selectedSubCategory)}
                                onChange={(val) =>
                                  setSelectedSubCategory(Number(val) || "")
                                }
                                options={subCategoryOptions}
                                placeholder={subCategoryPlaceholder}
                                ariaLabel="Sub-Category"
                                className={customSelectCls(
                                  !!fieldErrors.subCategory,
                                  !selectedCategory ||
                                    subCategories.length === 0,
                                )}
                              />
                              {fieldErrors.subCategory && (
                                <p className={errorCls}>
                                  {fieldErrors.subCategory}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
                              {/* BUSINESS TYPE */}
                              <div>
                                <label className={labelCls}>
                                  Business type{" "}
                                  <span className="text-red-500">*</span>
                                </label>

                                <CustomSelect
                                  value={businessType}
                                  onChange={setBusinessType}
                                  options={BUSINESS_TYPE_OPTIONS}
                                  placeholder="Select business type"
                                  ariaLabel="Business type"
                                  maxHeight={220}
                                  className="mt-1"
                                />

                                {fieldErrors.businessType && (
                                  <p className={errorCls}>
                                    {fieldErrors.businessType}
                                  </p>
                                )}
                              </div>

                              {/* FISCAL APPLICATION NUMBER */}
                              <div>
                                <label className={labelCls}>
                                  Fiscal Application Number (FAN)
                                  <span className={optionalCls}>
                                    (Optional)
                                  </span>
                                </label>

                                <input
                                  type="text"
                                  value={fanNumber}
                                  onChange={(e) => setFanNumber(e.target.value)}
                                  placeholder="Enter FAN / device number"
                                  className={inputCls()}
                                />
                              </div>
                            </div>

                            {/* BUSINESS DESCRIPTION */}
                            <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2">
                              {/* BUSINESS DESCRIPTION ENGLISH */}
                              <div>
                                <label className={labelCls}>
                                  Business description
                                  <span className={optionalCls}>
                                    (Optional)
                                  </span>
                                </label>
                                <textarea
                                  rows={2}
                                  value={description}
                                  onChange={(e) =>
                                    setDescription(e.target.value)
                                  }
                                  placeholder="Briefly describe your products or services..."
                                  className={textareaCls()}
                                />
                              </div>

                              {/* BUSINESS DESCRIPTION AMHARIC */}
                              <div>
                                <label className={labelCls}>
                                  Business description (Amharic)
                                  <span className={optionalCls}>
                                    (Optional)
                                  </span>
                                </label>
                                <textarea
                                  rows={2}
                                  value={descriptionAm}
                                  onChange={(e) =>
                                    setDescriptionAm(e.target.value)
                                  }
                                  placeholder="ስለ ንግድዎ ወይም ስለሚያቀርቡት አገልግሎት አጭር መግለጫ..."
                                  className={textareaCls()}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3 - BUSINESS LOCATION */}
                      {step === 3 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* ENGLISH ADDRESS */}
                            <div>
                              <label className={labelCls}>
                                Physical address (English){" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                rows={2}
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Subcity, Woreda, street name, building, floor..."
                                className={textareaCls(fieldErrors.address)}
                              />
                              {fieldErrors.address && (
                                <p className={errorCls}>
                                  {fieldErrors.address}
                                </p>
                              )}
                            </div>

                            {/* AMHARIC ADDRESS */}
                            <div>
                              <label className={labelCls}>
                                Physical address (Amharic)
                                <span className={optionalCls}>(Optional)</span>
                              </label>
                              <textarea
                                rows={2}
                                value={addressAm}
                                onChange={(e) => setAddressAm(e.target.value)}
                                placeholder="የንግድ ቦታ አድራሻ..."
                                className={textareaCls()}
                              />
                            </div>
                          </div>

                          {/* GPS LOCATION */}
                          <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6750A4]/10 text-[#6750A4]">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-gray-900">
                                    Pin your business location
                                  </h3>
                                  <p className="mt-0.5 max-w-lg text-xs leading-5 text-gray-500">
                                    Adding a map location helps customers find
                                    your business and improves delivery distance
                                    calculations.
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setIsLocationModalOpen(true)}
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#6750A4]/30 bg-white px-4 text-xs font-semibold text-[#6750A4] transition hover:bg-[#6750A4]/5"
                              >
                                <MapPin className="h-4 w-4" />
                                Choose on map
                              </button>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2">
                              <div>
                                <label className={labelCls}>Latitude</label>
                                <input
                                  type="text"
                                  value={latitude}
                                  onChange={(e) => setLatitude(e.target.value)}
                                  placeholder="e.g. 9.005401"
                                  className={inputCls("", "h-10")}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Longitude</label>
                                <input
                                  type="text"
                                  value={longitude}
                                  onChange={(e) => setLongitude(e.target.value)}
                                  placeholder="e.g. 38.788523"
                                  className={inputCls("", "h-10")}
                                />
                              </div>
                            </div>

                            {latitude && longitude && (
                              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                GPS coordinates added successfully
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* STEP 4 - VERIFICATION */}
                      {step === 4 && (
                        <div className="space-y-4">
                          {/* TAX INFORMATION */}
                          <section className="space-y-3">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">
                                Tax information
                              </h3>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Enter your official tax registration details.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
                              {/* TIN */}
                              <div>
                                <label className={labelCls}>
                                  TIN number{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={tinNumber}
                                  onChange={(e) => setTinNumber(e.target.value)}
                                  placeholder="Enter your TIN number"
                                  className={inputCls(fieldErrors.tinNumber)}
                                />
                                {fieldErrors.tinNumber && (
                                  <p className={errorCls}>
                                    {fieldErrors.tinNumber}
                                  </p>
                                )}
                              </div>

                              {/* TAX TYPE */}
                              <div>
                                <label className={labelCls}>
                                  Tax registration type{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                  value={taxType}
                                  onChange={setTaxType}
                                  options={taxTypeOptions}
                                  placeholder="Choose tax type"
                                  ariaLabel="Tax Registration Type"
                                  className={customSelectCls(false, false)}
                                />
                              </div>

                              {/* VAT */}
                              {taxType === "vat" && (
                                <div>
                                  <label className={labelCls}>
                                    VAT registration number
                                    <span className={optionalCls}>
                                      (Optional)
                                    </span>
                                  </label>
                                  <input
                                    type="text"
                                    value={vatNumber}
                                    onChange={(e) =>
                                      setVatNumber(e.target.value)
                                    }
                                    placeholder="e.g. VAT-1234567"
                                    className={inputCls()}
                                  />
                                </div>
                              )}

                              {/* FAN */}
                              {/* <div>
                              <label className={labelCls}>
                                Fiscal Application Number (FAN)
                                <span className={optionalCls}>(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={fanNumber}
                                onChange={(e) => setFanNumber(e.target.value)}
                                placeholder="Enter FAN / device number"
                                className={inputCls()}
                              />
                            </div> */}
                            </div>
                          </section>

                          <div className="border-t border-gray-100" />

                          {/* BUSINESS DOCUMENTS */}
                          <section className="space-y-3">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">
                                Business documents
                              </h3>
                              <p className="mt-0.5 text-xs leading-5 text-gray-500">
                                Upload clear copies of your official documents.
                                Maximum file size is 5 MB per document.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                              {/* TRADE LICENSE */}
                              <div>
                                <label className={labelCls}>
                                  Trade license / registration{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div
                                  className={`relative flex min-h-[110px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition ${
                                    licenseFile
                                      ? "border-emerald-300 bg-emerald-50/40"
                                      : fieldErrors.licenseFile
                                        ? "border-red-300 bg-red-50/40"
                                        : "border-gray-200 bg-gray-50/60 hover:border-[#6750A4]/50 hover:bg-[#6750A4]/[0.03]"
                                  }`}
                                >
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setLicenseFile(e.target.files[0]);
                                      }
                                    }}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    aria-label="Upload Trade License"
                                  />

                                  {licenseFile ? (
                                    <>
                                      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <FileCheck className="h-5 w-5" />
                                      </span>
                                      <p className="max-w-full truncate text-xs font-semibold text-gray-900">
                                        {licenseFile.name}
                                      </p>
                                      <p className="mt-1 text-[11px] text-gray-500">
                                        {(
                                          licenseFile.size /
                                          1024 /
                                          1024
                                        ).toFixed(2)}{" "}
                                        MB
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLicenseFile(null);
                                        }}
                                        className="relative z-10 mt-2 text-xs font-semibold text-red-600 hover:underline"
                                      >
                                        Remove file
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#6750A4] shadow-sm">
                                        <Upload className="h-4 w-4" />
                                      </span>
                                      <p className="text-xs font-semibold text-gray-800">
                                        Upload trade license
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-gray-500">
                                        Click to browse or select a file
                                      </p>
                                      <p className="mt-1 text-[10px] text-gray-400">
                                        PDF, JPG, PNG · Up to 5 MB
                                      </p>
                                    </>
                                  )}
                                </div>
                                {fieldErrors.licenseFile && (
                                  <p className={errorCls}>
                                    {fieldErrors.licenseFile}
                                  </p>
                                )}
                              </div>

                              {/* MOA */}
                              <div>
                                <label className={labelCls}>
                                  Memorandum of Association (MOA)
                                  <span className={optionalCls}>
                                    (Optional for PLC)
                                  </span>
                                </label>
                                <div
                                  className={`relative flex min-h-[110px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition ${
                                    moaFile
                                      ? "border-emerald-300 bg-emerald-50/40"
                                      : fieldErrors.moaFile
                                        ? "border-red-300 bg-red-50/40"
                                        : "border-gray-200 bg-gray-50/60 hover:border-[#6750A4]/50 hover:bg-[#6750A4]/[0.03]"
                                  }`}
                                >
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        setMoaFile(e.target.files[0]);
                                      }
                                    }}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    aria-label="Upload MOA Document"
                                  />

                                  {moaFile ? (
                                    <>
                                      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <FileCheck className="h-5 w-5" />
                                      </span>
                                      <p className="max-w-full truncate text-xs font-semibold text-gray-900">
                                        {moaFile.name}
                                      </p>
                                      <p className="mt-1 text-[11px] text-gray-500">
                                        {(moaFile.size / 1024 / 1024).toFixed(
                                          2,
                                        )}{" "}
                                        MB
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMoaFile(null);
                                        }}
                                        className="relative z-10 mt-2 text-xs font-semibold text-red-600 hover:underline"
                                      >
                                        Remove file
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#6750A4] shadow-sm">
                                        <Upload className="h-4 w-4" />
                                      </span>
                                      <p className="text-xs font-semibold text-gray-800">
                                        Upload MOA document
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-gray-500">
                                        Click to browse or select a file
                                      </p>
                                      <p className="mt-1 text-[10px] text-gray-400">
                                        PDF, JPG, PNG · Up to 5 MB
                                      </p>
                                    </>
                                  )}
                                </div>
                                {fieldErrors.moaFile && (
                                  <p className={errorCls}>
                                    {fieldErrors.moaFile}
                                  </p>
                                )}
                              </div>
                            </div>
                          </section>

                          <div className="border-t border-gray-100" />

                          {/* TERMS AND CONDITIONS */}
                          <div
                            className={`rounded-lg border p-3 ${
                              fieldErrors.termsAgreed
                                ? "border-red-200 bg-red-50/50"
                                : "border-gray-200 bg-gray-50/70"
                            }`}
                          >
                            <label className="flex cursor-pointer items-start gap-2.5">
                              <input
                                type="checkbox"
                                checked={termsAgreed}
                                onChange={(e) =>
                                  setTermsAgreed(e.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#6750A4] focus:ring-[#6750A4]"
                              />
                              <span className="text-xs leading-5 text-gray-600">
                                I confirm that I am the authorized legal
                                representative (
                                <strong className="text-gray-900">
                                  {signatoryName || contactName}
                                </strong>
                                {" · "}
                                {signatoryRole || "Owner"}) and that the
                                information and documents provided are accurate.
                                I have read and agree to the{" "}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setIsTermsModalOpen(true);
                                  }}
                                  className="font-semibold text-[#6750A4] underline underline-offset-2 hover:text-[#554187]"
                                >
                                  Elilita Merchant Terms & Conditions
                                </button>
                                .
                              </span>
                            </label>
                            {fieldErrors.termsAgreed && (
                              <p className="mt-2 pl-6 text-xs font-medium text-red-600">
                                {fieldErrors.termsAgreed}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* FORM NAVIGATION */}
                    <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      {step > 1 ? (
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          disabled={isSubmitting}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </button>
                      ) : (
                        <p className="hidden text-xs text-gray-400 sm:block">
                          Fields marked with * are required.
                        </p>
                      )}

                      {step < 4 ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6750A4] px-7 text-xs font-semibold text-white transition hover:bg-[#554187] focus:outline-none focus:ring-4 focus:ring-[#6750A4]/20"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6750A4] px-7 text-xs font-semibold text-white transition hover:bg-[#554187] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              Submit application
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <>
          {/* STEP 5 - SUCCESS SCREEN */}
          <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* SUCCESS HEADER */}
              <div className="px-5 py-10 text-center sm:px-10 sm:py-12">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>

                <div className="mt-6">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
                    Application received
                  </span>

                  <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    You're one step closer!
                  </h2>

                  <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500">
                    Thank you for choosing Elilita. Your business registration
                    application and documents have been submitted successfully
                    and are now waiting for verification.
                  </p>
                </div>

                {/* REFERENCE CODE */}
                <div className="mt-8 rounded-2xl border border-[#6750A4]/15 bg-[#6750A4]/[0.04] p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Your application reference
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <span className="break-all font-mono text-xl font-bold tracking-wider text-[#6750A4] sm:text-2xl">
                      {referenceCode}
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyReferenceCode}
                      title="Copy reference code"
                      aria-label="Copy reference code"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#6750A4] hover:text-[#6750A4]"
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    Keep this code to refer to your application. A confirmation
                    email has been sent to{" "}
                    <strong className="break-all text-gray-800">
                      {contactEmail}
                    </strong>
                    .
                  </p>
                </div>
              </div>

              {/* NEXT STEPS */}
              <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-8">
                <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Info className="h-4 w-4 text-[#6750A4]" />
                    What happens next?
                  </h3>

                  <div className="relative mt-6">
                    <div className="absolute bottom-3 left-3 top-3 w-px bg-gray-200" />

                    <ol className="space-y-6">
                      {NEXT_STEPS.map((item, index) => (
                        <li key={item.title} className="relative flex gap-3">
                          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6750A4]/10 text-xs font-bold text-[#6750A4] ring-4 ring-white">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                              {item.desc}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="mt-7 text-center">
                  <Link
                    to="/signin"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6750A4] px-7 text-sm font-semibold text-white transition hover:bg-[#554187] sm:w-auto"
                  >
                    Go to sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <p className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                    Your information is securely handled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* LOCATION PICKER */}
      {isLocationModalOpen && (
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelect={(lat, lon) => {
            setLatitude(lat);
            setLongitude(lon);
            setIsLocationModalOpen(false);
          }}
          onSelectAddress={(addr) => {
            if (!address.trim()) {
              setAddress(addr);
            }
          }}
          initialLat={latitude}
          initialLon={longitude}
          initialAddress={address}
        />
      )}

      {/* TERMS AND CONDITIONS MODAL */}
      {isTermsModalOpen && (
        <TermsAndConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          onAccept={() => {
            setTermsAgreed(true);
            setIsTermsModalOpen(false);
          }}
          alreadyAgreed={termsAgreed}
        />
      )}
    </div>
  );
}
