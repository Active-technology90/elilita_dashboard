export default {
  page: {
    title: "Settings",
    description: "Manage appearance and branding for",
  },

  company: {
    yourCompany: "your company",
    selectedCompany: "the selected company",
    editingCompany: "Editing company",
    noCompanySelected: "No company selected",
    changeCompany: "Change company",
  },

  companySelector: {
    title: "Choose Company Theme",
    subtitle: "Select exactly one company to edit its dashboard theme",
    searchPlaceholder: "Search companies by name...",
  },

  permissions: {
    cannotSave: "Only company owners, admins, and superadmins can save themes.",
  },

  validation: {
    chooseCompany: "Choose a company before saving.",
    themeLoading: "Wait until the selected company theme finishes loading.",
    invalidColors: "Fix invalid hex colors before saving.",
    saving: "Saving theme...",
  },

  presets: {
    title: "Theme presets",
    description: "Pick a starting palette. You can fine-tune the colors below.",
    themes: {
      "purple-default": "Default purple",
      green: "Green",
        gray: "Gray",
        blue: "Blue",
        red: "Red",
        orange: "Orange",
        pink: "Pink",
        teal: "Teal",
    },
  },

  colors: {
    title: "Custom colors",
    description: "Tune each token individually. Use hex (#RRGGBB).",
    invalidFormat: "Use #RRGGBB format",

    fields: {
      primary: {
        label: "Primary",
        description: "Buttons, active states, links",
      },
      dark: {
        label: "Dark",
        description: "Sidebar gradients and deep accents",
      },
      light: {
        label: "Light",
        description: "Glows, gradients, soft highlights",
      },
    },
  },

  preview: {
    title: "Live preview",
    description: "See how your colors look on real components.",
    buttonsBadges: "Buttons & badges",
    primary: "Primary",
    outline: "Outline",
    active: "Active",
    inactive: "Inactive",
    gradientSurface: "Gradient surface",
    sidebarHeader: "Sidebar / header preview",
  },

  reset: {
    title: "Reset to default",
    description: "Reverts the draft to Elilita's default palette. Save to publish.",
    button: "Reset colors",
  },

  saveBar: {
    unsaved: "Unsaved changes",
    saved: "All changes saved",
    reset: "Reset",
    saveTheme: "Save theme",
    saving: "Saving…",
    saveChanges: "Save changes",
  },

  messages: {
    saved: "Theme saved for {{company}}.",
    saveFailed: "Could not save theme. {{error}}",
  },
}