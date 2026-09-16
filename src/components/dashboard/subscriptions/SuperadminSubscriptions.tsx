import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Edit, CreditCard, Building2, Download, AlertCircle, X } from "lucide-react";
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

// ========== LOADING SKELETON ==========
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 hidden xs:table-cell"><div className="h-4 bg-gray-200 rounded w-12" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden sm:table-cell"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden lg:table-cell"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden xl:table-cell"><div className="h-5 w-5 bg-gray-200 rounded-full mx-auto" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden sm:table-cell"><div className="h-5 w-16 bg-gray-200 rounded-full mx-auto" /></td>
    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-right"><div className="h-5 w-5 bg-gray-200 rounded ml-auto" /></td>
  </tr>
);

const SkeletonSubscriptionRow = () => (
  <tr className="animate-pulse">
    <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
    <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-5 bg-gray-200 rounded w-16" /></td>
    <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
    <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
    <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
  </tr>
);

// ========== PLAN COLOR MAPPING ==========
const getPlanColor = (planName: string): string => {
  const name = planName?.toLowerCase() || "";

  // Basic plans
  if (name.includes("basic") || name.includes("free")) {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }
  // Starter plans
  if (name.includes("starter") || name.includes("beginner")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  // Professional plans
  if (name.includes("professional") || name.includes("pro")) {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }
  // Premium plans
  if (name.includes("premium") || name.includes("advanced")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  // Enterprise plans
  if (name.includes("enterprise") || name.includes("corporate")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  // Default fallback
  return "bg-indigo-100 text-indigo-700 border-indigo-200";
};

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
// Numeric limits below are taken only where the PDF explicitly defines them.
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
    // Legacy backend aliases are compared against the PDF's Advanced tier.
    return "advanced";
  }
  if (name.includes("basic")) return "basic";
  if (name.includes("free") || name.includes("starter")) return "free";

  // Do not infer a document tier from price alone; custom plans can share a price.
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

  // For the standard paid plans, the approved V1.0 document is the source of truth.
  if (baseline?.expectedProductLimit !== null && baseline?.expectedProductLimit !== undefined) {
    return baseline.expectedProductLimit;
  }

  // Free is only described as "Limited" in the document, so keep its configured cap.
  return getConfiguredProductLimit(plan);
};

const formatProductLimit = (plan: any): string => {
  const baseline = getDocumentBaseline(plan);
  const limit = getProductLimitForPlan(plan);

  // V1.0 defines Free qualitatively as Limited, without an approved numeric cap.
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

  // The PDF gives exact product caps for Basic (100), Advanced (500)
  // and Premium (unlimited). Free is only described as "Limited".
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
    return (
      inputValue.trim() !== "" ||
      planFilter !== "all"
    );
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

    // Search by company name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter((sub) =>
        sub.company_name?.toLowerCase().includes(term)
      );
    }

    // Filter by Plan
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

  // Reset page when filters change
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
    <div className="mx-auto w-full max-w-[1440px] space-y-5 px-3 pb-8 pt-2 sm:px-5 lg:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary/55">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-gray-500">Plans and company subscriptions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportPlans}
            disabled={isLoading || plans.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary-dark"
          >
            <Plus className="h-4 w-4" />
            New plan
          </button>
        </div>
      </header>

      {pageError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {pageError}
          </span>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="font-semibold hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Active plans</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">{isLoading ? "—" : activePlans}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Active subscriptions</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">
            {isLoading ? "—" : activeSubscriptions}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">V1.0 aligned</p>
          <p className="mt-1 text-2xl font-bold text-gray-950">
            {isLoading ? "—" : `${documentMatchCount}/4`}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="text-sm font-bold text-gray-950">Plan standards</h2>
            <p className="mt-0.5 text-xs text-gray-500">Vendor Subscription Plan V1.0</p>
          </div>
          <span className="rounded-full bg-secondary/[0.07] px-2.5 py-1 text-xs font-semibold text-secondary">
            {documentMatchCount}/4 aligned
          </span>
        </div>

        <div className="grid gap-px bg-gray-100 sm:grid-cols-2 xl:grid-cols-4">
          {documentAlignment.map((item) => (
            <article key={item.tier} className="bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-sm font-bold text-gray-950">{item.name}</h3>
                    <span className="text-xs font-semibold text-gray-500">
                      {item.monthlyPrice === 0 ? "Free" : `ETB ${formatEtb(item.monthlyPrice)}/mo`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{item.positioning}</p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                    item.status === "match"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "missing"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.status === "match" ? "Aligned" : item.status === "missing" ? "Missing" : "Review"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-gray-400">Products</dt>
                  <dd className="mt-0.5 font-semibold text-gray-700">{item.productListing}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Staff</dt>
                  <dd className="mt-0.5 font-semibold text-gray-700">{item.staff}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Featured</dt>
                  <dd className="mt-0.5 font-semibold text-gray-700">{item.featuredProducts}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Ads</dt>
                  <dd className="mt-0.5 font-semibold text-gray-700">{item.advertising}</dd>
                </div>
              </dl>

              {item.status === "review" && item.issues.length > 0 && (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-700">
                  {item.issues.join(" · ")}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-bold text-gray-950">Plans</h2>
          </div>
          <span className="text-xs font-medium text-gray-400">{plans.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-gray-50/80">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Ads</th>
                <th className="px-4 py-3">Subscribers</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-500">
                    No plans yet.
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
                    <tr key={plan.id} className="text-sm text-gray-700 transition hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${getPlanColor(plan.name).split(" ")[0]}`} />
                          <span className="font-semibold text-gray-950">{plan.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        {Number(plan.price || 0) === 0 ? "Free" : `ETB ${formatEtb(Number(plan.price || 0))}`}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-secondary">
                        {formatProductLimit(plan)}
                      </td>
                      <td className="px-4 py-3.5">
                        {plan.max_featured_products === -1 ? "Unlimited" : plan.max_featured_products}
                      </td>
                      <td className="px-4 py-3.5">{adsCount}/3</td>
                      <td className="px-4 py-3.5">{subscribers}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            plan.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditClick(plan)}
                          aria-label={`Edit ${plan.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-secondary/10 hover:text-secondary"
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

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-bold text-gray-950">Company subscriptions</h2>
          </div>
          <span className="text-xs font-medium text-gray-400">{companySubscriptions.length} total</span>
        </div>

        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
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
              <div className="w-full sm:w-48">
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
                  className="h-[42px] rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </TableControls>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-gray-50/80">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Company</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Ends</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => <SkeletonSubscriptionRow key={index} />)
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((sub) => {
                  const isSubscriptionActive = sub.is_active && !sub.is_expired;
                  return (
                    <tr key={sub.id} className="text-sm text-gray-700 transition hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-semibold text-gray-950">{sub.company_name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${getPlanColor(sub.plan?.name)}`}>
                          {sub.plan?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : "Lifetime"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            isSubscriptionActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
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
          <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-gray-950">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-5">
                {saveError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
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
                  <div className="grid gap-2 rounded-xl border border-secondary/10 bg-secondary/[0.025] px-3.5 py-3 text-xs text-gray-600 sm:grid-cols-3">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">Product limit</label>
                    <input
                      type="number"
                      required
                      value={formData.max_products}
                      onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value, 10) || 0 })}
                      className="h-11 w-full rounded-xl border border-gray-200 px-3.5 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
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
                    <p className="mt-1 text-[11px] text-gray-400">0 = none · -1 = unlimited</p>
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
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
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

            <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:px-6">
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
                className="h-10 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-60"
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
