export default {
  'etb':"ብር",
  "statusBadge": {
    "disbursed": "ማረጋገጫ በመጠባበቅ ላይ",
    "confirmed": "ተረጋግጧል",
    "disputed": "በአድራሽ ተቃውሞ ቀርቧል",
    "cancelled": "ተሰርዟል"
  },
  "metrics": {
    "unpaidFees": "ያልተከፈሉ የማድረሻ ክፍያዎች",
    "unpaidFeesSubtitle": "{{orders}} ትዕዛዞች በ{{drivers}} አድራሾች",
    "codCash": "በእጅ ያለ COD ጥሬ ገንዘብ",
    "codCashSubtitle": "ከደንበኞች የተሰበሰበ ጥሬ ገንዘብ",
    "awaitingCheck": "የአድራሽ ማረጋገጫ በመጠባበቅ ላይ",
    "payoutsCount": "{{count}} ክፍያዎች",
    "awaitingCheckSubtitle": "ተልኳል · የአድራሽ ማረጋገጫ በመጠባበቅ ላይ",
    "totalSettled": "ጠቅላላ የተከፈለ",
    "totalSettledSubtitle": "በአድራሾች ሙሉ በሙሉ የተረጋገጠ"
  },
  "tabs": {
    "unpaid": "ያልተከፈሉ ትዕዛዞች እና ለመክፈል ዝግጁ",
    "history": "የክፍያ ታሪክ"
  },
  "search": {
    "unpaidPlaceholder": "የአድራሽ ስም ወይም ስልክ ፈልግ...",
    "historyPlaceholder": "የክፍያ # ወይም አድራሽ ፈልግ..."
  },
  "filters": {
    "allStatuses": "ሁሉም ሁኔታዎች",
    "disbursed": "ማረጋገጫ በመጠባበቅ ላይ",
    "confirmed": "ተረጋግጧል",
    "disputed": "ተቃውሞ ቀርቧል",
    "cancelled": "ተሰርዟል"
  },
  "actions": {
    "refresh": "ውሂብ አድስ"
  },
  "unpaidEmpty": {
    "title": "ሁሉም አድራሾች ተከፍለዋል",
    "description": "በአሁኑ ጊዜ ክፍያ የሚጠብቁ ያልተከፈሉ የተጠናቀቁ ማድረሻዎች የሉም።"
  },
  "driverCard": {
    "deliveriesCount": "{{count}} ማድረሻዎች",
    "store": "ሱቅ",
    "companyStore": "የኩባንያ ሱቅ",
    "grossFees": "ጠቅላላ ክፍያዎች",
    "codCollected": "COD የተሰበሰበ",
    "netDisbursable": "ተጣራ ለክፍያ",
    "disburse": "ክፍያ አውጣ",
    "collapse": "ትዕዛዞችን ሰብስብ",
    "view": "ትዕዛዞችን ተመልከት"
  },
  "unpaidTable": {
    "orderNumber": "የትዕዛዝ ቁጥር",
    "customer": "ደንበኛ",
    "completedAt": "የተጠናቀቀበት ጊዜ",
    "paymentMethod": "የክፍያ ዘዴ",
    "deliveryFee": "የማድረሻ ክፍያ",
    "codCollected": "COD የተሰበሰበ",
    "notAvailable": "የለም",
    "codHandedIn": "COD ተልኳል",
    "codPendingTurnIn": "COD ለማስረከብ በመጠባበቅ ላይ"
  },
  "historyEmpty": {
    "title": "የክፍያ መዝገብ የለም",
    "description": "የተላኩ ክፍያዎች ከማረጋገጫ ሁኔታ እና ክፍፍል ጋር እዚህ ይታያሉ።"
  },
  "historyTable": {
    "payoutNumber": "የክፍያ #",
    "driver": "አድራሽ",
    "frequency": "ድግግሞሽ",
    "paymentMethod": "የክፍያ ዘዴ",
    "orders": "ትዕዛዞች",
    "netAmount": "ተጣራ መጠን",
    "status": "ሁኔታ",
    "disbursedDate": "የተላከበት ቀን",
    "action": "ተግባር",
    "ref": "ማጣቀሻ",
    "ordersCount": "{{count}} ትዕዛዞች",
    "view": "ተመልከት"
  },
  "toasts": {
    "payoutDisbursed": "{{amount}} ብር ({{count}} ትዕዛዞች) ለ{{driver}} ተከፍሏል!",
    "disburseFailed": "ክፍያ መላክ አልተሳካም",
    "disputeResolved": "ተቃውሞው ተፈትቷል እና ክፍያው ወደ ማረጋገጫ ተመልሷል።",
    "resolveFailed": "ተቃውሞ መፍታት አልተሳካም",
    "payoutCancelled": "ክፍያ #{{number}} ተሰርዟል እና ትዕዛዞች ወደ ያልተከፈሉ ዝርዝር ተመልሰዋል።",
    "cancelFailed": "ክፍያ መሰረዝ አልተሳካም",
    "cancelReason": "አድሚን ክፍያውን ሰርዟል",
    "loadFailed": "የአድራሽ ክፍያ ውሂብ መጫን አልተሳካም"
  },
  "disburseModal": {
    "title": "የአድራሽ ክፍያ አውጣ",
    "subtitle": "የተጠናቀቁ ማድረሻዎችን አስተካክል ለ",
    "closeAria": "የክፍያ ላኪ ዝጋ",
    "ariaLabel": "የአድራሽ ክፍያ አውጣ"
  },
  "interval": {
    "title": "የክፍያ ጊዜ",
    "subtitle": "ያልተከፈሉ ማድረሻዎችን ለማጣራት ጊዜ ይምረጡ።",
    "unpaidAvailable_one": "ያልተከፈለ ትዕዛዝ ይገኛል",
    "unpaidAvailable_other": "ያልተከፈሉ ትዕዛዞች ይገኛሉ",
    "ordersCount_one": "{{count}} ትዕዛዝ",
    "ordersCount_other": "{{count}} ትዕዛዞች",
    "selected": "ተመርጧል",
    "manualHint": "ሁሉም ያልተከፈሉ ማድረሻዎች ይገኛሉ። ማስተካከል የሚፈልጉትን ትዕዛዞች ይምረጡ።",
    "intervalHint": "ከ{{interval}} የክፍያ ጊዜ ጋር የሚዛመዱ ያልተከፈሉ ማድረሻዎች በማሳየት ላይ።",
    "options": {
      "instant": { "label": "ፈጣን", "sub": "ዛሬ" },
      "weekly": { "label": "ሳምንታዊ", "sub": "ያለፉት 7 ቀናት" },
      "monthly": { "label": "ወርሃዊ", "sub": "ያለፉት 30 ቀናት" },
      "manual": { "label": "ሁሉም ያልተከፈለ", "sub": "በእጅ ምርጫ" }
    }
  },
  "selection": {
    "title": "የሚከፈሉ ትዕዛዞችን ምረጥ",
    "subtitle": "በዚህ ክፍያ ውስጥ ማካተት የሚፈልጉትን የተደረሱ ትዕዛዞች ይምረጡ።",
    "selectAll": "ሁሉንም ምረጥ",
    "clear": "አጽዳ",
    "progress": "የምርጫ ሂደት",
    "emptyTitle": "ምንም ትዕዛዞች አልተመረጡም",
    "emptyDescription": "ከ{{type}} የጊዜ ገደብ ጋር የሚዛመድ ትዕዛዝ የለም ({{count}} ተመሳሳይ)። ትዕዛዞችን በግል ይምረጡ ወይም ሁሉም ያልተከፈለ አማራጭን ይጠቀሙ።",
    "availableOrders": "ያሉ ትዕዛዞች",
    "ordersCount": "{{count}} ትዕዛዞች",
    "selectOrderAria": "ትዕዛዝ {{order}} ምረጥ",
    "codReceived": "COD ተቀብሏል",
    "codPending": "COD በመጠባበቅ ላይ",
    "delivered": "ተደርሷል",
    "deliveryFee": "የማድረሻ ክፍያ",
    "selectedOrders": "የተመረጡ ትዕዛዞች",
    "ofTotal": "{{selected}} ከ {{total}}",
    "selectToContinue": "ለመቀጠል ትዕዛዞችን ይምረጡ",
    "updated": "ምርጫ ተሻሽሏል"
  },
  "summary": {
    "title": "የክፍያ ማጠቃለያ",
    "subtitle": "ከመላክ በፊት የተመረጡትን የማድረሻ መጠኖች ይገምግሙ።",
    "selectedDeliveries": "የተመረጡ ማድረሻዎች",
    "selectedDeliveriesSubtitle": "በዚህ ክፍያ ውስጥ የተካተቱ ትዕዛዞች",
    "totalDeliveryFees": "ጠቅላላ የማድረሻ ክፍያዎች",
    "totalDeliveryFeesSubtitle": "ከተመረጡ ትዕዛዞች ጠቅላላ መጠን",
    "netAmount": "ለመላክ ተጣራ መጠን",
    "netAmountSubtitle": "ለዚህ ምርጫ የመጨረሻ የሚከፈል መጠን"
  },
  "form": {
    "title": "የክፍያ ዝርዝሮች",
    "subtitle": "አድራሹ ክፍያውን እንዴት እንደሚቀበል ይግለጹ።",
    "paymentChannel": "የክፍያ መንገድ",
    "paymentChannelAria": "የክፍያ መንገድ ምረጥ",
    "options": {
      "telebirr": "የቴሌብር ዝውውር",
      "cbeBirr": "የCBE ብር ዝውውር",
      "cash": "በአካል ጥሬ ገንዘብ",
      "other": "ሌላ ዘዴ"
    },
    "choosePaymentChannel": "የክፍያ መንገድ ምረጥ",
    "transactionRef": "የግብይት ማጣቀሻ",
    "transactionRefPlaceholder": "የግብይት መለያ ወይም የባንክ ማጣቀሻ ቁጥር ያስገቡ",
    "transactionRefHint": "ይህን ማጣቀሻ በኋላ ክፍያውን ለመለየት እና ለማረጋገጥ ይጠቀሙበት።",
    "notes": "የክፍያ ማስታወሻዎች",
    "notesPlaceholder": "የክፍያ ጊዜ፣ የክፍያ ዝርዝሮች ወይም ተጨማሪ ማስታወሻዎች ያክሉ...",
    "notesHint": "ለክፍያ መዝገቦችዎ ተጨማሪ መረጃ።",
    "optional": "አማራጭ",
    "noOrdersWarning": "እባክዎ ክፍያ ለመላክ ቢያንስ 1 ትዕዛዝ ይምረጡ።",
    "cancel": "ሰርዝ",
    "disbursing": "በመላክ ላይ...",
    "disburseButton": "ክፍያ አውጣ ({{amount}} ብር · {{count}} ትዕዛዞች)"
  },
  "detailModal": {
    "title": "ክፍያ #{{number}}",
    "issuedTo": "የተሰጠው ለ",
    "closeAria": "የክፍያ ዝርዝሮችን ዝጋ",
    "ariaLabel": "የክፍያ {{number}} ዝርዝሮች"
  },
  "detail": {
    "grossDeliveryFees": "ጠቅላላ የማድረሻ ክፍያዎች",
    "codCollected": "COD የተሰበሰበ",
    "netAmountPaid": "የተከፈለ ተጣራ መጠን",
    "timelineTitle": "የማስተካከያ እና የማረጋገጫ የጊዜ መስመር",
    "lifecycleAudit": "የህይወት ዑደት ኦዲት",
    "ref": "ማጣቀሻ",
    "net": "ተጣራ",
    "disbursementNote": "የክፍያ ማስታወሻ",
    "step1": { "title": "1. ክፍያ በአድሚን ተልኳል" },
    "step2": {
      "title": "2. በአድራሽ ተቃውሞ ቀርቧል",
      "reported": "ተዘግቧል",
      "fallbackReason": "ክፍያ አልተቀበለም ወይም የግብይት ማጣቀሻ ከባንክ ሂሳብ ጋር አይዛመድም።"
    },
    "step3": {
      "title": "3. የአድሚን ግምገማ እና መፍትሄ",
      "actionRequired": "እርምጃ ያስፈልጋል",
      "resolved": "ተፈትቷል እና በድጋሚ ተልኳል",
      "resolutionDetails": "የመፍትሄ ዝርዝሮች፡",
      "resolveHint": "ተቃውሞውን ለማጽዳት እና ክፍያውን ለአድራሽ ማረጋገጫ ለመመለስ የተስተካከለ ማጣቀሻ ወይም የዝውውር ዝርዝሮችን ያቅርቡ፡",
      "correctedRefLabel": "የተስተካከለ የግብይት ማጣቀሻ",
      "correctedRefPlaceholder": "ለምሳሌ የቴሌብር ግብይት # / የባንክ ዝውውር ማጣቀሻ",
      "notesLabel": "ለአድራሽ የመፍትሄ ማስታወሻዎች",
      "notesPlaceholder": "መፍትሄውን ያብራሩ (ለምሳሌ በትክክለኛ ማጣቀሻ ክፍያ እንደገና ተልኳል)...",
      "submitting": "መፍትሄ በማስገባት ላይ...",
      "submit": "መፍትሄ አስገባ እና በድጋሚ ላክ"
    },
    "step4": {
      "confirmedTitle": "4. ደረሰኝ በአድራሽ ተረጋግጧል",
      "cancelledTitle": "4. ክፍያ ተሰርዟል (ትዕዛዞች ተለቀቁ)",
      "onHoldTitle": "4. ማረጋገጫ በመጠባበቅ ላይ",
      "awaitingTitle": "4. የአድራሽ ማረጋገጫ በመጠባበቅ ላይ",
      "confirmedDescription": "{{driver}} በሞባይል መተግበሪያቸው ላይ የዚህን ክፍያ ደረሰኝ አረጋግጠዋል። ማስተካከያው በተሳካ ሁኔታ ተጠናቅቋል።",
      "cancelledDescription": "ይህ ክፍያ በአድሚን ተሰርዟል። ሁሉም ተያያዥ ትዕዛዞች ወደ ያልተከፈሉ ስብስብ ተመልሰዋል።",
      "onHoldDescription": "አድራሹ ይህን ክፍያ ተቃውሟል። ተቃውሞው እስኪፈታ ድረስ ክፍያው ሊረጋገጥ አይችልም።",
      "awaitingDescription": "ገንዘቡ ተልኳል። {{driver}} በመሳሪያቸው ላይ ደረሰኙን አረጋግጠው 'ክፍያ አረጋግጥ' እንዲጫኑ በመጠባበቅ ላይ።"
    },
    "metadata": {
      "paymentChannel": "የክፍያ መንገድ",
      "payoutInterval": "የክፍያ ጊዜ",
      "transactionRef": "የግብይት ማጣቀሻ"
    },
    "settledOrders": "የተከፈሉ ትዕዛዞች ({{count}})",
    "ordersTable": {
      "orderNumber": "የትዕዛዝ ቁጥር",
      "customer": "ደንበኛ",
      "fee": "ክፍያ",
      "cod": "COD"
    },
    "cancelPayout": "ክፍያ ሰርዝ እና ትዕዛዞችን ልቀቅ",
    "close": "ዝጋ"
  },
  "cancelConfirm": {
    "ariaLabel": "የክፍያ {{number}} መሰረዝን አረጋግጥ",
    "title": "ክፍያ #{{number}} ይሰረዝ?",
    "issuedTo": "የተሰጠው ለ",
    "confirmation": "ማረጋገጫ",
    "warningTitle": "የመልቀቂያ ማስጠንቀቂያ",
    "warningBody": "መሰረዝ ይህን ክፍያ በቋሚነት ያጠፋል እና ሁሉንም {{count}} ትዕዛዞች ወደ ያልተከፈሉ ማድረሻዎች ሰልፍ ይመልሳል ስለዚህ በድጋሚ ሊላኩ ይችላሉ።",
    "keepPayout": "ክፍያውን አቆይ",
    "cancelling": "በመሰረዝ ላይ...",
    "confirmButton": "አዎ፣ ሰርዝ እና ትዕዛዞችን ልቀቅ"
  }
}