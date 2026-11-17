import { RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CompanyListItem } from "../../../types";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface VendorOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  orderStatusFilter: string;
  onOrderStatusChange: (val: string) => void;
  deliveryStatusFilter: string;
  onDeliveryStatusChange: (val: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (val: string) => void;
  selectedCompanyId: string;
  onCompanyChange: (val: string) => void;
  companies: CompanyListItem[];
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  onClear: () => void;
  hideCompanyFilter?: boolean;
}

export function VendorOrderFilters({
  searchTerm,
  onSearchChange,
  orderStatusFilter,
  onOrderStatusChange,
  deliveryStatusFilter,
  onDeliveryStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  selectedCompanyId,
  onCompanyChange,
  companies,
  pageSize,
  onPageSizeChange,
  onClear,
  onRefresh,
  hideCompanyFilter = false,
}: VendorOrderFiltersProps) {
  const { t, i18n } = useTranslation("companyOrders");

  const orderStatusOptions: SelectOption[] = [
    { value: "", label: t("companyOrders.filters.orderStatus.all") },
    { value: "pending", label: t("companyOrders.filters.orderStatus.pending") },
    {
      value: "contacted",
      label: t("companyOrders.filters.orderStatus.contacted"),
    },
    {
      value: "processing",
      label: t("companyOrders.filters.orderStatus.processing"),
    },
    {
      value: "shipped",
      label: t("companyOrders.filters.orderStatus.shipped"),
    },
    {
      value: "fulfilled",
      label: t("companyOrders.filters.orderStatus.fulfilled"),
    },
    {
      value: "payment_rejected",
      label: t("companyOrders.filters.orderStatus.paymentRejected"),
    },
    {
      value: "cancelled",
      label: t("companyOrders.filters.orderStatus.cancelled"),
    },
  ];

  const deliveryStatusOptions: SelectOption[] = [
    { value: "", label: t("companyOrders.filters.deliveryStatus.all") },
    {
      value: "pending",
      label: t("companyOrders.filters.deliveryStatus.pending"),
    },
    {
      value: "accepted",
      label: t("companyOrders.filters.deliveryStatus.accepted"),
    },
    {
      value: "picked_up",
      label: t("companyOrders.filters.deliveryStatus.pickedUp"),
    },
    {
      value: "out_for_delivery",
      label: t("companyOrders.filters.deliveryStatus.outForDelivery"),
    },
    {
      value: "delivered",
      label: t("companyOrders.filters.deliveryStatus.delivered"),
    },
    {
      value: "failed",
      label: t("companyOrders.filters.deliveryStatus.failed"),
    },
  ];

  const paymentMethodOptions: SelectOption[] = [
    { value: "", label: t("companyOrders.filters.paymentMethod.all") },
    {
      value: "bank_transfer",
      label: t("companyOrders.filters.paymentMethod.bankTransfer"),
    },
    { value: "chapa", label: t("companyOrders.filters.paymentMethod.chapa") },
    { value: "cod", label: t("companyOrders.filters.paymentMethod.cod") },
    {
      value: "telebirr",
      label: t("companyOrders.filters.paymentMethod.telebirr"),
    },
    {
      value: "arifpay",
      label: t("companyOrders.filters.paymentMethod.arifpay"),
    },
  ];

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: t("companyOrders.pageSize.5") },
    { value: "10", label: t("companyOrders.pageSize.10") },
    { value: "15", label: t("companyOrders.pageSize.15") },
    { value: "30", label: t("companyOrders.pageSize.30") },
    { value: "60", label: t("companyOrders.pageSize.60") },
  ];

  const hasFilters = Boolean(
    searchTerm ||
      orderStatusFilter ||
      deliveryStatusFilter ||
      paymentMethodFilter ||
      (!hideCompanyFilter && selectedCompanyId),
  );

  const companyOptions: SelectOption[] = [
    { value: "", label: t("companyOrders.filters.company.all") },
    ...companies.map((company) => ({
      value: String(company.id),
      // Amharic-aware company name (falls back to English `name` if `name_am` missing)
      label:
        i18n.language?.startsWith("am") &&
        (company as any)?.name_am?.trim()
          ? (company as any).name_am
          : company.name,
    })),
  ];

  return (
    <div className="hidden w-full min-w-0 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm lg:block">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5">
        <div className="min-w-[260px] flex-[2_1_360px]">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            debounceMs={0}
            showClearButton
            placeholder={t("companyOrders.filters.searchPlaceholder")}
            className="w-full"
          />
        </div>

        <div className="min-w-[150px] flex-[1_1_160px]">
          <CustomSelect
            value={orderStatusFilter}
            onChange={onOrderStatusChange}
            options={orderStatusOptions}
            placeholder={t("companyOrders.filters.orderStatusPlaceholder")}
            className="w-full"
          />
        </div>

        <div className="min-w-[150px] flex-[1_1_160px]">
          <CustomSelect
            value={deliveryStatusFilter}
            onChange={onDeliveryStatusChange}
            options={deliveryStatusOptions}
            placeholder={t("companyOrders.filters.deliveryStatusPlaceholder")}
            className="w-full"
          />
        </div>

        <div className="min-w-[150px] flex-[1_1_160px]">
          <CustomSelect
            value={paymentMethodFilter}
            onChange={onPaymentMethodChange}
            options={paymentMethodOptions}
            placeholder={t("companyOrders.filters.paymentMethodPlaceholder")}
            className="w-full"
          />
        </div>

        {!hideCompanyFilter && (
          <div className="min-w-[150px] flex-[1_1_180px]">
            <CustomSelect
              value={selectedCompanyId}
              onChange={onCompanyChange}
              options={companyOptions}
              placeholder={t("companyOrders.filters.companyPlaceholder")}
              className="w-full"
            />
          </div>
        )}

        <div className="w-[118px] shrink-0">
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange?.(Number(value))}
            options={pageSizeOptions}
            placeholder={t("companyOrders.pageSize.10")}
            className="w-full"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
              title={t("companyOrders.filters.refreshOrders")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              {t("companyOrders.filters.clear")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}