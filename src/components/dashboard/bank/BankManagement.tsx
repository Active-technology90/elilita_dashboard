// src/components/dashboard/bank/BankManagement.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Building2,
  CheckCircle,
  Loader2,
  Search,
  ChevronDown,
  ChevronLeft,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Hash,
  User,
  Eye,
  EyeOff,
  Split,
  ShieldCheck,
  Link2,
  Filter,
} from "lucide-react";
import {
  getCompanyBankAccounts,
  createCompanyBankAccount,
  updateCompanyBankAccount,
  deleteCompanyBankAccount,
  getAdminBankAccounts,
  createAdminBankAccount,
  updateAdminBankAccount,
  deleteAdminBankAccount,
  getCompanies,
  getCompanyChapaSubaccountStatus,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useAuth } from "../../../hooks/useAuth";
import type { BankInfo } from "../../../types";
import PageHeader from "../../ui/PageHeader";
import { CompanySelect } from "../overview/dropdowncompanyselector";
import ChapaDirectSettlementCard from "./ChapaDirectSettlementCard";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

/* ---------------- Types ---------------- */
interface AvailableBank {
  id: string;
  bank_name: string;
  logo: string | null;
}
type ChapaStatus = "connected" | "not_connected" | "unknown";

/* ---------------- Bank name helpers ---------------- */
const normalizeBankName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const BANK_NAME_ALIASES: Record<string, string> = {
  cbe: "commercial bank of ethiopia",
  "commercial bank ethiopia": "commercial bank of ethiopia",
  boa: "bank of abyssinia",
  abyssinia: "bank of abyssinia",
  dashen: "dashen bank",
  awash: "awash bank",
  nib: "nib international bank",
  hibret: "hibret bank",
  wegagen: "wegagen bank",
  oib: "oromia bank",
  oromia: "oromia bank",
  lib: "lion international bank",
  lion: "lion international bank",
  cbo: "cooperative bank of oromia",
  coop: "cooperative bank of oromia",
  berhan: "berhan bank",
  bunna: "bunna bank",
  zemen: "zemen bank",
  enat: "enat bank",
  global: "global bank ethiopia",
  abay: "abay bank",
  shabelle: "shabelle bank",
  zamzam: "zamzam bank",
  goh: "goh betoch bank",
  ahadu: "ahadu bank",
  hijra: "hijra bank",
  tsehay: "tsehay bank",
  tsedey: "tsedey bank",
  amhara: "amhara bank",
  rammis: "rammis bank",
};

const getBankIdentityKey = (name: string) => {
  const normalized = normalizeBankName(name);
  const aliased = BANK_NAME_ALIASES[normalized] || normalized;
  return aliased
    .replace(/\b(bank|of|sc|plc|share company|international)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/* ---------------- Chapa status heuristics ---------------- */
const CHAPA_CONNECTED_VALUES = [
  "active",
  "connected",
  "linked",
  "verified",
  "approved",
  "enabled",
  "complete",
  "completed",
];
const CHAPA_NOT_CONNECTED_VALUES = [
  "inactive",
  "not_connected",
  "unlinked",
  "pending",
  "rejected",
  "disabled",
  "not_started",
];

const readChapaStatusFromObject = (obj: any): ChapaStatus | null => {
  if (!obj) return null;
  const raw =
    obj.chapa_subaccount_status ??
    obj.chapa_status ??
    obj.chapa_direct_settlement_status ??
    obj.chapa_subaccount_state ??
    obj.chapa_linked;
  if (typeof raw === "string") {
    const s = raw.toLowerCase();
    if (CHAPA_CONNECTED_VALUES.includes(s)) return "connected";
    if (CHAPA_NOT_CONNECTED_VALUES.includes(s)) return "not_connected";
  }
  if (raw === true) return "connected";
  if (raw === false) return "not_connected";
  if (obj.has_chapa_subaccount === true) return "connected";
  if (obj.has_chapa_subaccount === false) return "not_connected";
  if (obj.chapa_direct_settlement_enabled === true) return "connected";
  return null;
};

const getChapaStatus = (
  bank: BankInfo,
  allCompanies: any[] = [],
  chapaStatusMap: Record<string, boolean> = {},
): ChapaStatus => {
  if (!bank.id && (bank as any).company_slug) {
    const slug = (bank as any).company_slug as string;
    if (slug in chapaStatusMap)
      return chapaStatusMap[slug] ? "connected" : "not_connected";
    const company = allCompanies.find((c: any) => c?.slug === slug);
    if (company) {
      const fromCompany = readChapaStatusFromObject(company);
      if (fromCompany) return fromCompany;
    }
    return "not_connected";
  }
  if (bank.is_chapa_linked === true) return "connected";
  if (typeof bank.chapa_sub_account_id === "string")
    return bank.chapa_sub_account_id.trim().length > 0
      ? "connected"
      : "not_connected";
  const fromBank = readChapaStatusFromObject(bank as any);
  if (fromBank) return fromBank;
  return "not_connected";
};

/* ---------------- Ethiopian banks ---------------- */
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
];

/* ---------------- URL to File ---------------- */
const urlToFile = async (
  url: string,
  filename: string,
): Promise<File | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;
    if (blob.type.includes("text/html")) return null;
    let mimeType = blob.type;
    let extension = "jpg";
    if (!mimeType || mimeType === "application/octet-stream") {
      mimeType = "image/jpeg";
    } else {
      const parts = mimeType.split("/");
      if (parts.length > 1) {
        extension = parts[1];
        if (extension === "jpeg" || extension.includes("jfif"))
          extension = "jpg";
      }
    }
    return new File([blob], `${filename}.${extension}`, { type: mimeType });
  } catch {
    return null;
  }
};

