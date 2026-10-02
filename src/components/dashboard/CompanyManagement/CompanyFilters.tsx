
import { X } from "lucide-react";
import { SearchInput } from "../../ui/SearchInput";
import {
  CustomSelect,
  type SelectOption,
} from "../../ui/CustomSelect";

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
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

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
];

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
  hasActiveFilters,
  onClearAll,
}: CompanyFiltersProps) {
  return (
    <div className="hidden md:block w-full min-w-0 rounded-xl border border-gray-200 bg-white md:p-3 shadow-sm sm:p-4">
      <div className="grid w-full min-w-0 grid-cols-6 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Search */}
        <div className="col-span-4 min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <SearchInput
            value={inputValue}
            onChange={onInputChange}
            debounceMs={0}
            loading={loading}
            showClearButton
            placeholder="Search by name, slug, category..."
            className="w-full min-w-0"
          />
        </div>
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



        {/* Business type */}
        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={businessTypeFilter}
            onChange={onBusinessTypeChange}
            options={businessTypeOptions.map((type) => ({
              value: type,
              label: type.toUpperCase(),
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
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-100 sm:w-auto"
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