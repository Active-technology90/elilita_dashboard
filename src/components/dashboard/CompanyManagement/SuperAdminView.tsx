// src/components/admin/SuperAdminView.tsx
import { useState, useEffect } from "react";
import { Edit, Trash2, ImageIcon, Filter } from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";
import type { CompanyListItem } from "../../../types";

import MobileCardSkeleton from "../../ui/MobileCardSkeleton";
import BottomSheet from "../../ui/BottomSheet";
import { TableControls } from "../../ui/TableControls";

interface SuperAdminViewProps {
  /** Paginated slice — used only for the table + mobile cards. */
  paginatedItems: (CompanyListItem & { rowNumber?: number })[];

  /**
   * ⬇️ NEW — Full filtered dataset (NOT paginated).
   * Used for the stat cards so the counts reflect the entire
   * filtered list, not just the current page.
   */
  allFilteredItems: CompanyListItem[];

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
  allFilteredItems,
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

  const activeFilterCount = [
    businessTypeFilter !== "all",
    categoryFilter !== "all",
    subCategoryFilter !== "all",
    inputValue.trim() !== "",
  ].filter(Boolean).length;

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

  /* ──────────────────────────────────────────────────────────────
     Stats — computed from the FULL filtered list, not the page.
     ────────────────────────────────────────────────────────────── */
  const totalCompanies = allFilteredItems.length;
  const activeCompanies = allFilteredItems.filter((c) => c.is_active).length;
  const inactiveCompanies = totalCompanies - activeCompanies;
  const uniqueCategories = new Set(
    allFilteredItems.map((c) => c.category_name).filter(Boolean),
  ).size;

  // ---- card helpers ----
  const renderStatusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ============ STAT CARDS ============ */}
      {!loading && totalCompanies > 0 && (
        <div className="hidden gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-xl border border-secondary/10 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">
                  Total Companies
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-secondary">
                  {totalCompanies}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="rounded-xl border border-secondary/10 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">
                  Active
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-secondary">
                  {activeCompanies}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Inactive */}
          <div className="rounded-xl border border-secondary/10 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">
                  Inactive
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-secondary">
                  {inactiveCompanies}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="rounded-xl border border-secondary/10 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">
                  Categories
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-secondary">
                  {uniqueCategories}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>
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
        {/* Search + filter */}
        <div className="sticky top-0 z-40">
          <TableControls
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          >
            <div className="relative flex-1">
              <SearchInput
                value={inputValue}
                onChange={onInputChange}
                debounceMs={0}
                loading={loading}
                showClearButton={false}
                placeholder="Search companies..."
                className="rounded-xl border-secondary shadow-sm focus:ring-2 focus:ring-secondary/30"
              />
              <button
                onClick={() => setSheetOpen(true)}
                className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-white shadow-md transition active:scale-95"
              >
                <Filter size={14} strokeWidth={2.5} />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
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
          <div className="mx-4 rounded-2xl border border-secondary/10 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/[0.06]">
              <ImageIcon size={28} className="text-secondary/40" />
            </div>
            <h3 className="font-medium text-secondary">No companies found</h3>
            <p className="mt-1 text-sm text-secondary/50">
              Try adjusting your filters or add a new company
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-2 pb-4">
            {paginatedItems.map((company, idx) => (
              <div
                key={company.id ?? idx}
                className="group overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="px-4 py-1">
                  <div className="flex items-start gap-4 pt-1">
                    <div className="flex-shrink-0">
                      {company.logo ? (
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary/20 to-transparent blur-sm"></div>
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="relative h-14 w-14 rounded-full object-cover shadow-lg ring-2 ring-white"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/[0.06] shadow-inner">
                          <ImageIcon size={24} className="text-secondary/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <h3 className="truncate text-base font-bold leading-tight text-gray-900">
                        {company.name}
                      </h3>
                      <p className="mt-0.5 truncate font-mono text-xs tracking-tight text-gray-500">
                        {company.slug}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(company)}
                          className="rounded-xl p-2.5 text-secondary transition-all duration-200 hover:bg-secondary/[0.06] active:scale-95"
                          aria-label="Edit company"
                        >
                          <Edit className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(company)}
                          className="rounded-xl p-2.5 text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-95"
                          aria-label="Delete company"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { label: "Category", value: company.category_name || "—" },
                      {
                        label: "Subcategory",
                        value: company.sub_category_name || "—",
                      },
                      {
                        label: "Business Type",
                        value: (company.business_type || "—").toUpperCase(),
                      },
                      {
                        label: "Row Number",
                        value: `#${company.rowNumber ?? "—"}`,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-secondary/10 bg-secondary/[0.02] p-2.5"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary/50">
                          {item.label}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-gray-800">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

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
                className="h-12 flex-1 rounded-2xl bg-secondary/[0.06] text-sm font-semibold text-secondary transition-all active:scale-[0.98]"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="h-12 flex-1 rounded-2xl bg-secondary text-sm font-semibold text-white shadow-lg shadow-secondary/20 transition-all active:scale-[0.98]"
              >
                Apply Filters
              </button>
            </>
          }
        >
          <div className="space-y-4 px-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary/60">
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
                    className={`rounded-xl px-3 py-2.5 text-xs font-medium transition-all active:scale-95 ${
                      tempSort === opt.value
                        ? "bg-secondary text-white shadow-md"
                        : "bg-secondary/[0.06] text-secondary hover:bg-secondary/[0.1]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-secondary/10" />

            {/* Business Type */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary/60">
                Business Type
              </label>
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-secondary/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : businessTypeOptions.length === 0 ? (
                <p className="py-2 text-sm italic text-secondary/40">
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary/60">
                Category
              </label>
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-secondary/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : categoryOptions.length === 0 ? (
                <p className="py-2 text-sm italic text-secondary/40">
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary/60">
                Subcategory
              </label>
              {loading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-secondary/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : subCategoryOptions.length === 0 ? (
                <p className="py-2 text-sm italic text-secondary/40">
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
    </div>
  );
}