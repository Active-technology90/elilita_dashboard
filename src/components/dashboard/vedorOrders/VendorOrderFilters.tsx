import { Search, X, ChevronDown, RefreshCw } from "lucide-react";
import type { CompanyListItem } from "../../../types";
import { CustomSelect } from "../../ui/CustomSelect";

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
  const hasFilters =
    !!searchTerm ||
    !!orderStatusFilter ||
    !!deliveryStatusFilter ||
    !!paymentMethodFilter ||
    (!!selectedCompanyId && !hideCompanyFilter);

  const ORDER_STATUS_LABELS: Record<string, string> = {
    contacted: "Confirmed",

    processing: "Prepared",
    shipped: "In Transit",
    fulfilled: "Delivered",

    pending: "Assigned",
    out_for_delivery: "In Transit",
    delivered: "Completed",
  };
  return (
    <>
      {/* Mobile Toggle Button - REMOVED (now using floating button in parent) */}

      {/* Filters Container - Hidden on mobile, visible on desktop */}
      <div className="relative z-[110] hidden w-full overflow-visible rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)] lg:block">
        {/* Header – only title & utility buttons */}
        <div className="flex items-center justify-between border-b border-secondary/10 px-3 py-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
            {hasFilters && (
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium
                           border border-red-200 text-red-600 hover:bg-red-50 transition"
              >
                <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="hidden xs:inline">Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Body – search + filters + page size inline */}
        <div className="space-y-2 p-2.5">
        {/* Search with Refresh Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or company..."
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

        {/* Filters + Page Size – all in one grid row */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5 xl:gap-3">
          {/* Order Status - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block">
            <CustomSelect
              value={orderStatusFilter}
              onChange={onOrderStatusChange}
              options={[
                { value: "", label: "All Order Status" },
                { value: "pending", label: "Pending" },
                { value: "contacted", label: ORDER_STATUS_LABELS.contacted },
                { value: "processing", label: ORDER_STATUS_LABELS.processing },
                { value: "fulfilled", label: ORDER_STATUS_LABELS.fulfilled },
                { value: "shipped", label: ORDER_STATUS_LABELS.shipped },
                { value: "payment_rejected", label: "Payment Rejected" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              placeholder="All Order Status"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={orderStatusFilter}
              onChange={(e) => onOrderStatusChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">{ORDER_STATUS_LABELS.contacted}</option>
              <option value="processing">{ORDER_STATUS_LABELS.processing}</option>
              <option value="fulfilled">{ORDER_STATUS_LABELS.fulfilled}</option>
              <option value="shipped">{ORDER_STATUS_LABELS.shipped}</option>
              <option value="payment_rejected">Payment Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Delivery Status - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block">
            <CustomSelect
              value={deliveryStatusFilter}
              onChange={onDeliveryStatusChange}
              options={[
                { value: "", label: "All Delivery Status" },
                { value: "pending", label: ORDER_STATUS_LABELS.pending },
                { value: "accepted", label: "Accepted" },
                { value: "picked_up", label: "Picked Up" },
                { value: "out_for_delivery", label: ORDER_STATUS_LABELS.out_for_delivery },
                { value: "delivered", label: ORDER_STATUS_LABELS.delivered },
                { value: "failed", label: "Failed" },
              ]}
              placeholder="All Delivery Status"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={deliveryStatusFilter}
              onChange={(e) => onDeliveryStatusChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Delivery Status</option>
              <option value="pending">{ORDER_STATUS_LABELS.pending}</option>
              <option value="accepted">Accepted</option>
              <option value="picked_up">Picked Up</option>
              <option value="out_for_delivery">{ORDER_STATUS_LABELS.out_for_delivery}</option>
              <option value="delivered">{ORDER_STATUS_LABELS.delivered}</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Payment Method - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block">
            <CustomSelect
              value={paymentMethodFilter}
              onChange={onPaymentMethodChange}
              options={[
                { value: "", label: "All Payment Method" },
                { value: "bank_transfer", label: "Bank Transfer" },
                { value: "chapa", label: "Chapa" },
                { value: "cod", label: "COD" },
              ]}
              placeholder="All Payment Method"
              className="w-full"
            />
          </div>
          <div className="md:hidden relative">
            <select
              value={paymentMethodFilter}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
            >
              <option value="">All Payment Method</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="chapa">Chapa</option>
              <option value="cod">COD</option>
            </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Company (conditional) - Desktop uses CustomSelect, Mobile uses native select */}
          {!hideCompanyFilter && (
            <>
              <div className="hidden md:block">
                <CustomSelect
                  value={selectedCompanyId}
                  onChange={onCompanyChange}
                  options={[
                    { value: "", label: "All Companies" },
                    ...companies.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    })),
                  ]}
                  placeholder="All Companies"
                  className="w-full"
                />
              </div>
              <div className="md:hidden relative">
              <select
                value={selectedCompanyId}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="w-full appearance-none px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 bg-gray-50
                           focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20
                           text-xs sm:text-sm pr-6 sm:pr-8 outline-none transition"
              >
                <option value=""> All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 pointer-events-none" />
            </div>

            </>
          )}

          {/* Page Size - Desktop uses CustomSelect, Mobile uses native select */}
          <div className="hidden md:block">
            <CustomSelect
              value={String(pageSize)}
              onChange={(val) => onPageSizeChange?.(Number(val))}
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
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
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
          </div>
        </div>
      </div>
    </>
  );
}
