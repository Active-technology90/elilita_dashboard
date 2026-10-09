import { X, CalendarRange } from "lucide-react";
import { SearchInput } from "../../ui/SearchInput";
import {
  CustomSelect,
  type SelectOption,
} from "../../ui/CustomSelect";

/* ──────────────────────────────────────────────────────────────────
   Props
   ────────────────────────────────────────────────────────────────── */

interface CompanyFiltersProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;

  inputValue: string;
  onInputChange: (value: string) => void;
  loading: boolean;

  sortField: string;
  sortOrder: string;
  onSortChange: (value: string) => void;

  businessTypeFilter: string;
  onBusinessTypeChange: (value: string) => void;
  businessTypeOptions: string[];

  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: string[];

  subCategoryFilter: string;
  onSubCategoryChange: (value: string) => void;
  subCategoryOptions: string[];

  /** NEW — recency filter. Values: all | today | week | month | quarter | year | older */
  createdAtFilter: string;
  onCreatedAtChange: (value: string) => void;

  hasActiveFilters: boolean;
  onClearAll: () => void;
}

/* ──────────────────────────────────────────────────────────────────
   Options
   ────────────────────────────────────────────────────────────────── */

const pageSizeOptions: SelectOption[] = [
  { value: "5", label: "5 / page" },
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "30", label: "30 / page" },
  { value: "60", label: "60 / page" },
];

const sortOptions: SelectOption[] = [
  { value: "name|asc", label: "Name (A-Z)" },
  { value: "name|desc", label: "Name (Z-A)" },
  { value: "is_active|desc", label: "Active First" },
  { value: "is_featured|desc", label: "Featured First" },
  { value: "created_at|desc", label: "Newest First" },
  { value: "created_at|asc", label: "Oldest First" },
];

const createdAtOptions: SelectOption[] = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "quarter", label: "Last 90 days" },
  { value: "year", label: "Last year" },
  { value: "older", label: "Older than a year" },
];

/**
 * Canonical list of business types supported by the platform.
 * Keep the backend enum and this list in sync.
 *
 * Backend value  →  Display label
 * ─────────────────────────────────
 * brand          →  BRAND
 * factory        →  FACTORY
 * service        →  SERVICE
 * store          →  STORE
 * delivery       →  DELIVERY LOGISTICS
 */
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  brand: "BRAND",
  factory: "FACTORY",
  service: "SERVICE",
  store: "STORE",
  delivery: "DELIVERY LOGISTICS",
};

/**
 * Any business type that comes from the backend but isn't in the map above
 * gets title-cased as a safe fallback (e.g. "some_new_type" → "Some New Type").
 */
function labelForBusinessType(raw: string): string {
  const key = String(raw || "").toLowerCase().trim();
  if (!key) return "";
  if (BUSINESS_TYPE_LABELS[key]) return BUSINESS_TYPE_LABELS[key];
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ──────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────── */

export default function CompanyFilters({
  pageSize,
  onPageSizeChange,
  inputValue,
  onInputChange,
  loading,
  sortField,
  sortOrder,
  onSortChange,
  businessTypeFilter,
  onBusinessTypeChange,
  businessTypeOptions,
  categoryFilter,
  onCategoryChange,
  categoryOptions,
  subCategoryFilter,
  onSubCategoryChange,
  subCategoryOptions,
  createdAtFilter,
  onCreatedAtChange,
  hasActiveFilters,
  onClearAll,
}: CompanyFiltersProps) {
  return (
    <div className="hidden w-full min-w-0 rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)] md:block md:p-3 sm:p-4">
      <div className="grid w-full min-w-0 grid-cols-6 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Search */}
        <div className="col-span-4 min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <SearchInput
            value={inputValue}
            onChange={onInputChange}
            debounceMs={0}
            loading={loading}
            showClearButton={false}
            placeholder="Search by name, slug, category..."
            className="w-full min-w-0"
          />
        </div>

        {/* Page size */}
        <div className="col-span-2 min-w-0 sm:col-span-1 lg:col-span-1 xl:col-span-1">
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions}
            placeholder="10 / page"
            className="w-full min-w-0"
          />
        </div>

        {/* Sort */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={`${sortField}|${sortOrder}`}
            onChange={onSortChange}
            options={sortOptions}
            placeholder="Sort"
            className="w-full min-w-0"
          />
        </div>

        {/* Created at (recency) */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-secondary/50" />
            <CustomSelect
              value={createdAtFilter}
              onChange={onCreatedAtChange}
              options={createdAtOptions}
              placeholder="Any time"
              className="w-full min-w-0 pl-9"
            />
          </div>
        </div>

        {/* Business type — now includes DELIVERY LOGISTICS */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={businessTypeFilter}
            onChange={onBusinessTypeChange}
            options={businessTypeOptions.map((type) => ({
              value: type,
              label: labelForBusinessType(type),
            }))}
            placeholder="Business Type"
            className="w-full min-w-0"
          />
        </div>

        {/* Category */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={categoryFilter}
            onChange={onCategoryChange}
            options={categoryOptions.map((category) => ({
              value: category,
              label: category,
            }))}
            placeholder="Category"
            className="w-full min-w-0"
          />
        </div>

        {/* Subcategory */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={subCategoryFilter}
            onChange={onSubCategoryChange}
            options={subCategoryOptions.map((subcategory) => ({
              value: subcategory,
              label: subcategory,
            }))}
            placeholder="Subcategory"
            className="w-full min-w-0"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="col-span-3 flex min-w-0 items-center sm:col-span-1">
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-secondary/15 bg-white px-3 text-sm font-medium text-secondary transition-colors hover:bg-secondary/[0.04] active:bg-secondary/[0.08] sm:w-auto"
            >
              <X className="h-4 w-4 shrink-0" />
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}