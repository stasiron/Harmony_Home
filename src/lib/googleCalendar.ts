import { GUEST_TITLE_KEYWORDS } from "@/config/guests";
import { parseIcalEvents, type IcalEvent } from "@/lib/ical";

export function normalizeCalendarText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Wydarzenie gości: słowo w tytule (goście, wizyta…) albo miejsce zawierające
 * wszystkie fragmenty adresu mieszkania (ustawienie wspólnego kalendarza).
 */
export function isGuestCalendarEvent(
  summary: string,
  location: string,
  locationKeywords: readonly string[] = [],
): boolean {
  const title = normalizeCalendarText(summary);
  if (
    GUEST_TITLE_KEYWORDS.some((k) => title.includes(normalizeCalendarText(k)))
  ) {
    return true;
  }
  const keywords = locationKeywords
    .map((k) => normalizeCalendarText(k.trim()))
    .filter(Boolean);
  if (keywords.length === 0) return false;
  const loc = normalizeCalendarText(location);
  return keywords.every((k) => loc.includes(k));
}

export function parseGoogleCalendarEvents(ical: string): IcalEvent[] {
  return parseIcalEvents(ical);
}

export function eventOverlapsRange(
  start: Date,
  end: Date | null,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const eventEnd = end ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return (
    start.getTime() <= rangeEnd.getTime() &&
    eventEnd.getTime() >= rangeStart.getTime()
  );
}

export function calendarEventId(summary: string, start: Date): string {
  return `${start.getTime()}-${summary}`;
}
