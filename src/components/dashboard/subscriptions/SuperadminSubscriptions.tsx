import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Edit, CheckCircle2, XCircle, CreditCard, Building2 } from "lucide-react";
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
  purpose: string;
  positioning: string;
  storefront: string;
  inventoryOrders: string;
  analytics: string;
  marketingVisibility: string;
  featuredProducts: string;
  staffSupport: string;
};

const DOCUMENT_PLAN_BASELINES: DocumentPlanBaseline[] = [
  {
    tier: "free",
    name: "Free",
    monthlyPrice: 0,
    purpose: "Start",
    positioning: "Start Selling",
    storefront: "Basic",
    inventoryOrders: "Basic",
    analytics: "Basic dashboard",
    marketingVisibility: "Not included",
    featuredProducts: "Not included",
    staffSupport: "Standard support",
  },
  {
    tier: "basic",
    name: "Basic",
    monthlyPrice: 499,
    purpose: "Grow",
    positioning: "Grow Your Store",
    storefront: "Professional",
    inventoryOrders: "Full / standard",
    analytics: "Basic",
    marketingVisibility: "Limited / paid ads",
    featuredProducts: "Not included",
    staffSupport: "Limited staff + priority support",
  },
  {
    tier: "advanced",
    name: "Advanced",
    monthlyPrice: 1000,
    purpose: "Scale",
    positioning: "Scale Your Business",
    storefront: "Advanced",
    inventoryOrders: "Advanced",
    analytics: "Advanced",
    marketingVisibility: "Included",
    featuredProducts: "Included",
    staffSupport: "Multiple staff + priority support",
  },
  {
    tier: "premium",
    name: "Premium",
    monthlyPrice: 2000,
    purpose: "Maximize",
    positioning: "Maximize Your Business",
    storefront: "Premium",
    inventoryOrders: "Advanced",
    analytics: "Advanced / premium insights",
    marketingVisibility: "Priority",
    featuredProducts: "Priority",
    staffSupport: "Multiple staff + dedicated support",
  },
];

const resolveDocumentTier = (plan: any): DocumentTier | null => {
  const name = String(plan?.name || "").trim().toLowerCase();
  const price = Number(plan?.price ?? 0);
  if (name.includes("premium") || name.includes("enterprise")) return "premium";
  if (name.includes("advanced") || name.includes("professional") || name === "pro") return "advanced";
  if (name.includes("basic")) return "basic";
  if (name.includes("free") || name.includes("starter") || price === 0) return "free";
  return null;
};

const formatEtb = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

const getDocumentBaseline = (plan: any): DocumentPlanBaseline | null => {
  const tier = resolveDocumentTier(plan);

  return (
    DOCUMENT_PLAN_BASELINES.find((item) => item.tier === tier) ||
    null
  );
};

