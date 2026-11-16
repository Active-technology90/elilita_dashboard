import { RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  deliveryStatusFilter: string;
  paymentStatusFilter: string;
  onPaymentStatusChange: (val: string) => void;
  fulfillmentTypeFilter: string;
  onFulfillmentTypeChange: (val: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onRefresh?: () => void;
  onClear: () => void;
  showMobile?: boolean;
  onToggleMobile?: () => void;
}

export function OrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  deliveryStatusFilter,
  paymentStatusFilter,
  onPaymentStatusChange,
  fulfillmentTypeFilter,
  onFulfillmentTypeChange,
  pageSize,
  onPageSizeChange,
  onRefresh,
  onClear,
}: OrderFiltersProps) {
  const { t } = useTranslation("master");

  const paymentOptions: SelectOption[] = [
    { value: "", label: t("orders.paymentStatus.allLower") },
    { value: "Paid", label: t("orders.paymentStatus.paid") },
    {
      value: "Verifying Receipt",
      label: t("orders.paymentStatus.verifyingReceipt"),
    },
    {
      value: "Pay on Delivery",
      label: t("orders.paymentStatus.payOnDelivery"),
    },
    {
      value: "Checkout Initiated",
      label: t("orders.paymentStatus.checkoutInitiated"),
    },
    {
      value: "Awaiting Bank Transfer",
      label: t("orders.paymentStatus.awaitingBankTransfer"),
    },
  ];

  const fulfillmentOptions: SelectOption[] = [
    { value: "", label: t("orders.fulfillment.allLower") },
    { value: "delivery", label: t("orders.fulfillment.delivery") },
    { value: "pickup", label: t("orders.fulfillment.pickup") },
  ];

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: t("orders.pageSize.5") },
    { value: "10", label: t("orders.pageSize.10") },
    { value: "15", label: t("orders.pageSize.15") },
    { value: "30", label: t("orders.pageSize.30") },
    { value: "60", label: t("orders.pageSize.60") },
  ];

  const hasFilters = Boolean(
    searchTerm ||
      statusFilter ||
      deliveryStatusFilter ||
      paymentStatusFilter ||
      fulfillmentTypeFilter,
  );

  return (
    <div className="hidden w-full rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm lg:block">
      <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_190px_190px_118px_auto]">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          debounceMs={0}
          showClearButton
          placeholder={t("orders.searchPlaceholder")}
          className="w-full"
        />

        <CustomSelect
          value={paymentStatusFilter}
          onChange={onPaymentStatusChange}
          options={paymentOptions}
          placeholder={t("orders.filters.paymentStatusPlaceholder")}
          className="w-full"
        />

        <CustomSelect
          value={fulfillmentTypeFilter}
          onChange={onFulfillmentTypeChange}
          options={fulfillmentOptions}
          placeholder={t("orders.filters.fulfillmentPlaceholder")}
          className="w-full"
        />

        <CustomSelect
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          options={pageSizeOptions}
          placeholder={t("orders.pageSize.10")}
          className="w-full"
        />

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
              title={t("orders.filters.refreshOrders")}
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
              {t("orders.filters.clear")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}