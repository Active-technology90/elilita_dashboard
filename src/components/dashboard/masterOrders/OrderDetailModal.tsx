// src/components/dashboard/orders/OrderDetailModal.tsx
import { useEffect, useRef, useState, memo } from "react";
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

  Loader2,
  RefreshCw,
  PhoneCall,
  Building2,

  Store,
  Sparkles,
} from "lucide-react";
import type { MasterOrder, VendorOrder } from "../../../types";

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------
const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getInitials = (name: string) =>
  name
    ?.split(" ")
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

// =============================================================================
// 1. ORDER STATUS BADGE (for MasterOrder.status)
// =============================================================================
const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  const base = "px-1.5 md:px-2.5 py-0.5 md:py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ";


  // Color logic (unchanged)
  if (s === "completed" || s === "delivered")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "paid" || s === "out_for_delivery")
    return base + "bg-violet-50 text-violet-700 border-violet-200";
  if (s === "pending")
    return base + "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "processing" || s === "shipped")
    return base + "bg-sky-50 text-sky-700 border-sky-200";
  if (s === "approved" || s === "accepted")
    return base + "bg-green-50 text-green-700 border-green-200";
  if (s === "rejected" || s === "cancelled")
    return base + "bg-rose-50 text-rose-700 border-rose-200";
  if (s === "contacted")
    return base + "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "fulfilled" || s === "fullfilled")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
  return base + "bg-gray-50 text-gray-600 border-gray-200";
};

// =============================================================================
// 2. DELIVERY STATUS BADGE (for vendorOrder.delivery.status)
// =============================================================================
const getDeliveryStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  const base = "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ";


  // Color logic (reuse same colors as order status)
  if (s === "delivered")
    return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "out_for_delivery")
    return base + "bg-violet-50 text-violet-700 border-violet-200";
  if (s === "pending")
    return base + "bg-amber-50 text-amber-700 border-amber-200";
  return base + "bg-gray-50 text-gray-600 border-gray-200";
};

// const getPaymentStatusColor = (ps?: string) => {
//   const p = ps?.toLowerCase();
//   if (p === "paid") return "bg-green-50 text-green-700 border-green-200";
//   if (p === "verifying receipt")
//     return "bg-orange-50 text-orange-700 border-orange-200";
//   if (p === "checkout initiated")
//     return "bg-gray-50 text-gray-700 border-gray-200";
//   if (p === "cancelled") return "bg-red-50 text-red-700 border-red-200";
//   return "bg-gray-50 text-gray-700 border-gray-200";
// };


// -----------------------------------------------------------------------------
// Reusable Subcomponents
// -----------------------------------------------------------------------------

const CopyButton = memo(({ text }: { text?: string | number | null }) => {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className="text-gray-400 hover:text-secondary transition-colors p-1 rounded-md bg-white/50 backdrop-blur-sm"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </motion.button>
  );
});
CopyButton.displayName = "CopyButton";

// Premium Card Component
const Card = ({
  children,
  title,
  icon: Icon,
  status,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  status?: string;
  className?: string;
}) => (
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
          {title}
        </h4>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary-light to-transparent rounded-full" />
      </div>
      {status && <span className={getStatusBadge(status)}>{status}</span>}
    </div>
    {children}
  </motion.div>
);

