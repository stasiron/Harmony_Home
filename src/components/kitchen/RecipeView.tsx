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
import { CookDialog } from "@/components/kitchen/CookDialog";
import { useScope } from "@/context/ScopeContext";
import { addMissingToShopping } from "@/lib/bills";
import {
  DIFFICULTY_LABELS,
  formatAmount,
  ingredientStatus,
  missingIngredients,
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
  inline = false,
}: {
  recipe: Recipe;
  kitchen: KitchenData;
  onClose: () => void;
  onEdit: () => void;
  /** Duży ekran: w prawej kolumnie zamiast okna */
  inline?: boolean;
}) {
  // Tytuł i opis okna działają tylko w oknie — w kolumnie zwykłe elementy
  const Title = inline ? "h2" : DialogTitle;
  const Description = inline ? "p" : DialogDescription;
  const { fridge, setShopping, uid, householdId } = kitchen;
  const { scope } = useScope();
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
    const { next, added } = addMissingToShopping(
      kitchen.shopping,
      missing,
      kitchen.products,
      scope,
    );
    setShopping(next);
    toast.success(
      added > 0
        ? `Dopisano do zakupów: ${added}`
        : "Wszystko brakujące już jest na liście",
    );
  };
  const planned = kitchen.plans.some((p) => p.recipeId === recipe.id);

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

  const body = (
    <>
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
            <Title className="text-2xl font-semibold leading-tight">
              {recipe.name}
            </Title>
            {recipe.description ? (
              <Description className="text-sm text-muted-foreground">
                {recipe.description}
              </Description>
            ) : (
              <Description className="sr-only">Przepis</Description>
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
        <div className="flex gap-2">
          {planned && (
            <span className="self-center rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
              Zaplanowany
            </span>
          )}
          <Button onClick={() => setCooking(true)}>
            <ChefHat className="size-4" />
            Gotuję / zaplanuj
          </Button>
        </div>
      </DialogFooter>

      {cooking && (
        <CookDialog
          recipe={recipe}
          kitchen={kitchen}
          initialScale={scale}
          onClose={() => setCooking(false)}
          onCooked={() => {
            setCooking(false);
            onClose();
          }}
        />
      )}
    </>
  );

  if (inline) {
    return (
      <section className="hh-scroll space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-elevated lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
        {body}
      </section>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hh-scroll max-h-[92vh] max-w-3xl overflow-y-auto">
        {body}
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
