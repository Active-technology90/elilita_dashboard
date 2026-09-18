// BankManagement.tsx (frontend Ethiopian bank catalog + public logos)
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Building2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  ChevronDown,
  AlertCircle,
  X,
  // Package,
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
import { DataTable, type Column } from "../../ui/DataTable";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface AvailableBank {
  id: string;
  bank_name: string;
  logo: string | null;
}

// Frontend-owned Ethiopian bank catalog used by company admins.
// No bank-catalog API call is needed for the dropdown.
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
  {
    id: "cbe",
    bank_name: "Commercial Bank of Ethiopia",
    logo: "/cbe (2).jfif",
  },
  {
    id: "bank-of-abyssinia",
    bank_name: "Bank of Abyssinia",
    logo: "/abisiniya.png",
  },
  {
    id: "dashen-bank",
    bank_name: "Dashen Bank",
    logo: "/Dashen bank.png",
  },
  {
    id: "awash-bank",
    bank_name: "Awash Bank",
    logo: "/awash.jfif",
  },
  {
    id: "nib-international-bank",
    bank_name: "Nib International Bank",
    logo: "/nib bank.jfif",
  },
  {
    id: "hibret-bank",
    bank_name: "Hibret Bank",
    logo: "/hibret bank.png",
  },
  {
    id: "wegagen-bank",
    bank_name: "Wegagen Bank",
    logo: "/wegagen.jfif",
  },
  {
    id: "oromia-bank",
    bank_name: "Oromia Bank",
    logo: "/oromia.png",
  },
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
  {
    id: "berhan-bank",
    bank_name: "Berhan Bank",
    logo: "/berhane bank.png",
  },
  {
    id: "bunna-bank",
    bank_name: "Bunna Bank",
    logo: "/buna.avif",
  },
  {
    id: "zemen-bank",
    bank_name: "Zemen Bank",
    logo: "/Zemen_Bank_official_logo.png",
  },
  {
    id: "enat-bank",
    bank_name: "Enat Bank",
    logo: "/enat.jfif",
  },
  {
    id: "global-bank-ethiopia",
    bank_name: "Global Bank Ethiopia",
    logo: "/global bank.png",
  },
  {
    id: "abay-bank",
    bank_name: "Abay Bank",
    logo: "/abay.png",
  },
  {
    id: "shabelle-bank",
    bank_name: "Shabelle Bank",
    logo: "/shebelie.png",
  },
  {
    id: "zamzam-bank",
    bank_name: "ZamZam Bank",
    logo: "/zam zam.jfif",
  },
  {
    id: "goh-betoch-bank",
    bank_name: "Goh Betoch Bank",
    logo: "/goh betoch.png",
  },
  {
    id: "ahadu-bank",
    bank_name: "Ahadu Bank",
    logo: "/ahadu.jfif",
  },
  {
    id: "hijra-bank",
    bank_name: "Hijra Bank",
    logo: "/hijra.png",
  },
  {
    id: "tsehay-bank",
    bank_name: "Tsehay Bank",
    logo: "/tsehay.jfif",
  },
  {
    id: "tsedey-bank",
    bank_name: "Tsedey Bank",
    logo: "/tsedey bank.jfif",
  },
  {
    id: "amhara-bank",
    bank_name: "Amhara Bank",
    logo: "/amhara.png",
  },
  {
    id: "rammis-bank",
    bank_name: "Rammis Bank",
    logo: "/rammis.jfif",
  },
];

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
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  };

  const imageSizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
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
// Helper function to convert URL to File
// ------------------------------------------------------------------
const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  const extension = blob.type.split("/")[1] || "jpg";
  return new File([blob], `${filename}.${extension}`, { type: blob.type });
};

// ------------------------------------------------------------------
// Status Badge
// ------------------------------------------------------------------
const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <CheckCircle className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
      <XCircle className="h-3.5 w-3.5" />
      Inactive
    </span>
  );
};

