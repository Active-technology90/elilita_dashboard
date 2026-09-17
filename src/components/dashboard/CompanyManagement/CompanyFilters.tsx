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

  return (
    <div className="sticky -top-6 z-[100] -mt-6 w-full bg-white pt-6">
      <div className="hidden w-full rounded-xl border border-secondary/10 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.035)] md:block">
        <div className="flex w-full items-center gap-3">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={inputValue}
              onChange={onInputChange}
              debounceMs={0}
              loading={loading}
              showClearButton={true}
              placeholder="Search by name, slug, category..."
            />
          </div>

          <div className="relative z-[110] w-56 shrink-0 lg:w-64">
            <CustomSelect
              value={`${sortField}|${sortOrder}`}
              onChange={onSortChange}
              placeholder="Sort"
              options={sortOptions}
              className="w-full"
            />
          </div>

          <div className="relative z-[110] w-[138px] shrink-0">
            <CustomSelect
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange(Number(value))}
              placeholder="10 / page"
              options={pageSizeOptions}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-2 hidden grid-cols-4 gap-3 lg:grid">
          <div className="relative z-[110]">
            <CustomSelect
              value={businessTypeFilter}
              onChange={onBusinessTypeChange}
              placeholder="Business Type"
              options={businessTypeOptions.map<SelectOption>((type) => ({
                value: type,
                label: type.toUpperCase(),
              }))}
              className="w-full"
            />
          </div>

          <div className="relative z-[110]">
            <CustomSelect
              value={categoryFilter}
              onChange={onCategoryChange}
              placeholder="Category"
              options={categoryOptions.map<SelectOption>((category) => ({
                value: category,
                label: category,
              }))}
              className="w-full"
            />
          </div>

          <div className="relative z-[110]">
            <CustomSelect
              value={subCategoryFilter}
              onChange={onSubCategoryChange}
              placeholder="Subcategory"
              options={subCategoryOptions.map<SelectOption>((subcategory) => ({
                value: subcategory,
                label: subcategory,
              }))}
              className="w-full"
            />
          </div>

          <div className="flex min-w-0 items-center">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-secondary/15 bg-white px-4 text-sm font-semibold text-secondary transition hover:bg-secondary/[0.05] focus:outline-none focus:ring-2 focus:ring-secondary/15 active:scale-[0.99]"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            ) : (
              <div className="h-10 w-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
