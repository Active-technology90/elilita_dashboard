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
  Filter,
  X,
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
import BottomSheet from "../../ui/BottomSheet";

export default function DisputesManagement() {
  const { toast, showToast } = useToast();
  const [disputes, setDisputes] = useState<OrderDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolutionFilter, setResolutionFilter] = useState("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Active modal
  const [selectedDispute, setSelectedDispute] = useState<OrderDispute | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);

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
  };

  const closeReviewModal = () => {
    setSelectedDispute(null);
    setAdminNotes("");
    setCustomRefundAmount("");
    setGatewayError(null);
  };

  // Actions
  const handleApproveRefund = async () => {
    if (!selectedDispute) return;
    try {
      setActionLoading(true);
      setGatewayError(null);
      const parsedAmount = customRefundAmount ? parseFloat(customRefundAmount) : undefined;
      const res = await approveDisputeRefund(selectedDispute.id, {
        admin_notes: adminNotes,
        refund_amount: parsedAmount && !isNaN(parsedAmount) ? parsedAmount : undefined,
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
      setGatewayError(detail);
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_review: "Pending Review",
      redelivery_in_progress: "Redelivery In Progress",
      refund_approved: "Refund Approved",
      refunded: "Refunded",
      rejected: "Rejected",
      resolved: "Resolved",
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => (
    <span className="inline-flex items-center rounded-full border border-secondary/15 bg-secondary/[0.06] px-2.5 py-1 text-[11px] font-semibold text-secondary">
      {getStatusLabel(status)}
    </span>
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all" || resolutionFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setResolutionFilter("all");
  };

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "pending_review", label: "Pending Review" },
    { value: "redelivery_in_progress", label: "Redelivery Active" },
    { value: "refunded", label: "Refunded" },
    { value: "rejected", label: "Rejected" },
  ];

  const resolutionOptions = [
    { value: "all", label: "All resolutions" },
    { value: "redelivery", label: "Redelivery" },
    { value: "refund", label: "Refund" },
  ];

  const mobileFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (resolutionFilter !== "all" ? 1 : 0);

  const metricCards = [
    { label: "Pending", value: metrics.pending, note: "Awaiting review", icon: Clock },
    { label: "Redelivery", value: metrics.redelivery, note: "In progress", icon: RotateCcw },
    {
      label: "Refunded",
      value: metrics.refunded,
      note: `${metrics.totalRefundedETB.toLocaleString()} ETB`,
      icon: CheckCircle2,
    },
    { label: "Rejected", value: metrics.rejected, note: "Closed disputes", icon: XCircle },
  ];

  return (
    <div className="space-y-4">
      <Toast toast={toast} />

      <PageHeader
        title="Disputes & Refunds"
        description="Review disputes, redelivery requests, and refunds."
        icon={AlertTriangle}
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {metricCards.map(({ label, value, note, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-secondary/10 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            {loading ? (
              <div className="animate-pulse">
                <div className="h-3 w-20 rounded bg-secondary/10" />
                <div className="mt-2 h-7 w-12 rounded bg-secondary/10" />
                <div className="mt-2 h-2.5 w-24 rounded bg-secondary/[0.07]" />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary/55">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tracking-tight text-secondary">{value}</p>
                  <p className="mt-0.5 truncate text-[11px] text-secondary/55">{note}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="relative rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
        <div className="sticky -top-6 z-[100] -mt-6 bg-white pt-6"><div className="relative z-[110] border-b border-secondary/10 bg-white px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary/40" />
              <input
                type="text"
                placeholder="Search order, customer, vendor or issue"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-secondary/15 bg-white pl-9 pr-9 text-xs font-medium text-secondary outline-none placeholder:text-secondary/35 focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-secondary/45 transition hover:bg-secondary/[0.06] hover:text-secondary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              aria-label="Filter disputes"
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition md:hidden ${
                mobileFilterCount > 0
                  ? "border-secondary bg-secondary text-white"
                  : "border-secondary/15 bg-white text-secondary hover:bg-secondary/[0.05]"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {mobileFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-secondary px-1 text-[9px] font-bold leading-none text-white shadow-sm">
                  {mobileFilterCount}
                </span>
              )}
            </button>

            <div className="relative z-50 hidden w-[170px] shrink-0 md:block">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={statusOptions}
                placeholder="All statuses"
                className="h-9 text-xs"
              />
            </div>

            <div className="relative z-50 hidden w-[170px] shrink-0 md:block">
              <CustomSelect
                value={resolutionFilter}
                onChange={(val) => setResolutionFilter(val)}
                options={resolutionOptions}
                placeholder="All resolutions"
                className="h-9 text-xs"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="hidden h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] md:inline-flex"
              >
                <XCircle className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

        <BottomSheet
          open={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          title="Filter disputes"
        >
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/45">
                  Status
                </p>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="text-[10px] font-semibold text-secondary"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`min-h-11 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                      statusFilter === option.value
                        ? "border-secondary bg-secondary text-white"
                        : "border-secondary/10 bg-white text-secondary hover:bg-secondary/[0.04]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/45">
                  Resolution
                </p>
                {resolutionFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setResolutionFilter("all")}
                    className="text-[10px] font-semibold text-secondary"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {resolutionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setResolutionFilter(option.value)}
                    className={`min-h-11 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                      resolutionFilter === option.value
                        ? "border-secondary bg-secondary text-white"
                        : "border-secondary/10 bg-white text-secondary hover:bg-secondary/[0.04]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-secondary/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  clearFilters();
                  setFilterSheetOpen(false);
                }}
                disabled={!hasActiveFilters}
                className="h-10 flex-1 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFilterSheetOpen(false)}
                className="h-10 flex-1 rounded-lg bg-secondary px-3 text-xs font-semibold text-white transition hover:bg-secondary/90"
              >
                Show {filteredDisputes.length}
              </button>
            </div>
          </div>
        </BottomSheet>

        <div className="relative z-0 overflow-x-auto rounded-b-xl">
          <table className="w-full min-w-[1120px] table-fixed text-left">
            <thead className="border-b border-secondary/10 bg-secondary/[0.035]">
              <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                <th className="w-[150px] px-4 py-2.5">Dispute</th>
                <th className="w-[190px] px-4 py-2.5">Customer</th>
                <th className="w-[160px] px-4 py-2.5">Vendor</th>
                <th className="w-[100px] px-4 py-2.5">Gateway</th>
                <th className="w-[210px] px-4 py-2.5">Issue</th>
                <th className="w-[120px] px-4 py-2.5">Resolution</th>
                <th className="w-[110px] px-4 py-2.5">Amount</th>
                <th className="w-[155px] px-4 py-2.5">Status</th>
                <th className="w-[90px] px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/[0.08]">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {Array.from({ length: 9 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <div className={`h-3 rounded bg-secondary/[0.08] ${cell === 4 ? "w-32" : cell === 8 ? "ml-auto w-14" : "w-20"}`} />
                        {cell < 4 && <div className="mt-1.5 h-2.5 w-14 rounded bg-secondary/[0.05]" />}
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <ShieldCheck className="mx-auto h-7 w-7 text-secondary/30" />
                    <p className="mt-2 text-sm font-semibold text-secondary">No disputes found</p>
                    <p className="mt-0.5 text-xs text-secondary/50">
                      {hasActiveFilters ? "Try changing your search or filters." : "New disputes will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d.id} className="text-xs text-secondary/70 transition hover:bg-secondary/[0.025]">
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-secondary">#{d.id}</p>
                      <p className="mt-0.5 text-[11px] text-secondary/50">Order #{d.master_order}</p>
                      <p className="mt-0.5 text-[10px] text-secondary/35">
                        {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="truncate font-medium text-secondary">{d.customer_name || d.raised_by_name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-secondary/50">{d.customer_email || d.raised_by_email}</p>
                      {(d.customer_phone || d.raised_by_phone) && (
                        <p className="mt-0.5 truncate text-[10px] text-secondary/40">{d.customer_phone || d.raised_by_phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="truncate font-medium text-secondary">{d.company_name || "Multi-Vendor"}</p>
                      <p className="mt-0.5 truncate text-[10px] text-secondary/45">
                        {d.initiator_role === "vendor"
                          ? "Vendor initiated"
                          : d.initiator_role === "superadmin"
                            ? `Admin · ${d.raised_by_name}`
                            : "Customer claim"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-md border border-secondary/10 bg-secondary/[0.05] px-2 py-1 text-[10px] font-semibold uppercase text-secondary">
                        {d.payment_method || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-secondary">{formatReason(d.reason)}</p>
                      {d.explanation && (
                        <p className="mt-0.5 truncate text-[11px] text-secondary/50" title={d.explanation}>
                          {d.explanation}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex items-center gap-1 rounded-md border border-secondary/10 bg-secondary/[0.05] px-2 py-1 text-[10px] font-semibold text-secondary">
                        {d.requested_resolution === "redelivery" ? (
                          <RotateCcw className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        {d.requested_resolution === "redelivery" ? "Redelivery" : "Refund"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top font-semibold text-secondary">
                      {d.refund_amount || d.master_order_total} ETB
                    </td>
                    <td className="px-4 py-3 align-top">{getStatusBadge(d.status)}</td>
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => openReviewModal(d)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-2.5 text-[11px] font-semibold text-white transition hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredDisputes.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-secondary/10 px-4 py-2.5 text-[11px] text-secondary/50 sm:flex-row sm:items-center sm:justify-between">
            <span>{filteredDisputes.length} dispute{filteredDisputes.length === 1 ? "" : "s"}</span>
            <span>{disputes.length} total</span>
          </div>
        )}
      </section>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/35 p-3 backdrop-blur-[2px] sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-secondary/10 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-secondary/10 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-secondary">Dispute #{selectedDispute.id}</h2>
                  {getStatusBadge(selectedDispute.status)}
                </div>
                <p className="mt-1 text-[11px] text-secondary/50">
                  Order #{selectedDispute.master_order} · {new Date(selectedDispute.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary/55 transition hover:bg-secondary/[0.06] hover:text-secondary"
                aria-label="Close dispute review"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-secondary/10 bg-secondary/[0.035] px-3.5 py-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <div>
                    <p className="text-xs font-semibold text-secondary">Funds held in platform escrow</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-secondary/55">
                      Approved refunds return funds through {String(selectedDispute.payment_method || "the payment provider").toUpperCase()} before vendor payout.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-secondary/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/45">Customer</p>
                    <p className="mt-1 text-xs font-semibold text-secondary">
                      {selectedDispute.customer_name || selectedDispute.raised_by_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-secondary/50">
                      {selectedDispute.customer_email || selectedDispute.raised_by_email}
                    </p>
                    {(selectedDispute.customer_phone || selectedDispute.raised_by_phone) && (
                      <p className="mt-0.5 text-[11px] text-secondary/45">
                        {selectedDispute.customer_phone || selectedDispute.raised_by_phone}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-secondary/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/45">Vendor</p>
                    <p className="mt-1 text-xs font-semibold text-secondary">{selectedDispute.company_name || "Multi-Vendor"}</p>
                    <p className="mt-0.5 text-[11px] text-secondary/50">
                      Payment: <span className="font-medium uppercase text-secondary">{selectedDispute.payment_method}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-secondary/50">
                      Order total: <span className="font-semibold text-secondary">{selectedDispute.master_order_total} ETB</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-secondary/10 bg-secondary/[0.025] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/45">Reported issue</p>
                    <span className="rounded-md border border-secondary/10 bg-white px-2 py-1 text-[10px] font-semibold text-secondary">
                      {formatReason(selectedDispute.reason)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-secondary/70">
                    {selectedDispute.explanation || "No additional explanation provided."}
                  </p>
                  {selectedDispute.evidence_image && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(selectedDispute.evidence_image)}
                        className="group relative overflow-hidden rounded-lg border border-secondary/10"
                      >
                        <img
                          src={selectedDispute.evidence_image}
                          alt="Dispute evidence"
                          className="h-20 w-20 object-cover transition group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-secondary/50 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                          View
                        </span>
                      </button>
                    </div>
                  )} 
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center rounded-xl border border-secondary/10 bg-secondary/[0.04] px-3.5 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">Requested resolution</p>
                    <p className="mt-0.5 text-xs font-semibold text-secondary">
                      {selectedDispute.requested_resolution === "redelivery" ? "Redelivery" : "Financial refund"}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[10px] text-secondary/45">Amount</p>
                    <p className="text-sm font-bold text-secondary">
                      {selectedDispute.refund_amount || selectedDispute.master_order_total} ETB
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                      Refund amount (ETB)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customRefundAmount}
                      onChange={(e) => setCustomRefundAmount(e.target.value)}
                      disabled={selectedDispute.status === "refunded"}
                      className="h-9 w-full rounded-lg border border-secondary/15 bg-white px-3 text-xs text-secondary outline-none focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10 disabled:bg-secondary/[0.03] disabled:opacity-60"
                    />
                    <p className="mt-1 text-[10px] text-secondary/40">Adjust only for partial refunds.</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                      Admin notes
                    </label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      disabled={selectedDispute.status === "refunded"}
                      placeholder="Add review notes"
                      className="w-full resize-none rounded-lg border border-secondary/15 bg-white px-3 py-2 text-xs text-secondary outline-none placeholder:text-secondary/35 focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10 disabled:bg-secondary/[0.03] disabled:opacity-60"
                    />
                  </div>
                </div>

                {selectedDispute.gateway_refund_id && (
                  <div className="rounded-lg border border-secondary/10 bg-secondary/[0.025] px-3 py-2 text-[11px] text-secondary/65">
                    Refund ID: <span className="font-mono text-secondary">{selectedDispute.gateway_refund_id}</span>
                  </div>
                )}

                {gatewayError && (
                  <div className="rounded-xl border border-secondary/15 bg-secondary/[0.05] p-3 text-[11px] leading-4 text-secondary">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>{gatewayError}</p>
                    </div>
                    {/* {canForceManual && (
                      <div className="mt-2 flex items-center justify-end border-t border-secondary/10 pt-2">
                        <button
                          type="button"
                          onClick={() => handleApproveRefund(true)}
                          disabled={actionLoading}
                          className="h-8 rounded-lg bg-secondary px-3 text-[11px] font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50"
                        >
                          Force manual refund
                        </button>
                      </div>
                    )} */}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-secondary/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <button
                type="button"
                onClick={closeReviewModal}
                className="h-9 w-full rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] sm:w-auto"
              >
                Close
              </button>

              {selectedDispute.status !== "refunded" && selectedDispute.status !== "resolved" && (
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                  {selectedDispute.requested_resolution === "redelivery" && (
                    <>
                      <button
                        type="button"
                        onClick={handleApproveRedelivery}
                        disabled={actionLoading}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Approve redelivery
                      </button>
                      <button
                        type="button"
                        onClick={handleConvertToRefund}
                        disabled={actionLoading}
                        className="h-9 rounded-lg border border-secondary/15 bg-secondary/[0.05] px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.08] disabled:opacity-50"
                      >
                        Convert to refund
                      </button>
                    </>
                  )}

                  <button
 
                    type="button"
                    onClick={handleReject} 
                    disabled={actionLoading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-secondary/20 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.05] disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveRefund()}
                    disabled={actionLoading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Approve refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-secondary/90 p-4"
        >
          <img
            src={previewImage}
            alt="Enlarged evidence"
            className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
