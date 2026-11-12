// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import { getDatabase } from "firebase/database";
import { firebaseConfig } from "./firebaseConfig";

export { firebaseConfig };

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const app = initializeApp(firebaseConfig);

export async function getMessagingIfSupported(): Promise<Messaging | null> {
  try {
    if (await isSupported()) return getMessaging(app);
    return null;
  } catch {
    return null;
  }
}

export const db = getDatabase(app);
