import { PERMANENT_CHORES, PERMANENT_CHORE_IDS } from "@/config/chores";
import { PERMANENT_ZADANIA, PERMANENT_ZADANIA_IDS } from "@/config/zadania";
import { normalizeTaskImportance } from "@/lib/choreImportance";
import { normalizeUserTask } from "@/lib/choreRecurrence";
import { normalizeAssignedTo } from "@/lib/choreAssignees";
import { applyZadanieThresholds } from "@/lib/choreZadaniaStatus";
import { normalizeTaskMap } from "@/lib/taskMap";
import type { Task, Zadanie } from "@/types";

const STORAGE_KEY = "homeharmony-chores";

export type ChoreStorage = {
  progress: Record<string, string>;
  userTasks: Task[];
  userZadania: Zadanie[];
};

const defaultLastCompleted = () =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();

function emptyStorage(): ChoreStorage {
  return { progress: {}, userTasks: [], userZadania: [] };
}

function readStorage(): ChoreStorage {
  if (typeof window === "undefined") return emptyStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as Partial<ChoreStorage>;
    return {
      progress: parsed.progress ?? {},
      userTasks: Array.isArray(parsed.userTasks) ? parsed.userTasks : [],
      userZadania: Array.isArray(parsed.userZadania) ? parsed.userZadania : [],
    };
  } catch {
    return emptyStorage();
  }
}

function normalizeZadanie(zadanie: Zadanie, progress: Record<string, string>) {
  const tMin = zadanie.tMin ?? 3;
  const tMax = zadanie.tMax ?? Math.max(tMin + 1, 7);
  return normalizeTaskMap(
    normalizeTaskImportance(
      applyZadanieThresholds(
        {
          ...zadanie,
          lastCompleted:
            progress[zadanie.id] ??
            zadanie.lastCompleted ??
            defaultLastCompleted(),
        },
        tMin,
        tMax,
      ),
    ),
  ) as Zadanie;
}

export function buildTasksFromParts(
  progress: Record<string, string>,
  userTasks: Task[],
): Task[] {
  const permanent = PERMANENT_CHORES.map((template) => ({
    ...template,
    assignedTo: normalizeAssignedTo(template.assignedTo),
    lastCompleted: progress[template.id] ?? defaultLastCompleted(),
  }));

  const custom = userTasks.map((task) =>
    normalizeTaskMap(
      normalizeTaskImportance(
        normalizeUserTask({
          ...task,
          assignedTo: normalizeAssignedTo(task.assignedTo),
          lastCompleted:
            progress[task.id] ?? task.lastCompleted ?? defaultLastCompleted(),
        }),
      ),
    ),
  );

  return [...permanent, ...custom];
}

export function buildZadaniaFromParts(
  progress: Record<string, string>,
  userZadania: Zadanie[],
): Zadanie[] {
  const permanent = PERMANENT_ZADANIA.map((template) => ({
    ...template,
    lastCompleted: progress[template.id] ?? defaultLastCompleted(),
  }));

  const custom = userZadania.map((zadanie) =>
    normalizeZadanie(zadanie, progress),
  );

  return [...permanent, ...custom];
}

export function readChoreStorage(): ChoreStorage {
  return readStorage();
}

export function buildInitialTasks(): Task[] {
  const { progress, userTasks } = readStorage();
  return buildTasksFromParts(progress, userTasks);
}

export function buildInitialZadania(): Zadanie[] {
  const { progress, userZadania } = readStorage();
  return buildZadaniaFromParts(progress, userZadania);
}

export function persistChoreState(tasks: Task[], zadania: Zadanie[]) {
  if (typeof window === "undefined") return;

  const progress = Object.fromEntries([
    ...tasks.map((t) => [t.id, t.lastCompleted] as const),
    ...zadania.map((z) => [z.id, z.lastCompleted] as const),
  ]);
  const userTasks = tasks.filter((t) => !PERMANENT_CHORE_IDS.has(t.id));
  const userZadania = zadania.filter((z) => !PERMANENT_ZADANIA_IDS.has(z.id));

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ progress, userTasks, userZadania } satisfies ChoreStorage),
  );
}

export function isPermanentTask(taskId: string) {
  return PERMANENT_CHORE_IDS.has(taskId);
}

export function isPermanentZadanie(zadanieId: string) {
  return PERMANENT_ZADANIA_IDS.has(zadanieId);
}

/** @deprecated use persistChoreState */
export function persistTasks(tasks: Task[]) {
  persistChoreState(tasks, buildInitialZadania());
}
