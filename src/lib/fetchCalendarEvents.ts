import { createServerFn } from "@tanstack/react-start";

export type { CalendarFeedEvent, CalendarFeedResult } from "@/lib/calendar-feed-types";

export const fetchCalendarEvents = createServerFn({ method: "POST" })
  .validator((data: { from: string; to: string }) => data)
  .handler(async ({ data }) => {
    const { fetchCalendarEventsImpl } = await import("@/lib/fetch-calendar-events.server");
    return fetchCalendarEventsImpl(data);
  });
