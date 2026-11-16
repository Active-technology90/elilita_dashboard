import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Eye, Package, Package2, Truck, X, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("master");
  const colors: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "verifying receipt": "bg-orange-50 text-orange-700 border-orange-200",
    "checkout initiated": "bg-gray-50 text-gray-600 border-gray-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const normalized = status?.toLowerCase?.() || "";
  const color =
    colors[normalized] || "bg-gray-100 text-gray-600 border-gray-200";

  // Map known payment statuses to i18n keys
  const displayLabel = (() => {
    switch (normalized) {
      case "paid":
        return t("orders.paymentStatus.paid");
      case "verifying receipt":
        return t("orders.paymentStatus.verifyingReceipt");
      case "pay on delivery":
        return t("orders.paymentStatus.payOnDelivery");
      case "checkout initiated":
        return t("orders.paymentStatus.checkoutInitiated");
      case "awaiting bank transfer":
        return t("orders.paymentStatus.awaitingBankTransfer");
      case "cancelled":
        return t("orders.paymentStatus.cancelled");
      default:
        return status || t("orders.paymentStatus.unknown");
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {displayLabel}
    </span>
  );
};

const OrderDate = ({ dateString }: { dateString?: string }) => {
  const { t } = useTranslation("master");
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
        {isToday
          ? t("common.time.today")
          : isYesterday
            ? t("common.time.yesterday")
            : formatDate}
      </span>
      <span className="text-xs text-gray-500 font-mono">{formatTime}</span>
    </div>
  );
};

