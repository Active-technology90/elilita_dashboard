export default {
  deliveryMap: {
    // ─── Route / distance / ETA ────────────────────────────
    route: {
      distanceUnavailable: "Distance unavailable",
      etaUnavailable: "ETA unavailable",
      lessThanMinute: "< 1 min",
      approxMinutes: "~{{count}} min",
      approxHoursMinutes: "~{{hours}}h {{minutes}}m",
      meters: "{{count}} m",
      kilometers: "{{value}} km",   // ← fixed: was {{count}}
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
      // Identity / type labels
      typeInHouse: "In-House",
      typeThirdParty: "3PL",
      statusLive: "Live",
      statusViewOnly: "View only",
      statusOutsideAddis: "Outside Addis",
      markerOutside: "OUTSIDE",
      markerBest: "BEST",
      markerPickup: "Pickup",
      stops: "{{count}} stops",

      // Location titles
      companyLocation: "Company Location",
      customerLocation: "Customer Location",
      orderSingular: "{{count}} order",
      orderPlural: "{{count}} orders",

      // Field labels
      addressLabel: "📍 Address:",
      phoneLabel: "📞 Phone:",
      coordsLabel: "🌍 Coordinates:",
      orderLabel: "Order #{{id}}",

      // Status / state
      live: "Live",
      liveWithOrders: "🟢 Live · {{count}} order",
      liveWithOrders_plural: "🟢 Live · {{count}} orders",
      callNamed: "📞 Call {{name}}",
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
      distanceSuffix: "{{value}} km",
    },

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

    // ─── Header ───────────────────────────────────────────
    header: {
      toggleSidebar: "Toggle sidebar",
      openSidebarAria: "Open sidebar",
      closeSidebarAria: "Close sidebar",
      assignmentMapTitle: "Delivery Person Assignment Map",
      liveMapTitle: "Live Delivery Map",
      realtime: "REALTIME",
      apiSync: "API SYNC",
      orderSubtitle: "Order #{{id}} · {{name}}",
      liveVehiclesSubtitle: "{{count}} vehicle currently live",
      liveVehiclesSubtitle_plural: "{{count}} vehicles currently live",
      liveVehiclesSubtitle_other: "{{count}} vehicles currently live",
      lastSync: "Last sync",
      waiting: "Waiting...",
      refreshAria: "Refresh delivery data",
      closeAria: "Close map",

      // Preserved from the short version
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

    // ─── Actions ──────────────────────────────────────────
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
      // Merged from both duplicate blocks
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

      // From the second confirm object
      outsideAddisBadge: "OUTSIDE ADDIS",
      bestMatchBadge: "BEST MATCH",
      outsideServiceAreaTitle: "Outside service area",
      outsideServiceAreaDescription:
        "This delivery person is outside Addis Ababa and cannot be assigned to city deliveries.",
      destinationLabel: "Destination",
      routeLabel: "Route",
      pickupPrefix: "Pickup {{distance}}",
      customerLegUnavailable: "customer leg unavailable",
      directSuffix: "(direct)",
      routeUnavailable: "Route unavailable",
      cancel: "Cancel",
      assigning: "Assigning...",
      assignAction: "Assign delivery person",
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

    // ─── Errors ───────────────────────────────────────────
    errors: {
      ordersLoadFailed: "Failed to load",
      companyNotFound: "Company information not found",
      driversLoadFailed: "Failed to load available delivery personnel",
      driverNotLive:
        "This delivery person is not currently live. Please select a live delivery person.",
      driverOutsideAddisToast:
        "{{name}} is outside Addis Ababa and cannot be assigned to city deliveries.",
      driverNotFound:
        "Selected delivery person not found. Please refresh delivery personnel.",
      assignSuccess: "Delivery person assigned successfully",
      assignFailed: "Unable to assign delivery person",
      assignFailedGeneric:
        "Failed to assign delivery person. They may no longer be available.",

      // Preserved from the second errors block
      notLive:
        "This delivery person is not currently live. Please select a live delivery person.",
      outsideAddis:
        "{{name}} is outside Addis Ababa and cannot be assigned to city deliveries.",
      assignBlocked: "Unable to assign delivery person",
      driverMissing:
        "Selected delivery person not found. Please refresh delivery personnel.",
      assignFailedOld:
        "Failed to assign delivery person. They may no longer be available.",
      sessionExpired: "Your session has expired.",
      loadFailed: "Failed to load",
    },

    // ─── Success / toasts ─────────────────────────────────
    success: {
      assigned: "Delivery person assigned successfully",
      refreshed: "Delivery personnel refreshed",
    },

    toasts: {
      networkError: "Network error. Please check your connection.",
    },

    // ─── Tracking sidebar ─────────────────────────────────
    tracking: {
      dispatchCenter: "Dispatch center",
      liveDeliveryPersonnel: "Live delivery personnel",
      personnelAndDeliverySummary:
        "{{drivers}} delivery personnel · {{deliveries}} active deliveries",
      realtime: "Realtime",
      channelsCount: "{{count}} channel",
      channelsCount_plural: "{{count}} channels",
      channelsCount_other: "{{count}} channels",
      filterAll: "All",
      loadingPersonnel: "Loading live delivery personnel...",
      noActiveDeliveries: "No active deliveries",
      noActiveDeliveriesDesc:
        "Delivery personnel will appear here when a delivery moves into live tracking.",
      driverAriaLabel: "Delivery Person {{name}}, {{count}} orders",
      destinationCount: "{{count}} destination",
      destinationCount_plural: "{{count}} destinations",
      destinationCount_other: "{{count}} destinations",
      liveBadge: "LIVE",
      speedLabel: "Speed",
      speedValue: "{{value}} km/h",
      rangeLabel: "Range",
      stopsLabel: "Stops",
      rangeSingle: "{{value}} km",
      rangeMulti: "{{min}}–{{max}} km",
      currentDelivery: "Current delivery",
      currentDeliveryValue: "#{{id}} · {{name}}",
    },

    orderUnavailable: {
      title: "Order data unavailable",
      description:
        "Unable to load destination or pickup location for this order. Close and reopen the map.",
      closeMap: "Close map",
    },

    // ─── Driver selection sidebar ─────────────────────────
    selection: {
      dispatchAssignment: "Dispatch assignment",
      ready: "READY",
      blocked: "BLOCKED",
      orderLabel: "Order #{{id}}",
      collapseSidebarAria: "Collapse delivery person assignment sidebar",
      collapseSidebarTitle: "Collapse sidebar",
      expandSidebarAria: "Expand sidebar",
      expandSidebarTitle: "Expand sidebar",

      orderRoute: "Order route",
      orderRouteSummary: "Delivery Person → Company → Customer",
      toPickup: "To pickup",
      pickupToCustomer: "Pickup → customer",
      totalEta: "Total ETA",

      stepDriver: "Delivery Person",
      stepPickup: "Company / pickup",
      stepDelivery: "Customer / delivery",
      chooseDriver: "Choose a live delivery person",
      realtimeGps: "Realtime GPS",
      liveGpsRequired: "Live GPS required",
      pickupAddressUnavailable: "Pickup address unavailable",
      deliveryAddressUnavailable: "Delivery address unavailable",

      outsideAddisBanner:
        "{{count}} driver outside Addis Ababa — not assignable for city deliveries.",
      outsideAddisBanner_plural:
        "{{count}} drivers outside Addis Ababa — not assignable for city deliveries.",
      outsideAddisBanner_other:
        "{{count}} drivers outside Addis Ababa — not assignable for city deliveries.",

      findFilterPersonnel: "Find & filter delivery personnel",
      personnelCounts:
        "{{total}} total · {{live}} live · {{viewOnly}} view only",
      searchPlaceholder: "Search delivery person, phone, vehicle...",
      filterAll: "All",
      rankLabel: "Rank",
      sortRecommended: "Recommended",
      sortNearestPickup: "Nearest pickup",
      sortFastestEta: "Fastest total ETA",
      sortHighestRated: "Highest rated",
      liveAssignable: "Live assignable",

      comparingPersonnel: "Comparing delivery personnel...",
      noAvailablePersonnel: "No available delivery personnel",
      noMatchFilter: "No delivery personnel match the current filter.",
      assignmentBlocked: "Assignment is blocked for this order.",

      outsideAddisBadge: "OUTSIDE ADDIS",
      bestBadge: "BEST",
      statusViewShort: "VIEW",
      statusOffline: "OFFLINE",
      tripTooltip: "Trip = Delivery Person → pickup → customer",
      tripLabel: "Trip",
      pickupLabel: "Pickup",
      pickupEta: "Pickup ETA",
      deliveryPersonFallback: "Delivery Person #{{number}}",
      outsideAddisSuffix: "· outside Addis Ababa",
      realtimeGpsRequiredSuffix: "· realtime GPS required",

      assigned: "Assigned",
      confirm: "Confirm",
      realtimeGpsRequiredTitle:
        "Realtime GPS is required before this delivery person can be assigned",
      outsideAddisTitle: "This delivery person is outside Addis Ababa",
      viewOnly: "View only",
      outsideCity: "Outside city",
      assignBest: "Assign best",
      select: "Select",

      availablePersonnelTitle: "{{count}} available delivery personnel",
      realtimeConnection: "Realtime connection",
    },

    // ─── Map overlays ─────────────────────────────────────
    overlay: {
      dispatchMap: "Dispatch map",
      dispatchMapSubtitleSelection: "Live delivery person availability",
      dispatchMapSubtitleTracking: "Realtime fleet positions",
      legendPickup: "Pickup",
      legendRecipient: "Recipient",
      legendLiveDriver: "Live delivery person",
      assignmentRoute: "Assignment route",
      assignmentRouteSummary: "Delivery Person → {{pickup}} → {{customer}}",
      pickupLabel: "Pickup",
      customerLabel: "Customer",
      addressUnavailable: "Address unavailable",
      liveUpdatesOn: "Live updates on",
      realtimeReconnecting: "Realtime reconnecting",
      loadingMapSelection: "Loading delivery map",
      loadingMapTracking: "Connecting to live deliveries",
      preparingMapData: "Preparing map, delivery personnel and route data...",
      unableToLoadMap: "Unable to load delivery map",
      tryAgain: "Try again",
      assignmentUnavailable: "Delivery person assignment unavailable",
      noActiveDeliveries: "No active deliveries",
      noActiveDeliveriesDesc:
        "Live vehicles will appear automatically when a delivery moves out for delivery.",
    },

    // ─── Dispatch / status messages ───────────────────────
    dispatch: {
      orderNotFound: "Order not found",
      blockedByOrderStatus:
        "Order status is {{status}}. Delivery person assignment is unavailable.",
      blockedByDeliveryStatus:
        "Delivery status is {{status}}. Delivery person assignment is unavailable.",
      vendorCancelled: "One or more vendor deliveries are cancelled or rejected.",
    },

    // ─── Map controls ─────────────────────────────────────
    controls: {
      streetMap: "Street map",
      satelliteMap: "Satellite map",
      togglePickupMarker: "Toggle pickup marker",
      pickupMarker: "Pickup marker",
      toggleDestinationMarker: "Toggle destination marker",
      destinationMarker: "Destination marker",
      toggleRecipientMarkers: "Toggle recipient markers",
      recipientMarkers: "Recipient markers",
      fitAllMarkers: "Fit all markers",
      followDriver: "Follow selected delivery person",
      followSelectedDriver: "Follow selected delivery person",
      stopFollowingDriver: "Stop following delivery person",
    },
  },
};