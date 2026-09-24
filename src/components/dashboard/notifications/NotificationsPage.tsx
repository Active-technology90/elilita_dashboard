// src/components/dashboard/notifications/NotificationsPage.tsx
import { useMemo, useState } from "react";
import { ArrowRight, Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../../context/NotificationsContext";
import { getEventMeta, formatRelativeTime } from "./meta";
import PageHeader from "../../ui/PageHeader";

function getNotificationDateGroup(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Earlier";

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const startOfYesterday = startOfToday - 86_400_000;
    const startOfNotificationDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime();

    if (startOfNotificationDay >= startOfToday) return "Today";
    if (startOfNotificationDay >= startOfYesterday) return "Yesterday";
    return "Earlier";
  } catch {
    return "Earlier";
  }
}

function groupNotificationsByDate<T extends { created_at: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];

  for (const item of items) {
    const label = getNotificationDateGroup(item.created_at);
    const last = groups[groups.length - 1];

    if (last && last.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-gray-100 bg-white">
      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gray-200/80 animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-32 max-w-[60%] rounded-full bg-gray-200/80 animate-pulse" />
        <div className="h-4 w-3/4 max-w-[80%] rounded-full bg-gray-200/80 animate-pulse" />
        <div className="h-4 w-1/2 max-w-[50%] rounded-full bg-gray-200/80 animate-pulse" />
      </div>
    </div>
  );
}

interface NotificationsPageProps {
  /** Called when a notification is clicked. The full notification object is passed. */
  onNotificationClick?: (notification: any) => void;
}

export default function NotificationsPage({
  onNotificationClick,
}: NotificationsPageProps) {
  const {
    notifications,
    unread,
    loading,
    markAllRead,
    markRead,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const filtered = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications,
    [notifications, filter]
  );

  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  const isInitialLoading = loading && notifications.length === 0;
  const totalCount = notifications.length;

  const headerSubtitle = isInitialLoading
    ? "Loading notifications..."
    : unread > 0
      ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
      : "You're all caught up";

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationRead = (notification: any) => {
    // Clicking the notification content only marks an unread item as read.
    if (!notification.is_read) {
      markRead([notification.id]);
    }
  };

  const handleNotificationRoute = (notification: any) => {
    // Only the arrow opens/routes to the notification details.
    if (!notification.is_read) {
      markRead([notification.id]);
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Notifications"
        description={<span aria-live="polite">{headerSubtitle}</span>}
        icon={Bell}
        badge={
          unread > 0 && !isInitialLoading ? (
            <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold text-secondary sm:text-xs">
              {unread} unread
            </span>
          ) : undefined
        }
        actions={
          unread > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/85 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 sm:w-auto sm:text-sm"
            >
              <CheckCheck className="h-4 w-4" />
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          ) : undefined
        }
        loading={isInitialLoading}
        className="mb-5 sm:mb-6"
      />

      {/* Filter tabs */}
      <div
        className="flex items-center gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit"
        role="group"
        aria-label="Filter notifications"
      >
        {(["all", "unread"] as const).map((f) => {
          const count = f === "all" ? totalCount : unread;
          const active = filter === f;

          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 ${
                active
                  ? "bg-white text-secondary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f}
              <span
                className={`text-[10px] sm:text-xs font-bold ${
                  active ? "text-secondary" : "text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List states */}
      {isInitialLoading ? (
        <div
          className="space-y-2"
          aria-label="Loading notifications"
          aria-busy="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4 rounded-2xl border border-gray-100 bg-white">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {filter === "unread" ? (
              <CheckCheck className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
            ) : (
              <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
            )}
          </div>
          <p className="text-sm sm:text-base font-bold text-gray-900">
            {filter === "unread"
              ? "You're all caught up"
              : "No notifications yet"}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xs text-center">
            {filter === "unread"
              ? "You have no unread notifications."
              : "New orders, payments and deliveries will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <div className="flex items-center justify-between px-1 mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {group.label}
                </h2>
                <span className="text-xs font-medium text-gray-400">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.items.map((n) => {
                  const { Icon, label, color, bg } = getEventMeta(n.event);

                  return (
                    <div
                      key={n.id}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-200 sm:gap-4 sm:p-4 ${
                        n.is_read
                          ? "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                          : "border-secondary/15 bg-gradient-to-r from-secondary/[0.07] via-white to-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-secondary/25 hover:shadow-sm"
                      }`}
                    >
                      {!n.is_read && (
                        <span
                          className="absolute inset-y-0 left-0 w-1 bg-secondary"
                          aria-hidden="true"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleNotificationRead(n)}
                        aria-label={
                          n.is_read
                            ? `Read notification: ${n.title}`
                            : `Mark notification as read: ${n.title}`
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 sm:gap-4"
                      >
                        <span
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${bg} ring-1 ring-black/[0.03] sm:h-12 sm:w-12`}
                        >
                          <Icon
                            className={`h-5 w-5 ${color}`}
                            aria-hidden="true"
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-[0.08em] sm:text-[11px] ${color}`}
                            >
                              {label}
                            </span>

                            <span className="text-[10px] font-medium text-gray-400 sm:text-[11px]">
                              · {formatRelativeTime(n.created_at)}
                            </span>

                            {!n.is_read && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-secondary">
                                <span
                                  className="h-1.5 w-1.5 rounded-full bg-secondary"
                                  aria-hidden="true"
                                />
                                New
                              </span>
                            )}
                          </span>

                          <span
                            className={`mt-1 block text-sm leading-5 sm:text-[15px] ${
                              n.is_read
                                ? "font-semibold text-gray-800"
                                : "font-bold text-gray-950"
                            }`}
                          >
                            {n.title}
                          </span>

                          <span className="mt-1 block break-words whitespace-pre-line text-xs leading-5 text-gray-500 sm:text-sm">
                            {n.body}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNotificationRoute(n)}
                        aria-label={`Open notification: ${n.title}`}
                        title="Open details"
                        className="ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:border-secondary hover:bg-secondary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60 focus-visible:ring-offset-2 sm:h-10 sm:w-10"
                      >
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 hover:translate-x-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}