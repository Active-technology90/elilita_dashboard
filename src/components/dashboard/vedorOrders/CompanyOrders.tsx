import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Building2,
  Settings,
  X,
  Navigation,
  Package2,
  Download,
  UtensilsCrossed, // ⬅️ NEW
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { OrderExportModal } from "./OrderExportModal";
import { getFulfillmentKind, isRestaurant } from "./orderHelpers"; // ⬅️ NEW
import TableServiceOrdersModal from "./TableServiceOrdersModal"; // ⬅️ NEW
import { formatDate, formatTime } from "../../../utils/dateFormatter";

const DEFAULT_PAGE_SIZE = 10;

/* ---------- Reusable sub-components ---------- */
const StatusBadge = ({
  status,
  type = "order",
}: {
  status: string;
  type?: "order" | "delivery";
}) => {
  const { t } = useTranslation("companyOrders");

  const normalizedStatus = status?.toLowerCase?.() || "";

  const orderStatusLabels: Record<string, string> = {
    processing: t("companyOrders.statusBadge.processing"),
    shipped: t("companyOrders.statusBadge.shipped"),
    fulfilled: t("companyOrders.statusBadge.fulfilled"),
    contacted: t("companyOrders.statusBadge.contacted"),
    pending: t("companyOrders.statusBadge.pending"),
    confirmed: t("companyOrders.statusBadge.confirmed"),
    payment_rejected: t("companyOrders.statusBadge.payment_rejected"),
    cancelled: t("companyOrders.statusBadge.cancelled"),
    expired: t("companyOrders.statusBadge.expired"),
  };

  const deliveryStatusLabels: Record<string, string> = {
    pending: t("companyOrders.statusBadge.pending"),
    out_for_delivery: t("companyOrders.statusBadge.out_for_delivery"),
    delivered: t("companyOrders.statusBadge.delivered"),
    self_pickup: t("companyOrders.statusBadge.self_pickup"),
    takeaway: t("companyOrders.statusBadge.takeaway"),
    onspot: t("companyOrders.statusBadge.onspot"),
    no_assigned: t("companyOrders.statusBadge.no_assigned"),
    expired: t("companyOrders.statusBadge.expired"),
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
    takeaway: "bg-orange-50 text-orange-700 border border-orange-200",
    onspot: "bg-purple-50 text-purple-700 border border-purple-200",
    no_assigned: "bg-gray-100 text-gray-600 border border-gray-200",
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
  const { t, i18n } = useTranslation("companyOrders");

  const language =
    i18n.resolvedLanguage || i18n.language || "en";

  if (!dateString) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return <span className="text-gray-400 text-xs">—</span>;
  }

  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const orderDateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const yesterdayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const isToday = orderDateKey === todayKey;
  const isYesterday = orderDateKey === yesterdayKey;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900">
        {isToday
          ? t("companyOrders.common.time.today")
          : isYesterday
            ? t("companyOrders.common.time.yesterday")
            : formatDate(date, language)}
      </span>

      <span className="text-xs text-gray-500 font-mono">
        {formatTime(date, language)}
      </span>
    </div>
  );
};

const isTodayDate = (dateString?: string): boolean => {
  if (!dateString) return false;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return false;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date) === formatter.format(new Date());
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

const isPreparedOrder = (o: any): boolean => {
  const candidates = [o?.status, o?.vendor_status, o?.fulfillment_status];
  return candidates.some((s) => String(s ?? "").toLowerCase() === "prepared");
};

const resolveDeliveryStatusKey = (order: VendorOrder): string => {
  const anyOrder = order as any;

  const supportsTableService =
    anyOrder?.company?.supports_table_service === true ||
    anyOrder?.vendor_orders?.[0]?.company?.supports_table_service === true;

  if (anyOrder.fulfillment_type === "onspot") {
    return "onspot";
  }

  if (!anyOrder.shipping_address_text) {
    return supportsTableService ? "takeaway" : "self_pickup";
  }

  return order.delivery?.status || "no_assigned";
};

