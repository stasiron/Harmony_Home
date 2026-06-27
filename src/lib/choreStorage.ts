import { PERMANENT_CHORES, PERMANENT_CHORE_IDS } from "@/config/chores";
import type { Task } from "@/types";

const STORAGE_KEY = "homeharmony-chores";

type ChoreStorage = {
  progress: Record<string, string>;
  userTasks: Task[];
};

const defaultLastCompleted = () =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();

function emptyStorage(): ChoreStorage {
  return { progress: {}, userTasks: [] };
}

function readStorage(): ChoreStorage {
  if (typeof window === "undefined") return emptyStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as ChoreStorage;
    return {
      progress: parsed.progress ?? {},
      userTasks: Array.isArray(parsed.userTasks) ? parsed.userTasks : [],
    };
  } catch {
    return emptyStorage();
  }
}

export function buildInitialTasks(): Task[] {
  const { progress, userTasks } = readStorage();

  const permanent = PERMANENT_CHORES.map((template) => ({
    ...template,
    lastCompleted: progress[template.id] ?? defaultLastCompleted(),
  }));

  const custom = userTasks.map((task) => ({
    ...task,
    lastCompleted: progress[task.id] ?? task.lastCompleted ?? defaultLastCompleted(),
  }));

  return [...permanent, ...custom];
}

export function persistTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;

  const progress = Object.fromEntries(tasks.map((t) => [t.id, t.lastCompleted]));
  const userTasks = tasks.filter((t) => !PERMANENT_CHORE_IDS.has(t.id));

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ progress, userTasks } satisfies ChoreStorage),
  );
}

export function isPermanentTask(taskId: string) {
  return PERMANENT_CHORE_IDS.has(taskId);
}
