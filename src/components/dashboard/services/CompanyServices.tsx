import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Repeat,
  Search,
  RefreshCw,
  Clock,
  Calendar,
  Tag,
  Activity,
  CheckCircle,
  XCircle,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useServiceOfferings } from "../../../hooks/useServiceOfferings";
import { CompanySelector } from "../company-products/CompanySelector";
import { ServiceOfferingModal } from "./ServiceOfferingModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import PageHeader from "../../ui/PageHeader";
import type { ServiceOffering } from "../../../types";

/* ---------- custom debounce hook ---------- */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const BOOKING_LABELS: Record<string, string> = {
  direct: "Direct",
  inquiry: "Inquiry",
  contact: "Contact",
};

const PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 / page" },
  { value: "15", label: "15 / page" },
  { value: "20", label: "20 / page" },
  { value: "30", label: "30 / page" },
  { value: "50", label: "50 / page" },
  { value: "75", label: "75 / page" },
  { value: "100", label: "100 / page" },
];

/* ---------- small presentational components ---------- */
function ServiceImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 ${className || ""}`}
      >
        <ImageIcon className="h-6 w-6 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={`object-cover rounded-xl border border-gray-200 ${className || ""} ${imgClassName || ""}`}
    />
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {isActive ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function BookingBadge({ mode }: { mode: string }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">
      {BOOKING_LABELS[mode] || mode}
    </span>
  );
}

function ServiceTableSkeleton() {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
            <th className="pb-3 pr-4">Image</th>
            <th className="pb-3 pr-4">Service</th>
            <th className="pb-3 pr-4">Price</th>
            <th className="pb-3 pr-4">Duration</th>
            <th className="pb-3 pr-4">Booking</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3 pr-4">Bookings</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="py-3 pr-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-4 w-12 bg-gray-200 rounded" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </td>
              <td className="py-3 pr-4">
                <div className="h-4 w-8 bg-gray-200 rounded" />
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="md:hidden space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CompanyServices() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  // Filter only service-type companies for super admin selector
  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );

  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  const {
    offerings,
    loading,
    error,
    create,
    update,
    remove,
    refetch,
    getDetail,
  } = useServiceOfferings(isServiceCompany ? companySlug : null);

  // ---------- search with debounce ----------
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOfferings = useMemo(() => {
    if (!debouncedSearch.trim()) return offerings;
    const term = debouncedSearch.toLowerCase();
    return offerings.filter(
      (o) =>
        o.title.toLowerCase().includes(term) ||
        (o.service_category && o.service_category.toLowerCase().includes(term)),
    );
  }, [offerings, debouncedSearch]);

  const totalItems = filteredOfferings.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedOfferings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, currentPage, pageSize]);

  // reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, pageSize]);

  // handle cases where current page exceeds valid range (e.g., after deletion or search)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // ---------- modal & toast ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOffering | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffering | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const handleSave = async (
    data: Partial<ServiceOffering>,
    existingId?: number,
  ): Promise<ServiceOffering> => {
    const id = existingId ?? editing?.id;
    try {
      if (id) {
        const result = await update(id, data);
        showToast("success", "Service updated");
        return result;
      }
      const result = await create(data);
      showToast("success", "Service created");
      return result;
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Save failed");
      throw err;
    } finally {
      refetch();
    }
  };

  const handleEdit = async (offering: ServiceOffering) => {
    try {
      const fullOffering = await getDetail(offering.id);
      setEditing(fullOffering);
      setModalOpen(true);
    } catch {
      showToast("error", "Failed to load service details");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("success", "Service deleted");
      setDeleteTarget(null);
      refetch();
    } catch {
      showToast("error", "Delete failed");
      setDeleteTarget(null);
    }
  };

  // ---------- early returns ----------
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title="Service Management"
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

  if (!companySlug) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Wrench className="h-12 w-12 text-gray-300 mb-4" />
        <p>Select a service company to manage offerings.</p>
      </div>
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Service Management"
          description="This area is available only to companies configured as service businesses."
          icon={AlertCircle}
          badge={
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 sm:text-xs">
              Service company required
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
                Switch company
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
                {companyName || "The selected company"} is not a service company
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Service offerings, staff schedules, availability, and bookings are
                disabled for this company. Select a company whose business type is
                <span className="font-medium text-gray-800"> service</span> to continue.
              </p>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                >
                  <Repeat className="h-4 w-4" />
                  Choose a service company
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- main content ----------
  return (
    <>
      <Toast toast={toast} />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ServiceOfferingModal
        key={editing?.id ?? "new"}
        isOpen={modalOpen}
        offering={editing}
        companySlug={companySlug}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          refetch();
        }}
        onSave={handleSave}
        onSaved={refetch}
        onShowToast={showToast}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
          <PageHeader
            title="My Services"
            description="Manage service offerings, pricing, duration, and booking options."
            icon={Wrench}
            eyebrow={companyName || undefined}
            actions={
              <>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={clearCompany}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <Repeat className="h-4 w-4" />
                    Switch company
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add service
                </button>
              </>
            }
            className="mb-6"
          />

          {/* Search + Refresh & Page Size */}
          <div className="mb-4 flex w-full flex-row items-center justify-between gap-2.5">
            {/* Search + Refresh */}
            <div className="flex min-w-0 flex-1 flex-row items-center gap-2">
              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search
                  className="
          pointer-events-none absolute left-3 top-1/2
          h-4 w-4 -translate-y-1/2
          text-gray-400
        "
                />

                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search services"
                  className="
          h-10 w-full min-w-0
          rounded-xl
          border border-gray-200
          bg-gray-50
          pl-9 pr-3
          text-sm text-gray-900
          placeholder:text-gray-400
          outline-none
          transition-all duration-200
          hover:border-gray-300
          focus:border-secondary
          focus:bg-white
          focus:ring-2
          focus:ring-secondary/10
        "
                />
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={refetch}
                disabled={loading}
                title="Refresh services"
                aria-label="Refresh services"
                className="
        group
        inline-flex h-10 w-10
        shrink-0
        items-center justify-center
        rounded-xl
        border border-gray-200
        bg-gray-50
        text-gray-500
        transition-all duration-200
        hover:border-secondary/30
        hover:bg-secondary/5
        hover:text-secondary
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-60
        focus:outline-none
        focus:ring-2
        focus:ring-secondary/20
      "
              >
                <RefreshCw
                  className={`
          h-4 w-4
          transition-transform duration-300
          ${loading ? "animate-spin" : "group-hover:rotate-180"}
        `}
                />
              </button>
            </div>

            {/* Results + Page Size */}
            <div className="flex shrink-0 flex-row items-center gap-2">
              {/* Service Count */}
              <span
                className="
        hidden
        whitespace-nowrap
        text-xs
        font-medium
        text-gray-400
        sm:inline-flex
      "
              >
                {totalItems} {totalItems === 1 ? "service" : "services"}
              </span>

              {/* Page Size */}
              <div className="w-[82px] sm:w-24 lg:w-28">
                <CustomSelect
                  value={String(pageSize)}
                  onChange={(val) => setPageSize(Number(val))}
                  options={PAGE_SIZE_OPTIONS}
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Unable to load services</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <button
                  onClick={refetch}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Content: loading, empty, or data */}
          {loading ? (
            <>
              <ServiceTableSkeleton />
              <ServiceCardSkeleton />
            </>
          ) : paginatedOfferings.length === 0 ? (
            offerings.length === 0 ? (
              <div className="py-16 text-center">
                <Wrench className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No services yet
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Create your first service offering to get started.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-[#5B4592] transition"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </button>
              </div>
            ) : (
              <div className="py-16 text-center">
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No matching services
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Try another search term or clear your search.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="mt-4 text-sm font-semibold text-secondary hover:underline"
                >
                  Clear Search
                </button>
              </div>
            )
          ) : (
            <>
              {/* ===== DESKTOP TABLE (hidden on mobile) ===== */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                      <th className="pb-3 pr-4">Image</th>
                      <th className="pb-3 pr-4">Service</th>
                      <th className="pb-3 pr-4">Price</th>
                      <th className="pb-3 pr-4">Duration</th>
                      <th className="pb-3 pr-4">Booking</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Bookings</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOfferings.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <td className="py-3 pr-4">
                          <ServiceImage
                            src={o.primary_image}
                            alt={o.title}
                            className="w-12 h-12"
                          />
                        </td>
                        <td className="py-3 pr-4 min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {o.title}
                          </p>
                          {o.service_category && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">
                              {o.service_category}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">
                          {o.pricing_type === "custom"
                            ? "Quote"
                            : `${Number(o.price || 0).toLocaleString()} ${o.currency}`}
                        </td>
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                          {o.duration_minutes
                            ? `${o.duration_minutes} min`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <BookingBadge mode={o.booking_mode} />
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge isActive={o.is_active} />
                        </td>
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                          {o.total_bookings ?? 0}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(o)}
                              className="p-1.5 text-secondary hover:text-purple-700 rounded-lg hover:bg-purple-50"
                              title="Edit service"
                              aria-label={`Edit ${o.title}`}
                              type="button"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(o)}
                              className="p-1.5 text-red-700 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete service"
                              aria-label={`Delete ${o.title}`}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===== MOBILE CARDS (visible only on small screens) ===== */}
              <div className="md:hidden space-y-3">
                {paginatedOfferings.map((o) => (
                  <div
                    key={o.id}
                    className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <ServiceImage
                          src={o.primary_image}
                          alt={o.title}
                          className="w-16 h-16"
                        />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {o.title}
                            </h3>
                            {o.service_category && (
                              <p className="text-xs text-gray-400 truncate">
                                {o.service_category}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEdit(o)}
                              className="p-1.5 rounded-lg text-secondary hover:bg-purple-50"
                              title="Edit service"
                              aria-label={`Edit ${o.title}`}
                              type="button"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(o)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              title="Delete service"
                              aria-label={`Delete ${o.title}`}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
                            <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">
                              {o.pricing_type === "custom"
                                ? "Quote"
                                : `${Number(o.price || 0).toLocaleString()} ${o.currency}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
                            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">
                              {o.duration_minutes
                                ? `${o.duration_minutes} min`
                                : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <BookingBadge mode={o.booking_mode} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge isActive={o.is_active} />
                          </div>
                        </div>

                        {/* Bookings count */}
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <Activity className="h-3 w-3" />
                          <span>{o.total_bookings ?? 0} bookings</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination (same for both layouts) */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    {Math.min((currentPage - 1) * pageSize + 1, totalItems)} –{" "}
                    {Math.min(currentPage * pageSize, totalItems)} of{" "}
                    {totalItems} services
                  </p>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
      </div>
    </>
  );
}
