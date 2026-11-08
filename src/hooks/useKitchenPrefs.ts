import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import type { ItemVisibility } from "@/types";

/** Ostatnio wybrana widoczność w danej liście — zapamiętana w przeglądarce */
export function useRememberedVisibility(key: string) {
  const { hasAccount } = useHousehold();
  const [value, setValue] = useState<ItemVisibility>(() => {
    try {
      return localStorage.getItem(key) === "private" ? "private" : "public";
    } catch {
      return "public";
    }
  });
  const update = (next: ItemVisibility) => {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // prywatne okno
    }
  };
  return [hasAccount ? value : "public", update] as const;
}

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
