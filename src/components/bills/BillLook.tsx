import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BILL_ICONS, billIcon } from "@/config/billIcons";
import { TAG_COLORS } from "@/config/foodEmoji";
import { cn } from "@/lib/utils";

/** Okrągła ikona rachunku w jego kolorze */
export function BillIcon({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon = billIcon(icon);
  const tone = color ? `var(--${color})` : "var(--primary)";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        size === "sm" ? "size-7" : "size-10",
        className,
      )}
      style={{
        color: tone,
        backgroundColor: `color-mix(in oklch, ${tone} 16%, transparent)`,
      }}
      aria-hidden
    >
      <Icon className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}

/** Wybór ikony i koloru rachunku (administrator, Ustawienia → Rachunki) */
export function BillLookPicker({
  icon,
  color,
  disabled,
  name,
  onChange,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  disabled?: boolean;
  name: string;
  onChange: (change: { icon?: string; color?: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
          aria-label={`Ikona i kolor: ${name}`}
        >
          <BillIcon icon={icon} color={color} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 p-3" align="start">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Ikona
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {BILL_ICONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={icon === id}
                onClick={() => onChange({ icon: id })}
                className={cn(
                  "grid h-10 place-items-center rounded-lg border transition-colors",
                  icon === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <Icon className="size-5" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Kolor
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TAG_COLORS.map((token) => (
              <button
                key={token}
                type="button"
                aria-label={`Kolor ${token.replace("tag-", "")}`}
                aria-pressed={color === token}
                onClick={() => onChange({ color: token })}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform",
                  color === token
                    ? "scale-110 border-foreground"
                    : "border-transparent",
                )}
                style={{ backgroundColor: `var(--${token})` }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
