import { X } from "lucide-react";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

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
    <div className="w-full rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_180px_118px]">
        <SearchInput
          value={inputValue}
          onChange={onInputChange}
          debounceMs={0}
          loading={loading}
          showClearButton
          placeholder="Search by name, slug, category..."
          className="w-full"
        />

        <CustomSelect
          value={`${sortField}|${sortOrder}`}
          onChange={onSortChange}
          options={sortOptions}
          placeholder="Sort"
          className="w-full"
        />

        <CustomSelect
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          options={pageSizeOptions}
          placeholder="10 / page"
          className="w-full"
        />
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <CustomSelect
          value={businessTypeFilter}
          onChange={onBusinessTypeChange}
          options={businessTypeOptions.map((type) => ({
            value: type,
            label: type.toUpperCase(),
          }))}
          placeholder="Business Type"
          className="w-full"
        />

        <CustomSelect
          value={categoryFilter}
          onChange={onCategoryChange}
          options={categoryOptions.map((category) => ({
            value: category,
            label: category,
          }))}
          placeholder="Category"
          className="w-full"
        />

        <CustomSelect
          value={subCategoryFilter}
          onChange={onSubCategoryChange}
          options={subCategoryOptions.map((subcategory) => ({
            value: subcategory,
            label: subcategory,
          }))}
          placeholder="Subcategory"
          className="w-full"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