// ------------------------------------------------------------------
// Bank Selector Component (for Company Admin)
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
            {banks.length} {banks.length === 1 ? "bank" : "banks"}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`relative w-full rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-all duration-200 ${
          error
            ? "border-red-300 bg-red-50/60 ring-4 ring-red-50"
            : isOpen
              ? "border-secondary bg-white ring-4 ring-secondary/10"
              : "border-gray-200 bg-white hover:border-secondary/50 hover:shadow-md"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? (
          <span className="flex min-h-12 items-center gap-3 text-gray-400">
            <span className="h-12 w-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-600">
                Loading banks
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">
                Using logos from the public folder...
              </span>
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
                Selected
              </span>
            </span>
          </span>
        ) : (
          <span className="flex min-h-12 items-center gap-3 pr-8">
            <span className="h-12 w-12 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-400" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-700">
                Choose a bank
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">
                Search or browse the available banks
              </span>
            </span>
          </span>
        )}

        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-gray-50 p-1.5">
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
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Available banks
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  25 Ethiopian banks use local public logos
                </p>
              </div>
              <span className="text-xs font-semibold text-secondary">
                {filteredBanks.length} shown
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search CBE, Awash, Dashen..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Clear bank search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div
            className="max-h-80 overflow-y-auto overscroll-contain p-2"
            role="listbox"
          >
            {filteredBanks.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  No matching bank
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Try a different bank name or abbreviation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      className={`group flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-all ${
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
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-800 group-hover:text-gray-950">
                          {bank.bank_name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-400">
                          Select bank
                        </span>
                      </span>
                      {isSelected && (
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                          <CheckCircle className="h-4 w-4" />
                        </span>
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

  // Fetch bank accounts - depends only on stable values
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
        response = await getAdminBankAccounts();
      } else {
        response = await getCompanyBankAccounts(companySlug!);
      }
      const results = response.data?.results || response.data || [];
      setBanks(
        results.map((bank: any) => ({
          ...bank,
          is_active: bank.is_active ?? true,
          company_name: bank.company_name || "Unknown Company",
          company_slug: bank.company_slug || "unknown",
        })),
      );
    } catch (error) {
      console.error("Failed to load banks:", error);
      setBanks([]);
      showToast("error", "Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, companySlug, showToast]);

  // Company-admin bank choices are frontend-owned; no bank catalog API call is needed.
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


  const columns = useMemo<Column<BankInfo>[]>(() => {
    const baseColumns: Column<BankInfo>[] = [
      {
        key: "rowNumber",
        header: "No.",
        className: "whitespace-nowrap text-gray-500",
        render: (_bank, index) => (currentPage - 1) * pageSize + index + 1,
      },
      {
        key: "bank_name",
        header: "Bank Name",
        className: "min-w-[170px]",
        render: (bank) => (
          <div className="flex min-w-0 items-center gap-3">
            <BankLogo
              logo={bank.logo || null}
              name={bank.bank_name}
              size="sm"
            />
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-gray-900">
                {bank.bank_name}
              </span>
              <span className="text-xs text-gray-400">
                {bank.bank_id || "Bank"}
              </span>
            </div>
          </div>
        ),
      },
    ];

    if (isSuperAdmin) {
      baseColumns.push({
        key: "company_name",
        header: "Company",
        className: "whitespace-nowrap",
        render: (bank) => bank.company_name || "N/A",
      });
    }

    baseColumns.push(
      {
        key: "account_number",
        header: "Account Number",
        className: "whitespace-nowrap font-mono text-gray-700",
      },
      {
        key: "account_name",
        header: "Account Holder",
        className: "whitespace-nowrap text-gray-700",
      },
      {
        key: "is_active",
        header: "Status",
        className: "whitespace-nowrap",
        render: (bank) => <StatusBadge isActive={bank.is_active ?? true} />,
      },
    );

    return baseColumns;
  }, [currentPage, isSuperAdmin, pageSize]);

  const handleCreate = () => {
    setEditingBank(null);
    setShowModal(true);
  };

  const handleEdit = (bank: BankInfo) => {
    setEditingBank(bank);
    setShowModal(true);
  };

  // Fixed handleSave with logo URL to file conversion for Company Admin
  const handleSave = async (data: Partial<BankInfo>, logoFile?: File) => {
    try {
      if (editingBank) {
        delete data.company_slug;
      }

      // For Company Admin
      if (!isSuperAdmin) {
        let logoFileToSend: File | undefined = logoFile;

        // New company-admin choices use image files from public/.
        // Existing remote logos are still supported while editing older records.
        if (!logoFileToSend && data.logo && typeof data.logo === "string") {
          try {
            const fileName =
              data.bank_name?.toLowerCase().replace(/\s+/g, "-") || "bank-logo";

            if (
              data.logo.startsWith("/") ||
              data.logo.startsWith("http://") ||
              data.logo.startsWith("https://")
            ) {
              logoFileToSend = await urlToFile(data.logo, fileName);
            }
          } catch (error) {
            console.error("Failed to prepare bank logo:", error);
          }
        }

        // Create FormData with all fields
        const fd = new FormData();
        fd.append("bank_name", data.bank_name || "");
        fd.append("account_number", data.account_number || "");
        fd.append("account_name", data.account_name || "");
        fd.append("is_active", String(data.is_active ?? true));
        fd.append("order", String(data.order ?? 0));

        // Only append logo if we have a file
        if (logoFileToSend) {
          fd.append("logo", logoFileToSend);
        }

        if (editingBank) {
          if (companySlug) {
            await updateCompanyBankAccount(companySlug, editingBank.id, fd);
          }
        } else {
          if (companySlug) {
            await createCompanyBankAccount(companySlug, fd);
          }
        }

        showToast(
          "success",
          editingBank
            ? "Bank account updated successfully"
            : "Bank account created successfully",
        );
        setShowModal(false);
        setEditingBank(null);
        fetchBanks();
        return;
      }

      // Super Admin logic (existing behavior)
      let payload: Record<string, unknown> | FormData = data as Record<
        string,
        unknown
      >;

      // Only use FormData when there's an actual file to upload
      if (logoFile) {
        const fd = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fd.append(key, value.toString());
          }
        });
        fd.append("logo", logoFile);
        payload = fd;
      }

      if (editingBank) {
        if (isSuperAdmin) {
          await updateAdminBankAccount(editingBank.id, payload);
        }
        showToast("success", "Bank account updated successfully");
      } else {
        if (isSuperAdmin) {
          await createAdminBankAccount(payload);
        }
        showToast("success", "Bank account created successfully");
      }

      setShowModal(false);
      setEditingBank(null);
      fetchBanks();
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.non_field_errors?.[0] ||
        (editingBank
          ? "Failed to update bank account"
          : "Failed to create bank account");
      showToast("error", msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (isSuperAdmin) {
        await deleteAdminBankAccount(deleteTarget.id);
      } else if (companySlug) {
        await deleteCompanyBankAccount(companySlug, deleteTarget.id);
      }
      showToast("success", "Bank account deleted successfully");
      setDeleteTarget(null);
      fetchBanks();
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail || "Failed to delete bank account";
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
        className="mb-5 sm:mb-6"
      />
      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
        <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
          <SearchInput
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Search by bank name, account number, or account holder..."
            loading={loading}
            debounceMs={0}
            showClearButton={true}
            className="w-full"
          />
        </div>
      </div>

      <DataTable
        data={paginatedBanks}
        columns={columns}
        loading={loading}
        loadingRows={pageSize}
        emptyMessage={
          canWrite
            ? "No bank accounts found. Add your first bank account to get started."
            : "No bank accounts found."
        }
        onEdit={canWrite ? handleEdit : undefined}
        onDelete={canWrite ? (bank) => setDeleteTarget(bank) : undefined}
        stickyColumns={3}
      />

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
// Bank Account Form
// ------------------------------------------------------------------
function BankAccountForm({
  bank,
  isSuperAdmin,
  companySlug: _,
  availableBanks,
  loadingAvailableBanks,
  onClose,
  onSave,
}: {
  bank: BankInfo | null;
  isSuperAdmin: boolean;
  companySlug?: string;
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
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Initialize form data when bank changes
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

    if (!selectedCatalogBank) {
      errors.bank_id = "Please select a bank";
    }

    if (!formData.account_number.trim()) {
      errors.account_number = "Account number is required";
    }

    if (!formData.account_name.trim()) {
      errors.account_name = "Account holder name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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

      if (isSuperAdmin) {
        if (!bank) {
          dataToSend.company_slug = formData.company_slug || undefined;
        }

        let selectedLogoFile: File | undefined;
        if (selectedCatalogBank?.logo) {
          try {
            selectedLogoFile = await urlToFile(
              selectedCatalogBank.logo,
              selectedCatalogBank.id || "bank-logo",
            );
          } catch (error) {
            console.error("Failed to prepare selected bank logo:", error);
          }
        }

        await onSave(dataToSend, selectedLogoFile);
      } else {
        if (selectedCatalogBank?.logo) {
          dataToSend.logo = selectedCatalogBank.logo;
        }

        // Parent loads the public asset and sends it as the existing logo file field
        await onSave(dataToSend, undefined);
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedBank = useMemo(() => {
    const byId = availableBanks.find((bank) => bank.id === formData.bank_id);
    if (byId) return byId;

    if (!formData.bank_name) return undefined;
    const selectedKey = getBankIdentityKey(formData.bank_name);
    return availableBanks.find(
      (bank) => getBankIdentityKey(bank.bank_name) === selectedKey,
    );
  }, [availableBanks, formData.bank_id, formData.bank_name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-secondary">
              {bank ? "Edit Bank Account" : "Add Bank Account"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isSuperAdmin
                ? "Manage bank account details"
                : "Add a company bank account"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 flex-shrink-0"
            disabled={saving}
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Same static bank selector for Super Admin and Company Admin */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Bank</h4>
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
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Slug
                </label>
                <input
                  type="text"
                  value={formData.company_slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company_slug: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-4 focus:ring-secondary/20 focus:outline-none transition text-sm placeholder-gray-400"
                  placeholder="e.g. abc-trading"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Leave empty for an unassigned bank account.
                </p>
              </div>
            )}

            {/* Account Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`w-full px-4 py-3 rounded-xl border ${
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
                    className={`w-full px-4 py-3 rounded-xl border ${
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
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Settings
              </h4>
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-secondary focus:ring-4 focus:ring-secondary/20 focus:outline-none transition text-sm placeholder-gray-400"
                  />
                </div>
                <div className="flex items-end pb-2">
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-white font-medium text-sm hover:bg-secondary/90 transition-colors shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-secondary/20"
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
