import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { Clock } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { assigneeNamesForTask } from "@/lib/choreAssignees";
import { statusOfTaskOnDate } from "@/lib/choreCalendar";
import type { CalendarFeedEvent } from "@/lib/calendar-feed-types";
import type { CalendarViewMode } from "@/lib/calendarView";
import {
  currentTimeTopPx,
  DAY_GRID_HEIGHT_PX,
  DAY_HOUR_LABELS,
  DAY_START_HOUR,
  HOUR_HEIGHT_PX,
  eventDurationMinutes,
  formatHourLabel,
  heightPxForMinutes,
  isAllDayEvent,
  minutesInDayWindow,
  topPxForDate,
} from "@/lib/daySchedule";
import { effectiveAssignees } from "@/lib/rotation";
import { cn } from "@/lib/utils";
import type { GuestPlan, Task } from "@/types";

type DayBundle = {
  events: CalendarFeedEvent[];
  chores: Task[];
  guestPlans: GuestPlan[];
};

const GUTTER = "3.25rem";
/** Ile pozycji „cały dzień” widać od razu (reszta pod „+N więcej”) */
const ALL_DAY_LIMIT = 3;

/** Minimalna szerokość dnia — przy węższym ekranie siatka przewija się w bok */
const MIN_DAY_WIDTH: Record<Exclude<CalendarViewMode, "month">, string> = {
  "3": "5.5rem",
  "7": "8rem",
  "14": "8.5rem",
};

function currentMinute() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

type TimedItem = {
  key: string;
  start: number;
  end: number;
  top: number;
  height: number;
  time: string;
  title: string;
  sub?: string;
  color?: string;
  tone: "event" | "busy" | "guest";
};

