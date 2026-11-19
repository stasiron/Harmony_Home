import { createContext, useContext, useState, type ReactNode } from "react";
import { useHousehold } from "@/context/HouseholdContext";
import type { ItemVisibility } from "@/types";

/**
 * „Tylko dla mnie / Dla wszystkich” dla całej strony (Poradnik, TODO,
 * Kuchnia). Każde wejście zaczyna od „tylko dla mnie” — udostępnienie
 * wszystkim to świadomy wybór. Bez konta prywatnych nie ma.
 */
type ScopeState = {
  scope: ItemVisibility;
  setScope: (scope: ItemVisibility) => void;
  /** Konto — może mieć prywatne */
  canPrivate: boolean;
};

const ScopeContext = createContext<ScopeState | null>(null);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { hasAccount } = useHousehold();
  const [scope, setScope] = useState<ItemVisibility>("private");
  return (
    <ScopeContext.Provider
      value={{
        scope: hasAccount ? scope : "public",
        setScope,
        canPrivate: hasAccount,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
}

/** Domyślna widoczność nowych rzeczy na tej stronie */
export function useScope(): ScopeState {
  const ctx = useContext(ScopeContext);
  const { hasAccount } = useHousehold();
  return (
    ctx ?? {
      scope: "public",
      setScope: () => undefined,
      canPrivate: hasAccount,
    }
  );
}
