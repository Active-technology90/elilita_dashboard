// src/components/dashboard/bank/BankManagement.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Building2,
  CheckCircle,
  Loader2,
  Search,
  ChevronDown,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Hash,
  User,
  Eye,
  EyeOff,
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

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface AvailableBank {
  id: string;
  bank_name: string;
  logo: string | null;
}

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

const FRONTEND_ETHIOPIAN_BANKS: AvailableBank[] = [
  { id: "cbe", bank_name: "Commercial Bank of Ethiopia", logo: "/cbe.png" },
  { id: "bank-of-abyssinia", bank_name: "Bank of Abyssinia", logo: "/abisiniya.png" },
  { id: "dashen-bank", bank_name: "Dashen Bank", logo: "/Dashen bank.png" },
  { id: "awash-bank", bank_name: "Awash Bank", logo: "/awash.jfif" },
  { id: "nib-international-bank", bank_name: "Nib International Bank", logo: "/nib bank.jfif" },
  { id: "hibret-bank", bank_name: "Hibret Bank", logo: "/hibret bank.png" },
  { id: "wegagen-bank", bank_name: "Wegagen Bank", logo: "/wegagen.jfif" },
  { id: "oromia-bank", bank_name: "Oromia Bank", logo: "/oromia.png" },
  { id: "lion-international-bank", bank_name: "Lion International Bank", logo: "/anbesa.jfif" },
  { id: "cooperative-bank-of-oromia", bank_name: "Cooperative Bank of Oromia", logo: "/cooprative bank.jfif" },
  { id: "berhan-bank", bank_name: "Berhan Bank", logo: "/brrhane bank.png" },
  { id: "bunna-bank", bank_name: "Bunna Bank", logo: "/buna.avif" },
  { id: "zemen-bank", bank_name: "Zemen Bank", logo: "/Zemen_Bank_official_Logo.png" },
  { id: "enat-bank", bank_name: "Enat Bank", logo: "/enat.jfif" },
  { id: "global-bank-ethiopia", bank_name: "Global Bank Ethiopia", logo: "/global bank.png" },
  { id: "abay-bank", bank_name: "Abay Bank", logo: "/abay.png" },
  { id: "shabelle-bank", bank_name: "Shabelle Bank", logo: "/shebelle.png" },
  { id: "zamzam-bank", bank_name: "ZamZam Bank", logo: "/zam zam.jfif" },
  { id: "goh-betoch-bank", bank_name: "Goh Betoch Bank", logo: "/goh betoch.png" },
  { id: "ahadu-bank", bank_name: "Ahadu Bank", logo: "/ahadu.jfif" },
  { id: "hijra-bank", bank_name: "Hijra Bank", logo: "/hijira.png" },
  { id: "tsehay-bank", bank_name: "Tsehay Bank", logo: "/tsehay.jfif" },
  { id: "tsedey-bank", bank_name: "Tsedey Bank", logo: "/tsedey bank.jfif" },
  { id: "amhara-bank", bank_name: "Amhara Bank", logo: "/amahara.png" },
  { id: "rammis-bank", bank_name: "Rammis Bank", logo: "/rammis.jfif" },
];

// ------------------------------------------------------------------
// 🟢 FIXED: URL to File helper
// ------------------------------------------------------------------
const urlToFile = async (url: string, filename: string): Promise<File | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;

    if (blob.type.includes("text/html")) {
      console.warn("Received HTML instead of an image from:", url);
      return null;
    }

    let mimeType = blob.type;
    let extension = "jpg";

    // 🛑 FIX: Enforce proper MIME type to prevent "octet-stream" error
    if (!mimeType || mimeType === "application/octet-stream") {
      mimeType = "image/jpeg"; // Default fallback
    } else {
      const parts = mimeType.split("/");
      if (parts.length > 1) {
        extension = parts[1];
        if (extension === "jpeg" || extension.includes("jfif")) extension = "jpg";
      }
    }

    return new File([blob], `${filename}.${extension}`, { type: mimeType });
  } catch (error) {
    console.warn("Could not fetch logo file from url:", url, error);
    return null;
  }
};

// ------------------------------------------------------------------
// Bank Logo
// ------------------------------------------------------------------
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

  useEffect(() => {
    setImageFailed(false);
  }, [logo]);

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

// ------------------------------------------------------------------
// Status Badge
// ------------------------------------------------------------------
const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Inactive
    </span>
  );
};

