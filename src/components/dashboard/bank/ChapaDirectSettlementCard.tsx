// src/components/dashboard/bank/ChapaDirectSettlementCard.tsx

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import {

  Building2,

  CheckCircle,

  CheckCircle2,

  AlertCircle,

  Loader2,

  Link2,

  RefreshCw,

  X,

  ChevronDown,

  ShieldCheck,

  Search,

  CreditCard,

  Trash2,

  Plus,

  Wallet,

  User,

  Hash,

  KeyRound,

} from "lucide-react";

import {

  getChapaBanks,

  getCompanyChapaSubaccountStatus,

  provisionCompanyChapaSubaccount,

  delinkCompanyChapaSubaccount,

  getCompanyBankAccounts,

  type ChapaBankItem,

} from "../../../services/api";

import { useToast } from "../../../hooks/useToast";

import { Toast } from "../../ui/Toast";

import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";



// ==================================================================

// Logging

// ==================================================================

const LOG_PREFIX = "[Chapa]";

const log = {

  info: (...args: any[]) => console.log(LOG_PREFIX, ...args),

  warn: (...args: any[]) => console.warn(LOG_PREFIX, ...args),

  error: (...args: any[]) => console.error(LOG_PREFIX, ...args),

  group: (label: string) => console.group(`${LOG_PREFIX} ${label}`),

  groupEnd: () => console.groupEnd(),

  table: (data: any) => console.table(data),

};



// ------------------------------------------------------------------

// Types

// ------------------------------------------------------------------

interface Props {

  companySlug?: string | null;

  companyName?: string;

  canWrite: boolean;

  onChanged?: () => void;

  className?: string;

}



interface NormalizedStatus {

  is_connected: boolean;

  chapa_sub_account_id?: string;

  platform_fee_percent?: number;

  bank_name?: string;

  account_name?: string;

  account_number?: string;

  raw: any;

}



interface CompanyBankAccount {

  id: string | number;

  bank_name: string;

  account_name: string;

  account_number: string;

  logo?: string | null;

  is_active?: boolean;

}



type Tab = "existing" | "new";



// ------------------------------------------------------------------

// Local Ethiopian bank catalogue

// ------------------------------------------------------------------

interface AvailableBank {

  id: string;

  bank_name: string;

  logo: string | null;

}



const FRONTEND_ETHIOPIAN_BANKS: AvailableBank[] = [

  { id: "cbe", bank_name: "Commercial Bank of Ethiopia", logo: "/cbe.png" },

  {

    id: "bank-of-abyssinia",

    bank_name: "Bank of Abyssinia",

    logo: "/abisiniya.png",

  },

  { id: "dashen-bank", bank_name: "Dashen Bank", logo: "/Dashen bank.png" },

  { id: "awash-bank", bank_name: "Awash Bank", logo: "/awash.jfif" },

  {

    id: "nib-international-bank",

    bank_name: "Nib International Bank",

    logo: "/nib bank.jfif",

  },

  { id: "hibret-bank", bank_name: "Hibret Bank", logo: "/hibret bank.png" },

  { id: "wegagen-bank", bank_name: "Wegagen Bank", logo: "/wegagen.jfif" },

  { id: "oromia-bank", bank_name: "Oromia Bank", logo: "/oromia.png" },

  {

    id: "lion-international-bank",

    bank_name: "Lion International Bank",

    logo: "/anbesa.jfif",

  },

  {

    id: "cooperative-bank-of-oromia",

    bank_name: "Cooperative Bank of Oromia",

    logo: "/cooprative bank.jfif",

  },

  { id: "berhan-bank", bank_name: "Berhan Bank", logo: "/brrhane bank.png" },

  { id: "bunna-bank", bank_name: "Bunna Bank", logo: "/buna.avif" },

  {

    id: "zemen-bank",

    bank_name: "Zemen Bank",

    logo: "/Zemen_Bank_official_Logo.png",

  },

  { id: "enat-bank", bank_name: "Enat Bank", logo: "/enat.jfif" },

  {

    id: "global-bank-ethiopia",

    bank_name: "Global Bank Ethiopia",

    logo: "/global bank.png",

  },

  { id: "abay-bank", bank_name: "Abay Bank", logo: "/abay.png" },

  { id: "shabelle-bank", bank_name: "Shabelle Bank", logo: "/shebelle.png" },

  { id: "zamzam-bank", bank_name: "ZamZam Bank", logo: "/zam zam.jfif" },

  {

    id: "goh-betoch-bank",

    bank_name: "Goh Betoch Bank",

    logo: "/goh betoch.png",

  },

  { id: "ahadu-bank", bank_name: "Ahadu Bank", logo: "/ahadu.jfif" },

  { id: "hijra-bank", bank_name: "Hijra Bank", logo: "/hijira.png" },

  { id: "tsehay-bank", bank_name: "Tsehay Bank", logo: "/tsehay.jfif" },

  { id: "tsedey-bank", bank_name: "Tsedey Bank", logo: "/tsedey bank.jfif" },

  { id: "amhara-bank", bank_name: "Amhara Bank", logo: "/amahara.png" },

  { id: "rammis-bank", bank_name: "Rammis Bank", logo: "/rammis.jfif" },

  { id: "telebirr", bank_name: "Telebirr", logo: "/telebirr.png" },

  { id: "cbe-birr", bank_name: "CBE Birr", logo: "/cbebirr.png" },

];



