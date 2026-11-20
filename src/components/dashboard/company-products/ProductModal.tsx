import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Loader2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Star,
  MessageSquare,
  Check,
} from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import { ImageGallery } from "./ImageGallery";
import {
  getCompanyProductDetail,
  getMySubscription,
  getCompanyDetail,
} from "../../../services/api";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import type { ProductImage, MealPeriodCategory } from "../../../types";
import MealCategoryIcon from "../../ui/MealCategoryIcon";

interface ProductFormData {
  sku?: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  currency?: string;
  price?: number | null;
  stock?: number;
  unit: string;
  meal_periods?: string[];
  is_featured?: boolean;
  is_active?: boolean;
  is_price_on_request?: boolean;
  is_made_to_order?: boolean;
  lead_time_days?: number | null;
}

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: {
    id: number;
    sku: string;
    title: string;
    title_am?: string;
    description?: string;
    description_am?: string;
    currency?: string;
    price?: number | null;
    stock: number;
    unit: string;
    meal_periods?: string[];
    is_featured?: boolean;
    is_active?: boolean;
    is_price_on_request?: boolean;
    is_made_to_order?: boolean;
    lead_time_days?: number | null;
    average_rating?: number;
    review_count?: number;
    total_reviews?: number;
  } | null;
  companySlug: string;
  companyMealPeriods?: MealPeriodCategory[];
  onClose: () => void;
  onSave: (data: ProductFormData, existingProductId?: number) => Promise<any>;
  onProductUpdated?: () => void;
  canEditBasic?: boolean;
  canEditPricing?: boolean;
  isStaff?: boolean;
  onShowToast?: (type: "success" | "error", message: string) => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  companySlug,
  companyMealPeriods: initialCompanyMealPeriods,
  onClose,
  onSave,
  onProductUpdated,
  canEditBasic = true,
  canEditPricing = true,
  isStaff = false,
  onShowToast,
}: ProductModalProps) {
  const { t } = useTranslation("product");

  // Zod schema rebuilt via useMemo so validation messages are translated
  const productSchema = useMemo(
    () =>
      z
        .object({
          sku: z.string().optional(),
          title: z.string().min(1, t("productModal.fields.titleRequired")),
          title_am: z.string().optional(),
          description: z.string().optional(),
          description_am: z.string().optional(),
          currency: z.string().optional(),
          price: z.number().min(0).optional().nullable(),
          stock: z.number().int().min(0, t("productModal.fields.stockRequired")).optional(),
          unit: z.string().min(1, t("productModal.fields.unitRequired")),
          meal_periods: z.array(z.string()).optional(),
          is_featured: z.boolean().optional(),
          is_active: z.boolean().optional(),
          is_price_on_request: z.boolean().optional(),
          is_made_to_order: z.boolean().optional(),
          lead_time_days: z.number().int().min(0).optional().nullable(),
        })
        .superRefine((data, ctx) => {
          if (!data.is_price_on_request && (!data.price || data.price <= 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("productModal.fields.priceRequired"),
              path: ["price"],
            });
          }
        }),
    [t],
  );

  const [step, setStep] = useState<"details" | "gallery">("details");
  const [selectedMealPeriods, setSelectedMealPeriods] = useState<string[]>([]);
  const [companyMealPeriods, setCompanyMealPeriods] = useState<
    MealPeriodCategory[]
  >(initialCompanyMealPeriods || []);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const { company: currentCompany } = useCurrentCompany();

  useEffect(() => {
    if (initialCompanyMealPeriods && initialCompanyMealPeriods.length > 0) {
      setCompanyMealPeriods(initialCompanyMealPeriods);
    }
  }, [initialCompanyMealPeriods]);

  useEffect(() => {
    if (isOpen && companySlug) {
      getMySubscription(companySlug)
        .then((res) => setActiveSub(res.data))
        .catch(console.error);
      getCompanyDetail(companySlug)
        .then((res) => {
          if (Array.isArray(res.data?.meal_periods)) {
            setCompanyMealPeriods(res.data.meal_periods);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, companySlug]);

  const availableMealPeriods = useMemo(() => {
    const list: { id: string; label: string; icon: string }[] = [];
    const seen = new Set<string>();

    const addPeriod = (id: string, label: string, icon: string) => {
      const normId = String(id).toLowerCase().trim();
      if (!normId || seen.has(normId)) return;
      seen.add(normId);
      list.push({ id: normId, label, icon });
    };

    if (Array.isArray(companyMealPeriods) && companyMealPeriods.length > 0) {
      for (const c of companyMealPeriods) {
        if (c?.id) {
          addPeriod(
            c.id,
            c.name + (c.name_am ? ` (${c.name_am})` : ""),
            c.icon || "🍽️",
          );
        }
      }
    } else if (
      Array.isArray((currentCompany as any)?.meal_periods) &&
      (currentCompany as any).meal_periods.length > 0
    ) {
      for (const c of (currentCompany as any).meal_periods) {
        if (c?.id) {
          addPeriod(
            c.id,
            c.name + (c.name_am ? ` (${c.name_am})` : ""),
            c.icon || "🍽️",
          );
        }
      }
    } else {
      const defaults = [
        {
          id: "breakfast",
          label: t("productModal.mealAvailability.defaults.breakfast"),
          icon: "coffee",
        },
        {
          id: "lunch",
          label: t("productModal.mealAvailability.defaults.lunch"),
          icon: "sun",
        },
        {
          id: "dinner",
          label: t("productModal.mealAvailability.defaults.dinner"),
          icon: "moon",
        },
      ];
      for (const d of defaults) addPeriod(d.id, d.label, d.icon);
    }

    if (Array.isArray(editingProduct?.meal_periods)) {
      for (const mp of editingProduct.meal_periods) {
        if (mp) addPeriod(mp, String(mp).replace(/-/g, " "), "utensils");
      }
    }

    if (Array.isArray(selectedMealPeriods)) {
      for (const mp of selectedMealPeriods) {
        if (mp) addPeriod(mp, String(mp).replace(/-/g, " "), "utensils");
      }
    }

    return list;
  }, [
    companyMealPeriods,
    currentCompany,
    editingProduct,
    selectedMealPeriods,
    t,
  ]);

  const maxFeatured = activeSub?.allowed_max_featured_products || 0;
  const currentFeatured = activeSub?.current_featured_products || 0;
  const canFeatureMore = maxFeatured === -1 || currentFeatured < maxFeatured;

  const maxProducts = activeSub?.allowed_max_products ?? 15;
  const currentProducts = activeSub?.current_products || 0;
  const canAddMoreActive = maxProducts === -1 || currentProducts < maxProducts;
  const isProductLimitReached = !editingProduct && !canAddMoreActive;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      title: "",
      title_am: "",
      description: "",
      description_am: "",
      currency: "ETB",
      price: 0,
      stock: 0,
      unit: "pcs",
      is_featured: false,
      is_active: true,
      is_price_on_request: false,
      is_made_to_order: false,
      lead_time_days: 0,
    },
  });

  const isPriceOnRequest = watch("is_price_on_request");
  const isMadeToOrder = watch("is_made_to_order");

  useEffect(() => {
    if (editingProduct) {
      let initialMeals: string[] = [];
      const rawMeals =
        editingProduct.meal_periods ??
        (editingProduct as any).attributes?.meal_periods ??
        (editingProduct as any).menu_category;

      if (Array.isArray(rawMeals)) {
        initialMeals = rawMeals
          .filter(Boolean)
          .map((m: any) => String(m).trim().toLowerCase());
      } else if (typeof rawMeals === "string" && rawMeals.trim()) {
        try {
          const parsed = JSON.parse(rawMeals);
          if (Array.isArray(parsed)) {
            initialMeals = parsed
              .filter(Boolean)
              .map((m: any) => String(m).trim().toLowerCase());
          } else {
            initialMeals = [rawMeals.trim().toLowerCase()];
          }
        } catch {
          initialMeals = [rawMeals.trim().toLowerCase()];
        }
      }

      const initialFeatured =
        maxFeatured === 0 ? false : editingProduct.is_featured || false;

      reset({
        sku: editingProduct.sku,
        title: editingProduct.title,
        title_am: editingProduct.title_am || "",
        description: editingProduct.description || "",
        description_am: editingProduct.description_am || "",
        currency: editingProduct.currency || "ETB",
        price: editingProduct.price ?? 0,
        stock: editingProduct.stock,
        unit: editingProduct.unit,
        meal_periods: initialMeals,
        is_featured: initialFeatured,
        is_active:
          editingProduct.is_active !== undefined
            ? editingProduct.is_active
            : true,
        is_price_on_request: editingProduct.is_price_on_request || false,
        is_made_to_order: editingProduct.is_made_to_order || false,
        lead_time_days: editingProduct.lead_time_days || 0,
      });
      setSelectedMealPeriods(initialMeals);
      setSavedProductId(editingProduct.id);
      setStep("details");
    } else {
      if (isOpen) {
        setSavedProductId(null);
        setSelectedMealPeriods([]);

        reset({
          sku: "",
          title: "",
          title_am: "",
          description: "",
          description_am: "",
          currency: "ETB",
          price: 0,
          stock: 0,
          unit: "pcs",
          meal_periods: [],
          is_featured: false,
          is_active: canAddMoreActive,
          is_price_on_request: false,
          is_made_to_order: false,
          lead_time_days: 0,
        });
        setStep("details");
      }
    }
  }, [editingProduct, reset, isOpen, canAddMoreActive, maxFeatured]);

  useEffect(() => {
    if (!isOpen || !editingProduct?.id || !companySlug) return;
    let isCancelled = false;

    getCompanyProductDetail(companySlug, editingProduct.id)
      .then((res) => {
        if (isCancelled || !res?.data) return;
        const detail = res.data;
        const rawMeals =
          detail.meal_periods ??
          detail.attributes?.meal_periods ??
          (detail as any).menu_category;

        let fetchedMeals: string[] = [];
        if (Array.isArray(rawMeals)) {
          fetchedMeals = rawMeals
            .filter(Boolean)
            .map((m: any) => String(m).trim().toLowerCase());
        } else if (typeof rawMeals === "string" && rawMeals.trim()) {
          try {
            const parsed = JSON.parse(rawMeals);
            if (Array.isArray(parsed)) {
              fetchedMeals = parsed
                .filter(Boolean)
                .map((m: any) => String(m).trim().toLowerCase());
            } else {
              fetchedMeals = [rawMeals.trim().toLowerCase()];
            }
          } catch {
            fetchedMeals = [rawMeals.trim().toLowerCase()];
          }
        }

        if (fetchedMeals.length > 0) {
          setSelectedMealPeriods((prev) =>
            prev.length === 0 ? fetchedMeals : prev,
          );
        }

        if (detail.description) {
          setValue("description", detail.description);
        }
        if (detail.description_am) {
          setValue("description_am", detail.description_am);
        }
        if (detail.title_am) {
          setValue("title_am", detail.title_am);
        }
        if (detail.is_price_on_request !== undefined) {
          setValue("is_price_on_request", detail.is_price_on_request);
        }
        if (detail.is_made_to_order !== undefined) {
          setValue("is_made_to_order", detail.is_made_to_order);
        }
        if (detail.lead_time_days !== undefined) {
          setValue("lead_time_days", detail.lead_time_days);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch full product detail in modal:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, editingProduct?.id, companySlug, setValue]);

  useEffect(() => {
    if (step === "gallery" && savedProductId && companySlug && isOpen) {
      setLoadingImages(true);
      getCompanyProductDetail(companySlug, savedProductId)
        .then((res) => setImages(res.data.images || []))
        .catch((err) => console.error("Failed to load images:", err))
        .finally(() => setLoadingImages(false));
    } else {
      setImages([]);
    }
  }, [step, savedProductId, companySlug, isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep("details");
      setSavedProductId(null);
      if (!editingProduct) {
        reset({
          sku: "",
          title: "",
          price: 0,
          stock: 0,
          unit: "pcs",
          is_featured: false,
        });
      }
    }
  }, [isOpen, editingProduct, reset]);

  const handleBackToDetails = () => {
    setStep("details");
  };

  const onSubmitDetails = async (data: ProductFormData) => {
    if (!canEditBasic) return;
    try {
      let productId = savedProductId;

      const autoSKU =
        data.sku && data.sku.trim().length > 0
          ? data.sku.trim()
          : editingProduct?.sku ||
            (() => {
              const cleanTitle =
                (data.title || "PRD")
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .substring(0, 4)
                  .toUpperCase() || "PRD";
              const randomPart = Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();
              const timePart = Date.now().toString(36).slice(-4).toUpperCase();
              return `${cleanTitle}-${timePart}${randomPart}`;
            })();

      const payload = {
        ...data,
        sku: autoSKU,
        is_featured: maxFeatured === 0 ? false : Boolean(data.is_featured),
        meal_periods: selectedMealPeriods,
        is_price_on_request: Boolean(data.is_price_on_request),
        is_made_to_order: Boolean(data.is_made_to_order),
        lead_time_days: data.lead_time_days || 0,
        stock: data.is_made_to_order ? 0 : (data.stock ?? 0),
        price:
          data.is_price_on_request && (!data.price || data.price <= 0)
            ? null
            : data.price,
      };

      if (savedProductId && !editingProduct) {
        await onSave(payload, savedProductId);
        productId = savedProductId;
      } else {
        const saved = await onSave(payload);
        productId = saved?.id || editingProduct?.id;
      }

      if (!productId) throw new Error("No product ID returned");
      setSavedProductId(productId);
      setStep("gallery");
    } catch (err) {
      console.error("Failed to save product details:", err);
    }
  };

  if (!isOpen) return null;

  const stepProgress = step === "details" ? 50 : 100;
  const isReadOnlyBasic = !canEditBasic;
  const isPricingDisabled = !canEditPricing || (isStaff && !!editingProduct);
  const isEditMode = !!editingProduct;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm transition-all duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-3xl w-full max-w-[95%] sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-secondary/20 backdrop-blur-sm border-b border-secondary/20 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent break-words">
                {editingProduct
                  ? t("productModal.title.edit")
                  : t("productModal.title.create")}
                {isReadOnlyBasic && (
                  <span className="ml-2 text-[10px] sm:text-sm font-normal text-amber-600">
                    {t("productModal.title.viewOnly")}
                  </span>
                )}
                {!isReadOnlyBasic && isPricingDisabled && isEditMode && (
                  <span className="ml-2 text-[10px] sm:text-sm font-normal text-blue-600">
                    {t("productModal.title.priceStockReadOnly")}
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {step === "details"
                  ? isReadOnlyBasic
                    ? t("productModal.subtitle.detailsViewOnly")
                    : t("productModal.subtitle.details")
                  : t("productModal.subtitle.gallery")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-secondary hover:bg-secondary/10 transition flex-shrink-0"
              aria-label={t("common.aria.closeModal")}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {!isReadOnlyBasic && (
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div
                    className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium ${
                      step === "details"
                        ? "bg-secondary text-white"
                        : "bg-secondary/10 text-secondary"
                    }`}
                  >
                    {step === "details" ? (
                      "1"
                    ) : (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-sm font-medium ${
                      step === "details" ? "text-secondary" : "text-gray-500"
                    }`}
                  >
                    {t("productModal.steps.details")}
                  </span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-300 ease-out"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div
                    className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium ${
                      step === "gallery"
                        ? "bg-secondary text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step === "gallery" ? (
                      "2"
                    ) : (
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-sm font-medium ${
                      step === "gallery" ? "text-secondary" : "text-gray-400"
                    }`}
                  >
                    {t("productModal.steps.images")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="transition-all duration-300 ease-out">
            {step === "details" ? (
              <form
                id="product-details-form"
                onSubmit={handleSubmit(onSubmitDetails, (formErrors) => {
                  console.warn("Form validation failed:", formErrors);
                })}
                className="space-y-4 sm:space-y-5"
              >
                {isProductLimitReached && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs sm:text-sm text-amber-800 flex items-start gap-2.5 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-900">
                        {t("productModal.quotaWarning.title")}
                      </span>{" "}
                      <Trans
                        i18nKey="productModal.quotaWarning.message"
                        values={{
                          current: currentProducts,
                          max: maxProducts,
                        }}
                        components={{ strong: <strong /> }}
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productModal.fields.title")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("title")}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${
                      errors.title
                        ? "border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    } transition-all outline-none ${isReadOnlyBasic ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    placeholder={t("productModal.fields.titlePlaceholder")}
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Title Amharic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productModal.fields.titleAm")}
                  </label>
                  <input
                    {...register("title_am")}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${
                      errors.title_am
                        ? "border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    } transition-all outline-none ${isReadOnlyBasic ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    placeholder={t("productModal.fields.titleAmPlaceholder")}
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productModal.fields.description")}
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${
                      errors.description
                        ? "border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    } transition-all outline-none ${isReadOnlyBasic ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    placeholder={t(
                      "productModal.fields.descriptionPlaceholder",
                    )}
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                </div>

                {/* Description Amharic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productModal.fields.descriptionAm")}
                  </label>
                  <textarea
                    {...register("description_am")}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${
                      errors.description_am
                        ? "border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    } transition-all outline-none ${isReadOnlyBasic ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    placeholder={t(
                      "productModal.fields.descriptionAmPlaceholder",
                    )}
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productModal.fields.currency")}
                  </label>
                  <select
                    {...register("currency")}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-200 bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${isReadOnlyBasic ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    disabled={isSubmitting || isReadOnlyBasic}
                  >
                    <option value="ETB">
                      {t("productModal.fields.currencyEtb")}
                    </option>
                    <option value="USD">
                      {t("productModal.fields.currencyUsd")}
                    </option>
                    <option value="EUR">
                      {t("productModal.fields.currencyEur")}
                    </option>
                  </select>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("productModal.fields.price")}{" "}
                      {!isPriceOnRequest ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-normal ml-1">
                          (Optional for PoR)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price", { valueAsNumber: true })}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${
                        errors.price
                          ? "border-red-500 focus:ring-red-100"
                          : "border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      } transition-all outline-none ${
                        isPricingDisabled
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={
                        isPriceOnRequest
                          ? "Custom quoted per request"
                          : t("productModal.fields.pricePlaceholder")
                      }
                      disabled={isSubmitting || isPricingDisabled}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("productModal.fields.stock")}{" "}
                      {!isMadeToOrder ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-xs text-purple-600 font-normal ml-1">
                          (Made-to-Order)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      {...register("stock", { valueAsNumber: true })}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${
                        errors.stock
                          ? "border-red-500 focus:ring-red-100"
                          : "border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      } transition-all outline-none ${
                        isPricingDisabled || isMadeToOrder
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={
                        isMadeToOrder
                          ? "0 (No shelf inventory)"
                          : t("productModal.fields.stockPlaceholder")
                      }
                      disabled={isSubmitting || isPricingDisabled || isMadeToOrder}
                    />
                    {errors.stock && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.stock.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price on Request & Made-to-Order Options */}
                <div className="rounded-xl border border-secondary/15 bg-secondary/[0.02] p-3 sm:p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="por-checkbox"
                      type="checkbox"
                      {...register("is_price_on_request")}
                      disabled={isSubmitting || isPricingDisabled}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary/20"
                    />
                    <label htmlFor="por-checkbox" className="text-xs sm:text-sm cursor-pointer select-none">
                      <span className="font-semibold text-gray-800">
                        Price on Request (ዋጋ በጥያቄ)
                      </span>
                      <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">
                        Product does not have a fixed shelf price. Customers submit specification inquiries, and your store issues a proforma quote.
                      </p>
                    </label>
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 flex items-start gap-2.5">
                    <input
                      id="mto-checkbox"
                      type="checkbox"
                      {...register("is_made_to_order")}
                      disabled={isSubmitting || isPricingDisabled}
                      onChange={(e) => {
                        setValue("is_made_to_order", e.target.checked);
                        if (e.target.checked) {
                          setValue("stock", 0);
                        }
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary/20"
                    />
                    <label htmlFor="mto-checkbox" className="text-xs sm:text-sm cursor-pointer select-none">
                      <span className="font-semibold text-gray-800">
                        Made to Order / Custom Manufacturing
                      </span>
                      <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5">
                        Item is manufactured upon order placement. Shelf inventory is bypassed and order cancellations will never add phantom stock.
                      </p>
                    </label>
                  </div>

                  {isMadeToOrder && (
                    <div className="pt-2 border-t border-gray-100 ml-6">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Production Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register("lead_time_days", { valueAsNumber: true })}
                        className="w-36 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                        placeholder="e.g. 5"
                        disabled={isSubmitting || isPricingDisabled}
                      />
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Typical manufacturing time in days to craft and ready the item.
                      </p>
                    </div>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("productModal.fields.unit")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("unit")}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-200 bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${isReadOnlyBasic ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    disabled={isSubmitting || isReadOnlyBasic}
                  >
                    <option value="pcs">
                      {t("productModal.fields.unitPcs")}
                    </option>
                    <option value="kg">
                      {t("productModal.fields.unitKg")}
                    </option>
                    <option value="g">{t("productModal.fields.unitG")}</option>
                    <option value="l">{t("productModal.fields.unitL")}</option>
                    <option value="m">{t("productModal.fields.unitM")}</option>
                  </select>
                </div>

                {/* Meal Periods */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800">
                        {t("productModal.mealAvailability.title")}
                      </label>
                      <p className="text-xs text-gray-500">
                        {t("productModal.mealAvailability.description")}
                      </p>
                    </div>
                    {selectedMealPeriods.length > 0 && !isReadOnlyBasic && (
                      <button
                        type="button"
                        onClick={() => setSelectedMealPeriods([])}
                        className="text-xs text-secondary hover:underline font-semibold shrink-0 ml-3"
                      >
                        {t("productModal.mealAvailability.resetToAllDay")}
                      </button>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {availableMealPeriods.map((period) => {
                      const normId = period.id.toLowerCase().trim();
                      const isSelected = selectedMealPeriods
                        .map((s) => s.toLowerCase().trim())
                        .includes(normId);
                      return (
                        <button
                          key={period.id}
                          type="button"
                          disabled={isSubmitting || isReadOnlyBasic}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMealPeriods(
                                selectedMealPeriods.filter(
                                  (p) => p.toLowerCase().trim() !== normId,
                                ),
                              );
                            } else {
                              setSelectedMealPeriods([
                                ...selectedMealPeriods,
                                normId,
                              ]);
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-secondary text-white border-secondary shadow-xs scale-[1.02]"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-white"
                          } ${isReadOnlyBasic ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <MealCategoryIcon
                            icon={period.icon}
                            className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-gray-500"}`}
                          />
                          <span>{period.label}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 ml-0.5 text-white" />
                          ) : (
                            <span className="w-3.5 h-3.5 ml-0.5 rounded-full border border-gray-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5">
                    {selectedMealPeriods.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t("productModal.mealAvailability.availableAllDay")}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {t("productModal.mealAvailability.availableIn", {
                          count: selectedMealPeriods.length,
                          period:
                            selectedMealPeriods.length === 1
                              ? t(
                                  "productModal.mealAvailability.periodSingular",
                                )
                              : t(
                                  "productModal.mealAvailability.periodPlural",
                                ),
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Active */}
                <div className="flex flex-col pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register("is_active")}
                      disabled={
                        isSubmitting ||
                        isReadOnlyBasic ||
                        (!canAddMoreActive && !editingProduct?.is_active)
                      }
                      className="w-4 h-4 text-secondary bg-gray-100 border-gray-300 rounded focus:ring-secondary focus:ring-2 disabled:opacity-50"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-2 text-sm font-medium text-gray-900 disabled:opacity-50 flex items-center gap-2"
                    >
                      {t("productModal.status.activeLabel")}
                      {!canAddMoreActive && !editingProduct?.is_active && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                          {t("productModal.status.quotaReached", {
                            current: currentProducts,
                            max: maxProducts,
                          })}
                        </span>
                      )}
                    </label>
                  </div>
                  {activeSub && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("productModal.status.activeUsage", {
                        current: currentProducts,
                        max:
                          maxProducts === -1
                            ? t("productModal.status.unlimited")
                            : maxProducts,
                      })}
                    </p>
                  )}
                </div>

                {/* Featured */}
                <div className="flex flex-col pt-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      {...register("is_featured")}
                      disabled={
                        isSubmitting ||
                        isReadOnlyBasic ||
                        maxFeatured === 0 ||
                        (!canFeatureMore && !editingProduct?.is_featured)
                      }
                      className="w-4 h-4 text-secondary bg-gray-100 border-gray-300 rounded focus:ring-secondary focus:ring-2 disabled:opacity-50"
                    />
                    <label
                      htmlFor="is_featured"
                      className="ml-2 text-sm font-medium text-gray-900 disabled:opacity-50 flex items-center gap-2"
                    >
                      {t("productModal.status.featuredLabel")}
                      {maxFeatured === 0 ? (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          {t("productModal.status.featuredNotAvailable")}
                        </span>
                      ) : (
                        !canFeatureMore &&
                        !editingProduct?.is_featured && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                            {t("productModal.status.featuredLimitReached", {
                              current: currentFeatured,
                              max: maxFeatured,
                            })}
                          </span>
                        )
                      )}
                    </label>
                  </div>
                  {activeSub && maxFeatured !== 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("productModal.status.featuredUsage", {
                        current: currentFeatured,
                        max:
                          maxFeatured === -1
                            ? t("productModal.status.unlimited")
                            : maxFeatured,
                      })}
                    </p>
                  )}
                </div>

                {/* Statistics (view-only) */}
                {editingProduct && (
                  <div className="mt-6 pt-6 border-t border-gray-200/80">
                    <div className="flex items-start gap-2 mb-4">
                      <div className="h-6 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-secondary uppercase tracking-[0.15em]">
                            {t("productModal.statistics.title")}
                          </p>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 truncate max-w-[140px] sm:max-w-[220px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 flex-shrink-0" />
                            {editingProduct?.title || "Product"}
                          </span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-gray-200/60 via-gray-200/30 to-transparent mt-2" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Average Rating Card */}
                      <div className="group relative bg-gradient-to-br from-white to-yellow-50/20 rounded-2xl p-5 shadow-sm border border-gray-100/80 hover:shadow-lg hover:shadow-yellow-100/50 hover:border-yellow-400/40 transition-all duration-500 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-200/10 rounded-full blur-2xl group-hover:bg-yellow-200/20 transition-all duration-700 pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-300/5 rounded-full blur-2xl group-hover:bg-yellow-300/15 transition-all duration-700 pointer-events-none" />

                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider flex items-center gap-1.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {t("productModal.statistics.averageRating")}
                            </p>
                            <div className="mt-1.5 flex items-center gap-0.5">
                              {editingProduct.average_rating ? (
                                <>
                                  {[...Array(5)].map((_, i) => {
                                    const rating = Number(
                                      editingProduct.average_rating,
                                    );
                                    const starValue = i + 1;
                                    let fillPercentage = 0;
                                    if (rating >= starValue) {
                                      fillPercentage = 100;
                                    } else if (rating > i) {
                                      fillPercentage = (rating - i) * 100;
                                    }
                                    return (
                                      <div
                                        key={i}
                                        className="relative inline-block h-5 w-5 flex-shrink-0 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                                        style={{
                                          animationDelay: `${i * 50}ms`,
                                        }}
                                      >
                                        <Star className="absolute inset-0 h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-400" />
                                        <div
                                          className="absolute inset-0 overflow-hidden transition-all duration-500 ease-out"
                                          style={{
                                            width: `${fillPercentage}%`,
                                          }}
                                        >
                                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 transition-transform duration-300 group-hover:scale-105" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <span className="text-2xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent ml-1.5 transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.2)] inline-block">
                                    {Number(
                                      editingProduct.average_rating,
                                    ).toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-2xl font-bold text-gray-400">
                                  {t(
                                    "productModal.statistics.notAvailable",
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-yellow-200/40 relative">
                            <div className="absolute inset-0 rounded-xl bg-yellow-400/0 group-hover:bg-yellow-400/10 transition-all duration-300" />
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-400 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                          </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400/0 via-yellow-400/40 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-x-0 group-hover:scale-x-100 origin-left" />
                      </div>

                      {/* Total Reviews Card */}
                      <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-indigo-300/30 transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">
                              {t("productModal.statistics.totalReviews")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {editingProduct.total_reviews ?? 0}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-indigo-500" />
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-5">
                {loadingImages ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-secondary" />
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                      {t("productModal.gallery.loading")}
                    </p>
                  </div>
                ) : (
                  <ImageGallery
                    images={images}
                    productId={savedProductId!}
                    companySlug={companySlug}
                    onImagesChange={async () => {
                      if (savedProductId && companySlug) {
                        try {
                          const res = await getCompanyProductDetail(
                            companySlug,
                            savedProductId,
                          );
                          setImages(res.data.images || []);
                          if (onProductUpdated) onProductUpdated();
                        } catch (err) {
                          console.error("Failed to refresh images:", err);
                        }
                      }
                    }}
                    readOnly={isReadOnlyBasic}
                    onError={(message) => {
                      if (onShowToast) {
                        onShowToast("error", message);
                      }
                      console.error("Image error:", message);
                    }}
                    onShowToast={onShowToast}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-5">
          {step === "details" ? (
            isReadOnlyBasic ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  {t("common.actions.close")}
                </button>
              </div>
            ) : (
              <div className="flex flex-row justify-end gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  {t("common.actions.cancel")}
                </button>
                <button
                  type="submit"
                  form="product-details-form"
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-secondary text-white font-medium hover:bg-[#5a448c] transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSubmitting && (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  )}
                  {t("productModal.buttons.continueToImages")}{" "}
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-row justify-between gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isReadOnlyBasic}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{" "}
                {t("productModal.buttons.backToDetails")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-secondary text-white font-medium hover:bg-secondary-dark transition shadow-sm text-sm sm:text-base"
              >
                {t("productModal.buttons.done")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}