import { startOfDay } from "date-fns";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 24;
export const HOUR_HEIGHT_PX = 52;

export const DAY_GRID_HOURS = DAY_END_HOUR - DAY_START_HOUR;
export const DAY_GRID_HEIGHT_PX = DAY_GRID_HOURS * HOUR_HEIGHT_PX;

export const DAY_HOUR_LABELS = Array.from(
  { length: DAY_GRID_HOURS },
  (_, i) => DAY_START_HOUR + i,
);

export function dayWindowStart(day: Date): Date {
  const start = startOfDay(day);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  return start;
}

export function dayWindowEnd(day: Date): Date {
  const end = startOfDay(day);
  end.setHours(DAY_END_HOUR, 0, 0, 0);
  return end;
}

export function minutesInDayWindow(date: Date, day: Date): number {
  return (date.getTime() - dayWindowStart(day).getTime()) / 60_000;
}

export function topPxForDate(date: Date, day: Date): number {
  const mins = minutesInDayWindow(date, day);
  const maxMins = DAY_GRID_HOURS * 60;
  const clamped = Math.max(0, Math.min(mins, maxMins - 1));
  return (clamped / 60) * HOUR_HEIGHT_PX;
}

export function heightPxForMinutes(minutes: number, minPx = 28): number {
  return Math.max((minutes / 60) * HOUR_HEIGHT_PX, minPx);
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function isAllDayEvent(
  startIso: string,
  endIso: string | null,
  day: Date,
): boolean {
  const start = new Date(startIso);
  if (!endIso) return start.getHours() < DAY_START_HOUR;
  const end = new Date(endIso);
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  return durationMins >= 12 * 60 || start.getHours() < DAY_START_HOUR;
}

export function eventDurationMinutes(
  startIso: string,
  endIso: string | null,
): number {
  const start = new Date(startIso);
  if (!endIso) return 60;
  const end = new Date(endIso);
  return Math.max(15, (end.getTime() - start.getTime()) / 60_000);
}

export function currentTimeTopPx(day: Date, now: Date): number | null {
  if (startOfDay(day).getTime() !== startOfDay(now).getTime()) return null;
  const mins = minutesInDayWindow(now, day);
  if (mins < 0 || mins > DAY_GRID_HOURS * 60) return null;
  return (mins / 60) * HOUR_HEIGHT_PX;
}
