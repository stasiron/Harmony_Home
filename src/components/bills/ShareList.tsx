import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePeople } from "@/hooks/usePeople";
import { formatPLN } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Części poszczególnych osób z przyciskiem „Oddane”. Płacący ma swoją część
 * z głowy; bez płacącego (rachunek jeszcze nieopłacony) nie ma komu oddawać.
 */
export function ShareList({
  shares,
  settled,
  paidBy,
  onSettle,
}: {
  shares: Record<string, number>;
  settled: Record<string, string>;
  paidBy: string | null;
  onSettle: (person: string, settled: boolean) => void;
}) {
  const { nameOf, actorId } = usePeople();
  const people = Object.keys(shares).sort((a, b) =>
    nameOf(a).localeCompare(nameOf(b), "pl"),
  );
  if (people.length === 0) return null;

  return (
    <ul className="space-y-1">
      {people.map((id) => {
        const amount = shares[id] ?? 0;
        const isPayer = paidBy === id;
        const done = isPayer || Boolean(settled[id]);
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
                done && !isPayer && "text-muted-foreground line-through",
              )}
            >
              {formatPLN(amount)}
            </span>
            <span className="w-28 text-right">
              {isPayer ? (
                <span className="text-xs text-safe">zapłacił(a)</span>
              ) : !paidBy ? (
                <span className="text-xs text-muted-foreground">
                  do zapłaty
                </span>
              ) : done ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs text-safe"
                  onClick={() => onSettle(id, false)}
                  title="Cofnij"
                >
                  <Check className="size-3.5" />
                  oddane
                  <Undo2 className="size-3 opacity-50" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => onSettle(id, true)}
                >
                  {id === actorId ? "Oddałem/am" : "Oddane"}
                </Button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