const BANK_NAME_ALIASES: Record<string, string> = {

  cbe: "Commercial Bank of Ethiopia",

  "cbe bank": "Commercial Bank of Ethiopia",

  "commercial bank of ethiopia": "Commercial Bank of Ethiopia",

  "commercial bank ethiopia": "Commercial Bank of Ethiopia",

  "commercial bank": "Commercial Bank of Ethiopia",

  boa: "Bank of Abyssinia",

  "boa bank": "Bank of Abyssinia",

  abyssinia: "Bank of Abyssinia",

  "abyssinia bank": "Bank of Abyssinia",

  "bank of abyssinia": "Bank of Abyssinia",

  dashen: "Dashen Bank",

  "dashen bank": "Dashen Bank",

  awash: "Awash Bank",

  "awash bank": "Awash Bank",

  nib: "Nib International Bank",

  "nib bank": "Nib International Bank",

  "nib international bank": "Nib International Bank",

  hibret: "Hibret Bank",

  "hibret bank": "Hibret Bank",

  "united bank": "Hibret Bank",

  wegagen: "Wegagen Bank",

  "wegagen bank": "Wegagen Bank",

  oib: "Oromia Bank",

  oromia: "Oromia Bank",

  "oromia bank": "Oromia Bank",

  "oromia international bank": "Oromia Bank",

  lib: "Lion International Bank",

  lion: "Lion International Bank",

  "lion bank": "Lion International Bank",

  "lion international bank": "Lion International Bank",

  "anbessa bank": "Lion International Bank",

  "anbesa bank": "Lion International Bank",

  cbo: "Cooperative Bank of Oromia",

  coop: "Cooperative Bank of Oromia",

  "coop bank": "Cooperative Bank of Oromia",

  "cooperative bank": "Cooperative Bank of Oromia",

  "cooperative bank of oromia": "Cooperative Bank of Oromia",

  berhan: "Berhan Bank",

  "berhan bank": "Berhan Bank",

  "berhan international bank": "Berhan Bank",

  bunna: "Bunna Bank",

  "bunna bank": "Bunna Bank",

  "bunna international bank": "Bunna Bank",

  zemen: "Zemen Bank",

  "zemen bank": "Zemen Bank",

  enat: "Enat Bank",

  "enat bank": "Enat Bank",

  global: "Global Bank Ethiopia",

  "global bank": "Global Bank Ethiopia",

  "global bank ethiopia": "Global Bank Ethiopia",

  abay: "Abay Bank",

  "abay bank": "Abay Bank",

  shabelle: "Shabelle Bank",

  "shabelle bank": "Shabelle Bank",

  shebelle: "Shabelle Bank",

  "shebelle bank": "Shabelle Bank",

  zamzam: "ZamZam Bank",

  "zamzam bank": "ZamZam Bank",

  goh: "Goh Betoch Bank",

  "goh betoch": "Goh Betoch Bank",

  "goh betoch bank": "Goh Betoch Bank",

  ahadu: "Ahadu Bank",

  "ahadu bank": "Ahadu Bank",

  hijra: "Hijra Bank",

  "hijra bank": "Hijra Bank",

  hijira: "Hijra Bank",

  "hijira bank": "Hijra Bank",

  tsehay: "Tsehay Bank",

  "tsehay bank": "Tsehay Bank",

  tsedey: "Tsedey Bank",

  "tsedey bank": "Tsedey Bank",

  amhara: "Amhara Bank",

  "amhara bank": "Amhara Bank",

  amahara: "Amhara Bank",

  "amahara bank": "Amhara Bank",

  rammis: "Rammis Bank",

  "rammis bank": "Rammis Bank",

  telebirr: "Telebirr",

  "telebirr mobile money": "Telebirr",

  cbebirr: "CBE Birr",

  "cbe birr": "CBE Birr",

};



const normalizeBankName = (s: string) =>

  s

    .toLowerCase()

    .replace(/&/g, "and")

    .replace(/[^a-z0-9]+/g, " ")

    .trim()

    .replace(/\s+/g, " ");



const findLocalBankLogo = (name?: string | null): string | null => {

  if (!name) return null;

  const normalized = normalizeBankName(name);

  if (!normalized) return null;



  let match = FRONTEND_ETHIOPIAN_BANKS.find(

    (b) => normalizeBankName(b.bank_name) === normalized,

  );

  if (match) return match.logo;



  const aliasedName = BANK_NAME_ALIASES[normalized];

  if (aliasedName) {

    const aliasedNorm = normalizeBankName(aliasedName);

    match = FRONTEND_ETHIOPIAN_BANKS.find(

      (b) => normalizeBankName(b.bank_name) === aliasedNorm,

    );

    if (match) return match.logo;

  }



  match = FRONTEND_ETHIOPIAN_BANKS.find((b) => {

    const bn = normalizeBankName(b.bank_name);

    return bn.includes(normalized) || normalized.includes(bn);

  });

  if (match) return match.logo;



  const tokens = normalized.split(" ").filter((t) => t.length >= 3);

  if (tokens.length > 0) {

    match = FRONTEND_ETHIOPIAN_BANKS.find((b) => {

      const bn = normalizeBankName(b.bank_name);

      return tokens.some((t) => bn.includes(t));

    });

    if (match) return match.logo;

  }



  return null;

};



const resolveLogo = (

  name?: string | null,

  apiLogo?: string | null,

): string | null => {

  const local = findLocalBankLogo(name);

  if (local) return local;

  if (apiLogo && apiLogo.trim().length > 0) return apiLogo;

  return null;

};



// ------------------------------------------------------------------

// Error extraction

// ------------------------------------------------------------------

const isInvalidApiKeyError = (status?: number, body?: any): boolean => {

  if (status !== 400 && status !== 401 && status !== 403) return false;

  const text = JSON.stringify(body ?? {}).toLowerCase();

  return (

    /invalid\s+api\s+key/.test(text) ||

    /api\s+key.*invalid/.test(text) ||

    /can.t\s+accept\s+payment/.test(text) ||

    /business\s+.*inactive/.test(text) ||

    /account\s+.*not\s+active/.test(text)

  );

};



const extractErrorMessage = (err: any): string => {

  const data = err?.response?.data;



  if (!data) return err?.message || "Request failed. Please try again.";

  if (typeof data === "string" && data.trim()) return data;



  if (typeof data === "object") {

    if (typeof data.detail === "string" && data.detail.trim()) {

      return data.detail;

    }

    if (typeof data.message === "string" && data.message.trim()) {

      return data.message;

    }

    if (typeof data.error === "string" && data.error.trim()) {

      return data.error;

    }



    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {

      return String(data.non_field_errors[0]);

    }



    const container =

      typeof data.detail === "object" && data.detail !== null

        ? data.detail

        : data;



    const messages: string[] = [];

    Object.keys(container).forEach((key) => {

      const v = (container as any)[key];

      if (Array.isArray(v) && v.length > 0) {

        messages.push(`${key}: ${v[0]}`);

      } else if (typeof v === "string" && v.trim()) {

        messages.push(`${key}: ${v}`);

      }

    });



    if (messages.length > 0) {

      const joined = messages.join(" • ");

      if (

        /account_name|name.*match|kyc|verification/i.test(joined) ||

        messages.some((m) => m.toLowerCase().startsWith("account_name"))

      ) {

        return `${joined} — the account holder name must exactly match the name registered with the bank (KYC).`;

      }

      return joined;

    }

  }



  return "Request failed. Please check the details and try again.";

};



