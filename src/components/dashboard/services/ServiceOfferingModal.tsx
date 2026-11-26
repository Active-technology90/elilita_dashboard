
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Wrench,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  ClipboardList,
  AlertTriangle,
  Tag,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { IntakeFormBuilder } from "./IntakeFormBuilder";
import { ServiceOfferingImageGallery } from "./ServiceOfferingImageGallery";
import { ServiceAddonManager } from "./ServiceAddonManager";
import { CustomSelect } from "../../ui/CustomSelect";
import { TagsInput } from "../../ui/TagsInput";
import type { IntakeFormField, ServiceOffering } from "../../../types";

/* -------------------------------------------------------------------------- */
/*  Utility                                                                   */
/* -------------------------------------------------------------------------- */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

/* -------------------------------------------------------------------------- */
/*  Form State Interface (for explicit typing)                               */
/* -------------------------------------------------------------------------- */
interface ServiceFormState {
  title: string;
  title_am: string;
  description: string;
  description_am: string;
  pricing_type: "fixed" | "starting_at" | "hourly" | "custom";
  price: string;
  currency: string;
  service_type: "one_off" | "recurring";
  billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly";
  duration_minutes: number;
  booking_mode: "direct" | "inquiry" | "contact";
  payment_policy: "upfront" | "deposit" | "post_service";
  deposit_percentage: string;
  service_category: string;
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  order: number;
  intake_form_schema: IntakeFormField[];
}

const defaultForm: ServiceFormState = {
  title: "",
  title_am: "",
  description: "",
  description_am: "",
  pricing_type: "fixed",
  price: "",
  currency: "ETB",
  service_type: "one_off",
  billing_cycle: "monthly",
  duration_minutes: 30,
  booking_mode: "inquiry",
  payment_policy: "upfront",
  deposit_percentage: "0",
  service_category: "",
  tags: [],
  is_active: true,
  is_featured: false,
  order: 0,
  intake_form_schema: [],
};

