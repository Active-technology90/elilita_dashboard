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
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useAvailability } from "../../../hooks/useAvailability";
import { formatDate, formatTime as formatLocalizedTime } from "../../../utils/dateFormatter";
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
import { CustomSelect } from "../../ui/CustomSelect";
// import type { ValidationResult } from "../../../types/validation";

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
  <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] sm:text-xs font-medium text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-sm sm:text-xl font-semibold text-gray-900">
          {value}
        </p>
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
  const { t, i18n } = useTranslation("availability");

  const dayInfo = (() => {
    const labels = [
      t("days.monday"),
      t("days.tuesday"),
      t("days.wednesday"),
      t("days.thursday"),
      t("days.friday"),
      t("days.saturday"),
      t("days.sunday"),
    ];
    return { value: day, label: labels[day] ?? t("days.unknown") };
  })();
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
          {hasSlots ? t("status.open") : t("status.closed")}
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
                    {t("slot.maxBookings", { count: slot.max_bookings })}
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
        <p className="text-sm text-gray-400 mt-2 italic">{t("noAvailability")}</p>
      )}

      <button
        onClick={() => onAddClick(day)}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
      >
        <Plus className="h-4 w-4" />
        {hasSlots ? t("addTimeSlot") : t("addAvailability")}
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
  const { t, i18n } = useTranslation("availability");

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
      const msg = extractErrorMessage(err, t("errors.saveSlotFailed"));

      setFieldErrors({
        general: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const dayLabels = [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ];
  const DAYS = [
    { value: 0, label: dayLabels[0] },
    { value: 1, label: dayLabels[1] },
    { value: 2, label: dayLabels[2] },
    { value: 3, label: dayLabels[3] },
    { value: 4, label: dayLabels[4] },
    { value: 5, label: dayLabels[5] },
    { value: 6, label: dayLabels[6] },
  ];

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
            {isEdit ? t("slotModal.editTitle") : t("slotModal.addTitle")}
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
              {t("slotModal.day")}
            </label>
            <CustomSelect
              value={String(form.day_of_week)}
              onChange={(value) => handleChange("day_of_week", Number(value))}
              options={DAYS.map((day) => ({
                value: String(day.value),
                label: day.label,
              }))}
              placeholder={t("slotModal.selectDay")}
              className={`w-full ${
                fieldErrors.day_of_week
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-secondary"
              }`}
            />

            {fieldErrors.day_of_week && (
              <p className="text-red-600 text-xs mt-1">
                {fieldErrors.day_of_week}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("slotModal.startTime")}
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
                {t("slotModal.endTime")}
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
              {t("slotModal.maxBookings")}
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
              {t("slotModal.cancel")}
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
              {isEdit ? t("slotModal.update") : t("slotModal.save")}
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
  const { t, i18n } = useTranslation("availability");

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
    title: t("defaultBlackoutTitle"),
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

  return formatLocalizedTime(
    `2000-01-01T${time}`,
    i18n.language,
  );
};

  // ---------- Early returns ----------
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

  if (!isServiceCompany) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={t("notService.title")}
          description={t("notService.description")}
          icon={Calendar}
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
                  company: company?.name || t("notService.fallbackCompany"),
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

      showToast("success", t("toasts.slotUpdated"));
    } else {
      await create({
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        max_bookings: data.max_bookings,
        is_active: true,
      });

      showToast("success", t("toasts.slotAdded"));
    }
  };

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
        showToast("success", t("toasts.slotRemoved"));
      } catch (err: any) {
        showToast(
          "error",
          extractErrorMessage(err, t("errors.removeSlotFailed")),
        );
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
      title: t("defaultBlackoutTitle"),
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
        showToast("success", t("toasts.closureUpdated"));
        setEditingBlackoutId(null);
      } else {
        await createBlackoutDate(companySlug, payload);
        showToast("success", t("toasts.closureAdded"));
      }

      setBlackoutForm({
        title: t("defaultBlackoutTitle"),
        date: "",
        is_full_day: true,
        start_time: "09:00",
        end_time: "17:00",
      });
      setBlackoutErrors({});
      fetchBlackouts();
    } catch (err: any) {
      showToast(
        "error",
        extractErrorMessage(err, t("errors.saveClosureFailed")),
      );
    } finally {
      setBlackoutSubmitting(false);
    }
  };

  const handleDeleteBlackout = async (id: number) => {
    if (!companySlug) return;
    try {
      await deleteBlackoutDate(companySlug, id);
      showToast("success", t("toasts.blackoutRemoved"));
      fetchBlackouts();
    } catch (err: any) {
      showToast(
        "error",
        extractErrorMessage(err, t("errors.removeBlackoutFailed")),
      );
    }
  };

  // Day labels for delete modal title
  const dayLabels = [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ];

  // ---------- Render ----------
  return (
    <>
      <Toast toast={toast} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={t("deleteSlotTitle", {
          day:
            dayLabels[deleteTarget?.day_of_week ?? -1] ?? "",
        })}
        onConfirm={confirmDeleteSlot}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConfirmModal
        isOpen={blackoutDeleteTarget !== null}
        title={t("deleteBlackoutTitle")}
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
          title={company?.name || undefined}
          description={t("page.description")}
          icon={Calendar}
          eyebrow={t("page.eyebrow")}
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

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            icon={Calendar}
            label={t("summary.workingDays")}
            value={summary.workingDays}
            color="bg-purple-600"
          />
          <StatCard
            icon={Clock}
            label={t("summary.totalSlots")}
            value={summary.totalSlots}
            color="bg-blue-600"
          />
          <StatCard
            icon={Users}
            label={t("summary.maxBookings")}
            value={summary.maxDaily}
            color="bg-emerald-600"
          />
          <StatCard
            icon={Calendar}
            label={t("summary.weeklyHours")}
            value={`${summary.weeklyHours}h`}
            color="bg-indigo-600"
          />
          <StatCard
            icon={CalendarOff}
            label={t("summary.blockedDates")}
            value={summary.blockedDates}
            color="bg-secondary"
          />
        </div>

        {/* Weekly Schedule */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t("weeklySchedule.title")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("weeklySchedule.subtitle")}
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
              <span className="hidden md:block">{t("addAvailability")}</span>
              <span className=" md:hidden">{t("addShort")}</span>
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
              {[0, 1, 2, 3, 4, 5, 6].map((dayValue) => (
                <DayCard
                  key={dayValue}
                  day={dayValue}
                  slots={groupedSlots[dayValue] || []}
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
                    {t("blackouts.title")}
                  </h3>

                  {!blackoutLoading && blackouts.length > 0 && (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                      {blackouts.length}
                    </span>
                  )}

                  {editingBlackoutId && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {t("blackouts.editing")}
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-xs text-gray-500">
                  {t("blackouts.subtitle")}
                </p>
              </div>
            </div>

            {editingBlackoutId && (
              <button
                type="button"
                onClick={cancelEditBlackout}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              >
                {t("blackouts.cancelEditing")}
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
                  {editingBlackoutId
                    ? t("blackouts.form.editTitle")
                    : t("blackouts.form.addTitle")}
                </p>

                <p className="mt-0.5 text-xs text-gray-400">
                  {editingBlackoutId
                    ? t("blackouts.form.editSubtitle")
                    : t("blackouts.form.addSubtitle")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Reason */}
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("blackouts.form.reason")}{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder={t("blackouts.form.reasonPlaceholder")}
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
                  {t("blackouts.form.date")}{" "}
                  <span className="text-red-500">*</span>
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
                  {t("blackouts.form.closureType")}
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
                    {t("blackouts.form.fullDay")}
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
                    {t("blackouts.form.partialHours")}
                  </button>
                </div>
              </div>

              {/* Partial Hours */}
              {!blackoutForm.is_full_day && (
                <>
                  <div className="lg:col-span-3">
                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                      {t("blackouts.form.startTime")}{" "}
                      <span className="text-red-500">*</span>
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
                      {t("blackouts.form.endTime")}{" "}
                      <span className="text-red-500">*</span>
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
                      {t("blackouts.form.saving")}
                    </>
                  ) : (
                    <>
                      {editingBlackoutId ? (
                        <>
                          <Pencil className="h-3.5 w-3.5" />
                          {t("blackouts.form.updateClosure")}
                        </>
                      ) : (
                        <>
                          <CalendarOff className="h-3.5 w-3.5" />
                          {t("blackouts.form.addClosure")}
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
                    {t("blackouts.form.cancel")}
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
                  {t("blackouts.list.title")}
                </h4>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {t("blackouts.list.subtitle")}
                </p>
              </div>

              {!blackoutLoading && blackouts.length > 0 && (
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                  {t("blackouts.list.count", { count: blackouts.length })}
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
                  {t("blackouts.list.emptyTitle")}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                  {t("blackouts.list.emptyDescription")}
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
                              {b.is_full_day
                                ? t("blackouts.list.fullDay")
                                : t("blackouts.list.partial")}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">
  {formatDate(b.date, i18n.language)}
</span>

                            <span className="text-gray-300">•</span>

                            <span>
                              {b.is_full_day
                                ? t("blackouts.list.unavailableAllDay")
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
                          {t("blackouts.list.edit")}
                        </button>

                        <button
                          type="button"
                          onClick={() => setBlackoutDeleteTarget(b.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("blackouts.list.delete")}
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