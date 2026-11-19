import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";
import type { Completion } from "@/types";

/**
 * Historia wykonań (`households/{id}/completions`) — tylko dopisywana.
 * Nie subskrybujemy jej w całości: statystyki czytają wybrany okres.
 */
export async function recordCompletion(
  householdId: string,
  uid: string | null,
  entry: Omit<Completion, "id" | "createdBy" | "createdAt">,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db || !uid) return;
  guardWriteBudget();
  const ref = doc(collection(db, "households", householdId, "completions"));
  await setDoc(ref, {
    ...entry,
    createdBy: uid,
    createdAt: entry.at,
  });
}

export function subscribeCompletions(
  householdId: string,
  sinceIso: string,
  onData: (items: Completion[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    query(
      collection(db, "households", householdId, "completions"),
      where("at", ">=", sinceIso),
      orderBy("at", "desc"),
    ),
    (snap) =>
      onData(snap.docs.map((d) => ({ ...(d.data() as Completion), id: d.id }))),
    (err) => onError?.(err),
  );
}
