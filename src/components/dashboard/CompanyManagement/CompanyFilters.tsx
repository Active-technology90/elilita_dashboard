// src/components/admin/CompanyManagement/CompanyFilters.tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, CalendarRange } from "lucide-react";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { useLocalizedName } from "../../../hooks/useLocalizedName";

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
  /** NEW — optional map: business_type → Amharic label from backend */
  businessTypeLabelsAm?: Record<string, string>;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: string[];
  /** NEW — optional map: category_name → Amharic name from backend */
  categoryLabelsAm?: Record<string, string>;
  subCategoryFilter: string;
  onSubCategoryChange: (value: string) => void;
  subCategoryOptions: string[];
  /** NEW — optional map: sub_category_name → Amharic name from backend */
  subCategoryLabelsAm?: Record<string, string>;
  createdAtFilter: string;
  onCreatedAtChange: (value: string) => void;
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
  businessTypeLabelsAm,
  categoryFilter,
  onCategoryChange,
  categoryOptions,
  categoryLabelsAm,
  subCategoryFilter,
  onSubCategoryChange,
  subCategoryOptions,
  subCategoryLabelsAm,
  createdAtFilter,
  onCreatedAtChange,
  hasActiveFilters,
  onClearAll,
}: CompanyFiltersProps) {
  const { t } = useTranslation("company");
  const { pick, isAmharic } = useLocalizedName();

  const pageSizeOptions: SelectOption[] = useMemo(
    () => [
      { value: "5", label: t("pageSize5") },
      { value: "10", label: t("pageSize10") },
      { value: "15", label: t("pageSize15") },
      { value: "30", label: t("pageSize30") },
      { value: "60", label: t("pageSize60") },
    ],
    [t],
  );

  const sortOptions: SelectOption[] = useMemo(
    () => [
      { value: "name|asc", label: t("sortNameAsc") },
      { value: "name|desc", label: t("sortNameDesc") },
      { value: "is_active|desc", label: t("sortActiveFirst") },
      { value: "is_featured|desc", label: t("sortFeaturedFirst") },
      { value: "created_at|desc", label: t("sortNewestFirst") },
      { value: "created_at|asc", label: t("sortOldestFirst") },
    ],
    [t],
  );

  const createdAtOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: t("createdAny") },
      { value: "today", label: t("createdToday") },
      { value: "week", label: t("createdWeek") },
      { value: "month", label: t("createdMonth") },
      { value: "quarter", label: t("createdQuarter") },
      { value: "year", label: t("createdYear") },
      { value: "older", label: t("createdOlder") },
    ],
    [t],
  );

  /**
   * Business type label — priority:
   *   1. Backend Amharic label (if Amharic UI + provided)
   *   2. Built-in translation (btBrand / btStore / etc.) when the key matches
   *   3. Title-cased English fallback
   */
  const labelForBusinessType = (raw: string): string => {
    const key = String(raw || "").toLowerCase().trim();
    if (!key) return "";

    const backendAm = businessTypeLabelsAm?.[raw] ?? businessTypeLabelsAm?.[key];
    const staticKey: Record<string, string> = {
      brand: t("btBrand"),
      factory: t("btFactory"),
      service: t("btService"),
      store: t("btStore"),
      delivery: t("btDelivery"),
      delivery_service: t("btDeliveryService"),
      other: t("btOther"),
    };

    if (isAmharic) {
      if (backendAm && backendAm.trim() !== "") return backendAm;
      if (staticKey[key]) return staticKey[key];
    }

    return staticKey[key] ?? key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const categoryLabel = (name: string) => {
    const am = categoryLabelsAm?.[name];
    return pick(name, am);
  };

  const subCategoryLabel = (name: string) => {
    const am = subCategoryLabelsAm?.[name];
    return pick(name, am);
  };

  return (
    <div className="hidden w-full min-w-0 rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)] md:block md:p-3 sm:p-4">
      <div className="grid w-full min-w-0 grid-cols-6 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="col-span-4 min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <SearchInput
            value={inputValue}
            onChange={onInputChange}
            debounceMs={0}
            loading={loading}
            showClearButton={false}
            placeholder={t("searchPlaceholder")}
            className="w-full min-w-0"
          />
        </div>

        <div className="col-span-2 min-w-0 sm:col-span-1 lg:col-span-1 xl:col-span-1">
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions}
            placeholder={t("pageSize10")}
            className="w-full min-w-0"
          />
        </div>

        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={`${sortField}|${sortOrder}`}
            onChange={onSortChange}
            options={sortOptions}
            placeholder={t("sortPlaceholder")}
            className="w-full min-w-0"
          />
        </div>

        <div className="col-span-3 min-w-0 sm:col-span-1">
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-secondary/50" />
            <CustomSelect
              value={createdAtFilter}
              onChange={onCreatedAtChange}
              options={createdAtOptions}
              placeholder={t("filterCreatedAt")}
              className="w-full min-w-0 pl-9"
            />
          </div>
        </div>

        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={businessTypeFilter}
            onChange={onBusinessTypeChange}
            options={businessTypeOptions.map((type) => ({
              value: type,
              label: labelForBusinessType(type),
            }))}
            placeholder={t("filterBusinessType")}
            className="w-full min-w-0"
          />
        </div>

        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={categoryFilter}
            onChange={onCategoryChange}
            options={categoryOptions.map((category) => ({
              value: category,
              label: categoryLabel(category),
            }))}
            placeholder={t("filterCategory")}
            className="w-full min-w-0"
          />
        </div>

        <div className="col-span-3 min-w-0 sm:col-span-1">
          <CustomSelect
            value={subCategoryFilter}
            onChange={onSubCategoryChange}
            options={subCategoryOptions.map((subcategory) => ({
              value: subcategory,
              label: subCategoryLabel(subcategory),
            }))}
            placeholder={t("filterSubcategory")}
            className="w-full min-w-0"
          />
        </div>

        {hasActiveFilters && (
          <div className="col-span-3 flex min-w-0 items-center sm:col-span-1">
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-secondary/15 bg-white px-3 text-sm font-medium text-secondary transition-colors hover:bg-secondary/[0.04] active:bg-secondary/[0.08] sm:w-auto"
            >
              <X className="h-4 w-4 shrink-0" />
              {t("clearFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}