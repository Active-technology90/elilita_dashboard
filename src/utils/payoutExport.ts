import type { PayoutData } from "./payoutReceipt";

export type ExportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom" | "all";

export interface ExportFilterOptions {
  period: ExportPeriod;
  customStartDate?: string;
  customEndDate?: string;
  statusFilter?: string;
  methodFilter?: string;
  searchTerm?: string;
}

export interface ExportResult {
  records: PayoutData[];
  periodLabel: string;
  dateRange: { start: Date; end: Date } | null;
  summary: {
    totalRecords: number;
    netDisbursed: number;
    platformFees: number;
    pendingSettlement: number;
    completedCount: number;
  };
}

export function getDateRangeForPeriod(
  period: ExportPeriod,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } | null {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "daily":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
        end: endOfToday,
      };
    case "weekly": {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end: endOfToday };
    }
    case "monthly":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        end: endOfToday,
      };
    case "yearly":
      return {
        start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        end: endOfToday,
      };
    case "custom": {
      if (!customStart || !customEnd) return null;
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "all":
    default:
      return null;
  }
}

export function getPeriodLabel(
  period: ExportPeriod,
  dateRange: { start: Date; end: Date } | null
): string {
  if (!dateRange) return "All Time";

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  switch (period) {
    case "daily":
      return `Daily — ${fmt(dateRange.start)}`;
    case "weekly":
      return `Weekly — ${fmt(dateRange.start)} to ${fmt(dateRange.end)}`;
    case "monthly":
      return `Monthly — ${dateRange.start.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}`;
    case "yearly":
      return `Yearly — ${dateRange.start.getFullYear()}`;
    case "custom":
      return `Custom — ${fmt(dateRange.start)} to ${fmt(dateRange.end)}`;
    default:
      return "All Time";
  }
}

export function filterPayoutsForExport(
  payouts: PayoutData[],
  options: ExportFilterOptions
): ExportResult {
  const dateRange = getDateRangeForPeriod(
    options.period,
    options.customStartDate,
    options.customEndDate
  );

  let filtered = payouts;

  if (dateRange) {
    filtered = filtered.filter((p) => {
      const d = new Date(p.scheduled_at);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }

  if (options.statusFilter) {
    filtered = filtered.filter((p) => p.status === options.statusFilter);
  }

  if (options.methodFilter) {
    filtered = filtered.filter((p) => {
      const pm = (
        p.vendor_order_details?.payment_method ||
        p.gateway ||
        ""
      ).toLowerCase();
      return pm.includes(options.methodFilter!.toLowerCase());
    });
  }

  if (options.searchTerm?.trim()) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.vendor_order.toString().includes(term) ||
        (p.company_name || "").toLowerCase().includes(term) ||
        (p.status || "").toLowerCase().includes(term) ||
        (p.reference || "").toLowerCase().includes(term)
    );
  }

  let netDisbursed = 0;
  let platformFees = 0;
  let pendingSettlement = 0;
  let completedCount = 0;

  filtered.forEach((p) => {
    const net = Number(p.net_amount) || 0;
    const fee = Number(p.platform_fee) || 0;
    platformFees += fee;

    if (p.status === "completed") {
      netDisbursed += net;
      completedCount++;
    } else if (p.status === "pending" || p.status === "processing") {
      pendingSettlement += net;
    }
  });

  return {
    records: filtered,
    periodLabel: getPeriodLabel(options.period, dateRange),
    dateRange,
    summary: {
      totalRecords: filtered.length,
      netDisbursed,
      platformFees,
      pendingSettlement,
      completedCount,
    },
  };
}

export function buildExportFilename(
  period: ExportPeriod,
  companySlug: string | null,
  dateRange: { start: Date; end: Date } | null
): string {
  const today = new Date().toISOString().split("T")[0];
  const slug = companySlug || "all-companies";

  if (!dateRange) return `payouts_${slug}_all-time_${today}.xls`;

  const start = dateRange.start.toISOString().split("T")[0];
  const end = dateRange.end.toISOString().split("T")[0];

  if (period === "daily") return `payouts_${slug}_daily_${start}.xls`;
  if (period === "monthly") return `payouts_${slug}_monthly_${start.slice(0, 7)}.xls`;
  if (period === "yearly") return `payouts_${slug}_yearly_${start.slice(0, 4)}.xls`;
  return `payouts_${slug}_${period}_${start}_to_${end}.xls`;
}

