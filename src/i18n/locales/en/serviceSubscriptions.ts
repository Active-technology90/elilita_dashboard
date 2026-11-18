export default {
  page: {
    title: "Recurring Contracts",
    selectCompanyDescription:
      "Select a service company to manage recurring service contracts.",
    selectCompanyToContinue: "Select a service company to continue.",
    serviceCompaniesOnlyDescription:
      "Recurring service contracts are available only for service companies.",
    serviceCompanyRequired: "Service company required",
    selectedCompany: "The selected company",
    notServiceCompany: "is not a service company",
    disabledForCompany:
      "Recurring contracts, billing cycles, and service subscription management are disabled for this company. Select a company whose business type is",
    serviceBusinessType: "service",
    toContinue: "to continue.",
    manageDescription:
      "Manage ongoing subscriptions, billing cycles, and contract status.",
  },

  companySelector: {
    title: "Service Management",
    searchPlaceholder: "Search service companies...",
  },

  status: {
    active: "Active",
    paused: "Paused",
    completed: "Completed",
    cancelled: "Cancelled",
  },

  tabs: {
    all: "All Contracts",
  },

  kpis: {
    totalContracts: "Total Contracts",
  },

  table: {
    contract: "Contract",
    created: "Created",
    customer: "Customer",
    service: "Service",
    recurringService: "Recurring Service",
    staff: "Staff",
    billing: "Billing",
    per: "per",
    nextBilling: "Next Billing",
    status: "Status",
    paymentMethod: "Payment Method",
    paymentStatus: "Payment Status",
    actions: "Actions",
  },

  actions: {
    manage: "Manage",
    switchCompany: "Switch company",
    chooseServiceCompany: "Choose a service company",
    refresh: "Refresh",
  },

  paymentStatus: {
    paid: "Paid",
    receiptRejected: "Receipt Rejected",
    verifyReceipt: "Verify Receipt",
    awaitingReceipt: "Awaiting Receipt",
    failed: "Failed",
    pending: "Pending",
  },

  paymentMethods: {
    bankTransfer: "Bank Transfer",
    telebirr: "Telebirr",
    chapa: "Chapa",
    arifpay: "ArifPay",
    cash: "Cash",
  },

  billingDate: {
    overdue: "Overdue",
    today: "Today",
  },

  billingCycles: {
    weekly: "weekly",
    monthly: "monthly",
    quarterly: "quarterly",
    yearly: "yearly",
  },

  search: {
    placeholder: "Search contract, customer, service, staff...",
    ariaLabel: "Search subscriptions",
    clearAriaLabel: "Clear search",
    clear: "Clear Search",
  },

  pagination: {
    pageSize: "{{count}} / page",
  },

  results: {
    contractCount_one: "{{count}} contract",
    contractCount_other: "{{count}} contracts",
  },

  empty: {
    noMatchingContracts: "No matching contracts.",
    noContracts: "No recurring contracts yet.",
    noStatusContracts: "No {{status}} contracts.",
  },

  errors: {
    unexpectedLoadingError:
      "An unexpected error occurred while loading recurring contracts.",
  },
};