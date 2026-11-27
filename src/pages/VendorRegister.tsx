// src/pages/VendorRegister.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Info,
  Copy,
  Check,
  FileCheck,
  Languages,
} from "lucide-react";
import {
  getCategories,
  getSubCategories,
  submitVendorRegistration,
} from "../services/api";
import type { Category, SubCategory } from "../types";
import LocationPickerModal from "../components/dashboard/CompanyManagement/LocationPickerModal";
import TermsAndConditionsModal from "../components/ui/TermsAndConditionsModal";
import { CustomSelect, type SelectOption } from "../components/ui/CustomSelect";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/dashboard/LanguageSwitcher";
/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */
type Lang = "en" | "am";

/* -------------------------------------------------------------------------- */
/*                              STATIC OPTIONS                                */
/* -------------------------------------------------------------------------- */
const BUSINESS_TYPE_VALUES = [
  { value: "store", labelKey: "bizTypeStore" },
  { value: "brand", labelKey: "bizTypeBrand" },
  { value: "factory", labelKey: "bizTypeFactory" },
  { value: "service", labelKey: "bizTypeService" },
  { value: "delivery_service", labelKey: "bizTypeDelivery" },
  { value: "other", labelKey: "bizTypeOther" },
] as const;

const TAX_TYPE_VALUES = [
  { value: "none", labelKey: "taxNone" },
  { value: "vat", labelKey: "taxVat" },
  { value: "turnover_goods", labelKey: "taxTurnoverGoods" },
  { value: "turnover_services", labelKey: "taxTurnoverServices" },
] as const;

