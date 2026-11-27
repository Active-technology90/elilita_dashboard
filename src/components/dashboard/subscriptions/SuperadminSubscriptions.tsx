import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Edit,
  CreditCard,
  Building2,
  Download,
  AlertCircle,
  X,
  Check,
  Sparkles,
  Gift,
  Filter,
  Users,
  Pencil,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAdminSubscriptionPlans,
  getAdminCompanySubscriptions,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
  updateAdminCompanySubscription,
} from "../../../services/api";
import { SearchInput } from "../../ui/SearchInput";
import { TableControls } from "../../ui/TableControls";
import { Pagination } from "../../ui/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useSorting } from "../../../hooks/useSorting";
import PageHeader from "../../ui/PageHeader";
// ─── Shared date helpers (timezone-safe, Amharic + English) ────
// Adjust the import path if your project stores this file elsewhere.
import { formatShortDate } from "../../../utils/dateFormatter";

// ========== LOADING SKELETON ==========
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-5 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-24" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-16" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-12" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-12" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-10" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-10" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-8" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-secondary/[0.08] rounded-full w-16" /></td>
    <td className="px-5 py-3.5"><div className="h-5 w-5 bg-secondary/[0.08] rounded ml-auto" /></td>
  </tr>
);

const SkeletonSubscriptionRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-24" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-secondary/[0.08] rounded w-14" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-16" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-12" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-16" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-10" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-secondary/[0.08] rounded-full w-14" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-secondary/[0.08] rounded-full w-12" /></td>
    <td className="px-4 py-3.5"><div className="h-6 bg-secondary/[0.08] rounded w-20 ml-auto" /></td>
  </tr>
);

// ========== PLAN THEME ==========
const getPlanColor = (_planName: string): string =>
  "bg-secondary/[0.06] text-secondary border-secondary/15";

type DocumentTier = "free" | "basic" | "advanced" | "premium";

type DocumentPlanBaseline = {
  tier: DocumentTier;
  name: string;
  monthlyPrice: number;
  positioning: string;
  productListing: string;
  expectedProductLimit: number | null;
  featuredProducts: string;
  advertising: string;
  staff: string;
};

// Approved Vendor Subscription Plan V1.0 reference.
const DOCUMENT_PLAN_BASELINES: DocumentPlanBaseline[] = [
  {
    tier: "free",
    name: "Free",
    monthlyPrice: 0,
    positioning: "Start Selling",
    productListing: "Limited (no numeric cap specified)",
    expectedProductLimit: null,
    featuredProducts: "Not included",
    advertising: "Not included",
    staff: "1 staff account",
  },
  {
    tier: "basic",
    name: "Basic",
    monthlyPrice: 499,
    positioning: "Grow Your Store",
    productListing: "Up to 100 products",
    expectedProductLimit: 100,
    featuredProducts: "Not included",
    advertising: "Paid advertising opportunities",
    staff: "2 staff accounts",
  },
  {
    tier: "advanced",
    name: "Advanced",
    monthlyPrice: 1000,
    positioning: "Scale Your Business",
    productListing: "Up to 500 products",
    expectedProductLimit: 500,
    featuredProducts: "Included",
    advertising: "Included",
    staff: "5 authorized staff accounts",
  },
  {
    tier: "premium",
    name: "Premium",
    monthlyPrice: 2000,
    positioning: "Maximize Your Business",
    productListing: "Unlimited",
    expectedProductLimit: -1,
    featuredProducts: "Priority",
    advertising: "Priority",
    staff: "Multiple authorised staff accounts",
  },
];

const resolveDocumentTier = (plan: any): DocumentTier | null => {
  const name = String(plan?.name || "").trim().toLowerCase();

  if (name.includes("premium") || name.includes("enterprise")) return "premium";

  if (
    name.includes("advanced") ||
    name.includes("professional") ||
    name === "pro" ||
    name.includes("standard")
  ) {
    return "advanced";
  }

  if (name.includes("basic")) return "basic";
  if (name.includes("free") || name.includes("starter")) return "free";

  return null;
};

const formatEtb = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const getDocumentBaseline = (plan: any): DocumentPlanBaseline | null => {
  const tier = resolveDocumentTier(plan);

  return (
    DOCUMENT_PLAN_BASELINES.find((item) => item.tier === tier) || null
  );
};

/**
 * Reads the explicitly stored product limit from the plan row.
 */
const getConfiguredProductLimit = (plan: any): number | null => {
  const raw = plan?.max_products;

  if (raw === null || raw === undefined || raw === "") return null;

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
};

/**
 * Priority:
 * 1. Explicitly stored max_products.
 * 2. V1.0 baseline for legacy rows.
 */
const getProductLimitForPlan = (plan: any): number | null => {
  const configured = getConfiguredProductLimit(plan);

  if (configured !== null) return configured;

  const baseline = getDocumentBaseline(plan);

  if (
    baseline?.expectedProductLimit !== null &&
    baseline?.expectedProductLimit !== undefined
  ) {
    return baseline.expectedProductLimit;
  }

  return null;
};

const formatProductLimit = (plan: any, t: any): string => {
  const baseline = getDocumentBaseline(plan);
  const limit = getProductLimitForPlan(plan);

  if (limit === -1) {
    return t("subscriptions.standards.unlimited");
  }

  if (baseline?.tier === "free" && (limit === null || limit === 0)) {
    return t("subscriptions.standards.limited");
  }

  if (limit === null) return "—";

  return formatEtb(limit);
};

// ========== TRANSLATED BASELINE VALUES ==========
const getTranslatedBaseline = (
  item: DocumentPlanBaseline,
  t: any,
) => {
  const tier = item.tier;

  const featuredKey =
    tier === "free" || tier === "basic"
      ? "notIncluded"
      : tier === "advanced"
        ? "included"
        : "priority";

  return {
    positioning: t(`subscriptions.standards.${tier}Positioning`),
    productListing: t(`subscriptions.standards.${tier}Listing`),
    staff: t(`subscriptions.standards.${tier}Staff`),
    featuredProducts: t(`subscriptions.standards.${featuredKey}`),
  };
};

// ========== DOCUMENT VALIDATION ==========
const getDocumentIssues = (
  plan: any,
  baseline: DocumentPlanBaseline,
  t: any,
): string[] => {
  const issues: string[] = [];

  const price = Number(plan?.price ?? 0);
  const featuredLimit = Number(plan?.max_featured_products ?? 0);

  const storedProductLimit = getConfiguredProductLimit(plan);

  if (price !== baseline.monthlyPrice) {
    const expectedPrice =
      baseline.monthlyPrice === 0
        ? "ETB 0"
        : `ETB ${formatEtb(baseline.monthlyPrice)}`;

    issues.push(
      t("subscriptions.standards.priceShouldBe", {
        price: expectedPrice,
      }),
    );
  }

  if (baseline.expectedProductLimit === null) {
    if (
      storedProductLimit !== null &&
      storedProductLimit <= 0 &&
      storedProductLimit !== -1
    ) {
      issues.push(
        t("subscriptions.standards.freePositiveLimit"),
      );
    }
  } else if (storedProductLimit !== baseline.expectedProductLimit) {
    issues.push(
      baseline.expectedProductLimit === -1
        ? t("subscriptions.standards.premiumUnlimited")
        : t("subscriptions.standards.productLimitShouldBe", {
            plan: baseline.name,
            limit: baseline.expectedProductLimit,
          }),
    );
  }

  if (baseline.tier === "free" && featuredLimit !== 0) {
    issues.push(t("subscriptions.standards.freeNoFeatured"));
  }

  if (baseline.tier === "basic" && featuredLimit !== 0) {
    issues.push(t("subscriptions.standards.basicNoFeatured"));
  }

  if (baseline.tier === "advanced" && featuredLimit <= 0) {
    issues.push(t("subscriptions.standards.advancedFeatured"));
  }

  if (baseline.tier === "premium" && featuredLimit <= 0) {
    issues.push(t("subscriptions.standards.premiumFeatured"));
  }

  return issues;
};

