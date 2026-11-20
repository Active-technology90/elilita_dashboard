export default {
  common: {
    notAvailable: "የለም",
    electronicTransfer: "ኤሌክትሮኒክ ዝውውር",
    customer: "ደንበኛ",
  },
  status: {
    paidSettled: "ተከፍሏል እና ተስተካክሏል",
    failed: "አልተሳካም",
    pendingSettlement: "ማዕቀፍ በመጠባበቅ ላይ",
  },
  header: {
    title: "የክፍያ ደረሰኝ #{{id}}",
    subtitle: "ኦፊሴላዊ የአቅራቢ ክፍያ መግለጫ",
    printTitle: "አትም ወይም PDF አስቀምጥ",
    printButton: "አትም / PDF አስቀምጥ",
    receiptNumber: "#ደረሰኝ-{{id}}",
    orderRef: "የትዕዛዝ ማጣቀሻ: #{{id}}",
  },
  brand: {
    name: "እልልታ ሱፐር አፕ",
    receiptTitle: "የትዕዛዝ ክፍያ ደረሰኝ",
    receiptSubtitle: "የአቅራቢ ቀጥታ ማዕቀፍ እና ክፍያ",
  },
  metadata: {
    settlementTitle: "የማዕቀፍ ሜታዳታ",
    paymentChannel: "የክፍያ መንገድ",
    scheduledDate: "የተያዘው ቀን",
    settledAt: "የተከፈለበት ጊዜ",
    verificationTitle: "የማረጋገጫ ዝርዝሮች",
    referenceId: "የማጣቀሻ መለያ",
    orderId: "የትዕዛዝ መለያ",
    customer: "ደንበኛ",
  },
  items: {
    title: "የትዕዛዝ ዕቃዎች ({{count}})",
    orderLabel: "ትዕዛዝ #{{id}}",
    fallbackItem: "የትዕዛዝ ዕቃ",
    sku: "SKU",
    emptyMessage: "የትዕዛዝ ዕቃዎች በአቅራቢ ትዕዛዝ #{{id}} ስር ተጠቃለዋል።",
    columns: {
      item: "ዕቃ",
      qty: "ብዛት",
      unitPrice: "የአንድ ዋጋ",
      lineTotal: "የመስመር ጠቅላላ",
    },
  },
  calculation: {
    title: "የማዕቀፍ ስሌት ክፍፍል",
    grossTotal: "ጠቅላላ የሽያጭ መጠን (ትዕዛዝ #{{id}})",
    platformCommission: "የመድረክ ኮሚሽን ክፍያ (ቅናሽ)",
    netPayout: "ወደ አቅራቢ ተጣራ ክፍያ",
    netPayoutSubtitle: "በ{{method}} ወደ አቅራቢ ሂሳብ ተልኳል",
  },
  footer: {
    certification: "ኦፊሴላዊ ዲጂታል የክፍያ ደረሰኝ በእልልታ ሱፐር አፕ የተረጋገጠ እና የተላከ።",
  },
};
