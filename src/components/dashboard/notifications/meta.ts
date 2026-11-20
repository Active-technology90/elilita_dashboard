
import {
  Bell,
  CreditCard,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Truck,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";
import type { TFunction } from "i18next";

export interface EventMeta {
  Icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
}

export interface NotificationContent {
  title: string;
  body: string;
}

/**
 * Returns icon, color and translated label for each notification event.
 */
export function getEventMeta(
  event: string,
  t: TFunction,
): EventMeta {
  switch (event) {
    case "order.paid":
      return {
        Icon: CreditCard,
        label: t("events.paymentReceived", {
          defaultValue: "Payment received",
        }),
        color: "text-green-600",
        bg: "bg-green-50",
      };

    case "order.payment_failed":
      return {
        Icon: AlertTriangle,
        label: t("events.paymentFailed", {
          defaultValue: "Payment failed",
        }),
        color: "text-red-600",
        bg: "bg-red-50",
      };

    case "vendororder.new":
      return {
        Icon: ShoppingBag,
        label: t("events.newOrder", {
          defaultValue: "New order",
        }),
        color: "text-blue-600",
        bg: "bg-blue-50",
      };

    case "vendororder.preparing":
      return {
        Icon: Clock,
        label: t("events.beingPrepared", {
          defaultValue: "Preparing",
        }),
        color: "text-amber-600",
        bg: "bg-amber-50",
      };

    case "delivery.assigned":
      return {
        Icon: Truck,
        label: t("events.deliveryAssigned", {
          defaultValue: "Delivery assigned",
        }),
        color: "text-indigo-600",
        bg: "bg-indigo-50",
      };

    case "delivery.out_for_delivery":
      return {
        Icon: Truck,
        label: t("events.outForDelivery", {
          defaultValue: "Out for delivery",
        }),
        color: "text-orange-600",
        bg: "bg-orange-50",
      };

    case "delivery.delivered":
      return {
        Icon: PackageCheck,
        label: t("events.delivered", {
          defaultValue: "Delivered",
        }),
        color: "text-green-600",
        bg: "bg-green-50",
      };

    default:
      return {
        Icon: Bell,
        label: t("events.notification", {
          defaultValue: "Notification",
        }),
        color: "text-gray-600",
        bg: "bg-gray-100",
      };
  }
}

/**
 * Formats notification timestamps into relative time.
 */
export function formatRelativeTime(
  iso: string,
  t: TFunction,
): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (diffSeconds < 60) {
    return t("relativeTime.justNow", {
      defaultValue: "Just now",
    });
  }

  const minutes = Math.floor(diffSeconds / 60);

  if (minutes < 60) {
    return t("relativeTime.minutes", {
      count: minutes,
      defaultValue: `${minutes} minutes ago`,
    });
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return t("relativeTime.hours", {
      count: hours,
      defaultValue: `${hours} hours ago`,
    });
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return t("relativeTime.days", {
      count: days,
      defaultValue: `${days} days ago`,
    });
  }

  return new Intl.DateTimeFormat(
    t("locale", { defaultValue: "en-US" }),
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

/**
 * Translates known backend notification messages while preserving
 * dynamic values such as company names, order IDs and amounts.
 */
export function getNotificationContent(
  notification: {
    event: string;
    title: string;
    body: string;
  },
  t: TFunction,
): NotificationContent {
  const { event, title, body } = notification;

  switch (event) {
    case "vendororder.new": {
      const match = body.match(
        /^New order #(\d+) for (.+?)\s*[—–-]\s*([\d,]+(?:\.\d{1,2})?)\s*ETB\.?$/i,
      );

      if (match) {
        return {
          title: t("messages.newOrderTitle"),
          body: t("messages.newOrderBody", {
            orderId: match[1],
            company: match[2],
            amount: match[3],
          }),
        };
      }

      break;
    }

    case "vendororder.preparing": {
      const match = body.match(
        /^(.+?) is now preparing your order #(\d+)\.?$/i,
      );

      if (match) {
        return {
          title: t("messages.orderPreparingTitle"),
          body: t("messages.orderPreparingBody", {
            company: match[1],
            orderId: match[2],
          }),
        };
      }

      break;
    }

    case "order.paid": {
      const match = body.match(
        /^Your payment for order #(\d+)\s+([\d,]+(?:\.\d{1,2})?)\s*ETB was received\.\s*We'll keep you posted as your items are prepared\.?$/i,
      );

      if (match) {
        return {
          title: t("messages.paymentReceivedTitle"),
          body: t("messages.paymentReceivedBody", {
            orderId: match[1],
            amount: match[2],
          }),
        };
      }

      break;
    }

    case "delivery.out_for_delivery": {
      const match = body.match(
        /^Your order from (.+?) is out for delivery\.?$/i,
      );

      if (match) {
        return {
          title: t("messages.outForDeliveryTitle"),
          body: t("messages.outForDeliveryBody", {
            company: match[1],
          }),
        };
      }

      break;
    }

    case "delivery.delivered": {
      const match = body.match(
        /^Your order from (.+?) has been delivered\. Enjoy!?$/i,
      );

      if (match) {
        return {
          title: t("messages.deliveredTitle"),
          body: t("messages.deliveredBody", {
            company: match[1],
          }),
        };
      }

      break;
    }
  }

  // Preserve original backend content if the event or message is unknown.
  return { title, body };
}
