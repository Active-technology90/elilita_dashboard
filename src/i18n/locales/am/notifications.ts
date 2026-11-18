export default {

messages: {
  newOrderTitle: "አዲስ ትዕዛዝ",
  newOrderBody:
    "ለ{{company}} አዲስ ትዕዛዝ #{{orderId}} — {{amount}} ብር።",

  orderPreparingTitle: "ትዕዛዝዎ በዝግጅት ላይ ነው",
  orderPreparingBody:
    "{{company}} ትዕዛዝዎን #{{orderId}} በማዘጋጀት ላይ ነው።",

  paymentReceivedTitle: "ክፍያ ተቀብሏል",
  paymentReceivedBody:
    "ለትዕዛዝ #{{orderId}} የ{{amount}} ብር ክፍያዎ ተቀብሏል። ምርቶችዎ ሲዘጋጁ እናሳውቅዎታለን።",

  outForDeliveryTitle: "ለማድረስ በመንገድ ላይ",
  outForDeliveryBody:
    "ከ{{company}} የመጣው ትዕዛዝዎ ለማድረስ በመንገድ ላይ ነው።",

  deliveredTitle: "ተላልፏል",
  deliveredBody:
    "ከ{{company}} ያዘዙት ምርት ተላልፏል። መልካም አጠቃቀም!",
},
events: {
  paymentReceived: "ክፍያ ተቀብሏል",
  paymentFailed: "ክፍያው አልተሳካም",
  newOrder: "አዲስ ትዕዛዝ",
  beingPrepared: "በዝግጅት ላይ",
  deliveryAssigned: "ማድረስ ተመድቧል",
  outForDelivery: "ለማድረስ በመንገድ ላይ",
  delivered: "ተላልፏል",
  notification: "ማሳወቂያ",
},

relativeTime: {
  justNow: "አሁን",

  minutes_one: "{{count}} ደቂቃ በፊት",
  minutes_other: "{{count}} ደቂቃዎች በፊት",

  hours_one: "{{count}} ሰዓት በፊት",
  hours_other: "{{count}} ሰዓታት በፊት",

  days_one: "{{count}} ቀን በፊት",
  days_other: "{{count}} ቀናት በፊት",
},

locale: "am-ET",

  title: "ማሳወቂያዎች",

  loadingNotifications: "ማሳወቂያዎች በመጫን ላይ...",
  unreadCount_one: "{{count}} ያልተነበበ ማሳወቂያ",
  unreadCount_other: "{{count}} ያልተነበቡ ማሳወቂያዎች",
  unreadBadge_one: "{{count}} ያልተነበበ",
  unreadBadge_other: "{{count}} ያልተነበቡ",
  newCount_one: "{{count}} አዲስ",
  newCount_other: "{{count}} አዲስ",

  allCaughtUp: "ሁሉንም ማሳወቂያዎች አንብበዋል",
  marking: "በማስተካከል ላይ...",
  markAllRead: "ሁሉንም እንደተነበቡ ምልክት አድርግ",
  markAll: "ሁሉንም አንብብ",
  new: "አዲስ",

  filterNotifications: "ማሳወቂያዎችን አጣራ",

  filters: {
    all: "ሁሉም",
    unread: "ያልተነበቡ",
  },

  dateGroups: {
    today: "ዛሬ",
    yesterday: "ትናንት",
    earlier: "ከዚያ በፊት",
  },

  empty: {
    unreadOlderTitle: "በቀደሙት ገጾች ያሉ ያልተነበቡ ማሳወቂያዎች",
    unreadOlderDescription:
      "በቀደሙት ገጾች {{count}} ያልተነበቡ ማሳወቂያዎች አሉዎት። እነሱን ለማየት የቆዩ ማሳወቂያዎችን ይጫኑ።",
    noUnreadDescription: "ምንም ያልተነበቡ ማሳወቂያዎች የሉዎትም።",
    noNotificationsTitle: "እስካሁን ምንም ማሳወቂያ የለም",
    noNotificationsDescription:
      "አዳዲስ ትዕዛዞች፣ ክፍያዎች እና የማድረስ ማሳወቂያዎች እዚህ ይታያሉ።",
    noNewNotifications: "በአሁኑ ጊዜ አዲስ ማሳወቂያዎች የሉም።",
  },

  loadingOlder: "የቆዩ ማሳወቂያዎችን በመጫን ላይ...",
  loadOlder: "የቆዩ ማሳወቂያዎችን ጫን",
  loadingMore: "ተጨማሪ ማሳወቂያዎችን በመጫን ላይ...",
  loadMore: "ተጨማሪ ማሳወቂያዎችን ጫን",
  paginationCount: "{{current}} ከ {{total}}",

  openDetails: "ዝርዝሩን ክፈት",
  openOrder: "ትዕዛዝ #{{id}} ክፈት",
  orderNumber: "ትዕዛዝ #{{id}}",
  viewAll: "ሁሉንም ማሳወቂያዎች ይመልከቱ",
  close: "ማሳወቂያዎችን ዝጋ",

  aria: {
    readNotification: "የተነበበ ማሳወቂያ: {{title}}",
    markNotificationRead: "ማሳወቂያውን እንደተነበበ ምልክት አድርግ: {{title}}",
    openNotification: "ማሳወቂያውን ክፈት: {{title}}",
    notification: "ማሳወቂያ: {{title}}",
    openDetailsFor: "የ{{title}} ዝርዝር ክፈት",
  },

//   events: {
//     paymentReceived: "ክፍያ ተቀብሏል",
//     paymentFailed: "ክፍያው አልተሳካም",
//     newOrder: "አዲስ ትዕዛዝ",
//     beingPrepared: "በዝግጅት ላይ",
//     deliveryAssigned: "ማድረስ ተመድቧል",
//     outForDelivery: "ለማድረስ በመንገድ ላይ",
//     delivered: "ተላልፏል",
//     notification: "ማሳወቂያ",
//   },

//   relativeTime: {
//     justNow: "አሁን",
//     minutes_one: "{{count}} ደቂቃ በፊት",
//     minutes_other: "{{count}} ደቂቃዎች በፊት",
//     hours_one: "{{count}} ሰዓት በፊት",
//     hours_other: "{{count}} ሰዓታት በፊት",
//     days_one: "{{count}} ቀን በፊት",
//     days_other: "{{count}} ቀናት በፊት",
//   },

  push: {
    enabled: "በዚህ መሣሪያ ላይ Push notifications ተከፍተዋል",
    blocked: "ማሳወቂያዎች በBrowser settings ታግደዋል",
    enableDeviceAlerts: "የመሣሪያ ማሳወቂያዎችን ያንቁ",
    enabling: "በማንቃት ላይ...",
    allow: "ፍቀድ",
  },
}