import { useState, useMemo } from "react";
import {
  X,
  Download,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily (Today)" },
  { value: "weekly", label: "Weekly (Last 7 Days)" },
  { value: "monthly", label: "Monthly (This Month)" },
  { value: "yearly", label: "Yearly (This Year)" },
  { value: "custom", label: "Custom Date Range" },
  { value: "all", label: "All Time" },
];

export function PayoutExportModal({
  isOpen,
  onClose,
  payouts,
  companySlug,
  companyName,
  onSuccess,
}: PayoutExportModalProps) {
  const [period, setPeriod] = useState<ExportPeriod>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

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
        `Exported ${preview.records.length} payout record${
          preview.records.length === 1 ? "" : "s"
        } (${preview.periodLabel})`
      );
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      onSuccess("Failed to export payouts. Please try again.");
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
                Export Payouts
              </h3>
              <p className="text-xs text-gray-500">
                Download {companyName ? companyName : "all companies"} as CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Period */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
              Export Period
            </label>
            <CustomSelect
              value={period}
              onChange={(val) => setPeriod(val as ExportPeriod)}
              options={PERIOD_OPTIONS}
              placeholder="Select period"
            />
          </div>

          {/* Custom Range */}
          {period === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Start Date
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
                  End Date
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
                Please select both start and end dates for custom range.
              </p>
            </div>
          )}

          {/* Optional filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                Status (optional)
              </label>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "processing", label: "Processing" },
                  { value: "completed", label: "Completed" },
                  { value: "failed", label: "Failed" },
                ]}
                placeholder="All statuses"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                Method (optional)
              </label>
              <CustomSelect
                value={methodFilter}
                onChange={setMethodFilter}
                options={[
                 { value: "", label: "All Payment Method" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "chapa", label: "Chapa" },
    { value: "cod", label: "Cash on Delivery" },
    { value: "telebirr", label: "Telebirr" },
    { value: "arifpay", label: "ArifPay (Direct)" },
                ]}
                placeholder="All methods"
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
                <span>No payouts found for the selected period.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Records</span>
                    <span className="font-bold text-gray-900">
                      {preview.summary.totalRecords}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Completed</span>
                    <span className="font-bold text-emerald-600">
                      {preview.summary.completedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Net Disbursed</span>
                    <span className="font-bold text-gray-900">
                      ETB{" "}
                      {preview.summary.netDisbursed.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Platform Fees</span>
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
                  Ready to export
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
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {isExporting
              ? "Exporting..."
              : `Export ${preview.records.length || 0} record${
                  preview.records.length === 1 ? "" : "s"
                }`}
          </button>
        </div>
      </div>
    </div>
  );
}