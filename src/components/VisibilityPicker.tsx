import { Lock, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useHousehold } from "@/context/HouseholdContext";
import type { ItemVisibility } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Publiczne (domyślnie) albo prywatne. Prywatne to wyjątek — wyraźnie inny
 * kolor i podpis, żeby nikt nie zapisał wspólnej sprawy „do szuflady”.
 */
export function VisibilityPicker({
  value,
  onChange,
  publicHint = "Widzą wszyscy domownicy",
}: {
  value: ItemVisibility;
  onChange: (value: ItemVisibility) => void;
  publicHint?: string;
}) {
  const { hasAccount } = useHousehold();

  return (
    <div className="space-y-1.5">
      <Label>Kto to widzi</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("public")}
          aria-pressed={value === "public"}
          className={cn(
            "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
            value === "public"
              ? "border-primary/50 bg-primary/10"
              : "border-border hover:bg-muted/40",
          )}
        >
          <Users className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="block font-medium">Publiczne</span>
            <span className="block text-xs text-muted-foreground">
              {publicHint}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => hasAccount && onChange("private")}
          aria-pressed={value === "private"}
          disabled={!hasAccount}
          className={cn(
            "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            value === "private"
              ? "border-warn/60 bg-warn/15"
              : "border-dashed border-border hover:bg-muted/40",
          )}
        >
          <Lock className="mt-0.5 size-4 shrink-0 text-warn" />
          <span>
            <span className="block font-medium">Prywatne — tylko ja</span>
            <span className="block text-xs text-muted-foreground">
              {hasAccount
                ? "Nikt inny tego nie zobaczy, nawet administrator"
                : "Wymaga zalogowania"}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

/** Plakietka na karcie prywatnego elementu */
export function PrivateBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warn",
        className,
      )}
      title="Prywatne — widzisz to tylko Ty"
    >
      <Lock className="size-3" />
      Prywatne
    </span>
  );
}