const isDuplicateSubaccountError = (status?: number, body?: any): boolean => {

  if (status !== 400 && status !== 409) return false;



  const candidates: string[] = [];

  if (typeof body === "string") {

    candidates.push(body);

  } else if (body && typeof body === "object") {

    if (typeof (body as any).detail === "string")

      candidates.push((body as any).detail);

    if (typeof (body as any).message === "string")

      candidates.push((body as any).message);

    if ((body as any).details && typeof (body as any).details === "object") {

      if (typeof (body as any).details.message === "string")

        candidates.push((body as any).details.message);

      if (typeof (body as any).details.detail === "string")

        candidates.push((body as any).details.detail);

    }

    try {

      candidates.push(JSON.stringify(body));

    } catch {

      /* ignore */

    }

  }



  const text = candidates.join(" ").toLowerCase();

  const match =

    /\bdoes\s+exist\b/.test(text) ||

    /\balready\s+exist(s)?\b/.test(text) ||

    /\bresource[_\s-]?conflict\b/.test(text) ||

    /\bduplicate\b/.test(text) ||

    /\balready\s+registered\b/.test(text) ||

    /\balready\s+linked\b/.test(text);



  log.info("duplicate check:", { status, text: text.slice(0, 400), match });

  return match;

};



// ------------------------------------------------------------------

// Bank logo

// ------------------------------------------------------------------

const BankLogo = ({

  logo,

  name,

  size = "md",

}: {

  logo?: string | null;

  name: string;

  size?: "sm" | "md";

}) => {

  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [logo]);



  const box = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  const img = size === "sm" ? "h-6 w-6" : "h-7 w-7";



  return (

    <span

      className={`${box} rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden`}

    >

      {logo && !failed ? (

        <img

          src={logo}

          alt={`${name} logo`}

          className={`${img} object-contain`}

          onError={() => setFailed(true)}

        />

      ) : (

        <Building2 className="h-4 w-4 text-gray-400" />

      )}

    </span>

  );

};



// ------------------------------------------------------------------

// Status payload helpers

// ------------------------------------------------------------------

const extractStatusPayload = (input: any): any => {

  let p = input?.data ?? input;

  for (let i = 0; i < 6; i++) {

    if (!p || typeof p !== "object" || Array.isArray(p)) return p;

    if (

      "is_connected" in p ||

      "connected" in p ||

      "linked" in p ||

      "chapa_linked" in p ||

      "has_chapa_subaccount" in p ||

      "chapa_sub_account_id" in p ||

      "chapa_subaccount_id" in p ||

      "subaccount_id" in p ||

      "sub_account_id" in p ||

      "chapa_account_id" in p ||

      "chapa_subaccount" in p ||

      "chapa_status" in p ||

      "chapa_subaccount_status" in p ||

      "platform_fee_percent" in p ||

      "platform_fee" in p

    ) {

      return p;

    }

    if ("data" in p && p.data !== null && p.data !== undefined) {

      p = p.data;

      continue;

    }

    break;

  }

  return p;

};



const findSubaccountIdDeep = (obj: any, depth = 0): string | undefined => {

  if (!obj || depth > 3 || typeof obj !== "object") return undefined;

  const keys = [

    "chapa_sub_account_id",

    "chapa_subaccount_id",

    "subaccount_id",

    "sub_account_id",

    "chapa_account_id",

    "subaccountId",

    "chapaSubAccountId",

  ];

  for (const k of keys) {

    const v = obj[k];

    if (typeof v === "string" && v.trim().length > 0) return v;

    if (typeof v === "number") return String(v);

  }

  for (const k of Object.keys(obj)) {

    const v = obj[k];

    if (v && typeof v === "object" && !Array.isArray(v)) {

      const inner = findSubaccountIdDeep(v, depth + 1);

      if (inner) return inner;

    }

  }

  return undefined;

};



const normaliseStatus = (input: any): NormalizedStatus => {

  const rawAxios = input;

  const rawData = rawAxios?.data ?? rawAxios;

  log.info("🔍 raw status payload:", rawData);

  try {

    log.info(

      "🔍 stringified status payload:",

      JSON.stringify(rawData, null, 2),

    );

  } catch {

    /* ignore */

  }



  const p = extractStatusPayload(input) || {};

  const subaccountId =

    findSubaccountIdDeep(p) || findSubaccountIdDeep(rawData);



  const is_connected =

    p.is_connected === true ||

    p.connected === true ||

    p.linked === true ||

    p.chapa_linked === true ||

    p.has_chapa_subaccount === true ||

    p.chapa_direct_settlement_enabled === true ||

    (typeof subaccountId === "string" && subaccountId.trim().length > 0);



  const platform_fee_percent =

    typeof p.platform_fee_percent === "number"

      ? p.platform_fee_percent

      : typeof p.platform_fee === "number"

        ? p.platform_fee

        : typeof rawData?.platform_fee_percent === "number"

          ? rawData.platform_fee_percent

          : undefined;



  const normalized = {

    is_connected,

    chapa_sub_account_id: subaccountId,

    platform_fee_percent,

    bank_name:

      p.chapa_bank_name ||

      p.bank_name ||

      p.subaccount_bank_name ||

      rawData?.chapa_bank_name ||

      rawData?.bank_name,

    account_name:

      p.chapa_account_name || p.account_name || rawData?.chapa_account_name,

    account_number:

      p.chapa_account_number ||

      p.account_number ||

      rawData?.chapa_account_number,

    raw: p,

  };



  log.info("✅ normalised status:", normalized);

  return normalized;

};



// ==================================================================

// Main Card

// ==================================================================

