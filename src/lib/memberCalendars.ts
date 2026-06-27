import { getIcalFallbackSources } from "@/config/calendars";
import {
  readCalendarConnectionsStore,
  type MemberConnection,
  type StoredCalendar,
} from "@/lib/calendarConnectionsStore";
import { classifyGoogleCalendar, memberName } from "@/lib/calendarRules";
import type { CalendarFeedEvent } from "@/lib/fetchCalendarEvents";
import {
  calendarEventId,
  eventOverlapsRange,
  isGuestCalendarEvent,
  parseGoogleCalendarEvents,
} from "@/lib/googleCalendar";
import {
  fetchGoogleCalendarEvents,
  getMemberAccessToken,
  googleEventToIsoRange,
} from "@/lib/googleOAuth";
import type { RegisteredCalendar } from "@/config/calendars";

export function resolveEnvCalendarUrl(envKey: string): string {
  return process.env[envKey]?.trim() ?? "";
}

export async function fetchIcalText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { Accept: "text/calendar" } });
  if (!res.ok) {
    throw new Error("calendar fetch failed");
  }
  return res.text();
}

export function displaySummary(summary: string, display: "full" | "busy"): string {
  if (display === "busy") return "Zajęty";
  return summary || "Wydarzenie";
}

function feedEventId(
  memberId: string,
  calendarKey: string,
  summary: string,
  start: Date,
): string {
  return `${memberId}:${calendarKey}:${calendarEventId(summary, start)}`;
}

function mapIcalSourceEvents(
  source: RegisteredCalendar,
  ical: string,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarFeedEvent[] {
  return parseGoogleCalendarEvents(ical)
    .filter((e) => eventOverlapsRange(e.start, e.end, rangeStart, rangeEnd))
    .map((e) => ({
      id: feedEventId(source.memberId, source.id, e.summary, e.start),
      summary: displaySummary(e.summary, source.display),
      location: source.display === "busy" ? "" : e.location,
      start: e.start.toISOString(),
      end: e.end?.toISOString() ?? null,
      isGuest:
        source.memberId === "household" && isGuestCalendarEvent(e.summary, e.location),
      memberId: source.memberId,
      memberName: source.memberName,
      calendarId: source.id,
      calendarLabel: source.label,
      display: source.display,
      color: source.color,
    }));
}

async function fetchIcalSources(
  rangeStart: Date,
  rangeEnd: Date,
  sources: RegisteredCalendar[],
): Promise<CalendarFeedEvent[]> {
  const events: CalendarFeedEvent[] = [];
  let anyUrl = false;

  await Promise.all(
    sources.map(async (source) => {
      const url = resolveEnvCalendarUrl(source.envKey);
      if (!url) return;
      anyUrl = true;
      try {
        const ical = await fetchIcalText(url);
        events.push(...mapIcalSourceEvents(source, ical, rangeStart, rangeEnd));
      } catch {
        // skip broken feed
      }
    }),
  );

  return anyUrl ? events : [];
}

function mapGoogleApiEvent(
  connection: MemberConnection,
  calendar: StoredCalendar,
  item: { id: string; summary?: string; location?: string },
  start: string,
  end: string | null,
): CalendarFeedEvent {
  const summary = item.summary ?? "Wydarzenie";
  return {
    id: feedEventId(connection.memberId, calendar.googleCalendarId, summary, new Date(start)),
    summary: displaySummary(summary, calendar.display),
    location: calendar.display === "busy" ? "" : (item.location ?? ""),
    start,
    end,
    isGuest: false,
    memberId: connection.memberId,
    memberName: memberName(connection.memberId),
    calendarId: calendar.googleCalendarId,
    calendarLabel: calendar.label,
    display: calendar.display,
    color: calendar.color,
  };
}

async function fetchOAuthMemberEvents(
  connection: MemberConnection,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<CalendarFeedEvent[]> {
  const accessToken = await getMemberAccessToken(connection);
  const enabled = connection.calendars.filter((c) => c.enabled);
  const events: CalendarFeedEvent[] = [];

  await Promise.all(
    enabled.map(async (calendar) => {
      const items = await fetchGoogleCalendarEvents(
        accessToken,
        calendar.googleCalendarId,
        rangeStart,
        rangeEnd,
      );
      for (const item of items) {
        const range = googleEventToIsoRange(item);
        if (!range) continue;
        events.push(
          mapGoogleApiEvent(connection, calendar, item, range.start, range.end),
        );
      }
    }),
  );

  return events;
}

export async function fetchAllMemberCalendarEvents(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<{ configured: boolean; events: CalendarFeedEvent[] }> {
  const store = await readCalendarConnectionsStore();
  const oauthMembers = Object.values(store.members);
  const events: CalendarFeedEvent[] = [];

  for (const connection of oauthMembers) {
    try {
      const memberEvents = await fetchOAuthMemberEvents(connection, rangeStart, rangeEnd);
      events.push(...memberEvents);
    } catch {
      // skip member with invalid token
    }
  }

  const icalEvents = await fetchIcalSources(rangeStart, rangeEnd, getIcalFallbackSources());
  events.push(...icalEvents);

  const hasIcalEnv = getIcalFallbackSources().some((s) => resolveEnvCalendarUrl(s.envKey));
  const configured = oauthMembers.length > 0 || hasIcalEnv;

  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return { configured, events };
}

export { classifyGoogleCalendar };
