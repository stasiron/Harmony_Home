import { Repeat } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { absenceOn, dayKey } from "@/lib/absence";
import { isRotating, turnOrder } from "@/lib/rotation";
import type { TurnRotation, User } from "@/types";

/**
 * „Na zmianę: teraz Ala → Olek → Ola” na karcie obowiązku / zadania.
 * Nieobecni dziś są pomijani (tura idzie dalej) i pokazani osobno.
 */
export function TurnQueueLine({
  item,
  users,
}: {
  item: TurnRotation;
  users: User[];
}) {
  const { absences } = useApp();
  if (!isRotating(item)) return null;
  const today = dayKey(new Date());
  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? "?";
  const order = turnOrder(item);
  const present = order.filter((id) => !absenceOn(absences, id, today));
  const away = order.filter((id) => absenceOn(absences, id, today));
  const [now, ...next] = present.map(nameOf);

  return (
    <span className="flex flex-wrap items-center gap-1" title="Na zmianę">
      <Repeat className="size-3" />
      Tura:{" "}
      <strong className="font-semibold text-foreground">{now ?? "—"}</strong>
      {next.length > 0 && <span>· potem {next.join(" → ")}</span>}
      {away.length > 0 && (
        <span className="text-warn">
          · nie ma: {away.map(nameOf).join(", ")}
        </span>
      )}
    </span>
  );
}
