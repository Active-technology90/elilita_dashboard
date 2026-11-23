export default {
  etb:"ETB",
  companyOrders: {
    pageTitle: "All Orders",
    pageDescription: {
      admin: "View and manage orders across all companies.",
      company: "View and manage orders for the selected company.",
      noCompany: "Select a company to view its orders.",
    },
    viewOnly: "View Only",
    searchPlaceholder: "Search by order ID, customer name, or company...",
    exportReport: "Export Report",
    exports: "Export",
    liveTracking: "Live Tracking",
    tracking: "Tracking",
    exportTooltip: "Export daily / weekly / monthly / yearly order reports",
    trackingTooltip: "Open tracking map",
    empty: "No vendor orders found",

    filters: {
      title: "Filters",
      applyFilters: "Apply Filters",
      clearAll: "Clear all",
      clear: "Clear",
      refreshOrders: "Refresh orders",
      searchPlaceholder: "Search by order ID, customer, or company...",
      orderStatusPlaceholder: "Order status",
      deliveryStatusPlaceholder: "Delivery status",
      paymentMethodPlaceholder: "Payment method",
      companyPlaceholder: "Company",
      orderStatus: {
        all: "All order statuses",
        pending: "Pending",
        contacted: "Confirmed",
        processing: "Prepared",
        shipped: "In Transit",
        fulfilled: "Delivered",
        paymentRejected: "Payment Rejected",
        cancelled: "Cancelled",
      },
      deliveryStatus: {
        all: "All delivery statuses",
        pending: "Assigned",
        accepted: "Accepted",
        pickedUp: "Picked Up",
        outForDelivery: "In Transit",
        delivered: "Completed",
        failed: "Failed",
        expired:"Expired"
      },
      paymentMethod: {
        all: "All Payment Method",
        bankTransfer: "Bank Transfer",
        chapa: "Chapa",
        cod: "Cash on Delivery",
        telebirr: "Telebirr",
        arifpay: "ArifPay (Direct)",
      },
      company: {
        all: "All companies",
      },
    },

    // ✅ Export modal translations — now correctly nested INSIDE companyOrders
    export: {
      title: "Export Orders",
      description: "Download {{company}} as CSV",
      allCompanies: "all companies",
      closeDialog: "Close export dialog",
      periodLabel: "Export Period",
      periodPlaceholder: "Select period",
      reset: "Reset",
      startDate: "Start Date",
      endDate: "End Date",
      dateRangeInverted: "Start date must be before end date.",
      dateRangeIncomplete:
        "Please select both start and end dates for custom range.",
      orderStatus: "Order Status",
      paymentMethod: "Payment Method",
      optional: "optional",
      filterCount: "{{count}} filter",
      filterCount_plural: "{{count}} filters",
      noOrders: "No orders found for the selected period.",
      readyToExport: "Ready to export",
      cancel: "Cancel",
      exporting: "Exporting...",
      exportButton: "Export {{count}} record",
      exportButton_plural: "Export {{count}} records",
      successMessage: "Exported {{count}} order record ({{period}})",
      successMessage_plural: "Exported {{count}} order records ({{period}})",
      exportFailed: "Failed to export orders. Please try again.",
      period: {
        daily: "Daily (Today)",
        weekly: "Weekly (Last 7 Days)",
        monthly: "Monthly (This Month)",
        yearly: "Yearly (This Year)",
        custom: "Custom Date Range",
        all: "All Time",
      },
      status: {
        all: "All statuses",
        pending: "Pending",
        contacted: "Confirmed",
        processing: "Prepared",
        fulfilled: "Delivered",
        shipped: "In Transit",
        paymentRejected: "Payment Rejected",
        cancelled: "Cancelled",
      },
      payment: {
        all: "All payment methods",
        bankTransfer: "Bank Transfer",
        chapa: "Chapa",
        cod: "Cash on Delivery",
        telebirr: "Telebirr",
        arifpay: "ArifPay (Direct)",
      },
      stats: {
        records: "Records",
        delivered: "Delivered",
        totalAmount: "Total Amount",
        pending: "Pending",
      },
    },

    messages: {
      loginRequired: "Please log in to view orders",
      sessionExpired: "Your session has expired.",
      loadFailed: "Failed to load orders",
    },
    common: {
      time: {
        today: "Today",
        yesterday: "Yesterday",
      },
    },
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Last 7 Days",
    unknownCompany: "Unknown",
    manage: "Manage",
    allCompanies: "All Companies",
    table: {
      columns: {
        orderId: "Order ID",
        company: "Company",
        amount: "Amount",
        paymentMethod: "Payment Method",
        orderStatus: "Order Status",
        deliveryStatus: "Delivery Status",
        dateTime: "Date & Time",
        actions: "Actions",
      },
    },
    orderStatus: {
      all: "All Order Status",
      pending: "Pending",
      contacted: "Confirmed",
      processing: "Prepared",
      fulfilled: "Delivered",
      shipped: "In Transit",
      paymentRejected: "Payment Rejected",
      cancelled: "Cancelled",
    },
    deliveryStatusFilter: {
      all: "All Delivery Status",
      pending: "Assigned",
      accepted: "Accepted",
      pickedUp: "Picked Up",
      outForDelivery: "In Transit",
      delivered: "Completed",
      failed: "Failed",
    },
    paymentMethod: {
      all: "All Payment Method",
      bankTransfer: "Bank Transfer",
      chapa: "Chapa",
      cod: "Cash on Delivery",
      telebirr: "Telebirr",
      arifpay: "ArifPay (Direct)",
    },
    pageSize: {
      label: "{{count}} / page",
      "5": "5 / page",
      "10": "10 / page",
      "15": "15 / page",
      "30": "30 / page",
      "60": "60 / page",
    },
    statusBadge: {
      processing: "Prepared",
      shipped: "In Transit",
      fulfilled: "Delivered",
      contacted: "Confirmed",
      pending: "pending",
      out_for_delivery: "In Transit",
      delivered: "Completed",
      self_pickup: "Self Pickup",
      takeaway: "Takeaway",
      onspot: "Onspot",
      no_assigned: "No Assigned",
      confirmed: "Confirmed",              // ✅ add
  cancelled: "Cancel",               // ✅ add
  payment_rejected: "Payment Rejected", // ✅ add
  expired:"Expired",
      disputed: "Disputed",
    replacement_in_progress: "Redelivery Required",
    refunded: "Refunded",
 
    declined: "Declined",
    },
  },

  deliveryMap: {
    route: {
      distanceUnavailable: "Distance unavailable",
      etaUnavailable: "ETA unavailable",
      lessThanMinute: "< 1 min",
      approxMinutes: "~{{count}} min",
      approxHoursMinutes: "~{{hours}}h {{minutes}}m",
    },
    vehicle: {
      motorcycle: "Motorcycle",
      car: "Car",
      bicycle: "Bicycle",
      van: "Van",
      foot: "On Foot",
      generic: "Vehicle",
    },
    popup: {
      companyLocation: "Company Location",
      customerLocation: "Customer Location",
      orderSingular: "{{count}} order",
      orderPlural: "{{count}} orders",
      addressLabel: "📍 Address:",
      phoneLabel: "📞 Phone:",
      coordsLabel: "🌍 Coordinates:",
      orderLabel: "Order #{{id}}",
      live: "Live",
      liveWithOrders: "Live · {{count}} order(s)",
      callDriver: "📞 Call {{name}}",
      atStore: "🏬 At Store ({{count}} orders - Batchable)",
      enRoute: "🚗 En Route ({{count}} active)",
      available: "🟢 Available",
      outsideAddis: "⚠️ OUTSIDE ADDIS ABABA",
      notAssignable: "Not assignable",
      recommended: "★ RECOMMENDED DELIVERY PERSON",
      bestPickupEta: "Best pickup ETA",
      realtimeGps: "🟢 Realtime GPS",
      lastKnown: "🕒 Last known location",
      availableLocation: "📡 Available location",
      dispatchRoute: "Dispatch route",
      driverToPickup: "Delivery Person → Pickup",
      pickupToCustomer: "Pickup → Customer",
      totalTrip: "Total trip",
      locationUnavailable: "Location unavailable",
      deliveryDestination: "Delivery destination",
      outsideServiceArea: "Outside service area",
      callNamed: "Call {{name}}",
      markerPickup: "Pickup",
      markerOutside: "OUTSIDE",
      markerBest: "BEST",
      statusOutsideAddis: "Outside Addis",
      statusLive: "Live",
      statusViewOnly: "View only",
      typeInHouse: "In-House",
      typeThirdParty: "3PL",
      stops: "{{count}} stops",
    },
    address: {
      notAvailable: "Address not available",
    },
    recipients: {
      fallback: "Recipient",
      unassigned: "Unassigned",
      pickupFallback: "Pickup Location",
    },
    errors: {
      companyNotFound: "Company information not found",
      driversLoadFailed: "Failed to load available delivery personnel",
    },
  },

  // ─────────────────────────────────────────────────────────────
  // DELIVERY CARD (used by VendorOrderDetailModal)
  // ─────────────────────────────────────────────────────────────
  deliveryCard: {
    title: "Delivery Details",

    // ── Summary view ──
    assignedPerson: "Assigned delivery person",
    assignedPersonSubtitle: "Current delivery assignment and contact details",
    companyDeliveryTeam: "Company delivery team",
    inHouse: "In-house",
    threePL: "3PL",
    noPhone: "No phone",
    liveTracking: "Live tracking",
    viewMap: "View map",
    change: "Change",
    deliveryIssue: "Delivery issue",
    dispatchHistory: "Dispatch & Reassignment History",
    attemptSingular: "attempt",
    attemptPlural: "attempts",
    noDeliveryPerson: "No delivery person assigned",
    orderNeedsReassignment: "Order Needs Reassignment",
    reassignHint:
      "Previous delivery person attempt was declined or expired. Choose an available delivery person to reassign this order.",
    assignHint:
      "Choose an available in-house delivery person or logistics partner to continue this delivery.",
    reassignPerson: "Reassign delivery person",
    assignPerson: "Assign delivery person",
    viewDeliveryMap: "View delivery map",
    previousAttempts: "Previous Dispatch Attempts",

    // ── Assignment view ──
    assignTitle: "Assign delivery person",
    reassignTitle: "Reassign delivery person",
    assignSubtitle: "Choose the best available driver for this order",
    listToggle: "List",
    mapToggle: "Map",
    mapPreviewTitle: "Delivery route map",
    mapPreviewDescription:
      "Open the full map to review the order location, live delivery personnel and route context.",
    openFullMap: "Open full map",

    // ── Search / sort ──
    searchPlaceholder: "Search delivery…",
    searchAria: "Search delivery person",
    sortAria: "Sort",
    sortDistanceNearest: "Distance · Nearest",
    sortDistanceFarthest: "Distance · Farthest",
    sortRatingHighest: "Rating · Highest",
    sortNameAsc: "Name · A → Z",
    sortNameDesc: "Name · Z → A",

    // ── Filters ──
    filters: "Filters",
    filterTitle: "Filter delivery person",
    filterSubtitle: "Refine available delivery persons",
    deliveryPersonLabel: "Delivery person",
    vehicleTypeLabel: "Vehicle type",
    allDeliveryPersons: "All delivery persons",
    allDeliveryPersonsDesc: "Every available delivery person",
    inHouseOption: "In-house",
    inHouseOptionDesc: "Your company delivery persons",
    thirdPartyOption: "3PL Partners",
    thirdPartyOptionDesc: "Third-party logistics",
    allVehicles: "All vehicles",
    motorcycle: "Motorcycle",
    car: "Car",
    bicycle: "Bicycle",
    van: "Van",
    onFoot: "On Foot",
    clearAll: "Clear all",
    reset: "Reset",
    closeFilters: "Close filters",
    removeTypeFilter: "Remove type filter",
    removeVehicleFilter: "Remove vehicle filter",
    showCountOne: "Show {{count}} delivery person",
    showCountMany: "Show {{count}} delivery persons",

    // ── Section header + list ──
    availablePersons: "Available delivery persons",
    inHouseThirdPartySummary:
      "{{inHouse}} in-house · {{thirdParty}} third-party",
    loadingPersons: "Loading delivery persons…",
    noPersonsFound: "No delivery persons found",
    noPersonsFilterHint: "Try changing the search or filters.",
    noPersonsAvailable: "There are no available delivery persons right now.",
    bestMatch: "Best match",
    bestMatchTooltip: "Closest available match",
    outsideAddis: "Outside Addis",
    outsideAddisTooltip:
      "This driver is outside Addis Ababa and cannot be assigned",
    inHouseShort: "In-house",
    threePLPartner: "3PL partner",
    live: "Live",
    atStore: "🏬 At Store",
    enRoute: "🚗 En Route",
    available: "● Available",
    activeOrders: "{{count}} active",
    noReviews: "No reviews",
    calculating: "Calculating…",
    distanceUnavailable: "Distance unavailable",

    // ── Pagination ──
    pageOf: "Page {{current}} of {{total}}",
    previous: "Previous",
    next: "Next",

    // ── Sticky action bar ──
    selected: "{{name}} selected",
    outsideAddisCannotAssign: "Outside Addis Ababa — cannot be assigned",
    selectDriverHint: "Select a driver to continue.",
    cancel: "Cancel",
    assigning: "Assigning…",
    outsideAddisShort: "Outside Addis",
    assignButton: "Assign",
    reassignButton: "Reassign",
    outsideAddisTitle: "Selected driver is outside Addis Ababa",

    // ── Toasts ──
    assignSuccess: "Delivery person assigned successfully",
    assignEnRouteSuccess:
      "Offer sent to en-route delivery person (45s window to respond)",
    assignAtVendorSuccess:
      "Order batched with delivery person currently at store!",
    assignFailed: "Failed to assign delivery person",
    loadStaffFailed: "Failed to load delivery personnel",
    outsideAddisToast:
      "{{name}} is outside Addis Ababa and cannot be assigned to city deliveries.",

    // ── Fullscreen image ──
    imageAria: "Delivery person image",
    closeImageAria: "Close image preview",
    clickToClose: "Click anywhere to close",
    expiredTimeout: "Expired (Timeout)",
    expiredShort: "Expired",
    selectAria: "Select",
    deselectAria: "Deselect",

    // Already existed but needed for getVehicleName default
    vehicle: "Vehicle",
  },

  receiptCard: {
    paymentInformation: "Payment Information",
    verifiedBy: "Verified by",
    codStatusUnpaid: "Unpaid",
    codStatusPaid: "Paid",

    // COD
    codTitle: "Cash on Delivery",
    paymentCollected: "Payment Collected",
    codHintOnspot:
      "Confirm physical collection of cash for this on-spot table order.",
    codHintPickup:
      "Confirm physical collection of cash once the customer picks up the items.",
    codHintDelivery:
      "Confirm physical collection of cash once the delivery person delivers the items and returns with the cash.",
    codDisabledPrepared:
      "Payment collection is disabled until the order is Prepared.",
    codDisabledDelivered:
      "Payment collection is disabled until the order is Delivered.",
    confirmPaymentCollected: "Confirm Payment Collected",
    codConfirmTitle: "Confirm COD Payment",
    codConfirmDescription:
      "Are you sure you have collected the payment for this order?",
    codConfirmYes: "Yes, Confirm Payment",
    codConfirmSuccess: "COD payment confirmed successfully",
    codConfirmFailed: "Failed to confirm COD payment",

    // Receipt card
    paymentReceipt: "Payment Receipt",
    waitingForUpload: "Waiting for customer to upload receipt...",
    bankDetails: "Bank Details",
    notSpecified: "Not Specified",
    addReviewNotes: "Add review notes...",
    approve: "Approve",
    approving: "Approving...",
    reject: "Reject",
    rejecting: "Rejecting...",
    receiptHistory: "Receipt History ({{count}})",
    unknownBank: "Unknown Bank",
    remark: "Remark:",
    processing: "Processing...",
    confirmAction: "Confirm Action",
    approveTitle: "Approve Receipt",
    rejectTitle: "Reject Receipt",
    confirmDescription:
      "This action will notify the customer and update the order workflow. Are you sure?",
    approvedSuccess: "Receipt approved",
    rejectedSuccess: "Receipt rejected",
    reviewFailed: "Review failed",

    // Aria / alt
    receiptAlt: "Receipt",
    priorReceiptAlt: "Prior Receipt",
    receiptFullAlt: "Receipt Full",
    closePreviewAria: "Close preview",
  },

  preparationCard: {
    // Titles
    orderPreparation: "Order Preparation",
    replacementPreparation: "Replacement Preparation",

    // Buttons
    markPrepared: "Mark as Prepared",
    markReplacementPrepared: "Mark Replacement as Prepared",
    marking: "Marking...",
    outOfStockRequestRefund: "Out of Stock / Request Refund",
    cannotReplaceRequestRefund: "Cannot Replace / Request Refund",
    submitRefundRequest: "Submit Refund Request",
    submitting: "Submitting...",
    cancel: "Cancel",

    // Confirmation modal
    markOrderTitle: "Mark Order as Prepared",
    markReplacementTitle: "Mark Replacement as Prepared",
    orderDescription:
      "Are you sure you want to mark this order as prepared and ready for dispatch?",
    replacementDescription:
      "Are you sure the replacement items are prepared and ready for dispatch?",
    yesPrepared: "Yes, Prepared",

    // Refund modal
    requestRefundTitle: "Request Customer Refund",
    requestRefundDescription:
      "If items are unavailable or cannot be replaced, submit a refund request. A Superadmin will review and disburse funds back to the customer.",
    reasonLabel: "Reason",
    reasonOutOfStock: "Item Out of Stock",
    reasonDamaged: "Ingredients/Items Damaged",
    reasonOther: "Store Closed / Cannot Fulfill",
    explanationLabel: "Explanation for Customer & Admin",
    explanationPlaceholder:
      "e.g. Current batch of item is unavailable. Requesting refund for customer.",

    // Toasts
    orderPreparedSuccess: "Order marked as Prepared!",
    replacementPreparedSuccess: "Replacement marked as Prepared!",
    prepareFailed: "Failed to prepare order",
    provideReason: "Please provide a reason or note for the customer.",
    refundSentSuccess: "Refund request sent to Superadmin for approval.",
    refundSubmitFailed: "Failed to submit refund request",
  },

  statusBadge: {
    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",
    contacted: "Confirmed",
    pending: "Pending",
    out_for_delivery: "In Transit",
    delivered: "Completed",
    self_pickup: "Self Pickup",
    takeaway: "Takeaway",
    onspot: "Onspot",
    no_assigned: "No Assigned",
    disputed: "Disputed",
    replacement_in_progress: "Redelivery Required",
    refunded: "Refunded",
    expired: "Offer Expired (Timeout)",
    declined: "Declined",
  },

  vendorOrderDetail: {
    // Header
    orderNumber: "Order #{{id}}-{{masterId}}",
    unassigned: "Unassigned",
    assignedDeliveryPersonFallback: "Assigned delivery person",

    // Redelivery / dispute
    redeliveryApprovedNote:
      "Redelivery approved by store/admin for replacement items.",
    redeliveryApprovedToast:
      "Redelivery approved! Please prepare replacement items.",
    redeliveryFailed: "Failed to approve redelivery",
    approving: "Approving...",
    approveRedelivery: "Approve Redelivery",
    replacementInProgressTitle: "Replacement In Progress",
    replacementInProgressDescription:
      "Customer reported an issue and redelivery was approved. Please prepare the replacement items and assign a delivery person.",
    disputedTitle: "Order Issue Reported (Disputed)",
    disputeReason: "Reason: {{reason}} — {{explanation}}",
    disputeFallback:
      "An issue was reported for this order. Please review and authorize replacement redelivery.",
    noAdditionalNote: "No additional note provided",

    // Delivery history audit
    deliveryHistoryTitle: "Delivery History & Past Attempts ({{count}})",
    attemptNumber: "Attempt #{{number}}",
    driverLabel: "Driver:",
    noteLabel: "Note:",

    // Customer profile
    customerProfile: "Customer Profile",
    takeaway: "Takeaway",
    selfPickup: "Self Pickup",
    preOrder: "Pre-order",
    onspot: "Onspot",
    etaLabel: "ETA: {{time}}",
    tableLabel: "Table {{number}}",
    noPhoneOnFile: "No phone number on file",
    customerNameNotProvided: "Customer name not provided — {{detail}}",
    walkInOrder: "walk-in order",

    // Location card
    location: {
      onspotDetails: "Onspot Details",
      takeawayDetails: "Takeaway Details",
      pickupLocation: "Pickup Location",
      shippingDestination: "Shipping Destination",
    },
    storeFallback: "Store",
    pickupAddressUnavailable: "Pickup address unavailable",
    customerLabel: "Customer:",
    recipientName: "Recipient Name:",
    contactLabel: "Contact:",
    recipientPhone: "Recipient Phone:",
    notProvided: "Not provided",
    preOrderAtLabel: "Pre-order At:",
    onspotAtLabel: "Onspot At:",
    takeawayFromLabel: "Takeaway From:",
    pickupFromLabel: "Pickup From:",
    shippingAddress: "Shipping Address:",
    preOrderedLabel: "Pre-ordered",
    forTimeLabel: "for {{time}}",
    noAddressProvided: "No address provided.",
    addressLabel: "Address:",
    storePickupAddressNotConfigured: "Store pickup address not configured",
    shippingAddressNotProvided: "Shipping address not provided",

    // Item list
    itemList: "Item List",
    itemsSingular: "{{count}} ITEM",
    itemsPlural: "{{count}} ITEMS",
    roundLabel: "Round {{number}}",
    skuLabel: "SKU",
    na: "N/A",
    table: {
      description: "Description",
      qty: "Qty",
      unitPrice: "Unit Price",
      total: "Total",
    },

    // Order timeline
    orderTimeline: "Order Timeline",
    stepsCount: "{{count}} steps",
    pendingLabel: "Pending",
    timeline: {
      orderPlaced: "Order Placed",
      paymentApproved: "Payment Approved",
      paymentConfirmed: "Payment Confirmed",
      orderPrepared: "Order Prepared",
      inTransit: "In Transit",
      delivered: "Delivered",
      awaitingPayment: "Awaiting Payment",
      actorCustomer: "Customer",
      actorAdmin: "Admin",
      actorSystem: "System",
      actorWaitingCustomer: "Waiting for customer",
      actorDeliveryPerson: "Delivery Person",
    },

    // Customer order history
    customerOrderHistory: "Customer Order History",
    ordersCount: "{{count}} orders",
    viewAction: "View →",

    // Totals card
    totalAmount: "Total Amount",
    subtotal: "Subtotal",
    vat: "VAT",
    deliveryFee: "Delivery Fee",
    discountFee: "Discount Fee",
  },
};
