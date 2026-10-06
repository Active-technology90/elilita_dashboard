import { useState, useEffect, useMemo } from "react";
import {
  X,
  Target,
  Award,
  Building2,
  CheckCircle,
  RefreshCw,
  Search,
  Layers,
  Calendar,
} from "lucide-react";
import { getAdminMarketingAgentPerformance } from "../../../services/api";

interface CompanyAction {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  business_type: string;
}

interface SubscriptionAction {
  id: number;
  company_name: string;
  company_slug: string;
  plan_name: string;
  price: number;
  start_date: string;
  is_active: boolean;
}

interface DailyPerformance {
  date: string;
  companies_registered_count: number;
  companies: CompanyAction[];
  subscriptions_started: SubscriptionAction[];
}

interface AgentPerformancePayload {
  agent: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_marketing: boolean;
    daily_target: number;
    weekly_target: number;
  };
  target_progress: {
    registered_today: number;
    daily_target: number;
    daily_progress_percentage: number;
    registered_this_week: number;
    weekly_target: number;
    weekly_progress_percentage: number;
  };
  total_companies_registered: number;
  active_subscriptions_count: number;
  registrations_by_plan: Record<string, number>;
  daily_performance: DailyPerformance[];
}

interface AgentAuditModalProps {
  agentId: number;
  agentName?: string;
  initialAgent?: any;
  onClose: () => void;
}

