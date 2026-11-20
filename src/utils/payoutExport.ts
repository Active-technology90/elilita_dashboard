
import type { PayoutData } from "./payoutReceipt";

export type ExportPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | "all";

export type ExportTranslator = (
  key: string,
  options?: Record<string, unknown>
) => string;

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

const defaultTranslations: Record<string, string> = {
  allTime: "All Time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
  to: "to",
  pending: "Pending",
  notAvailable: "N/A",
  payoutsExport: "Payouts Export",
  reportTitle: "Payouts Export Report",
  period: "Period",
  dateRange: "Date Range",
  exportedAt: "Exported At",
  totalRecords: "Total Records",
  netDisbursed: "Net Disbursed",
  platformFees: "Platform Fees",
  pendingSettlement: "Pending Settlement",
  orderId: "Order ID",
  company: "Company",
  gross: "Gross",
  platformFee: "Platform Fee",
  net: "Net",
  status: "Status",
  paymentMethod: "Payment Method",
  payoutDate: "Payout Date",
  paidDate: "Paid Date",
  reference: "Reference",
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",
  cancelled: "Cancelled",
  scheduled: "Scheduled",
};

const defaultMethodTranslations: Record<string, string> = {
  bankTransfer: "Bank Transfer",
  chapa: "Chapa",
  cod: "Cash on Delivery",
  telebirr: "Telebirr",
  arifpay: "ArifPay",
};

const translate = (
  t: ExportTranslator | undefined,
  key: string,
  fallback: string,
  options?: Record<string, unknown>
): string => {
  if (!t) return fallback;

  const result = t(key, options);

  // Use the fallback if the translation key is missing.
  return result && result !== key ? result : fallback;
};

const getExportLocale = (locale?: string): string => {
  return locale || "en-US";
};

