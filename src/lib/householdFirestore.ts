import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { PERMANENT_CHORE_IDS } from "@/config/chores";
import { PERMANENT_ZADANIA_IDS } from "@/config/zadania";
import type {
  GuestPlan,
  ShoppingItem,
  Task,
  TodoItem,
  User,
  Zadanie,
} from "@/types";

export const HOUSEHOLD_DOC_ID = "homeharmony";

export type HouseholdSnapshot = {
  progress: Record<string, string>;
  userTasks: Task[];
  userZadania: Zadanie[];
  users: User[];
  shopping: ShoppingItem[];
  guestPlans: GuestPlan[];
  todos: TodoItem[];
};

function emptySnapshot(): HouseholdSnapshot {
  return {
    progress: {},
    userTasks: [],
    userZadania: [],
    users: [],
    shopping: [],
    guestPlans: [],
    todos: [],
  };
}

function normalizeSnapshot(data: Record<string, unknown>): HouseholdSnapshot {
  return {
    progress:
      typeof data.progress === "object" && data.progress !== null
        ? (data.progress as Record<string, string>)
        : {},
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
      ? (data.todos as TodoItem[]).map((t) => ({
          ...t,
          scope: t.scope === "household" ? "household" : "personal",
          assignedTo:
            t.scope !== "household" && typeof t.assignedTo === "string"
              ? t.assignedTo
              : null,
          householdMode:
            t.scope === "household"
              ? t.householdMode === "everyone"
                ? "everyone"
                : "anyone"
              : undefined,
          completedBy: Array.isArray(t.completedBy) ? t.completedBy : [],
        }))
      : [],
  };
}

export function snapshotFromChoreState(
  tasks: Task[],
  zadania: Zadanie[],
): Pick<HouseholdSnapshot, "progress" | "userTasks" | "userZadania"> {
  return {
    progress: Object.fromEntries([
      ...tasks.map((t) => [t.id, t.lastCompleted] as const),
      ...zadania.map((z) => [z.id, z.lastCompleted] as const),
    ]),
    userTasks: tasks.filter((t) => !PERMANENT_CHORE_IDS.has(t.id)),
    userZadania: zadania.filter((z) => !PERMANENT_ZADANIA_IDS.has(z.id)),
  };
}

/** @deprecated */
export function snapshotFromTasks(tasks: Task[]) {
  return snapshotFromChoreState(tasks, []);
}

export function snapshotHash(snapshot: HouseholdSnapshot): string {
  return JSON.stringify({
    progress: snapshot.progress,
    userTasks: snapshot.userTasks,
    userZadania: snapshot.userZadania,
    users: snapshot.users,
    shopping: snapshot.shopping,
    guestPlans: snapshot.guestPlans,
    todos: snapshot.todos,
  });
}

export function subscribeHousehold(
  onUpdate: (data: HouseholdSnapshot) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;

  const ref = doc(db, "households", HOUSEHOLD_DOC_ID);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(emptySnapshot());
        return;
      }
      onUpdate(normalizeSnapshot(snap.data()));
    },
    (err) => onError?.(err),
  );
}

export async function saveHouseholdToFirestore(
  snapshot: HouseholdSnapshot,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore unavailable");

  const ref = doc(db, "households", HOUSEHOLD_DOC_ID);
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
    snapshot.todos.length === 0
  );
}