/* ---------- Main Component ---------- */
export default function CompanyOrders() {
  const { t, i18n } = useTranslation("companyOrders");
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const { companies } = useCompaniesList();
  const readOnly = useReadOnly();

  const isSuperAdmin = !user?.memberships?.length;
  const isAdminLike = isSuperAdmin || readOnly;
  const shouldFetchAll = isSuperAdmin || readOnly;

  const companySlug = company?.slug ?? null;
// Current user's role for the selected company
const currentMembership = user?.memberships?.find(
  (m: any) => m.company_slug === (companySlug || user?.memberships?.[0]?.company_slug),
);

const userRole = isSuperAdmin
  ? "super_admin"
  : String(currentMembership?.role || user?.role || "").toLowerCase();

const canViewTableServiceDetails = userRole !== "viewer";

  const effectiveSlug = useMemo(() => {
    if (shouldFetchAll) return null;
    if (user?.memberships?.length) {
      return companySlug || user.memberships[0]?.company_slug || null;
    }
    return null;
  }, [shouldFetchAll, companySlug, user]);

  // Role gate: super admin, owner, admin can export
  const canExport = useMemo(() => {
    if (isSuperAdmin) return true;
    const membership = user?.memberships?.find(
      (m: any) => m.company_slug === effectiveSlug,
    );
    const role = (membership?.role || "").toLowerCase();
    return role === "owner" || role === "admin" || role === "super_admin";
  }, [isSuperAdmin, user, effectiveSlug]);
  

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
  const [showExportModal, setShowExportModal] = useState(false);

  // ⬇️ NEW: Table-service orders modal state
  const [showTableService, setShowTableService] = useState(false);
  const [tableServiceOrders, setTableServiceOrders] = useState<VendorOrder[]>(
    [],
  );
  const [tableServiceLoading, setTableServiceLoading] = useState(false);

  const { toast, showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

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
        setError(t("companyOrders.messages.loginRequired"));
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

        console.group("📦 [CompanyOrders] Backend response");
        console.log("Total count:", response.data.count);
        console.log("Raw payload:", response.data);
        response.data.results?.forEach((vo: any) => {
          console.group(`🧾 VendorOrder #${vo.id}`);
          console.log("status:", vo.status);
          console.log("amount:", vo.amount);
          console.log("payment_method:", vo.payment_method);
          console.log("delivery_status:", vo.delivery_status);
          console.log("fulfillment_type:", (vo as any).fulfillment_type);
          console.log("company:", vo.company);
          console.log("company.name:", vo.company?.name);
          console.log("company.name_am:", (vo.company as any)?.name_am);
          console.log("company.logo:", vo.company?.logo);
          console.log("delivery:", vo.delivery);
          console.log("items_count:", vo.items?.length ?? 0);
          console.groupEnd();
        });
        console.groupEnd();

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
            ? t("companyOrders.messages.sessionExpired")
            : err.response?.data?.detail ||
              err.message ||
              t("companyOrders.messages.loadFailed");

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
      t,
    ],
  );

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);


