import { useCallback } from "react";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import { useHousehold } from "@/context/HouseholdContext";
import {
  parseFeatureFlags,
  resolveFeature,
  type FeatureView,
} from "@/config/features";

/** Funkcja „jak widzę tę funkcję” — do filtrowania list zakładek i kafelków */
export function useFeatures(): (key: string) => FeatureView {
  const { features: global } = useGlobalConfig();
  const { household, isAdmin, isSuperAdmin } = useHousehold();
  const flags = household?.features?.flags;
  return useCallback(
    (key: string) =>
      resolveFeature(key, global, parseFeatureFlags(flags), {
        superAdmin: isSuperAdmin,
        admin: isAdmin,
      }),
    [global, flags, isAdmin, isSuperAdmin],
  );
}

export function useFeature(key: string): FeatureView {
  return useFeatures()(key);
}

/**
 * Zakładki strony z blokadami: ukryte znikają, zablokowane zostają
 * (przygaszone), a aktywną staje się pierwsza działająca.
 */
export function useGatedTabs<T extends { id: string }>(
  prefix: string,
  items: T[],
  current: string,
): { visible: (T & { view: FeatureView })[]; active: T["id"] | null } {
  const feature = useFeatures();
  const visible = items.flatMap((item) => {
    const view = feature(`tab:${prefix}.${item.id}`);
    return view.state === "hidden" ? [] : [{ ...item, view }];
  });
  const usable = visible.filter((i) => i.view.state === "on");
  const active = usable.some((i) => i.id === current)
    ? current
    : (usable[0]?.id ?? null);
  return { visible, active };
}
