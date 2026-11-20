
import { useTranslation } from "react-i18next";
import { Search, X, RefreshCw } from "lucide-react";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface ServiceBookingAdvancedFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  paymentStatusFilter: string;
  onPaymentStatusChange: (val: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (val: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  onRefresh?: () => void;
  statusOptions: SelectOption[];
  pageSizeOptions: SelectOption[];
}

export function ServiceBookingAdvancedFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  pageSize,
  onPageSizeChange,
  hasActiveFilters,
  onClear,
  onRefresh,
  statusOptions,
  pageSizeOptions,
}: ServiceBookingAdvancedFiltersProps) {
  const { t } = useTranslation("serviceBookingFilters");

  const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
    { value: "", label: t("paymentStatus.all") },
    { value: "not_required", label: t("paymentStatus.notRequired") },
    { value: "pending", label: t("paymentStatus.pending") },
    { value: "paid", label: t("paymentStatus.paid") },
    { value: "failed", label: t("paymentStatus.failed") },
  ];

  const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
    { value: "", label: t("paymentMethod.all") },
    { value: "cod", label: t("paymentMethod.cod") },
    { value: "bank_transfer", label: t("paymentMethod.bankTransfer") },
    { value: "chapa", label: t("paymentMethod.chapa") },
    // add any other methods your API uses
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-secondary">
            {t("header.title")}
          </h2>
          {hasActiveFilters && (
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
              {t("header.active")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium
                         border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              <X size={12} className="sm:w-[14px] sm:h-[14px]" />
              <span className="hidden xs:inline">{t("header.clearAll")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-5 space-y-3 sm:space-y-3">
        {/* Search + Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("search.placeholder")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         outline-none transition text-xs sm:text-sm"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-secondary transition-all duration-200 group flex-shrink-0"
              title={t("search.refresh")}
            >
              <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-secondary group-hover:rotate-180 transition-all duration-300" />
            </button>
          )}
        </div>

        {/* Dropdown filters + page size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-3">
          <CustomSelect
            value={statusFilter}
            onChange={onStatusChange}
            options={statusOptions}
            placeholder={t("status.all")}
            className="w-full"
          />
          <CustomSelect
            value={paymentStatusFilter}
            onChange={onPaymentStatusChange}
            options={PAYMENT_STATUS_OPTIONS}
            placeholder={t("paymentStatus.all")}
            className="w-full"
          />
          <CustomSelect
            value={paymentMethodFilter}
            onChange={onPaymentMethodChange}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder={t("paymentMethod.all")}
            className="w-full"
          />
          <CustomSelect
            value={String(pageSize)}
            onChange={(val) => onPageSizeChange(Number(val))}
            options={pageSizeOptions}
            placeholder={t("pagination.pageSize", { count: 10 })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
