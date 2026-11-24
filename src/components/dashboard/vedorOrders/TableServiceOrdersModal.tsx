import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  X,
  UtensilsCrossed,
  Search,
  RefreshCw,
  Users,
  Clock,
  Hash,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  CreditCard,
  Banknote,
  ShoppingBag,
  StickyNote,
  ChefHat,
  Timer,
  Receipt,
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
type Urgency = "fresh" | "normal" | "warning" | "critical";

// ─── Currency formatter ─────────────────────────────────────────

const formatCurrency = (amount: unknown, isAmharic = false): string => {
  const n = Number(amount);

  if (!Number.isFinite(n)) {
    return isAmharic ? "— ብር" : "ETB —";
  }

  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isAmharic ? `${formatted} ብር` : `ETB ${formatted}`;
};

// ─── Defensive resolvers ────────────────────────────────────────

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

const resolveTableZone = (order: any): string | null =>
  order?.table_zone ??
  order?.table?.zone ??
  order?.zone ??
  order?.area ??
  order?.floor ??
  order?.hall ??
  null;

const resolveCustomerPhoto = (order: any): string | null => {
  const customer = order?.customer ?? order?.user ?? order?.buyer ?? {};

  const photo =
    customer?.profile_image ||
    customer?.profile_picture ||
    customer?.avatar ||
    customer?.photo ||
    customer?.image ||
    order?.customer_profile_image ||
    order?.customer_avatar ||
    order?.customer_image ||
    order?.user?.profile_image ||
    order?.user?.avatar ||
    null;

  return typeof photo === "string" && photo.trim() ? photo.trim() : null;
};

const resolvePartySize = (order: any): number | null => {
  const raw =
    order?.party_size ??
    order?.guests ??
    order?.guest_count ??
    order?.number_of_guests ??
    order?.num_guests ??
    order?.customer_count ??
    order?.persons ??
    order?.table?.capacity;

  if (raw == null || String(raw).trim() === "") return null;

  const n = Number(raw);

  return Number.isFinite(n) && n > 0 ? n : null;
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

const resolveTotal = (order: any): number | null => {
  const raw =
    order?.total ??
    order?.total_price ??
    order?.grand_total ??
    order?.total_amount ??
    order?.amount;

  if (raw == null || String(raw).trim() === "") return null;

  const n = Number(raw);

  return Number.isFinite(n) ? n : null;
};

const resolvePaymentMethod = (order: any): string | null => {
  const raw =
    order?.payment_method ??
    order?.payment?.method ??
    order?.payment_type ??
    null;

  if (!raw) return null;

  return String(raw);
};

const resolveCompanyName = (order: any, isAmharic: boolean): string => {
  const candidates = [
    isAmharic && order?.company?.name_am?.trim(),
    order?.company?.name,
    order?.vendor_orders?.[0]?.company?.name_am,
    order?.vendor_orders?.[0]?.company?.name,
  ].filter(Boolean) as string[];

  return candidates[0] || "";
};

const resolveCompanyLogo = (order: any): string | null =>
  order?.company?.logo || order?.vendor_orders?.[0]?.company?.logo || null;

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

    const image =
      item?.image ||
      item?.image_url ||
      item?.product_image ||
      item?.thumbnail ||
      product?.image ||
      product?.image_url ||
      null;

    return {
      name,
      quantity:
        Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      image,
    };
  });

// ─── Status helpers ─────────────────────────────────────────────

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
    ["cancelled", "rejected", "failed", "expired", "refunded"].includes(status)
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

// ─── Status badge ───────────────────────────────────────────────