// Premium Vendor Transaction Card (similar to vendor modal's main content)
const VendorOrderCard = memo(({ vendorOrder }: { vendorOrder: VendorOrder }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.2 }}
    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-full"
  >
    {/* Company header */}
    <div className="px-2 sm:px-5 md:px-6 py-2 sm:py-4 border-b border-gray-100 bg-gray-50/30 flex flex-wrap items-start sm:items-center justify-between gap-1 sm:gap-3 w-full">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
          {vendorOrder.company?.logo ? (
            <img
              src={vendorOrder.company.logo}
              alt={`${vendorOrder.company.name} logo`}
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
            />
          ) : (
            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 text-[10px] sm:text-base truncate">
            {vendorOrder.company?.name || "Unknown Company"}
          </p>
          <p className="text-[8px] sm:text-[10px] text-gray-500">Vendor order #{vendorOrder.id} </p> 
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <span className={`px-1 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-xs font-semibold rounded-full border ${getStatusBadge(vendorOrder.status)}`}>
          {vendorOrder.status === "processing"
            ? "Prepared"
            : vendorOrder.status === "shipped"
              ? "In Transit"
              : vendorOrder.status === "fulfilled" ||
                vendorOrder.status === "fullfilled"
                ? "Delivered"
                : vendorOrder.status === "contacted"
                  ? "Confirmed"
                  : vendorOrder.status === "approved" ||
                    vendorOrder.status === "accepted"
                    ? "Approved"
                    : vendorOrder.status === "rejected" ||
                      vendorOrder.status === "cancelled"
                      ? "Cancelled"
                      : vendorOrder.status}
        </span>
        <div className="text-right flex-shrink-0">
          <span className="text-[11px] sm:text-lg font-bold text-secondary tracking-tight block">
            {Number(vendorOrder.amount).toLocaleString()} ETB
          </span>
          {Number(vendorOrder.delivery_fee) > 0 && (
            <span className="text-[7px] sm:text-[10px] font-medium text-gray-500 block">
              Incl. {Number(vendorOrder.delivery_fee).toLocaleString()} ETB
            </span>
          )}
        </div>

      </div>
    </div>

    {/* Delivery tracking (if exists) – NOW USING getDeliveryStatusBadge */}
    {vendorOrder.delivery && (
      <div className="bg-gradient-to-r from-purple-50/40 to-transparent px-3 sm:px-5 md:px-6 py-2 sm:py-3 border-b border-purple-100/50 w-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary mb-2">
          <Truck className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Delivery tracking</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-4 text-[10px] sm:text-sm">
          {vendorOrder.delivery.delivery_person_name && (
            <div className="flex items-center gap-1 sm:gap-2 bg-white/50 rounded-full px-1.5 sm:px-3 py-0.5 sm:py-1">
              <User className="h-2 w-2 sm:h-3 sm:w-3 text-gray-500" />
              <span className="text-gray-700 text-[10px] sm:text-sm">
                {vendorOrder.delivery.delivery_person_name}
              </span>
            </div>
          )}
          {/* {vendorOrder.delivery.tracking_id && (
            <div className="flex items-center gap-1 sm:gap-2 bg-white/50 rounded-full px-1.5 sm:px-3 py-0.5 sm:py-1">
              <span className="text-gray-700 font-mono text-[9px] sm:text-xs">
                {vendorOrder.delivery.tracking_id.split("-")[0]}
              </span>
              <CopyButton text={vendorOrder.delivery.tracking_id.split("-")[0]} />
            </div>
          )} */}
          {vendorOrder.delivery.status && (
            <div
              className={`inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 text-[8px] sm:text-[9px] rounded-full ${getDeliveryStatusBadge(
                vendorOrder.delivery.status
              )}`}
            >
              {vendorOrder.delivery.status === "pending"
                ? "Assigned"
                : vendorOrder.delivery.status === "out_for_delivery"
                  ? "In Transit"
                  : vendorOrder.delivery.status === "delivered"
                    ? "Completed"
                    : vendorOrder.delivery.status}
            </div>
          )}
        </div>
      </div>
    )}

    {vendorOrder.items.length > 0 && (
      <div className="px-2 sm:px-5 md:px-6 py-3 sm:py-6 w-full">
        {/* Header */}
        {/* ===================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-secondary/15 bg-gradient-to-br from-secondary/10 to-violet-100 shadow-sm flex-shrink-0">
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                Order Items
              </p>

              <h3 className="mt-1 text-xs sm:text-sm font-bold text-gray-900 truncate">
                {vendorOrder.items.length} Product
                {vendorOrder.items.length > 1 ? "s" : ""}
              </h3>
            </div>
          </div>

          {/* <div className="inline-flex items-center gap-2 self-start rounded-xl sm:rounded-2xl border border-secondary/10 bg-secondary/5 px-2 sm:px-3 py-1.5 sm:py-2 flex-shrink-0">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-secondary animate-pulse" />

            <span className="text-[9px] sm:text-[11px] font-bold tracking-wide text-secondary whitespace-nowrap">
              Vendor Products
            </span>
          </div> */}
        </div>

        {/* ===================================================== */}
        {/* Premium Container */}
        {/* ===================================================== */}
        <div className="overflow-hidden  rounded-[26px] border border-gray-200/80 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-4">
            <div className="col-span-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Product
              </span>
            </div>

            <div className="col-span-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Qty
              </span>
            </div>

            <div className="col-span-2 text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Unit Price
              </span>
            </div>

            <div className="col-span-2 text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Total
              </span>
            </div>
          </div>

          {/* ===================================================== */}
          {/* Items */}
          {/* ===================================================== */}
          <div className="divide-y divide-gray-100 px-2">
            {vendorOrder.items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: idx * 0.04,
                }}
                className="
              group
              block
              sm:grid
              sm:grid-cols-12
              gap-1
              sm:gap-4
              px-1
              py-2
              sm:px-5
              sm:py-5
              md:px-6
              transition-all
              duration-300
              hover:bg-gradient-to-r
              hover:from-violet-50/40
              hover:to-transparent
              w-full
              border-b
              border-gray-100
              last:border-0
            "
              >
                {/* ===================================================== */}
                {/* Product */}
                {/* ===================================================== */}
                <div className="sm:col-span-6 md:col-span-6 w-full">
                  <div className="flex flex-row items-center gap-2 sm:gap-4 w-full">
                    {/* Image */}
                    <div
                      className="
                    relative
                    h-8
                    w-8
                    sm:h-16
                    sm:w-16
                    flex-shrink-0
                    overflow-hidden
                    rounded-md
                    sm:rounded-2xl
                    border
                    border-gray-100
                    bg-gradient-to-br
                    from-gray-50
                    to-gray-100
                    shadow-sm
                  "
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.title}
                          className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-500
                        group-hover:scale-105
                      "
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/[0.03] to-transparent" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="truncate text-[10px] sm:text-sm font-bold leading-tight text-gray-900">
                        {item.title}
                      </h4>

                      <div className="mt-2 flex items-center gap-2 min-w-0">
                        <span className="inline-flex flex-shrink-0 items-center rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-gray-500">
                          SKU
                        </span>

                        <span className="truncate font-mono text-[9px] text-gray-400">
                          {item.sku || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===================================================== */}
                {/* Qty */}
                {/* ===================================================== */}
                <div className="sm:col-span-2 flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:items-center mt-1 sm:mt-0">
                  <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-0 w-full">
                    <span className="text-[9px] sm:hidden font-bold uppercase tracking-wide text-gray-400">
                      Qty
                    </span>

                    <div
                      className="
                    inline-flex
                    h-5
                    sm:h-10
                    min-w-[32px]
                    sm:min-w-[54px]
                    items-center
                    justify-center
                    rounded-md
                    sm:rounded-2xl
                    border
                    border-secondary/10
                    bg-gradient-to-br
                    from-secondary/8
                    to-violet-50
                    px-1
                    sm:px-4
                    shadow-sm
                  "
                    >
                      <span className="text-[8px] sm:text-sm font-black text-secondary">
                        ×{item.qty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ===================================================== */}
                {/* Unit Price */}
                {/* ===================================================== */}
                <div className="sm:col-span-2 flex flex-row sm:flex-col items-center justify-between sm:justify-end mt-1 sm:mt-0">
                  <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-0 w-full sm:text-right">
                    <span className="text-[9px] sm:hidden font-bold uppercase tracking-wide text-gray-400">
                      Unit Price
                    </span>

                    <div className="flex flex-row md:flex-col items-center gap-1 bg-gray-50 md:bg-white px-1">
                      <p className="text-[10px] sm:text-sm font-bold tracking-tight text-gray-700">
                        {Number(item.unit_price).toLocaleString()}
                      </p>
                      <p className="text-[7px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                        ETB
                      </p>
                    </div>
                  </div>
                </div>

                {/* ===================================================== */}
                {/* Total */}
                {/* ===================================================== */}
                <div className="sm:col-span-2 flex flex-row sm:flex-col items-center justify-between sm:justify-end mt-1 sm:mt-0">
                  <div className="flex flex-row sm:flex-col items-center gap-1 sm:gap-0 w-full sm:text-right">
                    <span className="text-[9px] sm:hidden font-bold uppercase tracking-wide text-gray-400">
                      Total
                    </span>

                    <div className="flex flex-row md:flex-col items-center gap-1 bg-gray-50 md:bg-white px-1">
                      <p className="text-[11px] sm:text-base font-black tracking-tight text-gray-900">
                        {Number(item.line_total).toLocaleString()}
                      </p>
                      <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                        ETB
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )}
  </motion.div>
));
VendorOrderCard.displayName = "VendorOrderCard";

