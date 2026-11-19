import { PackageCheck, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FilterChip } from "@/components/FilterChip";
import { SplitDialog } from "@/components/bills/SplitDialog";
import { FoodForm } from "@/components/kitchen/FoodForm";
import { PrivateBadge } from "@/components/VisibilityPicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useHousehold } from "@/context/HouseholdContext";
import type { KitchenData } from "@/hooks/useKitchen";
import {
  daysAgoLabel,
  findProduct,
  newPurchase,
  rememberAdded,
  rememberBought,
  stockLabel,
} from "@/lib/bills";
import {
  addToFridge,
  FOOD_CATEGORIES,
  formatAmount,
  newShoppingItem,
} from "@/lib/kitchen";
import { formatPLN, parsePLN, toInputPLN } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { PurchaseLine, ShoppingItem } from "@/types";

type Scope = "all" | "public" | "private";
type AfterBuy = "fridge" | "remove";

const isPrivate = (item: ShoppingItem) => item.visibility === "private";

export function ShoppingPanel({ kitchen }: { kitchen: KitchenData }) {
  const {
    shopping,
    setShopping,
    setFridge,
    products,
    setProducts,
    setPurchases,
  } = kitchen;
  const { canEditItem, hasAccount } = useHousehold();
  const [scope, setScope] = useState<Scope>("all");
  const [splitFor, setSplitFor] = useState<AfterBuy | null>(null);

  const visible = shopping.filter(
    (item) => scope === "all" || (scope === "private") === isPrivate(item),
  );
  const bought = shopping.filter((s) => s.checked);
  const sharedLines = useMemo<PurchaseLine[]>(
    () =>
      bought
        .filter((s) => !isPrivate(s) && (s.price ?? 0) > 0)
        .map((s) => ({
          name: s.name,
          amount: s.amount,
          unit: s.unit,
          price: s.price!,
        })),
    [bought],
  );

  const finishBought = (after: AfterBuy) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      rememberBought(
        prev,
        bought.map((s) => ({
          name: s.name,
          amount: s.amount,
          unit: s.unit,
          category: s.category,
          price: s.price ?? null,
          visibility: isPrivate(s) ? "private" : "public",
        })),
        now,
      ),
    );
    if (after === "fridge") {
      setFridge((prev) =>
        addToFridge(
          prev,
          bought
            // Zapasy (chemia) mają swoją zakładkę — nie do lodówki
            .filter((s) => !findProduct(products, s.name)?.supply)
            .map((s) => ({
              name: s.name,
              amount: s.amount,
              unit: s.unit,
              category: s.category,
              visibility: isPrivate(s) ? "private" : "public",
              emoji: s.emoji,
              color: s.color,
            })),
        ),
      );
    }
    const ids = new Set(bought.map((s) => s.id));
    setShopping((prev) => prev.filter((s) => !ids.has(s.id)));
    toast.success(
      after === "fridge"
        ? `Kupione i schowane: ${bought.length}`
        : `Kupione: ${bought.length}`,
    );
  };

  const startFinish = (after: AfterBuy) => {
    if (sharedLines.length > 0) setSplitFor(after);
    else finishBought(after);
  };

  const setPrice = (item: ShoppingItem, price: number | null) =>
    setShopping((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, price } : s)),
    );

  return (
    <div className="space-y-5">
      <FoodForm
        placeholder="Czego brakuje? np. chleb"
        withPrice
        products={products}
        onAdd={(input) => {
          setShopping((prev) => [
            ...prev,
            { ...newShoppingItem(input), price: input.price ?? null },
          ]);
          setProducts((prev) =>
            rememberAdded(prev, input, new Date().toISOString()),
          );
        }}
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
            Kupione: <strong>{bought.length}</strong>
            {sharedLines.length > 0 && (
              <>
                {" "}
                · wspólne za{" "}
                <strong>
                  {formatPLN(sharedLines.reduce((s, l) => s + l.price, 0))}
                </strong>{" "}
                — podzielimy koszt
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => startFinish("fridge")}>
              <PackageCheck className="size-4" />
              Do lodówki
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startFinish("remove")}
            >
              Tylko odhacz
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
                    <ShoppingRow
                      key={item.id}
                      item={item}
                      lastBoughtAt={
                        findProduct(
                          products,
                          item.name,
                          isPrivate(item) ? "private" : "public",
                        )?.lastBoughtAt ?? null
                      }
                      canDelete={canEditItem(item)}
                      onToggle={() =>
                        setShopping((prev) =>
                          prev.map((s) =>
                            s.id === item.id
                              ? { ...s, checked: !s.checked }
                              : s,
                          ),
                        )
                      }
                      onPrice={(price) => setPrice(item, price)}
                      onDelete={() =>
                        setShopping((prev) =>
                          prev.filter((s) => s.id !== item.id),
                        )
                      }
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <SplitDialog
        open={splitFor !== null}
        onOpenChange={(open) => !open && setSplitFor(null)}
        lines={sharedLines}
        defaultTitle={`Zakupy ${new Date().toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "short",
        })}`}
        description="Wspólne pozycje z ceną — wszyscy zobaczą, co kupiono i kto ile oddaje. Prywatne zostają tylko u Ciebie."
        onSkip={() => {
          const after = splitFor!;
          setSplitFor(null);
          finishBought(after);
        }}
        onConfirm={(result) => {
          const after = splitFor!;
          setSplitFor(null);
          setPurchases((prev) => [
            newPurchase(result, sharedLines, hasAccount),
            ...prev,
          ]);
          finishBought(after);
          toast.success("Zakup podzielony — widać go w Rachunkach");
        }}
      />
    </div>
  );
}

