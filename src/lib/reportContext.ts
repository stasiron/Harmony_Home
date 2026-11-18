import { useEffect } from "react";

/**
 * Zakładka, której nie widać w adresie (np. folder w TODO, zakładka
 * Poradnika) — trafia do zgłoszenia błędu, żeby wiedzieć, gdzie dokładnie.
 */
let currentTab: string | null = null;

export function getReportTab(): string | null {
  return currentTab;
}

/** Strona z lokalnymi zakładkami zgłasza, która jest teraz otwarta */
export function useReportTab(label: string | null | undefined) {
  useEffect(() => {
    currentTab = label ?? null;
    return () => {
      if (currentTab === (label ?? null)) currentTab = null;
    };
  }, [label]);
}
