import type { CalendarDisplayMode } from "@/config/calendars/types";

const COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/**
 * Domyślne ustawienia kalendarza z Google po połączeniu: pełne szczegóły,
 * kolor po kolei. Właściciel zmienia je w Ustawieniach (np. „tylko zajęty”).
 */
export function classifyGoogleCalendar(
  summary: string,
  index: number,
): { label: string; display: CalendarDisplayMode; color: string } {
  return {
    label: summary,
    display: "full",
    color: COLORS[index % COLORS.length]!,
  };
}
