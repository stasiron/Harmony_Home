import { useState } from "react";
import { toast } from "sonner";
import {
  CHORE_WEIGHT_DEFAULTS,
  CHORE_WEIGHT_SETTINGS,
  WEIGHT_FORMULA_LATEX,
  resolveChoreWeights,
  trudnoscMultiplier,
} from "@/config/choreWeight";
import { useHousehold } from "@/context/HouseholdContext";
import type { ChoreWeightSettings } from "@/types";
import { cn } from "@/lib/utils";

const IMPACT_OPTIONS = [
  { value: 0, label: "Tylko czas" },
  { value: 0.5, label: "Trochę" },
  { value: 1, label: "Normalnie" },
  { value: 1.5, label: "Mocno" },
  { value: 2, label: "Bardzo" },
];

const THRESHOLD_OPTIONS = [30, 40, 50, 60, 70];

function Choice<T extends number>({
  options,
  value,
  onChange,
  disabled,
  format,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled: boolean;
  format?: (value: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-default",
            value === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted disabled:hover:bg-transparent",
          )}
        >
          {format ? format(option.value) : option.label}
        </button>
      ))}
    </div>
  );
}

/** Jak liczona jest waga zadań — ustawienie mieszkania (admin zmienia) */
export function ChoreWeightSettingsCard() {
  const { household, isAdmin, setChoreWeights } = useHousehold();
  const settings = resolveChoreWeights(household?.choreWeights);
  const [busy, setBusy] = useState(false);
  const { maksTrudnosc, maksCzasMinut } = CHORE_WEIGHT_SETTINGS;

  const save = async (patch: Partial<ChoreWeightSettings>) => {
    setBusy(true);
    try {
      await setChoreWeights({ ...settings, ...patch });
    } catch (err) {
      console.error("Chore weights save failed:", err);
      toast.error("Nie udało się zapisać wag.");
    } finally {
      setBusy(false);
    }
  };

  const exampleRows = [1, 3, maksTrudnosc].map((trudnosc) => ({
    trudnosc,
    multiplier: trudnoscMultiplier(trudnosc, settings.difficultyImpact),
    waga10min:
      Math.round(
        10 * trudnoscMultiplier(trudnosc, settings.difficultyImpact) * 10,
      ) / 10,
  }));

  const isDefault =
    settings.difficultyImpact === CHORE_WEIGHT_DEFAULTS.difficultyImpact &&
    settings.suggestThresholdPct === CHORE_WEIGHT_DEFAULTS.suggestThresholdPct;

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated">
      <div>
        <h2 className="text-xl font-semibold">Waga zadań</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jak liczony jest udział zadania w obowiązku i % wykonania per
          domownik. Ustawienie tego mieszkania
          {isAdmin ? "" : " — zmienia administrator"}.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Jak mocno liczy się trudność</p>
        <Choice
          options={IMPACT_OPTIONS}
          value={settings.difficultyImpact}
          onChange={(difficultyImpact) => void save({ difficultyImpact })}
          disabled={!isAdmin || busy}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Obowiązek „Warto zrobić”, gdy zaległe zadania to co najmniej
        </p>
        <Choice
          options={THRESHOLD_OPTIONS.map((v) => ({ value: v, label: `${v}%` }))}
          value={settings.suggestThresholdPct}
          onChange={(suggestThresholdPct) => void save({ suggestThresholdPct })}
          disabled={!isAdmin || busy}
        />
        <p className="text-xs text-muted-foreground">
          …wagi wszystkich zadań obowiązku. Krytyczne zadanie i tak robi go
          „Pilnym”.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface/60 px-4 py-3">
        <p className="font-mono text-sm">{WEIGHT_FORMULA_LATEX}</p>
        <p className="text-xs text-muted-foreground">
          czas — minuty zadania (max {maksCzasMinut}) · TRUDNOSC — ważność (1…
          {maksTrudnosc}) · WPŁYW — wybór powyżej ({settings.difficultyImpact})
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Trudność</th>
              <th className="py-2 pr-4 font-medium">Mnożnik</th>
              <th className="py-2 font-medium">Waga przy 10 min</th>
            </tr>
          </thead>
          <tbody>
            {exampleRows.map((row) => (
              <tr key={row.trudnosc} className="border-b border-border/50">
                <td className="py-2 pr-4 tabular-nums">{row.trudnosc}</td>
                <td className="py-2 pr-4 tabular-nums">
                  ×{row.multiplier.toFixed(2)}
                </td>
                <td className="py-2 tabular-nums">{row.waga10min}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
