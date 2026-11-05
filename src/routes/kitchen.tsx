import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Shell } from "@/components/Shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShoppingCategory } from "@/types";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kuchnia · Homebase" },
      { name: "description", content: "Lista zakupów mieszkania." },
    ],
  }),
  component: () => (
    <Shell>
      <KitchenPage />
    </Shell>
  ),
});

const CATEGORY_ORDER: ShoppingCategory[] = [
  "produce",
  "dairy",
  "bakery",
  "pantry",
  "frozen",
  "household",
];

function KitchenPage() {
  const { shopping, toggleShopping, recipes, addShopping } = useApp();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Kuchnia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wspólna lista zakupów.
        </p>
      </header>

      <Tabs defaultValue="shopping">
        <TabsList>
          <TabsTrigger value="shopping">Zakupy</TabsTrigger>
          <TabsTrigger value="recipes">Przepisy · wkrótce</TabsTrigger>
        </TabsList>

        <TabsContent value="shopping" className="mt-6 space-y-6">
          {shopping.length === 0 ? (
            <EmptyPanel
              title="Lista zakupów jest pusta"
              description="Dopisz, czego brakuje — zobaczy to cały dom."
            />
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const items = shopping.filter((s) => s.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {cat}
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                    {items.map((s, idx) => (
                      <label
                        key={s.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated",
                          idx > 0 && "border-t border-border",
                        )}
                      >
                        <Checkbox
                          checked={s.checked}
                          onCheckedChange={() => toggleShopping(s.id)}
                        />
                        <span
                          className={cn(
                            "flex-1 min-w-0 truncate",
                            s.checked && "text-muted-foreground line-through",
                          )}
                        >
                          {s.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.qty}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="recipes" className="mt-6">
          {recipes.length === 0 ? (
            <EmptyPanel
              title="Przepisy — wkrótce"
              description="Ta część jest w przygotowaniu: zapisane przepisy dodadzą składniki do listy zakupów jednym kliknięciem."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-3xl">{r.emoji}</div>
                      <div className="mt-2 text-lg font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.timeMinutes} min
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {r.ingredients.map((i) => (
                      <li key={i.name} className="flex justify-between gap-2">
                        <span className="truncate">{i.name}</span>
                        <span className="shrink-0 text-xs">{i.qty}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="secondary"
                    className="mt-auto"
                    onClick={() => addShopping(r.ingredients)}
                  >
                    <Plus className="size-4" /> Add to shopping list
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
