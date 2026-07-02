import { useState } from "react";
import { Check, Clock } from "lucide-react";
import type { User, Zadanie } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { roomLabel } from "@/config/rooms";
import { useApp } from "@/context/AppContext";
import { pickDefaultCompleter } from "@/lib/choreAssignees";
import { IMPORTANCE_LABELS, resolveImportance } from "@/lib/choreImportance";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  safe: "border-safe/30 bg-safe/5",
  suggested: "border-warn/40 bg-warn/10",
  must: "border-alert/40 bg-alert/10 alert-glow",
  done: "border-border bg-surface opacity-60",
};

const statusLabel: Record<string, string> = {
  safe: "On track",
  suggested: "Suggested",
  must: "Must do",
  done: "Done",
};

export function ZadanieCard({
  zadanie,
  rank,
  compact,
  assigneeOptions,
}: {
  zadanie: Zadanie;
  rank?: number;
  compact?: boolean;
  /** Domownicy z obowiązku — wybór kto wykonał */
  assigneeOptions?: User[];
}) {
  const { memberId } = useAuth();
  const { statusOf, daysSince, completeZadanie, panic, guestsMode } = useApp();
  const [pickCompleter, setPickCompleter] = useState(false);
  const status = statusOf(zadanie);
  const d = daysSince(zadanie.lastCompleted);
  const importance = resolveImportance(zadanie);
  const showImportance = panic?.active || guestsMode;
  const assignees = assigneeOptions ?? [];

  const finish = (completedBy?: string) => {
    completeZadanie(zadanie.id, completedBy);
    setPickCompleter(false);
  };

  const handleComplete = () => {
    const defaultId = pickDefaultCompleter(
      assignees.map((u) => u.id),
      memberId,
    );
    if (assignees.length > 1 && !defaultId) {
      setPickCompleter(true);
      return;
    }
    finish(defaultId);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border transition-all",
        compact ? "p-3" : "p-5",
        statusStyles[status],
      )}
    >
      <div className="min-w-0">
        <div
          className={cn(
            "truncate font-semibold",
            compact ? "text-sm" : "text-base md:text-lg",
          )}
        >
          {zadanie.name}
        </div>
        {zadanie.description && (
          <p
            className={cn(
              "mt-1 text-muted-foreground",
              compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm",
            )}
          >
            {zadanie.description}
          </p>
        )}
        {!compact && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {zadanie.estimatedMinutes} min
            </span>
            <span>Last: {d}d ago</span>
            <span>{roomLabel(zadanie.room)}</span>
            <span>
              próg {zadanie.tMin}d · krytyczne {zadanie.tMax}d
            </span>
          </div>
        )}
      </div>

      {pickCompleter && assignees.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kto zrobił?
          </span>
          {assignees.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => finish(user.id)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
            >
              {user.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {rank != null && showImportance && (
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-bold tabular-nums">
              {rank}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              status === "must" && "bg-alert/20 text-alert",
              status === "suggested" && "bg-warn/20 text-warn",
              status === "safe" && "bg-safe/20 text-safe",
              status === "done" && "bg-muted text-muted-foreground",
            )}
          >
            {statusLabel[status]}
          </span>
          {showImportance && !compact && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                importance >= 5 && "bg-alert/20 text-alert",
                importance === 4 && "bg-warn/20 text-warn",
                importance <= 3 && "bg-muted text-muted-foreground",
              )}
            >
              {importance} · {IMPORTANCE_LABELS[importance]}
            </span>
          )}
        </div>
        <button
          onClick={handleComplete}
          className="flex size-9 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Oznacz zadanie jako zrobione"
        >
          <Check className="size-4" />
        </button>
      </div>
    </div>
  );
}
