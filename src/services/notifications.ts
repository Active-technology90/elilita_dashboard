// src/services/notifications.ts
// Web-push enable + foreground listener for the admin dashboard.
import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getMessagingIfSupported, VAPID_KEY } from "./firebase";
import { registerDevice } from "./api";

export type ClientApp = "admin" | "customer" | "delivery";

const SW_PATH = "/sw.js";
const TOKEN_STORAGE_KEY = "qine_admin_fcm_token";

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) return existing;

  if (!existing) {
    await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
  }
  return navigator.serviceWorker.ready;
}

/**
 * Ask permission, get the FCM token, and register the device with the backend.
 * Returns the token on success; throws an Error with a human message otherwise.
 */
export async function enablePushNotifications(app: ClientApp = "admin"): Promise<string> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }
  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    throw new Error("Push messaging is not supported in this browser.");
  }
  if (!VAPID_KEY) {
    throw new Error("Missing VITE_FIREBASE_VAPID_KEY.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const swReg = await getServiceWorkerRegistration();

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
  if (!token) {
    throw new Error("Could not obtain an FCM token.");
  }

  await registerDevice(token, "web", app);
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

/**
 * Register (or re-register) push for an authenticated session without prompting
 * if permission was already granted. Safe to call on every login / dashboard load.
 */
export async function registerPushForSession(app: ClientApp = "admin"): Promise<string | null> {
  if (!localStorage.getItem("access")) return null;
  if (typeof Notification === "undefined") return null;
  if (Notification.permission === "denied") return null;

  try {
    return await enablePushNotifications(app);
  } catch {
    return null;
  }
}

/** Subscribe to messages received while the tab is in the foreground. */
export async function listenForegroundMessages(
  cb: (payload: MessagePayload) => void
): Promise<() => void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, cb);
}

export function getStoredFcmToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredFcmToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
