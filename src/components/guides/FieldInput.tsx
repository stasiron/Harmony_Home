import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GuideField, GuideFieldValue } from "@/types";

/** Pole formularza wpisu — wygląd zależny od rodzaju pola */
export function FieldInput({
  field,
  value,
  onChange,
  id,
}: {
  field: GuideField;
  value: GuideFieldValue | undefined;
  onChange: (value: GuideFieldValue) => void;
  id: string;
}) {
  const options = field.options ?? [];

  switch (field.type) {
    case "longtext":
      return (
        <Textarea
          id={id}
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "choice":
    case "scale":
      return (
        <div
          className={cn(
            "flex flex-wrap gap-1.5",
            field.type === "scale" &&
              "grid grid-flow-col auto-cols-fr rounded-xl border border-border p-1",
          )}
          role="radiogroup"
        >
          {options.map((option) => {
            const on = value === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(on && !field.required ? null : option)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  field.type === "scale" && "border-transparent",
                  on
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    case "multi": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const on = selected.includes(option);
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                  on ? "border-primary/50 bg-primary/10" : "border-border",
                )}
              >
                <Checkbox
                  checked={on}
                  onCheckedChange={() =>
                    onChange(
                      on
                        ? selected.filter((o) => o !== option)
                        : [...selected, option],
                    )
                  }
                />
                {option}
              </label>
            );
          })}
        </div>
      );
    }
    case "range": {
      const min = field.min ?? 0;
      const max = field.max ?? 10;
      const current = typeof value === "number" ? value : null;
      return (
        <div className="flex items-center gap-4">
          <Slider
            id={id}
            min={min}
            max={max}
            step={field.step ?? 1}
            value={[current ?? min]}
            onValueChange={([v]) => onChange(v ?? min)}
            className="flex-1"
          />
          <span
            className={cn(
              "min-w-14 text-right text-sm tabular-nums",
              current === null && "text-muted-foreground",
            )}
          >
            {current === null ? "—" : current}
            {field.unit ? ` ${field.unit}` : ""}
          </span>
        </div>
      );
    }
    case "number":
      return (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            inputMode="decimal"
            value={typeof value === "number" ? String(value) : ""}
            onChange={(e) => {
              const text = e.target.value.replace(",", ".");
              const n = Number(text);
              onChange(text.trim() === "" || !Number.isFinite(n) ? null : n);
            }}
            className="w-40"
          />
          {field.unit && (
            <span className="text-sm text-muted-foreground">{field.unit}</span>
          )}
        </div>
      );
    case "checkbox":
      return (
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(v) => onChange(v)}
        />
      );
    case "date":
      return (
        <Input
          id={id}
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-48"
        />
      );
    default:
      return (
        <Input
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
