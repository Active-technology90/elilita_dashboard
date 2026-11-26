import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  X,
  UtensilsCrossed,
  Search,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ChefHat,
  Clock,
  StickyNote,
  ListOrdered,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  getFulfillmentKind,
  isRestaurant,
  resolveCustomerName,
  resolveCustomerPhone,
} from "./orderHelpers";

// ─── Types ──────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  orders: any[];
  onOpenOrder: (orderId: any) => void;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  userRole: string;
};

type StatusBucket = "pending" | "inProgress" | "completed" | "cancelled";

// ─── Defensive resolvers (business logic preserved) ─────────────

const resolveTableNumber = (order: any): string | null => {
  const v =
    order?.table_number ??
    order?.table?.number ??
    order?.table?.name ??
    order?.table_no ??
    order?.table_id ??
    null;

  if (v == null || String(v).trim() === "") return null;

  return String(v).trim();
};

const resolveItems = (order: any): any[] => {
  const arr =
    order?.items ??
    order?.order_items ??
    order?.line_items ??
    order?.vendor_order_items ??
    [];

  return Array.isArray(arr) ? arr : [];
};

const resolveItemsCount = (order: any): number => resolveItems(order).length;

const resolveCompanyName = (order: any, isAmharic: boolean): string => {
  const candidates = [
    isAmharic && order?.company?.name_am?.trim(),
    order?.company?.name,
    order?.vendor_orders?.[0]?.company?.name_am,
    order?.vendor_orders?.[0]?.company?.name,
  ].filter(Boolean) as string[];

  return candidates[0] || "";
};

const resolveOrderNotes = (order: any): string | null => {
  const raw =
    order?.notes ||
    order?.special_instructions ||
    order?.customer_notes ||
    order?.note ||
    null;

  if (!raw) return null;

  return String(raw).trim() || null;
};

// ─── Item image resolver (restored) ────────────────────────────

