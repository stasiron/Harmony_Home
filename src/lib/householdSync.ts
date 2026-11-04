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

/** Zapis wielu dokumentów w paczkach ≤ BATCH_LIMIT */
export async function commitWrites(
  db: Firestore,
  writes: readonly PlannedWrite[],
): Promise<void> {
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
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
