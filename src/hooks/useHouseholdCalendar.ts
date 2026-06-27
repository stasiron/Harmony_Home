import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useMemo, useState } from "react";
import { buildEventDayIndex, eventsForDay } from "@/lib/calendar/dayIndex";
import {
  formatRangeLabel,
  getDaysInView,
  getViewRange,
  shiftAnchor,
  type CalendarViewMode,
} from "@/lib/calendarView";
import { fetchCalendarEvents } from "@/lib/calendar/api";
import {
  choresDueOnDate,
  dateHasChoreDue,
  guestPlansOnDate,
} from "@/lib/choreCalendar";
import type { GuestPlan, Task } from "@/types";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useHouseholdCalendar(
  tasks: Task[],
  guestPlans: GuestPlan[],
  guestsMode: boolean,
) {
  const loadEvents = useServerFn(fetchCalendarEvents);

  const [viewMode, setViewMode] = useState<CalendarViewMode>("3");
  const [anchor, setAnchor] = useState(startOfToday);
  const [selected, setSelected] = useState<Date | undefined>(() => new Date());

  const range = useMemo(
    () => getViewRange(viewMode, anchor),
    [viewMode, anchor],
  );
  const daysInView = useMemo(
    () => getDaysInView(viewMode, anchor),
    [viewMode, anchor],
  );
  const rangeLabel = useMemo(
    () => formatRangeLabel(viewMode, anchor),
    [viewMode, anchor],
  );

  const rangeKey = `${range.from.toISOString()}|${range.to.toISOString()}`;

  const feedQuery = useQuery({
    queryKey: ["calendar-feed", rangeKey],
    queryFn: () =>
      loadEvents({
        data: { from: range.from.toISOString(), to: range.to.toISOString() },
      }),
    staleTime: 60_000,
  });

  const events = feedQuery.data?.events ?? [];
  const configured = feedQuery.data?.configured ?? false;
  const eventIndex = useMemo(() => buildEventDayIndex(events), [events]);

  const selectedDay = selected ?? new Date();

  const dayBundle = useMemo(
    () => ({
      events: eventsForDay(eventIndex, selectedDay),
      chores: choresDueOnDate(tasks, selectedDay, guestsMode),
      guestPlans: guestPlansOnDate(guestPlans, selectedDay),
    }),
    [eventIndex, selectedDay, tasks, guestPlans, guestsMode],
  );

  const modifiers = useMemo(
    () => ({
      google: (day: Date) => eventsForDay(eventIndex, day).length > 0,
      guest: (day: Date) =>
        eventsForDay(eventIndex, day).some((e) => e.isGuest),
      chore: (day: Date) => dateHasChoreDue(tasks, day, guestsMode),
      plan: (day: Date) => guestPlansOnDate(guestPlans, day).length > 0,
    }),
    [eventIndex, tasks, guestPlans, guestsMode],
  );

  const handleViewChange = useCallback((value: string) => {
    if (!value) return;
    const mode = value as CalendarViewMode;
    setViewMode(mode);
    if (mode === "month") {
      setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth(), 1));
    } else {
      const today = startOfToday();
      setAnchor(today);
      setSelected(today);
    }
  }, []);

  const shiftPeriod = useCallback(
    (direction: -1 | 1) =>
      setAnchor((prev) => shiftAnchor(viewMode, prev, direction)),
    [viewMode],
  );

  const getDayBundle = useCallback(
    (day: Date) => ({
      events: eventsForDay(eventIndex, day),
      chores: choresDueOnDate(tasks, day, guestsMode),
      guestPlans: guestPlansOnDate(guestPlans, day),
    }),
    [eventIndex, tasks, guestPlans, guestsMode],
  );

  return {
    viewMode,
    anchor,
    selected,
    setSelected,
    setAnchor,
    rangeLabel,
    daysInView,
    configured,
    loading: feedQuery.isLoading,
    error: feedQuery.isError,
    errorDetail:
      feedQuery.error instanceof Error ? feedQuery.error.message : null,
    refresh: feedQuery.refetch,
    modifiers,
    selectedDay,
    dayBundle,
    getDayBundle,
    handleViewChange,
    shiftPeriod,
    isMonthView: viewMode === "month",
  };
}
