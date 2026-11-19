import { CalendarPlus, ChefHat, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useScope } from "@/context/ScopeContext";
import type { KitchenData } from "@/hooks/useKitchen";
import { addMissingToShopping } from "@/lib/bills";
import {
  applyDeductions,
  formatAmount,
  ingredientStatus,
  missingIngredients,
  planCooking,
  type Deduction,
} from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

const QUICK = [50, 100, 150, 200];

function portionsLabel(n: number) {
  const rounded = Math.round(n * 10) / 10;
  const text = String(rounded).replace(".", ",");
  return `${text} ${rounded === 1 ? "porcja" : rounded < 5 && Number.isInteger(rounded) ? "porcje" : "porcji"}`;
}

/**
 * „Gotuję”: ile procent przepisu (suwak), czego brakuje, czy odjąć
 * z lodówki (z poprawką ilości) — albo tylko zaplanować na później.
 */
export function CookDialog({
  recipe,
  kitchen,
  initialScale = 1,
  onClose,
  onCooked,
}: {
  recipe: Recipe;
  kitchen: KitchenData;
  initialScale?: number;
  onClose: () => void;
  onCooked: () => void;
}) {
  const { fridge, setFridge, shopping, setShopping, products, setPlans } =
    kitchen;
  const { scope } = useScope();
  const [percent, setPercent] = useState(() =>
    Math.min(300, Math.max(25, Math.round(initialScale * 100))),
  );
  const scale = percent / 100;
  const [deduct, setDeduct] = useState(true);

  const statuses = useMemo(
    () => recipe.ingredients.map((i) => ingredientStatus(i, fridge, scale)),
    [recipe, fridge, scale],
  );
  const missing = useMemo(
    () => missingIngredients(recipe, fridge, scale),
    [recipe, fridge, scale],
  );
  const plan = useMemo(
    () => planCooking(recipe, fridge, scale),
    [recipe, fridge, scale],
  );

  // Poprawki ilości i odznaczenia — od nowa przy zmianie proporcji
  const [chosen, setChosen] = useState<boolean[]>([]);
  const [amounts, setAmounts] = useState<string[]>([]);
  useEffect(() => {
    setChosen(plan.map((d) => d.exact));
    setAmounts(
      plan.map((d) =>
        d.amount === null ? "" : String(d.amount).replace(".", ","),
      ),
    );
  }, [plan]);

  const addMissing = () => {
    const { next, added } = addMissingToShopping(
      shopping,
      missing,
      products,
      scope,
    );
    setShopping(next);
    toast.success(
      added > 0
        ? `Dopisano do zakupów: ${added}`
        : "Wszystko brakujące już jest na liście",
    );
  };

  const schedule = () => {
    setPlans((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        recipeId: recipe.id,
        recipeName: recipe.name,
        emoji: recipe.emoji,
        scale,
        plannedFor: null,
        ...(scope === "private" ? { visibility: "private" as const } : {}),
      },
    ]);
    toast.success("Zaplanowane — w Zakupach widać, czego brakuje");
    onClose();
  };

  const cooked = () => {
    if (deduct) {
      const final: Deduction[] = plan.flatMap((d, i) => {
        if (!chosen[i]) return [];
        const typed = Number((amounts[i] ?? "").replace(",", "."));
        return [
          {
            ...d,
            amount:
              d.amount === null || !(amounts[i] ?? "").trim()
                ? d.amount
                : Number.isFinite(typed) && typed >= 0
                  ? typed
                  : d.amount,
          },
        ];
      });
      setFridge((prev) => applyDeductions(prev, final));
    }
    // Ugotowane — plan tego przepisu jest już nieaktualny
    setPlans((prev) => prev.filter((p) => p.recipeId !== recipe.id));
    toast.success(deduct ? "Smacznego! Lodówka zaktualizowana." : "Smacznego!");
    onCooked();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hh-scroll max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{recipe.emoji}</span>
            Gotuję: {recipe.name}
          </DialogTitle>
          <DialogDescription>
            Wybierz, ile przepisu robisz — ilości przeliczą się same.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-light tabular-nums">{percent}%</span>
            <span className="text-sm text-muted-foreground">
              {portionsLabel(recipe.servings * scale)}
            </span>
          </div>
          <Slider
            min={25}
            max={300}
            step={5}
            value={[percent]}
            onValueChange={([v]) => v && setPercent(v)}
            aria-label="Ile procent przepisu"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPercent(q)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs",
                  percent === q
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {q === 100 ? "cały przepis" : `${q}%`}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Składniki
          </h3>
          <ul className="divide-y divide-border rounded-2xl border border-border text-sm">
            {statuses.map((s, i) => (
              <li
                key={`${s.ingredient.name}-${i}`}
                className="flex gap-2 px-3 py-2"
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    !s.enough && !s.ingredient.optional && "text-alert",
                  )}
                >
                  {s.ingredient.name}
                  {s.ingredient.optional && (
                    <span className="text-muted-foreground"> (opcj.)</span>
                  )}
                </span>
                <span className="tabular-nums">
                  {s.needed === null
                    ? "do smaku"
                    : formatAmount(s.needed, s.ingredient.unit)}
                </span>
                <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">
                  {s.matches.length === 0
                    ? "brak"
                    : s.available === null
                      ? "jest"
                      : `jest ${formatAmount(s.available, s.ingredient.unit)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {missing.length > 0 && (
          <section className="space-y-2 rounded-2xl border border-alert/40 bg-alert/5 p-3">
            <p className="text-sm font-medium">
              Brakuje: {missing.map((m) => m.name).join(", ")}
            </p>
            <Button size="sm" variant="outline" onClick={addMissing}>
              <ShoppingCart className="size-4" />
              Dopisz brakujące do zakupów
            </Button>
          </section>
        )}

        <section className="space-y-2">
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            Odjąć zużyte z lodówki?
            <Switch checked={deduct} onCheckedChange={setDeduct} />
          </label>
          {deduct &&
            (plan.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Żaden składnik nie pasuje do produktów w lodówce.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {plan.map((d, i) => (
                  <li
                    key={`${d.itemId}-${i}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <Checkbox
                      checked={chosen[i] ?? false}
                      onCheckedChange={(v) =>
                        setChosen((prev) =>
                          prev.map((c, j) => (j === i ? v === true : c)),
                        )
                      }
                      aria-label={`Odejmij ${d.itemName}`}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {d.itemName}
                    </span>
                    {d.amount === null ? (
                      <span className="text-xs text-muted-foreground">
                        cały produkt
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        −
                        <Input
                          value={amounts[i] ?? ""}
                          onChange={(e) =>
                            setAmounts((prev) =>
                              prev.map((a, j) =>
                                j === i ? e.target.value : a,
                              ),
                            )
                          }
                          inputMode="decimal"
                          className="h-7 w-16 text-right"
                          aria-label={`Ile odjąć: ${d.itemName}`}
                        />
                        {d.unit}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </section>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={schedule}>
            <CalendarPlus className="size-4" />
            Zaplanuj
          </Button>
          <Button onClick={cooked}>
            <ChefHat className="size-4" />
            Ugotowane
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
