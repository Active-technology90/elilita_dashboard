// src/components/dashboard/notifications/NotificationBell.tsx
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  ArrowRight,
  X,
  Package,
} from "lucide-react";
import {
  useNotifications,
  type AppNotification,
} from "../../../context/NotificationsContext";
import { getEventMeta, formatRelativeTime } from "./meta";

interface NotificationBellProps {
  onViewAll: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

export default function NotificationBell({
  onViewAll,
  onNotificationClick,
}: NotificationBellProps) {
  const { notifications, unread, markAllRead, markRead, refetch } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const recent = notifications.slice(0, 8);

  const getVendorOrderId = (n: AppNotification): number | null => {
    const data = (n.data || {}) as Record<string, unknown>;
    const rawId =
      data.vendor_order_id ??
      data.order_id ??
      (data.type === "vendor_order" ? data.id : null);
    if (rawId != null && !isNaN(Number(rawId))) return Number(rawId);

    const text = `${n.title || ""} ${n.body || ""}`;
    const match = text.match(/#(\d+)/);
    return match && match[1] ? Number(match[1]) : null;
  };

  const handleNotificationCardClick = (n: AppNotification) => {
    // Clicking the notification card only marks an unread item as read
    if (!n.is_read) {
      markRead([n.id]);
    }
  };

  const handleNotificationRouteClick = (n: AppNotification) => {
    // Clicking the arrow button marks as read, closes dropdown, and routes to order
    if (!n.is_read) {
      markRead([n.id]);
    }
    setOpen(false);

    if (onNotificationClick) {
      onNotificationClick(n);
    } else {
      onViewAll();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refetch();
        }}
        className={`
          relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border transition-all cursor-pointer
          ${
            open
              ? "border-secondary/25 bg-secondary/[0.08] text-secondary shadow-sm"
              : "border-transparent text-gray-500 hover:border-secondary/15 hover:bg-secondary/[0.04] hover:text-secondary"
          }
        `}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9998] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Card */}
          <div
            className="
              fixed inset-x-2.5 top-[68px] z-[9999]
              sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2.5
              w-auto sm:w-[380px] md:w-[420px] max-w-[calc(100vw-20px)] sm:max-w-[420px]
              max-h-[calc(100vh-145px)] sm:max-h-[540px]
              flex flex-col
              bg-white rounded-2xl shadow-2xl border border-gray-100/90
              overflow-hidden
              animate-in fade-in zoom-in-95 duration-150
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-secondary/[0.06] via-secondary/[0.02] to-transparent shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Bell className="h-4 w-4" />
                </span>
                <p className="font-bold text-sm sm:text-base text-gray-900">
                  Notifications
                </p>
                {unread > 0 && (
                  <span className="text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                    {unread} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-secondary hover:text-secondary/80 px-2 py-1 rounded-md hover:bg-secondary/10 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 sm:hidden"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 overscroll-contain">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 sm:py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-2.5">
                    <Bell className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    You're all caught up
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 max-w-[220px]">
                    No new notifications right now.
                  </p>
                </div>
              ) : (
                recent.map((n) => {
                  const { Icon, color, bg } = getEventMeta(n.event);
                  const orderId = getVendorOrderId(n);

                  return (
                    <div
                      key={n.id}
                      className={`
                        group relative flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3
                        transition-all
                        ${
                          !n.is_read
                            ? "bg-secondary/[0.04] hover:bg-secondary/[0.07]"
                            : "bg-white hover:bg-gray-50/70"
                        }
                      `}
                    >
                      {/* Left border indicator for unread */}
                      {!n.is_read && (
                        <span
                          className="absolute inset-y-0 left-0 w-1 bg-secondary rounded-r"
                          aria-hidden="true"
                        />
                      )}

                      {/* Card Content button: marks as read */}
                      <button
                        type="button"
                        onClick={() => handleNotificationCardClick(n)}
                        aria-label={
                          n.is_read
                            ? `Notification: ${n.title}`
                            : `Mark notification as read: ${n.title}`
                        }
                        className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3 text-left cursor-pointer focus-visible:outline-none"
                      >
                        <div
                          className={`flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${bg} flex items-center justify-center mt-0.5`}
                        >
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p
                              className={`text-xs sm:text-sm font-bold truncate ${
                                !n.is_read ? "text-gray-950" : "text-gray-800"
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-secondary flex-shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 break-words">
                            {n.body}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-400">
                              {formatRelativeTime(n.created_at)}
                            </span>

                            {orderId != null && (
                              <span className="inline-flex items-center gap-1 rounded bg-secondary/10 px-1.5 py-0.5 text-[9px] font-bold text-secondary">
                                <Package className="h-3 w-3" />
                                Order #{orderId}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Arrow Action Button: marks read, closes dropdown, and routes to order modal */}
                      <button
                        type="button"
                        onClick={() => handleNotificationRouteClick(n)}
                        aria-label={`Open details for ${n.title}`}
                        title={
                          orderId != null
                            ? `Open Order #${orderId}`
                            : "Open details"
                        }
                        className="
                          group/btn flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full
                          border border-gray-200 bg-white text-gray-400 shadow-xs transition-all duration-200
                          hover:border-secondary hover:bg-secondary hover:text-white cursor-pointer
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60
                        "
                      >
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/70 p-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onViewAll();
                }}
                className="
                  group w-full py-2 px-3 text-xs sm:text-sm font-semibold text-secondary
                  hover:bg-secondary/10 rounded-xl transition-all flex items-center justify-center gap-1.5
                "
              >
                <span>View all notifications</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
