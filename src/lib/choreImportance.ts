import type { Task, TaskImportance } from "@/types";

export const IMPORTANCE_LABELS: Record<TaskImportance, string> = {
  1: "Bardzo niska",
  2: "Niska",
  3: "Średnia",
  4: "Wysoka",
  5: "Krytyczna",
};

/** Min. ważność, żeby zadanie trafiło do listy PANIC_GOSCIE */
export const PANIC_GUESTS_MIN_IMPORTANCE = 3 as TaskImportance;

/** Min. ważność, żeby w PANIC_GOSCIE status = must */
export const PANIC_GUESTS_MUST_IMPORTANCE = 4 as TaskImportance;

export function resolveImportance(task: Task): TaskImportance {
  if (task.importance) return task.importance;
  if (task.isExpressBlitz) return 5;
  if (task.isGuestPriority) return 4;
  return 3;
}

export function normalizeTaskImportance(task: Task): Task {
  return { ...task, importance: resolveImportance(task) };
}
