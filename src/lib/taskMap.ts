import type { Task, TaskMapShape } from "@/types";
import { resolveMapLineWidth } from "@/config/mapLine";

export const TASK_MAP_SHAPE_LABELS: Record<TaskMapShape, string> = {
  pin: "Pinezka",
  line: "Linia",
  area: "Obszar",
  zone: "Cała strefa / pokój",
};

/** Pola geometrii mapy wspólne dla obowiązku i zadania */
type MapFields = Pick<
  Task,
  "mapShape" | "mapPins" | "mapLine" | "mapLineWidth" | "mapArea" | "zoneId"
>;

export function normalizeTaskMap<T extends MapFields>(task: T): T {
  const mapShape: TaskMapShape =
    task.mapShape ??
    (task.mapLine && task.mapLine.length >= 2
      ? "line"
      : task.mapArea && task.mapArea.length >= 3
        ? "area"
        : task.zoneId && !task.mapPins?.length
          ? "zone"
          : "pin");

  return {
    ...task,
    mapShape,
    mapPins: mapShape === "pin" ? task.mapPins : undefined,
    mapLine: mapShape === "line" ? task.mapLine : undefined,
    mapLineWidth:
      mapShape === "line" ? resolveMapLineWidth(task.mapLineWidth) : undefined,
    mapArea: mapShape === "area" ? task.mapArea : undefined,
    zoneId: mapShape === "zone" ? task.zoneId : task.zoneId,
  };
}
