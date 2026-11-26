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
} from "lucide-react";
import {
  getCategories,
  getSubCategories,
  submitVendorRegistration,
} from "../services/api";
import type { Category, SubCategory } from "../types";
import LocationPickerModal from "../components/dashboard/CompanyManagement/LocationPickerModal";
import TermsAndConditionsModal from "../components/ui/TermsAndConditionsModal";

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
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | "">("");
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
          const list = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
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
    if (catObj && Array.isArray((catObj as any).subcategories) && (catObj as any).subcategories.length > 0) {
      setSubCategories((catObj as any).subcategories);
      return;
    }

    const fetchSubCats = async () => {
      try {
        const slug = catObj?.slug;
        const res = await getSubCategories(slug);
        if (mounted) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
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
    if (!tinNumber.trim()) errs.tinNumber = "Taxpayer Identification Number (TIN) is required";
    if (!licenseFile) {
      errs.licenseFile = "A valid Trade License / Registration Certificate file is required";
    } else {
      if (licenseFile.size > 5 * 1024 * 1024) {
        errs.licenseFile = "License file exceeds 5MB limit";
      }
    }
    if (moaFile && moaFile.size > 5 * 1024 * 1024) {
      errs.moaFile = "MOA file exceeds 5MB limit";
    }
    if (!termsAgreed) {
      errs.termsAgreed = "You must review and agree to the platform Terms and Conditions";
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
      formData.append("terms_signatory_name", (signatoryName || contactName).trim());
      formData.append("terms_signatory_role", (signatoryRole || "Owner").trim());

      formData.append("name", companyName.trim());
      if (companyNameAm.trim()) formData.append("name_am", companyNameAm.trim());
      formData.append("category", String(selectedCategory));
      formData.append("sub_category", String(selectedSubCategory));
      formData.append("business_type", businessType);
      if (description.trim()) formData.append("description", description.trim());
      if (descriptionAm.trim()) formData.append("description_am", descriptionAm.trim());

      formData.append("address", address.trim());
      if (addressAm.trim()) formData.append("address_am", addressAm.trim());
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);

      formData.append("tin_number", tinNumber.trim());
      if (vatNumber.trim()) formData.append("vat_registration_number", vatNumber.trim());
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
          setGlobalError("Please correct the errors indicated below before submitting.");
        }
      } else {
        setGlobalError("A network error occurred while submitting your application. Please check your connection and try again.");
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-[#6a5acd] selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#5f4bb6] to-[#7b68ee] flex items-center justify-center text-white shadow-md shadow-[#6a5acd]/20 group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-[#6a5acd] transition-colors">
                Elilita
              </span>
              <span className="text-xs font-medium text-slate-400 block -mt-1">
                Vendor Partner Network
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs font-medium text-slate-500">
              Already a registered vendor?
            </span>
            <Link
              to="/signin"
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {step < 5 && (
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Your Business on Elilita
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
              Expand your customer reach across Ethiopia. Complete your business information and upload your Trade License to begin verification.
            </p>

            {/* Stepper Progress Bar */}
            <div className="mt-6 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { num: 1, title: "Contact" },
                  { num: 2, title: "Business" },
                  { num: 3, title: "Location" },
                  { num: 4, title: "Compliance" },
                ].map((item) => {
                  const isActive = step === item.num;
                  const isDone = step > item.num;

                  return (
                    <div
                      key={item.num}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-2 rounded-xl transition-colors ${
                        isActive
                          ? "bg-[#6a5acd]/10 text-[#6a5acd] font-semibold"
                          : isDone
                          ? "text-emerald-600 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          isActive
                            ? "bg-[#6a5acd] text-white shadow-xs shadow-[#6a5acd]/30"
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : item.num}
                      </div>
                      <span className="text-xs hidden sm:inline">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200/80 flex items-start gap-3 shadow-xs animate-shake">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 leading-relaxed font-medium">
              {globalError}
            </div>
          </div>
        )}

        {/* Form Container */}
        {step < 5 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8">
            <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
              {/* Off-screen honeypot input for bots */}
              <input
                type="text"
                name="hp_company_field"
                value={hpCompanyField}
                onChange={(e) => setHpCompanyField(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
                tabIndex={-1}
                autoComplete="off"
              />

              {/* STEP 1: Contact & Ownership */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#6a5acd]" />
                      Primary Contact & Ownership Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Who is submitting this application and authorized to manage the store account?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Legal Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Abebe Bikila"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                            fieldErrors.contactName ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                          }`}
                        />
                      </div>
                      {fieldErrors.contactName && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.contactName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="owner@yourcompany.com"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                            fieldErrors.contactEmail ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Application notices and password setup link will be sent to this email.
                      </p>
                      {fieldErrors.contactEmail && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.contactEmail}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="e.g. +251 91 123 4567"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                            fieldErrors.contactPhone ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                          }`}
                        />
                      </div>
                      {fieldErrors.contactPhone && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.contactPhone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Signatory Capacity / Role
                      </label>
                      <input
                        type="text"
                        value={signatoryRole}
                        onChange={(e) => setSignatoryRole(e.target.value)}
                        placeholder="Owner, General Manager, Managing Director"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Proposed Business Info */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#6a5acd]" />
                      Proposed Business Details
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Provide details about your store or business establishment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Business Name (English) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Bole Fresh Grocery"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                          fieldErrors.companyName ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                        }`}
                      />
                      {fieldErrors.companyName && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.companyName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Business Name (Amharic)
                      </label>
                      <input
                        type="text"
                        value={companyNameAm}
                        onChange={(e) => setCompanyNameAm(e.target.value)}
                        placeholder="ለምሳሌ፡ ቦሌ ፍሬሽ ግሮሰሪ"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Primary Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(Number(e.target.value) || "")}
                        disabled={isLoadingCategories}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                          fieldErrors.category ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                        }`}
                      >
                        <option value="">Select Category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.name_am ? `(${c.name_am})` : ""}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.category && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.category}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Sub-Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(Number(e.target.value) || "")}
                        disabled={!selectedCategory || subCategories.length === 0}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                          fieldErrors.subCategory ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                        }`}
                      >
                        <option value="">
                          {!selectedCategory
                            ? "Select a category first..."
                            : subCategories.length === 0
                            ? "No subcategories found"
                            : "Select Sub-Category..."}
                        </option>
                        {subCategories.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name} {sc.name_am ? `(${sc.name_am})` : ""}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.subCategory && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.subCategory}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Business Operating Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BUSINESS_TYPE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBusinessType(opt.value)}
                            className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                              businessType === opt.value
                                ? "border-[#6a5acd] bg-[#6a5acd]/10 text-[#6a5acd] shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {businessType === opt.value && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Short Description / Overview
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Briefly describe the goods, products, or services your business offers..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Short Description / Overview (Amharic)
                      </label>
                      <textarea
                        rows={2}
                        value={descriptionAm}
                        onChange={(e) => setDescriptionAm(e.target.value)}
                        placeholder="ስለ ንግድዎ ወይም ስለሚሸጡት ምርት አጭር መግለጫ..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Physical Location */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#6a5acd]" />
                      Physical Location & Address
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Where is your physical store or dispatch branch located?
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Premise Address (English) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Bole Subcity, Woreda 03, Cameroon St., Medhanialem Mall, 2nd Floor, Shop #204"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                          fieldErrors.address ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                        }`}
                      />
                      {fieldErrors.address && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Premise Address (Amharic)
                      </label>
                      <textarea
                        rows={2}
                        value={addressAm}
                        onChange={(e) => setAddressAm(e.target.value)}
                        placeholder="ለምሳሌ፡ ቦሌ ክፍለ ከተማ፣ ወረዳ 03፣ ካሜሩን ጎዳና"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      />
                    </div>

                    {/* Coordinates & Map Picker */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Store GPS Pin (Coordinates)
                          </h4>
                          <p className="text-xs text-slate-500">
                            Required for customer proximity search and accurate delivery distance calculation.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsLocationModalOpen(true)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-2xs shrink-0"
                        >
                          <MapPin className="h-4 w-4 text-[#6a5acd]" />
                          Open Map Picker
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Latitude
                          </label>
                          <input
                            type="text"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            placeholder="e.g. 9.005401"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#6a5acd]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Longitude
                          </label>
                          <input
                            type="text"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            placeholder="e.g. 38.788523"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-[#6a5acd]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Legal Compliance & File Uploads */}
              {step === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-[#6a5acd]" />
                      Tax Compliance & Verification Documents
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload official registration documents to verify your business under ERCA regulations.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        TIN Number (Taxpayer ID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={tinNumber}
                        onChange={(e) => setTinNumber(e.target.value)}
                        placeholder="10-digit TIN Number"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6a5acd]/20 transition-all ${
                          fieldErrors.tinNumber ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-[#6a5acd]"
                        }`}
                      />
                      {fieldErrors.tinNumber && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.tinNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tax Registration Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={taxType}
                        onChange={(e) => setTaxType(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      >
                        {TAX_TYPE_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {taxType === "vat" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          VAT Registration Number
                        </label>
                        <input
                          type="text"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          placeholder="e.g. VAT-1234567"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Fiscal Application Number (FAN)
                      </label>
                      <input
                        type="text"
                        value={fanNumber}
                        onChange={(e) => setFanNumber(e.target.value)}
                        placeholder="16-digit FAN / Device number (optional)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] focus:ring-2 focus:ring-[#6a5acd]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Document Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
                    {/* License Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Trade License / Registration Certificate <span className="text-red-500">*</span>
                      </label>
                      <div
                        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                          licenseFile
                            ? "border-emerald-400 bg-emerald-50/40"
                            : fieldErrors.licenseFile
                            ? "border-red-300 bg-red-50/40"
                            : "border-slate-300 hover:border-[#6a5acd] bg-slate-50/50"
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
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {licenseFile ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-emerald-600 mb-1" />
                            <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                              {licenseFile.name}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {(licenseFile.size / 1024 / 1024).toFixed(2)} MB • Ready
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLicenseFile(null);
                              }}
                              className="text-[11px] font-semibold text-red-500 hover:underline mt-2"
                            >
                              Remove & Replace
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-slate-400 mb-1" />
                            <p className="text-xs font-semibold text-slate-700">
                              Upload Trade License
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              PDF, JPG, PNG up to 5 MB
                            </p>
                          </div>
                        )}
                      </div>
                      {fieldErrors.licenseFile && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.licenseFile}</p>
                      )}
                    </div>

                    {/* MOA Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Memorandum of Association (MOA)
                        <span className="text-[11px] font-normal text-slate-400 normal-case ml-1">(Optional for PLC)</span>
                      </label>
                      <div
                        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                          moaFile
                            ? "border-emerald-400 bg-emerald-50/40"
                            : "border-slate-300 hover:border-[#6a5acd] bg-slate-50/50"
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
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {moaFile ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-emerald-600 mb-1" />
                            <p className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">
                              {moaFile.name}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {(moaFile.size / 1024 / 1024).toFixed(2)} MB • Ready
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMoaFile(null);
                              }}
                              className="text-[11px] font-semibold text-red-500 hover:underline mt-2"
                            >
                              Remove & Replace
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-slate-400 mb-1" />
                            <p className="text-xs font-semibold text-slate-700">
                              Upload MOA Document
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              PDF, JPG, PNG up to 5 MB
                            </p>
                          </div>
                        )}
                      </div>
                      {fieldErrors.moaFile && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.moaFile}</p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions Checkbox */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#6a5acd] focus:ring-[#6a5acd]"
                      />
                      <div className="text-xs text-slate-700 leading-relaxed">
                        I hereby declare that I am the authorized legal representative (<strong>{signatoryName || contactName}</strong> - {signatoryRole || "Owner"}) and that all submitted documents and information are accurate. I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsTermsModalOpen(true);
                          }}
                          className="text-[#6a5acd] font-bold hover:underline"
                        >
                          Elilita Merchant Terms & Conditions
                        </button>.
                      </div>
                    </label>
                    {fieldErrors.termsAgreed && (
                      <p className="text-xs text-red-500 mt-1.5 ml-7">{fieldErrors.termsAgreed}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous Step
                  </button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6a5acd] text-white text-xs font-bold hover:bg-[#5a4ac0] active:scale-[0.98] transition-all shadow-md shadow-[#6a5acd]/25"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#6a5acd] to-[#5a4ac0] text-white text-xs font-bold hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-[#6a5acd]/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Submit for Verification
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* STEP 5: SUCCESS CONFIRMATION SCREEN */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-12 text-center max-w-xl mx-auto animate-scaleUp">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-6 tracking-tight">
              Application Submitted Successfully!
            </h2>

            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Thank you for applying to join Elilita as a partner vendor. Your registration details and KYC documents have been securely queued for verification.
            </p>

            {/* Reference Code Card */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Application Reference Code
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-2xl font-black text-[#6a5acd] tracking-wider font-mono">
                  {referenceCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReferenceCode}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#6a5acd] transition-colors shadow-2xs"
                  title="Copy reference code"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                A confirmation email has been sent to <strong>{contactEmail}</strong>.
              </p>
            </div>

            {/* What's Next Steps */}
            <div className="mt-6 text-left p-5 rounded-2xl bg-[#6a5acd]/5 border border-[#6a5acd]/15">
              <h4 className="text-xs font-bold text-[#6a5acd] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Info className="h-4 w-4" />
                What Happens Next?
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                <li>
                  Our team will review your business license within <strong>24 to 48 business hours</strong>.
                </li>
                <li>
                  Once approved, you will receive an invitation email with a secure link to set your account password.
                </li>
                <li>
                  After setting your password, you will have immediate access to your web management dashboard to add products and staff.
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signin"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#6a5acd] text-white text-xs font-bold hover:bg-[#5a4ac0] transition-colors shadow-md shadow-[#6a5acd]/20"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>&copy; {new Date().getFullYear()} Elilita Super App. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Qine Business Group</span>
          </div>
        </div>
      </footer>

      {/* Location Picker Modal */}
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

      {/* Terms & Conditions Modal */}
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
