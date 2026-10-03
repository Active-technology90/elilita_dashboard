import type { VendorOrder } from "../types";

export interface PayoutData {
  id: number;
  vendor_order: number;
  company_name: string;
  company_slug: string;
  company_logo?: string;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  status: "pending" | "completed" | "failed" | "processing";
  scheduled_at: string;
  paid_at: string | null;
  reference: string | null;
  gateway?: string;
  metadata?: any;
  vendor_order_details?: VendorOrder;
}

export const getFullMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  const rawApi = import.meta.env.VITE_API_URL || "https://backend.elilitapp.com";
  const baseUrl = rawApi.replace(/\/api\/v1\/?$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

export const generatePayoutReceiptHtml = (payout: PayoutData): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const elilitaLogoUrl = `${origin}/elilta1.jpg`;
  const companyLogoUrl = getFullMediaUrl(payout.company_logo);

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

  const gross = Number(payout.gross_amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const fee = Number(payout.platform_fee || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const net = Number(payout.net_amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const vo = payout.vendor_order_details;
  const paymentMethod =
    vo?.payment_method
      ?.split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || "Electronic Transfer";

  const items = vo?.items || [];

  const itemsTableHtml =
    items.length > 0
      ? `
      <div style="margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; margin: 0;">
            Order Items Breakdown (${items.length} ${items.length === 1 ? "item" : "items"})
          </h3>
          <span style="font-size: 12px; color: #6b7280;">Order #${payout.vendor_order}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb; text-align: left;">
              <th style="padding: 10px 14px; font-weight: 600; color: #374151;">Product / Description</th>
              <th style="padding: 10px 14px; font-weight: 600; color: #374151; text-align: center;">Qty</th>
              <th style="padding: 10px 14px; font-weight: 600; color: #374151; text-align: right;">Unit Price</th>
              <th style="padding: 10px 14px; font-weight: 600; color: #374151; text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) => {
                const imgUrl = getFullMediaUrl(item.product_image);
                const itemImgHtml = imgUrl
                  ? `<img src="${imgUrl}" alt="${item.title}" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover; margin-right: 10px; vertical-align: middle; border: 1px solid #e5e7eb;" />`
                  : "";
                return `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px 14px; color: #111827;">
                  <div style="display: flex; align-items: center;">
                    ${itemImgHtml}
                    <div>
                      <div style="font-weight: 600; color: #111827;">${item.title || "Order Item"}</div>
                      ${item.sku ? `<div style="font-size: 11px; color: #6b7280;">SKU: ${item.sku}</div>` : ""}
                    </div>
                  </div>
                </td>
                <td style="padding: 10px 14px; color: #4b5563; text-align: center; font-weight: 500;">${item.qty || 1}</td>
                <td style="padding: 10px 14px; color: #4b5563; text-align: right;">ETB ${Number(
                  item.unit_price || 0
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="padding: 10px 14px; color: #111827; font-weight: 700; text-align: right;">ETB ${Number(
                  item.line_total || item.subtotal || 0
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `
      : `
      <div style="margin-top: 20px; padding: 14px 18px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; font-size: 13px; color: #6b7280; text-align: center;">
        Order items summarized directly under Vendor Order #${payout.vendor_order}.
      </div>
    `;

  const isCompleted = payout.status === "completed";
  const statusColor = isCompleted ? "#059669" : payout.status === "failed" ? "#dc2626" : "#d97706";
  const statusBg = isCompleted ? "#ecfdf5" : payout.status === "failed" ? "#fef2f2" : "#fffbeb";
  const statusLabel = isCompleted ? "PAID & SETTLED" : payout.status === "failed" ? "PAYOUT FAILED" : "PENDING ESCROW";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payout Receipt - #${payout.id}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 15mm; size: A4; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #f3f4f6;
      margin: 0;
      padding: 32px 16px;
    }
    .receipt-card {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #6750A4;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      object-fit: cover;
      border: 1px solid #e5e7eb;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #6750A4;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .receipt-badge {
      text-align: right;
    }
    .receipt-id {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }
    .order-ref {
      font-size: 12px;
      color: #6750A4;
      font-weight: 600;
      margin-top: 2px;
    }

    /* Parties Flow (Platform to Vendor) */
    .parties-flow {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 16px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .party-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .party-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    .party-info h4 {
      margin: 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }
    .party-info .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-top: 2px;
    }
    .party-info .party-sub {
      font-size: 12px;
      color: #6b7280;
    }
    .flow-arrow {
      font-size: 20px;
      color: #6750A4;
      font-weight: 700;
      padding: 0 8px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px 18px;
    }
    .info-box h4 {
      margin: 0 0 10px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-weight: 700;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 6px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      color: #6b7280;
    }
    .info-val {
      font-weight: 600;
      color: #111827;
    }

    /* Calculation Table */
    .financial-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    .financial-table th {
      background: #f9fafb;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 700;
      color: #4b5563;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .financial-table td {
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid #f3f4f6;
    }
    .net-row {
      background: #fbf9ff;
      border-top: 2px solid #6750A4 !important;
    }
    .net-amount {
      font-size: 19px;
      font-weight: 900;
      color: #6750A4;
    }

    /* Stamp and Footer */
    .stamp-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .status-stamp {
      display: inline-block;
      padding: 8px 18px;
      border: 2px solid ${statusColor};
      background: ${statusBg};
      color: ${statusColor};
      border-radius: 8px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .footer-note {
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
      line-height: 1.5;
    }
    .action-bar {
      max-width: 780px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-print {
      background: #6750A4;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(103, 80, 164, 0.2);
    }
    .btn-print:hover {
      background: #533e8b;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="btn btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="receipt-card">
    <!-- Header with Elilita Super App Branding -->
    <div class="header">
      <div class="logo-container">
        <img src="${elilitaLogoUrl}" alt="Elilita Logo" class="brand-logo" onerror="this.style.display='none'" />
        <div>
          <h1 class="brand-title">ELILITA SUPER APP</h1>
          <div class="brand-subtitle">Official Vendor Payout Receipt</div>
        </div>
      </div>
      <div class="receipt-badge">
        <div class="receipt-id">#RECEIPT-${payout.id}</div>
        <div class="order-ref">Vendor Order #${payout.vendor_order}</div>
      </div>
    </div>

    <!-- Parties Flow: Elilita Platform -> Vendor Company -->
    <div class="parties-flow">
      <!-- Payer: Elilita -->
      <div class="party-box">
        <img src="${elilitaLogoUrl}" alt="Elilita" class="party-logo" onerror="this.style.display='none'" />
        <div class="party-info">
          <h4>Disbursed By</h4>
          <div class="party-name">Elilita Marketplace</div>
          <div class="party-sub">Platform Escrow Account</div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flow-arrow">&rarr;</div>

      <!-- Beneficiary: Vendor -->
      <div class="party-box">
        ${
          companyLogoUrl
            ? `<img src="${companyLogoUrl}" alt="${payout.company_name}" class="party-logo" onerror="this.style.display='none'" />`
            : `<div class="party-logo" style="display: flex; align-items: center; justify-content: center; font-weight: 700; color: #6750A4; font-size: 16px;">${payout.company_name.charAt(0)}</div>`
        }
        <div class="party-info">
          <h4>Beneficiary Vendor</h4>
          <div class="party-name">${payout.company_name}</div>
          <div class="party-sub">@${payout.company_slug}</div>
        </div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="info-grid">
      <div class="info-box">
        <h4>Payment &amp; Settlement Details</h4>
        <div class="info-row">
          <span class="info-label">Payment Channel:</span>
          <span class="info-val">${paymentMethod}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scheduled Date:</span>
          <span class="info-val">${scheduledDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Paid / Settled Date:</span>
          <span class="info-val">${paidDate}</span>
        </div>
      </div>

      <div class="info-box">
        <h4>Transfer Verification</h4>
        <div class="info-row">
          <span class="info-label">Reference ID:</span>
          <span class="info-val" style="word-break: break-all;">${payout.reference || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Order Ref:</span>
          <span class="info-val">#${payout.vendor_order}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Recipient Customer:</span>
          <span class="info-val">${vo?.recipient_name || vo?.customer_name || "Customer"}</span>
        </div>
      </div>
    </div>

    <!-- Order Items Breakdown -->
    ${itemsTableHtml}

    <!-- Financial Calculation Table -->
    <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; margin-top: 28px; margin-bottom: 8px;">
      Payout Settlement Summary
    </h3>
    <table class="financial-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount (ETB)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Gross Sales Total (Order #${payout.vendor_order})</td>
          <td style="text-align: right; font-weight: 600;">ETB ${gross}</td>
        </tr>
        <tr>
          <td>Marketplace Platform Fee (Commission Deduction)</td>
          <td style="text-align: right; color: #dc2626; font-weight: 600;">- ETB ${fee}</td>
        </tr>
        <tr class="net-row">
          <td>
            <div style="font-weight: 800; color: #111827; font-size: 14px;">Net Disbursed Payout to Vendor</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Deposited to vendor account via ${paymentMethod}</div>
          </td>
          <td style="text-align: right;" class="net-amount">ETB ${net}</td>
        </tr>
      </tbody>
    </table>

    <!-- Stamp & Official Footer -->
    <div class="stamp-container">
      <div>
        <div class="status-stamp">${statusLabel}</div>
      </div>
      <div class="footer-note">
        This is a digitally verified payout receipt generated by Elilita Super App.<br />
        All settlements are audited and disbursed under Elilita Multi-Vendor Commerce Policies.<br />
        Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export const printPayoutReceipt = (payout: PayoutData): boolean => {
  const html = generatePayoutReceiptHtml(payout);
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
  return true;
};

export const downloadPayoutCsv = (payouts: PayoutData[], filename = "payout_receipts_export.csv") => {
  const headers = [
    "Receipt ID",
    "Order ID",
    "Vendor Company",
    "Company Slug",
    "Gross Amount (ETB)",
    "Platform Fee (ETB)",
    "Net Payout (ETB)",
    "Payment Status",
    "Payment Method",
    "Scheduled Date",
    "Paid Date",
    "Reference",
  ];

  const rows = payouts.map((p) => [
    p.id,
    p.vendor_order,
    `"${(p.company_name || "").replace(/"/g, '""')}"`,
    `"${(p.company_slug || "").replace(/"/g, '""')}"`,
    p.gross_amount,
    p.platform_fee,
    p.net_amount,
    p.status,
    `"${(p.vendor_order_details?.payment_method || "N/A").replace(/"/g, '""')}"`,
    p.scheduled_at ? `"${new Date(p.scheduled_at).toLocaleDateString()}"` : '""',
    p.paid_at ? `"${new Date(p.paid_at).toLocaleDateString()}"` : '""',
    `"${(p.reference || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
