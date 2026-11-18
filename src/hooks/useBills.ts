import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { byCreatedAt, useSyncedList } from "@/hooks/useSyncedList";
import {
  normalizeBill,
  normalizePurchase,
  resolveBillSettings,
} from "@/lib/bills";
import type { Bill, Purchase } from "@/types";

/**
 * Rachunki i wspólne zakupy — subskrybowane tylko tam, gdzie potrzebne
 * (strona Rachunki, licznik na pulpicie), żeby oszczędzać odczyty.
 */
export function useBills() {
  const { syncUser } = useAuth();
  const { householdId, household } = useHousehold();
  const uid = syncUser?.uid ?? null;

  const [bills, setBills, billsReady] = useSyncedList<Bill>({
    householdId,
    name: "bills",
    uid,
    normalize: normalizeBill,
    sort: (a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
  });
  const [purchases, setPurchases, purchasesReady] = useSyncedList<Purchase>({
    householdId,
    name: "purchases",
    uid,
    normalize: normalizePurchase,
    sort: byCreatedAt("desc"),
  });

  const settings = useMemo(
    () => resolveBillSettings(household?.billSettings),
    [household?.billSettings],
  );

  return {
    bills,
    setBills,
    purchases,
    setPurchases,
    settings,
    ready: billsReady && purchasesReady,
  };
}

export type BillsData = ReturnType<typeof useBills>;
