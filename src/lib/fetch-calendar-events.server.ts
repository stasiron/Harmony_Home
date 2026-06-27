import type { CalendarFeedResult } from "@/lib/calendar-feed-types";
import { fetchAllMemberCalendarEvents } from "@/lib/memberCalendars.server";

export async function fetchCalendarEventsImpl(data: {
  from: string;
  to: string;
}): Promise<CalendarFeedResult> {
  const rangeStart = new Date(data.from);
  const rangeEnd = new Date(data.to);
  return fetchAllMemberCalendarEvents(rangeStart, rangeEnd);
}
