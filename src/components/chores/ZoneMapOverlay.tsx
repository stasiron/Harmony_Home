import { useRef, useState, type MouseEvent } from "react";
import {
  FLOOR_PLAN_ASPECT_RATIO,
  FLOOR_PLAN_SRC,
} from "@/lib/contentPaths";
import { clickToMapPercent, polygonToPointsAttr } from "@/lib/mapGeometry";
import {
  findSpaceAtPoint,
  polygonForSpace,
  polygonsForRoom,
  zoneDisplayPosition,
  zonesWithMapLabel,
} from "@/lib/mapHitTest";
import { polygonsForZone } from "@/lib/zoneTree";
import type { ChoreRoom, HomeZone, MapPoint } from "@/types";
import { cn } from "@/lib/utils";

type ZoneMapOverlayProps = {
  zones: HomeZone[];
  overlayOnly?: boolean;
  showLabels?: boolean;
  interactiveLabels?: boolean;
  highlightZoneId?: string | null;
  highlightRoom?: ChoreRoom | null;
  hoveredRoom?: ChoreRoom | null;
  roomMapHover?: boolean;
  onMapClick?: (point: MapPoint, space?: HomeZone) => void;
  className?: string;
};

export function ZoneMapOverlay({
  zones,
  overlayOnly = false,
  showLabels = true,
  interactiveLabels = false,
  highlightZoneId = null,
  highlightRoom = null,
  hoveredRoom = null,
  roomMapHover = false,
  onMapClick,
  className,
}: ZoneMapOverlayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);

  const labelZones = zonesWithMapLabel(zones);

  const highlightPolys = highlightZoneId
    ? polygonsForZone(highlightZoneId, zones)
    : highlightRoom
      ? polygonsForRoom(highlightRoom, zones)
      : [];

  const outlinePolys = hoveredSpaceId
    ? polygonForSpace(hoveredSpaceId, zones)
    : hoveredRoom
      ? polygonsForRoom(hoveredRoom, zones)
      : hoveredZoneId
        ? polygonsForZone(hoveredZoneId, zones)
        : [];

  const handlePointer = (e: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const point = clickToMapPercent(e, mapRef.current);
    const space = findSpaceAtPoint(point, zones);
    setHoveredSpaceId(space?.id ?? null);
    return { point, space };
  };

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onMapClick) return;
    if ((e.target as HTMLElement).closest("[data-zone-label]")) return;
    const result = handlePointer(e);
    if (!result) return;
    const { point, space } = result;
    if (space) {
      onMapClick(point, space);
      return;
    }
    onMapClick(point);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!roomMapHover) return;
    handlePointer(e);
  };

  const handleMouseLeave = () => {
    if (roomMapHover) setHoveredSpaceId(null);
  };

  const pointerHandlers = {
    onClick: onMapClick ? handleMapClick : undefined,
    onMouseMove: roomMapHover ? handleMouseMove : undefined,
    onMouseLeave: roomMapHover ? handleMouseLeave : undefined,
  };

  const frameClass = cn(
    "relative w-full overflow-hidden",
    !overlayOnly && "rounded-2xl border border-border",
    (onMapClick || roomMapHover) && !overlayOnly && "cursor-pointer",
    className,
  );

  const frameStyle = { aspectRatio: FLOOR_PLAN_ASPECT_RATIO };

  const inner = (withImage: boolean) => (
    <>
      {withImage && (
        <img
          src={FLOOR_PLAN_SRC}
          alt="Plan mieszkania"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />
      )}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {highlightPolys.map(({ zoneId, polygon }) => (
          <polygon
            key={`hl-${zoneId}`}
            points={polygonToPointsAttr(polygon)}
            className={cn(
              highlightZoneId
                ? "fill-primary/20 stroke-primary"
                : "fill-secondary/25 stroke-secondary",
            )}
            strokeWidth={0.55}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {outlinePolys.map(({ zoneId, polygon }) => (
          <polygon
            key={`ol-${zoneId}`}
            points={polygonToPointsAttr(polygon)}
            className="fill-none stroke-primary"
            strokeWidth={0.65}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {showLabels && (
        <div className="absolute inset-0">
          {labelZones.map((zone) => {
            const pos = zoneDisplayPosition(zone, zones);
            if (!pos) return null;
            const isHighlighted =
              highlightZoneId === zone.id ||
              (highlightZoneId &&
                polygonsForZone(highlightZoneId, zones).some(
                  (p) => p.zoneId === zone.id,
                ));

            return (
              <div
                key={zone.id}
                data-zone-label
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2",
                  interactiveLabels && "pointer-events-auto",
                )}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                <span
                  className={cn(
                    "whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-sm sm:text-xs",
                    isHighlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/90 text-foreground backdrop-blur-sm",
                  )}
                >
                  {zone.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (overlayOnly) {
    return (
      <div
        ref={mapRef}
        className={cn("pointer-events-none absolute inset-0", className)}
        {...pointerHandlers}
      >
        <div
          className={cn(
            (onMapClick || roomMapHover) && "pointer-events-auto absolute inset-0",
          )}
        >
          {inner(false)}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={frameClass}
      style={frameStyle}
      onKeyDown={() => {}}
      role={onMapClick ? "button" : undefined}
      tabIndex={onMapClick ? 0 : undefined}
      {...pointerHandlers}
    >
      {inner(true)}
    </div>
  );
}
