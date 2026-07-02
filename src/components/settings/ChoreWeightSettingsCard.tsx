import {
  CHORE_WEIGHT_SETTINGS,
  WEIGHT_FORMULA_LATEX,
  trudnoscMultiplier,
} from "@/config/choreWeight";

export function ChoreWeightSettingsCard() {
  const { maksTrudnosc, maksCzasMinut, minWaga } = CHORE_WEIGHT_SETTINGS;

  const exampleRows = [1, 3, maksTrudnosc].map((trudnosc) => ({
    trudnosc,
    multiplier: trudnoscMultiplier(trudnosc),
    waga10min: Math.round(10 * trudnoscMultiplier(trudnosc) * 10) / 10,
  }));

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated">
      <h2 className="text-xl font-semibold">Waga zadań</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Jak liczony jest udział zadania w obowiązku i % wykonania per domownik.
      </p>

      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface/60 px-4 py-3">
        <p className="font-mono text-sm">{WEIGHT_FORMULA_LATEX}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">czas</dt>
            <dd>szacowane minuty zadania (max {maksCzasMinut})</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">TRUDNOSC</dt>
            <dd>ważność zadania (1 … {maksTrudnosc})</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">MAKS_TRUDNOSC</dt>
            <dd>{maksTrudnosc} — skalę można podnieść w konfiguracji</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">min. waga</dt>
            <dd>{minWaga}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 overflow-x-auto">
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

      <p className="mt-3 text-xs text-muted-foreground">
        Konfiguracja: <code className="text-foreground">src/config/choreWeight.ts</code>
      </p>
    </section>
  );
}
