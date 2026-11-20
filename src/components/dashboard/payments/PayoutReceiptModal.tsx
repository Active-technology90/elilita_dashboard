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
  Loader2,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PayoutData } from "../../../utils/payoutReceipt";
import {
  printPayoutReceipt,
  getFullMediaUrl,
  getPaymentMethodLabel,
  getStatusLabel,
} from "../../../utils/payoutReceipt";

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
  const { t, i18n } = useTranslation("payoutReceiptModal");

  // Derive locale from active i18n language so dates/numbers format correctly
  const locale =
    i18n.language === "am" ? "am-ET" : i18n.language || "en-US";

  if (!isOpen || !payout) return null;

  const handlePrint = () => {
    // Pass translator + locale so the printed receipt is localized
    printPayoutReceipt(payout, t, locale);
  };

  const isCompleted = payout.status === "completed";
  const isFailed = payout.status === "failed";
  const isProcessing = payout.status === "processing";

  // Shared helpers keep modal + printed receipt identical
  const paymentMethod = getPaymentMethodLabel(
    payout.vendor_order_details?.payment_method,
    locale.startsWith("am") ? "am" : "en",
    t
  );
  const statusLabel = getStatusLabel(payout.status, t);

  // ✅ toLocaleString (not toLocaleDateString) when including time
  const scheduledDate = payout.scheduled_at
    ? new Date(payout.scheduled_at).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : t("common.notAvailable");

  const paidDate = payout.paid_at
    ? new Date(payout.paid_at).toLocaleString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : t("status.pendingSettlement");

  const vo = payout.vendor_order_details;
  const items = Array.isArray(vo?.items) ? vo!.items : [];

  const formatAmount = (v: string | number | null | undefined) =>
    Number(v || 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
                {t("header.title", { id: payout.id })}
              </h3>
              <p className="text-[11px] text-gray-500">
                {t("header.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary text-white text-xs font-semibold shadow-sm hover:bg-secondary/90 transition"
              title={t("header.printTitle")}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{t("header.printButton")}</span>
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
                  {t("brand.name")}
                </span>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  {t("brand.receiptTitle")}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("brand.receiptSubtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <div className="text-sm font-mono font-bold text-gray-900">
                  {t("header.receiptNumber", { id: payout.id })}
                </div>
                <div className="text-xs text-secondary font-semibold">
                  {t("header.orderRef", { id: payout.vendor_order })}
                </div>
              </div>

              {/* Status Stamp */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${
                  isCompleted
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isFailed
                    ? "bg-red-50 text-red-700 border-red-200"
                    : isProcessing
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isFailed ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock className="h-3.5 w-3.5" />
                )}
                <span>{statusLabel}</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-2">
                <CreditCard className="h-3.5 w-3.5 text-secondary" />
                <span>{t("metadata.settlementTitle")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t("metadata.paymentChannel")}:
                </span>
                <span className="font-semibold text-gray-900">
                  {paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t("metadata.scheduledDate")}:
                </span>
                <span className="text-gray-800">{scheduledDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t("metadata.settledAt")}:
                </span>
                <span className="text-gray-800">{paidDate}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-gray-400 uppercase tracking-wider text-[11px] mb-2">
                <Building2 className="h-3.5 w-3.5 text-secondary" />
                <span>{t("metadata.verificationTitle")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t("metadata.referenceId")}:
                </span>
                <span className="font-mono font-semibold text-secondary truncate max-w-[140px]">
                  {payout.reference || t("common.notAvailable")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("metadata.orderId")}:</span>
                <span className="font-semibold text-gray-900">
                  #{payout.vendor_order}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("metadata.customer")}:</span>
                <span className="text-gray-800 truncate max-w-[140px]">
                  {vo?.recipient_name ||
                    vo?.customer_name ||
                    t("common.customer")}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-secondary" />
                <span>{t("items.title", { count: items.length })}</span>
              </h4>
              <span className="text-xs text-gray-400">
                {t("items.orderLabel", { id: payout.vendor_order })}
              </span>
            </div>

            {items.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">
                        {t("items.columns.item")}
                      </th>
                      <th className="px-4 py-2.5 text-center">
                        {t("items.columns.qty")}
                      </th>
                      <th className="px-4 py-2.5 text-right">
                        {t("items.columns.unitPrice")}
                      </th>
                      <th className="px-4 py-2.5 text-right">
                        {t("items.columns.lineTotal")}
                      </th>
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
                                  {it.title || t("items.fallbackItem")}
                                </span>
                                {it.sku && (
                                  <span className="text-[10px] text-gray-400 block">
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
                            ETB {formatAmount(it.unit_price || 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                            ETB{" "}
                            {formatAmount(
                              it.line_total || it.subtotal || 0
                            )}
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

          {/* Financial Calculation Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t("calculation.title")}
            </h4>
            <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 bg-white">
              <div className="flex justify-between items-center px-4 py-3 text-xs sm:text-sm">
                <span className="text-gray-600 font-medium">
                  {t("calculation.grossTotal", { id: payout.vendor_order })}
                </span>
                <span className="font-semibold text-gray-900">
                  ETB {formatAmount(payout.gross_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 text-xs sm:text-sm bg-red-50/40">
                <span className="text-red-700 font-medium">
                  {t("calculation.platformCommission")}
                </span>
                <span className="font-semibold text-red-600">
                  - ETB {formatAmount(payout.platform_fee)}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3.5 bg-secondary/5">
                <div>
                  <span className="text-sm font-bold text-gray-900 block">
                    {t("calculation.netPayout")}
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    {t("calculation.netPayoutSubtitle", {
                      method: paymentMethod,
                    })}
                  </span>
                </div>
                <span className="text-xl font-black text-secondary">
                  ETB {formatAmount(payout.net_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer certification */}
          <div className="pt-3 text-center border-t border-gray-100">
            <p className="text-[11px] text-gray-400">
              {t("footer.certification")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};