/* ---------------- BankLogo ---------------- */
const BankLogo = ({
  logo,
  name,
  size = "md",
}: {
  logo: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [logo]);

  const sizeClasses = {
    sm: "h-9 w-9 sm:h-10 sm:w-10",
    md: "h-11 w-11 sm:h-12 sm:w-12",
    lg: "h-14 w-14",
  };
  const imageSizeClasses = {
    sm: "h-6 w-6 sm:h-7 sm:w-7",
    md: "h-8 w-8 sm:h-9 sm:w-9",
    lg: "h-11 w-11",
  };

  return (
    <span
      className={`${sizeClasses[size]} rounded-xl border border-gray-200/80 bg-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden`}
    >
      {logo && !imageFailed ? (
        <img
          src={logo}
          alt={`${name} logo`}
          className={`${imageSizeClasses[size]} object-contain`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Building2 className="h-5 w-5 text-gray-400" />
      )}
    </span>
  );
};

/* ---------------- StatusBadge ---------------- */
const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  const { t } = useTranslation("bankManagement");
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t("statusActive")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {t("statusInactive")}
    </span>
  );
};

/* ---------------- CompanyChapaBadge ---------------- */
const CompanyChapaBadge = ({
  status,
  onClick,
  canConfigure,
}: {
  status: ChapaStatus;
  onClick?: () => void;
  canConfigure?: boolean;
}) => {
  const { t } = useTranslation("bankManagement");
  if (status === "connected") {
    return (
      <span
        title={t("chapaLinkedTitle")}
        className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300 shadow-sm"
      >
        <CheckCircle className="h-3 w-3" />
        {t("chapaLinked")}
      </span>
    );
  }
  if (!canConfigure || !onClick) return null;
  if (status === "not_connected") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={t("chapaConnectTitle")}
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 transition hover:bg-amber-100 hover:border-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
      >
        <Link2 className="h-3 w-3" />
        {t("chapaConnect")}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={t("chapaLinkTitle")}
      className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600 border border-gray-200 transition hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
    >
      <Link2 className="h-3 w-3" />
      {t("chapaLink")}
    </button>
  );
};

