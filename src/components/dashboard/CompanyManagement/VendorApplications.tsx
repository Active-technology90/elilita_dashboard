// src/components/dashboard/CompanyManagement/VendorApplications.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  User,
  MapPin,
  ExternalLink,
  FileText,
  ShieldCheck,
  Send,
  Loader2,
  X,
  Percent,
  Calendar,
} from "lucide-react";
import {
  getAdminVendorApplications,
  approveVendorApplication,
  requestVendorApplicationRevision,
  rejectVendorApplication,
  type VendorApplication,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  pending: {
    label: "Pending Review",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  revision_requested: {
    label: "Revision Requested",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  approved: {
    label: "Approved & Live",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export default function VendorApplications(): React.JSX.Element {
  const { toast, showToast } = useToast();

  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected for review modal
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);

  // Review actions state
  const [actionTab, setActionTab] = useState<"approve" | "revision" | "reject">("approve");
  const [platformFee, setPlatformFee] = useState<string>("2.50");
  const [graceMonths, setGraceMonths] = useState<number>(3);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [revisionFeedback, setRevisionFeedback] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminVendorApplications();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
      setApplications(list);
    } catch (err: any) {
      console.error("Failed to load vendor applications:", err);
      showToast("error", "Failed to load vendor applications.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = app.reference_code?.toLowerCase().includes(q);
        const matchesName = app.name?.toLowerCase().includes(q);
        const matchesTin = app.tin_number?.toLowerCase().includes(q);
        const matchesContact = app.contact_name?.toLowerCase().includes(q);
        const matchesEmail = app.contact_email?.toLowerCase().includes(q);
        return matchesRef || matchesName || matchesTin || matchesContact || matchesEmail;
      }
      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      revision_requested: applications.filter((a) => a.status === "revision_requested").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  }, [applications]);

  // Open review modal
  const handleOpenReview = (app: VendorApplication) => {
    setSelectedApp(app);
    setActionTab("approve");
    setPlatformFee("2.50");
    setGraceMonths(3);
    setAdminNotes(app.admin_notes || "");
    setRevisionFeedback(app.revision_feedback || "");
    setRejectionReason("");
  };

  // Action: Approve & Promote
  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      const res = await approveVendorApplication(selectedApp.id, {
        platform_fee_percent: platformFee,
        platform_fee_grace_period_months: graceMonths,
        admin_notes: adminNotes,
      });

      showToast(
        "success",
        res.data.message || "Company approved and owner onboarding email sent!"
      );

      // Update in state
      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: "approved",
                promoted_company_slug: res.data.company_slug,
                admin_notes: adminNotes,
              }
            : a
        )
      );
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Approval error:", err);
      const msg = err.response?.data?.detail || "Failed to approve application.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Request Revision
  const handleRequestRevision = async () => {
    if (!selectedApp) return;
    if (!revisionFeedback.trim()) {
      showToast("error", "Please provide revision feedback instructions for the vendor.");
      return;
    }

    try {
      setActionLoading(true);
      const res = await requestVendorApplicationRevision(selectedApp.id, {
        revision_feedback: revisionFeedback.trim(),
      });

      showToast(
        "success",
        res.data.message || "Revision request email dispatched to applicant."
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: "revision_requested",
                revision_feedback: revisionFeedback.trim(),
              }
            : a
        )
      );
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Revision request error:", err);
      const msg = err.response?.data?.detail || "Failed to request revision.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject
  const handleReject = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      const res = await rejectVendorApplication(selectedApp.id, {
        rejection_reason: rejectionReason.trim(),
      });

      showToast(
        "success",
        res.data.message || "Application rejected and vendor notified."
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: "rejected",
                admin_notes: rejectionReason.trim()
                  ? `${a.admin_notes || ""}\nRejection Reason: ${rejectionReason.trim()}`
                  : a.admin_notes,
              }
            : a
        )
      );
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Rejection error:", err);
      const msg = err.response?.data?.detail || "Failed to reject application.";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#6a5acd]/10 text-[#6a5acd] flex items-center justify-center font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Vendor Self-Registration Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review submitted Trade Licenses and compliance documents, request revisions, or approve & promote stores.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>{counts.pending} Pending Review</span>
          </div>

          <button
            type="button"
            onClick={fetchApplications}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Refresh applications"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#6a5acd]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All", count: counts.all },
            { id: "pending", label: "Pending", count: counts.pending },
            { id: "revision_requested", label: "Revisions", count: counts.revision_requested },
            { id: "approved", label: "Approved", count: counts.approved },
            { id: "rejected", label: "Rejected", count: counts.rejected },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#6a5acd] text-white shadow-xs shadow-[#6a5acd]/30"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Reference, Name, TIN..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[#6a5acd] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Loader2 className="h-8 w-8 text-[#6a5acd] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading vendor applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "No vendor applications match your selected filter criteria."
              : "No public vendor registration applications have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Ref Code & Date</th>
                  <th className="py-3.5 px-4">Business Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Applicant Contact</th>
                  <th className="py-3.5 px-4">TIN Number</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  const dateStr = new Date(app.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenReview(app)}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 group-hover:text-[#6a5acd] transition-colors">
                          {app.reference_code}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{dateStr}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{app.name}</div>
                        {app.name_am && (
                          <div className="text-[11px] text-slate-500">{app.name_am}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {app.category_name || "Uncategorized"}
                        </div>
                        {app.sub_category_name && (
                          <div className="text-[10px] text-slate-500">
                            {app.sub_category_name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{app.contact_name}</div>
                        <div className="text-[10px] text-slate-400">{app.contact_email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {app.tin_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReview(app);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#6a5acd] text-slate-700 hover:text-white text-xs font-semibold transition-all shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review KYC
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL REVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#6a5acd]/10 text-[#6a5acd] flex items-center justify-center font-bold">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedApp.name}</h3>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {selectedApp.reference_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted on {new Date(selectedApp.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    STATUS_CONFIG[selectedApp.status]?.bg
                  } ${STATUS_CONFIG[selectedApp.status]?.text} ${
                    STATUS_CONFIG[selectedApp.status]?.border
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedApp.status]?.dot}`} />
                  {STATUS_CONFIG[selectedApp.status]?.label}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Review Status Banners */}
              {selectedApp.status === "approved" && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-emerald-800 leading-relaxed font-medium">
                    This company was verified, approved, and promoted to an active store.
                    {selectedApp.promoted_company_slug && (
                      <span className="block text-[11px] font-mono mt-1 text-emerald-700">
                        Active Company Slug: <strong>{selectedApp.promoted_company_slug}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {selectedApp.status === "revision_requested" && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-blue-900">Revision has been requested:</div>
                    <div className="text-blue-800 mt-1 leading-relaxed">
                      {selectedApp.revision_feedback}
                    </div>
                  </div>
                </div>
              )}

              {selectedApp.status === "rejected" && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-900">This application was rejected.</div>
                    {selectedApp.admin_notes && (
                      <div className="text-rose-800 mt-1 leading-relaxed">
                        {selectedApp.admin_notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid 1: Details & Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proposed Business Profile */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#6a5acd]" />
                    Business Profile
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">English Name:</span>
                      <span className="font-bold text-slate-900">{selectedApp.name}</span>
                    </div>
                    {selectedApp.name_am && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amharic Name:</span>
                        <span className="font-semibold text-slate-800">{selectedApp.name_am}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedApp.category_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sub-Category:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedApp.sub_category_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Operating Type:</span>
                      <span className="font-semibold capitalize text-slate-800">
                        {selectedApp.business_type}
                      </span>
                    </div>
                    {selectedApp.description && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block mb-1">Overview:</span>
                        <p className="text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-100">
                          "{selectedApp.description}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact & Signatory Info */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#6a5acd]" />
                    Applicant & Signatory
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact Person:</span>
                      <span className="font-bold text-slate-900">{selectedApp.contact_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact Email:</span>
                      <span className="font-semibold text-slate-800">{selectedApp.contact_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone Number:</span>
                      <span className="font-semibold text-slate-800">{selectedApp.contact_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Authorized Signatory:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedApp.terms_signatory_name || selectedApp.contact_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Signatory Title:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedApp.terms_signatory_role || "Owner"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Terms Agreed:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Agreed on {new Date(selectedApp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location & GPS */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#6a5acd]" />
                    Location & GPS Pin
                  </h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 block mb-1">Premise Address:</span>
                      <p className="text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-100">
                        {selectedApp.address}
                      </p>
                    </div>
                    {selectedApp.latitude && selectedApp.longitude && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-mono text-slate-600">
                          {selectedApp.latitude}, {selectedApp.longitude}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${selectedApp.latitude},${selectedApp.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#6a5acd] font-bold hover:underline text-[11px]"
                        >
                          Open in Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal & Tax Compliance */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#6a5acd]" />
                    ERCA Tax Compliance
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">TIN Number:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedApp.tin_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tax Type:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {selectedApp.tax_type?.replace("_", " ")}
                      </span>
                    </div>
                    {selectedApp.vat_registration_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">VAT Number:</span>
                        <span className="font-mono text-slate-800">
                          {selectedApp.vat_registration_number}
                        </span>
                      </div>
                    )}
                    {selectedApp.fan_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">FAN Number:</span>
                        <span className="font-mono text-slate-800">{selectedApp.fan_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KYC DOCUMENTS INSPECTION CARDS */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#6a5acd]" />
                  Uploaded KYC Verification Documents
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* License File */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Trade License Document</div>
                        <div className="text-[10px] text-slate-400">Required KYC Document</div>
                      </div>
                    </div>

                    {selectedApp.license_file ? (
                      <a
                        href={selectedApp.license_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6a5acd] text-white text-xs font-bold hover:bg-[#5a4ac0] transition-colors shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Document
                      </a>
                    ) : (
                      <span className="text-xs text-red-500 font-semibold">Not Uploaded</span>
                    )}
                  </div>

                  {/* MOA File */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Memorandum of Association (MOA)</div>
                        <div className="text-[10px] text-slate-400">PLC Legal Structure Document</div>
                      </div>
                    </div>

                    {selectedApp.moa_file ? (
                      <a
                        href={selectedApp.moa_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Document
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Not Uploaded (Optional)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SUPERADMIN DECISION CONTROLS */}
              {selectedApp.status !== "approved" && (
                <div className="bg-white p-5 rounded-2xl border-2 border-[#6a5acd]/30 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#6a5acd]" />
                      Superadmin Verification Action
                    </h4>

                    {/* Action Selector Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setActionTab("approve")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          actionTab === "approve"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Approve & Promote
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionTab("revision")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          actionTab === "revision"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Request Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionTab("reject")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          actionTab === "reject"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: APPROVE & PROMOTE */}
                  {actionTab === "approve" && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-xs text-slate-600">
                        Approving this request will create an active Company entity, seed starter subscriptions, assign <strong>{selectedApp.contact_email}</strong> as owner, and send them a secure 48-hour password setup email.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Platform Fee Commission (%)
                          </label>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="number"
                              step="0.01"
                              value={platformFee}
                              onChange={(e) => setPlatformFee(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#6a5acd]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Promotional Grace Period (Months)
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="number"
                              min="0"
                              value={graceMonths}
                              onChange={(e) => setGraceMonths(Number(e.target.value) || 0)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#6a5acd]"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Internal Approval Notes (Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="e.g. License verified against ERCA registry, valid until Dec 2027"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#6a5acd]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Approve Company & Send 48h Invitation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: REQUEST REVISION */}
                  {actionTab === "revision" && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-xs text-slate-600">
                        An email will be dispatched to <strong>{selectedApp.contact_email}</strong> with your feedback requesting document re-upload or clarification.
                      </p>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Revision Instructions / Feedback <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={revisionFeedback}
                          onChange={(e) => setRevisionFeedback(e.target.value)}
                          placeholder="e.g. Please provide a clear, color scan of your renewed Trade License; the current upload is cut off."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleRequestRevision}
                          disabled={actionLoading || !revisionFeedback.trim()}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send Revision Email
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: REJECT */}
                  {actionTab === "reject" && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-xs text-slate-600">
                        Reject this application. An email notification will be dispatched to <strong>{selectedApp.contact_email}</strong>.
                      </p>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Rejection Reason (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Ineligible business category under our platform terms."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Application ID: {selectedApp.id} • Ref: {selectedApp.reference_code}
              </span>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
