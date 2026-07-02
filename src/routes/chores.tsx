import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { Shell } from "@/components/Shell";
import { AddChoreDialog } from "@/components/chores/AddChoreDialog";
import { AddZadanieDialog } from "@/components/chores/AddZadanieDialog";
import { ExportChoresButton } from "@/components/chores/ExportChoresButton";
import { ApartmentMap } from "@/components/chores/ApartmentMap";
import { ChoreCard } from "@/components/chores/ChoreCard";
import { ZadanieCard } from "@/components/chores/ZadanieCard";
import { sortTasksByImportance, sortTasksForPanicGuests } from "@/lib/choreSort";
import { resolveImportance } from "@/lib/choreImportance";

export const Route = createFileRoute("/chores")({
  head: () => ({
    meta: [
      { title: "Chores · Homebase" },
      {
        name: "description",
        content: "Flexible chore intervals — safe, suggested, must-do.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <ChoresPage />
    </Shell>
  ),
});

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

  const heavyDayNames = users.filter((u) => u.heavyDay).map((u) => u.name);

  const sortedGuestTasks = sortTasksByImportance(visibleTasks, statusOf, true);
  const sortedPanicTasks = sortTasksForPanicGuests(visibleTasks, statusOf);
  const sortedZadania = [...visibleZadania].sort(
    (a, b) => resolveImportance(b) - resolveImportance(a),
  );

  const groups = [
    {
      key: "must",
      label: "Must do today",
      tasks: visibleTasks.filter((t) => statusOf(t) === "must"),
    },
    {
      key: "suggested",
      label: "Suggested",
      tasks: visibleTasks.filter((t) => statusOf(t) === "suggested"),
    },
    {
      key: "safe",
      label: "On track",
      tasks: visibleTasks.filter((t) => statusOf(t) === "safe"),
    },
    {
      key: "done",
      label: "Recently done",
      tasks: visibleTasks.filter((t) => statusOf(t) === "done"),
    },
  ];

  const zadaniaGroups = [
    {
      key: "must",
      label: "Must do today",
      items: visibleZadania.filter((z) => statusOf(z) === "must"),
    },
    {
      key: "suggested",
      label: "Suggested",
      items: visibleZadania.filter((z) => statusOf(z) === "suggested"),
    },
    {
      key: "safe",
      label: "On track",
      items: visibleZadania.filter((z) => statusOf(z) === "safe"),
    },
    {
      key: "done",
      label: "Recently done",
      items: visibleZadania.filter((z) => statusOf(z) === "done"),
    },
  ];

  return (
    <div className="space-y-8">
      <ApartmentMap tasks={visibleTasks} statusOf={statusOf} users={users} />

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Chores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dynamic intervals based on last completed.
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
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <ExportChoresButton />
          <AddZadanieDialog />
          <AddChoreDialog />
        </div>
      </header>

      {visibleTasks.length === 0 && visibleZadania.length === 0 ? (
        <EmptyPanel
          title="Brak obowiązków i zadań"
          description="Dodaj obowiązek lub zadanie przyciskiem powyżej."
        />
      ) : (
        <>
          {visibleTasks.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Obowiązki
              </h2>
              {panic?.active ? (
                <TaskGrid
                  tasks={sortedPanicTasks}
                  showRank
                  render={(task, rank) => (
                    <ChoreCard key={task.id} task={task} rank={rank} />
                  )}
                />
              ) : guestsMode ? (
                <TaskGrid
                  tasks={sortedGuestTasks}
                  showRank
                  render={(task, rank) => (
                    <ChoreCard key={task.id} task={task} rank={rank} />
                  )}
                />
              ) : (
                groups.map((g) =>
                  g.tasks.length === 0 ? null : (
                    <div key={g.key}>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {g.label} · {g.tasks.length}
                      </h3>
                      <TaskGrid
                        tasks={g.tasks}
                        render={(task) => <ChoreCard key={task.id} task={task} />}
                      />
                    </div>
                  ),
                )
              )}
            </section>
          )}

          {visibleZadania.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Zadania
              </h2>
              {panic?.active || guestsMode ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedZadania.map((zadanie, i) => (
                    <ZadanieCard
                      key={zadanie.id}
                      zadanie={zadanie}
                      rank={panic?.active || guestsMode ? i + 1 : undefined}
                    />
                  ))}
                </div>
              ) : (
                zadaniaGroups.map((g) =>
                  g.items.length === 0 ? null : (
                    <div key={g.key}>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {g.label} · {g.items.length}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {g.items.map((zadanie) => (
                          <ZadanieCard key={zadanie.id} zadanie={zadanie} />
                        ))}
                      </div>
                    </div>
                  ),
                )
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TaskGrid<T extends { id: string }>({
  tasks,
  render,
  showRank,
}: {
  tasks: T[];
  render: (task: T, rank?: number) => ReactNode;
  showRank?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task, i) => render(task, showRank ? i + 1 : undefined))}
    </div>
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
