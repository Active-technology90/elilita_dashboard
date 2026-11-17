import { useState, useMemo } from "react";
import {
  X,
  Download,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "../ui/CustomSelect";
import type { PayoutData } from "../../utils/payoutReceipt";
import {
  type ExportPeriod,
  type ExportFilterOptions,
  filterPayoutsForExport,
  downloadPeriodPayoutCsv,
  buildExportFilename,
  getDateRangeForPeriod,
} from "../../utils/payoutExport";

interface PayoutExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payouts: PayoutData[];
  companySlug: string | null;
  companyName: string;
  onSuccess: (message: string) => void;
}

export function PayoutExportModal({
  isOpen,
  onClose,
  payouts,
  companySlug,
  companyName,
  onSuccess,
}: PayoutExportModalProps) {
  const { t } = useTranslation("payoutExportModal");

  const [period, setPeriod] = useState<ExportPeriod>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Translation-driven option list
  const PERIOD_OPTIONS = useMemo(
    () => [
      { value: "daily", label: t("period.daily") },
      { value: "weekly", label: t("period.weekly") },
      { value: "monthly", label: t("period.monthly") },
      { value: "yearly", label: t("period.yearly") },
      { value: "custom", label: t("period.custom") },
      { value: "all", label: t("period.all") },
    ],
    [t],
  );

  const preview = useMemo(() => {
    const options: ExportFilterOptions = {
      period,
      customStartDate: customStart,
      customEndDate: customEnd,
      statusFilter: statusFilter || undefined,
      methodFilter: methodFilter || undefined,
    };
    return filterPayoutsForExport(payouts, options);
  }, [payouts, period, customStart, customEnd, statusFilter, methodFilter]);

  const dateRange = getDateRangeForPeriod(period, customStart, customEnd);
  const isCustomInvalid = period === "custom" && (!customStart || !customEnd);
  const canExport = !isCustomInvalid && preview.records.length > 0 && !isExporting;

  const handleExport = () => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      const filename = buildExportFilename(period, companySlug, dateRange);
      downloadPeriodPayoutCsv(preview, filename);
      onSuccess(
        t("successMessage", {
          count: preview.records.length,
          period: preview.periodLabel,
        }),
      );
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      onSuccess(t("exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-secondary">
                {t("title")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("subtitle", {
                  company: companyName ? companyName : t("allCompanies"),
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label={t("close")}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Period */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              {t("exportPeriod")}
            </label>
            <CustomSelect
              value={period}
              onChange={(val) => setPeriod(val as ExportPeriod)}
              options={PERIOD_OPTIONS}
              placeholder={t("selectPeriod")}
            />
          </div>

          {/* Custom Range */}
          {period === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  {t("startDate")}
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd || undefined}
                  className="h-10 w-full rounded-xl border border-secondary/15 bg-white px-3 text-sm text-secondary outline-none focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  {t("endDate")}
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart || undefined}
                  className="h-10 w-full rounded-xl border border-secondary/15 bg-white px-3 text-sm text-secondary outline-none focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
                />
              </div>
            </div>
          )}

          {isCustomInvalid && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                {t("customRangeWarning")}
              </p>
            </div>
          )}

          {/* Optional filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                {t("statusLabel")}
              </label>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "", label: t("status.all") },
                  { value: "pending", label: t("status.pending") },
                  { value: "processing", label: t("status.processing") },
                  { value: "completed", label: t("status.completed") },
                  { value: "failed", label: t("status.failed") },
                ]}
                placeholder={t("status.all")}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                {t("methodLabel")}
              </label>
              <CustomSelect
                value={methodFilter}
                onChange={setMethodFilter}
                options={[
                  { value: "", label: t("method.all") },
                  { value: "bank_transfer", label: t("method.bankTransfer") },
                  { value: "chapa", label: t("method.chapa") },
                  { value: "cod", label: t("method.cod") },
                  { value: "telebirr", label: t("method.telebirr") },
                  { value: "arifpay", label: t("method.arifpay") },
                ]}
                placeholder={t("method.allMethods")}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-xs font-bold text-secondary">
                {preview.periodLabel}
              </span>
            </div>

            {preview.records.length === 0 ? (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{t("noPayouts")}</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">{t("stats.records")}</span>
                    <span className="font-bold text-gray-900">
                      {preview.summary.totalRecords}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t("stats.completed")}</span>
                    <span className="font-bold text-emerald-600">
                      {preview.summary.completedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t("stats.netDisbursed")}</span>
                    <span className="font-bold text-gray-900">
                      ETB{" "}
                      {preview.summary.netDisbursed.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t("stats.platformFees")}</span>
                    <span className="font-bold text-secondary">
                      ETB{" "}
                      {preview.summary.platformFees.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-1.5 text-[11px] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("readyToExport")}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {isExporting
              ? t("exporting")
              : t("exportButton", { count: preview.records.length || 0 })}
          </button>
        </div>
      </div>
    </div>
  );
}