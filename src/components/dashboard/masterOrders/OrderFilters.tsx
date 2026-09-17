import { Search, X, ChevronDown, RefreshCw } from "lucide-react";
import { CustomSelect, } from "../../ui/CustomSelect";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  // onStatusChange: (val: string) => void;
  deliveryStatusFilter: string;
  // onDeliveryStatusChange: (val: string) => void;
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
  // onStatusChange,
  deliveryStatusFilter,
  // onDeliveryStatusChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  fulfillmentTypeFilter,
  onFulfillmentTypeChange,
  pageSize,
  onPageSizeChange,
  onRefresh,
  onClear,
}: OrderFiltersProps) {
  const hasFilters =
    !!searchTerm ||
    !!statusFilter ||
    !!deliveryStatusFilter ||
    !!paymentStatusFilter ||
    !!fulfillmentTypeFilter;


  const paymentStatusLabels: Record<string, string> = {
    Paid: "Paid",
    "Verifying Receipt": "Verifying Receipt",
    "Pay on Delivery": "Pay on Delivery",
    "Checkout Initiated": "Checkout Initiated",
    "Awaiting Bank Transfer": "Awaiting Bank Transfer",
  };

  const fulfillmentLabels: Record<string, string> = {
    delivery: "Delivery",
    pickup: "Pickup",
  };

  return (
    <div className="relative z-[110] hidden w-full overflow-visible rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)] lg:block">
      {/* Body */}
      <div className="space-y-2 p-2.5">
        {/* Search + Refresh - HIDDEN ON MOBILE (visible only on desktop) */}
        <div className="hidden w-full items-center gap-3 lg:flex">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, phone, or address..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         outline-none transition text-xs sm:text-sm"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center w-full sm:w-10 h-10 rounded-xl border border-gray-200 bg-gray-50
                         hover:bg-white hover:border-secondary transition-all duration-200 group flex-shrink-0"
              title="Refresh orders"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 group-hover:text-secondary group-hover:rotate-180 transition-all duration-300" />
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="relative z-[120] grid grid-cols-4 gap-3">
          {/* Order Status */}
          {/* <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Order Statuses</option>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div> */}

          {/* Delivery Status */}
          {/* <div className="relative">
            <select
              value={deliveryStatusFilter}
              onChange={(e) => onDeliveryStatusChange(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-sm pr-8 outline-none transition"
            >
              <option value="">All Delivery Statuses</option>
              {Object.entries(deliveryStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div> */}

          {/* Payment Status - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block relative z-50">
            <CustomSelect
              value={paymentStatusFilter}
              onChange={onPaymentStatusChange}
              options={[
                { value: "", label: "All Payment Statuses" },
                { value: "Paid", label: "Paid" },
                { value: "Verifying Receipt", label: "Verifying Receipt" },
                { value: "Pay on Delivery", label: "Pay on Delivery" },
                { value: "Checkout Initiated", label: "Checkout Initiated" },
                { value: "Awaiting Bank Transfer", label: "Awaiting Bank Transfer" },
              ]}
              placeholder="All Payment Statuses"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={paymentStatusFilter}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Payment Statuses</option>
              {Object.entries(paymentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Fulfillment Type - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block relative z-50">
            <CustomSelect
              value={fulfillmentTypeFilter}
              onChange={onFulfillmentTypeChange}
              options={[
                { value: "", label: "All Fulfillment Types" },
                { value: "delivery", label: "Delivery" },
                { value: "pickup", label: "Pickup" },
              ]}
              placeholder="All Fulfillment Types"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={fulfillmentTypeFilter}
              onChange={(e) => onFulfillmentTypeChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Fulfillment Types</option>
              {Object.entries(fulfillmentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Page Size - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block relative z-50">
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => onPageSizeChange(Number(val))}
              options={[
                { value: "5", label: "5 / page" },
                { value: "10", label: "10 / page" },
                { value: "15", label: "15 / page" },
                { value: "30", label: "30 / page" },
                { value: "60", label: "60 / page" },
              ]}
              placeholder="5 / page"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={30}>30 / page</option>
              <option value={60}>60 / page</option>
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex min-w-0 items-center">
            {hasFilters ? (
              <button
                type="button"
                onClick={onClear}
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