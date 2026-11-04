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
  /** id zadania → kto ostatnio wykonał (wbudowane zadania nie trafiają do userZadania) */
  progressBy: Record<string, string>;
  /** Własne obowiązki + nadpisania wbudowanych (`customized`) */
  userTasks: Task[];
  /** Własne zadania + nadpisania wbudowanych (`customized`) */
  userZadania: Zadanie[];
};

const defaultLastCompleted = () =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();

function emptyStorage(): ChoreStorage {
  return { progress: {}, progressBy: {}, userTasks: [], userZadania: [] };
}

function readStorage(): ChoreStorage {
  if (typeof window === "undefined") return emptyStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as Partial<ChoreStorage>;
    return {
      progress: parsed.progress ?? {},
      progressBy: parsed.progressBy ?? {},
      userTasks: Array.isArray(parsed.userTasks) ? parsed.userTasks : [],
      userZadania: Array.isArray(parsed.userZadania) ? parsed.userZadania : [],
    };
  } catch {
    return emptyStorage();
  }
}

/** Czy element trzeba zapisać w całości (własny albo edytowany wbudowany) */
function isStoredTask(task: Task) {
  return !PERMANENT_CHORE_IDS.has(task.id) || task.customized === true;
}

function isStoredZadanie(zadanie: Zadanie) {
  return !PERMANENT_ZADANIA_IDS.has(zadanie.id) || zadanie.customized === true;
}

/** Stan obowiązków → części do zapisu (localStorage i Firestore) */
export function splitChoreState(
  tasks: Task[],
  zadania: Zadanie[],
): ChoreStorage {
  return {
    progress: Object.fromEntries([
      ...tasks.map((t) => [t.id, t.lastCompleted] as const),
      ...zadania.map((z) => [z.id, z.lastCompleted] as const),
    ]),
    progressBy: Object.fromEntries(
      zadania
        .filter((z) => z.lastCompletedBy)
        .map((z) => [z.id, z.lastCompletedBy as string] as const),
    ),
    userTasks: tasks.filter(isStoredTask),
    userZadania: zadania.filter(isStoredZadanie),
  };
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
  );
}

function normalizeStoredTask(task: Task, progress: Record<string, string>) {
  return normalizeTaskMap(
    normalizeTaskImportance(
      normalizeUserTask({
        ...task,
        assignedTo: normalizeAssignedTo(task.assignedTo),
        lastCompleted:
          progress[task.id] ?? task.lastCompleted ?? defaultLastCompleted(),
      }),
    ),
  );
}

export function buildTasksFromParts(
  progress: Record<string, string>,
  userTasks: Task[],
): Task[] {
  const overrides = new Map(
    userTasks
      .filter((task) => PERMANENT_CHORE_IDS.has(task.id))
      .map((task) => [task.id, task] as const),
  );

  const permanent = PERMANENT_CHORES.map((template) => {
    const override = overrides.get(template.id);
    if (override) return normalizeStoredTask(override, progress);
    return {
      ...template,
      assignedTo: normalizeAssignedTo(template.assignedTo),
      lastCompleted: progress[template.id] ?? defaultLastCompleted(),
    };
  });

  const custom = userTasks
    .filter((task) => !PERMANENT_CHORE_IDS.has(task.id))
    .map((task) => normalizeStoredTask(task, progress));

  return [...permanent, ...custom];
}

export function buildZadaniaFromParts(
  progress: Record<string, string>,
  userZadania: Zadanie[],
  progressBy: Record<string, string> = {},
): Zadanie[] {
  const overrides = new Map(
    userZadania
      .filter((zadanie) => PERMANENT_ZADANIA_IDS.has(zadanie.id))
      .map((zadanie) => [zadanie.id, zadanie] as const),
  );

  const permanent = PERMANENT_ZADANIA.map((template) => {
    const override = overrides.get(template.id);
    const zadanie = override
      ? normalizeZadanie(override, progress)
      : {
          ...template,
          lastCompleted: progress[template.id] ?? defaultLastCompleted(),
        };
    return {
      ...zadanie,
      lastCompletedBy: progressBy[template.id] ?? zadanie.lastCompletedBy,
    };
  });

  const custom = userZadania
    .filter((zadanie) => !PERMANENT_ZADANIA_IDS.has(zadanie.id))
    .map((zadanie) => normalizeZadanie(zadanie, progress));

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
  const { progress, userZadania, progressBy } = readStorage();
  return buildZadaniaFromParts(progress, userZadania, progressBy);
}

export function persistChoreState(tasks: Task[], zadania: Zadanie[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(splitChoreState(tasks, zadania)),
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