// Premium Financial Overview Card (Aggregated)
const FinancialCard = memo(({ order }: { order: MasterOrder }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-[#5a448c] to-[#4a3a78] p-4 sm:p-6 shadow-lg w-full"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-white/70" />
          <p className="text-sm font-semibold text-white/90">Financial breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Total</p>
          <h3 className="text-lg sm:text-2xl font-black text-white">
            {Number(order.total_amount).toLocaleString()} <span className="text-[10px] sm:text-sm">ETB</span>
          </h3>
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3 pt-2 border-t border-white/10">
        <div className="flex justify-between text-[10px] sm:text-xs font-medium text-white/70">
          <span>Subtotal</span>
          <span>{Number(order.subtotal).toLocaleString()} ETB</span>
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs font-medium text-white/70">
          <span>Tax</span>
          <span>{Number(order.tax_total).toLocaleString()} ETB</span>
        </div>
        {/* Render each vendor order's delivery fee separately */}
        {order.vendor_orders?.map((vo) => (
          <div key={vo.id} className="flex justify-between text-[10px] sm:text-xs font-medium text-white/70 pl-2 sm:pl-3 border-l border-white/20">
            <span className="opacity-80 truncate max-w-[100px] sm:max-w-none">{vo.company?.name || "Vendor"} Delivery</span>
            <span className="flex-shrink-0">{Number(vo.delivery_fee || 0).toLocaleString()} ETB</span>
          </div>
        ))}
        {Number(order.delivery_fee) > 0 && (
          <div className="flex justify-between text-[10px] sm:text-xs font-bold text-white pt-1 border-t border-white/10">
            <span>Total Delivery Fee</span>
            <span>{Number(order.delivery_fee).toLocaleString()} ETB</span>
          </div>
        )}
      </div>
    </div>
    <Sparkles className="absolute bottom-3 right-3 h-6 w-6 text-white/10" />
  </motion.div>
));
FinancialCard.displayName = "FinancialCard";

// Timeline Activity
const TimelineCard = memo(({ order }: { order: MasterOrder }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm w-full"
  >
    <div className="flex items-center gap-2 mb-6">
      <Calendar className="h-4 w-4 text-secondary" />
      <h4 className="text-sm font-semibold text-gray-900">Timeline</h4>
    </div>
    <div className="space-y-6">
      <div className="relative flex gap-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/10" />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-200" />
          </div>
        </div>
        <div className="pb-4 flex-1">
          <p className="text-sm font-medium text-gray-800">Order created</p>
          <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
        </div>
      </div>
      <div className="relative flex gap-4">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/10" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">Last updated</p>
          <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.updated_at)}</p>
        </div>
      </div>
    </div>
  </motion.div>
));
TimelineCard.displayName = "TimelineCard";

