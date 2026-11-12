import React, { useState, useEffect, useMemo } from "react";
import { 
  Wallet, 
  TrendingUp, 
  Building2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  X,
  Percent
} from "lucide-react";
// Assuming you have these UI components based on your Payments.tsx
import PageHeader from "../../ui/PageHeader";
import { SearchInput } from "../../ui/SearchInput";
import { DataTable, type Column } from "../../ui/DataTable";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

// --- Types ---
interface Company {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  custom_fee: number | null; // null means they use the global fee
  status: "active" | "suspended";
}

// --- Mock API Calls (Replace with your actual API) ---
const fetchGlobalFee = async (): Promise<number> => {
  return 5.0; 
};

const updateGlobalFee = async (fee: number) => {
  return new Promise((resolve) => setTimeout(resolve, 500));
};

const fetchCompanies = async (): Promise<Company[]> => {
  return [
    { id: 1, name: "Africa Coffee", slug: "africa-coffee", custom_fee: null, status: "active" },
    { id: 2, name: "Elilita Marketplace", slug: "elilita", custom_fee: 2.5, status: "active" },
    { id: 3, name: "Sidama Beans", slug: "sidama-beans", custom_fee: null, status: "active" },
    { id: 4, name: "Addis Groceries", slug: "addis-groceries", custom_fee: 7.0, status: "suspended" },
  ];
};

const updateCompanyFee = async (companyId: number, fee: number | null) => {
  return new Promise((resolve) => setTimeout(resolve, 500));
};

