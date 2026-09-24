import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  Users,
  UserCheck,
  Star,
  Calendar,
  Search,
  Filter,
  List,
  LayoutGrid,
  Repeat,
  CheckSquare,
  X,
  Edit,
  Building2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import {
  getManageStaff,
  deleteStaff,
  getManageServiceOfferings,
} from "../../../services/api";
import { CompanySelector } from "../company-products/CompanySelector";
import { StaffScheduleModal } from "./StaffScheduleModal";
import { Toast } from "../../ui/Toast";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import { StaffForm } from "./StaffForm";
import { StaffTable, StatCard, DeleteModal } from "./StaffTable";
import PageHeader from "../../ui/PageHeader";
import { DataTable, type Column } from "../../ui/DataTable";
import type { ServiceStaff, ServiceOffering } from "../../../types";

const PRIMARY_COLOR = "#6750A4";

// ─── Types ──────────────────────────────────────────────
type SortKey = "name" | "rating";
type SortDir = "asc" | "desc";
type FilterKey = "availability" | "online" | "assignment";

interface Filters {
  availability: "all" | "working_today" | "off_today";
  online: "all" | "online" | "offline";
  assignment: "all" | "assigned" | "unassigned";
}

const defaultFilters: Filters = {
  availability: "all",
  online: "all",
  assignment: "all",
};

// ─── Sub‑components ────────────────────────────────────
// Statistics skeleton
const StatsSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100" />
        </div>
      </div>
    ))}
  </div>
);

