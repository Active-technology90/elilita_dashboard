
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Calendar, Repeat, Settings, X } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceBookings } from "../../../hooks/useServiceBookings";
import { CompanySelector } from "../company-products/CompanySelector";
import { Toast } from "../../ui/Toast";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import PageHeader from "../../ui/PageHeader";
import { DataTable, type Column } from "../../ui/DataTable";
import { ServiceBookingAdvancedFilters } from "./ServiceBookingFilters";
import { ServiceBookingManageModal } from "./ServiceBookingManageModal";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { ServiceBooking } from "../../../types";
import { formatDate, formatTime } from "../../../utils/dateFormatter";

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
  const { t } = useTranslation("serviceBookings");
  const normalized = status?.toLowerCase();
  const color =
    STATUS_COLORS[normalized] || "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {t(`status.${normalized}`, {
        defaultValue: normalized.replace(/_/g, " "),
      })}
    </span>
  );
};

const PaymentStatusBadge = ({ booking }: { booking: ServiceBooking }) => {
  const { t } = useTranslation("serviceBookings");
  const method = booking.payment_method?.toLowerCase();
  const status = booking.payment_status?.toLowerCase();
  const receipt = (booking as any)?.receipt;

  if (method === "bank_transfer") {
    if (status === "paid" || receipt?.status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          {t("paymentStatus.paid")}
        </span>
      );
    }

    if (receipt?.status === "rejected" || status === "payment_failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-50 text-red-700 border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          {t("paymentStatus.receiptRejected")}
        </span>
      );
    }

    if (receipt?.status === "pending" || Boolean(receipt)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-300 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          {t("paymentStatus.verifyReceipt")}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        {t("paymentStatus.awaitingReceipt")}
      </span>
    );
  }

  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        {t("paymentStatus.paid")}
      </span>
    );
  }

  if (status === "payment_failed" || status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-50 text-red-700 border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
        {t("paymentStatus.failed")}
      </span>
    );
  }

  if (method === "cod" || status === "not_required") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        {t("paymentStatus.payAtVenue")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
      {t("paymentStatus.pending")}
    </span>
  );
};

const PaymentMethodBadge = ({ method }: { method?: string }) => {
  const { t } = useTranslation("serviceBookings");
  const norm = method?.toLowerCase() || "—";

  const labelMap: Record<string, string> = {
    bank_transfer: t("paymentMethods.bankTransfer"),
    telebirr: t("paymentMethods.telebirr"),
    chapa: t("paymentMethods.chapa"),
    arifpay: t("paymentMethods.arifpay"),
    cod: t("paymentMethods.cashVenue"),
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
      {labelMap[norm] || norm.replace(/_/g, " ")}
    </span>
  );
};

