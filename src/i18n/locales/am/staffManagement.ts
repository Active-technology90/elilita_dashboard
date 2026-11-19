export default {
  filters: {
    title: "ማጣሪያዎች",
    clearAll: "ሁሉንም አጽዳ",
    close: "ማጣሪያዎችን ዝጋ",
    availability: "የስራ ሰዐት",
    all: "ሁሉም",
    workingToday: "ዛሬ የሚሰሩ",
    offToday: "ዛሬ የማይሰሩ",
    onlineStatus: "የመስመር ላይ ሁኔታ",
    online: "Online",
    offline: "Offline",
    serviceAssignment: "የአገልግሎት ምደባ",
    assignedServices: "የተመደቡ አገልግሎቶች",
    unassignedServices: "ያልተመደቡ (ሁሉም አገልግሎቶች)",
    open: "ማጣሪያዎችን ክፈት",
  },

  bulkDelete: {
    title: "{{count}} ባለሙያዎችን ይሰርዙ?",
    description:
      "ይህ የቡድን አባላቱን እና የተመደቡላቸውን አገልግሎቶች በቋሚነት ያስወግዳል።",
    deleteAll: "ሁሉንም ሰርዝ",
  },

  actions: {
    cancel: "ይቅር",
    switchCompany: "ኩባንያ ቀይር",
    chooseServiceCompany: "የአገልግሎት ኩባንያ ምረጥ",
    schedule: "የስራ መርሃ ግብር",
    edit: "አስተካክል",
    delete: "ሰርዝ",
    addSpecialist: "ባለሙያ ጨምር",
    add: "ጨምር",
    clear: "አጽዳ",
    deleteSelected: "የተመረጡትን ሰርዝ",
    clearSearch: "ፍለጋን አጽዳ",
    clearFilters: "ማጣሪያዎችን አጽዳ",
  },

  errors: {
    loadStaff: "የሰራተኞች መረጃ መጫን አልተቻለም",
    loadServices: "የአገልግሎቶች መረጃ መጫን አልተቻለም",
    loadData: "መረጃዎችን መጫን አልተቻለም",
    removeSpecialist: "ባለሙያውን ማስወገድ አልተቻለም",
  },

  notifications: {
    specialistRemoved: "ባለሙያው ተወግዷል።",
    bulkDeletePartial:
      "{{removed}} ባለሙያዎች ተወግደዋል። {{failed}} ማስወገድ አልተሳካም።",
    bulkDeleteSuccess: "{{count}} ባለሙያዎች ተወግደዋል።",
  },

  table: {
    select: "ምረጥ",
    selectSpecialist: "{{name}}ን ምረጥ",
    specialist: "ባለሙያ",
    role: "የስራ ድርሻ",
    rating: "ደረጃ",
    today: "ዛሬ",
    services: "አገልግሎቶች",
    assignedCount: "{{count}} ተመድበዋል",
    actions: "ድርጊቶች",
  },

  availability: {
    available: "ዝግጁ",
    offline: "ከመስመር ውጭ",
    offToday: "ዛሬ አይሰሩም",
  },

  page: {
    title: "ሰራተኞች እና ባለሙያዎች",
    serviceOnlyDescription:
      "ይህ ክፍል የአገልግሎት ንግድ ተብለው ለተዋቀሩ ኩባንያዎች ብቻ ይገኛል።",
    serviceCompanyRequired: "የአገልግሎት ኩባንያ ያስፈልጋል",
    notServiceCompany: "{{company}} የአገልግሎት ኩባንያ አይደለም",
    selectedCompany: "የተመረጠው ኩባንያ",
    disabledFeatures:
      "የአገልግሎት አቅርቦቶች፣ የሰራተኞች የስራ መርሃ ግብሮች፣ የስራ ሰዐት እና ቦታ ማስያዣዎች ለዚህ ኩባንያ አይገኙም። የንግድ አይነቱ",
    serviceBusinessType: "አገልግሎት",
    toContinue: "የሆነ ኩባንያ በመምረጥ ይቀጥሉ።",
    description:
      "የአገልግሎት ቡድንዎን፣ የስራ መርሃ ግብሮችን እና የአገልግሎት ምደባዎችን ያስተዳድሩ።",
    staffCount: "{{count}} ሰራተኞች",
  },

  stats: {
    totalStaff: "ጠቅላላ ሰራተኞች",
    availableToday: "ዛሬ ዝግጁ የሆኑ",
    offline: "ከመስመር ውጭ",
    averageRating: "አማካይ ደረጃ",
    assignedServices: "የተመደቡ አገልግሎቶች",
    workingToday: "ዛሬ የሚሰሩ",
  },

  form: {
    editSpecialist: "ባለሙያ አስተካክል",
    addSpecialist: "ባለሙያ ጨምር",
    editDescription: "መገለጫውን፣ የስራ መርሃ ግብሩን እና የአገልግሎት ምደባዎችን ያዘምኑ።",
    addDescription: "የቡድን አባል ይፍጠሩ እና አገልግሎቶቹን ይመድቡ።",
  },

  selection: {
    selectedCount: "{{count}} ባለሙያ(ዎች) ተመርጠዋል",
  },

  search: {
    placeholder: "ባለሙያዎችን ፈልግ...",
    clear: "ፍለጋን አጽዳ",
  },

  sort: {
    label: "በዚህ መሰረት ደርድር",
    name: "በስም ደርድር",
    rating: "በደረጃ ደርድር",
    changeToDescending: "ከትልቅ ወደ ትንሽ ደርድር",
    changeToAscending: "ከትንሽ ወደ ትልቅ ደርድር",
  },

  view: {
    table: "የሰንጠረዥ እይታ",
    card: "የካርድ እይታ",
  },

  empty: {
    noSpecialists: "እስካሁን ምንም ባለሙያዎች የሉም",
    noSpecialistsDescription:
      "የመጀመሪያውን ባለሙያ በመጨመር ቡድንዎን ይገንቡ። አገልግሎቶችን፣ የስራ መርሃ ግብሮችን እና የስራ ሰዐትን መመደብ ይችላሉ።",
    noResults: "ምንም ባለሙያዎች አልተገኙም",
    adjustSearch: "ሌላ ስም ይሞክሩ ወይም ማጣሪያዎችን ያስተካክሉ።",
  },
};