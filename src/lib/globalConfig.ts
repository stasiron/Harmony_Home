import { doc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";

/**
 * Ustawienia całej aplikacji (wszystkie mieszkania) — `config/global`.
 * Czyta każdy zalogowany (też bez konta), zapisuje administrator ogólny.
 */
export type GlobalConfig = {
  /** Miła informacja przed logowaniem Google (ekrany Google, alternatywy) */
  googleLoginNotice: boolean;
};

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  googleLoginNotice: true,
};

export function parseGlobalConfig(raw: unknown): GlobalConfig {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    googleLoginNotice:
      typeof data.googleLoginNotice === "boolean"
        ? data.googleLoginNotice
        : DEFAULT_GLOBAL_CONFIG.googleLoginNotice,
  };
}

export function subscribeGlobalConfig(
  onData: (config: GlobalConfig) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    doc(db, "config", "global"),
    (snap) => onData(parseGlobalConfig(snap.data())),
    () => onData(DEFAULT_GLOBAL_CONFIG),
  );
}

export async function saveGlobalConfig(
  patch: Partial<GlobalConfig>,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore unavailable");
  guardWriteBudget();
  await setDoc(doc(db, "config", "global"), patch, { merge: true });
}
