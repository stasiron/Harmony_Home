import { createServerFn } from "@tanstack/react-start";
import { fetchAllMemberCalendarEvents } from "@/lib/memberCalendars";
import type { CalendarDisplayMode } from "@/config/calendars/types";

export type CalendarFeedEvent = {
  id: string;
  summary: string;
  location: string;
  start: string;
  end: string | null;
  isGuest: boolean;
  memberId: string;
  memberName: string;
  calendarId: string;
  calendarLabel: string;
  display: CalendarDisplayMode;
  color: string;
};

export type CalendarFeedResult = {
  configured: boolean;
  events: CalendarFeedEvent[];
};

export const fetchCalendarEvents = createServerFn({ method: "POST" })
  .validator((data: { from: string; to: string }) => data)
  .handler(async ({ data }): Promise<CalendarFeedResult> => {
    const rangeStart = new Date(data.from);
    const rangeEnd = new Date(data.to);
    return fetchAllMemberCalendarEvents(rangeStart, rangeEnd);
  });
