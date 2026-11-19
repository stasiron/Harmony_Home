/**
 * Rejestr funkcji, które administrator może zablokować („wkrótce”) albo
 * ukryć. Dwa poziomy: globalnie (`config/global.features`, administrator
 * ogólny) i w mieszkaniu (`households/{hid}.features.flags`). Obowiązuje
 * ostrzejsze z dwóch.
 */
export type FeatureState = "on" | "locked" | "hidden";
export type FeatureGroup = "pages" | "tabs" | "buttons";
export type FeatureFlags = Partial<Record<string, FeatureState>>;

export type FeatureDef = { key: string; label: string; group: FeatureGroup };

export const FEATURES: FeatureDef[] = [
  // Strony (kafelki pulpitu). Start i Ustawienia zostają zawsze —
  // inaczej administrator odciąłby sobie drogę do odblokowania.
  { key: "page:/calendar", label: "Kalendarz", group: "pages" },
  { key: "page:/chores", label: "Obowiązki", group: "pages" },
  { key: "page:/todo", label: "TODO", group: "pages" },
  { key: "page:/guides", label: "Poradnik", group: "pages" },
  { key: "page:/kitchen", label: "Kuchnia", group: "pages" },
  { key: "page:/bills", label: "Rachunki", group: "pages" },
  { key: "page:/board", label: "Ogłoszenia", group: "pages" },
  { key: "page:/stats", label: "Statystyki", group: "pages" },
  { key: "page:/members", label: "Domownicy", group: "pages" },

  { key: "tab:kitchen.fridge", label: "Kuchnia → Lodówka", group: "tabs" },
  { key: "tab:kitchen.shopping", label: "Kuchnia → Zakupy", group: "tabs" },
  { key: "tab:kitchen.supplies", label: "Kuchnia → Zapasy", group: "tabs" },
  { key: "tab:kitchen.recipes", label: "Kuchnia → Przepisy", group: "tabs" },
  { key: "tab:bills.month", label: "Rachunki → Miesiąc", group: "tabs" },
  { key: "tab:bills.purchases", label: "Rachunki → Zakupy", group: "tabs" },
  { key: "tab:bills.balance", label: "Rachunki → Saldo", group: "tabs" },
  { key: "tab:guides.notes", label: "Poradnik → Instrukcje", group: "tabs" },
  { key: "tab:guides.recipes", label: "Poradnik → Przepisy", group: "tabs" },
  { key: "tab:guides.laundry", label: "Poradnik → Pranie", group: "tabs" },
  {
    key: "tab:settings.calendar",
    label: "Ustawienia → Mój kalendarz",
    group: "tabs",
  },
  {
    key: "tab:settings.plan",
    label: "Ustawienia → Plan i strefy",
    group: "tabs",
  },
  {
    key: "tab:settings.chores",
    label: "Ustawienia → Obowiązki",
    group: "tabs",
  },
  { key: "tab:settings.bills", label: "Ustawienia → Rachunki", group: "tabs" },

  { key: "btn:panic", label: "PANIC — goście za chwilę", group: "buttons" },
  { key: "btn:bugReport", label: "Zgłoś błąd", group: "buttons" },
  { key: "btn:guest", label: "Zapowiedz gościa", group: "buttons" },
  { key: "btn:away", label: "Nie ma mnie / wyjazd", group: "buttons" },
  { key: "btn:refund", label: "Poproś o zwrot", group: "buttons" },
  { key: "btn:expense", label: "Dodaj wydatek", group: "buttons" },
];

export const FEATURE_GROUPS: { id: FeatureGroup; label: string }[] = [
  { id: "pages", label: "Strony" },
  { id: "tabs", label: "Zakładki" },
  { id: "buttons", label: "Przyciski" },
];

const RANK: Record<FeatureState, number> = { on: 0, locked: 1, hidden: 2 };
const KNOWN = new Set(FEATURES.map((f) => f.key));

function stateOf(flags: FeatureFlags | undefined, key: string): FeatureState {
  const value = flags?.[key];
  return value === "locked" || value === "hidden" ? value : "on";
}

export function stricter(a: FeatureState, b: FeatureState): FeatureState {
  return RANK[a] >= RANK[b] ? a : b;
}

/** Tylko znane klucze i poprawne stany — reszta z bazy jest pomijana */
export function parseFeatureFlags(raw: unknown): FeatureFlags {
  if (!raw || typeof raw !== "object") return {};
  const result: FeatureFlags = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (KNOWN.has(key) && (value === "locked" || value === "hidden")) {
      result[key] = value;
    }
  }
  return result;
}

export type FeatureView = {
  /** Co widzi ta osoba */
  state: FeatureState;
  /** Co widzą inni — gdy różni się od `state`, pokazujemy znaczek */
  forOthers: FeatureState;
  /** Niedostępne przez rolę albo widoczność statystyk (nie blokada admina) */
  byRole?: boolean;
};

/**
 * Administrator ogólny widzi wszystko (żeby testować), administrator
 * mieszkania omija blokady swojego mieszkania, ale nie globalne.
 */
export function resolveFeature(
  key: string,
  global: FeatureFlags | undefined,
  household: FeatureFlags | undefined,
  viewer: { superAdmin: boolean; admin: boolean },
): FeatureView {
  const g = stateOf(global, key);
  const h = stateOf(household, key);
  const forOthers = stricter(g, h);
  if (viewer.superAdmin) return { state: "on", forOthers };
  if (viewer.admin) return { state: g, forOthers };
  return { state: forOthers, forOthers };
}

/**
 * Szerokości kafelków tak, żeby siatka zamykała się równo: kafelek przed
 * dziurą (szeroki nie mieści się w końcówce wiersza) i ostatni kafelek
 * rozciągają się na wolne pola.
 */
export function fillGrid(spans: number[], cols: number): number[] {
  const result = spans.map((s) => Math.min(s, cols));
  let used = 0;
  result.forEach((span, i) => {
    if (used > 0 && used + span > cols && i > 0) {
      result[i - 1]! += cols - used;
      used = 0;
    }
    used = (used + span) % cols;
  });
  if (used > 0 && result.length > 0) {
    result[result.length - 1]! += cols - used;
  }
  return result;
}

/** Start i Ustawienia nie dają się zablokować */
export function pageFeatureKey(to: string): string | null {
  return to === "/" || to === "/settings" ? null : `page:${to}`;
}