function ShoppingRow({
  item,
  lastBoughtAt,
  canDelete,
  onToggle,
  onPrice,
  onDelete,
}: {
  item: ShoppingItem;
  lastBoughtAt: string | null;
  canDelete: boolean;
  onToggle: () => void;
  onPrice: (price: number | null) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const added = daysAgoLabel(item.createdAt);
  const boughtAgo = daysAgoLabel(lastBoughtAt);

  const save = () => {
    setEditing(false);
    const value = draft.trim() ? parsePLN(draft) : null;
    if (draft.trim() && value === null) {
      toast.error("Nie rozumiem tej ceny — np. 12,50");
      return;
    }
    if (value !== (item.price ?? null)) onPrice(value);
  };

  return (
    <li
      className="flex items-center gap-3 border-l-4 px-3 py-2.5 sm:px-4"
      style={{
        borderLeftColor: item.color ? `var(--${item.color})` : "transparent",
      }}
    >
      <Checkbox
        checked={item.checked}
        onCheckedChange={onToggle}
        aria-label={`Kupione: ${item.name}`}
        className="size-5"
      />
      {item.emoji && (
        <span className="text-xl" aria-hidden>
          {item.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "truncate font-medium",
              item.checked && "text-muted-foreground line-through",
            )}
          >
            {item.name}
          </span>
          {isPrivate(item) && <PrivateBadge />}
          {item.reason && item.reason !== "ok" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                item.reason === "out"
                  ? "bg-alert/20 text-alert"
                  : "bg-warn/20 text-warn",
              )}
            >
              {stockLabel(item.reason)}
            </span>
          )}
        </div>
        {(added || boughtAgo) && (
          <p className="truncate text-[11px] text-muted-foreground">
            {added && `dodane ${added}`}
            {added && boughtAgo && " · "}
            {boughtAgo && `ostatnio kupione ${boughtAgo}`}
          </p>
        )}
      </div>
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
        {formatAmount(item.amount, item.unit)}
      </span>
      {editing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          inputMode="decimal"
          placeholder="zł"
          className="h-8 w-20 text-right"
          aria-label={`Cena: ${item.name}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(toInputPLN(item.price));
            setEditing(true);
          }}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-sm tabular-nums transition-colors hover:bg-muted",
            item.price ? "font-medium" : "text-muted-foreground/60",
          )}
          aria-label={`Ustaw cenę: ${item.name}`}
        >
          {item.price ? formatPLN(item.price) : "+ cena"}
        </button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label={`Usuń ${item.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
}