export default function AgentAuditModal({
  agentId,
  agentName: propAgentName,
  initialAgent,
  onClose,
}: AgentAuditModalProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentPerformancePayload | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"companies" | "subscriptions">("companies");

  const fetchAuditData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await getAdminMarketingAgentPerformance(agentId);
        setData(res.data);
      } catch (err: any) {
        // Fallback gracefully if endpoint is deploying or returns 404
        if (err?.response?.status === 404 && initialAgent) {
          const dailyTarget = Number(initialAgent.daily_target) || 0;
          const weeklyTarget = Number(initialAgent.weekly_target) || 0;
          const totalCompanies = Number(initialAgent.companies_count) || 0;

          setData({
            agent: {
              id: initialAgent.id,
              username: initialAgent.username || `Agent #${agentId}`,
              email: initialAgent.email || "",
              first_name: initialAgent.first_name || "",
              last_name: initialAgent.last_name || "",
              is_marketing: true,
              daily_target: dailyTarget,
              weekly_target: weeklyTarget,
            },
            target_progress: {
              registered_today: 0,
              daily_target: dailyTarget,
              daily_progress_percentage: 0,
              registered_this_week: 0,
              weekly_target: weeklyTarget,
              weekly_progress_percentage: 0,
            },
            total_companies_registered: totalCompanies,
            active_subscriptions_count: 0,
            registrations_by_plan: {},
            daily_performance: [],
          });
          return;
        }
        throw err;
      }
    } catch (err: any) {
      console.error("Failed to load audit data:", err);
      setError(err?.response?.data?.error || err?.response?.data?.detail || "Failed to load agent performance metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [agentId]);

  // Aggregate all registered companies for searching
  const allRegisteredCompanies = useMemo(() => {
    if (!data?.daily_performance) return [];
    return data.daily_performance.flatMap((day) =>
      day.companies.map((c) => ({ ...c, registered_date: day.date }))
    );
  }, [data]);

  // Aggregate all subscriptions for searching
  const allSubscriptions = useMemo(() => {
    if (!data?.daily_performance) return [];
    return data.daily_performance.flatMap((day) =>
      day.subscriptions_started.map((s) => ({ ...s, action_date: day.date }))
    );
  }, [data]);

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return allRegisteredCompanies;
    const term = searchTerm.toLowerCase();
    return allRegisteredCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        c.business_type?.toLowerCase().includes(term)
    );
  }, [allRegisteredCompanies, searchTerm]);

  // Filtered subscriptions based on search
  const filteredSubscriptions = useMemo(() => {
    if (!searchTerm.trim()) return allSubscriptions;
    const term = searchTerm.toLowerCase();
    return allSubscriptions.filter(
      (s) =>
        s.company_name.toLowerCase().includes(term) ||
        s.plan_name.toLowerCase().includes(term)
    );
  }, [allSubscriptions, searchTerm]);

  const agentName = useMemo(() => {
    if (propAgentName) return propAgentName;
    if (data?.agent) {
      const full = `${data.agent.first_name} ${data.agent.last_name}`.trim();
      return full || data.agent.username;
    }
    if (initialAgent) {
      const full = `${initialAgent.first_name || ""} ${initialAgent.last_name || ""}`.trim();
      return full || initialAgent.username;
    }
    return `Agent #${agentId}`;
  }, [data, initialAgent, agentId]);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/50 p-3 sm:p-4">
      <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-2xl">
        {/* ======================================================== */}
        {/* MODAL HEADER (White with secondary accent) */}
        {/* ======================================================== */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary font-bold text-sm">
              {agentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">{agentName}</h2>
                <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                  Agent Audit
                </span>
              </div>
              <p className="text-xs text-gray-500">
                @{data?.agent.username || initialAgent?.username || "agent"} • ID: #{agentId}
                {(data?.agent.email || initialAgent?.email) && ` • ${data?.agent.email || initialAgent?.email}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
              title="Refresh performance metrics"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-secondary ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODAL BODY */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            /* Loading Skeleton */
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                    <div className="h-7 w-20 bg-gray-200 rounded"></div>
                    <div className="h-2 w-full bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error && !data ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary mb-3">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Performance Data Unavailable</h3>
              <p className="mt-1 max-w-sm text-xs text-gray-500">{error}</p>
              <button
                onClick={() => fetchAuditData(false)}
                className="mt-4 rounded-xl bg-secondary px-5 py-2 text-xs font-bold text-white transition hover:bg-secondary/90 active:scale-95"
              >
                Retry Loading
              </button>
            </div>
          ) : data ? (
            <>
              {/* ======================================================== */}
              {/* SECTION 1: KEY PERFORMANCE METRICS */}
              {/* ======================================================== */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Performance Summary
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Daily Target Progress */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-secondary/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Daily Target</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                        <Target className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900">
                        {data.target_progress.registered_today}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        / {data.target_progress.daily_target}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-1">
                        <span>Today</span>
                        <span className="text-secondary font-bold">
                          {data.target_progress.daily_progress_percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary transition-all duration-500"
                          style={{
                            width: `${Math.min(100, data.target_progress.daily_progress_percentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weekly Target Progress */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-secondary/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Weekly Quota</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                        <Award className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900">
                        {data.target_progress.registered_this_week}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        / {data.target_progress.weekly_target}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-1">
                        <span>This Week</span>
                        <span className="text-secondary font-bold">
                          {data.target_progress.weekly_progress_percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary transition-all duration-500"
                          style={{
                            width: `${Math.min(100, data.target_progress.weekly_progress_percentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Companies Registered */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-secondary/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Total Companies</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                        <Building2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-gray-900">
                        {data.total_companies_registered}
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] text-gray-500">
                      Total lifetime onboardings
                    </p>
                  </div>

                  {/* Active Subscriptions */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-secondary/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">Active Subscriptions</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-gray-900">
                        {data.active_subscriptions_count}
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] text-gray-500">
                      Currently active plans
                    </p>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 2: SUBSCRIPTION BREAKDOWN (IF ANY) */}
              {/* ======================================================== */}
              {data.registrations_by_plan && Object.keys(data.registrations_by_plan).length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-secondary" />
                    <h4 className="text-xs font-bold text-gray-700">Subscriptions by Plan</h4>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(data.registrations_by_plan).map(([plan, count]) => (
                      <div
                        key={plan}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs"
                      >
                        <span className="font-semibold text-gray-700">{plan}</span>
                        <span className="rounded-md bg-secondary/10 px-1.5 py-0.5 font-bold text-secondary">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 3: AGENT ACTIONS AUDIT LOG */}
              {/* ======================================================== */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Agent Action History</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Chronological audit of companies registered and subscriptions onboarded
                    </p>
                  </div>

                  {/* Tabs: Companies vs Subscriptions */}
                  <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                    <button
                      onClick={() => setActiveTab("companies")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        activeTab === "companies"
                          ? "bg-white text-secondary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Companies ({allRegisteredCompanies.length})</span>
                    </button>
                    {/* <button
                      onClick={() => setActiveTab("subscriptions")}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        activeTab === "subscriptions"
                          ? "bg-white text-secondary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Subscriptions ({allSubscriptions.length})</span>
                    </button> */}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      activeTab === "companies"
                        ? "Search registered companies by name or type..."
                        : "Search subscriptions by company or plan..."
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                  />
                </div>

                {/* Actions Table / List */}
                <div className="mt-4">
                  {activeTab === "companies" ? (
                    filteredCompanies.length === 0 ? (
                      <div className="py-12 text-center">
                        <Building2 className="mx-auto h-8 w-8 text-gray-300" />
                        <p className="mt-2 text-xs font-semibold text-gray-600">
                          {searchTerm ? "No companies matched your search" : "No companies registered yet"}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Actions performed by this agent will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between py-3 hover:bg-gray-50/60 px-2 rounded-lg transition"
                          >
                            <div className="flex items-center gap-3">
                              {company.logo ? (
                                <img
                                  src={company.logo}
                                  alt={company.name}
                                  className="h-9 w-9 rounded-lg object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary font-bold text-xs">
                                  {company.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-gray-900">{company.name}</h5>
                                  {company.business_type && (
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 capitalize">
                                      {company.business_type}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                  <span>Slug: {company.slug}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-gray-400" />
                                    {formatDateTime(company.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  company.is_active
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}
                              >
                                {company.is_active ? "Active" : "Inactive"}
                              </span>
                              <span className="text-[11px] font-mono text-gray-400">
                                #{company.id}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : filteredSubscriptions.length === 0 ? (
                    <div className="py-12 text-center">
                      <Layers className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="mt-2 text-xs font-semibold text-gray-600">
                        {searchTerm ? "No subscriptions matched your search" : "No subscriptions started yet"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Client subscriptions initiated by this agent will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredSubscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between py-3 hover:bg-gray-50/60 px-2 rounded-lg transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-gray-900">{sub.company_name}</h5>
                                <span className="rounded bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                                  {sub.plan_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                <span>{sub.company_slug}</span>
                                <span>•</span>
                                <span>Started: {formatDateTime(sub.start_date)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-black text-gray-900">
                              {sub.price.toLocaleString()} ETB
                            </div>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5 ${
                                sub.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {sub.is_active ? "Active" : "Expired"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* ======================================================== */}
        {/* MODAL FOOTER */}
        {/* ======================================================== */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3">
          <span className="text-[11px] text-gray-400">
            Agent Performance &amp; Actions Audit
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
