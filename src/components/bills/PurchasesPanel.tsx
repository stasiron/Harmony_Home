import { FeatureGate } from "@/components/FeatureGate";
import { BellRing, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ShareList } from "@/components/bills/ShareList";
import { SplitDialog } from "@/components/bills/SplitDialog";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/context/HouseholdContext";
import type { BillsData } from "@/hooks/useBills";
import { usePeople } from "@/hooks/usePeople";
import { daysAgoLabel, markShare, newPurchase } from "@/lib/bills";
import { formatAmount } from "@/lib/kitchen";
import { formatPLN, openShare } from "@/lib/money";
import { notify } from "@/lib/push";
import { cn } from "@/lib/utils";
import type { Purchase } from "@/types";

/** Wspólne zakupy: kto kupił, za ile, kto już oddał; prośba o zwrot */
export function PurchasesPanel({ data }: { data: BillsData }) {
  const { purchases, setPurchases } = data;
  const { hasAccount } = useHousehold();
  const [adding, setAdding] = useState(false);

  const update = (next: Purchase) =>
    setPurchases((prev) => prev.map((p) => (p.id === next.id ? next : p)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Zakupy z Kuchni z ceną trafiają tu same. Inne wydatki dla domu dodasz
          ręcznie.
        </p>
        <FeatureGate feature="btn:expense">
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Dodaj wydatek
          </Button>
        </FeatureGate>
      </div>

      {purchases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <ShoppingBag className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Brak wspólnych zakupów</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Odhacz kupione wspólne rzeczy z ceną w Kuchni albo dodaj wydatek.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {purchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              onChange={update}
              onDelete={() =>
                setPurchases((prev) => prev.filter((p) => p.id !== purchase.id))
              }
            />
          ))}
        </div>
      )}

      <SplitDialog
        open={adding}
        onOpenChange={setAdding}
        defaultTitle=""
        description="Np. środki czystości, żarówki, wspólny prezent. Wszyscy zobaczą, kto ile oddaje."
        onConfirm={(result) => {
          setAdding(false);
          setPurchases((prev) => [
            newPurchase(result, [], hasAccount),
            ...prev,
          ]);
          toast.success("Wydatek dodany");
        }}
      />
    </div>
  );
}

function PurchaseCard({
  purchase,
  onChange,
  onDelete,
}: {
  purchase: Purchase;
  onChange: (purchase: Purchase) => void;
  onDelete: () => void;
}) {
  const { canEditItem, householdId } = useHousehold();
  const { nameOf, actorId } = usePeople();
  const open = Object.keys(purchase.shares).reduce(
    (sum, id) => sum + openShare(purchase, id),
    0,
  );
  const myDebt = actorId ? openShare(purchase, actorId) : 0;
  const isPayer = actorId === purchase.paidBy;
  const canRequest = isPayer || canEditItem(purchase);
  const requested = purchase.refundRequestedAt
    ? daysAgoLabel(purchase.refundRequestedAt)
    : null;

  return (
    <section
      className={cn(
        "space-y-3 rounded-2xl border bg-surface p-4",
        myDebt > 0 && purchase.refundRequestedAt
          ? "border-warn/60"
          : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{purchase.title}</h3>
          <p className="text-xs text-muted-foreground">
            {nameOf(purchase.paidBy)} · {daysAgoLabel(purchase.at)} ·{" "}
            <span className="font-medium text-foreground">
              {formatPLN(purchase.total)}
            </span>
          </p>
        </div>
        {canEditItem(purchase) && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`Usuń ${purchase.title}`}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {purchase.items.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Co kupione ({purchase.items.length})
          </summary>
          <ul className="mt-1 space-y-0.5">
            {purchase.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">
                  {item.name}{" "}
                  <span className="text-muted-foreground">
                    {formatAmount(item.amount, item.unit)}
                  </span>
                </span>
                <span className="tabular-nums">{formatPLN(item.price)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <ShareList
        shares={purchase.shares}
        settled={purchase.settled}
        confirmed={purchase.confirmed}
        paidBy={purchase.paidBy}
        onAction={(person, action) =>
          onChange(markShare(purchase, person, action))
        }
      />

      {open > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {requested && (
            <span className="flex items-center gap-1.5 text-xs text-warn">
              <BellRing className="size-3.5" />
              Prośba o zwrot {requested}
            </span>
          )}
          {canRequest && (
            <FeatureGate feature="btn:refund" className="ml-auto">
              <Button
                size="sm"
                variant={requested ? "ghost" : "outline"}
                className="ml-auto"
                onClick={() => {
                  onChange({
                    ...purchase,
                    refundRequestedAt: new Date().toISOString(),
                  });
                  notify(householdId, "refund", purchase.id);
                  toast.success(
                    `Poproszono o zwrot ${formatPLN(open)} — domownicy zobaczą to w Rachunkach`,
                  );
                }}
              >
                <BellRing className="size-4" />
                {requested ? "Przypomnij" : "Poproś o zwrot"}
              </Button>
            </FeatureGate>
          )}
        </div>
      )}
    </section>
  );
}