export default function SuperadminSubscriptions() {
  // ─── i18n: expose the active language so dates render in the
  // correct calendar (Gregorian for en, Ethiopic for am). ──────
  const { t, i18n } = useTranslation("serviceSubscriptions");

  const language = i18n?.language ?? "en";

  const [plans, setPlans] = useState<any[]>([]);
  const [companySubscriptions, setCompanySubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [saveError, setSaveError] = useState("");

  // ========== FILTER, SORT, PAGINATION STATE ==========
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const hasActiveFilters = useMemo(
    () => inputValue.trim() !== "" || planFilter !== "all",
    [inputValue, planFilter],
  );

  const activePlanLabel = useMemo(() => {
    if (planFilter === "all") {
      return t("subscriptions.companySubscriptions.allPlans");
    }

    const found = plans.find((p) => String(p.id) === planFilter);

    return found?.name || t("subscriptions.companySubscriptions.allPlans");
  }, [planFilter, plans, t]);

  const clearAllFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setPlanFilter("all");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  const documentAlignment = useMemo(() => {
    return DOCUMENT_PLAN_BASELINES.map((baseline) => {
      const plan = plans.find(
        (candidate) =>
          resolveDocumentTier(candidate) === baseline.tier,
      );

      if (!plan) {
        return {
          ...baseline,
          plan: null,
          issues: [] as string[],
          status: "missing" as const,
        };
      }

      const issues = getDocumentIssues(plan, baseline, t);

      return {
        ...baseline,
        plan,
        issues,
        status:
          issues.length === 0
            ? ("match" as const)
            : ("review" as const),
      };
    });
  }, [plans, t]);

  const documentMatchCount = documentAlignment.filter(
    (item) => item.status === "match",
  ).length;

  // ========== PLAN MODAL STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [subscriptionMode, setSubscriptionMode] = useState<"product" | "service">("product");

  const [formData, setFormData] = useState({
    name: "",
    plan_type: "product" as "product" | "service",
    description: "",
    price: 0,
    six_month_price: "" as string | number,
    annual_price: "" as string | number,
    duration_days: 30,
    max_featured_products: 0,
    max_products: 0,
    max_services: 15,
    max_staff_members: 5,
    is_active: true,
  });

  // ========== COMPANY DEAL MODAL STATE ==========
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const [dealFormData, setDealFormData] = useState({
    plan_id: "",
    additional_free_days: 0,
    set_company_active: true,
  });

  const [isSavingDeal, setIsSavingDeal] = useState(false);
  const [dealError, setDealError] = useState("");

  const handleOpenDealModal = (sub: any) => {
    setSelectedSub(sub);

    setDealFormData({
      plan_id: sub.plan?.id ? String(sub.plan.id) : "",
      additional_free_days: Number(sub.additional_free_days || 0),
      set_company_active:
        sub.company_is_active !== undefined
          ? Boolean(sub.company_is_active)
          : true,
    });

    setDealError("");
    setDealModalOpen(true);
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSub) return;

    setIsSavingDeal(true);
    setDealError("");

    try {
      await updateAdminCompanySubscription(selectedSub.id, {
        plan_id: dealFormData.plan_id
          ? Number(dealFormData.plan_id)
          : undefined,
        additional_free_days:
          Number(dealFormData.additional_free_days) || 0,
        set_company_active: dealFormData.set_company_active,
      });

      setDealModalOpen(false);

      await fetchData();
    } catch (err: any) {
      console.error("Error updating company subscription deal", err);

      setDealError(
        err?.response?.data?.detail ||
          t("subscriptions.errors.updateDealFailed"),
      );
    } finally {
      setIsSavingDeal(false);
    }
  };

  const selectedDocumentBaseline = useMemo(
    () =>
      subscriptionMode === "product"
        ? getDocumentBaseline({
            name: formData.name,
            price: formData.price,
          })
        : null,
    [subscriptionMode, formData.name, formData.price],
  );

  // ========== FETCH DATA ==========
  const fetchData = async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const [plansRes, subsRes] = await Promise.all([
        getAdminSubscriptionPlans(),
        getAdminCompanySubscriptions(),
      ]);

      setPlans(plansRes.data?.results || plansRes.data || []);
      setCompanySubscriptions(subsRes.data?.results || subsRes.data || []);
    } catch (error) {
      console.error("Error fetching admin subscription data", error);

      setPageError(t("subscriptions.errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // ========== FILTER PLANS & SUBSCRIPTIONS BY MODE ==========
  const modeScopedPlans = useMemo(() => {
    return plans.filter(
      (plan) => (plan.plan_type || "product") === subscriptionMode,
    );
  }, [plans, subscriptionMode]);

  useEffect(() => {
    setPlanFilter("all");
  }, [subscriptionMode]);

  const modeScopedSubscriptions = useMemo(() => {
    return companySubscriptions.filter((sub) =>
      subscriptionMode === "service"
        ? sub.company_business_type === "service"
        : sub.company_business_type !== "service",
    );
  }, [companySubscriptions, subscriptionMode]);

  const filteredSubscriptions = useMemo(() => {
    let data = [...modeScopedSubscriptions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      data = data.filter((sub) =>
        sub.company_name?.toLowerCase().includes(term),
      );
    }

    if (planFilter !== "all") {
      data = data.filter(
        (sub) => String(sub.plan?.id) === planFilter,
      );
    }

    return data;
  }, [modeScopedSubscriptions, searchTerm, planFilter]);

  // ========== SORTING ==========
  const { sortedItems } = useSorting(
    filteredSubscriptions,
    "company_name",
    "asc",
  );

  // ========== PAGINATION ==========
  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
  } = usePagination(sortedItems, pageSize);

  useEffect(() => {
    resetPage();
  }, [searchTerm, pageSize, planFilter, subscriptionMode, resetPage]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ========== EDIT PLAN ==========
  const handleEditClick = (plan: any) => {
    setSaveError("");
    setEditingPlan(plan);

    const stored = getConfiguredProductLimit(plan);

    setFormData({
      name: plan.name,
      plan_type: (plan.plan_type || "product") as "product" | "service",
      description: plan.description || "",
      price: parseFloat(plan.price) || 0,
      six_month_price: plan.six_month_price ?? "",
      annual_price: plan.annual_price ?? "",
      duration_days: plan.duration_days ?? 30,
      max_featured_products: Number(plan.max_featured_products ?? 0),
      max_products:
        stored !== null
          ? stored
          : (getDocumentBaseline(plan)?.expectedProductLimit ?? 0),
      max_services: Number(plan.max_services ?? 15),
      max_staff_members: Number(plan.max_staff_members ?? 5),
      is_active: Boolean(plan.is_active),
    });

    setIsModalOpen(true);
  };

  // ========== CREATE PLAN ==========
  const handleCreateClick = () => {
    setSaveError("");
    setEditingPlan(null);

    setFormData({
      name: "",
      plan_type: subscriptionMode,
      description: "",
      price: 0,
      six_month_price: "",
      annual_price: "",
      duration_days: 30,
      max_featured_products: 0,
      max_products: 0,
      max_services: 15,
      max_staff_members: 5,
      is_active: true,
    });

    setIsModalOpen(true);
  };

  // ========== SAVE PLAN ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    setSaveError("");

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        six_month_price:
          formData.six_month_price === "" || formData.six_month_price === null
            ? null
            : Number(formData.six_month_price),
        annual_price:
          formData.annual_price === "" || formData.annual_price === null
            ? null
            : Number(formData.annual_price),
        duration_days: Number(formData.duration_days),
        max_products: Number(formData.max_products),
        max_services: Number(formData.max_services),
        max_featured_products: Number(formData.max_featured_products),
        max_staff_members: Number(formData.max_staff_members),
      };

      if (editingPlan) {
        await updateAdminSubscriptionPlan(editingPlan.id, payload);
      } else {
        await createAdminSubscriptionPlan(payload);
      }

      setIsModalOpen(false);

      await fetchData();
    } catch (error) {
      console.error("Error saving plan", error);

      setSaveError(t("subscriptions.errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  // ========== EXPORT PLANS ==========
  const exportPlans = () => {
    const headers = [
      t("subscriptions.plans.plan"),
      t("subscriptions.plans.price"),
      t("subscriptions.plans.products"),
      t("subscriptions.plans.featured"),
      t("subscriptions.plans.status"),
      t("subscriptions.plans.subscribers"),
    ];

    const rows = plans.map((plan) => [
      plan.name,
      plan.price,
      formatProductLimit(plan, t),
      plan.max_featured_products === -1
        ? t("subscriptions.plans.unlimited")
        : plan.max_featured_products,
      plan.is_active
        ? t("subscriptions.plans.active")
        : t("subscriptions.plans.inactive"),
      companySubscriptions.filter(
        (sub) => sub.plan?.id === plan.id,
      ).length,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    // Use the shared formatter (forced to English + filesystem-safe)
    // so the filename is timezone-consistent without exotic chars.
    const stamp = formatShortDate(new Date(), "en").replace(
      /[^a-zA-Z0-9-]+/g,
      "_",
    );

    anchor.download = `subscription_plans_${stamp}.csv`;

    anchor.click();

    URL.revokeObjectURL(url);
  };

  const activePlans = plans.filter(
    (plan) => plan.is_active,
  ).length;

  const activeSubscriptions = modeScopedSubscriptions.filter(
    (subscription) =>
      subscription.is_active && !subscription.is_expired,
  ).length;

  const productCompanyCount = companySubscriptions.filter(
    (sub) => sub.company_business_type !== "service",
  ).length;

  const serviceCompanyCount = companySubscriptions.filter(
    (sub) => sub.company_business_type === "service",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
        <PageHeader
          title={t("subscriptions.title")}
          description={t("subscriptions.description")}
          icon={CreditCard}
          badge={
            !isLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {t("subscriptions.active", {
                  count: activeSubscriptions,
                })}
              </span>
            ) : undefined
          }
          actions={
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={exportPlans}
                disabled={isLoading || plans.length === 0}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:text-sm"
              >
                <Download className="h-4 w-4" />
                {t("subscriptions.export")}
              </button>

              {/* <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md sm:flex-none sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                {subscriptionMode === "service"
                  ? "Add Service Plan"
                  : "Add Product Plan"}
              </button> */}
            </div>
          }
          actionMobile={
            <div className="flex w-full flex-row gap-1 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-xl bg-secondary px-1.5 text-[9px] font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md active:scale-[0.98] sm:order-2 sm:w-auto sm:min-h-10 sm:text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {subscriptionMode === "service"
                    ? "Add Service Plan"
                    : "Add Product Plan"}
                </span>
              </button>

              <button
                type="button"
                onClick={exportPlans}
                disabled={isLoading || plans.length === 0}
                aria-label={t("subscriptions.exportPlans")}
                className="inline-flex h-7 w-full items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-1.5 text-[9px] font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] sm:order-1 sm:w-auto sm:min-h-10 sm:px-3 sm:text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {t("subscriptions.export")}
                </span>
              </button>
            </div>
          }
          className="mb-0"
        />

        {/* ========== SUBSCRIPTION MODE SWITCHER (PRODUCT vs SERVICE) ========== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-2 shadow-sm">
          <div className="inline-flex w-full rounded-xl bg-gray-100/80 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setSubscriptionMode("product")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                subscriptionMode === "product"
                  ? "bg-secondary text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Product Subscriptions</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  subscriptionMode === "product"
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {productCompanyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubscriptionMode("service")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                subscriptionMode === "service"
                  ? "bg-secondary text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Service Subscriptions</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  subscriptionMode === "service"
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {serviceCompanyCount}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-secondary/20 bg-secondary/[0.06] px-3.5 py-2 text-xs font-semibold text-secondary transition hover:bg-secondary/10 sm:w-auto sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            {subscriptionMode === "service"
              ? "Add Service Plan"
              : "Add Product Plan"}
          </button>
        </div>

        {/* ========== PAGE ERROR ========== */}
        {pageError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              {pageError}
            </span>

            <button
              type="button"
              onClick={() => void fetchData()}
              className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100"
            >
              {t("subscriptions.retry")}
            </button>
          </motion.div>
        )}

        {/* ========== STATS CARDS ========== */}
        <section className="hidden grid sm:gap-4 sm:grid-cols-3">
          {[
            {
              label: t("subscriptions.stats.activePlans"),
              value: isLoading ? "—" : activePlans,
              icon: CreditCard,
            },
            {
              label: t("subscriptions.stats.activeSubs"),
              value: isLoading ? "—" : activeSubscriptions,
              icon: Building2,
            },
            {
              label: t("subscriptions.stats.v1Aligned"),
              value: isLoading ? "—" : `${documentMatchCount}/4`,
              icon: Sparkles,
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm transition hover:border-gray-300 hover:shadow-md sm:p-5"
            >
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-secondary/[0.04] transition group-hover:bg-secondary/[0.06]" />

              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-gray-500 sm:text-xs">
                    {stat.label}
                  </p>

                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-900 sm:mt-2 sm:text-3xl">
                    {stat.value}
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary sm:h-10 sm:w-10">
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ========== PLAN STANDARDS ========== */}


{subscriptionMode === "product" ? (
  <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
    {/* Product Plans */}
    <div className="grid grid-cols-1 gap-3 p-2 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
      {modeScopedPlans.map((plan) => {
        const productLimit = plan.max_products ?? 0;
        const staffLimit = plan.max_staff_members ?? 0;
        const featuredLimit = plan.max_featured_products ?? 0;
        const isActive = plan.is_active;

        return (
          <article
            key={plan.id}
            className="flex min-w-0 flex-col rounded-xl border border-gray-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md"
          >
            {/* Plan Header */}
            <div className="flex items-start justify-between gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/[0.07] text-secondary">
  <ClipboardList className="h-5 w-5" />
</div>

              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {isActive
                  ? t("subscriptions.dynamicStandards.active")
                  : t("subscriptions.dynamicStandards.inactive")}
              </span>
            </div>

            {/* Plan Details */}
            <div className="mt-2">
              <h3 className="truncate text-sm font-bold text-secondary">
                {plan.name}
              </h3>

              <p className=" line-clamp-2 min-h-[32px] text-xs leading-relaxed text-gray-500">
                {plan.description ||
                  t("subscriptions.dynamicStandards.noDescription")}
              </p>
            </div>

            {/* Price */}
            <div className="mt-1 border-gray-100 pb-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {t("subscriptions.dynamicStandards.price")}
              </p>

              <p className="mt-1 text-xl font-bold tracking-tight text-secondary">
                {Number(plan.price) === 0
                  ? t("subscriptions.plans.free")
                  : `ETB ${formatEtb(Number(plan.price))}`}
              </p>

              {Number(plan.price) > 0 && (
                <p className="mt-0.5 text-[10px] text-gray-400">
                  / {t("subscriptions.dynamicStandards.month")}
                </p>
              )}
            </div>

            {/* Plan Limits */}
            <dl className="mt-2 flex-1 space-y-3">
              {[
                {
                  label: t("subscriptions.standards.products"),
                  value: productLimit,
                },
                {
                  label: t("subscriptions.standards.staff"),
                  value: staffLimit,
                },
                {
                  label: t("subscriptions.standards.featured"),
                  value: featuredLimit,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <dt className="text-xs text-gray-500">
                    {item.label}
                  </dt>

                  <dd className="text-xs font-bold text-gray-800">
                    {item.value === -1
                      ? t("subscriptions.dynamicStandards.unlimited")
                      : item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </div>
  </section>
) : (
  <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
    {/* Service Plans Header */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-4 py-3.5 sm:px-6 sm:py-4">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary sm:h-9 sm:w-9">
          <Sparkles className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900">
            {t("subscriptions.dynamicStandards.serviceTitle")}
          </h2>

          <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
            {t("subscriptions.dynamicStandards.subtitle")}
          </p>
        </div>
      </div>

      <span className="inline-flex items-center rounded-full bg-secondary/[0.06] px-3 py-1 text-xs font-semibold text-secondary">
        {modeScopedPlans.length} {t("subscriptions.dynamicStandards.plans")}
      </span>
    </div>

    {/* Loading State */}
    {isLoading ? (
      <div className="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse space-y-4 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>

            <div className="h-6 w-32 rounded bg-gray-200" />

            <div className="space-y-3">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-full rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    ) : modeScopedPlans.length === 0 ? (
      /* Empty State */
      <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
          <Sparkles className="h-6 w-6" />
        </div>

        <h3 className="text-sm font-semibold text-gray-800">
          {t("subscriptions.dynamicStandards.emptyTitle")}
        </h3>

        <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
          {t("subscriptions.dynamicStandards.emptyDescription")}
        </p>
      </div>
    ) : (
      /* Dynamic Service Plans */
      <div className="grid gap-3 bg-white p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        {modeScopedPlans.map((plan) => {
          const subscribers = modeScopedSubscriptions.filter(
            (sub) => sub.plan?.id === plan.id,
          ).length;

          const serviceLimit = plan.max_services ?? 15;
          const staffLimit = plan.max_staff_members ?? 5;
          const isActive = plan.is_active;

          return (
            <article
              key={plan.id}
              className="group relative flex min-w-0 flex-col rounded-xl border border-gray-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md sm:p-5"
            >
              {/* Plan Name and Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">
                    {plan.name}
                  </h3>

                  <p className="mt-1 text-[11px] text-gray-500 sm:text-xs">
                    {plan.duration_days
                      ? `${plan.duration_days} ${t("subscriptions.dynamicStandards.days")}`
                      : t("subscriptions.dynamicStandards.flexibleDuration")}
                  </p>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      : "bg-gray-50 text-gray-500 ring-gray-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  {isActive
                    ? t("subscriptions.dynamicStandards.active")
                    : t("subscriptions.dynamicStandards.inactive")}
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 border-b border-gray-100 pb-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  {t("subscriptions.dynamicStandards.price")}
                </p>

                <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-gray-900">
                    {Number(plan.price) === 0
                      ? t("subscriptions.plans.free")
                      : `ETB ${formatEtb(Number(plan.price))}`}
                  </span>

                  {Number(plan.price) > 0 && (
                    <span className="text-[10px] text-gray-400">
                      / {plan.duration_days || "plan"}{" "}
                      {t("subscriptions.dynamicStandards.days")}
                    </span>
                  )}
                </div>
              </div>

              {/* Plan Limits */}
              <dl className="mt-4 flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <Sparkles className="h-3.5 w-3.5 text-gray-400" />
                    {t("subscriptions.dynamicStandards.services")}
                  </dt>

                  <dd className="font-semibold text-gray-800">
                    {serviceLimit === -1
                      ? t("subscriptions.dynamicStandards.unlimited")
                      : serviceLimit}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {t("subscriptions.standards.staff")}
                  </dt>

                  <dd className="font-semibold text-gray-800">
                    {staffLimit === -1
                      ? t("subscriptions.dynamicStandards.unlimited")
                      : staffLimit}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-gray-500">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {t("subscriptions.dynamicStandards.subscribers")}
                  </dt>

                  <dd className="font-semibold text-gray-800">
                    {subscribers}
                  </dd>
                </div>
              </dl>

              {/* Description */}
              {plan.description && (
                <p className="mt-4 border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-500">
                  {plan.description}
                </p>
              )}

              {/* Edit Plan */}
              <div className="mt-auto pt-5">
                <button
                  type="button"
                  onClick={() => handleEditClick(plan)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-secondary/30 hover:bg-secondary/[0.04] hover:text-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("subscriptions.dynamicStandards.editPlan")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
)}


        {/* ========== PLANS ========== */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary sm:h-9 sm:w-9">
                <CreditCard className="h-4 w-4" />
              </div>

              <h2 className="text-sm font-bold text-gray-900">
                {subscriptionMode === "service"
                  ? "Service Plans"
                  : "Product Plans"}
              </h2>
            </div>

            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 sm:px-3 sm:py-1 sm:text-xs">
              {t("subscriptions.plans.total", {
                count: modeScopedPlans.length,
              })}
            </span>
          </div>

          {/* MOBILE: cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-2 p-4"
                >
                  <div className="h-4 w-32 rounded bg-secondary/[0.08]" />
                  <div className="h-3 w-48 rounded bg-secondary/[0.08]" />
                  <div className="h-3 w-40 rounded bg-secondary/[0.08]" />
                </div>
              ))
            ) : modeScopedPlans.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>

                <p className="mt-3 text-sm font-medium text-gray-900">
                  {t("subscriptions.plans.noPlans")}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {t("subscriptions.plans.createFirst")}
                </p>
              </div>
            ) : (
              modeScopedPlans.map((plan) => {
                const subscribers = modeScopedSubscriptions.filter(
                  (sub) => sub.plan?.id === plan.id,
                ).length;

                return (
                  <article key={plan.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-secondary/40 ring-4 ring-secondary/[0.06]" />

                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {plan.name}
                        </h3>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                          plan.is_active
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            : "bg-gray-50 text-gray-500 ring-gray-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            plan.is_active
                              ? "bg-emerald-500"
                              : "bg-gray-400"
                          }`}
                        />

                        {plan.is_active
                          ? t("subscriptions.plans.active")
                          : t("subscriptions.plans.inactive")}
                      </span>
                    </div>

                    <p className="mt-2 text-base font-bold text-gray-900">
                      {Number(plan.price || 0) === 0
                        ? t("subscriptions.plans.free")
                        : `ETB ${formatEtb(Number(plan.price || 0))}`}

                      <span className="ml-1 text-[11px] font-medium text-gray-400">
                        / {plan.duration_days ?? 30}d
                      </span>
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                      {subscriptionMode === "service" ? (
                        <div className="flex justify-between gap-2 border-b border-dashed border-gray-100 pb-1.5">
                          <dt className="text-gray-400">
                            Services
                          </dt>

                          <dd className="font-semibold text-gray-700">
                            {(plan.max_services ?? 15) === -1
                              ? t("subscriptions.plans.unlimited")
                              : plan.max_services ?? 15}
                          </dd>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between gap-2 border-b border-dashed border-gray-100 pb-1.5">
                            <dt className="text-gray-400">
                              {t("subscriptions.plans.products")}
                            </dt>

                            <dd className="font-semibold text-gray-700">
                              {formatProductLimit(plan, t)}
                            </dd>
                          </div>

                          <div className="flex justify-between gap-2 border-b border-dashed border-gray-100 pb-1.5">
                            <dt className="text-gray-400">
                              {t("subscriptions.plans.featured")}
                            </dt>

                            <dd className="font-semibold text-gray-700">
                              {plan.max_featured_products === -1
                                ? t("subscriptions.plans.unlimited")
                                : plan.max_featured_products}
                            </dd>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">
                          {t("subscriptions.plans.staff")}
                        </dt>

                        <dd className="font-semibold text-gray-700">
                          {(plan.max_staff_members ?? 5) === -1
                            ? t("subscriptions.plans.unlimited")
                            : plan.max_staff_members ?? 5}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">
                          {t("subscriptions.plans.subscribers")}
                        </dt>

                        <dd className="inline-flex items-center gap-1 font-semibold text-gray-700">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {subscribers}
                        </dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => handleEditClick(plan)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t("subscriptions.plans.edit")}
                    </button>
                  </article>
                );
              })
            )}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">{t("subscriptions.plans.plan")}</th>
                  <th className="px-4 py-3.5">{t("subscriptions.plans.price")}</th>
                  <th className="px-4 py-3.5">{t("subscriptions.plans.period")}</th>
                  {subscriptionMode === "service" ? (
                    <th className="px-4 py-3.5">Services</th>
                  ) : (
                    <>
                      <th className="px-4 py-3.5">{t("subscriptions.plans.products")}</th>
                      <th className="px-4 py-3.5">{t("subscriptions.plans.featured")}</th>
                    </>
                  )}
                  <th className="px-4 py-3.5">{t("subscriptions.plans.staff")}</th>
                  <th className="px-4 py-3.5">{t("subscriptions.plans.subscribers")}</th>
                  <th className="px-4 py-3.5">{t("subscriptions.plans.status")}</th>
                  <th className="px-5 py-3.5 text-right">{t("subscriptions.plans.action")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonRow key={index} />
                  ))
                ) : modeScopedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                        </div>

                        <p className="mt-3 text-sm font-medium text-gray-900">
                          {t("subscriptions.plans.noPlans")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {t("subscriptions.plans.createFirstToStart")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  modeScopedPlans.map((plan) => {
                    const subscribers = modeScopedSubscriptions.filter(
                      (sub) => sub.plan?.id === plan.id,
                    ).length;

                    return (
                      <tr
                        key={plan.id}
                        className="group text-sm text-gray-700 transition hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full bg-secondary/40 ring-4 ring-secondary/[0.06]" />

                            <span className="font-semibold text-gray-900">
                              {plan.name}
                            </span>
                          </div>
                        </td>
<td className="px-3 py-3 sm:px-4 sm:py-4">
  <div className="flex min-w-[110px] flex-col gap-2">
    {/* Main Price */}
    <span className="whitespace-nowrap text-sm font-semibold text-gray-900">
      {Number(plan.price || 0) === 0
        ? t("subscriptions.plans.free")
        : `ETB ${formatEtb(Number(plan.price || 0))}`}
    </span>

    {/* Optional Pricing */}
    {(plan.six_month_price != null || plan.annual_price != null) && (
      <div className="flex flex-wrap items-center gap-1.5">
        {plan.six_month_price != null && (
          <span className="inline-flex whitespace-nowrap rounded bg-emerald-50 px-1.5 py-1 text-[10px] font-semibold text-emerald-700">
            6mo: ETB {formatEtb(Number(plan.six_month_price))}
            {plan.six_month_savings_percent > 0 &&
              ` (-${plan.six_month_savings_percent}%)`}
          </span>
        )}

        {plan.annual_price != null && (
          <span className="inline-flex whitespace-nowrap rounded bg-secondary/[0.08] px-1.5 py-1 text-[10px] font-semibold text-secondary">
            1yr: ETB {formatEtb(Number(plan.annual_price))}
            {plan.annual_savings_percent > 0 &&
              ` (-${plan.annual_savings_percent}%)`}
          </span>
        )}
      </div>
    )}
  </div>
</td>

                        <td className="px-4 py-4 font-semibold text-secondary">
                          {plan.duration_days ?? 30}{" "}
                          {t("subscriptions.plans.days")}
                        </td>

                        {subscriptionMode === "service" ? (
                          <td className="px-4 py-4 font-medium text-gray-700">
                            {(plan.max_services ?? 15) === -1
                              ? t("subscriptions.plans.unlimited")
                              : plan.max_services ?? 15}
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-4 font-medium text-gray-700">
                              {formatProductLimit(plan, t)}
                            </td>

                            <td className="px-4 py-4 text-gray-600">
                              {plan.max_featured_products === -1
                                ? t("subscriptions.plans.unlimited")
                                : plan.max_featured_products}
                            </td>
                          </>
                        )}

                        <td className="px-4 py-4 font-medium text-gray-700">
                          {(plan.max_staff_members ?? 5) === -1
                            ? t("subscriptions.plans.unlimited")
                            : plan.max_staff_members ?? 5}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-gray-700">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            {subscribers}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
                              plan.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-gray-50 text-gray-500 ring-gray-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                plan.is_active
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {plan.is_active
                              ? t("subscriptions.plans.active")
                              : t("subscriptions.plans.inactive")}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditClick(plan)}
                            aria-label={`${t("subscriptions.plans.edit")} ${plan.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-secondary/[0.08] hover:text-secondary"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========== COMPANY SUBSCRIPTIONS ========== */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary sm:h-9 sm:w-9">
                <Building2 className="h-4 w-4" />
              </div>

              <h2 className="text-sm font-bold text-gray-900">
                {subscriptionMode === "service"
                  ? "Service Company Subscriptions"
                  : "Product Company Subscriptions"}
              </h2>
            </div>

            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 sm:px-3 sm:py-1 sm:text-xs">
              {t("subscriptions.companySubscriptions.total", {
                count: modeScopedSubscriptions.length,
              })}
            </span>
          </div>

          {/* SEARCH AND FILTERS */}
          <div className="border-b border-gray-100 bg-gray-50/40 px-4 py-3 sm:px-6 sm:py-3.5">
            <TableControls
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            >
              <div className="flex w-full items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SearchInput
                    value={inputValue}
                    onChange={handleInputChange}
                    debounceMs={0}
                    loading={isLoading}
                    showClearButton={false}
                    placeholder={t("subscriptions.companySubscriptions.search")}
                  />
                </div>

                <div className="relative shrink-0" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((v) => !v)}
                    aria-label={t("subscriptions.companySubscriptions.filterByPlan")}
                    className={`inline-flex h-[32px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition text-secondary sm:px-3.5 sm:text-sm ${
                      planFilter !== "all"
                        ? "border-secondary/30 bg-secondary/[0.08] text-secondary"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Filter className="h-4 w-4" />

                    <span className="hidden max-w-[50px] truncate sm:inline">
                      {activePlanLabel}
                    </span>

                    {planFilter !== "all" && (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 z-30 mt-2 w-46 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-900/5"
                      >
                        <div className="max-h-64 overflow-y-auto py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPlanFilter("all");
                              setIsFilterOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition ${
                              planFilter === "all"
                                ? "bg-secondary/[0.06] font-semibold text-secondary"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>
                              {t("subscriptions.companySubscriptions.allPlans")}
                            </span>

                            {planFilter === "all" && (
                              <Check className="h-4 w-4" />
                            )}
                          </button>

                          {modeScopedPlans.map((plan) => {
                            const value = String(plan.id);
                            const active = planFilter === value;

                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                  setPlanFilter(value);
                                  setIsFilterOpen(false);
                                }}
                                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition ${
                                  active
                                    ? "bg-secondary/[0.06] font-semibold text-secondary"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span className="truncate">
                                  {plan.name}
                                </span>

                                {active && (
                                  <Check className="h-4 w-4 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {hasActiveFilters && (
                          <div className="border-t border-gray-100 p-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                clearAllFilters();
                                setIsFilterOpen(false);
                              }}
                              className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-gray-500 hover:bg-gray-50"
                            >
                              {t("subscriptions.companySubscriptions.clearAllFilters")}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </TableControls>
          </div>

          {/* SUBSCRIPTIONS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 sm:px-5 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.company")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.plan")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.started")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.extraFree")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.expires")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.daysLeft")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.subStatus")}
                  </th>

                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.storeAccess")}
                  </th>

                  <th className="px-4 py-3 text-right sm:px-5 sm:py-3.5">
                    {t("subscriptions.companySubscriptions.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonSubscriptionRow key={index} />
                  ))
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>

                        <p className="mt-3 text-sm font-medium text-gray-900">
                          {t("subscriptions.companySubscriptions.noSubscriptions")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {hasActiveFilters
                            ? t("subscriptions.companySubscriptions.adjustFilters")
                            : t("subscriptions.companySubscriptions.subscriptionsAppear")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((sub) => {
                    const isSubscriptionActive =
                      sub.is_active && !sub.is_expired;

                    const isStoreActive = sub.company_is_active;

                    return (
                      <tr
                        key={sub.id}
                        className="group text-sm text-gray-700 transition hover:bg-gray-50/70"
                      >
                        <td className="px-4 py-3.5 sm:px-5 sm:py-4">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.06] text-xs font-bold text-secondary">
                              {sub.company_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>

                            <span className="font-semibold text-gray-900">
                              {sub.company_name}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 sm:px-4 sm:py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${getPlanColor(
                                sub.plan?.name,
                              )}`}
                            >
                              {sub.plan?.name ||
                                t("subscriptions.plans.unknown")}
                            </span>
                            {sub.billing_cycle && sub.billing_cycle !== "monthly" && (
                              <span className="inline-flex rounded-md bg-secondary/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                                {sub.billing_cycle === "annual" ? "Annual" : "6 Months"}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-xs text-gray-500 sm:px-4 sm:py-4 sm:text-sm">
                          {/* ✅ Shared timezone-aware formatter */}
                          {formatShortDate(sub.start_date, language)}
                        </td>

                        <td className="px-3 py-3.5 sm:px-4 sm:py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary/[0.05] px-2 py-0.5 text-[11px] font-semibold text-secondary sm:text-xs">
                            <Gift className="h-3 w-3" />

                            {sub.additional_free_days > 0
                              ? `+${sub.additional_free_days}d`
                              : "0d"}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 text-xs font-medium text-gray-600 sm:px-4 sm:py-4 sm:text-sm">
                          {/* ✅ Shared timezone-aware formatter */}
                          {sub.effective_end_date
                            ? formatShortDate(
                                sub.effective_end_date,
                                language,
                              )
                            : sub.end_date
                              ? formatShortDate(
                                  sub.end_date,
                                  language,
                                )
                              : t("subscriptions.companySubscriptions.lifetime")}
                        </td>

                        <td className="px-3 py-3.5 sm:px-4 sm:py-4">
                          <span
                            className={`text-xs font-semibold sm:text-sm ${
                              sub.days_remaining > 5
                                ? "text-emerald-700"
                                : sub.days_remaining > 0
                                  ? "text-amber-700"
                                  : "text-red-600"
                            }`}
                          >
                            {sub.days_remaining !== undefined &&
                            sub.days_remaining !== null
                              ? `${sub.days_remaining}d`
                              : "—"}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 sm:px-4 sm:py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset sm:px-2.5 sm:py-1 sm:text-[11px] ${
                              isSubscriptionActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-gray-50 text-gray-500 ring-gray-300"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isSubscriptionActive
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {isSubscriptionActive
                              ? t("subscriptions.companySubscriptions.live")
                              : t("subscriptions.companySubscriptions.expired")}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 sm:px-4 sm:py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset sm:px-2.5 sm:py-1 sm:text-[11px] ${
                              isStoreActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-rose-50 text-rose-700 ring-rose-600/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isStoreActive
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />

                            {isStoreActive
                              ? t("subscriptions.companySubscriptions.live")
                              : t("subscriptions.companySubscriptions.inactive")}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right sm:px-5 sm:py-4">
                          <button
                            type="button"
                            onClick={() => handleOpenDealModal(sub)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-secondary/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-secondary transition hover:bg-secondary/10 sm:px-3 sm:text-xs"
                          >
                            <Gift className="h-3.5 w-3.5" />

                            <span className="hidden sm:inline">
                              {t("subscriptions.companySubscriptions.dealFreeDays")}
                            </span>

                            <span className="sm:hidden">
                              {t("subscriptions.companySubscriptions.deal")}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 sm:px-6 sm:py-3.5">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </section>
      </div>

      {/* ========== MODAL: CREATE / EDIT PLAN ========== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-gray-900/5 sm:max-h-[90vh] sm:rounded-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                  {editingPlan
                    ? t("subscriptions.planModal.editTitle")
                    : t("subscriptions.planModal.newTitle")}
                </h3>

                {selectedDocumentBaseline && (
                  <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                    {selectedDocumentBaseline.name} ·{" "}
                    {getTranslatedBaseline(selectedDocumentBaseline, t).positioning}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={t("subscriptions.planModal.close")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <form
                id="plan-form"
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-5"
              >
                {saveError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    {saveError}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      {t("subscriptions.planModal.planName")}
                    </label>

                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;

                        const newBaseline = getDocumentBaseline({ name });
                        const oldBaseline = getDocumentBaseline({
                          name: formData.name,
                        });

                        setFormData((current) => {
                          const autoLimit =
                            newBaseline?.expectedProductLimit;

                          const oldAuto =
                            oldBaseline?.expectedProductLimit;

                          const isUntouched =
                            autoLimit !== null &&
                            autoLimit !== undefined &&
                            (current.max_products === 0 ||
                              current.max_products === oldAuto);

                          return {
                            ...current,
                            name,
                            ...(isUntouched
                              ? { max_products: autoLimit as number }
                              : {}),
                          };
                        });
                      }}
                      className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                      placeholder={t("subscriptions.planModal.namePlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      {t("subscriptions.planModal.price")}
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      {t("subscriptions.planModal.period")}
                    </label>

                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_days:
                            parseInt(e.target.value, 10) || 30,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* LONG-TERM BILLING PRICING (OPTIONAL) */}
                {Number(formData.price) > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-800">
                        Multi-Term Pricing (Optional)
                      </p>
                      <span className="text-[11px] text-gray-500">
                        Leave blank to disable
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-gray-700">
                            6-Month Price (180d)
                          </label>
                          <div className="flex gap-1">
                            {[10, 15, 20].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    six_month_price: Number(
                                      (Number(formData.price) * 6 * (1 - pct / 100)).toFixed(2),
                                    ),
                                  })
                                }
                                className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-gray-200 hover:bg-secondary/5"
                              >
                                -{pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.six_month_price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              six_month_price: e.target.value,
                            })
                          }
                          placeholder={`e.g. ${(Number(formData.price) * 6 * 0.85).toFixed(0)}`}
                          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                        />
                        {formData.six_month_price !== "" && Number(formData.six_month_price) > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-emerald-700">
                            {(() => {
                              const full = Number(formData.price) * 6;
                              const val = Number(formData.six_month_price);
                              const pct = full > val ? Math.round((1 - val / full) * 100) : 0;
                              return `Save ${pct}% · ETB ${(val / 6).toFixed(0)}/mo`;
                            })()}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-gray-700">
                            Annual Price (365d)
                          </label>
                          <div className="flex gap-1">
                            {[15, 20, 25].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    annual_price: Number(
                                      (Number(formData.price) * 12 * (1 - pct / 100)).toFixed(2),
                                    ),
                                  })
                                }
                                className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-gray-200 hover:bg-secondary/5"
                              >
                                -{pct}%
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.annual_price}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              annual_price: e.target.value,
                            })
                          }
                          placeholder={`e.g. ${(Number(formData.price) * 12 * 0.75).toFixed(0)}`}
                          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                        />
                        {formData.annual_price !== "" && Number(formData.annual_price) > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-emerald-700">
                            {(() => {
                              const full = Number(formData.price) * 12;
                              const val = Number(formData.annual_price);
                              const pct = full > val ? Math.round((1 - val / full) * 100) : 0;
                              return `Save ${pct}% · ETB ${(val / 12).toFixed(0)}/mo`;
                            })()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    {t("subscriptions.planModal.description")}
                  </label>

                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    placeholder={t("subscriptions.planModal.descriptionPlaceholder")}
                  />
                </div>

                {/* BASELINE INFORMATION */}
                {selectedDocumentBaseline && (
                  <div className="grid gap-3 rounded-xl border border-secondary/10 bg-secondary/[0.025] px-4 py-3 text-xs text-gray-600 sm:grid-cols-3">
                    <div>
                      <span className="text-gray-400">
                        {t("subscriptions.planModal.v1Price")}
                      </span>

                      <p className="mt-0.5 font-semibold text-gray-800">
                        {selectedDocumentBaseline.monthlyPrice === 0
                          ? t("subscriptions.plans.free")
                          : `ETB ${formatEtb(
                              selectedDocumentBaseline.monthlyPrice,
                            )}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        {t("subscriptions.planModal.products")}
                      </span>

                      <p className="mt-0.5 font-semibold text-gray-800">
                        {getTranslatedBaseline(selectedDocumentBaseline, t).productListing}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        {t("subscriptions.planModal.staff")}
                      </span>

                      <p className="mt-0.5 font-semibold text-gray-800">
                        {getTranslatedBaseline(selectedDocumentBaseline, t).staff}
                      </p>
                    </div>
                  </div>
                )}

                {/* PLAN LIMITS */}
                <div
                  className={`grid gap-3 sm:gap-4 ${
                    subscriptionMode === "service"
                      ? "sm:grid-cols-2"
                      : "sm:grid-cols-3"
                  }`}
                >
                  {subscriptionMode === "service" ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                        Service Limit
                      </label>

                      <input
                        type="number"
                        required
                        value={formData.max_services}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_services:
                              parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                      />

                      <p className="mt-1.5 text-[11px] text-gray-400">
                        {t("subscriptions.planModal.unlimitedHint")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          {t("subscriptions.planModal.productLimit")}
                        </label>

                        <input
                          type="number"
                          required
                          value={formData.max_products}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max_products:
                                parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                        />

                        <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                          {selectedDocumentBaseline?.expectedProductLimit === -1
                            ? t("subscriptions.planModal.premiumUnlimited")
                            : selectedDocumentBaseline?.expectedProductLimit != null
                              ? t("subscriptions.standards.productLimitShouldBe", {
                                  plan: selectedDocumentBaseline.name,
                                  limit: selectedDocumentBaseline.expectedProductLimit,
                                })
                              : selectedDocumentBaseline?.tier === "free"
                                ? t("subscriptions.planModal.freeLimited")
                                : t("subscriptions.planModal.unlimitedHint")}
                        </p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                          {t("subscriptions.planModal.featuredLimit")}
                        </label>

                        <input
                          type="number"
                          required
                          value={formData.max_featured_products}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              max_featured_products:
                                parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                        />

                        <p className="mt-1.5 text-[11px] text-gray-400">
                          {t("subscriptions.planModal.noFeatured")} ·{" "}
                          {t("subscriptions.planModal.unlimitedFeatured")}
                        </p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      {t("subscriptions.planModal.staffLimit")}
                    </label>

                    <input
                      type="number"
                      required
                      value={formData.max_staff_members}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_staff_members:
                            parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                    />

                    <p className="mt-1.5 text-[11px] text-gray-400">
                      {t("subscriptions.planModal.unlimitedHint")}
                    </p>
                  </div>
                </div>

                {/* ACTIVE STATUS */}
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t("subscriptions.planModal.active")}
                      </p>

                      <p className="text-xs text-gray-500">
                        {t("subscriptions.planModal.available")}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* MODAL FOOTER */}
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3.5 backdrop-blur sm:static sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {t("subscriptions.planModal.cancel")}
              </button>

              <button
                type="submit"
                form="plan-form"
                disabled={isSaving}
                className="h-10 rounded-xl bg-secondary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? t("subscriptions.planModal.saving")
                  : t("subscriptions.planModal.save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========== DEAL MODAL ========== */}
   
{dealModalOpen && selectedSub && (
  <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 lg:p-6">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm transition-opacity"
      onClick={() => !isSavingDeal && setDealModalOpen(false)}
    />

    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative z-10 flex max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl lg:max-w-3xl"
    >
      {/* HEADER */}
      <div className="relative shrink-0 overflow-hidden border-b border-gray-100 bg-gradient-to-r from-secondary/[0.07] via-white to-white px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-sm shadow-secondary/20">
              <Gift className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
                {t("subscriptions.dealModal.title")}
              </h3>

              <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">
                {selectedSub.company_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDealModalOpen(false)}
            disabled={isSavingDeal}
            aria-label={t("subscriptions.planModal.close")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSaveDeal}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {/* ERROR */}
          {dealError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{dealError}</span>
            </div>
          )}

          {/* CURRENT SUBSCRIPTION */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/[0.08] text-secondary">
                <ClipboardList className="h-4 w-4" />
              </div>

              <h4 className="text-sm font-bold text-gray-900">
                {t("subscriptions.dealModal.currentSubscription")}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 sm:grid-cols-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("subscriptions.dealModal.currentPlan")}
                </p>

                <p className="mt-1 truncate text-sm font-bold text-gray-900">
                  {selectedSub.plan?.name || "—"}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("subscriptions.dealModal.started")}
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatShortDate(selectedSub.start_date, language)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {t("subscriptions.dealModal.storeStatus")}
                </p>

                <span
                  className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${
                    selectedSub.company_is_active
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedSub.company_is_active
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  />

                  {selectedSub.company_is_active
                    ? t("subscriptions.dealModal.activeLive")
                    : t("subscriptions.dealModal.inactiveHidden")}
                </span>
              </div>
            </div>
          </div>

          {/* DEAL CONFIGURATION */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/[0.08] text-secondary">
                <Gift className="h-4 w-4" />
              </div>

              <h4 className="text-sm font-bold text-gray-900">
                {t("subscriptions.dealModal.dealConfiguration")}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* ASSIGN PLAN */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  {t("subscriptions.dealModal.assignPlan")}
                </label>

                <select
                  value={dealFormData.plan_id}
                  onChange={(e) =>
                    setDealFormData({
                      ...dealFormData,
                      plan_id: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                >
                  {modeScopedPlans.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} (
                      {Number(p.price) === 0
                        ? t("subscriptions.plans.free")
                        : `ETB ${p.price}`}{" "}
                      · {p.duration_days ?? 30}{" "}
                      {t("subscriptions.plans.days")})
                    </option>
                  ))}
                </select>
              </div>

              {/* EXTRA FREE DAYS */}
              <div className="sm:col-span-2">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    {t("subscriptions.dealModal.extraFreeDays")}
                  </label>

                  <span className="rounded-full bg-secondary/[0.07] px-2.5 py-1 text-[10px] font-semibold text-secondary">
                    {t("subscriptions.dealModal.negotiatedBonus")}
                  </span>
                </div>

                <input
                  type="number"
                  min="0"
                  required
                  value={dealFormData.additional_free_days}
                  onChange={(e) =>
                    setDealFormData({
                      ...dealFormData,
                      additional_free_days: Math.max(
                        0,
                        parseInt(e.target.value, 10) || 0,
                      ),
                    })
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                />

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {[7, 14, 30, 45, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setDealFormData({
                          ...dealFormData,
                          additional_free_days:
                            (Number(dealFormData.additional_free_days) || 0) +
                            days,
                        })
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 transition hover:border-secondary/30 hover:bg-secondary/[0.06] hover:text-secondary"
                    >
                      +{days} {t("subscriptions.dealModal.days")}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setDealFormData({
                        ...dealFormData,
                        additional_free_days: 0,
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-100"
                  >
                    {t("subscriptions.dealModal.resetToZero")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EXPIRATION PREVIEW */}
          {(() => {
            const planObj =
              plans.find(
                (p) => String(p.id) === dealFormData.plan_id,
              ) || selectedSub.plan;

            const pDays = planObj?.duration_days ?? 30;

            const totalD =
              pDays +
              (Number(dealFormData.additional_free_days) || 0);

            const startD = new Date(selectedSub.start_date);

            const previewEndD = new Date(
              startD.getTime() + totalD * 24 * 60 * 60 * 1000,
            );

            const remainingD = Math.max(
              0,
              Math.ceil(
                (previewEndD.getTime() - Date.now()) /
                  (24 * 60 * 60 * 1000),
              ),
            );

            return (
              <div className="overflow-hidden rounded-xl border border-secondary/20 bg-secondary/[0.035]">
                <div className="flex items-center gap-2 border-b border-secondary/10 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/[0.10] text-secondary">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      {t("subscriptions.dealModal.calculatedPreview")}
                    </h4>

                    <p className="text-[10px] text-gray-500">
                      {t("subscriptions.dealModal.expiryPreviewDescription")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {t("subscriptions.dealModal.planDuration")}
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {pDays}{" "}
                      <span className="text-xs font-medium text-gray-500">
                        {t("subscriptions.dealModal.days")}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {t("subscriptions.dealModal.extraFreeDays")}
                    </p>

                    <p className="mt-1 text-lg font-bold text-secondary">
                      +{Number(dealFormData.additional_free_days) || 0}{" "}
                      <span className="text-xs font-medium text-gray-500">
                        {t("subscriptions.dealModal.days")}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {t("subscriptions.dealModal.totalPeriod")}
                    </p>

                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {totalD}{" "}
                      <span className="text-xs font-medium text-gray-500">
                        {t("subscriptions.dealModal.days")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary/10 bg-white/70 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {t("subscriptions.dealModal.newExpiry")}
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-900">
                      {formatShortDate(previewEndD, language)}
                    </p>
                  </div>

                  <span className="rounded-full bg-secondary/[0.08] px-3 py-1.5 text-xs font-semibold text-secondary">
                    {t("subscriptions.dealModal.daysFromNow", {
                      count: remainingD,
                    })}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* COMPANY STORE STATUS */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-secondary/20">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Building2 className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  {t("subscriptions.dealModal.companyStoreActive")}
                </p>

                <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                  {t("subscriptions.dealModal.storeVisibility")}
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={dealFormData.set_company_active}
              onChange={(e) =>
                setDealFormData({
                  ...dealFormData,
                  set_company_active: e.target.checked,
                })
              }
              className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-secondary accent-secondary focus:ring-secondary"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/90 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={() => setDealModalOpen(false)}
            disabled={isSavingDeal}
            className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {t("subscriptions.dealModal.cancel")}
          </button>

          <button
            type="submit"
            disabled={isSavingDeal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-semibold text-white shadow-sm shadow-secondary/20 transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingDeal ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("subscriptions.dealModal.applying")}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {t("subscriptions.dealModal.applyAndSave")}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  </div>
)}

    </div>
  );
}