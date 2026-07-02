import type { ChoreRoom, HomeZone, MapPoint } from "@/types";
import { ROOM_OPTIONS, ROOM_PIN_POSITIONS } from "@/config/rooms";
import { polygonCentroid } from "@/lib/mapGeometry";
import { polygonsForZone, spaceZonesWithPolygon } from "@/lib/zoneTree";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function roomForSpace(zone: HomeZone): ChoreRoom | null {
  if (zone.room) return zone.room;

  const name = normalizeName(zone.name);
  for (const opt of ROOM_OPTIONS) {
    const label = normalizeName(opt.label);
    if (name === label || name.includes(label)) return opt.value;
  }

  if (name.includes("salon")) return "living";
  if (name.includes("jadalnia")) return "dining";
  if (name.includes("kuchnia") || name.includes("spizarnia")) return "kitchen";
  if (name.includes("lazienka")) return "bathroom";
  if (name.includes("przedpokoj")) return "hallway";
  if (name.includes("pokoj stasia") || name.includes("pokoj tymka")) {
    return "bedroom2";
  }
  if (name.includes("sypialnia")) return "bedroom";

  return null;
}

export function polygonsForRoom(
  room: ChoreRoom,
  zones: HomeZone[],
): { zoneId: string; polygon: MapPoint[] }[] {
  return spaceZonesWithPolygon(zones)
    .filter((z) => roomForSpace(z) === room)
    .map((z) => ({ zoneId: z.id, polygon: z.polygon! }));
}

export function polygonForSpace(
  spaceId: string,
  zones: HomeZone[],
): { zoneId: string; polygon: MapPoint[] }[] {
  const zone = zones.find((z) => z.id === spaceId);
  if (!zone?.polygon || zone.polygon.length < 3) return [];
  return [{ zoneId: zone.id, polygon: zone.polygon }];
}

export function findRoomAtPoint(
  point: MapPoint,
  zones: HomeZone[],
): ChoreRoom | null {
  const space = findSpaceAtPoint(point, zones);
  if (space) return roomForSpace(space);
  return nearestRoomFromPoint(point);
}

export function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    const intersect =
      pi.y > point.y !== pj.y > point.y &&
      point.x <
        ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y + 0.0001) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findSpaceAtPoint(
  point: MapPoint,
  zones: HomeZone[],
): HomeZone | undefined {
  const spaces = spaceZonesWithPolygon(zones);
  for (let i = spaces.length - 1; i >= 0; i--) {
    const z = spaces[i]!;
    if (z.polygon && pointInPolygon(point, z.polygon)) return z;
  }
  return undefined;
}

export function nearestRoomFromPoint(point: MapPoint): ChoreRoom | null {
  const maxDist = 8;
  let best: { room: ChoreRoom; dist: number } | null = null;

  for (const [room, pos] of Object.entries(ROOM_PIN_POSITIONS) as [
    ChoreRoom,
    MapPoint,
  ][]) {
    const dist = Math.hypot(point.x - pos.x, point.y - pos.y);
    if (dist <= maxDist && (!best || dist < best.dist)) {
      best = { room, dist };
    }
  }
  return best?.room ?? null;
}

export function zoneDisplayPosition(
  zone: HomeZone,
  zones: HomeZone[],
): MapPoint | null {
  const polys = polygonsForZone(zone.id, zones);
  if (polys.length === 0) return null;
  return polygonCentroid(polys.flatMap((p) => p.polygon));
}

export function zonesWithMapLabel(zones: HomeZone[]): HomeZone[] {
  return zones.filter((z) => zoneDisplayPosition(z, zones) !== null);
}
