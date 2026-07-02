import homeZonesData from "@content/data/homeZones.json";
import type { HomeZone } from "@/types";

export const HOME_ZONES_DRAFT_KEY = "homeharmony-home-zones-draft";

function migrateZone(raw: Record<string, unknown>): HomeZone {
  if (raw.kind === "group" || raw.kind === "space") {
    return raw as HomeZone;
  }
  const polygon = raw.polygon as HomeZone["polygon"];
  return {
    id: String(raw.id),
    name: String(raw.label ?? raw.name ?? "Strefa"),
    parentId: (raw.parentId as string | null) ?? null,
    kind: polygon && Array.isArray(polygon) && polygon.length >= 3 ? "space" : "group",
    polygon,
    room: raw.room as HomeZone["room"],
  };
}

export function loadHomeZones(): HomeZone[] {
  const fromFile = Array.isArray(homeZonesData.zones)
    ? homeZonesData.zones.map((z) => migrateZone(z as Record<string, unknown>))
    : [];
  if (fromFile.length > 0) return fromFile;

  if (typeof window !== "undefined") {
    try {
      const draft = localStorage.getItem(HOME_ZONES_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as {
          zones?: Record<string, unknown>[];
        };
        if (Array.isArray(parsed.zones) && parsed.zones.length > 0) {
          return parsed.zones.map(migrateZone);
        }
      }
      const legacy = localStorage.getItem("homeharmony-map-zones-draft");
      if (legacy) {
        const parsed = JSON.parse(legacy) as {
          zones?: Record<string, unknown>[];
        };
        if (Array.isArray(parsed.zones) && parsed.zones.length > 0) {
          return parsed.zones.map(migrateZone);
        }
      }
    } catch {
      /* empty */
    }
  }

  return [];
}

export function saveHomeZonesDraft(zones: HomeZone[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    HOME_ZONES_DRAFT_KEY,
    JSON.stringify({ version: 2, zones }, null, 2),
  );
}

export function clearHomeZonesDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HOME_ZONES_DRAFT_KEY);
}

export function exportHomeZonesJson(zones: HomeZone[]): string {
  return JSON.stringify({ version: 2, zones }, null, 2);
}

/** @deprecated use loadHomeZones */
export const loadMapZones = loadHomeZones;
