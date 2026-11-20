
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Loader2,
  DollarSign,
  User,
  FileText,
  Plus,
  Repeat,
  BookOpen,
} from "lucide-react";
import type {
  ServiceSubscription,
  ServiceSessionLog,
  ServiceStaff,
} from "../../../types";
import {
  updateManageSubscriptionStatus,
  generateSubscriptionInvoice,
  getSubscriptionSessionLogs,
  createSubscriptionSessionLog,
  getManageStaff,
  reviewReceipt,
} from "../../../services/api";
import { ConfirmationModal } from "../../ui/confimationModal";

interface ServiceSubscriptionManageModalProps {
  isOpen: boolean;
  subscription: ServiceSubscription | null;
  companySlug: string;
  onClose: () => void;
  onUpdated: () => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

export const ServiceSubscriptionManageModal: React.FC<
  ServiceSubscriptionManageModalProps
> = ({
  isOpen,
  subscription,
  companySlug,
  onClose,
  onUpdated,
  onShowToast,
}) => {
  const { t } = useTranslation("serviceSubscriptionManage");

  const [activeTab, setActiveTab] = useState<
    "overview" | "invoices" | "sessions"
  >("overview");

  // Status update state
  const [selectedStatus, setSelectedStatus] =
    useState<ServiceSubscription["status"]>("active");
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Invoices state
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Sessions state
  const [sessionLogs, setSessionLogs] = useState<ServiceSessionLog[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [staffList, setStaffList] = useState<ServiceStaff[]>([]);

  // Log session form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [logTime, setLogTime] = useState("10:00");
  const [logStaffId, setLogStaffId] = useState<number | undefined>(undefined);
  const [logStatus, setLogStatus] =
    useState<ServiceSessionLog["status"]>("attended");
  const [logNotes, setLogNotes] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  // Bank Transfer Receipt Review State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingReviewReceipt, setPendingReviewReceipt] = useState<{
    id: number;
    action: "approved" | "rejected";
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReceiptId, setSubmittingReceiptId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (subscription) {
      setSelectedStatus(subscription.status);
      setAdminNotes(subscription.admin_notes || "");
      setActiveTab("overview");
      fetchSessionLogs();
    }
  }, [subscription]);

  useEffect(() => {
    if (isOpen && companySlug) {
      getManageStaff(companySlug)
        .then((res) => setStaffList(res.data || []))
        .catch(() => setStaffList([]));
    }
  }, [isOpen, companySlug]);

