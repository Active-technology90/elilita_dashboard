// VendorOrderDetailModal.tsx - Complete rewrite with View on Map
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Truck,
  Receipt,
  Calendar,
  MapPin,
  Copy,
  Check,
  User,
  ImageIcon,
  Banknote,
  Loader2,
  RefreshCw,
  CreditCard,
  Eye,
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  ZoomIn,
  CheckCircle,
  Building2,
  Navigation,
  History,
  Clock,
  Users,
  Search,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  getAvailableDeliveryDrivers,
  reviewReceipt,
  assignDelivery,
  updateDeliveryPerson,
  prepareVendorOrder,
  confirmCODPayment,
  vendorRequestRefund,
  approveDisputeRedelivery,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../ui/confimationModal";
import { db } from "../../../services/firebase";
import { ref, onValue, off } from "firebase/database";
import DeliveryTrackingMap from "./DeliveryTrackingMap";
// 🆕 Import Addis Ababa geofence helper (shared with DeliveryTrackingMap)
import { isWithinAddisAbaba } from "./DeliveryTrackingMap";
import { CustomSelect } from "../../ui/CustomSelect";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";
// ---------- Animation Variants ----------
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ---------- Helpers ----------
const getInitials = (name?: string) =>
  name
    ?.trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

const formatAddress = (address?: string | null) => {
  if (!address) return "";
  return address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
};

// 🆕 Resolve a driver's best-known coordinates from any available source
const resolveDriverCoords = (
  driver: any,
  liveLocations?: Record<number, { latitude: number; longitude: number }>,
): { lat: number | null; lon: number | null } => {
  if (!driver) return { lat: null, lon: null };
  const live = liveLocations?.[driver.id];
  const lat =
    live?.latitude ??
    driver?.live_lat ??
    driver?.current_lat ??
    driver?.last_lat ??
    null;
  const lon =
    live?.longitude ??
    driver?.live_lon ??
    driver?.current_lng ??
    driver?.last_lon ??
    null;
  const numLat = lat != null && !isNaN(Number(lat)) ? Number(lat) : null;
  const numLon = lon != null && !isNaN(Number(lon)) ? Number(lon) : null;
  return { lat: numLat, lon: numLon };
};

// 🆕 Returns true if driver is known to be outside Addis Ababa
const isDriverOutsideAddis = (
  driver: any,
  liveLocations?: Record<number, { latitude: number; longitude: number }>,
): boolean => {
  const { lat, lon } = resolveDriverCoords(driver, liveLocations);
  if (lat == null || lon == null) return false;
  return !isWithinAddisAbaba(lat, lon);
};

// ─── Fulfillment type normalizer ─────────────────────────────────
type FulfillmentKind = "delivery" | "pickup" | "onspot" | "unknown";

const getFulfillmentKind = (order: any): FulfillmentKind => {
  const raw = (
    order?.fulfillment_type ||
    order?.fulfillment ||
    order?.order_type ||
    ""
  )
    .toString()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (raw === "delivery" || raw === "home_delivery" || raw === "courier") {
    return "delivery";
  }
  if (
    raw === "pickup" ||
    raw === "self_pickup" ||
    raw === "selfpickup" ||
    raw === "in_store" ||
    raw === "store_pickup"
  ) {
    return "pickup";
  }
  if (
    raw === "onspot" ||
    raw === "on_spot" ||
    raw === "dine_in" ||
    raw === "dinein" ||
    raw === "table" ||
    raw === "table_order"
  ) {
    return "onspot";
  }
  return "unknown";
};

const isRestaurant = (order: any): boolean =>
  order?.company?.supports_table_service === true ||
  order?.vendor_orders?.[0]?.company?.supports_table_service === true;

// ─── Customer info resolver ──────────────────────────────────────
const resolveCustomerName = (order: any): string => {
  const candidate =
    order?.recipient_name ||
    order?.customer_name ||
    order?.tax_invoice?.customer_name ||
    order?.customer?.name ||
    order?.customer?.full_name ||
    order?.user?.name ||
    order?.tax_invoice?.recipient_name ||
    order?.invoice?.customer_name ||
    order?.placed_by_name ||
    "";

  const trimmed = String(candidate).trim();
  if (trimmed) return trimmed;

  const kind = getFulfillmentKind(order);
  if (kind === "pickup" || kind === "onspot") {
    return "Walk-in Customer";
  }
  return "Customer";
};

const hasCustomerName = (order: any): boolean => {
  const candidate =
    order?.recipient_name ||
    order?.customer_name ||
    order?.tax_invoice?.customer_name ||
    order?.customer?.name ||
    order?.customer?.full_name ||
    order?.user?.name ||
    order?.tax_invoice?.recipient_name ||
    order?.invoice?.customer_name ||
    order?.placed_by_name ||
    "";
  return String(candidate).trim().length > 0;
};

const resolveCustomerPhone = (order: any): string => {
  const candidate =
    order?.shipping_phone ||
    order?.customer_phone ||
    order?.customer?.phone ||
    order?.customer?.phone_number ||
    order?.user?.phone ||
    order?.placed_by_phone ||
    order?.tax_invoice?.customer_phone ||
    order?.tax_invoice?.recipient_phone ||
    order?.invoice?.customer_phone ||
    "";

  const trimmed = String(candidate).trim();
  if (trimmed) return trimmed;

  const kind = getFulfillmentKind(order);
  if (kind === "pickup" || kind === "onspot") {
    return order?.company?.contact_phone || order?.company?.phone || "";
  }
  return "";
};

const resolveCustomerImage = (order: any): string | undefined => {
  return (
    order?.recipient_image ||
    order?.customer_image ||
    order?.customer?.image ||
    order?.customer?.profile_image ||
    undefined
  );
};

// ─── Order Timeline Builder ──────────────────────────────
const buildOrderTimeline = (order: any) => {
  const events: any[] = [];

  const isValidTimestamp = (v: any) => {
    if (v == null || v === "") return false;
    const d = new Date(v);
    return !isNaN(d.getTime());
  };

  if (isValidTimestamp(order.created_at)) {
    events.push({
      id: "placed",
      label: "Order Placed",
      icon: "📦",
      time: order.created_at,
      actor: "Customer",
      status: "completed",
    });
  }

  const approvedReceipt = order.receipt_history?.find(
    (h: any) => h.status === "approved",
  );
  if (approvedReceipt) {
    // ✅ pick whichever timestamp exists on the receipt, then fall back
    //    to the order's own timestamps, and finally drop the event.
    const receiptTime =
      approvedReceipt.updated_at ||
      approvedReceipt.created_at ||
      approvedReceipt.reviewed_at ||
      approvedReceipt.approved_at ||
      approvedReceipt.timestamp ||
      approvedReceipt.date;

    const paymentTime = receiptTime || order.updated_at || order.created_at;

    if (isValidTimestamp(paymentTime)) {
      events.push({
        id: "payment",
        label: "Payment Approved",
        icon: "💳",
        time: paymentTime,
        actor: "Admin",
        status: "completed",
      });
    }
  } else if (
    order.payment_method === "chapa" &&
    order.payment_status === "paid"
  ) {
    if (isValidTimestamp(order.created_at)) {
      events.push({
        id: "payment",
        label: "Payment Confirmed",
        icon: "💳",
        time: order.created_at,
        actor: "Chapa",
        status: "completed",
      });
    }
  }

  if (
    (order.status?.toLowerCase() === "processing" ||
      order.status?.toLowerCase() === "fulfilled") &&
    isValidTimestamp(order.updated_at || order.created_at)
  ) {
    events.push({
      id: "prepared",
      label: "Order Prepared",
      icon: "✅",
      time: order.updated_at || order.created_at,
      actor: "Admin",
      status: "completed",
    });
  }

  if (
    order.delivery?.status?.toLowerCase() === "out_for_delivery" &&
    isValidTimestamp(order.delivery.updated_at || order.delivery.created_at)
  ) {
    events.push({
      id: "out_for_delivery",
      label: "In Transit",
      icon: "🚚",
      time: order.delivery.updated_at || order.delivery.created_at,
      actor: order.delivery.delivery_person_name || "Delivery Person",
      status: "completed",
    });
  }

  const deliveredTimestamp =
    order.delivery?.delivered_at ||
    order.delivery?.updated_at ||
    order.delivery?.created_at ||
    order.updated_at ||
    order.created_at;

  if (
    (order.delivery?.status?.toLowerCase() === "delivered" ||
      order.status?.toLowerCase() === "fulfilled") &&
    isValidTimestamp(deliveredTimestamp)
  ) {
    events.push({
      id: "delivered",
      label: "Delivered",
      icon: "🏁",
      time: deliveredTimestamp,
      actor: order.delivery?.delivery_person_name || "System",
      status: "completed",
    });
  }

  if (
    order.status?.toLowerCase() === "pending" &&
    !approvedReceipt &&
    isValidTimestamp(order.created_at)
  ) {
    events.push({
      id: "pending",
      label: "Awaiting Payment",
      icon: "⏳",
      time: order.created_at,
      actor: "Waiting for customer",
      status: "pending",
    });
  }

  events.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  return events;
};

const getDisplayStatus = (
  status: string,
  t?: any,
  customLabels?: Record<string, string>,
) => {
  const tr = typeof t === "function" ? t : (key: string) => key;

  const statusMap: Record<string, string> = {
    contacted: tr("companyOrders.statusBadge.contacted"),
    processing: tr("companyOrders.statusBadge.processing"),
    shipped: tr("companyOrders.statusBadge.shipped"),
    fulfilled: tr("companyOrders.statusBadge.fulfilled"),
    pending: tr("companyOrders.statusBadge.pending"),
    expired: tr("companyOrders.statusBadge.expired"),
    declined: tr("companyOrders.statusBadge.declined"),
    out_for_delivery: tr("companyOrders.statusBadge.out_for_delivery"),
    delivered: tr("companyOrders.statusBadge.delivered"),
    disputed: tr("companyOrders.statusBadge.disputed"),
    replacement_in_progress: tr(
      "companyOrders.statusBadge.replacement_in_progress",
    ),
    refunded: tr("companyOrders.statusBadge.refunded"),
    ...customLabels,
  };
  return statusMap[status?.toLowerCase()] || status;
};

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  const base =
    "px-2 md:px-3 py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm";

  if (s === "completed" || s === "delivered" || s === "approved")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "paid" || s === "out_for_delivery")
    return (
      base +
      "bg-violet-50 text-violet-700 border-violet-200 flex flex-row w-24 items-center justify-center"
    );
  if (s === "replacement_in_progress")
    return base + "bg-purple-50 text-purple-700 border-purple-200";
  if (s === "expired")
    return base + "bg-amber-50 text-amber-800 border-amber-300";
  if (s === "pending" || s === "disputed")
    return base + "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "declined")
    return base + "bg-rose-50 text-rose-700 border-rose-200";
  if (
    s === "rejected" ||
    s === "cancelled" ||
    s === "failed" ||
    s === "refunded"
  )
    return base + "bg-rose-50 text-rose-700 border-rose-200";
  return base + "bg-gray-50 text-gray-600 border-gray-200";
};

