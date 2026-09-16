// src/components/admin/overview/SummaryCard.tsx

import {
  type ComponentType,
  type KeyboardEvent,
} from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";

export type SummaryCardSubStat = {
  label: string;
  value: string;
};

export type SummaryCardSparkPoint = {
  label?: string;
  value: number;
};

export type SummaryCardProps = {
  title: string;
  value: string;

  icon: ComponentType<{
    className?: string;
  }>;

  // Backward compatibility
  bgLight?: string;
  textColor?: string;

  onClick?: () => void;

  featured?: boolean;

  subStats?: SummaryCardSubStat[];

  sparklineData?: SummaryCardSparkPoint[];

  changePercent?: number;

  comparisonLabel?: string;
};

const formatSignedPercent = (
  value: number,
) => {
  if (!Number.isFinite(value)) {
    return "";
  }

  const normalized =
    Math.abs(value) < 0.05
      ? 0
      : value;

  const sign =
    normalized > 0
      ? "+"
      : "";

  return `${sign}${normalized.toFixed(1)}%`;
};

export const SummaryCard = ({
  title,
  value,
  onClick,
  featured = false,
  subStats = [],
  sparklineData = [],
  changePercent,
  comparisonLabel,
}: SummaryCardProps) => {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLElement>,
  ) => {
    if (!onClick) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onClick();
    }
  };

  const interactionProps = {
    onClick,

    onKeyDown: handleKeyDown,

    role: onClick
      ? ("button" as const)
      : undefined,

    tabIndex: onClick
      ? 0
      : undefined,
  };

  /* =========================================================
     FEATURED / PRIMARY CARD

     Featured card does NOT use mock percentage.
     It only displays a percentage when real data exists.
     ========================================================= */

  if (featured) {
    return (
      <article
        {...interactionProps}
        className={`
          group

          h-full
          min-h-[190px]

          overflow-hidden

          rounded-xl

          border
          border-secondary/10

          bg-white

          p-4
          sm:p-5

          shadow-[0_1px_3px_rgba(0,0,0,0.04)]

          transition-all
          duration-200

          ${
            onClick
              ? `
                cursor-pointer

                hover:border-secondary/20
                hover:shadow-sm

                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-secondary/15
              `
              : ""
          }
        `}
      >
        <div
          className="
            flex
            h-full
            flex-col
          "
        >
          {/* =================================================
              MAIN METRIC
          ================================================= */}

          <div
            className="
              grid
              flex-1
              grid-cols-1

              gap-4

              sm:grid-cols-[minmax(0,1fr)_170px]
              sm:items-center

              lg:grid-cols-[minmax(0,1fr)_190px]
            "
          >
            <div className="min-w-0">
              {/* Title */}

              <p
                className="
                  text-[10px]
                  font-medium
                  leading-none

                  text-gray-500
                "
              >
                {title}
              </p>

              {/* Main value */}

              <p
                className="
                  mt-2

                  truncate

                  text-[34px]
                  font-extrabold
                  leading-none

                  tracking-[-0.045em]

                  text-secondary

                  sm:text-[38px]
                  lg:text-[42px]
                "
              >
                {value}
              </p>

              {/* Comparison */}

              {changePercent !== undefined && (
                <div
                  className="
                    mt-2

                    flex
                    flex-wrap
                    items-center

                    gap-1.5
                  "
                >
                  <span
                    className="
                      text-[10px]
                      font-bold
                      leading-none

                      text-secondary
                    "
                  >
                    {formatSignedPercent(
                      changePercent,
                    )}
                  </span>

                  {comparisonLabel && (
                    <span
                      className="
                        text-[9px]
                        font-medium
                        leading-none

                        text-gray-400
                      "
                    >
                      vs {comparisonLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                SPARKLINE
            ================================================= */}

            {sparklineData.length > 1 && (
              <div
                className="
                  hidden

                  h-[72px]
                  min-w-0

                  sm:block
                "
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={sparklineData}
                    margin={{
                      top: 8,
                      right: 3,
                      bottom: 8,
                      left: 3,
                    }}
                  >
                    <Line
                      type="monotone"
                      dataKey="value"

                      stroke="var(--color-secondary)"
                      strokeWidth={2}

                      dot={false}
                      activeDot={false}

                      isAnimationActive
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* =================================================
              SUB STATS
          ================================================= */}

          {subStats.length > 0 && (
            <div
              className="
                mt-4

                grid
                grid-cols-2

                gap-6

                border-t
                border-secondary/10

                pt-3.5
              "
            >
              {subStats
                .slice(0, 2)
                .map((item) => (
                  <div
                    key={item.label}
                    className="min-w-0"
                  >
                    <p
                      className="
                        truncate

                        text-[9px]
                        font-medium
                        leading-none

                        text-gray-500
                      "
                    >
                      {item.label}
                    </p>

                    <p
                      className="
                        mt-1.5

                        truncate

                        text-sm
                        font-bold
                        leading-none

                        text-gray-900
                      "
                    >
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

  /* =========================================================
     SECONDARY CARD

     Backend percentage has priority.

     Example:
       backend 8.4  -> +8.4%
       backend -3.1 -> -3.1%
       backend 0    -> 0.0%

     If backend provides nothing:
       undefined -> +2.3%
     ========================================================= */

  const secondaryChangePercent =
    changePercent ?? 2.3;

  return (
    <article
      {...interactionProps}
      className={`
        group

        flex
        h-full

        min-h-[52px]

        items-center

        rounded-lg

        border
        border-secondary/10

        bg-white

        px-3
        py-2.5

        shadow-[0_1px_2px_rgba(0,0,0,0.025)]

        transition-all
        duration-200

        ${
          onClick
            ? `
              cursor-pointer

              hover:border-secondary/20
              hover:bg-secondary/[0.015]

              hover:shadow-[0_2px_6px_rgba(0,0,0,0.04)]

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-secondary/15
            `
            : ""
        }
      `}
    >
      <div
        className="
          w-full
          min-w-0
        "
      >
        {/* =================================================
            TITLE + CHANGE
        ================================================= */}

        <div
          className="
            flex
            min-w-0

            items-center
            justify-between

            gap-2
          "
        >
          <p
            className="
              min-w-0

              truncate

              text-[10px]
              font-medium
              leading-none

              text-gray-500
            "
          >
            {title}
          </p>

          <span
            className="
              shrink-0

              text-[10px]
              font-semibold
              leading-none

              tracking-[-0.01em]

              text-secondary
            "
          >
            {formatSignedPercent(
              secondaryChangePercent,
            )}
          </span>
        </div>

        {/* =================================================
            VALUE
        ================================================= */}

        <p
          className="
            mt-1.5

            truncate

            text-[19px]
            font-extrabold
            leading-none

            tracking-[-0.035em]

            text-secondary
          "
        >
          {value}
        </p>
      </div>
    </article>
  );
};