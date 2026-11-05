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
  msUntilStale,
  readCachedFeed,
  writeCachedFeed,
} from "@/lib/calendar/feedCache";
import { useAuth } from "@/context/AuthContext";
import { usePersonalIcals } from "@/lib/personalCalendars";
import { effectiveAssignees } from "@/lib/rotation";
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

export type CalendarFilters = {
  /** Tylko moje wydarzenia (bez wspólnego kalendarza domu) i moje obowiązki */
  onlyMine: boolean;
  /** calendarId ukrytych kalendarzy */
  hiddenCalendarIds: string[];
  myProfileId: string | null;
};

export type CalendarSource = {
  calendarId: string;
  label: string;
  memberName: string;
  color: string;
  shared: boolean;
};

export function useHouseholdCalendar(
  allTasks: Task[],
  guestPlans: GuestPlan[],
  guestsMode: boolean,
  filters: CalendarFilters,
) {
  const { icals, ready: icalsReady } = usePersonalIcals();
  const loadEvents = useServerFn(fetchCalendarEvents);
  const { syncUser } = useAuth();
  const viewerUid = syncUser?.uid ?? null;
  const { onlyMine, hiddenCalendarIds, myProfileId } = filters;

  const tasks = useMemo(
    () =>
      onlyMine && myProfileId
        ? allTasks.filter((t) => effectiveAssignees(t).includes(myProfileId))
        : allTasks,
    [allTasks, onlyMine, myProfileId],
  );

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

  // Prywatne: serwer oddaje tylko wydarzenia tej osoby (+ wspólne domu),
  // więc pamięć podręczna też jest per konto
  const icalsKey = icals
    .map((i) => `${i.id}:${i.enabled !== false}:${i.display}`)
    .join(",");
  const cacheKey = `${viewerUid ?? "none"}:${rangeKey}:${icalsKey}`;
  const cached = useMemo(
    () => (typeof window === "undefined" ? null : readCachedFeed(cacheKey)),
    [cacheKey],
  );

  const feedQuery = useQuery({
    queryKey: ["calendar-feed", viewerUid, rangeKey, icalsKey],
    queryFn: async () => {
      const idToken = (await syncUser?.getIdToken()) ?? null;
      const data = await loadEvents({
        data: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          idToken,
          icals,
        },
      });
      writeCachedFeed(cacheKey, data);
      return data;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.fetchedAt,
    // Rzadko: do najbliższej 8:00 i najwyżej kilka godzin (feedCache.ts)
    staleTime: (query) => msUntilStale(query.state.dataUpdatedAt, Date.now()),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: Boolean(viewerUid) && icalsReady,
  });

  const feedEvents = feedQuery.data?.events;
  const sources = useMemo((): CalendarSource[] => {
    const byId = new Map<string, CalendarSource>();
    for (const e of feedEvents ?? []) {
      if (byId.has(e.calendarId)) continue;
      byId.set(e.calendarId, {
        calendarId: e.calendarId,
        label: e.calendarLabel,
        memberName: e.memberName,
        color: e.color,
        shared: e.memberId === "household",
      });
    }
    return [...byId.values()];
  }, [feedEvents]);
  const events = useMemo(() => {
    const hidden = new Set(hiddenCalendarIds);
    return (feedEvents ?? []).filter(
      (e) =>
        !hidden.has(e.calendarId) && !(onlyMine && e.memberId === "household"),
    );
  }, [feedEvents, hiddenCalendarIds, onlyMine]);
  const configured = feedQuery.data?.configured ?? false;
  const eventIndex = useMemo(() => buildEventDayIndex(events), [events]);

  // Bez memo `new Date()` przeliczało dayBundle przy każdym renderze.
  const selectedDay = useMemo(() => selected ?? new Date(), [selected]);

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
    refreshing: feedQuery.isFetching,
    lastSyncedAt: feedQuery.dataUpdatedAt || null,
    sources,
    modifiers,
    selectedDay,
    dayBundle,
    getDayBundle,
    handleViewChange,
    shiftPeriod,
    isMonthView: viewMode === "month",
  };
}