// ---------- Main Component ----------
export default function Orders() {
  const { t } = useTranslation("master");

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
    { value: "", label: t("orders.paymentStatus.all") },
    { value: "Paid", label: t("orders.paymentStatus.paid") },
    {
      value: "Verifying Receipt",
      label: t("orders.paymentStatus.verifyingReceipt"),
    },
    {
      value: "Pay on Delivery",
      label: t("orders.paymentStatus.payOnDelivery"),
    },
    {
      value: "Checkout Initiated",
      label: t("orders.paymentStatus.checkoutInitiated"),
    },
    {
      value: "Awaiting Bank Transfer",
      label: t("orders.paymentStatus.awaitingBankTransfer"),
    },
  ];

  // Options for Fulfillment Type dropdown
  const fulfillmentTypeOptions: SelectOption[] = [
    { value: "", label: t("orders.fulfillment.all") },
    { value: "delivery", label: t("orders.fulfillment.delivery") },
    { value: "pickup", label: t("orders.fulfillment.pickup") },
  ];

  // Options for Page Size dropdown
  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: t("orders.pageSize.5") },
    { value: "10", label: t("orders.pageSize.10") },
    { value: "15", label: t("orders.pageSize.15") },
    { value: "30", label: t("orders.pageSize.30") },
    { value: "60", label: t("orders.pageSize.60") },
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
        setError(t("orders.messages.loginRequired"));
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

          // 🔍 CONSOLE: Inspect backend response structure
          console.group("📦 [Orders] Backend response");
          console.log("Total results returned:", res.data.results?.length ?? 0);
          console.log("Raw response payload:", res.data);

          // 🔍 CONSOLE: Verify company name / name_am fields
          res.data.results?.forEach((order: any) => {
            console.group(`🧾 Order #${order.id}`);
            console.log("customer_name:", order.customer_name);
            console.log("customer_username:", order.customer_username);
            console.log("recipient_name:", order.recipient_name);
            console.log("payment_status:", order.payment_status);
            console.log("fulfillment_type:", order.fulfillment_type);
            console.log("onspot_order_mode:", order.onspot_order_mode);
            console.log("table_number:", order.table_number);
            console.log("subtotal:", order.subtotal);
            console.log("tax_total:", order.tax_total);
            console.log("delivery_fee:", order.delivery_fee);
            console.log("total_amount:", order.total_amount);
            console.log("created_at:", order.created_at);
            console.log("updated_at:", order.updated_at);

            if (order.vendor_orders?.length) {
              console.group(`🏢 Vendor orders (${order.vendor_orders.length})`);
              order.vendor_orders.forEach((vo: any) => {
                console.group(`  Vendor order #${vo.id}`);
                console.log("  company:", vo.company);
                console.log("  company.name:", vo.company?.name);
                console.log("  company.name_am:", vo.company?.name_am); // ⬅ check Amharic
                console.log("  company.logo:", vo.company?.logo);
                console.log("  status:", vo.status);
                console.log("  amount:", vo.amount);
                console.log("  delivery_fee:", vo.delivery_fee);
                console.log("  delivery_status:", vo.delivery_status);
                console.log("  delivery:", vo.delivery);
                console.log("  items_count:", vo.items?.length ?? 0);
                if (vo.items?.length) {
                  vo.items.forEach((item: any, i: number) => {
                    console.log(`    item[${i}]`, {
                      id: item.id,
                      title: item.title,
                      sku: item.sku,
                      qty: item.qty,
                      unit_price: item.unit_price,
                      line_total: item.line_total,
                      product_image: item.product_image,
                    });
                  });
                }
                console.groupEnd();
              });
              console.groupEnd();
            }
            console.groupEnd();
          });
          console.groupEnd();
          // 🔍 END CONSOLE
        }
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        const message =
          err.message === "SESSION_EXPIRED"
            ? t("orders.messages.sessionExpired")
            : err.response?.data?.detail ||
              err.message ||
              t("orders.messages.loadFailed");
        if (!controller.signal.aborted) {
          setError(message);
          showToast("error", message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [pageSize, showToast, t],
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
          o.customer_username?.toLowerCase().includes(lower) ||
          o.customer_name?.toLowerCase().includes(lower) ||
          o.shipping_phone?.toLowerCase().includes(lower) ||
          o.customer_phone?.toLowerCase().includes(lower) ||
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
        header: t("orders.table.columns.orderId"),
        className: "whitespace-nowrap font-semibold text-secondary",
        render: (order) => `#${order.id}`,
      },
      {
        key: "recipient_name",
        header: t("orders.table.columns.customer"),
        className: "min-w-[130px]",

        render: (order) => {
          const customerName =
            order.recipient_name ||
            order.customer_username ||
            order.customer_name;
          if (!customerName) {
            return <span className="italic text-gray-400">—</span>;
          }
          return (
            <div className="flex flex-col min-w-0">
              <span
                className="font-medium text-gray-900 truncate"
                title={customerName}
              >
                {customerName}
              </span>
              {order.customer_username &&
                order.recipient_name &&
                order.customer_username.toLowerCase() !==
                  order.recipient_name.toLowerCase() && (
                  <span className="text-[11px] text-gray-400 font-mono truncate">
                    @{order.customer_username}
                  </span>
                )}
            </div>
          );
        },
      },
      {
        key: "total_amount",
        header: t("orders.table.columns.total"),
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
        header: t("orders.table.columns.fulfillment"),
        className: "whitespace-nowrap",
        render: (order) => (
          <div className="flex items-center gap-1.5 text-gray-600">
            {order.fulfillment_type === "delivery" ? (
              <Truck className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            ) : order.fulfillment_type === "onspot" ? (
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
            ) : (
              <Package className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            )}
            <span className="capitalize">
              {order.fulfillment_type === "onspot"
                ? order.onspot_order_mode === "order_ahead"
                  ? t("orders.fulfillment.preOrder")
                  : order.table_number
                    ? t("orders.fulfillment.dineInWithTable", {
                        table: order.table_number,
                      })
                    : t("orders.fulfillment.dineIn")
                : t(`orders.fulfillment.${order.fulfillment_type}` as any, {
                    defaultValue: order.fulfillment_type,
                  })}
            </span>
          </div>
        ),
      },
      {
        key: "payment_status",
        header: t("orders.table.columns.paymentStatus"),
        render: (order) => (
          <PaymentStatusBadge status={order.payment_status} />
        ),
      },
      {
        key: "companies",
        header: t("orders.table.columns.companies"),
        className: "whitespace-nowrap",
        render: (order) => order.vendor_orders?.length ?? 0,
      },
      {
        key: "created_at",
        header: t("orders.table.columns.dateTime"),
        className: "whitespace-nowrap",
        render: (order) => <OrderDate dateString={order.created_at} />,
      },
      {
        key: "actions",
        header: t("orders.table.columns.actions"),
        className: "whitespace-nowrap text-right",
        render: (order) => (
          <button
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-secondary transition hover:bg-indigo-50 hover:text-indigo-700 sm:text-sm"
          >
            <Eye className="h-4 w-4" />
            {t("orders.table.view")}
          </button>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title={t("orders.pageTitle")}
        icon={Package2}
        description={t("orders.pageDescription")}
        className="mb-5 sm:mb-6"
      />

      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
        <div className="w-full lg:hidden">
          <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                placeholder={t("orders.searchPlaceholder")}
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
                placeholder={t("orders.pageSize.10")}
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
        emptyMessage={t("orders.table.empty")}
        errorMessage={error}
        onRetry={() => fetchOrders(currentPage, statusFilter)}
        stickyColumns={3}
      />

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="mt-6 flex justify-center sm:justify-end">
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
              <h3 className="text-lg font-extrabold text-secondary">
                {t("orders.filters.title")}
              </h3>
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
                  {t("orders.filters.paymentStatus")}
                </label>
                <CustomSelect
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                  options={paymentStatusOptions}
                  placeholder={t("orders.paymentStatus.all")}
                />
              </div>

              {/* Fulfillment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  {t("orders.filters.fulfillmentType")}
                </label>
                <CustomSelect
                  value={fulfillmentTypeFilter}
                  onChange={setFulfillmentTypeFilter}
                  options={fulfillmentTypeOptions}
                  placeholder={t("orders.fulfillment.all")}
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
                    {t("orders.filters.clearAll")}
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                >
                  {t("orders.filters.applyFilters")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}