import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";

/** Imię konta: połączony domownik, potem nazwa konta, potem e-mail */
export function useMemberNames() {
  const { members } = useHousehold();
  const { users } = useApp();
  return members.map((m) => ({
    uid: m.uid,
    anonymous: m.anonymous,
    name:
      users.find((u) => u.id === m.profileId)?.name ??
      m.displayName ??
      m.email ??
      "Konto",
  }));
}
