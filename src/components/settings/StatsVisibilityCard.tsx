import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { STATS_VISIBILITY } from "@/config/roles";
import { useHousehold } from "@/context/HouseholdContext";
import { cn } from "@/lib/utils";
import type { StatsVisibility } from "@/types";

/** Kto widzi statystyki (Ustawienia → Obowiązki) — pilnują tego też reguły */
export function StatsVisibilityCard() {
  const { household, isAdmin, setStatsVisibility } = useHousehold();
  const [busy, setBusy] = useState(false);
  const current = household?.statsVisibility ?? "all";

  const choose = async (mode: StatsVisibility) => {
    if (mode === current) return;
    setBusy(true);
    try {
      await setStatsVisibility(mode);
      toast.success("Zapisano, kto widzi statystyki");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <BarChart3 className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Kto widzi statystyki</h2>
          <p className="text-sm text-muted-foreground">
            Administratorzy widzą zawsze wszystko. Goście i urządzenia — nigdy.
            {!isAdmin && " Zmienia to administrator mieszkania."}
          </p>
        </div>
      </div>
      <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
        {STATS_VISIBILITY.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={current === option.id}
            disabled={!isAdmin || busy}
            onClick={() => void choose(option.id)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-default",
              current === option.id
                ? "border-primary bg-primary/10 ring-2 ring-primary/15"
                : "border-border hover:border-primary/30",
            )}
          >
            <span className="block font-medium">{option.label}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
