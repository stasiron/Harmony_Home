import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { splitChoreState } from "@/lib/choreStorage";
import {
  normalizeLaundryProgram,
  normalizeTodo,
  normalizeTodoFolder,
} from "@/lib/appStorage";
import type {
  GuestPlan,
  LaundryProgram,
  ShoppingItem,
  Task,
  TodoFolder,
  TodoItem,
  User,
  Zadanie,
} from "@/types";

/**
 * Id dokumentu obecnego (jedynego) mieszkania.
 * Funkcje poniżej przyjmują `householdId`, żeby dało się dodać kolejne
 * mieszkania bez zmian w warstwie sync — patrz docs/ROADMAP.md (etap 0).
 */
export const DEFAULT_HOUSEHOLD_ID = "homeharmony";

/** @deprecated użyj DEFAULT_HOUSEHOLD_ID lub householdId z kontekstu */
export const HOUSEHOLD_DOC_ID = DEFAULT_HOUSEHOLD_ID;

export type HouseholdSnapshot = {
  progress: Record<string, string>;
  progressBy: Record<string, string>;
  userTasks: Task[];
  userZadania: Zadanie[];
  users: User[];
  shopping: ShoppingItem[];
  guestPlans: GuestPlan[];
  todos: TodoItem[];
  todoFolders: TodoFolder[];
  laundryPrograms: LaundryProgram[];
};

/** Listy, które można uzupełnić z localStorage, gdy w chmurze ich jeszcze nie ma */
const SEEDABLE_LISTS = [
  "users",
  "shopping",
  "guestPlans",
  "todos",
  "todoFolders",
  "laundryPrograms",
] as const satisfies readonly (keyof HouseholdSnapshot)[];

export type SeedableList = (typeof SEEDABLE_LISTS)[number];

function emptySnapshot(): HouseholdSnapshot {
  return {
    progress: {},
    progressBy: {},
    userTasks: [],
    userZadania: [],
    users: [],
    shopping: [],
    guestPlans: [],
    todos: [],
    todoFolders: [],
    laundryPrograms: [],
  };
}

function normalizeRecord(value: unknown): Record<string, string> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, string>)
    : {};
}

function normalizeSnapshot(data: Record<string, unknown>): HouseholdSnapshot {
  return {
    progress: normalizeRecord(data.progress),
    progressBy: normalizeRecord(data.progressBy),
    userTasks: Array.isArray(data.userTasks) ? (data.userTasks as Task[]) : [],
    userZadania: Array.isArray(data.userZadania)
      ? (data.userZadania as Zadanie[])
      : [],
    users: Array.isArray(data.users) ? (data.users as User[]) : [],
    shopping: Array.isArray(data.shopping)
      ? (data.shopping as ShoppingItem[])
      : [],
    guestPlans: Array.isArray(data.guestPlans)
      ? (data.guestPlans as GuestPlan[])
      : [],
    todos: Array.isArray(data.todos)
      ? data.todos.map(normalizeTodo).filter((t): t is TodoItem => t !== null)
      : [],
    todoFolders: Array.isArray(data.todoFolders)
      ? data.todoFolders
          .map(normalizeTodoFolder)
          .filter((f): f is TodoFolder => f !== null)
      : [],
    laundryPrograms: Array.isArray(data.laundryPrograms)
      ? data.laundryPrograms
          .map(normalizeLaundryProgram)
          .filter((p): p is LaundryProgram => p !== null)
      : [],
  };
}

export function snapshotFromChoreState(
  tasks: Task[],
  zadania: Zadanie[],
): Pick<
  HouseholdSnapshot,
  "progress" | "progressBy" | "userTasks" | "userZadania"
> {
  return splitChoreState(tasks, zadania);
}

/** @deprecated */
export function snapshotFromTasks(tasks: Task[]) {
  return snapshotFromChoreState(tasks, []);
}

export function snapshotHash(snapshot: HouseholdSnapshot): string {
  return JSON.stringify({
    progress: snapshot.progress,
    progressBy: snapshot.progressBy,
    userTasks: snapshot.userTasks,
    userZadania: snapshot.userZadania,
    users: snapshot.users,
    shopping: snapshot.shopping,
    guestPlans: snapshot.guestPlans,
    todos: snapshot.todos,
    todoFolders: snapshot.todoFolders,
    laundryPrograms: snapshot.laundryPrograms,
  });
}

/**
 * @param onUpdate `missingLists` — listy, których pola w ogóle nie ma
 *   w dokumencie (np. stary dokument sprzed todo). Pusta tablica ≠ brak pola.
 */
export function subscribeHousehold(
  householdId: string,
  onUpdate: (
    data: HouseholdSnapshot,
    missingLists: ReadonlySet<SeedableList>,
  ) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;

  const ref = doc(db, "households", householdId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(emptySnapshot(), new Set(SEEDABLE_LISTS));
        return;
      }
      const data = snap.data();
      const missing = new Set(
        SEEDABLE_LISTS.filter((key) => !Array.isArray(data[key])),
      );
      onUpdate(normalizeSnapshot(data), missing);
    },
    (err) => onError?.(err),
  );
}

export async function saveHouseholdToFirestore(
  householdId: string,
  snapshot: HouseholdSnapshot,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore unavailable");

  const ref = doc(db, "households", householdId);
  await setDoc(
    ref,
    {
      ...snapshot,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function isEmptyHousehold(snapshot: HouseholdSnapshot): boolean {
  return (
    snapshot.userTasks.length === 0 &&
    snapshot.userZadania.length === 0 &&
    Object.keys(snapshot.progress).length === 0 &&
    snapshot.users.length === 0 &&
    snapshot.shopping.length === 0 &&
    snapshot.guestPlans.length === 0 &&
    snapshot.todos.length === 0 &&
    snapshot.todoFolders.length === 0 &&
    snapshot.laundryPrograms.length === 0
  );
}

/**
 * Gdy w chmurze brakuje pola listy (np. stare dokumenty sprzed todos),
 * dołóż lokalne wartości zamiast je wycierać przy pierwszym syncu.
 * Celowo wyczyszczona lista (pusta tablica w chmurze) zostaje pusta —
 * inaczej np. wyczyszczone zakupy wracałyby z localStorage innego urządzenia.
 */
export function seedEmptyListsFromLocal(
  remote: HouseholdSnapshot,
  local: HouseholdSnapshot,
  missingLists: ReadonlySet<SeedableList>,
): HouseholdSnapshot {
  const seeded = { ...remote };
  for (const key of missingLists) {
    if (local[key].length > 0) {
      (seeded as Record<SeedableList, unknown>)[key] = local[key];
    }
  }
  return seeded;
}
