import { createFileRoute } from "@tanstack/react-router";
import {
  AlarmClock,
  BookOpen,
  ChefHat,
  Refrigerator,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { FridgePanel } from "@/components/kitchen/FridgePanel";
import { RecipesPanel } from "@/components/kitchen/RecipesPanel";
import { ShoppingPanel } from "@/components/kitchen/ShoppingPanel";
import { useKitchen } from "@/hooks/useKitchen";
import { daysToExpiry, recipeAvailability } from "@/lib/kitchen";
import { cn } from "@/lib/utils";

type Tab = "fridge" | "shopping" | "recipes";
const TABS: Tab[] = ["fridge", "shopping", "recipes"];

export const Route = createFileRoute("/kitchen")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(search.tab as Tab) ? { tab: search.tab as Tab } : {},
  head: () => ({
    meta: [
      { title: "Kuchnia · Homebase" },
      {
        name: "description",
        content: "Lodówka, lista zakupów i przepisy całego domu.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <KitchenPage />
    </Shell>
  ),
});

/** Centrum dowodzenia kuchnią: co jest, czego brakuje, co ugotować */
function KitchenPage() {
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(initialTab ?? "fridge");
  const kitchen = useKitchen();
  const { fridge, shopping, recipes } = kitchen;

  const stats = useMemo(() => {
    const expiring = fridge.filter((f) => {
      const d = daysToExpiry(f.expiresOn);
      return d !== null && d <= 2;
    }).length;
    const toBuy = shopping.filter((s) => !s.checked).length;
    const ready = recipes.filter(
      (r) => recipeAvailability(r, fridge).ready,
    ).length;
    return { expiring, toBuy, ready };
  }, [fridge, shopping, recipes]);

  const tiles: {
    id: Tab;
    label: string;
    value: number;
    hint: string;
    icon: LucideIcon;
    tone?: "warn";
  }[] = [
    {
      id: "fridge",
      label: "Lodówka",
      value: fridge.length,
      hint:
        stats.expiring > 0
          ? `${stats.expiring} z krótkim terminem`
          : "produktów",
      icon: stats.expiring > 0 ? AlarmClock : Refrigerator,
      tone: stats.expiring > 0 ? "warn" : undefined,
    },
    {
      id: "shopping",
      label: "Zakupy",
      value: stats.toBuy,
      hint: "do kupienia",
      icon: ShoppingCart,
    },
    {
      id: "recipes",
      label: "Przepisy",
      value: recipes.length,
      hint:
        stats.ready > 0 ? `${stats.ready} do zrobienia od ręki` : "zapisanych",
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
          <ChefHat className="size-8 text-primary" strokeWidth={1.6} />
          Kuchnia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Co jest w lodówce, czego brakuje i co z tego ugotować.
        </p>
      </header>

      {/* Kafelki są też zakładkami */}
      <div role="tablist" className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map(({ id, label, value, hint, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all sm:flex-row sm:items-center sm:gap-4 sm:rounded-3xl sm:p-5",
              tab === id
                ? "border-primary/50 bg-primary/10 ring-2 ring-primary/15"
                : "border-border bg-surface hover:border-primary/30",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl sm:size-12 sm:rounded-2xl",
                tone === "warn"
                  ? "bg-warn/20 text-warn"
                  : tab === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/50 text-primary",
              )}
            >
              <Icon className="size-4 sm:size-6" strokeWidth={1.7} />
            </span>
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-sm font-semibold sm:text-lg">
                  {label}
                </span>
                <span className="text-lg font-light tabular-nums sm:text-2xl">
                  {value}
                </span>
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {hint}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "fridge" && <FridgePanel kitchen={kitchen} />}
        {tab === "shopping" && <ShoppingPanel kitchen={kitchen} />}
        {tab === "recipes" && <RecipesPanel kitchen={kitchen} />}
      </div>
    </div>
  );
}
