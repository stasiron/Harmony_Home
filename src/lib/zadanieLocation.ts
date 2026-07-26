import { roomsLabel } from "@/config/rooms";
import { zonePathLabel } from "@/lib/zoneTree";
import type { ChoreRoom, HomeZone } from "@/types";

type LocationFields = {
  room: ChoreRoom;
  rooms?: ChoreRoom[];
  zoneId?: string;
  zoneIds?: string[];
};

export function resolveItemRooms(item: LocationFields) {
  if (item.rooms?.length) return item.rooms;
  return [item.room];
}

export function resolveItemZoneIds(item: LocationFields) {
  if (item.zoneIds?.length) return item.zoneIds;
  if (item.zoneId) return [item.zoneId];
  return [];
}

export function itemLocationLabel(
  item: LocationFields,
  zones: HomeZone[] = [],
): string {
  const zoneIds = resolveItemZoneIds(item);
  if (zoneIds.length > 0) {
    if (zones.length > 0) {
      return zoneIds.map((id) => zonePathLabel(zones, id)).join(", ");
    }
    return zoneIds.length === 1 ? "1 strefa" : `${zoneIds.length} strefy`;
  }
  return roomsLabel(resolveItemRooms(item));
}

export function zadanieLocationLabel(
  item: LocationFields,
  zones: HomeZone[] = [],
): string {
  return itemLocationLabel(item, zones);
}

export function resolveZadanieRooms(item: LocationFields) {
  return resolveItemRooms(item);
}

export function resolveZadanieZoneIds(item: LocationFields) {
  return resolveItemZoneIds(item);
}