/* ---------------- BankSelector ---------------- */
const BankSelector = ({
  banks,
  selectedBankId,
  selectedBankName,
  onSelect,
  loading,
  error,
}: {
  banks: AvailableBank[];
  selectedBankId: string;
  selectedBankName?: string;
  onSelect: (bank: AvailableBank) => void;
  loading: boolean;
  error?: string | null;
}) => {
  const { t } = useTranslation("bankManagement");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedBank = useMemo(() => {
    const byId = banks.find((bank) => bank.id === selectedBankId);
    if (byId) return byId;
    if (!selectedBankName) return undefined;
    const selectedKey = getBankIdentityKey(selectedBankName);
    return banks.find(
      (bank) => getBankIdentityKey(bank.bank_name) === selectedKey,
    );
  }, [banks, selectedBankId, selectedBankName]);

  const selectedBankKey = selectedBank
    ? getBankIdentityKey(selectedBank.bank_name)
    : "";

  const filteredBanks = useMemo(() => {
    const normalizedTerm = normalizeBankName(searchTerm);
    if (!normalizedTerm) return banks;
    const identityTerm = getBankIdentityKey(searchTerm);
    return banks.filter((bank) => {
      const normalizedName = normalizeBankName(bank.bank_name);
      const identityName = getBankIdentityKey(bank.bank_name);
      return (
        normalizedName.includes(normalizedTerm) ||
        (!!identityTerm && identityName.includes(identityTerm))
      );
    });
  }, [banks, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold text-gray-800">
          {t("selectBank")} <span className="text-red-500">*</span>
        </label>
        {!loading && banks.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
            {t("banksCount", { count: banks.length })}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`relative w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition-all duration-200 ${
          error
            ? "border-red-300 bg-red-50/60 ring-4 ring-red-50"
            : isOpen
              ? "border-secondary bg-white ring-4 ring-secondary/10"
              : "border-gray-200 bg-white hover:border-secondary/50 hover:shadow-md"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? (
          <span className="flex min-h-12 items-center gap-3 text-gray-400">
            <span className="h-11 w-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            <span className="text-sm font-semibold text-gray-600">
              {t("loadingBanks")}
            </span>
          </span>
        ) : selectedBank ? (
          <span className="flex items-center gap-3 pr-8">
            <BankLogo
              logo={selectedBank.logo}
              name={selectedBank.bank_name}
              size="md"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-gray-900">
                {selectedBank.bank_name}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                {t("selectedLabel")}
              </span>
            </span>
          </span>
        ) : (
          <span className="flex min-h-12 items-center gap-3 pr-8">
            <span className="h-11 w-11 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-400" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-700">
                {t("chooseBank")}
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">
                {t("chooseBankHint")}
              </span>
            </span>
          </span>
        )}

        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-50 p-1.5">
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      {isOpen && !loading && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
          <div className="border-b border-gray-100 bg-gray-50/70 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchBankPlaceholder")}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div
            className="max-h-72 overflow-y-auto overscroll-contain p-2"
            role="listbox"
          >
            {filteredBanks.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-semibold text-gray-800">
                  {t("noMatchingBank")}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t("noMatchingBankHint")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {filteredBanks.map((bank) => {
                  const isSelected =
                    selectedBankKey &&
                    getBankIdentityKey(bank.bank_name) === selectedBankKey;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => {
                        onSelect(bank);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      role="option"
                      aria-selected={!!isSelected}
                      className={`group flex min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? "border-secondary/40 bg-secondary/5 shadow-sm"
                          : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <BankLogo
                        logo={bank.logo}
                        name={bank.bank_name}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
                        {bank.bank_name}
                      </span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-secondary" />
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
  );
};

/* ---------------- BankCard ---------------- */
const BankCard: React.FC<{
  bank: BankInfo;
  rowNumber: number;
  isSuperAdmin: boolean;
  canWrite: boolean;
  allCompanies: any[];
  chapaStatusMap: Record<string, boolean>;
  onEdit: (bank: BankInfo) => void;
  onDelete: (bank: BankInfo) => void;
  onConfigureChapa: (bank: BankInfo) => void;
}> = ({
  bank,
  rowNumber,
  isSuperAdmin,
  canWrite,
  allCompanies,
  chapaStatusMap,
  onEdit,
  onDelete,
  onConfigureChapa,
}) => {
  const { t } = useTranslation("bankManagement");
  const [showAccount, setShowAccount] = useState(false);
  const isActive = bank.is_active ?? true;
  const chapaStatus = getChapaStatus(bank, allCompanies, chapaStatusMap);

  const masked = useMemo(() => {
    const num = bank.account_number || "";
    if (num.length <= 4) return num;
    return "•••• " + num.slice(-4);
  }, [bank.account_number]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
      <div className="flex items-center gap-3">
        <BankLogo logo={bank.logo || null} name={bank.bank_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {bank.bank_name}
            </h3>
            {chapaStatus === "connected" && (
              <span
                title={t("chapaLinkedTitle")}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300 shadow-sm"
              >
                <CheckCircle className="h-3 w-3 text-emerald-600" />
                {t("chapaLinked")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            #{rowNumber} · {bank.bank_id || t("colBank")}
          </p>
        </div>
        <StatusBadge isActive={isActive} />
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-500">
              {t("accountLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-gray-800 truncate">
              {showAccount ? bank.account_number : masked}
            </span>
            <button
              type="button"
              onClick={() => setShowAccount((s) => !s)}
              className="text-gray-400 hover:text-gray-700 transition flex-shrink-0"
              aria-label={showAccount ? t("hideAccount") : t("showAccount")}
            >
              {showAccount ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-500">
              {t("holderLabel")}
            </span>
          </div>
          <span className="text-gray-800 truncate max-w-[60%] text-right">
            {bank.account_name}
          </span>
        </div>

        {isSuperAdmin && bank.company_name && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-500">
                {t("companyLabel")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 max-w-[60%] justify-end">
              <span
                className="text-gray-800 truncate text-right"
                title={bank.company_name}
              >
                {bank.company_name}
              </span>
              <CompanyChapaBadge
                status={chapaStatus}
                canConfigure={isSuperAdmin && !!bank.company_slug}
                onClick={() => onConfigureChapa(bank)}
              />
            </div>
          </div>
        )}
      </div>

      {canWrite && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEdit(bank)}
            className="flex-1 bg-secondary/10 text-secondary text-xs font-medium py-2 rounded-xl hover:bg-secondary/20 min-h-[36px] inline-flex items-center justify-center gap-1.5"
          >
            <Edit size={14} />
            {t("edit")}
          </button>
          <button
            onClick={() => onDelete(bank)}
            className="flex-1 bg-red-50 text-red-600 text-xs font-medium py-2 rounded-xl hover:bg-red-100 min-h-[36px] inline-flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} />
            {t("delete")}
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------------- Main Component ---------------- */
export default function BankManagement() {
  const { t } = useTranslation("bankManagement");
  const { company } = useCurrentCompany();
  const { user } = useAuth();
  const { toast, showToast } = useToast();

  const [banks, setBanks] = useState<BankInfo[]>([]);
  const availableBanks = FRONTEND_ETHIOPIAN_BANKS;
  const [loading, setLoading] = useState(true);
  const loadingAvailableBanks = false;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankInfo | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [chapaFilter, setChapaFilter] = useState<
    "all" | "linked" | "not_linked"
  >("all");

  const isSuperAdmin = !user?.memberships?.length;
  const companySlug = company?.slug;
  const companyName = company?.name || "Your Company";
  const canWrite = isSuperAdmin || company?.role === "owner";

  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [selectedFilterCompanySlug] = useState<string>("");

  const [showChapaDropdown, setShowChapaDropdown] = useState(false);
  const [showChapaCard, setShowChapaCard] = useState(false);
  const [chapaCompanySearch, setChapaCompanySearch] = useState("");
  const [chapaCompanySlug, setChapaCompanySlug] = useState<string>("");
  const chapaDropdownRef = useRef<HTMLDivElement>(null);
  const chapaCardRef = useRef<HTMLDivElement>(null);

  const [chapaStatusMap, setChapaStatusMap] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchAllCompanies = async () => {
        try {
          let page = 1;
          let hasNext = true;
          const collected: any[] = [];
          while (hasNext) {
            const res = await getCompanies({ page, page_size: 100 });
            const data = res?.data;
            if (!data) break;
            const results = data.results || (Array.isArray(data) ? data : []);
            collected.push(...results);
            hasNext = !!data.next;
            page++;
            if (!data.results) break;
          }
          setAllCompanies(collected);
        } catch (err) {
          console.error(
            "Failed to load all companies for bank management:",
            err,
          );
        }
      };
      fetchAllCompanies();
    }
  }, [isSuperAdmin]);

  const filteredChapaCompanies = useMemo(() => {
    const term = chapaCompanySearch.trim().toLowerCase();
    if (!term) return allCompanies;
    return allCompanies.filter(
      (c: any) =>
        (c.name || "").toLowerCase().includes(term) ||
        (c.slug || "").toLowerCase().includes(term),
    );
  }, [allCompanies, chapaCompanySearch]);

  useEffect(() => {
    if (!isSuperAdmin && companySlug) setChapaCompanySlug(companySlug);
  }, [isSuperAdmin, companySlug]);

  useEffect(() => {
    if (!showChapaDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chapaDropdownRef.current &&
        !chapaDropdownRef.current.contains(event.target as Node)
      ) {
        setShowChapaDropdown(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowChapaDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showChapaDropdown]);

  const fetchBanks = useCallback(async () => {
    if (!isSuperAdmin && !companySlug) {
      setBanks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let response;
      if (isSuperAdmin) {
        response = await getAdminBankAccounts(
          selectedFilterCompanySlug
            ? { company: selectedFilterCompanySlug }
            : undefined,
        );
      } else {
        response = await getCompanyBankAccounts(companySlug!);
      }
      const results = response.data?.results || response.data || [];
      setBanks(
        results.map((bank: any) => ({
          ...bank,
          is_active: bank.is_active ?? true,
          company_name:
            bank.company_name ||
            (bank.company ? "Company Account" : "Platform Account"),
          company_slug: bank.company_slug || "",
        })),
      );
    } catch (error) {
      console.error("Failed to load banks:", error);
      setBanks([]);
      showToast("error", t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, companySlug, selectedFilterCompanySlug, showToast, t]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const fetchChapaStatuses = useCallback(
    async (slugs: string[]) => {
      if (!isSuperAdmin) return;
      const unique = Array.from(new Set(slugs.filter(Boolean)));
      if (unique.length === 0) return;
      const toFetch = unique.filter((slug) => {
        if (slug in chapaStatusMap) return false;
        const comp = allCompanies.find((c: any) => c?.slug === slug);
        if (comp && readChapaStatusFromObject(comp) !== null) return false;
        return true;
      });
      if (toFetch.length === 0) return;
      const entries = await Promise.all(
        toFetch.map(async (slug) => {
          try {
            const res = await getCompanyChapaSubaccountStatus(slug);
            return [slug, !!res?.data?.is_connected] as const;
          } catch {
            return [slug, false] as const;
          }
        }),
      );
      setChapaStatusMap((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    },
    [isSuperAdmin, chapaStatusMap, allCompanies],
  );

  useEffect(() => {
    if (!isSuperAdmin) return;
    const slugs = banks
      .map((b) => (b as any).company_slug as string | undefined)
      .filter(Boolean) as string[];
    fetchChapaStatuses(slugs);
  }, [banks, isSuperAdmin, fetchChapaStatuses]);

  const statusFilterOptions: SelectOption[] = useMemo(
    () => [
      {
        value: "all",
        label: t("filterAllStatus"),
        icon: <Filter className="h-3.5 w-3.5" />,
      },
      {
        value: "active",
        label: t("filterActive"),
        icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
      },
      {
        value: "inactive",
        label: t("filterInactive"),
        icon: <AlertCircle className="h-3.5 w-3.5 text-amber-600" />,
      },
    ],
    [t],
  );

  const chapaFilterOptions: SelectOption[] = useMemo(
    () => [
      {
        value: "all",
        label: t("filterAllChapa"),
        icon: <Split className="h-3.5 w-3.5" />,
      },
      {
        value: "linked",
        label: t("filterLinked"),
        icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />,
      },
      {
        value: "not_linked",
        label: t("filterNotLinked"),
        icon: <Link2 className="h-3.5 w-3.5 text-gray-500" />,
      },
    ],
    [t],
  );

  const filteredBanks = useMemo(() => {
    let result = banks;
    if (statusFilter !== "all") {
      result = result.filter((b) => {
        const isActive = b.is_active ?? true;
        return statusFilter === "active" ? isActive : !isActive;
      });
    }
    if (chapaFilter !== "all") {
      result = result.filter((b) => {
        const status = getChapaStatus(b, allCompanies, chapaStatusMap);
        return chapaFilter === "linked"
          ? status === "connected"
          : status !== "connected";
      });
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(
      (b) =>
        b.bank_name.toLowerCase().includes(term) ||
        b.account_number.includes(term) ||
        b.account_name.toLowerCase().includes(term) ||
        (b.company_name && b.company_name.toLowerCase().includes(term)),
    );
  }, [
    banks,
    searchTerm,
    statusFilter,
    chapaFilter,
    allCompanies,
    chapaStatusMap,
  ]);

  const paginatedBanks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBanks.slice(start, start + pageSize);
  }, [filteredBanks, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBanks.length / pageSize);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleCreate = () => {
    setEditingBank(null);
    setShowModal(true);
  };

  const handleEdit = (bank: BankInfo) => {
    setEditingBank(bank);
    setShowModal(true);
  };

  const handleSave = async (data: Partial<BankInfo>, logoFile?: File) => {
    try {
      if (editingBank) delete data.company_slug;

      if (!isSuperAdmin) {
        let logoFileToSend: File | undefined = logoFile;
        if (!logoFileToSend && data.logo && typeof data.logo === "string") {
          try {
            const fileName =
              data.bank_name?.toLowerCase().replace(/\s+/g, "-") || "bank-logo";
            const fetched = await urlToFile(data.logo, fileName);
            logoFileToSend = fetched || undefined;
          } catch (error) {
            console.error("Failed to prepare bank logo:", error);
          }
        }
        const fd = new FormData();
        fd.append("bank_name", data.bank_name || "");
        fd.append("account_number", data.account_number || "");
        fd.append("account_name", data.account_name || "");
        fd.append("is_active", String(data.is_active ?? true));
        fd.append("order", String(data.order ?? 0));
        if (logoFileToSend) fd.append("logo", logoFileToSend);

        if (editingBank) {
          if (companySlug)
            await updateCompanyBankAccount(companySlug, editingBank.id, fd);
        } else {
          if (companySlug) await createCompanyBankAccount(companySlug, fd);
        }

        showToast(
          "success",
          editingBank ? t("updateSuccess") : t("createSuccess"),
        );
        setShowModal(false);
        setEditingBank(null);
        fetchBanks();
        return;
      }

      const fd = new FormData();
      fd.append("bank_name", data.bank_name || "");
      fd.append("account_number", data.account_number || "");
      fd.append("account_name", data.account_name || "");
      fd.append("is_active", String(data.is_active ?? true));
      fd.append("order", String(data.order ?? 0));
      if (data.company_slug && data.company_slug.trim()) {
        fd.append("company_slug", data.company_slug.trim());
      }
      if (logoFile) fd.append("logo", logoFile);

      if (editingBank) {
        await updateAdminBankAccount(editingBank.id, fd);
        showToast("success", t("updateSuccess"));
      } else {
        await createAdminBankAccount(fd);
        showToast("success", t("createSuccess"));
      }

      setShowModal(false);
      setEditingBank(null);
      fetchBanks();
    } catch (error: any) {
      let msg =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0];
      if (
        !msg &&
        error?.response?.data &&
        typeof error.response.data === "object"
      ) {
        const firstKey = Object.keys(error.response.data)[0];
        const val = error.response.data[firstKey];
        if (Array.isArray(val) && val.length > 0)
          msg = `${firstKey}: ${val[0]}`;
        else if (typeof val === "string") msg = `${firstKey}: ${val}`;
      }
      if (!msg) msg = editingBank ? t("updateFailed") : t("createFailed");
      showToast("error", msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (isSuperAdmin) await deleteAdminBankAccount(deleteTarget.id);
      else if (companySlug)
        await deleteCompanyBankAccount(companySlug, deleteTarget.id);
      showToast("success", t("deleteSuccess"));
      setDeleteTarget(null);
      fetchBanks();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || t("deleteFailed");
      showToast("error", msg);
    }
  };

  const chapaSelectedCompanyName = useMemo(() => {
    if (!isSuperAdmin) return companyName;
    if (!chapaCompanySlug) return "";
    return (
      allCompanies.find((c: any) => c.slug === chapaCompanySlug)?.name ||
      t("selectedCompanyFallback")
    );
  }, [allCompanies, chapaCompanySlug, isSuperAdmin, companyName, t]);

  const handleChapaButtonClick = () => {
    if (isSuperAdmin) setShowChapaDropdown((v) => !v);
    else setShowChapaCard((v) => !v);
  };

  const handleSelectChapaCompany = (slug: string) => {
    setChapaCompanySlug(slug);
    setShowChapaDropdown(false);
    setShowChapaCard(true);
  };

  const handleSelectAllCompanies = () => {
    setChapaCompanySlug("");
    setShowChapaDropdown(false);
    setShowChapaCard(false);
  };

  const handleChapaBack = () => {
    setShowChapaDropdown(true);
  };

  const handleConfigureChapaFromRow = useCallback(
    (bank: BankInfo) => {
      const targetSlug = (bank as any).company_slug || companySlug;
      if (!targetSlug) return;
      setChapaCompanySlug(targetSlug);
      setShowChapaCard(true);
      setShowChapaDropdown(false);
      setChapaCompanySearch("");
      window.setTimeout(() => {
        chapaCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 60);
    },
    [companySlug],
  );

  const chapaButtonActive = isSuperAdmin ? showChapaDropdown : showChapaCard;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title={t("pageTitle")}
        description={
          isSuperAdmin
            ? t("pageDescSuperAdmin")
            : t("pageDescCompany", { company: companyName })
        }
        icon={Building2}
        actions={
          canWrite ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {t("addBankAccount")}
            </button>
          ) : undefined
        }
        actionMobile={
          canWrite ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {t("addShort")}
            </button>
          ) : undefined
        }
        className="mb-5 sm:mb-6"
      />

      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
        <div className="w-full flex flex-col gap-3 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)] sm:flex-row sm:items-center">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              placeholder={t("searchPlaceholder")}
              loading={loading}
              debounceMs={0}
              showClearButton={true}
              className="w-full"
            />
          </div>

          <div className="w-full shrink-0 sm:w-[150px]">
            <CustomSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as "all" | "active" | "inactive");
                setCurrentPage(1);
              }}
              options={statusFilterOptions}
              placeholder={t("filterAllStatus")}
              ariaLabel="Filter by bank status"
            />
          </div>

          <div className="w-full shrink-0 sm:w-[160px]">
            <CustomSelect
              value={chapaFilter}
              onChange={(v) => {
                setChapaFilter(v as "all" | "linked" | "not_linked");
                setCurrentPage(1);
              }}
              options={chapaFilterOptions}
              placeholder={t("filterAllChapa")}
              ariaLabel="Filter by Chapa connection"
            />
          </div>

          <div
            className="relative w-full shrink-0 sm:w-auto"
            ref={chapaDropdownRef}
          >
            <button
              type="button"
              onClick={handleChapaButtonClick}
              aria-haspopup={isSuperAdmin ? "dialog" : undefined}
              aria-expanded={isSuperAdmin ? showChapaDropdown : showChapaCard}
              aria-controls={
                isSuperAdmin && showChapaDropdown
                  ? "chapa-company-dropdown"
                  : undefined
              }
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 sm:w-auto sm:text-sm ${
                chapaButtonActive
                  ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20"
                  : "border-secondary/20 bg-secondary/5 text-secondary hover:bg-secondary/10 hover:border-secondary/30"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2`}
            >
              <Split className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("chapaButton")}</span>
              {isSuperAdmin && (
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    showChapaDropdown ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {isSuperAdmin && showChapaDropdown && (
              <div
                id="chapa-company-dropdown"
                role="dialog"
                aria-label={t("chapaDropdownHeader")}
                className="absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 left-0 right-0 sm:left-auto sm:right-0 sm:w-[320px] max-w-[calc(100vw-1rem)] transition-all duration-150 ease-out"
              >
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-secondary/5 to-transparent px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <Split className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-900">
                        {t("chapaDropdownHeader")}
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {t("chapaDropdownSubtitle")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChapaDropdown(false)}
                    aria-label={t("closeAria")}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="border-b border-gray-100 p-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={chapaCompanySearch}
                      onChange={(e) => setChapaCompanySearch(e.target.value)}
                      placeholder={t("searchCompanyPlaceholder")}
                      aria-label={t("searchCompanyPlaceholder")}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
                    />
                    {chapaCompanySearch && (
                      <button
                        type="button"
                        onClick={() => setChapaCompanySearch("")}
                        aria-label={t("clearSearch")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllCompanies}
                    className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      chapaCompanySlug === ""
                        ? "bg-secondary/10 font-semibold text-secondary"
                        : "text-gray-700 hover:bg-gray-50"
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                      <Building2 className="h-3.5 w-3.5 text-gray-500" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate whitespace-nowrap">
                        {t("allCompanies")}
                      </span>
                      <span className="mt-0.5 block truncate whitespace-nowrap text-[11px] text-gray-400">
                        {t("allCompaniesHint")}
                      </span>
                    </span>
                    {chapaCompanySlug === "" && (
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-secondary" />
                    )}
                  </button>

                  <div className="my-1 border-t border-gray-100" />

                  {filteredChapaCompanies.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <p className="text-sm font-semibold text-gray-800">
                        {t("noMatchingCompany")}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {t("noMatchingCompanyHint")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {filteredChapaCompanies.map((c: any) => {
                        const isSelected = chapaCompanySlug === c.slug;
                        const displayName = c.name || c.slug;
                        const rowStatus = getChapaStatus(
                          { company_slug: c.slug } as BankInfo,
                          allCompanies,
                          chapaStatusMap,
                        );
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() => handleSelectChapaCompany(c.slug)}
                            title={displayName}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                              isSelected
                                ? "bg-secondary/10 text-secondary"
                                : "text-gray-700 hover:bg-gray-50"
                            } focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40`}
                          >
                            {c.logo ? (
                              <img
                                src={c.logo}
                                alt={displayName}
                                className="h-7 w-7 shrink-0 rounded-md border border-gray-200 bg-white object-contain"
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                                <Building2 className="h-3.5 w-3.5 text-gray-500" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate whitespace-nowrap text-sm font-medium">
                                {displayName}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1.5">
                                <span className="block truncate whitespace-nowrap text-[11px] text-gray-400">
                                  {c.slug}
                                </span>
                                {rowStatus === "connected" && (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-300">
                                    <CheckCircle className="h-2.5 w-2.5" />
                                    {t("chapaLinked")}
                                  </span>
                                )}
                              </span>
                            </span>
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-secondary" />
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
        </div>
      </div>

      {(statusFilter !== "all" || chapaFilter !== "all") && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500">
            {t("activeFiltersLabel")}
          </span>
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary border border-secondary/20 transition hover:bg-secondary/20"
            >
              <Filter className="h-3 w-3" />
              {t("statusChip", {
                value:
                  statusFilter === "active"
                    ? t("filterActive")
                    : t("filterInactive"),
              })}
              <X className="h-3 w-3" />
            </button>
          )}
          {chapaFilter !== "all" && (
            <button
              type="button"
              onClick={() => {
                setChapaFilter("all");
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary border border-secondary/20 transition hover:bg-secondary/20"
            >
              <Link2 className="h-3 w-3" />
              {t("chapaChip", {
                value:
                  chapaFilter === "linked"
                    ? t("filterLinked")
                    : t("filterNotLinked"),
              })}
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setChapaFilter("all");
              setCurrentPage(1);
            }}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700"
          >
            {t("clearAll")}
          </button>
        </div>
      )}

      {showChapaCard && chapaCompanySlug && (
        <div
          ref={chapaCardRef}
          className="mb-5 overflow-hidden rounded-2xl border border-secondary/15 bg-gradient-to-br from-secondary/[0.04] via-white to-white p-3 shadow-sm sm:p-4 scroll-mt-24"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Split className="h-3.5 w-3.5" />
              </span>
              <span className="truncate text-sm font-semibold text-gray-900">
                {t("chapaButton")}
              </span>
              <span
                className="hidden truncate rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary sm:inline"
                title={chapaSelectedCompanyName || t("selectedCompanyFallback")}
              >
                {chapaSelectedCompanyName || t("selectedCompanyFallback")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleChapaBack}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-secondary transition hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {t("chapaChangeBtn")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowChapaCard(false)}
                aria-label={t("chapaCloseAria")}
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ChapaDirectSettlementCard
            companySlug={chapaCompanySlug}
            companyName={
              chapaSelectedCompanyName || t("selectedCompanyFallback")
            }
            canWrite={canWrite}
            onChanged={() => {
              fetchBanks();
            }}
          />
        </div>
      )}

      <div className="block md:hidden">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="h-10 bg-gray-50 rounded-lg" />
                  <div className="h-10 bg-gray-50 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedBanks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              {t("emptyMobileTitle")}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {searchTerm.trim() ||
              statusFilter !== "all" ||
              chapaFilter !== "all"
                ? t("emptyMobileWithFilters")
                : canWrite
                  ? t("emptyMobileNoAccounts")
                  : t("emptyMobileNoAccess")}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {paginatedBanks.map((bank, idx) => (
              <BankCard
                key={bank.id}
                bank={bank}
                rowNumber={(currentPage - 1) * pageSize + idx + 1}
                isSuperAdmin={isSuperAdmin}
                canWrite={canWrite}
                allCompanies={allCompanies}
                chapaStatusMap={chapaStatusMap}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onConfigureChapa={handleConfigureChapaFromRow}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <BankTable
          banks={paginatedBanks}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          canWrite={canWrite}
          currentPage={currentPage}
          pageSize={pageSize}
          allCompanies={allCompanies}
          chapaStatusMap={chapaStatusMap}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onConfigureChapa={handleConfigureChapaFromRow}
          emptyMessage={canWrite ? t("emptyTableAdd") : t("emptyTableDefault")}
        />
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center sm:justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {showModal && (
        <BankAccountForm
          bank={editingBank}
          isSuperAdmin={isSuperAdmin}
          companySlug={companySlug}
          companiesList={allCompanies}
          availableBanks={availableBanks}
          loadingAvailableBanks={loadingAvailableBanks}
          onClose={() => {
            setShowModal(false);
            setEditingBank(null);
          }}
          onSave={handleSave}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={t("deleteBankTitle", { name: deleteTarget?.bank_name || "" })}
        onConfirm={handleDelete}
        deleteTitle={t("deleteBankAccount")}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/* ---------------- BankTable ---------------- */
const BankTable: React.FC<{
  banks: BankInfo[];
  loading: boolean;
  isSuperAdmin: boolean;
  canWrite: boolean;
  currentPage: number;
  pageSize: number;
  allCompanies: any[];
  chapaStatusMap: Record<string, boolean>;
  onEdit: (bank: BankInfo) => void;
  onDelete: (bank: BankInfo) => void;
  onConfigureChapa: (bank: BankInfo) => void;
  emptyMessage: string;
}> = ({
  banks,
  loading,
  isSuperAdmin,
  canWrite,
  currentPage,
  pageSize,
  allCompanies,
  chapaStatusMap,
  onEdit,
  onDelete,
  onConfigureChapa,
  emptyMessage,
}) => {
  const { t } = useTranslation("bankManagement");

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="hidden lg:block h-4 bg-gray-100 rounded w-28" />
              <div className="hidden lg:block h-4 bg-gray-100 rounded w-32" />
              <div className="h-6 bg-gray-100 rounded-full w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
        <Building2 className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="border-b border-gray-100 bg-gray-50/70">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
              <th className="w-12 px-3 py-3 text-left lg:px-4">{t("colNo")}</th>
              <th className="px-3 py-3 text-left lg:px-4">{t("colBank")}</th>
              {isSuperAdmin && (
                <th className="hidden px-3 py-3 text-left lg:table-cell lg:px-4">
                  {t("colCompany")}
                </th>
              )}
              <th className="px-3 py-3 text-left lg:px-4">
                {t("colAccountNumber")}
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell lg:px-4">
                {t("colAccountHolder")}
              </th>
              <th className="px-3 py-3 text-left lg:px-4">{t("colStatus")}</th>
              {canWrite && (
                <th className="w-28 px-3 py-3 text-right lg:px-4">
                  {t("colActions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banks.map((bank, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              const isActive = bank.is_active ?? true;
              const chapaStatus = getChapaStatus(
                bank,
                allCompanies,
                chapaStatusMap,
              );
              const canConfigure = isSuperAdmin && !!bank.company_slug;

              return (
                <tr
                  key={bank.id}
                  className="text-xs text-gray-700 transition hover:bg-gray-50/70"
                >
                  <td className="px-3 py-3 text-gray-400 lg:px-4">
                    {rowNumber}
                  </td>
                  <td className="px-3 py-3 lg:px-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <BankLogo
                        logo={bank.logo || null}
                        name={bank.bank_name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="truncate text-sm font-semibold text-gray-900"
                            title={bank.bank_name}
                          >
                            {bank.bank_name}
                          </p>
                          {chapaStatus === "connected" && (
                            <span
                              title={t("chapaLinkedTitle")}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300 shadow-sm"
                            >
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              {t("chapaLinked")}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 lg:hidden truncate">
                          {bank.account_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="hidden px-3 py-3 text-gray-600 lg:table-cell lg:px-4">
                      <div className="flex items-center gap-1.5 max-w-[240px]">
                        <span
                          className="truncate"
                          title={bank.company_name || t("naValue")}
                        >
                          {bank.company_name || t("naValue")}
                        </span>
                        <CompanyChapaBadge
                          status={chapaStatus}
                          canConfigure={canConfigure}
                          onClick={() => onConfigureChapa(bank)}
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-3 lg:px-4">
                    <span className="font-mono text-xs text-gray-700">
                      {bank.account_number}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-gray-700 lg:table-cell lg:px-4">
                    <span
                      className="truncate block max-w-[200px]"
                      title={bank.account_name}
                    >
                      {bank.account_name}
                    </span>
                  </td>
                  <td className="px-3 py-3 lg:px-4">
                    <StatusBadge isActive={isActive} />
                  </td>
                  {canWrite && (
                    <td className="px-3 py-3 text-right lg:px-4">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(bank)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                          aria-label={t("editAria", { bank: bank.bank_name })}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(bank)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                          aria-label={t("deleteAria", { bank: bank.bank_name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- BankAccountForm ---------------- */
function BankAccountForm({
  bank,
  isSuperAdmin,
  companySlug: _,
  companiesList: initialCompanies = [],
  availableBanks,
  loadingAvailableBanks,
  onClose,
  onSave,
}: {
  bank: BankInfo | null;
  isSuperAdmin: boolean;
  companySlug?: string;
  companiesList?: any[];
  availableBanks: AvailableBank[];
  loadingAvailableBanks: boolean;
  onClose: () => void;
  onSave: (data: Partial<BankInfo>, logoFile?: File) => void;
}) {
  const { t } = useTranslation("bankManagement");

  const [formData, setFormData] = useState({
    account_number: "",
    account_name: "",
    is_active: true,
    order: 0,
    bank_id: "",
    bank_name: "",
    company_slug: "",
  });
  const [saving, setSaving] = useState(false);
  const [companiesList, setCompaniesList] = useState<any[]>(initialCompanies);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (initialCompanies.length > 0) {
      setCompaniesList(initialCompanies);
      return;
    }
    if (isSuperAdmin) {
      const fetchAllCompanies = async () => {
        try {
          let page = 1;
          let hasNext = true;
          const collected: any[] = [];
          while (hasNext) {
            const res = await getCompanies({ page, page_size: 100 });
            const data = res?.data;
            if (!data) break;
            const results = data.results || (Array.isArray(data) ? data : []);
            collected.push(...results);
            hasNext = !!data.next;
            page++;
            if (!data.results) break;
          }
          setCompaniesList(collected);
        } catch (err) {
          console.error("Failed to load companies for bank modal:", err);
        }
      };
      fetchAllCompanies();
    }
  }, [initialCompanies, isSuperAdmin]);

  const modalCompanyScopeOptions = useMemo(() => {
    return companiesList
      .filter((comp: any) => comp && comp.slug)
      .map((comp: any) => ({
        value: comp.slug,
        label: comp.name || comp.slug,
        logo: comp.logo || null,
        subLabel: comp.slug,
      }));
  }, [companiesList]);

  const selectedModalCompany = useMemo(() => {
    return (
      modalCompanyScopeOptions.find(
        (opt) => opt.value === formData.company_slug,
      ) ||
      (modalCompanyScopeOptions.length > 0
        ? { value: "", label: "Select a company...", logo: null }
        : { value: "", label: "Loading companies...", logo: null })
    );
  }, [modalCompanyScopeOptions, formData.company_slug]);

  useEffect(() => {
    if (bank) {
      setFormData({
        account_number: bank.account_number || "",
        account_name: bank.account_name || "",
        is_active: bank.is_active ?? true,
        order: bank.order ?? 0,
        bank_id: bank.bank_id || "",
        bank_name: bank.bank_name || "",
        company_slug: bank.company_slug || "",
      });
    } else {
      setFormData({
        account_number: "",
        account_name: "",
        is_active: true,
        order: 0,
        bank_id: "",
        bank_name: "",
        company_slug: "",
      });
    }
    setValidationErrors({});
  }, [bank]);

  const handleBankSelect = (selectedBank: AvailableBank) => {
    setFormData((prev) => ({
      ...prev,
      bank_id: selectedBank.id,
      bank_name: selectedBank.bank_name,
    }));
    setValidationErrors((prev) => ({ ...prev, bank_id: "", bank_name: "" }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const selectedCatalogBank = availableBanks.find(
      (availableBank) =>
        availableBank.id === formData.bank_id ||
        (!!formData.bank_name &&
          getBankIdentityKey(availableBank.bank_name) ===
            getBankIdentityKey(formData.bank_name)),
    );
    if (!selectedCatalogBank) errors.bank_id = t("bankRequired");
    if (!formData.account_number.trim())
      errors.account_number = t("accountNumberRequired");
    if (!formData.account_name.trim())
      errors.account_name = t("accountHolderRequired");
    if (isSuperAdmin && !bank && !formData.company_slug?.trim()) {
      errors.company_slug = t("companyRequiredError");
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const dataToSend: Partial<BankInfo> = {
        account_number: formData.account_number,
        account_name: formData.account_name,
        is_active: formData.is_active,
        order: formData.order,
        bank_name: formData.bank_name,
      };
      const selectedCatalogBank = availableBanks.find(
        (availableBank) =>
          availableBank.id === formData.bank_id ||
          getBankIdentityKey(availableBank.bank_name) ===
            getBankIdentityKey(formData.bank_name),
      );
      if (selectedCatalogBank) {
        dataToSend.bank_name = selectedCatalogBank.bank_name;
        dataToSend.bank_id = selectedCatalogBank.id;
      }
      let selectedLogoFile: File | null = null;
      if (selectedCatalogBank?.logo) {
        selectedLogoFile = await urlToFile(
          selectedCatalogBank.logo,
          selectedCatalogBank.id || "bank-logo",
        );
      }
      if (isSuperAdmin) {
        if (!bank)
          dataToSend.company_slug = formData.company_slug?.trim() || undefined;
        await onSave(dataToSend, selectedLogoFile || undefined);
      } else {
        await onSave(dataToSend, selectedLogoFile || undefined);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedBank = useMemo(() => {
    const byId = availableBanks.find((b) => b.id === formData.bank_id);
    if (byId) return byId;
    if (!formData.bank_name) return undefined;
    const selectedKey = getBankIdentityKey(formData.bank_name);
    return availableBanks.find(
      (b) => getBankIdentityKey(b.bank_name) === selectedKey,
    );
  }, [availableBanks, formData.bank_id, formData.bank_name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50/60 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-secondary truncate">
              {bank ? t("editFormTitle") : t("addFormTitle")}
            </h3>
            <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 truncate">
              {isSuperAdmin ? t("formDescSuperAdmin") : t("formDescCompany")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={t("closeModalAria")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {t("bankSectionTitle")}
              </h4>
              <BankSelector
                banks={availableBanks}
                selectedBankId={formData.bank_id}
                selectedBankName={formData.bank_name}
                onSelect={handleBankSelect}
                loading={loadingAvailableBanks}
                error={validationErrors.bank_id}
              />
            </div>

            {selectedBank && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 sm:px-4 py-3">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-900">
                    {t("bankSelectedTitle")}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-emerald-700/80">
                    {t("bankSelectedDesc")}
                  </p>
                </div>
              </div>
            )}

            {isSuperAdmin && !bank && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {t("companyRequired")} <span className="text-red-500">*</span>
                </label>
                <CompanySelect
                  scopeOptions={modalCompanyScopeOptions}
                  company={selectedModalCompany}
                  handleCompanyChange={(slug: string) => {
                    setFormData((prev) => ({ ...prev, company_slug: slug }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      company_slug: "",
                    }));
                  }}
                  className="w-full"
                />
                {validationErrors.company_slug && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {validationErrors.company_slug}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  {t("companyHint")}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {t("accountInfoTitle")}
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("accountNumber")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        account_number: e.target.value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        account_number: "",
                      }));
                    }}
                    className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border ${
                      validationErrors.account_number
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-secondary focus:ring-secondary/20"
                    } focus:outline-none focus:ring-4 transition text-sm placeholder-gray-400`}
                    placeholder={t("accountNumberPlaceholder")}
                  />
                  {validationErrors.account_number && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {validationErrors.account_number}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("accountHolder")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.account_name}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        account_name: e.target.value,
                      }));
                      setValidationErrors((prev) => ({
                        ...prev,
                        account_name: "",
                      }));
                    }}
                    className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border ${
                      validationErrors.account_name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-secondary focus:ring-secondary/20"
                    } focus:outline-none focus:ring-4 transition text-sm placeholder-gray-400`}
                    placeholder={t("accountHolderPlaceholder")}
                  />
                  {validationErrors.account_name && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {validationErrors.account_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {t("settingsTitle")}
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("displayOrder")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-4 focus:ring-secondary/20 focus:outline-none transition text-sm"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary/20"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {t("filterActive")}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50/60 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-secondary text-white font-medium text-sm hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary/20"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {bank ? t("updateAccount") : t("createAccount")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
