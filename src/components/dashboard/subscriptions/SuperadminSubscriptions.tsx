import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Edit, CreditCard, Building2, Download, AlertCircle, X, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import {
  getAdminSubscriptionPlans,
  getAdminCompanySubscriptions,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
} from "../../../services/api";
import { SearchInput } from "../../ui/SearchInput";
import { TableControls } from "../../ui/TableControls";
import { Pagination } from "../../ui/Pagination";
import { CustomSelect } from "../../ui/CustomSelect";
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
    <td className="px-5 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-24" /></td>
    <td className="px-4 py-3.5"><div className="h-5 bg-secondary/[0.08] rounded w-16" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-20" /></td>
    <td className="px-4 py-3.5"><div className="h-4 bg-secondary/[0.08] rounded w-20" /></td>
    <td className="px-5 py-3.5"><div className="h-5 w-16 bg-secondary/[0.08] rounded-full" /></td>
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

const getConfiguredProductLimit = (plan: any): number | null => {
  const raw = plan?.max_products;
  if (raw === null || raw === undefined || raw === "") return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const getProductLimitForPlan = (plan: any): number | null => {
  const baseline = getDocumentBaseline(plan);

  if (baseline?.expectedProductLimit !== null && baseline?.expectedProductLimit !== undefined) {
    return baseline.expectedProductLimit;
  }

  return getConfiguredProductLimit(plan);
};

const formatProductLimit = (plan: any): string => {
  const baseline = getDocumentBaseline(plan);
  const limit = getProductLimitForPlan(plan);

  if (baseline?.tier === "free") return "Limited";

  if (limit === -1) return "Unlimited";
  if (limit === null) return "—";
  return formatEtb(limit);
};

const hasAnyAdvertisingPlacement = (plan: any) =>
  Boolean(
    plan?.can_ad_company_detail ||
      plan?.can_ad_companies_list ||
      plan?.can_ad_home_page,
  );

const getDocumentIssues = (
  plan: any,
  baseline: DocumentPlanBaseline,
): string[] => {
  const issues: string[] = [];
  const price = Number(plan?.price ?? 0);
  const featuredLimit = Number(plan?.max_featured_products ?? 0);
  const productLimit = Number(plan?.max_products ?? 0);
  const hasAds = hasAnyAdvertisingPlacement(plan);

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
    if (productLimit <= 0 || productLimit === -1) {
      issues.push("Free product listing should be a positive limited amount");
    }
  } else if (productLimit !== baseline.expectedProductLimit) {
    issues.push(
      baseline.expectedProductLimit === -1
        ? "Premium product listing should be unlimited (-1)"
        : `${baseline.name} product limit should be ${baseline.expectedProductLimit}`,
    );
  }

  if (baseline.tier === "free") {
    if (featuredLimit !== 0) issues.push("Free does not include featured products");
    if (hasAds) issues.push("Free does not include advertising opportunities");
  }

  if (baseline.tier === "basic") {
    if (featuredLimit !== 0) issues.push("Basic does not include featured products");
    if (!hasAds) issues.push("Basic should allow paid advertising opportunities");
  }

  if (baseline.tier === "advanced") {
    if (featuredLimit <= 0) issues.push("Advanced includes featured products");
    if (!hasAds) issues.push("Advanced includes advertising opportunities");
  }

  if (baseline.tier === "premium") {
    if (featuredLimit <= 0) issues.push("Premium includes priority featured products");
    if (!hasAds) issues.push("Premium includes priority advertising opportunities");
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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ========== CHECK IF ANY FILTERS ARE ACTIVE ==========
  const hasActiveFilters = useMemo(() => {
    return inputValue.trim() !== "" || planFilter !== "all";
  }, [inputValue, planFilter]);

  // ========== CLEAR ALL FILTERS ==========
  const clearAllFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setPlanFilter("all");
  };

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
    can_ad_company_detail: false,
    can_ad_companies_list: false,
    can_ad_home_page: false,
    max_featured_products: 0,
    max_products: 0,
    max_staff_members: 5,
    is_active: true,
  });

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
        sub.company_name?.toLowerCase().includes(term)
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

  // ========== HANDLE SEARCH INPUT ==========
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleEditClick = (plan: any) => {
    setSaveError("");
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: parseFloat(plan.price),
      can_ad_company_detail: plan.can_ad_company_detail,
      can_ad_companies_list: plan.can_ad_companies_list,
      can_ad_home_page: plan.can_ad_home_page,
      max_featured_products: plan.max_featured_products,
      max_products: getProductLimitForPlan(plan) ?? 0,
      max_staff_members: plan.max_staff_members ?? 5,
      is_active: plan.is_active,
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
      can_ad_company_detail: false,
      can_ad_companies_list: false,
      can_ad_home_page: false,
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
      if (editingPlan) {
        await updateAdminSubscriptionPlan(editingPlan.id, formData);
      } else {
        await createAdminSubscriptionPlan(formData);
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
      "Detail Ad",
      "List Ad",
      "Home Ad",
      "Status",
      "Subscribers",
    ];

    const rows = plans.map((plan) => [
      plan.name,
      plan.price,
      formatProductLimit(plan),
      plan.max_featured_products === -1 ? "Unlimited" : plan.max_featured_products,
      plan.can_ad_company_detail ? "Yes" : "No",
      plan.can_ad_companies_list ? "Yes" : "No",
      plan.can_ad_home_page ? "Yes" : "No",
      plan.is_active ? "Active" : "Inactive",
      companySubscriptions.filter((sub) => sub.plan?.id === plan.id).length,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `subscription_plans_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const activePlans = plans.filter((plan) => plan.is_active).length;
  const activeSubscriptions = companySubscriptions.filter(
    (subscription) => subscription.is_active && !subscription.is_expired,
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
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
          className="mb-0"
        />

        {/* ✅ Page error — refined alert */}
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
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Active plans", value: isLoading ? "—" : activePlans, icon: CreditCard },
            { label: "Active subscriptions", value: isLoading ? "—" : activeSubscriptions, icon: Building2 },
            { label: "V1.0 aligned", value: isLoading ? "—" : `${documentMatchCount}/4`, icon: Sparkles },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-secondary/[0.04] transition group-hover:bg-secondary/[0.06]" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{stat.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ========== PLAN STANDARDS ========== */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Plan standards</h2>
                <p className="mt-0.5 text-xs text-gray-500">Vendor Subscription Plan V1.0</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500"
                  style={{ width: `${(documentMatchCount / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700">{documentMatchCount}/4 aligned</span>
            </div>
          </div>

          <div className="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-4">
            {documentAlignment.map((item) => {
              const isMatch = item.status === "match";
              const isMissing = item.status === "missing";

              return (
                <article
                  key={item.tier}
                  className="group relative bg-white p-5 transition hover:bg-gray-50/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                        <span className="text-xs font-semibold text-gray-500">
                          {item.monthlyPrice === 0 ? "Free" : `ETB ${formatEtb(item.monthlyPrice)}/mo`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{item.positioning}</p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${
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

                  <dl className="mt-5 space-y-2.5 text-xs">
                    {[
                      ["Products", item.productListing],
                      ["Staff", item.staff],
                      ["Featured", item.featuredProducts],
                      ["Ads", item.advertising],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-3 border-b border-dashed border-gray-100 pb-2.5 last:border-0 last:pb-0">
                        <dt className="shrink-0 text-gray-400">{label}</dt>
                        <dd className="text-right font-semibold text-gray-700">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {item.status === "review" && item.issues.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <p className="text-[11px] leading-relaxed text-amber-800">
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

        {/* ========== PLANS TABLE ========== */}
        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary">
                <CreditCard className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Plans</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {plans.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5">Featured</th>
                  <th className="px-4 py-3.5">Staff</th>
                  <th className="px-4 py-3.5">Ads</th>
                  <th className="px-4 py-3.5">Subscribers</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-900">No plans yet</p>
                        <p className="mt-1 text-xs text-gray-500">Create your first subscription plan to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => {
                    const adsCount = [
                      plan.can_ad_company_detail,
                      plan.can_ad_companies_list,
                      plan.can_ad_home_page,
                    ].filter(Boolean).length;
                    const subscribers = companySubscriptions.filter((sub) => sub.plan?.id === plan.id).length;

                    return (
                      <tr key={plan.id} className="group text-sm text-gray-700 transition hover:bg-gray-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full bg-secondary/40 ring-4 ring-secondary/[0.06]" />
                            <span className="font-semibold text-gray-900">{plan.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-900">
                            {Number(plan.price || 0) === 0 ? "Free" : `ETB ${formatEtb(Number(plan.price || 0))}`}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {formatProductLimit(plan)}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {plan.max_featured_products === -1 ? "Unlimited" : plan.max_featured_products}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {(plan.max_staff_members ?? 5) === -1 ? "Unlimited" : (plan.max_staff_members ?? 5)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                            {adsCount}/3
                          </span>
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
                            <span className={`h-1.5 w-1.5 rounded-full ${plan.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/[0.06] text-secondary">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Company subscriptions</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {companySubscriptions.length} total
            </span>
          </div>

          <div className="border-b border-gray-100 bg-gray-50/40 px-5 py-3.5 sm:px-6">
            <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
              <div className="flex w-full flex-col gap-2.5 sm:flex-row">
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
                <div className="w-full sm:w-52">
                  <CustomSelect
                    value={planFilter}
                    onChange={setPlanFilter}
                    placeholder="Plan"
                    options={[
                      { value: "all", label: "All plans" },
                      ...plans.map((plan) => ({ value: String(plan.id), label: plan.name })),
                    ]}
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex h-[42px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </TableControls>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-4 py-3.5">Plan</th>
                  <th className="px-4 py-3.5">Started</th>
                  <th className="px-4 py-3.5">Ends</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => <SkeletonSubscriptionRow key={index} />)
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-900">No subscriptions found</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {hasActiveFilters ? "Try adjusting your filters." : "Subscriptions will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((sub) => {
                    const isSubscriptionActive = sub.is_active && !sub.is_expired;
                    return (
                      <tr key={sub.id} className="group text-sm text-gray-700 transition hover:bg-gray-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/[0.06] text-xs font-bold text-secondary">
                              {sub.company_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="font-semibold text-gray-900">{sub.company_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${getPlanColor(sub.plan?.name)}`}>
                            {sub.plan?.name || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {new Date(sub.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "Lifetime"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${
                              isSubscriptionActive
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-gray-50 text-gray-500 ring-gray-300"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isSubscriptionActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                            {isSubscriptionActive ? "Active" : "Expired"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3.5 sm:px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </section>
      </div>

      {/* ========== MODAL ========== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingPlan ? "Edit plan" : "New plan"}
                </h3>
                {selectedDocumentBaseline && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selectedDocumentBaseline.name} · {selectedDocumentBaseline.positioning}
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

            <div className="overflow-y-auto px-6 py-5">
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-5">
                {/* ✅ Save error */}
                {saveError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    {saveError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Plan name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const baseline = getDocumentBaseline({ name });
                        setFormData((current) => ({
                          ...current,
                          name,
                          ...(baseline?.expectedProductLimit !== null &&
                          baseline?.expectedProductLimit !== undefined
                            ? { max_products: baseline.expectedProductLimit }
                            : {}),
                        }));
                      }}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                      placeholder="Advanced"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Price (ETB)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                          : `ETB ${formatEtb(selectedDocumentBaseline.monthlyPrice)}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Products</span>
                      <p className="mt-0.5 font-semibold text-gray-800">{selectedDocumentBaseline.productListing}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Staff</span>
                      <p className="mt-0.5 font-semibold text-gray-800">{selectedDocumentBaseline.staff}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Product limit</label>
                    <input
                      type="number"
                      required
                      value={formData.max_products}
                      onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value, 10) || 0 })}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
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
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Featured limit</label>
                    <input
                      type="number"
                      required
                      value={formData.max_featured_products}
                      onChange={(e) => setFormData({ ...formData, max_featured_products: parseInt(e.target.value, 10) || 0 })}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    />
                    <p className="mt-1.5 text-[11px] text-gray-400">0 = none · -1 = unlimited</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Staff limit</label>
                    <input
                      type="number"
                      required
                      value={formData.max_staff_members}
                      onChange={(e) => setFormData({ ...formData, max_staff_members: parseInt(e.target.value, 10) || 0 })}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    />
                    <p className="mt-1.5 text-[11px] text-gray-400">-1 = unlimited</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Active</p>
                      <p className="text-xs text-gray-500">Available for subscription.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-700">Advertising</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ["Company page", "can_ad_company_detail"],
                      ["Company list", "can_ad_companies_list"],
                      ["Home page", "can_ad_home_page"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-medium text-gray-700 transition hover:border-secondary/30 hover:bg-secondary/[0.03]"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(formData[key as keyof typeof formData])}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
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
    </div>
  );
}