/* -------------------------------------------------------------------------- */
/*  Reusable Card                                                             */
/* -------------------------------------------------------------------------- */
const Card: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, children, className = "" }) => (
  <div className={` rounded-2xl p-5 ${className}`}>
    <div className="flex items-center gap-2 mb-4">
      <span className="text-secondary">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Unsaved Changes Confirmation Dialog                                       */
/* -------------------------------------------------------------------------- */
function ConfirmDiscardDialog({
  open,
  onKeep,
  onDiscard,
}: {
  open: boolean;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslation("serviceOfferingModal");

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("discardDialog.ariaLabel")}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("discardDialog.title")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t("discardDialog.description")}
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={onKeep}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
                autoFocus
              >
                {t("discardDialog.keepEditing")}
              </button>
              <button
                onClick={onDiscard}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                {t("discardDialog.discard")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */
export function ServiceOfferingModal({
  isOpen,
  offering,
  companySlug,
  initialStep = "details",
  onClose,
  onSave,
  onSaved,
  onShowToast,
}: {
  isOpen: boolean;
  offering: ServiceOffering | null;
  companySlug: string;
  initialStep?: "details" | "addons" | "gallery";
  onClose: () => void;
  onSave: (
    data: Partial<ServiceOffering>,
    existingId?: number,
  ) => Promise<ServiceOffering>;
  onSaved?: () => void;
  onShowToast?: (type: "success" | "error", message: string) => void;
}) {
  const { t } = useTranslation("serviceOfferingModal");

  /* ── State ────────────────────────────────────────────────────────────── */
  const [step, setStep] = useState<"details" | "addons" | "gallery">(
    initialStep || "details"
  );
  const [form, setForm] = useState<ServiceFormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedOfferingId, setSavedOfferingId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const pendingCloseRef = useRef(false);
  const initialValuesRef = useRef<ServiceFormState>(form);

  /* ── Reset on open/close ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const initial: ServiceFormState = offering
      ? {
          title: offering.title,
          title_am: offering.title_am || "",
          description: offering.description || "",
          description_am: offering.description_am || "",
          pricing_type: offering.pricing_type,
          price: offering.price || "",
          currency: offering.currency || "ETB",
          service_type: (offering.service_type as any) || "one_off",
          billing_cycle: (offering.billing_cycle as any) || "monthly",
          duration_minutes: offering.duration_minutes || 30,
          booking_mode: offering.booking_mode,
          payment_policy: offering.payment_policy,
          deposit_percentage: offering.deposit_percentage || "0",
          service_category: offering.service_category || "",
          tags: offering.tags || [],
          is_active: offering.is_active,
          is_featured: offering.is_featured,
          order: offering.order || 0,
          intake_form_schema: offering.intake_form_schema || [],
        }
      : defaultForm;
    setForm(initial);
    initialValuesRef.current = initial;
    setSavedOfferingId(offering?.id ?? null);
    setStep(initialStep || "details");
    setError("");
    setIsDirty(false);
  }, [isOpen, offering, initialStep]);

  /* ── Track dirty state ──────────────────────────────────────────────────── */
  useEffect(() => {
    const currentJson = JSON.stringify(form);
    const initialJson = JSON.stringify(initialValuesRef.current);
    setIsDirty(currentJson !== initialJson);
  }, [form]);

  /* ── Body scroll lock ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  /* ── Close handling (with unsaved changes guard) ────────────────────────── */
  const handleClose = useCallback(() => {
    if (isDirty && step === "details") {
      setShowDiscardDialog(true);
      pendingCloseRef.current = true;
    } else {
      onClose();
    }
  }, [isDirty, step, onClose]);

  const confirmDiscard = () => {
    setShowDiscardDialog(false);
    onClose();
  };

  /* ── Escape key ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDiscardDialog) {
          setShowDiscardDialog(false);
        } else {
          handleClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [isOpen, handleClose, showDiscardDialog]);

  /* ── Form update helper ─────────────────────────────────────────────────── */
  const updateForm = useCallback(
    <K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* ── Validation ─────────────────────────────────────────────────────────── */
  const validateDetails = useCallback((): string[] => {
    const errors: string[] = [];
    if (!form.title.trim()) errors.push(t("validation.titleRequired"));
    if (form.title.length > 200)
      errors.push(t("validation.titleMaxLength"));
    if (form.description.length > 500)
      errors.push(t("validation.descriptionMaxLength"));

    if (form.booking_mode === "direct") {
      if (form.pricing_type === "custom") {
        errors.push(
          "Quote-based pricing is only available for Inquiry / Lead mode. Please switch Booking Mode to Inquiry or choose a fixed/starting/hourly price.",
        );
      } else {
        const priceVal = Number(form.price);
        if (isNaN(priceVal) || priceVal <= 0) {
          errors.push("Direct bookings require a price greater than 0.");
        }
      }
      if (form.duration_minutes < 1) {
        errors.push(t("validation.durationInvalid"));
      }
    } else {
      if (form.payment_policy === "upfront") {
        errors.push(
          "Full Payment Upfront at booking is unavailable for Inquiry mode because the provider must review and set the final price first.",
        );
      }
      if (form.pricing_type !== "custom" && form.price !== "") {
        const priceVal = Number(form.price);
        if (isNaN(priceVal) || priceVal < 0)
          errors.push(t("validation.priceInvalid"));
      }
    }

    if (form.payment_policy === "deposit") {
      const deposit = Number(form.deposit_percentage);
      if (isNaN(deposit) || deposit < 0 || deposit > 100) {
        errors.push(t("validation.depositInvalid"));
      }
    }
    return errors;
  }, [form, t]);

  /* ── Submit details ─────────────────────────────────────────────────────── */
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDetails();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(" "));
      // Focus first invalid field
      const firstInvalid = document.querySelector(
        "[data-invalid]",
      ) as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.pricing_type === "custom" ? null : form.price || "0",
        duration_minutes: Number(form.duration_minutes) || null,
        deposit_percentage: form.deposit_percentage || "0",
        order: Number(form.order) || 0,
        tags: form.tags || [],
      };
      const existingId = savedOfferingId ?? offering?.id;
      const saved = await onSave(payload, existingId ?? undefined);
      setSavedOfferingId(saved.id);
      initialValuesRef.current = { ...form, price: saved.price ?? "" }; // update baseline
      setIsDirty(false);
      setStep("addons");
      onShowToast?.(
        "success",
        existingId ? t("messages.serviceUpdated") : t("messages.serviceCreated"),
      );
    } catch (error) {
      const msg = getErrorMessage(error, t("messages.genericError"));
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Finish (from gallery step) ─────────────────────────────────────────── */
  const handleFinish = () => {
    onSaved?.();
    onClose();
  };

  /* ── Options ────────────────────────────────────────────────────────────── */
  const pricingOptions = [
    { value: "fixed", label: t("options.pricing.fixed") },
    { value: "starting_at", label: t("options.pricing.startingAt") },
    { value: "hourly", label: t("options.pricing.hourly") },
    {
      value: "custom",
      label: t("options.pricing.quoteBased"),
      disabled: form.booking_mode === "direct",
      hint: "Only available when Booking Mode is Inquiry / Lead",
    },
  ];

  const serviceTypeOptions = [
    { value: "one_off", label: t("options.serviceType.oneOff") },
    { value: "recurring", label: t("options.serviceType.recurring") },
  ];

  const billingCycleOptions = [
    { value: "weekly", label: t("options.billingCycle.weekly") },
    { value: "monthly", label: t("options.billingCycle.monthly") },
    { value: "quarterly", label: t("options.billingCycle.quarterly") },
    { value: "yearly", label: t("options.billingCycle.yearly") },
  ];

  const bookingOptions = [
    { value: "direct", label: t("options.booking.direct") },
    { value: "inquiry", label: t("options.booking.inquiry") },
  ];

  const paymentOptions = [
    {
      value: "upfront",
      label: t("options.payment.upfront"),
      disabled: form.booking_mode === "inquiry",
      hint: "Unavailable for Inquiry mode (final price is confirmed after review)",
    },
    { value: "post_service", label: t("options.payment.postService") },
    { value: "deposit", label: t("options.payment.deposit") },
  ];

  const categoryOptions = [
    { value: "Barber & Grooming", label: t("categories.barber") },
    { value: "Hair & Beauty", label: t("categories.beauty") },
    { value: "Education & Tutoring", label: t("categories.education") },
    { value: "Fitness & Wellness", label: t("categories.fitness") },
    { value: "Home Services", label: t("categories.home") },
    { value: "Automotive", label: t("categories.automotive") },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop + dialog */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            offering || savedOfferingId
              ? t("header.editService")
              : t("header.addService")
          }
          className="bg-white m-6 md:w-full max-w-4xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in-up"
        >
          {/* ── Header ── */}
          <div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-gray-100 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-secondary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {offering || savedOfferingId
                      ? t("header.editService")
                      : t("header.addService")}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {offering
                      ? t("header.updateDescription")
                      : t("header.createDescription")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label={t("header.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="mt-6 flex items-center justify-center gap-1 sm:gap-2">
              {/* Step 1: Details */}
              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-semibold transition-all ${
                    step === "details"
                      ? "bg-secondary text-white shadow-xs"
                      : savedOfferingId || offering
                        ? "bg-purple-100 text-secondary"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {savedOfferingId || offering ? <CheckCircle className="h-4 w-4" /> : 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    step === "details" ? "text-secondary font-bold" : "text-gray-500"
                  }`}
                >
                  {t("steps.details")}
                </span>
              </button>

              <div className="flex-1 max-w-[40px] sm:max-w-[70px] h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-secondary transition-all duration-300 ${
                    step === "addons" || step === "gallery" ? "w-full" : "w-0"
                  }`}
                />
              </div>

              {/* Step 2: Add-ons */}
              <button
                type="button"
                disabled={!savedOfferingId && !offering}
                onClick={() => (savedOfferingId || offering) && setStep("addons")}
                className={`flex items-center gap-1.5 focus:outline-none ${
                  !savedOfferingId && !offering ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-semibold transition-all ${
                    step === "addons"
                      ? "bg-secondary text-white shadow-xs"
                      : step === "gallery"
                        ? "bg-purple-100 text-secondary"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {step === "gallery" ? <CheckCircle className="h-4 w-4" /> : 2}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    step === "addons" ? "text-secondary font-bold" : "text-gray-500"
                  }`}
                >
                  {t("steps.addons")}
                </span>
              </button>

              <div className="flex-1 max-w-[40px] sm:max-w-[70px] h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-secondary transition-all duration-300 ${
                    step === "gallery" ? "w-full" : "w-0"
                  }`}
                />
              </div>

              {/* Step 3: Gallery */}
              <button
                type="button"
                disabled={!savedOfferingId && !offering}
                onClick={() => (savedOfferingId || offering) && setStep("gallery")}
                className={`flex items-center gap-1.5 focus:outline-none ${
                  !savedOfferingId && !offering ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-semibold transition-all ${
                    step === "gallery"
                      ? "bg-secondary text-white shadow-xs"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    step === "gallery" ? "text-secondary font-bold" : "text-gray-500"
                  }`}
                >
                  {t("steps.gallery")}
                </span>
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 space-y-6">
            {step === "details" ? (
              <form id="service-form" onSubmit={handleSubmitDetails}>
                {error && (
                  <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200 mb-4">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <Card icon={<FileText size={18} />} title={t("sections.basicInformation")}>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="service-title"
                          className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
                        >
                          {t("fields.title")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="service-title"
                          type="text"
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                          placeholder={t("placeholders.title")}
                          required
                          data-invalid={
                            error && !form.title.trim() ? true : undefined
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.titleAmharic")}
                        </label>
                        <input
                          type="text"
                          value={form.title_am}
                          onChange={(e) =>
                            updateForm("title_am", e.target.value)
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder="ሙሉ ፀጉር መቁረጥ"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.description")}{" "}
                          <span className="text-gray-400 font-normal">
                            ({form.description.length}/500)
                          </span>
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            updateForm("description", e.target.value)
                          }
                          rows={3}
                          maxLength={500}
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary resize-none min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder={t("placeholders.description")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.descriptionAmharic")}{" "}
                          <span className="text-gray-400 font-normal">
                            ({form.description_am.length}/500)
                          </span>
                        </label>
                        <textarea
                          value={form.description_am}
                          onChange={(e) =>
                            updateForm("description_am", e.target.value)
                          }
                          rows={2}
                          maxLength={500}
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary resize-none min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder="የአገልግሎት መግለጫ..."
                        />
                      </div>
                    </div>
                  </Card>

                  {/* 1. Booking & Service Type (Determines available Pricing & Payment options) */}

                  <Card
                    icon={<Calendar size={18} />}
                    title={t("sections.bookingContract")}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.serviceType")}
                        </label>
                        <CustomSelect
                          value={form.service_type}
                          onChange={(val) =>
                            updateForm(
                              "service_type",
                              val as ServiceFormState["service_type"],
                            )
                          }
                          options={serviceTypeOptions}
                          placeholder={t("placeholders.selectServiceType")}
                        />
                      </div>
                      {form.service_type === "recurring" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {t("fields.billingCycle")}
                          </label>
                          <CustomSelect
                            value={form.billing_cycle}
                            onChange={(val) =>
                              updateForm(
                                "billing_cycle",
                                val as ServiceFormState["billing_cycle"],
                              )
                            }
                            options={billingCycleOptions}
                            placeholder={t("placeholders.selectCycle")}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.bookingMode")}
                        </label>
                        <CustomSelect
                          value={form.booking_mode}
                          onChange={(val) =>
                            updateForm(
                              "booking_mode",
                              val as ServiceFormState["booking_mode"],
                            )
                          }
                          options={bookingOptions}
                          placeholder={t("placeholders.select")}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {form.booking_mode === "direct"
                            ? t("hints.directBooking")
                            : t("hints.inquiryBooking")}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* 2. Pricing */}
                  <Card icon={<DollarSign size={18} />} title={t("sections.pricing")}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.pricingType")}
                        </label>
                        <CustomSelect
                          value={form.pricing_type}
                          onChange={(val) =>
                            updateForm(
                              "pricing_type",
                              val as ServiceFormState["pricing_type"],
                            )
                          }
                          options={pricingOptions}
                          placeholder={t("placeholders.select")}
                        />
                        {form.booking_mode === "direct" &&
                          form.pricing_type === "custom" && (
                            <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Quote-based pricing cannot be used with Direct Booking. Switch Booking Mode to Inquiry / Lead or choose a fixed, starting, or hourly price.
                            </p>
                          )}
                        {form.pricing_type === "custom" &&
                          form.booking_mode === "inquiry" && (
                            <p className="mt-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              No upfront price needed. You will set the Final Price per booking after reviewing the customer&apos;s inquiry.
                            </p>
                          )}
                      </div>
                      {form.pricing_type !== "custom" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {form.booking_mode === "inquiry"
                              ? `${t("fields.price")} (ETB — Optional Estimate)`
                              : `${t("fields.price")} (ETB)`}
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              ETB
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.price}
                              onChange={(e) =>
                                updateForm("price", e.target.value)
                              }
                              className="w-full border-2 rounded-xl pl-14 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {form.booking_mode === "inquiry"
                            ? `${t("fields.duration")} (Optional)`
                            : t("fields.duration")}
                        </label>
                        <input
                          type="number"
                          min={form.booking_mode === "direct" ? 1 : 0}
                          value={form.duration_minutes}
                          onChange={(e) =>
                            updateForm(
                              "duration_minutes",
                              Number(e.target.value) || 0,
                            )
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* 3. Payment Policy */}
                  <Card
                    icon={<DollarSign size={18} />}
                    title={t("fields.paymentPolicy")}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.paymentPolicy")}
                        </label>
                        <CustomSelect
                          value={form.payment_policy}
                          onChange={(val) =>
                            updateForm(
                              "payment_policy",
                              val as ServiceFormState["payment_policy"],
                            )
                          }
                          options={paymentOptions}
                          placeholder={t("placeholders.select")}
                        />
                        {form.booking_mode === "inquiry" &&
                          form.payment_policy === "upfront" && (
                            <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Full Payment Upfront at booking is disabled for Inquiry mode because you confirm the final price first. Please choose Pay After Service or Deposit Required.
                            </p>
                          )}
                      </div>
                      {form.payment_policy === "deposit" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            {t("fields.depositPercentage")}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={form.deposit_percentage}
                              onChange={(e) =>
                                updateForm("deposit_percentage", e.target.value)
                              }
                              className="w-full border-2 rounded-xl pl-4 pr-12 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                              placeholder="20"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Category & Settings */}
                  <Card
                    icon={<Settings size={18} />}
                    title={t("sections.categorySettings")}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.serviceCategory")}
                        </label>
                        <input
                          type="text"
                          value={form.service_category}
                          onChange={(e) =>
                            updateForm("service_category", e.target.value)
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder={t("placeholders.serviceCategory")}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {categoryOptions.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              onClick={() => updateForm("service_category", cat.value)}
                              className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                                form.service_category === cat.value
                                  ? "bg-secondary text-white border-secondary"
                                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-purple-50 hover:text-secondary"
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          {t("fields.displayOrder")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.order}
                          onChange={(e) =>
                            updateForm("order", Number(e.target.value) || 0)
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {t("hints.displayOrder")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 pt-1">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) =>
                              updateForm("is_active", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {t("fields.activeService")}
                          </span>
                        </label>
                        {/* <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(e) =>
                              updateForm("is_featured", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {t("fields.featuredService")}
                          </span>
                        </label> */}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Tags & Keywords Card */}
                <div className="mt-6">
                  <Card
                    icon={<Tag size={18} />}
                    title={t("sections.tagsKeywords")}
                    className="col-span-full"
                  >
                    <p className="text-xs text-gray-500 mb-3">
                      {t("hints.tagsDescription")}
                    </p>
                    <TagsInput
                      tags={form.tags}
                      onChange={(newTags) => updateForm("tags", newTags)}
                      placeholder={t("placeholders.tags")}
                      suggestions={[
                        "Haircut",
                        "Fade",
                        "Beard Trim",
                        "Shave",
                        "Kids Cut",
                        "Tutoring",
                        "STEM",
                        "Math",
                        "Physics",
                        "Grade 12",
                        "Gym",
                        "Personal Training",
                        "Cardio",
                        "Fitness",
                        "VIP",
                        "Home Visit",
                        "Exam Prep",
                        "Consultation",
                      ]}
                    />
                  </Card>
                </div>

                {/* Intake Form Builder */}
                <div className="mt-6">
                  <Card
                    icon={<ClipboardList size={18} />}
                    title={t("sections.customIntakeForm")}
                    className="col-span-full"
                  >
                    <IntakeFormBuilder
                      fields={form.intake_form_schema}
                      onChange={(fields) =>
                        updateForm("intake_form_schema", fields)
                      }
                    />
                  </Card>
                </div>
              </form>
            ) : step === "addons" ? (
              <Card
                icon={<Sparkles size={18} />}
                title={t("sections.addonsExtras")}
                className="h-full"
              >
                {savedOfferingId || offering?.id ? (
                  <ServiceAddonManager
                    companySlug={companySlug}
                    offeringId={(savedOfferingId ?? offering?.id)!}
                    offeringTitle={form.title}
                    onShowToast={onShowToast}
                  />
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    {t("messages.saveBeforeAddons")}
                  </div>
                )}
              </Card>
            ) : (
              <Card
                icon={<ImageIcon size={18} />}
                title={t("sections.serviceImages")}
                className="h-full"
              >
                {savedOfferingId || offering?.id ? (
                  <ServiceOfferingImageGallery
                    companySlug={companySlug}
                    offeringId={(savedOfferingId ?? offering?.id)!}
                    onShowToast={onShowToast}
                  />
                ) : (
                  <div className="py-12 text-center text-gray-400">
                    {t("messages.saveBeforeImages")}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
            {step === "details" ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  {t("buttons.cancel")}
                </button>
                <button
                  type="submit"
                  form="service-form"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#5B46A0] disabled:opacity-50 transition shadow-sm"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? t("buttons.saving") : t("buttons.continueToAddons")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : step === "addons" ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("buttons.backToDetails")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("gallery")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#5B46A0] transition shadow-sm"
                >
                  <span>{t("buttons.continueToImages")}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep("addons")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("buttons.backToAddons")}
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#5B46A0] transition shadow-sm"
                >
                  {t("buttons.done")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Discard confirmation */}
      <ConfirmDiscardDialog
        open={showDiscardDialog}
        onKeep={() => setShowDiscardDialog(false)}
        onDiscard={confirmDiscard}
      />
    </>
  );
}
