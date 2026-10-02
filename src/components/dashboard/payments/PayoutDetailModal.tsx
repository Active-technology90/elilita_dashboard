import React, { useState } from "react";
import {
  X,
  Printer,
  CreditCard,
  User,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Package,
} from "lucide-react";
import type { PayoutData } from "../../../utils/payoutReceipt";
import { getFullMediaUrl } from "../../../utils/payoutReceipt";

interface PayoutDetailModalProps {
  payout: PayoutData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt: (payout: PayoutData) => void;
}

export const PayoutDetailModal: React.FC<PayoutDetailModalProps> = ({
  payout,
  isOpen,
  onClose,
  onOpenReceipt,
}) => {
  const [bankSlipPreview, setBankSlipPreview] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const isCompleted = payout.status === "completed";
  const isFailed = payout.status === "failed";
  const vo = payout.vendor_order_details;

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

  const customerReceipt = vo?.receipt;
  const companyLogoUrl = getFullMediaUrl(payout.company_logo);
  const items = vo?.items || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    Payout Details #{payout.id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      isCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : isFailed
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isFailed ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {isCompleted
                      ? "Paid & Settled"
                      : isFailed
                      ? "Failed"
                      : "Pending Escrow"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Vendor Order #{payout.vendor_order}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Cards: Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-medium text-gray-500 block mb-1">
                  Gross Sales Total
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ETB {Number(payout.gross_amount || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                <span className="text-xs font-medium text-red-600 block mb-1">
                  Platform Commission
                </span>
                <span className="text-lg font-bold text-red-600">
                  - ETB {Number(payout.platform_fee || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                <span className="text-xs font-medium text-secondary block mb-1">
                  Net Disbursed
                </span>
                <span className="text-lg font-black text-secondary">
                  ETB {Number(payout.net_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payer and Beneficiary Flow Card */}
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/elilta1.jpg"
                  alt="Elilita"
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Disbursed By
                  </span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    Elilita Marketplace Escrow
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex w-7 h-7 rounded-full bg-secondary/10 items-center justify-center text-secondary">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>

              <div className="flex items-center gap-3">
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt={payout.company_name}
                    className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-secondary font-bold text-sm">
                    {payout.company_name.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Beneficiary Vendor
                  </span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {payout.company_name}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 block">
                    @{payout.company_slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Transfer & Verification Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Transfer Details */}
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <CreditCard className="h-4 w-4 text-secondary" />
                  <span>Transfer Information</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Channel:</span>
                  <span className="font-medium text-gray-900">
                    {vo?.payment_method
                      ?.split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ") || "Electronic"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Scheduled Date:</span>
                  <span className="text-gray-800">{scheduledDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid At:</span>
                  <span className="text-gray-800">{paidDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference:</span>
                  <span className="font-mono text-xs font-semibold text-secondary truncate max-w-[140px]">
                    {payout.reference || "N/A"}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <User className="h-4 w-4 text-secondary" />
                  <span>Customer &amp; Shipping</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipient:</span>
                  <span className="font-semibold text-gray-900">
                    {vo?.recipient_name || vo?.customer_name || "Customer"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium text-gray-900">
                    {vo?.shipping_phone || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-medium text-gray-800 truncate max-w-[150px]">
                    {vo?.shipping_address_text || "Standard Delivery"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Fee:</span>
                  <span className="text-gray-800">
                    ETB {Number(vo?.delivery_fee || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-secondary" />
                  <span>Order Items ({items.length})</span>
                </h4>
                <span className="text-xs text-gray-400">Order #{payout.vendor_order}</span>
              </div>

              {items.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Product / Item</th>
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
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              <div className="flex items-center gap-2.5">
                                {itemImg ? (
                                  <img
                                    src={itemImg}
                                    alt={it.title}
                                    className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                    <Package className="h-4 w-4" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold text-gray-900 block">
                                    {it.title || "Item"}
                                  </span>
                                  {it.sku && (
                                    <span className="text-[11px] text-gray-400 block">
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

            {/* Customer Bank Deposit Slip (if exists) */}
            {customerReceipt && (
              <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-secondary shrink-0 overflow-hidden">
                    {customerReceipt.receipt_image ? (
                      <img
                        src={customerReceipt.receipt_image}
                        alt="Customer Deposit Slip"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">
                      Customer Bank Transfer Slip
                    </h5>
                    <p className="text-[11px] text-gray-500">
                      Bank: {customerReceipt.bank_name || "Bank Deposit"} • Amount: ETB {Number(customerReceipt.amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {customerReceipt.receipt_image && (
                  <button
                    onClick={() => setBankSlipPreview(customerReceipt.receipt_image)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-secondary text-secondary text-xs font-semibold hover:bg-secondary/10 transition"
                  >
                    <span>View Slip</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
            <span className="text-xs text-gray-500">
              Payout ID: #{payout.id}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenReceipt(payout);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold shadow-sm hover:bg-secondary/90 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Payout Receipt</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for Bank Deposit Slip */}
      {bankSlipPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setBankSlipPreview(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setBankSlipPreview(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={bankSlipPreview}
              alt="Bank Transfer Receipt"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
