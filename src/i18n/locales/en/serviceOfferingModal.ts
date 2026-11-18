
export default {
  header: {
    editService: "Edit Service",
    addService: "Add Service",
    updateDescription: "Update your service offering",
    createDescription: "Create a new service offering",
    close: "Close service editor",
  },

  steps: {
    details: "Details & Tags",
    addons: "Add-ons",
    gallery: "Gallery",
  },

  sections: {
    basicInformation: "Basic Information",
    pricing: "Pricing",
    bookingContract: "Booking & Contract Type",
    categorySettings: "Category & Settings",
    tagsKeywords: "Service Tags & Search Keywords",
    customIntakeForm: "Custom Intake Form",
    addonsExtras: "Service Add-ons & Extras",
    serviceImages: "Service Images",
  },

  fields: {
    title: "Title",
    titleAmharic: "Title (Amharic)",
    description: "Description",
    descriptionAmharic: "Description (Amharic)",
    pricingType: "Pricing Type",
    price: "Price",
    duration: "Duration (minutes)",
    serviceType: "Service Type",
    billingCycle: "Billing Cycle",
    bookingMode: "Booking Mode",
    paymentPolicy: "Payment Policy",
    depositPercentage: "Deposit Percentage",
    serviceCategory: "Service Category",
    displayOrder: "Display Order",
    activeService: "Active Service",
    featuredService: "Featured Service",
  },

  placeholders: {
    title: "e.g. Premium Haircut",
    description: "Describe the service...",
    select: "Select...",
    selectServiceType: "Select service type...",
    selectCycle: "Select cycle...",
    serviceCategory: "e.g. Barber & Grooming, Education, Fitness...",
    tags: "Type tag and press Enter or comma (e.g. Haircut)...",
  },

  options: {
    pricing: {
      fixed: "Fixed",
      startingAt: "Starting At",
      hourly: "Hourly",
      quoteBased: "Quote Based",
    },
    serviceType: {
      oneOff: "One-Off Service (e.g. Haircut, Auto, Beauty)",
      recurring: "Recurring Subscription (e.g. Tutoring, Cleaning)",
    },
    billingCycle: {
      weekly: "Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
    },
    booking: {
      direct: "Direct Booking",
      inquiry: "Inquiry / Lead",
    },
    payment: {
      upfront: "Pay Upfront",
      postService: "Pay After Service",
      deposit: "Deposit Required",
    },
  },

  categories: {
    barber: "Barber & Grooming",
    beauty: "Hair & Beauty",
    education: "Education & Tutoring",
    fitness: "Fitness & Wellness",
    home: "Home Services",
    automotive: "Automotive",
  },

  hints: {
    directBooking: "Customers choose a time and book instantly.",
    inquiryBooking:
      "Customers submit a request; provider confirms availability.",
    displayOrder: "Lower numbers appear first.",
    tagsDescription:
      "Tags help customers quickly discover your service via search and filtering (e.g. Haircut, Fade, Shaving, STEM, Gym, etc.).",
  },

  validation: {
    titleRequired: "Title is required.",
    titleMaxLength: "Title must be under 200 characters.",
    descriptionMaxLength: "Description must be under 500 characters.",
    priceInvalid: "Price must be a valid non-negative number.",
    durationInvalid: "Duration must be at least 1 minute.",
    depositInvalid: "Deposit percentage must be between 0 and 100.",
  },

  messages: {
    genericError: "Something went wrong",
    serviceUpdated: "Service updated",
    serviceCreated: "Service created",
    saveBeforeAddons: "Service must be saved first to manage add-ons.",
    saveBeforeImages: "Service must be saved first to manage images.",
  },

  buttons: {
    cancel: "Cancel",
    saving: "Saving…",
    continueToAddons: "Continue to Add-ons",
    backToDetails: "Back to Details",
    continueToImages: "Continue to Images",
    backToAddons: "Back to Add-ons",
    done: "Done",
  },

  discardDialog: {
    ariaLabel: "Discard changes?",
    title: "Discard changes?",
    description: "You have unsaved changes that will be lost.",
    keepEditing: "Keep editing",
    discard: "Discard",
  },
};