// ------------------------------------------------------------------
// Bank Selector (dropdown for form)
// ------------------------------------------------------------------
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedBank = useMemo(() => {
    const byId = banks.find((bank) => bank.id === selectedBankId);
    if (byId) return byId;
    if (!selectedBankName) return undefined;
    const selectedKey = getBankIdentityKey(selectedBankName);
    return banks.find((bank) => getBankIdentityKey(bank.bank_name) === selectedKey);
  }, [banks, selectedBankId, selectedBankName]);

  const selectedBankKey = selectedBank ? getBankIdentityKey(selectedBank.bank_name) : "";

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold text-gray-800">
          Select Bank <span className="text-red-500">*</span>
        </label>
        {!loading && banks.length > 0 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
            {banks.length} banks
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
            <span className="text-sm font-semibold text-gray-600">Loading banks...</span>
          </span>
        ) : selectedBank ? (
          <span className="flex items-center gap-3 pr-8">
            <BankLogo logo={selectedBank.logo} name={selectedBank.bank_name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-gray-900">
                {selectedBank.bank_name}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Selected
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
                Choose a bank
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">
                Search or browse available banks
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
                placeholder="Search CBE, Awash, Dashen..."
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

          <div className="max-h-72 overflow-y-auto overscroll-contain p-2" role="listbox">
            {filteredBanks.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm font-semibold text-gray-800">No matching bank</p>
                <p className="mt-1 text-xs text-gray-400">Try a different name.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {filteredBanks.map((bank) => {
                  const isSelected =
                    selectedBankKey && getBankIdentityKey(bank.bank_name) === selectedBankKey;
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
                      <BankLogo logo={bank.logo} name={bank.bank_name} size="sm" />
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

// ------------------------------------------------------------------
// Mobile Bank Card
// ------------------------------------------------------------------
const BankCard: React.FC<{
  bank: BankInfo;
  rowNumber: number;
  isSuperAdmin: boolean;
  canWrite: boolean;
  onEdit: (bank: BankInfo) => void;
  onDelete: (bank: BankInfo) => void;
}> = ({ bank, rowNumber, isSuperAdmin, canWrite, onEdit, onDelete }) => {
  const [showAccount, setShowAccount] = useState(false);
  const isActive = bank.is_active ?? true;

  const masked = useMemo(() => {
    const num = bank.account_number || "";
    if (num.length <= 4) return num;
    return "•••• " + num.slice(-4);
  }, [bank.account_number]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BankLogo logo={bank.logo || null} name={bank.bank_name} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {bank.bank_name}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            #{rowNumber} · {bank.bank_id || "Bank"}
          </p>
        </div>
        <StatusBadge isActive={isActive} />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 gap-2 text-xs">
        {/* Account Number */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-500">Account</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-gray-800 truncate">
              {showAccount ? bank.account_number : masked}
            </span>
            <button
              type="button"
              onClick={() => setShowAccount((s) => !s)}
              className="text-gray-400 hover:text-gray-700 transition flex-shrink-0"
              aria-label={showAccount ? "Hide account number" : "Show account number"}
            >
              {showAccount ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Account Holder */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-500">Holder</span>
          </div>
          <span className="text-gray-800 truncate max-w-[60%] text-right">
            {bank.account_name}
          </span>
        </div>

        {/* Company (SuperAdmin only) */}
        {isSuperAdmin && bank.company_name && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-gray-500">Company</span>
            </div>
            <span className="text-gray-800 truncate max-w-[60%] text-right">
              {bank.company_name}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {canWrite && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEdit(bank)}
            className="flex-1 bg-secondary/10 text-secondary text-xs font-medium py-2 rounded-xl hover:bg-secondary/20 min-h-[36px] inline-flex items-center justify-center gap-1.5"
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => onDelete(bank)}
            className="flex-1 bg-red-50 text-red-600 text-xs font-medium py-2 rounded-xl hover:bg-red-100 min-h-[36px] inline-flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export default function BankManagement() {
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

  const isSuperAdmin = !user?.memberships?.length;
  const companySlug = company?.slug;
  const companyName = company?.name || "Your Company";
  const canWrite = isSuperAdmin || company?.role === "owner";

  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [selectedFilterCompanySlug, setSelectedFilterCompanySlug] = useState<string>("");

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
          console.error("Failed to load all companies for bank management:", err);
        }
      };
      fetchAllCompanies();
    }
  }, [isSuperAdmin]);

  const filterScopeOptions = useMemo(() => {
    return [
      { value: "", label: "All Companies", logo: null },
      ...allCompanies.map((c: any) => ({
        value: c.slug,
        label: c.name,
        logo: c.logo || null,
        subLabel: c.slug,
      })),
    ];
  }, [allCompanies]);

  const selectedFilterCompany = useMemo(() => {
    return (
      filterScopeOptions.find((opt) => opt.value === selectedFilterCompanySlug) ||
      filterScopeOptions[0]
    );
  }, [filterScopeOptions, selectedFilterCompanySlug]);

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
          selectedFilterCompanySlug ? { company: selectedFilterCompanySlug } : undefined,
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
            bank.company_name || (bank.company ? "Company Account" : "Platform Account"),
          company_slug: bank.company_slug || "",
        })),
      );
    } catch (error) {
      console.error("Failed to load banks:", error);
      setBanks([]);
      showToast("error", "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, companySlug, selectedFilterCompanySlug, showToast]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter(
      (b) =>
        b.bank_name.toLowerCase().includes(term) ||
        b.account_number.includes(term) ||
        b.account_name.toLowerCase().includes(term) ||
        (b.company_name && b.company_name.toLowerCase().includes(term)),
    );
  }, [banks, searchTerm]);

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
          if (companySlug) await updateCompanyBankAccount(companySlug, editingBank.id, fd);
        } else {
          if (companySlug) await createCompanyBankAccount(companySlug, fd);
        }

        showToast(
          "success",
          editingBank ? "Bank account updated successfully" : "Bank account created successfully",
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
        showToast("success", "Bank account updated successfully");
      } else {
        await createAdminBankAccount(fd);
        showToast("success", "Bank account created successfully");
      }

      setShowModal(false);
      setEditingBank(null);
      fetchBanks();
    } catch (error: any) {
      let msg =
        error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0];
      if (!msg && error?.response?.data && typeof error.response.data === "object") {
        const firstKey = Object.keys(error.response.data)[0];
        const val = error.response.data[firstKey];
        if (Array.isArray(val) && val.length > 0) msg = `${firstKey}: ${val[0]}`;
        else if (typeof val === "string") msg = `${firstKey}: ${val}`;
      }
      if (!msg) msg = editingBank ? "Failed to update bank account" : "Failed to create bank account";
      showToast("error", msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (isSuperAdmin) await deleteAdminBankAccount(deleteTarget.id);
      else if (companySlug) await deleteCompanyBankAccount(companySlug, deleteTarget.id);
      showToast("success", "Bank account deleted successfully");
      setDeleteTarget(null);
      fetchBanks();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to delete bank account";
      showToast("error", msg);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title="Bank Accounts"
        description={
          isSuperAdmin
            ? "Manage all company bank accounts."
            : `Manage bank accounts for ${companyName}.`
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
              Add Bank Account
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
              Add
            </button>
          ) : undefined
        }
        className="mb-5 sm:mb-6"
      />

      {/* ─────────── Sticky Search + Filter ─────────── */}
      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
        <div className="w-full flex flex-col gap-3 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)] sm:flex-row sm:items-center">
          <div className="flex-1 w-full min-w-0">
            <SearchInput
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              placeholder="Search bank, account number, or holder..."
              loading={loading}
              debounceMs={0}
              showClearButton={true}
              className="w-full"
            />
          </div>
          {isSuperAdmin && (
            <div className="w-full sm:w-[280px] shrink-0">
              <CompanySelect
                scopeOptions={filterScopeOptions}
                company={selectedFilterCompany}
                handleCompanyChange={(slug: string) => {
                  setSelectedFilterCompanySlug(slug);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─────────── Chapa Direct Settlement (Split Payments) ─────────── */}
      <div className="mb-6">
        <ChapaDirectSettlementCard
          companySlug={isSuperAdmin ? selectedFilterCompanySlug : companySlug}
          companyName={
            isSuperAdmin
              ? selectedFilterCompany?.label || "Selected Company"
              : companyName
          }
          canWrite={canWrite}
          onChanged={fetchBanks}
        />
      </div>

      {/* ─────────── Mobile Cards (< md) ─────────── */}
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
            <h3 className="text-base font-semibold text-gray-900">No bank accounts found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {searchTerm.trim()
                ? "Try adjusting your search or filter."
                : canWrite
                  ? "Add your first bank account to get started."
                  : "No accounts available."}
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
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─────────── Tablet + Desktop Table (md+) ─────────── */}
      <div className="hidden md:block">
        <BankTable
          banks={paginatedBanks}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          canWrite={canWrite}
          currentPage={currentPage}
          pageSize={pageSize}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          emptyMessage={
            canWrite
              ? "No bank accounts found. Add your first bank account to get started."
              : "No bank accounts found."
          }
        />
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center sm:justify-end">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
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
        title={`Bank Account "${deleteTarget?.bank_name || ""}"`}
        onConfirm={handleDelete}
        deleteTitle={"Delete Bank Account"}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// Responsive Table (md+)
// ------------------------------------------------------------------
const BankTable: React.FC<{
  banks: BankInfo[];
  loading: boolean;
  isSuperAdmin: boolean;
  canWrite: boolean;
  currentPage: number;
  pageSize: number;
  onEdit: (bank: BankInfo) => void;
  onDelete: (bank: BankInfo) => void;
  emptyMessage: string;
}> = ({
  banks,
  loading,
  isSuperAdmin,
  canWrite,
  currentPage,
  pageSize,
  onEdit,
  onDelete,
  emptyMessage,
}) => {
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
        <table className="w-full min-w-[640px] text-left">
          <thead className="border-b border-gray-100 bg-gray-50/70">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
              <th className="w-12 px-3 py-3 text-left lg:px-4">No.</th>
              <th className="px-3 py-3 text-left lg:px-4">Bank</th>
              {isSuperAdmin && (
                <th className="hidden px-3 py-3 text-left lg:table-cell lg:px-4">
                  Company
                </th>
              )}
              <th className="px-3 py-3 text-left lg:px-4">Account No.</th>
              <th className="hidden px-3 py-3 text-left lg:table-cell lg:px-4">
                Account Holder
              </th>
              <th className="px-3 py-3 text-left lg:px-4">Status</th>
              {canWrite && (
                <th className="w-28 px-3 py-3 text-right lg:px-4">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banks.map((bank, idx) => {
              const rowNumber = (currentPage - 1) * pageSize + idx + 1;
              const isActive = bank.is_active ?? true;

              return (
                <tr
                  key={bank.id}
                  className="text-xs text-gray-700 transition hover:bg-gray-50/70"
                >
                  <td className="px-3 py-3 text-gray-400 lg:px-4">{rowNumber}</td>
                  <td className="px-3 py-3 lg:px-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <BankLogo logo={bank.logo || null} name={bank.bank_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {bank.bank_name}
                        </p>
                        <p className="text-[11px] text-gray-400 lg:hidden">
                          {bank.account_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td className="hidden px-3 py-3 text-gray-600 lg:table-cell lg:px-4">
                      <span className="truncate block max-w-[180px]">
                        {bank.company_name || "N/A"}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-3 lg:px-4">
                    <span className="font-mono text-xs text-gray-700">
                      {bank.account_number}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-gray-700 lg:table-cell lg:px-4">
                    <span className="truncate block max-w-[200px]">
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
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-secondary/10"
                          aria-label={`Edit ${bank.bank_name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(bank)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                          aria-label={`Delete ${bank.bank_name}`}
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

// ------------------------------------------------------------------
// Bank Account Form (responsive modal)
// ------------------------------------------------------------------
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
      modalCompanyScopeOptions.find((opt) => opt.value === formData.company_slug) ||
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
    if (!selectedCatalogBank) errors.bank_id = "Please select a bank";
    if (!formData.account_number.trim()) errors.account_number = "Account number is required";
    if (!formData.account_name.trim()) errors.account_name = "Account holder name is required";
    if (isSuperAdmin && !bank && !formData.company_slug?.trim()) {
      errors.company_slug = "Please select a company";
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
        if (!bank) dataToSend.company_slug = formData.company_slug?.trim() || undefined;
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
    return availableBanks.find((b) => getBankIdentityKey(b.bank_name) === selectedKey);
  }, [availableBanks, formData.bank_id, formData.bank_name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
  <div className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

    {/* ───── Header ───── */}
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gray-50/60 flex-shrink-0">
      <div className="min-w-0 flex-1">
        <h3 className="text-base sm:text-lg font-bold text-secondary truncate">
          {bank ? "Edit Bank Account" : "Add Bank Account"}
        </h3>
        <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 truncate">
          {isSuperAdmin
            ? "Manage bank account details"
            : "Add a company bank account"}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        aria-label="Close modal"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {/* ───── Body ───── */}
    <form
      onSubmit={handleSubmit}
      className="flex-1 min-h-0 flex flex-col"
    >
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6">

        {/* Bank Selector */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank</h4>
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
                Bank selected
              </p>
              <p className="mt-0.5 text-xs leading-5 text-emerald-700/80">
                The bank name and logo come from the system bank list.
              </p>
            </div>
          </div>
        )}

        {isSuperAdmin && !bank && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Company <span className="text-red-500">*</span>
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
              Select the vendor company this bank account belongs to.
            </p>
          </div>
        )}

        {/* Account Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Account Information
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Number <span className="text-red-500">*</span>
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
                placeholder="e.g. 100013456789"
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
                Account Holder Name <span className="text-red-500">*</span>
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
                placeholder="e.g. ABC Trading PLC"
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

        {/* Settings */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Settings
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Display Order
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
                  Active
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Footer ───── */}
      <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50/60 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-secondary text-white font-medium text-sm hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary/20"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {bank ? "Update" : "Create"} Account
        </button>
      </div>
    </form>
  </div>
</div>
  );
}