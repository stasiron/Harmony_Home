import { useCallback } from "react";
import { useGlobalConfig } from "@/context/GlobalConfigContext";
import { useHousehold } from "@/context/HouseholdContext";
import {
  parseFeatureFlags,
  resolveFeature,
  stricter,
  type FeatureState,
  type FeatureView,
} from "@/config/features";
import { roleFlags } from "@/config/roles";

/** Funkcja „jak widzę tę funkcję” — do filtrowania list zakładek i kafelków */
export function useFeatures(): (key: string) => FeatureView {
  const { features: global } = useGlobalConfig();
  const { household, isAdmin, isSuperAdmin, role, stats } = useHousehold();
  const flags = household?.features?.flags;
  return useCallback(
    (key: string) => {
      const view = resolveFeature(key, global, parseFeatureFlags(flags), {
        superAdmin: isSuperAdmin,
        admin: isAdmin,
      });
      // Rola i widoczność statystyk działają też na administratora mieszkania
      // (on i tak ma pełną rolę) — to nie blokada „do testów”, tylko uprawnienia
      const own: FeatureState =
        key === "page:/stats" && stats === "none"
          ? "hidden"
          : (roleFlags(role)[key] ?? "on");
      return {
        ...view,
        state: stricter(view.state, own),
        byRole: own !== "on",
      };
    },
    [global, flags, isAdmin, isSuperAdmin, role, stats],
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
