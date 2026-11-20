export default {
  filters: {
    title: "Filters",
    clearAll: "Clear all",
    close: "Close filters",
    availability: "Availability",
    all: "All",
    workingToday: "Working today",
    offToday: "Off today",
    onlineStatus: "Online Status",
    online: "Online",
    offline: "Offline",
    serviceAssignment: "Service Assignment",
    assignedServices: "Assigned services",
    unassignedServices: "Unassigned (all services)",
    open: "Open filters",
  },

  bulkDelete: {
    title: "Delete {{count}} specialists?",
    description:
      "This will permanently remove these team members and their assignments.",
    deleteAll: "Delete All",
  },

  actions: {
    cancel: "Cancel",
    switchCompany: "Switch company",
    chooseServiceCompany: "Choose a service company",
    schedule: "Schedule",
    edit: "Edit",
    delete: "Delete",
    addSpecialist: "Add specialist",
    add: "Add",
    clear: "Clear",
    deleteSelected: "Delete Selected",
    clearSearch: "Clear search",
    clearFilters: "Clear filters",
  },

  errors: {
    loadStaff: "Failed to load staff",
    loadServices: "Failed to load services",
    loadData: "Failed to load data",
    removeSpecialist: "Failed to remove specialist",
  },

  notifications: {
    specialistRemoved: "Specialist removed.",
    bulkDeletePartial: "Removed {{removed}} specialists. {{failed}} failed.",
    bulkDeleteSuccess: "{{count}} specialists removed.",
  },

  table: {
    select: "Select",
    selectSpecialist: "Select {{name}}",
    specialist: "Specialist",
    role: "Role",
    rating: "Rating",
    today: "Today",
    services: "Services",
    assignedCount: "{{count}} assigned",
    actions: "Actions",
  },

  availability: {
    available: "Available",
    offline: "Offline",
    offToday: "Off today",
  },

  page: {
    title: "Staff & Specialists",
    serviceOnlyDescription:
      "This area is available only to companies configured as service businesses.",
    serviceCompanyRequired: "Service company required",
    notServiceCompany: "{{company}} is not a service company",
    selectedCompany: "The selected company",
    disabledFeatures:
      "Service offerings, staff schedules, availability, and bookings are disabled for this company. Select a company whose business type is",
    serviceBusinessType: "service",
    toContinue: "to continue.",
    description:
      "Manage your service team, schedules, and service assignments.",
    staffCount: "{{count}} staff",
  },

  stats: {
    totalStaff: "Total Staff",
    availableToday: "Available Today",
    offline: "Offline",
    averageRating: "Avg Rating",
    assignedServices: "Assigned Services",
    workingToday: "Working Today",
  },

  form: {
    editSpecialist: "Edit Specialist",
    addSpecialist: "Add Specialist",
    editDescription: "Update profile, schedule, and service assignments.",
    addDescription: "Create a team member and assign their services.",
  },

  selection: {
    selectedCount: "{{count}} specialist(s) selected",
  },

  search: {
    placeholder: "Search specialists...",
    clear: "Clear search",
  },

  sort: {
    label: "Sort by",
    name: "Sort by Name",
    rating: "Sort by Rating",
    changeToDescending: "Sort descending",
    changeToAscending: "Sort ascending",
  },

  view: {
    table: "Table view",
    card: "Card view",
  },

  empty: {
    noSpecialists: "No specialists yet",
    noSpecialistsDescription:
      "Build your team by adding your first specialist. You can assign services, schedules, and availability.",
    noResults: "No specialists found",
    adjustSearch: "Try a different name or adjust your filters.",
  },
};