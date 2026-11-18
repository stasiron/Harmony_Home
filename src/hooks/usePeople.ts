import { useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";

/**
 * Domownicy do rozliczeń: kto to „ja” (połączony profil albo podgląd
 * jako domownik) i imiona po User.id.
 */
export function usePeople() {
  const { users } = useApp();
  const { myProfileId } = useHousehold();
  const { seeAsMemberId } = useAuth();
  const active = useMemo(
    () => users.filter((u) => u.active !== false),
    [users],
  );
  const actorId = seeAsMemberId ?? myProfileId;
  const nameOf = useCallback(
    (id: string | null | undefined) =>
      (id && users.find((u) => u.id === id)?.name) || "ktoś",
    [users],
  );
  return { users, active, actorId, nameOf };
}
