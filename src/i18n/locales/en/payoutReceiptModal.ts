export default {
  "common": {
    "notAvailable": "N/A",
    "electronicTransfer": "Electronic Transfer",
    "customer": "Customer"
  },
  "status": {
    "paidSettled": "Paid & Settled",
    "failed": "Failed",
    "pendingSettlement": "Pending Settlement"
  },
  "header": {
    "title": "Payout Receipt #{{id}}",
    "subtitle": "Official Vendor Disbursement Statement",
    "printTitle": "Print or Save PDF",
    "printButton": "Print / Save PDF",
    "receiptNumber": "#RECEIPT-{{id}}",
    "orderRef": "Order Ref: #{{id}}"
  },
  "brand": {
    "name": "Elilita Super App",
    "receiptTitle": "Order Payment Receipt",
    "receiptSubtitle": "Vendor Direct Settlement & Disbursement"
  },
  "metadata": {
    "settlementTitle": "Settlement Metadata",
    "paymentChannel": "Payment Channel",
    "scheduledDate": "Scheduled Date",
    "settledAt": "Settled At",
    "verificationTitle": "Verification Details",
    "referenceId": "Reference ID",
    "orderId": "Order ID",
    "customer": "Customer"
  },
  "items": {
    "title": "Order Items ({{count}})",
    "orderLabel": "Order #{{id}}",
    "fallbackItem": "Order Item",
    "sku": "SKU",
    "emptyMessage": "Order items summarized under Vendor Order #{{id}}.",
    "columns": {
      "item": "Item",
      "qty": "Qty",
      "unitPrice": "Unit Price",
      "lineTotal": "Line Total"
    }
  },
  "calculation": {
    "title": "Settlement Calculation Breakdown",
    "grossTotal": "Gross Sales Total (Order #{{id}})",
    "platformCommission": "Platform Commission Fee (Deduction)",
    "netPayout": "Net Payout to Vendor",
    "netPayoutSubtitle": "Disbursed to vendor account via {{method}}"
  },
  "footer": {
    "certification": "Official digital payout receipt verified and disbursed by Elilita Super App."
  }
}