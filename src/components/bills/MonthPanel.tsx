import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Receipt, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShareList } from "@/components/bills/ShareList";
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
import type { BillsData } from "@/hooks/useBills";
import { usePeople } from "@/hooks/usePeople";
import {
  billId,
  billShares,
  dueDateFor,
  monthKey,
  monthLabel,
  shiftMonth,
  markShare,
} from "@/lib/bills";
import { formatPLN, openShare, parsePLN, toInputPLN } from "@/lib/money";
import { notify } from "@/lib/push";
import { cn } from "@/lib/utils";
import type { Bill, BillTypeConfig } from "@/types";

const NOBODY = "__nobody__";

function today() {
  const d = new Date();
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Rachunki wybranego miesiąca: kwoty, terminy, kto zapłacił, kto oddał */
export function MonthPanel({ data }: { data: BillsData }) {
  const { bills, setBills, settings } = data;
  const { isAdmin } = useHousehold();
  const { active, nameOf } = usePeople();
  const [month, setMonth] = useState(() => monthKey());

  const types = settings.types.filter((t) => t.enabled);
  const monthBills = bills.filter((b) => b.month === month);
  // Rachunki z wyłączonych już rodzajów nadal widać, jeśli są wpisane
  const orphans = monthBills.filter(
    (b) => !types.some((t) => t.id === b.typeId),
  );

  const perPerson = useMemo(() => {
    const total = new Map<string, { share: number; open: number }>();
    for (const bill of monthBills) {
      for (const [id, share] of Object.entries(bill.shares)) {
        const entry = total.get(id) ?? { share: 0, open: 0 };
        entry.share += share;
        entry.open += openShare(bill, id);
        total.set(id, entry);
      }
    }
    return [...total.entries()].sort((a, b) => b[1].share - a[1].share);
  }, [monthBills]);
  const monthTotal = monthBills.reduce((s, b) => s + b.amount, 0);

  const saveBill = (next: Bill | null, id: string) =>
    setBills((prev) => {
      const rest = prev.filter((b) => b.id !== id);
      return next ? [...rest, next] : rest;
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Poprzedni miesiąc"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="text-center">
          <p className="text-lg font-semibold">{monthLabel(month)}</p>
          <p className="text-xs text-muted-foreground">
            Razem {formatPLN(monthTotal)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          aria-label="Następny miesiąc"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {types.length === 0 && orphans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <Receipt className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            Brak włączonych rachunków
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Włącz czynsz, prąd, gaz, internet albo dodaj własny."
              : "Administrator mieszkania włączy je w Ustawieniach."}
          </p>
          {isAdmin && (
            <Button asChild className="mt-4">
              <Link to="/settings" search={{ section: "bills" }}>
                Ustaw rachunki
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {types.map((type) => (
            <BillCard
              key={`${month}-${type.id}`}
              type={type}
              month={month}
              bill={monthBills.find((b) => b.typeId === type.id) ?? null}
              onSave={(next) => saveBill(next, billId(month, type.id))}
            />
          ))}
          {orphans.map((bill) => (
            <BillCard
              key={bill.id}
              type={null}
              month={month}
              bill={bill}
              onSave={(next) => saveBill(next, bill.id)}
            />
          ))}
        </div>
      )}

      {perPerson.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Na osobę w tym miesiącu
          </h3>
          <ul className="space-y-1 text-sm">
            {perPerson.map(([id, { share, open }]) => (
              <li key={id} className="flex items-center gap-2">
                <span className="flex-1">{nameOf(id)}</span>
                <span className="font-medium tabular-nums">
                  {formatPLN(share)}
                </span>
                <span
                  className={cn(
                    "w-36 text-right text-xs",
                    open > 0 ? "text-warn" : "text-muted-foreground",
                  )}
                >
                  {open > 0 ? `do oddania ${formatPLN(open)}` : "rozliczone"}
                </span>
              </li>
            ))}
          </ul>
          {active.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Dodaj domowników, żeby dzielić rachunki.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function BillCard({
  type,
  month,
  bill,
  onSave,
}: {
  type: BillTypeConfig | null;
  month: string;
  bill: Bill | null;
  onSave: (bill: Bill | null) => void;
}) {
  const { users, active } = usePeople();
  const { canEditItem, householdId } = useHousehold();
  const fallbackAmount = type?.defaultAmount ?? null;
  const [draft, setDraft] = useState(toInputPLN(bill?.amount ?? null));
  useEffect(() => setDraft(toInputPLN(bill?.amount ?? null)), [bill?.amount]);

  const name = bill?.name ?? type?.name ?? "Rachunek";
  const dueOn = bill?.dueOn ?? (type ? dueDateFor(month, type.dueDay) : null);
  const overdue = Boolean(bill && !bill.paidBy && dueOn && dueOn < today());
  const allSettled =
    bill?.paidBy &&
    Object.keys(bill.shares).every(
      (id) => id === bill.paidBy || bill.settled[id],
    );

  const commitAmount = (text: string) => {
    const amount = text.trim() ? parsePLN(text) : null;
    if (text.trim() && amount === null) {
      toast.error("Nie rozumiem tej kwoty — np. 1250,00");
      return;
    }
    if (amount === null || amount === 0) {
      if (bill) onSave(null);
      return;
    }
    if (bill && amount === bill.amount) return;
    const shares = type
      ? billShares(type, amount, users)
      : rescale(bill!.shares, amount);
    const id = billId(month, bill?.typeId ?? type!.id);
    // Nowy rachunek — powiadom domowników (zmiana kwoty już nie)
    if (!bill) notify(householdId, "bill", id);
    onSave({
      id,
      typeId: bill?.typeId ?? type!.id,
      name,
      month,
      amount,
      dueOn,
      paidBy: bill?.paidBy ?? null,
      shares,
      // Rozliczenia zostają tylko dla osób, które dalej dzielą rachunek
      settled: Object.fromEntries(
        Object.entries(bill?.settled ?? {}).filter(([id]) => id in shares),
      ),
    });
  };

  return (
    <section
      className={cn(
        "space-y-3 rounded-2xl border bg-surface p-4",
        overdue ? "border-alert/50" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {dueOn ? `termin ${formatDay(dueOn)}` : "bez terminu"}
            {overdue && <span className="ml-1 text-alert">· po terminie</span>}
            {allSettled && <span className="ml-1 text-safe">· rozliczone</span>}
          </p>
        </div>
        {bill && canEditItem(bill) && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => onSave(null)}
            aria-label={`Usuń rachunek ${name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commitAmount(draft)}
          onKeyDown={(e) => e.key === "Enter" && commitAmount(draft)}
          inputMode="decimal"
          placeholder={
            fallbackAmount ? toInputPLN(fallbackAmount) : "Kwota, np. 245,60"
          }
          className="h-10 w-40 text-base"
          aria-label={`Kwota: ${name}`}
        />
        <span className="text-sm text-muted-foreground">zł</span>
        {!bill && fallbackAmount !== null && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => commitAmount(toInputPLN(fallbackAmount))}
          >
            Wpisz stałą kwotę
          </Button>
        )}
      </div>

      {bill && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Zapłacił(a):</span>
            <Select
              value={bill.paidBy ?? NOBODY}
              onValueChange={(value) =>
                onSave({
                  ...bill,
                  paidBy: value === NOBODY ? null : value,
                  settled: {},
                  confirmed: {},
                })
              }
            >
              <SelectTrigger
                className="h-8 w-auto min-w-40"
                aria-label="Kto zapłacił"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOBODY}>nikt jeszcze</SelectItem>
                {active.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={bill.dueOn ?? ""}
              onChange={(e) =>
                onSave({ ...bill, dueOn: e.target.value || null })
              }
              className="h-8 w-40"
              aria-label="Termin płatności"
            />
          </div>
          <ShareList
            shares={bill.shares}
            settled={bill.settled}
            confirmed={bill.confirmed}
            paidBy={bill.paidBy}
            onAction={(person, action) =>
              onSave(markShare(bill, person, action))
            }
          />
          <SharesEditor bill={bill} onSave={onSave} />
          {!bill.paidBy && (
            <p className="text-xs text-muted-foreground">
              Gdy ktoś zapłaci całość, wybierz go wyżej — reszta zobaczy, ile mu
              oddać.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function rescale(
  shares: Record<string, number>,
  amount: number,
): Record<string, number> {
  const ids = Object.keys(shares);
  const total = Object.values(shares).reduce((s, v) => s + v, 0);
  if (ids.length === 0) return {};
  if (total <= 0) return Object.fromEntries(ids.map((id) => [id, 0]));
  let rest = amount;
  const result: Record<string, number> = {};
  ids.forEach((id, i) => {
    const part =
      i === ids.length - 1
        ? rest
        : Math.round((amount * (shares[id] ?? 0)) / total);
    result[id] = part;
    rest -= part;
  });
  return result;
}

function formatDay(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
  });
}

/**
 * Ręczna zmiana podziału tego jednego rachunku (np. ktoś był pół miesiąca,
 * ktoś zużył więcej prądu). Suma musi zgadzać się z kwotą rachunku.
 */
function SharesEditor({
  bill,
  onSave,
}: {
  bill: Bill;
  onSave: (bill: Bill | null) => void;
}) {
  const { active, nameOf } = usePeople();
  const { canEditItem } = useHousehold();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (!canEditItem(bill)) return null;
  const people = [
    ...new Set([...Object.keys(bill.shares), ...active.map((u) => u.id)]),
  ];
  const parsed = Object.fromEntries(
    people.map((id) => [id, parsePLN(draft[id] ?? "") ?? 0]),
  );
  const sum = Object.values(parsed).reduce((s, v) => s + v, 0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(
            Object.fromEntries(
              people.map((id) => [id, toInputPLN(bill.shares[id] ?? 0)]),
            ),
          );
          setOpen(true);
        }}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Zmień podział tego rachunku
      </button>
    );
  }

  const save = () => {
    const shares = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => v > 0),
    );
    onSave({
      ...bill,
      shares,
      settled: Object.fromEntries(
        Object.entries(bill.settled).filter(([id]) => id in shares),
      ),
      confirmed: Object.fromEntries(
        Object.entries(bill.confirmed ?? {}).filter(([id]) => id in shares),
      ),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface/60 p-3">
      <ul className="space-y-1.5">
        {people.map((id) => (
          <li key={id} className="flex items-center gap-2 text-sm">
            <span className="flex-1">{nameOf(id)}</span>
            <Input
              value={draft[id] ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [id]: e.target.value }))
              }
              inputMode="decimal"
              className="h-8 w-24 text-right"
              aria-label={`Część ${nameOf(id)}`}
            />
            <span className="text-xs text-muted-foreground">zł</span>
          </li>
        ))}
      </ul>
      <p
        className={cn(
          "text-xs",
          sum === bill.amount ? "text-muted-foreground" : "text-alert",
        )}
      >
        Razem {formatPLN(sum)} z {formatPLN(bill.amount)}
      </p>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Anuluj
        </Button>
        <Button size="sm" disabled={sum !== bill.amount} onClick={save}>
          Zapisz podział
        </Button>
      </div>
    </div>
  );
}