  const fetchSessionLogs = async () => {
    if (!subscription) return;
    try {
      setLoadingSessions(true);
      const res = await getSubscriptionSessionLogs(
        companySlug,
        subscription.id,
      );
      setSessionLogs(res.data || []);
    } catch {
      setSessionLogs([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  if (!isOpen || !subscription) return null;

  const handleUpdateStatus = async () => {
    try {
      setUpdatingStatus(true);
      await updateManageSubscriptionStatus(companySlug, subscription.id, {
        status: selectedStatus,
        admin_notes: adminNotes,
      });
      onShowToast("success", t("messages.statusUpdated"));
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || t("errors.updateStatusFailed"),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      await generateSubscriptionInvoice(companySlug, subscription.id, "chapa");
      onShowToast("success", t("messages.invoiceGenerated"));
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || t("errors.generateInvoiceFailed"),
      );
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleReceiptAction = (
    receiptId: number,
    action: "approved" | "rejected",
  ) => {
    setPendingReviewReceipt({ id: receiptId, action });
  };

  const handleConfirmReceiptReview = async () => {
    if (!pendingReviewReceipt) return;
    const { id, action } = pendingReviewReceipt;
    try {
      setSubmittingReceiptId(id);
      await reviewReceipt(id, {
        status: action,
        admin_notes:
          action === "rejected"
            ? reviewNotes || t("receipt.defaultRejectedNote")
            : undefined,
      });
      onShowToast(
        "success",
        action === "approved"
          ? t("messages.receiptApproved")
          : t("messages.receiptRejected"),
      );
      setPendingReviewReceipt(null);
      setReviewNotes("");
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail ||
          t("errors.reviewReceiptFailed", { action: t(`actions.${action}`) }),
      );
    } finally {
      setSubmittingReceiptId(null);
    }
  };

  const handleCreateSessionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSession(true);
      await createSubscriptionSessionLog(companySlug, subscription.id, {
        scheduled_date: logDate,
        scheduled_time: logTime,
        tutor_or_staff: logStaffId,
        status: logStatus,
        session_notes: logNotes,
      });
      onShowToast("success", t("messages.sessionRecorded"));
      setShowLogForm(false);
      setLogNotes("");
      fetchSessionLogs();
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || t("errors.recordSessionFailed"),
      );
    } finally {
      setSavingSession(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: "bg-emerald-100", text: "text-emerald-800" },
    paused: { bg: "bg-blue-100", text: "text-blue-800" },
    completed: { bg: "bg-purple-100", text: "text-purple-800" },
    cancelled: { bg: "bg-red-100", text: "text-red-800" },
  };

  const statusLabels: Record<string, string> = {
    active: t("statuses.active"),
    paused: t("statuses.paused"),
    completed: t("statuses.completed"),
    cancelled: t("statuses.cancelled"),
  };

  const sessionStatusLabels: Record<string, string> = {
    attended: t("sessionStatuses.attended"),
    missed: t("sessionStatuses.missed"),
    rescheduled: t("sessionStatuses.rescheduled"),
    cancelled_by_student: t("sessionStatuses.cancelledByStudent"),
    cancelled_by_tutor: t("sessionStatuses.cancelledByTutor"),
  };

  const receiptStatusLabels: Record<string, string> = {
    approved: t("receipt.statuses.verified"),
    rejected: t("receipt.statuses.rejected"),
    pending: t("receipt.statuses.pending"),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-secondary rounded-xl">
              <Repeat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {t("header.subscriptionNumber", { id: subscription.id })}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusColors[subscription.status]?.bg || "bg-gray-100"
                  } ${statusColors[subscription.status]?.text || "text-gray-800"}`}
                >
                  {statusLabels[subscription.status] ||
                    subscription.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("header.client")}:{" "}
                <span className="font-semibold text-gray-700">
                  {subscription.customer_name}
                </span>{" "}
                {subscription.customer_phone
                  ? `(${subscription.customer_phone})`
                  : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label={t("actions.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
          {[
            { key: "overview", label: t("tabs.overview"), icon: FileText },
            {
              key: "invoices",
              label: t("tabs.invoices", {
                count: subscription.invoices?.length || 0,
              }),
              icon: DollarSign,
            },
            {
              key: "sessions",
              label: t("tabs.sessions", { count: sessionLogs.length }),
              icon: BookOpen,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-sm border-b-2 transition-all ${
                  isActive
                    ? "border-secondary text-secondary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Contract Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t("overview.serviceOffering")}
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {subscription.offering?.title ||
                      t("overview.customRecurringService")}
                  </p>
                  <p className="text-xs text-purple-700 font-semibold mt-1">
                    {t(`billingCycles.${subscription.billing_cycle}`)}{" "}
                    {t("overview.billing")}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t("overview.cycleFee")}
                  </span>
                  <p className="text-base font-bold text-gray-900">
                    {parseFloat(subscription.cycle_amount).toLocaleString()}{" "}
                    {subscription.currency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("overview.perCycle", {
                      cycle: t(`billingCycles.${subscription.billing_cycle}`),
                    })}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    {t("overview.nextBillingDate")}
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {subscription.next_billing_date || t("common.notAvailable")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("overview.commenced")}: {subscription.start_date}
                  </p>
                </div>
              </div>

              {/* Specialist / Tutor Assignment */}
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-secondary" />{" "}
                  {t("overview.assignedSpecialist")}
                </h4>
                <p className="text-sm font-semibold text-gray-800">
                  {subscription.assigned_staff?.name ||
                    t("overview.noSpecialistAssigned")}
                  {subscription.assigned_staff?.role_title
                    ? ` — ${subscription.assigned_staff.role_title}`
                    : ""}
                </p>
              </div>

              {/* Client Intake Form Data */}
              {subscription.intake_data &&
                Object.keys(subscription.intake_data).length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-secondary" />{" "}
                      {t("overview.intakeFormDetails")}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(subscription.intake_data).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                          >
                            <span className="text-xs text-gray-500 font-medium capitalize block">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                              {typeof val === "boolean"
                                ? val
                                  ? t("common.yes")
                                  : t("common.no")
                                : Array.isArray(val)
                                  ? val.join(", ")
                                  : String(val || "-")}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Status Update Form */}
              <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 space-y-4">
                <h4 className="text-sm font-bold text-gray-900">
                  {t("overview.contractLifecycle")}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                      {t("fields.status")}
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-secondary focus:outline-none"
                    >
                      <option value="active">{t("statuses.activeOngoing")}</option>
                      <option value="paused">{t("statuses.paused")}</option>
                      <option value="completed">{t("statuses.completed")}</option>
                      <option value="cancelled">{t("statuses.cancelled")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                      {t("fields.internalAdminNotes")}
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={t("placeholders.adminNotes")}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    className="flex items-center gap-2 bg-secondary hover:bg-[#533f84] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    {updatingStatus && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {t("actions.saveContractStatus")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Invoices */}
          {activeTab === "invoices" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {t("invoices.periodicBillingInvoices")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t("invoices.description")}
                  </p>
                </div>

                {subscription.status === "active" && (
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={generatingInvoice}
                    className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#533f84] shadow-sm transition-all disabled:opacity-50"
                  >
                    {generatingInvoice ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {t("actions.generateNextInvoice")}
                  </button>
                )}
              </div>

              {!subscription.invoices || subscription.invoices.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">
                    {t("invoices.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscription.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {t("invoices.invoiceNumber", { id: inv.id })}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                inv.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inv.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {t(`invoiceStatuses.${inv.status}`, {
                                defaultValue: inv.status.toUpperCase(),
                              })}
                            </span>
                            {inv.payment_method && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                                {t(`paymentMethods.${inv.payment_method}`, {
                                  defaultValue: inv.payment_method.replace(/_/g, " "),
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {t("invoices.period")}: {inv.billing_period_start} →{" "}
                            {inv.billing_period_end} | {t("invoices.due")}: {inv.due_date}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-gray-900">
                            {parseFloat(inv.amount).toLocaleString()}{" "}
                            {inv.currency}
                          </span>
                          {inv.paid_at && (
                            <span className="text-xs text-emerald-600 block mt-0.5">
                              {t("invoices.paidAt")}:{" "}
                              {new Date(inv.paid_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bank Transfer Receipt Details */}
                      {inv.receipt && (
                        <div className="mt-2 pt-3 border-t border-gray-100 bg-purple-50/40 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {inv.receipt.receipt_image && (
                              <div
                                onClick={() => setPreviewImage(inv.receipt.receipt_image)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in bg-white flex-shrink-0"
                              >
                                <img
                                  src={inv.receipt.receipt_image}
                                  alt={t("receipt.imageAlt")}
                                  className="w-full h-full object-cover hover:scale-105 transition"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-gray-800">
                                {t("receipt.bankTransfer")}: {inv.receipt.bank_name || t("receipt.bankDeposit")}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t("receipt.amount")}: {inv.receipt.amount} ETB
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    inv.receipt.status === "approved"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : inv.receipt.status === "rejected"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-amber-100 text-amber-800 animate-pulse"
                                  }`}
                                >
                                  {receiptStatusLabels[inv.receipt.status] ||
                                    inv.receipt.status}
                                </span>
                                {inv.receipt.admin_notes && (
                                  <span className="text-[11px] text-gray-500 italic">
                                    "{inv.receipt.admin_notes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {inv.receipt.status === "pending" && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() => handleReceiptAction(inv.receipt.id, "approved")}
                                disabled={submittingReceiptId === inv.receipt.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                              >
                                {t("actions.approve")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReceiptAction(inv.receipt.id, "rejected")}
                                disabled={submittingReceiptId === inv.receipt.id}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                              >
                                {t("actions.reject")}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Session Logs */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {t("sessions.attendanceTracking")}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t("sessions.description")}
                  </p>
                </div>

                <button
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#533f84] shadow-sm transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showLogForm ? t("actions.cancel") : t("actions.logAttendance")}
                </button>
              </div>

              {/* Log Session Form */}
              {showLogForm && (
                <form
                  onSubmit={handleCreateSessionLog}
                  className="bg-white p-5 rounded-2xl border border-purple-200 shadow-md space-y-4 animate-in fade-in"
                >
                  <h4 className="text-sm font-bold text-secondary">
                    {t("sessions.recordNewSession")}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        {t("fields.date")} *
                      </label>
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        {t("fields.time")}
                      </label>
                      <input
                        type="time"
                        value={logTime}
                        onChange={(e) => setLogTime(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        {t("fields.status")}
                      </label>
                      <select
                        value={logStatus}
                        onChange={(e) => setLogStatus(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                      >
                        <option value="attended">{t("sessionStatuses.attended")}</option>
                        <option value="missed">{t("sessionStatuses.missed")}</option>
                        <option value="rescheduled">{t("sessionStatuses.rescheduled")}</option>
                        <option value="cancelled_by_student">
                          {t("sessionStatuses.cancelledByStudent")}
                        </option>
                        <option value="cancelled_by_tutor">
                          {t("sessionStatuses.cancelledByTutor")}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      {t("fields.specialistTutor")}
                    </label>
                    <select
                      value={logStaffId || ""}
                      onChange={(e) =>
                        setLogStaffId(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="">{t("placeholders.selectSpecialist")}</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role_title || t("common.staff")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      {t("fields.sessionNotesHomework")}
                    </label>
                    <textarea
                      rows={2}
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder={t("placeholders.sessionNotes")}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSession}
                      className="flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#533f84] shadow-sm disabled:opacity-50"
                    >
                      {savingSession && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {t("actions.saveRecord")}
                    </button>
                  </div>
                </form>
              )}

              {/* Session Logs List */}
              {loadingSessions ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-secondary mx-auto" />
                </div>
              ) : sessionLogs.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">
                    {t("sessions.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {log.scheduled_date}{" "}
                            {log.scheduled_time
                              ? `@ ${log.scheduled_time}`
                              : ""}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              log.status === "attended"
                                ? "bg-emerald-100 text-emerald-800"
                                : log.status === "missed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {sessionStatusLabels[log.status] ||
                              log.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        {log.tutor_or_staff_name && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            {t("sessions.conductedBy")}: {log.tutor_or_staff_name}
                          </p>
                        )}
                        {log.session_notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            "{log.session_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={previewImage}
              alt={t("receipt.previewAlt")}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Receipt Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingReviewReceipt)}
        onClose={() => {
          setPendingReviewReceipt(null);
          setReviewNotes("");
        }}
        onConfirm={handleConfirmReceiptReview}
        title={
          pendingReviewReceipt?.action === "approved"
            ? t("confirmation.approveTitle")
            : t("confirmation.rejectTitle")
        }
        description={
          pendingReviewReceipt?.action === "approved"
            ? t("confirmation.approveDescription")
            : t("confirmation.rejectDescription")
        }
        confirmText={
          pendingReviewReceipt?.action === "approved"
            ? t("confirmation.approveButton")
            : t("confirmation.rejectButton")
        }
        confirmVariant={
          pendingReviewReceipt?.action === "approved" ? "primary" : "danger"
        }
        loading={Boolean(submittingReceiptId)}
      />
    </div>
  );
};
