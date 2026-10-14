/* public/firebase-messaging-sw.js
 * Service worker that receives FCM web-push messages while the dashboard tab is
 * in the background/closed. Uses the compat SDK (required inside a worker).
 * Keep the version here aligned with the `firebase` npm version (10.14.1).
 */
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAc8UsHWnN6ejpP9GYShExcp50Z-iKNoeE",
  authDomain: "qine-delivery-tracking.firebaseapp.com",
  projectId: "qine-delivery-tracking",
  storageBucket: "qine-delivery-tracking.firebasestorage.app",
  messagingSenderId: "860762669004",
  appId: "1:860762669004:web:bb7434ed3fea7d150d6769",
});

const messaging = firebase.messaging();

function buildDashboardUrl(data) {
  var params = new URLSearchParams();
  var type = (data && data.type) || "";
  var vendorOrderId = data && data.vendor_order_id != null ? String(data.vendor_order_id) : "";

  if (type === "vendor_order" && vendorOrderId) {
    params.set("pushTab", "auto");
    params.set("pushType", "vendor_order");
    params.set("vendor_order_id", vendorOrderId);
  } else {
    params.set("pushTab", "notifications");
  }

  return self.location.origin + "/dashboard?" + params.toString();
}

function payloadFromNotification(notification) {
  return (notification && notification.data) || {};
}

function notifyClient(client, payload) {
  client.postMessage({
    type: "PUSH_NOTIFICATION_CLICK",
    payload: payload,
  });
}

function openOrFocusDashboard(url, payload) {
  return clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windowClients) {
    for (var i = 0; i < windowClients.length; i++) {
      var client = windowClients[i];
      if (client.url.indexOf("/dashboard") !== -1 && "focus" in client) {
        notifyClient(client, payload);
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow(url);
    }
  });
}

messaging.onBackgroundMessage(function (payload) {
  // If FCM already displayed a notification (payload.notification present),
  // do not duplicate with another showNotification call.
  if (payload.notification) {
    return;
  }
  var data = payload.data || {};
  var title = data.title || "Qine";
  var body = data.body || "";
  var tag = (data.type && (data.vendor_order_id || data.order_id))
    ? (data.type + "_" + (data.vendor_order_id || data.order_id))
    : (data.type || "qine-admin");

  self.registration.showNotification(title, {
    body: body,
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: tag,
    renotify: false,
    data: data,
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var data = payloadFromNotification(event.notification);
  var url = buildDashboardUrl(data);
  var payload = {
    pushTab: data.type === "vendor_order" ? "auto" : "notifications",
    pushType: data.type || null,
    vendor_order_id: data.vendor_order_id != null ? String(data.vendor_order_id) : null,
  };

  event.waitUntil(openOrFocusDashboard(url, payload));
});
