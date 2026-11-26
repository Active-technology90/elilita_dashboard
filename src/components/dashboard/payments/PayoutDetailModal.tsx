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
import { useTranslation } from "react-i18next";
import type { PayoutData } from "../../../utils/payoutReceipt";
import { getFullMediaUrl } from "../../../utils/payoutReceipt";
import { formatDateTime } from "../../../utils/dateFormatter";
import { formatCurrency } from "../../../utils/currency";

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
const { t, i18n } = useTranslation("payoutDetailModal");

  const [bankSlipPreview, setBankSlipPreview] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const isCompleted = payout.status === "completed";
  const isFailed = payout.status === "failed";
  const vo = payout.vendor_order_details;

  const isDirectSettled =
    payout.gateway === "arifpay" ||
    payout.gateway === "chapa" ||
    Boolean((payout as any)?.metadata?.split_settled) ||
    vo?.payment_method === "arifpay" ||
    vo?.payment_method === "chapa";

const scheduledDate = payout.scheduled_at
  ? formatDateTime(payout.scheduled_at, i18n.language)
  : t("common.notAvailable");

const paidDate = payout.paid_at
  ? formatDateTime(payout.paid_at, i18n.language)
  : t("status.pendingSettlement");

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
                    {t("header.title", { id: payout.id })}
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
                      ? isDirectSettled
                        ? t("status.directSettled")
                        : t("status.paidSettled")
                      : isFailed
                      ? t("status.failed")
                      : isDirectSettled
                      ? t("status.pendingPayout")
                      : t("status.pendingSettlement")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {t("header.vendorOrder", { id: payout.vendor_order })}
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
                  {t("financial.grossTotal")}
                </span>
              <span className="text-lg font-bold text-gray-900">
  {formatCurrency(payout.gross_amount || 0)}
</span>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                <span className="text-xs font-medium text-red-600 block mb-1">
                  {t("financial.platformCommission")}
                </span>
                <span className="text-lg font-bold text-red-600">
                   - {formatCurrency(payout.platform_fee || 0)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                <span className="text-xs font-medium text-secondary block mb-1">
                  {t("financial.netDisbursed")}
                </span>
                <span className="text-lg font-black text-secondary">
                 {formatCurrency(payout.net_amount || 0)}
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
                    {t("flow.disbursedBy")}
                  </span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {isDirectSettled
                      ? t("flow.directSplitSettlement", {
                          gateway: payout.gateway
                            ? payout.gateway.toUpperCase()
                            : "Direct",
                        })
                      : t("flow.directVendorSettlement")}
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
                    {t("flow.beneficiaryVendor")}
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
                  <span>{t("transfer.title")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("transfer.paymentChannel")}:</span>
                  <span className="font-medium text-gray-900">
                    {vo?.payment_method
                      ?.split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ") || t("transfer.electronic")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("transfer.scheduledDate")}:</span>
                  <span className="text-gray-800">{scheduledDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("transfer.paidAt")}:</span>
                  <span className="text-gray-800">{paidDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("transfer.reference")}:</span>
                  <span className="font-mono text-xs font-semibold text-secondary truncate max-w-[140px]">
                    {payout.reference || t("common.notAvailable")}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <User className="h-4 w-4 text-secondary" />
                  <span>{t("customer.title")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("customer.recipient")}:</span>
                  <span className="font-semibold text-gray-900">
                    {vo?.recipient_name || vo?.customer_name || t("customer.fallback")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("customer.phone")}:</span>
                  <span className="font-medium text-gray-900">
                    {vo?.shipping_phone || t("customer.notSpecified")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("customer.address")}:</span>
                  <span className="font-medium text-gray-800 truncate max-w-[150px]">
                    {vo?.shipping_address_text || t("customer.standardDelivery")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("customer.deliveryFee")}:</span>
                  <span className="text-gray-800">
               {formatCurrency(vo?.delivery_fee || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-secondary" />
                  <span>{t("items.title", { count: items.length })}</span>
                </h4>
                <span className="text-xs text-gray-400">
                  {t("items.orderLabel", { id: payout.vendor_order })}
                </span>
              </div>

              {items.length > 0 ? (
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">{t("items.columns.product")}</th>
                        <th className="px-4 py-2.5 text-center">{t("items.columns.qty")}</th>
                        <th className="px-4 py-2.5 text-right">{t("items.columns.unitPrice")}</th>
                        <th className="px-4 py-2.5 text-right">{t("items.columns.lineTotal")}</th>
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
                                    {it.title || t("items.fallbackItem")}
                                  </span>
                                  {it.sku && (
                                    <span className="text-[11px] text-gray-400 block">
                                      {t("items.sku")}: {it.sku}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center text-gray-600 font-medium">
                              {it.qty || 1}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-600">
                          {formatCurrency(it.unit_price || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                            {formatCurrency(it.line_total || it.subtotal || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs text-gray-500 text-center">
                  {t("items.emptyMessage", { id: payout.vendor_order })}
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
                        alt={t("bankSlip.imageAlt")}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">
                      {t("bankSlip.title")}
                    </h5>
                    <p className="text-[11px] text-gray-500">
                      {t("bankSlip.bankLabel")}: {customerReceipt.bank_name || t("bankSlip.fallbackBank")} • {t("bankSlip.amountLabel")}: ETB {Number(customerReceipt.amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {customerReceipt.receipt_image && (
                  <button
                    onClick={() => setBankSlipPreview(customerReceipt.receipt_image)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-secondary text-secondary text-xs font-semibold hover:bg-secondary/10 transition"
                  >
                    <span>{t("bankSlip.viewSlip")}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
            <span className="text-xs text-gray-500">
              {t("footer.payoutId", { id: payout.id })}
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
                <span>{t("footer.printReceipt")}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition"
              >
                {t("footer.close")}
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
              alt={t("bankSlip.receiptAlt")}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};