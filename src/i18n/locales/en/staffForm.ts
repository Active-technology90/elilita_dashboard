
export default {
  weekdays: {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  },

  avatar: {
    invalidFileType: "Please upload a JPG, PNG, or WEBP image.",
    fileTooLarge: "Image must be under 5 MB.",
    changeProfilePhoto: "Change profile photo",
    uploadProfilePhoto: "Upload profile photo",
    profilePreview: "Profile preview",
    changePhoto: "Change photo",
    uploadPhoto: "Upload photo",
    removeProfilePhoto: "Remove profile photo",
    removePhoto: "Remove photo",
    profilePhoto: "Profile photo",
    addProfilePhoto: "Add profile photo",
    fileRequirements: "JPG, PNG or WEBP · Max 5 MB",
    dragAndDrop: "Click or drag & drop",
  },

  workingDays: {
    weekdays: "Weekdays",
    allDays: "All days",
    clear: "Clear",
  },

  services: {
    selectedOne: "{{count}} service selected",
    selectedMany: "{{count}} services selected",
    selectPlaceholder: "Select services...",
    searchPlaceholder: "Search services...",
    searchAriaLabel: "Search services",
    notFound: "No services found.",
    removeService: "Remove {{name}}",
    clearAll: "Clear all",
    emptySelectionHint: "Leave empty to assign all services.",
  },

  validation: {
    fullNameRequired: "Full name is required.",
    workingDayRequired: "Select at least one working day.",
    startTimeBeforeEndTime: "Start time must be before end time.",
  },

  messages: {
    updatedSuccessfully: "Specialist updated successfully.",
    createdSuccessfully: "Specialist added successfully.",
    saveFailed: "Failed to save specialist",
  },

  form: {
    editDescription:
      "Update specialist profile, availability, and booking settings.",
    createDescription:
      "Create a specialist profile, availability, and service assignments.",
  },

  sections: {
    profileInformation: "Profile Information",
    availabilitySchedule: "Availability Schedule",
    assignedServices: "Assigned Services",
    bookingStatus: "Booking Status",
  },

  fields: {
    fullNameEnglish: "Full Name (English)",
    fullNamePlaceholder: "e.g. Robel Alemu",
    nameAmharic: "Name (Amharic)",
    nameAmharicPlaceholder: "e.g. ሮቤል ዓለሙ",
    roleTitle: "Role / Title",
    roleTitlePlaceholder: "e.g. Senior Barber, Master Stylist",
    shiftStart: "Shift Start",
    shiftEnd: "Shift End",
    workingDays: "Working Days",
  },

  booking: {
    onlineAndBooking: "Online & Booking",
    customersCanBook: "Customers can book this specialist",
    active: "Active",
    visibleToCustomers: "Visible to customers",
  },

  actions: {
    saving: "Saving...",
    updateStaff: "Update Staff",
    createStaff: "Create Staff",
    cancel: "Cancel",
  },

  table: {
    vsLastWeek: "vs last week",
    allServices: "All Services",
    service: "Service",
    working: "Working",
    off: "Off",
    specialist: "Specialist",
    online: "Online",
    noSpecialistsFound: "No specialists found",
    noSpecialistsDescription:
      "No specialists match your current search or filters. Try adjusting your criteria.",
    schedule: "View daily schedule & bookings",
    scheduleFor: "Schedule for {{name}}",
    edit: "Edit {{name}}",
    delete: "Delete {{name}}",
    staff: "Staff",
    role: "Role",
    services: "Services",
    rating: "Rating",
    hours: "Hours",
    today: "Today",
    actions: "Actions",
    selectAllStaff: "Select all staff",
  },

  deleteModal: {
    close: "Close",
    title: "Remove {{name}}?",
    description:
      "This action cannot be undone. Associated assignments and future scheduling data may be affected.",
    cancel: "Cancel",
    confirm: "Delete Specialist",
  },

schedule: {
  online: "ONLINE",
  offline: "OFFLINE",
  shift: "Shift",
  close: "Close",
  today: "Today",
  tomorrow: "Tomorrow",
  selectDate: "Select schedule date",
  loading: "Loading specialist schedule...",
  offDutyOn: "Off Duty on",
  thisDay: "this day",
  notScheduled:
    "{{name}} is not scheduled to work on this weekday according to their regular working days.",
  bookedAppointments: "Booked Appointments",
  scheduledFor: "scheduled for",
  vacantTimeSlots: "Vacant Time Slots",
  availableSlotsInShift: "available slots in shift",
  shiftRange: "Shift Range",
  activeAndReady: "Active & Ready",
  currentlyOffline: "Currently Offline",
  appointmentsAndBookings: "Appointments & Client Bookings",
  noBookings:
    "No customer bookings scheduled for {{name}} on this date.",
  availableFreeTimeSlots: "Available / Free Time Slots",
  minutes: "{{count}} mins",
  errors: {
    loadFailed: "Failed to load schedule.",
  },
  statuses: {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    in_progress: "IN PROGRESS",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    no_show: "NO SHOW",
  },
},

};