// Customer Profile Card (simplified for master order)
const CustomerCard = memo(({ order }: { order: MasterOrder }) => {
  const customerName =
    order.recipient_name ||
    order.customer_username ||
    order.customer_name ||
    "Customer";
  const customerPhone = order.shipping_phone || order.customer_phone;

  return (
    <Card title="Customer Profile" icon={User}>
      <div className="flex flex-row items-start gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-white shadow-sm flex items-center justify-center text-secondary font-black text-lg sm:text-xl flex-shrink-0">
          {getInitials(customerName)}
        </div>
        <div className="space-y-1 text-start sm:text-left">
          <p className="font-black bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent break-words">
            {customerName}
          </p>
          {order.customer_username &&
            customerName.toLowerCase() !==
              order.customer_username.toLowerCase() && (
              <p className="text-xs text-gray-500 font-mono">
                @{order.customer_username}
              </p>
            )}
          {customerPhone ? (
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg w-full sm:w-fit border border-blue-200 shadow-sm">
              <PhoneCall className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-green-700 tracking-tight break-all">
                {customerPhone}
              </span>
              <CopyButton text={customerPhone} />
            </div>
          ) : (
            <span className="text-xs text-gray-400">No phone</span>
          )}
        </div>
      </div>
    </Card>
  );
});
CustomerCard.displayName = "CustomerCard";

