// src/components/dashboard/bank/ChapaDirectSettlementCard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Building2,
  CheckCircle,
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
} from "lucide-react";
import {
  getChapaBanks,
  getCompanyChapaSubaccountStatus,
  provisionCompanyChapaSubaccount,
  delinkCompanyChapaSubaccount,
  type ChapaBankItem,
  type ChapaSubaccountStatus,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";

interface Props {
  companySlug?: string | null;
  companyName?: string;
  canWrite: boolean;
  onChanged?: () => void;
  className?: string;
}

export default function ChapaDirectSettlementCard({
  companySlug,
  companyName = "Selected Company",
  canWrite,
  onChanged,
  className = "",
}: Props) {
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<ChapaSubaccountStatus | null>(null);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showDelinkModal, setShowDelinkModal] = useState(false);
  const [isDelinking, setIsDelinking] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!companySlug) {
      setStatusData(null);
      return;
    }
    try {
      setLoading(true);
      const res = await getCompanyChapaSubaccountStatus(companySlug);
      setStatusData(res.data);
    } catch (err: any) {
      console.warn("Failed to load Chapa subaccount status:", err);
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleDelink = async () => {
    if (!companySlug) return;
    try {
      setIsDelinking(true);
      await delinkCompanyChapaSubaccount(companySlug);
      showToast("success", `Chapa subaccount de-linked for ${companyName}`);
      setShowDelinkModal(false);
      await fetchStatus();
      if (onChanged) onChanged();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || "Failed to de-link Chapa subaccount";
      showToast("error", msg);
    } finally {
      setIsDelinking(false);
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
              Select a company from the filter to view and configure Chapa split payments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = !!statusData?.is_connected;
  const subaccountId = statusData?.chapa_sub_account_id;

  return (
    <>
      <Toast toast={toast} />

      <div
        className={`rounded-2xl border transition-all ${
          isConnected
            ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-white"
            : "border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white"
        } p-4 sm:p-6 shadow-sm ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Header & Icon */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                isConnected
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {isConnected ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <CreditCard className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  Chapa Split Settlement — {companyName}
                </h3>
                {loading ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking
                  </span>
                ) : isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Linked & Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Not Configured
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                {isConnected
                  ? "Customer payments at checkout are automatically split: vendor merchandise revenue is deposited directly into this store's bank account, and the platform commission is retained in the main account."
                  : "To enable Chapa online payments at checkout for this store, provision a Chapa subaccount. All earnings route directly to the store's verified bank account."}
              </p>

              {isConnected && subaccountId && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-500">
                    Subaccount ID:{" "}
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800 border border-gray-200">
                      {subaccountId}
                    </code>
                  </span>
                  {statusData?.platform_fee_percent && (
                    <span className="text-gray-500">
                      Platform Fee:{" "}
                      <span className="font-semibold text-gray-700">
                        {statusData.platform_fee_percent}%
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect Chapa Subaccount
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Provision Modal */}
      {showProvisionModal && (
        <ChapaProvisionModal
          companySlug={companySlug}
          companyName={companyName}
          onClose={() => setShowProvisionModal(false)}
          onSuccess={async () => {
            setShowProvisionModal(false);
            showToast("success", "Chapa subaccount provisioned successfully!");
            await fetchStatus();
            if (onChanged) onChanged();
          }}
        />
      )}

      {/* Delink Confirmation Modal */}
      {showDelinkModal && (
        <DeleteConfirmModal
          isOpen={showDelinkModal}
          onClose={() => setShowDelinkModal(false)}
          onConfirm={handleDelink}
          title="De-link Chapa Subaccount?"
          message={`Are you sure you want to de-link the Chapa subaccount for "${companyName}"? Chapa online checkout will be immediately disabled for this store until a new subaccount is provisioned.`}
          confirmLabel={isDelinking ? "De-linking..." : "De-link Subaccount"}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------
// Provision Modal
// ------------------------------------------------------------------
interface ModalProps {
  companySlug: string;
  companyName: string;
  onClose: () => void;
  onSuccess: (subaccountId: string) => void;
}

function ChapaProvisionModal({
  companySlug,
  companyName,
  onClose,
  onSuccess,
}: ModalProps) {
  const [banks, setBanks] = useState<ChapaBankItem[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<ChapaBankItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [businessName, setBusinessName] = useState(companyName);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const res = await getChapaBanks();
        const bankList = res.data?.banks || [];
        setBanks(bankList.filter((b) => b.is_active));
      } catch (err: any) {
        console.error("Failed to fetch Chapa bank list:", err);
        setErrorMsg("Failed to load Ethiopian banks from Chapa.");
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const term = bankSearch.toLowerCase();
    return banks.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.slug.toLowerCase().includes(term),
    );
  }, [banks, bankSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedBank) {
      setErrorMsg("Please select a bank from the list.");
      return;
    }
    if (!accountNumber.trim()) {
      setErrorMsg("Account number is required.");
      return;
    }
    if (!accountName.trim()) {
      setErrorMsg(
        "Account holder name is required (as registered with the bank).",
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await provisionCompanyChapaSubaccount(companySlug, {
        bank_code: selectedBank.id,
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        business_name: businessName.trim() || companyName,
        bank_name: selectedBank.name,
      });

      const subId = res.data?.subaccount_id;
      onSuccess(subId);
    } catch (err: any) {
      console.error("Failed to provision subaccount:", err);
      let msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to provision Chapa subaccount.";
      if (typeof msg === "object") {
        const firstKey = Object.keys(msg)[0];
        msg = `${firstKey}: ${msg[firstKey]}`;
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
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
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Bank Select */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Select Bank <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              disabled={loadingBanks}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <div className="flex items-center gap-2.5 truncate">
                {selectedBank ? (
                  <>
                    {selectedBank.logo ? (
                      <img
                        src={selectedBank.logo}
                        alt=""
                        className="h-5 w-5 rounded object-contain shrink-0"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span className="font-medium text-gray-900 truncate">
                      {selectedBank.name}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">
                    {loadingBanks ? "Loading banks from Chapa..." : "Select an Ethiopian bank"}
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl max-h-60 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Search bank name..."
                      className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto divide-y divide-gray-50">
                  {filteredBanks.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-500">
                      No matching banks found
                    </div>
                  ) : (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank);
                          setIsDropdownOpen(false);
                          setBankSearch("");
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition hover:bg-emerald-50/60 ${
                          selectedBank?.id === bank.id
                            ? "bg-emerald-50 font-semibold text-emerald-900"
                            : "text-gray-700"
                        }`}
                      >
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt=""
                            className="h-5 w-5 rounded object-contain shrink-0"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{bank.name}</span>
                        {bank.acct_length && (
                          <span className="text-[10px] text-gray-400">
                            {bank.acct_length} digits
                          </span>
                        )}
                      </button>
                    ))
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
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 100012345678"
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {selectedBank?.acct_length && (
              <p className="mt-1 text-[11px] text-gray-500">
                Expected length for {selectedBank.name}:{" "}
                <span className="font-semibold text-gray-700">
                  {selectedBank.acct_length} digits
                </span>
              </p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Account Holder Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Full name as registered on the bank account"
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Must match the official bank account holder name for KYC verification.
            </p>
          </div>

          {/* Business / Trading Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Business / Store Display Name (Optional)
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={companyName}
              className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Info callout */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 text-[11px] text-blue-900 leading-relaxed">
            <span className="font-semibold">Split Payment Guarantee:</span> Once
            linked, customer transactions at checkout are settled automatically by
            Chapa: store funds route straight to this bank account, and platform
            commissions stay in the main account.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {submitting ? "Provisioning..." : "Provision & Link Subaccount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

