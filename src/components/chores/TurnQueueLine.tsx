import { Repeat } from "lucide-react";
import type { TurnRotation, User } from "@/types";
import { isRotating, turnOrder } from "@/lib/rotation";

/** „Na zmianę: teraz Ala → Olek → Ola” na karcie obowiązku / zadania */
export function TurnQueueLine({
  item,
  users,
}: {
  item: TurnRotation;
  users: User[];
}) {
  if (!isRotating(item)) return null;
  const names = turnOrder(item).map(
    (id) => users.find((u) => u.id === id)?.name ?? "?",
  );
  const [now, ...next] = names;

  return (
    <span className="flex items-center gap-1" title="Na zmianę">
      <Repeat className="size-3" />
      Tura: <strong className="font-semibold text-foreground">{now}</strong>
      {next.length > 0 && <span>· potem {next.join(" → ")}</span>}
    </span>
  );
}
