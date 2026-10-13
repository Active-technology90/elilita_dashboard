// src/utils/notificationRouting.ts
// SINGLE SOURCE OF TRUTH for notification → detail page routing.
// Used by: NotificationBell, NotificationsPage, foreground FCM toast,
//          service worker click handler.


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function extractVendorOrderId(source: any): number | null {
  const data = source?.data ?? source ?? {};

  const raw =
    data.vendor_order_id ??
    data.order_id ??
    data.vendorOrderId ??
    (data.type === "vendor_order" ? data.id : null);

  if (raw != null && !isNaN(Number(raw))) return Number(raw);

  // Fallback: parse "#123" from title/body
  const text = `${source?.title || ""} ${source?.body || ""}`;
  const match = text.match(/#(\d+)/);
  return match?.[1] ? Number(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Event → route mapping
// ---------------------------------------------------------------------------
export function getNotificationRoute(
  event: string,
  payload: any,
): string | null {
  const orderId = extractVendorOrderId(payload);
  const data = payload?.data ?? payload ?? {};

  switch (event) {
    // ---------- Vendor orders ----------
    case "vendororder.new":
    case "vendororder.preparing":
    case "vendororder.ready":
    case "vendororder.cancelled":
    case "vendor_order.created":
    case "vendor_order.updated":
    case "vendor_order.cancelled":
      return orderId
        ? `/dashboard/orders?vendor_order_id=${orderId}`
        : "/dashboard/orders";

    // ---------- Payments ----------
    case "order.paid":
    case "order.payment_failed":
    case "payment.received":
    case "payment.failed":
      return orderId
        ? `/dashboard/orders?vendor_order_id=${orderId}&tab=payment`
        : "/dashboard/payments";

    // ---------- Delivery ----------
    case "delivery.assigned":
    case "delivery.out_for_delivery":
    case "delivery.delivered":
      return orderId
        ? `/dashboard/orders?vendor_order_id=${orderId}&tab=delivery`
        : "/dashboard/orders";

    // ---------- Company / subscription ----------
    case "company.approved":
    case "company.rejected":
      return data.company_slug
        ? `/dashboard/companies/${data.company_slug}`
        : "/dashboard/companies";

    case "subscription.expiring":
    case "subscription.expired":
      return "/dashboard/subscription";

    // ---------- Ads ----------
    case "ad.approved":
    case "ad.rejected":
      return "/dashboard/ads";

    // ---------- Generic URL fallback ----------
    default:
      if (data.url) return String(data.url);
      return "/dashboard/notifications";
  }
}

// ---------------------------------------------------------------------------
// Normalize raw push payload (service worker / FCM) → event name + data
// ---------------------------------------------------------------------------
export interface NormalizedPush {
  event: string;
  data: Record<string, any>;
}

export function normalizePushPayload(raw: any): NormalizedPush {
  const data = raw?.data ?? raw ?? {};

  // Determine event name priority:
  //   1. explicit `type` or `event` field
  //   2. infer from vendor_order_id
  //   3. default
  let event: string =
    data.event ||
    data.type ||
    (data.vendor_order_id || data.order_id ? "vendororder.new" : "") ||
    "default";

  // Normalize common backend variants
  const alias: Record<string, string> = {
    vendor_order: "vendororder.new",
    order_new: "vendororder.new",
    order_paid: "order.paid",
    order_payment_failed: "order.payment_failed",
    delivery_assigned: "delivery.assigned",
    delivery_out_for_delivery: "delivery.out_for_delivery",
    delivery_delivered: "delivery.delivered",
  };
  if (alias[event]) event = alias[event];

  return {
    event,
    data: {
      ...data,
      vendor_order_id:
        data.vendor_order_id ?? data.order_id ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy: still keep custom event dispatch for DashboardTab consumers
// ---------------------------------------------------------------------------
export function dispatchPushNavigation(payload: any): void {
  window.dispatchEvent(
    new CustomEvent("admin-push-navigate", { detail: payload }),
  );
}