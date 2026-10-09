import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  CreditCard,
  Award,
  Calendar,
  ShieldCheck,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  BarChart3,
  PieChart,
  Star,
  Briefcase,
  Layers,
  Package,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import api, {
  getMarketingPerformance,
  getAdminMarketingAgentPerformance,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

interface Agent {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_marketing: boolean;
  daily_target: number;
  weekly_target: number;
}

interface TargetProgress {
  registered_today: number;
  daily_target: number;
  daily_progress_percentage: number;
  registered_this_week: number;
  weekly_target: number;
  weekly_progress_percentage: number;
}

interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  business_type: string;
}

interface SubscriptionInfo {
  id: number;
  company_name: string;
  company_slug: string;
  plan_name: string;
  price: number;
  start_date: string;
  is_active: boolean;
}

interface DailyHistory {
  date: string;
  companies_registered_count: number;
  companies: CompanyInfo[];
  subscriptions_started: SubscriptionInfo[];
}

interface PerformanceData {
  agent: Agent;
  target_progress: TargetProgress;
  total_companies_registered: number;
  active_subscriptions_count: number;
  registrations_by_plan: Record<string, number>;
  daily_performance: DailyHistory[];
}

/* ============================================================
   Summary Card — matches Overview.tsx SummaryCard style
   ============================================================ */

interface SummaryStatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  changePercent?: number;
  comparisonLabel?: string;
  featured?: boolean;
  subStats?: { label: string; value: string }[];
}

