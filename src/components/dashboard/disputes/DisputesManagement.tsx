import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  getAdminDisputes,
  approveDisputeRefund,
  approveDisputeRedelivery,
  convertDisputeToRefund,
  rejectDispute,
  type OrderDispute,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { CustomSelect } from "../../ui/CustomSelect";
import { PageHeader } from "../../ui/PageHeader";

export default function DisputesManagement() {
  const { toast, showToast } = useToast();
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolutionFilter, setResolutionFilter] = useState("all");

  // Active modal
  const [selectedDispute, setSelectedDispute] = useState<OrderDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [canForceManual, setCanForceManual] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminDisputes();
      const rawData: any = res.data;
      const items: OrderDispute[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.results)
        ? rawData.results
        : [];
      setDisputes(items);
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Failed to load disputes");
      setDisputes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  // Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(disputes) ? disputes : [];
    const pending = list.filter((d) => d.status === "pending_review").length;
    const redelivery = list.filter((d) => d.status === "redelivery_in_progress").length;
    const refunded = list.filter((d) => d.status === "refunded").length;
    const rejected = list.filter((d) => d.status === "rejected").length;
    const totalRefundedETB = list
      .filter((d) => d.status === "refunded")
      .reduce((sum, d) => sum + parseFloat(d.refund_amount || "0"), 0);

    return { pending, redelivery, refunded, rejected, totalRefundedETB };
  }, [disputes]);

  // Filtered disputes
  const filteredDisputes = useMemo(() => {
    const list = Array.isArray(disputes) ? disputes : [];
    return list.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (resolutionFilter !== "all" && d.requested_resolution !== resolutionFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesOrder = String(d.master_order).includes(query);
        const matchesCompany = (d.company_name || "").toLowerCase().includes(query);
        const matchesCustomer = (d.customer_name || "").toLowerCase().includes(query) ||
          (d.customer_email || "").toLowerCase().includes(query) ||
          (d.customer_phone || "").toLowerCase().includes(query);
        const matchesUser = (d.raised_by_name || "").toLowerCase().includes(query) ||
          (d.raised_by_email || "").toLowerCase().includes(query);
        const matchesReason = (d.reason || "").toLowerCase().includes(query);
        return matchesOrder || matchesCompany || matchesCustomer || matchesUser || matchesReason;
      }
      return true;
    });
  }, [disputes, statusFilter, resolutionFilter, searchQuery]);

  const openReviewModal = (dispute: OrderDispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.admin_notes || "");
    setCustomRefundAmount(dispute.refund_amount || dispute.master_order_total || "");
    setGatewayError(null);
    setCanForceManual(false);
  };

  const closeReviewModal = () => {
    setSelectedDispute(null);
    setAdminNotes("");
    setCustomRefundAmount("");
    setGatewayError(null);
    setCanForceManual(false);
  };

  // Actions
  const handleApproveRefund = async (forceManual: boolean | unknown = false) => {
    if (!selectedDispute) return;
    const isForce = typeof forceManual === "boolean" ? forceManual : false;
    try {
      setActionLoading(true);
      const parsedAmount = customRefundAmount ? parseFloat(customRefundAmount) : undefined;
      const res = await approveDisputeRefund(selectedDispute.id, {
        admin_notes: adminNotes,
        refund_amount: parsedAmount && !isNaN(parsedAmount) ? parsedAmount : undefined,
        force_manual: isForce,
      });
      showToast("success", res.data.detail || "Refund approved and executed successfully");
      closeReviewModal();
      fetchDisputes();
    } catch (err: any) {
      console.error("Approve refund error:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to approve refund";
      showToast("error", detail);
      if (err?.response?.data?.can_force_manual) {
        setCanForceManual(true);
        setGatewayError(detail);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRedelivery = async () => {
    if (!selectedDispute) return;
    try {
      setActionLoading(true);
      const res = await approveDisputeRedelivery(selectedDispute.id, { admin_notes: adminNotes });
      showToast("success", res.data.detail || "Redelivery approved. Vendor notified.");
      closeReviewModal();
      fetchDisputes();
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Failed to approve redelivery");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToRefund = async () => {
    if (!selectedDispute) return;
    try {
      setActionLoading(true);
      const res = await convertDisputeToRefund(selectedDispute.id, { admin_notes: adminNotes });
      showToast("success", res.data.detail || "Dispute converted to financial refund.");
      setSelectedDispute(res.data.dispute);
      fetchDisputes();
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Failed to convert to refund");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDispute) return;
    if (!adminNotes.trim()) {
      showToast("error", "Please provide an administrative reason for rejecting the dispute.");
      return;
    }
    try {
      setActionLoading(true);
      const res = await rejectDispute(selectedDispute.id, { admin_notes: adminNotes });
      showToast("success", res.data.detail || "Dispute rejected. Vendor order restored.");
      closeReviewModal();
      fetchDisputes();
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Failed to reject dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const formatReason = (reason: string) => {
    const map: Record<string, string> = {
      wrong_item: "Wrong Item Delivered",
      missing_item: "Item Missing",
      damaged_item: "Item Damaged",
      not_delivered: "Not Delivered",
      out_of_stock: "Out of Stock (Vendor)",
      quality_issue: "Quality Issue",
      customer_cancellation: "Customer Cancelled",
      other: "Other Issue",
    };
    return map[reason] || reason;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>;
      case "redelivery_in_progress":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Redelivery In Progress</span>;
      case "refund_approved":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">Refund Approved</span>;
      case "refunded":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Refunded</span>;
      case "rejected":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      case "resolved":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <PageHeader
        title="Disputes & Refunds"
        description="Review customer issue reports, redelivery requests, and execute superadmin-authorized refunds."
        icon={AlertTriangle}
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.pending}</h3>
            <p className="text-xs text-gray-500 mt-1">Awaiting superadmin action</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Redeliveries Active</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.redelivery}</h3>
            <p className="text-xs text-gray-500 mt-1">Replacements in progress</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Refunds Completed</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.refunded}</h3>
            <p className="text-xs text-emerald-600 mt-1 font-medium">{metrics.totalRefundedETB.toLocaleString()} ETB Total</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Disputes Rejected</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.rejected}</h3>
            <p className="text-xs text-gray-500 mt-1">Vendor orders restored</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order #, customer, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending_review", label: "Pending Review" },
              { value: "redelivery_in_progress", label: "Redelivery Active" },
              { value: "refunded", label: "Refunded" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          <CustomSelect
            value={resolutionFilter}
            onChange={(val) => setResolutionFilter(val)}
            options={[
              { value: "all", label: "All Resolutions" },
              { value: "redelivery", label: "Redelivery Only" },
              { value: "refund", label: "Refund Only" },
            ]}
          />
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Dispute & Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Gateway</th>
                <th className="px-6 py-4">Reported Issue</th>
                <th className="px-6 py-4">Resolution</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading disputes...
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <ShieldCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    No disputes match your current filters.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">Dispute #{d.id}</div>
                      <div className="text-xs text-gray-500">Order #{d.master_order}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(d.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{d.customer_name || d.raised_by_name}</div>
                      <div className="text-xs text-gray-500">{d.customer_email || d.raised_by_email}</div>
                      {(d.customer_phone || d.raised_by_phone) && (
                        <div className="text-xs text-gray-400">{d.customer_phone || d.raised_by_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{d.company_name || "Multi-Vendor"}</div>
                      <div className="text-xs">
                        {d.initiator_role === "vendor" ? (
                          <span className="text-amber-600 font-medium">Initiated by Vendor</span>
                        ) : d.initiator_role === "superadmin" ? (
                          <span className="text-purple-600 font-medium">Initiated by Admin ({d.raised_by_name})</span>
                        ) : (
                          <span className="text-blue-600 font-medium">Customer Claim</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          d.payment_method === "telebirr"
                            ? "bg-sky-100 text-sky-800"
                            : d.payment_method === "chapa"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {d.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{formatReason(d.reason)}</div>
                      {d.explanation && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{d.explanation}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {d.requested_resolution === "redelivery" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                          <RotateCcw className="w-3 h-3" /> Redeliver
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          <DollarSign className="w-3 h-3" /> Refund
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {d.refund_amount || d.master_order_total} ETB
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openReviewModal(d)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-t-2xl flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Dispute #{selectedDispute.id} Review</h2>
                  {getStatusBadge(selectedDispute.status)}
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Master Order #{selectedDispute.master_order} • Created on{" "}
                  {new Date(selectedDispute.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={closeReviewModal}
                className="text-white/80 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Escrow Status Indicator */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Funds Held in Platform Escrow</h4>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Vendor payout is locked in escrow. Approving a financial refund will return funds directly from
                    the central Qine account via <strong>{selectedDispute.payment_method.toUpperCase()}</strong>.
                    The vendor will not receive a payout.
                  </p>
                </div>
              </div>

              {/* Claim Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">Customer</span>
                  <div className="font-semibold text-gray-900 mt-1">
                    {selectedDispute.customer_name || selectedDispute.raised_by_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedDispute.customer_email || selectedDispute.raised_by_email}
                  </div>
                  {(selectedDispute.customer_phone || selectedDispute.raised_by_phone) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {selectedDispute.customer_phone || selectedDispute.raised_by_phone}
                    </div>
                  )}
                  {selectedDispute.initiator_role !== "customer" && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-[11px] text-amber-700 font-medium">
                      Opened by: <span className="font-bold">{selectedDispute.raised_by_name}</span> ({selectedDispute.initiator_role})
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">Vendor</span>
                  <div className="font-semibold text-gray-900 mt-1">{selectedDispute.company_name}</div>
                  <div className="text-xs text-gray-500">
                    Payment: <span className="font-medium uppercase">{selectedDispute.payment_method}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Total Order: <span className="font-semibold text-gray-900">{selectedDispute.master_order_total} ETB</span>
                  </div>
                </div>
              </div>

              {/* Reported Reason & Details */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">Reported Problem</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {formatReason(selectedDispute.reason)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {selectedDispute.explanation || "No additional explanation provided."}
                </p>

                {/* Evidence Image Preview */}
                {selectedDispute.evidence_image && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-gray-500 block mb-1.5">Evidence Photo:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(selectedDispute.evidence_image)}
                      className="group relative inline-block rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={selectedDispute.evidence_image}
                        alt="Evidence"
                        className="w-24 h-24 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium">
                        Zoom
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Requested Resolution */}
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase text-purple-800">Requested Resolution</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {selectedDispute.requested_resolution === "redelivery"
                      ? "🔄 Redeliver Correct Item (Replacement)"
                      : "💰 Financial Refund to Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Dispute Amount</span>
                  <p className="text-base font-bold text-purple-700">
                    {selectedDispute.refund_amount || selectedDispute.master_order_total} ETB
                  </p>
                </div>
              </div>

              {/* Custom Refund Amount (Editable if approving refund) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Refund Amount (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customRefundAmount}
                  onChange={(e) => setCustomRefundAmount(e.target.value)}
                  disabled={selectedDispute.status === "refunded"}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[11px] text-gray-400 mt-0.5 block">
                  Defaults to the full dispute amount. Can be adjusted for partial refunds.
                </span>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Superadmin Action Notes & Audit
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={selectedDispute.status === "refunded"}
                  placeholder="e.g., Verified with vendor; item was out of stock. Approving full Telebirr refund."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Gateway Refund Details if already completed */}
              {selectedDispute.gateway_refund_id && (
                <div className="p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 border border-gray-200">
                  Gateway Refund ID: {selectedDispute.gateway_refund_id} ({selectedDispute.gateway})
                </div>
              )}

              {/* Gateway Error and Force Manual Fallback */}
              {gatewayError && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">Provider Gateway Notice:</span> {gatewayError}
                    </div>
                  </div>
                  {canForceManual && (
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/80">
                      <span className="text-[11px] text-amber-700">
                        Provider gateway rejected or is offline. You can force manual approval to settle customer dispute:
                      </span>
                      <button
                        onClick={() => handleApproveRefund(true)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                      >
                        Force Manual Refund
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={closeReviewModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>

              {selectedDispute.status !== "refunded" && selectedDispute.status !== "resolved" && (
                <div className="flex flex-wrap gap-2">
                  {selectedDispute.requested_resolution === "redelivery" && (
                    <>
                      <button
                        onClick={handleApproveRedelivery}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Approve Redelivery
                      </button>

                      <button
                        onClick={handleConvertToRefund}
                        disabled={actionLoading}
                        className="px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
                      >
                        Convert to Refund
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleApproveRefund(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Disburse Refund
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Dispute
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={previewImage}
            alt="Enlarged Evidence"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