const getTableStatus = (order: any) => {
  const s = String(order?.status ?? "").toLowerCase();
  const p = String(order?.payment_status ?? "").toLowerCase();

  if (s === "fulfilled" || s === "completed" || s === "delivered") {
    return {
      key: "completed",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (p === "paid") {
    return {
      key: "paid",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (s === "processing") {
    return {
      key: "preparing",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    };
  }

  if (s === "confirmed") {
    return {
      key: "confirmed",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
      dot: "bg-indigo-500",
    };
  }

  if (s === "contacted") {
    return {
      key: "contacted",
      cls: "bg-teal-50 text-teal-700 border-teal-200",
      dot: "bg-teal-500",
    };
  }

  if (s === "accepted" || s === "picked_up" || s === "out_for_delivery") {
    return {
      key: s,
      cls: "bg-cyan-50 text-cyan-700 border-cyan-200",
      dot: "bg-cyan-500",
    };
  }

  if (s === "pending") {
    return {
      key: "awaitingPayment",
      cls: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    };
  }

  if (s === "cancelled" || s === "rejected" || s === "failed") {
    return {
      key: "cancelled",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    };
  }

  if (s === "expired") {
    return {
      key: "expired",
      cls: "bg-amber-50 text-amber-800 border-amber-300",
      dot: "bg-amber-500",
    };
  }

  return {
    key: "unknown",
    cls: "bg-gray-50 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
};

// ─── Payment badge ──────────────────────────────────────────────

const getPaymentBadge = (order: any) => {
  const method = resolvePaymentMethod(order)?.toLowerCase();

  if (!method) return null;

  if (method === "chapa") {
    return { label: "Chapa", icon: CreditCard };
  }

  if (method === "telebirr") {
    return { label: "Telebirr", icon: CreditCard };
  }

  if (method === "arifpay") {
    return { label: "ArifPay", icon: CreditCard };
  }

  if (method === "cod") {
    return { label: "Cash", icon: Banknote };
  }

  if (method === "bank_transfer" || method === "bank") {
    return { label: "Bank Transfer", icon: CreditCard };
  }

  return {
    label: method.replace(/_/g, " "),
    icon: CreditCard,
  };
};

// ─── Elapsed time ───────────────────────────────────────────────

const getElapsed = (iso?: string): { text: string; urgency: Urgency } => {
  if (!iso) {
    return { text: "—", urgency: "normal" };
  }

  const t = new Date(iso).getTime();

  if (Number.isNaN(t)) {
    return { text: "—", urgency: "normal" };
  }

  const diff = Math.max(0, Date.now() - t) / 1000;
  const mins = diff / 60;

  if (diff < 60) {
    return {
      text: `${Math.floor(diff)}s`,
      urgency: "fresh",
    };
  }

  if (diff < 3600) {
    const urgency: Urgency =
      mins > 30 ? "critical" : mins > 15 ? "warning" : "normal";

    return {
      text: `${Math.floor(mins)}m`,
      urgency,
    };
  }

  if (diff < 86400) {
    return {
      text: `${Math.floor(diff / 3600)}h`,
      urgency: "critical",
    };
  }

  return {
    text: `${Math.floor(diff / 86400)}d`,
    urgency: "critical",
  };
};

const isRecent = (iso: string | undefined, mins = 5): boolean => {
  if (!iso) return false;

  const t = new Date(iso).getTime();

  if (Number.isNaN(t)) return false;

  return Date.now() - t < mins * 60_000;
};

// ─── Stat tile ──────────────────────────────────────────────────

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
  accent: "secondary" | "amber" | "blue";
  icon: any;
}) => {
  const accents = {
    secondary: {
      icon: "bg-secondary/10 text-secondary",
      active: "border-secondary/40 bg-secondary/[0.06]",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      active: "border-amber-300 bg-amber-50",
    },
    blue: {
      icon: "bg-blue-100 text-blue-700",
      active: "border-blue-300 bg-blue-50",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-w-0 items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:gap-3 sm:p-3.5 ${
        active
          ? accents[accent].active
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <span
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${accents[accent].icon}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[11px]">
          {label}
        </span>

        <span className="mt-0.5 block text-xl font-bold leading-none text-gray-900 sm:text-2xl">
          {value}
        </span>
      </span>
    </button>
  );
};

// ─── Kitchen order ticket ────────────────────────────────────────

const TableOrderCard = ({
  order,
  onOpen,
  isAmharic,
  canViewDetails,
}: {
  order: any;
  onOpen: () => void;
  isAmharic: boolean;
  canViewDetails: boolean;
}) => {
  const { t } = useTranslation("tableServiceOrders");

  const tableNo = resolveTableNumber(order);
  const zone = resolveTableZone(order);
  const party = resolvePartySize(order);
  const customer = resolveCustomerName(order);
  const phone = resolveCustomerPhone(order);
  const customerPhoto = resolveCustomerPhoto(order);

  const customerInitial = (
    String(customer || "G")
      .trim()
      .charAt(0) || "G"
  ).toUpperCase();

  const items = resolveItemsCount(order);
  const itemDetails = resolveItemDetails(order);
  const total = resolveTotal(order);
  const payment = getPaymentBadge(order);
  const notes = resolveOrderNotes(order);
  const status = getTableStatus(order);
  const elapsed = getElapsed(order.created_at);
  const isNew = isRecent(order.created_at, 5);
  const companyName = resolveCompanyName(order, isAmharic);
  const companyLogo = resolveCompanyLogo(order);

  const urgencyStyles = {
    fresh: {
      bar: "bg-emerald-400",
      timer: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    normal: {
      bar: "bg-blue-400",
      timer: "bg-blue-50 text-blue-700 border-blue-100",
    },
    warning: {
      bar: "bg-amber-400",
      timer: "bg-amber-50 text-amber-700 border-amber-100",
    },
    critical: {
      bar: "bg-rose-500",
      timer: "bg-rose-50 text-rose-700 border-rose-100",
    },
  };

  const urgency = urgencyStyles[elapsed.urgency];

  return (
<motion.button
  layout
  type="button"
  disabled={!canViewDetails}
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96 }}
  whileHover={canViewDetails ? { y: -3 } : undefined}
  whileTap={canViewDetails ? { scale: 0.99 } : undefined}
  onClick={() => {
    if (canViewDetails) onOpen();
  }}
  aria-label={t("openOrder", {
    id: order?.id,
    customer,
  })}
  className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-all duration-200 ${
    canViewDetails
      ? "cursor-pointer hover:border-secondary/40 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
      : "cursor-default"
  }`}
>
      {/* Urgency indicator */}
      <div className={`h-1 w-full ${urgency.bar}`} />

      {/* Ticket header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Receipt className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {t("orderNumber")}
            </p>

            <p className="truncate font-mono text-sm font-bold text-gray-900">
              #{order.id}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          {isNew && (
            <span className="rounded-full bg-rose-500 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
              {t("new")}
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold ${status.cls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {t(`statuses.${status.key}`)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Table identity and customer information */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Table number: only show when available */}
          {tableNo !== null && (
            <div className="flex h-[68px] w-[68px] flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-secondary/20 bg-gradient-to-br from-secondary/15 to-secondary/5">
              <Hash className="h-3.5 w-3.5 text-secondary/60" />

              <span className="mt-1 max-w-full truncate px-1 text-2xl font-extrabold leading-none text-secondary">
                {tableNo}
              </span>

              <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-secondary/60">
                {t("table")}
              </span>
            </div>
          )}

          {/* Customer profile and information */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-secondary/10 text-secondary">
              {customerPhoto && (
                <img
                  src={customerPhoto}
                  alt={customer || t("walkIn")}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";

                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement | null;

                    if (fallback) {
                      fallback.style.display = "flex";
                    }
                  }}
                />
              )}

              <span
                className="h-full w-full items-center justify-center text-base font-bold"
                style={{
                  display: customerPhoto ? "none" : "flex",
                }}
              >
                {customerInitial}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">
                {customer || t("walkIn")}
              </p>

              {phone && (
                <p className="mt-0.5 truncate text-xs text-gray-500">{phone}</p>
              )}

              {zone && (
                <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{zone}</span>
                </span>
              )}
            </div>
          </div>

          {/* Elapsed time */}
          <div
            className={`flex flex-shrink-0 flex-col items-center rounded-xl border px-2.5 py-2 ${urgency.timer}`}
          >
            <Timer className="h-3.5 w-3.5" />

            <span className="mt-1 font-mono text-sm font-bold">
              {elapsed.text}
            </span>

            <span className="text-[8px] font-semibold uppercase tracking-wide">
              {t("elapsed")}
            </span>
          </div>
        </div>

        {/* Order information */}
        <div
          className={`mt-4 grid gap-2 ${
            party !== null ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Guests: only show when available */}
          {party !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
              <Users className="h-4 w-4 flex-shrink-0 text-gray-400" />

              <div className="min-w-0">
                <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                  {t("guests")}
                </p>

                <p className="text-xs font-bold text-gray-800">{party}</p>
              </div>
            </div>
          )}

          {/* Items count */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
            <ShoppingBag className="h-4 w-4 flex-shrink-0 text-gray-400" />

            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                {t("items")}
              </p>

              <p className="text-xs font-bold text-gray-800">{items}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ChefHat className="h-3.5 w-3.5 text-secondary" />

              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t("orderItems")}
              </p>
            </div>

            <span className="rounded-md bg-secondary/5 px-2 py-0.5 text-[10px] font-semibold text-secondary">
              {items} {t("items")}
            </span>
          </div>

          {itemDetails.length > 0 ? (
       <div className="max-h-64 space-y-2 overflow-y-auto overscroll-contain pr-1">
              {itemDetails.map((item, index) => (
                <div
                  key={`${order.id}-item-${index}`}
                  className="flex min-w-0 items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-2"
                >
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-800">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {t("quantity")}: {item.quantity}
                    </p>
                  </div>

                  <span className="flex h-7 min-w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/10 px-2 text-xs font-bold text-secondary">
                    ×{item.quantity}
                  </span>
                </div>
              ))}

              {items > itemDetails.length && (
                <p className="pl-1 text-[10px] font-medium text-gray-400">
                  +{items - itemDetails.length} {t("moreItems")}
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-gray-50 px-3 py-3 text-center text-xs text-gray-400">
              {t("noItems")}
            </p>
          )}
        </div>

        {/* Special instructions */}
        {notes && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />

            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
                {t("specialInstructions")}
              </p>

              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-amber-900">
                {notes}
              </p>
            </div>
          </div>
        )}

        {/* Company information */}
        {companyName && (
          <div className="mt-3 flex min-w-0 items-center gap-2">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt=""
                className="h-5 w-5 flex-shrink-0 rounded-md object-cover"
              />
            ) : (
              <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
            )}

            <span className="truncate text-[10px] font-medium text-gray-500">
              {companyName}
            </span>
          </div>
        )}

        {/* Total and action */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-gray-200 pt-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
              {t("total")}
            </p>

            <p className="mt-0.5 truncate text-base font-extrabold text-gray-900">
              {formatCurrency(total, isAmharic)}
            </p>

            {payment && (
              <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                <payment.icon className="h-3 w-3" />
                <span className="truncate">{payment.label}</span>
              </p>
            )}
          </div>

          {canViewDetails && (
            <span className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-xs font-bold text-white shadow-sm">
              {t("viewOrder")}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// ─── Skeleton ──────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="h-1 animate-pulse bg-gray-100" />

    <div className="flex items-center justify-between border-b border-gray-100 p-4">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />

        <div className="space-y-2">
          <div className="h-2 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
    </div>

    <div className="space-y-3 p-4">
      <div className="flex gap-3">
        <div className="h-[68px] w-[68px] animate-pulse rounded-2xl bg-gray-100" />

        <div className="flex-1 space-y-2 py-2">
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
      </div>

      <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
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

    // Initial fetch.
    void refreshOrders();

    // Automatic refresh every 30 seconds.
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

  // ─── Order counts ───────────────────────────────────────────

  const counts = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;

    tableOrders.forEach((o) => {
      const b = classifyOrder(o);

      if (b === "pending") pending++;
      else if (b === "inProgress") inProgress++;
      else if (b === "completed") completed++;
      else cancelled++;
    });

    return {
      total: tableOrders.length,
      pending,
      inProgress,
      completed,
      cancelled,
    };
  }, [tableOrders]);

  // ─── Search and status filtering ────────────────────────────

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

    return list.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
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
          className="fixed inset-0 z-[9000] flex items-stretch justify-center bg-gray-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t("dialogTitle")}
        >
          <motion.div
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
            className="flex h-full w-full max-w-[1500px] flex-col overflow-hidden bg-gray-50 shadow-2xl sm:h-[94vh] sm:rounded-3xl"
          >
            {/* Header */}
            <header className="relative flex flex-shrink-0 items-center justify-between gap-3 overflow-hidden border-b border-gray-200 bg-white px-4 py-3.5 sm:px-6">
              <div className="absolute left-0 top-0 h-full w-1 bg-secondary" />

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-extrabold text-gray-950 sm:text-lg">
                      {t("title")}
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      {t("live")}
                    </span>
                  </div>

                  <p className="mt-0.5 truncate text-[11px] text-gray-500">
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
                    className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
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
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Dashboard controls */}
            <section className="flex-shrink-0 space-y-3 border-b border-gray-200 bg-white px-3 py-4 sm:px-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <StatTile
                  label={t("allOrders")}
                  value={counts.total}
                  accent="secondary"
                  icon={Receipt}
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                />

                <StatTile
                  label={t("awaitingPayment")}
                  value={counts.pending}
                  accent="amber"
                  icon={Clock}
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                />

                <StatTile
                  label={t("toPrepare")}
                  value={counts.inProgress}
                  accent="blue"
                  icon={ChefHat}
                  active={statusFilter === "inProgress"}
                  onClick={() => setStatusFilter("inProgress")}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchOrders")}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-secondary/50 focus:bg-white focus:ring-2 focus:ring-secondary/10"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400 sm:justify-end">
                  <span>{t("autoRefresh")}</span>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                    <RefreshCw className="h-3 w-3" />
                    30s
                  </span>
                </div>
              </div>
            </section>

            {/* Orders */}
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-gray-50 px-3 py-4 sm:px-6 sm:py-5">
              {refreshing && orders.length === 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex min-h-[350px] h-full items-center justify-center">
                  <div className="max-w-sm px-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
                      <UtensilsCrossed className="h-7 w-7 text-gray-300" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-gray-900">
                      {tableOrders.length === 0
                        ? t("emptyTitle")
                        : t("noResultsTitle")}
                    </h3>

                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
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
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary"
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
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((o) => (
                      <TableOrderCard
                        key={o.id}
                        order={o}
                        isAmharic={isAmharic}
                        canViewDetails={canViewDetails}
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

            {/* Footer */}
            <footer className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 text-[10px] text-gray-500 sm:text-[11px]">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />

                <span className="truncate">
                  {t("showing")}{" "}
                  <strong className="font-bold text-gray-900">
                    {filtered.length}
                  </strong>{" "}
                  {t("of")}{" "}
                  <strong className="font-bold text-gray-900">
                    {counts.total}
                  </strong>{" "}
                  {t("orders")}
                </span>
              </div>

              <span className="hidden flex-shrink-0 items-center gap-1.5 text-[10px] text-gray-400 sm:inline-flex">
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