const fetchTableServiceOrders = useCallback(async () => {
  setTableServiceLoading(true);

  // Same rule must be used by fetching and displaying the orders.
  const qualifies = (order: VendorOrder): boolean => {
    const kind = getFulfillmentKind(order);
    const restaurant = isRestaurant(order);

    // Include restaurant orders and all on-spot orders.
    if (!restaurant && kind !== "onspot") return false;

    // Prepared on-spot orders are already completed for table service.
    if (kind === "onspot" && isPreparedOrder(order)) return false;

    return true;
  };

  // Seed with the orders already available on the current page.
  const merged = new Map<string, VendorOrder>();

  (orders || []).forEach((order) => {
    if (qualifies(order)) {
      merged.set(String(order.id), order);
    }
  });

  try {
    const token = localStorage.getItem("access");

    if (!token || (!shouldFetchAll && !effectiveSlug)) {
      setTableServiceOrders(Array.from(merged.values()));
      return;
    }

    const PAGE_SIZE = 100;
    const MAX_PAGES = 200;

    let page = 1;
    let totalFetched = 0;
    let totalCount: number | null = null;

    // Track page signatures to prevent infinite loops if the API
    // repeatedly returns the same page.
    const seenPageSignatures = new Set<string>();

    while (page <= MAX_PAGES) {
      const queryParams: any = {
        page,
        page_size: PAGE_SIZE,
        ordering: "-created_at",
      };

      // Admin: respect the selected company filter.
      if (shouldFetchAll && selectedCompanyId) {
        queryParams.company = selectedCompanyId;
      }

      const response = shouldFetchAll
        ? await getAdminVendorOrders(queryParams)
        : await getCompanyVendorOrders(
            effectiveSlug as string,
            queryParams,
          );

      const data = response?.data;

      const results: VendorOrder[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      if (results.length === 0) {
        break;
      }

      const signature = results
        .map((order) => String(order.id))
        .join(",");

      if (seenPageSignatures.has(signature)) {
        console.warn(
          `[TableService] Repeated page ${page}. Stopping pagination.`,
        );
        break;
      }

      seenPageSignatures.add(signature);

      const count = Number(data?.count);

      if (Number.isFinite(count) && count >= 0) {
        totalCount = count;
      }

      // Count every API result, not only qualifying table orders.
      totalFetched += results.length;

      results.forEach((order) => {
        if (qualifies(order)) {
          merged.set(String(order.id), order);
        }
      });

      console.log(
        `[TableService] Page ${page}: ${results.length} fetched, ` +
          `${merged.size} qualifying orders collected.`,
      );

      // Stop when the API's total number of records has been fetched.
      if (totalCount !== null && totalFetched >= totalCount) {
        break;
      }

      // Without a reliable count, a short page means the last page.
      if (totalCount === null && results.length < PAGE_SIZE) {
        break;
      }

      page++;
    }

    if (page > MAX_PAGES) {
      console.warn(
        `[TableService] Maximum page limit (${MAX_PAGES}) reached.`,
      );
    }

    const finalOrders = Array.from(merged.values())
      .filter(qualifies)
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      );

    setTableServiceOrders(finalOrders);

    console.log(
      `[TableService] Completed: ${totalFetched} API records fetched; ` +
        `${finalOrders.length} table-service orders retained.`,
    );
  } catch (error: any) {
    console.error("[TableService] Fetch failed:", error);

    // Keep any successfully collected orders instead of clearing the modal.
    setTableServiceOrders(
      Array.from(merged.values()).filter(qualifies),
    );

    showToast(
      "error",
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to load table service orders.",
    );
  } finally {
    setTableServiceLoading(false);
  }
}, [
  orders,
  shouldFetchAll,
  selectedCompanyId,
  effectiveSlug,
  showToast,
]);


  // ⬇️ NEW: only show the button when the company supports table service
  const supportsTableService = useMemo(() => {
    if (isAdminLike) return true;
    if ((company as any)?.supports_table_service === true) return true;
    if ((company as any)?.supports_table_orders === true) return true; // alt field name
    return orders.some((o: any) => getFulfillmentKind(o) === "onspot");
  }, [isAdminLike, company, orders]);
  // ⬇️ NEW: opens the modal + kicks off the fetch
  const handleOpenTableService = () => {
    setShowTableService(true);
    fetchTableServiceOrders();
  };

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
    { value: "", label: t("companyOrders.orderStatus.all") },
    { value: "pending", label: t("companyOrders.orderStatus.pending") },
    { value: "contacted", label: t("companyOrders.orderStatus.contacted") },
    { value: "processing", label: t("companyOrders.orderStatus.processing") },
    { value: "fulfilled", label: t("companyOrders.orderStatus.fulfilled") },
    { value: "shipped", label: t("companyOrders.orderStatus.shipped") },
    {
      value: "payment_rejected",
      label: t("companyOrders.orderStatus.paymentRejected"),
    },
    { value: "cancelled", label: t("companyOrders.orderStatus.cancelled") },
  ];

  const deliveryStatusOptions: SelectOption[] = [
    { value: "", label: t("companyOrders.deliveryStatusFilter.all") },
    {
      value: "pending",
      label: t("companyOrders.deliveryStatusFilter.pending"),
    },
    {
      value: "accepted",
      label: t("companyOrders.deliveryStatusFilter.accepted"),
    },
    {
      value: "picked_up",
      label: t("companyOrders.deliveryStatusFilter.pickedUp"),
    },
    {
      value: "out_for_delivery",
      label: t("companyOrders.deliveryStatusFilter.outForDelivery"),
    },
    {
      value: "delivered",
      label: t("companyOrders.deliveryStatusFilter.delivered"),
    },
    { value: "failed", label: t("companyOrders.deliveryStatusFilter.failed") },
  ];

  const paymentMethodOptions: SelectOption[] = [
    { value: "", label: t("companyOrders.paymentMethod.all") },
    {
      value: "bank_transfer",
      label: t("companyOrders.paymentMethod.bankTransfer"),
    },
    { value: "chapa", label: t("companyOrders.paymentMethod.chapa") },
    { value: "cod", label: t("companyOrders.paymentMethod.cod") },
    { value: "telebirr", label: t("companyOrders.paymentMethod.telebirr") },
    { value: "arifpay", label: t("companyOrders.paymentMethod.arifpay") },
  ];

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: t("companyOrders.pageSize.5") },
    { value: "10", label: t("companyOrders.pageSize.10") },
    { value: "15", label: t("companyOrders.pageSize.15") },
    { value: "30", label: t("companyOrders.pageSize.30") },
    { value: "60", label: t("companyOrders.pageSize.60") },
  ];

  const handleModalUpdate = useCallback(async () => {
    const freshOrders = await fetchOrders(currentPage, { silent: true } ,);

    if (selectedOrder) {
      const updated = freshOrders.find(
        (order) => order.id === selectedOrder.id,
      );
      if (updated) {
        setSelectedOrder(updated);
      }
    }


    // ⬇️ NEW: if the table-service modal has been used, keep it in sync
    if (tableServiceOrders.length > 0) {
      fetchTableServiceOrders();
    }
  }, [
    fetchOrders,
    currentPage,
    selectedOrder,
    tableServiceOrders.length,
    fetchTableServiceOrders,
  ]);
