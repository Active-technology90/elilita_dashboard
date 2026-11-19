
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Clock,
  User,
  Phone,
  CheckCircle,
  Loader2,
  Briefcase,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import type { ServiceStaff, StaffScheduleResponse } from "../../../types";
import { getManageStaffSchedule } from "../../../services/api";

interface StaffScheduleModalProps {
  isOpen: boolean;
  staff: ServiceStaff | null;
  companySlug: string;
  onClose: () => void;
}

const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const StaffScheduleModal: React.FC<StaffScheduleModalProps> = ({
  isOpen,
  staff,
  companySlug,
  onClose,
}) => {
  const { t } = useTranslation("staffForm");

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const [scheduleData, setScheduleData] =
    useState<StaffScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    if (!staff || !companySlug || !selectedDate) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getManageStaffSchedule(companySlug, staff.id, {
        date: selectedDate,
      });
      setScheduleData(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || t("schedule.errors.loadFailed"),
      );
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  }, [companySlug, staff, selectedDate, t]);

  useEffect(() => {
    if (isOpen && staff) {
      fetchSchedule();
    }
  }, [isOpen, staff, fetchSchedule]);

  if (!isOpen || !staff) return null;

  const setDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setSelectedDate(iso);
  };

  const statusColors: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    confirmed: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    in_progress: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    completed: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    no_show: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    },
  };

  const appointments = scheduleData?.booked_appointments || [];
  const vacantSlots = scheduleData?.vacant_slots || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-secondary flex items-center justify-center font-bold text-lg shadow-sm border border-purple-200">
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {staff.name}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    staff.is_online
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {staff.is_online
                    ? t("schedule.online")
                    : t("schedule.offline")}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {staff.role_title || t("table.specialist")} •{" "}
                {t("schedule.shift")}: {staff.start_time?.slice(0, 5)} -{" "}
                {staff.end_time?.slice(0, 5)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={t("schedule.close")}
            title={t("schedule.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Selector Bar */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDateOffset(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === new Date().toISOString().split("T")[0]
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {t("schedule.today")}
            </button>
            <button
              onClick={() => setDateOffset(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
            >
              {t("schedule.tomorrow")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-secondary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-secondary focus:outline-none"
              aria-label={t("schedule.selectDate")}
            />
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-secondary mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500">
                {t("schedule.loading")}
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : (
            <>
              {/* Working Day Alert */}
              {scheduleData && !scheduleData.is_working_day && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">
                      {t("schedule.offDutyOn")}{" "}
                      {t(
                        `weekdays.${WEEKDAY_KEYS[scheduleData.weekday]}`,
                        {
                          defaultValue: t("schedule.thisDay"),
                        },
                      )}
                    </h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {t("schedule.notScheduled", { name: staff.name })}
                    </p>
                  </div>
                </div>
              )}

              {/* Day Metrics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
                    {t("schedule.bookedAppointments")}
                  </span>
                  <p className="text-2xl font-bold text-secondary">
                    {appointments.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("schedule.scheduledFor")} {selectedDate}
                  </p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    {t("schedule.vacantTimeSlots")}
                  </span>
                  <p className="text-2xl font-bold text-emerald-700">
                    {vacantSlots.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t("schedule.availableSlotsInShift")}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    {t("schedule.shiftRange")}
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {staff.start_time?.slice(0, 5)} →{" "}
                    {staff.end_time?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {staff.is_online
                      ? t("schedule.activeAndReady")
                      : t("schedule.currentlyOffline")}
                  </p>
                </div>
              </div>

              {/* Booked Appointments List */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-secondary" />
                  {t("schedule.appointmentsAndBookings")} (
                  {appointments.length})
                </h3>

                {appointments.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-gray-600">
                      {t("schedule.noBookings", { name: staff.name })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => {
                      const sc =
                        statusColors[apt.status] || statusColors.pending;

                      return (
                        <div
                          key={apt.booking_id}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-purple-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-gray-900">
                                {apt.scheduled_time}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}
                              >
                                {t(`schedule.statuses.${apt.status}`, {
                                  defaultValue: apt.status.toUpperCase(),
                                })}
                              </span>
                              <span className="text-xs font-semibold text-secondary">
                                #{apt.booking_id}
                              </span>
                            </div>

                            <p className="text-sm font-bold text-gray-800">
                              {apt.service_title}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                {apt.customer_name}
                              </span>
                              {apt.customer_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                                  {apt.customer_phone}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right sm:border-l sm:border-gray-100 sm:pl-4">
                            <div className="text-sm font-bold text-gray-900">
                              {parseFloat(apt.quoted_price).toLocaleString()}{" "}
                              {apt.currency}
                            </div>
                            <div className="text-[11px] text-gray-400 font-medium">
                              {t("schedule.minutes", {
                                count: apt.duration_minutes,
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vacant Slots Grid */}
              {vacantSlots.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    {t("schedule.availableFreeTimeSlots")} (
                    {vacantSlots.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {vacantSlots.map((slot) => (
                      <span
                        key={slot}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
