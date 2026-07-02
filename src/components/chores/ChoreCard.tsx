import { Check, Clock, ListChecks, Repeat } from "lucide-react";
import type { Task } from "@/types";
import { roomLabel } from "@/config/rooms";
import { useApp } from "@/context/AppContext";
import { ZadanieCard } from "@/components/chores/ZadanieCard";
import { formatScheduleLabel } from "@/lib/choreRecurrence";
import { IMPORTANCE_LABELS, resolveImportance } from "@/lib/choreImportance";
import {
  choreCompletionByAssignee,
  normalizeAssignedTo,
} from "@/lib/choreAssignees";
import { resolveLinkedZadania } from "@/lib/zadania";
import { summarizeLinkedZadania } from "@/lib/choreZadaniaStatus";
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

export function ChoreCard({ task, rank }: { task: Task; rank?: number }) {
  const { users, zadania, statusOf, daysSince, completeTask, panic, guestsMode } =
    useApp();
  const assignees = normalizeAssignedTo(task.assignedTo)
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => u !== undefined);
  const status = statusOf(task);
  const d = daysSince(task.lastCompleted);
  const importance = resolveImportance(task);
  const showImportance = panic?.active || guestsMode;
  const linked = resolveLinkedZadania(task.linkedZadanieIds, zadania);
  const linkedSummary =
    linked.length > 0
      ? summarizeLinkedZadania(linked, (z) => statusOf(z))
      : null;
  const completion = choreCompletionByAssignee(task, linked, (z) => statusOf(z));

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 transition-all",
        statusStyles[status],
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold md:text-lg">
            {task.name}
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {task.estimatedMinutes} min
            </span>
            <span>Last: {d}d ago</span>
            <span>{roomLabel(task.room)}</span>
            {linkedSummary && (
              <span className="flex items-center gap-1">
                <ListChecks className="size-3" />
                {linkedSummary.pendingCount}/{linked.length} zadań
                {linkedSummary.criticalCount > 0 &&
                  ` · ${linkedSummary.criticalCount} kryt.`}
              </span>
            )}
            {task.recurrence === "recurring" && task.schedule && (
              <span className="flex items-center gap-1">
                <Repeat className="size-3" />
                {formatScheduleLabel(task.schedule)}
              </span>
            )}
          </div>
        </div>
        {assignees.length > 0 && (
          <div className="flex shrink-0 -space-x-2">
            {assignees.map((user) => (
              <div
                key={user.id}
                className="grid size-9 place-items-center rounded-full border-2 border-background bg-background/40 text-xs font-semibold"
                style={{ color: `var(--${user.color})` }}
                title={user.name}
              >
                {user.avatar}
              </div>
            ))}
          </div>
        )}
      </div>

      {completion.length > 0 && (
        <div className="space-y-1.5 border-t border-border/50 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Wykonanie wg wagi zadań
          </p>
          <div className="space-y-1.5">
            {completion.map(({ userId, percent }) => {
              const user = users.find((u) => u.id === userId);
              if (!user) return null;
              return (
                <div key={userId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{user.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {percent}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {linked.length > 0 && (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Przypięte zadania
          </p>
          <div className="space-y-2">
            {linked.map((zadanie) => (
              <ZadanieCard
                key={zadanie.id}
                zadanie={zadanie}
                compact
                assigneeOptions={assignees}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          {showImportance && (
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
          {task.recurrence === "once" && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Jednorazowe
            </span>
          )}
        </div>
        <button
          onClick={() => completeTask(task.id)}
          className="flex size-9 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label="Mark done"
        >
          <Check className="size-4" />
        </button>
      </div>
    </div>
  );
}