/* -------------------------------------------------------------------------- */
/*                              TRANSLATIONS                                  */
/* -------------------------------------------------------------------------- */
const translations = {
  en: {
    /* Brand */
    brand: "Elilita",
    brandSub: "Vendor Partner Network",
    languageLabel: "Language",
    langEn: "EN",
    langAm: "አማ",

    /* Sidebar */
    registrationSteps: "Registration steps",
    statusActive: "In progress",
    statusDone: "Completed",
    statusPending: "Not started",
    overallProgress: "Overall progress",
    stepXofY: (x: number, y: number) => `Step ${x} of ${y}`,
    sidebarSecureNote:
      "Your business information and documents are securely handled during verification.",
    copyright: (year: number) =>
      `© ${year} Elilita. All rights reserved.`,

    /* Step titles */
    step1Title: "Contact & Business",
    step2Title: "Location",
    step3Title: "Tax & Legal",

    /* Headings */
    stepProgress: (x: number, y: number) => `Step ${x}/${y}`,
    step1Heading: "Contact & business information",
    step2Heading: "Business location",
    step3Heading: "Tax & legal compliance",
    step1Sub:
      "Tell us who you are and about the business you want to register.",
    step2Sub: "Add the physical address ",
    step3Sub:
      "Provide your tax information and upload required business documents.",

    alreadyRegistered: "Already registered?",
    signIn: "Sign in",

    /* Nav */
    previous: "Previous",
    continue: "Continue",
    submitting: "Submitting...",
    submitApplication: "Submit application",
    requiredNote: "Fields marked with * are required.",

    /* Common */
    optional: "(Optional)",

    /* Step 1 */
    fullLegalName: "Full legal name",
    emailAddress: "Email address",
    phoneNumber: "Phone number",
    yourRole: "Your role",
    businessNameEn: "Business name (English)",
    businessNameAm: "Business name (Amharic)",
    primaryCategory: "Primary category",
    subCategory: "Sub-category",
    businessType: "Business type",
    fan: "FAN",
    businessDescription: "Business description",
    businessDescriptionAm: "Business description (Amharic)",

    phFullName: "e.g. Abebe Bikila",
    phEmail: "owner@yourcompany.com",
    phPhone: "e.g. +251 91 123 4567",
    phRole: "Owner, General Manager...",
    phBusinessName: "e.g. Bole Fresh Grocery",
    phBusinessNameAm: "የንግድ ስም",
    phCategory: "Choose a category",
    phLoadingCategories: "Loading categories...",
    phSubCategory: "Select Sub-Category...",
    phSelectCategoryFirst: "Select a category first...",
    phNoSubCategories: "No subcategories available",
    phBusinessType: "Select business type",
    phFan: "Enter FAN / device number",
    phDescription: "Briefly describe your products or services...",
    phDescriptionAm:
      "ስለ ንግድዎ ወይም ስለሚያቀርቡት አገልግሎት አጭር መግለጫ...",

    infoContact:
      "Make sure your contact details are correct. We will use them to communicate with you during the verification process.",

    /* Business types */
    bizTypeStore: "Retail / Wholesale Store",
    bizTypeBrand: "Brand / Manufacturer",
    bizTypeFactory: "Factory / Production",
    bizTypeService: "Service Provider",
    bizTypeDelivery: "Delivery Service",
    bizTypeOther: "Other",

    /* Tax types */
    taxNone: "No Tax (Exempt or below threshold)",
    taxVat: "VAT (15% - Annual turnover > 2M ETB)",
    taxTurnoverGoods: "Turnover Tax - Goods (2%)",
    taxTurnoverServices: "Turnover Tax - Services (10%)",

    /* Step 2 */
    physicalAddressEn: "Physical address (English)",
    physicalAddressAm: "Physical address (Amharic)",
    phAddressEn: "Subcity, Woreda, street name, building, floor...",
    phAddressAm: "የንግድ ቦታ አድራሻ...",
    pinLocation: "Pin your business location",
    pinLocationDesc:
      "Adding a map location helps customers find your business and improves delivery distance calculations.",
    chooseOnMap: "Choose on map",
    latitude: "Latitude",
    longitude: "Longitude",
    phLat: "e.g. 9.005401",
    phLng: "e.g. 38.788523",
    gpsAdded: "GPS coordinates added",
    noCoords: "No coordinates yet",

    /* Step 3 */
    taxInfoTitle: "Tax information",
    taxInfoDesc: "Enter your official tax registration details.",
    tinNumber: "TIN number",
    phTin: "Enter your TIN number",
    taxTypeLabel: "Tax registration type",
    phTaxType: "Choose tax type",
    vatNumber: "VAT registration number",
    phVat: "e.g. VAT-1234567",
    businessDocsTitle: "Business documents",
    businessDocsDesc:
      "Upload clear copies of your official documents. Maximum file size is 5 MB per document.",
    tradeLicense: "Trade license / registration",
    moaDoc: "Memorandum of Association (MOA)",
    optionalForPlc: "(Optional for PLC)",
    uploadTradeLicense: "Upload trade license",
    uploadMoa: "Upload MOA document",
    fileFormats: "PDF, JPG, PNG · Up to 5 MB",
    removeFile: "Remove file",
    termsPrefix:
      "I confirm that I am the authorized legal representative (",
    termsMiddle:
      ") and that the information and documents provided are accurate. I have read and agree to the ",
    termsLink: "Elilita Merchant Terms & Conditions",
    termsSuffix: ".",

    /* Validation messages */
    errFullLegalName: "Full legal name is required",
    errEmailRequired: "Email address is required",
    errEmailInvalid: "Please enter a valid email address",
    errPhoneRequired: "Phone number is required",
    errBusinessName: "Business name is required",
    errCategory: "Please select a primary category",
    errSubCategory: "Please select a sub-category",
    errBusinessType: "Please select a business type",
    errAddress: "Physical business address is required",
    errTin: "Taxpayer Identification Number (TIN) is required",
    errLicenseRequired:
      "A valid Trade License / Registration Certificate file is required",
    errLicenseSize: "License file exceeds 5MB limit",
    errMoaSize: "MOA file exceeds 5MB limit",
    errTerms:
      "You must review and agree to the platform Terms and Conditions",
    errNetwork:
      "A network error occurred while submitting your application. Please check your connection and try again.",
    errBackendGeneric:
      "Please correct the errors indicated below before submitting.",

    /* Success screen */
    successBadge: "Application received",
    successTitle: "You're one step closer!",
    successBody:
      "Thank you for choosing Elilita. Your business registration application and documents have been submitted successfully and are now waiting for verification.",
    referenceLabel: "Your application reference",
    copyTitle: "Copy reference code",
    copyAria: "Copy reference code",
    referenceHintBefore: "Keep this code to refer to your application. A confirmation email has been sent to ",
    referenceHintAfter: ".",
    nextStepsTitle: "What happens next?",
    nextStep1Title: "Compliance Review",
    nextStep1Desc:
      "Our compliance team reviews your business license and documents within 24–48 business hours.",
    nextStep2Title: "Approval & Invitation",
    nextStep2Desc:
      "Once approved, you will receive an invitation email with a secure link to set your account password.",
    nextStep3Title: "Dashboard Access",
    nextStep3Desc:
      "After setting your password, access your management dashboard to add products, staff, and start selling.",
    goToSignIn: "Go to sign in",
    secureFooter: "Your information is securely handled.",

    /* Aria */
    ariaUploadTradeLicense: "Upload Trade License",
    ariaUploadMoa: "Upload MOA Document",
    ariaPrimaryCategory: "Primary Category",
    ariaSubCategory: "Sub-Category",
    ariaBusinessType: "Business type",
    ariaTaxType: "Tax Registration Type",
    altLogo: "Elilita Logo",
  },
  am: {
    /* Brand */
    brand: "ኤሊሊታ",
    brandSub: "የአቅራቢ አጋር አውታረ መረብ",
    languageLabel: "ቋንቋ",
    langEn: "EN",
    langAm: "አማ",

    /* Sidebar */
    registrationSteps: "የምዝገባ ደረጃዎች",
    statusActive: "በሂደት ላይ",
    statusDone: "ተጠናቋል",
    statusPending: "አልተጀመረም",
    overallProgress: "አጠቃላይ ሂደት",
    stepXofY: (x: number, y: number) => `ደረጃ ${x} ከ ${y}`,
    sidebarSecureNote:
      "የንግድ መረጃዎ እና ሰነዶችዎ በማረጋገጫ ጊዜ በደህንነት ይያዛሉ።",
    copyright: (year: number) =>
      `© ${year} ኤሊሊታ። መብቱ በህግ የተጠበቀ ነው።`,

    /* Step titles */
    step1Title: "ግንኙነት እና ንግድ",
    step2Title: "አካባቢ",
    step3Title: "ታክስ እና ህጋዊ",

    /* Headings */
    stepProgress: (x: number, y: number) => `ደረጃ ${x}/${y}`,
    step1Heading: "የግንኙነት እና የንግድ መረጃ",
    step2Heading: "የንግድ አካባቢ",
    step3Heading: "የታክስ እና ህጋዊ ተገዢነት",
    step1Sub:
      "እርስዎ ማን እንደሆኑ እና ማስመዘገብ ስለሚፈልጉት ንግድ ይንገሩን።",
    step2Sub: "አካላዊ አድራሻውን ያክሉ እና ንግድዎን በካርታ ላይ ያስቀምጡ።",
    step3Sub:
      "የታክስ መረጃዎን ያቅርቡ እና አስፈላጊ የንግድ ሰነዶችን ይስቀሉ።",

    alreadyRegistered: "አስቀድመው ተመዝግበዋል?",
    signIn: "ይግቡ",

    /* Nav */
    previous: "ወደኋላ",
    continue: "ቀጥል",
    submitting: "በመላክ ላይ...",
    submitApplication: "ማመልከቻ አስገባ",
    requiredNote:
      "በ * ምልክት የተደረገባቸው መስኮች ያስፈልጋሉ።",

    /* Common */
    optional: "(አማራጭ)",

    /* Step 1 */
    fullLegalName: "ሙሉ ህጋዊ ስም",
    emailAddress: "የኢሜይል አድራሻ",
    phoneNumber: "የስልክ ቁጥር",
    yourRole: "ሚናዎ",
    businessNameEn: "የንግድ ስም (እንግሊዝኛ)",
    businessNameAm: "የንግድ ስም (አማርኛ)",
    primaryCategory: "ዋና ምድብ",
    subCategory: "ንዑስ ምድብ",
    businessType: "የንግድ አይነት",
    fan: "ፋን (FAN)",
    businessDescription: "የንግድ መግለጫ",
    businessDescriptionAm: "የንግድ መግለጫ (አማርኛ)",

    phFullName: "ለምሳሌ አበበ ቢቂላ",
    phEmail: "owner@yourcompany.com",
    phPhone: "ለምሳሌ +251 91 123 4567",
    phRole: "ባለቤት፣ ዋና ስራ አስኪያጅ...",
    phBusinessName: "ለምሳሌ ቦሌ ፍሬሽ ግሮሰሪ",
    phBusinessNameAm: "የንግድ ስም",
    phCategory: "ምድብ ይምረጡ",
    phLoadingCategories: "ምድቦች በመጫን ላይ...",
    phSubCategory: "ንዑስ ምድብ ይምረጡ...",
    phSelectCategoryFirst: "መጀመሪያ ምድብ ይምረጡ...",
    phNoSubCategories: "ንዑስ ምድቦች የሉም",
    phBusinessType: "የንግድ አይነት ይምረጡ",
    phFan: "FAN / የመሳሪያ ቁጥር ያስገቡ",
    phDescription: "ስለ ምርቶችዎ ወይም አገልግሎቶችዎ በአጭሩ ይግለጹ...",
    phDescriptionAm:
      "ስለ ንግድዎ ወይም ስለሚያቀርቡት አገልግሎት አጭር መግለጫ...",

    infoContact:
      "የግንኙነት ዝርዝሮችዎ ትክክል መሆናቸውን ያረጋግጡ። በማረጋገጫ ሂደት ወቅት ከእርስዎ ጋር ለመግባባት እንጠቀምባቸዋለን።",

    /* Business types */
    bizTypeStore: "ችርቻሮ / ጅምላ መደብር",
    bizTypeBrand: "ብራንድ / አምራች",
    bizTypeFactory: "ፋብሪካ / ምርት",
    bizTypeService: "አገልግሎት አቅራቢ",
    bizTypeDelivery: "የማድረሻ አገልግሎት",
    bizTypeOther: "ሌላ",

    /* Tax types */
    taxNone: "ታክስ የለም (ከደረጃ በታች ወይም ነፃ)",
    taxVat: "ተእታ (VAT) (15% - ዓመታዊ ገቢ > 2 ሚሊዮን ብር)",
    taxTurnoverGoods: "የሽያጭ ታክስ - ሸቀጦች (2%)",
    taxTurnoverServices: "የሽያጭ ታክስ - አገልግሎቶች (10%)",

    /* Step 2 */
    physicalAddressEn: "አካላዊ አድራሻ (እንግሊዝኛ)",
    physicalAddressAm: "አካላዊ አድራሻ (አማርኛ)",
    phAddressEn: "ክፍለ ከተማ፣ ወረዳ፣ የመንገድ ስም፣ ህንፃ፣ ፎቅ...",
    phAddressAm: "የንግድ ቦታ አድራሻ...",
    pinLocation: "የንግድ ቦታዎን ያስቀምጡ",
    pinLocationDesc:
      "የካርታ ቦታ ማከል ደንበኞች ንግድዎን እንዲያገኙ ይረዳል እና የማድረሻ ርቀት ስሌቶችን ያሻሽላል።",
    chooseOnMap: "በካርታ ላይ ይምረጡ",
    latitude: "ኬክሮስ",
    longitude: "ኬንትሮስ",
    phLat: "ለምሳሌ 9.005401",
    phLng: "ለምሳሌ 38.788523",
    gpsAdded: "የጂፒኤስ መጋጠሚያዎች ተጨምረዋል",
    noCoords: "እስካሁን መጋጠሚያ የለም",

    /* Step 3 */
    taxInfoTitle: "የታክስ መረጃ",
    taxInfoDesc: "የእርስዎን ኦፊሴላዊ የታክስ ምዝገባ ዝርዝሮች ያስገቡ።",
    tinNumber: "የቲን (TIN) ቁጥር",
    phTin: "የቲን ቁጥርዎን ያስገቡ",
    taxTypeLabel: "የታክስ ምዝገባ አይነት",
    phTaxType: "የታክስ አይነት ይምረጡ",
    vatNumber: "የተእታ (VAT) ምዝገባ ቁጥር",
    phVat: "ለምሳሌ VAT-1234567",
    businessDocsTitle: "የንግድ ሰነዶች",
    businessDocsDesc:
      "የኦፊሴላዊ ሰነዶችዎን ግልጽ ቅጂዎች ይስቀሉ። ለአንድ ሰነድ ከፍተኛው የፋይል መጠን 5 ሜባ ነው።",
    tradeLicense: "የንግድ ፈቃድ / ምዝገባ",
    moaDoc: "የማህበር ስምምነት (MOA)",
    optionalForPlc: "(ለፒኤልሲ አማራጭ)",
    uploadTradeLicense: "የንግድ ፈቃድ ይስቀሉ",
    uploadMoa: "የMOA ሰነድ ይስቀሉ",
    fileFormats: "PDF, JPG, PNG · እስከ 5 ሜባ",
    removeFile: "ፋይል አስወግድ",
    termsPrefix:
      "እኔ ስልጣን ያለው ህጋዊ ወኪል መሆኔን (",
    termsMiddle:
      ") እና የቀረበው መረጃ እና ሰነዶች ትክክል መሆናቸውን አረጋግጣለሁ። ያነበብኩት እና ተስማምቻለሁ ",
    termsLink: "የኤሊሊታ ነጋዴ ውሎች እና ሁኔታዎች",
    termsSuffix: "።",

    /* Validation messages */
    errFullLegalName: "ሙሉ ህጋዊ ስም ያስፈልጋል",
    errEmailRequired: "የኢሜይል አድራሻ ያስፈልጋል",
    errEmailInvalid: "እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ",
    errPhoneRequired: "የስልክ ቁጥር ያስፈልጋል",
    errBusinessName: "የንግድ ስም ያስፈልጋል",
    errCategory: "እባክዎ ዋና ምድብ ይምረጡ",
    errSubCategory: "እባክዎ ንዑስ ምድብ ይምረጡ",
    errBusinessType: "እባክዎ የንግድ አይነት ይምረጡ",
    errAddress: "አካላዊ የንግድ አድራሻ ያስፈልጋል",
    errTin: "የግብር ከፋይ መለያ ቁጥር (TIN) ያስፈልጋል",
    errLicenseRequired:
      "ትክክለኛ የንግድ ፈቃድ / የምዝገባ ሰነድ ፋይል ያስፈልጋል",
    errLicenseSize: "የፈቃድ ፋይል ከ5MB ይበልጣል",
    errMoaSize: "የMOA ፋይል ከ5MB ይበልጣል",
    errTerms:
      "የመድረኩን ውሎች እና ሁኔታዎች ማጤን እና መቀበል አለብዎት",
    errNetwork:
      "ማመልከቻዎን በሚልኩበት ጊዜ የኔትወርክ ስህተት ተከስቷል። እባክዎ ግንኙነትዎን ያረጋግጡ እና እንደገና ይሞክሩ።",
    errBackendGeneric:
      "እባክዎ ከመላክዎ በፊት ከዚህ በታች የተመለከቱትን ስህተቶች ያስተካክሉ።",

    /* Success screen */
    successBadge: "ማመልከቻ ተቀብለናል",
    successTitle: "አንድ ደረጃ ቀርበዋል!",
    successBody:
      "ኤሊሊታን ስለመረጡ እናመሰግናለን። የንግድ ምዝገባ ማመልከቻዎ እና ሰነዶችዎ በተሳካ ሁኔታ ገብተዋል እና አሁን ማረጋገጫ በመጠበቅ ላይ ናቸው።",
    referenceLabel: "የማመልከቻዎ ማጣቀሻ",
    copyTitle: "የማጣቀሻ ኮድ ቅዳ",
    copyAria: "የማጣቀሻ ኮድ ቅዳ",
    referenceHintBefore:
      "ይህን ኮድ ማመልከቻዎን ለማመልከት ያስቀምጡ። የማረጋገጫ ኢሜይል ወደ ",
    referenceHintAfter: " ተልኳል።",
    nextStepsTitle: "ቀጣይ ምን ይሆናል?",
    nextStep1Title: "የተገዢነት ግምገማ",
    nextStep1Desc:
      "የተገዢነት ቡድናችን በ24–48 የስራ ሰዓታት ውስጥ የንግድ ፈቃድዎን እና ሰነዶችዎን ይገመግማል።",
    nextStep2Title: "ማጽደቅ እና ግብዣ",
    nextStep2Desc:
      "ከጸደቀ በኋላ፣ የመለያ ይለፍ ቃልዎን ለማዘጋጀት ደህንነቱ የተጠበቀ አገናኝ የያዘ የግብዣ ኢሜይል ይደርስዎታል።",
    nextStep3Title: "የዳሽቦርድ መዳረሻ",
    nextStep3Desc:
      "የይለፍ ቃልዎን ካዘጋጁ በኋላ፣ ምርቶችን እና ሰራተኞችን ለማከል እና ሽያጭ ለመጀመር የአስተዳደር ዳሽቦርድዎን ይድረሱ።",
    goToSignIn: "ወደ መግቢያ ይሂዱ",
    secureFooter: "መረጃዎ በደህንነት ይያዛል።",

    /* Aria */
    ariaUploadTradeLicense: "የንግድ ፈቃድ ይስቀሉ",
    ariaUploadMoa: "የMOA ሰነድ ይስቀሉ",
    ariaPrimaryCategory: "ዋና ምድብ",
    ariaSubCategory: "ንዑስ ምድብ",
    ariaBusinessType: "የንግድ አይነት",
    ariaTaxType: "የታክስ ምዝገባ አይነት",
    altLogo: "የኤሊሊታ አርማ",
  },
} as const;