export default function ServiceBookings() {
  const { t, i18n } = useTranslation("serviceBookings");

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

  /* -------------------- translated select options -------------------- */
  const STATUS_OPTIONS: SelectOption[] = [
    { value: "all", label: t("filters.allStatuses") },
    { value: "pending", label: t("status.pending") },
    { value: "confirmed", label: t("status.confirmed") },
    { value: "in_progress", label: t("status.inProgress") },
    { value: "completed", label: t("status.completed") },
    { value: "cancelled", label: t("status.cancelled") },
    { value: "no_show", label: t("status.noShow") },
  ];

  const PAYMENT_STATUS_OPTIONS: SelectOption[] = [
    { value: "", label: t("filters.allPaymentStatuses") },
    { value: "not_required", label: t("paymentStatus.notRequired") },
    { value: "pending", label: t("paymentStatus.pending") },
    { value: "paid", label: t("paymentStatus.paid") },
    { value: "failed", label: t("paymentStatus.failed") },
  ];

  const PAGE_SIZE_OPTIONS: SelectOption[] = [
    { value: "10", label: t("pagination.perPage", { count: 10 }) },
    { value: "15", label: t("pagination.perPage", { count: 15 }) },
    { value: "20", label: t("pagination.perPage", { count: 20 }) },
    { value: "30", label: t("pagination.perPage", { count: 30 }) },
    { value: "50", label: t("pagination.perPage", { count: 50 }) },
  ];

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
      const initialFp =
        fullBooking.final_price && Number(fullBooking.final_price) > 0
          ? fullBooking.final_price
          : Number(fullBooking.quoted_price || 0) > 0
            ? fullBooking.quoted_price
            : "";
      setFinalPrice(initialFp);
    } catch {
      showToast("error", t("messages.loadBookingFailed"));
    }
  };

  const handleRefreshBooking = async () => {
    if (!selectedBooking) return;

    try {
      const updated = await getBookingDetail(selectedBooking.id);
      setSelectedBooking(updated);
      setCompanyNotes(updated.company_notes || "");
      const refreshedFp =
        updated.final_price && Number(updated.final_price) > 0
          ? updated.final_price
          : Number(updated.quoted_price || 0) > 0
            ? updated.quoted_price
            : "";
      setFinalPrice(refreshedFp);
      await refetch();
    } catch {
      showToast("error", t("messages.refreshBookingFailed"));
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

      showToast(
        "success",
        t("messages.bookingMarkedAs", {
          status: t(`status.${status}`, {
            defaultValue: status.replace(/_/g, " "),
          }),
        }),
      );

      await handleRefreshBooking();
    } catch (err: any) {
      showToast(
        "error",
        extractErrorMessage(err, t("messages.updateBookingFailed")),
      );
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

  const bookingColumns: Column<ServiceBooking>[] = [
    {
      key: "id",
      header: t("table.bookingId"),
      textMode: "nowrap",
      render: (booking) => (
        <span className="font-semibold text-gray-900">#{booking.id}</span>
      ),
    },
    {
      key: "customer",
      header: t("table.customer"),
      render: (booking) => (
        <div>
          <p className="font-medium text-gray-900">
            {booking.customer_name || t("table.customerNumber", { id: booking.id })}
          </p>
          {booking.customer_phone && (
            <p className="mt-0.5 text-xs text-gray-500">
              {booking.customer_phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "specialist",
      header: t("table.specialist"),
      render: (booking) =>
        booking.assigned_staff ? (
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-[10px] font-semibold text-secondary">
              {booking.assigned_staff.name.charAt(0)}
            </span>
            <span className="text-sm font-medium text-gray-800">
              {booking.assigned_staff.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">
            {t("table.anySpecialist")}
          </span>
        ),
    },
    {
      key: "service",
      header: t("table.service"),
      render: (booking) => booking.offering?.title || "—",
    },
    {
      key: "price",
      header: t("table.price"),
      textMode: "nowrap",
      render: (booking) => {
        const isInquiry = (booking.offering as any)?.booking_mode === "inquiry";
        const finalNum = Number(booking.final_price || 0);
        const quotedNum = Number(booking.quoted_price || 0);

        if (isInquiry) {
          if (finalNum > 0) {
            return (
              <span className="font-semibold text-gray-900">
                {finalNum.toLocaleString()} {booking.currency}
              </span>
            );
          }
          if (quotedNum > 0) {
            return (
              <span className="font-medium text-gray-600">
                Est. {quotedNum.toLocaleString()} {booking.currency}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Pending Quote
            </span>
          );
        }

        const effective = finalNum > 0 ? finalNum : quotedNum;
        return (
          <span className="font-medium text-gray-800">
            {effective.toLocaleString()} {booking.currency}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t("table.status"),
      textMode: "nowrap",
      render: (booking) => <StatusBadge status={booking.status} />,
    },
    {
      key: "payment_method",
      header: t("table.paymentMethod"),
      textMode: "nowrap",
      render: (booking) => (
        <PaymentMethodBadge method={booking.payment_method} />
      ),
    },
    {
      key: "payment_status",
      header: t("table.paymentStatus"),
      textMode: "nowrap",
      render: (booking) => <PaymentStatusBadge booking={booking} />,
    },

{
  key: "schedule",
  header: t("table.dateTime"),
  textMode: "nowrap",
  render: (booking) => (
    <div>
      <p className="font-medium text-gray-900">
        {formatDate(booking.scheduled_date, i18n.language)}
      </p>
      <p className="text-xs text-gray-500">
        {formatTime(
          `${booking.scheduled_date}T${String(booking.scheduled_time).slice(0, 8)}`,
          i18n.language,
        )}
      </p>
    </div>
  ),
},

    {
      key: "actions",
      header: t("table.actions"),
      className: "text-right",
      textMode: "nowrap",
      render: (booking) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleOpenBooking(booking.id)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-secondary transition hover:bg-secondary/5"
          >
            <Settings className="h-4 w-4" />
            {t("table.manage")}
          </button>
        </div>
      ),
    },
  ];

  /* -------------------- early returns -------------------- */
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title={t("page.title")}
        searchPlaceholder={t("companySelector.searchPlaceholder")}
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={t("page.title")}
          description={t("page.serviceCompanyOnly")}
          icon={Calendar}
          badge={
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 sm:text-xs">
              {t("page.serviceCompanyRequired")}
            </span>
          }
          actions={
            isSuperAdmin ? (
              <button
                type="button"
                onClick={clearCompany}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Repeat className="h-4 w-4" />
                {t("page.switchCompany")}
              </button>
            ) : undefined
          }
          className="mb-6"
        />

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("page.notServiceCompany", {
                  company: companyName || t("page.selectedCompany"),
                })}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t("page.serviceCompanyDisabled")}{" "}
                <span className="font-medium text-gray-800">
                  {t("page.serviceBusinessType")}
                </span>{" "}
                {t("page.toContinue")}
              </p>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                >
                  <Repeat className="h-4 w-4" />
                  {t("page.chooseServiceCompany")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- main view -------------------- */
  return (
    <>
      <Toast toast={toast} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={companyName || undefined}
          description={t("page.description")}
          icon={Calendar}
          eyebrow={t("page.title")}
          actions={
            isSuperAdmin ? (
              <button
                type="button"
                onClick={clearCompany}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Repeat className="h-4 w-4" />
                {t("page.switchCompany")}
              </button>
            ) : undefined
          }
          actionMobile={
            isSuperAdmin ? (
              <button
                type="button"
                onClick={clearCompany}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Repeat className="h-4 w-4" />
              </button>
            ) : undefined
          }
          className="mb-6"
        />

        {/* Mobile search bar with filter button and page size (hidden on desktop) */}
        <div className="mb-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("search.placeholder")}
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

        <DataTable
          data={paginatedBookings}
          columns={bookingColumns}
          loading={loading}
          loadingRows={5}
          emptyMessage={
            bookings.length === 0
              ? t("table.noBookingsFound")
              : t("table.noMatchingBookings")
          }
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          stickyColumns={2}
        />

        {/* Booking detail modal */}
        {selectedBooking && (
          <ServiceBookingManageModal
            booking={selectedBooking}
            onClose={() => {
              setSelectedBooking(null);
              void refetch();
            }}
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
                  {t("filters.title")}
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
                    {t("filters.status")}
                  </label>
                  <CustomSelect
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={STATUS_OPTIONS}
                    placeholder={t("filters.allStatuses")}
                  />
                </div>

                {/* Payment Status filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    {t("filters.paymentStatus")}
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
                    placeholder={t("filters.allPaymentStatuses")}
                  />
                </div>

                {/* Payment Method filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    {t("filters.paymentMethod")}
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
                      {
                        label: t("paymentMethods.bankTransfer"),
                        value: "bank_transfer",
                      },
                      { label: "COD", value: "cod" },
                    ]}
                    placeholder={t("filters.allPaymentMethods")}
                  />
                </div>

                {/* Date filter */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    {t("filters.date")}
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
                      {t("filters.clearAll")}
                    </button>
                  )}

                  <button
                    onClick={() => setShowMobileFilterModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                  >
                    {t("filters.apply")}
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