/** Nachodzące na siebie wydarzenia stoją obok siebie, a nie jedno na drugim */
function layoutLanes(items: TimedItem[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: { item: TimedItem; lane: number; lanes: number }[] = [];
  let cluster: { item: TimedItem; lane: number; lanes: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const entry of cluster) entry.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    cluster.push({ item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return placed;
}

function timedItemsForDay(day: Date, bundle: DayBundle): TimedItem[] {
  const items: TimedItem[] = [];
  for (const event of bundle.events) {
    if (isAllDayEvent(event.start, event.end, day)) continue;
    const startDate = new Date(event.start);
    const minutes = eventDurationMinutes(event.start, event.end);
    const start = minutesInDayWindow(startDate, day);
    const busy = event.display === "busy";
    items.push({
      key: event.id,
      start,
      end: start + Math.max(minutes, 30),
      top: topPxForDate(startDate, day),
      height: heightPxForMinutes(minutes),
      time: format(startDate, "HH:mm", { locale: pl }),
      title: event.summary || "Wydarzenie",
      sub:
        event.calendarLabel +
        (!busy && event.memberName !== "Dom" ? ` · ${event.memberName}` : ""),
      color: event.color,
      tone: busy ? "busy" : event.isGuest ? "guest" : "event",
    });
  }
  for (const plan of bundle.guestPlans) {
    if (isAllDayEvent(plan.when, null, day)) continue;
    const startDate = new Date(plan.when);
    const start = minutesInDayWindow(startDate, day);
    items.push({
      key: plan.id,
      start,
      end: start + 60,
      top: topPxForDate(startDate, day),
      height: heightPxForMinutes(60),
      time: format(startDate, "HH:mm", { locale: pl }),
      title: plan.notes || "Plan gości",
      tone: "guest",
    });
  }
  return items;
}

/**
 * Widok 3 / 7 / 14 dni: jedna wspólna oś godzin i jeden suwak dla wszystkich
 * dni (jak w kalendarzu Google). Nagłówki dni zostają u góry, godziny po
 * lewej; na wąskim ekranie siatka przewija się też w bok.
 */
export function CalendarGrid({
  days,
  viewMode,
  getDayBundle,
  guestsMode,
  users,
  onSwipe,
}: {
  /** Przesunięcie palcem w bok (telefon): -1 wcześniej, 1 później */
  onSwipe?: (direction: -1 | 1) => void;
  days: Date[];
  viewMode: Exclude<CalendarViewMode, "month">;
  getDayBundle: (day: Date) => DayBundle;
  guestsMode: boolean;
  users: { id: string; name: string }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  // Pełne minuty — ta sama pozycja linii „teraz” na serwerze i w przeglądarce
  const [now, setNow] = useState(currentMinute);

  useEffect(() => {
    const id = setInterval(() => setNow(currentMinute()), 60_000);
    return () => clearInterval(id);
  }, []);

  const bundles = useMemo(
    () => days.map((day) => ({ day, bundle: getDayBundle(day) })),
    [days, getDayBundle],
  );

  const allDay = bundles.map(({ day, bundle }) => ({
    day,
    events: bundle.events.filter((e) => isAllDayEvent(e.start, e.end, day)),
    plans: bundle.guestPlans.filter((p) => isAllDayEvent(p.when, null, day)),
    chores: bundle.chores,
  }));
  const hasAllDay = allDay.some(
    (d) => d.events.length + d.plans.length + d.chores.length > 0,
  );
  const showsToday = days.some((day) => isToday(day));

  const scrollToNow = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el) return;
      const current = new Date();
      const hour = showsToday ? current.getHours() - 1 : 8;
      const target =
        Math.max(0, hour - DAY_START_HOUR) * HOUR_HEIGHT_PX +
        (el.querySelector<HTMLElement>("[data-grid-body]")?.offsetTop ?? 0) -
        (el.querySelector<HTMLElement>("[data-grid-head]")?.offsetHeight ?? 0);
      el.scrollTo({ top: Math.max(0, target), behavior });
    },
    [showsToday],
  );

  // Przy wejściu i zmianie zakresu — od bieżącej godziny, nie od 6:00
  const rangeKey = days[0]?.toISOString() ?? "";
  useEffect(() => {
    scrollToNow("auto");
  }, [rangeKey, viewMode, scrollToNow]);

  const columns = `${GUTTER} repeat(${days.length}, minmax(${MIN_DAY_WIDTH[viewMode]}, 1fr))`;
  const gridStyle: CSSProperties = {
    gridTemplateColumns: columns,
    minWidth: `calc(${GUTTER} + ${days.length} * ${MIN_DAY_WIDTH[viewMode]})`,
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated">
      <div
        ref={scrollRef}
        className="hh-scroll max-h-[max(24rem,calc(100dvh-19rem))] overflow-auto overscroll-contain md:max-h-[max(26rem,calc(100dvh-25rem))]"
        // Gdy dni mieszczą się w szerokości, przesunięcie w bok zmienia okres
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchRef.current = t ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchEnd={(e) => {
          const start = touchRef.current;
          const t = e.changedTouches[0];
          touchRef.current = null;
          const el = scrollRef.current;
          if (!start || !t || !el || !onSwipe) return;
          if (el.scrollWidth > el.clientWidth + 1) return;
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
            onSwipe(dx < 0 ? 1 : -1);
          }
        }}
      >
        {/* Nagłówki dni i „cały dzień” — przyklejone u góry */}
        <div
          data-grid-head
          className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur"
        >
          <div className="grid" style={gridStyle}>
            <div className="sticky left-0 z-10 bg-surface/95" />
            {days.map((day) => {
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className="flex items-baseline gap-2 border-l border-border/60 px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.15em]",
                      today ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {format(day, "EEE", { locale: pl })}
                  </span>
                  <span
                    className={cn(
                      "grid h-8 min-w-8 place-items-center rounded-full px-1.5 text-lg font-semibold tabular-nums",
                      today && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d", { locale: pl })}
                  </span>
                  {viewMode !== "3" ? null : (
                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                      {format(day, "LLLL", { locale: pl })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cały dzień — obowiązki, wydarzenia całodniowe, plany gości */}
          {hasAllDay && (
            <div className="grid border-t border-border/60" style={gridStyle}>
              <div className="sticky left-0 z-10 flex items-start justify-end bg-surface/95 px-1.5 py-2">
                <span className="text-right text-[9px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
                  Cały
                  <br />
                  dzień
                </span>
              </div>
              {allDay.map(({ day, events, plans, chores }) => {
                const chips = [
                  ...events.map((event) => (
                    <Chip
                      key={event.id}
                      label={event.summary}
                      sub={event.calendarLabel}
                      color={event.color}
                      tone={
                        event.display === "busy"
                          ? "busy"
                          : event.isGuest
                            ? "guest"
                            : "event"
                      }
                    />
                  )),
                  ...plans.map((plan) => (
                    <Chip
                      key={plan.id}
                      label={plan.notes || "Plan gości"}
                      tone="guest"
                    />
                  )),
                  ...chores.map((task) => (
                    <Chip
                      key={task.id}
                      label={task.name}
                      sub={
                        assigneeNamesForTask(users, effectiveAssignees(task)) ||
                        undefined
                      }
                      tone={
                        statusOfTaskOnDate(task, day, guestsMode) === "must"
                          ? "urgent"
                          : "chore"
                      }
                    />
                  )),
                ];
                const hidden = expanded ? 0 : chips.length - ALL_DAY_LIMIT;
                return (
                  <div
                    key={day.toISOString()}
                    className="flex min-w-0 flex-col gap-1 border-l border-border/60 p-1.5"
                  >
                    {hidden > 0 ? chips.slice(0, ALL_DAY_LIMIT) : chips}
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-primary hover:bg-primary/10"
                      >
                        + {hidden} więcej
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="block w-full border-t border-border/60 py-1 text-center text-[11px] text-muted-foreground hover:text-foreground"
            >
              Zwiń
            </button>
          )}
        </div>

        {/* Siatka godzin — jeden suwak dla wszystkich dni */}
        <div data-grid-body className="grid" style={gridStyle}>
          <div
            className="sticky left-0 z-20 border-r border-border/60 bg-surface/95"
            style={{ height: DAY_GRID_HEIGHT_PX }}
          >
            {DAY_HOUR_LABELS.map((hour) =>
              hour === DAY_START_HOUR ? null : (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                  style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX }}
                >
                  {formatHourLabel(hour)}
                </span>
              ),
            )}
          </div>

          {bundles.map(({ day, bundle }) => {
            const nowTop = currentTimeTopPx(day, now);
            const placed = layoutLanes(timedItemsForDay(day, bundle));
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-border/60",
                  today && "bg-primary/[0.035]",
                )}
                style={{ height: DAY_GRID_HEIGHT_PX }}
              >
                {DAY_HOUR_LABELS.map((hour) => (
                  <div key={hour}>
                    <div
                      className="absolute inset-x-0 border-t border-border/50"
                      style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX }}
                    />
                    <div
                      className="absolute inset-x-0 border-t border-dashed border-border/20"
                      style={{
                        top:
                          (hour - DAY_START_HOUR) * HOUR_HEIGHT_PX +
                          HOUR_HEIGHT_PX / 2,
                      }}
                    />
                  </div>
                ))}

                {placed.map(({ item, lane, lanes }) => (
                  <TimedBlock
                    key={item.key}
                    item={item}
                    style={{
                      top: item.top,
                      height: item.height,
                      left: `calc(${(lane / lanes) * 100}% + 3px)`,
                      width: `calc(${100 / lanes}% - 6px)`,
                    }}
                  />
                ))}

                {nowTop !== null && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="size-2.5 -translate-x-1/2 rounded-full bg-alert shadow-[0_0_0_3px_color-mix(in_oklab,var(--alert)_25%,transparent)]" />
                    <div className="h-0.5 flex-1 bg-alert/80" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showsToday && (
        <button
          type="button"
          onClick={() => scrollToNow()}
          className="absolute bottom-3 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/95 px-3 py-1.5 text-xs font-medium shadow-elevated backdrop-blur transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Clock className="size-3.5" />
          Teraz
        </button>
      )}
    </section>
  );
}

function Chip({
  label,
  sub,
  color,
  tone,
}: {
  label: string;
  sub?: string;
  color?: string;
  tone: "event" | "busy" | "guest" | "chore" | "urgent";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border-l-[3px] px-1.5 py-1 text-[11px] leading-snug",
        tone === "event" && "border-l-primary bg-primary/12",
        tone === "busy" && "border-l-border bg-muted/40",
        tone === "guest" && "border-l-accent bg-accent/15",
        tone === "chore" && "border-l-warn bg-warn/12",
        tone === "urgent" && "border-l-alert bg-alert/15",
      )}
      style={
        color && tone === "event"
          ? { borderLeftColor: `var(--${color})` }
          : undefined
      }
      title={sub ? `${label} · ${sub}` : label}
    >
      <p className="truncate font-medium">{label}</p>
      {sub && (
        <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function TimedBlock({
  item,
  style,
}: {
  item: TimedItem;
  style: CSSProperties;
}) {
  const compact = item.height < 40;
  return (
    <div
      className={cn(
        "absolute z-10 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-[11px] leading-tight shadow-sm",
        item.tone === "event" && "border-l-primary bg-primary/20",
        item.tone === "guest" && "border-l-accent bg-accent/25",
        item.tone === "busy" && "border-l-border bg-muted/50",
      )}
      style={{
        ...style,
        ...(item.color && item.tone === "event"
          ? { borderLeftColor: `var(--${item.color})` }
          : {}),
        ...(item.tone === "busy"
          ? {
              backgroundImage:
                "repeating-linear-gradient(-45deg, transparent, transparent 4px, color-mix(in oklch, var(--muted) 35%, transparent) 4px, color-mix(in oklch, var(--muted) 35%, transparent) 8px)",
            }
          : {}),
      }}
      title={`${item.time} ${item.title}${item.sub ? ` · ${item.sub}` : ""}`}
    >
      {compact ? (
        <p className="truncate">
          <span className="tabular-nums text-muted-foreground">
            {item.time}
          </span>{" "}
          <span className="font-medium">{item.title}</span>
        </p>
      ) : (
        <>
          <p className="line-clamp-2 font-medium">{item.title}</p>
          <p className="truncate text-[10px] tabular-nums text-muted-foreground">
            {item.time}
            {item.sub ? ` · ${item.sub}` : ""}
          </p>
        </>
      )}
    </div>
  );
}
