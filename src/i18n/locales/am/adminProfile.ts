export default {
  tabs: {
    editProfile: "መገለጫን አስተካክል",
    changePassword: "የይለፍ ቃል ቀይር",
    memberships: "የድርጅት አባልነቶች",
    profile: "መገለጫ",
    password: "የይለፍ ቃል",
  },

  fields: {
    firstName: "ስም",
    lastName: "የአባት ስም",
    email: "የኢሜይል አድራሻ",
    phoneNumber: "ስልክ ቁጥር",
    currentPassword: "የአሁኑ የይለፍ ቃል",
    newPassword: "አዲስ የይለፍ ቃል",
    confirmPassword: "አዲሱን የይለፍ ቃል ያረጋግጡ",
  },

  placeholders: {
    firstName: "ስም",
    lastName: "የአባት ስም",
    email: "you@example.com",
    phoneNumber: "+251 9XX XXX XXX",
    currentPassword: "የአሁኑን የይለፍ ቃል ያስገቡ",
    newPassword: "አዲስ የይለፍ ቃል (ቢያንስ 8 ቁምፊዎች)",
    confirmPassword: "አዲሱን የይለፍ ቃል እንደገና ያስገቡ",
  },

  hints: {
    phoneFormat: "ቅርጸት፦ +251XXXXXXXXX ወይም 09XXXXXXXX",
    passwordMinLength: "የይለፍ ቃሉ ቢያንስ 8 ቁምፊዎች መኖሩ አለበት",
  },

  actions: {
    signOut: "ውጣ",
    updateProfile: "መገለጫን አዘምን",
    updating: "በማዘመን ላይ...",
    changePassword: "የይለፍ ቃል ቀይር",
    saving: "በማስቀመጥ ላይ...",
    cancel: "ይቅር",
    showPassword: "የይለፍ ቃሉን አሳይ",
    hidePassword: "የይለፍ ቃሉን ደብቅ",
  },

  messages: {
    profileUpdated: "መገለጫዎ በተሳካ ሁኔታ ተዘምኗል",
    passwordChanged: "የይለፍ ቃሉ በተሳካ ሁኔታ ተቀይሯል",
  },

  validation: {
    currentPasswordRequired: "እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ",
    passwordMinLength: "የይለፍ ቃሉ ቢያንስ 8 ቁምፊዎች መኖሩ አለበት",
    passwordsDoNotMatch: "የይለፍ ቃሎቹ አይዛመዱም",
  },

  errors: {
    profileUpdateFailed: "መገለጫውን ማዘመን አልተቻለም",
    phoneAlreadyUsed:
      "ይህ ስልክ ቁጥር በሌላ መለያ እየተጠቀመበት ነው። እባክዎ ሌላ ቁጥር ይጠቀሙ።",
    phoneNumberError: "የስልክ ቁጥር፦ {{error}}",
    passwordChangeFailed: "የይለፍ ቃሉን መቀየር አልተቻለም",
    imageTooLarge: "የምስሉ መጠን ከ5MB መብለጥ የለበትም",
    avatarUploadFailed: "የመገለጫ ፎቶውን መጫን አልተቻለም",
  },

  labels: {
    avatar: "የመገለጫ ፎቶ",
    changeProfilePhoto: "የመገለጫ ፎቶን ቀይር",
  },

  membership: {
    yourCompanies: "ድርጅቶችዎ",
    companyCount_one: "{{count}} ድርጅት",
    companyCount_other: "{{count}} ድርጅቶች",
    dispatcher: "ስምሪት",
    active: "ንቁ",
    inactive: "ንቁ ያልሆነ",
    noMemberships: "ምንም የድርጅት አባልነት አልተገኘም",

    roles: {
      admin: "አስተዳዳሪ",
      staff: "ሰራተኛ",
      viewer: "ተመልካች",
      superadmin: "ዋና አስተዳዳሪ",
    },
  },

  logout: {
    title: "ውጣ",
    confirmation: "ከመለያዎ መውጣት እርግጠኛ ነዎት?",
  },
};