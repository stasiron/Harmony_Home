import {
  collection,
  deleteField,
  doc,
  FieldPath,
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
  "fridge",
  "guides",
  "guideTabs",
  "guideEntries",
  "bills",
  "purchases",
  "products",
  "announcements",
  "absences",
  "completions",
  "recipePlans",
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

export type CollectionDiff<T> = {
  upserts: T[];
  deletes: string[];
  /** Ostatnio znana wersja z chmury (id → element) — do zapisu samych zmian */
  previous?: ReadonlyMap<string, Record<string, unknown>>;
};

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
  const previous = new Map<string, Record<string, unknown>>();
  for (const item of upserts) {
    const raw = known.get(item.id);
    if (raw === undefined) continue;
    try {
      previous.set(item.id, JSON.parse(raw) as Record<string, unknown>);
    } catch {
      // nieczytelny wpis — zapiszemy cały element
    }
  }
  return { upserts, deletes, previous };
}

/** Usunięcie pola w zapisie zmian */
export const DELETE_FIELD = Symbol("deleteField");

export type FieldChange = { field: string[]; value: unknown };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Które pola się zmieniły (mapy jak `settled`, `shares` — o jeden poziom
 * głębiej). Zapis samych zmian zamiast całego dokumentu: dwie osoby
 * zmieniające różne pola (albo różne osoby w `settled`) nie nadpisują sobie
 * nawzajem zmian.
 */
export function fieldChanges(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
  depth = 1,
): FieldChange[] {
  const changes: FieldChange[] = [];
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  for (const key of keys) {
    if (key === "id") continue;
    const before = previous[key];
    const after = next[key];
    if (stableStringify(before) === stableStringify(after)) continue;
    if (after === undefined) {
      changes.push({ field: [key], value: DELETE_FIELD });
    } else if (depth > 0 && isPlainObject(before) && isPlainObject(after)) {
      for (const change of fieldChanges(before, after, depth - 1)) {
        changes.push({ field: [key, ...change.field], value: change.value });
      }
    } else {
      changes.push({ field: [key], value: after });
    }
  }
  return changes;
}

export function indexById<T extends { id: string }>(
  items: readonly T[],
): Map<string, string> {
  return new Map(items.map((item) => [item.id, stableStringify(item)]));
}

/** Kolekcje, które mogą mieć elementy prywatne */
export const PRIVATE_COLLECTIONS = [
  "chores",
  "zadania",
  "todos",
  "shopping",
  "fridge",
  "guides",
  "guideEntries",
  "products",
  "laundry",
  "recipePlans",
] as const;

/**
 * Ścieżka listy: publiczna `households/{id}/{name}` albo prywatna
 * `households/{id}/private/{owner}/{name}` (widzi tylko właściciel).
 */
export function collectionPath(
  householdId: string,
  name: SyncedCollection,
  privateOwner?: string | null,
): string[] {
  return privateOwner
    ? ["households", householdId, "private", privateOwner, name]
    : ["households", householdId, name];
}

export function subscribeCollection<T extends { id: string }>(
  householdId: string,
  name: SyncedCollection,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void,
  privateOwner?: string | null,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  const [first, ...rest] = collectionPath(householdId, name, privateOwner);
  return onSnapshot(
    collection(db, first!, ...rest),
    (snap) => {
      onData(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T));
    },
    (err) => onError?.(err),
  );
}

export type PlannedWrite =
  | { kind: "set"; path: string[]; data: Record<string, unknown> }
  | { kind: "update"; path: string[]; changes: FieldChange[] }
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
      else if (write.kind === "update") {
        const pairs = write.changes.map(
          (change) =>
            [
              new FieldPath(...change.field),
              change.value === DELETE_FIELD ? deleteField() : change.value,
            ] as const,
        );
        const [[field, value], ...more] = pairs as [
          (typeof pairs)[number],
          ...(typeof pairs)[number][],
        ];
        batch.update(ref, field, value, ...more.flat());
      } else batch.delete(ref);
    }
    await batch.commit();
  }
}

export function itemWrites<T extends { id: string }>(
  householdId: string,
  name: SyncedCollection,
  diff: CollectionDiff<T>,
  privateOwner?: string | null,
): PlannedWrite[] {
  const base = collectionPath(householdId, name, privateOwner);
  const upserts: PlannedWrite[] = [];
  for (const item of diff.upserts) {
    const path = [...base, item.id];
    const before = diff.previous?.get(item.id);
    // Znany element — tylko zmienione pola (update); nowy — cały (set)
    if (before) {
      const changes = fieldChanges(
        before,
        JSON.parse(stableStringify(item)) as Record<string, unknown>,
      );
      if (changes.length > 0) upserts.push({ kind: "update", path, changes });
    } else {
      upserts.push({
        kind: "set",
        path,
        data: item as Record<string, unknown>,
      });
    }
  }
  return [
    ...upserts,
    ...diff.deletes.map((id): PlannedWrite => ({
      kind: "delete",
      path: [...base, id],
    })),
  ];
}

export async function writeCollectionDiff<T extends { id: string }>(
  householdId: string,
  name: SyncedCollection,
  diff: CollectionDiff<T>,
  privateOwner?: string | null,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore unavailable");
  await commitWrites(db, itemWrites(householdId, name, diff, privateOwner));
}
