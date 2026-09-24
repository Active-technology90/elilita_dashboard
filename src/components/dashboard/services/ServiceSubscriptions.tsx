import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Repeat,
  Search,
  RefreshCw,
  SlidersHorizontal,
  AlertCircle,
  X,
  Calendar,
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Wrench,
  Phone,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CompanySelector } from "../company-products/CompanySelector";
import { getManageServiceSubscriptions } from "../../../services/api";
import { ServiceSubscriptionManageModal } from "./ServiceSubscriptionManageModal";
import { Toast } from "../../ui/Toast";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import PageHeader from "../../ui/PageHeader";
import { DataTable, type Column } from "../../ui/DataTable";
import type { ServiceSubscription } from "../../../types";

/* ---------- custom debounce hook ---------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Contracts", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "30", label: "30 / page" },
  { value: "50", label: "50 / page" },
  { value: "100", label: "100 / page" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; className: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

/* ---------- helpers ---------- */
function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatAmount(value: string | number): string {
  const numericValue = typeof value === "number" ? value : Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString() : "0";
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(date: Date, today: Date): boolean {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return target < today;
}

function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return isSameDay(target, today);
}

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const responseError = error as {
      response?: { data?: { detail?: string } };
    };

    if (responseError.response?.data?.detail) {
      return responseError.response.data.detail;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while loading recurring contracts.";
}

