// src/components/admin/SuperAdminView.tsx
import { useState, useEffect } from "react";
import { Edit, Trash2, ImageIcon, Filter } from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";
import type { CompanyListItem } from "../../../types";

// ---- shared components ----
import MobileCardSkeleton from "../../ui/MobileCardSkeleton";
// import MobileActionBar from "../../ui/MobileActionBar";
import BottomSheet from "../../ui/BottomSheet";
import { TableControls } from "../../ui/TableControls";

interface SuperAdminViewProps {
  paginatedItems: (CompanyListItem & { rowNumber?: number })[];
  columns: Column<CompanyListItem>[];
  loading: boolean;
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (company: CompanyListItem) => void;
  onDelete?: (company: CompanyListItem) => void;
  // Mobile filter props
  inputValue: string;
  onInputChange: (value: string) => void;
  onSortChange: (value: string) => void;
  businessTypeFilter: string;
  onBusinessTypeChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  subCategoryFilter: string;
  onSubCategoryChange: (value: string) => void;
  businessTypeOptions: string[];
  categoryOptions: string[];
  subCategoryOptions: string[];
  onClearAll: () => void;
    pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export default function SuperAdminView({
  paginatedItems,
  columns,
  loading,
  sortField,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  inputValue,
  onInputChange,
  onSortChange,
  businessTypeFilter,
  onBusinessTypeChange,
  categoryFilter,
  onCategoryChange,
  subCategoryFilter,
  onSubCategoryChange,
  businessTypeOptions,
  categoryOptions,
  subCategoryOptions,
  onClearAll,
  pageSize,
  onPageSizeChange,
}: SuperAdminViewProps) {
  // ---- Mobile filter sheet ----
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempBusinessType, setTempBusinessType] = useState(businessTypeFilter);
  const [tempCategory, setTempCategory] = useState(categoryFilter);
  const [tempSubCategory, setTempSubCategory] = useState(subCategoryFilter);
  const [tempSort, setTempSort] = useState(`${sortField}|${sortOrder}`);

  // Active filter badge count
  const activeFilterCount = [
    businessTypeFilter !== "all",
    categoryFilter !== "all",
    subCategoryFilter !== "all",
    inputValue.trim() !== "",
  ].filter(Boolean).length;

