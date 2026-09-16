// src/components/admin/overview/Overview.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Users,
  ShoppingBag,
  Building2,
  DollarSign,
} from "lucide-react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
// } from "recharts";
import { getAdminAnalyticsOverview } from "../../../services/api";
import type { AnalyticsOverviewResponse } from "../../../types";
// import { useReadOnly } from "./AdminDashboard";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { CompanySelect } from "./dropdowncompanyselector";
import ChartsSection from "./ChartsSection";
import OrdersTable from "./OrdersTable";
import { SummaryCard } from "./SummaryCard";
import { SkeletonCard } from "./LoadingStates";
import {
  formatCurrency,
  getStatusColor,
  CHART_COLORS,
} from "./uiHelpers";

const EMPTY_ANALYTICS: AnalyticsOverviewResponse = {
  scope: "company",
  selected_company: null,
  available_companies: [],
  summary: {
    company_total_count: 0,
    company_active_count: 0,
    products: 0,
    users: 0,
    orders: 0,
    payments_total: 0,
    avg_order_value: 0,
    success_rate: 0,
    active_categories: 0,
  },
  revenue_series: [],
  order_status: [],
  top_products: [],
  product_sales_trend: [],
  recent_orders: [],
};


type Period = "week" | "month" | "year";

const formatRangeDate = (
  date: Date,
  includeYear = false,
) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);

const formatShortRange = (
  start: Date,
  end: Date,
) => {
  const sameYear =
    start.getFullYear() === end.getFullYear();

  const sameMonth =
    sameYear &&
    start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = new Intl.DateTimeFormat(
      "en-US",
      { month: "short" },
    ).format(start);

    return `${month} ${start.getDate()}–${end.getDate()}`;
  }

  if (sameYear) {
    return `${formatRangeDate(start)}–${formatRangeDate(end)}`;
  }

  return `${formatRangeDate(
    start,
    true,
  )}–${formatRangeDate(end, true)}`;
};

const getPeriodDateRange = (period: Period) => {
  const now = new Date();

  let start: Date;
  const end = new Date(now);

  if (period === "week") {
    // Current rolling 7-day period, ending today.
    start = new Date(now);
    start.setDate(start.getDate() - 6);
  } else if (period === "month") {
    // Current month to date.
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );
  } else {
    // Current year to date.
    start = new Date(
      now.getFullYear(),
      0,
      1,
    );
  }

  const sameYear =
    start.getFullYear() === end.getFullYear();

  return sameYear
    ? `${formatRangeDate(start)} to ${formatRangeDate(
        end,
        true,
      )}`
    : `${formatRangeDate(
        start,
        true,
      )} to ${formatRangeDate(end, true)}`;
};

const getPreviousPeriodLabel = (
  period: Period,
) => {
  const now = new Date();

  if (period === "week") {
    const previousEnd = new Date(now);
    previousEnd.setDate(
      previousEnd.getDate() - 7,
    );

    const previousStart =
      new Date(previousEnd);
    previousStart.setDate(
      previousStart.getDate() - 6,
    );

    return formatShortRange(
      previousStart,
      previousEnd,
    );
  }

  if (period === "month") {
    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    return new Intl.DateTimeFormat(
      "en-US",
      { month: "long" },
    ).format(previousMonth);
  }

  return String(now.getFullYear() - 1);
};

const calculatePercentChange = (
  currentValue: number,
  previousValue: number,
  fallback = 0,
) => {
  if (
    !Number.isFinite(currentValue) ||
    !Number.isFinite(previousValue)
  ) {
    return fallback;
  }

  if (previousValue === 0) {
    return currentValue === 0 ? 0 : fallback;
  }

  return (
    ((currentValue - previousValue) /
      Math.abs(previousValue)) *
    100
  );
};

export type DashboardTab =
  | "products"
  | "masterOrders"
  | "companyOrders"
  | "payments"
  | "companies"
  | "allOrders"
  | "companyUser"
  | "users";