export default function ChapaDirectSettlementCard({

  companySlug,

  companyName = "Selected Company",

  canWrite,

  onChanged,

  className = "",

}: Props) {

  const { toast, showToast } = useToast();



  const [loading, setLoading] = useState(false);

  const [statusData, setStatusData] = useState<NormalizedStatus | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showProvisionModal, setShowProvisionModal] = useState(false);

  const [showDelinkModal, setShowDelinkModal] = useState(false);

  const [isDelinking, setIsDelinking] = useState(false);

  const [pendingLinked, setPendingLinked] = useState(false);



  const fetchStatus = useCallback(

    async (opts?: { silent?: boolean }) => {

      if (!companySlug) {

        log.info("fetchStatus skipped — no companySlug");

        setStatusData(null);

        setFetchError(null);

        return;

      }

      if (!opts?.silent) log.group(`fetchStatus → ${companySlug}`);

      try {

        if (!opts?.silent) setLoading(true);

        setFetchError(null);

        const res = await getCompanyChapaSubaccountStatus(companySlug);

        log.info("raw status response:", res);

        const normalised = normaliseStatus(res);



        if (!normalised.is_connected && pendingLinked) {

          log.warn(

            "status endpoint still reports not_connected but we just linked — keeping pending link state",

          );

          setStatusData({

            ...normalised,

            is_connected: true,

            chapa_sub_account_id:

              normalised.chapa_sub_account_id || "pending-sync",

          });

        } else {

          setStatusData(normalised);

        }

      } catch (err: any) {

        const statusCode = err?.response?.status;

        log.warn("status fetch failed:", statusCode, err?.response?.data);

        if (statusCode === 404) {

          setStatusData(normaliseStatus({ is_connected: false }));

          setFetchError(null);

        } else {

          setStatusData(null);

          setFetchError(

            err?.response?.data?.detail ||

              err?.message ||

              "Unable to verify Chapa status",

          );

        }

      } finally {

        if (!opts?.silent) {

          setLoading(false);

          log.groupEnd();

        }

      }

    },

    [companySlug, pendingLinked],

  );



  useEffect(() => {

    fetchStatus();

  }, [fetchStatus]);



  const handleDelink = async () => {

    if (!companySlug) return;

    log.group(`delink → ${companySlug}`);

    try {

      setIsDelinking(true);

      await delinkCompanyChapaSubaccount(companySlug);

      log.info("delink success");

      showToast("success", `Chapa subaccount de-linked for ${companyName}`);

      setShowDelinkModal(false);

      setPendingLinked(false);

      await fetchStatus();

      if (onChanged) onChanged();

    } catch (err: any) {

      log.error("delink failed:", err?.response?.data || err);

      const msg =

        err?.response?.data?.detail || "Failed to de-link Chapa subaccount";

      showToast("error", msg);

    } finally {

      setIsDelinking(false);

      log.groupEnd();

    }

  };



  if (!companySlug) {

    return (

      <div

        className={`rounded-2xl border border-gray-200/80 bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5 shadow-sm ${className}`}

      >

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">

            <CreditCard className="h-5 w-5" />

          </div>

          <div>

            <h4 className="text-sm font-semibold text-gray-900">

              Chapa Direct Split Settlement

            </h4>

            <p className="text-xs text-gray-500">

              Select a company to view and configure Chapa split payments.

            </p>

          </div>

        </div>

      </div>

    );

  }



  if (loading && !statusData && !fetchError) {

    return (

      <div

        className={`rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm ${className}`}

      >

        <div className="flex items-center gap-3 animate-pulse">

          <div className="h-11 w-11 rounded-xl bg-gray-100" />

          <div className="flex-1 space-y-2">

            <div className="h-4 w-1/3 rounded bg-gray-100" />

            <div className="h-3 w-2/3 rounded bg-gray-100" />

          </div>

        </div>

      </div>

    );

  }



  if (fetchError && !statusData) {

    return (

      <>

        <Toast toast={toast} />

        <div

          className={`rounded-2xl border border-red-200 bg-red-50/60 p-4 sm:p-5 shadow-sm ${className}`}

        >

          <div className="flex flex-wrap items-start gap-3">

            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">

              <p className="text-sm font-semibold text-red-900">

                Couldn't load Chapa status

              </p>

              <p className="mt-0.5 text-xs text-red-700/80">{fetchError}</p>

            </div>

            <button

              type="button"

              onClick={() => fetchStatus()}

              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"

            >

              <RefreshCw className="h-3.5 w-3.5" />

              Retry

            </button>

          </div>

        </div>

      </>

    );

  }



  const isConnected = !!statusData?.is_connected;

  const subaccountId = statusData?.chapa_sub_account_id;

  const platformFeePercent = statusData?.platform_fee_percent;



  return (

    <>

      <Toast toast={toast} />



      <div

        className={`rounded-2xl border transition-all ${

          isConnected

            ? "border-secondary/30 bg-gradient-to-br from-secondary/[0.05] via-white to-white"

            : "border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white"

        } p-4 sm:p-6 shadow-sm ${className}`}

      >

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

       

<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-3.5">

  {/* Icon */}

  <div

    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm sm:h-11 sm:w-11 ${

      isConnected

        ? "bg-secondary text-white"

        : "bg-amber-500 text-white"

    }`}

  >

    {isConnected ? (

      <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />

    ) : (

      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />

    )}

  </div>



  {/* Content */}

  <div className="min-w-0 flex-1">

    {/* Title + Status + Refresh */}

    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">

      <h3 className="min-w-0 flex-1 basis-full truncate text-sm font-bold leading-snug text-gray-900 sm:basis-auto sm:text-base">

        Chapa Split Settlement — {companyName}

      </h3>



      <div className="flex min-w-0 flex-wrap items-center gap-2">

        {isConnected ? (

          <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2 py-1 text-[10px] font-semibold text-secondary sm:px-2.5 sm:text-xs">

            <CheckCircle className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />

            Linked & Ready

          </span>

        ) : (

          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 sm:px-2.5 sm:text-xs">

            <AlertCircle className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />

            Not Configured

          </span>

        )}



        <button

          type="button"

          onClick={() => fetchStatus()}

          title="Refresh status"

          aria-label="Refresh Chapa status"

          disabled={loading}

          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-6 sm:w-6"

        >

          <RefreshCw

            className={`h-3.5 w-3.5 ${

              loading ? "animate-spin" : ""

            }`}

          />

        </button>

      </div>

    </div>



    {/* Description */}

    <p className="mt-2 text-xs leading-relaxed text-gray-600 sm:mt-1.5 sm:text-xs">

      {isConnected

        ? "Customer payments at checkout are automatically split: vendor merchandise revenue is deposited directly into this store's bank account, and the platform commission is retained in the main account."

        : "Enable Chapa online payments at checkout by provisioning a Chapa subaccount. Store earnings are routed directly to the store's verified bank account."}

    </p>



    {/* Connected Account Details */}

    {isConnected &&

      (subaccountId || typeof platformFeePercent === "number") && (

        <div className="mt-2.5 flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/80 p-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:border-0 sm:bg-transparent sm:p-0">

          {subaccountId && (

            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">

              <span className="shrink-0 text-gray-500">

                Subaccount ID:

              </span>

              <code className="max-w-full break-all rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-gray-800 border border-gray-200 sm:text-xs">

                {subaccountId}

              </code>

            </div>

          )}



          {/* {typeof platformFeePercent === "number" && (

            <div className="flex items-center gap-1.5 text-xs">

              <span className="text-gray-500">Platform Fee:</span>

              <span className="font-semibold text-gray-700">

                {platformFeePercent}%

              </span>

            </div>

          )} */}

        </div>

      )}

  </div>

</div>





          {canWrite && (

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">

              {isConnected ? (

                <>

                  <button

                    type="button"

                    onClick={() => setShowProvisionModal(true)}

                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"

                  >

                    <RefreshCw className="h-3.5 w-3.5 text-gray-500" />

                    Update Bank

                  </button>

                  <button

                    type="button"

                    onClick={() => setShowDelinkModal(true)}

                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 hover:text-red-800"

                  >

                    <Trash2 className="h-3.5 w-3.5 text-red-600" />

                    De-link

                  </button>

                </>

              ) : (

                <button

                  type="button"

                  onClick={() => setShowProvisionModal(true)}

                  className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 active:scale-95"

                >

                  <Link2 className="h-3.5 w-3.5" />

                  Connect Chapa Subaccount

                </button>

              )}

            </div>

          )}

        </div>

      </div>



      {showProvisionModal && (

        <ChapaProvisionModal

          companySlug={companySlug}

          companyName={companyName}

          onClose={() => setShowProvisionModal(false)}

          onSuccess={async ({ wasDuplicate }) => {

            setShowProvisionModal(false);

            showToast(

              "success",

              isConnected

                ? "Chapa subaccount updated successfully!"

                : "Chapa subaccount provisioned successfully!",

            );



            if (wasDuplicate) {

              log.warn(

                "⚡ provision returned duplicate — flagging pendingLinked and re-checking status",

              );

              setPendingLinked(true);

              setStatusData({

                is_connected: true,

                chapa_sub_account_id: "pending-sync",

                platform_fee_percent: undefined,

                raw: null,

              });



              [1500, 4000, 8000].forEach((delay, idx) => {

                setTimeout(async () => {

                  log.info(

                    `retry fetchStatus (${idx + 1}/3) after ${delay}ms`,

                  );

                  await fetchStatus({ silent: true });

                }, delay);

              });

            } else {

              setPendingLinked(false);

              await fetchStatus();

            }



            if (onChanged) onChanged();

          }}

        />

      )}



      {showDelinkModal && (

        <DeleteConfirmModal

          isOpen={showDelinkModal}

          onClose={() => setShowDelinkModal(false)}

          onCancel={() => setShowDelinkModal(false)}

          onConfirm={handleDelink}

          deleteTitle="De-link Chapa Subaccount?"

          title={companyName}

          message={`Are you sure you want to de-link the Chapa subaccount for "${companyName}"? Chapa online checkout will be immediately disabled for this store until a new subaccount is provisioned.`}

          confirmLabel={isDelinking ? "De-linking..." : "De-link Subaccount"}

        />

      )}

    </>

  );

}



// ==================================================================

// Provision Modal — both tabs share ONE submission path

// ==================================================================

interface ModalProps {

  companySlug: string;

  companyName: string;

  onClose: () => void;

  onSuccess: (info: { wasDuplicate?: boolean; subaccountId?: string }) => void;

}



function ChapaProvisionModal({

  companySlug,

  companyName,

  onClose,

  onSuccess,

}: ModalProps) {

  const [tab, setTab] = useState<Tab>("existing");



  const [banks, setBanks] = useState<ChapaBankItem[]>([]);

  const [loadingBanks, setLoadingBanks] = useState(true);

  const [bankSearch, setBankSearch] = useState("");

  const [selectedBank, setSelectedBank] = useState<ChapaBankItem | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);



  const [existing, setExisting] = useState<CompanyBankAccount[]>([]);

  const [loadingExisting, setLoadingExisting] = useState(true);

  const [selectedExisting, setSelectedExisting] = useState<string | null>(null);

  const [manualBankMatches, setManualBankMatches] = useState<Record<string, ChapaBankItem>>({});

  const [editingBankMatchId, setEditingBankMatchId] = useState<string | null>(null);



  const [accountNumber, setAccountNumber] = useState("");

  const [accountName, setAccountName] = useState("");

  const [businessName, setBusinessName] = useState(companyName);



  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [apiKeyError, setApiKeyError] = useState(false);



  useEffect(() => {

    log.group(`modal opened → ${companySlug}`);

    log.info("companyName:", companyName);

    log.groupEnd();

  }, [companySlug, companyName]);



  useEffect(() => {

    function handleClickOutside(e: MouseEvent) {

      if (

        dropdownRef.current &&

        !dropdownRef.current.contains(e.target as Node)

      ) {

        setIsDropdownOpen(false);

      }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if (e.key === "Escape" && !submitting) onClose();

    };

    document.addEventListener("keydown", onKey);

    return () => document.removeEventListener("keydown", onKey);

  }, [onClose, submitting]);



  useEffect(() => {

    const fetchBanks = async () => {

      log.group("fetch Chapa banks");

      try {

        setLoadingBanks(true);

        const res = await getChapaBanks();

        const bankList = res.data?.banks || res.data || [];

        const active = (bankList as ChapaBankItem[]).filter(

          (b) => b.is_active !== false,

        );

        log.info(`loaded ${active.length} active Chapa banks`);

        setBanks(active);

      } catch (err: any) {

        log.error("fetch banks failed:", err?.response?.data || err);

        setErrorMsg("Failed to load Ethiopian banks from Chapa.");

      } finally {

        setLoadingBanks(false);

        log.groupEnd();

      }

    };

    fetchBanks();

  }, []);



  useEffect(() => {

    let cancelled = false;

    const load = async () => {

      log.group(`fetch existing accounts → ${companySlug}`);

      try {

        setLoadingExisting(true);

        const res = await getCompanyBankAccounts(companySlug);

        if (cancelled) return;

        const raw = res.data?.results || res.data || [];

        const list: CompanyBankAccount[] = (raw as any[])

          .filter((b) => b.is_active !== false)

          .map((b) => ({

            id: b.id,

            bank_name: b.bank_name || "Unknown Bank",

            account_name: b.account_name || "",

            account_number: String(b.account_number || ""),

            logo: resolveLogo(b.bank_name, b.logo),

            is_active: b.is_active ?? true,

          }));

        log.info(`active accounts: ${list.length}`);

        setExisting(list);

        if (list.length === 0) setTab("new");

      } catch (err) {

        log.error("load accounts failed:", err);

        if (!cancelled) setTab("new");

      } finally {

        if (!cancelled) setLoadingExisting(false);

        log.groupEnd();

      }

    };

    load();

    return () => {

      cancelled = true;

    };

  }, [companySlug]);



  const filteredBanks = useMemo(() => {

    if (!bankSearch.trim()) return banks;

    const term = bankSearch.toLowerCase();

    return banks.filter(

      (b) =>

        b.name.toLowerCase().includes(term) ||

        b.slug.toLowerCase().includes(term),

    );

  }, [banks, bankSearch]);



  const findChapaBankByName = (

    bankName: string,

  ): ChapaBankItem | undefined => {

    if (!bankName) return undefined;

    const normalized = normalizeBankName(bankName);



    const exact = banks.find(

      (b) => normalizeBankName(b.name) === normalized,

    );

    if (exact) return exact;



    const aliased = BANK_NAME_ALIASES[normalized];

    if (aliased) {

      const aliasedNorm = normalizeBankName(aliased);

      const aliasMatch = banks.find(

        (b) => normalizeBankName(b.name) === aliasedNorm,

      );

      if (aliasMatch) return aliasMatch;

    }



    const containsMatches = banks.filter((b) => {

      const bn = normalizeBankName(b.name);

      return bn.includes(normalized) || normalized.includes(bn);

    });

    if (containsMatches.length > 0) {

      return containsMatches.sort(

        (a, b) => (b.name?.length || 0) - (a.name?.length || 0),

      )[0];

    }

    return undefined;

  };



  // ================================================================

  // SHARED SUBMISSION — both tabs call this identical function

  // ================================================================

  const runProvision = async (

    payload: {

      bank_code: any;

      bank_name: string;

      account_number: string;

      account_name: string;

      business_name: string;

    },

    source: "existing" | "new",

  ) => {

    setErrorMsg(null);

    setApiKeyError(false);

    try {

      setSubmitting(true);

      log.info(`POST /provision/ [${source}]:`, payload);



      const res = await provisionCompanyChapaSubaccount(companySlug, payload);

      log.info(`provision response [${source}]:`, res?.data);



      const subId =

        res?.data?.subaccount_id ||

        (res?.data as any)?.data?.subaccount_id ||

        (res?.data as any)?.chapa_sub_account_id ||

        undefined;



      onSuccess({ subaccountId: subId });

    } catch (err: any) {

      const status = err?.response?.status;

      const body = err?.response?.data;



      log.error(`provision failed [${source}]`);

      log.info("status:", status);

      log.info("body:", body);

      log.info("stringified body:", JSON.stringify(body ?? {}, null, 2));

      log.info("payload:", payload);



      if (isDuplicateSubaccountError(status, body)) {

        log.warn(

          "🔁 duplicate subaccount detected — treating as success",

        );

        onSuccess({ wasDuplicate: true });

        return;

      }



      if (isInvalidApiKeyError(status, body)) {

        setApiKeyError(true);

        setErrorMsg(

          "Chapa rejected the request because the platform's Chapa API key is invalid or the platform business account can't accept payments right now. This is a backend/admin configuration issue — please contact the platform admin to verify the Chapa API key and business account status.",

        );

        return;

      }



      const msg =

        extractErrorMessage(err) || "Failed to provision Chapa subaccount.";

      setErrorMsg(msg);

    } finally {

      setSubmitting(false);

    }

  };



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();



    if (tab === "existing") {

      log.group("EXISTING tab → submit");



      if (!selectedExisting) {

        log.warn("no account selected");

        setErrorMsg("Please select a bank account to link.");

        log.groupEnd();

        return;

      }



      const acct = existing.find(

        (a) => String(a.id) === String(selectedExisting),

      );

      if (!acct) {

        log.warn("selected account not found:", selectedExisting);

        setErrorMsg("Selected account could not be found.");

        log.groupEnd();

        return;

      }



      const matched =

        manualBankMatches[String(acct.id)] ||

        findChapaBankByName(acct.bank_name);

      log.info("matched Chapa bank:", matched);

      if (!matched) {

        log.warn(`"${acct.bank_name}" not matched in Chapa bank list`);

        setErrorMsg(

          `Please select the matching Chapa bank for "${acct.bank_name}" below to ensure direct payout settlement and avoid platform tax liability.`,

        );

        log.groupEnd();

        return;

      }



      // Build the EXACT same payload as the "new" flow

      const payload = {

        bank_code: matched.id as any,

        bank_name: matched.name,

        account_number: acct.account_number.replace(/\s+/g, ""),

        account_name: acct.account_name.trim(),

        business_name: companyName,

      };



      await runProvision(payload, "existing");

      log.groupEnd();

      return;

    }



    // NEW tab

    log.group("NEW tab → submit");



    if (!selectedBank) {

      log.warn("no bank selected");

      setErrorMsg("Please select a bank from the list.");

      log.groupEnd();

      return;

    }

    const accountNumberClean = accountNumber.replace(/\s+/g, "");

    if (!accountNumberClean) {

      log.warn("empty account number");

      setErrorMsg("Account number is required.");

      log.groupEnd();

      return;

    }

    if (!accountName.trim()) {

      log.warn("empty account name");

      setErrorMsg(

        "Account holder name is required (as registered with the bank).",

      );

      log.groupEnd();

      return;

    }



    const payload = {

      bank_code: selectedBank.id as any,

      bank_name: selectedBank.name,

      account_number: accountNumberClean,

      account_name: accountName.trim(),

      business_name: businessName.trim() || companyName,

    };



    await runProvision(payload, "new");

    log.groupEnd();

  };



  const submitLabel =

    tab === "existing"

      ? submitting

        ? "Linking..."

        : "Link Account"

      : submitting

        ? "Provisioning..."

        : "Provision & Link Subaccount";



  return (

    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">

      <div

        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"

        onClick={submitting ? undefined : onClose}

      />



      <div className="relative z-10 w-full max-w-xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] sm:max-h-[90vh]">

        {/* Header */}

        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50">

          <div>

            <h3 className="text-base font-bold text-gray-900">

              Connect Chapa Split Subaccount

            </h3>

            <p className="text-xs text-gray-500 mt-0.5">

              Direct settlement for {companyName}

            </p>

          </div>

          <button

            type="button"

            onClick={onClose}

            disabled={submitting}

            aria-label="Close"

            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"

          >

            <X className="h-4 w-4" />

          </button>

        </div>



        {/* Tabs */}

        <div className="flex gap-1 border-b border-gray-100 bg-gray-50/60 px-3 py-2">

          <button

            type="button"

            onClick={() => setTab("existing")}

            disabled={existing.length === 0 && !loadingExisting}

            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${

              tab === "existing"

                ? "bg-white text-secondary shadow-sm border border-secondary/30"

                : "text-gray-600 hover:bg-white/60 disabled:opacity-50"

            }`}

          >

            <Wallet className="h-3.5 w-3.5" />

            Use Existing Account

            {existing.length > 0 && (

              <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] text-secondary font-semibold">

                {existing.length}

              </span>

            )}

          </button>

          <button

            type="button"

            onClick={() => setTab("new")}

            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${

              tab === "new"

                ? "bg-white text-secondary shadow-sm border border-secondary/30"

                : "text-gray-600 hover:bg-white/60"

            }`}

          >

            <Plus className="h-3.5 w-3.5" />

            Add New Account

          </button>

        </div>



        {/* Body */}

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">

            {errorMsg && (

              <div

                className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${

                  apiKeyError

                    ? "border-amber-300 bg-amber-50 text-amber-900"

                    : "border-red-200 bg-red-50 text-red-800"

                }`}

              >

                {apiKeyError ? (

                  <KeyRound className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />

                ) : (

                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />

                )}

                <div className="flex-1 font-medium break-words">

                  {apiKeyError && (

                    <p className="font-semibold mb-0.5">

                      Chapa API key / business config issue

                    </p>

                  )}

                  {errorMsg}

                </div>

              </div>

            )}



            {tab === "existing" ? (

              <div>

                {loadingExisting ? (

                  <div className="space-y-2">

                    {[0, 1, 2].map((i) => (

                      <div

                        key={i}

                        className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 animate-pulse"

                      >

                        <div className="h-10 w-10 rounded-lg bg-gray-100" />

                        <div className="flex-1 space-y-1.5">

                          <div className="h-3 w-1/2 rounded bg-gray-100" />

                          <div className="h-2.5 w-1/3 rounded bg-gray-100" />

                        </div>

                      </div>

                    ))}

                  </div>

                ) : existing.length === 0 ? (

                  <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">

                    <Wallet className="mx-auto h-8 w-8 text-gray-300" />

                    <p className="mt-2 text-sm font-semibold text-gray-800">

                      No bank accounts yet

                    </p>

                    <p className="mt-1 text-xs text-gray-500">

                      Add a new account to continue.

                    </p>

                    <button

                      type="button"

                      onClick={() => setTab("new")}

                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary/90 transition active:scale-95"

                    >

                      <Plus className="h-3.5 w-3.5" />

                      Add account

                    </button>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {existing.map((acct) => {

                      const selected =

                        String(selectedExisting) === String(acct.id);

                      const matched =

                        manualBankMatches[String(acct.id)] ||

                        findChapaBankByName(acct.bank_name);

                      const isEditing = editingBankMatchId === String(acct.id);



                      return (

                        <div

                          key={acct.id}

                          className={`rounded-xl border p-3.5 transition ${

                            selected

                              ? "border-secondary bg-secondary/[0.03] shadow-sm ring-1 ring-secondary/20"

                              : "border-gray-200 hover:border-secondary/40 hover:bg-gray-50/50"

                          }`}

                        >

                          <div

                            role="button"

                            tabIndex={0}

                            onClick={() => {

                              setSelectedExisting(String(acct.id));

                              setErrorMsg(null);

                              setApiKeyError(false);

                              log.info("selected existing account:", acct);

                            }}

                            className="flex items-center gap-3 cursor-pointer select-none"

                          >

                            <BankLogo

                              logo={acct.logo}

                              name={acct.bank_name}

                              size="md"

                            />

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-semibold text-gray-900">

                                {acct.bank_name}

                              </p>

                              <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">

                                <span className="truncate">

                                  {acct.account_name}

                                </span>

                                <span className="text-gray-300">·</span>

                                <span className="font-mono">

                                  {acct.account_number}

                                </span>

                              </p>

                            </div>

                            <div

                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${

                                selected

                                  ? "border-secondary bg-secondary text-white"

                                  : "border-gray-300"

                              }`}

                            >

                              {selected && (

                                <CheckCircle2 className="h-3.5 w-3.5" />

                              )}

                            </div>

                          </div>



                          {selected && (

                            <div className="mt-3 pt-3 border-t border-gray-100">

                              {matched && !isEditing ? (

                                <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs border border-emerald-200/80">

                                  <div className="flex items-center gap-2 min-w-0">

                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />

                                    <span className="truncate text-emerald-900">

                                      Chapa Bank: <strong className="font-semibold">{matched.name}</strong>

                                    </span>

                                  </div>

                                  <button

                                    type="button"

                                    onClick={() => setEditingBankMatchId(String(acct.id))}

                                    className="shrink-0 text-secondary hover:text-secondary/80 font-medium underline text-[11px]"

                                  >

                                    Change

                                  </button>

                                </div>

                              ) : (

                                <div className="space-y-2 rounded-lg bg-amber-50/80 p-3 text-xs border border-amber-200">

                                  <div className="flex items-start gap-2 text-amber-900 font-medium">

                                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />

                                    <span>

                                      {matched

                                        ? "Select a different Chapa bank:"

                                        : `Select matching Chapa-supported bank for "${acct.bank_name}":`}

                                    </span>

                                  </div>

                                  <select

                                    value={matched?.id ? String(matched.id) : ""}

                                    onChange={(e) => {

                                      const chosen = banks.find((b) => String(b.id) === e.target.value);

                                      if (chosen) {

                                        setManualBankMatches((prev) => ({

                                          ...prev,

                                          [String(acct.id)]: chosen,

                                        }));

                                        setEditingBankMatchId(null);

                                      }

                                    }}

                                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 shadow-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"

                                  >

                                    <option value="">-- Choose Chapa Bank --</option>

                                    {banks.map((b) => (

                                      <option key={b.id} value={String(b.id)}>

                                        {b.name}

                                      </option>

                                    ))}

                                  </select>

                                  {isEditing && (

                                    <div className="text-right">

                                      <button

                                        type="button"

                                        onClick={() => setEditingBankMatchId(null)}

                                        className="text-gray-500 hover:text-gray-700 text-[11px]"

                                      >

                                        Cancel

                                      </button>

                                    </div>

                                  )}

                                </div>

                              )}

                            </div>

                          )}

                        </div>

                      );

                    })}

                  </div>

                )}

              </div>

            ) : (

              <div className="space-y-4">

                {/* Select Bank */}

                <div ref={dropdownRef} className="relative">

                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">

                    Select Bank <span className="text-red-500">*</span>

                  </label>

                  <button

                    type="button"

                    disabled={loadingBanks}

                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}

                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-60 ${

                      isDropdownOpen

                        ? "border-secondary"

                        : "border-gray-300 hover:border-secondary/60"

                    }`}

                  >

                    {selectedBank ? (

                      <div className="flex items-center gap-2.5 min-w-0 flex-1">

                        <BankLogo

                          logo={resolveLogo(selectedBank.name, selectedBank.logo)}

                          name={selectedBank.name}

                          size="sm"

                        />

                        <div className="min-w-0 flex-1 text-left">

                          <span className="block truncate text-sm font-semibold text-gray-900">

                            {selectedBank.name}

                          </span>

                          {selectedBank.slug && (

                            <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-gray-400">

                              {selectedBank.slug}

                            </span>

                          )}

                        </div>

                      </div>

                    ) : (

                      <div className="flex items-center gap-2.5 min-w-0 flex-1">

                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 flex-shrink-0">

                          <Building2 className="h-4 w-4 text-gray-400" />

                        </span>

                        <span className="text-sm text-gray-400">

                          {loadingBanks

                            ? "Loading banks from Chapa..."

                            : "Select an Ethiopian bank"}

                        </span>

                      </div>

                    )}

                    <ChevronDown

                      className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${

                        isDropdownOpen ? "rotate-180" : ""

                      }`}

                    />

                  </button>



                  {isDropdownOpen && !loadingBanks && (

                    <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden flex flex-col">

                      <div className="p-2 border-b border-gray-100 bg-gray-50/70">

                        <div className="relative">

                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />

                          <input

                            type="text"

                            autoFocus

                            value={bankSearch}

                            onChange={(e) => setBankSearch(e.target.value)}

                            placeholder="Search bank by name or code..."

                            className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-8 py-1.5 text-xs outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10"

                          />

                          {bankSearch && (

                            <button

                              type="button"

                              onClick={() => setBankSearch("")}

                              aria-label="Clear search"

                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"

                            >

                              <X className="h-3 w-3" />

                            </button>

                          )}

                        </div>

                      </div>



                      <div className="max-h-72 overflow-y-auto overscroll-contain p-1">

                        {filteredBanks.length === 0 ? (

                          <div className="py-8 text-center">

                            <Building2 className="mx-auto h-8 w-8 text-gray-300" />

                            <p className="mt-2 text-xs font-semibold text-gray-700">

                              No matching banks

                            </p>

                            <p className="mt-0.5 text-[11px] text-gray-400">

                              Try a different search

                            </p>

                          </div>

                        ) : (

                          <div className="space-y-0.5">

                            {filteredBanks.map((bank) => {

                              const isSelected = selectedBank?.id === bank.id;

                              return (

                                <button

                                  key={bank.id}

                                  type="button"

                                  onClick={() => {

                                    setSelectedBank(bank);

                                    setIsDropdownOpen(false);

                                    setBankSearch("");

                                    log.info("selected Chapa bank:", bank);

                                  }}

                                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${

                                    isSelected

                                      ? "bg-secondary/5 ring-1 ring-secondary/30"

                                      : "hover:bg-gray-50"

                                  }`}

                                >

                                  <BankLogo

                                    logo={resolveLogo(bank.name, bank.logo)}

                                    name={bank.name}

                                    size="sm"

                                  />

                                  <div className="min-w-0 flex-1">

                                    <span

                                      className={`block truncate text-sm ${

                                        isSelected

                                          ? "font-semibold text-secondary"

                                          : "font-medium text-gray-800"

                                      }`}

                                    >

                                      {bank.name}

                                    </span>

                                    {bank.slug && (

                                      <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-gray-400">

                                        {bank.slug}

                                      </span>

                                    )}

                                  </div>

                                  {bank.acct_length ? (

                                    <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">

                                      {bank.acct_length} digits

                                    </span>

                                  ) : null}

                                  {isSelected && (

                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-secondary" />

                                  )}

                                </button>

                              );

                            })}

                          </div>

                        )}

                      </div>

                    </div>

                  )}

                </div>



                {/* Account Number */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">

                    Account Number <span className="text-red-500">*</span>

                  </label>

                  <div className="relative">

                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input

                      type="text"

                      value={accountNumber}

                      onChange={(e) => setAccountNumber(e.target.value)}

                      placeholder="e.g. 100012345678"

                      className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"

                    />

                  </div>

                  {selectedBank?.acct_length && (

                    <p className="mt-1 text-[11px] text-gray-500">

                      Expected length for {selectedBank.name}:{" "}

                      <span className="font-semibold text-gray-700">

                        {selectedBank.acct_length} digits

                      </span>

                    </p>

                  )}

                </div>



                {/* Account Holder Name */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">

                    Account Holder Legal Name{" "}

                    <span className="text-red-500">*</span>

                  </label>

                  <div className="relative">

                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                    <input

                      type="text"

                      value={accountName}

                      onChange={(e) => setAccountName(e.target.value)}

                      placeholder="Full name as registered on the bank account"

                      className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"

                    />

                  </div>

                  <p className="mt-1 text-[11px] text-gray-500">

                    Must match the official bank account holder name for KYC

                    verification.

                  </p>

                </div>



                {/* Business Name */}

                <div>

                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">

                    Business / Store Display Name (Optional)

                  </label>

                  <input

                    type="text"

                    value={businessName}

                    onChange={(e) => setBusinessName(e.target.value)}

                    placeholder={companyName}

                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"

                  />

                </div>

              </div>

            )}



            {/* Direct Payout Guarantee & Tax Protection */}

            <div className="space-y-2">

              <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 text-[11px] text-blue-900 leading-relaxed">

                <span className="font-semibold">Direct Settlement Guarantee:</span>{" "}

                Customer checkout transactions are settled directly into this store bank account by Chapa (100% vendor share). Platform commission is retained separately.

              </div>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">

                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />

                <span>

                  <strong>Tax Protection Notice:</strong> Only banks supported by Chapa can receive direct payout settlements. Linking an unsupported bank routes customer funds into the platform main account, triggering corporate tax liability.

                </span>

              </div>

            </div>

          </div>



          {/* Footer */}

          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">

            <button

              type="button"

              onClick={onClose}

              disabled={submitting}

              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"

            >

              Cancel

            </button>

            <button

              type="submit"

              disabled={submitting}

              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-secondary/90 transition disabled:opacity-50"

            >

              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

              {submitting ? "Working..." : submitLabel}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}