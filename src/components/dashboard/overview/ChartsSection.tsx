// src/components/admin/overview/ChartsSection.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Building2 } from "lucide-react";
import { SkeletonChart, EmptyState } from "./LoadingStates";
import { formatCurrency } from "./uiHelpers";
import type { DashboardTab } from "./Overview";

type Period = "week" | "month" | "year";

interface ChartsSectionProps {
  loading: boolean;
  period: Period;
  setPeriod: (p: Period) => void;
  totalRevenue: number;
  hasRevenueData: boolean;
  hasOrderStatusData: boolean;
  hasProductTrendData: boolean;
  hasTopProductsData: boolean;
  currentData: any[];
  orderStatusData: { name: string; value: number; color: string }[];
  productSalesData: {
    name: string;
    sales: number;
    company_name: string;
    color: string;
  }[];
  productTrendData: any[];
  topProductNames: string[];
  onNavigate?: (tab: DashboardTab) => void;
}

const CARD =
  "rounded-xl border border-secondary/10 bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)] transition-all duration-200 hover:border-secondary/20 hover:shadow-sm sm:p-4";

const SECONDARY = "var(--color-secondary)";

const pieOpacity = [1, 0.82, 0.64, 0.48, 0.34, 0.24];

const lineDashPatterns = [
  undefined,
  "7 4",
  "3 4",
  "10 4 2 4",
  "2 3",
  "12 5",
];