// ⬇️ Merged source for the Table-Service modal. Always contains whatever
// onspot orders are visible in the parent list, plus any extra ones the
// dedicated fetch managed to pull in.
// Merged source for the Table-Service modal. Contains every order from a
// restaurant company that is currently visible in the parent list, plus any
// extra ones the dedicated paginated fetch managed to pull in.

const tableServiceSource = useMemo<VendorOrder[]>(() => {
  const byId = new Map<string, VendorOrder>();

  const qualifies = (order: VendorOrder): boolean => {
    const kind = getFulfillmentKind(order);
    const restaurant = isRestaurant(order);

    if (!restaurant && kind !== "onspot") return false;

    if (kind === "onspot" && isPreparedOrder(order)) {
      return false;
    }

    return true;
  };

  [...(orders || []), ...(tableServiceOrders || [])].forEach(
    (order) => {
      if (qualifies(order)) {
        byId.set(String(order.id), order);
      }
    },
  );

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime(),
  );
}, [orders, tableServiceOrders]);

  const orderColumns = useMemo<Column<VendorOrder>[]>(() => {
    const cols: Column<VendorOrder>[] = [
      {
        key: "id",
        header: t("companyOrders.table.columns.orderId"),
        className: "whitespace-nowrap",
        render: (order) => (
          <div className="flex items-center gap-2 whitespace-nowrap font-semibold text-secondary">
            <span>#{order.id}</span>
            {order.order_type === "made_to_order" && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[9px] font-semibold text-purple-700 shadow-sm">
                Made to Order
              </span>
            )}
            {isTodayDate(order.created_at) && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {t("companyOrders.today")}
              </span>
            )}
          </div>
        ),
      },
    ];

    if (isAdminLike) {
      cols.push({
        key: "company",
        header: t("companyOrders.table.columns.company"),
        render: (order) => {
          const displayName =
            i18n.language?.startsWith("am") &&
            (order.company as any)?.name_am?.trim()
              ? (order.company as any).name_am
              : order.company?.name || t("companyOrders.unknownCompany");
          return (
            <div className="flex items-center gap-2">
              <CompanyAvatar logo={order.company?.logo} name={displayName} />
              <span className="max-w-[120px] truncate text-sm font-medium text-gray-700">
                {displayName}
              </span>
            </div>
          );
        },
      });
    }

    cols.push(
      {
        key: "amount",
        header: t("companyOrders.table.columns.amount"),
        className: "whitespace-nowrap",
        render: (order) => (
          <span className="font-semibold text-gray-900">
            {Number(order.amount).toLocaleString()}{" "}
            <span className="text-xs font-normal text-gray-500">
              {t("etb")}
            </span>
          </span>
        ),
      },
      {
        key: "payment_method",
        header: t("companyOrders.table.columns.paymentMethod"),
        render: (order) =>
          order.payment_method ? order.payment_method.replace(/_/g, " ") : "—",
      },
      {
        key: "status",
        header: t("companyOrders.table.columns.orderStatus"),
        render: (order) => <StatusBadge status={order.status} type="order" />,
      },
      {
        key: "delivery_status",
        header: t("companyOrders.table.columns.deliveryStatus"),
        render: (order) => (
          <StatusBadge
            status={resolveDeliveryStatusKey(order)}
            type="delivery"
          />
        ),
      },
      {
        key: "created_at",
        header: t("companyOrders.table.columns.dateTime"),
        className: "whitespace-nowrap",
        render: (order) => <OrderDate dateString={order.created_at} />,
      },
      {
        key: "actions",
        header: t("companyOrders.table.columns.actions"),
        className: "whitespace-nowrap text-right",
        render: (order) => (
          <button
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-secondary transition hover:bg-secondary/10 sm:text-sm"
          >
            <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
            {t("companyOrders.manage")}
          </button>
        ),
      },
    );

    return cols;
  }, [isAdminLike, i18n.language, t]);

  const pageDescription = isAdminLike
    ? t("companyOrders.pageDescription.admin")
    : effectiveSlug
      ? t("companyOrders.pageDescription.company")
      : t("companyOrders.pageDescription.noCompany");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title={t("companyOrders.pageTitle")}
        icon={Package2}
        description={pageDescription}
        badge={
          readOnly ? (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
              {t("companyOrders.viewOnly")}
            </span>
          ) : undefined
        }
      actionMobile={
  <div className="flex flex-wrap items-center justify-end gap-2">
    {/* Table Service */}
    {supportsTableService && (
      <button
        type="button"
        onClick={handleOpenTableService}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-1.5 text-xs font-semibold text-purple-700 shadow-sm transition-all duration-200 hover:border-purple-300 hover:bg-purple-100 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
        aria-label={t("companyOrders.tableServiceOrders")}
        title={t("companyOrders.tableServiceOrders")}
      >
        <UtensilsCrossed className="h-3 w-3 shrink-0" />
        <span className="whitespace-nowrap">
          {t("companyOrders.tableService")}
        </span>
      </button>
    )}

    {/* Export */}
    {canExport && (
      <button
        type="button"
        onClick={() => setShowExportModal(true)}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
        aria-label={t("companyOrders.exportReport")}
        title={t("companyOrders.exportTooltip")}
      >
        <Download className="h-3 w-3 shrink-0" />
        <span className="whitespace-nowrap">
          {t("companyOrders.exportReport")}
        </span>
      </button>
    )}

    {/* Live Tracking */}
    <button
      type="button"
      onClick={() => setShowTrackingMap(true)}
      className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-secondary px-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-secondary/90 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2"
      aria-label={t("companyOrders.trackingTooltip")}
      title={t("companyOrders.trackingTooltip")}
    >
      <Navigation className="h-3 w-3 shrink-0" />
      <span className="whitespace-nowrap">
        {t("companyOrders.liveTracking")}
      </span>
    </button>
  </div>
}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* ⬇️ NEW: Table Service button (desktop) */}
            {supportsTableService && (
              <button
                type="button"
                onClick={handleOpenTableService}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white border border-secondary/20 px-3.5 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:bg-gray-100 sm:text-sm"
              >
                <UtensilsCrossed className="h-4 w-4" />
                <span>{t("companyOrders.tableService")}</span>
              </button>
            )}

            {canExport && (
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 sm:text-sm"
                title={t("companyOrders.exportTooltip")}
              >
                <Download className="h-4 w-4" />
                <span>{t("companyOrders.exportReport")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTrackingMap(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
            >
              <Navigation className="h-4 w-4" />
              <span>{t("companyOrders.liveTracking")}</span>
            </button>
          </div>
        }
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
                placeholder={t("companyOrders.searchPlaceholder")}
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
                placeholder={t("companyOrders.pageSize.10")}
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
        emptyMessage={t("companyOrders.empty")}
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

      {selectedOrder && (
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
      )}

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
              <h3 className="text-lg font-extrabold text-secondary">
                {t("companyOrders.filters.title")}
              </h3>
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
                  {t("companyOrders.table.columns.orderStatus")}
                </label>
                <CustomSelect
                  value={orderStatusFilter}
                  onChange={handleOrderStatusChange}
                  options={orderStatusOptions}
                  placeholder={t("companyOrders.orderStatus.all")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  {t("companyOrders.table.columns.deliveryStatus")}
                </label>
                <CustomSelect
                  value={deliveryStatusFilter}
                  onChange={handleDeliveryStatusChange}
                  options={deliveryStatusOptions}
                  placeholder={t("companyOrders.deliveryStatusFilter.all")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  {t("companyOrders.table.columns.paymentMethod")}
                </label>
                <CustomSelect
                  value={paymentMethodFilter}
                  onChange={handlePaymentMethodChange}
                  options={paymentMethodOptions}
                  placeholder={t("companyOrders.paymentMethod.all")}
                />
              </div>

              {isAdminLike && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    {t("companyOrders.table.columns.company")}
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  >
                    <option value="">{t("companyOrders.allCompanies")}</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {i18n.language?.startsWith("am") &&
                        (c as any).name_am?.trim()
                          ? (c as any).name_am
                          : c.name}
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
                    {t("companyOrders.filters.clearAll")}
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                >
                  {t("companyOrders.filters.applyFilters")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTrackingMap && (
        <DeliveryTrackingMap onClose={() => setShowTrackingMap(false)} />
      )}

      {canExport && (
        <OrderExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          orders={orders}
          companySlug={effectiveSlug}
          companyName={
            isAdminLike && !effectiveSlug
              ? t("companyOrders.allCompanies")
              : company?.name || ""
          }
          onSuccess={(message) => showToast("success", message)}
        />
      )}

      {/* ⬇️ NEW: Table Service Orders modal */}
    {/* ⬇️ NEW: Table Service Orders modal */}
{supportsTableService && (
  <TableServiceOrdersModal
    open={showTableService}
    onClose={() => setShowTableService(false)}
    userRole={userRole}
    orders={tableServiceSource}
    onRefresh={fetchTableServiceOrders}
    refreshing={tableServiceLoading}
    onOpenOrder={(id) => {
      setShowTableService(false);
      const found =
        tableServiceOrders.find((o) => o.id === id) ||
        orders.find((o) => o.id === id);
      if (found) setSelectedOrder(found);
    }}
  />
)}
    </div>
  );
}
