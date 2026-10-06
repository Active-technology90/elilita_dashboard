import React from "react";
import {
  X,
  Printer,
  Building2,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Package,
} from "lucide-react";
import type { PayoutData } from "../../../utils/payoutReceipt";
import { printPayoutReceipt, getFullMediaUrl } from "../../../utils/payoutReceipt";

interface PayoutReceiptModalProps {
  payout: PayoutData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayoutReceiptModal: React.FC<PayoutReceiptModalProps> = ({
  payout,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !payout) return null;

  const handlePrint = () => {
    printPayoutReceipt(payout);
  };

  const isCompleted = payout.status === "completed";
  const isFailed = payout.status === "failed";

  const scheduledDate = payout.scheduled_at
    ? new Date(payout.scheduled_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const paidDate = payout.paid_at
    ? new Date(payout.paid_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Pending Settlement";

  const vo = payout.vendor_order_details;
  const paymentMethod =
    vo?.payment_method
      ?.split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") ||
    (payout.gateway
      ? payout.gateway.charAt(0).toUpperCase() + payout.gateway.slice(1)
      : "Electronic Transfer");

  const items = vo?.items || [];
  const companyLogoUrl = getFullMediaUrl(payout.company_logo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Payout Receipt #{payout.id}
              </h3>
              <p className="text-[11px] text-gray-500">
                Official Vendor Disbursement Statement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary text-white text-xs font-semibold shadow-sm hover:bg-secondary/90 transition"
              title="Print or Save PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header with Elilita Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-secondary/20 gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/elilta1.jpg"
                alt="Elilita"
                className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary">
                  Elilita Super App
                </span>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Payout Receipt
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vendor Settlement &amp; Escrow Disbursement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <div className="text-sm font-mono font-bold text-gray-900">
                  #RECEIPT-{payout.id}
                </div>
                <div className="text-xs text-secondary font-semibold">
                  Order Ref: #{payout.vendor_order}
                </div>
              </div>

              {/* Status Stamp */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isFailed
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isFailed ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span>
                  {isCompleted
                    ? "Paid & Settled"
                    : isFailed
                    ? "Failed"
                    : "Pending Escrow"}
                </span>
              </div>
            </div>
          </div>

          {/* Parties Flow: Elilita -> Vendor */}
          <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Payer */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src="/elilta1.jpg"
                alt="Elilita"
                className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Disbursed By
                </span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm truncate block">
                  Elilita Marketplace
                </span>
                <span className="text-[11px] text-gray-500 block truncate">
                  Platform Escrow Account
                </span>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-secondary/10 items-center justify-center text-secondary shrink-0">
              <ArrowRight className="h-4 w-4" />
            </div>

            {/* Beneficiary Vendor */}
            <div className="flex items-center gap-3 flex-1 min-w-0 sm:justify-end sm:text-right">
              <div className="min-w-0 order-2 sm:order-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Beneficiary Vendor
                </span>
                <span className="font-bold text-gray-900 text-xs sm:text-sm truncate block">
                  {payout.company_name}
                </span>
                <span className="text-[11px] font-mono text-gray-500 block truncate">
                  @{payout.company_slug}
                </span>
              </div>

              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={payout.company_name}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0 order-1 sm:order-2"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-secondary shrink-0 order-1 sm:order-2 font-bold text-sm">
                  {payout.company_name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-2">
                <CreditCard className="h-3.5 w-3.5 text-secondary" />
                <span>Settlement Metadata</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Channel:</span>
                <span className="font-semibold text-gray-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled Date:</span>
                <span className="text-gray-800">{scheduledDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Settled At:</span>
                <span className="text-gray-800">{paidDate}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-2">
                <Building2 className="h-3.5 w-3.5 text-secondary" />
                <span>Verification Details</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference ID:</span>
                <span className="font-mono font-semibold text-secondary truncate max-w-[140px]">
                  {payout.reference || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-semibold text-gray-900">
                  #{payout.vendor_order}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="text-gray-800 truncate max-w-[140px]">
                  {vo?.recipient_name || vo?.customer_name || "Customer"}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-secondary" />
                <span>Order Items ({items.length})</span>
              </h4>
              <span className="text-xs text-gray-400">Order #{payout.vendor_order}</span>
            </div>

            {items.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((it, idx) => {
                      const itemImg = getFullMediaUrl(it.product_image);
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              {itemImg ? (
                                <img
                                  src={itemImg}
                                  alt={it.title}
                                  className="w-7 h-7 rounded-lg object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                  <Package className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-900 block">
                                  {it.title || "Order Item"}
                                </span>
                                {it.sku && (
                                  <span className="text-[10px] text-gray-400 block">
                                    SKU: {it.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-600 font-medium">
                            {it.qty || 1}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            ETB {Number(it.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                            ETB {Number(it.line_total || it.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs text-gray-500 text-center">
                Order items summarized under Vendor Order #{payout.vendor_order}.
              </div>
            )}
          </div>

          {/* Financial Calculation Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Settlement Calculation Breakdown
            </h4>
            <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 bg-white">
              <div className="flex justify-between items-center px-4 py-3 text-xs sm:text-sm">
                <span className="text-gray-600 font-medium">
                  Gross Sales Total (Order #{payout.vendor_order})
                </span>
                <span className="font-semibold text-gray-900">
                  ETB {Number(payout.gross_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 text-xs sm:text-sm bg-red-50/40">
                <span className="text-red-700 font-medium">
                  Platform Commission Fee (Deduction)
                </span>
                <span className="font-semibold text-red-600">
                  - ETB {Number(payout.platform_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3.5 bg-secondary/5">
                <div>
                  <span className="text-sm font-bold text-gray-900 block">
                    Net Payout to Vendor
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    Disbursed to vendor account via {paymentMethod}
                  </span>
                </div>
                <span className="text-xl font-black text-secondary">
                  ETB {Number(payout.net_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer certification */}
          <div className="pt-3 text-center border-t border-gray-100">
            <p className="text-[11px] text-gray-400">
              Official digital payout receipt verified and disbursed by Elilita Super App.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
