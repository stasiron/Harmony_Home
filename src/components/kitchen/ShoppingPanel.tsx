import { PackageCheck, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FilterChip } from "@/components/FilterChip";
import { FoodForm } from "@/components/kitchen/FoodForm";
import { PrivateBadge } from "@/components/VisibilityPicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useHousehold } from "@/context/HouseholdContext";
import type { KitchenData } from "@/hooks/useKitchen";
import {
  addToFridge,
  FOOD_CATEGORIES,
  formatAmount,
  newShoppingItem,
} from "@/lib/kitchen";
import { cn } from "@/lib/utils";

type Scope = "all" | "public" | "private";

export function ShoppingPanel({ kitchen }: { kitchen: KitchenData }) {
  const { shopping, setShopping, setFridge } = kitchen;
  const { canEditItem } = useHousehold();
  const [scope, setScope] = useState<Scope>("all");

  const visible = shopping.filter(
    (item) =>
      scope === "all" ||
      (scope === "private") === (item.visibility === "private"),
  );
  const bought = shopping.filter((s) => s.checked);

  const moveToFridge = () => {
    setFridge((prev) =>
      addToFridge(
        prev,
        bought.map((s) => ({
          name: s.name,
          amount: s.amount,
          unit: s.unit,
          category: s.category,
          visibility: s.visibility === "private" ? "private" : "public",
        })),
      ),
    );
    const ids = new Set(bought.map((s) => s.id));
    setShopping((prev) => prev.filter((s) => !ids.has(s.id)));
    toast.success(
      `Do lodówki: ${bought.length} ${bought.length === 1 ? "produkt" : "produkty"}`,
    );
  };

  return (
    <div className="space-y-5">
      <FoodForm
        storageKey="kitchen-shopping-visibility"
        placeholder="Czego brakuje? np. chleb"
        onAdd={(input) =>
          setShopping((prev) => [...prev, newShoppingItem(input)])
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={scope === "all"} onClick={() => setScope("all")}>
          Wszystko
        </FilterChip>
        <FilterChip
          active={scope === "public"}
          onClick={() => setScope("public")}
        >
          Wspólne
        </FilterChip>
        <FilterChip
          active={scope === "private"}
          onClick={() => setScope("private")}
        >
          Moje prywatne
        </FilterChip>
      </div>

      {bought.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-safe/40 bg-safe/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            Kupione: <strong>{bought.length}</strong> — schować do lodówki?
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={moveToFridge}>
              <PackageCheck className="size-4" />
              Przenieś do lodówki
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setShopping((prev) => prev.filter((s) => !s.checked))
              }
            >
              Usuń kupione
            </Button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <ShoppingCart className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            {shopping.length === 0
              ? "Lista zakupów jest pusta"
              : "Nic tu nie ma"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dopisz, czego brakuje — albo dodaj brakujące składniki z przepisu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {FOOD_CATEGORIES.map((cat) => {
            const items = visible.filter((s) => s.category === cat.id);
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="min-w-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {cat.label} · {items.length}
                </h3>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() =>
                          setShopping((prev) =>
                            prev.map((s) =>
                              s.id === item.id
                                ? { ...s, checked: !s.checked }
                                : s,
                            ),
                          )
                        }
                        aria-label={`Kupione: ${item.name}`}
                        className="size-5"
                      />
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "truncate font-medium",
                            item.checked &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {item.name}
                        </span>
                        {item.visibility === "private" && <PrivateBadge />}
                      </div>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {formatAmount(item.amount, item.unit)}
                      </span>
                      {canEditItem(item) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setShopping((prev) =>
                              prev.filter((s) => s.id !== item.id),
                            )
                          }
                          aria-label={`Usuń ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
