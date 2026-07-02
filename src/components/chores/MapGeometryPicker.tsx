import { useRef, useState, type MouseEvent } from "react";
import { Check, Undo2, X } from "lucide-react";
import { FLOOR_PLAN_SRC } from "@/components/chores/MapPinPicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { clickToMapPercent, polygonToPointsAttr } from "@/lib/mapGeometry";
import { resolveMapLineWidth } from "@/config/mapLine";
import { TASK_MAP_SHAPE_LABELS } from "@/lib/taskMap";
import type { HomeZone, MapPoint, TaskMapShape } from "@/types";

type Props = {
  shape: Exclude<TaskMapShape, "zone">;
  pins: MapPoint[];
  line: MapPoint[];
  lineWidth: number;
  area: MapPoint[];
  zones: HomeZone[];
  onPinsChange: (pins: MapPoint[]) => void;
  onLineChange: (line: MapPoint[]) => void;
  onAreaChange: (area: MapPoint[]) => void;
};

export function MapGeometryPicker({
  shape,
  pins,
  line,
  lineWidth,
  area,
  zones,
  onPinsChange,
  onLineChange,
  onAreaChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [areaDraft, setAreaDraft] = useState<MapPoint[]>([]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    if ((e.target as HTMLElement).closest("[data-geom-control]")) return;
    const point = clickToMapPercent(e, mapRef.current);

    if (shape === "pin") {
      onPinsChange([...pins, point]);
      return;
    }
    if (shape === "line") {
      if (line.length >= 2) onLineChange([point]);
      else onLineChange([...line, point]);
      return;
    }
    if (shape === "area") {
      setAreaDraft((prev) => [...prev, point]);
    }
  };

  const closeArea = () => {
    if (areaDraft.length < 3) return;
    onAreaChange(areaDraft);
    setAreaDraft([]);
  };

  const hint =
    shape === "pin"
      ? "Kliknij plan — dodaj pinezkę (możesz kilka)."
      : shape === "line"
        ? "Kliknij 2 punkty — początek i koniec linii."
        : "Kliknij wierzchołki obszaru, potem Zamknij obszar.";

  return (
    <div className="space-y-2">
      <Label>Położenie na mapie ({TASK_MAP_SHAPE_LABELS[shape]})</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>

      {shape === "area" && (
        <div className="flex flex-wrap gap-2" data-geom-control>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={areaDraft.length < 3}
            onClick={closeArea}
          >
            <Check className="size-4" />
            Zamknij obszar ({areaDraft.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={areaDraft.length === 0}
            onClick={() => setAreaDraft((p) => p.slice(0, -1))}
          >
            <Undo2 className="size-4" />
            Cofnij
          </Button>
        </div>
      )}

      <div
        ref={mapRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={() => {}}
        className="relative cursor-crosshair overflow-hidden rounded-2xl border border-dashed border-primary/40"
      >
        <img
          src={FLOOR_PLAN_SRC}
          alt=""
          className="pointer-events-none block h-auto w-full select-none"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {zones
            .filter((z) => z.kind === "space" && z.polygon)
            .map((z) => (
              <polygon
                key={z.id}
                points={polygonToPointsAttr(z.polygon!)}
                className="fill-muted/20 stroke-border"
                strokeWidth={0.3}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          {shape === "line" && line.length > 0 && (
            <polyline
              points={polygonToPointsAttr(line)}
              className="fill-none stroke-primary"
              strokeWidth={resolveMapLineWidth(lineWidth)}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {shape === "area" && area.length >= 3 && (
            <polygon
              points={polygonToPointsAttr(area)}
              className="fill-warn/25 stroke-warn"
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {shape === "area" && areaDraft.length > 0 && (
            <>
              <polyline
                points={polygonToPointsAttr(areaDraft)}
                className="fill-none stroke-primary"
                strokeWidth={0.4}
                strokeDasharray="1 1"
                vectorEffect="non-scaling-stroke"
              />
              {areaDraft.map((p, i) => (
                <circle
                  key={`d-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={0.7}
                  className="fill-primary"
                />
              ))}
            </>
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0">
          {shape === "pin" &&
            pins.map((pin, index) => (
              <div
                key={`${pin.x}-${pin.y}-${index}`}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <div className="relative grid size-6 place-items-center rounded-full border-2 border-primary bg-primary text-[9px] font-bold text-primary-foreground">
                  {index + 1}
                  <button
                    type="button"
                    data-geom-control
                    onClick={(e) => {
                      e.stopPropagation();
                      onPinsChange(pins.filter((_, i) => i !== index));
                    }}
                    className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="size-2" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {shape === "pin" && pins.length > 0 && (
        <button
          type="button"
          data-geom-control
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => onPinsChange([])}
        >
          Wyczyść pinezki
        </button>
      )}
      {shape === "line" && line.length > 0 && (
        <button
          type="button"
          data-geom-control
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => onLineChange([])}
        >
          Wyczyść linię
        </button>
      )}
      {shape === "area" && area.length > 0 && (
        <button
          type="button"
          data-geom-control
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => onAreaChange([])}
        >
          Wyczyść obszar
        </button>
      )}
    </div>
  );
}