/* ---------- presentational components ---------- */
function SubscriptionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    icon: Activity,
    className: "bg-gray-50 text-gray-700 ring-gray-500/20",
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function BillingDateCell({ date }: { date?: string | null }) {
  if (!date) {
    return <span className="text-gray-400">—</span>;
  }

  if (isOverdue(date)) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-600">
        <AlertCircle className="h-4 w-4" />
        Overdue
      </span>
    );
  }

  if (isToday(date)) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
        <CalendarClock className="h-4 w-4" />
        Today
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700">
      <Calendar className="h-4 w-4 text-gray-400" />
      {formatDate(date)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function ServiceSubscriptions() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );

  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  /* ---------- subscription state ---------- */
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSubscription, setSelectedSubscription] =
    useState<ServiceSubscription | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToast({ type, message });
      toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  /* ---------- data fetching ---------- */
  const requestIdRef = useRef(0);

  const fetchSubscriptions = useCallback(async () => {
    if (!companySlug || !isServiceCompany) return;

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const params =
        selectedStatus !== "all" ? { status: selectedStatus } : undefined;
      const response = await getManageServiceSubscriptions(companySlug, params);

      if (requestId === requestIdRef.current) {
        setSubscriptions(response.data || []);
      }
    } catch (fetchError) {
      if (requestId === requestIdRef.current) {
        setError(getApiErrorMessage(fetchError));
        setSubscriptions([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [companySlug, selectedStatus, isServiceCompany]);

  useEffect(() => {
    void fetchSubscriptions();
  }, [fetchSubscriptions]);

  /* ---------- derived data ---------- */
  const filteredSubscriptions = useMemo(() => {
    if (!debouncedSearch.trim()) return subscriptions;

    const term = debouncedSearch.toLowerCase().trim();

    return subscriptions.filter((subscription) => {
      const idMatches = String(subscription.id).includes(term);
      const customerName = subscription.customer_name?.toLowerCase() ?? "";
      const customerPhone = subscription.customer_phone?.toLowerCase() ?? "";
      const offeringTitle = subscription.offering?.title?.toLowerCase() ?? "";
      const staffName = subscription.assigned_staff?.name?.toLowerCase() ?? "";

      return (
        idMatches ||
        customerName.includes(term) ||
        customerPhone.includes(term) ||
        offeringTitle.includes(term) ||
        staffName.includes(term)
      );
    });
  }, [subscriptions, debouncedSearch]);

  const totalItems = filteredSubscriptions.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscriptions.slice(start, start + pageSize);
  }, [filteredSubscriptions, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, pageSize, selectedStatus, companySlug]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const kpiCards = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter((s) => s.status === "active").length;
    const paused = subscriptions.filter((s) => s.status === "paused").length;
    const completed = subscriptions.filter(
      (s) => s.status === "completed",
    ).length;
    const cancelled = subscriptions.filter(
      (s) => s.status === "cancelled",
    ).length;

    return [
      {
        label: "Total Contracts",
        value: total,
        icon: Repeat,
        iconClass: "bg-secondary/10 text-secondary",
      },
      {
        label: "Active",
        value: active,
        icon: CheckCircle2,
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Paused",
        value: paused,
        icon: PauseCircle,
        iconClass: "bg-amber-50 text-amber-600",
      },
      {
        label: "Completed",
        value: completed,
        icon: CheckCircle2,
        iconClass: "bg-purple-50 text-purple-600",
      },
      {
        label: "Cancelled",
        value: cancelled,
        icon: XCircle,
        iconClass: "bg-red-50 text-red-600",
      },
    ];
  }, [subscriptions]);

  const subscriptionColumns: Column<ServiceSubscription>[] = [
    {
      key: "id",
      header: "Contract",
      textMode: "nowrap",
      render: (subscription) => (
        <div>
          <p className="font-semibold text-gray-900">#{subscription.id}</p>
          {subscription.created_at && (
            <p className="mt-0.5 text-xs text-gray-400">
              Created {formatDate(subscription.created_at)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (subscription) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
            {getInitials(subscription.customer_name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900">
              {subscription.customer_name || "—"}
            </p>
            {subscription.customer_phone && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                {subscription.customer_phone}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (subscription) => (
        <div>
          <p className="font-medium text-gray-800">
            {subscription.offering?.title || "Recurring Service"}
          </p>
          {subscription.assigned_staff?.name && (
            <p className="mt-0.5 text-xs text-gray-500">
              Staff: {subscription.assigned_staff.name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "billing",
      header: "Billing",
      textMode: "nowrap",
      render: (subscription) => (
        <div>
          <p className="font-semibold text-gray-900">
            {formatAmount(subscription.cycle_amount)} {subscription.currency}
          </p>
          <p className="mt-0.5 text-xs capitalize text-gray-500">
            per {subscription.billing_cycle}
          </p>
        </div>
      ),
    },
    {
      key: "next_billing_date",
      header: "Next Billing",
      textMode: "nowrap",
      render: (subscription) => (
        <BillingDateCell date={subscription.next_billing_date} />
      ),
    },
    {
      key: "status",
      header: "Status",
      textMode: "nowrap",
      render: (subscription) => (
        <SubscriptionStatusBadge status={subscription.status} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      textMode: "nowrap",
      render: (subscription) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSelectedSubscription(subscription);
              setManageModalOpen(true);
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Manage
          </button>
        </div>
      ),
    },
  ];

  /* ---------- company switching ---------- */
  const handleCompanySelect = useCallback(
    (slug: string, name: string) => {
      const membership = (user?.memberships ?? []).find(
        (m: { company_slug?: string; role?: string }) =>
          m.company_slug === slug,
      );

      const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");

      setSearch("");
      setSelectedStatus("all");
      setCurrentPage(1);

      switchCompany({ slug, name, role });
    },
    [isSuperAdmin, switchCompany, user?.memberships],
  );

  const handleManageClose = useCallback(() => {
    setManageModalOpen(false);
    setSelectedSubscription(null);
  }, []);

  const handleManageUpdated = useCallback(() => {
    void fetchSubscriptions();
    setManageModalOpen(false);
    setSelectedSubscription(null);
  }, [fetchSubscriptions]);

  /* ---------- early return states ---------- */
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies}
        isLoading={isLoadingCompanies}
        title="Service Management"
        searchPlaceholder="Search service companies..."
        onSelect={handleCompanySelect}
        onBack={clearCompany}
      />
    );
  }

  if (!companySlug) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Recurring Contracts"
          description="Select a service company to manage recurring service contracts."
          icon={Repeat}
          className="mb-6"
        />

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
          Select a service company to continue.
        </div>
      </div>
    );
  }

  if (selectedCompany && !isServiceCompany) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Recurring Contracts"
          description="Recurring service contracts are available only for service companies."
          icon={Repeat}
          eyebrow={companyName || undefined}
          badge={
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 sm:text-xs">
              Service company required
            </span>
          }
          actions={
            isSuperAdmin ? (
              <button
                type="button"
                onClick={clearCompany}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Repeat className="h-4 w-4" />
                Switch company
              </button>
            ) : undefined
          }
          className="mb-6"
        />

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                {companyName || "The selected company"} is not a service company
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Recurring contracts, billing cycles, and service subscription management
                are disabled for this company. Select a company whose business type is
                <span className="font-medium text-gray-800"> service</span> to continue.
              </p>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                >
                  <Repeat className="h-4 w-4" />
                  Choose a service company
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <>
      <Toast toast={toast} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Recurring Contracts"
          description="Manage ongoing subscriptions, billing cycles, and contract status."
          icon={Repeat}
          eyebrow={companyName || undefined}
          actions={
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Repeat className="h-4 w-4" />
                  Switch company
                </button>
              )}

              <button
                type="button"
                onClick={() => void fetchSubscriptions()}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          }
          className="mb-6"
        />

        {/* KPI cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconClass={card.iconClass}
            />
          ))}
        </div>

        {/* Main content card */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Toolbar */}
          <div className="border-b border-gray-200 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {STATUS_TABS.map((tab) => {
                  const isActive = selectedStatus === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
                        isActive
                          ? "bg-secondary text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contract, customer, service, staff..."
                    aria-label="Search subscriptions"
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* <button
                  type="button"
                  onClick={() => void fetchSubscriptions()}
                  disabled={loading}
                  aria-label="Refresh subscriptions"
                  title="Refresh subscriptions"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-3 sm:gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                  <span className="hidden text-xs font-semibold sm:inline">
                    Refresh
                  </span>
                </button> */}

                <div className="w-full sm:w-28">
                  <CustomSelect
                    value={String(pageSize)}
                    onChange={(value) => setPageSize(Number(value))}
                    options={PAGE_SIZE_OPTIONS}
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>
                {totalItems} {totalItems === 1 ? "contract" : "contracts"}
              </span>
              {debouncedSearch.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="font-semibold text-secondary hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <DataTable
              data={paginatedSubscriptions}
              columns={subscriptionColumns}
              loading={loading}
              loadingRows={5}
              errorMessage={error}
              onRetry={() => void fetchSubscriptions()}
              emptyMessage={
                debouncedSearch.trim()
                  ? "No matching contracts."
                  : selectedStatus === "all"
                    ? "No recurring contracts yet."
                    : `No ${selectedStatus} contracts.`
              }
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              stickyColumns={2}
            />
          </div>
        </div>
      </div>

      {/* Subscription manage modal */}
      {manageModalOpen && selectedSubscription && (
        <ServiceSubscriptionManageModal
          isOpen={manageModalOpen}
          subscription={selectedSubscription}
          companySlug={companySlug}
          onClose={handleManageClose}
          onUpdated={handleManageUpdated}
          onShowToast={showToast}
        />
      )}
    </>
  );
}
