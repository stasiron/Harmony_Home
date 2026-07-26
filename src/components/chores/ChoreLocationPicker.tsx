import { useState } from "react";
import { ROOM_OPTIONS } from "@/config/rooms";
import { ZoneMapOverlay } from "@/components/chores/ZoneMapOverlay";
import { findRoomAtPoint, roomForSpace } from "@/lib/mapHitTest";
import { Label } from "@/components/ui/label";
import {
  buildZoneTree,
  flattenZoneTree,
  zonePathLabel,
} from "@/lib/zoneTree";
import type { ChoreRoom, HomeZone } from "@/types";
import { cn } from "@/lib/utils";

type SingleProps = {
  multi?: false;
  room: ChoreRoom;
  zoneId: string;
  onSelectRoom: (room: ChoreRoom) => void;
  onSelectZone: (zoneId: string) => void;
};

type MultiProps = {
  multi: true;
  rooms: ChoreRoom[];
  zoneIds: string[];
  onChangeRooms: (rooms: ChoreRoom[]) => void;
  onChangeZoneIds: (zoneIds: string[]) => void;
};

type Props = {
  zones: HomeZone[];
} & (SingleProps | MultiProps);

function toggleInList<T>(list: T[], value: T): T[] {
  if (list.includes(value)) {
    if (list.length <= 1) return list;
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

export function ChoreLocationPicker(props: Props) {
  const { zones } = props;
  const multi = props.multi === true;
  const [hoveredRoom, setHoveredRoom] = useState<ChoreRoom | null>(null);
  const tree = buildZoneTree(zones);
  const zoneGroups = flattenZoneTree(tree).filter(
    ({ zone }) => zone.kind === "group",
  );
  const hasZoneGroups = zoneGroups.length > 0;

  const selectedRooms = multi
    ? props.rooms
    : !props.zoneId
      ? [props.room]
      : [];
  const selectedZoneIds = multi
    ? props.zoneIds
    : props.zoneId
      ? [props.zoneId]
      : [];
  const usingZones = selectedZoneIds.length > 0;

  const pickRoom = (room: ChoreRoom) => {
    if (multi) {
      if (usingZones) {
        props.onChangeZoneIds([]);
        props.onChangeRooms([room]);
        return;
      }
      props.onChangeRooms(toggleInList(props.rooms, room));
      return;
    }
    props.onSelectRoom(room);
  };

  const pickZone = (zoneId: string) => {
    if (multi) {
      if (!usingZones && props.rooms.length > 0) {
        props.onChangeRooms([]);
        props.onChangeZoneIds([zoneId]);
        return;
      }
      props.onChangeZoneIds(toggleInList(props.zoneIds, zoneId));
      return;
    }
    props.onSelectZone(zoneId);
  };

  const summary = usingZones
    ? `Strefy: ${selectedZoneIds.map((id) => zonePathLabel(zones, id)).join(", ")}`
    : `Pokoje: ${selectedRooms
        .map((r) => ROOM_OPTIONS.find((o) => o.value === r)?.label ?? r)
        .join(", ")}`;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>
          {multi
            ? "Lokalizacja — pokoje lub strefy"
            : "Lokalizacja — pokój lub strefa"}
        </Label>
        <p className="text-xs text-muted-foreground">
          {multi
            ? "Kliknij kilka pokoi albo kilka stref (nie mieszaj naraz). Ponowne kliknięcie odznacza."
            : "Kliknij pokój na planie albo wybierz strefę / pokój z listy poniżej."}
        </p>
      </div>

      <ZoneMapOverlay
        zones={zones}
        showLabels={false}
        roomMapHover
        highlightZoneIds={usingZones ? selectedZoneIds : []}
        highlightRooms={!usingZones ? selectedRooms : []}
        hoveredRoom={hoveredRoom}
        onMapClick={(point, space) => {
          if (space) {
            const hit = roomForSpace(space);
            if (hit) pickRoom(hit);
            return;
          }
          const hit = findRoomAtPoint(point, zones);
          if (hit) pickRoom(hit);
        }}
      />

      {hasZoneGroups && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Strefy
          </p>
          <div className="flex flex-wrap gap-1.5">
            {zoneGroups.map(({ zone, depth }) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => pickZone(zone.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                  selectedZoneIds.includes(zone.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/30 hover:bg-muted",
                )}
                style={{ marginLeft: depth > 0 ? `${depth * 6}px` : undefined }}
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pokoje
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ROOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pickRoom(opt.value)}
              onMouseEnter={() => setHoveredRoom(opt.value)}
              onMouseLeave={() => setHoveredRoom(null)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                !usingZones && selectedRooms.includes(opt.value)
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-muted/30 hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{summary}</p>
    </div>
  );
}
