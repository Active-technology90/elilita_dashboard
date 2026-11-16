export default {
  // ─── Route / distance / ETA ────────────────────────────
  route: {
    distanceUnavailable: "Distance unavailable",
    etaUnavailable: "ETA unavailable",
    lessThanMinute: "< 1 min",
    approxMinutes: "~{{count}} min",
    approxHoursMinutes: "~{{hours}}h {{minutes}}m",
    meters: "{{count}} m",
    kilometers: "{{count}} km",
    emDash: "—",
  },

  // ─── Vehicle types ────────────────────────────────────
  vehicle: {
    motorcycle: "Motorcycle",
    car: "Car",
    bicycle: "Bicycle",
    van: "Van",
    foot: "On Foot",
    generic: "Vehicle",
  },

  // ─── Popups (map marker bubble HTML) ──────────────────
  popup: {
    companyLocation: "Company Location",
    customerLocation: "Customer Location",
    orderPlural: "{{count}} orders",
    orderSingular: "{{count}} order",
    addressLabel: "📍 Address:",
    phoneLabel: "📞 Phone:",
    coordsLabel: "🌍 Coordinates:",
    orderLabel: "Order #{{id}}",
    live: "Live",
    liveWithOrders: "🟢 Live · {{count}} order(s)",
    callNamed: "📞 Call {{name}}",
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

  // ─── Addresses / recipients ──────────────────────────
  address: {
    notAvailable: "Address not available",
    pickupUnavailable: "Pickup address unavailable",
    deliveryUnavailable: "Delivery address unavailable",
  },
  recipients: {
    fallback: "Recipient",
    unassigned: "Unassigned",
    pickupFallback: "Pickup Location",
    unknownCompany: "Company",
  },

  // ─── Header / sidebar ─────────────────────────────────
  header: {
    title: "Live Tracking",
    dispatchAssignment: "Dispatch assignment",
    ready: "READY",
    blocked: "BLOCKED",
    orderNumber: "Order #{{id}}",
    liveBadge: "Live",
    collapseSidebar: "Collapse sidebar",
    collapseAria: "Collapse delivery person assignment sidebar",
  },

  // ─── Order route panel ────────────────────────────────
  orderRoute: {
    title: "Order route",
    subtitle: "Delivery Person → Company → Customer",
    toPickup: "To pickup",
    pickupToCustomer: "Pickup → customer",
    totalEta: "Total ETA",
    stepDriver: "Delivery Person",
    stepCompany: "Company / pickup",
    stepCustomer: "Customer / delivery",
    chooseDriver: "Choose a live delivery person",
    realtimeGps: "Realtime GPS",
    liveGpsRequired: "Live GPS required",
  },

  // ─── Driver filters & sorting ─────────────────────────
  sidebar: {
    filters: "Filters",
    allDrivers: "All drivers",
    inHouse: "In-House",
    thirdParty: "Third-Party",
    searchDrivers: "Search drivers...",
    driversCount_one: "{{count}} driver",
    driversCount_other: "{{count}} drivers",
    liveCount: "{{count}} live",
    outOfBoundsCount: "{{count}} outside Addis",
    noDrivers: "No delivery personnel available",
    noMatchingDrivers: "No delivery personnel match your filters",
    loadingDrivers: "Loading delivery personnel...",
    driverTools: "Driver tools",
    driverToolsAria: "Toggle driver tools",
    collapseAria: "Collapse driver tools panel",
  },

  sort: {
    label: "Sort by",
    recommended: "Recommended",
    nearestPickup: "Nearest pickup",
    fastestEta: "Fastest ETA",
    highestRated: "Highest rated",
  },

  // ─── Driver card ──────────────────────────────────────
  driverCard: {
    recommendedBadge: "Best",
    outsideBadge: "Outside",
    inHouseBadge: "In-house",
    thirdPartyBadge: "3PL",
    rating: "{{rating}} ★ ({{count}})",
    activeOrders: "{{count}} active",
    batchable: "Batchable",
    selectBtn: "Select",
    selectedBtn: "Selected",
    outOfBoundsBtn: "Not assignable",
    call: "Call",
    driverId: "ID {{id}}",
  },

  // ─── Actions / confirm panel ──────────────────────────
  actions: {
    assignDriver: "Assign Driver",
    assigning: "Assigning...",
    confirmAssignment: "Confirm Assignment",
    cancel: "Cancel",
    close: "Close",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    fitAll: "Fit all markers",
    followDriver: "Follow driver",
    stopFollow: "Stop following",
    toggleSidebar: "Toggle sidebar",
    mapStreet: "Street",
    mapSatellite: "Satellite",
    selectDriver: "Select this driver",
  },

  // ─── Confirm dialog ───────────────────────────────────
  confirm: {
    title: "Confirm assignment",
    subtitle: "You are about to assign this delivery person:",
    driverName: "Driver name",
    distanceToPickup: "Distance to pickup",
    pickupToCustomer: "Pickup to customer",
    totalDistance: "Total distance",
    totalEta: "Total ETA",
    warning: "Once assigned, the delivery person will be notified immediately.",
    confirmButton: "Confirm Assignment",
    cancelButton: "Cancel",
  },

  // ─── Map style / attribution ──────────────────────────
  mapStyle: {
    street: "Street view",
    satellite: "Satellite",
    attributionOSM: "© OpenStreetMap contributors",
    attributionEsri: "© Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },

  // ─── Stats strip ──────────────────────────────────────
  stats: {
    liveVehicles: "Live vehicles",
    deliveriesToday: "Deliveries today",
    onTime: "On-time delivery",
    inHouse: "In-house",
    thirdParty: "3rd-party",
  },

  // ─── Empty / error states ─────────────────────────────
  empty: {
    noLiveDeliveries: "No live deliveries",
    noDrivers: "No delivery personnel available",
    noSearchResults: "No results match your search",
    selectOrderHint: "Select an order to view live tracking",
  },

  errors: {
    companyNotFound: "Company information not found",
    driversLoadFailed: "Failed to load available delivery personnel",
    notLive: "This delivery person is not currently live. Please select a live delivery person.",
    outsideAddis: "{{name}} is outside Addis Ababa and cannot be assigned to city deliveries.",
    assignBlocked: "Unable to assign delivery person",
    driverMissing: "Selected delivery person not found. Please refresh delivery personnel.",
    assignFailed: "Failed to assign delivery person. They may no longer be available.",
    sessionExpired: "Your session has expired.",
    loadFailed: "Failed to load",
  },

  success: {
    assigned: "Delivery person assigned successfully",
    refreshed: "Delivery personnel refreshed",
  },

  toasts: {
    networkError: "Network error. Please check your connection.",
  },
}