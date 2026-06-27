import {
  addDays,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { pl } from "date-fns/locale";

export type CalendarViewMode = "3" | "7" | "14" | "month";

export const CALENDAR_VIEW_OPTIONS: {
  value: CalendarViewMode;
  label: string;
}[] = [
  { value: "3", label: "3 dni" },
  { value: "7", label: "7 dni" },
  { value: "14", label: "14 dni" },
  { value: "month", label: "Miesiąc" },
];

export function getViewRange(
  mode: CalendarViewMode,
  anchor: Date,
): { from: Date; to: Date } {
  if (mode === "month") {
    const from = startOfMonth(anchor);
    from.setDate(from.getDate() - 7);
    const to = endOfMonth(anchor);
    to.setHours(23, 59, 59, 999);
    to.setDate(to.getDate() + 7);
    return { from, to };
  }

  const from = startOfDay(anchor);
  const to = addDays(from, Number(mode) - 1);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function getDaysInView(mode: CalendarViewMode, anchor: Date): Date[] {
  if (mode === "month") return [];
  const from = startOfDay(anchor);
  return Array.from({ length: Number(mode) }, (_, i) => addDays(from, i));
}

export function shiftAnchor(
  mode: CalendarViewMode,
  anchor: Date,
  direction: -1 | 1,
): Date {
  if (mode === "month") {
    const next = new Date(anchor);
    next.setMonth(next.getMonth() + direction);
    return next;
  }
  return addDays(anchor, Number(mode) * direction);
}

export function formatRangeLabel(mode: CalendarViewMode, anchor: Date): string {
  if (mode === "month") {
    return format(anchor, "LLLL yyyy", { locale: pl });
  }
  const { from, to } = getViewRange(mode, anchor);
  const sameMonth =
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear();
  if (sameMonth) {
    return `${format(from, "d", { locale: pl })}–${format(to, "d MMMM yyyy", { locale: pl })}`;
  }
  return `${format(from, "d MMM", { locale: pl })} – ${format(to, "d MMM yyyy", { locale: pl })}`;
}
