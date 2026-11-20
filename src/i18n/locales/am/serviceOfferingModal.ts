
export default {
  header: {
    editService: "አገልግሎት አስተካክል",
    addService: "አገልግሎት ጨምር",
    updateDescription: "የአገልግሎት መረጃዎን ያዘምኑ",
    createDescription: "አዲስ አገልግሎት ይፍጠሩ",
    close: "የአገልግሎት ማስተካከያውን ዝጋ",
  },

  steps: {
    details: "ዝርዝር እና መለያዎች",
    addons: "ተጨማሪ አገልግሎቶች",
    gallery: "የምስል ማዕከል",
  },

  sections: {
    basicInformation: "መሠረታዊ መረጃ",
    pricing: "የዋጋ መረጃ",
    bookingContract: "ቦታ ማስያዝ እና የኮንትራት አይነት",
    categorySettings: "ምድብ እና ቅንብሮች",
    tagsKeywords: "የአገልግሎት መለያዎች እና የፍለጋ ቁልፍ ቃላት",
    customIntakeForm: "ብጁ የመረጃ መሙያ ቅጽ",
    addonsExtras: "ተጨማሪ አገልግሎቶች እና አማራጮች",
    serviceImages: "የአገልግሎት ምስሎች",
  },

  fields: {
    title: "ርዕስ",
    titleAmharic: "ርዕስ (በአማርኛ)",
    description: "መግለጫ",
    descriptionAmharic: "መግለጫ (በአማርኛ)",
    pricingType: "የዋጋ አይነት",
    price: "ዋጋ",
    duration: "ቆይታ (ደቂቃ)",
    serviceType: "የአገልግሎት አይነት",
    billingCycle: "የክፍያ ዑደት",
    bookingMode: "የቦታ ማስያዣ ዘዴ",
    paymentPolicy: "የክፍያ መመሪያ",
    depositPercentage: "የቅድመ ክፍያ መቶኛ",
    serviceCategory: "የአገልግሎት ምድብ",
    displayOrder: "የማሳያ ቅደም ተከተል",
    activeService: "ንቁ አገልግሎት",
    featuredService: "ተለይቶ የሚታይ አገልግሎት",
  },

  placeholders: {
    title: "ለምሳሌ፦ ፕሪሚየም የፀጉር ቁርጥ",
    description: "የአገልግሎቱን መግለጫ ያስገቡ...",
    select: "ይምረጡ...",
    selectServiceType: "የአገልግሎት አይነት ይምረጡ...",
    selectCycle: "የክፍያ ዑደት ይምረጡ...",
    serviceCategory: "ለምሳሌ፦ የፀጉር ሥራ፣ ትምህርት፣ የአካል ብቃት...",
    tags: "መለያ ያስገቡና Enter ወይም ኮማ ይጫኑ (ለምሳሌ፦ Haircut)...",
  },

  options: {
    pricing: {
      fixed: "ቋሚ ዋጋ",
      startingAt: "ከዚህ ዋጋ ጀምሮ",
      hourly: "በሰዓት",
      quoteBased: "በዋጋ ጥያቄ መሠረት",
    },
    serviceType: {
      oneOff: "አንድ ጊዜ የሚሰጥ አገልግሎት (ለምሳሌ፦ ፀጉር መቁረጥ፣ መኪና፣ ውበት)",
      recurring: "ተደጋጋሚ ምዝገባ (ለምሳሌ፦ ትምህርት፣ ጽዳት)",
    },
    billingCycle: {
      weekly: "በየሳምንቱ",
      monthly: "በየወሩ",
      quarterly: "በየሩብ ዓመቱ",
      yearly: "በየዓመቱ",
    },
    booking: {
      direct: "ቀጥተኛ ቦታ ማስያዝ",
      inquiry: "ጥያቄ / የደንበኛ ፍላጎት",
    },
    payment: {
      upfront: "በቅድሚያ መክፈል",
      postService: "ከአገልግሎቱ በኋላ መክፈል",
      deposit: "ቅድመ ክፍያ ያስፈልጋል",
    },
  },

  categories: {
    barber: "የፀጉር ቁርጥ እና እንክብካቤ",
    beauty: "ፀጉር እና ውበት",
    education: "ትምህርት እና የግል ትምህርት",
    fitness: "የአካል ብቃት እና ጤና",
    home: "የቤት አገልግሎቶች",
    automotive: "የመኪና አገልግሎቶች",
  },

  hints: {
    directBooking: "ደንበኞች ሰዓት መርጠው ወዲያውኑ ቦታ ማስያዝ ይችላሉ።",
    inquiryBooking:
      "ደንበኞች ጥያቄ ያቀርባሉ፤ አገልግሎት ሰጪውም መገኘቱን ያረጋግጣል።",
    displayOrder: "ዝቅተኛ ቁጥር ያላቸው መጀመሪያ ይታያሉ።",
    tagsDescription:
      "መለያዎች ደንበኞች በፍለጋ እና በማጣሪያ አገልግሎትዎን በቀላሉ እንዲያገኙ ይረዳሉ (ለምሳሌ፦ Haircut፣ Fade፣ Shaving፣ STEM፣ Gym)።",
  },

  validation: {
    titleRequired: "ርዕስ ማስገባት ግዴታ ነው።",
    titleMaxLength: "ርዕሱ ከ200 ቁምፊዎች መብለጥ የለበትም።",
    descriptionMaxLength: "መግለጫው ከ500 ቁምፊዎች መብለጥ የለበትም።",
    priceInvalid: "ዋጋው ትክክለኛ ዜሮ ወይም ከዜሮ በላይ የሆነ ቁጥር መሆን አለበት።",
    durationInvalid: "የአገልግሎቱ ቆይታ ቢያንስ 1 ደቂቃ መሆን አለበት።",
    depositInvalid: "የቅድመ ክፍያው መቶኛ ከ0 እስከ 100 መሆን አለበት።",
  },

  messages: {
    genericError: "የሆነ ችግር ተፈጥሯል",
    serviceUpdated: "አገልግሎቱ ተዘምኗል",
    serviceCreated: "አገልግሎቱ ተፈጥሯል",
    saveBeforeAddons: "ተጨማሪ አገልግሎቶችን ለማስተዳደር መጀመሪያ አገልግሎቱን ማስቀመጥ አለብዎት።",
    saveBeforeImages: "ምስሎችን ለማስተዳደር መጀመሪያ አገልግሎቱን ማስቀመጥ አለብዎት።",
  },

  buttons: {
    cancel: "ይቅር",
    saving: "በማስቀመጥ ላይ…",
    continueToAddons: "ወደ ተጨማሪ አገልግሎቶች ቀጥል",
    backToDetails: "ወደ ዝርዝሮች ተመለስ",
    continueToImages: "ወደ ምስሎች ቀጥል",
    backToAddons: "ወደ ተጨማሪ አገልግሎቶች ተመለስ",
    done: "ጨርስ",
  },

  discardDialog: {
    ariaLabel: "ለውጦቹን ይተዉ?",
    title: "ለውጦቹን ይተዉ?",
    description: "ያልተቀመጡ ለውጦች አሉዎት። ከቀጠሉ እነዚህ ለውጦች ይጠፋሉ።",
    keepEditing: "ማስተካከል ቀጥል",
    discard: "ለውጦቹን ተው",
  },
};