export function getDateRangeForPeriod(
  period: ExportPeriod,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } | null {
  const now = new Date();

  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
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
          0
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
        start: new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
          0,
          0,
          0,
          0
        ),
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
  t?: ExportTranslator,
  locale = "en-US"
): string {
  if (!dateRange) {
    return translate(
      t,
      "payoutExport.allTime",
      defaultTranslations.allTime
    );
  }

  const fmt = (date: Date) =>
    date.toLocaleDateString(getExportLocale(locale), {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const to = translate(
    t,
    "payoutExport.to",
    defaultTranslations.to
  );

  switch (period) {
    case "daily":
      return `${translate(
        t,
        "payoutExport.daily",
        defaultTranslations.daily
      )} — ${fmt(dateRange.start)}`;

    case "weekly":
      return `${translate(
        t,
        "payoutExport.weekly",
        defaultTranslations.weekly
      )} — ${fmt(dateRange.start)} ${to} ${fmt(dateRange.end)}`;

    case "monthly":
      return `${translate(
        t,
        "payoutExport.monthly",
        defaultTranslations.monthly
      )} — ${dateRange.start.toLocaleDateString(
        getExportLocale(locale),
        {
          month: "long",
          year: "numeric",
        }
      )}`;

    case "yearly":
      return `${translate(
        t,
        "payoutExport.yearly",
        defaultTranslations.yearly
      )} — ${dateRange.start.getFullYear()}`;

    case "custom":
      return `${translate(
        t,
        "payoutExport.custom",
        defaultTranslations.custom
      )} — ${fmt(dateRange.start)} ${to} ${fmt(dateRange.end)}`;

    default:
      return translate(
        t,
        "payoutExport.allTime",
        defaultTranslations.allTime
      );
  }
}

export function filterPayoutsForExport(
  payouts: PayoutData[],
  options: ExportFilterOptions,
  t?: ExportTranslator,
  locale = "en-US"
): ExportResult {
  const dateRange = getDateRangeForPeriod(
    options.period,
    options.customStartDate,
    options.customEndDate
  );

  let filtered = payouts;

  if (dateRange) {
    filtered = filtered.filter((p) => {
      const date = new Date(p.scheduled_at);

      return date >= dateRange.start && date <= dateRange.end;
    });
  }

  if (options.statusFilter) {
    filtered = filtered.filter(
      (p) => p.status === options.statusFilter
    );
  }

  if (options.methodFilter) {
    filtered = filtered.filter((p) => {
      const paymentMethod = (
        p.vendor_order_details?.payment_method ||
        p.gateway ||
        ""
      ).toLowerCase();

      return paymentMethod.includes(
        options.methodFilter!.toLowerCase()
      );
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
    } else if (
      p.status === "pending" ||
      p.status === "processing"
    ) {
      pendingSettlement += net;
    }
  });

  return {
    records: filtered,
    periodLabel: getPeriodLabel(
      options.period,
      dateRange,
      t,
      locale
    ),
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

  if (!dateRange) {
    return `payouts_${slug}_all-time_${today}.xls`;
  }

  const start = dateRange.start.toISOString().split("T")[0];
  const end = dateRange.end.toISOString().split("T")[0];

  if (period === "daily") {
    return `payouts_${slug}_daily_${start}.xls`;
  }

  if (period === "monthly") {
    return `payouts_${slug}_monthly_${start.slice(0, 7)}.xls`;
  }

  if (period === "yearly") {
    return `payouts_${slug}_yearly_${start.slice(0, 4)}.xls`;
  }

  return `payouts_${slug}_${period}_${start}_to_${end}.xls`;
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatExportDate(
  value: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleDateString(
    getExportLocale(locale),
    options
  );
}

function formatExportNumber(
  value: number,
  locale = "en-US"
): string {
  return value.toLocaleString(getExportLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function translatePayoutStatus(
  status: string,
  t?: ExportTranslator
): string {
  const normalizedStatus = (status || "").toLowerCase();

  const knownStatuses: Record<string, string> = {
    completed: "Completed",
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
    cancelled: "Cancelled",
    scheduled: "Scheduled",
  };

  const fallback =
    knownStatuses[normalizedStatus] ||
    status ||
    defaultTranslations.notAvailable;

  return translate(
    t,
    `payoutExport.statusValues.${normalizedStatus}`,
    fallback
  );
}

function translatePaymentMethod(
  method: string,
  t?: ExportTranslator
): string {
  const normalized = (method || "").toLowerCase();

  const methodKeys: Record<string, string> = {
    bank_transfer: "bankTransfer",
    chapa: "chapa",
    cod: "cod",
    telebirr: "telebirr",
    arifpay: "arifpay",
  };

  const key = methodKeys[normalized];

  if (!key) {
    return method
      ? method
          .split("_")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join(" ")
      : translate(
          t,
          "payoutExport.notAvailable",
          defaultTranslations.notAvailable
        );
  }

  return translate(
    t,
    `payoutExport.methods.${key}`,
    defaultMethodTranslations[key]
  );
}

/**
 * Generates a formatted Excel-compatible XLS report.
 *
 * All report labels support i18next translations.
 * Existing calls remain valid because t and locale are optional.
 */
export function downloadPeriodPayoutCsv(
  result: ExportResult,
  filename: string,
  t?: ExportTranslator,
  locale = "en-US"
): void {
  const { records, periodLabel, dateRange, summary } = result;

  const tr = (
    key: string,
    fallback: string,
    options?: Record<string, unknown>
  ) =>
    translate(
      t,
      `payoutExport.${key}`,
      fallback,
      options
    );

  const pendingText = tr(
    "pending",
    defaultTranslations.pending
  );

  const dash = "—";

  // Generate the payout rows.
  const rowsHtml = records
    .map((p) => {
      const gross = formatExportNumber(
        Number(p.gross_amount || 0),
        locale
      );

      const fee = formatExportNumber(
        Number(p.platform_fee || 0),
        locale
      );

      const net = formatExportNumber(
        Number(p.net_amount || 0),
        locale
      );

      // Scheduled payout date.
      const scheduledDate = p.scheduled_at
        ? formatExportDate(p.scheduled_at, locale, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : dash;

      // Actual payment date.
      const paidDate = p.paid_at
        ? formatExportDate(p.paid_at, locale, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : pendingText;

      // Payment method.
      const paymentMethod = translatePaymentMethod(
        p.vendor_order_details?.payment_method ||
          p.gateway ||
          "",
        t
      );

      return `
        <tr>
          <td style="mso-number-format:'\\@'; text-align: center; font-weight: bold;">
            #${escapeHtml(p.vendor_order)}
          </td>

          <td>${escapeHtml(p.company_name || dash)}</td>

          <td style="text-align: right;">
            ${gross}
          </td>

          <td style="text-align: right; color: #dc2626;">
            -${fee}
          </td>

          <td style="text-align: right; font-weight: bold; color: #111827;">
            ${net}
          </td>

          <td style="text-transform: capitalize;">
            ${escapeHtml(
              translatePayoutStatus(p.status || "", t)
            )}
          </td>

          <td>${escapeHtml(paymentMethod)}</td>

          <td style="mso-number-format:'\\@';">
            ${escapeHtml(scheduledDate)}
          </td>

          <td style="mso-number-format:'\\@';">
            ${escapeHtml(paidDate)}
          </td>

          <td>${escapeHtml(p.reference || dash)}</td>
        </tr>
      `;
    })
    .join("");

  const dateRangeText = dateRange
    ? `${formatExportDate(dateRange.start, locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })} – ${formatExportDate(dateRange.end, locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`
    : tr("allTime", defaultTranslations.allTime);

  const exportedAt = new Date().toLocaleString(
    getExportLocale(locale)
  );

  const currency = (amount: number) =>
    `${formatExportNumber(amount, locale)} ETB`;

  // Create an Excel-compatible HTML spreadsheet.
  const htmlContent = `
    <html
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40"
    >
      <head>
        <meta charset="utf-8" />

        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${escapeHtml(
                  tr(
                    "payoutsExport",
                    defaultTranslations.payoutsExport
                  )
                )}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->

        <style>
          table {
            border-collapse: collapse;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
          }

          th {
            background-color: #6750A4;
            color: #ffffff;
            padding: 10px;
            border: 1px solid #e5e7eb;
            text-align: left;
            font-weight: 600;
          }

          td {
            padding: 8px 10px;
            border: 1px solid #e5e7eb;
            color: #333333;
          }

          .meta-label {
            font-weight: bold;
            color: #6750A4;
          }

          .meta-val {
            color: #4b5563;
          }

          .title {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
          }

          tr:nth-child(even) {
            background-color: #f9fafb;
          }
        </style>
      </head>

      <body>
        <!-- Report Header -->
        <table>
          <tr>
            <td colspan="10" class="title">
              ${escapeHtml(
                tr(
                  "reportTitle",
                  defaultTranslations.reportTitle
                )
              )}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr("period", defaultTranslations.period)
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${escapeHtml(periodLabel)}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr("dateRange", defaultTranslations.dateRange)
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${escapeHtml(dateRangeText)}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr("exportedAt", defaultTranslations.exportedAt)
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${escapeHtml(exportedAt)}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr(
                  "totalRecords",
                  defaultTranslations.totalRecords
                )
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${summary.totalRecords}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr(
                  "netDisbursed",
                  defaultTranslations.netDisbursed
                )
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${currency(summary.netDisbursed)}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr(
                  "platformFees",
                  defaultTranslations.platformFees
                )
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${currency(summary.platformFees)}
            </td>
          </tr>

          <tr>
            <td colspan="2" class="meta-label">
              ${escapeHtml(
                tr(
                  "pendingSettlement",
                  defaultTranslations.pendingSettlement
                )
              )}:
            </td>
            <td colspan="8" class="meta-val">
              ${currency(summary.pendingSettlement)}
            </td>
          </tr>

          <tr>
            <td colspan="10" style="border: none; height: 20px;"></td>
          </tr>
        </table>

        <!-- Payout Data Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 100px; text-align: center;">
                ${escapeHtml(
                  tr("orderId", defaultTranslations.orderId)
                )}
              </th>

              <th style="width: 220px;">
                ${escapeHtml(
                  tr("company", defaultTranslations.company)
                )}
              </th>

              <th style="width: 100px; text-align: right;">
                ${escapeHtml(
                  tr("gross", defaultTranslations.gross)
                )} (ETB)
              </th>

              <th style="width: 100px; text-align: right;">
                ${escapeHtml(
                  tr(
                    "platformFee",
                    defaultTranslations.platformFee
                  )
                )}
              </th>

              <th style="width: 100px; text-align: right;">
                ${escapeHtml(
                  tr("net", defaultTranslations.net)
                )} (ETB)
              </th>

              <th style="width: 120px;">
                ${escapeHtml(
                  tr("status", defaultTranslations.status)
                )}
              </th>

              <th style="width: 150px;">
                ${escapeHtml(
                  tr(
                    "paymentMethod",
                    defaultTranslations.paymentMethod
                  )
                )}
              </th>

              <th style="width: 120px;">
                ${escapeHtml(
                  tr(
                    "payoutDate",
                    defaultTranslations.payoutDate
                  )
                )}
              </th>

              <th style="width: 120px;">
                ${escapeHtml(
                  tr("paidDate", defaultTranslations.paidDate)
                )}
              </th>

              <th style="width: 200px;">
                ${escapeHtml(
                  tr(
                    "reference",
                    defaultTranslations.reference
                  )
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Export the generated spreadsheet.
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