export default function SuperadminSubscriptions() {
  const [plans, setPlans] = useState<any[]>([]);
  const [companySubscriptions, setCompanySubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const plan = plans.find((candidate) => resolveDocumentTier(candidate) === baseline.tier);

      if (!plan) {
        return { ...baseline, plan: null, status: "missing" as const };
      }

      const currentPrice = Number(plan.price || 0);
      return {
        ...baseline,
        plan,
        status: currentPrice === baseline.monthlyPrice
          ? ("aligned" as const)
          : ("price_mismatch" as const),
      };
    });
  }, [plans]);

  const documentAlignedCount = documentAlignment.filter(
    (item) => item.status === "aligned",
  ).length;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    can_ad_company_detail: true,
    can_ad_companies_list: false,
    can_ad_home_page: false,
    max_featured_products: 0,
    max_products: 15,
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
    try {
      const [plansRes, subsRes] = await Promise.all([
        getAdminSubscriptionPlans(),
        getAdminCompanySubscriptions(),
      ]);
      setPlans(plansRes.data?.results || plansRes.data || []);
      setCompanySubscriptions(subsRes.data?.results || subsRes.data || []);
    } catch (error) {
      console.error("Error fetching admin subscription data", error);
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
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: parseFloat(plan.price),
      can_ad_company_detail: plan.can_ad_company_detail,
      can_ad_companies_list: plan.can_ad_companies_list,
      can_ad_home_page: plan.can_ad_home_page,
      max_featured_products: plan.max_featured_products,
      max_products: plan.max_products !== undefined ? plan.max_products : 15,
      is_active: plan.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      can_ad_company_detail: true,
      can_ad_companies_list: false,
      can_ad_home_page: false,
      max_featured_products: 0,
      max_products: 15,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updateAdminSubscriptionPlan(editingPlan.id, formData);
      } else {
        await createAdminSubscriptionPlan(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving plan", error);
      alert("Failed to save plan. Please check the inputs.");
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-full">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="px-2 sm:px-3 md:px-4 lg:px-6 pt-1 pb-2 max-w-7xl mx-auto space-y-1 sm:space-y-2 md:space-y-3">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="h-8 sm:h-10 w-1 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
        ) : (
          <div className="h-8 sm:h-10 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/20 flex-shrink-0" />
        )}
        {isLoading ? (
          <div className="flex-1 animate-pulse">
            <div className="h-6 sm:h-7 md:h-8 bg-gray-200 rounded w-48 sm:w-64 mb-1" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-80" />
          </div>
        ) : (
          <div>
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-secondary">Subscription Management</h1>
            <p className="text-[10px] sm:text-xs text-secondary/60">Manage pricing tiers and view active company subscriptions.</p>
          </div>
        )}
      </div>

      {/* V1.0 subscription document alignment */}
      <section className="overflow-hidden rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
        <div className="flex flex-col gap-2 border-b border-secondary/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/60">Vendor Subscription Plan V1.0</p>
            <h2 className="mt-0.5 text-sm font-bold text-gray-900">Launch pricing alignment</h2>
          </div>
          <span className="w-fit rounded-full bg-secondary/[0.06] px-2 py-1 text-[9px] font-semibold text-secondary">
            {documentAlignedCount}/4 prices aligned
          </span>
        </div>

        <div className="grid gap-px bg-secondary/[0.07] sm:grid-cols-2 xl:grid-cols-4">
          {documentAlignment.map((item) => (
            <div key={item.tier} className="bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-900">{item.name}</p>
                  <p className="mt-0.5 text-[9px] text-gray-400">{item.positioning}</p>
                </div>
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                  item.status === "aligned"
                    ? "bg-secondary/[0.07] text-secondary"
                    : item.status === "missing"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-secondary/[0.035] text-secondary"
                }`}>
                  {item.status === "aligned" ? "Aligned" : item.status === "missing" ? "Missing" : "Review price"}
                </span>
              </div>

              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.08em] text-gray-400">V1.0 monthly</p>
                  <p className="mt-0.5 text-xs font-extrabold text-secondary">
                    {item.monthlyPrice === 0 ? "Free" : `ETB ${formatEtb(item.monthlyPrice)}`}
                  </p>
                </div>
                {item.plan && (
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-[0.08em] text-gray-400">Current</p>
                    <p className="mt-0.5 text-[10px] font-bold text-gray-700">
                      {Number(item.plan.price || 0) === 0 ? "Free" : `ETB ${formatEtb(Number(item.plan.price || 0))}`}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[9px] text-gray-500">
                Purpose: {item.purpose}
              </p>

              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-secondary/[0.07] pt-2.5">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                    Storefront
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-700">
                    {item.storefront}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                    Orders / Inventory
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-700">
                    {item.inventoryOrders}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                    Analytics
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-700">
                    {item.analytics}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                    Marketing
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-700">
                    {item.marketingVisibility}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                    Featured
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-700">
                    {item.featuredProducts}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                    Staff / Support
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-semibold text-gray-700">
                    {item.staffSupport}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Plans Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center gap-1.5 sm:gap-2 animate-pulse">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded" />
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40" />
            </div>
          ) : (
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-secondary flex items-center gap-1.5 sm:gap-2">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
              <span>Subscription Plans</span>
            </h2>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Export plans data
                const headers = ['Plan Name', 'Price', 'Public Products Limit', 'Featured Limit', 'Detail Ad', 'List Ad', 'Home Ad', 'Status', 'Subscribers'];
                const rows = plans.map(p => [
                  p.name,
                  p.price,
                  p.max_products === -1 ? 'Unlimited' : (p.max_products ?? 15),
                  p.max_featured_products === -1 ? 'Unlimited' : p.max_featured_products,
                  p.can_ad_company_detail ? 'Yes' : 'No',
                  p.can_ad_companies_list ? 'Yes' : 'No',
                  p.can_ad_home_page ? 'Yes' : 'No',
                  p.is_active ? 'Active' : 'Inactive',
                  companySubscriptions.filter(s => s.plan?.id === p.id).length
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `subscription_plans_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-secondary/80 hover:text-secondary hover:bg-secondary/15 bg-secondary/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors flex items-center gap-1 sm:gap-1.5 border border-secondary/20 hover:border-secondary/40 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden xs:inline">Export</span>
              <span className="xs:hidden">📤</span>
            </button>
            <button
              onClick={handleCreateClick}
              className="bg-secondary text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-medium flex items-center gap-1 sm:gap-2 hover:bg-secondary-dark transition-all"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              New Plan
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm shadow-sm">
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Plan Name
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Price
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap hidden xs:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Public Limit
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap hidden xs:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Featured Limit
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Detail Ad
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    List Ad
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Home Ad
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Status
                  </span>
                </th>
                <th className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-right text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <CreditCard className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No subscription plans created yet</p>
                      <p className="text-sm text-gray-400 mt-1">Click "New Plan" to create your first pricing tier</p>
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        {plan.name}
                      </div>
                    </td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">{plan.price}</td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 hidden xs:table-cell font-medium text-secondary">{plan.max_products === -1 ? 'Unlimited' : (plan.max_products ?? 15)}</td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 hidden xs:table-cell">{plan.max_featured_products === -1 ? 'Unlimited' : plan.max_featured_products}</td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden sm:table-cell">
                      {plan.can_ad_company_detail ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden lg:table-cell">
                      {plan.can_ad_companies_list ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden xl:table-cell">
                      {plan.can_ad_home_page ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}
                    </td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-center hidden sm:table-cell">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-right">
                      <button
                        onClick={() => handleEditClick(plan)}
                        className="p-1 xs:p-1.5 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* ========== TOTAL REVENUE FOOTER ========== */}
            {/* {plans.length > 0 && (
              <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-700">Total</td>
                  <td className="px-4 py-3 font-bold text-secondary">
                    {plans.reduce((sum, p) => sum + parseFloat(p.price || 0), 0).toFixed(2)} ETB
                  </td>
                  <td colSpan={6}></td>
                </tr>
              </tfoot>
            )} */}
          </table>
        </div>
      </div>

      {/* Active Company Subscriptions Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center gap-1.5 sm:gap-2 animate-pulse">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded" />
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-40 sm:w-48" />
            </div>
          ) : (
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-secondary flex items-center gap-1.5 sm:gap-2">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
              <span>Company Subscriptions</span>
            </h2>
          )}
        </div>

        {/* ========== FILTERS & TABLE CONTROLS ========== */}
        <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4">
          <TableControls pageSize={pageSize} onPageSizeChange={setPageSize}>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <SearchInput
                  value={inputValue}
                  onChange={handleInputChange}
                  debounceMs={0}
                  loading={isLoading}
                  showClearButton={false}
                  placeholder="Search by company name..."
                />
              </div>
              {/* Plan Filter */}
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={planFilter}
                  onChange={setPlanFilter}
                  placeholder="Filter by Plan"
                  options={[
                    { value: "all", label: "All Plans" },
                    ...plans.map((plan) => ({
                      value: String(plan.id),
                      label: plan.name,
                      icon: (
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${getPlanColor(plan.name).split(' ')[0]}`}
                          style={{
                            backgroundColor: getPlanColor(plan.name).includes('gray') ? '#6B7280' :
                              getPlanColor(plan.name).includes('blue') ? '#3B82F6' :
                                getPlanColor(plan.name).includes('purple') ? '#8B5CF6' :
                                  getPlanColor(plan.name).includes('amber') ? '#F59E0B' :
                                    getPlanColor(plan.name).includes('rose') ? '#F43F5E' :
                                      '#6366F1'
                          }}
                        />
                      )
                    })),
                  ]}
                />
              </div>
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex items-center justify-center gap-2 border border-red-500/70 text-red-600 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-50 hover:border-red-600 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/30 active:scale-[0.98] min-h-[42px] w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </TableControls>
        </div>

        {/* ========== TABLE ========== */}
        <div className="overflow-x-auto px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 backdrop-blur-sm shadow-sm">
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Company
                  </span>
                </th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Plan
                  </span>
                </th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Start Date
                  </span>
                </th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    End Date
                  </span>
                </th>
                <th className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-left text-[9px] sm:text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Status
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonSubscriptionRow key={i} />)
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No subscriptions found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((sub) => {
                  const isSubscriptionActive = sub.is_active && !sub.is_expired;
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-bold text-gray-900 text-xs sm:text-sm truncate max-w-[60px] xs:max-w-[80px] sm:max-w-none">
                        {sub.company_name}
                      </td>
                      <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 font-medium">
                        <span className={`px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md text-[9px] xs:text-xs font-semibold border ${getPlanColor(sub.plan?.name)}`}>
                          {sub.plan?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-500 text-[10px] xs:text-xs sm:text-sm">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 text-gray-500 text-[10px] xs:text-xs sm:text-sm">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Lifetime'}
                      </td>
                      <td className="p-2 xs:p-3 sm:px-4 py-2 xs:py-2.5 sm:py-3">
                        <span className={`px-1.5 xs:px-2 py-0.5 xs:py-1 text-[8px] xs:text-[10px] font-bold rounded-full uppercase tracking-wider ${isSubscriptionActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          {isSubscriptionActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========== PAGINATION ========== */}
        {!isLoading && totalPages > 1 && (
          <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-secondary">
                {editingPlan ? 'Edit Subscription Plan' : 'New Subscription Plan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-row">
                   <div className="flex-1 mr-2">
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    placeholder="e.g. Advanced"
                  />
                </div>

                <div className="flex-1 ml-2">
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>
                </div>
               
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-secondary/80">
                      Description
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
                      className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      placeholder="Short description shown to vendors"
                    />
                  </div>

                  {selectedDocumentBaseline && (
                    <div className="rounded-xl border border-secondary/10 bg-secondary/[0.025] p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/60">
                            V1.0 reference
                          </p>

                          <p className="mt-0.5 text-sm font-bold text-gray-900">
                            {selectedDocumentBaseline.name} ·{" "}
                            {selectedDocumentBaseline.positioning}
                          </p>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-[8px] uppercase tracking-[0.08em] text-gray-400">
                            Recommended monthly
                          </p>

                          <p className="mt-0.5 text-xs font-extrabold text-secondary">
                            {selectedDocumentBaseline.monthlyPrice === 0
                              ? "Free"
                              : `ETB ${formatEtb(
                                  selectedDocumentBaseline.monthlyPrice,
                                )}`}
                          </p>
                        </div>
                      </div>

                      {Number(formData.price || 0) !==
                        selectedDocumentBaseline.monthlyPrice && (
                        <div className="mt-2 rounded-lg border border-secondary/10 bg-white px-2.5 py-2 text-[10px] text-gray-600">
                          Current price:{" "}
                          <span className="font-bold text-secondary">
                            {Number(formData.price || 0) === 0
                              ? "Free"
                              : `ETB ${formatEtb(
                                  Number(formData.price || 0),
                                )}`}
                          </span>
                          {" · "}
                          V1.0:{" "}
                          <span className="font-bold text-secondary">
                            {selectedDocumentBaseline.monthlyPrice === 0
                              ? "Free"
                              : `ETB ${formatEtb(
                                  selectedDocumentBaseline.monthlyPrice,
                                )}`}
                          </span>
                        </div>
                      )}

                      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          ["Storefront", selectedDocumentBaseline.storefront],
                          ["Orders / Inventory", selectedDocumentBaseline.inventoryOrders],
                          ["Analytics", selectedDocumentBaseline.analytics],
                          ["Marketing", selectedDocumentBaseline.marketingVisibility],
                          ["Featured", selectedDocumentBaseline.featuredProducts],
                          ["Staff / Support", selectedDocumentBaseline.staffSupport],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-secondary/[0.07] bg-white px-2.5 py-2"
                          >
                            <p className="text-[8px] uppercase tracking-[0.06em] text-gray-400">
                              {label}
                            </p>

                            <p className="mt-0.5 text-[9px] font-semibold leading-4 text-gray-700">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-2 text-[9px] leading-4 text-gray-400">
                        V1.0 guidance only. The saved plan still uses the
                        backend-supported fields below.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Max Public Products</label>
                    <input
                      type="number"
                      required
                      value={formData.max_products}
                      onChange={(e) => setFormData({ ...formData, max_products: parseInt(e.target.value, 10) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-1">Max Featured Products</label>
                    <input
                      type="number"
                      required
                      value={formData.max_featured_products}
                      onChange={(e) => setFormData({ ...formData, max_featured_products: parseInt(e.target.value, 10) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use 0 for none, -1 for unlimited</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-xs sm:text-sm font-bold text-secondary">Plan is Active</span>
                  </label>
                </div>
               

                <div className="space-y-3 pt-2">
                  <label className="block text-xs sm:text-sm font-medium text-secondary/80 mb-2 border-b pb-1">Advertising Placements</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_ad_company_detail}
                      onChange={(e) => setFormData({ ...formData, can_ad_company_detail: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-xs sm:text-sm text-secondary/70">Company Detail Page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_ad_companies_list}
                      onChange={(e) => setFormData({ ...formData, can_ad_companies_list: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-sm">Companies List Page</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_ad_home_page}
                      onChange={(e) => setFormData({ ...formData, can_ad_home_page: e.target.checked })}
                      className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-secondary"
                    />
                    <span className="text-sm">Home Page</span>
                  </label>
                </div>

               
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-form"
                className="px-6 py-2.5 rounded-xl bg-secondary text-white font-medium hover:bg-secondary-dark shadow-sm transition-colors"
              >
                Save Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
