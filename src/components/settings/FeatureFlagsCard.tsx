import { EyeOff, Lock, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FEATURE_GROUPS,
  FEATURES,
  type FeatureFlags,
  type FeatureState,
} from "@/config/features";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import { useHousehold } from "@/context/HouseholdContext";
import { parseFeatureFlags } from "@/config/features";
import { saveGlobalFeatures } from "@/lib/globalConfig";
import { setHouseholdFeatureFlags } from "@/lib/householdSetup";
import { cn } from "@/lib/utils";

const STATES: { id: FeatureState; label: string }[] = [
  { id: "on", label: "Działa" },
  { id: "locked", label: "Wkrótce" },
  { id: "hidden", label: "Ukryte" },
];

/**
 * Widoczność funkcji: strony, zakładki i główne przyciski — każda działa,
 * jest zablokowana („wkrótce”, przygaszona) albo ukryta. `scope="global"`
 * to wersja administratora ogólnego dla wszystkich mieszkań.
 */
export function FeatureFlagsCard({ scope }: { scope: "household" | "global" }) {
  const { household, householdId, isAdmin, isSuperAdmin } = useHousehold();
  const global = useGlobalConfig().features;
  const saved: FeatureFlags =
    scope === "global" ? global : parseFeatureFlags(household?.features?.flags);
  const [flags, setFlags] = useState<FeatureFlags>(saved);
  const [busy, setBusy] = useState(false);
  const savedJson = JSON.stringify(saved);
  useEffect(() => setFlags(JSON.parse(savedJson) as FeatureFlags), [savedJson]);

  const allowed = scope === "global" ? isSuperAdmin : isAdmin;
  if (!allowed || (scope === "household" && !householdId)) return null;

  const dirty = JSON.stringify(flags) !== savedJson;
  const set = (key: string, state: FeatureState) =>
    setFlags((prev) => {
      const next = { ...prev };
      if (state === "on") delete next[key];
      else next[key] = state;
      return next;
    });

  const save = async () => {
    setBusy(true);
    try {
      if (scope === "global") await saveGlobalFeatures(flags);
      else await setHouseholdFeatureFlags(householdId!, flags);
      toast.success("Zapisano widoczność funkcji");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  };

  const changed = Object.keys(flags).length;

  return (
    <section
      className={cn(
        "space-y-4 rounded-3xl border p-5 shadow-elevated",
        scope === "global"
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-surface",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <SlidersHorizontal className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">
            Widoczność funkcji
            {scope === "global" && " — wszystkie mieszkania"}
          </h2>
          <p className="text-sm text-muted-foreground">
            „Wkrótce” zostawia element na miejscu, przygaszony i z kłódką.
            „Ukryte” usuwa go całkiem. Ty dalej widzisz wszystko, ze znaczkiem
            {scope === "global"
              ? " — blokada globalna działa też na administratorów mieszkań."
              : " — u pozostałych obowiązuje ostrzejsze z ustawień mieszkania i globalnych."}
          </p>
        </div>
      </div>

      {FEATURE_GROUPS.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {group.label}
          </h3>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {FEATURES.filter((f) => f.group === group.id).map((f) => {
              const state = flags[f.key] ?? "on";
              const globalState = scope === "household" ? global[f.key] : null;
              return (
                <li
                  key={f.key}
                  className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    {f.label}
                    {globalState && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {globalState === "hidden" ? (
                          <EyeOff className="size-3" />
                        ) : (
                          <Lock className="size-3" />
                        )}
                        globalnie{" "}
                        {globalState === "hidden" ? "ukryte" : "wkrótce"}
                      </span>
                    )}
                  </span>
                  <div
                    role="radiogroup"
                    aria-label={f.label}
                    className="inline-flex rounded-lg border border-border p-0.5"
                  >
                    {STATES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={state === s.id}
                        onClick={() => set(f.key, s.id)}
                        className={cn(
                          "rounded-md px-2 py-1 text-xs transition-colors",
                          state === s.id
                            ? s.id === "on"
                              ? "bg-primary text-primary-foreground"
                              : "bg-warn text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {changed === 0 ? "Wszystko działa" : `Zmienione: ${changed}`}
        </span>
        <div className="flex gap-2">
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => setFlags(JSON.parse(savedJson) as FeatureFlags)}
            >
              Cofnij
            </Button>
          )}
          <Button disabled={!dirty || busy} onClick={() => void save()}>
            {busy ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      </div>
    </section>
  );
}
