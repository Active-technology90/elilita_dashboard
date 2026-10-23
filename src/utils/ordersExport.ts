import type { VendorOrder } from "../types";

export type ExportPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | "all";

export interface OrderExportFilterOptions {
  period: ExportPeriod;
  customStartDate?: string;
  customEndDate?: string;
  orderStatusFilter?: string;
  deliveryStatusFilter?: string;
  paymentMethodFilter?: string;
  searchTerm?: string;
}

export interface OrderExportResult {
  records: VendorOrder[];
  periodLabel: string;
  dateRange: { start: Date; end: Date } | null;
  summary: {
    totalRecords: number;
    totalAmount: number;
    deliveredCount: number;
    pendingCount: number;
    cancelledCount: number;
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Date range helpers                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export function getDateRangeForPeriod(
  period: ExportPeriod,
  customStart?: string,
  customEnd?: string,
): { start: Date; end: Date } | null {
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (period) {
    case "daily":
      return {
        start: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0,
        ),
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
  dateRange: { start: Date; end: Date } | null,
): string {
  if (!dateRange) return "All Time";

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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

/* ─────────────────────────────────────────────────────────────────────────── */
/* Filtering                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export function filterOrdersForExport(
  orders: VendorOrder[],
  options: OrderExportFilterOptions,
): OrderExportResult {
  const dateRange = getDateRangeForPeriod(
    options.period,
    options.customStartDate,
    options.customEndDate,
  );

  let filtered = orders;

  if (dateRange) {
    filtered = filtered.filter((o) => {
      const d = new Date(o.created_at);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }

  if (options.orderStatusFilter) {
    filtered = filtered.filter((o) => o.status === options.orderStatusFilter);
  }

  if (options.deliveryStatusFilter) {
    filtered = filtered.filter(
      (o) => o.delivery?.status === options.deliveryStatusFilter,
    );
  }

  if (options.paymentMethodFilter) {
    filtered = filtered.filter(
      (o) => o.payment_method === options.paymentMethodFilter,
    );
  }

  if (options.searchTerm?.trim()) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.id.toString().includes(term) ||
        (o.company?.name || "").toLowerCase().includes(term) ||
        (o.customer_name || "").toLowerCase().includes(term) ||
        (o.status || "").toLowerCase().includes(term),
    );
  }

  let totalAmount = 0;
  let deliveredCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;

  filtered.forEach((o) => {
    totalAmount += Number(o.amount) || 0;
    const s = (o.status || "").toLowerCase();
    if (s === "fulfilled" || s === "delivered") deliveredCount++;
    else if (s === "cancelled" || s === "payment_rejected") cancelledCount++;
    else pendingCount++;
  });

  return {
    records: filtered,
    periodLabel: getPeriodLabel(options.period, dateRange),
    dateRange,
    summary: {
      totalRecords: filtered.length,
      totalAmount,
      deliveredCount,
      pendingCount,
      cancelledCount,
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Filename                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

export function buildOrdersExportFilename(
  period: ExportPeriod,
  companySlug: string | null,
  dateRange: { start: Date; end: Date } | null,
): string {
  const today = new Date().toISOString().split("T")[0];
  const slug = companySlug || "all-companies";

  if (!dateRange) return `orders_${slug}_all-time_${today}.xls`;

  const start = dateRange.start.toISOString().split("T")[0];
  const end = dateRange.end.toISOString().split("T")[0];

  if (period === "daily") return `orders_${slug}_daily_${start}.xls`;
  if (period === "monthly")
    return `orders_${slug}_monthly_${start.slice(0, 7)}.xls`;
  if (period === "yearly")
    return `orders_${slug}_yearly_${start.slice(0, 4)}.xls`;
  return `orders_${slug}_${period}_${start}_to_${end}.xls`;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

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

const num = (v: any) => Number(v) || 0;

const fmtMoney = (v: number) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDateOnly = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "—";

const fmtTimeOnly = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const titleCase = (v: string | null | undefined) =>
  (v || "N/A").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* Status → color mapping used both in cell backgrounds and the summary block */
function statusColor(status: string): { bg: string; fg: string } {
  const s = (status || "").toLowerCase();
  if (s === "fulfilled" || s === "delivered")
    return { bg: "#DCFCE7", fg: "#166534" }; // green
  if (s === "cancelled" || s === "payment_rejected")
    return { bg: "#FEE2E2", fg: "#991B1B" }; // red
  if (s === "shipped" || s === "processing" || s === "contacted")
    return { bg: "#DBEAFE", fg: "#1E40AF" }; // blue
  return { bg: "#FEF3C7", fg: "#92400E" }; // amber (pending etc.)
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main export                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export function downloadOrdersCsv(
  result: OrderExportResult,
  filename: string,
  companyName: string,
): void {
  const { records, periodLabel, dateRange, summary } = result;

  const generatedAt = new Date();
  const generatedAtStr = generatedAt.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateRangeText = dateRange
    ? `${dateRange.start.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}  →  ${dateRange.end.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`
    : "All Time";

  /* ─────────────────────────── Build data rows ─────────────────────────── */

  const rowsHtml = records
    .map((o, idx) => {
      const amount = num(o.amount);
      const deliveryStatus = o.delivery?.status
        ? titleCase(o.delivery.status)
        : o.shipping_address_text
          ? "Assigned"
          : "Self Pickup";

      const status = statusColor(o.status || "");
      const zebra = idx % 2 === 1 ? "#FAFAFB" : "#FFFFFF";

      return `
        <tr style="background-color:${zebra};">
          <td class="c-center">${escapeHtml(o.id)}</td>
          <td>${escapeHtml(o.company?.name || "N/A")}</td>
          <td>${escapeHtml(o.customer_name || "N/A")}</td>
          <td class="c-money">${fmtMoney(amount)}</td>
          <td>${escapeHtml(titleCase(o.payment_method))}</td>
          <td style="background-color:${status.bg}; color:${status.fg}; font-weight:600; text-align:center;">
            ${escapeHtml(titleCase(o.status))}
          </td>
          <td class="c-center">${escapeHtml(deliveryStatus)}</td>
          <td class="c-center">${escapeHtml(fmtDateOnly(o.created_at))}</td>
          <td class="c-center">${escapeHtml(fmtTimeOnly(o.created_at))}</td>
          <td>${escapeHtml(o.shipping_address_text || "—")}</td>
        </tr>`;
    })
    .join("");

  /* ─────────────────────────── Totals row ─────────────────────────── */

  const totalRowHtml = `
    <tr class="total-row">
      <td colspan="3" class="total-label">TOTAL — ${summary.totalRecords} order${
        summary.totalRecords === 1 ? "" : "s"
      }</td>
      <td class="c-money total-amount">${fmtMoney(summary.totalAmount)}</td>
      <td colspan="6"></td>
    </tr>`;

  /* ─────────────────────────── Summary pills ─────────────────────────── */

  const summaryPills = [
    {
      label: "Total Orders",
      value: summary.totalRecords.toString(),
      bg: "#EEF2FF",
      fg: "#3730A3",
    },
    {
      label: "Total Revenue",
      value: `${fmtMoney(summary.totalAmount)} ETB`,
      bg: "#ECFDF5",
      fg: "#065F46",
    },
    {
      label: "Delivered",
      value: summary.deliveredCount.toString(),
      bg: "#DCFCE7",
      fg: "#166534",
    },
    {
      label: "Pending",
      value: summary.pendingCount.toString(),
      bg: "#FEF3C7",
      fg: "#92400E",
    },
    {
      label: "Cancelled",
      value: summary.cancelledCount.toString(),
      bg: "#FEE2E2",
      fg: "#991B1B",
    },
  ]
    .map(
      (p) => `
      <td style="background-color:${p.bg}; border-radius:8px; padding:12px 14px; text-align:center; border:1px solid #E5E7EB;">
        <div style="font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:${p.fg}; opacity:.75; margin-bottom:4px;">${escapeHtml(
          p.label,
        )}</div>
        <div style="font-size:16px; font-weight:800; color:${p.fg};">${escapeHtml(
          p.value,
        )}</div>
      </td>`,
    )
    .join('<td style="width:10px;"></td>');

  /* ─────────────────────────── Full HTML ─────────────────────────── */

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Orders Export</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:FreezePanes/>
            <x:FrozenNoSplit/>
            <x:SplitHorizontal>14</x:SplitHorizontal>
            <x:TopRowBottomPane>14</x:TopRowBottomPane>
            <x:ActivePane>2</x:ActivePane>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->

  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Inter', Arial, sans-serif;
      font-size: 12px;
      color: #1F2937;
      margin: 0;
      padding: 0;
    }
    table { border-collapse: collapse; }

    /* ─── Title banner ─── */
    .banner {
      background-color: #6750A4;
      color: #FFFFFF;
      padding: 20px 24px;
      vertical-align: middle;
    }
    .banner .title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .banner .subtitle {
      font-size: 11px;
      font-weight: 500;
      opacity: .85;
      margin-top: 4px;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .banner .right { text-align: right; font-size: 11px; opacity: .9; }
    .banner .right strong { display: block; font-size: 13px; opacity: 1; }

    /* ─── Meta strip ─── */
    .meta {
      background-color: #F3F1FA;
      border-top: 1px solid #E5E7EB;
      border-bottom: 1px solid #E5E7EB;
    }
    .meta td {
      padding: 12px 24px;
      vertical-align: top;
      border: none;
    }
    .meta .k {
      font-size: 10px;
      font-weight: 700;
      color: #6B7280;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .meta .v {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
    }

    /* ─── Summary pills ─── */
    .summary td { padding: 6px 0; }
    .summary .wrap { padding: 16px 24px 4px 24px; }

    /* ─── Data table ─── */
    .data {
      margin: 16px 24px 24px 24px;
      border: 1px solid #E5E7EB;
    }
    .data th {
      background-color: #6750A4;
      color: #FFFFFF;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .06em;
      text-transform: uppercase;
      text-align: left;
      border: 1px solid #57448A;
      white-space: nowrap;
    }
    .data td {
      padding: 9px 12px;
      font-size: 12px;
      border: 1px solid #EEF0F3;
      color: #1F2937;
      vertical-align: middle;
    }
    .data td.c-center { text-align: center; }
    .data td.c-money {
      text-align: right;
      font-family: 'Consolas', 'SF Mono', 'Menlo', monospace;
      font-weight: 600;
      color: #111827;
      mso-number-format: "\\#\\,\\#\\#0\\.00";
    }
    .data tr:hover td { background-color: #FAF7FF; }

    .total-row td {
      background-color: #F3F1FA !important;
      border-top: 2px solid #6750A4 !important;
      font-weight: 800;
      font-size: 12px;
      color: #1F2937;
      padding: 12px;
    }
    .total-row .total-label { text-align: right; }
    .total-row .total-amount {
      color: #6750A4;
      font-size: 13px;
      font-family: 'Consolas', 'SF Mono', 'Menlo', monospace;
    }

    /* ─── Footer ─── */
    .footer {
      margin: 0 24px 24px 24px;
      padding-top: 12px;
      border-top: 1px dashed #E5E7EB;
      font-size: 10px;
      color: #9CA3AF;
      text-align: center;
      letter-spacing: .04em;
    }
    .footer strong { color: #6750A4; }
  </style>
</head>
<body>

  <!-- ══════════════ TITLE BANNER ══════════════ -->
  <table width="100%">
    <tr>
      <td class="banner" style="width:70%;">
        <div class="title">Orders Export Report</div>
        <div class="subtitle">${escapeHtml(companyName || "All Companies")}</div>
      </td>
      <td class="banner right" style="width:30%;">
        <strong>${escapeHtml(periodLabel)}</strong>
        Generated ${escapeHtml(generatedAtStr)}
      </td>
    </tr>
  </table>

  <!-- ══════════════ META STRIP ══════════════ -->
  <table width="100%" class="meta">
    <tr>
      <td style="width:25%;">
        <div class="k">Company</div>
        <div class="v">${escapeHtml(companyName || "All Companies")}</div>
      </td>
      <td style="width:25%;">
        <div class="k">Period</div>
        <div class="v">${escapeHtml(periodLabel)}</div>
      </td>
      <td style="width:25%;">
        <div class="k">Date Range</div>
        <div class="v">${escapeHtml(dateRangeText)}</div>
      </td>
      <td style="width:25%;">
        <div class="k">Exported At</div>
        <div class="v">${escapeHtml(generatedAtStr)}</div>
      </td>
    </tr>
  </table>

  <!-- ══════════════ SUMMARY PILLS ══════════════ -->
  <table width="100%" class="summary">
    <tr><td class="wrap">
      <table width="100%"><tr>${summaryPills}</tr></table>
    </td></tr>
  </table>

  <!-- ══════════════ DATA TABLE ══════════════ -->
  <table width="100%" class="data">
    <thead>
      <tr>
        <th style="width:70px;">Order ID</th>
        <th style="width:180px;">Company</th>
        <th style="width:170px;">Customer</th>
        <th style="width:110px; text-align:right;">Amount (ETB)</th>
        <th style="width:120px;">Payment</th>
        <th style="width:120px; text-align:center;">Status</th>
        <th style="width:120px; text-align:center;">Delivery</th>
        <th style="width:110px; text-align:center;">Date</th>
        <th style="width:80px; text-align:center;">Time</th>
        <th>Address</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${totalRowHtml}
    </tbody>
  </table>

  <!-- ══════════════ FOOTER ══════════════ -->
  <div class="footer">
    Generated by <strong>Elilit</strong> · ${escapeHtml(
      generatedAt.toLocaleDateString("en-US", { dateStyle: "long" }),
    )} · ${escapeHtml(filename)}
  </div>

</body>
</html>
  `;

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