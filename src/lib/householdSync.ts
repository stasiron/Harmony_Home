import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

/**
 * Elementy mieszkania — każdy jako osobny dokument w podkolekcji
 * `households/{householdId}/{name}/{id}`. Dwie osoby edytujące różne
 * elementy nie nadpisują już sobie zmian (wcześniej: jeden dokument).
 */
export const ITEM_COLLECTIONS = [
  "chores",
  "zadania",
  "todos",
  "todoFolders",
  "shopping",
  "laundry",
  "guestPlans",
] as const;

export type ItemCollection = (typeof ITEM_COLLECTIONS)[number];

export type SyncedCollection = ItemCollection | "profiles";

/** Firestore ma limit 500 operacji na batch */
const BATCH_LIMIT = 450;

/** JSON z posortowanymi kluczami — Firestore nie zachowuje kolejności pól */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val: unknown) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val as Record<string, unknown>)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }
    return val;
  });
}

export type CollectionDiff<T> = { upserts: T[]; deletes: string[] };

/** Co zapisać, żeby chmura (`known`: id → stableStringify) wyglądała jak `next` */
export function diffCollection<T extends { id: string }>(
  known: ReadonlyMap<string, string>,
  next: readonly T[],
): CollectionDiff<T> {
  const nextIds = new Set<string>();
  const upserts: T[] = [];
  for (const item of next) {
    nextIds.add(item.id);
    if (known.get(item.id) !== stableStringify(item)) upserts.push(item);
  }
  const deletes = [...known.keys()].filter((id) => !nextIds.has(id));
  return { upserts, deletes };
}

export function indexById<T extends { id: string }>(
  items: readonly T[],
): Map<string, string> {
  return new Map(items.map((item) => [item.id, stableStringify(item)]));
}

export function subscribeCollection<T extends { id: string }>(
  householdId: string,
  name: SyncedCollection,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    collection(db, "households", householdId, name),
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T));
    },
    (err) => onError?.(err),
  );
}

type PlannedWrite =
  | { kind: "set"; path: string[]; data: Record<string, unknown> }
  | { kind: "delete"; path: string[] };

/**
 * Bezpiecznik: pętla zapisów (dwie karty odbijające sobie zmiany) potrafi
 * wyczerpać dzienny limit Firestore w godzinę — 2026-11-04 stary sync zrobił
 * ~12k zapisów/h. Człowiek nie robi 40 zapisów na minutę.
 */
export const WRITE_BUDGET = { commits: 40, windowMs: 60_000 } as const;

export class WriteBudgetExceededError extends Error {
  constructor() {
    super(
      "Wstrzymano zapisy — aplikacja zapisywała podejrzanie często. Odśwież stronę.",
    );
    this.name = "WriteBudgetExceededError";
  }
}

const recentCommits: number[] = [];

/** Rejestruje commit, jeśli mieści się w budżecie; `times` modyfikowane w miejscu */
export function takeWriteBudget(
  times: number[],
  now: number,
  budget: { commits: number; windowMs: number } = WRITE_BUDGET,
): boolean {
  while (times.length > 0 && now - times[0]! >= budget.windowMs) times.shift();
  if (times.length >= budget.commits) return false;
  times.push(now);
  return true;
}

/** Wspólny budżet dla wszystkich zapisów aplikacji; rzuca, gdy wyczerpany */
export function guardWriteBudget(): void {
  if (takeWriteBudget(recentCommits, Date.now())) return;
  console.error(
    `Firestore write budget exceeded (${WRITE_BUDGET.commits}/min) — writes paused`,
  );
  throw new WriteBudgetExceededError();
}

/** Zapis wielu dokumentów w paczkach ≤ BATCH_LIMIT */
export async function commitWrites(
  db: Firestore,
  writes: readonly PlannedWrite[],
): Promise<void> {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    guardWriteBudget();
    const batch = writeBatch(db);
    for (const write of writes.slice(i, i + BATCH_LIMIT)) {
      const [first, ...rest] = write.path;
      const ref = doc(db, first!, ...rest);
      if (write.kind === "set") batch.set(ref, write.data);
      else batch.delete(ref);
    }
    await batch.commit();
  }
}

export function itemWrites<T extends { id: string }>(
  householdId: string,
  name: SyncedCollection,
  diff: CollectionDiff<T>,
): PlannedWrite[] {
  return [
    ...diff.upserts.map((item): PlannedWrite => ({
      kind: "set",
      path: ["households", householdId, name, item.id],
      data: item as Record<string, unknown>,
    })),
    ...diff.deletes.map((id): PlannedWrite => ({
      kind: "delete",
      path: ["households", householdId, name, id],
    })),
  ];
}

export async function writeCollectionDiff<T extends { id: string }>(
  householdId: string,
  name: SyncedCollection,
  diff: CollectionDiff<T>,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore unavailable");
  await commitWrites(db, itemWrites(householdId, name, diff));
}