export default function PlatformFeeManager() {
  const { toast, showToast } = useToast();

  const [globalFee, setGlobalFee] = useState<number>(0);
  const [tempGlobalFee, setTempGlobalFee] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  
  // Modal State for Editing Company
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editFeeValue, setEditFeeValue] = useState<string>("");
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [feeData, companiesData] = await Promise.all([
        fetchGlobalFee(),
        fetchCompanies(),
      ]);
      setGlobalFee(feeData);
      setTempGlobalFee(feeData.toString());
      setCompanies(companiesData);
    } catch (error) {
      showToast("error", "Failed to load fee data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGlobalFee = async () => {
    const parsed = parseFloat(tempGlobalFee);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      showToast("error", "Please enter a valid percentage between 0 and 100.");
      return;
    }

    setIsSavingGlobal(true);
    try {
      await updateGlobalFee(parsed);
      setGlobalFee(parsed);
      showToast("success", "Global platform fee updated successfully.");
    } catch (error) {
      showToast("error", "Failed to update global fee.");
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setEditFeeValue(company.custom_fee !== null ? company.custom_fee.toString() : "");
  };

  const handleSaveCompanyFee = async (useGlobal: boolean) => {
    if (!editingCompany) return;

    let newFee: number | null = null;
    if (!useGlobal) {
      const parsed = parseFloat(editFeeValue);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        showToast("error", "Please enter a valid percentage between 0 and 100.");
        return;
      }
      newFee = parsed;
    }

    setIsSavingCompany(true);
    try {
      await updateCompanyFee(editingCompany.id, newFee);
      setCompanies((prev) =>
        prev.map((c) => (c.id === editingCompany.id ? { ...c, custom_fee: newFee } : c))
      );
      showToast("success", `Fee updated for ${editingCompany.name}`);
      setEditingCompany(null);
    } catch (error) {
      showToast("error", "Failed to update company fee.");
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      totalCompanies: companies.length,
      customOverrides: companies.filter(c => c.custom_fee !== null).length,
      activeCompanies: companies.filter(c => c.status === "active").length,
    };
  }, [companies]);

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // DataTable Columns
  const columns = useMemo<Column<Company>[]>(() => [
    {
      key: "company",
      header: "Company",
      render: (company) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-secondary font-bold text-lg">{company.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-2">
              {company.name}
              {company.status === "suspended" && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Suspended</span>
              )}
            </div>
            <div className="text-xs text-gray-500">@{company.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "fee_type",
      header: "Fee Applied",
      render: (company) => (
        <div className="flex flex-col items-start">
          {company.custom_fee !== null ? (
            <>
              <span className="text-base font-black text-secondary">{company.custom_fee}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm mt-1">Custom Override</span>
            </>
          ) : (
            <>
              <span className="text-base font-bold text-gray-700">{globalFee}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">Global Rate</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (company) => (
        <button
          onClick={() => openEditModal(company)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary/10"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Manage Fee</span>
        </button>
      ),
    }
  ], [globalFee]);

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        
        <PageHeader
          title="Platform Fee Management"
          icon={Percent}
          description="Manage global commission rates and vendor-specific overrides."
          className="mb-6"
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-secondary text-white shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-semibold text-white/80 block mb-1">Global Platform Fee</span>
              <div className="text-3xl font-black">{globalFee}%</div>
              <span className="text-[11px] text-white/70 block mt-1">Default for all vendors</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center relative z-10">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-1">Custom Overrides</span>
              <div className="text-2xl font-bold text-gray-900">{stats.customOverrides}</div>
              <span className="text-[11px] text-amber-600 font-medium block mt-1">Vendors with custom rates</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 block mb-1">Total Vendors</span>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</div>
              <span className="text-[11px] text-emerald-600 font-medium block mt-1">{stats.activeCompanies} active</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Global Fee Settings */}
        <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-secondary" />
              Update Global Fee
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              This rate applies to all orders unless a specific vendor override is active.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                value={tempGlobalFee}
                onChange={(e) => setTempGlobalFee(e.target.value)}
                className="w-32 pl-4 pr-10 py-3 rounded-xl border border-gray-300 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-lg font-bold text-gray-900 transition-all bg-white"
                placeholder="0.00"
                min="0"
                max="100"
                step="0.1"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            <button
              onClick={handleSaveGlobalFee}
              disabled={isSavingGlobal || tempGlobalFee === globalFee.toString()}
              className="bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-secondary/20"
            >
              {isSavingGlobal ? "Saving..." : "Save Rate"}
            </button>
          </div>
        </div>

        {/* Vendor Search */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-gray-900">Vendor Overrides</h3>
          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder="Search vendors..."
              loading={isLoading}
              showClearButton={true}
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredCompanies}
          columns={columns}
          loading={isLoading}
          emptyMessage="No vendors found matching your criteria"
        />
      </div>

      {/* --- EDIT FEE MODAL --- */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {editingCompany.logo ? (
                    <img src={editingCompany.logo} alt={editingCompany.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-secondary font-bold text-lg">{editingCompany.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Manage Fee</h3>
                  <p className="text-xs text-gray-500">{editingCompany.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCompany(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 cursor-pointer" onClick={() => setEditFeeValue("")}>
                <div>
                  <div className="font-bold text-gray-900">Use Global Rate</div>
                  <div className="text-sm text-gray-500">Apply the default {globalFee}% fee</div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editFeeValue === "" ? "border-secondary bg-secondary" : "border-gray-300"}`}>
                  {editFeeValue === "" && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Or Custom</span>
                </div>
              </div>

              <div 
                className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${editFeeValue !== "" ? "border-secondary bg-secondary/5 ring-1 ring-secondary" : "border-gray-200 bg-white hover:border-gray-300"}`}
                onClick={() => { if (editFeeValue === "") setEditFeeValue(globalFee.toString()); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900">Custom Override</div>
                    <div className="text-sm text-gray-500">Set a specific rate for this vendor</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editFeeValue !== "" ? "border-secondary bg-secondary" : "border-gray-300"}`}>
                    {editFeeValue !== "" && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                </div>

                {editFeeValue !== "" && (
                  <div className="relative mt-2">
                    <input
                      type="number"
                      autoFocus
                      value={editFeeValue}
                      onChange={(e) => setEditFeeValue(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-lg border border-secondary/30 focus:border-secondary outline-none text-xl font-black text-gray-900 bg-white"
                      placeholder="0.00"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingCompany(null)}
                disabled={isSavingCompany}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveCompanyFee(editFeeValue === "")}
                disabled={isSavingCompany}
                className="bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-secondary/20"
              >
                {isSavingCompany ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}