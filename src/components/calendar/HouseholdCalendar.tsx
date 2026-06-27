import { useServerFn } from "@tanstack/react-start";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";
import { type ReactNode } from "react";
import { Calendar } from "@/components/ui/calendar";
import { DayColumn } from "@/components/calendar/DayColumn";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApp } from "@/context/AppContext";
import { statusOfTaskOnDate } from "@/lib/choreCalendar";
import type { GuestPlan, Task } from "@/types";
import { CALENDAR_VIEW_OPTIONS } from "@/lib/calendarView";
import type { CalendarFeedEvent } from "@/lib/calendar-feed-types";
import { useHouseholdCalendar } from "@/hooks/useHouseholdCalendar";
import { cn } from "@/lib/utils";

function formatEventTime(iso: string) {
  return format(new Date(iso), "HH:mm", { locale: pl });
}

export function HouseholdCalendar() {
  const { tasks, guestPlans, guestsMode, users } = useApp();
  const cal = useHouseholdCalendar(tasks, guestPlans, guestsMode);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => cal.shiftPeriod(-1)}
            aria-label="Poprzedni okres"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-lg font-semibold capitalize tracking-tight">
            {cal.rangeLabel}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={() => cal.shiftPeriod(1)}
            aria-label="Następny okres"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <ToggleGroup
          type="single"
          value={cal.viewMode}
          onValueChange={cal.handleViewChange}
          className="rounded-2xl border border-border bg-surface p-1"
        >
          {CALENDAR_VIEW_OPTIONS.map((opt) => (
            <ToggleGroupItem
              key={opt.value}
              value={opt.value}
              className="rounded-xl px-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {cal.isMonthView ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <CalendarPanel
            configured={cal.configured}
            loading={cal.loading}
            error={cal.error}
            errorDetail={cal.errorDetail}
          >
            <Calendar
              mode="single"
              selected={cal.selected}
              onSelect={cal.setSelected}
              month={cal.anchor}
              onMonthChange={cal.setAnchor}
              locale={pl}
              modifiers={cal.modifiers}
              modifiersClassNames={MODIFIERS_CLASS_NAMES}
              className="mx-auto w-full [--cell-size:2.75rem] sm:[--cell-size:3rem]"
            />
          </CalendarPanel>

          <DayDetailPanel
            day={cal.selectedDay}
            events={cal.dayBundle.events}
            chores={cal.dayBundle.chores}
            guestPlans={cal.dayBundle.guestPlans}
            guestsMode={guestsMode}
            users={users}
          />
        </div>
      ) : (
        <div
          className={cn(
            "grid items-start gap-3",
            cal.viewMode === "3" && "grid-cols-1 md:grid-cols-3",
            cal.viewMode === "7" &&
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7",
            cal.viewMode === "14" &&
              "grid-flow-col auto-cols-[minmax(220px,1fr)] grid-cols-none overflow-x-auto pb-2",
          )}
        >
          {cal.daysInView.map((day) => {
            const bundle = cal.getDayBundle(day);
            return (
              <DayColumn
                key={day.toISOString()}
                day={day}
                events={bundle.events}
                chores={bundle.chores}
                guestPlans={bundle.guestPlans}
                guestsMode={guestsMode}
                users={users}
              />
            );
          })}
        </div>
      )}

      {!cal.isMonthView && (
        <CalendarFooter
          configured={cal.configured}
          loading={cal.loading}
          error={cal.error}
          errorDetail={cal.errorDetail}
        />
      )}
    </div>
  );
}

const MODIFIERS_CLASS_NAMES = {
  google:
    "[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:left-1/2 [&_button]:after:size-1.5 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-primary",
  guest:
    "[&_button]:ring-1 [&_button]:ring-accent/50 [&_button]:after:bg-accent",
  chore:
    "[&_button]:before:absolute [&_button]:before:bottom-1 [&_button]:before:right-1/2 [&_button]:before:mr-2 [&_button]:before:size-1.5 [&_button]:before:rounded-full [&_button]:before:bg-warn [&_button]:before:content-['']",
  plan: "[&_button]:bg-accent/10",
};

function CalendarPanel({
  children,
  configured,
  loading,
  error,
  errorDetail,
}: {
  children: ReactNode;
  configured: boolean;
  loading: boolean;
  error: boolean;
  errorDetail: string | null;
}) {
  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-4 shadow-elevated sm:p-6">
      {children}
      <CalendarFooter
        configured={configured}
        loading={loading}
        error={error}
        errorDetail={errorDetail}
      />
    </section>
  );
}

