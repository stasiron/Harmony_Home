import { useEffect, useMemo, useState } from "react";
import type { Task, Status, User } from "@/types";
import { roomLabel } from "@/config/rooms";
import { loadHomeZones } from "@/config/homeZones";
import { FLOOR_PLAN_ASPECT_RATIO, FLOOR_PLAN_SRC } from "@/lib/contentPaths";
import { PANIC_GUESTS_MIN_IMPORTANCE, resolveImportance } from "@/lib/choreImportance";
import { ZoneMapOverlay } from "@/components/chores/ZoneMapOverlay";
import {
  DEFAULT_MAP_LAYERS,
  loadMapLayers,
  MAP_LAYER_LABELS,
  polygonToPointsAttr,
  resolveMapRenderables,
  saveMapLayers,
  type MapGeometryLayer,
  type MapRenderable,
} from "@/lib/mapGeometry";
import {
  MAP_DISPLAY_MODES_UI,
  MAP_MODE_LABELS,
  MAP_STATUS_LEGEND,
  MAP_STATUS_STYLES,
  PANIC_MAP_LEGEND,
  type MapDisplayMode,
  type MapVisualStatus,
} from "@/lib/mapPinStyles";
import { zonePathLabel } from "@/lib/zoneTree";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

function MapLegend({ colorMode }: { colorMode: MapDisplayMode }) {
  if (colorMode === "panic") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {PANIC_MAP_LEGEND.map(({ status, hint }) => {
          const styles = MAP_STATUS_STYLES[status];
          return (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2.5 rounded-full border",
                  styles.fill,
                  styles.border,
                )}
              />
              {hint}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {(["must", "suggested", "safe", "done"] as MapVisualStatus[]).map(
        (status) => {
          const styles = MAP_STATUS_STYLES[status];
          const { label, hint } = MAP_STATUS_LEGEND[status];
          return (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2.5 rounded-full border",
                  styles.fill,
                  styles.border,
                )}
              />
              <span className="font-medium text-foreground/80">{label}</span>
              <span className="hidden sm:inline">— {hint}</span>
            </span>
          );
        },
      )}
    </div>
  );
}

function MapPinMarker({
  item,
  colorMode,
}: {
  item: Extract<MapRenderable, { kind: "pin" }>;
  colorMode: MapDisplayMode;
}) {
  const styles = MAP_STATUS_STYLES[item.visualStatus];

  if (colorMode === "initials") {
    return (
      <div
        className={cn(
          "grid size-8 place-items-center rounded-full border-[3px] bg-background text-[11px] font-bold shadow-lg transition-transform group-hover:scale-110",
          styles.border,
          styles.text,
          styles.pulse && "animate-pulse",
        )}
      >
        {item.initial}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid size-7 place-items-center rounded-full text-[11px] font-bold shadow-lg transition-transform group-hover:scale-110",
        styles.fill,
        styles.text,
        styles.pulse && "animate-pulse",
      )}
    >
      {styles.showBang ? "!" : null}
    </div>
  );
}

export function ApartmentMap({
  tasks,
  statusOf,
  users,
}: {
  tasks: Task[];
  statusOf: (task: Task) => Status;
  users: User[];
}) {
  const [colorMode, setColorMode] = useState<MapDisplayMode>("initials");
  const [layers, setLayers] = useState<MapGeometryLayer[]>(() => loadMapLayers());
  const [zones, setZones] = useState(() => loadHomeZones());

  useEffect(() => {
    saveMapLayers(layers);
  }, [layers]);

  useEffect(() => {
    const refresh = () => setZones(loadHomeZones());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const renderables = useMemo(
    () =>
      resolveMapRenderables(
        tasks,
        users,
        zones,
        statusOf,
        colorMode,
        PANIC_GUESTS_MIN_IMPORTANCE,
      ),
    [tasks, users, zones, statusOf, colorMode],
  );

  const pins = renderables.filter((r) => r.kind === "pin");
  const lines = renderables.filter((r) => r.kind === "line");
  const areas = renderables.filter((r) => r.kind === "area");

  const hasTaskGeometry =
    pins.length > 0 || lines.length > 0 || areas.length > 0;
  const showZones = layers.includes("zones") && zones.length > 0;
  const showEmpty = !hasTaskGeometry && !showZones;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated">
      <div className="space-y-3 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Plan mieszkania
          </p>
          <ToggleGroup
            type="single"
            value={colorMode}
            onValueChange={(v) => {
              if (v) setColorMode(v as MapDisplayMode);
            }}
            className="justify-start"
          >
            {MAP_DISPLAY_MODES_UI.map((key) => (
              <ToggleGroupItem
                key={key}
                value={key}
                className="px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {MAP_MODE_LABELS[key]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Warstwy
          </p>
          <ToggleGroup
            type="multiple"
            value={layers}
            onValueChange={(v) => {
              const next = v as MapGeometryLayer[];
              setLayers(next.length > 0 ? next : DEFAULT_MAP_LAYERS);
            }}
            className="flex-wrap justify-start"
          >
            {(Object.keys(MAP_LAYER_LABELS) as MapGeometryLayer[]).map(
              (key) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  className="px-3 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
                >
                  {MAP_LAYER_LABELS[key]}
                </ToggleGroupItem>
              ),
            )}
          </ToggleGroup>
        </div>

        <MapLegend colorMode={colorMode} />
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: FLOOR_PLAN_ASPECT_RATIO }}
      >
        <img
          src={FLOOR_PLAN_SRC}
          alt="Plan mieszkania"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {layers.includes("lines") &&
            lines.map((line) => {
              const styles = MAP_STATUS_STYLES[line.visualStatus];
              return (
                <polyline
                  key={line.key}
                  points={polygonToPointsAttr(line.points)}
                  className={cn(
                    styles.svgStroke,
                    line.visualStatus === "must" && "animate-pulse",
                  )}
                  strokeWidth={line.strokeWidth}
                  strokeDasharray={
                    line.visualStatus === "done" ? "1.5 1.5" : undefined
                  }
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

          {layers.includes("areas") &&
            areas.map((area) => {
              const styles = MAP_STATUS_STYLES[area.visualStatus];
              return (
                <polygon
                  key={area.key}
                  points={polygonToPointsAttr(area.polygon)}
                  className={cn(styles.svgFill, styles.svgStroke)}
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
        </svg>

        {showZones && (
          <ZoneMapOverlay
            overlayOnly
            zones={zones}
            interactiveLabels
          />
        )}

        <div className="absolute inset-0">
          {showEmpty ? (
            <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background/80 px-3 py-2 text-center text-xs text-muted-foreground backdrop-blur-sm">
              {zones.length === 0
                ? "Dodaj drzewo stref w Ustawieniach"
                : "Brak obowiązków z geometrią na mapie"}
            </div>
          ) : (
            layers.includes("pins") &&
            pins.map((pin) => (
              <div
                key={pin.key}
                className="group absolute -translate-x-1/2 -translate-y-full"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <MapPinMarker item={pin} colorMode={colorMode} />
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                  <div className="font-medium">{pin.task.name}</div>
                  <div className="text-muted-foreground">
                    {pin.task.zoneId
                      ? zonePathLabel(zones, pin.task.zoneId)
                      : roomLabel(pin.task.room)}
                    {colorMode === "panic" &&
                      ` · ważność ${resolveImportance(pin.task)}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
