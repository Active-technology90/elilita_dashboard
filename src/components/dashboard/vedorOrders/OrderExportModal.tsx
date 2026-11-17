import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  X,
  Download,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type ExportPeriod,
  type OrderExportFilterOptions,
  filterOrdersForExport,
  downloadOrdersCsv,
  buildOrdersExportFilename,
  getDateRangeForPeriod,
} from "../../../utils/ordersExport";
import { CustomSelect } from "../../ui/CustomSelect";
import type { VendorOrder } from "../../../types";

interface OrderExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: VendorOrder[];
  companySlug: string | null;
  companyName: string;
  onSuccess: (message: string) => void;
}

export function OrderExportModal({
  isOpen,
  onClose,
  orders,
  companySlug,
  companyName,
  onSuccess,
}: OrderExportModalProps) {
  const { t } = useTranslation("companyOrders");

  const [period, setPeriod] = useState<ExportPeriod>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Translation-driven option lists
  const PERIOD_OPTIONS = useMemo(
    () => [
      { value: "daily", label: t("companyOrders.export.period.daily") },
      { value: "weekly", label: t("companyOrders.export.period.weekly") },
      { value: "monthly", label: t("companyOrders.export.period.monthly") },
      { value: "yearly", label: t("companyOrders.export.period.yearly") },
      { value: "custom", label: t("companyOrders.export.period.custom") },
      { value: "all", label: t("companyOrders.export.period.all") },
    ],
    [t],
  );

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "", label: t("companyOrders.export.status.all") },
      { value: "pending", label: t("companyOrders.export.status.pending") },
      { value: "contacted", label: t("companyOrders.export.status.contacted") },
      { value: "processing", label: t("companyOrders.export.status.processing") },
      { value: "fulfilled", label: t("companyOrders.export.status.fulfilled") },
      { value: "shipped", label: t("companyOrders.export.status.shipped") },
      {
        value: "payment_rejected",
        label: t("companyOrders.export.status.paymentRejected"),
      },
      { value: "cancelled", label: t("companyOrders.export.status.cancelled") },
    ],
    [t],
  );

  const PAYMENT_OPTIONS = useMemo(
    () => [
      { value: "", label: t("companyOrders.export.payment.all") },
      {
        value: "bank_transfer",
        label: t("companyOrders.export.payment.bankTransfer"),
      },
      { value: "chapa", label: t("companyOrders.export.payment.chapa") },
      { value: "cod", label: t("companyOrders.export.payment.cod") },
      { value: "telebirr", label: t("companyOrders.export.payment.telebirr") },
      { value: "arifpay", label: t("companyOrders.export.payment.arifpay") },
    ],
    [t],
  );

  // Reset transient state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsExporting(false);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Escape key to close + focus management
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isExporting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [isOpen, isExporting, onClose]);

  // Trap focus inside the dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const preview = useMemo(() => {
    const options: OrderExportFilterOptions = {
      period,
      customStartDate: customStart,
      customEndDate: customEnd,
      orderStatusFilter: orderStatusFilter || undefined,
      paymentMethodFilter: paymentMethodFilter || undefined,
    };
    return filterOrdersForExport(orders, options);
  }, [
    orders,
    period,
    customStart,
    customEnd,
    orderStatusFilter,
    paymentMethodFilter,
  ]);

  const dateRange = getDateRangeForPeriod(period, customStart, customEnd);
  const isCustomInvalid = period === "custom" && (!customStart || !customEnd);
  const isCustomDateRangeInverted =
    period === "custom" &&
    customStart &&
    customEnd &&
    new Date(customStart) > new Date(customEnd);
  const canExport =
    !isCustomInvalid &&
    !isCustomDateRangeInverted &&
    preview.records.length > 0 &&
    !isExporting;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (orderStatusFilter) count++;
    if (paymentMethodFilter) count++;
    if (period === "custom" && customStart && customEnd) count++;
    return count;
  }, [orderStatusFilter, paymentMethodFilter, period, customStart, customEnd]);

  const resetFilters = useCallback(() => {
    setPeriod("monthly");
    setCustomStart("");
    setCustomEnd("");
    setOrderStatusFilter("");
    setPaymentMethodFilter("");
    setError(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!canExport) return;
    setIsExporting(true);
    setError(null);
    try {
      const filename = buildOrdersExportFilename(period, companySlug, dateRange);
      downloadOrdersCsv(preview, filename, companyName || "All Companies");
      onSuccess(
        t("companyOrders.export.successMessage", {
          count: preview.records.length,
          period: preview.periodLabel,
        }),
      );
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      setError(t("companyOrders.export.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  }, [
    canExport,
    period,
    companySlug,
    dateRange,
    preview,
    companyName,
    onSuccess,
    onClose,
    t,
  ]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      aria-describedby="export-modal-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={() => !isExporting && onClose()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-[slideUp_200ms_ease-out] sm:animate-[fadeInScale_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex-none bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sm:rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="export-modal-title"
                className="text-base font-extrabold text-secondary truncate"
              >
                {t("companyOrders.export.title")}
              </h3>
              <p id="export-modal-desc" className="text-xs text-gray-500 truncate">
                {t("companyOrders.export.description", {
                  company: companyName || t("companyOrders.export.allCompanies"),
                })}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            disabled={isExporting}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
            aria-label={t("companyOrders.export.closeDialog")}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Period */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="export-period"
                className="block text-xs font-bold text-gray-500"
              >
                {t("companyOrders.export.periodLabel")}
              </label>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-secondary hover:underline"
                >
                  {t("companyOrders.export.reset")}
                </button>
              )}
            </div>
            <CustomSelect
              value={period}
              onChange={(val) => {
                setPeriod(val as ExportPeriod);
                setError(null);
              }}
              options={PERIOD_OPTIONS}
              placeholder={t("companyOrders.export.periodPlaceholder")}
            />
          </section>

          {/* Custom range */}
          {period === "custom" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="custom-start"
                  className="block text-xs font-bold text-gray-500 mb-1.5"
                >
                  {t("companyOrders.export.startDate")}
                </label>
                <input
                  id="custom-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setError(null);
                  }}
                  max={customEnd || undefined}
                  className="h-10 w-full rounded-xl border border-secondary/15 bg-white px-3 text-sm text-secondary outline-none focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
                />
              </div>
              <div>
                <label
                  htmlFor="custom-end"
                  className="block text-xs font-bold text-gray-500 mb-1.5"
                >
                  {t("companyOrders.export.endDate")}
                </label>
                <input
                  id="custom-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setError(null);
                  }}
                  min={customStart || undefined}
                  className="h-10 w-full rounded-xl border border-secondary/15 bg-white px-3 text-sm text-secondary outline-none focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
                />
              </div>
            </section>
          )}

          {/* Inline validation */}
          {(isCustomInvalid || isCustomDateRangeInverted) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3"
            >
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                {isCustomDateRangeInverted
                  ? t("companyOrders.export.dateRangeInverted")
                  : t("companyOrders.export.dateRangeIncomplete")}
              </p>
            </div>
          )}

          {/* Filters */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="export-status"
                className="block text-xs font-bold text-gray-500 mb-1.5"
              >
                {t("companyOrders.export.orderStatus")}{" "}
                <span className="text-gray-400 font-normal">
                  ({t("companyOrders.export.optional")})
                </span>
              </label>
              <CustomSelect
                value={orderStatusFilter}
                onChange={(v) => {
                  setOrderStatusFilter(v);
                  setError(null);
                }}
                options={STATUS_OPTIONS}
                placeholder={t("companyOrders.export.status.all")}
              />
            </div>
            <div>
              <label
                htmlFor="export-payment"
                className="block text-xs font-bold text-gray-500 mb-1.5"
              >
                {t("companyOrders.export.paymentMethod")}{" "}
                <span className="text-gray-400 font-normal">
                  ({t("companyOrders.export.optional")})
                </span>
              </label>
              <CustomSelect
                value={paymentMethodFilter}
                onChange={(v) => {
                  setPaymentMethodFilter(v);
                  setError(null);
                }}
                options={PAYMENT_OPTIONS}
                placeholder={t("companyOrders.export.payment.all")}
              />
            </div>
          </section>

          {/* Summary card */}
          <section className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/60 border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-xs font-bold text-secondary">
                {preview.periodLabel}
              </span>
              {activeFilterCount > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-white px-2 py-0.5 rounded-full border border-secondary/10">
                  <Filter className="h-3 w-3" />
                  {t("companyOrders.export.filterCount", {
                    count: activeFilterCount,
                  })}
                </span>
              )}
            </div>

            {preview.records.length === 0 ? (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{t("companyOrders.export.noOrders")}</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label={t("companyOrders.export.stats.records")}
                    value={preview.summary.totalRecords}
                    className="text-gray-900"
                  />
                  <Stat
                    label={t("companyOrders.export.stats.delivered")}
                    value={preview.summary.deliveredCount}
                    className="text-emerald-600"
                  />
                  <Stat
                    label={t("companyOrders.export.stats.totalAmount")}
                    value={`ETB ${preview.summary.totalAmount.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 },
                    )}`}
                    className="text-gray-900"
                  />
                  <Stat
                    label={t("companyOrders.export.stats.pending")}
                    value={preview.summary.pendingCount}
                    className="text-amber-600"
                  />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-1.5 text-[11px] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("companyOrders.export.readyToExport")}
                </div>
              </>
            )}
          </section>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3"
            >
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center gap-3 sm:rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            {t("companyOrders.export.cancel")}
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 active:bg-secondary/95 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("companyOrders.export.exporting")}
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {t("companyOrders.export.exportButton", {
                  count: preview.records.length || 0,
                })}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Keyframes for micro-animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  );
}

// Small presentational helper
function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div>
      <span className="text-gray-500 block">{label}</span>
      <span className={`font-bold ${className}`}>{value}</span>
    </div>
  );
}