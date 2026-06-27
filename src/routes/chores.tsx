import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Shell } from "@/components/Shell";
import { AddChoreDialog } from "@/components/chores/AddChoreDialog";
import { ExportChoresButton } from "@/components/chores/ExportChoresButton";
import { ApartmentMap } from "@/components/chores/ApartmentMap";
import { ChoreCard } from "@/components/chores/ChoreCard";
import { sortTasksByImportance } from "@/lib/choreSort";

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
    statusOf,
    guestsMode,
    guestCalendarHint,
    panic,
    users,
  } = useApp();

  const heavyDayNames = users.filter((u) => u.heavyDay).map((u) => u.name);

  const sortedGuestTasks = sortTasksByImportance(visibleTasks, statusOf, true);

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

  return (
    <div className="space-y-8">
      <ApartmentMap tasks={visibleTasks} statusOf={statusOf} />

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Chores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dynamic intervals based on last completed.
            {heavyDayNames.length > 0 &&
              ` · Heavy Day: ${heavyDayNames.join(", ")}`}
            {panic?.active && " · Express blitz mode"}
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
          <AddChoreDialog />
        </div>
      </header>

      {visibleTasks.length === 0 ? (
        <EmptyPanel
          title="Brak obowiązków"
          description="Dodaj pierwszy obowiązek przyciskiem powyżej."
        />
      ) : guestsMode ? (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Goście — od najważniejszych · {sortedGuestTasks.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedGuestTasks.map((t) => (
              <ChoreCard key={t.id} task={t} />
            ))}
          </div>
        </section>
      ) : (
        groups.map((g) =>
          g.tasks.length === 0 ? null : (
            <section key={g.key}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {g.label} · {g.tasks.length}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.tasks.map((t) => (
                  <ChoreCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          ),
        )
      )}
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