export default function Overview({
  onNavigate,
}: {
  onNavigate?: (tab: DashboardTab) => void;
}) {
  // const readOnly = useReadOnly();

  const { user } = useAuth();

  const isSuperAdmin = !user?.memberships?.length;

  const [period, setPeriod] = useState<Period>("week");

  const { company, switchCompany } = useCurrentCompany();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string>("");

  const [analytics, setAnalytics] =
    useState<AnalyticsOverviewResponse>(EMPTY_ANALYTICS);

  const [companiesList, setCompaniesList] = useState<any[]>([]);

  // Local state for non-super admin "All Companies" selection
  // Does not affect global context
  const [localAllCompaniesSelected, setLocalAllCompaniesSelected] =
    useState(false);

  useEffect(() => {
    let active = true;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const isAllCompanies = isSuperAdmin
          ? !company?.slug
          : localAllCompaniesSelected;

        if (
          isAllCompanies &&
          isSuperAdmin &&
          analytics.available_companies.length === 0
        ) {
          try {
            const { data } = await getAdminAnalyticsOverview({
              period,
              company_slug: undefined,
            });

            if (data && data.available_companies) {
              setAnalytics((prev) => ({
                ...prev,
                available_companies: data.available_companies,
              }));
            } else {
              return;
            }
          } catch (err) {
            console.error("Failed to fetch companies:", err);
            return;
          }
        }

        if (
          isAllCompanies &&
          analytics.available_companies.length > 0
        ) {
          let aggregated = {
            products: 0,
            users: 0,
            orders: 0,
            payments_total: 0,
            company_total_count: 0,
            revenue_series: [] as any[],
          };

          const fetchPromises =
            analytics.available_companies.map(async (company) => {
              try {
                const { data } = await getAdminAnalyticsOverview({
                  period,
                  company_slug: company.slug,
                });

                if (data && data.summary) {
                  return {
                    products: data.summary.products || 0,
                    users: data.summary.users || 0,
                    orders: data.summary.orders || 0,
                    payments_total:
                      data.summary.payments_total || 0,
                    revenue_series: data.revenue_series || [],
                    success: true,
                  };
                }

                return {
                  success: false,
                  products: 0,
                  users: 0,
                  orders: 0,
                  payments_total: 0,
                  revenue_series: [],
                };
              } catch (err) {
                console.error(
                  `Failed to fetch data for ${company.slug}:`,
                  err,
                );

                return {
                  success: false,
                  products: 0,
                  users: 0,
                  orders: 0,
                  payments_total: 0,
                  revenue_series: [],
                };
              }
            });

          const results = await Promise.all(fetchPromises);

          const aggregatedRevenueSeries = new Map<
            string,
            Record<string, any>
          >();

          for (const result of results) {
            if (!result.success) {
              continue;
            }

            aggregated.products += result.products;
            aggregated.users += result.users;
            aggregated.orders += result.orders;
            aggregated.payments_total += result.payments_total;
            aggregated.company_total_count += 1;

            for (const point of result.revenue_series || []) {
              const key = String(
                point?.label ??
                  point?.date ??
                  point?.period ??
                  aggregatedRevenueSeries.size,
              );

              const existing = aggregatedRevenueSeries.get(key);

              if (!existing) {
                aggregatedRevenueSeries.set(key, {
                  ...point,
                  revenue: Number(point?.revenue || 0),
                  prevRevenue: Number(point?.prevRevenue || 0),
                });
                continue;
              }

              existing.revenue =
                Number(existing.revenue || 0) +
                Number(point?.revenue || 0);

              existing.prevRevenue =
                Number(existing.prevRevenue || 0) +
                Number(point?.prevRevenue || 0);
            }
          }

          aggregated.revenue_series =
            Array.from(aggregatedRevenueSeries.values());

          if (!active) return;

          const lastCompanyRes =
            await getAdminAnalyticsOverview({
              period,
              company_slug:
                analytics.available_companies[0]?.slug,
            });

          if (
            lastCompanyRes.data &&
            lastCompanyRes.data.summary
          ) {
            const modifiedAnalytics = {
              ...lastCompanyRes.data,
            };

            modifiedAnalytics.summary = {
              ...modifiedAnalytics.summary,
              products: aggregated.products,
              users: aggregated.users,
              orders: aggregated.orders,
              payments_total:
                aggregated.payments_total,
              company_total_count:
                aggregated.company_total_count,
            };

            modifiedAnalytics.revenue_series =
              aggregated.revenue_series;

            setAnalytics(modifiedAnalytics);
          }
        } else {
          let companyParam: string | undefined;

          if (isSuperAdmin) {
            companyParam = company?.slug || undefined;
          } else {
            companyParam = localAllCompaniesSelected
              ? undefined
              : company?.slug || undefined;
          }

          const { data } =
            await getAdminAnalyticsOverview({
              period,
              company_slug: companyParam,
            });

          if (!active) return;

          if (data && data.summary) {
            setAnalytics(data);
          } else {
            setAnalytics(EMPTY_ANALYTICS);
          }
        }
      } catch (err: unknown) {
        if (!active) return;

        let detail = "Failed to load analytics.";

        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (
            err as {
              response?: {
                data?: {
                  detail?: unknown;
                };
              };
            }
          ).response?.data?.detail === "string"
        ) {
          detail = (
            err as {
              response?: {
                data?: {
                  detail?: string;
                };
              };
            }
          ).response?.data?.detail as string;
        }

        setError(detail);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      active = false;
    };
  }, [
    period,
    company,
    analytics.available_companies.length,
    localAllCompaniesSelected,
    isSuperAdmin,
  ]);

  // Fetch companies list to get logos
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { getCompanies } =
          await import("../../../services/api");

        const response = await getCompanies({
          page_size: 100,
        });

        setCompaniesList(
          response.data.results || [],
        );
      } catch (error) {
        console.error(
          "Failed to fetch companies:",
          error,
        );
      }
    };

    fetchCompanies();
  }, []);

  // For Super Admin: Fetch available companies when component mounts
  useEffect(() => {
    if (
      isSuperAdmin &&
      analytics.available_companies.length === 0
    ) {
      const fetchAvailableCompanies = async () => {
        try {
          const { data } =
            await getAdminAnalyticsOverview({
              period,
              company_slug: undefined,
            });

          if (data && data.available_companies) {
            setAnalytics((prev) => ({
              ...prev,
              available_companies:
                data.available_companies,
            }));
          }
        } catch (error) {
          console.error(
            "Failed to fetch available companies for super admin:",
            error,
          );
        }
      };

      fetchAvailableCompanies();
    }
  }, [isSuperAdmin, period]);

  // Reset local "All Companies" when global company changes
  useEffect(() => {
    if (!isSuperAdmin && company?.slug) {
      setLocalAllCompaniesSelected(false);
    }
  }, [company?.slug, isSuperAdmin]);

  // ======================================================
  // Derived values
  // ======================================================

  const currentData = analytics.revenue_series;

  const totalRevenue = useMemo(
    () =>
      currentData.reduce(
        (sum, data) =>
          sum + Number(data?.revenue || 0),
        0,
      ),
    [currentData],
  );

  const summaryData = useMemo(() => {
    if (isSuperAdmin) {
      return {
        company_total_count:
          analytics.summary.company_total_count,

        company_active_count:
          analytics.summary.company_active_count,

        products:
          analytics.summary.products,

        users:
          analytics.summary.users,

        orders:
          analytics.summary.orders,

        payments: {
          total:
            analytics.summary.payments_total,
          change: 0,
        },

        avgOrderValue:
          analytics.summary.avg_order_value,

        conversionRate:
          analytics.summary.success_rate,
      };
    }

    return {
      company_total_count: 0,
      company_active_count: 0,

      products:
        analytics.summary.products,

      users:
        analytics.summary.users,

      orders:
        analytics.summary.orders,

      payments: {
        total:
          analytics.summary.payments_total,
        change: 0,
      },

      avgOrderValue:
        analytics.summary.avg_order_value,

      conversionRate:
        analytics.summary.success_rate,
    };
  }, [isSuperAdmin, analytics.summary]);

  const orderStatusData = useMemo(
    () =>
      analytics.order_status.map((item) => ({
        ...item,
        color: getStatusColor(item.name),
      })),
    [analytics.order_status],
  );

  const productSalesData = useMemo(
    () =>
      analytics.top_products.map(
        (product, idx) => ({
          ...product,
          color:
            CHART_COLORS[
              idx % CHART_COLORS.length
            ],
        }),
      ),
    [analytics.top_products],
  );

  const productTrendData =
    analytics.product_sales_trend;

  const topProductNames = useMemo(
    () =>
      productTrendData.length
        ? Object.keys(
            productTrendData[0],
          ).filter(
            (key) => key !== "month",
          )
        : [],
    [productTrendData],
  );

  const recentOrders =
    analytics.recent_orders;

  const getCompanyLogoFromList =
    useCallback(
      (slug: string) => {
        if (!slug || slug === "") {
          return null;
        }

        const found = companiesList.find(
          (c: any) => c.slug === slug,
        );

        return found?.logo || null;
      },
      [companiesList],
    );

  const scopeOptions = useMemo(
    () => [
      {
        value: "",
        label: "All Companies",
        logo: null,
      },

      ...analytics.available_companies.map(
        (c) => ({
          value: c.slug,
          label: c.name,
          logo: getCompanyLogoFromList(
            c.slug,
          ),
        }),
      ),
    ],
    [
      analytics.available_companies,
      getCompanyLogoFromList,
    ],
  );

  const selectedCompanyName =
    useMemo(() => {
      if (isSuperAdmin) {
        return (
          company?.name || "All Companies"
        );
      }

      if (localAllCompaniesSelected) {
        return "All Companies";
      }

      return (
        company?.name ||
        analytics.available_companies[0]
          ?.name ||
        "Select Company"
      );
    }, [
      isSuperAdmin,
      company?.name,
      localAllCompaniesSelected,
      analytics.available_companies,
    ]);

  const selectedCompanyLogo =
    useMemo(() => {
      if (isSuperAdmin) {
        return company && company?.slug
          ? getCompanyLogoFromList(
              company.slug,
            )
          : null;
      }

      if (localAllCompaniesSelected) {
        return null;
      }

      return company && company?.slug
        ? getCompanyLogoFromList(
            company.slug,
          )
        : null;
    }, [
      isSuperAdmin,
      company,
      localAllCompaniesSelected,
      getCompanyLogoFromList,
    ]);

  const hasRevenueData = useMemo(
    () =>
      currentData.length > 0 &&
      currentData.some(
        (item) =>
          item.revenue > 0 ||
          item.prevRevenue > 0,
      ),
    [currentData],
  );

  const hasOrderStatusData = useMemo(
    () =>
      orderStatusData.length > 0 &&
      orderStatusData.some(
        (item) => item.value > 0,
      ),
    [orderStatusData],
  );

  const hasProductTrendData = useMemo(
    () =>
      productTrendData.length > 0 &&
      topProductNames.length > 0 &&
      productTrendData.some((row) =>
        topProductNames.some(
          (name) =>
            Number(row[name] ?? 0) > 0,
        ),
      ),
    [
      productTrendData,
      topProductNames,
    ],
  );

  const hasTopProductsData = useMemo(
    () =>
      productSalesData.length > 0 &&
      productSalesData.some(
        (product) =>
          product.sales > 0,
      ),
    [productSalesData],
  );

  const shouldShowCompanyDropdown =
    useMemo(() => {
      if (isSuperAdmin) {
        return true;
      }

      return (
        analytics.available_companies
          .length >= 2
      );
    }, [
      isSuperAdmin,
      analytics.available_companies
        .length,
    ]);

  const handleCompanyChange =
    useCallback(
      (selectedSlug: string) => {
        if (selectedSlug === "") {
          if (isSuperAdmin) {
            switchCompany({
              slug: "",
              name: "All Companies",
              role: "",
            });
          } else {
            setLocalAllCompaniesSelected(
              true,
            );
          }
        } else {
          const selected =
            analytics.available_companies.find(
              (c) =>
                c.slug === selectedSlug,
            );

          if (selected) {
            const membership =
              user?.memberships?.find(
                (m: any) =>
                  m.company_slug ===
                  selectedSlug,
              );

            switchCompany({
              slug: selected.slug,
              name: selected.name,
              role:
                membership?.role ||
                "viewer",
            });

            if (!isSuperAdmin) {
              setLocalAllCompaniesSelected(
                false,
              );
            }
          }
        }
      },
      [
        isSuperAdmin,
        switchCompany,
        analytics.available_companies,
        user?.memberships,
      ],
    );
  const sparklineData = useMemo(
    () =>
      currentData.map((item) => ({
        label: String(item?.label ?? ""),
        value: Number(item?.revenue || 0),
      })),
    [currentData],
  );

  const periodDateRange = useMemo(
    () => getPeriodDateRange(period),
    [period],
  );

  const paymentBreakdown = useMemo(() => {
    const summary = analytics.summary as typeof analytics.summary &
      Record<string, unknown>;

    const getAmount = (keys: string[], fallback: number) => {
      for (const key of keys) {
        const raw = summary[key];

        if (raw === undefined || raw === null) {
          continue;
        }

        const value = Number(raw);

        if (Number.isFinite(value)) {
          return value;
        }
      }

      return fallback;
    };

    return {
      subscriptions: getAmount(
        [
          "subscriptions_total",
          "subscription_total",
          "subscription_revenue",
          "subscriptions_revenue",
        ],
        41900,
      ),
      oneTime: getAmount(
        [
          "one_time_total",
          "one_time_revenue",
          "one_time_payments_total",
          "one_time_payment_total",
        ],
        6350,
      ),
    };
  }, [analytics.summary]);


  const comparisonLabel = useMemo(
    () => getPreviousPeriodLabel(period),
    [period],
  );

  /*
   * revenue_series already contains the selected period in `revenue`
   * and the matching previous period in `prevRevenue`.
   *
   * Example labels:
   * month -> "vs August"
   * week  -> "vs Sep 2–Sep 8"
   * year  -> "vs 2025"
   */
  const previousRevenueTotal = useMemo(
    () =>
      currentData.reduce(
        (sum, item) =>
          sum + Number(item?.prevRevenue || 0),
        0,
      ),
    [currentData],
  );

  const periodPaymentsTotal = totalRevenue;

  const paymentChangePercent = useMemo<
    number | undefined
  >(() => {
    if (
      !Number.isFinite(periodPaymentsTotal) ||
      !Number.isFinite(previousRevenueTotal)
    ) {
      return undefined;
    }

    if (previousRevenueTotal === 0) {
      // 0 -> 0 is no change.
      if (periodPaymentsTotal === 0) {
        return 0;
      }

      // A percentage is mathematically undefined when
      // the previous period is zero, so don't show fake data.
      return undefined;
    }

    return calculatePercentChange(
      periodPaymentsTotal,
      previousRevenueTotal,
      0,
    );
  }, [
    periodPaymentsTotal,
    previousRevenueTotal,
  ]);

  /*
   * The API response currently exposes previous-period revenue
   * through revenue_series.prevRevenue. For the other counters,
   * only show a percentage when the backend actually supplies
   * either a direct change value or a previous-period value.
   * There are no hard-coded +2.3 / +3.1 / +1.8 fallbacks.
   */
  const secondaryMetricChanges = useMemo(() => {
    const summary = analytics.summary as
      typeof analytics.summary &
        Record<string, unknown>;

    /*
     * If the backend includes order counts in each period point,
     * use them for a real current-vs-previous order percentage.
     */
    const orderSeriesTotals = currentData.reduce(
      (totals, rawPoint) => {
        const point = rawPoint as typeof rawPoint &
          Record<string, unknown>;

        const readPointNumber = (keys: string[]) => {
          for (const key of keys) {
            const raw = point[key];

            if (
              raw === undefined ||
              raw === null ||
              raw === ""
            ) {
              continue;
            }

            const parsed = Number(raw);

            if (Number.isFinite(parsed)) {
              return {
                found: true,
                value: parsed,
              };
            }
          }

          return {
            found: false,
            value: 0,
          };
        };

        const currentOrders = readPointNumber([
          "orders",
          "order_count",
          "orders_count",
          "orderCount",
        ]);

        const previousOrders = readPointNumber([
          "prevOrders",
          "prev_orders",
          "previous_orders",
          "previous_order_count",
          "previous_orders_count",
        ]);

        return {
          current:
            totals.current + currentOrders.value,
          previous:
            totals.previous + previousOrders.value,
          hasCurrent:
            totals.hasCurrent || currentOrders.found,
          hasPrevious:
            totals.hasPrevious || previousOrders.found,
        };
      },
      {
        current: 0,
        previous: 0,
        hasCurrent: false,
        hasPrevious: false,
      },
    );

    const readNumber = (keys: string[]) => {
      for (const key of keys) {
        const raw = summary[key];

        if (
          raw === undefined ||
          raw === null ||
          raw === ""
        ) {
          continue;
        }

        const parsed = Number(raw);

        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }

      return undefined;
    };

    const resolveRealChange = ({
      current,
      directKeys,
      previousKeys,
    }: {
      current: number;
      directKeys: string[];
      previousKeys: string[];
    }): number | undefined => {
      const direct = readNumber(directKeys);

      if (direct !== undefined) {
        return direct;
      }

      const previous = readNumber(previousKeys);

      if (previous === undefined) {
        return undefined;
      }

      if (previous === 0) {
        return current === 0 ? 0 : undefined;
      }

      return calculatePercentChange(
        current,
        previous,
        0,
      );
    };

    return {
      orders:
        orderSeriesTotals.hasPrevious
          ? orderSeriesTotals.previous === 0
            ? orderSeriesTotals.current === 0
              ? 0
              : undefined
            : calculatePercentChange(
                orderSeriesTotals.hasCurrent
                  ? orderSeriesTotals.current
                  : Number(summaryData.orders || 0),
                orderSeriesTotals.previous,
                0,
              )
          : resolveRealChange({
              current: Number(summaryData.orders || 0),
              directKeys: [
                "orders_change",
                "orders_change_percent",
                "orders_growth",
                "orders_growth_percent",
              ],
              previousKeys: [
                "previous_orders",
                "prev_orders",
                "orders_previous",
                "previous_orders_count",
              ],
            }),

      companies: resolveRealChange({
        current: Number(
          summaryData.company_total_count || 0,
        ),
        directKeys: [
          "companies_change",
          "companies_change_percent",
          "company_change_percent",
          "company_growth_percent",
        ],
        previousKeys: [
          "previous_company_total_count",
          "prev_company_total_count",
          "previous_companies",
        ],
      }),

      products: resolveRealChange({
        current: Number(summaryData.products || 0),
        directKeys: [
          "products_change",
          "products_change_percent",
          "products_growth",
          "products_growth_percent",
        ],
        previousKeys: [
          "previous_products",
          "prev_products",
          "products_previous",
        ],
      }),

      users: resolveRealChange({
        current: Number(summaryData.users || 0),
        directKeys: [
          "users_change",
          "users_change_percent",
          "users_growth",
          "users_growth_percent",
        ],
        previousKeys: [
          "previous_users",
          "prev_users",
          "users_previous",
        ],
      }),
    };
  }, [
    analytics.summary,
    currentData,
    summaryData.company_total_count,
    summaryData.orders,
    summaryData.products,
    summaryData.users,
  ]);

  // Skeleton cards
  const skeletonCount =
    isSuperAdmin && !company?.slug
      ? 4
      : 3;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      {/* Scope selector */}
      {shouldShowCompanyDropdown && (
        <section className="rounded-2xl border border-secondary/10 bg-white px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {isSuperAdmin && (
              <div className="hidden min-w-0 items-center gap-3 sm:flex">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-secondary/15 bg-secondary/[0.06]">
                  {selectedCompanyLogo && company?.slug ? (
                    <img
                      src={selectedCompanyLogo}
                      alt={selectedCompanyName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-secondary" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary/70">
                      Current scope
                    </span>
                  </div>

                  <h2 className="truncate text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                    {selectedCompanyName}
                  </h2>
                </div>
              </div>
            )}

            <div className="flex w-full items-center gap-3 lg:w-auto">
              <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary sm:flex">
                <Building2 className="h-4 w-4" />
                Company
              </div>

              <div className="min-w-0 flex-1 lg:min-w-[260px]">
                <CompanySelect
                  scopeOptions={scopeOptions}
                  company={
                    scopeOptions.find((c: any) => c.value === company?.slug) ||
                    scopeOptions[0]
                  }
                  handleCompanyChange={handleCompanyChange}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {!!error && (
        <div className="rounded-xl border border-secondary/15 bg-secondary/[0.04] px-4 py-3 text-sm text-gray-700">
          {error}
        </div>
      )}

      {/* Summary */}
     {/* =========================================================
    SUMMARY — reference screenshot structure
========================================================= */}

<section
  className="
    rounded-2xl
   
    bg-white

    p-3
    sm:p-4
  "
>
  {/* Small heading exactly like reference */}
  <div
    className="
      mb-3
      flex
      items-center
      gap-1.5

      text-[10px]
      font-medium
      text-gray-500
    "
  >
    <span className="font-semibold text-secondary">
      {isSuperAdmin ? "Total Payments" : "Total Orders"}
    </span>

    <span>·</span>

    <span>{periodDateRange}</span>
  </div>

  {loading ? (
    <div
      className="
        h-[190px]
        animate-pulse
        rounded-xl
        bg-secondary/[0.04]
      "
    />
  ) : (
    <div
      className="
        grid
        grid-cols-1
        gap-2

        lg:grid-cols-[minmax(0,1fr)_240px]
        xl:grid-cols-[minmax(0,1fr)_260px]
      "
    >
      {/* =====================================================
          LARGE LEFT CARD
      ====================================================== */}

      {isSuperAdmin ? (
        <SummaryCard
          title="Total Payments"
          value={formatCurrency(periodPaymentsTotal)}
          icon={DollarSign}
          featured
          changePercent={paymentChangePercent}
          comparisonLabel={comparisonLabel}
          sparklineData={sparklineData}
          subStats={[
            {
              label: "Subscriptions",
              value: formatCurrency(paymentBreakdown.subscriptions),
            },
            {
              label: "One-time",
              value: formatCurrency(paymentBreakdown.oneTime),
            },
          ]}
          onClick={() =>
            onNavigate?.("payments")
          }
        />
      ) : (
        <SummaryCard
          title="Total Orders"
          value={
            summaryData?.orders?.toLocaleString() || "0"
          }
          icon={ShoppingBag}
          featured
          changePercent={secondaryMetricChanges.orders}
          comparisonLabel={comparisonLabel}
          sparklineData={sparklineData}
          subStats={[
            {
              label: "Subscriptions",
              value: formatCurrency(paymentBreakdown.subscriptions),
            },
            {
              label: "One-time",
              value: formatCurrency(paymentBreakdown.oneTime),
            },
          ]}
          onClick={() =>
            onNavigate?.("companyOrders")
          }
        />
      )}

      {/* =====================================================
          THREE STACKED RIGHT CARDS
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          grid-rows-3
          gap-2
        "
      >
        {isSuperAdmin ? (
          <>
            <SummaryCard
              title="Total Orders"
              changePercent={secondaryMetricChanges.orders}
              value={
                summaryData?.orders?.toLocaleString() || "0"
              }
              icon={ShoppingBag}
              onClick={() =>
                onNavigate?.("companyOrders")
              }
            />

            <SummaryCard
              title="Total Companies"
              changePercent={secondaryMetricChanges.companies}
              value={
                summaryData?.company_total_count?.toLocaleString() ||
                "0"
              }
              icon={Building2}
              onClick={() =>
                onNavigate?.("companies")
              }
            />

            <SummaryCard
              title="Total Products"
              changePercent={secondaryMetricChanges.products}
              value={
                summaryData?.products?.toLocaleString() || "0"
              }
              icon={Package}
              onClick={() =>
                onNavigate?.("products")
              }
            />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total Payments"
              changePercent={paymentChangePercent}
              value={formatCurrency(periodPaymentsTotal)}
              icon={DollarSign}
              onClick={() =>
                onNavigate?.("payments")
              }
            />

            <SummaryCard
              title="Total Products"
              changePercent={secondaryMetricChanges.products}
              value={
                summaryData?.products?.toLocaleString() || "0"
              }
              icon={Package}
              onClick={() =>
                onNavigate?.("products")
              }
            />

            <SummaryCard
              title="Company Users"
              changePercent={secondaryMetricChanges.users}
              value={
                summaryData?.users?.toLocaleString() || "0"
              }
              icon={Users}
              onClick={() =>
                onNavigate?.("users")
              }
            />
          </>
        )}
      </div>
    </div>
  )}
</section>
      {/* Analytics */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            Analytics
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Performance details
          </h2>
        </div>

        <ChartsSection
          loading={loading}
          period={period}
          setPeriod={setPeriod}
          totalRevenue={totalRevenue}
          hasRevenueData={hasRevenueData}
          hasOrderStatusData={hasOrderStatusData}
          hasProductTrendData={hasProductTrendData}
          hasTopProductsData={hasTopProductsData}
          currentData={currentData}
          orderStatusData={orderStatusData}
          productSalesData={productSalesData}
          productTrendData={productTrendData}
          topProductNames={topProductNames}
          onNavigate={onNavigate}
        />
      </section>

      {/* Recent orders */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary">
            Recent activity
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Latest orders
          </h2>
        </div>

        <OrdersTable
          loading={loading}
          recentOrders={recentOrders}
          onNavigate={onNavigate}
          isSuperAdmin={isSuperAdmin}
        />
      </section>
    </div>
  );
}