function escapeHtml(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates an elegant, production-ready Excel spreadsheet (XLS) file
 * that auto-fits columns and eliminates UI glitches.
 */
export function downloadPeriodPayoutCsv(
  result: ExportResult,
  filename: string
): void {
  const { records, periodLabel, dateRange, summary } = result;

  // Generate the rows
  const rowsHtml = records
    .map((p) => {
      // Amounts
      const gross = Number(p.gross_amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      });
      const fee = Number(p.platform_fee || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      });
      const net = Number(p.net_amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      });

      // Dates
      const scheduledDate = p.scheduled_at
        ? new Date(p.scheduled_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "—";

      const paidDate = p.paid_at
        ? new Date(p.paid_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "Pending";

      // Payment Method
      const pm = (p.vendor_order_details?.payment_method || p.gateway || "N/A")
        .split("_")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return `
        <tr>
          <td style="mso-number-format:'\\@'; text-align: center; font-weight: bold;">#${escapeHtml(p.vendor_order)}</td>
          <td>${escapeHtml(p.company_name || "—")}</td>
          <td style="text-align: right;">${gross}</td>
          <td style="text-align: right; color: #dc2626;">-${fee}</td>
          <td style="text-align: right; font-weight: bold; color: #111827;">${net}</td>
          <td style="text-transform: capitalize;">${escapeHtml(p.status)}</td>
          <td>${escapeHtml(pm)}</td>
          <td style="mso-number-format:'\\@';">${escapeHtml(scheduledDate)}</td>
          <td style="mso-number-format:'\\@';">${escapeHtml(paidDate)}</td>
          <td>${escapeHtml(p.reference || "—")}</td>
        </tr>
      `;
    })
    .join("");

  const dateRangeText = dateRange
    ? `${dateRange.start.toLocaleDateString("en-US")} – ${dateRange.end.toLocaleDateString("en-US")}`
    : "All Time";

  // Create an HTML table that Excel natively reads as a beautifully styled sheet
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Payouts Export</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; }
        th { background-color: #6750A4; color: #ffffff; padding: 10px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; }
        td { padding: 8px 10px; border: 1px solid #e5e7eb; color: #333333; }
        .meta-label { font-weight: bold; color: #6750A4; }
        .meta-val { color: #4b5563; }
        .title { font-size: 18px; font-weight: bold; color: #111827; }
        tr:nth-child(even) { background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <!-- Header Metadata -->
      <table>
        <tr><td colspan="10" class="title">Payouts Export Report</td></tr>
        <tr><td colspan="2" class="meta-label">Period:</td><td colspan="8" class="meta-val">${escapeHtml(periodLabel)}</td></tr>
        <tr><td colspan="2" class="meta-label">Date Range:</td><td colspan="8" class="meta-val">${escapeHtml(dateRangeText)}</td></tr>
        <tr><td colspan="2" class="meta-label">Exported At:</td><td colspan="8" class="meta-val">${escapeHtml(new Date().toLocaleString("en-US"))}</td></tr>
        <tr><td colspan="2" class="meta-label">Total Records:</td><td colspan="8" class="meta-val">${summary.totalRecords}</td></tr>
        <tr><td colspan="2" class="meta-label">Net Disbursed:</td><td colspan="8" class="meta-val">${summary.netDisbursed.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB</td></tr>
        <tr><td colspan="2" class="meta-label">Platform Fees:</td><td colspan="8" class="meta-val">${summary.platformFees.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB</td></tr>
        <tr><td colspan="2" class="meta-label">Pending Settlement:</td><td colspan="8" class="meta-val">${summary.pendingSettlement.toLocaleString("en-US", { minimumFractionDigits: 2 })} ETB</td></tr>
        <tr><td colspan="10" style="border: none; height: 20px;"></td></tr>
      </table>

      <!-- Data Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 100px; text-align: center;">Order ID</th>
            <th style="width: 220px;">Company</th>
            <th style="width: 100px; text-align: right;">Gross (ETB)</th>
            <th style="width: 100px; text-align: right;">Platform Fee</th>
            <th style="width: 100px; text-align: right;">Net (ETB)</th>
            <th style="width: 120px;">Status</th>
            <th style="width: 150px;">Payment Method</th>
            <th style="width: 120px;">Payout Date</th>
            <th style="width: 120px;">Paid Date</th>
            <th style="width: 200px;">Reference</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Use "application/vnd.ms-excel" to force Excel to open it beautifully
  const blob = new Blob([htmlContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}