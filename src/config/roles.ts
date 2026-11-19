import type { FeatureFlags } from "@/config/features";
import type { HouseholdRole, StatsVisibility } from "@/types";

/** Opisy ról — wybór w Ustawieniach → Mieszkanie */
export const ROLE_INFO: Record<
  HouseholdRole,
  { label: string; description: string }
> = {
  admin: {
    label: "Administrator",
    description: "Wszystko, także ustawienia mieszkania i statystyki.",
  },
  member: {
    label: "Domownik",
    description: "Wszystko poza ustawieniami mieszkania.",
  },
  guest: {
    label: "Gość",
    description:
      "Tylko podgląd: zakupy, lodówka, ogłoszenia i Poradnik. Nic nie zapisuje.",
  },
  device: {
    label: "Urządzenie",
    description:
      "Wspólny tablet: odhacza obowiązki, używa kuchni, rachunki tylko ogląda.",
  },
};

export const ROLE_ORDER: HouseholdRole[] = [
  "admin",
  "member",
  "guest",
  "device",
];

/**
 * Kolekcje, które gość może czytać — to samo co `guestReadable` w
 * firestore.rules. Reszty aplikacja dla gościa nawet nie subskrybuje.
 */
export const GUEST_READABLE = new Set([
  "shopping",
  "fridge",
  "products",
  "announcements",
  "guides",
  "guideTabs",
  "guideEntries",
  "laundry",
  "recipePlans",
  "recipes",
]);

export function canReadCollection(
  role: HouseholdRole | null,
  name: string,
): boolean {
  return role !== "guest" || GUEST_READABLE.has(name);
}

/** Czego rola nie widzi — dokładane do blokad funkcji (etap 6) */
export function roleFlags(role: HouseholdRole | null): FeatureFlags {
  if (role === "guest") {
    return Object.fromEntries(
      [
        "page:/calendar",
        "page:/chores",
        "page:/todo",
        "page:/bills",
        "page:/stats",
        "page:/members",
        "tab:kitchen.supplies",
        "tab:settings.calendar",
        "tab:settings.plan",
        "tab:settings.chores",
        "tab:settings.bills",
        "btn:panic",
        "btn:guest",
        "btn:away",
        "btn:refund",
        "btn:expense",
      ].map((key) => [key, "hidden" as const]),
    );
  }
  if (role === "device") {
    return Object.fromEntries(
      [
        "page:/stats",
        "tab:settings.calendar",
        "tab:settings.plan",
        "tab:settings.chores",
        "tab:settings.bills",
        "btn:guest",
        "btn:away",
        "btn:refund",
        "btn:expense",
      ].map((key) => [key, "hidden" as const]),
    );
  }
  return {};
}

/** Co pokazują statystyki tej osobie — zgodnie z regułą `completions` */
export function statsAccess(
  visibility: StatsVisibility | undefined,
  role: HouseholdRole | null,
): "all" | "own" | "none" {
  if (role === "admin") return "all";
  if (role !== "member") return "none";
  const mode = visibility ?? "all";
  return mode === "all" ? "all" : mode === "own" ? "own" : "none";
}

export const STATS_VISIBILITY: {
  id: StatsVisibility;
  label: string;
  description: string;
}[] = [
  {
    id: "all",
    label: "Wszyscy",
    description: "Każdy domownik widzi punkty wszystkich.",
  },
  {
    id: "own",
    label: "Każdy swoje",
    description: "Domownik widzi tylko swoje wykonania i punkty.",
  },
  {
    id: "admins",
    label: "Tylko administratorzy",
    description: "Statystyki i „ostatnio zrobione” znikają u pozostałych.",
  },
];