// Filter popover
// Add this custom hook before the FilterPopover component
function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// Replace the existing FilterPopover with this version
// Updated FilterPopover component
const FilterPopover = ({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) => {
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();

  const filterCount = Object.values(filters).filter((v) => v !== "all").length;

  const setFilter = (key: FilterKey, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clear = () => onChange(defaultFilters);

  const filterContent = (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-72 max-w-[calc(100vw-32px)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Filters</h4>
        <div className="flex items-center gap-2">
          {filterCount > 0 && (
            <button
              onClick={clear}
              className="text-xs text-red-600 hover:underline"
            >
              Clear all
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">
          Availability
        </label>
        <div className="flex flex-col gap-1">
          {[
            { value: "all", label: "All" },
            { value: "working_today", label: "Working today" },
            { value: "off_today", label: "Off today" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="availability"
                checked={filters.availability === opt.value}
                onChange={() => setFilter("availability", opt.value)}
                className="text-secondary focus:ring-secondary"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Online */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 block mb-1.5">
          Online Status
        </label>
        <div className="flex flex-col gap-1">
          {[
            { value: "all", label: "All" },
            { value: "online", label: "Online" },
            { value: "offline", label: "Offline" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="online"
                checked={filters.online === opt.value}
                onChange={() => setFilter("online", opt.value)}
                className="text-secondary focus:ring-secondary"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Assignment */}
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1.5">
          Service Assignment
        </label>
        <div className="flex flex-col gap-1">
          {[
            { value: "all", label: "All" },
            { value: "assigned", label: "Assigned services" },
            { value: "unassigned", label: "Unassigned (all services)" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="assignment"
                checked={filters.assignment === opt.value}
                onChange={() => setFilter("assignment", opt.value)}
                className="text-secondary focus:ring-secondary"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
          filterCount > 0
            ? "bg-secondary/10 text-secondary border-secondary/30"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
        aria-expanded={open}
        aria-label="Open filters"
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {filterCount > 0 && (
          <span className="ml-1 bg-secondary text-white text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && !isMobile && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 z-50"
            >
              {filterContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm"
            >
              {filterContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
// Bulk delete confirmation
const BulkDeleteModal = ({
  selectedStaff,
  onConfirm,
  onClose,
}: {
  selectedStaff: ServiceStaff[];
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3
            id="bulk-delete-title"
            className="text-lg font-bold text-gray-900"
          >
            Delete {selectedStaff.length} specialists?
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            This will permanently remove these team members and their
            assignments.
          </p>
          <div className="mt-3 max-h-32 overflow-y-auto border rounded-xl p-2 space-y-1">
            {selectedStaff.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 text-sm text-gray-700 py-1"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {s.name.charAt(0)}
                </div>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium"
            >
              Delete All
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main Component ──────────────────────────────────────
export default function StaffManagement() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const formPanelRef = useRef<HTMLDivElement>(null);
  const companySlug = company?.slug ?? null;
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );

  const selectedCompany = useMemo(
    () => companies.find((item) => item.slug === companySlug) || null,
    [companies, companySlug],
  );
  const isServiceCompany = selectedCompany?.business_type === "service";

  // ── State ──────────────────────────────────────────────
  const [staff, setStaff] = useState<ServiceStaff[]>([]);
  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [editingStaff, setEditingStaff] = useState<ServiceStaff | null>(null);
  const [scheduleStaff, setScheduleStaff] = useState<ServiceStaff | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [deleteTarget, setDeleteTarget] = useState<ServiceStaff | null>(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<
    ServiceStaff[] | null
  >(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const goToStaffForm = useCallback(
    (staffMember: ServiceStaff | null = null) => {
      setEditingStaff(staffMember);

      requestAnimationFrame(() => {
        formPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [],
  );
  // ── Data fetching ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!companySlug || !isServiceCompany) return;
    try {
      setLoading(true);
      const [staffRes, offeringsRes] = await Promise.allSettled([
        getManageStaff(companySlug),
        getManageServiceOfferings(companySlug),
      ]);

      let staffData: ServiceStaff[] = [];
      let offeringData: ServiceOffering[] = [];

      if (staffRes.status === "fulfilled") {
        const rawStaff = staffRes.value.data || [];
        staffData = rawStaff.map((s: ServiceStaff) => ({
          ...s,
          working_days: Array.isArray(s.working_days)
            ? s.working_days
            : typeof s.working_days === "number"
              ? [s.working_days]
              : [],
        }));
      } else {
        setToast({
          type: "error",
          message: extractErrorMessage(staffRes.reason, "Failed to load staff"),
        });
      }

      if (offeringsRes.status === "fulfilled") {
        offeringData = offeringsRes.value.data || [];
      } else {
        setToast({
          type: "error",
          message: extractErrorMessage(
            offeringsRes.reason,
            "Failed to load services",
          ),
        });
      }

      setStaff(staffData);
      setOfferings(offeringData);
    } catch (err) {
      setToast({
        type: "error",
        message: extractErrorMessage(err, "Failed to load data"),
      });
    } finally {
      setLoading(false);
    }
  }, [companySlug, isServiceCompany]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteStaff(companySlug, id);
      setToast({ type: "success", message: "Specialist removed." });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setToast({
        type: "error",
        message: extractErrorMessage(err, "Failed to remove specialist"),
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!companySlug || !bulkDeleteTargets?.length) return;
    let failed = 0;
    for (const staff of bulkDeleteTargets) {
      try {
        await deleteStaff(companySlug, staff.id);
      } catch {
        failed++;
      }
    }
    setBulkDeleteTargets(null);
    if (failed > 0) {
      setToast({
        type: "error",
        message: `Removed ${bulkDeleteTargets.length - failed} specialists. ${failed} failed.`,
      });
    } else {
      setToast({
        type: "success",
        message: `${bulkDeleteTargets.length} specialists removed.`,
      });
    }
    setSelectedIds([]);
    fetchData();
  };
  const handleCreateSuccess = async () => {
    await fetchData();
  };
  const handleEditSuccess = async () => {
    setEditingStaff(null);
    await fetchData();
  };
  const handleEditStart = (member: ServiceStaff) => {
    goToStaffForm(member);
  };
  const handleEditCancel = () => setEditingStaff(null);
  // const handleEditSuccess = () => {
  //   setEditingStaff(null);
  //   fetchData();
  // };

  // ── Derived data ───────────────────────────────────────
  const today = new Date().getDay();

  // Apply filters before search/sort
  const filteredStaff = useMemo(() => {
    let list = [...staff];

    // Apply availability filter
    if (filters.availability === "working_today") {
      list = list.filter((s) => s.working_days?.includes(today));
    } else if (filters.availability === "off_today") {
      list = list.filter((s) => !s.working_days?.includes(today));
    }

    // Online status
    if (filters.online === "online") {
      list = list.filter((s) => s.is_online !== false);
    } else if (filters.online === "offline") {
      list = list.filter((s) => s.is_online === false);
    }

    // Assignment
    if (filters.assignment === "assigned") {
      list = list.filter(
        (s) => s.assigned_service_ids && s.assigned_service_ids.length > 0,
      );
    } else if (filters.assignment === "unassigned") {
      list = list.filter(
        (s) => !s.assigned_service_ids || s.assigned_service_ids.length === 0,
      );
    }

    // Search
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.name_am?.toLowerCase().includes(term) ||
          s.role_title?.toLowerCase().includes(term),
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA, valB;
      if (sortKey === "name") {
        valA = a.name;
        valB = b.name;
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        valA = Number(a.average_rating) || 0;
        valB = Number(b.average_rating) || 0;
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
    });

    return list;
  }, [staff, filters, search, sortKey, sortDir, today]);

  // Statistics
  const stats = useMemo(() => {
    const total = staff.length;
    const available = staff.filter(
      (s) => s.working_days?.includes(today) && s.is_online !== false,
    ).length;
    const offline = staff.filter((s) => s.is_online === false).length;
    const avg =
      total > 0
        ? staff.reduce((acc, s) => acc + (Number(s.average_rating) || 0), 0) /
          total
        : 0;
    const assignments = staff.reduce(
      (sum, s) => sum + (s.assigned_service_ids?.length || 0),
      0,
    );
    const workingToday = staff.filter((s) =>
      s.working_days?.includes(today),
    ).length;

    return { total, available, offline, avg, assignments, workingToday };
  }, [staff, today]);

  const staffColumns: Column<ServiceStaff>[] = [
    {
      key: "select",
      header: "Select",
      textMode: "nowrap",
      render: (member) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(member.id)}
          onChange={(event) => {
            setSelectedIds((current) =>
              event.target.checked
                ? [...current, member.id]
                : current.filter((id) => id !== member.id),
            );
          }}
          className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
          aria-label={`Select ${member.name}`}
        />
      ),
    },
    {
      key: "name",
      header: "Specialist",
      render: (member) => (
        <div>
          <p className="font-semibold text-gray-900">{member.name}</p>
          {member.name_am && (
            <p className="mt-0.5 text-xs text-gray-500">{member.name_am}</p>
          )}
        </div>
      ),
    },
    {
      key: "role_title",
      header: "Role",
      render: (member) => member.role_title || "—",
    },
    {
      key: "average_rating",
      header: "Rating",
      textMode: "nowrap",
      render: (member) => (
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-gray-800">
            {Number(member.average_rating || 0).toFixed(1)}
          </span>
        </div>
      ),
    },
    {
      key: "availability",
      header: "Today",
      textMode: "nowrap",
      render: (member) => {
        const workingToday = member.working_days?.includes(today);
        const available = workingToday && member.is_online !== false;

        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
              available
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            {available ? "Available" : workingToday ? "Offline" : "Off today"}
          </span>
        );
      },
    },
    {
      key: "services",
      header: "Services",
      textMode: "nowrap",
      render: (member) => (
        <span className="text-sm text-gray-700">
          {member.assigned_service_ids?.length || 0} assigned
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      textMode: "nowrap",
      render: (member) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setScheduleStaff(member)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-secondary"
            title="Schedule"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleEditStart(member)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-secondary"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(member)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Reset selection when staff list changes dramatically
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => staff.some((s) => s.id === id)),
    );
  }, [staff]);

  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies}
        isLoading={isLoadingCompanies}
        onSelect={(slug: string, name: string) => {
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
          title="Staff & Specialists"
          description="This area is available only to companies configured as service businesses."
          icon={Users}
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
                {company?.name || "The selected company"} is not a service company
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


  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      {/* Header */}
      <PageHeader
        title="Staff & Specialists"
        description="Manage your service team, schedules, and service assignments."
        icon={Users}
        eyebrow={company?.name || undefined}
        badge={
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
            {staff.length} staff
          </span>
        }
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
              onClick={() => goToStaffForm(null)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90"
            >
              <Plus className="h-4 w-4" />
              Add specialist
            </button>
          </>
        }
        className="mb-6"
      />

      {/* Stats section */}
      {loading ? (
        <StatsSkeleton />
      ) : staff.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Staff"
            value={stats.total}
            icon={Users}
            color="#3B82F6"
          />
          <StatCard
            label="Available Today"
            value={stats.available}
            icon={UserCheck}
            color="#10B981"
          />
          <StatCard
            label="Offline"
            value={stats.offline}
            icon={X}
            color="#6B7280"
          />
          <StatCard
            label="Avg Rating"
            value={stats.avg.toFixed(1)}
            icon={Star}
            color="#F59E0B"
          />
          <StatCard
            label="Assigned Services"
            value={stats.assignments}
            icon={CheckSquare}
            color="#6750A4"
          />
          <StatCard
            label="Working Today"
            value={stats.workingToday}
            icon={Calendar}
            color="#EC4899"
          />
        </div>
      ) : null}

      {/* Main two‑column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] gap-6">
        {/* Form panel */}
        <div
          ref={formPanelRef}
          className="lg:sticky lg:top-6 self-start scroll-mt-6"
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                {editingStaff ? (
                  <Edit className="h-5 w-5 text-secondary" />
                ) : (
                  <Plus className="h-5 w-5 text-secondary" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-secondary">
                  {editingStaff ? "Edit Specialist" : "Add Specialist"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingStaff
                    ? "Update profile, schedule, and service assignments."
                    : "Create a team member and assign their services."}
                </p>
              </div>
            </div>
            <StaffForm
              key={editingStaff ? `edit-${editingStaff.id}` : "create"}
              companySlug={companySlug!}
              offerings={offerings}
              onSuccess={editingStaff ? handleEditSuccess : handleCreateSuccess}
              onCancel={editingStaff ? handleEditCancel : undefined}
              initialData={editingStaff}
            />
          </div>
        </div>

        {/* Staff list panel */}
        <div className="space-y-4 min-w-0">
          {/* Toolbar */}
          {staff.length > 0 && (
            <>
              {selectedIds.length > 0 ? (
                <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl border border-secondary/20">
                  <span className="text-sm font-medium text-secondary">
                    {selectedIds.length} specialist
                    {selectedIds.length > 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        const targets = staff.filter((s) =>
                          selectedIds.includes(s.id),
                        );
                        setBulkDeleteTargets(targets);
                      }}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search specialists..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <FilterPopover filters={filters} onChange={setFilters} />

                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      aria-label="Sort by"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="rating">Sort by Rating</option>
                    </select>

                    <button
                      onClick={() =>
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                      }
                      className="p-2.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                    >
                      {sortDir === "asc" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode("table")}
                        className={`p-1.5 rounded-md transition-colors ${
                          viewMode === "table"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-500"
                        }`}
                        aria-label="Table view"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("card")}
                        className={`p-1.5 rounded-md transition-colors ${
                          viewMode === "card"
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-500"
                        }`}
                        aria-label="Card view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                    <div className="w-20 h-6 bg-gray-200 rounded" />
                    <div className="w-16 h-6 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            staff.length === 0 ? (
              /* No staff yet */
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No specialists yet
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  Build your team by adding your first specialist. You can
                  assign services, schedules, and availability.
                </p>
                <button
                  onClick={() => {
                    setEditingStaff(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-6 px-5 py-2.5 text-white rounded-xl text-sm font-medium hover:bg-[#5B46A0] shadow-sm"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <Plus className="h-4 w-4 inline mr-1" /> Add Specialist
                </button>
              </div>
            ) : (
              /* Search/filter empty */
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Search className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No specialists found
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  Try a different name or adjust your filters.
                </p>
                <div className="mt-4 flex gap-3 justify-center">
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                      Clear search
                    </button>
                  )}
                  {Object.values(filters).some((v) => v !== "all") && (
                    <button
                      onClick={() => setFilters(defaultFilters)}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            viewMode === "table" ? (
              <DataTable
                data={filteredStaff}
                columns={staffColumns}
                emptyMessage="No specialists found."
                stickyColumns={2}
              />
            ) : (
              <StaffTable
                staff={filteredStaff}
                offerings={offerings}
                onDeleteClick={(staff) => setDeleteTarget(staff)}
                onEdit={handleEditStart}
                onScheduleClick={(staff) => setScheduleStaff(staff)}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                viewMode="card"
              />
            )
          )}
        </div>
      </div>

      {/* Staff Daily Schedule Modal */}
      {scheduleStaff && (
        <StaffScheduleModal
          isOpen={!!scheduleStaff}
          staff={scheduleStaff}
          companySlug={companySlug!}
          onClose={() => setScheduleStaff(null)}
        />
      )}

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            staff={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget.id)}
            onClose={() => setDeleteTarget(null)}
          />
        )}
        {bulkDeleteTargets && (
          <BulkDeleteModal
            selectedStaff={bulkDeleteTargets}
            onConfirm={handleBulkDelete}
            onClose={() => setBulkDeleteTargets(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
