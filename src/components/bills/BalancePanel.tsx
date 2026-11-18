import { ArrowRight, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BillsData } from "@/hooks/useBills";
import { usePeople } from "@/hooks/usePeople";
import {
  formatPLN,
  netFor,
  pairBalances,
  settlePair,
  type PairDebt,
} from "@/lib/money";
import { cn } from "@/lib/utils";

/** Kto komu ile — rachunki i wspólne zakupy razem */
export function BalancePanel({ data }: { data: BillsData }) {
  const { bills, setBills, purchases, setPurchases } = data;
  const { active, actorId, nameOf } = usePeople();
  const [confirm, setConfirm] = useState<PairDebt | null>(null);

  const costs = useMemo(() => [...bills, ...purchases], [bills, purchases]);
  const debts = useMemo(() => pairBalances(costs), [costs]);
  const mine = actorId ? netFor(costs, actorId) : null;

  const settle = (debt: PairDebt) => {
    const at = new Date().toISOString();
    const ids = new Set(debt.costIds);
    setBills((prev) =>
      prev.map((b) =>
        ids.has(b.id) ? settlePair(b, debt.from, debt.to, at) : b,
      ),
    );
    setPurchases((prev) =>
      prev.map((p) =>
        ids.has(p.id) ? settlePair(p, debt.from, debt.to, at) : p,
      ),
    );
    toast.success(`${nameOf(debt.from)} i ${nameOf(debt.to)} — rozliczeni`);
  };

  return (
    <div className="space-y-5">
      {mine !== null && (
        <section className="rounded-2xl border border-border bg-surface p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Twój bilans
          </p>
          <p
            className={cn(
              "mt-1 text-3xl font-semibold tabular-nums",
              mine > 0 && "text-safe",
              mine < 0 && "text-warn",
            )}
          >
            {mine > 0 ? "+" : ""}
            {formatPLN(mine)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine > 0
              ? "Tyle należy się Tobie"
              : mine < 0
                ? "Tyle masz do oddania"
                : "Jesteś na czysto"}
          </p>
        </section>
      )}

      {debts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <Scale className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">Wszyscy rozliczeni</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nikt nikomu nic nie jest winien.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {debts.map((debt) => (
            <li
              key={`${debt.from}-${debt.to}`}
              className={cn(
                "flex flex-wrap items-center gap-3 px-4 py-3",
                (debt.from === actorId || debt.to === actorId) &&
                  "bg-primary/5",
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                <span className="truncate font-medium">
                  {nameOf(debt.from)}
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{nameOf(debt.to)}</span>
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPLN(debt.amount)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirm(debt)}
              >
                Rozliczone
              </Button>
            </li>
          ))}
        </ul>
      )}

      {active.length > 0 && costs.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Bilans domowników
          </h3>
          <ul className="space-y-1 text-sm">
            {active.map((u) => {
              const net = netFor(costs, u.id);
              return (
                <li key={u.id} className="flex justify-between">
                  <span>{u.name}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      net > 0 && "text-safe",
                      net < 0 && "text-warn",
                    )}
                  >
                    {net > 0 ? "+" : ""}
                    {formatPLN(net)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Oznaczyć jako rozliczone?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm &&
                `${nameOf(confirm.from)} oddaje ${nameOf(confirm.to)} ${formatPLN(confirm.amount)}. Wszystkie ich wspólne rachunki i zakupy zostaną oznaczone jako oddane.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) settle(confirm);
                setConfirm(null);
              }}
            >
              Rozliczone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
