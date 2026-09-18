import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Building2,
  Settings,
  X,
  Navigation,
  Package2,
} from "lucide-react";
import { Pagination } from "../../ui/Pagination";
import { DataTable, type Column } from "../../ui/DataTable";

import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
} from "../../../services/api";
import type { VendorOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { Toast } from "../../ui/Toast";
import { VendorOrderDetailModal } from "./VendorOrderDetailModal";
import { VendorOrderFilters } from "./VendorOrderFilters";
import { useReadOnly } from "../AdminDashboard";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";
import DeliveryTrackingMap from "./DeliveryTrackingMap";
import PageHeader from "../../ui/PageHeader";

const DEFAULT_PAGE_SIZE = 10;

/* ---------- Reusable sub-components ---------- */
const StatusBadge = ({
  status,
  type = "order",
}: {
  status: string;
  type?: "order" | "delivery";
}) => {
  const normalizedStatus = status?.toLowerCase?.() || "";

  const orderStatusLabels: Record<string, string> = {
    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",
    contacted: "Confirmed",
    pending: "pending",
  };

  const deliveryStatusLabels: Record<string, string> = {
    pending: "Assigned",
    out_for_delivery: "In Transit",
    delivered: "Completed",
  };

  const labels = type === "delivery" ? deliveryStatusLabels : orderStatusLabels;

  const displayLabel =
    labels[normalizedStatus] || normalizedStatus.replace(/_/g, " ");

  const colors: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    approved: "bg-green-50 text-green-700 border border-green-200",
    paid: "bg-blue-50 text-blue-700 border border-blue-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    processing: "bg-orange-50 text-orange-700 border border-orange-200",
    confirmed: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    shipped: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    out_for_delivery: "bg-violet-50 text-violet-700 border border-violet-200",
    accepted: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    cancelled: "bg-red-50 text-red-700 border border-red-200",
    failed: "bg-red-50 text-red-700 border border-red-200",
    rejected: "bg-rose-50 text-rose-700 border border-rose-200",
    contacted: "bg-teal-50 text-teal-700 border border-teal-200",
    fulfilled: "bg-green-100 text-green-800 border border-green-200",
    payment_rejected: "bg-red-50 text-red-700 border border-red-200",
    self_pickup: "bg-blue-50 text-blue-700 border border-blue-200",
  };

  const color = colors[normalizedStatus] || "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {displayLabel}
    </span>
  );
};

const OrderDate = ({ dateString }: { dateString?: string }) => {
  if (!dateString) return <span className="text-gray-400 text-xs">—</span>;

  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  const formatTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formatDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900">
        {isToday ? "Today" : isYesterday ? "Yesterday" : formatDate}
      </span>
      <span className="text-xs text-gray-500 font-mono">{formatTime}</span>
    </div>
  );
};

