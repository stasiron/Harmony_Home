import { BookOpen, Clock, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterChip } from "@/components/FilterChip";
import { RecipeEditor } from "@/components/kitchen/RecipeEditor";
import { RecipeView, ShareBadge } from "@/components/kitchen/RecipeView";
import { useMemberNames } from "@/hooks/useKitchenPrefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import type { KitchenData } from "@/hooks/useKitchen";
import { DIFFICULTY_LABELS, recipeAvailability } from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

type Scope = "all" | "mine" | "shared" | "ready";

export function RecipesPanel({ kitchen }: { kitchen: KitchenData }) {
  const { recipes, fridge, uid, householdId } = kitchen;
  const { hasAccount } = useHousehold();
  const { user } = useAuth();
  const names = useMemberNames();
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Recipe | "new" | null>(null);

  const withAvailability = useMemo(
    () => recipes.map((r) => ({ recipe: r, ...recipeAvailability(r, fridge) })),
    [recipes, fridge],
  );

  const visible = withAvailability.filter(({ recipe, ready }) => {
    const q = search.trim().toLowerCase();
    if (
      q &&
      !recipe.name.toLowerCase().includes(q) &&
      !recipe.ingredients.some((i) => i.name.toLowerCase().includes(q))
    ) {
      return false;
    }
    if (scope === "mine") return recipe.createdBy === uid;
    if (scope === "shared") return recipe.createdBy !== uid;
    if (scope === "ready") return ready;
    return true;
  });

  const open = recipes.find((r) => r.id === openId) ?? null;
  const myName =
    names.find((n) => n.uid === uid)?.name ?? user?.displayName ?? "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj przepisu albo składnika…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={scope === "all"} onClick={() => setScope("all")}>
            Wszystkie
          </FilterChip>
          <FilterChip
            active={scope === "ready"}
            onClick={() => setScope("ready")}
          >
            Mogę ugotować teraz
          </FilterChip>
          {hasAccount && (
            <FilterChip
              active={scope === "mine"}
              onClick={() => setScope("mine")}
            >
              Moje
            </FilterChip>
          )}
          <FilterChip
            active={scope === "shared"}
            onClick={() => setScope("shared")}
          >
            Udostępnione mi
          </FilterChip>
        </div>
        <Button
          className="lg:ml-auto"
          onClick={() => setEditing("new")}
          disabled={!hasAccount}
          title={hasAccount ? undefined : "Przepisy wymagają konta"}
        >
          <Plus className="size-4" />
          Nowy przepis
        </Button>
      </div>

      {!hasAccount && (
        <p className="text-xs text-muted-foreground">
          Na tym urządzeniu widać przepisy udostępnione wszystkim. Własne
          przepisy dodasz po zalogowaniu.
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <BookOpen className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            {recipes.length === 0 ? "Brak przepisów" : "Nic nie pasuje"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {recipes.length === 0
              ? "Zapisz ulubiony przepis — składniki, kroki, czas. Po ugotowaniu zdejmiemy produkty z lodówki."
              : scope === "ready"
                ? "Do żadnego przepisu nie masz jeszcze wszystkich składników."
                : "Zmień filtr albo wyszukiwanie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ recipe, have, total, ready }) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setOpenId(recipe.id)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl transition-transform group-hover:scale-105">
                  {recipe.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">
                    {recipe.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {recipe.prepMinutes + recipe.cookMinutes} min ·{" "}
                    {DIFFICULTY_LABELS[recipe.difficulty]} · {recipe.servings}{" "}
                    porc.
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      ready ? "text-safe" : "text-muted-foreground",
                    )}
                  >
                    {ready
                      ? "Masz wszystko"
                      : `W lodówce ${have} z ${total} składników`}
                  </span>
                  <ShareBadge recipe={recipe} />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      ready ? "bg-safe" : "bg-primary/60",
                    )}
                    style={{ width: `${total ? (have / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && editing === null && (
        <RecipeView
          recipe={open}
          kitchen={kitchen}
          onClose={() => setOpenId(null)}
          onEdit={() => setEditing(open)}
        />
      )}

      {editing !== null && householdId && uid && (
        <RecipeEditor
          householdId={householdId}
          uid={uid}
          authorName={myName}
          recipe={editing === "new" ? null : editing}
          onClose={(saved) => {
            setEditing(null);
            if (saved) setOpenId(saved.id);
          }}
        />
      )}
    </div>
  );
}
