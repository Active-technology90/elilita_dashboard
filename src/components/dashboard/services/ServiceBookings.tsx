import { useMemo, useState, useEffect } from "react";
import { Calendar, Repeat, Settings, X, Home, Store } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceBookings } from "../../../hooks/useServiceBookings";
import { CompanySelector } from "../company-products/CompanySelector";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { ServiceBookingAdvancedFilters } from "./ServiceBookingFilters";
import { ServiceBookingManageModal } from "./ServiceBookingManageModal";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { ServiceBooking } from "../../../types";

/* -------------------- constants -------------------- */
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-purple-50 text-purple-700 border-purple-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-gray-100 text-gray-600 border-gray-200",
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status?.toLowerCase();
  const color =
    STATUS_COLORS[normalized] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {normalized.replace(/_/g, " ")}
    </span>
  );
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];
const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "All Payment Status" },
  { value: "not_required", label: "Not Required" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
];
const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "20", label: "20 / page" },
  { value: "30", label: "30 / page" },
  { value: "50", label: "50 / page" },
];

export default function ServiceBookings() {
  /* -------------------- context & hooks -------------------- */
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );
  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  /* -------------------- filter states -------------------- */
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(
    null,
  );
  const [companyNotes, setCompanyNotes] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  /* -------------------- data fetching -------------------- */
  const filters = {
    status: statusFilter === "all" ? undefined : statusFilter,
    date: dateFilter || undefined,
  };

  const { bookings, loading, updateStatus, getBookingDetail, refetch } =
    useServiceBookings(isServiceCompany ? companySlug : null, filters);

  /* -------------------- derived data & pagination -------------------- */
  const searchedBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const term = search.toLowerCase();
    return bookings.filter(
      (b) =>
        String(b.id).includes(term) ||
        b.customer_name?.toLowerCase().includes(term) ||
        b.offering?.title?.toLowerCase().includes(term) ||
        (b.customer_phone && b.customer_phone.includes(term)),
    );
  }, [bookings, search]);

  // apply payment & any other local filters
  const filteredBookings = useMemo(() => {
    let result = searchedBookings;
    if (paymentStatusFilter) {
      result = result.filter((b) => b.payment_status === paymentStatusFilter);
    }
    if (paymentMethodFilter) {
      result = result.filter((b) => b.payment_method === paymentMethodFilter);
    }
    return result;
  }, [searchedBookings, paymentStatusFilter, paymentMethodFilter]);

  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    dateFilter,
    search,
    paymentStatusFilter,
    paymentMethodFilter,
    pageSize,
  ]);

  /* -------------------- helpers -------------------- */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenBooking = async (bookingId: number) => {
    try {
      const fullBooking = await getBookingDetail(bookingId);
      setSelectedBooking(fullBooking);
      setCompanyNotes(fullBooking.company_notes || "");
      setFinalPrice(fullBooking.final_price || fullBooking.quoted_price || "");
    } catch {
      showToast("error", "Could not load booking details");
    }
  };

  const handleRefreshBooking = async () => {
    if (!selectedBooking) return;
    try {
      const updated = await getBookingDetail(selectedBooking.id);
      setSelectedBooking(updated);
      setCompanyNotes(updated.company_notes || "");
      setFinalPrice(updated.final_price || updated.quoted_price || "");
    } catch {
      showToast("error", "Could not refresh booking");
    }
  };

  const handleStatusUpdate = async (
    booking: ServiceBooking,
    status: ServiceBooking["status"],
  ) => {
    try {
      await updateStatus(booking.id, {
        status,
        company_notes: companyNotes || undefined,
        final_price: finalPrice || undefined,
      });
      showToast("success", `Booking marked as ${status.replace("_", " ")}`);
      await handleRefreshBooking();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to update booking"));
    }
  };

  const clearAllFilters = () => {
    setStatusFilter("all");
    setDateFilter("");
    setSearch("");
    setPaymentStatusFilter("");
    setPaymentMethodFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    !!dateFilter ||
    !!search ||
    !!paymentStatusFilter ||
    !!paymentMethodFilter;

  // Active filter count for mobile badge (includes search term)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (statusFilter !== "all") count++;
    if (dateFilter) count++;
    if (paymentStatusFilter) count++;
    if (paymentMethodFilter) count++;
    return count;
  }, [
    search,
    statusFilter,
    dateFilter,
    paymentStatusFilter,
    paymentMethodFilter,
  ]);

  /* -------------------- early returns -------------------- */
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title="Service Bookings"
        searchPlaceholder="Search service companies..."
        onSelect={(slug, name) => {
          const membership = user?.memberships?.find(
            (m: any) => m.company_slug === slug,
          );
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        Select a service company to view bookings.
      </div>
    );
  }

  /* -------------------- main view -------------------- */
  return (
    <>
      <Toast toast={toast} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 sm:mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Page heading */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-secondary">
                  Bookings
                </h1>

                {/* Company badge */}
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-secondary/15 bg-secondary/5 px-2.5 py-1 text-xs font-semibold text-secondary">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  <span className="truncate max-w-[180px] sm:max-w-[280px]">
                    {companyName}
                  </span>
                </span>
              </div>

              <p className="mt-1.5 text-sm text-gray-500">
                Review, manage, and track incoming customer appointments.
              </p>
            </div>

            {/* Actions */}
            {isSuperAdmin && (
              <div className="flex w-full justify-start sm:w-auto sm:justify-end">
                <button
                  type="button"
                  onClick={clearCompany}
                  aria-label={`Switch company from ${companyName}`}
                  className="
            inline-flex min-h-10 w-auto items-center justify-center gap-2
            rounded-xl border border-gray-200 bg-white
            px-3.5 py-2
            text-sm font-medium text-gray-700
            shadow-sm
            transition-all duration-200
            hover:border-secondary/30
            hover:bg-secondary/5
            hover:text-secondary
            active:scale-[0.98]
            focus:outline-none
            focus:ring-2
            focus:ring-secondary/20
            whitespace-nowrap
          "
                >
                  <Repeat className="h-4 w-4 shrink-0" />
                  <span>Switch Company</span>
                </button>
              </div>
            )}
          </div>

          {/* Header divider */}
          <div className="mt-5 border-b border-gray-100" />
        </div>

        {/* Mobile search bar with filter button and page size (hidden on desktop) */}
        <div className="mb-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by ID, customer or service..."
                loading={loading}
                showMobileFilter={true}
                onMobileFilterClick={() => setShowMobileFilterModal(true)}
                activeFilterCount={activeFilterCount}
              />
            </div>
            <div className="w-24 flex-shrink-0">
              <CustomSelect
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                options={PAGE_SIZE_OPTIONS}
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Desktop filters (hidden on mobile) */}
        <div className="hidden lg:block mb-4">
          <ServiceBookingAdvancedFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            paymentStatusFilter={paymentStatusFilter}
            onPaymentStatusChange={setPaymentStatusFilter}
            paymentMethodFilter={paymentMethodFilter}
            onPaymentMethodChange={setPaymentMethodFilter}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            hasActiveFilters={hasActiveFilters}
            onClear={clearAllFilters}
            onRefresh={refetch}
            statusOptions={STATUS_OPTIONS}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>

        {/* Table / empty states */}
        {loading ? (
          <div className="py-12 text-center text-gray-400">
            Loading bookings...
          </div>
        ) : paginatedBookings.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {bookings.length === 0
                ? "No bookings found."
                : "No matching bookings."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5">
                  <tr className="text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                    <th className="px-4 py-3">Booking Id</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Specialist</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">#{b.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium">
                          {b.customer_name || `Customer #${b.id}`}
                        </p>
                        {b.customer_phone && (
                          <p className="text-xs text-gray-400">
                            {b.customer_phone}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b.assigned_staff ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-secondary font-bold text-[10px] flex items-center justify-center">
                              {b.assigned_staff.name.charAt(0)}
                            </span>
                            <span className="text-xs font-semibold text-gray-800">
                              {b.assigned_staff.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">
                            Any Specialist
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <p className="font-medium text-gray-900">{b.offering?.title || "—"}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 border ${
                            b.location_type === "customer_location"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {b.location_type === "customer_location" ? (
                            <>
                              <Home className="h-2.5 w-2.5" /> At Home
                            </>
                          ) : (
                            <>
                              <Store className="h-2.5 w-2.5" /> In Shop
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {Number(b.quoted_price).toLocaleString()} {b.currency}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-gray-900">
                          {b.scheduled_date}
                        </p>
                        <p className="text-xs text-gray-500">
                          {String(b.scheduled_time).slice(0, 5)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenBooking(b.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-secondary hover:text-secondary hover:bg-secondary/10 text-sm font-medium transition-all"
                        >
                          <Settings className="h-4 w-4" /> Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Booking detail modal */}
        {selectedBooking && (
          <ServiceBookingManageModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onStatusUpdate={handleStatusUpdate}
            companyNotes={companyNotes}
            setCompanyNotes={setCompanyNotes}
            finalPrice={finalPrice}
            setFinalPrice={setFinalPrice}
            allBookings={bookings}
            onRefresh={handleRefreshBooking}
          />
        )}

        {/* Mobile filter bottom sheet (only filter selects, no search) */}
        {showMobileFilterModal && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setShowMobileFilterModal(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-secondary">
                  Filters
                </h3>
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Status
                  </label>
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={STATUS_OPTIONS}
                    placeholder="All Statuses"
                  />
                </div>
                {/* Payment Status filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Payment Status
                  </label>
                  {/* <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="refunded">Refunded</option>
                  </select> */}
                  <CustomSelect
                    value={paymentStatusFilter}
                    onChange={(val) => setPaymentStatusFilter(val)}
                    options={PAYMENT_STATUS_OPTIONS}
                    placeholder="All Payment Status"
                  />
                </div>
                {/* Payment Method filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Payment Method
                  </label>
                  {/* <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  >
                    <option value="">All</option>
                    <option value="chapa">Chapa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cod">COD</option>
                  </select> */}
                  <CustomSelect
                    value={paymentMethodFilter}
                    onChange={(val) => setPaymentMethodFilter(val)}
                    options={[
                      { label: "Chapa", value: "chapa" },
                      { label: "Bank Transfer", value: "bank_transfer" },
                      { label: "COD", value: "cod" },
                    ]}
                    placeholder="All Payment Methods"
                  />
                </div>
                {/* Date filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-2 focus:border-secondary focus:shadow-sm transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        clearAllFilters();
                        setShowMobileFilterModal(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilterModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