const isTodayDate = (dateString?: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const CompanyAvatar = ({
  logo,
  name,
}: {
  logo?: string | null;
  name: string;
}) => (
  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
    {logo ? (
      <img src={logo} alt={name} className="w-full h-full object-cover" />
    ) : (
      <Building2 className="h-4 w-4 text-gray-500" />
    )}
  </div>
);

/* ---------- Main Component ---------- */
export default function CompanyOrders() {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const { companies } = useCompaniesList();
  const readOnly = useReadOnly();

  const isSuperAdmin = !user?.memberships?.length;
  const isAdminLike = isSuperAdmin || readOnly;
  const shouldFetchAll = isSuperAdmin || readOnly;

  const companySlug = company?.slug ?? null;

  const effectiveSlug = useMemo(() => {
    if (shouldFetchAll) return null;
    if (user?.memberships?.length) {
      return companySlug || user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [shouldFetchAll, companySlug, user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [showTrackingMap, setShowTrackingMap] = useState(false);

  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search debounce. When the debounced value changes, reset pagination.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (orderStatusFilter) count++;
    if (deliveryStatusFilter) count++;
    if (paymentMethodFilter) count++;
    if (selectedCompanyId) count++;
    return count;
  }, [
    searchTerm,
    orderStatusFilter,
    deliveryStatusFilter,
    paymentMethodFilter,
    selectedCompanyId,
  ]);

  const fetchOrders = useCallback(
    async (
      page: number,
      options?: { silent?: boolean },
    ): Promise<VendorOrder[]> => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view orders");
        if (!options?.silent) setLoading(false);
        return [];
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const queryParams: {
          page: number;
          page_size: number;
          ordering: string;
          search?: string;
          company?: string;
          status?: string;
          delivery_status?: string;
          payment_method?: string;
          signal?: AbortSignal;
        } = {
          page,
          page_size: pageSize,
          ordering: "-created_at",
        };

        if (debouncedSearchTerm) queryParams.search = debouncedSearchTerm;
        if (orderStatusFilter) queryParams.status = orderStatusFilter;
        if (deliveryStatusFilter)
          queryParams.delivery_status = deliveryStatusFilter;
        if (paymentMethodFilter)
          queryParams.payment_method = paymentMethodFilter;
        if (shouldFetchAll && selectedCompanyId) {
          queryParams.company = selectedCompanyId;
        }
        queryParams.signal = controller.signal;

        let response: {
          data: {
            results: VendorOrder[];
            count: number;
          };
        };

        if (shouldFetchAll) {
          response = await getAdminVendorOrders(queryParams);
        } else if (effectiveSlug) {
          response = await getCompanyVendorOrders(effectiveSlug, queryParams);
        } else {
          response = { data: { results: [], count: 0 } };
        }

        if (controller.signal.aborted) return [];

        setOrders(response.data.results);
        setTotalCount(response.data.count);

        if (!options?.silent) setLoading(false);
        return response.data.results;
      } catch (err: any) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED" ||
          err.name === "AbortError" ||
          controller.signal.aborted
        ) {
          return [];
        }

        const message =
          err.message === "SESSION_EXPIRED"
            ? "Your session has expired."
            : err.response?.data?.detail ||
              err.message ||
              "Failed to load orders";

        if (!controller.signal.aborted) {
          setError(message);
          showToast("error", message);
        }

        return [];
      } finally {
        if (!options?.silent && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      debouncedSearchTerm,
      orderStatusFilter,
      deliveryStatusFilter,
      paymentMethodFilter,
      selectedCompanyId,
      pageSize,
      shouldFetchAll,
      effectiveSlug,
      showToast,
    ],
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = (page: number) => {
    if (totalPages === 0) return;
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setOrderStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentMethodFilter("");
    setSelectedCompanyId("");
    setCurrentPage(1);
  };

  const handleOrderStatusChange = (value: string) => {
    setOrderStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDeliveryStatusChange = (value: string) => {
    setDeliveryStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethodFilter(value);
    setCurrentPage(1);
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    setCurrentPage(1);
  };

  const orderStatusOptions: SelectOption[] = [
    { value: "", label: "All Order Status" },
    { value: "pending", label: "Pending" },
    { value: "contacted", label: "Confirmed" },
    { value: "processing", label: "Prepared" },
    { value: "fulfilled", label: "Delivered" },
    { value: "shipped", label: "In Transit" },
    { value: "payment_rejected", label: "Payment Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const deliveryStatusOptions: SelectOption[] = [
    { value: "", label: "All Delivery Status" },
    { value: "pending", label: "Assigned" },
    { value: "accepted", label: "Accepted" },
    { value: "picked_up", label: "Picked Up" },
    { value: "out_for_delivery", label: "In Transit" },
    { value: "delivered", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  const paymentMethodOptions: SelectOption[] = [
    { value: "", label: "All Payment Method" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "chapa", label: "Chapa" },
    { value: "cod", label: "COD" },
  ];

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
  ];

  const handleModalUpdate = useCallback(async () => {
    const freshOrders = await fetchOrders(currentPage, { silent: true });

    if (selectedOrder) {
      const updated = freshOrders.find(
        (order) => order.id === selectedOrder.id,
      );
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [fetchOrders, currentPage, selectedOrder]);


  const orderColumns = useMemo<Column<VendorOrder>[]>(() => {
    const cols: Column<VendorOrder>[] = [
      {
        key: "id",
        header: "Order ID",
        className: "whitespace-nowrap",
        render: (order) => (
          <div className="flex items-center gap-2 whitespace-nowrap font-semibold text-secondary">
            <span>#{order.id}</span>
            {isTodayDate(order.created_at) && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Today
              </span>
            )}
          </div>
        ),
      },
    ];

    if (isAdminLike) {
      cols.push({
        key: "company",
        header: "Company",
        render: (order) => (
          <div className="flex items-center gap-2">
            <CompanyAvatar
              logo={order.company?.logo}
              name={order.company?.name || "Unknown"}
            />
            <span className="max-w-[120px] truncate text-sm font-medium text-gray-700">
              {order.company?.name || "Unknown"}
            </span>
          </div>
        ),
      });
    }

    cols.push(
      {
        key: "amount",
        header: "Amount",
        className: "whitespace-nowrap",
        render: (order) => (
          <span className="font-semibold text-gray-900">
            {Number(order.amount).toLocaleString()}{" "}
            <span className="text-xs font-normal text-gray-500">ETB</span>
          </span>
        ),
      },
      {
        key: "payment_method",
        header: "Payment Method",
        render: (order) =>
          order.payment_method ? order.payment_method.replace(/_/g, " ") : "—",
      },
      {
        key: "status",
        header: "Order Status",
        render: (order) => <StatusBadge status={order.status} type="order" />,
      },
      {
        key: "delivery_status",
        header: "Delivery Status",
        render: (order) => (
          <StatusBadge
            status={
              !order.shipping_address_text
                ? "self_pickup"
                : order.delivery?.status || "no assigned"
            }
            type="delivery"
          />
        ),
      },
      {
        key: "created_at",
        header: "Date & Time",
        className: "whitespace-nowrap",
        render: (order) => <OrderDate dateString={order.created_at} />,
      },
      {
        key: "actions",
        header: "Actions",
        className: "whitespace-nowrap text-right",
        render: (order) => (
          <button
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary/10 sm:text-sm"
          >
            <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Manage
          </button>
        ),
      },
    );

    return cols;
  }, [isAdminLike]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
      <Toast toast={toast} />

      <PageHeader
        title="All Orders"
        icon={Package2}
        description={
          isAdminLike
            ? "View and manage orders across all companies."
            : effectiveSlug
              ? "View and manage orders for the selected company."
              : "Select a company to view its orders."
        }
        badge={
          readOnly ? (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
              View Only
            </span>
          ) : undefined
        }
        actions={
          <button
            type="button"
            onClick={() => setShowTrackingMap(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
          >
            <Navigation className="h-4 w-4" />
            <span>Live Tracking</span>
          </button>
        }
        className="mb-4 sm:mb-6"
      />

      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6 sm:mb-6">
        <div className="w-full lg:hidden">
          <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                placeholder="Search by order ID, customer name, or company..."
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
          <VendorOrderFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            orderStatusFilter={orderStatusFilter}
            onOrderStatusChange={handleOrderStatusChange}
            deliveryStatusFilter={deliveryStatusFilter}
            onDeliveryStatusChange={handleDeliveryStatusChange}
            paymentMethodFilter={paymentMethodFilter}
            onPaymentMethodChange={handlePaymentMethodChange}
            selectedCompanyId={selectedCompanyId}
            onCompanyChange={handleCompanyChange}
            companies={isAdminLike ? companies : []}
            onClear={clearFilters}
            hideCompanyFilter={!isAdminLike}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <DataTable
        data={orders}
        columns={orderColumns}
        loading={loading}
        loadingRows={pageSize}
        emptyMessage="No vendor orders found"
        errorMessage={error}
        onRetry={() => fetchOrders(currentPage)}
        stickyColumns={3}
      />

      {!loading && !error && totalCount > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            pageSize={pageSize}
            enableUrlSync={true}
            className="rounded-2xl border border-gray-100"
          />
        </div>
      )}

      <VendorOrderDetailModal
        order={selectedOrder}
        receipt={selectedOrder?.receipt || null}
        onClose={() => setSelectedOrder(null)}
        onUpdate={handleModalUpdate}
        readOnly={readOnly}
        onOpenLiveTracking={() => setShowTrackingMap(true)}
        allOrders={orders}
        onSelectOrder={setSelectedOrder}
      />

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
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-secondary">Filters</h3>
              <button
                onClick={() => setShowMobileFilterModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Order Status
                </label>
                <CustomSelect
                  value={orderStatusFilter}
                  onChange={handleOrderStatusChange}
                  options={orderStatusOptions}
                  placeholder="All Order Status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Delivery Status
                </label>
                <CustomSelect
                  value={deliveryStatusFilter}
                  onChange={handleDeliveryStatusChange}
                  options={deliveryStatusOptions}
                  placeholder="All Delivery Status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Payment Method
                </label>
                <CustomSelect
                  value={paymentMethodFilter}
                  onChange={handlePaymentMethodChange}
                  options={paymentMethodOptions}
                  placeholder="All Payment Method"
                />
              </div>

              {isAdminLike && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Company
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                {(searchTerm ||
                  orderStatusFilter ||
                  deliveryStatusFilter ||
                  paymentMethodFilter ||
                  selectedCompanyId) && (
                  <button
                    onClick={clearFilters}
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

      {showTrackingMap && (
        <DeliveryTrackingMap onClose={() => setShowTrackingMap(false)} />
      )}
    </div>
  );
}
