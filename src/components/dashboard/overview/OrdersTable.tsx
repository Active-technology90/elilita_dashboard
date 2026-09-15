import { ArrowRight } from "lucide-react";
import { SkeletonChart, EmptyState } from "./LoadingStates";
import {
  formatCurrency,
  formatDate,
  statusClass,
  paymentStatusClass,
} from "./uiHelpers";

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: string;
  paymentStatus: string;
  vendors: string | number;
  date: string;
}

interface OrdersTableProps {
  loading: boolean;
  recentOrders: Order[];
  onNavigate?: (tab: any) => void;
  isSuperAdmin: boolean;
}

export default function OrdersTable({
  loading,
  recentOrders,
  onNavigate,
  isSuperAdmin,
}: OrdersTableProps) {
  const hasRecentOrdersData = recentOrders.length > 0;

  const handleViewAll = () => {
    onNavigate?.(
      isSuperAdmin ? "masterOrders" : "companyOrders",
    );
  };

  return (
    <div
      className="
        w-full
        min-w-0
        overflow-hidden
        rounded-xl
        border
        border-secondary/10
        bg-white
        p-3
        shadow-[0_1px_3px_rgba(0,0,0,0.035)]
        sm:p-3.5
      "
    >
      {loading ? (
        <SkeletonChart height="h-[220px] sm:h-[250px]" />
      ) : (
        <>
          {/* Compact action row.
              The page already provides the section title,
              so we avoid repeating another large heading here. */}
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleViewAll}
              className="
                group
                inline-flex
                items-center
                gap-1
                rounded-md
                border
                border-secondary/10
                bg-secondary/[0.03]
                px-2
                py-1
                text-[10px]
                font-semibold
                leading-none
                text-secondary
                transition-all
                duration-150
                hover:border-secondary/20
                hover:bg-secondary/[0.07]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-secondary/15
              "
            >
              View all

              <ArrowRight
                className="
                  h-3
                  w-3
                  transition-transform
                  duration-150
                  group-hover:translate-x-0.5
                "
              />
            </button>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5 md:hidden">
            {hasRecentOrdersData ? (
              recentOrders.map((order) => (
                <article
                  key={order.id}
                  className="
                    rounded-lg
                    border
                    border-secondary/[0.07]
                    bg-white
                    px-2.5
                    py-2
                    transition-colors
                    duration-150
                    hover:border-secondary/15
                    hover:bg-secondary/[0.012]
                  "
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          text-[10px]
                          font-semibold
                          leading-none
                          text-secondary
                        "
                      >
                        {order.id}
                      </p>

                      <p
                        className="
                          mt-1
                          truncate
                          text-xs
                          font-semibold
                          leading-tight
                          text-gray-900
                        "
                      >
                        {order.customer}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className="
                          text-xs
                          font-extrabold
                          leading-none
                          text-secondary
                        "
                      >
                        {formatCurrency(order.amount)}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[9px]
                          leading-none
                          text-gray-400
                        "
                      >
                        {formatDate(order.date)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      min-w-0
                      items-center
                      justify-between
                      gap-2
                    "
                  >
                    <div className="flex min-w-0 flex-wrap gap-1">
                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-full
                          px-1.5
                          py-0.5
                          text-[9px]
                          font-semibold
                          leading-none
                          ${statusClass(order.status)}
                        `}
                      >
                        {order.status}
                      </span>

                      <span
                        className={`
                          inline-flex
                          items-center
                          rounded-full
                          px-1.5
                          py-0.5
                          text-[9px]
                          font-semibold
                          leading-none
                          ${paymentStatusClass(order.paymentStatus)}
                        `}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>

                    <p
                      className="
                        max-w-[42%]
                        truncate
                        text-[9px]
                        text-gray-500
                      "
                      title={String(order.vendors)}
                    >
                      {order.vendors}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                compact
                title="No recent orders"
                description="New orders will appear here as soon as customers start placing them."
              />
            )}
          </div>

          {/* Tablet + desktop */}
          {hasRecentOrdersData && (
            <div
              className="
                hidden
                overflow-hidden
                rounded-lg
                border
                border-secondary/[0.07]
                md:block
              "
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr
                      className="
                        border-b
                        border-secondary/[0.07]
                        bg-secondary/[0.02]
                      "
                    >
                      {[
                        "Order",
                        "Customer",
                        "Amount",
                        "Status",
                        "Payment",
                        "Companies",
                        "Date",
                      ].map((head) => (
                        <th
                          key={head}
                          className="
                            whitespace-nowrap
                            px-2.5
                            py-2
                            text-left
                            text-[9px]
                            font-semibold
                            uppercase
                            tracking-[0.08em]
                            text-gray-500
                          "
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-secondary/[0.055]">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="
                          transition-colors
                          duration-150
                          hover:bg-secondary/[0.012]
                        "
                      >
                        <td className="px-2.5 py-2.5">
                          <span
                            className="
                              whitespace-nowrap
                              text-[11px]
                              font-bold
                              text-secondary
                            "
                          >
                            {order.id}
                          </span>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-2.5
                            py-2.5
                            text-[11px]
                            font-medium
                            text-gray-800
                          "
                        >
                          {order.customer}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-2.5
                            py-2.5
                            text-[11px]
                            font-extrabold
                            text-secondary
                          "
                        >
                          {formatCurrency(order.amount)}
                        </td>

                        <td className="whitespace-nowrap px-2.5 py-2.5">
                          <span
                            className={`
                              inline-flex
                              items-center
                              rounded-full
                              px-1.5
                              py-0.5
                              text-[9px]
                              font-semibold
                              leading-none
                              ${statusClass(order.status)}
                            `}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-2.5 py-2.5">
                          <span
                            className={`
                              inline-flex
                              items-center
                              rounded-full
                              px-1.5
                              py-0.5
                              text-[9px]
                              font-semibold
                              leading-none
                              ${paymentStatusClass(order.paymentStatus)}
                            `}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>

                        <td
                          className="
                            max-w-[180px]
                            truncate
                            px-2.5
                            py-2.5
                            text-[11px]
                            text-gray-500
                          "
                          title={String(order.vendors)}
                        >
                          {order.vendors}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-2.5
                            py-2.5
                            text-right
                            text-[10px]
                            text-gray-400
                          "
                        >
                          {formatDate(order.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
