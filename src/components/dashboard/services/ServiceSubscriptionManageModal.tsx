import React, { useState, useEffect } from "react";
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
      onShowToast("success", "Subscription status updated successfully.");
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || "Failed to update subscription status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      await generateSubscriptionInvoice(companySlug, subscription.id, "chapa");
      onShowToast("success", "Next cycle invoice generated successfully.");
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || "Failed to generate invoice.",
      );
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleReceiptAction = (receiptId: number, action: "approved" | "rejected") => {
    setPendingReviewReceipt({ id: receiptId, action });
  };

  const handleConfirmReceiptReview = async () => {
    if (!pendingReviewReceipt) return;
    const { id, action } = pendingReviewReceipt;
    try {
      setSubmittingReceiptId(id);
      await reviewReceipt(id, {
        status: action,
        admin_notes: action === "rejected" ? reviewNotes || "Receipt rejected" : undefined,
      });
      onShowToast(
        "success",
        action === "approved"
          ? "Receipt approved! Subscription invoice marked as paid."
          : "Receipt rejected. Customer will be notified to re-upload.",
      );
      setPendingReviewReceipt(null);
      setReviewNotes("");
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || `Failed to ${action} receipt.`,
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
      onShowToast("success", "Session log recorded successfully.");
      setShowLogForm(false);
      setLogNotes("");
      fetchSessionLogs();
      onUpdated();
    } catch (err: any) {
      onShowToast(
        "error",
        err?.response?.data?.detail || "Failed to record session log.",
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
                  Subscription #{subscription.id}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusColors[subscription.status]?.bg || "bg-gray-100"
                  } ${statusColors[subscription.status]?.text || "text-gray-800"}`}
                >
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Client:{" "}
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
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
          {[
            { key: "overview", label: "Contract Overview", icon: FileText },
            {
              key: "invoices",
              label: `Invoices (${subscription.invoices?.length || 0})`,
              icon: DollarSign,
            },
            {
              key: "sessions",
              label: `Session Logs (${sessionLogs.length})`,
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
                    Service Offering
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {subscription.offering?.title || "Custom Recurring Service"}
                  </p>
                  <p className="text-xs text-purple-700 font-semibold mt-1">
                    {subscription.billing_cycle.toUpperCase()} BILLING
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Cycle Fee
                  </span>
                  <p className="text-base font-bold text-gray-900">
                    {parseFloat(subscription.cycle_amount).toLocaleString()}{" "}
                    {subscription.currency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    per {subscription.billing_cycle}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Next Billing Date
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {subscription.next_billing_date || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Commenced: {subscription.start_date}
                  </p>
                </div>
              </div>

              {/* Specialist / Tutor Assignment */}
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-secondary" /> Assigned
                  Specialist / Tutor
                </h4>
                <p className="text-sm font-semibold text-gray-800">
                  {subscription.assigned_staff?.name ||
                    "No specialist assigned"}
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
                      <FileText className="h-4 w-4 text-secondary" /> Client
                      Intake Form Details
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
                                  ? "Yes"
                                  : "No"
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
                  Contract Lifecycle & Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-secondary focus:outline-none"
                    >
                      <option value="active">Active (Ongoing)</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                      Internal Admin Notes
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Special contract notes or student progress"
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
                    Save Contract Status
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
                    Periodic Billing Invoices
                  </h4>
                  <p className="text-xs text-gray-500">
                    Each billing cycle generates an invoice with payment
                    tracking.
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
                    Generate Next Invoice
                  </button>
                )}
              </div>

              {!subscription.invoices || subscription.invoices.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-600">
                    No invoices generated yet
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
                              Invoice #{inv.id}
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
                              {inv.status.toUpperCase()}
                            </span>
                            {inv.payment_method && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                                {inv.payment_method.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Period: {inv.billing_period_start} →{" "}
                            {inv.billing_period_end} | Due: {inv.due_date}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-gray-900">
                            {parseFloat(inv.amount).toLocaleString()}{" "}
                            {inv.currency}
                          </span>
                          {inv.paid_at && (
                            <span className="text-xs text-emerald-600 block mt-0.5">
                              Paid at:{" "}
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
                                  alt="Receipt"
                                  className="w-full h-full object-cover hover:scale-105 transition"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-gray-800">
                                Bank Transfer: {inv.receipt.bank_name || "Bank Deposit"}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Amount: {inv.receipt.amount} ETB
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
                                  {inv.receipt.status === "approved"
                                    ? "Verified"
                                    : inv.receipt.status === "rejected"
                                      ? "Rejected"
                                      : "Pending Verification"}
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
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReceiptAction(inv.receipt.id, "rejected")}
                                disabled={submittingReceiptId === inv.receipt.id}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50"
                              >
                                Reject
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
                    Attendance & Session Tracking
                  </h4>
                  <p className="text-xs text-gray-500">
                    Log classes, sessions, homework, and student attendance.
                  </p>
                </div>

                <button
                  onClick={() => setShowLogForm(!showLogForm)}
                  className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#533f84] shadow-sm transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showLogForm ? "Cancel" : "Log Attendance"}
                </button>
              </div>

              {/* Log Session Form */}
              {showLogForm && (
                <form
                  onSubmit={handleCreateSessionLog}
                  className="bg-white p-5 rounded-2xl border border-purple-200 shadow-md space-y-4 animate-in fade-in"
                >
                  <h4 className="text-sm font-bold text-secondary">
                    Record New Session
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                        Date *
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
                        Time
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
                        Status
                      </label>
                      <select
                        value={logStatus}
                        onChange={(e) => setLogStatus(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                      >
                        <option value="attended">Attended</option>
                        <option value="missed">Missed</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="cancelled_by_student">
                          Cancelled by Student
                        </option>
                        <option value="cancelled_by_tutor">
                          Cancelled by Tutor
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Specialist / Tutor
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
                      <option value="">Select specialist...</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role_title || "Staff"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Session Notes & Homework Assigned
                    </label>
                    <textarea
                      rows={2}
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="e.g. Chapter 4 covered, assigned calculus problems 1-10"
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
                      Save Record
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
                    No session attendance records logged yet
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
                            {log.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        {log.tutor_or_staff_name && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            Conducted by: {log.tutor_or_staff_name}
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
              alt="Receipt Preview"
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
            ? "Approve Bank Receipt"
            : "Reject Bank Receipt"
        }
        description={
          pendingReviewReceipt?.action === "approved"
            ? "Are you sure you want to approve this bank transfer receipt? The subscription invoice will be marked as paid and the subscription activated."
            : "Are you sure you want to reject this receipt? The customer will receive a notification to re-upload their bank receipt."
        }
        confirmText={
          pendingReviewReceipt?.action === "approved"
            ? "Approve Receipt"
            : "Reject Receipt"
        }
        confirmVariant={
          pendingReviewReceipt?.action === "approved" ? "primary" : "danger"
        }
        loading={Boolean(submittingReceiptId)}
      />
    </div>
  );
};
