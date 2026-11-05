import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";
import type { PersonalIcal } from "@/lib/personalIcal";

/**
 * Własne linki iCal — users/{uid}/private/calendar (reguły: tylko właściciel
 * z kontem). Serwer dostaje je z każdym zapytaniem o wydarzenia i nigdzie
 * ich nie zapisuje.
 */
function calendarDoc(uid: string) {
  const db = getFirestoreDb();
  return db ? doc(db, "users", uid, "private", "calendar") : null;
}

function parseIcals(raw: unknown): PersonalIcal[] {
  const list = (raw as { icals?: unknown } | undefined)?.icals;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (i): i is PersonalIcal =>
      Boolean(i) &&
      typeof (i as PersonalIcal).id === "string" &&
      typeof (i as PersonalIcal).url === "string",
  );
}

/** 1 odczyt na wczytanie (+ zmiany) — tylko gdy jest konto */
export function usePersonalIcals(): {
  icals: PersonalIcal[];
  ready: boolean;
} {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<{
    uid: string | null;
    icals: PersonalIcal[];
  }>({ uid: null, icals: [] });

  useEffect(() => {
    if (!uid) return;
    const ref = calendarDoc(uid);
    if (!ref) return;
    return onSnapshot(
      ref,
      (snap) => setState({ uid, icals: parseIcals(snap.data()) }),
      () => setState({ uid, icals: [] }),
    );
  }, [uid]);

  if (!uid) return { icals: [], ready: true };
  return {
    icals: state.uid === uid ? state.icals : [],
    ready: state.uid === uid,
  };
}

export async function savePersonalIcals(
  uid: string,
  icals: PersonalIcal[],
): Promise<void> {
  const ref = calendarDoc(uid);
  if (!ref) throw new Error("Firestore unavailable");
  guardWriteBudget();
  await setDoc(ref, { icals }, { merge: true });
}
