import { GUEST_TITLE_KEYWORDS } from "@/config/guests";
import { parseIcalEvents, type IcalEvent } from "@/lib/ical";

export function normalizeCalendarText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function isGuestCalendarEvent(
  summary: string,
  location: string,
): boolean {
  const title = normalizeCalendarText(summary);
  const loc = normalizeCalendarText(location);

  if (
    GUEST_TITLE_KEYWORDS.some((k) => title.includes(normalizeCalendarText(k)))
  )
    return true;

  const hasAndersa = loc.includes("andersa");
  const hasCzestochowa = loc.includes("czestochowa");
  return hasAndersa && hasCzestochowa;
}

export async function fetchGoogleCalendarIcal(): Promise<string | null> {
  const icalUrl =
    process.env.GOOGLE_CALENDAR_ICAL_URL?.trim() ||
    process.env.NITRO_GOOGLE_CALENDAR_ICAL_URL?.trim() ||
    "";
  if (!icalUrl) return null;

  const res = await fetch(icalUrl, { headers: { Accept: "text/calendar" } });
  if (!res.ok) {
    throw new Error("calendar fetch failed");
  }

  return res.text();
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
