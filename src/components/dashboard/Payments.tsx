import { useState, useEffect, useMemo } from "react";
import {
  Search,
  RefreshCw,
  X,
  Building2,
  Package2,
  Eye,
  Printer,
  FileSpreadsheet,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";
import { Pagination } from "../ui/Pagination";
import { DataTable, type Column } from "../ui/DataTable";
import { getAdminPayouts, getPayouts } from "../../services/api";
import { useAuth } from "../../context/authContext";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../hooks/useCompaniesList";
import { CompanySelector } from "./company-products/CompanySelector";
import type { VendorOrder } from "../../types";
import { CustomSelect, type SelectOption } from "../ui/CustomSelect";
import { SearchInput } from "../ui/SearchInput";
import PageHeader from "../ui/PageHeader";
import type { PayoutData } from "../../utils/payoutReceipt";
import { downloadPayoutCsv } from "../../utils/payoutReceipt";
import { PayoutReceiptModal } from "./payments/PayoutReceiptModal";
import { PayoutDetailModal } from "./payments/PayoutDetailModal";

interface Payout extends PayoutData {
  id: number;
  vendor_order: number;
  company_name: string;
  company_slug: string;
  company_logo?: string;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  status: "pending" | "completed" | "failed" | "processing";
  scheduled_at: string;
  paid_at: string | null;
  reference: string | null;
  vendor_order_details: VendorOrder;
}

export default function Payments() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const isSuperAdmin = !user?.memberships?.length;

  // Company from context
  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";

  // Overlay for company selector
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);

  // Effective slug for API calls
  const effectiveCompanySlug = useMemo(() => {
    if (companySlug) return companySlug;
    if (!isSuperAdmin && user?.memberships?.length) {
      return user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [companySlug, isSuperAdmin, user]);

  const isAllPayouts = isSuperAdmin && !effectiveCompanySlug;

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast, showToast } = useToast();
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Modals
  const [selectedPayoutForReceipt, setSelectedPayoutForReceipt] =
    useState<Payout | null>(null);
  const [selectedPayoutForDetail, setSelectedPayoutForDetail] =
    useState<Payout | null>(null);

  // Page Size dropdown options
  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
  ];

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter) count++;
    if (methodFilter) count++;
    if (dateFilter) count++;
    return count;
  }, [searchTerm, statusFilter, methodFilter, dateFilter]);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, page_size: pageSize };
      let response;
      if (isAllPayouts) {
        response = await getAdminPayouts(params);
      } else {
        if (!effectiveCompanySlug) {
          setPayouts([]);
          setTotalCount(0);
          return;
        }
        response = await getPayouts(effectiveCompanySlug, params);
      }
      setPayouts(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [currentPage, pageSize, effectiveCompanySlug, isSuperAdmin, isAllPayouts]);

  // Reset to page 1 when filters or company change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateFilter, effectiveCompanySlug]);

  // Date filtering helper
  const isDateInFilter = (dateString: string, filter: string) => {
    if (!filter) return true;
    const targetDate = new Date(dateString);
    const now = new Date();

    if (filter === "today") {
      return targetDate.toDateString() === now.toDateString();
    }
    if (filter === "week") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return targetDate >= sevenDaysAgo;
    }
    if (filter === "month") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return targetDate >= thirtyDaysAgo;
    }
    return true;
  };

  // Client-side filtering
  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      // Status filter
      if (statusFilter && payout.status !== statusFilter) return false;

      // Payment method filter
      if (methodFilter) {
        const pm = (payout.vendor_order_details?.payment_method || payout.gateway || "").toLowerCase();
        if (!pm.includes(methodFilter.toLowerCase())) return false;
      }

      // Date filter
      if (dateFilter && !isDateInFilter(payout.scheduled_at, dateFilter)) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesOrder = payout.vendor_order.toString().includes(term);
        const matchesCompany = (payout.company_name || "")
          .toLowerCase()
          .includes(term);
        const matchesStatus = (payout.status || "").toLowerCase().includes(term);
        const matchesRef = (payout.reference || "").toLowerCase().includes(term);
        return matchesOrder || matchesCompany || matchesStatus || matchesRef;
      }

      return true;
    });
  }, [payouts, statusFilter, methodFilter, dateFilter, searchTerm]);

  // Financial KPI Calculations
  const stats = useMemo(() => {
    let netDisbursed = 0;
    let platformCommission = 0;
    let inEscrow = 0;
    let completedCount = 0;

    filteredPayouts.forEach((p) => {
      const net = Number(p.net_amount) || 0;
      const fee = Number(p.platform_fee) || 0;

      if (p.status === "completed") {
        netDisbursed += net;
        completedCount++;
      } else if (p.status === "pending" || p.status === "processing") {
        inEscrow += net;
      }

      platformCommission += fee;
    });

    return {
      netDisbursed,
      platformCommission,
      inEscrow,
      completedCount,
      totalCount: filteredPayouts.length,
    };
  }, [filteredPayouts]);

  const totalPages = Math.ceil(filteredPayouts.length / pageSize) || 1;
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasActiveFilters = Boolean(
    searchTerm.trim() || statusFilter || methodFilter || dateFilter,
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getStatusBadge = (status: string, payout?: Payout) => {
    const isDirectSplit =
      payout?.gateway === "arifpay" ||
      Boolean((payout as any)?.metadata?.split_settled) ||
      payout?.vendor_order_details?.payment_method === "arifpay";

    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            {isDirectSplit ? "Direct Settled" : "Completed"}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            {isDirectSplit ? "Pending Payout" : "Pending Escrow"}
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Processing
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
            {status}
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    if (filteredPayouts.length === 0) {
      showToast("info", "No payouts to export");
      return;
    }
    const filename = `payouts_${effectiveCompanySlug || "all"}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadPayoutCsv(filteredPayouts, filename);
    showToast("success", `Exported ${filteredPayouts.length} payout records`);
  };

  const columns = useMemo<Column<Payout>[]>(() => {
    const cols: Column<Payout>[] = [
      {
        key: "vendor_order",
        header: "Order ID",
        className: "whitespace-nowrap font-semibold text-secondary",
        render: (payout) => (
          <button
            type="button"
            onClick={() => setSelectedPayoutForDetail(payout)}
            className="inline-flex items-center gap-1 text-secondary font-bold hover:underline"
            title="View order payout details"
          >
            #{payout.vendor_order}
          </button>
        ),
      },
    ];

    if (isAllPayouts) {
      cols.push({
        key: "company_name",
        header: "Company",
        className: "min-w-[140px]",
        render: (payout) => (
          <div className="flex items-center gap-2">
            {payout.company_logo ? (
              <img
                src={payout.company_logo}
                alt={payout.company_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <Building2 className="h-4 w-4 text-gray-500" />
              </div>
            )}
            <span className="max-w-[150px] truncate font-medium text-gray-700">
              {payout.company_name}
            </span>
          </div>
        ),
      });
    }

    cols.push(
      {
        key: "gross_amount",
        header: "Gross (ETB)",
        className: "whitespace-nowrap",
        render: (payout) => Number(payout.gross_amount).toLocaleString(),
      },
      {
        key: "platform_fee",
        header: "Platform Fee",
        className: "whitespace-nowrap text-red-600 font-medium",
        render: (payout) => `- ${Number(payout.platform_fee).toLocaleString()}`,
      },
      {
        key: "net_amount",
        header: "Net (ETB)",
        className: "whitespace-nowrap font-bold text-gray-900",
        render: (payout) => Number(payout.net_amount).toLocaleString(),
      },
      {
        key: "status",
        header: "Status",
        render: (payout) => getStatusBadge(payout.status, payout),
      },
      {
        key: "payment_method",
        header: "Payment Method",
        render: (payout) => {
          const pm = payout.vendor_order_details?.payment_method || payout.gateway;
          if (!pm) return "N/A";
          return pm
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        },
      },
      {
        key: "scheduled_at",
        header: "Payout Date",
        className: "whitespace-nowrap text-gray-500",
        render: (payout) => new Date(payout.scheduled_at).toLocaleDateString(),
      },
      {
        key: "actions",
        header: "Actions",
        className: "whitespace-nowrap text-right",
        render: (payout) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedPayoutForDetail(payout)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
              title="View breakdown & details"
            >
              <Eye className="h-3.5 w-3.5 text-gray-500" />
              <span>Details</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPayoutForReceipt(payout)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary/10 hover:text-secondary/80"
              title="Download / Print payout receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Receipt</span>
            </button>
          </div>
        ),
      },
    );

    return cols;
  }, [isAllPayouts]);

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Unable to load payouts
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">{error}</p>
          <button
            onClick={fetchPayouts}
            className="px-4 py-2 bg-secondary text-white text-xs font-semibold rounded-xl hover:bg-secondary/90 transition shadow-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Payouts &amp; Receipts"
          icon={Package2}
          description={
            isAllPayouts
              ? "Review vendor payouts, settlement receipts, and marketplace commission across all companies."
              : `Review payouts and settlement receipts for ${
                  companyName || "the selected company"
                }.`
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 sm:text-sm"
                title="Export filtered records to CSV"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              {isSuperAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCompanySelectorOpen(true)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:border-secondary/30 hover:bg-secondary/5 sm:text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>
                      {companySlug ? "Change company" : "Select company"}
                    </span>
                  </button>
                  {companySlug && (
                    <button
                      type="button"
                      onClick={clearCompany}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      aria-label="Clear selected company"
                      title="Show payouts for all companies"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          }
          className="mb-5 sm:mb-6"
        />

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Card 1: Total Net Disbursed */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-1">
                Settled Payouts
              </span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                ETB {stats.netDisbursed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                {stats.completedCount} transfers settled
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          {/* Card 2: Platform Revenue / Fees */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-1">
                Platform Fees
              </span>
              <span className="text-lg sm:text-xl font-bold text-secondary">
                ETB {stats.platformCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Marketplace commission
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* Card 3: Escrow / Pending */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-1">
                Pending Escrow
              </span>
              <span className="text-lg sm:text-xl font-bold text-amber-600">
                ETB {stats.inEscrow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-amber-600/90 block mt-0.5">
                Awaiting order release
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          {/* Card 4: Total Records */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-1">
                Total Orders
              </span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">
                {stats.totalCount}
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Eligible for payout
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Company Selector Overlay */}
        {isCompanySelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-4xl mx-4">
              <CompanySelector
                companies={companies}
                isLoading={isLoadingCompanies}
                onSelect={(slug, name) => {
                  const membership = user?.memberships?.find(
                    (m: any) => m.company_slug === slug,
                  );
                  const role =
                    membership?.role ?? (isSuperAdmin ? "admin" : "staff");
                  switchCompany({ slug, name, role });
                  setIsCompanySelectorOpen(false);
                }}
                onBack={() => setIsCompanySelectorOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6 sm:mb-6">
          {/* Mobile Filter Toggle */}
          <div className="w-full lg:hidden">
            <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={(value) => {
                    setSearchTerm(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search order ID, company..."
                  loading={loading}
                  showMobileFilter={true}
                  onMobileFilterClick={() => setShowMobileFilterModal(true)}
                  activeFilterCount={activeFilterCount}
                  showClearButton={true}
                  className="w-full"
                />
              </div>

              <div className="relative z-[110] w-[104px] shrink-0">
                <CustomSelect
                  value={String(pageSize)}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                  options={pageSizeOptions}
                  placeholder="10 / page"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>

          {/* Desktop Filter Bar */}
          <div className="hidden w-full lg:block">
            <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
              <div className="flex w-full items-center gap-3">
                {/* Search Input */}
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/40" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, company, reference..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 w-full rounded-xl border border-secondary/15 bg-white pl-10 pr-4 text-sm text-secondary outline-none placeholder:text-secondary/35 focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative z-[110] w-[160px] shrink-0">
                  <CustomSelect
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "", label: "All statuses" },
                      { value: "pending", label: "Pending Escrow" },
                      { value: "processing", label: "Processing" },
                      { value: "completed", label: "Completed" },
                      { value: "failed", label: "Failed" },
                    ]}
                    placeholder="All statuses"
                    className="w-full"
                  />
                </div>

                {/* Payment Method Filter */}
                <div className="relative z-[110] w-[160px] shrink-0">
                  <CustomSelect
                    value={methodFilter}
                    onChange={(value) => {
                      setMethodFilter(value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "", label: "All methods" },
                      { value: "telebirr", label: "Telebirr" },
                      { value: "chapa", label: "Chapa" },
                      { value: "arifpay", label: "ArifPay (Direct)" },
                      { value: "bank_transfer", label: "Bank Deposit" },
                      { value: "cash_on_delivery", label: "Cash on Delivery" },
                    ]}
                    placeholder="All methods"
                    className="w-full"
                  />
                </div>

                {/* Date Preset Filter */}
                <div className="relative z-[110] w-[140px] shrink-0">
                  <CustomSelect
                    value={dateFilter}
                    onChange={(value) => {
                      setDateFilter(value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: "", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "Last 7 Days" },
                      { value: "month", label: "Last 30 Days" },
                    ]}
                    placeholder="All Time"
                    className="w-full"
                  />
                </div>

                {/* Page Size */}
                <div className="relative z-[110] w-[120px] shrink-0">
                  <CustomSelect
                    value={String(pageSize)}
                    onChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                    options={pageSizeOptions}
                    placeholder="10 / page"
                    className="w-full"
                  />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setMethodFilter("");
                      setDateFilter("");
                      setCurrentPage(1);
                    }}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.05]"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={paginatedPayouts}
          columns={columns}
          loading={loading}
          loadingRows={pageSize}
          emptyMessage="No payouts found matching your criteria"
          stickyColumns={3}
        />

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center sm:justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}

        {/* Mobile Filter Modal */}
        {showMobileFilterModal && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setShowMobileFilterModal(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-secondary">
                  Payout Filters
                </h3>
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Status
                  </label>
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={[
                      { value: "", label: "All statuses" },
                      { value: "pending", label: "Pending Escrow" },
                      { value: "processing", label: "Processing" },
                      { value: "completed", label: "Completed" },
                      { value: "failed", label: "Failed" },
                    ]}
                    placeholder="All statuses"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Payment Method
                  </label>
                  <CustomSelect
                    value={methodFilter}
                    onChange={(val) => setMethodFilter(val)}
                    options={[
                      { value: "", label: "All methods" },
                      { value: "telebirr", label: "Telebirr" },
                      { value: "chapa", label: "Chapa" },
                      { value: "arifpay", label: "ArifPay (Direct)" },
                      { value: "bank_transfer", label: "Bank Deposit" },
                      { value: "cash_on_delivery", label: "Cash on Delivery" },
                    ]}
                    placeholder="All methods"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Date Period
                  </label>
                  <CustomSelect
                    value={dateFilter}
                    onChange={(val) => setDateFilter(val)}
                    options={[
                      { value: "", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "Last 7 Days" },
                      { value: "month", label: "Last 30 Days" },
                    ]}
                    placeholder="All Time"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("");
                        setMethodFilter("");
                        setDateFilter("");
                        setCurrentPage(1);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilterModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition shadow-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settlement Voucher Modal */}
      <PayoutReceiptModal
        payout={selectedPayoutForReceipt}
        isOpen={!!selectedPayoutForReceipt}
        onClose={() => setSelectedPayoutForReceipt(null)}
      />

      {/* Payout Details Modal */}
      <PayoutDetailModal
        payout={selectedPayoutForDetail}
        isOpen={!!selectedPayoutForDetail}
        onClose={() => setSelectedPayoutForDetail(null)}
        onOpenReceipt={(payout) => setSelectedPayoutForReceipt(payout as Payout)}
      />
    </div>
  );
}
