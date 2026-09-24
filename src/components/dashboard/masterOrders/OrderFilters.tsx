import { RefreshCw, X } from "lucide-react";
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

const paymentOptions: SelectOption[] = [
  { value: "", label: "All payment statuses" },
  { value: "Paid", label: "Paid" },
  { value: "Verifying Receipt", label: "Verifying Receipt" },
  { value: "Pay on Delivery", label: "Pay on Delivery" },
  { value: "Checkout Initiated", label: "Checkout Initiated" },
  { value: "Awaiting Bank Transfer", label: "Awaiting Bank Transfer" },
];

const fulfillmentOptions: SelectOption[] = [
  { value: "", label: "All fulfillment types" },
  { value: "delivery", label: "Delivery" },
  { value: "pickup", label: "Pickup" },
];

const pageSizeOptions: SelectOption[] = [
  { value: "5", label: "5 / page" },
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "30", label: "30 / page" },
  { value: "60", label: "60 / page" },
];

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
          placeholder="Search by order ID, customer, phone, or address..."
          className="w-full"
        />

        <CustomSelect
          value={paymentStatusFilter}
          onChange={onPaymentStatusChange}
          options={paymentOptions}
          placeholder="Payment status"
          className="w-full"
        />

        <CustomSelect
          value={fulfillmentTypeFilter}
          onChange={onFulfillmentTypeChange}
          options={fulfillmentOptions}
          placeholder="Fulfillment"
          className="w-full"
        />

        <CustomSelect
          value={String(pageSize)}
          onChange={(value) => onPageSizeChange(Number(value))}
          options={pageSizeOptions}
          placeholder="10 / page"
          className="w-full"
        />

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
              title="Refresh orders"
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
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
