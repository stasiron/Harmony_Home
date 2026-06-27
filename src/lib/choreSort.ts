import type { Status, Task } from "@/types";

const STATUS_RANK: Record<Status, number> = {
  must: 4,
  suggested: 3,
  safe: 2,
  done: 1,
};

export function taskImportance(task: Task, status: Status, guestsMode: boolean): number {
  let score = STATUS_RANK[status] * 1000;
  if (guestsMode && task.isGuestPriority) score += 5000;
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
      taskImportance(b, statusOf(b), guestsMode) - taskImportance(a, statusOf(a), guestsMode);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, "pl");
  });
}