type Dict = typeof translations.en;

/* -------------------------------------------------------------------------- */
/*                              STYLE HELPERS                                 */
/* -------------------------------------------------------------------------- */
const baseInput =
  "w-full h-10 rounded-lg border bg-white text-sm text-[#111827] placeholder:text-gray-400 outline-none transition-all disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

const inputState = (err?: string) =>
  err
    ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
    : "border-[#E5E7EB] focus:border-[#6750A4] focus:ring-4 focus:ring-[#6750A4]/10";
const inputCls = (err?: string, extra = "") =>
  `${baseInput} ${inputState(err)} ${extra}`;

const baseTextarea =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-gray-400 outline-none transition-all resize-none";
const textareaCls = (err?: string) => `${baseTextarea} ${inputState(err)}`;

const labelCls = "mb-1 block text-xs font-semibold text-[#111827]";
const errorCls = "mt-1 text-xs font-medium text-red-600";
const optionalCls = "ml-1 text-[11px] font-normal text-[#6B7280]";

const customSelectCls = (hasError?: boolean, disabled?: boolean) =>
  [
    "[&>button]:h-10 [&>button]:rounded-lg [&>button]:bg-white [&>button]:px-3.5 [&>button]:text-sm [&>button]:text-[#111827]",
    hasError
      ? "[&>button]:border-red-300 [&>button]:focus:border-red-400 [&>button]:focus:ring-4 [&>button]:focus:ring-red-100"
      : "[&>button]:border-[#E5E7EB] [&>button]:focus:border-[#6750A4] [&>button]:focus:ring-4 [&>button]:focus:ring-[#6750A4]/10",
    disabled
      ? "pointer-events-none [&>button]:opacity-60 [&>button]:cursor-not-allowed"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */
export default function VendorRegister(): React.JSX.Element {
  /* ------------------------------- Language ------------------------------- */
  // const [lang, setLang] = useState<Lang>("en");
  // const t: Dict = translations[lang] as Dict;
const { i18n } = useTranslation();

const currentLanguage =
  i18n.resolvedLanguage?.split("-")[0] ||
  i18n.language?.split("-")[0] ||
  "en";

const lang: Lang = currentLanguage === "am" ? "am" : "en";

const t = translations[lang];
  /* -------------------------------- State --------------------------------- */
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* Categories */
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);

  /* Step 1 – Contact */
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryRole, setSignatoryRole] = useState("Owner");

  /* Step 1 – Business */
  const [companyName, setCompanyName] = useState("");
  const [companyNameAm, setCompanyNameAm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | "">("");
  const [businessType, setBusinessType] = useState("store");
  const [description, setDescription] = useState("");
  const [descriptionAm, setDescriptionAm] = useState("");

  /* Step 2 – Location */
  const [address, setAddress] = useState("");
  const [addressAm, setAddressAm] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  /* Step 3 – Compliance */
  const [tinNumber, setTinNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [fanNumber, setFanNumber] = useState("");
  const [taxType, setTaxType] = useState("none");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [moaFile, setMoaFile] = useState<File | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  /* Bot protection */
  const [hpCompanyField, setHpCompanyField] = useState("");

  /* Success */
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);
const moaPreviewUrl = React.useMemo(
  () => (moaFile && moaFile.type.startsWith("image/")
    ? URL.createObjectURL(moaFile)
    : null),
  [moaFile]
);

useEffect(() => {
  return () => {
    if (moaPreviewUrl) URL.revokeObjectURL(moaPreviewUrl);
  };
}, [moaPreviewUrl]);
  /* ---------------------------- Load categories --------------------------- */
  useEffect(() => {
    let mounted = true;
    const fetchCats = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await getCategories();
        if (mounted) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.results || [];
          setCategories(list);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    };
    fetchCats();
    return () => {
      mounted = false;
    };
  }, []);

  const licensePreviewUrl = React.useMemo(
  () =>
    licenseFile && licenseFile.type.startsWith("image/")
      ? URL.createObjectURL(licenseFile)
      : null,
  [licenseFile],
);

