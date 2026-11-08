import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Map as MapIcon, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import {
  CopyFloorPlanPromptButton,
  FloorPlanUploadButton,
} from "@/components/household/NoFloorPlan";
import { Shell } from "@/components/Shell";
import { AddChoreDialog } from "@/components/chores/AddChoreDialog";
import { AddZadanieDialog } from "@/components/chores/AddZadanieDialog";
import { ExportChoresButton } from "@/components/chores/ExportChoresButton";
import { ActivityPanel } from "@/components/chores/ActivityPanel";
import { ApartmentMap } from "@/components/chores/ApartmentMap";
import { ChoreCard } from "@/components/chores/ChoreCard";
import { ZadanieCard } from "@/components/chores/ZadanieCard";
import {
  sortTasksByImportance,
  sortTasksForPanicGuests,
} from "@/lib/choreSort";
import { resolveImportance } from "@/lib/choreImportance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chores")({
  head: () => ({
    meta: [
      { title: "Obowiązki · Homebase" },
      {
        name: "description",
        content:
          "Obowiązki domowe z elastycznymi odstępami — w normie, warto zrobić, pilne.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <ChoresPage />
    </Shell>
  ),
});

const STATUS_KEYS = ["must", "suggested", "safe", "done"] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

const STATUS_LABELS: Record<StatusKey, string> = {
  must: "Pilne dziś",
  suggested: "Warto zrobić",
  safe: "W normie",
  done: "Niedawno zrobione",
};

function ChoresPage() {
  const {
    visibleTasks,
    visibleZadania,
    statusOf,
    guestsMode,
    guestCalendarHint,
    panic,
    users,
  } = useApp();
  const { household, floorPlan, isAdmin } = useHousehold();

  const heavyDayNames = users.filter((u) => u.heavyDay).map((u) => u.name);
  const ranked = Boolean(panic?.active || guestsMode);
  const hasMap = Boolean(floorPlan);

  const sortedGuestTasks = sortTasksByImportance(visibleTasks, statusOf, true);
  const sortedPanicTasks = sortTasksForPanicGuests(visibleTasks, statusOf);
  const sortedZadania = [...visibleZadania].sort(
    (a, b) => resolveImportance(b) - resolveImportance(a),
  );

  const groups = STATUS_KEYS.map((key) => ({
    key,
    label: STATUS_LABELS[key],
    tasks: visibleTasks.filter((t) => statusOf(t) === key),
    zadania: visibleZadania.filter((z) => statusOf(z) === key),
  }));

  // Obok mapy kolumna jest węższa — mniej kart w rzędzie
  const gridClass = hasMap
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2"
    : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

  const empty = visibleTasks.length === 0 && visibleZadania.length === 0;

  const lists = empty ? (
    <EmptyPanel
      title="Brak obowiązków i zadań"
      description="Dodaj obowiązek lub zadanie przyciskiem powyżej."
    />
  ) : (
    <div className="space-y-10">
      {visibleTasks.length > 0 && (
        <section className="space-y-6">
          <SectionTitle>Obowiązki</SectionTitle>
          {ranked ? (
            <div className={gridClass}>
              {(panic?.active ? sortedPanicTasks : sortedGuestTasks).map(
                (task, i) => (
                  <ChoreCard key={task.id} task={task} rank={i + 1} />
                ),
              )}
            </div>
          ) : (
            groups.map((g) =>
              g.tasks.length === 0 ? null : (
                <div key={g.key} id={`chores-${g.key}`} className="scroll-mt-6">
                  <GroupTitle label={g.label} count={g.tasks.length} />
                  <div className={gridClass}>
                    {g.tasks.map((task) => (
                      <ChoreCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </section>
      )}

      {visibleZadania.length > 0 && (
        <section className="space-y-6">
          <SectionTitle>Zadania</SectionTitle>
          {ranked ? (
            <div className={gridClass}>
              {sortedZadania.map((zadanie, i) => (
                <ZadanieCard key={zadanie.id} zadanie={zadanie} rank={i + 1} />
              ))}
            </div>
          ) : (
            groups.map((g) =>
              g.zadania.length === 0 ? null : (
                <div
                  key={g.key}
                  id={g.tasks.length === 0 ? `chores-${g.key}` : undefined}
                  className="scroll-mt-6"
                >
                  <GroupTitle label={g.label} count={g.zadania.length} />
                  <div className={gridClass}>
                    {g.zadania.map((zadanie) => (
                      <ZadanieCard key={zadanie.id} zadanie={zadanie} />
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </section>
      )}
    </div>
  );

  const summary =
    !empty && !ranked ? (
      <StatusSummary
        counts={groups.map((g) => ({
          key: g.key,
          count: g.tasks.length + g.zadania.length,
        }))}
      />
    ) : null;

  const header = (
    <header
      className={cn(
        "flex flex-col gap-4",
        hasMap
          ? "lg:col-start-1 lg:row-start-1"
          : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Obowiązki
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Termin liczy się od ostatniego wykonania.
          {heavyDayNames.length > 0 &&
            ` · Heavy Day: ${heavyDayNames.join(", ")}`}
          {panic?.active && " · PANIC_GOSCIE"}
        </p>
        {guestsMode && (
          <p className="mt-2 flex items-center gap-2 text-sm text-primary">
            <Users className="size-4 shrink-0" />
            Tryb gości aktywny
            {guestCalendarHint ? ` · ${guestCalendarHint}` : ""}
          </p>
        )}
      </div>
      <div
        className={cn(
          "flex flex-wrap gap-2",
          !hasMap && "md:shrink-0 md:justify-end",
        )}
      >
        {isAdmin && <ExportChoresButton />}
        <AddZadanieDialog />
        <AddChoreDialog />
      </div>
    </header>
  );

  if (hasMap) {
    // Telefon: nagłówek, liczniki, zwinięty plan, lista.
    // Komputer: lewa kolumna nagłówek + lista, prawa — plan i liczniki
    // przyklejone przy przewijaniu (liczniki zastępują legendę kolorów).
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8">
        {header}
        {/* Od laptopa: stała wysokość ekranu — panel aktywności wypełnia
            miejsce pod planem, ile go zostanie */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100dvh-3rem)] lg:self-start">
          <div className="shrink-0">
            <MapPanel>
              <ApartmentMap
                tasks={visibleTasks}
                statusOf={statusOf}
                users={users}
                fitViewport
                showLegend={!summary}
              />
            </MapPanel>
          </div>
          {summary && (
            <div className="order-first shrink-0 lg:order-none">{summary}</div>
          )}
          <ActivityPanel className="hidden min-h-0 flex-1 lg:flex" />
        </aside>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">{lists}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {header}
      {summary}
      {lists}
      {household && (
        <section className="space-y-3 rounded-3xl border border-dashed border-border bg-surface/50 p-5">
          <p className="text-sm text-muted-foreground">
            To mieszkanie nie ma planu, więc mapa jest ukryta. Skopiuj prompt i
            wygeneruj plan w stylu mieszkania testowego
            {isAdmin ? ", potem go wgraj." : " — wgra go administrator."}
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyFloorPlanPromptButton householdName={household.name} />
            {isAdmin && <FloorPlanUploadButton />}
          </div>
        </section>
      )}
    </div>
  );
}

const SUMMARY_STYLES: Record<
  StatusKey,
  { label: string; dot: string; hover: string }
> = {
  must: { label: "Pilne", dot: "bg-alert", hover: "hover:border-alert/50" },
  suggested: {
    label: "Warto zrobić",
    dot: "bg-warn",
    hover: "hover:border-warn/50",
  },
  safe: { label: "W normie", dot: "bg-safe", hover: "hover:border-safe/50" },
  done: {
    label: "Zrobione",
    dot: "bg-muted-foreground/50",
    hover: "hover:border-muted-foreground/40",
  },
};

/** Liczniki statusów — od razu widać, ile jest do zrobienia; klik przewija */
function StatusSummary({
  counts,
}: {
  counts: { key: StatusKey; count: number }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {counts.map(({ key, count }) => {
        const style = SUMMARY_STYLES[key];
        return (
          <button
            key={key}
            type="button"
            disabled={count === 0}
            onClick={() =>
              document
                .getElementById(`chores-${key}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors disabled:cursor-default disabled:opacity-45",
              count > 0 && style.hover,
            )}
          >
            <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} />
            <span className="min-w-0">
              <span className="block text-2xl font-light leading-none tabular-nums">
                {count}
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                {style.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const MAP_OPEN_KEY = "homeharmony-chores-map-open";

/**
 * Od laptopa wzwyż plan stoi obok listy (przyklejony przy przewijaniu).
 * Na tablecie i telefonie jest zwijany — domyślnie zwinięty, żeby lista
 * była od razu na ekranie; wybór pamiętamy w przeglądarce.
 */
function MapPanel({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(MAP_OPEN_KEY) === "1");
    } catch {
      // brak localStorage — zostaje zwinięty
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(MAP_OPEN_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-elevated lg:hidden",
          open && "mb-3",
        )}
      >
        <MapIcon className="size-4 text-primary" />
        <span className="flex-1 text-sm font-medium">Plan mieszkania</span>
        <span className="text-xs text-muted-foreground">
          {open ? "Zwiń" : "Pokaż"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div className={cn(open ? "block" : "hidden", "lg:block")}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}

function GroupTitle({ label, count }: { label: string; count: number }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {label} · {count}
    </h3>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
