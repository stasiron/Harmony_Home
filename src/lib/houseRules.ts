import { doc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";

/**
 * Regulamin mieszkania — jeden dokument `households/{id}/assets/houseRules`.
 * Czytają wszyscy domownicy, zapisuje administrator (reguła `assets`).
 */
export type HouseRules = {
  body: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export function subscribeHouseRules(
  householdId: string,
  onData: (rules: HouseRules) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    doc(db, "households", householdId, "assets", "houseRules"),
    (snap) => {
      const data = snap.data();
      onData({
        body: typeof data?.body === "string" ? data.body : "",
        updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null,
        updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : null,
      });
    },
    (err) => onError?.(err),
  );
}

export async function saveHouseRules(
  householdId: string,
  body: string,
  updatedBy: string,
) {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  guardWriteBudget();
  await setDoc(doc(db, "households", householdId, "assets", "houseRules"), {
    body,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
}

/** Ogłoszenie jest jeszcze aktualne (bez daty albo data nie minęła) */
export function isAnnouncementActive(
  expiresOn: string | null,
  today = new Date(),
): boolean {
  if (!expiresOn) return true;
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return expiresOn >= `${y}-${m}-${d}`;
}
