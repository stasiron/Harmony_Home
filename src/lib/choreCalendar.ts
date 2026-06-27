import { isSameDay, startOfDay } from "date-fns";
import type { GuestPlan, Status, Task } from "@/types";

export function daysSinceOnDate(task: Task, date: Date): number {
  const day = startOfDay(date).getTime();
  const completed = startOfDay(new Date(task.lastCompleted)).getTime();
  return Math.floor((day - completed) / (1000 * 60 * 60 * 24));
}

export function statusOfTaskOnDate(task: Task, date: Date, guestsMode = false): Status {
  const d = daysSinceOnDate(task, date);
  if (guestsMode && task.isGuestPriority) return "must";
  if (d < task.tMin) return "done";
  if (d >= task.tMax) return "must";
  if (d >= task.tSuggested) return "suggested";
  return "safe";
}

export function choresDueOnDate(tasks: Task[], date: Date, guestsMode = false): Task[] {
  return tasks.filter((task) => {
    const status = statusOfTaskOnDate(task, date, guestsMode);
    return status === "must" || status === "suggested";
  });
}

export function dateHasChoreDue(tasks: Task[], date: Date, guestsMode = false): boolean {
  return choresDueOnDate(tasks, date, guestsMode).length > 0;
}

export function guestPlansOnDate(plans: GuestPlan[], date: Date): GuestPlan[] {
  return plans.filter((plan) => isSameDay(new Date(plan.when), date));
}