// Shipping Card
const ShippingCard = memo(({ order }: { order: MasterOrder }) => (
  <Card title="Shipping Destination" icon={MapPin}>
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-secondary">
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 sm:min-w-[80px]">Recipient:</span>
        <span className="text-xs sm:text-sm font-bold text-secondary break-words">{order.recipient_name || order.customer_username || order.customer_name || "N/A"}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2 p-2 rounded-lg bg-blue-50/30 border-l-4 border-green-500">
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 sm:min-w-[80px]">Phone:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <PhoneCall className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 flex-shrink-0" />
          <span className="text-[10px] sm:text-sm font-mono font-bold text-green-700 break-all">{order.shipping_phone || "N/A"}</span>
          <CopyButton text={order.shipping_phone} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2 p-2 rounded-lg bg-purple-50/30 border-l-4 border-secondary">
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 sm:min-w-[80px]">Address:</span>
        <span className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">{formatAddress(order.shipping_address_text) || "N/A"}</span>
      </div>
    </div>
  </Card>
));
ShippingCard.displayName = "ShippingCard";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Focus trap hook
const useFocusTrap = (ref: React.RefObject<HTMLElement | null>, active: boolean) => {
  useEffect(() => {
    if (!active || !ref.current) return;
    const focusable = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [active, ref]);
};

// -----------------------------------------------------------------------------
// Main Modal Component
// -----------------------------------------------------------------------------
export function OrderDetailModal({
  order,
  onClose,
  onRefresh,
}: {
  order: MasterOrder | null;
  onClose: () => void;
  onRefresh?: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, !!order);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowTopShadow(scrollTop > 8);
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 8);
    };
    const el = scrollRef.current;
    el?.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [order]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
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
          ref={modalRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-[95%] sm:max-w-7xl max-h-[90vh] sm:max-h-[92vh] rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Premium Glass Header */}
          <div className="bg-secondary/20 backdrop-blur-md border-b border-secondary/10 px-3 sm:px-6 md:px-8 py-2 sm:py-4 md:py-5 sticky top-0 z-20 shadow-sm">
            {/* Top row: Icon on left, Buttons on right */}
            <div className="flex flex-row justify-between items-start gap-2">
              {/* Left side - Package Icon */}
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-gradient-to-br from-secondary to-secondary-light rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 ring-1 ring-white/20 flex-shrink-0">
                <Package className="text-white h-4 w-4 sm:h-6 sm:w-6 drop-shadow-sm" />
              </div>

              {/* Right side - Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {onRefresh && (
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
                    <span className="text-[8px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-secondary">
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </span>
                  </button>
                )}
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

            {/* Bottom row: Order details */}
            <div className="mt-1.5 sm:mt-4">
              <div className="flex flex-wrap items-center gap-1 sm:gap-3 mb-0.5 sm:mb-1">
                <h2 className="text-base sm:text-2xl font-black bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent tracking-tight break-words">
                  Order #{order.id}
                </h2>
                <span className={getStatusBadge(order.status)}>{order.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-4 text-[9px] sm:text-xs font-bold">
                <span className="flex items-center gap-1 sm:gap-2 bg-secondary/10 px-1.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full border border-secondary/20 shadow-sm">
                  <Calendar className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-secondary" />
                  <span className="font-mono text-[8px] sm:text-[12px] font-semibold text-gray-700 tracking-tight">
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    <span className="text-secondary mx-0.5">•</span>{" "}
                    {new Date(order.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                  <Building2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-gray-400" />
                  <span className="font-medium text-[9px] sm:text-sm">
                    {order.vendor_orders?.length || 0} {order.vendor_orders?.length === 1 ? "company" : "companies"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content Grid */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-gray-100"
          >
            {showTopShadow && (
              <div className="sticky top-0 h-8 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}
            <div className="p-3 sm:p-5 md:p-8">
              <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8">
                {/* Left Side: Customer & Shipping + Vendor Orders */}
                <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-6 md:space-y-8 min-w-0">
                  {/* Customer + Shipping (only for delivery) */}
                  {order.fulfillment_type === "delivery" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <CustomerCard order={order} />
                      <ShippingCard order={order} />
                    </div>
                  )}

                  {/* Vendor Orders Section */}
                  {order.vendor_orders && order.vendor_orders.length > 0 ? (
                    <div className="space-y-4 sm:space-y-6 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-secondary" />
                        <h4 className="text-base font-semibold text-gray-800">
                          Company orders ({order.vendor_orders.length})
                        </h4>
                      </div>
                <div className="col-span-12 lg:col-span-4 space-y-6">
                        {order.vendor_orders.map((vo) => (
                          <VendorOrderCard key={vo.id} vendorOrder={vo} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200"
                    >
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">
                        No vendor orders associated
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Right Side: Financial & Timeline */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <FinancialCard order={order} />
                  <TimelineCard order={order} />
                </div>
              </div>
            </div>
            {showBottomShadow && (
              <div className="sticky bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}