import {
  Check,
  ChefHat,
  Clock,
  Gauge,
  Lock,
  Minus,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMemberNames } from "@/hooks/useKitchenPrefs";
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
import type { KitchenData } from "@/hooks/useKitchen";
import {
  applyDeductions,
  DIFFICULTY_LABELS,
  formatAmount,
  ingredientStatus,
  missingIngredients,
  newShoppingItem,
  planCooking,
  type Deduction,
} from "@/lib/kitchen";
import { deleteRecipe } from "@/lib/recipes";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

export function ShareBadge({ recipe }: { recipe: Recipe }) {
  const icon =
    recipe.share === "all" ? (
      <Users className="size-3" />
    ) : recipe.share === "people" ? (
      <UserCheck className="size-3" />
    ) : (
      <Lock className="size-3" />
    );
  const label =
    recipe.share === "all"
      ? "Wszyscy"
      : recipe.share === "people"
        ? `${recipe.sharedWith.length} ${recipe.sharedWith.length === 1 ? "osoba" : "osoby"}`
        : "Prywatny";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        recipe.share === "private"
          ? "border-warn/40 bg-warn/15 text-warn"
          : "border-border bg-muted/50 text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export function RecipeView({
  recipe,
  kitchen,
  onClose,
  onEdit,
}: {
  recipe: Recipe;
  kitchen: KitchenData;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { fridge, setFridge, setShopping, uid, householdId } = kitchen;
  const mine = recipe.createdBy === uid;
  const names = useMemberNames();
  const [servings, setServings] = useState(recipe.servings);
  const [cooking, setCooking] = useState(false);
  const scale = servings / recipe.servings;

  const statuses = useMemo(
    () => recipe.ingredients.map((i) => ingredientStatus(i, fridge, scale)),
    [recipe, fridge, scale],
  );
  const missing = missingIngredients(recipe, fridge, scale);
  const sharedNames = recipe.sharedWith
    .map((u) => names.find((n) => n.uid === u)?.name ?? "konto")
    .join(", ");

  const addMissing = () => {
    setShopping((prev) => [
      ...prev,
      ...missing.map((m) =>
        newShoppingItem({
          ...m,
          category: "other",
          visibility: "public",
        }),
      ),
    ]);
    toast.success(`Dopisano do zakupów: ${missing.length}`);
  };

  const remove = async () => {
    if (!householdId) return;
    try {
      await deleteRecipe(householdId, recipe.id);
      toast.success("Usunięto przepis.");
      onClose();
    } catch (err) {
      console.error("Recipe delete failed:", err);
      toast.error("Nie udało się usunąć przepisu.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hh-scroll max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-4xl">
              {recipe.emoji}
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {recipe.category}
                <ShareBadge recipe={recipe} />
                {!mine && recipe.authorName && (
                  <span>· od {recipe.authorName}</span>
                )}
              </div>
              <DialogTitle className="text-2xl leading-tight">
                {recipe.name}
              </DialogTitle>
              {recipe.description ? (
                <DialogDescription>{recipe.description}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Przepis
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <MetaChip icon={<Clock className="size-3.5" />}>
            {recipe.prepMinutes + recipe.cookMinutes} min
            <span className="text-muted-foreground">
              {" "}
              ({recipe.prepMinutes} + {recipe.cookMinutes})
            </span>
          </MetaChip>
          <MetaChip icon={<Gauge className="size-3.5" />}>
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </MetaChip>
          <div className="inline-flex items-center gap-1 rounded-xl border border-border px-1.5 py-1 text-sm">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={servings <= 1}
              onClick={() => setServings((s) => s - 1)}
              aria-label="Mniej porcji"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="min-w-20 text-center tabular-nums">
              {servings}{" "}
              {servings === 1 ? "porcja" : servings < 5 ? "porcje" : "porcji"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setServings((s) => s + 1)}
              aria-label="Więcej porcji"
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Składniki
            </h3>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {statuses.map((s) => (
                <li
                  key={s.ingredient.name}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                >
                  {s.enough ? (
                    <Check className="size-4 shrink-0 text-safe" />
                  ) : (
                    <X
                      className={cn(
                        "size-4 shrink-0",
                        s.ingredient.optional
                          ? "text-muted-foreground"
                          : "text-alert",
                      )}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {s.ingredient.name}
                    {s.ingredient.optional && (
                      <span className="text-muted-foreground"> (opcj.)</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {s.needed === null
                      ? "do smaku"
                      : formatAmount(s.needed, s.ingredient.unit)}
                  </span>
                </li>
              ))}
            </ul>
            {missing.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addMissing}
              >
                <ShoppingCart className="size-4" />
                Brakujące do zakupów ({missing.length})
              </Button>
            ) : (
              <p className="text-xs text-safe">Masz wszystko w lodówce.</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Przygotowanie
            </h3>
            {recipe.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak kroków.</p>
            ) : (
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <p className="whitespace-pre-line pt-0.5 text-sm leading-relaxed">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {recipe.notes && (
              <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                💡 {recipe.notes}
              </p>
            )}
          </section>
        </div>

        {mine && recipe.share === "people" && sharedNames && (
          <p className="text-xs text-muted-foreground">
            Udostępniony: {sharedNames}
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex gap-2">
            {mine && (
              <>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => void remove()}
                >
                  <Trash2 className="size-4" />
                  Usuń
                </Button>
                <Button variant="outline" onClick={onEdit}>
                  <Pencil className="size-4" />
                  Edytuj
                </Button>
              </>
            )}
          </div>
          <Button onClick={() => setCooking(true)}>
            <ChefHat className="size-4" />
            Ugotowane — zdejmij z lodówki
          </Button>
        </DialogFooter>

        {cooking && (
          <CookDialog
            deductions={planCooking(recipe, fridge, scale)}
            onClose={() => setCooking(false)}
            onConfirm={(chosen) => {
              setFridge((prev) => applyDeductions(prev, chosen));
              setCooking(false);
              toast.success(
                chosen.length > 0
                  ? `Smacznego! Z lodówki zdjęto ${chosen.length} ${chosen.length === 1 ? "pozycję" : "pozycje"}.`
                  : "Smacznego!",
              );
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Potwierdzenie: co dokładnie zniknie z lodówki */
function CookDialog({
  deductions,
  onClose,
  onConfirm,
}: {
  deductions: Deduction[];
  onClose: () => void;
  onConfirm: (chosen: Deduction[]) => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    deductions.map((d) => d.exact),
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Co zużyłeś?</DialogTitle>
          <DialogDescription>
            Zaznaczone pozycje zdejmiemy z lodówki. Gdy ilości nie da się
            policzyć, zdecyduj sam — zaznacz, jeśli produkt się skończył.
          </DialogDescription>
        </DialogHeader>
        {deductions.length === 0 ? (
          <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
            Żaden składnik nie pasuje do produktów w lodówce — nic nie
            zdejmujemy.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {deductions.map((d, i) => (
              <li key={`${d.itemId}-${i}`}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm">
                  <Checkbox
                    checked={checked[i]}
                    onCheckedChange={(v) =>
                      setChecked((prev) =>
                        prev.map((c, j) => (j === i ? v === true : c)),
                      )
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {d.itemName}
                    </span>
                    {d.ingredientName.toLowerCase() !==
                      d.itemName.toLowerCase() && (
                      <span className="block truncate text-xs text-muted-foreground">
                        jako: {d.ingredientName}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {d.amount === null
                      ? "cały produkt"
                      : `− ${formatAmount(d.amount, d.unit)}`}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={() => onConfirm(deductions.filter((_, i) => checked[i]))}
          >
            Zatwierdź
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm">
      {icon}
      {children}
    </span>
  );
}
