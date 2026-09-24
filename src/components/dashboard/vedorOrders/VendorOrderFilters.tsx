import { RefreshCw, X } from "lucide-react";
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

const orderStatusOptions: SelectOption[] = [
  { value: "", label: "All order statuses" },
  { value: "pending", label: "Pending" },
  { value: "contacted", label: "Confirmed" },
  { value: "processing", label: "Prepared" },
  { value: "shipped", label: "In Transit" },
  { value: "fulfilled", label: "Delivered" },
  { value: "payment_rejected", label: "Payment Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const deliveryStatusOptions: SelectOption[] = [
  { value: "", label: "All delivery statuses" },
  { value: "pending", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "picked_up", label: "Picked Up" },
  { value: "out_for_delivery", label: "In Transit" },
  { value: "delivered", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const paymentMethodOptions: SelectOption[] = [
  { value: "", label: "All payment methods" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "chapa", label: "Chapa" },
  { value: "cod", label: "COD" },
];

const pageSizeOptions: SelectOption[] = [
  { value: "5", label: "5 / page" },
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "30", label: "30 / page" },
  { value: "60", label: "60 / page" },
];

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
  const hasFilters = Boolean(
    searchTerm ||
      orderStatusFilter ||
      deliveryStatusFilter ||
      paymentMethodFilter ||
      (!hideCompanyFilter && selectedCompanyId),
  );

  const companyOptions: SelectOption[] = [
    { value: "", label: "All companies" },
    ...companies.map((company) => ({
      value: String(company.id),
      label: company.name,
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
            placeholder="Search by order ID, customer, or company..."
            className="w-full"
          />
        </div>

        <div className="min-w-[150px] flex-[1_1_160px]">
          <CustomSelect
            value={orderStatusFilter}
            onChange={onOrderStatusChange}
            options={orderStatusOptions}
            placeholder="Order status"
            className="w-full"
          />
        </div>

        <div className="min-w-[150px] flex-[1_1_160px]">
          <CustomSelect
            value={deliveryStatusFilter}
            onChange={onDeliveryStatusChange}
            options={deliveryStatusOptions}
            placeholder="Delivery status"
            className="w-full"
          />
        </div>

        <div className="min-w-[150px] flex-[1_1_160px]">
          <CustomSelect
            value={paymentMethodFilter}
            onChange={onPaymentMethodChange}
            options={paymentMethodOptions}
            placeholder="Payment method"
            className="w-full"
          />
        </div>

        {!hideCompanyFilter && (
          <div className="min-w-[150px] flex-[1_1_180px]">
            <CustomSelect
              value={selectedCompanyId}
              onChange={onCompanyChange}
              options={companyOptions}
              placeholder="Company"
              className="w-full"
            />
          </div>
        )}

        <div className="w-[118px] shrink-0">
          <CustomSelect
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange?.(Number(value))}
            options={pageSizeOptions}
            placeholder="10 / page"
            className="w-full"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
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
