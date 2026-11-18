export default {
   
messages: {
  newOrderTitle: "New order",
  newOrderBody:
    "New order #{{orderId}} for {{company}} — {{amount}} ETB.",

  orderPreparingTitle: "Your order is being prepared",
  orderPreparingBody:
    "{{company}} is now preparing your order #{{orderId}}.",

  paymentReceivedTitle: "Payment received",
  paymentReceivedBody:
    "Your payment for order #{{orderId}} ({{amount}} ETB) was received. We'll keep you posted as your items are prepared.",

  outForDeliveryTitle: "Out for delivery",
  outForDeliveryBody:
    "Your order from {{company}} is out for delivery.",

  deliveredTitle: "Delivered",
  deliveredBody:
    "Your order from {{company}} has been delivered. Enjoy!",
},

  title: "Notifications",

  loadingNotifications: "Loading notifications...",
  unreadCount_one: "{{count}} unread notification",
  unreadCount_other: "{{count}} unread notifications",
  unreadBadge_one: "{{count}} unread",
  unreadBadge_other: "{{count}} unread",
  newCount_one: "{{count}} new",
  newCount_other: "{{count}} new",

  allCaughtUp: "You're all caught up",
  marking: "Marking...",
  markAllRead: "Mark all read",
  markAll: "Mark all",
  new: "New",

  filterNotifications: "Filter notifications",

  filters: {
    all: "All",
    unread: "Unread",
  },

  dateGroups: {
    today: "Today",
    yesterday: "Yesterday",
    earlier: "Earlier",
  },

  empty: {
    unreadOlderTitle: "Unread notifications in older pages",
    unreadOlderDescription:
      "You have {{count}} unread notifications in older pages. Load older notifications to view them.",
    noUnreadDescription: "You have no unread notifications.",
    noNotificationsTitle: "No notifications yet",
    noNotificationsDescription:
      "New orders, payments and deliveries will appear here.",
    noNewNotifications: "No new notifications right now.",
  },

  loadingOlder: "Loading older...",
  loadOlder: "Load older notifications",
  loadingMore: "Loading more notifications...",
  loadMore: "Load more notifications",
  paginationCount: "{{current}} of {{total}}",

  openDetails: "Open details",
  openOrder: "Open Order #{{id}}",
  orderNumber: "Order #{{id}}",
  viewAll: "View all notifications",
  close: "Close notifications",

  aria: {
    readNotification: "Read notification: {{title}}",
    markNotificationRead: "Mark notification as read: {{title}}",
    openNotification: "Open notification: {{title}}",
    notification: "Notification: {{title}}",
    openDetailsFor: "Open details for {{title}}",
  },

  events: {
    paymentReceived: "Payment received",
    paymentFailed: "Payment failed",
    newOrder: "New order",
    beingPrepared: "Being prepared",
    deliveryAssigned: "Delivery assigned",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    notification: "Notification",
  },

  relativeTime: {
    justNow: "just now",
    minutes_one: "{{count}}m ago",
    minutes_other: "{{count}}m ago",
    hours_one: "{{count}}h ago",
    hours_other: "{{count}}h ago",
    days_one: "{{count}}d ago",
    days_other: "{{count}}d ago",
  },

  push: {
    enabled: "Push notifications enabled on this device",
    blocked: "Notifications were blocked in browser settings",
    enableDeviceAlerts: "Enable device push alerts",
    enabling: "Enabling...",
    allow: "Allow",
  },
}