import { GUEST_LEAD_HOURS, GUEST_TAIL_HOURS } from "@/config/guests";
import { logServerWarn } from "@/lib/serverLog";
import type { GuestCalendarStatus } from "@/lib/calendar-feed-types";
import {
  fetchGoogleCalendarIcal,
  isGuestCalendarEvent,
  parseGoogleCalendarEvents,
} from "@/lib/googleCalendar";

function isGuestWindowActive(start: Date, end: Date | null, now: number): boolean {
  const leadMs = GUEST_LEAD_HOURS * 60 * 60 * 1000;
  const tailMs = GUEST_TAIL_HOURS * 60 * 60 * 1000;
  const startMs = start.getTime();
  const endMs = (end ?? new Date(startMs + 2 * 60 * 60 * 1000)).getTime();
  return now >= startMs - leadMs && now <= endMs + tailMs;
}

export async function runCheckGuestCalendar(): Promise<GuestCalendarStatus> {
  let ical: string | null;
  try {
    ical = await fetchGoogleCalendarIcal();
  } catch (error) {
    logServerWarn("guest-calendar", error);
    return { active: false, eventTitle: null, eventStart: null, configured: true };
  }

  if (!ical) {
    return { active: false, eventTitle: null, eventStart: null, configured: false };
  }

  const now = Date.now();
  const hits = parseGoogleCalendarEvents(ical)
    .filter((e) => isGuestCalendarEvent(e.summary, e.location))
    .filter((e) => isGuestWindowActive(e.start, e.end, now))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const next = hits[0];
  return {
    active: Boolean(next),
    eventTitle: next?.summary ?? null,
    eventStart: next?.start.toISOString() ?? null,
    configured: true,
  };
}
