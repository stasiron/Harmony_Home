import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterChip } from "@/components/FilterChip";
import { Shell } from "@/components/Shell";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import { subscribeCompletions } from "@/lib/completions";
import { statsByPerson } from "@/lib/stats";
import { useReportTab } from "@/lib/reportContext";
import { cn } from "@/lib/utils";
import type { Completion } from "@/types";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statystyki · Homebase" },
      {
        name: "description",
        content: "Kto ile zrobił — z wagami obowiązków i nieobecnościami.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <StatsPage />
    </Shell>
  ),
});

type Period = "week" | "month" | "quarter";
const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "week", label: "Tydzień", days: 7 },
  { id: "month", label: "Miesiąc", days: 30 },
  { id: "quarter", label: "3 miesiące", days: 91 },
];

// Kolory domowników — więcej niż 5 osób też ma swoje
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-safe)",
];

function StatsPage() {
  const { users, absences } = useApp();
  const { householdId, stats: access, myProfileId } = useHousehold();
  const onlyBy = access === "own" ? myProfileId : undefined;
  const [period, setPeriod] = useState<Period>("month");
  const [completions, setCompletions] = useState<Completion[] | null>(null);
  useReportTab(`Statystyki: ${period}`);

  const days = PERIODS.find((p) => p.id === period)!.days;
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86_400_000);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }, [days]);

  // Czytamy tylko wybrany okres — historia rośnie z każdym odhaczeniem
  useEffect(() => {
    setCompletions(null);
    if (!householdId || access === "none") return;
    if (access === "own" && !onlyBy) {
      setCompletions([]);
      return;
    }
    const unsubscribe = subscribeCompletions(
      householdId,
      range.from.toISOString(),
      setCompletions,
      (err) => {
        console.error("Completions sync failed:", err);
        setCompletions([]);
      },
      onlyBy ?? undefined,
    );
    return () => unsubscribe?.();
  }, [householdId, range.from, access, onlyBy]);

  const stats = useMemo(() => {
    const all = statsByPerson(
      completions ?? [],
      users,
      absences,
      range.from,
      range.to,
    );
    // „Każdy swoje” — tylko własna karta
    return access === "own"
      ? { ...all, people: all.people.filter((p) => p.id === myProfileId) }
      : all;
  }, [completions, users, absences, range, access, myProfileId]);
  const recent = (completions ?? []).slice(0, 12);
  const nameOf = (id: string | null) =>
    users.find((u) => u.id === id)?.name ?? "nie wiadomo kto";

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
          <BarChart3 className="size-8 text-primary" strokeWidth={1.6} />
          Statystyki
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kto ile zrobił. Punkty to waga obowiązku (czas × trudność), a
          sprawiedliwa część uwzględnia wyjazdy.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <FilterChip
            key={p.id}
            active={period === p.id}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </FilterChip>
        ))}
      </div>

      {access === "own" && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          {myProfileId
            ? "W tym mieszkaniu każdy widzi tylko swoje statystyki."
            : "Widzisz tylko swoje statystyki — wybierz, kim jesteś, w Ustawieniach → Konto („Kim jesteś”)."}
        </p>
      )}

      {completions === null ? (
        <p className="text-sm text-muted-foreground">Wczytuję…</p>
      ) : completions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Jeszcze nic do pokazania</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Historia zbiera się od teraz — każde odhaczenie obowiązku trafia do
            statystyk.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.people.map((p, idx) => (
              <div
                key={p.id}
                className="space-y-3 rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: COLORS[idx % COLORS.length] }}
                  />
                  <span className="font-semibold">{p.name}</span>
                  {p.daysPresent < days && (
                    <span className="text-xs text-muted-foreground">
                      obecny {p.daysPresent}/{days} dni
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Punkty" value={p.points} />
                  <Stat label="Zrobione" value={p.count} />
                  <Stat label="Minuty" value={p.minutes} />
                </div>
                {p.fairShare !== null && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sprawiedliwa część</span>
                      <span
                        className={cn(
                          "font-medium",
                          p.fairShare >= 90
                            ? "text-safe"
                            : p.fairShare >= 60
                              ? "text-warn"
                              : "text-alert",
                        )}
                      >
                        {p.fairShare}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.fairShare >= 90
                            ? "bg-safe"
                            : p.fairShare >= 60
                              ? "bg-warn"
                              : "bg-alert",
                        )}
                        style={{ width: `${Math.min(100, p.fairShare)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {stats.unassigned > 0 && (
            <p className="text-xs text-muted-foreground">
              {stats.unassigned} odhaczeń bez wskazanej osoby (np. z tabletu
              przy obowiązku kilku osób) — nie liczą się nikomu.
            </p>
          )}

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Punkty w okresie
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.people}>
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
                    formatter={(value) => [value, "Punkty"]}
                  />
                  <Bar dataKey="points" radius={[8, 8, 0, 0]}>
                    {stats.people.map((p, idx) => (
                      <Cell key={p.id} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Ostatnio zrobione
            </h2>
            <ul className="divide-y divide-border text-sm">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-muted-foreground">{nameOf(c.by)}</span>
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {new Date(c.at).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
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
