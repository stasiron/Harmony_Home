import type { MouseEvent } from "react";
import type { HomeZone, MapPoint, Status, Task } from "@/types";
import type { MapDisplayMode, MapVisualStatus } from "@/lib/mapPinStyles";
import { importanceToMapStatus } from "@/lib/mapPinStyles";
import { normalizeAssignedTo } from "@/lib/choreAssignees";
import { resolveImportance } from "@/lib/choreImportance";
import { resolveMapLineWidth } from "@/config/mapLine";
import { normalizeTaskMap } from "@/lib/taskMap";
import {
  polygonsForZone,
  tasksInZoneTree,
  zoneById,
} from "@/lib/zoneTree";

export type MapGeometryLayer = "pins" | "lines" | "areas" | "zones";

export const MAP_LAYER_LABELS: Record<MapGeometryLayer, string> = {
  pins: "Pinezki",
  lines: "Linie",
  areas: "Obszary",
  zones: "Strefy",
};

export const MAP_LAYERS_STORAGE_KEY = "homeharmony-map-layers";
export const DEFAULT_MAP_LAYERS: MapGeometryLayer[] = ["pins", "zones"];

const STATUS_PRIORITY: Record<MapVisualStatus, number> = {
  must: 4,
  suggested: 3,
  safe: 2,
  done: 1,
};

export type MapPinRenderable = {
  kind: "pin";
  key: string;
  task: Task;
  x: number;
  y: number;
  visualStatus: MapVisualStatus;
  initial: string;
  lineFrom: MapPoint;
};

export type MapLineRenderable = {
  kind: "line";
  key: string;
  task: Task;
  points: MapPoint[];
  visualStatus: MapVisualStatus;
  strokeWidth: number;
};

export type MapAreaRenderable = {
  kind: "area";
  key: string;
  task: Task;
  polygon: MapPoint[];
  visualStatus: MapVisualStatus;
};

export type MapZoneFillRenderable = {
  kind: "zone-fill";
  key: string;
  task?: Task;
  zoneId: string;
  zoneName: string;
  polygon: MapPoint[];
  visualStatus: MapVisualStatus;
};

export type MapRenderable =
  | MapPinRenderable
  | MapLineRenderable
  | MapAreaRenderable
  | MapZoneFillRenderable;

export function clickToMapPercent(
  e: MouseEvent<HTMLElement>,
  container: HTMLElement,
): MapPoint {
  const rect = container.getBoundingClientRect();
  return {
    x: Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10,
    y: Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10,
  };
}

export function polygonToPointsAttr(polygon: MapPoint[]): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(" ");
}

export function polygonCentroid(polygon: MapPoint[]): MapPoint {
  if (polygon.length === 0) return { x: 50, y: 50 };
  const sum = polygon.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return {
    x: Math.round((sum.x / polygon.length) * 10) / 10,
    y: Math.round((sum.y / polygon.length) * 10) / 10,
  };
}

export function visualStatusForTask(
  task: Task,
  statusOf: (task: Task) => Status,
  colorMode: MapDisplayMode,
): MapVisualStatus {
  if (colorMode === "panic") {
    return importanceToMapStatus(resolveImportance(task));
  }
  return statusOf(task);
}

export function worstVisualStatus(
  statuses: MapVisualStatus[],
): MapVisualStatus {
  return statuses.reduce<MapVisualStatus>(
    (worst, current) =>
      STATUS_PRIORITY[current] > STATUS_PRIORITY[worst] ? current : worst,
    "done",
  );
}

export function homeZoneVisualStatus(
  zone: HomeZone,
  tasks: Task[],
  zones: HomeZone[],
  statusOf: (task: Task) => Status,
  colorMode: MapDisplayMode,
): MapVisualStatus {
  const relevant = tasksInZoneTree(zone.id, tasks, zones);
  if (relevant.length === 0) return "done";
  return worstVisualStatus(
    relevant.map((t) => visualStatusForTask(t, statusOf, colorMode)),
  );
}

export function loadMapLayers(): MapGeometryLayer[] {
  if (typeof window === "undefined") return DEFAULT_MAP_LAYERS;
  try {
    const raw = localStorage.getItem(MAP_LAYERS_STORAGE_KEY);
    if (!raw) return DEFAULT_MAP_LAYERS;
    const parsed = JSON.parse(raw) as MapGeometryLayer[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_MAP_LAYERS;
  } catch {
    return DEFAULT_MAP_LAYERS;
  }
}

export function saveMapLayers(layers: MapGeometryLayer[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MAP_LAYERS_STORAGE_KEY, JSON.stringify(layers));
}

function lineOriginForTask(
  task: Task,
  point: MapPoint,
  zones: HomeZone[],
): MapPoint {
  if (task.zoneId) {
    const polys = polygonsForZone(task.zoneId, zones);
    if (polys[0]) return polygonCentroid(polys[0].polygon);
  }
  const space = zones.find(
    (z) => z.kind === "space" && z.room === task.room && z.polygon,
  );
  if (space?.polygon) return polygonCentroid(space.polygon);
  return { x: point.x, y: 100 };
}

export function resolveMapRenderables(
  tasks: Task[],
  users: { id: string; name: string; avatar: string }[],
  zones: HomeZone[],
  statusOf: (task: Task) => Status,
  colorMode: MapDisplayMode,
  panicMinImportance: number,
): MapRenderable[] {
  const filtered =
    colorMode === "panic"
      ? tasks.filter((t) => resolveImportance(t) >= panicMinImportance)
      : tasks;

  const result: MapRenderable[] = [];
  const assigneeInitial = (task: Task) => {
    const firstId = normalizeAssignedTo(task.assignedTo)[0];
    const user = firstId ? users.find((u) => u.id === firstId) : undefined;
    if (user?.avatar?.trim()) return user.avatar.trim().charAt(0).toUpperCase();
    if (user?.name?.trim()) return user.name.trim().charAt(0).toUpperCase();
    return task.name.trim().charAt(0).toUpperCase() || "?";
  };

  for (const raw of filtered) {
    const task = normalizeTaskMap(raw);
    const visualStatus = visualStatusForTask(task, statusOf, colorMode);
    const shape = task.mapShape ?? "pin";

    if (shape === "pin" && task.mapPins?.length) {
      task.mapPins.forEach((pin, i) => {
        result.push({
          kind: "pin",
          key: `${task.id}-pin-${i}`,
          task,
          x: pin.x,
          y: pin.y,
          visualStatus,
          initial: assigneeInitial(task),
          lineFrom: lineOriginForTask(task, pin, zones),
        });
      });
    }

    if (shape === "line" && task.mapLine && task.mapLine.length >= 2) {
      result.push({
        kind: "line",
        key: `${task.id}-line`,
        task,
        points: task.mapLine,
        visualStatus,
        strokeWidth: resolveMapLineWidth(task.mapLineWidth),
      });
    }

    if (shape === "area" && task.mapArea && task.mapArea.length >= 3) {
      result.push({
        kind: "area",
        key: `${task.id}-area`,
        task,
        polygon: task.mapArea,
        visualStatus,
      });
    }

  }

  return result;
}
