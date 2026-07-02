import type { Task, Zadanie } from "@/types";
import { zadanieWeight } from "@/config/choreWeight";

export function normalizeAssignedTo(
  value: string | string[] | undefined,
): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export type AssigneeCompletion = {
  userId: string;
  percent: number;
  weightDone: number;
};

export function choreCompletionByAssignee(
  task: Task,
  linked: Zadanie[],
  statusOfZadanie: (zadanie: Zadanie) => string,
): AssigneeCompletion[] {
  const assignees = normalizeAssignedTo(task.assignedTo);
  if (assignees.length === 0 || linked.length === 0) return [];

  const totalWeight = linked.reduce((sum, z) => sum + zadanieWeight(z), 0);
  if (totalWeight === 0) return [];

  const weightByUser = new Map(assignees.map((id) => [id, 0]));

  for (const zadanie of linked) {
    if (statusOfZadanie(zadanie) !== "done") continue;
    const by = zadanie.lastCompletedBy;
    if (!by || !weightByUser.has(by)) continue;
    weightByUser.set(by, (weightByUser.get(by) ?? 0) + zadanieWeight(zadanie));
  }

  return assignees.map((userId) => {
    const weightDone = weightByUser.get(userId) ?? 0;
    return {
      userId,
      weightDone,
      percent: Math.round((weightDone / totalWeight) * 100),
    };
  });
}

export function pickDefaultCompleter(
  assignees: string[],
  memberId: string | null,
): string | undefined {
  if (assignees.length === 1) return assignees[0];
  if (memberId && assignees.includes(memberId)) return memberId;
  return undefined;
}

export function assigneeNamesForTask(
  users: { id: string; name: string }[],
  assignedTo: string | string[] | undefined,
): string {
  return normalizeAssignedTo(assignedTo)
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join(", ");
}
