
export default {
  page: {
    title: "Service Bookings",
    description: "Review, manage, and track incoming customer appointments.",
    serviceCompanyOnly:
      "This area is available only to companies configured as service businesses.",
    serviceCompanyRequired: "Service company required",
    switchCompany: "Switch company",
    selectedCompany: "The selected company",
    notServiceCompany: "{{company}} is not a service company",
    serviceCompanyDisabled:
      "Service offerings, staff schedules, availability, and bookings are disabled for this company. Select a company whose business type is",
    serviceBusinessType: "service",
    toContinue: "to continue.",
    chooseServiceCompany: "Choose a service company",
  },

  companySelector: {
    searchPlaceholder: "Search service companies...",
  },

  status: {
    all: "All Statuses",
    pending: "Pending",
    confirmed: "Confirmed",
    inProgress: "In Progress",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    noShow: "No Show",
    no_show: "No Show",
  },

  paymentStatus: {
    all: "All Payment Status",
    paid: "Paid",
    receiptRejected: "Receipt Rejected",
    verifyReceipt: "Verify Receipt",
    awaitingReceipt: "Awaiting Receipt",
    failed: "Failed",
    payAtVenue: "Pay at Venue",
    pending: "Pending",
    notRequired: "Not Required",
  },

  paymentMethods: {
    all: "All Payment Methods",
    bankTransfer: "Bank Transfer",
    telebirr: "Telebirr",
    chapa: "Chapa",
    arifpay: "ArifPay",
    cashVenue: "Cash (Venue)",
    cod: "Cash on Delivery (COD)",
  },

  filters: {
    title: "Filters",
    status: "Status",
    paymentStatus: "Payment Status",
    paymentMethod: "Payment Method",
    date: "Date",
    allStatuses: "All Statuses",
    allPaymentStatuses: "All Payment Status",
    allPaymentMethods: "All Payment Methods",
    clearAll: "Clear all",
    apply: "Apply Filters",
  },

  pagination: {
    perPage: "{{count}} / page",
  },

  search: {
    placeholder: "Search by ID, customer or service...",
    refresh: "Refresh service bookings",
  },

  table: {
    bookingId: "Booking ID",
    customer: "Customer",
    customerNumber: "Customer #{{id}}",
    specialist: "Specialist",
    anySpecialist: "Any specialist",
    service: "Service",
    price: "Price",
    status: "Status",
    paymentMethod: "Payment Method",
    paymentStatus: "Payment Status",
    dateTime: "Date / Time",
    actions: "Actions",
    manage: "Manage",
    noBookingsFound: "No bookings found.",
    noMatchingBookings: "No matching bookings.",
  },

  messages: {
    loadBookingFailed: "Could not load booking details",
    refreshBookingFailed: "Could not refresh booking",
    bookingMarkedAs: "Booking marked as {{status}}",
    updateBookingFailed: "Failed to update booking",
  },
};
