import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Repeat,
  CalendarOff,
  Calendar,
  Users,
  X,
  AlertTriangle,
  Pencil,
  Loader2Icon,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useAvailability } from "../../../hooks/useAvailability";
import {
  getManageBlackouts,
  createBlackoutDate,
  deleteBlackoutDate,
  updateBlackoutDate,
} from "../../../services/api";
import { CompanySelector } from "../company-products/CompanySelector";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import PageHeader from "../../ui/PageHeader";
import { extractErrorMessage } from "../../../utils/extractErrorMessage";
import type { AvailabilitySlot } from "../../../types";
import { validateAvailabilitySlot } from "../../../utils/availabilityValidator";
import { validateBlackout } from "../../../utils/blackoutValidator";
// import type { ValidationResult } from "../../../types/validation";

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------
const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

// ---------------------------------------------------------------------------
//  Local Types
// ---------------------------------------------------------------------------
interface Blackout {
  id: number;
  title: string;
  date: string;
  is_full_day: boolean;
  start_time?: string;
  end_time?: string;
}

// ---------------------------------------------------------------------------
//  Sub‑components
// ---------------------------------------------------------------------------
const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-20 mt-2"></div>
  </div>
);

const DayCard = ({
  day,
  slots,
  onAddClick,
  onEditSlot,
  onDeleteSlot,
  formatTime,
}: {
  day: number;
  slots: AvailabilitySlot[];
  onAddClick: (day: number) => void;
  onEditSlot: (slot: AvailabilitySlot) => void;
  onDeleteSlot: (slot: AvailabilitySlot) => void;
  formatTime: (time: string) => string;
}) => {
  const dayInfo = DAYS.find((d) => d.value === day) ?? {
    value: day,
    label: "Unknown",
  };
  const hasSlots = slots.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border shadow-sm p-5 transition-shadow hover:shadow-md flex flex-col ${
        hasSlots ? "border-gray-100" : "border-gray-200 opacity-70"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
            {dayInfo.label.slice(0, 2)}
          </div>
          <h4 className="text-lg font-semibold text-gray-900">
            {dayInfo.label}
          </h4>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            hasSlots
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasSlots ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {hasSlots ? "Open" : "Closed"}
        </span>
      </div>

      {hasSlots ? (
        <div className="space-y-3 flex-1">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(slot.start_time)} → {formatTime(slot.end_time)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    Max {slot.max_bookings} booking
                    {slot.max_bookings !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditSlot(slot)}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-1 transition"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteSlot(slot)}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-2 italic">No availability</p>
      )}

      <button
        onClick={() => onAddClick(day)}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
      >
        <Plus className="h-4 w-4" />
        {hasSlots ? "Add time slot" : "Add Availability"}
      </button>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
//  Slot Form Modal (unchanged)
// ---------------------------------------------------------------------------
const SlotFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingSlots,
  defaultDay,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    max_bookings: number;
    id?: number;
  }) => Promise<void>;
  initialData?: AvailabilitySlot;
  existingSlots: AvailabilitySlot[];
  defaultDay?: number;
}) => {
  const normalizeTimeForInput = (time?: string | null): string => {
    if (!time) return "";

    const [hours = "00", minutes = "00"] = time.split(":");

    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };
  const [form, setForm] = useState({
    day_of_week:
      initialData?.day_of_week ?? (defaultDay !== undefined ? defaultDay : 0),
    start_time: normalizeTimeForInput(initialData?.start_time) || "09:00",
    end_time: normalizeTimeForInput(initialData?.end_time) || "17:00",
    max_bookings: initialData?.max_bookings ?? 1,
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData;
  useEffect(() => {
    if (!isOpen) return;

    setForm({
      day_of_week: initialData?.day_of_week ?? defaultDay ?? 0,
      start_time: normalizeTimeForInput(initialData?.start_time) || "09:00",
      end_time: normalizeTimeForInput(initialData?.end_time) || "17:00",
      max_bookings: initialData?.max_bookings ?? 1,
    });

    setFieldErrors({});
    setLoading(false);
  }, [isOpen, initialData, defaultDay]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const result = validateAvailabilitySlot(
      {
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        max_bookings: form.max_bookings,
        id: initialData?.id,
      },
      existingSlots.map((s) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    );

    setFieldErrors(result.errors);

    return result.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      await onSubmit({
        ...form,
        id: initialData?.id,
      });

      onClose();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, "Failed to save slot");

      setFieldErrors({
        general: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-secondary">
            {isEdit ? "Edit Availability Slot" : "Add Availability Slot"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fieldErrors.general && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            {fieldErrors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day
            </label>
            <select
              value={form.day_of_week}
              onChange={(e) =>
                handleChange("day_of_week", Number(e.target.value))
              }
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                fieldErrors.day_of_week
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-secondary"
              }`}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {fieldErrors.day_of_week && (
              <p className="text-red-600 text-xs mt-1">
                {fieldErrors.day_of_week}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                  fieldErrors.start_time
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-secondary"
                }`}
              />
              {fieldErrors.start_time && (
                <p className="text-red-600 text-xs mt-1">
                  {fieldErrors.start_time}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                  fieldErrors.end_time
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-secondary"
                }`}
              />
              {fieldErrors.end_time && (
                <p className="text-red-600 text-xs mt-1">
                  {fieldErrors.end_time}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Bookings
            </label>
            <input
              type="number"
              min={1}
              value={form.max_bookings}
              onChange={(e) =>
                handleChange("max_bookings", Number(e.target.value))
              }
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-secondary/20 ${
                fieldErrors.max_bookings
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-secondary"
              }`}
            />
            {fieldErrors.max_bookings && (
              <p className="text-red-600 text-xs mt-1">
                {fieldErrors.max_bookings}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isEdit ? "Update Slot" : "Save Slot"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
//  Main Component
// ---------------------------------------------------------------------------
export default function AvailabilityManagement() {
  // ---------- Hooks ----------
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );
  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  const {
    slots,
    loading: slotsLoading,
    create,
    update,
    remove,
  } = useAvailability(isServiceCompany ? companySlug : null);

  // Blackouts state
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [blackoutLoading, setBlackoutLoading] = useState(false);
  const [blackoutSubmitting, setBlackoutSubmitting] = useState(false);
  const [blackoutErrors, setBlackoutErrors] = useState<Record<string, string>>(
    {},
  );
  const [editingBlackoutId, setEditingBlackoutId] = useState<number | null>(
    null,
  );

  const [blackoutForm, setBlackoutForm] = useState({
    title: "Public Holiday",
    date: "",
    is_full_day: true,
    start_time: "09:00",
    end_time: "17:00",
  });

  const [blackoutDeleteTarget, setBlackoutDeleteTarget] = useState<
    number | null
  >(null);

  // Slot modal (add/edit) state
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | undefined>(
    undefined,
  );

  // Delete target & toast
  const [deleteTarget, setDeleteTarget] = useState<AvailabilitySlot | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [newSlotDay, setNewSlotDay] = useState(0);

  const openAddModalForDay = (day: number) => {
    setEditingSlot(undefined);
    setNewSlotDay(day);
    setIsSlotModalOpen(true);
  };
  // Fetch blackouts
  const fetchBlackouts = useCallback(async () => {
    if (!companySlug || !isServiceCompany) return;
    try {
      setBlackoutLoading(true);
      const res = await getManageBlackouts(companySlug);
      setBlackouts((res.data || []) as Blackout[]);
    } catch {
      // ignore
    } finally {
      setBlackoutLoading(false);
    }
  }, [companySlug, isServiceCompany]);

  useEffect(() => {
    fetchBlackouts();
  }, [fetchBlackouts]);

  // Group slots
  const groupedSlots = useMemo(() => {
    return slots.reduce(
      (acc, slot) => {
        acc[slot.day_of_week] = [...(acc[slot.day_of_week] || []), slot].sort(
          (a, b) => a.start_time.localeCompare(b.start_time),
        );
        return acc;
      },
      {} as Record<number, AvailabilitySlot[]>,
    );
  }, [slots]);

  // Summary stats
  const summary = useMemo(() => {
    const workingDays = Object.keys(groupedSlots).length;
    const totalSlots = slots.length;
    const weeklyHours = slots
      .reduce((sum, slot) => {
        const [sh, sm] = slot.start_time.split(":").map(Number);
        const [eh, em] = slot.end_time.split(":").map(Number);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        let duration = endMinutes - startMinutes;

        if (duration < 0) {
          duration += 24 * 60;
        }

        return sum + duration / 60;
      }, 0)
      .toFixed(1);
    const maxDaily = Math.max(...slots.map((s) => s.max_bookings), 0);
    const blockedDates = blackouts.length;
    return { workingDays, totalSlots, weeklyHours, maxDaily, blockedDates };
  }, [groupedSlots, slots, blackouts]);

  const formatTime = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  // ---------- Early returns ----------
  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title="Availability"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Availability Management"
          description="This area is available only to companies configured as service businesses."
          icon={Calendar}
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

  // ---------- Handlers ----------
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSlot = async (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    max_bookings: number;
    id?: number;
  }) => {
    if (data.id) {
      await update(data.id, {
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        max_bookings: data.max_bookings,
        is_active: true,
      });

      showToast("success", "Slot updated successfully");
    } else {
      await create({
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        max_bookings: data.max_bookings,
        is_active: true,
      });

      showToast("success", "Slot added successfully");
    }
  };
  // const openAddModalForDay = (day: number) => {
  //   setEditingSlot({
  //     id: 0,
  //     day_of_week: day,
  //     start_time: "09:00",
  //     end_time: "17:00",
  //     max_bookings: 1,
  //   } as AvailabilitySlot);

  //   setIsSlotModalOpen(true);
  // };

  const openEditModal = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setIsSlotModalOpen(true);
  };

  const closeSlotModal = () => {
    setIsSlotModalOpen(false);
    setEditingSlot(undefined);
  };

  const handleDeleteSlot = (slot: AvailabilitySlot) => {
    setDeleteTarget(slot);
  };

  const confirmDeleteSlot = async () => {
    if (deleteTarget) {
      try {
        await remove(deleteTarget.id);
        showToast("success", "Slot removed");
      } catch (err: any) {
        showToast("error", extractErrorMessage(err, "Failed to remove slot"));
      } finally {
        setDeleteTarget(null);
      }
    }
  };

  // ---------- Blackout handlers with edit support ----------
  const handleBlackoutFormChange = (field: string, value: string | boolean) => {
    setBlackoutForm((prev) => ({ ...prev, [field]: value }));
    if (blackoutErrors[field]) {
      setBlackoutErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const startEditBlackout = (blackout: Blackout) => {
    setEditingBlackoutId(blackout.id);
    setBlackoutForm({
      title: blackout.title,
      date: blackout.date,
      is_full_day: blackout.is_full_day,
      start_time: blackout.start_time || "09:00",
      end_time: blackout.end_time || "17:00",
    });
    setBlackoutErrors({});
  };

  const cancelEditBlackout = () => {
    setEditingBlackoutId(null);
    setBlackoutForm({
      title: "Public Holiday",
      date: "",
      is_full_day: true,
      start_time: "09:00",
      end_time: "17:00",
    });
    setBlackoutErrors({});
  };

  const handleSubmitBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySlug) return;

    // Filter out the current blackout when editing, so validation doesn't flag it as duplicate
    const blackoutsForValidation = editingBlackoutId
      ? blackouts.filter((b) => b.id !== editingBlackoutId)
      : blackouts;

    const result = validateBlackout(
      { ...blackoutForm },
      blackoutsForValidation.map((b) => ({
        id: b.id,
        date: b.date,
        is_full_day: b.is_full_day,
        start_time: b.start_time,
        end_time: b.end_time,
      })),
    );
    setBlackoutErrors(result.errors);
    if (!result.isValid) return;

    setBlackoutSubmitting(true);
    try {
      const payload: any = {
        title: blackoutForm.title,
        date: blackoutForm.date,
        is_full_day: blackoutForm.is_full_day,
      };
      if (!blackoutForm.is_full_day) {
        payload.start_time = blackoutForm.start_time;
        payload.end_time = blackoutForm.end_time;
      }

      if (editingBlackoutId) {
        await updateBlackoutDate(companySlug, editingBlackoutId, payload);
        showToast("success", "Closure updated");
        setEditingBlackoutId(null);
      } else {
        await createBlackoutDate(companySlug, payload);
        showToast("success", "Closure added");
      }

      setBlackoutForm({
        title: "Public Holiday",
        date: "",
        is_full_day: true,
        start_time: "09:00",
        end_time: "17:00",
      });
      setBlackoutErrors({});
      fetchBlackouts();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to save closure"));
    } finally {
      setBlackoutSubmitting(false);
    }
  };

  const handleDeleteBlackout = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteBlackoutDate(companySlug, id);
      showToast("success", "Blackout removed");
      fetchBlackouts();
    } catch (err: any) {
      showToast("error", extractErrorMessage(err, "Failed to remove blackout"));
    }
  };

  // ---------- Render ----------
  return (
    <>
      <Toast toast={toast} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${DAYS.find((d) => d.value === deleteTarget?.day_of_week)?.label || ""} slot?`}
        onConfirm={confirmDeleteSlot}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConfirmModal
        isOpen={blackoutDeleteTarget !== null}
        title="Delete blackout date?"
        onConfirm={() => {
          if (blackoutDeleteTarget !== null) {
            handleDeleteBlackout(blackoutDeleteTarget);
            setBlackoutDeleteTarget(null);
          }
        }}
        onCancel={() => setBlackoutDeleteTarget(null)}
      />

      <SlotFormModal
        isOpen={isSlotModalOpen}
        onClose={closeSlotModal}
        onSubmit={handleSaveSlot}
        initialData={editingSlot}
        existingSlots={slots}
        defaultDay={newSlotDay}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Availability Management"
          description="Configure booking schedules, working hours, and closure dates."
          icon={Calendar}
          eyebrow={company?.name || undefined}
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

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={Calendar}
            label="Working Days"
            value={summary.workingDays}
            color="bg-purple-600"
          />
          <StatCard
            icon={Clock}
            label="Total Slots"
            value={summary.totalSlots}
            color="bg-blue-600"
          />
          <StatCard
            icon={Users}
            label="Max Bookings / Slot"
            value={summary.maxDaily}
            color="bg-emerald-600"
          />
          <StatCard
            icon={Calendar}
            label="Weekly Hours"
            value={`${summary.weeklyHours}h`}
            color="bg-indigo-600"
          />
          <StatCard
            icon={CalendarOff}
            label="Blocked Dates"
            value={summary.blockedDates}
            color="bg-secondary"
          />
        </div>

        {/* Weekly Schedule */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Weekly Schedule
              </h2>
              <p className="text-sm text-gray-500">
                Manage your weekly availability
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSlot(undefined);
                setNewSlotDay(0);
                setIsSlotModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-purple-800 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Availability
            </button>
          </div>

          {slotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {DAYS.map((day) => (
                <DayCard
                  key={day.value}
                  day={day.value}
                  slots={groupedSlots[day.value] || []}
                  onAddClick={openAddModalForDay}
                  onEditSlot={openEditModal}
                  onDeleteSlot={handleDeleteSlot}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </section>

        {/* ─────────────────────────────────────────────────────────
    Blackout / Closure Management
───────────────────────────────────────────────────────── */}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <CalendarOff className="h-5 w-5 text-secondary" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Blackout Dates
                  </h3>

                  {!blackoutLoading && blackouts.length > 0 && (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      {blackouts.length}
                    </span>
                  )}

                  {editingBlackoutId && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Editing
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-xs text-gray-500">
                  Block bookings for holidays, closures, or unavailable hours.
                </p>
              </div>
            </div>

            {editingBlackoutId && (
              <button
                type="button"
                onClick={cancelEditBlackout}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              >
                Cancel editing
              </button>
            )}
          </div>

          {/* ───────────────────── Add / Edit Form ───────────────────── */}
          <form
            onSubmit={handleSubmitBlackout}
            className="border-b border-gray-100 bg-gray-50/60 p-4 sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {editingBlackoutId ? "Edit closure" : "Add closure"}
                </p>

                <p className="mt-0.5 text-xs text-gray-400">
                  {editingBlackoutId
                    ? "Update the selected blackout period."
                    : "Create a date or time period when bookings are unavailable."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Reason */}
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Reason <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="e.g. Ethiopian New Year"
                  value={blackoutForm.title}
                  onChange={(e) =>
                    handleBlackoutFormChange("title", e.target.value)
                  }
                  className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:ring-2 ${
                    blackoutErrors.title
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                      : "border-gray-200 focus:border-secondary focus:ring-secondary/10"
                  }`}
                  aria-invalid={!!blackoutErrors.title}
                />

                {blackoutErrors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {blackoutErrors.title}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="lg:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={blackoutForm.date}
                  onChange={(e) =>
                    handleBlackoutFormChange("date", e.target.value)
                  }
                  className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 ${
                    blackoutErrors.date
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                      : "border-gray-200 focus:border-secondary focus:ring-secondary/10"
                  }`}
                  aria-invalid={!!blackoutErrors.date}
                />

                {blackoutErrors.date && (
                  <p className="mt-1 text-xs text-red-600">
                    {blackoutErrors.date}
                  </p>
                )}
              </div>

              {/* Closure Type */}
              <div className="lg:col-span-5">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Closure type
                </label>

                <div className="grid grid-cols-2 rounded-xl border border-gray-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleBlackoutFormChange("is_full_day", true)
                    }
                    className={`h-8 rounded-lg px-3 text-xs font-medium transition-all ${
                      blackoutForm.is_full_day
                        ? "bg-amber-100 text-amber-800 shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    Full day
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleBlackoutFormChange("is_full_day", false)
                    }
                    className={`h-8 rounded-lg px-3 text-xs font-medium transition-all ${
                      !blackoutForm.is_full_day
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    Partial hours
                  </button>
                </div>
              </div>

              {/* Partial Hours */}
              {!blackoutForm.is_full_day && (
                <>
                  <div className="lg:col-span-3">
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      Start time <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      value={blackoutForm.start_time}
                      onChange={(e) =>
                        handleBlackoutFormChange("start_time", e.target.value)
                      }
                      className={`h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none transition-all focus:ring-2 ${
                        blackoutErrors.start_time
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-200 focus:border-secondary focus:ring-secondary/10"
                      }`}
                    />

                    {blackoutErrors.start_time && (
                      <p className="mt-1 text-xs text-red-600">
                        {blackoutErrors.start_time}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-3">
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      End time <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="time"
                      value={blackoutForm.end_time}
                      onChange={(e) =>
                        handleBlackoutFormChange("end_time", e.target.value)
                      }
                      className={`h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none transition-all focus:ring-2 ${
                        blackoutErrors.end_time
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-gray-200 focus:border-secondary focus:ring-secondary/10"
                      }`}
                    />

                    {blackoutErrors.end_time && (
                      <p className="mt-1 text-xs text-red-600">
                        {blackoutErrors.end_time}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Submit */}
              <div
                className={`flex items-end gap-2 ${
                  blackoutForm.is_full_day ? "lg:col-span-5" : "lg:col-span-6"
                }`}
              >
                <button
                  type="submit"
                  disabled={blackoutSubmitting}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-secondary hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {blackoutSubmitting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingBlackoutId ? (
                        <>
                          <Pencil className="h-3.5 w-3.5" />
                          Update closure
                        </>
                      ) : (
                        <>
                          <CalendarOff className="h-3.5 w-3.5" />
                          Add closure
                        </>
                      )}
                    </>
                  )}
                </button>

                {editingBlackoutId && (
                  <button
                    type="button"
                    onClick={cancelEditBlackout}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* ───────────────────── Closure List ───────────────────── */}
          <div className="p-4 sm:p-5">
            {/* List Header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-gray-800">
                  Scheduled closures
                </h4>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  Existing dates that block customer bookings
                </p>
              </div>

              {!blackoutLoading && blackouts.length > 0 && (
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                  {blackouts.length}{" "}
                  {blackouts.length === 1 ? "closure" : "closures"}
                </span>
              )}
            </div>

            {/* Loading */}
            {blackoutLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : blackouts.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
                  <CalendarOff className="h-5 w-5 text-gray-400" />
                </div>

                <h3 className="text-sm font-semibold text-gray-800">
                  No scheduled closures
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                  Your business currently has no blackout dates. Add a holiday
                  or unavailable period above to stop customers from booking.
                </p>
              </div>
            ) : (
              /* Closure Items */
              <div className="space-y-2">
                {blackouts.map((b) => (
                  <div
                    key={b.id}
                    className={`group rounded-xl border bg-white transition-all ${
                      editingBlackoutId === b.id
                        ? "border-blue-200 bg-blue-50/30 shadow-sm"
                        : "border-gray-200 hover:border-amber-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left */}
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Icon */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            b.is_full_day ? "bg-amber-50" : "bg-blue-50"
                          }`}
                        >
                          <CalendarOff
                            className={`h-4.5 w-4.5 ${
                              b.is_full_day ? "text-secondary" : "text-blue-600"
                            }`}
                          />
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {b.title}
                            </p>

                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                                b.is_full_day
                                  ? "bg-amber-50 text-secondary"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {b.is_full_day ? "Full day" : "Partial"}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">
                              {b.date}
                            </span>

                            <span className="text-gray-300">•</span>

                            <span>
                              {b.is_full_day
                                ? "Unavailable all day"
                                : `${formatTime(
                                    b.start_time || "",
                                  )} – ${formatTime(b.end_time || "")}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex shrink-0 items-center gap-1 border-t border-gray-100 pt-2 sm:border-0 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => startEditBlackout(b)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-secondary transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlackoutDeleteTarget(b.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
