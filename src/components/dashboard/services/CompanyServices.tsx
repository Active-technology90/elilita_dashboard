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
  Copy,
  Eye,
  Sparkles,
  X,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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

function StatusBadge({
  isActive,
  onToggle,
  disabled = false,
}: {
  isActive: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("companyServices");

  return (
    <button
      type="button"
      disabled={disabled || !onToggle}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${
        isActive
          ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200/60"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
      } ${!onToggle ? "cursor-default" : "cursor-pointer hover:shadow-xs active:scale-95"}`}
      title={
        onToggle
          ? isActive
            ? t("statusBadge.deactivateHint")
            : t("statusBadge.activateHint")
          : undefined
      }
    >
      {isActive ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span>
        {isActive ? t("statusBadge.active") : t("statusBadge.inactive")}
      </span>
    </button>
  );
}

function BookingBadge({ mode }: { mode: string }) {
  const { t } = useTranslation("companyServices");
  const bookingLabels: Record<string, string> = {
    direct: t("bookingMode.direct"),
    inquiry: t("bookingMode.inquiry"),
    contact: t("bookingMode.contact"),
  };
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">
      {bookingLabels[mode] || mode}
    </span>
  );
}

function ServicePreviewModal({
  offering,
  onClose,
  onEdit,
}: {
  offering: ServiceOffering | null;
  onClose: () => void;
  onEdit: (offering: ServiceOffering) => void;
}) {
  const { t } = useTranslation("companyServices");

  if (!offering) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("preview.ariaLabel")}
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-secondary">
              <Eye className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {t("preview.title")}
              </h3>
              <p className="text-xs text-gray-400">
                {t("preview.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="flex items-start gap-4">
            <ServiceImage
              src={offering.primary_image}
              alt={offering.title}
              className="w-24 h-24 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-lg font-bold text-gray-900">
                  {offering.title}
                </h4>
                <StatusBadge isActive={offering.is_active} />
                <BookingBadge mode={offering.booking_mode} />
              </div>
              {offering.title_am && (
                <p className="text-sm font-medium text-gray-500 mb-1.5">
                  {offering.title_am}
                </p>
              )}
              {offering.service_category && (
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                  {offering.service_category}
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Duration summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 text-center">
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400">
                {t("preview.price")}
              </p>
              <p className="text-sm font-bold text-secondary mt-0.5">
                {offering.pricing_type === "custom"
                  ? t("preview.quote")
                  : `${Number(offering.price || 0).toLocaleString()} ${offering.currency}`}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400">
                {t("preview.duration")}
              </p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {offering.duration_minutes
                  ? t("preview.minutes", { count: offering.duration_minutes })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400">
                {t("preview.type")}
              </p>
              <p className="text-sm font-bold text-gray-800 mt-0.5 capitalize">
                {offering.service_type === "recurring"
                  ? t("preview.subscription", {
                      cycle: offering.billing_cycle || "monthly",
                    })
                  : t("preview.oneOff")}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-gray-400">
                {t("preview.payment")}
              </p>
              <p className="text-sm font-bold text-gray-800 mt-0.5 capitalize">
                {offering.payment_policy.replace("_", " ")}
                {offering.payment_policy === "deposit"
                  ? ` (${offering.deposit_percentage}%)`
                  : ""}
              </p>
            </div>
          </div>

          {/* Description */}
          {offering.description && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {t("preview.description")}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {offering.description}
              </p>
              {offering.description_am && (
                <p className="text-sm text-gray-500 mt-2 whitespace-pre-line leading-relaxed italic">
                  {offering.description_am}
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {offering.tags && offering.tags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("preview.tags")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {offering.tags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-secondary border border-secondary/15"
                  >
                    <Tag className="h-3 w-3 opacity-60" />
                    <span>{tg}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Intake Form Fields */}
          {offering.intake_form_schema &&
            offering.intake_form_schema.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t("preview.intakeForm", {
                    count: offering.intake_form_schema.length,
                  })}
                </p>
                <div className="space-y-1.5">
                  {offering.intake_form_schema.map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                    >
                      <span className="font-semibold text-gray-800">
                        {i + 1}. {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                      <span className="text-gray-400 uppercase text-[10px] font-medium px-1.5 py-0.5 rounded bg-white border">
                        {field.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 rounded-xl hover:bg-gray-100 transition"
          >
            {t("preview.close")}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(offering);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-[#5B46A0] transition shadow-xs"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>{t("preview.editService")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceTableSkeleton() {
  const { t } = useTranslation("companyServices");
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
            <th className="pb-3 pr-4">{t("table.image")}</th>
            <th className="pb-3 pr-4">{t("table.service")}</th>
            <th className="pb-3 pr-4">{t("table.price")}</th>
            <th className="pb-3 pr-4">{t("table.duration")}</th>
            <th className="pb-3 pr-4">{t("table.booking")}</th>
            <th className="pb-3 pr-4">{t("table.status")}</th>
            <th className="pb-3 pr-4">{t("table.bookings")}</th>
            <th className="pb-3">{t("table.actions")}</th>
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
  const { t } = useTranslation("companyServices");

  const PAGE_SIZE_OPTIONS: SelectOption[] = [
    { value: "10", label: t("pageSize.10") },
    { value: "15", label: t("pageSize.15") },
    { value: "20", label: t("pageSize.20") },
    { value: "30", label: t("pageSize.30") },
    { value: "50", label: t("pageSize.50") },
    { value: "75", label: t("pageSize.75") },
    { value: "100", label: t("pageSize.100") },
  ];

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

  // ---------- filters & tabs ----------
  const [activeTabFilter, setActiveTabFilter] = useState<
    "all" | "one_off" | "recurring" | "active" | "inactive"
  >("all");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // ---------- search with debounce ----------
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ---------- counts for tab badges ----------
  const counts = useMemo(() => {
    let oneOff = 0;
    let recurring = 0;
    let active = 0;
    let inactive = 0;
    for (const o of offerings) {
      if ((o.service_type || "one_off") === "one_off") oneOff++;
      if (o.service_type === "recurring") recurring++;
      if (o.is_active) active++;
      else inactive++;
    }
    return { all: offerings.length, oneOff, recurring, active, inactive };
  }, [offerings]);

  const filteredOfferings = useMemo(() => {
    let list = offerings;

    // Tab filter
    if (activeTabFilter === "one_off") {
      list = list.filter((o) => (o.service_type || "one_off") === "one_off");
    } else if (activeTabFilter === "recurring") {
      list = list.filter((o) => o.service_type === "recurring");
    } else if (activeTabFilter === "active") {
      list = list.filter((o) => o.is_active);
    } else if (activeTabFilter === "inactive") {
      list = list.filter((o) => !o.is_active);
    }

    // Tag filter
    if (selectedTagFilter) {
      list = list.filter((o) =>
        o.tags?.some((tg) => tg.toLowerCase() === selectedTagFilter.toLowerCase()),
      );
    }

    // Search filter
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(term) ||
          (o.title_am && o.title_am.toLowerCase().includes(term)) ||
          (o.service_category &&
            o.service_category.toLowerCase().includes(term)) ||
          (o.tags && o.tags.some((tg) => tg.toLowerCase().includes(term))),
      );
    }

    return list;
  }, [offerings, activeTabFilter, selectedTagFilter, debouncedSearch]);

  const totalItems = filteredOfferings.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedOfferings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, currentPage, pageSize]);

  // reset page when search, tab, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTabFilter, selectedTagFilter, pageSize]);

  // handle cases where current page exceeds valid range
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // ---------- modal, preview & toast ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialStep, setModalInitialStep] = useState<
    "details" | "addons" | "gallery"
  >("details");
  const [editing, setEditing] = useState<ServiceOffering | null>(null);
  const [previewOffering, setPreviewOffering] = useState<ServiceOffering | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffering | null>(null);
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
        showToast("success", t("toasts.serviceUpdated"));
        return result;
      }
      const result = await create(data);
      showToast("success", t("toasts.serviceCreated"));
      return result;
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.detail || t("toasts.saveFailed"),
      );
      throw err;
    } finally {
      refetch();
    }
  };

  const handleEdit = async (
    offering: ServiceOffering,
    step: "details" | "addons" | "gallery" = "details",
  ) => {
    try {
      const fullOffering = await getDetail(offering.id);
      setEditing(fullOffering);
      setModalInitialStep(step);
      setModalOpen(true);
    } catch {
      showToast("error", t("toasts.loadDetailsFailed"));
    }
  };

  const handleToggleActive = async (offering: ServiceOffering) => {
    setTogglingId(offering.id);
    const newStatus = !offering.is_active;
    try {
      await update(offering.id, { is_active: newStatus });
      showToast(
        "success",
        newStatus
          ? t("toasts.serviceActivated")
          : t("toasts.serviceDeactivated"),
      );
      refetch();
    } catch {
      showToast("error", t("toasts.updateStatusFailed"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDuplicate = async (offering: ServiceOffering) => {
    try {
      const full = await getDetail(offering.id);
      const duplicatedData: Partial<ServiceOffering> = {
        ...full,
        id: undefined,
        title: `${full.title} (${t("duplicate.copySuffix")})`,
        title_am: full.title_am
          ? `${full.title_am} (${t("duplicate.copySuffixAm")})`
          : undefined,
        slug: undefined,
        order: (full.order || 0) + 1,
      };
      setEditing(duplicatedData as ServiceOffering);
      setModalInitialStep("details");
      setModalOpen(true);
      showToast("success", t("toasts.duplicating"));
    } catch {
      showToast("error", t("toasts.duplicateFailed"));
    }
  };

  const handleOpenAddons = async (offering: ServiceOffering) => {
    try {
      const full = await getDetail(offering.id);
      setEditing(full);
      setModalInitialStep("addons");
      setModalOpen(true);
    } catch {
      showToast("error", t("toasts.openAddonsFailed"));
    }
  };

  const handlePreview = async (offering: ServiceOffering) => {
    try {
      const full = await getDetail(offering.id);
      setPreviewOffering(full);
    } catch {
      setPreviewOffering(offering);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      showToast("success", t("toasts.serviceDeleted"));
      setDeleteTarget(null);
      refetch();
    } catch {
      showToast("error", t("toasts.deleteFailed"));
      setDeleteTarget(null);
    }
  };

  // ---------- early returns ----------
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title={t("selector.title")}
        searchPlaceholder={t("selector.searchPlaceholder")}
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
        <p>{t("noCompany")}</p>
      </div>
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={t("notService.title")}
          description={t("notService.description")}
          icon={AlertCircle}
          badge={
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 sm:text-xs">
              {t("notService.badge")}
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
                {t("notService.switchCompany")}
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
                {t("notService.heading", {
                  company: companyName || t("notService.fallbackCompany"),
                })}
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {t("notService.body")}
              </p>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
                >
                  <Repeat className="h-4 w-4" />
                  {t("notService.chooseServiceCompany")}
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
      <ServicePreviewModal
        offering={previewOffering}
        onClose={() => setPreviewOffering(null)}
        onEdit={(o) => handleEdit(o, "details")}
      />
      <ServiceOfferingModal
        key={
          editing?.id
            ? `${editing.id}-${modalInitialStep}`
            : `new-${modalInitialStep}`
        }
        isOpen={modalOpen}
        offering={editing}
        companySlug={companySlug}
        initialStep={modalInitialStep}
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
          title={companyName || undefined}
          description={t("page.description")}
          icon={Wrench}
          eyebrow={t("page.eyebrow")}
          actions={
            <>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Repeat className="h-4 w-4" />
                  {t("page.switchCompany")}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setModalInitialStep("details");
                  setModalOpen(true);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4" />
                {t("page.addService")}
              </button>
            </>
          }
          actionMobile={
            <>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <Repeat className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setModalInitialStep("details");
                  setModalOpen(true);
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4" />
                {t("page.addShort")}
              </button>
            </>
          }
          className="mb-6"
        />

        {/* Quick Filter Tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTabFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTabFilter === "all"
                ? "bg-secondary text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{t("tabs.all")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTabFilter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter("one_off")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTabFilter === "one_off"
                ? "bg-secondary text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{t("tabs.oneOff")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTabFilter === "one_off"
                  ? "bg-white/20 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {counts.oneOff}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter("recurring")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTabFilter === "recurring"
                ? "bg-secondary text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{t("tabs.recurring")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTabFilter === "recurring"
                  ? "bg-white/20 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {counts.recurring}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter("active")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTabFilter === "active"
                ? "bg-green-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{t("tabs.active")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTabFilter === "active"
                  ? "bg-white/20 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter("inactive")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTabFilter === "inactive"
                ? "bg-gray-700 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{t("tabs.inactive")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTabFilter === "inactive"
                  ? "bg-white/20 text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {counts.inactive}
            </span>
          </button>
        </div>

        {/* Active Tag Filter Indicator */}
        {selectedTagFilter && (
          <div className="mb-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-secondary/20 text-xs text-secondary w-fit animate-fadeIn">
            <Tag className="h-3.5 w-3.5" />
            <span>
              {t("tagFilter.label")}:{" "}
              <strong className="font-bold underline">{selectedTagFilter}</strong>
            </span>
            <button
              type="button"
              onClick={() => setSelectedTagFilter(null)}
              className="ml-1 p-0.5 rounded-full hover:bg-secondary/15 text-secondary transition"
              title={t("tagFilter.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
                placeholder={t("search.placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label={t("search.ariaLabel")}
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
              title={t("search.refresh")}
              aria-label={t("search.refresh")}
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
              {t("search.serviceCount", { count: totalItems })}
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
              <p className="font-medium">{t("error.title")}</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("error.retry")}
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
                {t("empty.noServices")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("empty.noServicesHint")}
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
                {t("empty.addService")}
              </button>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">
                {t("empty.noMatches")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("empty.noMatchesHint")}
              </p>
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="mt-4 text-sm font-semibold text-secondary hover:underline"
              >
                {t("empty.clearSearch")}
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
                    <th className="pb-3 pr-4">{t("table.image")}</th>
                    <th className="pb-3 pr-4">{t("table.service")}</th>
                    <th className="pb-3 pr-4">{t("table.price")}</th>
                    <th className="pb-3 pr-4">{t("table.duration")}</th>
                    <th className="pb-3 pr-4">{t("table.booking")}</th>
                    <th className="pb-3 pr-4">{t("table.status")}</th>
                    <th className="pb-3 pr-4">{t("table.bookings")}</th>
                    <th className="pb-3">{t("table.actions")}</th>
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
                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">
                          {o.title}
                        </p>
                        {o.service_category && (
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {o.service_category}
                          </p>
                        )}
                        {/* Tags Pills */}
                        {o.tags && o.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {o.tags.slice(0, 3).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setSelectedTagFilter(tag)}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                                  selectedTagFilter === tag
                                    ? "bg-secondary text-white shadow-xs"
                                    : "bg-purple-50 text-secondary hover:bg-purple-100 border border-secondary/15"
                                }`}
                                title={t("tags.filterBy", { tag })}
                              >
                                <Tag className="h-2.5 w-2.5 opacity-60" />
                                <span className="truncate max-w-[85px]">{tag}</span>
                              </button>
                            ))}
                            {o.tags.length > 3 && (
                              <span
                                className="text-[10px] font-medium text-gray-400 self-center"
                                title={o.tags.slice(3).join(", ")}
                              >
                                +{o.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">
                        {o.pricing_type === "custom"
                          ? t("preview.quote")
                          : `${Number(o.price || 0).toLocaleString()} ${o.currency}`}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                        {o.duration_minutes
                          ? t("preview.minutes", { count: o.duration_minutes })
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <BookingBadge mode={o.booking_mode} />
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          isActive={o.is_active}
                          onToggle={() => handleToggleActive(o)}
                          disabled={togglingId === o.id}
                        />
                      </td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                        {o.total_bookings ?? 0}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePreview(o)}
                            className="p-1.5 text-gray-500 hover:text-secondary rounded-lg hover:bg-purple-50 transition"
                            title={t("actions.preview")}
                            aria-label={t("actions.previewAria", { title: o.title })}
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAddons(o)}
                            className="p-1.5 text-secondary hover:text-purple-700 rounded-lg hover:bg-purple-50 transition"
                            title={t("actions.manageAddons")}
                            aria-label={t("actions.manageAddonsAria", { title: o.title })}
                            type="button"
                          >
                            <Settings  className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(o)}
                            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
                            title={t("actions.duplicate")}
                            aria-label={t("actions.duplicateAria", { title: o.title })}
                            type="button"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(o, "details")}
                            className="p-1.5 text-secondary hover:text-purple-700 rounded-lg hover:bg-purple-50 transition"
                            title={t("actions.edit")}
                            aria-label={t("actions.editAria", { title: o.title })}
                            type="button"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(o)}
                            className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition"
                            title={t("actions.delete")}
                            aria-label={t("actions.deleteAria", { title: o.title })}
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
                            onClick={() => handlePreview(o)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            title={t("actions.preview")}
                            aria-label={t("actions.previewAria", { title: o.title })}
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAddons(o)}
                            className="p-1.5 rounded-lg text-secondary hover:bg-purple-50 transition"
                            title={t("actions.manageAddons")}
                            aria-label={t("actions.manageAddonsAria", { title: o.title })}
                            type="button"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(o)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            title={t("actions.duplicate")}
                            aria-label={t("actions.duplicateAria", { title: o.title })}
                            type="button"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(o, "details")}
                            className="p-1.5 rounded-lg text-secondary hover:bg-purple-50 transition"
                            title={t("actions.edit")}
                            aria-label={t("actions.editAria", { title: o.title })}
                            type="button"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(o)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            title={t("actions.delete")}
                            aria-label={t("actions.deleteAria", { title: o.title })}
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
                              ? t("preview.quote")
                              : `${Number(o.price || 0).toLocaleString()} ${o.currency}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
                          <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {o.duration_minutes
                              ? t("preview.minutes", {
                                  count: o.duration_minutes,
                                })
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <BookingBadge mode={o.booking_mode} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge
                            isActive={o.is_active}
                            onToggle={() => handleToggleActive(o)}
                            disabled={togglingId === o.id}
                          />
                        </div>
                      </div>

                      {/* Tags on Mobile Card */}
                      {o.tags && o.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-gray-100">
                          {o.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTagFilter(tag)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                                selectedTagFilter === tag
                                  ? "bg-secondary text-white"
                                  : "bg-purple-50 text-secondary border border-secondary/15"
                              }`}
                            >
                              <Tag className="h-2.5 w-2.5 opacity-60" />
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bookings count */}
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Activity className="h-3 w-3" />
                        <span>{t("bookingsCount", { count: o.total_bookings ?? 0 })}</span>
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
                  {t("pagination.showing", {
                    from: Math.min(
                      (currentPage - 1) * pageSize + 1,
                      totalItems,
                    ),
                    to: Math.min(currentPage * pageSize, totalItems),
                    total: totalItems,
                  })}
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