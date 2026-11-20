export default {
  page: {
    title: "ቅንብሮች",
    description: "የዳሽቦርድ ገጽታና የብራንድ አቀራረብን ያስተዳድሩ ለ",
  },

  company: {
    yourCompany: "ድርጅትዎ",
    selectedCompany: "የተመረጠው ድርጅት",
    editingCompany: "እየተስተካከለ ያለው ድርጅት",
    noCompanySelected: "ምንም ድርጅት አልተመረጠም",
    changeCompany: "ድርጅት ቀይር",
  },

  companySelector: {
    title: "የድርጅት ገጽታ ይምረጡ",
    subtitle: "ዳሽቦርዱን ለማስተካከል አንድ ድርጅት ብቻ ይምረጡ",
    searchPlaceholder: "ድርጅቶችን በስም ይፈልጉ...",
  },

  permissions: {
    cannotSave: "የድርጅት ባለቤቶች፣ አስተዳዳሪዎች እና Superadmin ብቻ ገጽታውን ማስቀመጥ ይችላሉ።",
  },

  validation: {
    chooseCompany: "ከማስቀመጥዎ በፊት ድርጅት ይምረጡ።",
    themeLoading: "የተመረጠው ድርጅት ገጽታ መጫኑን እስኪጨርስ ይጠብቁ።",
    invalidColors: "ከማስቀመጥዎ በፊት የተሳሳቱ የHex ቀለሞችን ያስተካክሉ።",
    saving: "ገጽታው በመቀመጥ ላይ ነው...",
  },

  presets: {
    title: "የገጽታ አማራጮች",
    description: "መነሻ የቀለም ጥምረት ይምረጡ። ከታች ያሉትን ቀለሞች በፍላጎትዎ ማስተካከል ይችላሉ።",
    themes: {
      "purple-default": "ነባሪ ሐምራዊ",
      green: "አረንጓዴ",
      gray: "ግራጫ",
      blue: "ሰማያዊ",
      red: "ቀይ",
      orange: "ብርቱካናማ",
      pink: "ሮዝ",
      teal: "ቱርኩዊዝ",
    },
  },

  colors: {
    title: "ብጁ ቀለሞች",
    description: "እያንዳንዱን ቀለም በተናጠል ያስተካክሉ። Hex (#RRGGBB) ቅርጸት ይጠቀሙ።",
    invalidFormat: "#RRGGBB ቅርጸት ይጠቀሙ",

    fields: {
      primary: {
        label: "ዋና ቀለም",
        description: "ለButtons፣ ንቁ ሁኔታዎች እና Links",
      },
      dark: {
        label: "ጥቁር ቀለም",
        description: "ለSidebar Gradient እና ጥልቅ የቀለም ውጤቶች",
      },
      light: {
        label: "ቀላል ቀለም",
        description: "ለGlow፣ Gradient እና ለስላሳ የቀለም ውጤቶች",
      },
    },
  },

  preview: {
    title: "የቀጥታ ቅድመ እይታ",
    description: "ቀለሞችዎ በተለያዩ የUI ክፍሎች ላይ እንዴት እንደሚታዩ ይመልከቱ።",
    buttonsBadges: "Buttons እና Badges",
    primary: "ዋና",
    outline: "ውጫዊ መስመር",
    active: "ንቁ",
    inactive: "ንቁ ያልሆነ",
    gradientSurface: "የGradient ገጽታ",
    sidebarHeader: "የSidebar / Header ቅድመ እይታ",
  },

  reset: {
    title: "ወደ ነባሪ ቅንብር መመለስ",
    description: "የቀለም ምርጫዎን ወደ Elilita ነባሪ ቀለሞች ይመልሳል። ለማሳተም Save ያድርጉ።",
    button: "ቀለሞችን ወደነበሩበት መመለስ",
  },

  saveBar: {
    unsaved: "ያልተቀመጡ ለውጦች",
    saved: "ሁሉም ለውጦች ተቀምጠዋል",
    reset: "ዳግም አስጀምር",
    saveTheme: "ገጽታውን አስቀምጥ",
    saving: "በመቀመጥ ላይ…",
    saveChanges: "ለውጦችን አስቀምጥ",
  },

  messages: {
    saved: "የ{{company}} ገጽታ ተቀምጧል።",
    saveFailed: "ገጽታውን ማስቀመጥ አልተቻለም። {{error}}",
  },
};
