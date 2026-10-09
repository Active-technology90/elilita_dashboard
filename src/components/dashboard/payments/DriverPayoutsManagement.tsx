import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Phone,
  Banknote,
} from "lucide-react";
import {
  getAdminUnpaidDeliveries,
  getAdminDriverPayouts,
  getAdminDriverPayoutDetail,
  createAdminDriverPayout,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";

interface DriverPayoutsManagementProps {
  companySlug: string | null;
  isSuperAdmin: boolean;
}

interface UnpaidDeliveryItem {
  id?: number;
  assignment_id?: number;
  vendor_order_id: number;
  master_order_id: number;
  order_number: string;
  driver_id: number;
  driver_name: string;
  driver_phone?: string;
  company_id: number;
  company_name: string;
  company_slug: string;
  delivery_fee: string;
  cod_collected: string;
  payment_method: string;
  completed_at: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: string;
}

// Helper to reliably get assignment ID from item
const getAssignmentId = (ord: UnpaidDeliveryItem): number =>
  Number(ord.assignment_id || (ord as any).id || 0);

interface DriverPayoutRecord {
  id: number;
  payout_number: string;
  driver: number;
  driver_name: string;
  driver_username: string;
  driver_phone?: string;
  company: number;
  company_name: string;
  company_slug: string;
  created_by?: number;
  created_by_name?: string;
  payout_type: "instant" | "weekly" | "monthly" | "manual";
  status: "draft" | "disbursed" | "confirmed" | "disputed" | "cancelled";
  payment_method: string;
  transaction_reference?: string;
  gross_delivery_fees: string;
  cod_cash_deducted: string;
  net_payout_amount: string;
  notes?: string;
  dispute_reason?: string;
  disbursed_at?: string;
  confirmed_at?: string;
  disputed_at?: string;
  items_count: number;
  items?: any[];
  created_at: string;
}

interface DriverUnpaidGroup {
  driver_id: number;
  driver_name: string;
  driver_phone?: string;
  orders: UnpaidDeliveryItem[];
  total_gross_fees: number;
  total_cod_collected: number;
  suggested_net: number;
}

export function DriverPayoutsManagement({
  companySlug,
  isSuperAdmin: _isSuperAdmin,
}: DriverPayoutsManagementProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"unpaid" | "history">("unpaid");
  const [loading, setLoading] = useState(false);
  const [unpaidItems, setUnpaidItems] = useState<UnpaidDeliveryItem[]>([]);
  const [payouts, setPayouts] = useState<DriverPayoutRecord[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payoutTypeFilter, _setPayoutTypeFilter] = useState<string>("all");
  const [expandedDrivers, setExpandedDrivers] = useState<Record<number, boolean>>({});

  // Disburse Modal State
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [selectedDriverGroup, setSelectedDriverGroup] = useState<DriverUnpaidGroup | null>(null);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
  const [payoutType, setPayoutType] = useState<"instant" | "weekly" | "monthly" | "manual">("weekly");
  const [paymentMethod, setPaymentMethod] = useState("telebirr");
  const [transactionRef, setTransactionRef] = useState("");
  const [deductCod, setDeductCod] = useState(true);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<DriverPayoutRecord | null>(null);
  const [_loadingDetail, setLoadingDetail] = useState(false);

  // Helper: Filter orders by interval
  const selectOrdersByInterval = (
    type: "instant" | "weekly" | "monthly" | "manual",
    orders: UnpaidDeliveryItem[]
  ) => {
    setPayoutType(type);
    if (!orders || orders.length === 0) {
      setSelectedAssignmentIds([]);
      return;
    }
    if (type === "manual") {
      // Retain current selection or select all if empty
      setSelectedAssignmentIds((prev) => (prev.length > 0 ? prev : orders.map(getAssignmentId)));
      return;
    }

    const now = new Date();
    const todayStr = now.toDateString();

    if (type === "instant") {
      // Orders delivered today (or within last 24h)
      const filtered = orders.filter((o) => {
        if (!o.completed_at) return false;
        const d = new Date(o.completed_at);
        return (
          d.toDateString() === todayStr ||
          now.getTime() - d.getTime() <= 24 * 60 * 60 * 1000
        );
      });
      setSelectedAssignmentIds(filtered.map(getAssignmentId));
    } else if (type === "weekly") {
      // Orders delivered in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const filtered = orders.filter((o) => {
        if (!o.completed_at) return false;
        return new Date(o.completed_at) >= sevenDaysAgo;
      });
      setSelectedAssignmentIds(filtered.map(getAssignmentId));
    } else if (type === "monthly") {
      // Orders delivered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const filtered = orders.filter((o) => {
        if (!o.completed_at) return false;
        return new Date(o.completed_at) >= thirtyDaysAgo;
      });
      setSelectedAssignmentIds(filtered.map(getAssignmentId));
    }
  };

  // Toggle single order selection
  const toggleOrderSelection = (assignmentId: number) => {
    if (!assignmentId) return;
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
    setPayoutType("manual");
  };

  const handleSelectAllOrders = () => {
    if (!selectedDriverGroup) return;
    setSelectedAssignmentIds(selectedDriverGroup.orders.map(getAssignmentId));
    setPayoutType("manual");
  };

  const handleDeselectAllOrders = () => {
    setSelectedAssignmentIds([]);
    setPayoutType("manual");
  };

  // Computed financial totals for selected orders in modal
  const selectedOrders = useMemo(() => {
    if (!selectedDriverGroup) return [];
    return selectedDriverGroup.orders.filter((o) =>
      selectedAssignmentIds.includes(getAssignmentId(o))
    );
  }, [selectedDriverGroup, selectedAssignmentIds]);

  const selectedGrossFees = useMemo(() => {
    return selectedOrders.reduce(
      (sum, o) => sum + parseFloat(o.delivery_fee || (o as any).driver_earning || "0"),
      0
    );
  }, [selectedOrders]);

  const selectedCodCollected = useMemo(() => {
    return selectedOrders.reduce(
      (sum, o) => sum + parseFloat(o.cod_collected || "0"),
      0
    );
  }, [selectedOrders]);

  const selectedNetDisbursable = useMemo(() => {
    const codOffset = deductCod ? selectedCodCollected : 0;
    return Math.max(0, selectedGrossFees - codOffset);
  }, [selectedGrossFees, selectedCodCollected, deductCod]);

  // Open Disburse Modal
  const handleOpenDisburse = (group: DriverUnpaidGroup) => {
    setSelectedDriverGroup(group);
    setPaymentMethod("telebirr");
    setTransactionRef("");
    setDeductCod(true);
    setPayoutNotes("");
    selectOrdersByInterval("weekly", group.orders);
    setDisburseModalOpen(true);
  };

  // Submit Disburse Payout
  const handleCreatePayout = async () => {
    if (!selectedDriverGroup || selectedAssignmentIds.length === 0) return;

    setSubmittingPayout(true);
    try {
      await createAdminDriverPayout({
        driver_id: selectedDriverGroup.driver_id,
        assignment_ids: selectedAssignmentIds,
        payout_type: payoutType,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || undefined,
        deduct_cod: deductCod,
        notes: payoutNotes.trim() || undefined,
      });

      showToast(
        "success",
        `Payout of ${selectedNetDisbursable.toFixed(2)} ETB (${selectedOrders.length} orders) disbursed to ${selectedDriverGroup.driver_name}!`
      );
      setDisburseModalOpen(false);
      setSelectedDriverGroup(null);
      setSelectedAssignmentIds([]);
      await fetchData();
      setActiveTab("history");
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to disburse payout";
      showToast("error", errMsg);
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (companySlug) params.company_slug = companySlug;

      const [unpaidRes, payoutsRes] = await Promise.all([
        getAdminUnpaidDeliveries(params).catch((err) => {
          console.error("Error fetching unpaid deliveries:", err);
          return { data: { results: [] } };
        }),
        getAdminDriverPayouts(params).catch((err) => {
          console.error("Error fetching driver payouts:", err);
          return { data: { results: [] } };
        }),
      ]);

      const unpaidList = unpaidRes.data?.results || unpaidRes.data || [];
      const payoutList = payoutsRes.data?.results || payoutsRes.data || [];

      setUnpaidItems(unpaidList);
      setPayouts(payoutList);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load driver payout data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companySlug]);

  // Group unpaid orders by Driver
  const driverGroups = useMemo<DriverUnpaidGroup[]>(() => {
    const groups: Record<number, DriverUnpaidGroup> = {};

    unpaidItems.forEach((item) => {
      const driverId =
        item.driver_id ||
        (item as any).delivery_person_id ||
        (item as any).delivery_person ||
        0;
      if (!driverId) return;

      const driverName =
        item.driver_name ||
        (item as any).delivery_person_name ||
        `Driver #${driverId}`;
      const driverPhone =
        item.driver_phone ||
        (item as any).delivery_person_phone ||
        "";

      if (!groups[driverId]) {
        groups[driverId] = {
          driver_id: driverId,
          driver_name: driverName,
          driver_phone: driverPhone,
          orders: [],
          total_gross_fees: 0,
          total_cod_collected: 0,
          suggested_net: 0,
        };
      }
      groups[driverId].orders.push(item);
      const fee = parseFloat(item.delivery_fee || (item as any).driver_earning || "0");
      const cod = parseFloat(item.cod_collected || "0");
      groups[driverId].total_gross_fees += fee;
      groups[driverId].total_cod_collected += cod;
    });

    Object.values(groups).forEach((g) => {
      g.suggested_net = Math.max(0, g.total_gross_fees - g.total_cod_collected);
    });

    return Object.values(groups);
  }, [unpaidItems]);

  // Filtered driver groups
  const filteredDriverGroups = useMemo(() => {
    if (!searchTerm.trim()) return driverGroups;
    const term = searchTerm.toLowerCase();
    return driverGroups.filter(
      (g) =>
        (g.driver_name || "").toLowerCase().includes(term) ||
        (g.driver_phone && g.driver_phone.includes(term))
    );
  }, [driverGroups, searchTerm]);

  // Filtered payouts history
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (payoutTypeFilter !== "all" && p.payout_type !== payoutTypeFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNum = (p.payout_number || "").toLowerCase().includes(term);
        const matchesDriver = (p.driver_name || "").toLowerCase().includes(term);
        const matchesComp = (p.company_name || "").toLowerCase().includes(term);
        const matchesRef = (p.transaction_reference || "").toLowerCase().includes(term);
        return matchesNum || matchesDriver || matchesComp || matchesRef;
      }
      return true;
    });
  }, [payouts, statusFilter, payoutTypeFilter, searchTerm]);

  // Total summary metrics
  const totalUnpaidGross = useMemo(() => {
    return unpaidItems.reduce((acc, it) => acc + parseFloat(it.delivery_fee || "0"), 0);
  }, [unpaidItems]);

  const totalCodCollected = useMemo(() => {
    return unpaidItems.reduce((acc, it) => acc + parseFloat(it.cod_collected || "0"), 0);
  }, [unpaidItems]);

  const awaitingConfirmationCount = useMemo(() => {
    return payouts.filter((p) => p.status === "disbursed").length;
  }, [payouts]);

  const confirmedSettledTotal = useMemo(() => {
    return payouts
      .filter((p) => p.status === "confirmed")
      .reduce((acc, p) => acc + parseFloat(p.net_payout_amount || "0"), 0);
  }, [payouts]);

  // Toggle driver orders accordion
  const toggleDriverExpand = (driverId: number) => {
    setExpandedDrivers((prev) => ({
      ...prev,
      [driverId]: !prev[driverId],
    }));
  };

  // View Payout Detail
  const handleViewDetail = async (payout: DriverPayoutRecord) => {
    setSelectedPayout(payout);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await getAdminDriverPayoutDetail(payout.id);
      setSelectedPayout(res.data);
    } catch (err) {
      console.error("Error fetching payout detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "disbursed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Awaiting Confirmation
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            Confirmed
          </span>
        );
      case "disputed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            Disputed by Driver
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unpaid Delivery Fees */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Unpaid Delivery Fees
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              ETB {totalUnpaidGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {unpaidItems.length} orders across {driverGroups.length} drivers
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* COD Cash with Drivers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              COD Cash in Hand
            </p>
            <h3 className="text-2xl font-black text-secondary mt-1">
              ETB {totalCodCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Cash collected from customers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Confirmation Handshake */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Awaiting Driver Check
            </p>
            <h3 className="text-2xl font-black text-gray-600 mt-1">
              {awaitingConfirmationCount} Payouts
            </h3>
            <p className="text-xs text-gray-400 mt-1">Disbursed · pending driver confirmation</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Settled Payouts Total */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Settled
            </p>
            <h3 className="text-2xl font-black text-green-600 mt-1">
              ETB {confirmedSettledTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Fully confirmed by delivery persons</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Navigation Tabs & Actions Bar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("unpaid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "unpaid"
                  ? "bg-white text-secondary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Unpaid Orders & Ready to Disburse</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "unpaid"
                    ? "bg-secondary/10 text-secondary"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {unpaidItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-white text-secondary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>Payouts History</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "history"
                    ? "bg-secondary/10 text-secondary"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {payouts.length}
              </span>
            </button>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === "unpaid"
                    ? "Search driver name or phone..."
                    : "Search payout # or driver..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary w-56 sm:w-64"
              />
            </div>

            {activeTab === "history" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-medium text-gray-700"
              >
                <option value="all">All Statuses</option>
                <option value="disbursed">Awaiting Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-secondary" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab 1: Unpaid Orders / Disburse Settlements */}
        {activeTab === "unpaid" && (
          <div className="p-4 sm:p-6 space-y-4">
            {filteredDriverGroups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900">All Delivery Persons Settled</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  There are currently no unpaid completed deliveries awaiting payout.
                </p>
              </div>
            ) : (
              filteredDriverGroups.map((group) => {
                const isExpanded = !!expandedDrivers[group.driver_id];
                return (
                  <div
                    key={group.driver_id}
                    className="border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all shadow-sm"
                  >
                    {/* Driver Card Header */}
                    <div className="p-4 sm:p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Driver info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-base">
                          {(group.driver_name?.trim()?.charAt(0) || "D").toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                              {group.driver_name}
                            </h4>
                            <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {group.orders.length} Deliveries
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            {group.driver_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {group.driver_phone}
                              </span>
                            )}
                            <span>·</span>
                            <span>
                              Store: {group.orders[0]?.company_name || "Company Store"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amounts & Action */}
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-[11px] text-gray-400 font-semibold uppercase">
                            Gross Fees
                          </p>
                          <p className="text-sm font-bold text-gray-700">
                            +{group.total_gross_fees.toFixed(2)} ETB
                          </p>
                        </div>

                        {group.total_cod_collected > 0 && (
                          <div className="text-right">
                            <p className="text-[11px] text-orange-500 font-semibold uppercase">
                              COD Retained
                            </p>
                            <p className="text-sm font-bold text-orange-600">
                              -{group.total_cod_collected.toFixed(2)} ETB
                            </p>
                          </div>
                        )}

                        <div className="text-right">
                          <p className="text-[11px] text-green-600 font-bold uppercase">
                            Net Disbursable
                          </p>
                          <p className="text-lg font-black text-green-600">
                            {group.suggested_net.toFixed(2)} ETB
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenDisburse(group)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary/90 transition shadow-sm"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            <span>Disburse Payout</span>
                          </button>

                          <button
                            onClick={() => toggleDriverExpand(group.driver_id)}
                            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition"
                            title={isExpanded ? "Collapse orders" : "View orders"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Order Breakdown */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4 overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="text-gray-400 font-semibold uppercase border-b border-gray-200/60 pb-2">
                              <th className="py-2 px-3">Order Number</th>
                              <th className="py-2 px-3">Customer</th>
                              <th className="py-2 px-3">Completed At</th>
                              <th className="py-2 px-3">Payment Method</th>
                              <th className="py-2 px-3 text-right">Delivery Fee</th>
                              <th className="py-2 px-3 text-right">COD Collected</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {group.orders.map((ord) => (
                              <tr key={ord.assignment_id} className="hover:bg-gray-100/50">
                                <td className="py-2.5 px-3 font-bold text-secondary">
                                  #{ord.order_number}
                                </td>
                                <td className="py-2.5 px-3 text-gray-700">
                                  {ord.customer_name}
                                </td>
                                <td className="py-2.5 px-3 text-gray-500">
                                  {ord.completed_at
                                    ? new Date(ord.completed_at).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "N/A"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="capitalize px-2 py-0.5 rounded-md bg-gray-200/70 text-gray-700 font-medium text-[11px]">
                                    {ord.payment_method}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                  +{parseFloat(ord.delivery_fee).toFixed(2)} ETB
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium text-orange-600">
                                  {parseFloat(ord.cod_collected) > 0
                                    ? `-${parseFloat(ord.cod_collected).toFixed(2)} ETB`
                                    : "0.00 ETB"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Payouts History */}
        {activeTab === "history" && (
          <div className="overflow-x-auto">
            {filteredPayouts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="h-8 w-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900">No Payout Records</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Disbursed payouts will appear here with confirmation statuses and breakdown.
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase border-b border-gray-100">
                    <th className="py-3.5 px-4">Payout #</th>
                    <th className="py-3.5 px-4">Delivery Person</th>
                    <th className="py-3.5 px-4">Frequency</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Orders</th>
                    <th className="py-3.5 px-4 text-right">Net Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Disbursed Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-bold text-secondary">
                        #{payout.payout_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{payout.driver_name}</div>
                        <div className="text-[11px] text-gray-400">{payout.company_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[11px]">
                          {payout.payout_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-medium text-gray-700">
                          {payout.payment_method?.replace(/_/g, " ")}
                        </span>
                        {payout.transaction_reference && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                            Ref: {payout.transaction_reference}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-700">
                        {payout.items_count} orders
                      </td>
                      <td className="py-3 px-4 text-right font-black text-gray-900 text-sm">
                        {parseFloat(payout.net_payout_amount).toFixed(2)} ETB
                      </td>
                      <td className="py-3 px-4">{renderStatusBadge(payout.status)}</td>
                      <td className="py-3 px-4 text-gray-500">
                        {payout.disbursed_at
                          ? new Date(payout.disbursed_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewDetail(payout)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Disburse Payout Modal */}
      {disburseModalOpen && selectedDriverGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Disburse Driver Payout</h3>
                  <p className="text-xs text-gray-400">
                    Settle completed deliveries for {selectedDriverGroup.driver_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisburseModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step 1: Payout Interval / Quick Filter */}
            <div>
              <label className="block font-bold text-gray-700 text-xs mb-1.5">
                1. Select Payout Interval (Quick Filters Orders)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "instant", label: "Instant", sub: "Today" },
                  { key: "weekly", label: "Weekly", sub: "Last 7 Days" },
                  { key: "monthly", label: "Monthly", sub: "Last 30 Days" },
                  { key: "manual", label: "Manual", sub: "Custom Pick" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      selectOrdersByInterval(
                        item.key as any,
                        selectedDriverGroup.orders
                      )
                    }
                    className={`py-2 px-1 text-center rounded-xl font-bold transition border ${
                      payoutType === item.key
                        ? "bg-secondary text-white border-secondary shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="capitalize text-xs leading-tight">{item.label}</div>
                    <div
                      className={`text-[9px] font-medium leading-tight mt-0.5 ${
                        payoutType === item.key ? "text-purple-200" : "text-gray-400"
                      }`}
                    >
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Interactive Order Selection Checklist */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700 text-xs">
                  2. Choose Orders to Settle ({selectedAssignmentIds.length} of {selectedDriverGroup.orders.length} Selected)
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllOrders}
                    className="text-secondary font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllOrders}
                    className="text-gray-500 font-semibold hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              {selectedAssignmentIds.length === 0 && (
                <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                  <span>
                    No orders delivered within the <b className="capitalize">{payoutType}</b> timeframe. Select orders manually below or click &quot;Select All&quot;.
                  </span>
                </div>
              )}

              {/* Scrollable Order Items List */}
              <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-gray-50/70 rounded-2xl border border-gray-200">
                {selectedDriverGroup.orders.map((ord) => {
                  const orderId = getAssignmentId(ord);
                  const isChecked = selectedAssignmentIds.includes(orderId);
                  const completedStr = ord.completed_at
                    ? new Date(ord.completed_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Delivered";

                  return (
                    <div
                      key={orderId}
                      onClick={() => toggleOrderSelection(orderId)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                        isChecked
                          ? "bg-purple-50/90 border-secondary/40 text-gray-900 shadow-xs"
                          : "bg-white border-gray-200/80 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleOrderSelection(orderId)}
                          className="rounded text-secondary focus:ring-secondary h-4 w-4"
                        />
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>#{ord.order_number}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium capitalize">
                              {ord.payment_method}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {completedStr} · {ord.customer_name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-gray-900 block">
                          +{parseFloat(ord.delivery_fee || "0").toFixed(2)} ETB
                        </span>
                        {parseFloat(ord.cod_collected || "0") > 0 && (
                          <span className="text-[10px] font-semibold text-orange-600 block">
                            COD: -{parseFloat(ord.cod_collected || "0").toFixed(2)} ETB
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary Box (Dynamically updates with checked orders) */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Selected Deliveries:</span>
                <span className="font-bold text-gray-900">
                  {selectedOrders.length} of {selectedDriverGroup.orders.length} Deliveries
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Gross Delivery Fees:</span>
                <span className="font-bold text-gray-900">
                  +{selectedGrossFees.toFixed(2)} ETB
                </span>
              </div>
              {deductCod && selectedCodCollected > 0 && (
                <div className="flex justify-between text-xs text-orange-600">
                  <span>COD Cash Retained by Driver:</span>
                  <span className="font-bold">
                    -{selectedCodCollected.toFixed(2)} ETB
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-900">Net Amount to Disburse:</span>
                <span className="font-black text-green-600 text-base">
                  {selectedNetDisbursable.toFixed(2)} ETB
                </span>
              </div>
            </div>

            {/* Payout Options Form */}
            <div className="space-y-3 text-xs">
              {/* Payment Method */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Disbursement Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-medium text-gray-800"
                >
                  <option value="telebirr">Telebirr Transfer</option>
                  <option value="cbe_birr">CBE Birr Transfer</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="cash">Cash in Person</option>
                  <option value="other">Other Method</option>
                </select>
              </div>

              {/* Transaction Reference */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Transaction Reference / Slip # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telebirr Txn ID, Bank Ref #..."
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                />
              </div>

              {/* Deduct COD Checkbox */}
              {selectedCodCollected > 0 && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/60 border border-orange-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductCod}
                    onChange={(e) => setDeductCod(e.target.checked)}
                    className="mt-0.5 rounded text-secondary focus:ring-secondary"
                  />
                  <div>
                    <span className="font-bold text-orange-950 block">
                      Deduct COD Cash Retained ({selectedCodCollected.toFixed(2)} ETB)
                    </span>
                    <span className="text-[11px] text-orange-800">
                      Driver already holds this physical cash from customers, so deducting it ensures accurate reconciliation.
                    </span>
                  </div>
                </label>
              )}

              {/* Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Disbursement Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Settled for week of Oct 1 - Oct 7"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                />
              </div>
            </div>

            {/* Validation warning if no orders selected */}
            {selectedAssignmentIds.length === 0 && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please select at least 1 order to disburse payout.</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDisburseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submittingPayout || selectedAssignmentIds.length === 0}
                onClick={handleCreatePayout}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPayout ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Disbursing...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>
                      Disburse ({selectedNetDisbursable.toFixed(2)} ETB · {selectedAssignmentIds.length} Orders)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Detail Modal */}
      {detailModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-gray-900 text-lg">
                    Payout #{selectedPayout.payout_number}
                  </h3>
                  {renderStatusBadge(selectedPayout.status)}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Issued to {selectedPayout.driver_name} · {selectedPayout.company_name}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dispute Banner if disputed */}
            {selectedPayout.status === "disputed" && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-red-900 text-xs">Driver Dispute Filed</h5>
                  <p className="text-xs text-red-700 mt-1">
                    {selectedPayout.dispute_reason || "Driver reported an issue with this payout."}
                  </p>
                  {selectedPayout.disputed_at && (
                    <p className="text-[10px] text-red-500 mt-1">
                      Reported on {new Date(selectedPayout.disputed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Financial Details Grid */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Gross Delivery Fees</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  +{parseFloat(selectedPayout.gross_delivery_fees).toFixed(2)} ETB
                </p>
              </div>
              <div>
                <p className="text-[10px] text-orange-500 font-bold uppercase">COD Cash Retained</p>
                <p className="text-sm font-bold text-orange-600 mt-1">
                  -{parseFloat(selectedPayout.cod_cash_deducted).toFixed(2)} ETB
                </p>
              </div>
              <div>
                <p className="text-[10px] text-green-600 font-bold uppercase">Net Amount Paid</p>
                <p className="text-base font-black text-green-600 mt-1">
                  {parseFloat(selectedPayout.net_payout_amount).toFixed(2)} ETB
                </p>
              </div>
            </div>

            {/* Metadata Rows */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white rounded-xl border border-gray-100 p-3.5">
              <div>
                <span className="text-gray-400 font-medium">Payment Channel:</span>{" "}
                <span className="font-bold text-gray-800 capitalize">
                  {selectedPayout.payment_method?.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Payout Interval:</span>{" "}
                <span className="font-bold text-gray-800 capitalize">
                  {selectedPayout.payout_type}
                </span>
              </div>
              {selectedPayout.transaction_reference && (
                <div className="col-span-2">
                  <span className="text-gray-400 font-medium">Transaction Reference:</span>{" "}
                  <span className="font-mono font-bold text-gray-800">
                    {selectedPayout.transaction_reference}
                  </span>
                </div>
              )}
              {selectedPayout.confirmed_at && (
                <div>
                  <span className="text-gray-400 font-medium">Confirmed At:</span>{" "}
                  <span className="font-bold text-green-700">
                    {new Date(selectedPayout.confirmed_at).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedPayout.notes && (
                <div className="col-span-2">
                  <span className="text-gray-400 font-medium">Notes:</span>{" "}
                  <span className="text-gray-700">{selectedPayout.notes}</span>
                </div>
              )}
            </div>

            {/* Orders Included in Payout */}
            <div>
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">
                Settled Orders ({selectedPayout.items?.length || selectedPayout.items_count})
              </h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-400 font-semibold uppercase sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="py-2 px-3">Order Number</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3 text-right">Fee</th>
                      <th className="py-2 px-3 text-right">COD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedPayout.items || []).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-bold text-secondary">
                          #{item.order_number}
                        </td>
                        <td className="py-2 px-3 text-gray-700">{item.customer_name}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">
                          +{parseFloat(item.delivery_fee).toFixed(2)} ETB
                        </td>
                        <td className="py-2 px-3 text-right text-orange-600 font-medium">
                          {parseFloat(item.cod_collected) > 0
                            ? `-${parseFloat(item.cod_collected).toFixed(2)} ETB`
                            : "0.00 ETB"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
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
