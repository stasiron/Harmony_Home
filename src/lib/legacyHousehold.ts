import { DEFAULT_MEMBERS } from "@/config/household";
import {
  normalizeLaundryProgram,
  normalizeTodo,
  normalizeTodoFolder,
} from "@/lib/appStorage";
import { buildTasksFromParts, buildZadaniaFromParts } from "@/lib/choreStorage";
import type { ItemCollection } from "@/lib/householdSync";
import type {
  GuestPlan,
  ItemMeta,
  LaundryProgram,
  ShoppingItem,
  Task,
  TodoFolder,
  TodoItem,
  User,
  Zadanie,
} from "@/types";

/**
 * Pierwsze mieszkanie — cały stan w jednym dokumencie `households/homeharmony`
 * (sprzed multi-mieszkań). Migracja przepisuje go do podkolekcji; stare pola
 * zostają w dokumencie nietknięte, żeby dało się wrócić.
 */
export const LEGACY_HOUSEHOLD_ID = "homeharmony";

type LegacyData = {
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

function record(value: unknown): Record<string, string> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, string>)
    : {};
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalized<T>(value: unknown, normalize: (raw: unknown) => T | null) {
  return list<unknown>(value)
    .map(normalize)
    .filter((item): item is T => item !== null);
}

export function parseLegacyHousehold(
  data: Record<string, unknown> | undefined,
): LegacyData {
  const d = data ?? {};
  return {
    progress: record(d.progress),
    progressBy: record(d.progressBy),
    userTasks: list(d.userTasks),
    userZadania: list(d.userZadania),
    users: list(d.users),
    shopping: list(d.shopping),
    guestPlans: list(d.guestPlans),
    todos: normalized(d.todos, normalizeTodo),
    todoFolders: normalized(d.todoFolders, normalizeTodoFolder),
    laundryPrograms: normalized(d.laundryPrograms, normalizeLaundryProgram),
  };
}

export type MigratedItems = Record<
  ItemCollection,
  (ItemMeta & { id: string })[]
> & {
  profiles: User[];
};

/**
 * Stary dokument → elementy podkolekcji. Wbudowane obowiązki z content/data
 * trafiają do mieszkania jako zwykłe dokumenty (z postępem i nadpisaniami).
 */
export function buildLegacyMigration(
  data: Record<string, unknown> | undefined,
  ownerUid: string,
  now = new Date(),
): MigratedItems {
  const legacy = parseLegacyHousehold(data);
  let tick = 0;
  // Rosnące createdAt zachowuje dotychczasową kolejność list
  const stamp = <T extends ItemMeta>(item: T): T => ({
    ...item,
    createdBy: ownerUid,
    createdAt: item.createdAt ?? new Date(now.getTime() + tick++).toISOString(),
    locked: false,
  });

  return {
    chores: buildTasksFromParts(legacy.progress, legacy.userTasks).map(stamp),
    zadania: buildZadaniaFromParts(
      legacy.progress,
      legacy.userZadania,
      legacy.progressBy,
    ).map(stamp),
    profiles: (legacy.users.length > 0 ? legacy.users : DEFAULT_MEMBERS).map(
      stamp,
    ),
    shopping: legacy.shopping.map(stamp),
    guestPlans: legacy.guestPlans.map(stamp),
    todos: legacy.todos.map(stamp),
    todoFolders: legacy.todoFolders.map(stamp),
    laundry: legacy.laundryPrograms.map(stamp),
    fridge: [],
    guides: [],
    guideTabs: [],
    guideEntries: [],
  };
}
