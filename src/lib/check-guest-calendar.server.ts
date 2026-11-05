import { GUEST_LEAD_HOURS, GUEST_TAIL_HOURS } from "@/config/guests";
import { logServerWarn } from "@/lib/serverLog";
import type { GuestCalendarStatus } from "@/lib/calendar-feed-types";
import {
  isGuestCalendarEvent,
  parseGoogleCalendarEvents,
} from "@/lib/googleCalendar";
import { fetchIcalText } from "@/lib/memberCalendars.server";
import { normalizeIcalUrl } from "@/lib/personalIcal";
import type { SharedCalendarSettings } from "@/types";

function isGuestWindowActive(
  start: Date,
  end: Date | null,
  now: number,
): boolean {
  const leadMs = GUEST_LEAD_HOURS * 60 * 60 * 1000;
  const tailMs = GUEST_TAIL_HOURS * 60 * 60 * 1000;
  const startMs = start.getTime();
  const endMs = (end ?? new Date(startMs + 2 * 60 * 60 * 1000)).getTime();
  return now >= startMs - leadMs && now <= endMs + tailMs;
}

const NOT_CONFIGURED: GuestCalendarStatus = {
  active: false,
  eventTitle: null,
  eventStart: null,
  configured: false,
};

/** Tryb gości z wspólnego kalendarza domu (ustawienie mieszkania) */
export async function runCheckGuestCalendar(
  shared: SharedCalendarSettings | null | undefined,
): Promise<GuestCalendarStatus> {
  const url = shared?.icalUrl ? normalizeIcalUrl(shared.icalUrl) : null;
  if (!url) return NOT_CONFIGURED;

  let ical: string;
  try {
    ical = await fetchIcalText(url);
  } catch (error) {
    logServerWarn("guest-calendar", error);
    return { ...NOT_CONFIGURED, configured: true };
  }

  const keywords = shared?.guestLocationKeywords ?? [];
  const now = Date.now();
  const hits = parseGoogleCalendarEvents(ical)
    .filter((e) => isGuestCalendarEvent(e.summary, e.location, keywords))
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