export default function ChartsSection({
  loading,
  period,
  setPeriod,
  totalRevenue,
  hasRevenueData,
  hasOrderStatusData,
  hasProductTrendData,
  hasTopProductsData,
  currentData,
  orderStatusData,
  productSalesData,
  productTrendData,
  topProductNames,
  onNavigate,
}: ChartsSectionProps) {
  return (
    <div className="space-y-3">
      {/* Revenue + order status */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <article className={`${CARD} lg:col-span-2`}>
          {loading ? (
            <SkeletonChart height="h-52 sm:h-56 lg:h-60" />
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/80">
                      Revenue
                    </span>
                  </div>

                  <p className="text-xl font-extrabold tracking-[-0.03em] text-secondary sm:text-2xl">
                    {formatCurrency(totalRevenue)}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-medium text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded-[3px] bg-secondary" />
                      Current
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-4 rounded-[3px] border border-secondary/50 bg-secondary/[0.08]" />
                      Previous
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-lg border border-secondary/10 bg-secondary/[0.035] p-0.5">
                    {(["week", "month", "year"] as Period[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriod(p)}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                          period === p
                            ? "bg-secondary text-white shadow-sm"
                            : "text-gray-500 hover:bg-white hover:text-secondary"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="hidden h-7 w-7 items-center justify-center rounded-lg border border-secondary/10 bg-secondary/[0.05] sm:flex">
                    <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                  </div>
                </div>
              </div>

              {hasRevenueData ? (
                <div className="h-52 sm:h-56 lg:h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={currentData}
                      barGap={4}
                      barCategoryGap="30%"
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(107,114,128,0.09)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) =>
                          `${(val / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          typeof value === "number"
                            ? formatCurrency(value)
                            : String(value ?? ""),
                          name === "revenue"
                            ? "Current"
                            : "Previous",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid rgba(107,114,128,0.14)",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                          background: "#ffffff",
                        }}
                      />
                      <Bar
                        dataKey="prevRevenue"
                        name="Previous"
                        fill={SECONDARY}
                        fillOpacity={0.1}
                        stroke={SECONDARY}
                        strokeOpacity={0.55}
                        strokeWidth={1.25}
                        strokeDasharray="3 2"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />

                      <Bar
                        dataKey="revenue"
                        name="Current"
                        fill={SECONDARY}
                        fillOpacity={1}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No revenue data yet"
                  description="Revenue insights will appear here once paid orders are placed."
                />
              )}
            </>
          )}
        </article>

        <article className={CARD}>
          {loading ? (
            <SkeletonChart height="h-52 sm:h-56 lg:h-60" />
          ) : (
            <>
              <div className="mb-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/80">
                    Orders
                  </span>
                </div>
                <h3 className="text-sm font-bold tracking-[-0.01em] text-gray-900">
                  Status distribution
                </h3>
              </div>

              {hasOrderStatusData ? (
                <>
                  <div className="flex h-44 items-center justify-center sm:h-48 lg:h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderStatusData.map((entry, idx) => (
                            <Cell
                              key={`${entry.name}-${idx}`}
                              fill={SECONDARY}
                              fillOpacity={
                                pieOpacity[idx % pieOpacity.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value ?? 0} orders`]}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid rgba(107,114,128,0.14)",
                            background: "#ffffff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {orderStatusData.map((status, idx) => (
                      <div
                        key={status.name}
                        className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-secondary/[0.06] bg-secondary/[0.025] px-2 py-1.5"
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-secondary"
                            style={{
                              opacity:
                                pieOpacity[idx % pieOpacity.length],
                            }}
                          />
                          <span className="truncate text-[10px] font-medium text-gray-600">
                            {status.name}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-secondary">
                          {status.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  compact
                  title="No order status data"
                  description="Status distribution will be shown after orders are placed."
                />
              )}
            </>
          )}
        </article>
      </div>

      {/* Product trend + top products */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <article className={`${CARD} lg:col-span-2`}>
          {loading ? (
            <SkeletonChart height="h-52 sm:h-56 lg:h-60" />
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/80">
                      Products
                    </span>
                  </div>

                  <h3 className="text-sm font-bold tracking-[-0.01em] text-gray-900">
                    Sales trend
                  </h3>
                  <p className="mt-0.5 text-[10px] text-gray-500">
                    Monthly product comparison
                  </p>
                </div>

                <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-1.5">
                  {topProductNames.map((name, idx) => (
                    <div key={name} className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-1.5 w-3 shrink-0 rounded-full bg-secondary"
                        style={{
                          opacity:
                            1 - (idx % 5) * 0.13,
                        }}
                      />
                      <span className="max-w-[130px] truncate text-[10px] text-gray-600">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {hasProductTrendData ? (
                <div className="h-52 sm:h-56 lg:h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={productTrendData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(107,114,128,0.12)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) =>
                          `${(val / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          typeof value === "number"
                            ? formatCurrency(value)
                            : String(value ?? ""),
                          "",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid rgba(107,114,128,0.14)",
                          background: "#ffffff",
                        }}
                      />

                      {topProductNames.map((name, idx) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={SECONDARY}
                          strokeOpacity={1 - (idx % 5) * 0.13}
                          strokeDasharray={
                            lineDashPatterns[idx % lineDashPatterns.length]
                          }
                          strokeWidth={2.25}
                          dot={false}
                          activeDot={{
                            r: 4,
                            fill: SECONDARY,
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="No product trend data"
                  description="Product sales trend will appear after products generate sales over time."
                />
              )}
            </>
          )}
        </article>

        <article className={CARD}>
          {loading ? (
            <SkeletonChart height="h-52 sm:h-56 lg:h-60" />
          ) : (
            <>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary/80">
                      Ranking
                    </span>
                  </div>
                  <h3 className="text-sm font-bold tracking-[-0.01em] text-gray-900">
                    Top products
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate?.("products")}
                  className="rounded-md border border-secondary/10 bg-secondary/[0.035] px-2 py-1 text-[10px] font-semibold text-secondary transition hover:bg-secondary hover:text-white"
                >
                  View all
                </button>
              </div>

              {hasTopProductsData ? (
                <div className="space-y-1.5">
                  {productSalesData.map((product, idx) => {
                    const maxSales = productSalesData[0]?.sales || 0;
                    const width = maxSales
                      ? Math.max((product.sales / maxSales) * 100, 4)
                      : 0;

                    return (
                      <div
                        key={`${product.name}-${idx}`}
                        className="rounded-lg border border-secondary/[0.07] bg-white p-2.5 transition hover:border-secondary/20 hover:bg-secondary/[0.01]"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary/[0.06] text-[10px] font-bold text-secondary">
                            {String(idx + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-xs font-semibold text-gray-900">
                                {product.name}
                              </p>

                              <span className="shrink-0 text-xs font-extrabold text-secondary">
                                {formatCurrency(product.sales)}
                              </span>
                            </div>

                            <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-secondary/80">
                              <Building2 className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">
                                {product.company_name}
                              </span>
                            </div>

                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary/[0.08]">
                              <div
                                className="h-full rounded-full bg-secondary transition-all duration-500"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No top products yet"
                  description="Top products will be listed here once product sales are available."
                />
              )}
            </>
          )}
        </article>
      </div>
    </div>
  );
}
