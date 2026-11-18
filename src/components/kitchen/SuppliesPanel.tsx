import { Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { VisibilityToggle } from "@/components/kitchen/FoodForm";
import { PrivateBadge } from "@/components/VisibilityPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHousehold } from "@/context/HouseholdContext";
import type { KitchenData } from "@/hooks/useKitchen";
import { useRememberedVisibility } from "@/hooks/useKitchenPrefs";
import {
  changeStock,
  daysAgoLabel,
  needsRestock,
  productId,
  stockLabel,
  stockStateOf,
} from "@/lib/bills";
import { foodKey, formatAmount, newShoppingItem, UNITS } from "@/lib/kitchen";
import { formatPLN } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Product, StockState } from "@/types";

const SUGGESTIONS = [
  "Papier toaletowy",
  "Płyn do naczyń",
  "Worki na śmieci",
  "Ręczniki papierowe",
  "Mydło",
  "Proszek do prania",
  "Gąbki",
];

const visibilityOf = (p: Product) =>
  p.visibility === "private" ? "private" : "public";

/**
 * Zapasy domu (papier, płyn do naczyń…): ile jest, od ilu „kończy się”.
 * Zużycie −/+ — przy progu pozycja sama trafia na listę zakupów.
 */
export function SuppliesPanel({ kitchen }: { kitchen: KitchenData }) {
  const { products, setProducts, shopping, setShopping } = kitchen;
  const { canEditItem } = useHousehold();
  const supplies = products.filter((p) => p.supply);

  /** Na listę zakupów (albo tylko oznacz, jeśli już tam jest) */
  const restock = (product: Product, state: StockState) => {
    const visibility = visibilityOf(product);
    const existing = shopping.find(
      (s) =>
        !s.checked &&
        foodKey(s.name) === foodKey(product.name) &&
        (s.visibility === "private" ? "private" : "public") === visibility,
    );
    if (existing) {
      if (existing.reason !== state) {
        setShopping((prev) =>
          prev.map((s) => (s.id === existing.id ? { ...s, reason: state } : s)),
        );
      }
      return;
    }
    setShopping((prev) => [
      ...prev,
      {
        ...newShoppingItem({
          name: product.name,
          amount: null,
          unit: product.unit,
          category: product.category,
          visibility,
        }),
        reason: state,
        price: product.lastPrice,
      },
    ]);
    toast(
      `${product.name} — ${stockLabel(state).toLowerCase()}, dopisane do zakupów`,
    );
  };

  const update = (product: Product, next: Product) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id && visibilityOf(p) === visibilityOf(product)
          ? next
          : p,
      ),
    );
    if (needsRestock(next) && !needsRestock(product)) {
      restock(next, stockStateOf(next));
    }
  };

  const mark = (product: Product, state: StockState) => {
    const next: Product =
      state === "out"
        ? { ...product, stockAmount: 0, stock: "out" }
        : { ...product, stock: state };
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id && visibilityOf(p) === visibilityOf(product)
          ? next
          : p,
      ),
    );
    if (state !== "ok") restock(next, state);
  };

  return (
    <div className="space-y-5">
      <SupplyForm
        existing={supplies}
        onAdd={(product) =>
          setProducts((prev) => {
            const index = prev.findIndex(
              (p) =>
                p.id === product.id &&
                visibilityOf(p) === visibilityOf(product),
            );
            if (index < 0) return [...prev, product];
            // Produkt był już w pamięci (np. kupowany) — zostaje zapasem
            return prev.map((p, i) =>
              i === index
                ? {
                    ...p,
                    supply: true,
                    stockAmount: product.stockAmount,
                    lowAt: product.lowAt,
                    unit: product.unit,
                    stock: product.stock,
                  }
                : p,
            );
          })
        }
      />

      {supplies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <Package className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Brak zapasów</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dodaj np. papier toaletowy z progiem 2 — gdy zostaną dwie rolki,
            trafi na listę zakupów.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {supplies.map((product) => {
            const state = stockStateOf(product);
            const bought = daysAgoLabel(product.lastBoughtAt);
            return (
              <li
                key={`${visibilityOf(product)}-${product.id}`}
                className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate font-medium">{product.name}</span>
                    {product.visibility === "private" && <PrivateBadge />}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        state === "out" && "bg-alert/20 text-alert",
                        state === "low" && "bg-warn/20 text-warn",
                        state === "ok" && "bg-safe/15 text-safe",
                      )}
                    >
                      {stockLabel(state)}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {product.lowAt != null &&
                      `kończy się przy ${formatAmount(product.lowAt, product.unit)}`}
                    {bought && ` · kupione ${bought}`}
                    {product.lastPrice != null &&
                      ` · ostatnio ${formatPLN(product.lastPrice)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => update(product, changeStock(product, -1))}
                    aria-label={`Zużyte: ${product.name}`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-16 text-center text-sm tabular-nums">
                    {formatAmount(product.stockAmount ?? 0, product.unit)}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => update(product, changeStock(product, 1))}
                    aria-label={`Dołożone: ${product.name}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => mark(product, "low")}
                  >
                    Kończy się
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => mark(product, "out")}
                  >
                    Brak
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    onClick={() => restock(product, state)}
                    title="Dopisz do zakupów"
                    aria-label={`Dopisz ${product.name} do zakupów`}
                  >
                    <ShoppingCart className="size-4" />
                  </Button>
                  {canEditItem(product) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        // Zostaje w pamięci cen — tylko przestaje być zapasem
                        setProducts((prev) =>
                          prev.map((p) =>
                            p.id === product.id &&
                            visibilityOf(p) === visibilityOf(product)
                              ? { ...p, supply: false }
                              : p,
                          ),
                        )
                      }
                      aria-label={`Usuń z zapasów: ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SupplyForm({
  existing,
  onAdd,
}: {
  existing: Product[];
  onAdd: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("szt");
  const [lowAt, setLowAt] = useState("1");
  const [visibility, setVisibility] = useRememberedVisibility(
    "kitchen-supplies-visibility",
  );

  const number = (text: string) => {
    const n = Number(text.replace(",", "."));
    return text.trim() && Number.isFinite(n) && n >= 0 ? n : null;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const product: Product = {
      id: productId(name),
      name: name.trim(),
      category: "household",
      unit,
      lastPrice: null,
      lastAmount: null,
      lastBoughtAt: null,
      lastAddedAt: null,
      supply: true,
      stockAmount: number(amount) ?? 0,
      lowAt: number(lowAt),
      ...(visibility === "private" ? { visibility: "private" } : {}),
    };
    onAdd({ ...product, stock: stockStateOf(product) });
    setName("");
    setAmount("");
  };

  const missing = SUGGESTIONS.filter(
    (s) => !existing.some((p) => foodKey(p.name) === foodKey(s)),
  );

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-3 sm:p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Zapas, np. papier toaletowy"
          className="h-11 flex-1"
          aria-label="Nazwa zapasu"
        />
        <div className="flex gap-2">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Jest"
            className="h-11 w-20"
            aria-label="Ile jest"
          />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-11 w-24" aria-label="Jednostka">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.slice(0, 6).map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Kończy się przy
          <Input
            value={lowAt}
            onChange={(e) => setLowAt(e.target.value)}
            inputMode="decimal"
            className="h-9 w-16"
            aria-label="Próg „kończy się”"
          />
        </label>
        <VisibilityToggle value={visibility} onChange={setVisibility} />
        <Button type="submit" className="ml-auto h-9" disabled={!name.trim()}>
          <Plus className="size-4" />
          Dodaj zapas
        </Button>
      </div>
      {missing.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {missing.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
