
import React from "react";
import { useTranslation } from "react-i18next";
import BottomSheet from "./BottomSheet";
import { CustomSelect, type SelectOption } from "../ui/CustomSelect";
import { X } from "lucide-react";

interface FilterSortSheetProps {
  open: boolean;
  onClose: () => void;
  sortOptions: SelectOption[];
  tempSort: string;
  onTempSortChange: (val: string) => void;
  categoryOptions: SelectOption[];
  tempCategory: string;
  onTempCategoryChange: (val: string) => void;
  categoryNameMap?: Record<string, string>;
  onApply: () => void;
  onClearAll: () => void;
}

const FilterSortSheet: React.FC<FilterSortSheetProps> = ({
  open,
  onClose,
  sortOptions,
  tempSort,
  onTempSortChange,
  categoryOptions,
  tempCategory,
  onTempCategoryChange,
  categoryNameMap = {},
  onApply,
  onClearAll,
}) => {
  const { t } = useTranslation("sort");

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t("filterSort.title")}
      maxHeight="90vh"
      footer={
        <>
          <button
            onClick={onClearAll}
            className="flex-1 h-12 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-all"
          >
            {t("filterSort.clear")}
          </button>

          <button
            onClick={onApply}
            className="flex-1 h-12 rounded-2xl bg-secondary text-sm font-semibold text-white shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all"
          >
            {t("filterSort.applyFilters")}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Sort Section */}
        <div>
          <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
            {t("filterSort.sortBy")}
          </label>

          <CustomSelect
            value={tempSort}
            onChange={onTempSortChange}
            options={sortOptions}
            className="w-full"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="text-xs font-semibold tracking-wide uppercase text-gray-500 mb-2 block">
            {t("filterSort.category")}
          </label>

          <CustomSelect
            value={tempCategory}
            onChange={onTempCategoryChange}
            options={categoryOptions}
            className="w-full"
          />

          {tempCategory !== "all" && categoryNameMap[tempCategory] && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {categoryNameMap[tempCategory]}

                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onTempCategoryChange("all")}
                />
              </span>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default React.memo(FilterSortSheet);