function CalendarFooter({
  configured,
  loading,
  error,
  errorDetail,
}: {
  configured: boolean;
  loading: boolean;
  error: boolean;
  errorDetail: string | null;
}) {
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <LegendDot className="bg-primary" label="Google Calendar" />
        <LegendDot
          className="bg-accent ring-1 ring-accent/40"
          label="Goście (auto)"
        />
        <LegendDot className="bg-warn" label="Obowiązki" />
        <LegendDot
          className="bg-accent/30 ring-1 ring-accent/30"
          label="Plan gości"
        />
      </div>

      {!configured && !loading && (
        <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Brak połączeń kalendarza
          </p>
          <p>
            Idź do <strong>Ustawienia</strong> → Połącz Google dla każdego
            domownika. Albo ustaw iCal w{" "}
            <code className="text-foreground">.env</code> (fallback).
          </p>
        </div>
      )}
      {error && (
        <p className="mt-4 rounded-2xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">
          Nie udało się pobrać kalendarza.
          {errorDetail && (
            <span className="mt-1 block font-mono text-xs opacity-80">
              {errorDetail}
            </span>
          )}
        </p>
      )}
      {loading && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ładowanie wydarzeń…
        </p>
      )}
    </>
  );
}

function DayDetailPanel({
  day,
  events,
  chores,
  guestPlans,
  guestsMode,
  users,
}: {
  day: Date;
  events: CalendarFeedEvent[];
  chores: Task[];
  guestPlans: GuestPlan[];
  guestsMode: boolean;
  users: { id: string; name: string }[];
}) {
  return (
    <aside className="space-y-4">
      <header className="rounded-2xl border border-border bg-surface px-5 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <CalendarDays className="size-4" />
          Wybrany dzień
        </div>
        <h2 className="mt-1 text-xl font-semibold capitalize tracking-tight">
          {format(day, "EEEE, d MMMM yyyy", { locale: pl })}
        </h2>
      </header>

      <DaySection
        title="Wydarzenia"
        count={events.length}
        empty="Brak wydarzeń w kalendarzu."
      >
        {events.map((event) => (
          <article
            key={event.id}
            className={cn(
              "rounded-2xl border border-border bg-surface-elevated px-4 py-3",
              event.isGuest && "border-accent/40 bg-accent/10",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-snug">{event.summary}</h3>
              <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatEventTime(event.start)}
              </time>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {event.calendarLabel}
              {event.memberName !== "Dom" ? ` · ${event.memberName}` : ""}
            </p>
            {event.location && event.display === "full" && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                {event.location}
              </p>
            )}
            {event.isGuest && (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-accent">
                <Users className="size-3" />
                Tryb gości
              </p>
            )}
          </article>
        ))}
      </DaySection>

      <DaySection
        title="Obowiązki"
        count={chores.length}
        empty="Na ten dzień nic pilnego."
      >
        {chores.map((task) => {
          const status = statusOfTaskOnDate(task, day, guestsMode);
          const assignee = users.find((u) => u.id === task.assignedTo);
          return (
            <article
              key={task.id}
              className={cn(
                "rounded-2xl border border-border bg-surface-elevated px-4 py-3",
                status === "must" && "border-alert/30 bg-alert/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{task.name}</h3>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    status === "must"
                      ? "bg-alert/15 text-alert"
                      : "bg-warn/15 text-warn",
                  )}
                >
                  {status === "must" ? "pilne" : "sugerowane"}
                </span>
              </div>
              {assignee && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {assignee.name}
                </p>
              )}
            </article>
          );
        })}
      </DaySection>

      {guestPlans.length > 0 && (
        <DaySection title="Plany gości" count={guestPlans.length}>
          {guestPlans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3"
            >
              <time className="text-xs text-muted-foreground">
                {format(new Date(plan.when), "HH:mm", { locale: pl })}
              </time>
              {plan.notes && <p className="mt-1 text-sm">{plan.notes}</p>}
            </article>
          ))}
        </DaySection>
      )}
    </aside>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function DaySection({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty?: string;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title} · {count}
      </h3>
      {count === 0 && empty ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}
