import { Check, Clock } from "lucide-react";
import type { Task } from "@/types";
import { roomLabel } from "@/config/rooms";
import { useApp } from "@/context/AppContext";
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

export function ChoreCard({ task }: { task: Task }) {
  const { users, statusOf, daysSince, completeTask } = useApp();
  const user = users.find((u) => u.id === task.assignedTo);
  const status = statusOf(task);
  const d = daysSince(task.lastCompleted);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5 transition-all",
        statusStyles[status],
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold md:text-lg">{task.name}</div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3" /> {task.estimatedMinutes} min</span>
            <span>Last: {d}d ago</span>
            <span>{roomLabel(task.room)}</span>
          </div>
        </div>
        {user && (
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
              "bg-background/40 text-foreground",
            )}
            style={{ color: `var(--${user.color})` }}
            title={user.name}
          >
            {user.avatar}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
