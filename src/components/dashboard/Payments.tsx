import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  RefreshCw,
  X,
  Building2,
  Package2,
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

interface Payout {
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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast, showToast } = useToast();
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  // Options for Page Size dropdown
  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
  ];

  // Active filter count for mobile filter badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter) count++;
    return count;
  }, [searchTerm, statusFilter]);

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
  // Refetch when dependencies change
  useEffect(() => {
    fetchPayouts();
  }, [currentPage, pageSize, effectiveCompanySlug, isSuperAdmin, isAllPayouts]);

  // Reset to page 1 when filters or company change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, effectiveCompanySlug]);

  // Client-side filtering
  const filteredPayouts = payouts.filter((payout) => {
    if (statusFilter && payout.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        payout.vendor_order.toString().includes(term) ||
        payout.company_name.toLowerCase().includes(term) ||
        payout.status.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPayouts.length / pageSize);
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownloadReceipt = (payoutId: number) => {
    showToast("info", `Receipt for payout ${payoutId} not yet implemented`);
  };


  const columns = useMemo<Column<Payout>[]>(() => {
    const cols: Column<Payout>[] = [
      {
        key: "vendor_order",
        header: "Order ID",
        className: "whitespace-nowrap font-semibold text-secondary",
        render: (payout) => `#${payout.vendor_order}`,
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
        className: "whitespace-nowrap",
        render: (payout) => Number(payout.platform_fee).toLocaleString(),
      },
      {
        key: "net_amount",
        header: "Net (ETB)",
        className: "whitespace-nowrap font-semibold text-gray-900",
        render: (payout) => Number(payout.net_amount).toLocaleString(),
      },
      {
        key: "status",
        header: "Payment Status",
        render: (payout) => (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
              payout.status,
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {payout.status}
          </span>
        ),
      },
      {
        key: "payment_method",
        header: "Payment Method",
        render: (payout) =>
          payout.vendor_order_details?.payment_method
            ?.split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "N/A",
      },
      {
        key: "scheduled_at",
        header: "Payout Date",
        className: "whitespace-nowrap",
        render: (payout) =>
          new Date(payout.scheduled_at).toLocaleDateString(),
      },
      {
        key: "actions",
        header: "Actions",
        className: "whitespace-nowrap text-right",
        render: (payout) => (
          <button
            type="button"
            onClick={() => handleDownloadReceipt(payout.id)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary/10 hover:text-secondary/80 sm:text-sm"
            title="Download receipt"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </button>
        ),
      },
    );

    return cols;
  }, [isAllPayouts]);

  // Error state (before table)
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPayouts}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title="Payouts"
        icon={Package2}
        description={
          isAllPayouts
            ? "Review payouts across all companies."
            : `Review payouts for ${companyName || "the selected company"}.`
        }
        actions={
          isSuperAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setIsCompanySelectorOpen(true)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:border-secondary/30 hover:bg-secondary/5 sm:text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{companySlug ? "Change company" : "Select company"}</span>
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
          ) : undefined
        }
        className="mb-5 sm:mb-6"
      />

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
      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6 sm:mb-6">
        <div className="w-full lg:hidden">
          <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                placeholder="Search by company or status..."
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

        <div className="hidden w-full lg:block">
          <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <div className="flex w-full items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/40" />
                <input
                  type="text"
                  placeholder="Search by company or status..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-secondary/15 bg-white pl-10 pr-4 text-sm text-secondary outline-none placeholder:text-secondary/35 focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
                />
              </div>

              <div className="relative z-[110] w-[180px] shrink-0">
                <CustomSelect
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "processing", label: "Processing" },
                    { value: "completed", label: "Completed" },
                    { value: "failed", label: "Failed" },
                  ]}
                  placeholder="All statuses"
                  className="w-full"
                />
              </div>

              <div className="relative z-[110] w-[138px] shrink-0">
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

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setCurrentPage(1);
                  }}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.05] focus:outline-none focus:ring-2 focus:ring-secondary/15"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared responsive table */}
      <DataTable
        data={paginatedPayouts}
        columns={columns}
        loading={loading}
        loadingRows={pageSize}
        emptyMessage="No payouts found"
        stickyColumns={3}
      />

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center sm:justify-end">
          <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
        </div>
      )}

      {/* Mobile Filter Modal - Bottom Sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-secondary">Filters</h3>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Status
                </label>
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "processing", label: "Processing" },
                    { value: "completed", label: "Completed" },
                    { value: "failed", label: "Failed" },
                  ]}
                  placeholder="All statuses"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setCurrentPage(1);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
