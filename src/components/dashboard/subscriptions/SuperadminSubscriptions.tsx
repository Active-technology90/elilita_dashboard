import React, { useState, useEffect, useMemo, useRef } from "react";
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
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

const getDocumentBaseline = (plan: any): DocumentPlanBaseline | null => {
  const tier = resolveDocumentTier(plan);
  return DOCUMENT_PLAN_BASELINES.find((item) => item.tier === tier) || null;
};

/**
 * Reads the *explicitly stored* product limit from the plan row.
 * Returns null only when the field is truly absent (not when it is 0 or -1).
 */
const getConfiguredProductLimit = (plan: any): number | null => {
  const raw = plan?.max_products;
  if (raw === null || raw === undefined || raw === "") return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

/**
 * The value that should be *displayed*.
 *
 * Priority:
 *   1. Explicitly stored max_products (DB is source of truth)
 *   2. V1.0 baseline (fallback for legacy rows that never set a cap)
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

const formatProductLimit = (plan: any): string => {
  const baseline = getDocumentBaseline(plan);
  const limit = getProductLimitForPlan(plan);

  if (limit === -1) return "Unlimited";

  // Free plan shows "Limited" only when no numeric cap is stored
  if (baseline?.tier === "free" && (limit === null || limit === 0)) {
    return "Limited";
  }

  if (limit === null) return "—";
  return formatEtb(limit);
};

const getDocumentIssues = (
  plan: any,
  baseline: DocumentPlanBaseline,
): string[] => {
  const issues: string[] = [];
  const price = Number(plan?.price ?? 0);
  const featuredLimit = Number(plan?.max_featured_products ?? 0);

  // Use the STORED value, not the baseline-substituted one
  const storedProductLimit = getConfiguredProductLimit(plan);

  if (price !== baseline.monthlyPrice) {
    issues.push(
      `Price should be ${
        baseline.monthlyPrice === 0
          ? "ETB 0"
          : `ETB ${formatEtb(baseline.monthlyPrice)}`
      }`,
    );
  }

  if (baseline.expectedProductLimit === null) {
    // Free: must be a positive limited amount OR 0/"limited"
    if (storedProductLimit === null) {
      // No cap stored — that's acceptable for Free tier
    } else if (storedProductLimit <= 0 && storedProductLimit !== -1) {
      issues.push("Free product listing should be a positive limited amount");
    }
  } else if (storedProductLimit !== baseline.expectedProductLimit) {
    issues.push(
      baseline.expectedProductLimit === -1
        ? "Premium product listing should be unlimited (-1)"
        : `${baseline.name} product limit should be ${baseline.expectedProductLimit}`,
    );
  }

  if (baseline.tier === "free" && featuredLimit !== 0) {
    issues.push("Free does not include featured products");
  }
  if (baseline.tier === "basic" && featuredLimit !== 0) {
    issues.push("Basic does not include featured products");
  }
  if (baseline.tier === "advanced" && featuredLimit <= 0) {
    issues.push("Advanced includes featured products");
  }
  if (baseline.tier === "premium" && featuredLimit <= 0) {
    issues.push("Premium includes priority featured products");
  }

  return issues;
};

export default function SuperadminSubscriptions() {
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
    if (planFilter === "all") return "All plans";
    const found = plans.find((p) => String(p.id) === planFilter);
    return found?.name || "All plans";
  }, [planFilter, plans]);

  const clearAllFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setPlanFilter("all");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  const documentAlignment = useMemo(() => {
    return DOCUMENT_PLAN_BASELINES.map((baseline) => {
      const plan = plans.find(
        (candidate) => resolveDocumentTier(candidate) === baseline.tier,
      );

      if (!plan) {
        return {
          ...baseline,
          plan: null,
          issues: [] as string[],
          status: "missing" as const,
        };
      }

      const issues = getDocumentIssues(plan, baseline);
      return {
        ...baseline,
        plan,
        issues,
        status: issues.length === 0 ? ("match" as const) : ("review" as const),
      };
    });
  }, [plans]);

  const documentMatchCount = documentAlignment.filter(
    (item) => item.status === "match",
  ).length;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration_days: 30,
    max_featured_products: 0,
    max_products: 0,
    max_staff_members: 5,
    is_active: true,
  });

  // Company Deal Modal State
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
        additional_free_days: Number(dealFormData.additional_free_days) || 0,
        set_company_active: dealFormData.set_company_active,
      });
      setDealModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error("Error updating company subscription deal", err);
      setDealError(
        err?.response?.data?.detail ||
          "Could not update company subscription.",
      );
    } finally {
      setIsSavingDeal(false);
    }
  };

  const selectedDocumentBaseline = useMemo(
    () =>
      getDocumentBaseline({
        name: formData.name,
        price: formData.price,
      }),
    [formData.name, formData.price],
  );

  useEffect(() => {
    fetchData();
  }, []);

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
      setPageError("Could not load subscription data.");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== FILTER SUBSCRIPTIONS ==========
  const filteredSubscriptions = useMemo(() => {
    let data = [...companySubscriptions];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((sub) =>
        sub.company_name?.toLowerCase().includes(term),
      );
    }

    if (planFilter !== "all") {
      data = data.filter((sub) => String(sub.plan?.id) === planFilter);
    }

    return data;
  }, [companySubscriptions, searchTerm, planFilter]);

  // ========== SORTING ==========
  const { sortedItems } = useSorting(
    filteredSubscriptions,
    "company_name",
    "asc",
  );

  // ========== PAGINATION ==========
  const { paginatedItems, currentPage, totalPages, goToPage, resetPage } =
    usePagination(sortedItems, pageSize);

  useEffect(() => {
    resetPage();
  }, [searchTerm, pageSize, planFilter, resetPage]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(value), 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  /**
   * Open edit modal — uses the STORED max_products value (not the
   * baseline-substituted one) so the form reflects the DB.
   */
  const handleEditClick = (plan: any) => {
    setSaveError("");
    setEditingPlan(plan);

    const stored = getConfiguredProductLimit(plan);

    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: parseFloat(plan.price) || 0,
      duration_days: plan.duration_days ?? 30,
      max_featured_products: Number(plan.max_featured_products ?? 0),
      // Show exactly what's saved; if nothing saved and tier has a baseline,
      // prefill with the baseline so new rows aren't blank.
      max_products:
        stored !== null
          ? stored
          : (getDocumentBaseline(plan)?.expectedProductLimit ?? 0),
      max_staff_members: Number(plan.max_staff_members ?? 5),
      is_active: Boolean(plan.is_active),
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSaveError("");
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      duration_days: 30,
      max_featured_products: 0,
      max_products: 0,
      max_staff_members: 5,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        duration_days: Number(formData.duration_days),
        max_products: Number(formData.max_products),
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
      setSaveError("Could not save the plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportPlans = () => {
    const headers = [
      "Plan Name",
      "Price",
      "Public Products Limit",
      "Featured Limit",
      "Status",
      "Subscribers",
    ];

    const rows = plans.map((plan) => [
      plan.name,
      plan.price,
      formatProductLimit(plan),
      plan.max_featured_products === -1
        ? "Unlimited"
        : plan.max_featured_products,
      plan.is_active ? "Active" : "Inactive",
      companySubscriptions.filter((sub) => sub.plan?.id === plan.id).length,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `subscription_plans_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const activePlans = plans.filter((plan) => plan.is_active).length;
  const activeSubscriptions = companySubscriptions.filter(
    (subscription) => subscription.is_active && !subscription.is_expired,
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
        <PageHeader
          title="Subscriptions"
          description="Manage subscription plans and company subscriptions."
          icon={CreditCard}
          badge={
            !isLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {activeSubscriptions} active
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
                Export
              </button>
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md sm:flex-none sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Plan
              </button>
            </div>
          }
          actionMobile={
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={exportPlans}
                disabled={isLoading || plans.length === 0}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:text-sm"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md sm:flex-none sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Plan
              </button>
            </div>
          }
          className="mb-0"
        />

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
              Retry
            </button>
          </motion.div>
        )}

        {/* ========== STATS CARDS ========== */}
        <section className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
          {[
            {
              label: "Active plans",
              value: isLoading ? "—" : activePlans,
              icon: CreditCard,
            },
            {
              label: "Active subs",
              value: isLoading ? "—" : activeSubscriptions,
              icon: Building2,
            },
            {
              label: "V1.0 aligned",
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
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary sm:h-9 sm:w-9">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Plan standards
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                  Vendor Subscription Plan V1.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 sm:w-24">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500"
                  style={{ width: `${(documentMatchCount / 4) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-gray-700 sm:text-xs">
                {documentMatchCount}/4 aligned
              </span>
            </div>
          </div>

          <div className="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-4">
            {documentAlignment.map((item) => {
              const isMatch = item.status === "match";
              const isMissing = item.status === "missing";

              return (
                <article
                  key={item.tier}
                  className="group relative bg-white p-4 transition hover:bg-gray-50/60 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                          {item.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-gray-500 sm:text-xs">
                          {item.monthlyPrice === 0
                            ? "Free"
                            : `ETB ${formatEtb(item.monthlyPrice)}/mo`}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                        {item.positioning}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset sm:px-2.5 sm:py-1 ${
                        isMatch
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : isMissing
                            ? "bg-gray-50 text-gray-500 ring-gray-300"
                            : "bg-amber-50 text-amber-700 ring-amber-600/20"
                      }`}
                    >
                      {isMatch ? (
                        <>
                          <Check className="h-3 w-3" />
                          Aligned
                        </>
                      ) : isMissing ? (
                        "Missing"
                      ) : (
                        "Review"
                      )}
                    </span>
                  </div>

                  <dl className="mt-4 space-y-2 text-[11px] sm:text-xs">
                    {[
                      ["Products", item.productListing],
                      ["Staff", item.staff],
                      ["Featured", item.featuredProducts],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-3 border-b border-dashed border-gray-100 pb-2 last:border-0 last:pb-0"
                      >
                        <dt className="shrink-0 text-gray-400">{label}</dt>
                        <dd className="text-right font-semibold text-gray-700">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {item.status === "review" && item.issues.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/60 px-2.5 py-2 sm:px-3 sm:py-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <p className="text-[10.5px] leading-relaxed text-amber-800 sm:text-[11px]">
                          {item.issues.join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ========== PLANS ========== */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary sm:h-9 sm:w-9">
                <CreditCard className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Plans</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 sm:px-3 sm:py-1 sm:text-xs">
              {plans.length} total
            </span>
          </div>

          {/* MOBILE: cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 p-4">
                  <div className="h-4 w-32 rounded bg-secondary/[0.08]" />
                  <div className="h-3 w-48 rounded bg-secondary/[0.08]" />
                  <div className="h-3 w-40 rounded bg-secondary/[0.08]" />
                </div>
              ))
            ) : plans.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">
                  No plans yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Create your first subscription plan.
                </p>
              </div>
            ) : (
              plans.map((plan) => {
                const subscribers = companySubscriptions.filter(
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
                            plan.is_active ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 text-base font-bold text-gray-900">
                      {Number(plan.price || 0) === 0
                        ? "Free"
                        : `ETB ${formatEtb(Number(plan.price || 0))}`}
                      <span className="ml-1 text-[11px] font-medium text-gray-400">
                        / {plan.duration_days ?? 30}d
                      </span>
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                      <div className="flex justify-between gap-2 border-b border-dashed border-gray-100 pb-1.5">
                        <dt className="text-gray-400">Products</dt>
                        <dd className="font-semibold text-gray-700">
                          {formatProductLimit(plan)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-dashed border-gray-100 pb-1.5">
                        <dt className="text-gray-400">Featured</dt>
                        <dd className="font-semibold text-gray-700">
                          {plan.max_featured_products === -1
                            ? "Unlimited"
                            : plan.max_featured_products}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">Staff</dt>
                        <dd className="font-semibold text-gray-700">
                          {(plan.max_staff_members ?? 5) === -1
                            ? "Unlimited"
                            : (plan.max_staff_members ?? 5)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-gray-400">Subscribers</dt>
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
                      Edit plan
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
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Period</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5">Featured</th>
                  <th className="px-4 py-3.5">Staff</th>
                  <th className="px-4 py-3.5">Subscribers</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonRow key={index} />
                  ))
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-900">
                          No plans yet
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Create your first subscription plan to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => {
                    const subscribers = companySubscriptions.filter(
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
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-900">
                            {Number(plan.price || 0) === 0
                              ? "Free"
                              : `ETB ${formatEtb(Number(plan.price || 0))}`}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-secondary">
                          {plan.duration_days ?? 30} days
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {formatProductLimit(plan)}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {plan.max_featured_products === -1
                            ? "Unlimited"
                            : plan.max_featured_products}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {(plan.max_staff_members ?? 5) === -1
                            ? "Unlimited"
                            : (plan.max_staff_members ?? 5)}
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
                            {plan.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleEditClick(plan)}
                            aria-label={`Edit ${plan.name}`}
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
                Company subscriptions
              </h2>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 sm:px-3 sm:py-1 sm:text-xs">
              {companySubscriptions.length} total
            </span>
          </div>

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
                    placeholder="Search company"
                  />
                </div>

                <div className="relative shrink-0" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((v) => !v)}
                    aria-label="Filter by plan"
                    className={`inline-flex h-[32px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition text-secondary sm:px-3.5 sm:text-sm ${
                      planFilter !== "all"
                        ? "border-secondary/30 bg-secondary/[0.08] text-secondary"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Filter className="h-4 w-4 " />
                    <span className="hidden max-w-[100px] truncate sm:inline">
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
                        className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-900/5"
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
                            <span>All plans</span>
                            {planFilter === "all" && (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          {plans.map((plan) => {
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
                                <span className="truncate">{plan.name}</span>
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
                              Clear all filters
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 sm:px-5 sm:py-3.5">Company</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Plan</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Started</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Extra Free</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Expires</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Days Left</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Sub Status</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Store Access</th>
                  <th className="px-4 py-3 text-right sm:px-5 sm:py-3.5">
                    Actions
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
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-900">
                          No subscriptions found
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {hasActiveFilters
                            ? "Try adjusting your filters."
                            : "Subscriptions will appear here."}
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
                              {sub.company_name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                            <span className="font-semibold text-gray-900">
                              {sub.company_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 sm:px-4 sm:py-4">
                          <span
                            className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${getPlanColor(
                              sub.plan?.name,
                            )}`}
                          >
                            {sub.plan?.name || "Unknown"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-gray-500 sm:px-4 sm:py-4 sm:text-sm">
                          {new Date(sub.start_date).toLocaleDateString()}
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
                          {sub.effective_end_date
                            ? new Date(
                                sub.effective_end_date,
                              ).toLocaleDateString()
                            : sub.end_date
                              ? new Date(sub.end_date).toLocaleDateString()
                              : "Lifetime"}
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
                            {isSubscriptionActive ? "Active" : "Expired"}
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
                                isStoreActive ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {isStoreActive ? "Live" : "Inactive"}
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
                              Deal / Free Days
                            </span>
                            <span className="sm:hidden">Deal</span>
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
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                  {editingPlan ? "Edit plan" : "New plan"}
                </h3>
                {selectedDocumentBaseline && (
                  <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
                    {selectedDocumentBaseline.name} ·{" "}
                    {selectedDocumentBaseline.positioning}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
                      Plan name
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
                          // Only auto-fill when the current value matches the
                          // baseline default (i.e. the admin hasn't customised
                          // it) OR is empty/zero.
                          const autoLimit = newBaseline?.expectedProductLimit;
                          const oldAuto = oldBaseline?.expectedProductLimit;

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
                      placeholder="Advanced"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Price (ETB)
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
                      Period (Days)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_days: parseInt(e.target.value, 10) || 30,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    placeholder="Short vendor-facing description"
                  />
                </div>

                {selectedDocumentBaseline && (
                  <div className="grid gap-3 rounded-xl border border-secondary/10 bg-secondary/[0.025] px-4 py-3 text-xs text-gray-600 sm:grid-cols-3">
                    <div>
                      <span className="text-gray-400">V1.0 price</span>
                      <p className="mt-0.5 font-semibold text-gray-800">
                        {selectedDocumentBaseline.monthlyPrice === 0
                          ? "Free"
                          : `ETB ${formatEtb(
                              selectedDocumentBaseline.monthlyPrice,
                            )}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Products</span>
                      <p className="mt-0.5 font-semibold text-gray-800">
                        {selectedDocumentBaseline.productListing}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Staff</span>
                      <p className="mt-0.5 font-semibold text-gray-800">
                        {selectedDocumentBaseline.staff}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Product limit
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.max_products}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_products: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                    />
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
                      {selectedDocumentBaseline?.expectedProductLimit === -1
                        ? "Premium: unlimited (-1)"
                        : selectedDocumentBaseline?.expectedProductLimit != null
                          ? `${selectedDocumentBaseline.name}: ${selectedDocumentBaseline.expectedProductLimit}`
                          : selectedDocumentBaseline?.tier === "free"
                            ? "Free: limited (cap not specified in V1.0)"
                            : "-1 = unlimited"}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Featured limit
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
                      0 = none · -1 = unlimited
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                      Staff limit
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
                      -1 = unlimited
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Active
                      </p>
                      <p className="text-xs text-gray-500">
                        Available for subscription.
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

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3.5 backdrop-blur sm:static sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-form"
                disabled={isSaving}
                className="h-10 rounded-xl bg-secondary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========== DEAL MODAL ========== */}
      {dealModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isSavingDeal && setDealModalOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/[0.08] text-secondary sm:h-10 sm:w-10">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">
                    Subscription Deal & Free Days
                  </h3>
                  <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                    {selectedSub.company_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDealModalOpen(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="flex-1 overflow-y-auto">
              <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                {dealError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    {dealError}
                  </div>
                )}

                <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 text-xs text-gray-600 sm:p-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-400">Current Plan:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedSub.plan?.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-400">Started:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(selectedSub.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-400">Store Status:</span>
                    <span
                      className={`font-semibold ${
                        selectedSub.company_is_active
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {selectedSub.company_is_active
                        ? "Active (Live on App)"
                        : "Inactive (Hidden on App)"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Assign Subscription Plan
                  </label>
                  <select
                    value={dealFormData.plan_id}
                    onChange={(e) =>
                      setDealFormData({
                        ...dealFormData,
                        plan_id: e.target.value,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} (
                        {Number(p.price) === 0
                          ? "Free"
                          : `ETB ${p.price}`}{" "}
                        · {p.duration_days ?? 30} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Extra Free Days Granted
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Negotiated bonus duration
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
                    className="h-10 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:h-11"
                  />

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[7, 14, 30, 45, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() =>
                          setDealFormData({
                            ...dealFormData,
                            additional_free_days:
                              (Number(dealFormData.additional_free_days) ||
                                0) + days,
                          })
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition hover:bg-secondary/10 hover:text-secondary"
                      >
                        +{days}d
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
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100"
                    >
                      Reset to 0
                    </button>
                  </div>
                </div>

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
                    <div className="rounded-xl border border-secondary/15 bg-secondary/[0.03] p-3.5 text-xs">
                      <div className="mb-1 flex items-center gap-2 font-bold text-secondary">
                        <Sparkles className="h-4 w-4" />
                        <span>Calculated Expiration Preview</span>
                      </div>
                      <p className="text-gray-700">
                        Total Period: <strong>{totalD} days</strong> ({pDays}d
                        plan + {dealFormData.additional_free_days}d bonus)
                      </p>
                      <p className="mt-1 text-gray-700">
                        New Expiry Date:{" "}
                        <strong>{previewEndD.toLocaleDateString()}</strong> (
                        {remainingD} days from now)
                      </p>
                    </div>
                  );
                })()}

                <div className="rounded-xl border border-gray-200 p-3.5">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-gray-900">
                        Company Store Active
                      </span>
                      <span className="text-[11px] text-gray-500">
                        When enabled, store and products are visible on Elilita
                        superapp.
                      </span>
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
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-secondary focus:ring-secondary"
                    />
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-3.5 backdrop-blur sm:static sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={() => setDealModalOpen(false)}
                  disabled={isSavingDeal}
                  className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDeal}
                  className="h-10 rounded-xl bg-secondary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:opacity-60"
                >
                  {isSavingDeal ? "Applying Deal…" : "Apply Deal & Save"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}