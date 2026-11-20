import { Check, CheckCheck, Pencil, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePeople } from "@/hooks/usePeople";
import type { ShareAction } from "@/lib/bills";
import { formatPLN, parsePLN, toInputPLN } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Części poszczególnych osób. Dłużnik zaznacza „Oddałem/am”, płacący
 * „Potwierdź” (albo od razu „Otrzymane”). Bez płacącego (rachunek jeszcze
 * nieopłacony) nie ma komu oddawać.
 *
 * `manage` — administrator albo opiekun rachunków: zatwierdza wpłaty
 * każdego (także bez płacącego — zbiera pieniądze) i wpisuje, ile kto
 * wpłacił, gdy nie całość.
 */
export function ShareList({
  shares,
  settled,
  confirmed = {},
  payments = {},
  paidBy,
  manage = false,
  onAction,
  onSetPaid,
}: {
  shares: Record<string, number>;
  settled: Record<string, string>;
  confirmed?: Record<string, string>;
  payments?: Record<string, number>;
  paidBy: string | null;
  manage?: boolean;
  onAction: (person: string, action: ShareAction) => void;
  /** Ile osoba wpłaciła (grosze) — tylko przy `manage` */
  onSetPaid?: (person: string, amount: number) => void;
}) {
  const { nameOf, actorId } = usePeople();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const people = Object.keys(shares).sort((a, b) =>
    nameOf(a).localeCompare(nameOf(b), "pl"),
  );
  if (people.length === 0) return null;
  const actorIsPayer = Boolean(actorId && actorId === paidBy);
  const canManage = manage && Boolean(onSetPaid);

  const startEdit = (id: string) => {
    const amount = settled[id] ? (shares[id] ?? 0) : (payments[id] ?? 0);
    setDraft(amount > 0 ? toInputPLN(amount) : "");
    setEditing(id);
  };

  const saveEdit = (id: string) => {
    const amount = draft.trim() ? parsePLN(draft) : 0;
    if (amount === null) {
      toast.error("Nie rozumiem tej kwoty — np. 250,00");
      return;
    }
    onSetPaid?.(id, amount);
    setEditing(null);
  };

  return (
    <ul className="space-y-1">
      {people.map((id) => {
        const amount = shares[id] ?? 0;
        const isPayer = paidBy === id;
        const paid = Boolean(settled[id]);
        const ok = Boolean(confirmed[id]);
        const partial = !paid ? Math.min(payments[id] ?? 0, amount) : 0;
        const managed = canManage && !isPayer;
        return (
          <li
            key={id}
            className={cn(
              "rounded-xl px-2 py-1.5 text-sm",
              id === actorId && "bg-primary/5",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {nameOf(id)}
                  {id === actorId && (
                    <span className="ml-1 text-xs text-primary">(Ty)</span>
                  )}
                </span>
                {partial > 0 && (
                  <span className="block text-xs text-warn">
                    wpłacone {formatPLN(partial)} · zostało{" "}
                    {formatPLN(amount - partial)}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  paid && !isPayer && "text-muted-foreground line-through",
                )}
              >
                {formatPLN(amount)}
              </span>
              <span className="flex min-w-36 shrink-0 justify-end gap-1">
                {isPayer ? (
                  <span className="text-xs text-safe">zapłacił(a)</span>
                ) : !paidBy && !managed ? (
                  <span className="text-xs text-muted-foreground">
                    {paid ? "wpłacone" : "do zapłaty"}
                  </span>
                ) : paid ? (
                  <>
                    {ok ? (
                      <span className="flex items-center gap-1 text-xs text-safe">
                        <CheckCheck className="size-3.5" />
                        {paidBy ? "potwierdzone" : "wpłacone"}
                      </span>
                    ) : actorIsPayer || managed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => onAction(id, "confirm")}
                        title="Pieniądze doszły"
                      >
                        {actorIsPayer ? "Potwierdź" : "Zatwierdź"}
                      </Button>
                    ) : (
                      <span
                        className="flex items-center gap-1 text-xs text-safe"
                        title="Czeka na potwierdzenie płacącego"
                      >
                        <Check className="size-3.5" />
                        oddane
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground"
                      onClick={() => onAction(id, "undo")}
                      aria-label={`Cofnij: ${nameOf(id)}`}
                      title="Cofnij"
                    >
                      <Undo2 className="size-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      onAction(
                        id,
                        actorIsPayer || managed ? "received" : "paid",
                      )
                    }
                    title={
                      managed && !actorIsPayer
                        ? "Zatwierdź, że wpłacił(a) całą swoją część"
                        : undefined
                    }
                  >
                    {actorIsPayer
                      ? "Otrzymane"
                      : managed
                        ? "Wpłacone"
                        : id === actorId
                          ? "Oddałem/am"
                          : "Oddane"}
                  </Button>
                )}
                {managed && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground"
                    onClick={() =>
                      editing === id ? setEditing(null) : startEdit(id)
                    }
                    aria-label={`Ile wpłacił(a): ${nameOf(id)}`}
                    title="Wpisz, ile wpłacił(a)"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </span>
            </div>
            {managed && editing === id && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Wpłacił(a):
                </span>
                <Input
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(id);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  inputMode="decimal"
                  placeholder={toInputPLN(amount)}
                  className="h-8 w-28 text-right"
                  aria-label={`Kwota wpłacona przez ${nameOf(id)}`}
                />
                <span className="text-xs text-muted-foreground">
                  z {formatPLN(amount)}
                </span>
                <span className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditing(null)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => saveEdit(id)}
                  >
                    Zapisz
                  </Button>
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
