
export default {
  viewAll: "View all",
  service: "Service",

  columns: {
    booking: "Booking",
    order: "Order",
    customer: "Customer",
    price: "Price",
    amount: "Amount",
    status: "Status",
    payment: "Payment",
    service: "Service",
    companies: "Companies",
    date: "Date",
  },

  empty: {
    noRecentBookings: "No recent bookings",
    noRecentOrders: "No recent orders",
    noRecentBookingsDescription:
      "New bookings will appear here as soon as customers start scheduling services.",
    noRecentOrdersDescription:
      "New orders will appear here as soon as customers start placing them.",
  },

  statuses: {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    preparing: "Preparing",
    ready: "Ready",
    shipped: "Shipped",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
    refunded: "Refunded",
    failed: "Failed",
    no_show: "No show",
    in_progress: "In progress",
  },

  paymentStatuses: {
    pending: "Pending",
    paid: "Paid",
    unpaid: "Unpaid",
    failed: "Failed",
    payment_failed: "Payment failed",
    refunded: "Refunded",
    partially_paid: "Partially paid",
    awaiting_payment: "Awaiting payment",
    cash_on_delivery: "Cash on delivery",
  },
};
