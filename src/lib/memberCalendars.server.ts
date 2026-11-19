import type {
  CalendarFeedEvent,
  CalendarFeedResult,
} from "@/lib/calendar-feed-types";
import { logServerWarn } from "@/lib/serverLog";
import {
  readCalendarConnectionsStore,
  type MemberConnection,
  type StoredCalendar,
} from "@/lib/calendarConnectionsStore.server";
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
} from "@/lib/googleOAuth.server";
import {
  verifyFirebaseIdToken,
  type VerifiedViewer,
} from "@/lib/firebaseToken.server";
import { normalizeIcalUrl, type PersonalIcal } from "@/lib/personalIcal";
import type { SharedCalendarSettings } from "@/types";

/**
 * Kalendarz należy do konta (uid), nie do mieszkania ani wpisu w kodzie.
 * Każdy widzi: swoje połączenie Google (OAuth, serwer + Redis), swoje linki
 * iCal (przysłane przez klienta z prywatnego zapisu) i wspólny kalendarz domu.
 */

/** Kalendarz wspólny domu (goście) — widzi każdy domownik */
export const SHARED_MEMBER_ID = "household";

const ICAL_TIMEOUT_MS = 10_000;
const ICAL_MAX_BYTES = 5 * 1024 * 1024;
const ICAL_MAX_REDIRECTS = 3;

/**
 * Pobiera kalendarz iCal tylko z dozwolonych hostów (normalizeIcalUrl) —
 * także po przekierowaniach, z limitem czasu i rozmiaru, żeby serwera nie
 * dało się użyć do odpytywania dowolnych adresów ani zawiesić dużym plikiem.
 */
export async function fetchIcalText(rawUrl: string): Promise<string> {
  let url = normalizeIcalUrl(rawUrl);
  for (let hop = 0; url && hop <= ICAL_MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      headers: { Accept: "text/calendar" },
      redirect: "manual",
      signal: AbortSignal.timeout(ICAL_TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      url = location
        ? normalizeIcalUrl(new URL(location, url).toString())
        : null;
      continue;
    }
    if (!res.ok) throw new Error("calendar fetch failed");
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > ICAL_MAX_BYTES) throw new Error("calendar too large");
    const text = await res.text();
    if (text.length > ICAL_MAX_BYTES) throw new Error("calendar too large");
    return text;
  }
  throw new Error("calendar fetch failed");
}

export function displaySummary(
  summary: string,
  display: "full" | "busy",
): string {
  if (display === "busy") return "Zajęty";
  return summary || "Wydarzenie";
}

function feedEventId(
  ownerId: string,
  calendarKey: string,
  summary: string,
  start: Date,
): string {
  return `${ownerId}:${calendarKey}:${calendarEventId(summary, start)}`;
}

type IcalSource = {
  id: string;
  label: string;
  display: "full" | "busy";
  color: string;
  ownerId: string;
  ownerName: string;
  url: string;
  guestLocationKeywords?: string[];
};

function mapIcalEvents(
  source: IcalSource,
  ical: string,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarFeedEvent[] {
  return parseGoogleCalendarEvents(ical)
    .filter((e) => eventOverlapsRange(e.start, e.end, rangeStart, rangeEnd))
    .map((e) => ({
      id: feedEventId(source.ownerId, source.id, e.summary, e.start),
      summary: displaySummary(e.summary, source.display),
      location: source.display === "busy" ? "" : e.location,
      start: e.start.toISOString(),
      end: e.end?.toISOString() ?? null,
      isGuest:
        source.ownerId === SHARED_MEMBER_ID &&
        isGuestCalendarEvent(
          e.summary,
          e.location,
          source.guestLocationKeywords,
        ),
      memberId: source.ownerId,
      memberName: source.ownerName,
      calendarId: source.id,
      calendarLabel: source.label,
      display: source.display,
      color: source.color,
    }));
}

async function fetchIcalSources(
  rangeStart: Date,
  rangeEnd: Date,
  sources: IcalSource[],
): Promise<CalendarFeedEvent[]> {
  const events: CalendarFeedEvent[] = [];
  await Promise.all(
    sources.map(async (source) => {
      try {
        const ical = await fetchIcalText(source.url);
        events.push(...mapIcalEvents(source, ical, rangeStart, rangeEnd));
      } catch (error) {
        logServerWarn("calendar:ical", { source: source.id, error });
      }
    }),
  );
  return events;
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
    id: feedEventId(
      connection.memberId,
      calendar.googleCalendarId,
      summary,
      new Date(start),
    ),
    summary: displaySummary(summary, calendar.display),
    location: calendar.display === "busy" ? "" : (item.location ?? ""),
    start,
    end,
    isGuest: false,
    memberId: connection.memberId,
    memberName: "Ty",
    calendarId: calendar.googleCalendarId,
    calendarLabel: calendar.label,
    display: calendar.display,
    color: calendar.color,
  };
}

async function fetchOAuthEvents(
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

/** Konto (nie tablet bez konta) — może mieć prywatny kalendarz */
export function canHavePersonalCalendar(
  viewer: VerifiedViewer | null,
): viewer is VerifiedViewer {
  return Boolean(viewer && !viewer.anonymous);
}

/** Wspólny kalendarz domu z ustawień mieszkania (HouseholdMeta.sharedCalendar) */
function householdSources(
  shared: SharedCalendarSettings | null | undefined,
): IcalSource[] {
  const url = shared?.icalUrl ? normalizeIcalUrl(shared.icalUrl) : null;
  if (!url) return [];
  return [
    {
      id: "household",
      label: shared?.label?.trim() || "Kalendarz domu",
      display: "full",
      color: "primary",
      ownerId: SHARED_MEMBER_ID,
      ownerName: "Dom",
      url,
      guestLocationKeywords: shared?.guestLocationKeywords,
    },
  ];
}

export async function fetchCalendarEventsImpl(data: {
  from: string;
  to: string;
  idToken?: string | null;
  icals?: PersonalIcal[];
  shared?: SharedCalendarSettings | null;
}): Promise<CalendarFeedResult> {
  const rangeStart = new Date(data.from);
  const rangeEnd = new Date(data.to);
  const viewer = await verifyFirebaseIdToken(data.idToken);
  const events: CalendarFeedEvent[] = [];

  const shared = householdSources(data.shared);
  const personal: IcalSource[] = [];
  let connection: MemberConnection | undefined;

  if (canHavePersonalCalendar(viewer)) {
    const store = await readCalendarConnectionsStore();
    connection = store.members[viewer.uid];
    for (const ical of (data.icals ?? []).slice(0, 10)) {
      const url = ical.enabled === false ? null : normalizeIcalUrl(ical.url);
      if (!url) continue;
      personal.push({
        id: `ical-${ical.id}`,
        label: ical.label || "Mój kalendarz",
        display: ical.display === "busy" ? "busy" : "full",
        color: ical.color || "chart-1",
        ownerId: viewer.uid,
        ownerName: "Ty",
        url,
      });
    }
  }

  if (connection) {
    try {
      events.push(
        ...(await fetchOAuthEvents(connection, rangeStart, rangeEnd)),
      );
    } catch (error) {
      logServerWarn("calendar:oauth", { uid: connection.memberId, error });
    }
  }
  events.push(
    ...(await fetchIcalSources(rangeStart, rangeEnd, [...shared, ...personal])),
  );

  events.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  return {
    configured: shared.length > 0 || personal.length > 0 || Boolean(connection),
    events,
  };
}
