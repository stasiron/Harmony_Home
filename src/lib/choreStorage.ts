import { PERMANENT_CHORES, PERMANENT_CHORE_IDS } from "@/config/chores";
import { PERMANENT_ZADANIA, PERMANENT_ZADANIA_IDS } from "@/config/zadania";
import { normalizeTaskImportance } from "@/lib/choreImportance";
import { normalizeUserTask } from "@/lib/choreRecurrence";
import { normalizeAssignedTo } from "@/lib/choreAssignees";
import { applyZadanieThresholds } from "@/lib/choreZadaniaStatus";
import { normalizeTaskMap } from "@/lib/taskMap";
import type { Task, Zadanie } from "@/types";

/**
 * Stary zapis obowiązków (localStorage + jeden dokument Firestore):
 * wbudowane z content/data + postęp + nadpisania. Dziś czyta go tylko
 * migracja pierwszego mieszkania (src/lib/legacyHousehold.ts).
 */
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

/** Obowiązek z Firestore — uzupełnia brakujące / stare pola */
export function normalizeSyncedTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== "object") return null;
  const task = raw as Task;
  if (typeof task.id !== "string" || typeof task.name !== "string") return null;
  return normalizeStoredTask(task, {});
}

export function normalizeSyncedZadanie(raw: unknown): Zadanie | null {
  if (!raw || typeof raw !== "object") return null;
  const zadanie = raw as Zadanie;
  if (typeof zadanie.id !== "string" || typeof zadanie.name !== "string") {
    return null;
  }
  return normalizeZadanie(zadanie, {});
}
