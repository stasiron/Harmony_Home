import { formatDistanceToNowStrict } from "date-fns";
import { pl } from "date-fns/locale";
import { CheckCircle2, History, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { effectiveAssignees } from "@/lib/rotation";
import { cn } from "@/lib/utils";

const RECENT_DAYS = 14;

/**
 * Pod planem (komputer): kto ile ma do zrobienia i co ostatnio zrobiono.
 * Rozciąga się do dołu ekranu — lista przewija się w środku.
 */
export function ActivityPanel({ className }: { className?: string }) {
  const { visibleTasks, visibleZadania, statusOf, users } = useApp();
  const [tab, setTab] = useState<"people" | "recent">("people");

  const people = useMemo(() => {
    const pending = visibleTasks.filter((t) => {
      const s = statusOf(t);
      return s === "must" || s === "suggested";
    });
    return users
      .filter((u) => u.active !== false)
      .map((u) => {
        const mine = pending.filter((t) =>
          effectiveAssignees(t).includes(u.id),
        );
        return {
          user: u,
          must: mine.filter((t) => statusOf(t) === "must").length,
          suggested: mine.filter((t) => statusOf(t) === "suggested").length,
        };
      })
      .sort((a, b) => b.must - a.must || b.suggested - a.suggested);
  }, [visibleTasks, statusOf, users]);

  const unassigned = visibleTasks.filter((t) => {
    const s = statusOf(t);
    return (
      (s === "must" || s === "suggested") && effectiveAssignees(t).length === 0
    );
  }).length;

  const recent = useMemo(() => {
    const since = Date.now() - RECENT_DAYS * 86_400_000;
    return [...visibleTasks, ...visibleZadania]
      .filter((item) => {
        const t = new Date(item.lastCompleted).getTime();
        return Number.isFinite(t) && t >= since && t <= Date.now();
      })
      .sort(
        (a, b) =>
          new Date(b.lastCompleted).getTime() -
          new Date(a.lastCompleted).getTime(),
      )
      .slice(0, 25);
  }, [visibleTasks, visibleZadania]);

  const maxLoad = Math.max(1, ...people.map((p) => p.must + p.suggested));

  return (
    <section
      className={cn(
        "flex-col overflow-hidden rounded-3xl border border-border bg-surface",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-border p-1.5">
        <TabButton active={tab === "people"} onClick={() => setTab("people")}>
          <Users className="size-3.5" />
          Kto co ma
        </TabButton>
        <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
          <History className="size-3.5" />
          Ostatnio zrobione
        </TabButton>
      </div>

      <div className="hh-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "people" ? (
          <ul className="space-y-2">
            {people.map(({ user, must, suggested }) => (
              <li key={user.id} className="flex items-center gap-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold"
                  style={{ color: `var(--${user.color})` }}
                >
                  {user.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {must + suggested === 0
                        ? "nic nie czeka"
                        : `${must} pilne · ${suggested} warto`}
                    </span>
                  </div>
                  <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-alert"
                      style={{ width: `${(must / maxLoad) * 100}%` }}
                    />
                    <div
                      className="bg-warn"
                      style={{ width: `${(suggested / maxLoad) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
            {unassigned > 0 && (
              <li className="pt-1 text-xs text-muted-foreground">
                Bez przypisania: {unassigned}
              </li>
            )}
          </ul>
        ) : recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nic nie zrobiono w ostatnich {RECENT_DAYS} dniach.
          </p>
        ) : (
          <ul className="space-y-1">
            {recent.map((item) => {
              const byId =
                "lastCompletedBy" in item ? item.lastCompletedBy : undefined;
              const who = users.find((u) => u.id === byId);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-safe" />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {who && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {who.name}
                    </span>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(item.lastCompleted), {
                      locale: pl,
                      addSuffix: true,
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
