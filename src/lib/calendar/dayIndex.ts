import { format, startOfDay } from "date-fns";
import type { CalendarFeedEvent } from "@/lib/calendar-feed-types";

export function dayKey(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export function buildEventDayIndex(
  events: CalendarFeedEvent[],
): Map<string, CalendarFeedEvent[]> {
  const index = new Map<string, CalendarFeedEvent[]>();
  for (const event of events) {
    const key = dayKey(new Date(event.start));
    const bucket = index.get(key);
    if (bucket) {
      bucket.push(event);
    } else {
      index.set(key, [event]);
    }
  }
  return index;
}

export function eventsForDay(
  index: Map<string, CalendarFeedEvent[]>,
  day: Date,
): CalendarFeedEvent[] {
  return index.get(dayKey(day)) ?? [];
}
