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

type Props = {
  zones: HomeZone[];
  room: ChoreRoom;
  zoneId: string;
  onSelectRoom: (room: ChoreRoom) => void;
  onSelectZone: (zoneId: string) => void;
};

export function ChoreLocationPicker({
  zones,
  room,
  zoneId,
  onSelectRoom,
  onSelectZone,
}: Props) {
  const [hoveredRoom, setHoveredRoom] = useState<ChoreRoom | null>(null);
  const tree = buildZoneTree(zones);
  const zoneGroups = flattenZoneTree(tree).filter(
    ({ zone }) => zone.kind === "group",
  );
  const hasZoneGroups = zoneGroups.length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Lokalizacja — pokój lub strefa</Label>
        <p className="text-xs text-muted-foreground">
          Kliknij pokój na planie albo wybierz strefę / pokój z listy poniżej.
        </p>
      </div>

      <ZoneMapOverlay
        zones={zones}
        showLabels={false}
        roomMapHover
        highlightZoneId={zoneId || null}
        highlightRoom={!zoneId ? room : null}
        hoveredRoom={hoveredRoom}
        onMapClick={(point, space) => {
          if (space) {
            const hit = roomForSpace(space);
            if (hit) onSelectRoom(hit);
            return;
          }
          const hit = findRoomAtPoint(point, zones);
          if (hit) onSelectRoom(hit);
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
                onClick={() => onSelectZone(zone.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                  zoneId === zone.id
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
              onClick={() => onSelectRoom(opt.value)}
              onMouseEnter={() => setHoveredRoom(opt.value)}
              onMouseLeave={() => setHoveredRoom(null)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                !zoneId && room === opt.value
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-muted/30 hover:bg-muted",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {zoneId ? (
        <p className="text-xs text-muted-foreground">
          Strefa: {zonePathLabel(zones, zoneId)}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pokój: {ROOM_OPTIONS.find((o) => o.value === room)?.label ?? room}
        </p>
      )}
    </div>
  );
}