const SummaryStatCard = ({
  title,
  value,
  icon: Icon,
  changePercent,
  comparisonLabel,
  featured = false,
  subStats,
}: SummaryStatCardProps) => {
  if (featured) {
    return (
      <article className="group h-full min-h-[190px] overflow-hidden rounded-xl border border-secondary/10 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 sm:p-5">
        <div className="flex h-full flex-col">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-medium leading-none text-gray-500">
                {title}
              </p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.06] text-secondary">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 truncate text-[34px] font-extrabold leading-none tracking-[-0.045em] text-secondary sm:text-[38px]">
              {value}
            </p>
            {changePercent !== undefined && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold leading-none text-secondary">
                  {changePercent > 0 ? "+" : ""}
                  {changePercent.toFixed(1)}%
                </span>
                {comparisonLabel && (
                  <span className="text-[9px] font-medium leading-none text-gray-400">
                    vs {comparisonLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {subStats && subStats.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-6 border-t border-secondary/10 pt-3.5">
              {subStats.slice(0, 2).map((item) => (
                <div key={item.label} className="min-w-0">
                  <p className="truncate text-[9px] font-medium leading-none text-gray-500">
                    {item.label}
                  </p>
                  <p className="mt-1.5 truncate text-sm font-bold leading-none text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full min-h-[52px] items-center rounded-lg border border-secondary/10 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.025)] transition-all duration-200 hover:border-secondary/20 hover:bg-secondary/[0.015]">
      <div className="flex w-full min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.06] text-secondary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[10px] font-medium leading-none text-gray-500">
              {title}
            </p>
            {changePercent !== undefined && (
              <span className="shrink-0 text-[10px] font-semibold leading-none tracking-[-0.01em] text-secondary">
                {changePercent > 0 ? "+" : ""}
                {changePercent.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="mt-1.5 truncate text-[19px] font-extrabold leading-none tracking-[-0.035em] text-secondary">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
};

/* ============================================================
   Progress Ring — Overview-style neutral card
   ============================================================ */

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
}

const ProgressRing = ({ value, max, label, sublabel }: ProgressRingProps) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage >= 100;
  const strokeColor = isComplete ? "#10B981" : "currentColor";

  return (
    <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col items-center gap-6 md:flex-row md:gap-8">
        <div className="relative h-36 w-36 shrink-0 text-secondary">
          <svg className="h-full w-full -rotate-90 transform">
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke="#E5E7EB"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke={strokeColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-secondary">
              {value}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              / {max}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
            <span className="rounded-full border border-secondary/20 bg-secondary/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
              {label}
            </span>
            {percentage >= 100 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/[0.06] px-2.5 py-1 text-[9px] font-bold text-secondary">
                <CheckCircle2 className="h-3 w-3" /> Achieved
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-secondary">{sublabel}</h3>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-500">
                Progress
              </span>
              <span className="text-[11px] font-bold text-secondary">
                {Math.round(percentage)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isComplete ? "bg-emerald-500" : "bg-secondary"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Main Component
   ============================================================ */

export default function MarketingOverview({
  agentId,
  initialAgent,
}: {
  agentId?: number;
  initialAgent?: any;
}) {
  const [loading, setLoading] = useState(true);
  const [_refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast, showToast } = useToast();

  const [companyData, setCompanyData] = useState<any>(null);
  const [_companyLoading, setCompanyLoading] = useState(false);

  const fetchPerformance = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      if (agentId) {
        try {
          const res = await getAdminMarketingAgentPerformance(agentId);
          setData(res.data);
        } catch (apiErr: any) {
          if (apiErr?.response?.status === 404 && initialAgent) {
            const dailyTarget = Number(initialAgent.daily_target) || 0;
            const weeklyTarget = Number(initialAgent.weekly_target) || 0;
            const companiesCount = Number(initialAgent.companies_count) || 0;
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
              total_companies_registered: companiesCount,
              active_subscriptions_count: 0,
              registrations_by_plan: {},
              daily_performance: [],
            });
            return;
          }
          throw apiErr;
        }
      } else {
        const res = await getMarketingPerformance();
        setData(res.data);
      }

      if (showRefresh) {
        showToast("success", "Dashboard refreshed successfully");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to load performance metrics",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompanyLoading(true);
      const response = await api.get("/companies/", {
        params: { ordering: "name", limit: 20 },
      });
      setCompanyData(response.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
    fetchCompanies();
  }, [agentId, initialAgent]);

  const chartData = useMemo(() => {
    if (!data?.daily_performance) return [];
    return [...data.daily_performance].reverse().map((day) => ({
      date: day.date,
      Registrations: day.companies_registered_count,
      Subscriptions: day.subscriptions_started.length,
    }));
  }, [data]);

  const trends = useMemo(() => {
    if (!data?.daily_performance || data.daily_performance.length < 2) {
      return { registrations: 0, subscriptions: 0 };
    }
    const today = data.daily_performance[0];
    const yesterday = data.daily_performance[1] || today;
    return {
      registrations:
        today.companies_registered_count -
        yesterday.companies_registered_count,
      subscriptions:
        today.subscriptions_started.length -
        yesterday.subscriptions_started.length,
    };
  }, [data]);

  const totalSubscriptions = useMemo(() => {
    if (!data?.registrations_by_plan) return 0;
    return Object.values(data.registrations_by_plan).reduce(
      (sum, count) => sum + count,
      0,
    );
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.registrations_by_plan) return [];
    return Object.entries(data.registrations_by_plan).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);

  const activeCompaniesCount = useMemo(() => {
    if (!companyData?.results) return 0;
    return companyData.results.filter((company: any) => company.is_active)
      .length;
  }, [companyData]);

  const featuredCount = useMemo(() => {
    if (!companyData?.results) return 0;
    return companyData.results.filter((company: any) => company.is_featured)
      .length;
  }, [companyData]);

  const uniqueCategories = useMemo(() => {
    if (!companyData?.results) return 0;
    const categories = new Set(
      companyData.results.map((company: any) => company.category_name),
    );
    return categories.size;
  }, [companyData]);

  const categoryData = useMemo(() => {
    if (!companyData?.results) return [];
    const categoryMap = new Map();
    companyData.results.forEach((company: any) => {
      const name = company.category_name || "Uncategorized";
      categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [companyData]);

  /* Neutral palette — same as Overview.tsx */
  const CHART_COLORS = [
    "var(--color-secondary)",
    "#6B7280",
    "#9CA3AF",
    "#D1D5DB",
    "#E5E7EB",
    "#F3F4F6",
  ];

  /* ------------------------------------------------------------
     LOADING SKELETON (Overview-matching)
     ------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
        <Toast toast={toast} />

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-secondary/[0.06]" />
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-secondary/[0.06]" />
            <div className="h-3 w-64 animate-pulse rounded bg-secondary/[0.06]" />
          </div>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="h-[190px] animate-pulse rounded-xl border border-secondary/10 bg-white" />
          <div className="grid grid-cols-1 grid-rows-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[52px] animate-pulse rounded-lg border border-secondary/10 bg-white"
              />
            ))}
          </div>
        </div>

        {/* Progress rings */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[220px] animate-pulse rounded-2xl border border-secondary/10 bg-white"
            />
          ))}
        </div>

        {/* Charts */}
        <div className="h-[300px] animate-pulse rounded-2xl border border-secondary/10 bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8">
        <div className="max-w-lg rounded-2xl border border-secondary/10 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/[0.06]">
            <XCircle className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-secondary">
            Dashboard Unavailable
          </h3>
          <p className="text-sm text-gray-500">
            {error || "No data returned from the server"}
          </p>
          <button
            onClick={() => fetchPerformance()}
            className="mt-8 rounded-xl bg-secondary px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-secondary/90 active:scale-95"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    agent,
    target_progress,
    total_companies_registered,
    registrations_by_plan,
    daily_performance,
  } = data;

  /* ------------------------------------------------------------
     MAIN RENDER
     ------------------------------------------------------------ */
  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Toast toast={toast} />

      {/* =========================================================
          HEADER
          ========================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
            <BarChart3 className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary/70">
                Marketing Overview
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {agent.first_name || agent.username || "Agent"}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              ID: {agent.id}
              <span className="mx-1.5 text-gray-300">·</span>
              {total_companies_registered} companies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-secondary/10 bg-white p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-2 transition-all ${
              viewMode === "grid"
                ? "bg-secondary text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 transition-all ${
              viewMode === "list"
                ? "bg-secondary text-white"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* =========================================================
          SUMMARY — same layout as Overview.tsx
          ========================================================= */}
      <section className="rounded-2xl bg-white p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
          <span className="font-semibold text-secondary">
            Total Companies Registered
          </span>
          <span>·</span>
          <span>All time</span>
        </div>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
          {/* Featured card */}
          <SummaryStatCard
            featured
            title="Total Companies"
            value={total_companies_registered.toLocaleString()}
            icon={Building2}
            changePercent={trends.registrations}
            comparisonLabel="yesterday"
            subStats={[
              {
                label: "This week",
                value: target_progress.registered_this_week.toString(),
              },
              {
                label: "Today",
                value: target_progress.registered_today.toString(),
              },
            ]}
          />

          {/* Three stacked cards */}
          <div className="grid grid-cols-1 grid-rows-3 gap-2">
            <SummaryStatCard
              title="Active Companies"
              value={activeCompaniesCount.toLocaleString()}
              icon={ShieldCheck}
            />
            <SummaryStatCard
              title="Featured Companies"
              value={featuredCount.toLocaleString()}
              icon={Star}
            />
            <SummaryStatCard
              title="Categories"
              value={uniqueCategories.toLocaleString()}
              icon={Layers}
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          TARGET PROGRESS
          ========================================================= */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            Targets
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Goal progress
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProgressRing
            value={target_progress.registered_today}
            max={target_progress.daily_target}
            label="Today's Goal"
            sublabel="Daily Company Onboardings"
          />
          <ProgressRing
            value={target_progress.registered_this_week}
            max={target_progress.weekly_target}
            label="Weekly Quota"
            sublabel="Weekly Company Onboardings"
          />
        </div>
      </section>

      {/* =========================================================
          CATEGORY CHART
          ========================================================= */}
      {categoryData.length > 0 && (
        <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Companies by Category
              </h3>
              <p className="text-[11px] text-gray-400">
                Distribution across business categories
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-secondary)"
                  radius={[4, 4, 0, 0]}
                >
                  {categoryData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* =========================================================
          SUBSCRIPTION BREAKDOWN
          ========================================================= */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <CreditCard className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Subscription Breakdown
              </h3>
              <p className="text-[11px] text-gray-400">
                Plan distribution across all companies
              </p>
            </div>
          </div>

          {Object.keys(registrations_by_plan).length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/[0.06]">
                <CreditCard className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-400">
                No active subscriptions found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Object.entries(registrations_by_plan).map(
                ([planName, count]) => {
                  const percentage =
                    totalSubscriptions > 0
                      ? (count / totalSubscriptions) * 100
                      : 0;

                  return (
                    <div
                      key={planName}
                      className="rounded-2xl border border-secondary/10 bg-white p-5 transition-all hover:border-secondary/20"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">
                          {planName}
                        </span>
                        <span className="text-2xl font-extrabold text-secondary">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-secondary transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] font-medium text-gray-500">
                        {percentage > 0
                          ? `${Math.round(percentage)}% of total subscriptions`
                          : "No active subscriptions"}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <PieChart className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Distribution
              </h3>
              <p className="text-[11px] text-gray-400">Visual overview</p>
            </div>
          </div>

          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-[10px] font-semibold text-gray-600">
                      {entry.name}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-gray-400">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          PERFORMANCE TRENDS
          ========================================================= */}
      {chartData.length > 0 && (
        <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Performance Trends
                </h3>
                <p className="text-[11px] text-gray-400">
                  Timeline of onboarding history
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-[11px] font-semibold">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-secondary" />
                <span className="text-gray-600">Registrations</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-gray-600">Subscriptions</span>
              </span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mktColorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-secondary)"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-secondary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="mktColorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#111827" }}
                />
                <Area
                  type="monotone"
                  dataKey="Registrations"
                  stroke="var(--color-secondary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#mktColorRegs)"
                />
                <Area
                  type="monotone"
                  dataKey="Subscriptions"
                  stroke="#9CA3AF"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#mktColorSubs)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* =========================================================
          RECENT COMPANIES
          ========================================================= */}
      {companyData?.results && companyData.results.length > 0 && (
        <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
                <Building2 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Recent Companies
                </h3>
                <p className="text-[11px] text-gray-400">
                  Latest registrations on the platform
                </p>
              </div>
            </div>
            <span className="rounded-full border border-secondary/10 bg-secondary/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-500">
              {companyData.results.length} shown
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {companyData.results.slice(0, 6).map((company: any) => (
              <div
                key={company.id}
                className="flex items-center gap-3 rounded-xl border border-secondary/10 bg-white p-3 transition-all hover:border-secondary/20"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-secondary/10 bg-secondary/[0.04]">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {company.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-medium text-gray-500">
                      {company.category_name}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        company.is_active
                          ? "border-secondary/20 bg-secondary/[0.06] text-secondary"
                          : "border-gray-200 bg-gray-100 text-gray-500"
                      }`}
                    >
                      {company.is_active ? "Active" : "Inactive"}
                    </span>
                    {company.is_featured && (
                      <span className="rounded-full border border-secondary/20 bg-secondary/[0.06] px-2 py-0.5 text-[9px] font-bold text-secondary">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    company.is_active ? "bg-secondary" : "bg-gray-300"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          COMPANY OVERVIEW (Registered By + Business Types)
          ========================================================= */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Registered By
              </h3>
              <p className="text-[11px] text-gray-400">
                Who registered the companies
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-secondary/10 bg-white p-3">
              <span className="text-sm font-medium text-gray-600">
                Marketing Team
              </span>
              <span className="text-sm font-bold text-secondary">
                {companyData?.results?.filter(
                  (c: any) => c.registered_by_username === "marketingone",
                ).length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-secondary/10 bg-white p-3">
              <span className="text-sm font-medium text-gray-600">Kaleb</span>
              <span className="text-sm font-bold text-secondary">
                {companyData?.results?.filter(
                  (c: any) => c.registered_by_username === "kaleb",
                ).length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-secondary/10 bg-white p-3">
              <span className="text-sm font-medium text-gray-600">
                Unassigned
              </span>
              <span className="text-sm font-bold text-gray-400">
                {companyData?.results?.filter(
                  (c: any) => !c.registered_by_username,
                ).length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <Briefcase className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Business Types
              </h3>
              <p className="text-[11px] text-gray-400">
                Distribution by business model
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["brand", "store", "service"].map((type) => {
              const count =
                companyData?.results?.filter(
                  (c: any) => c.business_type === type,
                ).length || 0;
              const percentage = companyData?.count
                ? Math.round((count / companyData.count) * 100)
                : 0;

              return (
                <div
                  key={type}
                  className="rounded-xl border border-secondary/10 bg-white p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-600">
                      {type}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-secondary transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-gray-400">
                    {percentage}% of total
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          COMPANY STATUS + FEATURED
          ========================================================= */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Company Status
              </h3>
              <p className="text-[11px] text-gray-400">Active vs Inactive</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Active
                </span>
                <span className="text-sm font-bold text-secondary">
                  {activeCompaniesCount}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-1000"
                  style={{
                    width: `${
                      companyData?.count
                        ? (activeCompaniesCount / companyData.count) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Inactive
                </span>
                <span className="text-sm font-bold text-gray-500">
                  {companyData?.count
                    ? companyData.count - activeCompaniesCount
                    : 0}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-400 transition-all duration-1000"
                  style={{
                    width: `${
                      companyData?.count
                        ? ((companyData.count - activeCompaniesCount) /
                            companyData.count) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <Star className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Featured Status
              </h3>
              <p className="text-[11px] text-gray-400">
                Premium featured companies
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-secondary">
                {featuredCount}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Featured Companies
              </p>
              <div className="mt-3 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.min(Math.ceil(featuredCount / 2), 5)
                        ? "fill-secondary text-secondary"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] text-gray-400">
                {companyData?.count
                  ? Math.round((featuredCount / companyData.count) * 100)
                  : 0}
                % of total companies
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          DAILY ACTIVITY LOG
          ========================================================= */}
      <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Daily Activity Log
              </h3>
              <p className="text-[11px] text-gray-400">
                Chronological audit of registrations and subscriptions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-secondary/10 bg-secondary/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-600">
              {daily_performance.length} days
            </span>
            <span className="rounded-full border border-secondary/20 bg-secondary/[0.06] px-3 py-1.5 text-xs font-semibold text-secondary">
              {total_companies_registered} total
            </span>
          </div>
        </div>

        {daily_performance.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/[0.06]">
              <Calendar className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-500">
              No activity history found
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Start registering companies to build your log.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {daily_performance.map((day, index) => {
              const isLatest = index === 0;
              const hasActivity =
                day.companies.length > 0 ||
                day.subscriptions_started.length > 0;

              return (
                <div
                  key={day.date}
                  className={`overflow-hidden rounded-xl border p-4 transition-all ${
                    isLatest
                      ? "border-secondary/25 bg-secondary/[0.03]"
                      : "border-secondary/10 bg-white hover:border-secondary/20"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-secondary/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isLatest
                            ? "bg-secondary text-white"
                            : "bg-secondary/[0.06] text-secondary"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900">
                          {day.date}
                        </span>
                        {isLatest && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-secondary/20 bg-secondary/[0.06] px-2 py-0.5 text-[9px] font-bold text-secondary">
                            Latest
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${
                          day.companies_registered_count > 0
                            ? "border-secondary/20 bg-secondary/[0.06] text-secondary"
                            : "border-gray-200 bg-gray-100 text-gray-400"
                        }`}
                      >
                        {day.companies_registered_count} companies
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${
                          day.subscriptions_started.length > 0
                            ? "border-secondary/20 bg-secondary/[0.06] text-secondary"
                            : "border-gray-200 bg-gray-100 text-gray-400"
                        }`}
                      >
                        {day.subscriptions_started.length} subs
                      </span>
                    </div>
                  </div>

                  {hasActivity ? (
                    <div className="mt-3 space-y-4">
                      {day.companies.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <Building2 className="h-3 w-3" /> Companies (
                            {day.companies.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {day.companies.slice(0, 5).map((company) => (
                              <span
                                key={company.id}
                                className="inline-flex items-center gap-2 rounded-lg border border-secondary/10 bg-white px-3 py-1.5 text-[10px] font-medium text-gray-700"
                              >
                                {company.logo ? (
                                  <img
                                    src={company.logo}
                                    alt=""
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-white">
                                    {company.name[0]}
                                  </div>
                                )}
                                {company.name}
                              </span>
                            ))}
                            {day.companies.length > 5 && (
                              <span className="rounded-lg bg-secondary/[0.04] px-2 py-1.5 text-[10px] font-medium text-gray-400">
                                +{day.companies.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {day.subscriptions_started.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <Award className="h-3 w-3" /> Subscriptions (
                            {day.subscriptions_started.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {day.subscriptions_started
                              .slice(0, 4)
                              .map((sub) => (
                                <span
                                  key={sub.id}
                                  className="rounded-lg border border-secondary/20 bg-secondary/[0.06] px-3 py-1.5 text-[10px] font-medium text-secondary"
                                >
                                  {sub.company_name} ·{" "}
                                  <span className="font-bold">
                                    {sub.plan_name}
                                  </span>
                                </span>
                              ))}
                            {day.subscriptions_started.length > 4 && (
                              <span className="rounded-lg bg-secondary/[0.04] px-2 py-1.5 text-[10px] font-medium text-gray-400">
                                +{day.subscriptions_started.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 py-4 text-center">
                      <p className="text-[11px] italic text-gray-400">
                        No activity recorded on this day
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}