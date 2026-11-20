
import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Star,
  Clock,
  Trash2,
  Edit,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ServiceStaff, ServiceOffering } from "../../../types";

const PRIMARY_COLOR = "#6750A4";

/* -------------------------------------------------------------------------- */
/*  AnimatedCounter (robust, reduced‑motion aware)                            */
/* -------------------------------------------------------------------------- */
const AnimatedCounter = ({
  value,
  duration = 800,
}: {
  value: number | string;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const end = Number(value);
    if (isNaN(end) || end === prevValue.current) return;
    const start = prevValue.current;
    const diff = end - start;
    if (diff === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setDisplayValue(end);
      prevValue.current = end;
      return;
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplayValue(Math.round(current));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
        prevValue.current = end;
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
};

/* -------------------------------------------------------------------------- */
/*  StatCard                                                                  */
/* -------------------------------------------------------------------------- */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  color = PRIMARY_COLOR,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}) => {
  const { t } = useTranslation("staffForm");
  const displayValue = typeof value === "number" ? value : Number(value);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
            {isNaN(displayValue) ? (
              "—"
            ) : (
              <AnimatedCounter value={displayValue} />
            )}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {trend > 0 ? (
                <ChevronUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend > 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {Math.abs(trend)}% {t("table.vsLastWeek")}
              </span>
            </div>
          )}
        </div>
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl"
        style={{ background: color }}
      />
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*  DeleteModal (accessible, responsive)                                      */
/* -------------------------------------------------------------------------- */
export const DeleteModal = ({
  staff,
  onConfirm,
  onClose,
}: {
  staff: ServiceStaff;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation("staffForm");
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    cancelBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          aria-label={t("deleteModal.close")}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            {staff.avatar ? (
              <img
                src={staff.avatar}
                alt={staff.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {staff.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3
            id="delete-modal-title"
            className="text-lg font-bold text-gray-900"
          >
            {t("deleteModal.title", { name: staff.name })}
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            {t("deleteModal.description")}
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            ref={cancelBtnRef}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t("deleteModal.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            {t("deleteModal.confirm")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Reusable Sub‑Components                                                   */
/* -------------------------------------------------------------------------- */

// Online/Offline indicator with accessible text
const StatusDot = ({ isOnline }: { isOnline: boolean | undefined | null }) => (
  <span
    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
      isOnline !== false ? "bg-emerald-500" : "bg-gray-300"
    }`}
    aria-hidden="true"
  />
);

// Staff Avatar component
const StaffAvatar = ({
  staff,
  size = "md",
}: {
  staff: ServiceStaff;
  size?: "sm" | "md";
}) => {
  const dims = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const fontSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="relative flex-shrink-0">
      {staff.avatar ? (
        <img
          src={staff.avatar}
          alt={staff.name}
          className={`${dims} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            // Fallback to letter avatar on broken image
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className={`${dims} rounded-full flex items-center justify-center font-bold text-white ${fontSize}`}
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {staff.name.charAt(0).toUpperCase()}
        </div>
      )}
      <StatusDot isOnline={staff.is_online} />
    </div>
  );
};

// Service badges with tooltip
const ServiceBadges = ({
  assignedIds,
  serviceMap,
}: {
  assignedIds: number[];
  serviceMap: Map<number, ServiceOffering>;
}) => {
  const { t } = useTranslation("staffForm");

  if (!assignedIds.length) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t("table.allServices")}
      </span>
    );
  }

  const visible = assignedIds.slice(0, 2);
  const overflow = assignedIds.length - 2;

  return (
    <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
      {visible.map((id) => {
        const service = serviceMap.get(id);
        const title = service?.title ?? t("table.service");

        return (
          <span
            key={id}
            title={title}
            className="inline-flex items-center max-w-[120px] px-2.5 py-1 rounded-full text-[11px] font-medium truncate border"
            style={{
              backgroundColor: `${PRIMARY_COLOR}10`,
              color: PRIMARY_COLOR,
              borderColor: `${PRIMARY_COLOR}25`,
            }}
          >
            <span className="truncate">{title}</span>
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-help transition-colors"
          title={assignedIds
            .slice(2)
            .map((id) => serviceMap.get(id)?.title ?? t("table.service"))
            .join(", ")}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

// Today status badge
const TodayStatus = ({ isToday }: { isToday: boolean }) => {
  const { t } = useTranslation("staffForm");

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        isToday ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-50"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isToday ? "bg-emerald-500" : "bg-gray-300"
        }`}
      />
      {isToday ? t("table.working") : t("table.off")}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*  StaffTable (exported)                                                     */
/* -------------------------------------------------------------------------- */
export const StaffTable = ({
  staff,
  offerings,
  onDeleteClick,
  onEdit,
  onScheduleClick,
  selectedIds,
  setSelectedIds,
  viewMode,
}: {
  staff: ServiceStaff[];
  offerings: ServiceOffering[];
  onDeleteClick: (staff: ServiceStaff) => void;
  onEdit: (member: ServiceStaff) => void;
  onScheduleClick?: (staff: ServiceStaff) => void;
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  viewMode: "table" | "card";
}) => {
  const { t } = useTranslation("staffForm");

  const today = useMemo(() => new Date().getDay(), []);
  const serviceMap = useMemo(
    () => new Map(offerings.map((s) => [s.id, s])),
    [offerings],
  );

  const allSelected = staff.length > 0 && selectedIds.length === staff.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < staff.length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(staff.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Differentiate empty states
  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {t("table.noSpecialistsFound")}
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          {t("table.noSpecialistsDescription")}
        </p>
      </div>
    );
  }

  // Card view used for mobile or explicit "card" mode on desktop
  const CardView = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {staff.map((member) => {
        const isToday = member.working_days?.includes(today) ?? false;

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <StaffAvatar staff={member} size="md" />
                <div>
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-xs text-gray-500">
                    {member.role_title || t("table.specialist")}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {onScheduleClick && (
                  <button
                    onClick={() => onScheduleClick(member)}
                    className="p-2 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10 transition-colors"
                    title={t("table.schedule")}
                    aria-label={t("table.scheduleFor", { name: member.name })}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(member)}
                  className="p-2 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10 transition-colors"
                  aria-label={t("table.edit", { name: member.name })}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteClick(member)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label={t("table.delete", { name: member.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">
                  {Number(member.average_rating).toFixed(1)}
                </span>
                <span className="text-gray-400 text-xs">
                  ({member.review_count ?? 0})
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {String(member.start_time || "09:00").slice(0, 5)} –{" "}
                  {String(member.end_time || "17:00").slice(0, 5)}
                </span>
              </div>
              <div>
                <ServiceBadges
                  assignedIds={member.assigned_service_ids || []}
                  serviceMap={serviceMap}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between">
              <TodayStatus isToday={isToday} />
              {member.is_online !== false && (
                <span className="text-xs text-gray-400">
                  {t("table.online")}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  // Table view (desktop)
  const TableView = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 sticky top-0">
            <tr>
              <th className="w-12 px-4 py-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    className="rounded border-gray-300 text-secondary focus:ring-secondary"
                    aria-label={t("table.selectAllStaff")}
                  />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("table.staff")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                {t("table.role")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                {t("table.services")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                {t("table.rating")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                {t("table.hours")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("table.today")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((member) => {
              const isToday = member.working_days?.includes(today) ?? false;

              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`${
                    selectedIds.includes(member.id)
                      ? "bg-secondary/5"
                      : "hover:bg-gray-50"
                  } transition-colors`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(member.id)}
                      onChange={() =>
                        setSelectedIds((prev) =>
                          prev.includes(member.id)
                            ? prev.filter((id) => id !== member.id)
                            : [...prev, member.id],
                        )
                      }
                      className="rounded border-gray-300 text-secondary focus:ring-secondary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StaffAvatar staff={member} size="sm" />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {member.name}
                        </div>
                        {member.name_am && (
                          <div className="text-xs text-gray-400">
                            {member.name_am}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-gray-700">
                      {member.role_title || t("table.specialist")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <ServiceBadges
                      assignedIds={member.assigned_service_ids || []}
                      serviceMap={serviceMap}
                    />
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {Number(member.average_rating).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({member.review_count ?? 0})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600 hidden sm:table-cell">
                    {String(member.start_time || "09:00").slice(0, 5)} –{" "}
                    {String(member.end_time || "17:00").slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TodayStatus isToday={isToday} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {onScheduleClick && (
                        <button
                          onClick={() => onScheduleClick(member)}
                          className="p-2 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10 transition-colors"
                          title={t("table.schedule")}
                          aria-label={t("table.scheduleFor", {
                            name: member.name,
                          })}
                        >
                          <CalendarDays className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(member)}
                        className="p-2 text-gray-400 hover:text-secondary rounded-lg hover:bg-secondary/10 transition-colors"
                        aria-label={t("table.edit", { name: member.name })}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(member)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label={t("table.delete", { name: member.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: force card view */}
      <div className="md:hidden">
        <CardView />
      </div>
      {/* Desktop: respect viewMode */}
      <div className="hidden md:block">
        {viewMode === "table" ? <TableView /> : <CardView />}
      </div>
    </>
  );
};
