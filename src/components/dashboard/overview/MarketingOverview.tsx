
import { useState, useEffect, useMemo, useCallback } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  CreditCard,
  Award,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  BarChart3,
  PieChart,
  Star,
  Layers,
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
import {
  getMarketingPerformance,
  getAdminMarketingAgentPerformance,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

/* ============================================================
   TYPES
   ============================================================ */

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

interface SummaryStatCardProps {
  title: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  changePercent?: number;
  comparisonLabel?: string;
  featured?: boolean;
  subStats?: { label: string; value: string }[];
}

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
}

/* ============================================================
   TRANSLATION HELPER
   ============================================================ */

const translateDynamicValue = (
  t: any,
  category: string,
  value: string | null | undefined,
): string => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const normalizedValue = value
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalizedValue) {
    return value;
  }

  return t(`${category}.${normalizedValue}`, {
    defaultValue: value,
  });
};

/* ============================================================
   SUMMARY CARD
   ============================================================ */

const SummaryStatCard = ({
  title,
  value,
  icon: Icon,
  changePercent,
  comparisonLabel,
  featured = false,
  subStats,
}: SummaryStatCardProps) => {
  const { t } = useTranslation("marketing");

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
                    {t("vs")} {comparisonLabel}
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
   PROGRESS RING
   ============================================================ */

const ProgressRing = ({
  value,
  max,
  label,
  sublabel,
}: ProgressRingProps) => {
  const { t } = useTranslation("marketing");

  const safeValue = Number(value) || 0;
  const safeMax = Number(max) || 0;

  const percentage =
    safeMax > 0 ? Math.min((safeValue / safeMax) * 100, 100) : 0;

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
              {safeValue}
            </span>

            <span className="text-[11px] font-semibold text-gray-400">
              / {safeMax}
            </span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
            <span className="rounded-full border border-secondary/20 bg-secondary/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
              {label}
            </span>

            {isComplete && (
              <span className="inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/[0.06] px-2.5 py-1 text-[9px] font-bold text-secondary">
                <CheckCircle2 className="h-3 w-3" />
                {t("achieved")}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-secondary">{sublabel}</h3>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-500">
                {t("progress")}
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
   MAIN COMPONENT
   ============================================================ */

export default function MarketingOverview({
  agentId,
  initialAgent,
}: {
  agentId?: number;
  initialAgent?: any;
}) {
  const { t } = useTranslation("marketing");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { toast, showToast } = useToast();

  /* ============================================================
     FETCH PERFORMANCE
     ============================================================ */

  const fetchPerformance = useCallback(
    async (showRefresh = false) => {
      const mode = agentId ? `agent #${agentId}` : "self (marketing)";

      console.log(
        `%c[MarketingOverview] Fetching performance data — ${mode}`,
        "color: #674FA3; font-weight: bold;",
      );

      try {
        setLoading(true);
        setError("");

        let responseData: PerformanceData;

        if (agentId) {
          try {
            const res = await getAdminMarketingAgentPerformance(agentId);
            responseData = res.data;
          } catch (apiErr: any) {
            if (apiErr?.response?.status === 404 && initialAgent) {
              const dailyTarget = Number(initialAgent.daily_target) || 0;
              const weeklyTarget = Number(initialAgent.weekly_target) || 0;
              const companiesCount =
                Number(initialAgent.companies_count) || 0;

              responseData = {
                agent: {
                  id: initialAgent.id ?? agentId,
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
              };

              setData(responseData);

              if (showRefresh) {
                showToast("success", t("dashboardRefreshed"));
              }

              return;
            }

            throw apiErr;
          }
        } else {
          const res = await getMarketingPerformance();
          responseData = res.data;
        }

        if (!responseData) {
          throw new Error(t("noDataReturned"));
        }

        // Normalize optional API collections to prevent runtime errors.
        responseData = {
          ...responseData,
          registrations_by_plan: responseData.registrations_by_plan || {},
          daily_performance: (responseData.daily_performance || []).map(
            (day) => ({
              ...day,
              companies: day.companies || [],
              subscriptions_started: day.subscriptions_started || [],
            }),
          ),
        };

        setData(responseData);

        if (showRefresh) {
          showToast("success", t("dashboardRefreshed"));
        }
      } catch (err: any) {
        console.error(
          "[MarketingOverview] Failed to load performance metrics",
          err,
        );

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            err?.message ||
            t("failedToLoadMetrics"),
        );
      } finally {
        setLoading(false);
      }
    },
    [agentId, initialAgent, showToast, t],
  );

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  /* ============================================================
     DERIVED DATA
     ============================================================ */

  const chartData = useMemo(() => {
    if (!data?.daily_performance) return [];

    return [...data.daily_performance].reverse().map((day) => ({
      date: day.date,
      Registrations: Number(day.companies_registered_count) || 0,
      Subscriptions: day.subscriptions_started.length,
    }));
  }, [data]);

  const trends = useMemo(() => {
    if (!data?.daily_performance || data.daily_performance.length < 2) {
      return { registrations: 0, subscriptions: 0 };
    }

    const today = data.daily_performance[0];
    const yesterday = data.daily_performance[1];

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
      (sum, count) => sum + (Number(count) || 0),
      0,
    );
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.registrations_by_plan) return [];

    return Object.entries(data.registrations_by_plan).map(
      ([name, value]) => ({
        name,
        value: Number(value) || 0,
      }),
    );
  }, [data]);

  const activeCompaniesCount = useMemo(() => {
    if (!data?.daily_performance) return 0;

    const seen = new Set<number>();

    data.daily_performance.forEach((day) => {
      day.companies.forEach((company) => {
        if (company.is_active) {
          seen.add(company.id);
        }
      });
    });

    return seen.size;
  }, [data]);

  // Keep this connected to a real featured-companies API field
  // when the backend provides one.
  const featuredCompaniesCount = 0;

  const uniqueCategories = useMemo(() => {
    if (!data?.daily_performance) return 0;

    const seen = new Set<string>();

    data.daily_performance.forEach((day) => {
      day.companies.forEach((company) => {
        if (company.business_type) {
          seen.add(company.business_type);
        }
      });
    });

    return seen.size;
  }, [data]);

  const categoryData = useMemo(() => {
    if (!data?.daily_performance) return [];

    const map = new Map<string, number>();

    data.daily_performance.forEach((day) => {
      day.companies.forEach((company) => {
        const key = company.business_type?.trim() || "Uncategorized";
        map.set(key, (map.get(key) || 0) + 1);
      });
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      translatedName: translateDynamicValue(
        t,
        "businessTypeNames",
        name,
      ),
    }));
  }, [data, t]);

  const CHART_COLORS = [
    "var(--color-secondary)",
    "#6B7280",
    "#9CA3AF",
    "#D1D5DB",
    "#E5E7EB",
    "#F3F4F6",
  ];

  /* ============================================================
     LOADING STATE
     ============================================================ */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-2 sm:px-4 lg:px-6">
        <Toast toast={toast} />

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-secondary/[0.06]" />

          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-secondary/[0.06]" />
            <div className="h-3 w-64 animate-pulse rounded bg-secondary/[0.06]" />
          </div>
        </div>

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
      </div>
    );
  }

  /* ============================================================
     ERROR STATE
     ============================================================ */

  if (error || !data) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8">
        <Toast toast={toast} />

        <div className="max-w-lg rounded-2xl border border-secondary/10 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/[0.06]">
            <XCircle className="h-10 w-10 text-gray-400" />
          </div>

          <h3 className="mb-2 text-xl font-bold text-secondary">
            {t("dashboardUnavailable")}
          </h3>

          <p className="text-sm text-gray-500">
            {error || t("noDataReturned")}
          </p>

          <button
            onClick={() => fetchPerformance()}
            className="mt-8 rounded-xl bg-secondary px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-secondary/90 active:scale-95"
          >
            {t("retryLoading")}
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

  /* ============================================================
     MAIN RENDER
     ============================================================ */

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-2 sm:px-4 lg:px-6">
      <Toast toast={toast} />

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
            <BarChart3 className="h-5 w-5 text-secondary" />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary/70">
                {t("overview")}
              </span>
            </div>

            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {agent.first_name || agent.username || t("agent")}
            </h1>

            <p className="mt-0.5 text-xs text-gray-500">
              {t("id")}: {agent.id}
              <span className="mx-1.5 text-gray-300">·</span>
              {total_companies_registered} {t("companies")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 self-start rounded-xl border border-secondary/10 bg-white p-1 sm:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            aria-label={t("gridView")}
            title={t("gridView")}
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
            aria-label={t("listView")}
            title={t("listView")}
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

      {/* SUMMARY */}
      <section className="rounded-2xl bg-white p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
          <span className="font-semibold text-secondary">
            {t("totalCompaniesRegistered")}
          </span>

          <span>·</span>

          <span>{t("allTime")}</span>
        </div>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
          <SummaryStatCard
            featured
            title={t("totalCompanies")}
            value={total_companies_registered.toLocaleString()}
            icon={Building2}
            changePercent={trends.registrations}
            comparisonLabel={t("yesterday")}
            subStats={[
              {
                label: t("thisWeek"),
                value: target_progress.registered_this_week.toString(),
              },
              {
                label: t("today"),
                value: target_progress.registered_today.toString(),
              },
            ]}
          />

          <div className="grid grid-cols-1 grid-rows-3 gap-2">
            <SummaryStatCard
              title={t("activeCompanies")}
              value={activeCompaniesCount.toLocaleString()}
              icon={ShieldCheck}
            />

            <SummaryStatCard
              title={t("featuredCompanies")}
              value={featuredCompaniesCount.toLocaleString()}
              icon={Star}
            />

            <SummaryStatCard
              title={t("businessTypes")}
              value={uniqueCategories.toLocaleString()}
              icon={Layers}
            />
          </div>
        </div>
      </section>

      {/* TARGET PROGRESS */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            {t("targets")}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {t("goalProgress")}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProgressRing
            value={target_progress.registered_today}
            max={target_progress.daily_target}
            label={t("todayGoal")}
            sublabel={t("dailyCompanyOnboardings")}
          />

          <ProgressRing
            value={target_progress.registered_this_week}
            max={target_progress.weekly_target}
            label={t("weeklyQuota")}
            sublabel={t("weeklyCompanyOnboardings")}
          />
        </div>
      </section>

      {/* CATEGORY CHART */}
      {categoryData.length > 0 && (
        <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                {t("companiesByBusinessType")}
              </h3>

              <p className="text-[11px] text-gray-400">
                {t("businessTypeDistribution")}
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
                  dataKey="translatedName"
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
                  formatter={(value: any) => [value, t("companies")]}
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

      {/* SUBSCRIPTION BREAKDOWN */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:col-span-2 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <CreditCard className="h-5 w-5 text-secondary" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                {t("subscriptionBreakdown")}
              </h3>

              <p className="text-[11px] text-gray-400">
                {t("planDistribution")}
              </p>
            </div>
          </div>

          {Object.keys(registrations_by_plan).length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/[0.06]">
                <CreditCard className="h-8 w-8 text-gray-300" />
              </div>

              <p className="font-medium text-gray-400">
                {t("noActiveSubscriptions")}
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
                          {translateDynamicValue(t, "plans", planName)}
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
                          ? t("percentageOfTotal", {
                              percentage: Math.round(percentage),
                            })
                          : t("noActiveSubscriptions")}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* PIE CHART */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <PieChart className="h-5 w-5 text-secondary" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                {t("distribution")}
              </h3>

              <p className="text-[11px] text-gray-400">
                {t("visualOverview")}
              </p>
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
                    formatter={(value: any) => [value, t("subscriptions")]}
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
                      {translateDynamicValue(t, "plans", entry.name)}
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
              <p className="text-sm">{t("noDataAvailable")}</p>
            </div>
          )}
        </div>
      </section>

      {/* PERFORMANCE TRENDS */}
      {chartData.length > 0 && (
        <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {t("performanceTrends")}
                </h3>

                <p className="text-[11px] text-gray-400">
                  {t("onboardingHistory")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-[11px] font-semibold">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-secondary" />
                <span className="text-gray-600">{t("registrations")}</span>
              </span>

              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-gray-600">{t("subscriptions")}</span>
              </span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="mktColorRegs"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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

                  <linearGradient
                    id="mktColorSubs"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  labelStyle={{
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                  formatter={(value: any, name: any) => [
                    value,
                    name === "Registrations"
                      ? t("registrations")
                      : t("subscriptions"),
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="Registrations"
                  name="Registrations"
                  stroke="var(--color-secondary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#mktColorRegs)"
                />

                <Area
                  type="monotone"
                  dataKey="Subscriptions"
                  name="Subscriptions"
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

      {/* DAILY ACTIVITY LOG */}
      <section className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/[0.06]">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                {t("dailyActivityLog")}
              </h3>

              <p className="text-[11px] text-gray-400">
                {t("dailyActivityDescription")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-secondary/10 bg-secondary/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-600">
              {t("daysCount", {
                count: daily_performance.length,
              })}
            </span>

            <span className="rounded-full border border-secondary/20 bg-secondary/[0.06] px-3 py-1.5 text-xs font-semibold text-secondary">
              {t("totalCount", {
                count: total_companies_registered,
              })}
            </span>
          </div>
        </div>

        {daily_performance.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/[0.06]">
              <Calendar className="h-10 w-10 text-gray-300" />
            </div>

            <p className="text-base font-semibold text-gray-500">
              {t("noActivityHistory")}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {t("startRegistering")}
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

              /* ==========================================
                 LIST VIEW
                 ========================================== */

              if (viewMode === "list") {
                return (
                  <div
                    key={day.date}
                    className={`flex flex-col gap-4 overflow-hidden rounded-xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                      isLatest
                        ? "border-secondary/25 bg-secondary/[0.03]"
                        : "border-secondary/10 bg-white hover:border-secondary/20"
                    }`}
                  >
                    <div className="flex shrink-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isLatest
                            ? "bg-secondary text-white"
                            : "bg-secondary/[0.06] text-secondary"
                        }`}
                      >
                        <Calendar className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {day.date}
                          </span>

                          {isLatest && (
                            <span className="rounded-full border border-secondary/20 bg-secondary/[0.06] px-2 py-0.5 text-[9px] font-bold text-secondary">
                              {t("latest")}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex gap-2">
                          <span
                            className={`text-[10px] font-semibold ${
                              day.companies_registered_count > 0
                                ? "text-secondary"
                                : "text-gray-400"
                            }`}
                          >
                            {t("companiesCount", {
                              count: day.companies_registered_count,
                            })}
                          </span>

                          <span className="text-gray-300">·</span>

                          <span
                            className={`text-[10px] font-semibold ${
                              day.subscriptions_started.length > 0
                                ? "text-secondary"
                                : "text-gray-400"
                            }`}
                          >
                            {t("subscriptionsCount", {
                              count: day.subscriptions_started.length,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasActivity ? (
                      <div className="hide-scrollbar flex flex-1 gap-2 overflow-x-auto pb-1 sm:justify-end">
                        {day.companies.map((company) => (
                          <span
                            key={company.id}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-secondary/10 bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700"
                          >
                            {company.logo ? (
                              <img
                                src={company.logo}
                                alt=""
                                className="h-4 w-4 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-white">
                                {company.name?.charAt(0) || "?"}
                              </div>
                            )}

                            <span className="max-w-[100px] truncate">
                              {company.name}
                            </span>
                          </span>
                        ))}

                        {day.subscriptions_started.map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-secondary/20 bg-secondary/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-secondary"
                          >
                            <Award className="h-3 w-3" />

                            <span className="max-w-[120px] truncate">
                              {sub.company_name} -{" "}
                              {translateDynamicValue(t, "plans", sub.plan_name)}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] italic text-gray-400 sm:text-right">
                        {t("noActivityOnDay")}
                      </div>
                    )}
                  </div>
                );
              }

              /* ==========================================
                 GRID VIEW
                 ========================================== */

              return (
                <div
                  key={day.date}
                  className={`overflow-hidden rounded-xl border p-4 transition-all ${
                    isLatest
                      ? "border-secondary/25 bg-secondary/[0.03]"
                      : "border-secondary/10 bg-white hover:border-secondary/20"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary/10 pb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
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
                            {t("latest")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-bold ${
                          day.companies_registered_count > 0
                            ? "border-secondary/20 bg-secondary/[0.06] text-secondary"
                            : "border-gray-200 bg-gray-100 text-gray-400"
                        }`}
                      >
                        {t("companiesCount", {
                          count: day.companies_registered_count,
                        })}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-bold ${
                          day.subscriptions_started.length > 0
                            ? "border-secondary/20 bg-secondary/[0.06] text-secondary"
                            : "border-gray-200 bg-gray-100 text-gray-400"
                        }`}
                      >
                        {t("subscriptionsShortCount", {
                          count: day.subscriptions_started.length,
                        })}
                      </span>
                    </div>
                  </div>

                  {hasActivity ? (
                    <div className="mt-3 space-y-4">
                      {/* COMPANIES */}
                      {day.companies.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <Building2 className="h-3 w-3" />

                            {t("companiesWithCount", {
                              count: day.companies.length,
                            })}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {day.companies.slice(0, 5).map((company) => (
                              <span
                                key={company.id}
                                className="inline-flex items-center gap-2 rounded-lg border border-secondary/10 bg-white px-2.5 py-1.5 text-[10px] font-medium text-gray-700"
                              >
                                {company.logo ? (
                                  <img
                                    src={company.logo}
                                    alt=""
                                    className="h-4 w-4 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-white">
                                    {company.name?.charAt(0) || "?"}
                                  </div>
                                )}

                                <span className="max-w-[120px] truncate">
                                  {company.name}
                                </span>
                              </span>
                            ))}

                            {day.companies.length > 5 && (
                              <span className="rounded-lg bg-secondary/[0.04] px-2 py-1.5 text-[10px] font-medium text-gray-400">
                                {t("moreCount", {
                                  count: day.companies.length - 5,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* SUBSCRIPTIONS */}
                      {day.subscriptions_started.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            <Award className="h-3 w-3" />

                            {t("subscriptionsWithCount", {
                              count: day.subscriptions_started.length,
                            })}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {day.subscriptions_started
                              .slice(0, 4)
                              .map((sub) => (
                                <span
                                  key={sub.id}
                                  className="rounded-lg border border-secondary/20 bg-secondary/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-secondary"
                                >
                                  <span className="inline-block max-w-[120px] truncate align-bottom">
                                    {sub.company_name}
                                  </span>

                                  {" · "}

                                  <span className="font-bold">
                                    {translateDynamicValue(
                                      t,
                                      "plans",
                                      sub.plan_name,
                                    )}
                                  </span>
                                </span>
                              ))}

                            {day.subscriptions_started.length > 4 && (
                              <span className="rounded-lg bg-secondary/[0.04] px-2 py-1.5 text-[10px] font-medium text-gray-400">
                                {t("moreCount", {
                                  count:
                                    day.subscriptions_started.length - 4,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 py-4 text-center">
                      <p className="text-[11px] italic text-gray-400">
                        {t("noActivityOnDay")}
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
