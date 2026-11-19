import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";
import { currentIdToken } from "@/lib/idToken";
import { getPushStatus, notifyEvent } from "@/lib/notify/api";
import type { NotifyCategory, NotifyKind } from "@/lib/notifyTypes";

/**
 * Powiadomienia Web Push: Android (Chrome) i iPhone (iOS 16.4+, tylko gdy
 * aplikacja jest dodana do ekranu głównego). Service worker: public/sw.js.
 */

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS udaje Maca
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

let registration: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  registration ??= navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch((err) => {
      console.warn("Service worker:", err);
      return null;
    });
  return registration;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Id dokumentu subskrypcji — skrót adresu, żeby to samo urządzenie nie dublowało */
async function subscriptionId(endpoint: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(endpoint),
  );
  return [...new Uint8Array(hash)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await registerServiceWorker();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export type EnableResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unsupported" | "denied" | "not-configured" | "no-user" | "error";
    };

/** Pyta o zgodę (musi być wywołane kliknięciem) i zapisuje urządzenie */
export async function enablePush(): Promise<EnableResult> {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  const user = getFirebaseAuth()?.currentUser;
  const db = getFirestoreDb();
  if (!user || !db) return { ok: false, reason: "no-user" };
  try {
    const status = await getPushStatus({ data: {} });
    if (!status.configured || !status.publicKey) {
      return { ok: false, reason: "not-configured" };
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };
    const reg = await registerServiceWorker();
    if (!reg) return { ok: false, reason: "unsupported" };
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToBytes(status.publicKey),
      }));
    const json = subscription.toJSON();
    guardWriteBudget();
    await setDoc(
      doc(
        db,
        "users",
        user.uid,
        "pushSubscriptions",
        await subscriptionId(subscription.endpoint),
      ),
      {
        endpoint: subscription.endpoint,
        keys: json.keys ?? {},
        userAgent: navigator.userAgent.slice(0, 200),
        createdAt: serverTimestamp(),
      },
    );
    return { ok: true };
  } catch (err) {
    console.error("Enable push failed:", err);
    return { ok: false, reason: "error" };
  }
}

export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription();
  const user = getFirebaseAuth()?.currentUser;
  const db = getFirestoreDb();
  if (!subscription) return;
  if (user && db) {
    await deleteDoc(
      doc(
        db,
        "users",
        user.uid,
        "pushSubscriptions",
        await subscriptionId(subscription.endpoint),
      ),
    ).catch(() => undefined);
  }
  await subscription.unsubscribe();
}

export type NotifyPrefs = Record<NotifyCategory, boolean>;

export async function readNotifyPrefs(
  uid: string,
): Promise<Partial<NotifyPrefs>> {
  const db = getFirestoreDb();
  if (!db) return {};
  const snap = await getDoc(doc(db, "users", uid));
  return (snap.data()?.notify as Partial<NotifyPrefs> | undefined) ?? {};
}

export async function saveNotifyPrefs(
  uid: string,
  prefs: Partial<NotifyPrefs>,
) {
  const db = getFirestoreDb();
  if (!db) return;
  guardWriteBudget();
  await setDoc(doc(db, "users", uid), { notify: prefs }, { merge: true });
}

/**
 * Zdarzenie w mieszkaniu → serwer roześle powiadomienia pozostałym.
 * Nie blokuje interfejsu i nie zgłasza błędów — powiadomienie to dodatek.
 */
export function notify(
  householdId: string | null | undefined,
  kind: NotifyKind,
  refId: string,
) {
  if (!householdId) return;
  void (async () => {
    try {
      const idToken = await currentIdToken();
      if (!idToken) return;
      // Chwila na zapis dokumentu, z którego serwer zbuduje treść
      await new Promise((r) => setTimeout(r, 1500));
      await notifyEvent({ data: { idToken, householdId, kind, refId } });
    } catch (err) {
      console.warn("notify failed:", err);
    }
  })();
}