useEffect(() => {
  return () => {
    if (licensePreviewUrl) URL.revokeObjectURL(licensePreviewUrl);
  };
}, [licensePreviewUrl]);
  /* --------------------------- Load subcategories ------------------------- */
  useEffect(() => {
    let mounted = true;
    if (!selectedCategory) {
      setSubCategories([]);
      setSelectedSubCategory("");
      return;
    }

    const catObj = categories.find((c) => c.id === Number(selectedCategory));
    if (
      catObj &&
      Array.isArray((catObj as any).subcategories) &&
      (catObj as any).subcategories.length > 0
    ) {
      setSubCategories((catObj as any).subcategories);
      return;
    }

    const fetchSubCats = async () => {
      try {
        const slug = catObj?.slug;
        const res = await getSubCategories(slug);
        if (mounted) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.results || [];
          setSubCategories(list);
        }
      } catch (err) {
        console.error("Failed to load subcategories:", err);
      }
    };
    fetchSubCats();

    return () => {
      mounted = false;
    };
  }, [selectedCategory, categories]);

  /* ------------------------------ Validation ------------------------------ */
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    /* Contact */
    if (!contactName.trim()) errs.contactName = t.errFullLegalName;
    if (!contactEmail.trim()) {
      errs.contactEmail = t.errEmailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      errs.contactEmail = t.errEmailInvalid;
    }
    if (!contactPhone.trim()) errs.contactPhone = t.errPhoneRequired;
    /* Business */
    if (!companyName.trim()) errs.companyName = t.errBusinessName;
    if (!selectedCategory) errs.category = t.errCategory;
    if (!selectedSubCategory) errs.subCategory = t.errSubCategory;
    if (!businessType) errs.businessType = t.errBusinessType;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = t.errAddress;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!tinNumber.trim()) errs.tinNumber = t.errTin;
    if (!licenseFile) {
      errs.licenseFile = t.errLicenseRequired;
    } else if (licenseFile.size > 5 * 1024 * 1024) {
      errs.licenseFile = t.errLicenseSize;
    }
    if (moaFile && moaFile.size > 5 * 1024 * 1024) {
      errs.moaFile = t.errMoaSize;
    }
    if (!termsAgreed) {
      errs.termsAgreed = t.errTerms;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ------------------------------ Navigation ------------------------------ */
  const handleNextStep = () => {
    setGlobalError(null);
    if (step === 1 && validateStep1()) {
      if (!signatoryName.trim()) {
        setSignatoryName(contactName.trim());
      }
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setGlobalError(null);
    setFieldErrors({});
    if (step > 1) setStep(step - 1);
  };

  /* -------------------------------- Submit -------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    try {
      setIsSubmitting(true);
      setGlobalError(null);

      const formData = new FormData();
      formData.append("contact_name", contactName.trim());
      formData.append("contact_email", contactEmail.trim().toLowerCase());
      formData.append("contact_phone", contactPhone.trim());
      formData.append(
        "terms_signatory_name",
        (signatoryName || contactName).trim(),
      );
      formData.append(
        "terms_signatory_role",
        (signatoryRole || "Owner").trim(),
      );

      formData.append("name", companyName.trim());
      if (companyNameAm.trim())
        formData.append("name_am", companyNameAm.trim());
      formData.append("category", String(selectedCategory));
      formData.append("sub_category", String(selectedSubCategory));
      formData.append("business_type", businessType);
      if (description.trim())
        formData.append("description", description.trim());
      if (descriptionAm.trim())
        formData.append("description_am", descriptionAm.trim());

      formData.append("address", address.trim());
      if (addressAm.trim()) formData.append("address_am", addressAm.trim());
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);

      formData.append("tin_number", tinNumber.trim());
      if (vatNumber.trim())
        formData.append("vat_registration_number", vatNumber.trim());
      if (fanNumber.trim()) formData.append("fan_number", fanNumber.trim());
      formData.append("tax_type", taxType);

      if (licenseFile) formData.append("license_file", licenseFile);
      if (moaFile) formData.append("moa_file", moaFile);

      formData.append("terms_agreed", "true");

      if (hpCompanyField) {
        formData.append("hp_company_field", hpCompanyField);
      }

      const res = await submitVendorRegistration(formData);
      setReferenceCode(res.data.reference_code || "APP-PENDING");
      setStep(4);
    } catch (err: any) {
      console.error("Submission failed:", err);
      const data = err.response?.data;
      if (data) {
        if (typeof data === "string") {
          setGlobalError(data);
        } else if (data.detail) {
          setGlobalError(data.detail);
        } else {
          const errMap: Record<string, string> = {};
          Object.keys(data).forEach((key) => {
            const val = data[key];
            errMap[key] = Array.isArray(val) ? val.join(" ") : String(val);
          });
          setFieldErrors(errMap);
          setGlobalError(t.errBackendGeneric);
        }
      } else {
        setGlobalError(t.errNetwork);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReferenceCode = () => {
    if (referenceCode) {
      navigator.clipboard.writeText(referenceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  /* ------------------------------ Select Data ----------------------------- */
  const categoryOptions: SelectOption[] = categories.map((c) => ({
    label: c.name_am ? `${c.name} (${c.name_am})` : c.name,
    value: String(c.id),
  }));

  const subCategoryOptions: SelectOption[] = subCategories.map((sc) => ({
    label: sc.name_am ? `${sc.name} (${sc.name_am})` : sc.name,
    value: String(sc.id),
  }));

  const businessTypeOptions: SelectOption[] = BUSINESS_TYPE_VALUES.map((b) => ({
    label: t[b.labelKey as keyof Dict] as string,
    value: b.value,
  }));

  const taxTypeOptions: SelectOption[] = TAX_TYPE_VALUES.map((tx) => ({
    label: t[tx.labelKey as keyof Dict] as string,
    value: tx.value,
  }));

  const subCategoryPlaceholder = !selectedCategory
    ? t.phSelectCategoryFirst
    : subCategories.length === 0
      ? t.phNoSubCategories
      : t.phSubCategory;

  const stepTitles = [t.step1Title, t.step2Title, t.step3Title];
  const stepHeadings = [t.step1Heading, t.step2Heading, t.step3Heading];
  const stepSubs = [t.step1Sub, t.step2Sub, t.step3Sub];
  const totalSteps = 3;

 

  /* ------------------------------- Render --------------------------------- */
  return (
    <div className="min-h-screen bg-[#EEF4FA] text-gray-900 selection:bg-[#6750A4]/20">
      {step < 4 ? (
        /* =========================== FORM STAGE =========================== */
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
          {/* ==================== LEFT SIDEBAR ==================== */}
         

<aside className="relative flex min-h-0 shrink-0 flex-col overflow-hidden bg-[#6750A4] px-4 py-4 text-white sm:px-5 lg:h-full lg:w-[250px] lg:px-4 lg:py-4 xl:w-[270px] xl:px-5">

  {/* Decorative background */}
  <div className="pointer-events-none absolute -right-24 top-24 h-56 w-56 rounded-full border border-white/[0.08]" />
  <div className="pointer-events-none absolute -left-24 bottom-10 h-52 w-52 rounded-full border border-white/[0.08]" />
  <div className="pointer-events-none absolute -right-12 bottom-[-100px] h-56 w-56 rounded-full border border-white/[0.06]" />

  {/* Brand */}
  <Link
    to="/"
    className="relative z-10 flex shrink-0 items-center gap-2.5"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
      <img
        src="/elilta1.jpg"
        alt={t.altLogo}
        className="h-full w-full object-contain p-1"
      />
    </span>

    <span className="min-w-0">
      <span className="block text-lg font-bold tracking-tight">
        {t.brand}
      </span>
      <span className="block truncate text-[8px] font-semibold uppercase tracking-[0.15em] text-white/65">
        {t.brandSub}
      </span>
    </span>
  </Link>

  {/* Desktop vertical steps */}
  <div className="relative z-10 mt-6 hidden min-h-0 shrink-0 lg:block">
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
        {t.registrationSteps}
      </p>
      <p className="mt-1 text-[11px] text-white/45">
        Complete the steps to register your business.
      </p>
    </div>

    <div className="relative space-y-3">
      {/* Connecting line */}
      <div className="absolute bottom-7 left-[17px] top-7 w-px bg-white/20" />

      {stepTitles.map((title, idx) => {
        const num = idx + 1;
        const isActive = step === num;
        const isDone = step > num;

        return (
          <div
            key={num}
            className={`relative flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-300 ${
              isActive
                ? "bg-white/[0.13] ring-1 ring-white/[0.12]"
                : ""
            }`}
          >
            <div
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                isDone
                  ? "border-white bg-white text-[#6750A4]"
                  : isActive
                    ? "border-white bg-white text-[#6750A4] shadow-[0_0_0_3px_rgba(255,255,255,0.14)]"
                    : "border-white/30 bg-white/[0.08] text-white/65"
              }`}
            >
              {isDone ? (
                <Check className="h-4 w-4 stroke-[2.5]" />
              ) : (
                <span className="text-xs font-bold">{num}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-xs font-semibold ${
                  isActive || isDone ? "text-white" : "text-white/60"
                }`}
              >
                {title}
              </p>

              <p className="mt-0.5 text-[10px] font-medium text-white/55">
                {isActive
                  ? t.statusActive
                  : isDone
                    ? t.statusDone
                    : t.statusPending}
              </p>
            </div>

            {isActive && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
            )}
          </div>
        );
      })}
    </div>

   {/* Progress card */}
<div className="hidden lg:block md:mt-5 rounded-xl border border-white/10 bg-white/[0.09] p-3">
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] font-medium text-white/70">
      {t.overallProgress}
    </span>

    <span className="text-xs font-bold tabular-nums text-white">
      {Math.round((step / totalSteps) * 100)}%
    </span>
  </div>

  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
    <div
      className="h-full rounded-full bg-white transition-all duration-500"
      style={{
        width: `${(step / totalSteps) * 100}%`,
      }}
    />
  </div>

  <p className="mt-2 text-[10px] text-white/60">
    {t.stepXofY(step, totalSteps)}
  </p>
</div>
  </div>

  {/* Mobile horizontal progress */}
  {/* <div className="relative z-10 mt-4 shrink-0 lg:hidden">
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/65">
        {t.registrationSteps}
      </p>
      <span className="text-[10px] font-semibold text-white/70">
        {Math.round((step / totalSteps) * 100)}%
      </span>
    </div>

    <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/20">
      <div
        className="h-full rounded-full bg-white transition-all duration-300"
        style={{
          width: `${(step / totalSteps) * 100}%`,
        }}
      />
    </div>

    <div className="flex items-center justify-between gap-1">
      {stepTitles.map((title, idx) => {
        const num = idx + 1;
        const isActive = step === num;
        const isDone = step > num;

        return (
          <React.Fragment key={num}>
            <div className="flex min-w-0 flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                  isActive || isDone
                    ? "border-white bg-white text-[#6750A4]"
                    : "border-white/30 bg-white/10 text-white/65"
                }`}
              >
                {isDone ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="text-[10px] font-bold">{num}</span>
                )}
              </div>

              <span
                className={`max-w-[85px] truncate text-center text-[8px] ${
                  isActive
                    ? "font-bold text-white"
                    : "font-medium text-white/60"
                }`}
              >
                {title}
              </span>
            </div>

            {idx < stepTitles.length - 1 && (
              <div
                className={`mb-4 h-px min-w-3 flex-1 ${
                  step > num ? "bg-white" : "bg-white/25"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div> */}

  {/* Footer */}
  <div className="relative z-10 mt-auto hidden shrink-0 border-t border-white/15 pt-3 lg:block">
    <div className="flex items-start gap-2">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/75" />

      <p className="text-[10px] leading-[1.6] text-white/70">
        {t.sidebarSecureNote}
      </p>
    </div>

    <p className="mt-3 text-[9px] text-white/45">
      {t.copyright(new Date().getFullYear())}
    </p>
  </div>
</aside>


          {/* ==================== RIGHT FORM AREA ==================== */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white lg:h-full lg:overflow-hidden">
            <div className="mx-auto flex w-full max-w-full flex-1 flex-col px-3 pb-0 pt-3 sm:px-5 lg:min-h-0 lg:px-6 xl:px-8">
              {/* Top bar */}
              <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#6750A4]">
                    {t.stepProgress(step, totalSteps)}
                  </p>
                  <h1 className="mt-0.5 truncate text-sm lg:text-lg font-bold tracking-tight text-[#6750A4] sm:text-xl xl:text-2xl">
                    {stepHeadings[step - 1]}
                  </h1>
                  <p className="mt-0.5 max-w-xl text-[11px] leading-5 text-gray-500 sm:text-xs">
                    {stepSubs[step - 1]}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* <LanguageSwitcher /> */}
                  <span className="hidden text-xs text-gray-500 sm:inline">
                    {t.alreadyRegistered}
                  </span>
                  <Link
                    to="/signin"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#6750A4] hover:text-[#6750A4]"
                  >
                    {t.signIn}
                  </Link>
                </div>
              </div>

              {/* Global error */}
              {globalError && (
                <div className="mb-3 flex shrink-0 items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-xs leading-5 text-red-700">{globalError}</p>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={
                  step === 3
                    ? handleSubmit
                    : (e) => {
                        e.preventDefault();
                        handleNextStep();
                      }
                }
                className="flex flex-1 flex-col lg:min-h-0"
              >
                {/* Honeypot */}
                <input
                  type="text"
                  name="hp_company_field"
                  value={hpCompanyField}
                  onChange={(e) => setHpCompanyField(e.target.value)}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    opacity: 0,
                    height: 0,
                    width: 0,
                  }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Scrollable content */}
                <div className="flex-1 pb-5 lg:min-h-0 lg:overflow-y-auto lg:pb-6">
                  {/* ============ STEP 1 – CONTACT & BUSINESS ============ */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {/* Contact + Business fields */}
                      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                        {/* Full legal name */}
                        <div>
                          <label className={labelCls}>
                            {t.fullLegalName}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              required
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder={t.phFullName}
                              className={inputCls(
                                fieldErrors.contactName,
                                "pl-10",
                              )}
                            />
                          </div>
                          {fieldErrors.contactName && (
                            <p className={errorCls}>
                              {fieldErrors.contactName}
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <label className={labelCls}>
                            {t.emailAddress}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              required
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              placeholder={t.phEmail}
                              className={inputCls(
                                fieldErrors.contactEmail,
                                "pl-10",
                              )}
                            />
                          </div>
                          {fieldErrors.contactEmail && (
                            <p className={errorCls}>
                              {fieldErrors.contactEmail}
                            </p>
                          )}
                        </div>

                        {/* Phone */}
                        <div>
                          <label className={labelCls}>
                            {t.phoneNumber}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              required
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              placeholder={t.phPhone}
                              className={inputCls(
                                fieldErrors.contactPhone,
                                "pl-10",
                              )}
                            />
                          </div>
                          {fieldErrors.contactPhone && (
                            <p className={errorCls}>
                              {fieldErrors.contactPhone}
                            </p>
                          )}
                        </div>

                        {/* Role */}
                        <div>
                          <label className={labelCls}>
                            {t.yourRole}
                            <span className={optionalCls}>{t.optional}</span>
                          </label>
                          <input
                            type="text"
                            value={signatoryRole}
                            onChange={(e) => setSignatoryRole(e.target.value)}
                            placeholder={t.phRole}
                            className={inputCls()}
                          />
                        </div>

                        {/* Business name EN */}
                        <div>
                          <label className={labelCls}>
                            {t.businessNameEn}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder={t.phBusinessName}
                            className={inputCls(fieldErrors.companyName)}
                          />
                          {fieldErrors.companyName && (
                            <p className={errorCls}>{fieldErrors.companyName}</p>
                          )}
                        </div>

                        {/* Business name AM */}
                        <div>
                          <label className={labelCls}>
                            {t.businessNameAm}
                            <span className={optionalCls}>{t.optional}</span>
                          </label>
                          <input
                            type="text"
                            value={companyNameAm}
                            onChange={(e) => setCompanyNameAm(e.target.value)}
                            placeholder={t.phBusinessNameAm}
                            className={inputCls()}
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className={labelCls}>
                            {t.primaryCategory}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            value={String(selectedCategory)}
                            onChange={(val) =>
                              setSelectedCategory(Number(val) || "")
                            }
                            options={categoryOptions}
                            placeholder={
                              isLoadingCategories
                                ? t.phLoadingCategories
                                : t.phCategory
                            }
                            ariaLabel={t.ariaPrimaryCategory}
                            className={customSelectCls(
                              !!fieldErrors.category,
                              isLoadingCategories,
                            )}
                          />
                          {fieldErrors.category && (
                            <p className={errorCls}>{fieldErrors.category}</p>
                          )}
                        </div>

                        {/* Sub-category */}
                        <div>
                          <label className={labelCls}>
                            {t.subCategory}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            value={String(selectedSubCategory)}
                            onChange={(val) =>
                              setSelectedSubCategory(Number(val) || "")
                            }
                            options={subCategoryOptions}
                            placeholder={subCategoryPlaceholder}
                            ariaLabel={t.ariaSubCategory}
                            className={customSelectCls(
                              !!fieldErrors.subCategory,
                              !selectedCategory || subCategories.length === 0,
                            )}
                          />
                          {fieldErrors.subCategory && (
                            <p className={errorCls}>{fieldErrors.subCategory}</p>
                          )}
                        </div>

                        {/* Business type */}
                        <div>
                          <label className={labelCls}>
                            {t.businessType}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <CustomSelect
                            value={businessType}
                            onChange={setBusinessType}
                            options={businessTypeOptions}
                            placeholder={t.phBusinessType}
                            ariaLabel={t.ariaBusinessType}
                            maxHeight={220}
                            className={customSelectCls(
                              !!fieldErrors.businessType,
                            )}
                          />
                          {fieldErrors.businessType && (
                            <p className={errorCls}>
                              {fieldErrors.businessType}
                            </p>
                          )}
                        </div>

                     
                      </div>

                      {/* Descriptions (2-col) */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>
                            {t.businessDescription}
                            <span className={optionalCls}>{t.optional}</span>
                          </label>
                          <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.phDescription}
                            className={textareaCls()}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>
                            {t.businessDescriptionAm}
                            <span className={optionalCls}>{t.optional}</span>
                          </label>
                          <textarea
                            rows={2}
                            value={descriptionAm}
                            onChange={(e) => setDescriptionAm(e.target.value)}
                            placeholder={t.phDescriptionAm}
                            className={textareaCls()}
                          />
                        </div>
                      </div>

                      {/* Info banner */}
                      <div className="rounded-lg border border-[#6750A4]/10 bg-[#F8F7FB] p-3">
                        <div className="flex gap-2.5">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6750A4]" />
                          <p className="text-xs leading-5 text-gray-600">
                            {t.infoContact}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============ STEP 2 – LOCATION ============ */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>
                            {t.physicalAddressEn}{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={t.phAddressEn}
                            className={textareaCls(fieldErrors.address)}
                          />
                          {fieldErrors.address && (
                            <p className={errorCls}>{fieldErrors.address}</p>
                          )}
                        </div>

                        <div>
                          <label className={labelCls}>
                            {t.physicalAddressAm}
                            <span className={optionalCls}>{t.optional}</span>
                          </label>
                          <textarea
                            rows={2}
                            value={addressAm}
                            onChange={(e) => setAddressAm(e.target.value)}
                            placeholder={t.phAddressAm}
                            className={textareaCls()}
                          />
                        </div>
                      </div>

                      {/* GPS card */}
                      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6750A4]/10 text-[#6750A4]">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">
                                {t.pinLocation}
                              </h3>
                              <p className="mt-0.5 max-w-lg text-xs leading-5 text-gray-500">
                                {t.pinLocationDesc}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#6750A4]/30 bg-white px-4 text-xs font-semibold text-[#6750A4] transition hover:bg-[#6750A4]/5"
                          >
                            <MapPin className="h-4 w-4" />
                            {t.chooseOnMap}
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3">
                          <div>
                            <label className={labelCls}>{t.latitude}</label>
                            <input
                              type="text"
                              value={latitude}
                              onChange={(e) => setLatitude(e.target.value)}
                              placeholder={t.phLat}
                              className={inputCls(undefined,"px-2")}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>{t.longitude}</label>
                            <input
                              type="text"
                              value={longitude}
                              onChange={(e) => setLongitude(e.target.value)}
                              placeholder={t.phLng}
                              className={inputCls()}
                            />
                          </div>
                          <div className="flex items-end">
                            {latitude && longitude ? (
                              <div className="flex h-10 w-full items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                {t.gpsAdded}
                              </div>
                            ) : (
                              <div className="flex h-10 w-full items-center gap-2 rounded-lg bg-gray-50 px-3 text-xs font-medium text-gray-400">
                                <MapPin className="h-4 w-4" />
                                {t.noCoords}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============ STEP 3 – TAX & LEGAL ============ */}
                  {step === 3 && (
                    <div className="space-y-4">
                      {/* Tax information */}
                      <section className="space-y-2.5">
                        <div>
                          {/* <h3 className="text-sm font-bold text-gray-900">
                            {t.taxInfoTitle}
                          </h3> */}
                          {/* <p className="mt-0.5 text-xs text-gray-500">
                            {t.taxInfoDesc}
                          </p> */}
                        </div>

                        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
                             {/* FAN */}
                        <div>
                          <label className={labelCls}>
                            {t.fan}
                            <span className={optionalCls}>{t.optional}</span>
                          </label>
                       <input
  type="text"
  value={fanNumber}
  onChange={(e) => setFanNumber(e.target.value)}
  placeholder={t.phFan}
  className={inputCls(undefined, "px-3")}
 />
                        </div>
                          {/* TIN */}
                          <div>
                            <label className={labelCls}>
                              {t.tinNumber}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={tinNumber}
                              onChange={(e) => setTinNumber(e.target.value)}
                              placeholder={t.phTin}
                              className={inputCls(fieldErrors.tinNumber,"px-3")}
                            />
                            {fieldErrors.tinNumber && (
                              <p className={errorCls}>{fieldErrors.tinNumber}</p>
                            )}
                          </div>

                          {/* Tax type */}
                          <div>
                            <label className={labelCls}>
                              {t.taxTypeLabel}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect
                              value={taxType}
                              onChange={setTaxType}
                              options={taxTypeOptions}
                              placeholder={t.phTaxType}
                              ariaLabel={t.ariaTaxType}
                              className={customSelectCls(false, false)}
                            />
                          </div>

                          {/* VAT (conditional) */}
                          {taxType === "vat" ? (
                            <div>
                              <label className={labelCls}>
                                {t.vatNumber}
                                <span className={optionalCls}>
                                  {t.optional}
                                </span>
                              </label>
                              <input
                                type="text"
                                value={vatNumber}
                                onChange={(e) => setVatNumber(e.target.value)}
                                placeholder={t.phVat}
                                className={inputCls()}
                              />
                            </div>
                          ) : (
                            <div className="hidden xl:block" />
                          )}
                        </div>
                      </section>

                      <div className="border-t border-gray-100" />

                      {/* Documents */}
                      <section className="space-y-2.5">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            {t.businessDocsTitle}
                          </h3>
                          <p className="mt-0.5 text-xs leading-5 text-gray-500">
                            {t.businessDocsDesc}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 px-4">
                          {/* Trade license */}
                        <div>
  <label className={labelCls}>
    {t.tradeLicense} <span className="text-red-500">*</span>
  </label>

  <div
    className={`relative flex h-[96px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
      licenseFile
        ? "border-emerald-300 bg-white"
        : fieldErrors.licenseFile
          ? "border-red-300 bg-red-50/40"
          : "border-gray-200 bg-gray-50/60 hover:border-[#6750A4]/50 hover:bg-[#6750A4]/[0.03]"
    }`}
  >
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          setLicenseFile(e.target.files[0]);
        }
      }}
      className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
      aria-label={t.ariaUploadTradeLicense}
    />

    {licenseFile ? (
      <>
        {licensePreviewUrl ? (
          <img
            src={licensePreviewUrl}
            alt="Trade license preview"
            className="h-full w-full bg-white object-contain p-1"
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileCheck className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="max-w-[180px] truncate text-xs font-semibold text-gray-800">
                {licenseFile.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {(licenseFile.size / 1024 / 1024).toFixed(2)} MB · PDF
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLicenseFile(null);
            const input = e.currentTarget.parentElement?.querySelector(
              'input[type="file"]',
            ) as HTMLInputElement | null;
            if (input) input.value = "";
          }}
          className="absolute right-2 top-2 z-30 rounded-md border border-red-100 bg-white/95 px-2 py-1 text-[10px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          {t.removeFile}
        </button>
      </>
    ) : (
      <div className="pointer-events-none flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#6750A4] shadow-sm">
          <Upload className="h-4 w-4" />
        </span>

        <div className="text-left">
          <p className="text-xs font-semibold text-gray-800">
            {t.uploadTradeLicense}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            {t.fileFormats}
          </p>
        </div>
      </div>
    )}
  </div>

  {fieldErrors.licenseFile && (
    <p className={errorCls}>{fieldErrors.licenseFile}</p>
  )}
</div>

                          {/* MOA */}
                        <div>
  <label className={labelCls}>
    {t.moaDoc}
    <span className={optionalCls}>{t.optionalForPlc}</span>
  </label>

  <div
    className={`relative flex h-[96px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
      moaFile
        ? "border-emerald-300 bg-white"
        : fieldErrors.moaFile
          ? "border-red-300 bg-red-50/40"
          : "border-gray-200 bg-gray-50/60 hover:border-[#6750A4]/50 hover:bg-[#6750A4]/[0.03]"
    }`}
  >
    <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          setMoaFile(e.target.files[0]);
        }
      }}
      className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
      aria-label={t.ariaUploadMoa}
    />

    {moaFile ? (
      <>
        {moaPreviewUrl ? (
          <img
            src={moaPreviewUrl}
            alt="MOA document preview"
            className="h-full w-full bg-white object-contain p-1"
          />
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="max-w-[180px] truncate text-xs font-semibold text-gray-800">
                {moaFile.name}
              </p>
              <p className="text-[10px] text-gray-500">
                {(moaFile.size / 1024 / 1024).toFixed(2)} MB · PDF
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMoaFile(null);
            const input = e.currentTarget.parentElement?.querySelector(
              'input[type="file"]'
            ) as HTMLInputElement | null;
            if (input) input.value = "";
          }}
          className="absolute right-2 top-2 z-30 rounded-md border border-red-100 bg-white/95 px-2 py-1 text-[10px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
        >
          {t.removeFile}
        </button>
      </>
    ) : (
      <div className="pointer-events-none flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#6750A4] shadow-sm">
          <Upload className="h-4 w-4" />
        </span>

        <div className="text-left">
          <p className="text-xs font-semibold text-gray-800">
            {t.uploadMoa}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400">
            {t.fileFormats}
          </p>
        </div>
      </div>
    )}
  </div>

  {fieldErrors.moaFile && (
    <p className={errorCls}>{fieldErrors.moaFile}</p>
  )}
</div>
                        </div>
                      </section>

                      <div className="border-t border-gray-100" />

                      {/* Terms */}
                      <div
                        className={`rounded-lg border p-3 ${
                          fieldErrors.termsAgreed
                            ? "border-red-200 bg-red-50/50"
                            : "border-gray-200 bg-gray-50/70"
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={termsAgreed}
                            onChange={(e) => setTermsAgreed(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#6750A4] focus:ring-[#6750A4]"
                          />
                          <span className="text-xs leading-5 text-gray-600">
                            {t.termsPrefix}
                            <strong className="text-gray-900">
                              {signatoryName || contactName}
                            </strong>
                            {" · "}
                            {signatoryRole || "Owner"}
                            {t.termsMiddle}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setIsTermsModalOpen(true);
                              }}
                              className="font-semibold text-[#6750A4] underline underline-offset-2 hover:text-[#554187]"
                            >
                              {t.termsLink}
                            </button>
                            {t.termsSuffix}
                          </span>
                        </label>
                        {fieldErrors.termsAgreed && (
                          <p className="mt-2 pl-6 text-xs font-medium text-red-600">
                            {fieldErrors.termsAgreed}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ============ NAVIGATION (pinned bottom) ============ */}
                <div className="shrink-0 border-t border-gray-100 bg-white pt-3 pb-4">
               <div className="flex flex-row items-center justify-between gap-2.5">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:min-w-[120px]"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t.previous}
                      </button>
                    ) : (
                      <p className="hidden text-xs text-gray-400 sm:block">
                        {t.requiredNote}
                      </p>
                    )}

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6750A4] px-7 text-xs font-semibold text-white transition hover:bg-[#554187] focus:outline-none focus:ring-4 focus:ring-[#6750A4]/20 sm:min-w-[150px]"
                      >
                        {t.continue}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6750A4] px-7 text-xs font-semibold text-white transition hover:bg-[#554187] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[190px]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t.submitting}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" />
                            {t.submitApplication}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </main>
        </div>
      ) : (
        /* =========================== SUCCESS =========================== */
        <div className="min-h-screen w-full px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              {/* Success header */}
              <div className="px-5 py-8 text-center sm:px-8 sm:py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>

                <div className="mt-4">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
                    {t.successBadge}
                  </span>

                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {t.successTitle}
                  </h2>

                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
                    {t.successBody}
                  </p>
                </div>

                {/* Reference code */}
                <div className="mt-6 rounded-2xl border border-[#6750A4]/15 bg-[#6750A4]/[0.04] p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t.referenceLabel}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
                    <span className="break-all font-mono text-xl font-bold tracking-wider text-[#6750A4] sm:text-2xl">
                      {referenceCode}
                    </span>

                    <button
                      type="button"
                      onClick={handleCopyReferenceCode}
                      title={t.copyTitle}
                      aria-label={t.copyAria}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#6750A4] hover:text-[#6750A4]"
                    >
                      {copiedCode ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    {t.referenceHintBefore}
                    <strong className="break-all text-gray-800">
                      {contactEmail}
                    </strong>
                    {t.referenceHintAfter}
                  </p>
                </div>
              </div>

              {/* Next steps */}
              <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-8 lg:border-l lg:border-t-0">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Info className="h-4 w-4 text-[#6750A4]" />
                    {t.nextStepsTitle}
                  </h3>

                  <div className="relative mt-5">
                    <div className="absolute bottom-3 left-3 top-3 w-px bg-gray-200" />

                    <ol className="space-y-5">
                      {[
                        { title: t.nextStep1Title, desc: t.nextStep1Desc },
                        { title: t.nextStep2Title, desc: t.nextStep2Desc },
                        { title: t.nextStep3Title, desc: t.nextStep3Desc },
                      ].map((item, index) => (
                        <li key={item.title} className="relative flex gap-3">
                          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6750A4]/10 text-xs font-bold text-[#6750A4] ring-4 ring-white">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-gray-500">
                              {item.desc}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/signin"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6750A4] px-7 text-sm font-semibold text-white transition hover:bg-[#554187]"
                  >
                    {t.goToSignIn}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <p className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                    {t.secureFooter}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location picker */}
      {isLocationModalOpen && (
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelect={(lat, lon) => {
            setLatitude(lat);
            setLongitude(lon);
            setIsLocationModalOpen(false);
          }}
          onSelectAddress={(addr) => {
            if (!address.trim()) {
              setAddress(addr);
            }
          }}
          initialLat={latitude}
          initialLon={longitude}
          initialAddress={address}
        />
      )}

      {/* Terms & conditions modal */}
      {isTermsModalOpen && (
        <TermsAndConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
          onAccept={() => {
            setTermsAgreed(true);
            setIsTermsModalOpen(false);
          }}
          alreadyAgreed={termsAgreed}
        />
      )}
    </div>
  );
}