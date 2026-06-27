import { format, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { guestPlansOnDate, statusOfTaskOnDate } from "@/lib/choreCalendar";
import type { CalendarFeedEvent } from "@/lib/calendar-feed-types";
import {
  currentTimeTopPx,
  DAY_GRID_HEIGHT_PX,
  DAY_HOUR_LABELS,
  DAY_START_HOUR,
  eventDurationMinutes,
  formatHourLabel,
  heightPxForMinutes,
  isAllDayEvent,
  topPxForDate,
} from "@/lib/daySchedule";
import type { GuestPlan, Task } from "@/types";
import { cn } from "@/lib/utils";

type DayColumnProps = {
  day: Date;
  events: CalendarFeedEvent[];
  chores: Task[];
  guestPlans: GuestPlan[];
  guestsMode: boolean;
  users: { id: string; name: string }[];
};

export function DayColumn({
  day,
  events,
  chores,
  guestPlans,
  guestsMode,
  users,
}: DayColumnProps) {
  const today = isToday(day);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!today) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [today]);

  const { allDayEvents, timedEvents, timedPlans } = useMemo(() => {
    const allDay: CalendarFeedEvent[] = [];
    const timed: CalendarFeedEvent[] = [];
    for (const event of events) {
      if (isAllDayEvent(event.start, event.end, day)) {
        allDay.push(event);
      } else {
        timed.push(event);
      }
    }
    return {
      allDayEvents: allDay,
      timedEvents: timed,
      timedPlans: guestPlans.filter((p) => !isAllDayEvent(p.when, null, day)),
    };
  }, [events, guestPlans, day]);

  const allDayPlans = guestPlans.filter((p) =>
    isAllDayEvent(p.when, null, day),
  );
  const hasAllDay =
    allDayEvents.length > 0 || chores.length > 0 || allDayPlans.length > 0;
  const nowLineTop = currentTimeTopPx(day, now);

  const hasAnything =
    events.length > 0 || chores.length > 0 || guestPlans.length > 0;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated",
        today ? "border-primary/40 ring-2 ring-primary/15" : "border-border",
      )}
    >
      <header className="shrink-0 border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {format(day, "EEE", { locale: pl })}
        </p>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            today && "text-primary",
          )}
        >
          {format(day, "d MMM", { locale: pl })}
        </p>
      </header>

      {hasAllDay && (
        <div className="shrink-0 space-y-1.5 border-b border-border bg-surface/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cały dzień
          </p>
          <div className="flex flex-col gap-1">
            {allDayEvents.map((event) => (
              <AllDayChip key={event.id} event={event} />
            ))}
            {chores.map((task) => (
              <AllDayChoreChip
                key={task.id}
                label={task.name}
                urgent={statusOfTaskOnDate(task, day, guestsMode) === "must"}
                sub={users.find((u) => u.id === task.assignedTo)?.name}
              />
            ))}
            {allDayPlans.map((plan) => (
              <AllDayChoreChip
                key={plan.id}
                label={plan.notes || "Plan gości"}
                tone="guest"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <div className="flex w-full min-w-0">
          <div
            className="relative w-11 shrink-0 border-r border-border/60 bg-surface/40"
            style={{ height: DAY_GRID_HEIGHT_PX }}
          >
            {DAY_HOUR_LABELS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
                style={{
                  top:
                    (hour - DAY_START_HOUR) *
                    (DAY_GRID_HEIGHT_PX / DAY_HOUR_LABELS.length),
                }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          <div
            className="relative min-w-0 flex-1"
            style={{ height: DAY_GRID_HEIGHT_PX }}
          >
            {DAY_HOUR_LABELS.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border/40"
                style={{
                  top:
                    (hour - DAY_START_HOUR) *
                    (DAY_GRID_HEIGHT_PX / DAY_HOUR_LABELS.length),
                }}
              />
            ))}
            <div
              className="absolute inset-x-0 border-t border-border/60"
              style={{ top: DAY_GRID_HEIGHT_PX }}
            />

            {nowLineTop !== null && (
              <div
                className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                style={{ top: nowLineTop }}
              >
                <div className="size-2 -translate-x-1/2 rounded-full bg-alert" />
                <div className="h-px flex-1 bg-alert/80" />
              </div>
            )}

            {!hasAnything && (
              <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted-foreground">
                Brak zaplanowanych rzeczy
              </p>
            )}

            {timedEvents.map((event) => {
              const top = topPxForDate(new Date(event.start), day);
              const height = heightPxForMinutes(
                eventDurationMinutes(event.start, event.end),
              );
              return (
                <TimedBlock
                  key={event.id}
                  event={event}
                  top={top}
                  height={height}
                  time={format(new Date(event.start), "HH:mm", { locale: pl })}
                />
              );
            })}

            {timedPlans.map((plan) => {
              const top = topPxForDate(new Date(plan.when), day);
              return (
                <TimedBlock
                  key={plan.id}
                  top={top}
                  height={heightPxForMinutes(60)}
                  title={plan.notes || "Plan gości"}
                  time={format(new Date(plan.when), "HH:mm", { locale: pl })}
                  tone="guest"
                />
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}

function AllDayChoreChip({
  label,
  sub,
  urgent,
  tone,
}: {
  label: string;
  sub?: string;
  urgent?: boolean;
  tone?: "guest";
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-2 py-1 text-[11px] leading-snug",
        tone === "guest" && "bg-accent/15 text-foreground",
        tone !== "guest" && urgent && "bg-alert/15 text-foreground",
        tone !== "guest" && !urgent && "bg-warn/15 text-foreground",
      )}
    >
      <span className="font-medium">{label}</span>
      {sub && <span className="ml-1 text-muted-foreground">· {sub}</span>}
    </div>
  );
}

function AllDayChip({ event }: { event: CalendarFeedEvent }) {
  const isBusy = event.display === "busy";
  return (
    <div
      className={cn(
        "rounded-lg px-2 py-1 text-[11px] leading-snug",
        isBusy && "border border-dashed border-border bg-muted/40",
        !isBusy && event.isGuest && "bg-accent/15 ring-1 ring-accent/40",
        !isBusy && !event.isGuest && "bg-primary/15",
      )}
    >
      <span className="font-medium">{event.summary}</span>
      <span className="ml-1 text-muted-foreground">
        · {event.calendarLabel}
        {!isBusy && event.memberName !== "Dom" ? ` · ${event.memberName}` : ""}
      </span>
    </div>
  );
}

function TimedBlock({
  event,
  title,
  tone,
  top,
  height,
  time,
}: {
  event?: CalendarFeedEvent;
  title?: string;
  tone?: "guest";
  top: number;
  height: number;
  time: string;
}) {
  const summary = title ?? event?.summary ?? "Wydarzenie";
  const isBusy = event?.display === "busy";
  const isGuest = tone === "guest" || event?.isGuest;

  return (
    <div
      className={cn(
        "absolute right-1 left-1 z-10 overflow-hidden rounded-lg border px-2 py-1 text-[11px] leading-tight shadow-sm",
        isBusy && "border-border/70 bg-muted/35",
        !isBusy && isGuest && "border-accent/40 bg-accent/20",
        !isBusy && !isGuest && "border-primary/30 bg-primary/20",
      )}
      style={{
        top,
        height,
        ...(isBusy
          ? {
              backgroundImage:
                "repeating-linear-gradient(-45deg, transparent, transparent 4px, color-mix(in oklch, var(--muted) 35%, transparent) 4px, color-mix(in oklch, var(--muted) 35%, transparent) 8px)",
            }
          : {}),
      }}
    >
      <time className="text-[10px] tabular-nums text-muted-foreground">
        {time}
      </time>
      <p className="font-medium">{summary}</p>
      {event && (
        <p className="truncate text-[10px] text-muted-foreground">
          {event.calendarLabel}
          {!isBusy && event.memberName !== "Dom"
            ? ` · ${event.memberName}`
            : ""}
        </p>
      )}
    </div>
  );
}
