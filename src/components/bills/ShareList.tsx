import { Check, CheckCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePeople } from "@/hooks/usePeople";
import type { ShareAction } from "@/lib/bills";
import { formatPLN } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Części poszczególnych osób. Dłużnik zaznacza „Oddałem/am”, płacący
 * „Potwierdź” (albo od razu „Otrzymane”). Bez płacącego (rachunek jeszcze
 * nieopłacony) nie ma komu oddawać.
 */
export function ShareList({
  shares,
  settled,
  confirmed = {},
  paidBy,
  onAction,
}: {
  shares: Record<string, number>;
  settled: Record<string, string>;
  confirmed?: Record<string, string>;
  paidBy: string | null;
  onAction: (person: string, action: ShareAction) => void;
}) {
  const { nameOf, actorId } = usePeople();
  const people = Object.keys(shares).sort((a, b) =>
    nameOf(a).localeCompare(nameOf(b), "pl"),
  );
  if (people.length === 0) return null;
  const actorIsPayer = Boolean(actorId && actorId === paidBy);

  return (
    <ul className="space-y-1">
      {people.map((id) => {
        const amount = shares[id] ?? 0;
        const isPayer = paidBy === id;
        const paid = Boolean(settled[id]);
        const ok = Boolean(confirmed[id]);
        return (
          <li
            key={id}
            className={cn(
              "flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm",
              id === actorId && "bg-primary/5",
            )}
          >
            <span className="flex-1 truncate">
              {nameOf(id)}
              {id === actorId && (
                <span className="ml-1 text-xs text-primary">(Ty)</span>
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
            <span className="flex w-36 justify-end gap-1">
              {isPayer ? (
                <span className="text-xs text-safe">zapłacił(a)</span>
              ) : !paidBy ? (
                <span className="text-xs text-muted-foreground">
                  do zapłaty
                </span>
              ) : paid ? (
                <>
                  {ok ? (
                    <span className="flex items-center gap-1 text-xs text-safe">
                      <CheckCheck className="size-3.5" />
                      potwierdzone
                    </span>
                  ) : actorIsPayer ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => onAction(id, "confirm")}
                    >
                      Potwierdź
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
                    onAction(id, actorIsPayer ? "received" : "paid")
                  }
                >
                  {actorIsPayer
                    ? "Otrzymane"
                    : id === actorId
                      ? "Oddałem/am"
                      : "Oddane"}
                </Button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