const resolveItemImage = (item: any, product: any): string | null => {
  const candidates = [
    item?.image,
    item?.image_url,
    item?.product_image,
    item?.thumbnail,
    product?.image,
    product?.image_url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const resolveItemDescription = (item: any, product: any): string | null => {
  const raw = item?.description ?? product?.description ?? null;

  if (!raw) return null;

  return String(raw).trim() || null;
};

// ─── Item details ───────────────────────────────────────────────

const resolveItemDetails = (order: any) =>
  resolveItems(order).map((item: any, index: number) => {
    const product = item?.product ?? item?.menu_item ?? item;

    const name =
      item?.name ||
      item?.product_name ||
      item?.item_name ||
      item?.title ||
      item?.menu_item_name ||
      product?.name ||
      `Item ${index + 1}`;

    const quantity = Number(item?.quantity ?? item?.qty ?? 1);

    return {
      name,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      image: resolveItemImage(item, product),
      description: resolveItemDescription(item, product),
    };
  });

// ─── Status helpers (unchanged logic, brand-safe colors) ───────

const normalizeStatus = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

const normalizePaymentMethod = (order: any): string =>
  normalizeStatus(
    order?.payment_method ?? order?.payment?.method ?? order?.payment_type,
  );

const getOrderStatus = (order: any): string =>
  normalizeStatus(
    order?.status ?? order?.vendor_status ?? order?.fulfillment_status,
  );

const isPreparedOrder = (order: any): boolean => {
  const statuses = [
    order?.status,
    order?.vendor_status,
    order?.fulfillment_status,
  ].map(normalizeStatus);

  return statuses.includes("prepared");
};

const isCompletedOrder = (order: any): boolean => {
  const completedStatuses = ["completed", "fulfilled", "delivered"];

  const statuses = [
    order?.status,
    order?.vendor_status,
    order?.fulfillment_status,
  ].map(normalizeStatus);

  return statuses.some((status) => completedStatuses.includes(status));
};

const shouldShowPreparationOrder = (order: any): boolean => {
  const kind = getFulfillmentKind(order);

  if (!isRestaurant(order) && kind !== "onspot") return false;

  if (isPreparedOrder(order) || isCompletedOrder(order)) {
    return false;
  }

  const status = getOrderStatus(order);

  if (
    ["cancelled", "prepared",
    "complete",
    "processing",
    "completed",
    "fulfilled",
      "preparation_complete",
    "cancelled",
    "canceled",
    "rejected",
    "failed",
    "expired",
    "refunded",
    "delivered","rejected", "failed", "expired", "refunded"].includes(status)
  ) {
    return false;
  }

  const paymentMethod = normalizePaymentMethod(order);

  if (
    paymentMethod === "bank_transfer" ||
    paymentMethod === "bank" ||
    paymentMethod === "chapa"
  ) {
    return status === "confirmed";
  }

  return true;
};

const classifyOrder = (order: any): StatusBucket => {
  const status = getOrderStatus(order);

  if (["pending", "awaiting_payment", "unpaid"].includes(status)) {
    return "pending";
  }

  return "inProgress";
};

// ─── Status badge (only purple / neutral grays) ────────────────

const getTableStatus = (order: any) => {
  const s = String(order?.status ?? "").toLowerCase();
  const p = String(order?.payment_status ?? "").toLowerCase();

  if (s === "fulfilled" || s === "completed" || s === "delivered") {
    return {
      key: "completed",
      cls: "bg-[#6750A4]/10 text-[#6750A4] border-[#6750A4]/25",
      dot: "bg-[#6750A4]",
    };
  }

  if (p === "paid") {
    return {
      key: "paid",
      cls: "bg-[#6750A4]/10 text-[#6750A4] border-[#6750A4]/25",
      dot: "bg-[#6750A4]",
    };
  }

  if (s === "processing") {
    return {
      key: "preparing",
      cls: "bg-[#6750A4] text-white border-[#6750A4]",
      dot: "bg-white",
    };
  }

  if (s === "confirmed") {
    return {
      key: "confirmed",
      cls: "bg-[#6750A4]/15 text-[#6750A4] border-[#6750A4]/30",
      dot: "bg-[#6750A4]",
    };
  }

  if (s === "contacted") {
    return {
      key: "contacted",
      cls: "bg-[#F7F7FA] text-[#24212B] border-[#E5E5EB]",
      dot: "bg-[#6B7280]",
    };
  }

  if (s === "accepted" || s === "picked_up" || s === "out_for_delivery") {
    return {
      key: s,
      cls: "bg-[#6750A4]/10 text-[#6750A4] border-[#6750A4]/20",
      dot: "bg-[#6750A4]",
    };
  }

  if (s === "pending") {
    return {
      key: "awaitingPayment",
      cls: "bg-[#F7F7FA] text-[#6B7280] border-[#E5E5EB]",
      dot: "bg-[#6B7280]",
    };
  }

  if (s === "cancelled" || s === "rejected" || s === "failed") {
    return {
      key: "cancelled",
      cls: "bg-[#F7F7FA] text-[#6B7280] border-[#E5E5EB]",
      dot: "bg-[#6B7280]",
    };
  }

  if (s === "expired") {
    return {
      key: "expired",
      cls: "bg-[#F7F7FA] text-[#6B7280] border-[#E5E5EB]",
      dot: "bg-[#6B7280]",
    };
  }

  return {
    key: "unknown",
    cls: "bg-[#F7F7FA] text-[#6B7280] border-[#E5E5EB]",
    dot: "bg-[#6B7280]",
  };
};

// ─── Stat tile (purple-only accents) ───────────────────────────

type StatAccent = "solid" | "soft";

const StatTile = ({
  label,
  value,
  active,
  onClick,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  accent: StatAccent;
  icon: any;
}) => {
  const accents: Record<StatAccent, { icon: string; active: string }> = {
    solid: {
      icon: "bg-[#6750A4] text-white",
      active: "border-[#6750A4]/40 bg-[#6750A4]/5",
    },
    soft: {
      icon: "bg-[#6750A4]/10 text-[#6750A4]",
      active: "border-[#6750A4]/30 bg-[#6750A4]/5",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:gap-2.5 sm:p-2.5 ${
        active
          ? accents[accent].active
          : "border-[#E5E5EB] bg-white hover:border-[#6750A4]/30"
      }`}
    >
      <span
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${accents[accent].icon}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-[#6B7280] sm:text-[11px]">
          {label}
        </span>

        <span className="mt-0.5 block text-xl font-bold leading-none text-[#24212B] sm:text-2xl">
          {value}
        </span>
      </span>
    </button>
  );
};

// ─── Food image with graceful fallback ────────────────────────

const FoodImage = ({ src, alt }: { src: string | null; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E5EB] bg-gradient-to-br from-[#F7F7FA] to-[#E5E5EB]/40 sm:h-[88px] sm:w-[88px]">
        <UtensilsCrossed className="h-7 w-7 text-[#6750A4]/30" />
      </div>
    );
  }

  return (
    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[#E5E5EB] bg-[#F7F7FA] sm:h-[88px] sm:w-[88px]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

// ─── Kitchen Display Ticket (KDS) ──────────────────────────────
// Purple header → order number + table + FIFO position.
// Vertical food rows with images → name → quantity.
// Every item is visible; no internal scroll; no line-clamp on names.

const TableOrderCard = ({
  order,
  onOpen,
  canViewDetails,
  queuePosition,
}: {
  order: any;
  onOpen: () => void;
  canViewDetails: boolean;
  queuePosition: number;
}) => {
  const { t } = useTranslation("tableServiceOrders");

  const tableNo = resolveTableNumber(order);
  const itemDetails = resolveItemDetails(order);
  const totalItemCount = resolveItemsCount(order);
  const notes = resolveOrderNotes(order);
  const status = getTableStatus(order);
  const isNext = queuePosition === 1;

  return (
    <motion.button
      layout
      type="button"
      disabled={!canViewDetails}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={canViewDetails ? { y: -3 } : undefined}
      whileTap={canViewDetails ? { scale: 0.995 } : undefined}
      onClick={() => {
        if (canViewDetails) onOpen();
      }}
      aria-label={`${t("orderNumber")} #${order?.id}`}
      className={`group relative flex w-full flex-col overflow-hidden rounded-[20px] border bg-white text-left transition-all duration-200 ${
        isNext
          ? "border-[#6750A4] shadow-lg shadow-[#6750A4]/10 ring-2 ring-[#6750A4]/25"
          : "border-[#E5E5EB] shadow-sm"
      } ${
        canViewDetails
          ? "cursor-pointer hover:border-[#6750A4]/50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6750A4]/40"
          : "cursor-default"
      }`}
    >
      {/* ── A. Purple order header ── */}
      <div className="relative flex items-start justify-between gap-3 bg-[#6750A4] px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          {/* FIFO queue position */}
          <span
            aria-hidden="true"
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold text-white ring-1 ring-white/25"
          >
            {queuePosition}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">
                {t("orderNumber")}
              </p>

              {isNext && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-[#6750A4] shadow-sm">
                  {t("nextOrder", { defaultValue: "Next Order" })}
                </span>
              )}
            </div>

            <p className="truncate font-mono text-xl font-extrabold leading-tight text-white sm:text-2xl">
              #{order.id}
            </p>
          </div>
        </div>

        {/* Table number — large and unmistakable */}
        <div className="flex flex-col items-center rounded-xl bg-white/15 px-3 py-1.5 ring-1 ring-white/25">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/70">
            {t("table")}
          </span>
          <span className="max-w-[5rem] truncate text-2xl font-extrabold leading-none text-white sm:text-[26px]">
            {tableNo ?? "—"}
          </span>
        </div>
      </div>

      {/* ── B. Food items — vertical, image-first, never truncated ── */}
      <div className="flex-1 px-4 py-1 sm:px-5">
        {itemDetails.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-4">
            {itemDetails.map((item, index) => (
              <li
                key={`${order.id}-item-${index}`}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#E5E5EB] bg-white p-2.5 transition hover:border-[#6750A4]/30"
              >
                {/* Product image */}
                <div className="relative w-full overflow-hidden rounded-lg bg-[#F7F7FA] aspect-square">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UtensilsCrossed className="h-8 w-8 text-[#6750A4]/30" />
                    </div>
                  )}

                  {/* Quantity badge */}
                  <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#6750A4] px-2 text-xs font-extrabold text-white shadow-sm">
                    ×{item.quantity}
                  </span>
                </div>

                {/* Product information */}
                <div className="min-w-0 pt-2">
                  <p className="break-words text-xs font-bold leading-snug text-[#24212B] sm:text-sm">
                    {item.name}
                  </p>

                  {item.description && (
                    <p className="mt-1 break-words text-[10px] leading-snug text-[#6B7280]">
                      {item.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-xs text-[#6B7280]">
            {t("noItems")}
          </p>
        )}
      </div>

      {/* ── Special instructions ── */}
      {notes && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-[#6750A4]/20 bg-[#6750A4]/5 px-3 py-2 sm:mx-5">
          <StickyNote className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#6750A4]" />
          <p className="line-clamp-3 text-xs leading-snug text-[#24212B]">
            {notes}
          </p>
        </div>
      )}

      {/* ── C. Compact footer ── */}
      <div className="flex items-center justify-between gap-2 border-t border-[#E5E5EB] bg-white px-4 py-2.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${status.cls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {t(`statuses.${status.key}`)}
          </span>

          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
            {totalItemCount} {t("items")}
          </span>
        </div>

        {canViewDetails && (
          <span
            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#6750A4] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition ${
              isNext
                ? "group-hover:bg-[#584589]"
                : "bg-[#6750A4]/90 group-hover:bg-[#6750A4]"
            }`}
          >
            {t("viewOrder")}
            <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </motion.button>
  );
};

// ─── Skeleton ──────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-[20px] border border-[#E5E5EB] bg-white">
    <div className="flex items-start justify-between gap-3 bg-[#6750A4] px-4 py-3 sm:px-5 sm:py-3.5">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/20" />

        <div className="space-y-1.5">
          <div className="h-2 w-14 animate-pulse rounded bg-white/20" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/20" />
        </div>
      </div>

      <div className="h-14 w-16 animate-pulse rounded-xl bg-white/20" />
    </div>

    <div className="space-y-3 px-4 py-3 sm:px-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-20 w-20 animate-pulse rounded-xl bg-[#E5E5EB] sm:h-[88px] sm:w-[88px]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#E5E5EB]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#E5E5EB]/60" />
          </div>
          <div className="h-10 w-12 animate-pulse rounded-xl bg-[#E5E5EB]" />
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between gap-2 border-t border-[#E5E5EB] px-4 py-2.5 sm:px-5">
      <div className="h-6 w-24 animate-pulse rounded-full bg-[#E5E5EB]" />
      <div className="h-7 w-24 animate-pulse rounded-lg bg-[#E5E5EB]" />
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────

export default function TableServiceOrdersModal({
  open,
  onClose,
  orders,
  onOpenOrder,
  onRefresh,
  userRole,
  refreshing = false,
}: Props) {
  const { t, i18n } = useTranslation("tableServiceOrders");

  const isAmharic = Boolean(i18n?.language?.startsWith("am"));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusBucket>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  // ─── Background polling refs ────────────────────────────────

  const refreshRef = useRef(onRefresh);
  const refreshingRef = useRef(refreshing);
  const inFlightRef = useRef(false);

  const canViewDetails = userRole.toLowerCase() !== "viewer";

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  // ─── Fullscreen support ─────────────────────────────────────

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement &&
          document.fullscreenElement === panelRef.current,
        ),
      );
    };

    document.addEventListener("fullscreenchange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, []);

  // Exit fullscreen whenever the modal is closed.
  useEffect(() => {
    if (open) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        /* ignored */
      });
    }
  }, [open]);

  const toggleFullscreen = async () => {
    const el = panelRef.current;

    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen();
      } else {
        console.warn("Fullscreen API is not supported by this browser.");
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  };

  // ─── Background polling ─────────────────────────────────────
  // Runs every 30 seconds even when the modal is closed.
  // The component itself must remain mounted.

  useEffect(() => {
    if (!onRefresh) return;

    let mounted = true;

    const refreshOrders = async () => {
      if (
        !mounted ||
        inFlightRef.current ||
        refreshingRef.current ||
        !refreshRef.current
      ) {
        return;
      }

      inFlightRef.current = true;

      try {
        await refreshRef.current();
      } catch (error) {
        console.error("Failed to refresh table service orders:", error);
      } finally {
        inFlightRef.current = false;
      }
    };

    void refreshOrders();

    const interval = window.setInterval(() => {
      void refreshOrders();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [Boolean(onRefresh)]);

  // ─── Filtered table orders ──────────────────────────────────

  const tableOrders = useMemo(
    () => (orders || []).filter(shouldShowPreparationOrder),
    [orders],
  );

  // ─── FIFO positions (oldest = 1). Computed from the full
  // unfiltered list so a queue number stays stable while the
  // user searches or filters. ─────────────────────────────────

  const queuePositions = useMemo(() => {
    const sorted = [...tableOrders].sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime(),
    );

    const map = new Map<any, number>();
    sorted.forEach((o, index) => map.set(o.id, index + 1));

    return map;
  }, [tableOrders]);

  // ─── Order counts ───────────────────────────────────────────

  const counts = useMemo(() => {
    let pending = 0;
    let inProgress = 0;

    tableOrders.forEach((o) => {
      const b = classifyOrder(o);

      if (b === "pending") pending++;
      else if (b === "inProgress") inProgress++;
    });

    return {
      total: tableOrders.length,
      pending,
      inProgress,
    };
  }, [tableOrders]);

  // ─── Search + status filtering (FIFO preserved) ─────────────

  const filtered = useMemo(() => {
    let list = [...tableOrders];

    if (statusFilter !== "all") {
      list = list.filter((o) => classifyOrder(o) === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter((o) => {
        const table = (resolveTableNumber(o) || "").toLowerCase();
        const name = resolveCustomerName(o).toLowerCase();
        const phone = resolveCustomerPhone(o).toLowerCase();
        const id = String(o.id ?? "");
        const company = resolveCompanyName(o, isAmharic).toLowerCase();

        return (
          table.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          id.includes(q) ||
          company.includes(q)
        );
      });
    }

    // FIFO — oldest orders first.
    return list.sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime(),
    );
  }, [tableOrders, statusFilter, search, isAmharic]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="tsm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[9000] flex items-stretch justify-center bg-[#24212B]/70 backdrop-blur-sm ${
            isFullscreen ? "p-0" : "p-0 sm:items-center sm:p-5"
          }`}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t("dialogTitle")}
        >
          <motion.div
            ref={panelRef}
            key="tsm-panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{
              type: "spring",
              damping: 26,
              stiffness: 300,
            }}
            onClick={(e) => e.stopPropagation()}
            className={`flex h-full w-full flex-col overflow-hidden bg-[#F7F7FA] shadow-2xl ${
              isFullscreen
                ? "max-w-none rounded-none"
                : "max-w-[1500px] sm:h-[94vh] sm:rounded-3xl"
            }`}
          >
            {/* ── Header ── */}
            <header className="relative flex flex-shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-[#E5E5EB] bg-white px-4 py-3 sm:px-6">
              <div className="absolute left-0 top-0 h-full w-1 bg-[#6750A4]" />

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#6750A4]/10 text-[#6750A4]">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-extrabold text-[#24212B] sm:text-lg">
                      {t("title")}
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-full bg-[#6750A4]/10 px-2 py-1 text-[9px] font-bold text-[#6750A4]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6750A4]" />
                      {t("live")}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-[#24212B] px-2 py-1 text-[9px] font-bold text-white">
                      {counts.total} {t("orders")}
                    </span>

                    {counts.pending > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#6750A4]/10 px-2 py-1 text-[9px] font-bold text-[#6750A4]">
                        <Clock className="h-3 w-3" />
                        {counts.pending} {t("awaitingPayment")}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">
                    {t("subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                {onRefresh && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !inFlightRef.current &&
                        !refreshingRef.current &&
                        refreshRef.current
                      ) {
                        inFlightRef.current = true;

                        Promise.resolve(refreshRef.current())
                          .catch((error) => {
                            console.error(
                              "Failed to refresh table service orders:",
                              error,
                            );
                          })
                          .finally(() => {
                            inFlightRef.current = false;
                          });
                      }
                    }}
                    disabled={refreshing}
                    className="flex h-9 items-center gap-2 rounded-xl border border-[#E5E5EB] bg-white px-3 text-xs font-semibold text-[#6B7280] transition hover:border-[#6750A4]/30 hover:bg-[#6750A4]/5 hover:text-[#6750A4] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={t("refresh")}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />

                    <span className="hidden sm:inline">{t("refresh")}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#6750A4]/30 bg-[#6750A4]/5 text-[#6750A4] transition hover:bg-[#6750A4]/15"
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E5EB] bg-white text-[#6B7280] transition hover:border-[#6750A4]/30 hover:bg-[#6750A4]/5 hover:text-[#6750A4]"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* ── Dashboard controls ── */}
            {!isFullscreen && (
              <section className="flex-shrink-0 border-b border-[#E5E5EB] bg-white px-3 py-2.5 sm:px-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-5">
                  {/* Statistics — use available horizontal space */}
                  <div className="grid min-w-0 flex-1 grid-cols-3 gap-3">
                    <StatTile
                      label={t("allOrders")}
                      value={counts.total}
                      accent="solid"
                      icon={Receipt}
                      active={statusFilter === "all"}
                      onClick={() => setStatusFilter("all")}
                    />

                    <StatTile
                      label={t("awaitingPayment")}
                      value={counts.pending}
                      accent="soft"
                      icon={Clock}
                      active={statusFilter === "pending"}
                      onClick={() => setStatusFilter("pending")}
                    />

                    <StatTile
                      label={t("toPrepare")}
                      value={counts.inProgress}
                      accent="soft"
                      icon={ChefHat}
                      active={statusFilter === "inProgress"}
                      onClick={() => setStatusFilter("inProgress")}
                    />
                  </div>

                  {/* Search and refresh — compact on the right */}
                  <div className="flex w-full flex-shrink-0 items-center gap-2 xl:w-[22rem]">
                    <div className="relative min-w-0 flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />

                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        aria-label={t("searchOrders")}
                        className="h-10 w-full rounded-xl border border-[#E5E5EB] bg-[#F7F7FA] pl-9 pr-3 text-xs text-[#24212B] outline-none transition placeholder:text-[#6B7280] focus:border-[#6750A4]/50 focus:bg-white focus:ring-2 focus:ring-[#6750A4]/10"
                      />
                    </div>

                    <span className="inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded-xl border border-[#6750A4]/15 bg-[#6750A4]/5 px-3 text-[10px] font-semibold text-[#6750A4]">
                      <RefreshCw className="h-3.5 w-3.5" />
                      30s
                    </span>
                  </div>
                </div>
              </section>
            )}
            {/* ── Orders ── */}
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F7F7FA] px-3 py-3 sm:px-5 sm:py-4">
              {refreshing && orders.length === 0 ? (
                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-full min-h-[350px] items-center justify-center">
                  <div className="max-w-sm px-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E5E5EB] bg-white shadow-sm">
                      <UtensilsCrossed className="h-7 w-7 text-[#6750A4]/30" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#24212B]">
                      {tableOrders.length === 0
                        ? t("emptyTitle")
                        : t("noResultsTitle")}
                    </h3>

                    <p className="mt-1.5 text-xs leading-relaxed text-[#6B7280]">
                      {tableOrders.length === 0
                        ? t("emptyDescription")
                        : t("noResultsDescription")}
                    </p>

                    {(search || statusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("all");
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#E5E5EB] bg-white px-4 py-2 text-xs font-semibold text-[#24212B] transition hover:border-[#6750A4]/30 hover:bg-[#6750A4]/5 hover:text-[#6750A4]"
                      >
                        <X className="h-3.5 w-3.5" />
                        {t("clearFilters")}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((o) => (
                      <TableOrderCard
                        key={o.id}
                        order={o}
                        canViewDetails={canViewDetails}
                        queuePosition={queuePositions.get(o.id) ?? 0}
                        onOpen={() => {
                          if (canViewDetails) {
                            onOpenOrder(o.id);
                          }
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </main>

            {/* ── Footer ── */}
            <footer className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-[#E5E5EB] bg-white px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 text-[10px] text-[#6B7280] sm:text-[11px]">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#6750A4]" />

                <span className="truncate">
                  {t("showing")}{" "}
                  <strong className="font-bold text-[#24212B]">
                    {filtered.length}
                  </strong>{" "}
                  {t("of")}{" "}
                  <strong className="font-bold text-[#24212B]">
                    {counts.total}
                  </strong>{" "}
                  {t("orders")}
                </span>
              </div>

              <span className="hidden flex-shrink-0 items-center gap-1.5 text-[10px] text-[#6B7280] sm:inline-flex">
                <AlertCircle className="h-3.5 w-3.5" />
                {t("clickCardHint")}
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
