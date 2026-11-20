export default {
  header: {
    title: "Optional Add-ons & Upgrades",
    descriptionWithOffering:
      'Manage add-ons for "{{offeringTitle}}". Customers can select these during booking.',
    description:
      "Allow customers to customize and upgrade their booking with extras.",
    addExtra: "Add Extra",
  },
  form: {
    editTitle: "Edit Add-on",
    newTitle: "New Add-on / Extra",
    name: "Name",
    namePlaceholder: "e.g. Beard Grooming & Hot Towel",
    nameAm: "Name (Amharic)",
    nameAmPlaceholder: "e.g. ፂም ማስተካከል",
    price: "Price (ETB)",
    pricePlaceholder: "100.00",
    duration: "Extra Duration (minutes)",
    durationPlaceholder: "15",
    minutesShort: "min",
    active: "Active & Available for Booking",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    create: "Create Add-on",
    validation: {
      nameRequired: "Add-on name is required.",
      invalidPrice: "Price must be a valid non-negative number.",
    },
  },
  list: {
    loading: "Loading add-ons...",
    emptyTitle: "No add-ons yet",
    emptyDescription:
      "Add-ons are optional extras customers can attach to this service (e.g. special oils, extended time, VIP perks).",
    addFirst: "Add First Add-on",
  },
  status: {
    active: "Active",
    inactive: "Inactive",
    activate: "Click to activate",
    deactivate: "Click to deactivate",
  },
  actions: {
    edit: "Edit add-on",
    delete: "Delete add-on",
  },
  toasts: {
    loadFailed: "Failed to load service add-ons",
    activated: "Add-on activated",
    deactivated: "Add-on deactivated",
    statusFailed: "Failed to update add-on status",
    updated: "Add-on updated",
    created: "Add-on created",
    saveFailed: "Failed to save add-on",
    deleted: "Add-on deleted",
    deleteFailed: "Failed to delete add-on",
  },
};
