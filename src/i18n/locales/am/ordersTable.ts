
export default {
  viewAll: "ሁሉንም ይመልከቱ",
  service: "አገልግሎት",

  columns: {
    booking: "ቦታ ማስያዣ",
    order: "ትዕዛዝ",
    customer: "ደንበኛ",
    price: "ዋጋ",
    amount: "ጠቅላላ መጠን",
    status: "ሁኔታ",
    payment: "ክፍያ",
    service: "አገልግሎት",
    companies: "ድርጅቶች",
    date: "ቀን",
  },

  empty: {
    noRecentBookings: "በቅርቡ የተያዙ ቦታዎች የሉም",
    noRecentOrders: "በቅርቡ የተሰጡ ትዕዛዞች የሉም",
    noRecentBookingsDescription:
      "ደንበኞች አገልግሎቶችን ማስያዝ ሲጀምሩ አዲስ የቦታ ማስያዣዎች እዚህ ይታያሉ።",
    noRecentOrdersDescription:
      "ደንበኞች ትዕዛዝ መስጠት ሲጀምሩ አዲስ ትዕዛዞች እዚህ ይታያሉ።",
  },

  statuses: {
    pending: "በመጠባበቅ ላይ",
    confirmed: "የተረጋገጠ",
    processing: "በሂደት ላይ",
    preparing: "እየተዘጋጀ ነው",
    ready: "ዝግጁ",
    shipped: "የተላከ",
    out_for_delivery: "ለማድረስ ወጥቷል",
    delivered: "የደረሰ",
    completed: "የተጠናቀቀ",
    cancelled: "የተሰረዘ",
    rejected: "ውድቅ የተደረገ",
    refunded: "ገንዘብ የተመለሰ",
    failed: "ያልተሳካ",
    no_show: "ያልተገኘ",
    in_progress: "በሂደት ላይ",
  },

  paymentStatuses: {
    pending: "በመጠባበቅ ላይ",
    paid: "ተከፍሏል",
    unpaid: "አልተከፈለም",
    failed: "ያልተሳካ",
    payment_failed: "ክፍያው አልተሳካም",
    refunded: "ገንዘብ ተመልሷል",
    partially_paid: "በከፊል ተከፍሏል",
    awaiting_payment: "ክፍያ በመጠባበቅ ላይ",
    cash_on_delivery: "በሚደርስበት ጊዜ ክፍያ",
  },
};
