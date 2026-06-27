import { useMemo } from "react";
import type { Task, Status } from "@/types";
import { pinForRoom, roomLabel } from "@/config/rooms";
import { FLOOR_PLAN_SRC } from "@/components/chores/MapPinPicker";
import { cn } from "@/lib/utils";

const PIN_COLORS: Record<Status, string> = {
  must: "bg-alert border-alert/60 text-alert-foreground",
  suggested: "bg-warn border-warn/60 text-warn-foreground",
  safe: "bg-safe border-safe/60 text-safe-foreground",
  done: "bg-muted border-border text-muted-foreground",
};

type Pin = {
  key: string;
  task: Task;
  x: number;
  y: number;
  status: Status;
};

function resolvePins(tasks: Task[], statusOf: (task: Task) => Status): Pin[] {
  const byRoom = new Map<string, Task[]>();

  for (const task of tasks) {
    if (task.mapPins?.length) {
      continue;
    }
    const list = byRoom.get(task.room) ?? [];
    list.push(task);
    byRoom.set(task.room, list);
  }

  const result: Pin[] = [];

  for (const task of tasks) {
    if (task.mapPins?.length) {
      task.mapPins.forEach((pin, index) => {
        result.push({
          key: `${task.id}-pin-${index}`,
          task,
          x: pin.x,
          y: pin.y,
          status: statusOf(task),
        });
      });
    }
  }

  for (const [, roomTasks] of byRoom) {
    roomTasks.forEach((task, index) => {
      const pos = pinForRoom(task.room, index, roomTasks.length);
      result.push({
        key: task.id,
        task,
        x: pos.x,
        y: pos.y,
        status: statusOf(task),
      });
    });
  }

  return result;
}

export function ApartmentMap({
  tasks,
  statusOf,
}: {
  tasks: Task[];
  statusOf: (task: Task) => Status;
}) {
  const pins = useMemo(() => resolvePins(tasks, statusOf), [tasks, statusOf]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated">
      <div className="relative w-full">
        <img src={FLOOR_PLAN_SRC} alt="Plan mieszkania" className="block h-auto w-full" />
        <div className="absolute inset-0">
          {pins.map(({ key, task, x, y, status }) => (
            <div
              key={key}
              className="group absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`${task.name} · ${roomLabel(task.room)}`}
            >
              <div
                className={cn(
                  "grid size-8 place-items-center rounded-full border-2 text-[10px] font-bold shadow-lg transition-transform group-hover:scale-110",
                  PIN_COLORS[status],
                  status === "must" && "animate-pulse",
                )}
              >
                !
              </div>
              <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                {task.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
