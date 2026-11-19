import {
  Minus,
  Plus,
  Refrigerator,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FilterChip } from "@/components/FilterChip";
import { FoodForm } from "@/components/kitchen/FoodForm";
import { PrivateBadge } from "@/components/VisibilityPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHousehold } from "@/context/HouseholdContext";
import type { KitchenData } from "@/hooks/useKitchen";
import {
  addToFridge,
  daysToExpiry,
  FOOD_CATEGORIES,
  foodKey,
  formatAmount,
  newShoppingItem,
} from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { FridgeItem } from "@/types";

type Scope = "all" | "public" | "private";

/** Krok +/− zależny od jednostki */
function stepFor(unit: string) {
  if (unit === "g" || unit === "ml") return 100;
  if (unit === "kg" || unit === "l") return 0.5;
  return 1;
}

export function ExpiryBadge({ expiresOn }: { expiresOn: string | null }) {
  const days = daysToExpiry(expiresOn);
  if (days === null) return null;
  const label =
    days < 0
      ? "po terminie"
      : days === 0
        ? "termin dziś"
        : days === 1
          ? "jutro"
          : `${days} dni`;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        days < 0 && "bg-alert/20 text-alert",
        days >= 0 && days <= 2 && "bg-warn/20 text-warn",
        days > 2 && "bg-muted text-muted-foreground",
      )}
      title={`Ważne do ${expiresOn}`}
    >
      {label}
    </span>
  );
}

export function FridgePanel({ kitchen }: { kitchen: KitchenData }) {
  const { fridge, setFridge, setShopping } = kitchen;
  const { canEditItem } = useHousehold();
  const [scope, setScope] = useState<Scope | "staple">("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return fridge.filter(
      (item) =>
        (scope === "all" ||
          (scope === "staple"
            ? item.staple
            : (scope === "private") === (item.visibility === "private"))) &&
        (!q || item.name.toLowerCase().includes(q)),
    );
  }, [fridge, scope, search]);

  const expiring = fridge.filter((f) => {
    const d = daysToExpiry(f.expiresOn);
    return d !== null && d <= 2;
  });

  /** Dopisuje do zakupów, chyba że już tam czeka (wtedy tylko oznacza) */
  const addToShopping = (item: FridgeItem, reason: "low" | "out") => {
    const visibility = item.visibility === "private" ? "private" : "public";
    let added = false;
    setShopping((prev) => {
      const index = prev.findIndex(
        (s) =>
          !s.checked &&
          foodKey(s.name) === foodKey(item.name) &&
          (s.visibility === "private" ? "private" : "public") === visibility,
      );
      if (index >= 0) {
        return prev.map((s, i) => (i === index ? { ...s, reason } : s));
      }
      added = true;
      return [
        ...prev,
        {
          ...newShoppingItem({
            name: item.name,
            amount: null,
            unit: item.unit,
            category: item.category,
            visibility,
            emoji: item.emoji,
            color: item.color,
          }),
          reason,
        },
      ];
    });
    return added;
  };

  const changeAmount = (item: FridgeItem, delta: number) => {
    const raw = Math.round(((item.amount ?? 0) + delta) * 100) / 100;
    // Stały produkt zostaje przy zerze (z oznaczeniem „Brak”)
    const next = item.staple ? Math.max(0, raw) : raw;
    if (item.staple && (item.amount ?? 0) <= 0 && delta < 0) return;
    setFridge((prev) =>
      next <= 0 && !item.staple
        ? prev.filter((f) => f.id !== item.id)
        : prev.map((f) => (f.id === item.id ? { ...f, amount: next } : f)),
    );
    if (next <= 0) {
      addToShopping(item, "out");
      toast(`${item.name} — skończyło się, dopisane do zakupów`);
    }
  };

  const toShopping = (item: FridgeItem) => {
    addToShopping(item, "low");
    toast.success(`${item.name} — kończy się, dopisane do zakupów`);
  };

  return (
    <div className="space-y-5">
      <FoodForm
        placeholder="Co jest w lodówce? np. mleko"
        withExpiry
        withStaple
        products={kitchen.products}
        onAdd={(input) => setFridge((prev) => addToFridge(prev, [input]))}
      />

      {expiring.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
          <span className="font-medium">Zjedz najpierw:</span>
          {expiring.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1.5">
              {f.name} <ExpiryBadge expiresOn={f.expiresOn} />
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj w lodówce…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
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
          <FilterChip
            active={scope === "staple"}
            onClick={() => setScope("staple")}
          >
            Stałe
          </FilterChip>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <Refrigerator className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            {fridge.length === 0 ? "Lodówka jest pusta" : "Nic nie pasuje"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fridge.length === 0
              ? "Dopisz produkty — albo przenieś kupione z listy zakupów."
              : "Zmień filtr albo wyszukiwanie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {FOOD_CATEGORIES.map((cat) => {
            const items = visible.filter((f) => f.category === cat.id);
            if (items.length === 0) return null;
            return (
              <section key={cat.id} className="min-w-0">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {cat.label} · {items.length}
                </h3>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                  {items.map((item) => {
                    const editable = canEditItem(item);
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center gap-2 border-l-4 px-3 py-2.5 sm:px-4",
                          item.staple &&
                            (item.amount ?? 0) <= 0 &&
                            "opacity-70",
                        )}
                        style={{
                          borderLeftColor: item.color
                            ? `var(--${item.color})`
                            : "transparent",
                        }}
                      >
                        {item.emoji && (
                          <span className="text-xl" aria-hidden>
                            {item.emoji}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate font-medium">
                              {item.name}
                            </span>
                            {item.visibility === "private" && <PrivateBadge />}
                            {item.staple && (item.amount ?? 0) <= 0 && (
                              <span className="rounded-full bg-alert/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-alert">
                                Brak
                              </span>
                            )}
                            <ExpiryBadge expiresOn={item.expiresOn} />
                          </div>
                        </div>
                        {item.amount !== null || item.staple ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() =>
                                changeAmount(item, -stepFor(item.unit))
                              }
                              aria-label={`Mniej: ${item.name}`}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <span className="min-w-14 text-center text-sm tabular-nums">
                              {formatAmount(item.amount ?? 0, item.unit)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() =>
                                changeAmount(item, stepFor(item.unit))
                              }
                              aria-label={`Więcej: ${item.name}`}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {formatAmount(null, item.unit)}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          onClick={() => toShopping(item)}
                          title="Kończy się — dopisz do zakupów"
                          aria-label={`${item.name} kończy się — dopisz do zakupów`}
                        >
                          <ShoppingCart className="size-4" />
                        </Button>
                        {editable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setFridge((prev) =>
                                prev.filter((f) => f.id !== item.id),
                              )
                            }
                            aria-label={`Usuń ${item.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
