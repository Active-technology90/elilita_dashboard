/// <reference lib="webworker" />
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkOnly, StaleWhileRevalidate } from "workbox-strategies";
import { firebaseConfig } from "./services/firebaseConfig";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// 1. Precache Vite build assets and clean up obsolete caches
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. Allow the app's update prompt to activate a waiting SW cleanly
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

// 3. Never cache authenticated API requests or live Firebase endpoints
registerRoute(
  ({ url }) =>
    url.pathname.includes("/api/") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firebasedatabase.app") ||
    url.hostname.includes("fcm.googleapis.com") ||
    url.hostname.includes("firebaseinstallations.googleapis.com"),
  new NetworkOnly(),
);

// 4. Cache external Leaflet CSS & Google Fonts safely in the background
registerRoute(
  ({ url }) =>
    url.hostname === "unpkg.com" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com",
  new StaleWhileRevalidate({
    cacheName: "external-ui-assets",
  }),
);

// 5. Version-locked SPA navigation shell (excludes /api/ routes)
const navigationHandler = createHandlerBoundToURL("/index.html");
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//],
  }),
);

// 6. Unified Firebase Cloud Messaging background handler
const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

function buildDashboardUrl(data: Record<string, unknown>): string {
  const params = new URLSearchParams();
  const type = typeof data?.type === "string" ? data.type : "";
  const vendorOrderId =
    data?.vendor_order_id != null ? String(data.vendor_order_id) : "";

  if (type === "vendor_order" && vendorOrderId) {
    params.set("pushTab", "auto");
    params.set("pushType", "vendor_order");
    params.set("vendor_order_id", vendorOrderId);
  } else {
    params.set("pushTab", "notifications");
  }

  return `${self.location.origin}/dashboard?${params.toString()}`;
}

async function openOrFocusDashboard(
  url: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const windowClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of windowClients) {
    if (client.url.includes("/dashboard") && "focus" in client) {
      client.postMessage({
        type: "PUSH_NOTIFICATION_CLICK",
        payload,
      });
      await client.focus();
      return;
    }
  }

  if (self.clients.openWindow) {
    await self.clients.openWindow(url);
  }
}

onBackgroundMessage(messaging, (payload) => {
  // If FCM already supplied a notification block, avoid displaying a duplicate.
  if (payload.notification) {
    return;
  }

  const data = (payload.data ?? {}) as Record<string, string>;
  const title = data.title || "elilitaadmin";
  const body = data.body || "";
  const idPart = data.vendor_order_id || data.order_id;
  const tag =
    data.type && idPart
      ? `${data.type}_${idPart}`
      : data.type || "elilita-admin";

  void self.registration.showNotification(title, {
    body,
    icon: "/icons/pwa-192x192.png",
    badge: "/icons/pwa-192x192.png",
    tag,
    data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = (event.notification?.data ?? {}) as Record<string, unknown>;
  const url = buildDashboardUrl(data);
  const payload = {
    pushTab: data.type === "vendor_order" ? "auto" : "notifications",
    pushType: typeof data.type === "string" ? data.type : null,
    vendor_order_id:
      data.vendor_order_id != null ? String(data.vendor_order_id) : null,
  };

  event.waitUntil(openOrFocusDashboard(url, payload));
});

