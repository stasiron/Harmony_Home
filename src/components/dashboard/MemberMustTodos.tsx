import { Check, ListTodo } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { normalizeAssignedTo } from "@/lib/choreAssignees";
import { roomLabel } from "@/config/rooms";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

export function MemberMustTodos({ memberId }: { memberId: string }) {
  const { users, tasks, statusOf, completeTask, daysSince } = useApp();
  const member = users.find((u) => u.id === memberId);

  const memberTasks = useMemo(
    () =>
      tasks.filter((task) =>
        normalizeAssignedTo(task.assignedTo).includes(memberId),
      ),
    [tasks, memberId],
  );

  const mustTodos = useMemo(
    () => memberTasks.filter((task) => statusOf(task) === "must"),
    [memberTasks, statusOf],
  );

  const doneTasks = useMemo(
    () => memberTasks.filter((task) => statusOf(task) === "done"),
    [memberTasks, statusOf],
  );

  const todoCount = memberTasks.length - doneTasks.length;
  const doneCount = doneTasks.length;

  const latestDone = useMemo(() => {
    if (doneTasks.length === 0) return null;
    return doneTasks.reduce<Task | null>((best, task) => {
      if (!best) return task;
      return new Date(task.lastCompleted).getTime() >
        new Date(best.lastCompleted).getTime()
        ? task
        : best;
    }, null);
  }, [doneTasks]);

  if (!member) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Twoje obowiązki · {member.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mustTodos.length === 0
              ? "Nic pilnego — możesz oddychać."
              : `${mustTodos.length} obowiązkowych do zrobienia`}
          </p>
        </div>
        <Link
          to="/chores"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Wszystkie chores
        </Link>
      </div>

      <table className="w-full max-w-xs overflow-hidden rounded-xl border border-border text-sm">
        <tbody>
          <tr className="border-b border-border bg-surface/60">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Zrobione
            </th>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-safe">
              {doneCount}
            </td>
          </tr>
          <tr className="bg-surface/40">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
              Do zrobienia
            </th>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-alert">
              {todoCount}
            </td>
          </tr>
        </tbody>
      </table>

      {mustTodos.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-4">
          <div className="grid size-10 place-items-center rounded-xl bg-safe/15 text-safe">
            <Check className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Brak must-do</div>
            <div className="text-xs text-muted-foreground">
              Wszystkie obowiązki {member.name} są na bieżąco.
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {mustTodos.map((task) => (
            <li
              key={task.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-alert/40 bg-alert/10 px-4 py-3 alert-glow",
              )}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-alert/20 text-alert">
                <ListTodo className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{task.name}</div>
                <div className="text-xs text-muted-foreground">
                  {roomLabel(task.room)} · {daysSince(task.lastCompleted)}d temu
                  · {task.estimatedMinutes} min
                </div>
              </div>
              <button
                type="button"
                onClick={() => completeTask(task.id)}
                className="shrink-0 rounded-xl border border-alert/30 bg-background/60 px-3 py-1.5 text-xs font-semibold text-alert transition-colors hover:bg-alert/15"
              >
                Zrobione
              </button>
            </li>
          ))}
        </ul>
      )}

      {latestDone ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Ostatnio zrobione
          </h3>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/50 px-4 py-3 opacity-80">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-safe/15 text-safe">
              <Check className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{latestDone.name}</div>
              <div className="text-xs text-muted-foreground">
                {roomLabel(latestDone.room)} ·{" "}
                {daysSince(latestDone.lastCompleted) === 0
                  ? "dziś"
                  : `${daysSince(latestDone.lastCompleted)}d temu`}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
