import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Eye, Package, Package2, Truck, X } from "lucide-react";
import { getAdminMasterOrders } from "../../../services/api";
import type { MasterOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { DataTable, type Column } from "../../ui/DataTable";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderFilters } from "./OrderFilters";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";

const DEFAULT_PAGE_SIZE = 10;

// ---------- Premium UI Subcomponents ----------

const PaymentStatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "verifying receipt": "bg-orange-50 text-orange-700 border-orange-200",
    "checkout initiated": "bg-gray-50 text-gray-600 border-gray-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const normalized = status?.toLowerCase?.() || "";
  const color =
    colors[normalized] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
};

const OrderDate = ({ dateString }: { dateString?: string }) => {
  if (!dateString) return <span className="text-gray-400 text-xs">—</span>;
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    new Date(now.setDate(now.getDate() - 1)).toDateString() ===
    date.toDateString();

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

// ---------- Main Component ----------
export default function Orders() {
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [fulfillmentTypeFilter, setFulfillmentTypeFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  // Options for Payment Status dropdown
  const paymentStatusOptions: SelectOption[] = [
    { value: "", label: "All Payment Statuses" },
    { value: "Paid", label: "Paid" },
    { value: "Verifying Receipt", label: "Verifying Receipt" },
    { value: "Pay on Delivery", label: "Pay on Delivery" },
    { value: "Checkout Initiated", label: "Checkout Initiated" },
    { value: "Awaiting Bank Transfer", label: "Awaiting Bank Transfer" },
  ];

  // Options for Fulfillment Type dropdown
  const fulfillmentTypeOptions: SelectOption[] = [
    { value: "", label: "All Fulfillment Types" },
    { value: "delivery", label: "Delivery" },
    { value: "pickup", label: "Pickup" },
  ];

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
    if (deliveryStatusFilter) count++;
    if (paymentStatusFilter) count++;
    if (fulfillmentTypeFilter) count++;
    return count;
  }, [
    searchTerm,
    statusFilter,
    deliveryStatusFilter,
    paymentStatusFilter,
    fulfillmentTypeFilter,
  ]);

  // Helper: get aggregated delivery status for a master order
  const getOrderDeliveryStatus = (order: MasterOrder): string => {
    const statuses =
      order.vendor_orders?.map((vo) => vo.delivery_status).filter((s) => !!s) ||
      [];
    if (statuses.length === 0) return "N/A";
    const unique = [...new Set(statuses)];
    if (unique.length === 1) return unique[0] || "N/A";
    return "multiple";
  };

  // Fetch orders with abort support
  const fetchOrders = useCallback(
    async (page: number, status: string) => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Please log in to view orders");
        setLoading(false);
        return;
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const res = await getAdminMasterOrders({
          page,
          page_size: pageSize,
          status: status || undefined,
          ordering: "-created_at",
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setOrders(res.data.results);
        }
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.message === "SESSION_EXPIRED"
            ? "Your session has expired. Please log in again."
            : err.response?.data?.detail ||
              err.message ||
              "Failed to load orders";
        if (!controller.signal.aborted) {
          setError(message);
          showToast("error", message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [pageSize, showToast],
  );

  // Reset page when pageSize changes
  useEffect(() => setCurrentPage(1), [pageSize]);

  // Fetch when dependencies change
  useEffect(() => {
    if (localStorage.getItem("access")) {
      fetchOrders(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, pageSize, fetchOrders]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  // Client-side filtering (search + additional filters)
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          String(o.id).includes(lower) ||
          o.recipient_name?.toLowerCase().includes(lower) ||
          o.shipping_phone?.toLowerCase().includes(lower) ||
          o.shipping_address_text?.toLowerCase().includes(lower),
      );
    }
    if (statusFilter) result = result.filter((o) => o.status === statusFilter);
    if (deliveryStatusFilter) {
      result = result.filter(
        (o) => getOrderDeliveryStatus(o) === deliveryStatusFilter,
      );
    }
    if (paymentStatusFilter)
      result = result.filter((o) => o.payment_status === paymentStatusFilter);
    if (fulfillmentTypeFilter)
      result = result.filter(
        (o) => o.fulfillment_type === fulfillmentTypeFilter,
      );
    return result;
  }, [
    orders,
    searchTerm,
    statusFilter,
    deliveryStatusFilter,
    paymentStatusFilter,
    fulfillmentTypeFilter,
  ]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const goToPage = (page: number) =>
    setCurrentPage(Math.min(Math.max(1, page), totalPages));

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [filteredOrders.length, pageSize]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDeliveryStatusFilter("");
    setPaymentStatusFilter("");
    setFulfillmentTypeFilter("");
    setCurrentPage(1);
  };


  const columns = useMemo<Column<MasterOrder>[]>(
    () => [
      {
        key: "id",
        header: "Order ID",
        className: "whitespace-nowrap font-semibold text-secondary",
        render: (order) => `#${order.id}`,
      },
      {
        key: "recipient_name",
        header: "Customer",
        className: "min-w-[130px]",
        render: (order) =>
          order.recipient_name || (
            <span className="italic text-gray-400">Pickup</span>
          ),
      },
      {
        key: "total_amount",
        header: "Total",
        className: "whitespace-nowrap",
        render: (order) => (
          <span className="font-semibold text-gray-900">
            {Number(order.total_amount).toLocaleString()}{" "}
            <span className="text-xs font-normal text-gray-500">ETB</span>
          </span>
        ),
      },
      {
        key: "fulfillment_type",
        header: "Fulfillment",
        className: "whitespace-nowrap",
        render: (order) => (
          <div className="flex items-center gap-1.5 text-gray-600">
            {order.fulfillment_type === "delivery" ? (
              <Truck className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            ) : (
              <Package className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            )}
            <span className="capitalize">{order.fulfillment_type}</span>
          </div>
        ),
      },
      {
        key: "payment_status",
        header: "Payment Status",
        render: (order) => (
          <PaymentStatusBadge status={order.payment_status} />
        ),
      },
      {
        key: "companies",
        header: "Companies",
        className: "whitespace-nowrap",
        render: (order) => order.vendor_orders?.length ?? 0,
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
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-secondary transition hover:bg-indigo-50 hover:text-indigo-700 sm:text-sm"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
      <Toast toast={toast} />

      <PageHeader
        title="All Master Orders"
        icon={Package2}
        description="Manage and track customer orders across the platform."
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
                placeholder="Search by order ID, customer name, phone, or address..."
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
          <OrderFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            deliveryStatusFilter={deliveryStatusFilter}
            paymentStatusFilter={paymentStatusFilter}
            onPaymentStatusChange={(value) => {
              setPaymentStatusFilter(value);
              setCurrentPage(1);
            }}
            fulfillmentTypeFilter={fulfillmentTypeFilter}
            onFulfillmentTypeChange={(value) => {
              setFulfillmentTypeFilter(value);
              setCurrentPage(1);
            }}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onClear={clearFilters}
            showMobile={showMobileFilters}
            onToggleMobile={() => setShowMobileFilters(false)}
          />
        </div>
      </div>

      {/* Shared responsive table */}
      <DataTable
        data={paginatedOrders}
        columns={columns}
        loading={loading}
        loadingRows={pageSize}
        emptyMessage="No orders found"
        errorMessage={error}
        onRetry={() => fetchOrders(currentPage, statusFilter)}
        stickyColumns={3}
      />

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            pageSize={pageSize}
            enableUrlSync={true}
            className="rounded-xl border border-gray-100"
          />
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Mobile Filter Modal - Bottom Sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Bottom Sheet Content */}
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
              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Payment Status
                </label>
                <CustomSelect
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                  options={paymentStatusOptions}
                  placeholder="All Payment Statuses"
                />
              </div>

              {/* Fulfillment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Fulfillment Type
                </label>
                <CustomSelect
                  value={fulfillmentTypeFilter}
                  onChange={setFulfillmentTypeFilter}
                  options={fulfillmentTypeOptions}
                  placeholder="All Fulfillment Types"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {(searchTerm ||
                  statusFilter ||
                  deliveryStatusFilter ||
                  paymentStatusFilter ||
                  fulfillmentTypeFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setDeliveryStatusFilter("");
                      setPaymentStatusFilter("");
                      setFulfillmentTypeFilter("");
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
