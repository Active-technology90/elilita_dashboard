import { useEffect, useState, useCallback, useRef } from "react";
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
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong";
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

// ----- Dropdown options -----
const serviceTypeOptions = [
  { value: "one_off", label: "One-Off Service (e.g. Haircut, Auto, Beauty)" },
  {
    value: "recurring",
    label: "Recurring Subscription (e.g. Tutoring, Cleaning)",
  },
];

const billingCycleOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

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
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Discard changes?"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Discard changes?
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              You have unsaved changes that will be lost.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={onKeep}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
                autoFocus
              >
                Keep editing
              </button>
              <button
                onClick={onDiscard}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Discard
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
    if (!form.title.trim()) errors.push("Title is required.");
    if (form.title.length > 200)
      errors.push("Title must be under 200 characters.");
    if (form.description.length > 500)
      errors.push("Description must be under 500 characters.");
    if (form.pricing_type !== "custom") {
      const priceVal = Number(form.price);
      if (isNaN(priceVal) || priceVal < 0)
        errors.push("Price must be a valid non‑negative number.");
    }
    if (form.duration_minutes < 1)
      errors.push("Duration must be at least 1 minute.");
    if (form.payment_policy === "deposit") {
      const deposit = Number(form.deposit_percentage);
      if (isNaN(deposit) || deposit < 0 || deposit > 100) {
        errors.push("Deposit percentage must be between 0 and 100.");
      }
    }
    return errors;
  }, [form]);

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
        existingId ? "Service updated" : "Service created",
      );
    } catch (error) {
      const msg = getErrorMessage(error);
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
    { value: "fixed", label: "Fixed" },
    { value: "starting_at", label: "Starting At" },
    { value: "hourly", label: "Hourly" },
    { value: "custom", label: "Quote Based" },
  ];
  const bookingOptions = [
    { value: "direct", label: "Direct Booking" },
    { value: "inquiry", label: "Inquiry / Lead" },
  ];
  const paymentOptions = [
    { value: "upfront", label: "Pay Upfront" },
    { value: "post_service", label: "Pay After Service" },
    { value: "deposit", label: "Deposit Required" },
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
          aria-label={offering ? "Edit service" : "Add service"}
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
                      ? "Edit Service"
                      : "Add Service"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {offering
                      ? "Update your service offering"
                      : "Create a new service offering"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Close service editor"
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
                  Details & Tags
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
                  Add-ons
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
                  Gallery
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
                  <Card icon={<FileText size={18} />} title="Basic Information">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="service-title"
                          className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
                        >
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="service-title"
                          type="text"
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                          placeholder="e.g. Premium Haircut"
                          required
                          data-invalid={
                            error && !form.title.trim() ? true : undefined
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Title (Amharic)
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
                          Description{" "}
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
                          placeholder="Describe the service..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Description (Amharic){" "}
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

                  {/* Pricing */}
                  <Card icon={<DollarSign size={18} />} title="Pricing">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Pricing Type
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
                          placeholder="Select..."
                        />
                      </div>
                      {form.pricing_type !== "custom" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Price (ETB)
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
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min={1}
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

                  {/* Booking & Contract */}
                  <Card
                    icon={<Calendar size={18} />}
                    title="Booking & Contract Type"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Service Type
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
                          placeholder="Select service type..."
                        />
                      </div>
                      {form.service_type === "recurring" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Billing Cycle
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
                            placeholder="Select cycle..."
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Booking Mode
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
                          placeholder="Select..."
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {form.booking_mode === "direct"
                            ? "Customers choose a time and book instantly."
                            : "Customers submit a request; provider confirms availability."}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Payment Policy
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
                          placeholder="Select..."
                        />
                      </div>
                      {form.payment_policy === "deposit" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            Deposit Percentage
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
                    title="Category & Settings"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Service Category
                        </label>
                        <input
                          type="text"
                          value={form.service_category}
                          onChange={(e) =>
                            updateForm("service_category", e.target.value)
                          }
                          className="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary min-h-[44px] border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                          placeholder="e.g. Barber & Grooming, Education, Fitness..."
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[
                            "Barber & Grooming",
                            "Hair & Beauty",
                            "Education & Tutoring",
                            "Fitness & Wellness",
                            "Home Services",
                            "Automotive",
                          ].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => updateForm("service_category", cat)}
                              className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                                form.service_category === cat
                                  ? "bg-secondary text-white border-secondary"
                                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-purple-50 hover:text-secondary"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Display Order
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
                          Lower numbers appear first.
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
                            Active Service
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(e) =>
                              updateForm("is_featured", e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Featured Service
                          </span>
                        </label>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Tags & Keywords Card */}
                <div className="mt-6">
                  <Card
                    icon={<Tag size={18} />}
                    title="Service Tags & Search Keywords"
                    className="col-span-full"
                  >
                    <p className="text-xs text-gray-500 mb-3">
                      Tags help customers quickly discover your service via search and filtering (e.g. Haircut, Fade, Shaving, STEM, Gym, etc.).
                    </p>
                    <TagsInput
                      tags={form.tags}
                      onChange={(newTags) => updateForm("tags", newTags)}
                      placeholder="Type tag and press Enter or comma (e.g. Haircut)..."
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
                    title="Custom Intake Form"
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
                title="Service Add-ons & Extras"
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
                    Service must be saved first to manage add-ons.
                  </div>
                )}
              </Card>
            ) : (
              <Card
                icon={<ImageIcon size={18} />}
                title="Service Images"
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
                    Service must be saved first to manage images.
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
                  Cancel
                </button>
                <button
                  type="submit"
                  form="service-form"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#5B46A0] disabled:opacity-50 transition shadow-sm"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : "Continue to Add-ons"}
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
                  Back to Details
                </button>
                <button
                  type="button"
                  onClick={() => setStep("gallery")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#5B46A0] transition shadow-sm"
                >
                  <span>Continue to Images</span>
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
                  Back to Add-ons
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#5B46A0] transition shadow-sm"
                >
                  Done
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
