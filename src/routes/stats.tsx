import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats · Homebase" },
      { name: "description", content: "Household chores analytics." },
    ],
  }),
  component: () => (
    <Shell>
      <StatsPage />
    </Shell>
  ),
});

function StatsPage() {
  const { users, tasks, daysSince } = useApp();

  const hasData = users.length > 0 && tasks.length > 0;

  const data = users.map((u, idx) => {
    const userTasks = tasks.filter((t) => t.assignedTo === u.id);
    const completedThisWeek = userTasks.filter(
      (t) => daysSince(t.lastCompleted) <= 7,
    ).length;
    const minutes = userTasks
      .filter((t) => daysSince(t.lastCompleted) <= 7)
      .reduce((acc, t) => acc + t.estimatedMinutes, 0);
    const completion =
      userTasks.length === 0
        ? 0
        : Math.round((completedThisWeek / userTasks.length) * 100);
    return {
      name: u.name,
      Completed: completedThisWeek,
      Minutes: minutes,
      Completion: completion,
      fill: `var(--chart-${idx + 1})`,
    };
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Household stats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A weekly look at who's pulling weight.
        </p>
      </header>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No stats yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Analytics appear once household members and chores are set up.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {data.map((d) => (
              <div
                key={d.name}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {d.name}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <Stat label="Done" value={d.Completed} />
                  <Stat label="Min" value={d.Minutes} />
                  <Stat label="%" value={d.Completion} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Minutes spent this week
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="Minutes"
                    radius={[8, 8, 0, 0]}
                    fill="var(--color-primary)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="tabular-clock text-2xl font-light">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
