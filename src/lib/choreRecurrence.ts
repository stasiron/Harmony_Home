import type { RecurrenceSchedule, Task, Weekday } from "@/types";

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Pn",
  2: "Wt",
  3: "Śr",
  4: "Cz",
  5: "Pt",
  6: "So",
  7: "Nd",
};

export const DEFAULT_SCHEDULE: RecurrenceSchedule = {
  type: "interval",
  unit: "days",
  every: 7,
};

export function scheduleToIntervalDays(schedule: RecurrenceSchedule): number {
  if (schedule.type === "interval") {
    if (schedule.unit === "days") return schedule.every;
    if (schedule.unit === "weeks") return schedule.every * 7;
    return schedule.every * 30;
  }

  const sorted = [...schedule.weekdays].sort((a, b) => a - b);
  if (sorted.length === 0) return schedule.everyWeeks * 7;
  if (sorted.length === 1) return schedule.everyWeeks * 7;

  let minGap = 7;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const gap =
      i === sorted.length - 1 ? 7 - sorted[i]! + next! : next! - sorted[i]!;
    minGap = Math.min(minGap, gap);
  }
  return Math.max(1, minGap);
}

export function deriveThresholds(schedule: RecurrenceSchedule): {
  tMin: number;
  tSuggested: number;
  tMax: number;
} {
  const tSuggested = Math.max(1, scheduleToIntervalDays(schedule));
  return {
    tMin: Math.max(1, tSuggested - 1),
    tSuggested,
    tMax: Math.ceil(tSuggested * 1.5),
  };
}

export function formatScheduleLabel(schedule: RecurrenceSchedule): string {
  if (schedule.type === "interval") {
    if (schedule.unit === "days") {
      return schedule.every === 1
        ? "Codziennie"
        : `Co ${schedule.every} dni`;
    }
    if (schedule.unit === "weeks") {
      return schedule.every === 1
        ? "Co tydzień"
        : `Co ${schedule.every} tyg.`;
    }
    return schedule.every === 1
      ? "Co miesiąc"
      : `Co ${schedule.every} mies.`;
  }

  const days = schedule.weekdays
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d])
    .join(", ");
  const weekPart =
    schedule.everyWeeks === 1
      ? "co tydzień"
      : `co ${schedule.everyWeeks} tyg.`;
  return `${days} · ${weekPart}`;
}

export function applyScheduleToTask<T extends Omit<Task, "lastCompleted">>(
  task: T,
): T & { tMin: number; tSuggested: number; tMax: number } {
  if (task.recurrence === "once" || !task.schedule) return task;
  const thresholds = deriveThresholds(task.schedule);
  return { ...task, ...thresholds };
}

export function normalizeUserTask(task: Task): Task {
  if (task.recurrence === "once") return task;
  const schedule = task.schedule ?? inferScheduleFromThresholds(task);
  return applyScheduleToTask({ ...task, schedule });
}

function inferScheduleFromThresholds(task: Task): RecurrenceSchedule {
  return {
    type: "interval",
    unit: "days",
    every: Math.max(1, task.tSuggested || 7),
  };
}