  // Sync temp state when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setTempBusinessType(businessTypeFilter);
      setTempCategory(categoryFilter);
      setTempSubCategory(subCategoryFilter);
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [
    sheetOpen,
    businessTypeFilter,
    categoryFilter,
    subCategoryFilter,
    sortField,
    sortOrder,
  ]);

  const applyFilters = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) onSortChange(tempSort);
    if (tempBusinessType !== businessTypeFilter)
      onBusinessTypeChange(tempBusinessType);
    if (tempCategory !== categoryFilter) onCategoryChange(tempCategory);
    if (tempSubCategory !== subCategoryFilter)
      onSubCategoryChange(tempSubCategory);
    setSheetOpen(false);
  };

  const clearAll = () => {
    onClearAll();
    setSheetOpen(false);
  };

  // ---- card helpers ----
  const renderStatusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold leading-none shadow-sm ${
        isActive
          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
          : "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"} mr-1.5`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  return (
  <div className="space-y-4 sm:space-y-5">
    {/* Stat cards — Featured card removed */}
    {!loading && paginatedItems.length > 0 && (
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 shadow-sm">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Companies</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{paginatedItems.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {paginatedItems.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50 shadow-sm">
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Categories</p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {new Set(paginatedItems.map(c => c.category_name)).size}
          </p>
        </div>
      </div>
    )}

      {/* ============ DESKTOP / TABLET ============ */}
      <div className="hidden md:block">
        <DataTable
          data={paginatedItems}
          columns={columns}
          loading={loading}
          emptyMessage="No companies found"
          onEdit={onEdit}
          onDelete={onDelete}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      </div>

      {/* ============ MOBILE LAYOUT ============ */}
      <div className="block md:hidden">
        {/* Search */}
        <div className="sticky top-0 z-40  ">
  <TableControls
    pageSize={pageSize}
    onPageSizeChange={onPageSizeChange}
  >
    {/* LEFT SIDE = SEARCH + FILTER */}
    <div className="relative flex-1">
      <SearchInput
        value={inputValue}
        onChange={onInputChange}
        debounceMs={0}
        loading={loading}
        showClearButton={false}
        placeholder="Search companies..."
        className="rounded-xl shadow-sm border-secondary focus:ring-2 focus:ring-secondary/30"
      />

      {/* FILTER BUTTON INSIDE SEARCH */}
      <button
        onClick={() => setSheetOpen(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2
        h-6 w-6 rounded-full bg-secondary text-white
        flex items-center justify-center shadow-md
        active:scale-95 transition"
      >
        <Filter size={14} strokeWidth={2.5} />

        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  </TableControls>
</div>
        {/* Cards */}
        {loading ? (
          <MobileCardSkeleton count={5} />
        ) : paginatedItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-10 text-center mx-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-gray-500 font-medium">No companies found</h3>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your filters or add a new company
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-2 pb-4">
            {paginatedItems.map((company, idx) => (
              <div
                key={company.id ?? idx}
                className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1"
              >
                <div className="px-4 py-1">
                  <div className="flex items-start gap-4 pt-1">
                    <div className="flex-shrink-0">
                      {company.logo ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent rounded-full blur-sm"></div>
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="relative w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                        {company.name}
                      </h3>
                      <p className="text-xs font-mono text-gray-500 truncate mt-0.5 tracking-tight">
                        {company.slug}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-1.5">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(company)}
                          className="p-2.5 text-blue-600 hover:text-blue-800 rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 active:scale-95"
                          aria-label="Edit company"
                        >
                          <Edit className="h-4.5 w-4.5" strokeWidth={1.75} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(company)}
                          className="p-2.5 text-red-600 hover:text-red-800 rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all duration-200 active:scale-95"
                          aria-label="Delete company"
                        >
                          <Trash2 className="h-4.5 w-4.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info grid — typography normalized */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 truncate">
                        {company.category_name || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Subcategory
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 truncate">
                        {company.sub_category_name || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Business Type
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 uppercase truncate">
                        {company.business_type || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Row Number
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-800 truncate">
                        #{company.rowNumber ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Status — Featured badge removed */}
                  <div className="flex flex-wrap gap-4 py-2">
                    {renderStatusBadge(company.is_active)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== FILTER & SORT BOTTOM SHEET ========== */}
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Filters & Sort"
          maxHeight="70vh"
          footer={
            <>
              <button
                onClick={clearAll}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-all"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 h-12 rounded-2xl bg-secondary text-sm font-semibold text-white shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all"
              >
                Apply Filters
              </button>
            </>
          }
        >
          <div className="space-y-4 px-2">
            {/* Sort section */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "name|asc", label: "Name A-Z" },
                  { value: "name|desc", label: "Name Z-A" },
                  { value: "is_active|desc", label: "Active First" },
                  { value: "is_featured|desc", label: "Featured First" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTempSort(opt.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                      tempSort === opt.value
                        ? "bg-secondary text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Business Type */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Business Type
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : businessTypeOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">
                  No types available
                </p>
              ) : (
                <CustomSelect
                  value={tempBusinessType}
                  onChange={setTempBusinessType}
                  placeholder="All types"
                  options={[
                    { value: "all", label: "All" },
                    ...businessTypeOptions.map((type) => ({
                      value: type,
                      label: type.toUpperCase(),
                    })),
                  ]}
                  className="w-full"
                />
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Category
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : categoryOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">
                  No categories available
                </p>
              ) : (
                <CustomSelect
                  value={tempCategory}
                  onChange={setTempCategory}
                  placeholder="All categories"
                  options={[
                    { value: "all", label: "All" },
                    ...categoryOptions.map((cat) => ({
                      value: cat,
                      label: cat,
                    })),
                  ]}
                  className="w-full"
                />
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
                Subcategory
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : subCategoryOptions.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">
                  No subcategories available
                </p>
              ) : (
                <CustomSelect
                  value={tempSubCategory}
                  onChange={setTempSubCategory}
                  placeholder="All subcategories"
                  options={[
                    { value: "all", label: "All" },
                    ...subCategoryOptions.map((sub) => ({
                      value: sub,
                      label: sub,
                    })),
                  ]}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </BottomSheet>
      </div>

      {/* Pagination */}
      <div className="pt-2 sm:pt-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      <style>{`
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
      `}</style>
    </div>
  );
}