// ---------- Sub-Components ----------
const Card = ({
  children,
  title,
  titleKey,
  icon: Icon,
  status,
  isCOD = false,
  className = "",
  t,
}: {
  children?: React.ReactNode;
  title?: string;
  titleKey?: string;
  icon: any;
  status?: string;
  isCOD?: boolean;
  className?: string;
  t?: any;
}) => {
  // Defensive: if t is missing, fall back to a passthrough so we don't crash.
  const tr = typeof t === "function" ? t : (key: string) => title ?? key;

  return (
    <motion.div
      variants={itemVariants}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/20 p-2 md:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      <div className="flex flex-row justify-between items-start">
        <div className="flex items-center gap-2 mb-2 md:mb-4 pb-2 md:pb-3 w-full relative">
          <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
            <Icon className="h-4 w-4 text-secondary" />
          </div>
          <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
            {titleKey ? tr(titleKey) : title}
          </h4>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
        </div>
        {status && (
          <div className="flex flex-row justify-start">
            <span className={getStatusBadge(status)}>
              {isCOD ? status : getDisplayStatus(status, tr)}
            </span>
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
};

const StatusBadge = ({
  status,
  customLabels,
  t,
}: {
  status: string;
  customLabels?: Record<string, string>;
  t?: any;
}) => {
  const s = status?.toLowerCase();
  const styles: Record<string, string> = {
    /* unchanged */
  };

  const tr =
    typeof t === "function" ? t : (key: string) => customLabels?.[key] ?? key;

  const displayStatus = getDisplayStatus(status, tr, customLabels);

  return (
    <span
      className={`px-2 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${
        styles[s] || "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {displayStatus}
    </span>
  );
};

const CopyButton = ({ text }: { text?: string | null }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-secondary transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

/* ─── Filter Type Card (Delivery Person Type option) ─── */
// ─── DELIVERY CARD WITH VIEW ON MAP ──────────────────────────────

/* ─── Filter Type Dropdown (Delivery Person Type selector) ─── */
/* ─── Compact Filter Dropdown (used for both Type & Vehicle) ─── */
const FilterDropdown = ({
  value,
  onChange,
  options,
  ariaLabel,
  variant = "type",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{
    value: string;
    label: string;
    count: number;
    description?: string;
    icon?: React.ReactNode;
    emoji?: string;
    accent?: "secondary" | "emerald" | "blue";
  }>;
  ariaLabel: string;
  variant?: "type" | "vehicle";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const accentStyles = {
    secondary: "bg-secondary/10 text-secondary",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  } as const;

  const renderIcon = (opt: (typeof options)[number], isSelected: boolean) => {
    if (variant === "vehicle") {
      return (
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-sm ${
            isSelected ? "bg-secondary/10" : "bg-gray-100"
          }`}
          aria-hidden="true"
        >
          {opt.emoji}
        </span>
      );
    }
    const cls = isSelected
      ? accentStyles[opt.accent ?? "secondary"]
      : "bg-gray-100 text-gray-500";
    return (
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${cls}`}
        aria-hidden="true"
      >
        {opt.icon}
      </span>
    );
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left transition hover:border-gray-300 hover:bg-gray-50 focus:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/10"
      >
        {renderIcon(selected, true)}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gray-900">
            {selected.label}
          </p>
          {variant === "type" && selected.description && (
            <p className="truncate text-[10px] text-gray-500">
              {selected.description}
            </p>
          )}
        </div>

        <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-600">
          {selected.count}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Menu ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label={ariaLabel}
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-0.5 shadow-xl"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition ${
                    isSelected ? "bg-secondary/5" : "hover:bg-gray-50"
                  }`}
                >
                  {renderIcon(opt, isSelected)}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs ${
                        isSelected
                          ? "font-bold text-secondary"
                          : "font-semibold text-gray-800"
                      }`}
                    >
                      {opt.label}
                    </p>
                    {variant === "type" && opt.description && (
                      <p className="truncate text-[10px] text-gray-500">
                        {opt.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-secondary/10 text-secondary"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {opt.count}
                  </span>

                  {isSelected && (
                    <Check
                      className="h-3.5 w-3.5 flex-shrink-0 text-secondary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const DeliveryCard = ({
  order,
  onUpdate,
  readOnly,
  onOpenLiveTracking,
  liveDriverLocations = {},
  onViewOnMap,
  t,
}: any) => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const [filterType, setFilterType] = useState<
    "all" | "in_house" | "third_party"
  >("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<
    "all" | "motorcycle" | "car" | "bicycle" | "van" | "foot"
  >("all");

  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">(
    "distance",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [routeData, setRouteData] = useState<
    Record<
      number,
      {
        distanceKm: number | null;
        durationMinutes: number | null;
        legOneDistanceKm?: number;
        legOneDurationMinutes?: number;
        legTwoDistanceKm?: number;
        legTwoDurationMinutes?: number;
        loading: boolean;
        error?: boolean;
        source?: "osrm" | "cache" | "haversine";
        mode?: "full_trip" | "pickup_only" | "direct_customer";
      }
    >
  >({});
  const [showMapPreview, setShowMapPreview] = useState(false);

  const [usernameMap, setUsernameMap] = useState<Map<string, string>>(
    new Map(),
  );
  const { showToast } = useToast();
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [ratingMap, setRatingMap] = useState<
    Map<string, { average_rating: string; total_reviews: number }>
  >(new Map());
  const [driverLocations, setDriverLocations] = useState<
    Record<
      number,
      {
        latitude: number;
        longitude: number;
        is_online?: boolean;
        updated_at?: number;
      }
    >
  >({});

  const delivery = order.delivery;
  const isTerminal =
    order.status?.toLowerCase() === "fulfilled" ||
    order.status?.toLowerCase() === "completed" ||
    order.status?.toLowerCase() === "delivered" ||
    order.status?.toLowerCase() === "cancelled" ||
    order.status?.toLowerCase() === "refunded" ||
    order.status?.toLowerCase() === "failed";

  const canManage =
    !readOnly &&
    !isTerminal &&
    (order.status?.toLowerCase() === "processing" ||
      order.status?.toLowerCase() === "replacement_in_progress");
  const cod = order.payment_method === "cod";
  const deliveryStatus = delivery?.status?.toLowerCase() === "picked_up";

  const routeCacheRef = useRef<
    Map<
      string,
      { distanceKm: number; durationMinutes: number; timestamp: number }
    >
  >(new Map());
  const routeRequestTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    if (!showFilters) return;

    const isMobile = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches;

    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile()) return;
      if (
        filtersRef.current &&
        !filtersRef.current.contains(e.target as Node)
      ) {
        setShowFilters(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFilters(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showFilters]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const isValidCoordinate = (lat: number, lon: number): boolean =>
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  const parseCoordinatePair = (lat: unknown, lon: unknown) => {
    if (lat == null || lon == null) return null;
    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    return isValidCoordinate(parsedLat, parsedLon)
      ? { lat: parsedLat, lon: parsedLon }
      : null;
  };

  const getCustomerLocation = () => {
    const candidates = [
      {
        value: parseCoordinatePair(
          delivery?.customer_lat,
          delivery?.customer_lon,
        ),
      },
      { value: parseCoordinatePair(order?.shipping_lat, order?.shipping_lon) },
      { value: parseCoordinatePair(order?.customer_lat, order?.customer_lon) },
      {
        value: parseCoordinatePair(
          order?.delivery_address?.lat,
          order?.delivery_address?.lon,
        ),
      },
      {
        value: parseCoordinatePair(
          order?.vendor_orders?.[0]?.delivery?.customer_lat,
          order?.vendor_orders?.[0]?.delivery?.customer_lon,
        ),
      },
      {
        value: parseCoordinatePair(
          order?.vendor_orders?.[0]?.shipping_lat,
          order?.vendor_orders?.[0]?.shipping_lon,
        ),
      },
    ];
    return candidates.find((c) => c.value != null)?.value ?? null;
  };

  const getPickupLocation = () => {
    const directCompany = order?.company;
    const nestedCompany = order?.vendor_orders?.[0]?.company;
    const direct = parseCoordinatePair(
      directCompany?.latitude,
      directCompany?.longitude,
    );
    if (direct) return direct;
    const nested = parseCoordinatePair(
      nestedCompany?.latitude,
      nestedCompany?.longitude,
    );
    return nested ?? null;
  };

  const getVehicleIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "motorcycle":
        return "🏍️";
      case "car":
        return "🚗";
      case "bicycle":
        return "🚲";
      case "van":
        return "🚐";
      case "foot":
        return "🚶";
      default:
        return "🛵";
    }
  };

  const getVehicleName = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "motorcycle":
        return t("deliveryCard.motorcycle");
      case "car":
        return t("deliveryCard.car");
      case "bicycle":
        return t("deliveryCard.bicycle");
      case "van":
        return t("deliveryCard.van");
      case "foot":
        return t("deliveryCard.onFoot");
      default:
        return t("deliveryCard.vehicle");
    }
  };

  const renderRating = (avg?: string, reviews?: number) => {
    if (!avg || avg === "0.00" || !reviews || reviews === 0)
      return t("deliveryCard.noReviews");
    const rating = parseFloat(avg).toFixed(1);
    return `⭐ ${rating} (${reviews})`;
  };

  const fetchDriverRoute = useCallback(
    async (
      driverId: number,
      fromLat: number,
      fromLon: number,
      pickupLat: number | null,
      pickupLon: number | null,
      customerLat: number | null,
      customerLon: number | null,
    ) => {
      const CACHE_TTL = 5 * 60 * 1000;
      const fetchLeg = async (
        from: { lat: number; lon: number },
        to: { lat: number; lon: number },
      ) => {
        const key = `${from.lat.toFixed(5)},${from.lon.toFixed(5)}_${to.lat.toFixed(5)},${to.lon.toFixed(5)}`;
        const cached = routeCacheRef.current.get(key);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return { ...cached, source: "cache" as const };
        }
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);
          const data = await response.json();
          if (data.code !== "Ok" || !data.routes?.length) {
            throw new Error(`OSRM route failed: ${data.code || "unknown"}`);
          }
          const result = {
            distanceKm: data.routes[0].distance / 1000,
            durationMinutes: data.routes[0].duration / 60,
            timestamp: Date.now(),
          };
          routeCacheRef.current.set(key, result);
          return { ...result, source: "osrm" as const };
        } catch {
          const fallbackDistance = calculateDistance(
            from.lat,
            from.lon,
            to.lat,
            to.lon,
          );
          return {
            distanceKm: fallbackDistance,
            durationMinutes: null,
            timestamp: Date.now(),
            source: "haversine" as const,
          };
        }
      };

      setRouteData((prev) => ({
        ...prev,
        [driverId]: { distanceKm: null, durationMinutes: null, loading: true },
      }));

      const driver = { lat: fromLat, lon: fromLon };
      const customer =
        customerLat != null && customerLon != null
          ? { lat: customerLat, lon: customerLon }
          : null;
      const pickup =
        pickupLat != null && pickupLon != null
          ? { lat: pickupLat, lon: pickupLon }
          : null;

      try {
        if (pickup && !customer) {
          const legOne = await fetchLeg(driver, pickup);
          setRouteData((prev) => ({
            ...prev,
            [driverId]: {
              distanceKm: legOne.distanceKm,
              durationMinutes: legOne.durationMinutes,
              legOneDistanceKm: legOne.distanceKm,
              legOneDurationMinutes: legOne.durationMinutes ?? undefined,
              loading: false,
              source: legOne.source,
              mode: "pickup_only",
            },
          }));
          return;
        }
        if (!pickup && customer) {
          const direct = await fetchLeg(driver, customer);
          setRouteData((prev) => ({
            ...prev,
            [driverId]: {
              distanceKm: direct.distanceKm,
              durationMinutes: direct.durationMinutes,
              legOneDistanceKm: direct.distanceKm,
              legOneDurationMinutes: direct.durationMinutes ?? undefined,
              loading: false,
              source: direct.source,
              mode: "direct_customer",
            },
          }));
          return;
        }
        if (!pickup || !customer) throw new Error("No coordinates");
        const [legOne, legTwo] = await Promise.all([
          fetchLeg(driver, pickup),
          fetchLeg(pickup, customer),
        ]);
        const durationMinutes =
          legOne.durationMinutes != null && legTwo.durationMinutes != null
            ? legOne.durationMinutes + legTwo.durationMinutes
            : null;
        const source =
          legOne.source === "haversine" || legTwo.source === "haversine"
            ? "haversine"
            : legOne.source === "cache" && legTwo.source === "cache"
              ? "cache"
              : "osrm";
        setRouteData((prev) => ({
          ...prev,
          [driverId]: {
            distanceKm: legOne.distanceKm + legTwo.distanceKm,
            durationMinutes,
            legOneDistanceKm: legOne.distanceKm,
            legOneDurationMinutes: legOne.durationMinutes ?? undefined,
            legTwoDistanceKm: legTwo.distanceKm,
            legTwoDurationMinutes: legTwo.durationMinutes ?? undefined,
            loading: false,
            source: source as "osrm" | "cache" | "haversine",
            mode: "full_trip",
          },
        }));
      } catch {
        setRouteData((prev) => ({
          ...prev,
          [driverId]: {
            distanceKm: null,
            durationMinutes: null,
            loading: false,
            error: true,
          },
        }));
      }
    },
    [],
  );

  useEffect(() => {
    if (!showAssignForm || staffList.length === 0) return;
    const cleanups: Array<() => void> = [];
    staffList.forEach((driver) => {
      const driverRef = ref(db, `drivers/${driver.id}`);
      const callback = (snapshot: any) => {
        const data = snapshot.val();
        if (data && data.latitude != null && data.longitude != null) {
          setDriverLocations((prev) => ({ ...prev, [driver.id]: data }));
        }
      };
      onValue(driverRef, callback);
      cleanups.push(() => off(driverRef, "value", callback));
    });
    return () => cleanups.forEach((c) => c());
  }, [showAssignForm, staffList]);

  useEffect(() => {
    return () => {
      routeRequestTimers.current.forEach((t) => clearTimeout(t));
      routeRequestTimers.current.clear();
    };
  }, []);

  const getDriverLiveLocation = (driverId: number) => {
    const localLoc = driverLocations[driverId];
    if (localLoc && localLoc.latitude != null && localLoc.longitude != null) {
      return {
        lat: Number(localLoc.latitude),
        lon: Number(localLoc.longitude),
        is_online: localLoc.is_online !== false,
      };
    }
    if (liveDriverLocations && typeof liveDriverLocations === "object") {
      const entries = Object.values(liveDriverLocations);
      for (const entry of entries as any[]) {
        if (entry && typeof entry === "object") {
          if (entry.driver_id === driverId || entry.id === driverId) {
            return {
              lat: Number(entry.lat ?? entry.latitude),
              lon: Number(entry.lon ?? entry.longitude ?? entry.lng),
              is_online: entry.is_online !== false,
            };
          }
        }
      }
      const direct =
        (liveDriverLocations as any)[driverId] ||
        (liveDriverLocations as any)[String(driverId)];
      if (direct) {
        return {
          lat: Number(direct.lat ?? direct.latitude),
          lon: Number(direct.lon ?? direct.longitude ?? direct.lng),
          is_online: direct.is_online !== false,
        };
      }
    }
    return null;
  };

  const getReferenceLocation = () => {
    const storeLat = order.company?.latitude
      ? parseFloat(order.company.latitude)
      : null;
    const storeLon = order.company?.longitude
      ? parseFloat(order.company.longitude)
      : null;
    if (
      storeLat != null &&
      storeLon != null &&
      isValidCoordinate(storeLat, storeLon)
    ) {
      return { lat: storeLat, lon: storeLon, type: "store" };
    }
    const custLoc = getCustomerLocation();
    if (custLoc) return { ...custLoc, type: "customer" };
    return null;
  };

  const staffWithDistance = useMemo(() => {
    const refLoc = getReferenceLocation();
    return staffList.map((s) => {
      const liveLoc = getDriverLiveLocation(s.id);
      if (liveLoc && isValidCoordinate(liveLoc.lat, liveLoc.lon)) {
        const distance = refLoc
          ? calculateDistance(refLoc.lat, refLoc.lon, liveLoc.lat, liveLoc.lon)
          : null;
        return {
          ...s,
          calculated_distance:
            distance != null ? Math.round(distance * 10) / 10 : null,
          location_source: "live",
          isLive: true,
          isOnline: liveLoc.is_online !== false,
          live_lat: liveLoc.lat,
          live_lon: liveLoc.lon,
          is_in_addis_ababa: isWithinAddisAbaba(liveLoc.lat, liveLoc.lon),
        };
      }
      if (s.current_lat != null && s.current_lng != null) {
        const currentLat = parseFloat(s.current_lat);
        const currentLng = parseFloat(s.current_lng);
        if (isValidCoordinate(currentLat, currentLng)) {
          const distance = refLoc
            ? calculateDistance(refLoc.lat, refLoc.lon, currentLat, currentLng)
            : null;
          return {
            ...s,
            calculated_distance:
              distance != null ? Math.round(distance * 10) / 10 : null,
            location_source: "current",
            isLive: false,
            isOnline: true,
            live_lat: currentLat,
            live_lon: currentLng,
            is_in_addis_ababa: isWithinAddisAbaba(currentLat, currentLng),
          };
        }
      }
      if (s.last_lat != null && s.last_lon != null) {
        const lastLat = parseFloat(s.last_lat);
        const lastLon = parseFloat(s.last_lon);
        if (isValidCoordinate(lastLat, lastLon)) {
          const distance = refLoc
            ? calculateDistance(refLoc.lat, refLoc.lon, lastLat, lastLon)
            : null;
          return {
            ...s,
            calculated_distance:
              distance != null ? Math.round(distance * 10) / 10 : null,
            location_source: "last_known",
            isLive: false,
            isOnline: true,
            live_lat: lastLat,
            live_lon: lastLon,
            is_in_addis_ababa: isWithinAddisAbaba(lastLat, lastLon),
          };
        }
      }
      if (s.distance_km != null && !isNaN(parseFloat(s.distance_km))) {
        return {
          ...s,
          calculated_distance: Math.round(parseFloat(s.distance_km) * 10) / 10,
          location_source: "api",
          isLive: false,
          isOnline: true,
          is_in_addis_ababa: true,
        };
      }
      return {
        ...s,
        calculated_distance: null,
        location_source: null,
        isLive: false,
        isOnline: true,
        is_in_addis_ababa: true,
      };
    });
  }, [
    staffList,
    driverLocations,
    liveDriverLocations,
    order.company?.latitude,
    order.company?.longitude,
    delivery?.customer_lat,
    delivery?.customer_lon,
    order?.customer_lat,
    order?.customer_lon,
    order?.delivery_address?.lat,
    order?.delivery_address?.lon,
  ]);

  const filteredStaffList = useMemo(() => {
    let filtered = [...staffWithDistance];
    if (filterType === "in_house") {
      filtered = filtered.filter((s) => s.is_in_house === true);
    } else if (filterType === "third_party") {
      filtered = filtered.filter((s) => s.is_in_house === false);
    }
    if (vehicleTypeFilter !== "all") {
      filtered = filtered.filter(
        (s) =>
          s.vehicle_type?.toLowerCase() === vehicleTypeFilter.toLowerCase(),
      );
    }
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(search) ||
          s.phone?.toLowerCase().includes(search) ||
          s.username?.toLowerCase().includes(search) ||
          s.company_name?.toLowerCase().includes(search),
      );
    }
    return filtered.sort((a, b) => {
      if (sortBy === "distance") {
        const distA =
          routeData[a.id]?.distanceKm ?? a.calculated_distance ?? 999999;
        const distB =
          routeData[b.id]?.distanceKm ?? b.calculated_distance ?? 999999;
        return sortOrder === "asc" ? distA - distB : distB - distA;
      } else if (sortBy === "rating") {
        const ratingA = parseFloat(a.average_rating || "0");
        const ratingB = parseFloat(b.average_rating || "0");
        return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
      } else {
        const nameA = a.name?.toLowerCase() || "";
        const nameB = b.name?.toLowerCase() || "";
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    });
  }, [
    staffWithDistance,
    filterType,
    vehicleTypeFilter,
    searchTerm,
    sortBy,
    sortOrder,
    routeData,
  ]);

  const totalPages = Math.ceil(filteredStaffList.length / itemsPerPage);
  const paginatedStaffList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaffList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaffList, currentPage, itemsPerPage]);

  useEffect(() => {
    if (!showAssignForm || paginatedStaffList.length === 0) return;
    const customerLoc = getCustomerLocation();
    const pickupLoc = getPickupLocation();
    if (!customerLoc && !pickupLoc) return;

    paginatedStaffList.forEach((driver) => {
      if (
        driver.live_lat != null &&
        driver.live_lon != null &&
        isValidCoordinate(driver.live_lat, driver.live_lon)
      ) {
        const timerKey = driver.id;
        if (routeRequestTimers.current.has(timerKey)) {
          clearTimeout(routeRequestTimers.current.get(timerKey));
        }
        routeRequestTimers.current.set(
          timerKey,
          setTimeout(() => {
            fetchDriverRoute(
              driver.id,
              driver.live_lat,
              driver.live_lon,
              pickupLoc?.lat ?? null,
              pickupLoc?.lon ?? null,
              customerLoc?.lat ?? null,
              customerLoc?.lon ?? null,
            );
            routeRequestTimers.current.delete(timerKey);
          }, 300),
        );
      }
    });
  }, [
    paginatedStaffList,
    showAssignForm,
    fetchDriverRoute,
    order.company?.latitude,
    order.company?.longitude,
    delivery?.customer_lat,
    delivery?.customer_lon,
    order?.shipping_lat,
    order?.shipping_lon,
    order?.customer_lat,
    order?.customer_lon,
    order?.delivery_address?.lat,
    order?.delivery_address?.lon,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterType,
    vehicleTypeFilter,
    searchTerm,
    sortBy,
    sortOrder,
    itemsPerPage,
  ]);

  const getOrderFailureReason = () => {
    if (delivery?.failure_reason) return delivery.failure_reason;
    if (delivery?.cancellation_reason) return delivery.cancellation_reason;
    if (delivery?.cancelled_reason) return delivery.cancelled_reason;
    if (delivery?.reason) return delivery.reason;
    if (delivery?.status_reason) return delivery.status_reason;
    if (order?.vendor_order_detail?.failure_reason)
      return order.vendor_order_detail.failure_reason;
    if (order?.vendor_order_detail?.cancellation_reason)
      return order.vendor_order_detail.cancellation_reason;
    if (order?.vendor_order_detail?.cancelled_reason)
      return order.vendor_order_detail.cancelled_reason;
    if (order?.vendor_order_detail?.reason)
      return order.vendor_order_detail.reason;
    if (order?.failure_reason) return order.failure_reason;
    if (order?.cancellation_reason) return order.cancellation_reason;
    if (order?.cancelled_reason) return order.cancelled_reason;
    if (order?.reason) return order.reason;
    if (order?.status_reason) return order.status_reason;
    if (order?.cancel_reason) return order.cancel_reason;
    if (order?.delivery_notes) return order.delivery_notes;
    if (order?.notes) return order.notes;
    if (order?.admin_notes) return order.admin_notes;
    if (order?.cancellation_note) return order.cancellation_note;
    return null;
  };

  const failureReason = getOrderFailureReason();
  const isOrderFailed =
    order.status?.toLowerCase() === "cancelled" ||
    order.status?.toLowerCase() === "failed" ||
    order.status?.toLowerCase() === "rejected" ||
    delivery?.status?.toLowerCase() === "failed" ||
    delivery?.status?.toLowerCase() === "cancelled" ||
    delivery?.status?.toLowerCase() === "rejected";

  const fetchStaff = async (
    filter: "all" | "in_house" | "third_party",
    vehicleType?: string,
  ) => {
    if (!order.company?.slug) return;
    setLoadingStaff(true);
    try {
      const params: any = {
        vendor_order_id: order.id,
        driver_type:
          filter === "all" ? "all" : filter === "in_house" ? "in_house" : "3pl",
      };
      if (vehicleType && vehicleType !== "all") {
        params.vehicle_type = vehicleType;
      }
      const res = await getAvailableDeliveryDrivers(order.company.slug, params);
      const allDrivers = res.data || [];
      const mapped = allDrivers.map((s: any) => ({
        id: s.id,
        name: `${s.name || s.username || ""}`.trim(),
        phone: s.phone,
        username: s.username,
        average_rating: s.average_rating,
        total_reviews: s.total_reviews,
        vehicle_type: s.vehicle_type,
        company_name: s.company_name,
        is_in_house: s.is_in_house,
        distance_km: s.distance_km,
        last_lat: s.last_lat,
        last_lon: s.last_lon,
        current_lat: s.current_lat,
        current_lng: s.current_lng,
        active_orders_count: s.active_orders_count ?? 0,
        driver_state: s.driver_state || "idle",
        is_at_vendor: !!s.is_at_vendor,
        is_en_route: !!s.is_en_route,
        can_batch: !!s.can_batch,
      }));
      setStaffList(mapped);
      const rMap = new Map();
      mapped.forEach((staff: any) => {
        if (staff.phone) {
          rMap.set(staff.phone, {
            average_rating: staff.average_rating,
            total_reviews: staff.total_reviews,
          });
        }
      });
      setRatingMap(rMap);
      const uMap = new Map();
      mapped.forEach((staff: any) => {
        if (staff.phone && staff.username)
          uMap.set(staff.phone, staff.username);
      });
      setUsernameMap(uMap);
    } catch {
      showToast("error", t("deliveryCard.loadStaffFailed"));
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (showAssignForm) {
      fetchStaff(filterType, vehicleTypeFilter);
      setSearchTerm("");
      setSelectedUserId("");
    }
  }, [showAssignForm, filterType, vehicleTypeFilter, order.company?.slug]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const selectedDriverObj = staffList.find(
        (s) => s.id === Number(selectedUserId),
      );
      if (
        selectedDriverObj &&
        isDriverOutsideAddis(selectedDriverObj, driverLocations)
      ) {
        showToast(
          "error",
          t("deliveryCard.outsideAddisToast", {
            name: selectedDriverObj.name,
          }),
        );
        setAssigning(false);
        return;
      }

      if (delivery) {
        await updateDeliveryPerson(
          delivery.id.toString(),
          Number(selectedUserId),
        );
      } else {
        await assignDelivery({
          vendor_order: order.id,
          delivery_person: Number(selectedUserId),
        });
      }
      await onUpdate();
      if (selectedDriverObj?.is_en_route) {
        showToast("success", t("deliveryCard.assignEnRouteSuccess"));
      } else if (selectedDriverObj?.is_at_vendor) {
        showToast("success", t("deliveryCard.assignAtVendorSuccess"));
      } else {
        showToast("success", t("deliveryCard.assignSuccess"));
      }
      setShowAssignForm(false);
    } catch {
      showToast("error", t("deliveryCard.assignFailed"));
    } finally {
      setAssigning(false);
    }
  };

  const formatDistance = (distance: number | null | undefined) => {
    if (distance == null) return "—";
    if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
    return `${distance.toFixed(1)} km`;
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (minutes == null) return "";
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `~${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `~${hours}h ${mins}m`;
  };

  const handleViewOnMap = () => {
    if (onViewOnMap && order.id) onViewOnMap(order.id);
  };

  const bestMatchDriver = useMemo(() => {
    if (
      filteredStaffList.length === 0 ||
      sortBy !== "distance" ||
      sortOrder !== "asc"
    )
      return null;
    const first = filteredStaffList.find((d) => d.is_in_addis_ababa !== false);
    if (
      first &&
      (first.live_lat != null || first.calculated_distance != null)
    ) {
      return first;
    }
    return null;
  }, [filteredStaffList, sortBy, sortOrder]);

  const selectedDriver = useMemo(
    () => staffList.find((s) => s.id === Number(selectedUserId)),
    [staffList, selectedUserId],
  );

  const selectedDriverIsOutside = useMemo(
    () =>
      selectedDriver
        ? isDriverOutsideAddis(selectedDriver, driverLocations)
        : false,
    [selectedDriver, driverLocations],
  );

  const activeFilterCount =
    (filterType !== "all" ? 1 : 0) + (vehicleTypeFilter !== "all" ? 1 : 0);

  const inHouseCount = staffWithDistance.filter((s) => s.is_in_house).length;
  const thirdPartyCount = staffWithDistance.filter(
    (s) => !s.is_in_house,
  ).length;

  const allCount = staffWithDistance.length;
  const inHouseFilterCount = staffWithDistance.filter(
    (s) => s.is_in_house,
  ).length;
  const thirdPartyFilterCount = staffWithDistance.filter(
    (s) => !s.is_in_house,
  ).length;

  const vehicleCounts: Record<string, number> = {
    all: staffWithDistance.length,
    motorcycle: staffWithDistance.filter(
      (s) => s.vehicle_type?.toLowerCase() === "motorcycle",
    ).length,
    car: staffWithDistance.filter(
      (s) => s.vehicle_type?.toLowerCase() === "car",
    ).length,
    bicycle: staffWithDistance.filter(
      (s) => s.vehicle_type?.toLowerCase() === "bicycle",
    ).length,
    van: staffWithDistance.filter(
      (s) => s.vehicle_type?.toLowerCase() === "van",
    ).length,
    foot: staffWithDistance.filter(
      (s) => s.vehicle_type?.toLowerCase() === "foot",
    ).length,
  };

  return (
    <>
      <Card
        titleKey="deliveryCard.title"
        icon={Truck}
        status={delivery?.status}
        className={
          (!delivery && deliveryStatus) || canManage || cod
            ? "border-gray-200 ring-1 ring-gray-100"
            : "border-gray-200"
        }
        t={t}
      >
        <AnimatePresence mode="wait">
          {!showAssignForm ? (
            <motion.div
              key="delivery-summary"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              {delivery?.delivery_person_name ? (
                <>
                  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                            {t("deliveryCard.assignedPerson")}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {t("deliveryCard.assignedPersonSubtitle")}
                          </p>
                        </div>
                        <StatusBadge
                          t={t}
                          status={delivery.status || "pending"}
                        />
                      </div>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3.5">
                          {delivery.delivery_person_image ? (
                            <button
                              type="button"
                              onClick={() => setShowFullscreenImage(true)}
                              className="group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:h-16 sm:w-16"
                            >
                              <img
                                src={delivery.delivery_person_image}
                                alt={
                                  delivery.delivery_person_username ||
                                  delivery.delivery_person_name
                                }
                                className="h-full w-full object-cover"
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                                <ZoomIn className="h-4 w-4 text-white opacity-0 transition group-hover:opacity-100" />
                              </span>
                            </button>
                          ) : (
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/5 text-lg font-bold text-secondary sm:h-16 sm:w-16">
                              {getInitials(
                                usernameMap.get(
                                  delivery.delivery_person_phone,
                                ) || delivery.delivery_person_name,
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="truncate text-base font-semibold text-gray-950 sm:text-lg">
                                {usernameMap.get(
                                  delivery.delivery_person_phone,
                                ) || delivery.delivery_person_name}
                              </h5>
                              {delivery.logistics_company_name ? (
                                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                  {t("deliveryCard.threePL")}
                                </span>
                              ) : (
                                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  {t("deliveryCard.inHouse")}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {delivery.logistics_company_name ||
                                t("deliveryCard.companyDeliveryTeam")}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="font-medium">
                                  {delivery.delivery_person_phone ||
                                    t("deliveryCard.noPhone")}
                                </span>
                                <CopyButton
                                  text={delivery.delivery_person_phone}
                                />
                              </span>
                              {ratingMap.has(
                                delivery.delivery_person_phone,
                              ) && (
                                <span className="inline-flex items-center gap-1.5 font-medium text-gray-600">
                                  {renderRating(
                                    ratingMap.get(
                                      delivery.delivery_person_phone,
                                    )!.average_rating,
                                    ratingMap.get(
                                      delivery.delivery_person_phone,
                                    )!.total_reviews,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {delivery?.status === "out_for_delivery" &&
                            onOpenLiveTracking && (
                              <button
                                type="button"
                                onClick={onOpenLiveTracking}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                                </span>
                                {t("deliveryCard.liveTracking")}
                              </button>
                            )}
                          {getFulfillmentKind(order) === "delivery" && (
                            <button
                              type="button"
                              onClick={handleViewOnMap}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                            >
                              <MapPin className="h-3.5 w-3.5 text-secondary" />
                              {t("deliveryCard.viewMap")}
                            </button>
                          )}
                          {!deliveryStatus &&
                            (canManage || cod) &&
                            !isTerminal && (
                              <button
                                type="button"
                                onClick={() => setShowAssignForm(true)}
                                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-1.5 py-2 text-xs font-semibold transition ${
                                  delivery?.status === "declined" ||
                                  delivery?.status === "expired"
                                    ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                                    : "border-secondary/20 bg-secondary/5 text-secondary hover:bg-secondary/10"
                                }`}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                {t("deliveryCard.change")}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {isOrderFailed && failureReason && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-rose-900">
                          {t("deliveryCard.deliveryIssue")}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-rose-700">
                          {failureReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {delivery?.attempts && delivery.attempts.length > 0 && (
                    <section className="rounded-2xl border border-gray-200 bg-white">
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-gray-400" />
                          <p className="text-xs font-semibold text-gray-800">
                            {t("deliveryCard.dispatchHistory")}
                          </p>
                        </div>
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
                          {delivery.attempts.length}{" "}
                          {delivery.attempts.length === 1
                            ? t("deliveryCard.attemptSingular")
                            : t("deliveryCard.attemptPlural")}
                        </span>
                      </div>
                      <div className="max-h-52 divide-y divide-gray-100 overflow-y-auto">
                        {delivery.attempts.map((att: any) => {
                          const s = att.status?.toLowerCase();
                          const statusClass =
                            s === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s === "declined"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : s === "expired"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : s === "reassigned"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200";
                          return (
                            <div
                              key={att.id}
                              className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-xs font-semibold text-gray-800">
                                    {att.driver_name ||
                                      `Delivery Person #${att.driver}`}
                                  </p>
                                  {att.driver_phone && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      ({att.driver_phone})
                                    </span>
                                  )}
                                  {att.logistics_company_name ? (
                                    <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                                      {t("deliveryCard.threePL")} •{" "}
                                      {att.logistics_company_name}
                                    </span>
                                  ) : (
                                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                                      {t("deliveryCard.inHouse")}
                                    </span>
                                  )}
                                </div>
                                {att.decline_reason && (
                                  <p className="mt-1 text-[11px] text-gray-600">
                                    <span className="font-medium text-gray-700">
                                      {t("deliveryCard.deliveryIssue")}:
                                    </span>{" "}
                                    {att.decline_reason}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-2">
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase ${statusClass}`}
                                >
                                  {s === "expired"
                                    ? t("deliveryCard.expiredTimeout")
                                    : att.status}
                                </span>
                                {att.assigned_at && (
                                  <span className="hidden text-[10px] text-gray-400 sm:inline">
                                    {new Date(
                                      att.assigned_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-5 py-7 text-center sm:px-8 sm:py-8">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                    <Truck className="h-5 w-5 text-gray-400" />
                  </div>
                  <h5 className="mt-3 text-sm font-semibold text-gray-900">
                    {delivery?.attempts && delivery.attempts.length > 0
                      ? t("deliveryCard.orderNeedsReassignment")
                      : t("deliveryCard.noDeliveryPerson")}
                  </h5>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
                    {delivery?.attempts && delivery.attempts.length > 0
                      ? t("deliveryCard.reassignHint")
                      : t("deliveryCard.assignHint")}
                  </p>
                  <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                    {!deliveryStatus && canManage && !isTerminal && (
                      <button
                        type="button"
                        onClick={() => setShowAssignForm(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary-light"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {delivery?.attempts && delivery.attempts.length > 0
                          ? t("deliveryCard.reassignPerson")
                          : t("deliveryCard.assignPerson")}
                      </button>
                    )}
                    {getFulfillmentKind(order) === "delivery" && (
                      <button
                        type="button"
                        onClick={handleViewOnMap}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <MapPin className="h-3.5 w-3.5 text-secondary" />
                        {t("deliveryCard.viewDeliveryMap")}
                      </button>
                    )}
                  </div>
                  {isOrderFailed && failureReason && (
                    <div className="mx-auto mt-4 flex max-w-lg items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                      <div>
                        <p className="text-xs font-semibold text-rose-900">
                          {t("deliveryCard.deliveryIssue")}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-rose-700">
                          {failureReason}
                        </p>
                      </div>
                    </div>
                  )}
                  {delivery?.attempts && delivery.attempts.length > 0 && (
                    <div className="mt-6 text-left">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                          <History className="h-3.5 w-3.5 text-gray-400" />
                          <span>{t("deliveryCard.previousAttempts")}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {delivery.attempts.length}{" "}
                          {t("deliveryCard.attemptPlural")}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white max-h-48 overflow-y-auto">
                        {delivery.attempts.map((att: any) => {
                          const s = att.status?.toLowerCase();
                          const statusClass =
                            s === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s === "declined"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : s === "expired"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : s === "reassigned"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200";
                          return (
                            <div
                              key={att.id}
                              className="p-3 flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800">
                                  {att.driver_name ||
                                    `Delivery Person #${att.driver}`}
                                </p>
                                {att.decline_reason && (
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {att.decline_reason}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`rounded border px-2 py-0.5 text-[9px] font-semibold uppercase ${statusClass}`}
                              >
                                {s === "expired"
                                  ? t("deliveryCard.expiredShort")
                                  : att.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="driver-assignment"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-secondary/15 bg-secondary/5 text-secondary">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-bold text-gray-950">
                    {delivery?.delivery_person_name ||
                    (delivery?.attempts && delivery.attempts.length > 0)
                      ? t("deliveryCard.reassignTitle")
                      : t("deliveryCard.assignTitle")}
                  </h5>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {t("deliveryCard.assignSubtitle")}
                  </p>
                </div>
              </div>

              {showMapPreview ? (
                <>
                  <div className="flex items-center">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setShowMapPreview(false)}
                        className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:text-gray-800"
                      >
                        {t("deliveryCard.listToggle")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapPreview(true)}
                        className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-900 shadow-sm transition"
                      >
                        {t("deliveryCard.mapToggle")}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex min-h-[280px] items-center justify-center p-8 text-center">
                      <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                          <MapPin className="h-5 w-5 text-secondary" />
                        </div>
                        <h6 className="mt-3 text-sm font-semibold text-gray-900">
                          {t("deliveryCard.mapPreviewTitle")}
                        </h6>
                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-500">
                          {t("deliveryCard.mapPreviewDescription")}
                        </p>
                        <button
                          type="button"
                          onClick={handleViewOnMap}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary-light"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          {t("deliveryCard.openFullMap")}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setShowMapPreview(false)}
                        className="rounded-md bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-900 shadow-sm transition"
                      >
                        {t("deliveryCard.listToggle")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapPreview(true)}
                        className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-gray-500 transition hover:text-gray-800"
                      >
                        {t("deliveryCard.mapToggle")}
                      </button>
                    </div>

                    <div className="relative z-30 min-w-0 flex-shrink-0 sm:min-w-[180px]">
                      <CustomSelect
                        value={`${sortBy}|${sortOrder}`}
                        onChange={(value: string) => {
                          const [field, order] = value.split("|");
                          setSortBy(field as "distance" | "rating" | "name");
                          setSortOrder(order as "asc" | "desc");
                        }}
                        ariaLabel={t("deliveryCard.sortAria")}
                        options={[
                          {
                            value: "distance|asc",
                            label: t("deliveryCard.sortDistanceNearest"),
                          },
                          {
                            value: "distance|desc",
                            label: t("deliveryCard.sortDistanceFarthest"),
                          },
                          {
                            value: "rating|desc",
                            label: t("deliveryCard.sortRatingHighest"),
                          },
                          {
                            value: "name|asc",
                            label: t("deliveryCard.sortNameAsc"),
                          },
                          {
                            value: "name|desc",
                            label: t("deliveryCard.sortNameDesc"),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("deliveryCard.searchPlaceholder")}
                        aria-label={t("deliveryCard.searchAria")}
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-secondary/50 focus:ring-2 focus:ring-secondary/10"
                      />
                    </div>

                    <div className="relative shrink-0" ref={filtersRef}>
                      <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        aria-haspopup="dialog"
                        aria-expanded={showFilters}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${
                          activeFilterCount > 0
                            ? "border-secondary bg-secondary/5 text-secondary"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Filter className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          {t("deliveryCard.filters")}
                        </span>
                        {activeFilterCount > 0 && (
                          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-bold text-white">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {showFilters && (
                          <>
                            <motion.div
                              key="filter-backdrop"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
                              onClick={() => setShowFilters(false)}
                              aria-hidden="true"
                            />

                            <motion.div
                              key="filter-panel"
                              initial={{ opacity: 0, y: 12, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.16, ease: "easeOut" }}
                              role="dialog"
                              aria-modal="true"
                              aria-label={t("deliveryCard.filterTitle")}
                              className={[
                                "z-50 flex flex-col overflow-hidden",
                                "border border-gray-200/90 bg-white",
                                "shadow-xl shadow-gray-900/10",
                                "fixed inset-x-0 bottom-0",
                                "max-h-[min(55vh,420px)] rounded-t-2xl",
                                "sm:absolute sm:inset-x-auto sm:bottom-auto",
                                "sm:right-0 sm:top-12",
                                "sm:max-h-[min(70vh,420px)]",
                                "sm:w-[300px] sm:max-w-[calc(100vw-24px)]",
                                "sm:rounded-xl",
                              ].join(" ")}
                              style={{
                                paddingBottom: "env(safe-area-inset-bottom)",
                              }}
                            >
                              <div className="flex shrink-0 justify-center pt-2 sm:hidden">
                                <span
                                  className="h-1 w-8 rounded-full bg-gray-300"
                                  aria-hidden="true"
                                />
                              </div>

                              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3.5 py-2.5">
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                                    <Filter className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-xs font-bold text-gray-900">
                                      {t("deliveryCard.filterTitle")}
                                    </h3>
                                    <p className="text-[10px] text-gray-500">
                                      {t("deliveryCard.filterSubtitle")}
                                    </p>
                                  </div>
                                  <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-semibold text-gray-600">
                                    {filteredStaffList.length}
                                  </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {activeFilterCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFilterType("all");
                                        setVehicleTypeFilter("all");
                                        setSelectedUserId("");
                                      }}
                                      className="rounded-md px-2 py-1.5 text-[10px] font-semibold text-secondary hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                                    >
                                      {t("deliveryCard.clearAll")}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setShowFilters(false)}
                                    aria-label={t("deliveryCard.closeFilters")}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3.5 py-3">
                                <section>
                                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {t("deliveryCard.deliveryPersonLabel")}
                                  </label>
                                  <FilterDropdown
                                    variant="type"
                                    value={filterType}
                                    onChange={(v) => {
                                      setFilterType(
                                        v as "all" | "in_house" | "third_party",
                                      );
                                      setSelectedUserId("");
                                    }}
                                    ariaLabel={t(
                                      "deliveryCard.deliveryPersonLabel",
                                    )}
                                    options={[
                                      {
                                        value: "all",
                                        label: t(
                                          "deliveryCard.allDeliveryPersons",
                                        ),
                                        description: t(
                                          "deliveryCard.allDeliveryPersonsDesc",
                                        ),
                                        count: allCount,
                                        accent: "secondary",
                                        icon: <Users className="h-3 w-3" />,
                                      },
                                      {
                                        value: "in_house",
                                        label: t("deliveryCard.inHouseOption"),
                                        description: t(
                                          "deliveryCard.inHouseOptionDesc",
                                        ),
                                        count: inHouseFilterCount,
                                        accent: "emerald",
                                        icon: <Truck className="h-3 w-3" />,
                                      },
                                      {
                                        value: "third_party",
                                        label: t(
                                          "deliveryCard.thirdPartyOption",
                                        ),
                                        description: t(
                                          "deliveryCard.thirdPartyOptionDesc",
                                        ),
                                        count: thirdPartyFilterCount,
                                        accent: "blue",
                                        icon: <Building2 className="h-3 w-3" />,
                                      },
                                    ]}
                                  />
                                </section>

                                <section>
                                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {t("deliveryCard.vehicleTypeLabel")}
                                  </label>
                                  <FilterDropdown
                                    variant="vehicle"
                                    value={vehicleTypeFilter}
                                    onChange={(v) => {
                                      setVehicleTypeFilter(
                                        v as
                                          | "all"
                                          | "motorcycle"
                                          | "car"
                                          | "bicycle"
                                          | "van"
                                          | "foot",
                                      );
                                      setSelectedUserId("");
                                    }}
                                    ariaLabel={t(
                                      "deliveryCard.vehicleTypeLabel",
                                    )}
                                    options={[
                                      {
                                        value: "all",
                                        emoji: "🚚",
                                        label: t("deliveryCard.allVehicles"),
                                        count: vehicleCounts.all,
                                      },
                                      {
                                        value: "motorcycle",
                                        emoji: "🏍️",
                                        label: t("deliveryCard.motorcycle"),
                                        count: vehicleCounts.motorcycle,
                                      },
                                      {
                                        value: "car",
                                        emoji: "🚗",
                                        label: t("deliveryCard.car"),
                                        count: vehicleCounts.car,
                                      },
                                      {
                                        value: "bicycle",
                                        emoji: "🚲",
                                        label: t("deliveryCard.bicycle"),
                                        count: vehicleCounts.bicycle,
                                      },
                                      {
                                        value: "van",
                                        emoji: "🚐",
                                        label: t("deliveryCard.van"),
                                        count: vehicleCounts.van,
                                      },
                                      {
                                        value: "foot",
                                        emoji: "🚶",
                                        label: t("deliveryCard.onFoot"),
                                        count: vehicleCounts.foot,
                                      },
                                    ]}
                                  />
                                </section>
                              </div>

                              <div className="shrink-0 border-t border-gray-100 bg-white px-3.5 py-2.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={activeFilterCount === 0}
                                    onClick={() => {
                                      setFilterType("all");
                                      setVehicleTypeFilter("all");
                                      setSelectedUserId("");
                                    }}
                                    className="h-9 shrink-0 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                                  >
                                    {t("deliveryCard.reset")}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setShowFilters(false)}
                                    className="flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-secondary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2"
                                  >
                                    {filteredStaffList.length === 1
                                      ? t("deliveryCard.showCountOne", {
                                          count: filteredStaffList.length,
                                        })
                                      : t("deliveryCard.showCountMany", {
                                          count: filteredStaffList.length,
                                        })}
                                    <Check className="h-3.5 w-3.5 shrink-0" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
                    <h6 className="text-sm font-bold text-gray-900">
                      {t("deliveryCard.availablePersons")}
                    </h6>
                    <p className="text-[11px] text-gray-500">
                      {t("deliveryCard.inHouseThirdPartySummary", {
                        inHouse: inHouseCount,
                        thirdParty: thirdPartyCount,
                      })}
                    </p>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {filterType !== "all" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/5 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                          {filterType === "in_house"
                            ? t("deliveryCard.inHouseShort")
                            : t("deliveryCard.threePL")}
                          <button
                            type="button"
                            onClick={() => setFilterType("all")}
                            aria-label={t("deliveryCard.removeTypeFilter")}
                            className="rounded-full p-0.5 transition hover:bg-secondary/15"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      )}
                      {vehicleTypeFilter !== "all" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/5 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                          <span>{getVehicleIcon(vehicleTypeFilter)}</span>
                          {getVehicleName(vehicleTypeFilter)}
                          <button
                            type="button"
                            onClick={() => setVehicleTypeFilter("all")}
                            aria-label={t("deliveryCard.removeVehicleFilter")}
                            className="rounded-full p-0.5 transition hover:bg-secondary/15"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      )}
                    </div>
                  )}

                  {loadingStaff ? (
                    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                      <div className="text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-secondary" />
                        <p className="mt-2 text-xs font-medium text-gray-500">
                          {t("deliveryCard.loadingPersons")}
                        </p>
                      </div>
                    </div>
                  ) : filteredStaffList.length === 0 ? (
                    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
                      <div>
                        <Users className="mx-auto h-7 w-7 text-gray-300" />
                        <p className="mt-2 text-sm font-semibold text-gray-800">
                          {t("deliveryCard.noPersonsFound")}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {searchTerm ||
                          filterType !== "all" ||
                          vehicleTypeFilter !== "all"
                            ? t("deliveryCard.noPersonsFilterHint")
                            : t("deliveryCard.noPersonsAvailable")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                        {paginatedStaffList.map((staff, index) => {
                          const isSelected = selectedUserId === staff.id;
                          const hasLocation = staff.calculated_distance != null;
                          const globalIndex =
                            (currentPage - 1) * itemsPerPage + index;
                          const isNearest =
                            globalIndex === 0 &&
                            sortBy === "distance" &&
                            sortOrder === "asc" &&
                            hasLocation;
                          const routeInfo = routeData[staff.id];
                          const roadDistance = routeInfo?.distanceKm;
                          const roadDuration = routeInfo?.durationMinutes;
                          const isRouteLoading = routeInfo?.loading;
                          const isBestMatch = bestMatchDriver?.id === staff.id;
                          const isOutOfBounds =
                            staff.is_in_addis_ababa === false;

                          return (
                            <button
                              key={staff.id}
                              type="button"
                              onClick={() => setSelectedUserId(staff.id)}
                              aria-pressed={isSelected}
                              aria-disabled={isOutOfBounds}
                              aria-label={`${
                                isSelected
                                  ? t("deliveryCard.deselectAria")
                                  : t("deliveryCard.selectAria")
                              } ${staff.name}`}
                              className={`group relative block w-full px-4 py-4 text-left transition ${
                                isSelected
                                  ? "bg-secondary/[0.04]"
                                  : isOutOfBounds
                                    ? "bg-rose-50/40 hover:bg-rose-50/60"
                                    : "bg-white hover:bg-gray-50/70"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border text-[12px] font-bold ${
                                    isSelected
                                      ? "border-secondary/30 bg-secondary/10 text-secondary"
                                      : isOutOfBounds
                                        ? "border-rose-200 bg-rose-50 text-rose-500"
                                        : "border-gray-200 bg-gray-50 text-gray-600"
                                  }`}
                                  aria-hidden="true"
                                >
                                  {getInitials(staff.name)}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                    <p className="truncate text-sm font-bold text-gray-900">
                                      {staff.name}
                                    </p>
                                    {(isBestMatch || isNearest) && (
                                      <span
                                        title={t(
                                          "deliveryCard.bestMatchTooltip",
                                        )}
                                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
                                      >
                                        {t("deliveryCard.bestMatch")}
                                      </span>
                                    )}
                                    {isOutOfBounds && (
                                      <span
                                        title={t(
                                          "deliveryCard.outsideAddisTooltip",
                                        )}
                                        className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700"
                                      >
                                        {t("deliveryCard.outsideAddis")}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                                    <span className="font-medium">
                                      {staff.is_in_house
                                        ? t("deliveryCard.inHouseShort")
                                        : staff.company_name ||
                                          t("deliveryCard.threePLPartner")}
                                    </span>
                                    <span
                                      className="text-gray-300"
                                      aria-hidden="true"
                                    >
                                      ·
                                    </span>
                                    <span>
                                      {getVehicleName(staff.vehicle_type)}
                                    </span>
                                  </div>

                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                    {staff.location_source === "live" && (
                                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                        {t("deliveryCard.live")}
                                      </span>
                                    )}
                                    {staff.is_at_vendor ? (
                                      <span className="font-semibold text-amber-700">
                                        {t("deliveryCard.atStore")}
                                      </span>
                                    ) : staff.is_en_route ? (
                                      <span className="font-semibold text-indigo-700">
                                        {t("deliveryCard.enRoute")}
                                      </span>
                                    ) : staff.active_orders_count === 0 ? (
                                      <span className="font-semibold text-emerald-700">
                                        {t("deliveryCard.available")}
                                      </span>
                                    ) : (
                                      <span className="font-semibold text-gray-500">
                                        {t("deliveryCard.activeOrders", {
                                          count: staff.active_orders_count,
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-3 self-center">
                                  <div className="hidden text-right sm:block">
                                    {staff.average_rating &&
                                    staff.average_rating !== "0.00" ? (
                                      <p className="text-xs font-bold text-gray-800">
                                        ⭐{" "}
                                        {parseFloat(
                                          staff.average_rating,
                                        ).toFixed(1)}
                                        {staff.total_reviews && (
                                          <span className="ml-1 text-[10px] font-medium text-gray-400">
                                            ({staff.total_reviews})
                                          </span>
                                        )}
                                      </p>
                                    ) : (
                                      <p className="text-xs font-medium text-gray-400">
                                        {t("deliveryCard.noReviews")}
                                      </p>
                                    )}

                                    <div className="mt-1 text-[10px] text-gray-500">
                                      {isRouteLoading ? (
                                        <span className="inline-flex items-center gap-1">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          {t("deliveryCard.calculating")}
                                        </span>
                                      ) : roadDistance != null ? (
                                        <span>
                                          {formatDistance(roadDistance)}
                                          {roadDuration != null && (
                                            <>
                                              {" "}
                                              · {formatDuration(roadDuration)}
                                            </>
                                          )}
                                        </span>
                                      ) : hasLocation ? (
                                        <span>
                                          ~
                                          {formatDistance(
                                            staff.calculated_distance,
                                          )}
                                        </span>
                                      ) : (
                                        <span>
                                          {t(
                                            "deliveryCard.distanceUnavailable",
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <span
                                    aria-hidden="true"
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                                      isOutOfBounds
                                        ? "border-rose-300 bg-rose-50 text-rose-400"
                                        : isSelected
                                          ? "border-secondary bg-secondary text-white"
                                          : "border-gray-300 bg-white text-transparent group-hover:border-secondary/50"
                                    }`}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center justify-between sm:hidden">
                                <span className="text-[10px] text-gray-500">
                                  {staff.average_rating &&
                                  staff.average_rating !== "0.00"
                                    ? `⭐ ${parseFloat(
                                        staff.average_rating,
                                      ).toFixed(1)} (${staff.total_reviews})`
                                    : t("deliveryCard.noReviews")}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {isRouteLoading
                                    ? t("deliveryCard.calculating")
                                    : roadDistance != null
                                      ? formatDistance(roadDistance)
                                      : hasLocation
                                        ? `~${formatDistance(
                                            staff.calculated_distance,
                                          )}`
                                        : t("deliveryCard.distanceUnavailable")}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[10px] font-medium text-gray-400">
                            {t("deliveryCard.pageOf", {
                              current: currentPage,
                              total: totalPages,
                            })}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPage === 1}
                              className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {t("deliveryCard.previous")}
                            </button>
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2)
                                  pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    aria-current={
                                      currentPage === pageNum
                                        ? "page"
                                        : undefined
                                    }
                                    className={`h-8 w-8 rounded-lg text-[10px] font-semibold transition ${
                                      currentPage === pageNum
                                        ? "bg-secondary text-white"
                                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              },
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(totalPages, prev + 1),
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {t("deliveryCard.next")}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="sticky bottom-0 z-10 -mx-2 mt-2 border-t border-gray-200 bg-white/95 px-2 pt-3 backdrop-blur sm:-mx-3 sm:px-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {selectedDriver ? (
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white ${
                                selectedDriverIsOutside
                                  ? "bg-rose-500"
                                  : "bg-secondary"
                              }`}
                            >
                              {selectedDriverIsOutside ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-gray-900">
                                {t("deliveryCard.selected", {
                                  name: selectedDriver.name,
                                })}
                              </p>
                              <p className="truncate text-[10px] text-gray-500">
                                {selectedDriverIsOutside
                                  ? t("deliveryCard.outsideAddisCannotAssign")
                                  : `${
                                      selectedDriver.is_in_house
                                        ? t("deliveryCard.inHouseShort")
                                        : selectedDriver.company_name ||
                                          t("deliveryCard.threePLPartner")
                                    }${
                                      selectedDriver.vehicle_type
                                        ? ` · ${getVehicleName(
                                            selectedDriver.vehicle_type,
                                          )}`
                                        : ""
                                    }`}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400">
                            {t("deliveryCard.selectDriverHint")}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 sm:flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowAssignForm(false)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 sm:flex-none"
                        >
                          {t("deliveryCard.cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={handleAssign}
                          disabled={
                            assigning ||
                            !selectedUserId ||
                            selectedDriverIsOutside
                          }
                          title={
                            selectedDriverIsOutside
                              ? t("deliveryCard.outsideAddisTitle")
                              : undefined
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-secondary-light disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:min-w-[140px]"
                        >
                          {assigning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {t("deliveryCard.assigning")}
                            </>
                          ) : selectedDriverIsOutside ? (
                            <>
                              <AlertCircle className="h-3.5 w-3.5" />
                              {t("deliveryCard.outsideAddisShort")}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              {delivery?.delivery_person_name ||
                              (delivery?.attempts &&
                                delivery.attempts.length > 0)
                                ? t("deliveryCard.reassignButton")
                                : t("deliveryCard.assignButton")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <AnimatePresence>
        {showFullscreenImage && delivery?.delivery_person_image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={t("deliveryCard.imageAria")}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-lg"
            onClick={() => setShowFullscreenImage(false)}
          >
            <button
              type="button"
              onClick={() => setShowFullscreenImage(false)}
              aria-label={t("deliveryCard.closeImageAria")}
              className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:scale-110 hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" />
              <span>{t("deliveryCard.clickToClose")}</span>
            </div>
            <motion.img
              src={delivery.delivery_person_image}
              alt={t("deliveryCard.imageAria")}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
// ─── RECEIPT REVIEW CARD ──────────────────────────────────────────
const ReceiptReviewCard = ({
  receipt,
  paymentMethod,
  onUpdate,
  readOnly,
  status,
  orderId,
  companySlug,
  orderStatus,
  receiptHistory,
  fulfillmentType,
  t,
}: {
  receipt?: any | null;
  paymentMethod?: string;
  onUpdate: () => void;
  readOnly: boolean;
  status?: string;
  orderId?: string;
  companySlug?: string;
  orderStatus?: string;
  receiptHistory?: any[];
  fulfillmentType?: string;
  t: any;
}) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [codConfirming, setCodConfirming] = useState(false);
  const { showToast } = useToast();

  const displayHistory = receiptHistory
    ? receiptHistory.filter((h: any) => {
        if (h.id === receipt?.id && receipt?.status === "pending") {
          return false;
        }
        return true;
      })
    : [];

  const handleConfirmCOD = async () => {
    if (!companySlug || !orderId) return;
    setCodConfirming(true);
    try {
      await confirmCODPayment(companySlug, Number(orderId));
      showToast("success", t("receiptCard.codConfirmSuccess"));
      setShowCODConfirm(false);
      await onUpdate();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail ||
          err.message ||
          t("receiptCard.codConfirmFailed"),
      );
    } finally {
      setCodConfirming(false);
    }
  };

  if (paymentMethod === "chapa") {
    return (
      // Telebirr
      <Card
        titleKey="receiptCard.paymentInformation"
        icon={CreditCard}
        status="approved"
        className="ring-1 ring-indigo-100"
        t={t}
      >
        <div className="flex flex-col items-center ">
          <div className="flex items-center gap-2 bg-white px-4 ">
            <div className="w-9 md:w-12 h-9 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-2 shadow-inner">
              <ShieldCheck className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {t("receiptCard.verifiedBy")}
            </p>
            <img src="/chapa.png" alt="Chapa" className="h-8 object-contain" />
          </div>
        </div>
      </Card>
    );
  }
  if (paymentMethod === "telebirr") {
    return (
      // Telebirr
      <Card
        titleKey="receiptCard.paymentInformation"
        icon={CreditCard}
        status="approved"
        className="ring-1 ring-indigo-100"
        t={t}
      >
        <div className="flex flex-col items-center ">
          <div className="flex items-center gap-2 bg-white px-4 ">
            <div className="w-9 md:w-12 h-9 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-2 shadow-inner">
              <ShieldCheck className="h-5 w-5 md:h-8 md:w-8 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {t("receiptCard.verifiedBy")}
            </p>
            <img
              src="/telebirr.png"
              alt="Telebirr"
              className="h-8 object-contain"
            />
          </div>
        </div>
      </Card>
    );
  }

  if (paymentMethod === "cod") {
    const isPaid = status?.toLowerCase() === "paid";
    const currentOrderStatus = orderStatus?.toLowerCase();
    const isPickup = fulfillmentType?.toLowerCase() === "pickup";
    const isOnspot = fulfillmentType?.toLowerCase() === "onspot";
    const isInStoreOrder = isPickup || isOnspot;
    const canCollect =
      currentOrderStatus === "fulfilled" ||
      (isInStoreOrder && currentOrderStatus === "processing");

    return (
      <>
        <Card
          titleKey="receiptCard.codTitle"
          icon={Banknote}
          status={isPaid ? "approved" : "pending"}
          className={`ring-1 ${isPaid ? "ring-emerald-100 border-emerald-200" : "ring-amber-100"}`}
          t={t}
        >
          <div className="flex flex-col items-center text-center">
            {isPaid ? (
              <div className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2 shadow-inner">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-black text-emerald-700 uppercase tracking-wide">
                  {t("receiptCard.paymentCollected")}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-4 max-w-xs leading-relaxed">
                  {canCollect
                    ? isOnspot
                      ? t("receiptCard.codHintOnspot")
                      : isPickup
                        ? t("receiptCard.codHintPickup")
                        : t("receiptCard.codHintDelivery")
                    : isInStoreOrder
                      ? t("receiptCard.codDisabledPrepared")
                      : t("receiptCard.codDisabledDelivered")}
                </p>
                {!readOnly && (
                  <button
                    onClick={() => setShowCODConfirm(true)}
                    disabled={!canCollect}
                    className={`w-full py-3 rounded-2xl text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                      canCollect
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                        : "bg-gray-300 cursor-not-allowed shadow-none"
                    }`}
                  >
                    {codConfirming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("receiptCard.processing")}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {t("receiptCard.confirmPaymentCollected")}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </Card>

        <ConfirmationModal
          isOpen={showCODConfirm}
          onClose={() => setShowCODConfirm(false)}
          onConfirm={handleConfirmCOD}
          title={t("receiptCard.codConfirmTitle")}
          description={t("receiptCard.codConfirmDescription")}
          confirmText={
            codConfirming
              ? t("receiptCard.processing")
              : t("receiptCard.codConfirmYes")
          }
          confirmVariant="primary"
          loading={codConfirming}
          autoClose={false}
        />
      </>
    );
  }

  if (!receipt) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="h-5 w-5 text-gray-400" />
          <h4 className="text-sm sm:text-base font-semibold text-gray-800">
            {t("receiptCard.paymentReceipt")}
          </h4>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            {t("receiptCard.waitingForUpload")}
          </p>
        </div>
      </div>
    );
  }

  const isAlreadyReviewed =
    receipt.status === "approved" || receipt.status === "rejected";
  const canReview = !readOnly && !isAlreadyReviewed;

  const handleActionClick = (action: "approved" | "rejected") => {
    if (!canReview) return;
    setPendingAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setShowConfirm(false);
    setSubmitting(true);
    setSubmittingAction(pendingAction);

    try {
      await reviewReceipt(receipt.id, {
        status: pendingAction,
        admin_notes: notes || undefined,
      });
      showToast(
        "success",
        pendingAction === "approved"
          ? t("receiptCard.approvedSuccess")
          : t("receiptCard.rejectedSuccess"),
      );
      setNotes("");
      setPendingAction(null);
      await onUpdate();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || t("receiptCard.reviewFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white flex-col rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex w-full flex-row justify-between items-start">
          <div className="flex items-center gap-2 mb-4 pb-3 w-full relative">
            <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
              <Banknote className="h-4 w-4 text-secondary" />
            </div>
            <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
              {t("receiptCard.paymentReceipt")}
            </h4>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full"></div>
          </div>
          <div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(
                receipt.status,
              )}`}
            >
              {receipt.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {receipt.receipt_image && (
          <div>
            <div
              onClick={() => setPreviewImage(receipt.receipt_image)}
              className="relative w-full h-28 sm:h-28 rounded-xl overflow-hidden border cursor-zoom-in group"
            >
              <img
                src={receipt.receipt_image}
                alt={t("receiptCard.receiptAlt")}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-xl border border-purple-100">
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">
            {t("receiptCard.bankDetails")}
          </p>
          <p className="font-semibold text-sm text-gray-900">
            {receipt.bank_name || t("receiptCard.notSpecified")}
          </p>
        </div>

        {canReview && (
          <div className="pt-2 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("receiptCard.addReviewNotes")}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-secondary transition resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleActionClick("approved")}
                disabled={submitting}
                className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingAction === "approved" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("receiptCard.approving")}
                  </>
                ) : (
                  t("receiptCard.approve")
                )}
              </button>
              <button
                onClick={() => handleActionClick("rejected")}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 text-white
                  py-2.5 rounded-xl text-sm font-bold
                  shadow-md shadow-rose-200
                  hover:from-rose-600 hover:to-red-700
                  active:scale-[0.98]
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {submittingAction === "rejected" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("receiptCard.rejecting")}
                  </>
                ) : (
                  t("receiptCard.reject")
                )}
              </button>
            </div>
          </div>
        )}

        {displayHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
              {t("receiptCard.receiptHistory", {
                count: displayHistory.length,
              })}
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {displayHistory.map((h: any) => {
                return (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-700">
                          {h.bank_name || t("receiptCard.unknownBank")}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold uppercase ${
                            h.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : h.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>
                      {h.admin_notes && (
                        <p className="text-[9px] text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100 mt-1 italic">
                          <span className="text-amber-600 font-semibold">
                            {t("receiptCard.remark")}
                          </span>{" "}
                          "{h.admin_notes}"
                        </p>
                      )}
                    </div>
                    {h.receipt_image && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(h.receipt_image)}
                        className="w-10 h-10 rounded-lg overflow-hidden border shrink-0 hover:opacity-80 transition cursor-zoom-in"
                      >
                        <img
                          src={h.receipt_image}
                          alt={t("receiptCard.priorReceiptAlt")}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 border border-black"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              aria-label={t("receiptCard.closePreviewAria")}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
            <img
              src={previewImage}
              alt={t("receiptCard.receiptFullAlt")}
              className="w-full max-h-[90vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirm}
        title={
          pendingAction === "approved"
            ? t("receiptCard.approveTitle")
            : t("receiptCard.rejectTitle")
        }
        description={t("receiptCard.confirmDescription")}
        confirmText={
          submitting
            ? t("receiptCard.processing")
            : t("receiptCard.confirmAction")
        }
        confirmVariant={pendingAction === "approved" ? "primary" : "danger"}
        loading={false}
        autoClose={false}
      />
    </div>
  );
};

// ─── PREPARATION CARD ──────────────────────────────────────────────
const PreparationCard = ({ order, onUpdate, readOnly, t }: any) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outOfStockReason, setOutOfStockReason] = useState("out_of_stock");
  const [outOfStockExplanation, setOutOfStockExplanation] = useState("");
  const [submittingRefundRequest, setSubmittingRefundRequest] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const { showToast } = useToast();
  const status = order.status?.toLowerCase();
  const isCOD = order.payment_method === "cod";
  const isReplacement = status === "replacement_in_progress";

  const paymentMethod = String(order.payment_method || "").toLowerCase();
  const isRefundablePaymentMethod =
    paymentMethod !== "cod" &&
    paymentMethod !== "bank_transfer" &&
    paymentMethod !== "cash";

  const handlePrepare = async () => {
    setShowConfirm(false);
    setPreparing(true);
    try {
      await prepareVendorOrder(order.company.slug, order.id);
      await onUpdate();
      showToast(
        "success",
        isReplacement
          ? t("preparationCard.replacementPreparedSuccess")
          : t("preparationCard.orderPreparedSuccess"),
      );
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || t("preparationCard.prepareFailed"),
      );
    } finally {
      setPreparing(false);
    }
  };

  const handleOutOfStockSubmit = async () => {
    if (!outOfStockExplanation.trim()) {
      showToast("error", t("preparationCard.provideReason"));
      return;
    }
    setSubmittingRefundRequest(true);
    try {
      await vendorRequestRefund(order.id, {
        reason: outOfStockReason,
        explanation: outOfStockExplanation,
      });
      await onUpdate();
      setShowOutOfStockModal(false);
      showToast("success", t("preparationCard.refundSentSuccess"));
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || t("preparationCard.refundSubmitFailed"),
      );
    } finally {
      setSubmittingRefundRequest(false);
    }
  };

  const canPrepare =
    status === "confirmed" || (isCOD && status === "pending") || isReplacement;

  const canRequestRefund =
    !readOnly &&
    isRefundablePaymentMethod &&
    status !== "fulfilled" &&
    status !== "cancelled" &&
    status !== "refunded";

  if (!canPrepare && !canRequestRefund) {
    return null;
  }

  return (
    <>
      <Card
        title={
          isReplacement
            ? t("preparationCard.replacementPreparation")
            : t("preparationCard.orderPreparation")
        }
        icon={Package}
        status={status}
        className={canPrepare ? "ring-2 ring-purple-100 border-purple-200" : ""}
      >
        <div className="flex flex-col items-center text-center py-4 space-y-3">
          {canPrepare && !readOnly && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={preparing}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-secondary to-secondary text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {preparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("preparationCard.marking")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {isReplacement
                    ? t("preparationCard.markReplacementPrepared")
                    : t("preparationCard.markPrepared")}
                </>
              )}
            </button>
          )}

          {/* {canRequestRefund && !readOnly && (
            <button
              onClick={() => setShowOutOfStockModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-rose-600" />
              {isReplacement
                ? t("preparationCard.cannotReplaceRequestRefund")
                : t("preparationCard.outOfStockRequestRefund")}
            </button>
          )} */}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handlePrepare}
        title={
          isReplacement
            ? t("preparationCard.markReplacementTitle")
            : t("preparationCard.markOrderTitle")
        }
        description={
          isReplacement
            ? t("preparationCard.replacementDescription")
            : t("preparationCard.orderDescription")
        }
        confirmText={
          preparing
            ? t("preparationCard.marking")
            : t("preparationCard.yesPrepared")
        }
        confirmVariant="primary"
        loading={false}
        autoClose={false}
      />

      <AnimatePresence>
        {showOutOfStockModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-700 font-bold text-base">
                <AlertCircle className="h-5 w-5" />
                {t("preparationCard.requestRefundTitle")}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {t("preparationCard.requestRefundDescription")}
              </p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("preparationCard.reasonLabel")}
                  </label>
                  <select
                    value={outOfStockReason}
                    onChange={(e) => setOutOfStockReason(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                  >
                    <option value="out_of_stock">
                      {t("preparationCard.reasonOutOfStock")}
                    </option>
                    <option value="damaged_item">
                      {t("preparationCard.reasonDamaged")}
                    </option>
                    <option value="other">
                      {t("preparationCard.reasonOther")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("preparationCard.explanationLabel")}
                  </label>
                  <textarea
                    rows={3}
                    value={outOfStockExplanation}
                    onChange={(e) => setOutOfStockExplanation(e.target.value)}
                    placeholder={t("preparationCard.explanationPlaceholder")}
                    className="w-full text-xs rounded-xl border border-gray-300 p-2.5 focus:ring-2 focus:ring-secondary/20 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOutOfStockModal(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t("preparationCard.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleOutOfStockSubmit}
                  disabled={submittingRefundRequest}
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submittingRefundRequest ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("preparationCard.submitting")}
                    </>
                  ) : (
                    t("preparationCard.submitRefundRequest")
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
// ════════════════════════════════════════
// MAIN MODAL COMPONENT
// ════════════════════════════════════════

export function VendorOrderDetailModal({
  order,
  receipt,
  onClose,
  onUpdate,
  readOnly = false,
  onOpenLiveTracking,
  allOrders = [],
  onSelectOrder,
}: any) {
  const { t } = useTranslation("companyOrders");
  const isAmharic = i18n.language === "am";
  const { showToast } = useToast();

  const [approvingRedelivery, setApprovingRedelivery] = useState(false);

  const handleApproveRedelivery = async (disputeId: number) => {
    try {
      setApprovingRedelivery(true);
      await approveDisputeRedelivery(disputeId, {
        admin_notes: t("vendorOrderDetail.redeliveryApprovedNote"),
      });
      await onUpdate();
      showToast("success", t("vendorOrderDetail.redeliveryApprovedToast"));
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || t("vendorOrderDetail.redeliveryFailed"),
      );
    } finally {
      setApprovingRedelivery(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState<"tracking" | "driver_selection">(
    "tracking",
  );
  const [selectedOrderId, setSelectedOrderId] = useState<number | undefined>();

  const [localDeliveryOverride, setLocalDeliveryOverride] = useState<any>(null);

  const effectiveOrder = useMemo(() => {
    if (!localDeliveryOverride) return order;
    return {
      ...order,
      delivery: {
        ...(order.delivery || {}),
        ...localDeliveryOverride,
      },
    };
  }, [order, localDeliveryOverride]);

  useEffect(() => {
    if (
      localDeliveryOverride &&
      order?.delivery?.delivery_person_name &&
      order.delivery.delivery_person_name !== t("vendorOrderDetail.unassigned")
    ) {
      setLocalDeliveryOverride(null);
    }
  }, [order?.delivery?.delivery_person_name, localDeliveryOverride, t]);

  useEffect(() => {
    setLocalDeliveryOverride(null);
  }, [order?.id]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onUpdate();
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewOnMap = useCallback((orderId: number) => {
    setSelectedOrderId(orderId);
    setMapMode("driver_selection");
    setIsMapOpen(true);
  }, []);

  const handleDriverSelect = useCallback(
    async (driverId: number) => {
      try {
        let updatedDelivery: any = null;

        if (effectiveOrder.delivery) {
          const res = await updateDeliveryPerson(
            effectiveOrder.delivery.id.toString(),
            driverId,
          );
          updatedDelivery = res?.data ?? null;
        } else {
          const res = await assignDelivery({
            vendor_order: effectiveOrder.id,
            delivery_person: driverId,
          });
          updatedDelivery = res?.data ?? null;
        }

        setLocalDeliveryOverride((prev: any) => ({
          ...(prev || {}),
          ...(updatedDelivery || {}),
          delivery_person_name:
            updatedDelivery?.delivery_person_name ??
            prev?.delivery_person_name ??
            t("vendorOrderDetail.assignedDeliveryPersonFallback"),
          delivery_person_phone:
            updatedDelivery?.delivery_person_phone ??
            prev?.delivery_person_phone ??
            "",
          status: updatedDelivery?.status ?? prev?.status ?? "pending",
        }));

        await onUpdate();

        return updatedDelivery;
      } catch (err) {
        setLocalDeliveryOverride(null);
        throw err;
      }
    },
    [effectiveOrder, onUpdate, t],
  );

  const handleAssignmentComplete = useCallback(() => {
    setSelectedOrderId(undefined);
    setIsMapOpen(false);
  }, []);

  const handleCloseMap = useCallback(() => {
    setIsMapOpen(false);
    setSelectedOrderId(undefined);
  }, []);

  const customerOrders = useMemo(() => {
    if (!effectiveOrder || !allOrders.length) return [];
    const customerPhone = effectiveOrder.shipping_phone;
    const companyId = effectiveOrder.company?.id;
    if (!customerPhone || !companyId) return [];

    return allOrders
      .filter(
        (o: any) =>
          o.shipping_phone === customerPhone &&
          o.company?.id === companyId &&
          o.id !== effectiveOrder.id,
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);
  }, [effectiveOrder, allOrders]);

  if (!effectiveOrder) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-[95%] sm:max-w-8xl max-h-[90vh] sm:max-h-[92vh] rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-secondary/20 backdrop-blur-md border-b border-secondary/15 px-3 sm:px-6 md:px-8 py-2 sm:py-4 md:py-5 sticky top-0 z-20 shadow-sm">
              <div className="flex flex-row justify-between items-start gap-2">
                <div className="mt-1.5">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-3 mb-0.5 sm:mb-1">
                    <h2 className="text-base sm:text-2xl font-black bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent tracking-tight break-words">
                      {t("vendorOrderDetail.orderNumber", {
                        id: effectiveOrder.id,
                        masterId: effectiveOrder.master_order_id,
                      })}
                    </h2>
                    <StatusBadge
                      status={effectiveOrder.status}
                      customLabels={{
                        pending: t("companyOrders.statusBadge.pending"),
                      }}
                      t={t}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-4 text-[9px] sm:text-xs font-bold">
                    <span className="flex items-center gap-1 sm:gap-2 bg-secondary/10 px-1.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full border border-secondary/20 shadow-sm">
                      <Calendar className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-secondary" />
                      <span className="font-mono text-[8px] sm:text-[12px] font-semibold text-gray-700 tracking-tight">
                        {new Date(effectiveOrder.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}{" "}
                        <span className="text-secondary mx-0.5">•</span>{" "}
                        {new Date(effectiveOrder.created_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                      <Building2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-secondary" />{" "}
                      <span className="font-medium text-[9px] sm:text-sm">
                        {effectiveOrder.company?.name}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="group flex items-center gap-0.5 sm:gap-2 px-1.5 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 bg-white
                     hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100
                     active:scale-95 transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {refreshing ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-secondary animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 group-hover:text-secondary transition-colors" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="group p-1.5 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-sm
                     hover:bg-rose-50 hover:border-rose-200
                     active:scale-95 transition-all duration-200"
                  >
                    <X className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 custom-scrollbar scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100">
              {effectiveOrder.status?.toLowerCase() ===
                "replacement_in_progress" && (
                <div className="mb-4 sm:mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="font-bold text-purple-900">
                      {t("vendorOrderDetail.replacementInProgressTitle")}
                    </div>
                    <p className="mt-0.5 text-purple-700 text-xs">
                      {t("vendorOrderDetail.replacementInProgressDescription")}
                    </p>
                  </div>
                </div>
              )}
              {effectiveOrder.status?.toLowerCase() === "disputed" && (
                <div className="mb-4 sm:mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-bold text-amber-900">
                        {t("vendorOrderDetail.disputedTitle")}
                      </div>
                      {effectiveOrder.active_dispute && (
                        <button
                          type="button"
                          disabled={approvingRedelivery}
                          onClick={() =>
                            handleApproveRedelivery(
                              effectiveOrder.active_dispute.id,
                            )
                          }
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${approvingRedelivery ? "animate-spin" : ""}`}
                          />
                          {approvingRedelivery
                            ? t("vendorOrderDetail.approving")
                            : t("vendorOrderDetail.approveRedelivery")}
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-amber-800 text-xs">
                      {effectiveOrder.active_dispute
                        ? t("vendorOrderDetail.disputeReason", {
                            reason: effectiveOrder.active_dispute.reason,
                            explanation:
                              effectiveOrder.active_dispute.explanation ||
                              t("vendorOrderDetail.noAdditionalNote"),
                          })
                        : t("vendorOrderDetail.disputeFallback")}
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Attempt History Audit Card */}
              {Array.isArray(effectiveOrder.delivery_history) &&
                effectiveOrder.delivery_history.length > 0 && (
                  <div className="mb-4 sm:mb-6 p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <History className="h-4 w-4 text-gray-500" />
                      {t("vendorOrderDetail.deliveryHistoryTitle", {
                        count: effectiveOrder.delivery_history.length,
                      })}
                    </div>
                    <div className="space-y-2.5">
                      {effectiveOrder.delivery_history.map((att: any) => (
                        <div
                          key={att.id}
                          className="p-3 bg-white border border-gray-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                {t("vendorOrderDetail.attemptNumber", {
                                  number: att.attempt_number,
                                })}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                {att.status}
                              </span>
                            </div>
                            {att.delivery_person_name && (
                              <p className="mt-1 text-gray-600">
                                {t("vendorOrderDetail.driverLabel")}{" "}
                                <span className="font-medium text-gray-800">
                                  {att.delivery_person_name}
                                </span>{" "}
                                {att.delivery_person_phone
                                  ? `(${att.delivery_person_phone})`
                                  : ""}
                              </p>
                            )}
                            {att.failure_reason && (
                              <p className="mt-0.5 text-gray-500 italic">
                                {t("vendorOrderDetail.noteLabel")}{" "}
                                {att.failure_reason}
                              </p>
                            )}
                          </div>
                          {att.completed_at && (
                            <div className="text-[11px] text-gray-400 shrink-0">
                              {new Date(att.completed_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8 lg:sticky lg:top-0">
                  {(() => {
                    const fulfillmentKind = getFulfillmentKind(effectiveOrder);
                    const customerName = resolveCustomerName(effectiveOrder);
                    const hasName = hasCustomerName(effectiveOrder);
                    const customerPhone = resolveCustomerPhone(effectiveOrder);
                    const customerImage = resolveCustomerImage(effectiveOrder);

                    const restaurant = isRestaurant(effectiveOrder);
                    const isPickupLike =
                      fulfillmentKind === "pickup" ||
                      fulfillmentKind === "onspot";

                    const locationTitleKey = isPickupLike
                      ? fulfillmentKind === "onspot"
                        ? "vendorOrderDetail.location.onspotDetails"
                        : restaurant
                          ? "vendorOrderDetail.location.takeawayDetails"
                          : "vendorOrderDetail.location.pickupLocation"
                      : "vendorOrderDetail.location.shippingDestination";

                    const storeName = isAmharic
                      ? effectiveOrder.company?.name_am ||
                        effectiveOrder.vendor_orders?.[0]?.company?.name_am ||
                        effectiveOrder.company?.name ||
                        effectiveOrder.vendor_orders?.[0]?.company?.name ||
                        t("vendorOrderDetail.storeFallback")
                      : effectiveOrder.company?.name ||
                        effectiveOrder.vendor_orders?.[0]?.company?.name ||
                        t("vendorOrderDetail.storeFallback");

                    const storeAddress =
                      formatAddress(
                        effectiveOrder.company?.address ||
                          effectiveOrder.company?.address_am ||
                          effectiveOrder.company?.location ||
                          "",
                      ) ||
                      effectiveOrder.shipping_address_text ||
                      t("vendorOrderDetail.pickupAddressUnavailable");

                    const hasAnyLocationData = isPickupLike
                      ? !!storeAddress
                      : !!effectiveOrder.shipping_address_text;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <Card
                          titleKey="vendorOrderDetail.customerProfile"
                          icon={User}
                          t={t}
                        >
                          <div className="flex items-center gap-4">
                            {customerImage ? (
                              <img
                                src={customerImage}
                                alt={customerName}
                                className="w-10 md:w-14 h-10 md:h-14 object-cover rounded-full ring-2 ring-purple-200"
                              />
                            ) : (
                              <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-white shadow-sm flex items-center justify-center text-secondary font-black text-xl">
                                {getInitials(customerName)}
                              </div>
                            )}

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p
                                  className={`text-sm md:text-base font-black truncate ${
                                    hasName
                                      ? "bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent"
                                      : "text-gray-400 italic"
                                  }`}
                                >
                                  {customerName}
                                </p>

                                {fulfillmentKind === "pickup" && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    {restaurant
                                      ? t("vendorOrderDetail.takeaway")
                                      : t("vendorOrderDetail.selfPickup")}
                                  </span>
                                )}

                                {fulfillmentKind === "onspot" &&
                                  (effectiveOrder.onspot_order_mode ===
                                  "order_ahead" ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
                                      <Clock className="h-3 w-3 text-purple-600" />
                                      {t("vendorOrderDetail.preOrder")}
                                      {effectiveOrder.estimated_arrival_time && (
                                        <>
                                          {" "}
                                          ·{" "}
                                          {t("vendorOrderDetail.etaLabel", {
                                            time: new Date(
                                              effectiveOrder.estimated_arrival_time,
                                            ).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }),
                                          })}
                                        </>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                                      {t("vendorOrderDetail.onspot")}
                                      {effectiveOrder.table_number && (
                                        <>
                                          {" "}
                                          ·{" "}
                                          {t("vendorOrderDetail.tableLabel", {
                                            number: effectiveOrder.table_number,
                                          })}
                                        </>
                                      )}
                                    </span>
                                  ))}
                              </div>

                              {customerPhone ? (
                                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-2 md:px-3 py-0.5 md:py-1.5 rounded-lg w-fit border border-blue-200 shadow-sm">
                                  <PhoneCall className="h-2.5 md:h-3.5 w-2.5 md:w-3.5 text-green-600" />
                                  <span className="text-xs font-mono font-bold text-green-700 tracking-tight">
                                    {customerPhone}
                                  </span>
                                  <CopyButton text={customerPhone} />
                                </div>
                              ) : (
                                <p className="text-[11px] text-gray-400 italic">
                                  {t("vendorOrderDetail.noPhoneOnFile")}
                                </p>
                              )}

                              {!hasName && isPickupLike && (
                                <p className="text-[10px] text-gray-400 italic">
                                  {fulfillmentKind === "onspot"
                                    ? t(
                                        "vendorOrderDetail.customerNameNotProvided",
                                        {
                                          detail: t(
                                            "vendorOrderDetail.tableLabel",
                                            {
                                              number:
                                                effectiveOrder.table_number ||
                                                "—",
                                            },
                                          ),
                                        },
                                      )
                                    : t(
                                        "vendorOrderDetail.customerNameNotProvided",
                                        {
                                          detail: t(
                                            "vendorOrderDetail.walkInOrder",
                                          ),
                                        },
                                      )}
                                </p>
                              )}

                              {effectiveOrder.created_at && (
                                <p className="text-[10px] text-gray-400 font-mono">
                                  {new Date(
                                    effectiveOrder.created_at,
                                  ).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>

                        {hasAnyLocationData ? (
                          <Card titleKey={locationTitleKey} icon={MapPin} t={t}>
                            <div className="space-y-3">
                              <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-secondary">
                                <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                                  {isPickupLike
                                    ? t("vendorOrderDetail.customerLabel")
                                    : t("vendorOrderDetail.recipientName")}
                                </span>
                                <span
                                  className={`text-sm font-bold ${hasName ? "text-secondary" : "text-gray-400 italic"}`}
                                >
                                  {customerName}
                                </span>
                              </div>

                              <div className="flex items-start gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/30 border-l-4 border-green-500">
                                <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                                  {isPickupLike
                                    ? t("vendorOrderDetail.contactLabel")
                                    : t("vendorOrderDetail.recipientPhone")}
                                </span>
                                <div className="flex items-center gap-2">
                                  <PhoneCall className="h-3.5 w-3.5 text-green-600" />
                                  <span className="text-sm font-mono font-bold text-green-700 tracking-tight">
                                    {customerPhone ||
                                      t("vendorOrderDetail.notProvided")}
                                  </span>
                                  {customerPhone && (
                                    <CopyButton text={customerPhone} />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-secondary">
                                <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                                  {isPickupLike
                                    ? fulfillmentKind === "onspot"
                                      ? effectiveOrder.onspot_order_mode ===
                                        "order_ahead"
                                        ? t("vendorOrderDetail.preOrderAtLabel")
                                        : t("vendorOrderDetail.onspotAtLabel")
                                      : restaurant
                                        ? t(
                                            "vendorOrderDetail.takeawayFromLabel",
                                          )
                                        : t("vendorOrderDetail.pickupFromLabel")
                                    : t("vendorOrderDetail.shippingAddress")}
                                </span>
                                <span className="text-sm font-bold text-secondary">
                                  {isPickupLike
                                    ? fulfillmentKind === "onspot"
                                      ? effectiveOrder.onspot_order_mode ===
                                        "order_ahead"
                                        ? `${storeName} — ${t(
                                            "vendorOrderDetail.preOrderedLabel",
                                          )}${
                                            effectiveOrder.estimated_arrival_time
                                              ? ` ${t(
                                                  "vendorOrderDetail.forTimeLabel",
                                                  {
                                                    time: new Date(
                                                      effectiveOrder.estimated_arrival_time,
                                                    ).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    }),
                                                  },
                                                )}`
                                              : ""
                                          }`
                                        : `${storeName}${
                                            effectiveOrder.table_number
                                              ? ` — ${t(
                                                  "vendorOrderDetail.tableLabel",
                                                  {
                                                    number:
                                                      effectiveOrder.table_number,
                                                  },
                                                )}`
                                              : ""
                                          }`
                                      : storeName
                                    : formatAddress(
                                        effectiveOrder.shipping_address_text,
                                      ) ||
                                      t("vendorOrderDetail.noAddressProvided")}
                                </span>
                              </div>

                              {isPickupLike && storeAddress && (
                                <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border-l-4 border-gray-300">
                                  <span className="text-xs font-bold text-gray-500 min-w-[110px]">
                                    {t("vendorOrderDetail.addressLabel")}
                                  </span>
                                  <span className="text-xs text-gray-600 leading-relaxed">
                                    {storeAddress}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Card>
                        ) : (
                          <Card titleKey={locationTitleKey} icon={MapPin} t={t}>
                            <div className="flex items-center justify-center py-6 text-center">
                              <div>
                                <MapPin className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                                <p className="text-xs text-gray-500">
                                  {isPickupLike
                                    ? t(
                                        "vendorOrderDetail.storePickupAddressNotConfigured",
                                      )
                                    : t(
                                        "vendorOrderDetail.shippingAddressNotProvided",
                                      )}
                                </p>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    );
                  })()}

                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    <div className="px-4 md:px-6 py-2 md:py-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                        {t("vendorOrderDetail.itemList")}
                      </h4>
                      <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-semibold text-purple-600 shadow-sm">
                        {t(
                          effectiveOrder.items.length > 1
                            ? "vendorOrderDetail.itemsPlural"
                            : "vendorOrderDetail.itemsSingular",
                          { count: effectiveOrder.items.length },
                        )}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                            <th className="px-4 md:px-6 py-2 md:py-4 text-left">
                              {t("vendorOrderDetail.table.description")}
                            </th>
                            <th className="px-4 md:px-6 py-2 md:py-4 text-center">
                              {t("vendorOrderDetail.table.qty")}
                            </th>
                            <th className="px-4 md:px-6 py-2 md:py-4 text-right">
                              {t("vendorOrderDetail.table.unitPrice")}
                            </th>
                            <th className="px-4 md:px-6 py-2 md:py-4 text-right">
                              {t("vendorOrderDetail.table.total")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(() => {
                            const itemsByRound = effectiveOrder.items.reduce(
                              (acc: any, item: any) => {
                                const r = item.round || 1;
                                if (!acc[r]) acc[r] = [];
                                acc[r].push(item);
                                return acc;
                              },
                              {},
                            );

                            return Object.keys(itemsByRound)
                              .sort((a, b) => Number(a) - Number(b))
                              .map((roundKey) => {
                                const roundItems = itemsByRound[roundKey];
                                const roundNum = Number(roundKey);
                                const roundTime = roundItems[0]?.created_at
                                  ? new Date(
                                      roundItems[0].created_at,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })
                                  : "";

                                return (
                                  <React.Fragment key={roundKey}>
                                    <tr className="bg-purple-50/20">
                                      <td
                                        colSpan={4}
                                        className="px-4 py-2 text-left"
                                      >
                                        <span className="text-[10px] font-black uppercase tracking-wider text-secondary">
                                          {t("vendorOrderDetail.roundLabel", {
                                            number: roundNum,
                                          })}{" "}
                                          {roundTime ? `(${roundTime})` : ""}
                                        </span>
                                      </td>
                                    </tr>
                                    {roundItems.map((item: any) => (
                                      <tr
                                        key={item.id}
                                        className="group hover:bg-gray-50/80 transition-all"
                                      >
                                        <td className="px-4 md:px-6 py-2 md:py-4">
                                          <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-50">
                                              {item.product_image ? (
                                                <img
                                                  src={item.product_image}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <ImageIcon className="h-5 w-5 text-gray-300" />
                                              )}
                                            </div>
                                            <div>
                                              <p className="text-sm font-black text-gray-800 line-clamp-1">
                                                {item.title}
                                              </p>
                                              <p className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-tighter">
                                                {t(
                                                  "vendorOrderDetail.skuLabel",
                                                )}
                                                :{" "}
                                                {item.sku ||
                                                  t("vendorOrderDetail.na")}
                                              </p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                          <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-600">
                                            x{item.qty}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-gray-500">
                                          {Number(
                                            item.unit_price,
                                          ).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 text-sm">
                                          {Number(
                                            item.line_total,
                                          ).toLocaleString()}{" "}
                                          <span className="text-[9px] text-gray-400">
                                            ETB
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                );
                              });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
                        <Clock className="h-4 w-4 text-secondary" />
                      </div>
                      <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                        {t("vendorOrderDetail.orderTimeline")}
                      </h4>
                      <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {t("vendorOrderDetail.stepsCount", {
                          count: buildOrderTimeline(effectiveOrder).length,
                        })}
                      </span>
                    </div>

                    <div className="relative pl-6 space-y-4">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

                      {buildOrderTimeline(effectiveOrder).map((event: any) => (
                        <div
                          key={event.id}
                          className="relative flex items-start gap-4"
                        >
                          <div
                            className={`absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 ${
                              event.status === "completed"
                                ? "bg-emerald-500 border-emerald-500"
                                : "bg-amber-500 border-amber-500 animate-pulse"
                            }`}
                          >
                            <div
                              className={`absolute inset-0 rounded-full ${
                                event.status === "completed"
                                  ? "bg-emerald-400/30 animate-pulse"
                                  : "bg-amber-400/30 animate-pulse"
                              }`}
                              style={{
                                width: "200%",
                                height: "200%",
                                left: "-50%",
                                top: "-50%",
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {event.icon} {event.label}
                              </span>
                              {event.status === "pending" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  {t("vendorOrderDetail.pendingLabel")}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-400 font-mono">
                                {new Date(event.time).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}{" "}
                                •{" "}
                                {new Date(event.time).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              {event.actor && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {event.actor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {customerOrders.length > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                        <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary-light/20 rounded-lg shadow-inner">
                          <History className="h-4 w-4 text-secondary" />
                        </div>
                        <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                          {t("vendorOrderDetail.customerOrderHistory")}
                        </h4>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {t("vendorOrderDetail.ordersCount", {
                            count: customerOrders.length,
                          })}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {customerOrders.map((ord: any) => (
                          <div
                            key={ord.id}
                            onClick={() => onSelectOrder && onSelectOrder(ord)}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-secondary/30 transition-all cursor-pointer group"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-secondary group-hover:text-secondary-dark">
                                #{ord.id}
                              </span>
                              {ord.company?.name && (
                                <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                                  {ord.company.name}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(ord.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-800">
                                {Number(ord.amount).toLocaleString()}{" "}
                                <span className="text-[9px] text-gray-400">
                                  ETB
                                </span>
                              </span>
                              <StatusBadge t={t} status={ord.status} />
                              <span className="text-xs text-secondary opacity-0 group-hover:opacity-100 transition">
                                {t("vendorOrderDetail.viewAction")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-3 sm:space-y-4">
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-br from-secondary to-secondary-light rounded-[32px] p-4 text-white shadow-2xl shadow-purple-200 relative overflow-hidden group"
                  >
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2 md:mb-5">
                        <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                          <Receipt className="h-5 w-5" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                            {t("vendorOrderDetail.totalAmount")}
                          </p>
                          <h3 className="text-xl md:text-3xl font-black">
                            {Number(effectiveOrder.amount).toLocaleString()}{" "}
                            <span className="text-sm opacity-60">ETB</span>
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="opacity-60">
                            {t("vendorOrderDetail.subtotal")}
                          </span>
                          <span>
                            {Number(effectiveOrder.subtotal).toLocaleString()}{" "}
                            ETB
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="opacity-60">
                            {t("vendorOrderDetail.vat")}
                          </span>
                          <span>
                            {Number(effectiveOrder.tax_amount).toLocaleString()}{" "}
                            ETB
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="opacity-60">
                            {t("vendorOrderDetail.deliveryFee")}
                          </span>
                          <span>
                            {Number(
                              effectiveOrder.delivery_fee || 0,
                            ).toLocaleString()}{" "}
                            ETB
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="opacity-60">
                            {t("vendorOrderDetail.discountFee")}
                          </span>
                          <span>0 ETB</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <ReceiptReviewCard
                    receipt={receipt}
                    paymentMethod={effectiveOrder.payment_method}
                    onUpdate={onUpdate}
                    readOnly={readOnly}
                    status={effectiveOrder.payment_status}
                    orderId={effectiveOrder.id}
                    companySlug={effectiveOrder.company?.slug}
                    orderStatus={effectiveOrder.status}
                    receiptHistory={effectiveOrder.receipt_history}
                    fulfillmentType={
                      effectiveOrder.fulfillment_type ||
                      (effectiveOrder.shipping_address_text
                        ? "delivery"
                        : "pickup")
                    }
                    t={t}
                  />

                  {(effectiveOrder.status === "confirmed" ||
                    effectiveOrder.status === "replacement_in_progress" ||
                    (effectiveOrder.payment_method === "cod" &&
                      effectiveOrder.status === "pending")) && (
                    <PreparationCard
                      order={effectiveOrder}
                      onUpdate={onUpdate}
                      readOnly={readOnly}
                      t={t}
                    />
                  )}

                  {getFulfillmentKind(effectiveOrder) === "delivery" &&
                    effectiveOrder.shipping_address_text && (
                      <DeliveryCard
                        order={effectiveOrder}
                        onUpdate={onUpdate}
                        readOnly={readOnly}
                        onOpenLiveTracking={onOpenLiveTracking}
                        onViewOnMap={handleViewOnMap}
                        t={t}
                      />
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {isMapOpen && (
        <DeliveryTrackingMap
          onClose={handleCloseMap}
          mode={mapMode}
          selectedOrderId={selectedOrderId}
          onDriverSelect={handleDriverSelect}
          onAssignmentComplete={handleAssignmentComplete}
          initialOrder={effectiveOrder}
        />
      )}
    </>
  );
}
