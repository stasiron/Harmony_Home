import {
  PANIC_GUESTS_MUST_IMPORTANCE,
  resolveImportance,
} from "@/lib/choreImportance";
import type { Status, Task } from "@/types";

const STATUS_RANK: Record<Status, number> = {
  must: 4,
  suggested: 3,
  safe: 2,
  done: 1,
};

function panicGuestsScore(
  task: Task,
  status: Status,
  guestsMode: boolean,
): number {
  const importance = resolveImportance(task);
  let score = importance * 10_000;
  score += STATUS_RANK[status] * 100;
  if (guestsMode && importance >= 4) score += 500;
  if (status === "must" || status === "suggested") {
    score += task.estimatedMinutes;
  }
  return score;
}

export function sortTasksByImportance(
  tasks: Task[],
  statusOf: (task: Task) => Status,
  guestsMode: boolean,
): Task[] {
  return [...tasks].sort((a, b) => {
    const diff =
      panicGuestsScore(b, statusOf(b), guestsMode) -
      panicGuestsScore(a, statusOf(a), guestsMode);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, "pl");
  });
}

/** PANIC_GOSCIE — od najważniejszych do najmniej ważnych */
export function sortTasksForPanicGuests(
  tasks: Task[],
  statusOf: (task: Task) => Status,
): Task[] {
  return [...tasks].sort((a, b) => {
    const impDiff = resolveImportance(b) - resolveImportance(a);
    if (impDiff !== 0) return impDiff;

    const statusDiff = STATUS_RANK[statusOf(b)] - STATUS_RANK[statusOf(a)];
    if (statusDiff !== 0) return statusDiff;

    return a.name.localeCompare(b.name, "pl");
  });
}

export function isPanicGuestsMust(task: Task, panicActive: boolean): boolean {
  return panicActive && resolveImportance(task) >= PANIC_GUESTS_MUST_IMPORTANCE;
}

export function isGuestsModeMust(task: Task, guestsMode: boolean): boolean {
  return guestsMode && resolveImportance(task) >= 4;
}
