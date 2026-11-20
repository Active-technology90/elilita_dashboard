
export default {
  page: {
    title: "የአገልግሎት ቦታ ማስያዣዎች",
    description:
      "የደንበኞችን የቦታ ማስያዣ ጥያቄዎች ይመልከቱ፣ ያስተዳድሩ እና ይከታተሉ።",
    serviceCompanyOnly:
      "ይህ ክፍል እንደ አገልግሎት ንግድ ለተመዘገቡ ኩባንያዎች ብቻ ይገኛል።",
    serviceCompanyRequired: "የአገልግሎት ኩባንያ ያስፈልጋል",
    switchCompany: "ኩባንያ ይቀይሩ",
    selectedCompany: "የተመረጠው ኩባንያ",
    notServiceCompany: "{{company}} የአገልግሎት ኩባንያ አይደለም",
    serviceCompanyDisabled:
      "የአገልግሎት አቅርቦቶች፣ የሰራተኞች የስራ ሰዓት ሰሌዳዎች፣ መገኘት እና የቦታ ማስያዣዎች ለዚህ ኩባንያ ተዘግተዋል። ለመቀጠል የንግድ አይነቱ",
    serviceBusinessType: "አገልግሎት",
    toContinue: "የሆነ ኩባንያ ይምረጡ።",
    chooseServiceCompany: "የአገልግሎት ኩባንያ ይምረጡ",

    // Additional page labels
    searchCompanies: "የአገልግሎት ኩባንያዎችን ይፈልጉ...",
    searchBookings: "በመለያ ቁጥር፣ ደንበኛ ወይም አገልግሎት ይፈልጉ...",
    noBookings: "ምንም ቦታ ማስያዣ አልተገኘም።",
    noMatchingBookings:
      "ከፍለጋው ጋር የሚዛመድ ቦታ ማስያዣ አልተገኘም።",
    couldNotLoad: "የቦታ ማስያዣ ዝርዝሮችን መጫን አልተቻለም።",
    couldNotRefresh: "የቦታ ማስያዣውን ማደስ አልተቻለም።",
    updateFailed: "የቦታ ማስያዣውን ሁኔታ ማዘመን አልተሳካም።",
    markedAs: "ቦታ ማስያዣው እንደ {{status}} ተለይቷል።",
    filters: "ማጣሪያዎች",
    clearAll: "ሁሉንም አጽዳ",
    applyFilters: "ማጣሪያዎችን ተግብር",
    date: "ቀን",
    paymentMethod: "የክፍያ ዘዴ",
    allPaymentMethods: "ሁሉም የክፍያ ዘዴዎች",
  },

  companySelector: {
    searchPlaceholder: "የአገልግሎት ኩባንያዎችን ይፈልጉ...",
  },

  status: {
    all: "ሁሉም ሁኔታዎች",
    pending: "በመጠባበቅ ላይ",
    confirmed: "ተረጋግጧል",
    inProgress: "በሂደት ላይ",
    in_progress: "በሂደት ላይ",
    completed: "ተጠናቋል",
    cancelled: "ተሰርዟል",
    noShow: "አልተገኘም",
    no_show: "አልተገኘም",
  },

  paymentStatus: {
    all: "ሁሉም የክፍያ ሁኔታዎች",
    paid: "ተከፍሏል",
    receiptRejected: "ደረሰኙ ውድቅ ተደርጓል",
    verifyReceipt: "ደረሰኙን ያረጋግጡ",
    awaitingReceipt: "ደረሰኝ በመጠባበቅ ላይ",
    failed: "አልተሳካም",
    payAtVenue: "በቦታው ይክፈሉ",
    pending: "በመጠባበቅ ላይ",
    notRequired: "አያስፈልግም",
  },

  paymentMethods: {
    bankTransfer: "የባንክ ማስተላለፍ",
    telebirr: "ቴሌብር",
    chapa: "ጫፓ (Chapa)",
    arifpay: "አሪፍፔይ (ArifPay)",
    cashVenue: "በቦታው በጥሬ ገንዘብ",
    cod: "ሲደርስ ክፍያ (COD)",
  },

  payment: {
    paid: "ተከፍሏል",
    receiptRejected: "ደረሰኙ ውድቅ ተደርጓል",
    verifyReceipt: "ደረሰኙን ያረጋግጡ",
    awaitingReceipt: "ደረሰኝ በመጠባበቅ ላይ",
    failed: "አልተሳካም",
    payAtVenue: "በቦታው ላይ ይክፈሉ",
    bankTransfer: "በባንክ ማስተላለፍ",
    telebirr: "ቴሌብር",
    chapa: "ጫፓ (Chapa)",
    arifpay: "አሪፍፔይ (ArifPay)",
    cashVenue: "በቦታው ላይ በጥሬ ገንዘብ",
  },

  filters: {
    title: "ማጣሪያዎች",
    status: "ሁኔታ",
    paymentStatus: "የክፍያ ሁኔታ",
    paymentMethod: "የክፍያ ዘዴ",
    date: "ቀን",
    allStatuses: "ሁሉም ሁኔታዎች",
    allPaymentStatuses: "ሁሉም የክፍያ ሁኔታዎች",
    allPaymentMethods: "ሁሉም የክፍያ ዘዴዎች",
    clearAll: "ሁሉንም አጽዳ",
    apply: "ማጣሪያዎችን ተግብር",
  },

  pagination: {
    perPage: "{{count}} / ገጽ",
  },

  search: {
    placeholder: "በID፣ በደንበኛ ወይም በአገልግሎት ይፈልጉ...",
    refresh: "የአገልግሎት ቦታ ማስያዣዎችን ያድሱ",
  },

  table: {
    bookingId: "የቦታ ማስያዣ ID",
    customer: "ደንበኛ",
    customerNumber: "ደንበኛ #{{id}}",
    specialist: "ባለሙያ",
    anySpecialist: "ማንኛውም ባለሙያ",
    service: "አገልግሎት",
    price: "ዋጋ",
    status: "ሁኔታ",
    paymentMethod: "የክፍያ ዘዴ",
    paymentStatus: "የክፍያ ሁኔታ",
    dateTime: "ቀን / ሰዓት",
    actions: "ተግባራት",
    manage: "አስተዳድር",
    noBookingsFound: "ምንም የቦታ ማስያዣ አልተገኘም።",
    noMatchingBookings:
      "ከማጣሪያዎቹ ጋር የሚዛመድ የቦታ ማስያዣ አልተገኘም።",
  },

  messages: {
    loadBookingFailed: "የቦታ ማስያዣ ዝርዝሮችን መጫን አልተቻለም",
    refreshBookingFailed: "የቦታ ማስያዣውን ማደስ አልተቻለም",
    bookingMarkedAs: "የቦታ ማስያዣው ሁኔታ {{status}} ተብሎ ተቀይሯል",
    updateBookingFailed: "የቦታ ማስያዣውን ማዘመን አልተሳካም",
  },
};
