import type { MouseEvent } from "react";
import { X } from "lucide-react";
import type { MapPin } from "@/types";
import { cn } from "@/lib/utils";

const FLOOR_PLAN_SRC = "/images/apartment-floor-plan.png";

type Props = {
  pins: MapPin[];
  onChange: (pins: MapPin[]) => void;
  className?: string;
};

export function MapPinPicker({ pins, onChange, className }: Props) {
  const addPin = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-pin-remove]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange([...pins, { x, y }]);
  };

  const removePin = (index: number) => {
    onChange(pins.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-muted-foreground">
        Kliknij plan — dodaj pinezkę. Możesz dodać kilka.
      </p>
      <div
        role="button"
        tabIndex={0}
        onClick={addPin}
        onKeyDown={() => {}}
        className="relative cursor-crosshair overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-surface"
      >
        <img src={FLOOR_PLAN_SRC} alt="" className="pointer-events-none block h-auto w-full select-none" />
        <div className="pointer-events-none absolute inset-0">
          {pins.map((pin, index) => (
            <div
              key={`${pin.x}-${pin.y}-${index}`}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <div className="relative grid size-7 place-items-center rounded-full border-2 border-primary bg-primary text-[10px] font-bold text-primary-foreground shadow-md">
                {index + 1}
                <button
                  type="button"
                  data-pin-remove
                  onClick={(e) => {
                    e.stopPropagation();
                    removePin(index);
                  }}
                  className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-destructive-foreground"
                  aria-label="Usuń pinezkę"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {pins.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Wyczyść pinezki ({pins.length})
        </button>
      )}
    </div>
  );
}

export { FLOOR_PLAN_SRC };
