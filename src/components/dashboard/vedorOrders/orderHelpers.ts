// orderHelpers.ts
// Pure, framework-agnostic helpers shared by the order detail modal,
// the table-service orders modal, and anywhere else that needs them.
// ⚠️ This file must NOT export React components — only values/types —
// so React Fast Refresh can safely reload files that import it.

// ─── Fulfillment type normalizer ─────────────────────────────────
export type FulfillmentKind = "delivery" | "pickup" | "onspot" | "unknown";

export const getFulfillmentKind = (order: any): FulfillmentKind => {
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

// ─── Restaurant / table-service detector ────────────────────────
export const isRestaurant = (order: any): boolean => {
  const co = order?.company || order?.vendor_orders?.[0]?.company;
  if (!co) return false;
  const flag =
    co.supports_table_service ??
    co.supports_table_orders ??
    co.has_table_service ??
    co.is_restaurant;
  return (
    flag === true ||
    flag === 1 ||
    flag === "true" ||
    flag === "1"
  );
};

// ─── Customer info resolvers ────────────────────────────────────
export const resolveCustomerName = (order: any): string => {
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

export const hasCustomerName = (order: any): boolean => {
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

export const resolveCustomerPhone = (order: any): string => {
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

export const resolveCustomerImage = (order: any): string | undefined => {
  return (
    order?.recipient_image ||
    order?.customer_image ||
    order?.customer?.image ||
    order?.customer?.profile_image ||
    undefined
  );
};

// ─── Misc formatting ────────────────────────────────────────────
export const getInitials = (name?: string): string =>
  name
    ?.trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

export const formatAddress = (address?: string | null): string => {
  if (!address) return "";
  return address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
};

// ─── Status label + badge ──────────────────────────────────────
export const getDisplayStatus = (
  status: string,
  t?: any,
  customLabels?: Record<string, string>,
): string => {
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

export const getStatusBadge = (status: string): string => {
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
