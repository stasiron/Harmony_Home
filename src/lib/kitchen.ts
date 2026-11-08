import type {
  FridgeItem,
  ItemVisibility,
  Recipe,
  RecipeIngredient,
  ShoppingCategory,
  ShoppingItem,
} from "@/types";

/** Kolejność i nazwy kategorii (lodówka i zakupy) */
export const FOOD_CATEGORIES: { id: ShoppingCategory; label: string }[] = [
  { id: "produce", label: "Warzywa i owoce" },
  { id: "dairy", label: "Nabiał i jajka" },
  { id: "meat", label: "Mięso i ryby" },
  { id: "bakery", label: "Pieczywo" },
  { id: "pantry", label: "Spiżarnia" },
  { id: "frozen", label: "Mrożonki" },
  { id: "drinks", label: "Napoje" },
  { id: "household", label: "Chemia i dom" },
  { id: "other", label: "Inne" },
];

const CATEGORY_IDS = new Set(FOOD_CATEGORIES.map((c) => c.id));

export function categoryLabel(id: ShoppingCategory): string {
  return FOOD_CATEGORIES.find((c) => c.id === id)?.label ?? "Inne";
}

export const UNITS = [
  "szt",
  "g",
  "kg",
  "ml",
  "l",
  "op",
  "łyżka",
  "łyżeczka",
  "szklanka",
  "szczypta",
] as const;

/** Jednostki przeliczalne na bazową (g, ml) */
const UNIT_BASE: Record<string, { base: string; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  dag: { base: "g", factor: 10 },
  ml: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
};

function normalizeUnit(unit: unknown): string {
  const text = typeof unit === "string" ? unit.trim().toLowerCase() : "";
  if (!text) return "szt";
  if (text === "sztuk" || text === "sztuki" || text === "szt.") return "szt";
  if (text === "op." || text === "opak" || text === "opakowanie") return "op";
  return text;
}

/** Ilość w jednostce `to`; null — nie da się przeliczyć */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
): number | null {
  const a = normalizeUnit(from);
  const b = normalizeUnit(to);
  if (a === b) return amount;
  const fa = UNIT_BASE[a];
  const fb = UNIT_BASE[b];
  if (!fa || !fb || fa.base !== fb.base) return null;
  return (amount * fa.factor) / fb.factor;
}

/** „2,5 kg” → { amount: 2.5, unit: "kg" } — stare wpisy z polem `qty` */
export function parseQty(qty: unknown): {
  amount: number | null;
  unit: string;
} {
  const text = typeof qty === "string" ? qty.trim() : "";
  const match = text.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return { amount: null, unit: text ? text : "szt" };
  return {
    amount: Number(match[1]!.replace(",", ".")),
    unit: normalizeUnit(match[2]),
  };
}

export function formatAmount(amount: number | null, unit: string): string {
  if (amount === null) return unit === "szt" ? "" : unit;
  const rounded = Math.round(amount * 100) / 100;
  const text = String(rounded).replace(".", ",");
  return `${text} ${unit}`;
}

/** Nazwa do porównań: małe litery, bez polskich znaków i interpunkcji */
export function foodKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Czy produkt z lodówki to ten składnik: ta sama nazwa albo jedna zawiera
 * drugą jako całe słowa („mleko” ↔ „mleko 3,2%”, „jajka” ↔ „jajka L”).
 * Ucinamy polskie końcówki, żeby „jajko” pasowało do „jajka”.
 */
export function namesMatch(a: string, b: string): boolean {
  const stem = (word: string) =>
    word.length > 4 ? word.replace(/(ami|ach|ow|om|y|i|a|e|o)$/, "") : word;
  const wa = foodKey(a).split(" ").filter(Boolean).map(stem);
  const wb = foodKey(b).split(" ").filter(Boolean).map(stem);
  if (wa.length === 0 || wb.length === 0) return false;
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  return short.every((w) => long.includes(w));
}

function finite(value: unknown): number | null {
  // Number(null) === 0 — „bez ilości” nie może stać się zerem
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function category(value: unknown): ShoppingCategory {
  return CATEGORY_IDS.has(value as ShoppingCategory)
    ? (value as ShoppingCategory)
    : "other";
}

export function normalizeShoppingItem(raw: unknown): ShoppingItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name || typeof r.id !== "string") return null;
  const legacy = r.amount === undefined ? parseQty(r.qty) : null;
  return {
    ...(r as object),
    id: r.id,
    name,
    category: category(r.category),
    amount: legacy ? legacy.amount : finite(r.amount),
    unit: legacy ? legacy.unit : normalizeUnit(r.unit),
    checked: r.checked === true,
  } as ShoppingItem;
}

export function normalizeFridgeItem(raw: unknown): FridgeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name || typeof r.id !== "string") return null;
  return {
    ...(r as object),
    id: r.id,
    name,
    category: category(r.category),
    amount: finite(r.amount),
    unit: normalizeUnit(r.unit),
    expiresOn:
      typeof r.expiresOn === "string" && r.expiresOn ? r.expiresOn : null,
  } as FridgeItem;
}

export type FoodInput = {
  name: string;
  amount: number | null;
  unit: string;
  category: ShoppingCategory;
  visibility: ItemVisibility;
};

function visibilityField(visibility: ItemVisibility) {
  return visibility === "private" ? { visibility: "private" as const } : {};
}

export function newShoppingItem(input: FoodInput): ShoppingItem {
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    amount: input.amount,
    unit: normalizeUnit(input.unit),
    category: input.category,
    checked: false,
    ...visibilityField(input.visibility),
  };
}

export function newFridgeItem(
  input: FoodInput & { expiresOn?: string | null },
): FridgeItem {
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    amount: input.amount,
    unit: normalizeUnit(input.unit),
    category: input.category,
    expiresOn: input.expiresOn || null,
    ...visibilityField(input.visibility),
  };
}

/**
 * Dokłada produkty do lodówki: ta sama nazwa, jednostka i widoczność —
 * zwiększa ilość, inaczej nowa pozycja.
 */
export function addToFridge(
  fridge: FridgeItem[],
  items: FoodInput[],
): FridgeItem[] {
  const next = [...fridge];
  for (const item of items) {
    const index = next.findIndex(
      (f) =>
        foodKey(f.name) === foodKey(item.name) &&
        (f.visibility ?? "public") === item.visibility &&
        f.amount !== null &&
        item.amount !== null &&
        convertAmount(item.amount, item.unit, f.unit) !== null,
    );
    if (index >= 0) {
      const existing = next[index]!;
      next[index] = {
        ...existing,
        amount:
          existing.amount! +
          convertAmount(item.amount!, item.unit, existing.unit)!,
      };
    } else {
      next.push(newFridgeItem(item));
    }
  }
  return next;
}

/** Ile składnika jest w lodówce (w jednostce składnika) */
export type IngredientStatus = {
  ingredient: RecipeIngredient;
  /** Potrzebna ilość po przeliczeniu porcji */
  needed: number | null;
  matches: FridgeItem[];
  /** Dostępna ilość w jednostce składnika; null — nieprzeliczalna */
  available: number | null;
  enough: boolean;
};

export function scaleIngredient(
  ingredient: RecipeIngredient,
  scale: number,
): number | null {
  return ingredient.amount === null ? null : ingredient.amount * scale;
}

export function ingredientStatus(
  ingredient: RecipeIngredient,
  fridge: FridgeItem[],
  scale = 1,
): IngredientStatus {
  const needed = scaleIngredient(ingredient, scale);
  const matches = fridge.filter((f) => namesMatch(f.name, ingredient.name));
  let available: number | null = 0;
  for (const item of matches) {
    if (item.amount === null) {
      available = null;
      break;
    }
    const converted = convertAmount(item.amount, item.unit, ingredient.unit);
    if (converted === null) {
      available = null;
      break;
    }
    available += converted;
  }
  const enough =
    matches.length > 0 &&
    (needed === null || available === null || available >= needed - 1e-9);
  return { ingredient, needed, matches, available, enough };
}

export function recipeAvailability(
  recipe: Recipe,
  fridge: FridgeItem[],
  scale = 1,
) {
  const required = recipe.ingredients.filter((i) => !i.optional);
  const statuses = required.map((i) => ingredientStatus(i, fridge, scale));
  const have = statuses.filter((s) => s.enough).length;
  return { have, total: required.length, ready: have === required.length };
}

/** Co zabraknie — gotowe pozycje na listę zakupów */
export function missingIngredients(
  recipe: Recipe,
  fridge: FridgeItem[],
  scale = 1,
): { name: string; amount: number | null; unit: string }[] {
  return recipe.ingredients
    .filter((i) => !i.optional)
    .map((i) => ingredientStatus(i, fridge, scale))
    .filter((s) => !s.enough)
    .map((s) => {
      const missing =
        s.needed !== null && s.available !== null && s.matches.length > 0
          ? s.needed - s.available
          : s.needed;
      return {
        name: s.ingredient.name,
        amount: missing === null ? null : Math.round(missing * 100) / 100,
        unit: s.ingredient.unit,
      };
    });
}

/** Jedna zmiana w lodówce po ugotowaniu przepisu */
export type Deduction = {
  itemId: string;
  itemName: string;
  ingredientName: string;
  /** Ile odjąć (w jednostce produktu); null — zużyty w całości */
  amount: number | null;
  unit: string;
  /** Czy da się policzyć ilość — inaczej domyślnie nie zaznaczamy */
  exact: boolean;
};

/**
 * Plan zdjęcia składników z lodówki: najpierw z pozycji z najkrótszym
 * terminem, w jednostce produktu. Gdy ilości nie da się przeliczyć
 * (np. „mąka 1 op” vs „200 g”), proponujemy usunięcie — do potwierdzenia.
 */
export function planCooking(
  recipe: Recipe,
  fridge: FridgeItem[],
  scale = 1,
): Deduction[] {
  const deductions: Deduction[] = [];
  const used = new Map<string, number>();

  for (const ingredient of recipe.ingredients) {
    let remaining = scaleIngredient(ingredient, scale);
    const matches = fridge
      .filter((f) => namesMatch(f.name, ingredient.name))
      .sort((a, b) =>
        (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999"),
      );
    for (const item of matches) {
      if (remaining !== null && remaining <= 1e-9) break;
      const left = (item.amount ?? 0) - (used.get(item.id) ?? 0);
      const neededHere =
        remaining === null
          ? null
          : convertAmount(remaining, ingredient.unit, item.unit);
      if (item.amount === null || neededHere === null) {
        deductions.push({
          itemId: item.id,
          itemName: item.name,
          ingredientName: ingredient.name,
          amount: null,
          unit: item.unit,
          exact: false,
        });
        remaining = 0;
        break;
      }
      if (left <= 1e-9) continue;
      const take = Math.min(left, neededHere);
      used.set(item.id, (used.get(item.id) ?? 0) + take);
      deductions.push({
        itemId: item.id,
        itemName: item.name,
        ingredientName: ingredient.name,
        amount: Math.round(take * 1000) / 1000,
        unit: item.unit,
        exact: true,
      });
      remaining = remaining! - convertAmount(take, item.unit, ingredient.unit)!;
    }
  }
  return deductions;
}

/** Lodówka po zdjęciu wybranych składników; puste pozycje znikają */
export function applyDeductions(
  fridge: FridgeItem[],
  deductions: Deduction[],
): FridgeItem[] {
  const take = new Map<string, number | null>();
  for (const d of deductions) {
    const prev = take.get(d.itemId);
    if (d.amount === null || prev === null) take.set(d.itemId, null);
    else take.set(d.itemId, (prev ?? 0) + d.amount);
  }
  return fridge.flatMap((item) => {
    if (!take.has(item.id)) return [item];
    const amount = take.get(item.id);
    if (amount == null || item.amount === null) return [];
    const left = Math.round((item.amount - amount) * 1000) / 1000;
    return left <= 1e-9 ? [] : [{ ...item, amount: left }];
  });
}

/** Ile dni do końca terminu (ujemne — po terminie) */
export function daysToExpiry(expiresOn: string | null, now = new Date()) {
  if (!expiresOn) return null;
  const end = new Date(`${expiresOn}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

export const DIFFICULTY_LABELS: Record<Recipe["difficulty"], string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};

export const RECIPE_CATEGORIES = [
  "Śniadanie",
  "Obiad",
  "Kolacja",
  "Zupa",
  "Deser",
  "Przekąska",
  "Napój",
  "Inne",
] as const;

export function normalizeRecipe(raw: unknown): Recipe | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.name !== "string") return null;
  const ingredients = Array.isArray(r.ingredients)
    ? (r.ingredients as Record<string, unknown>[])
        .filter((i) => i && typeof i.name === "string" && i.name.trim())
        .map((i) => ({
          name: String(i.name).trim(),
          amount: finite(i.amount),
          unit: normalizeUnit(i.unit),
          optional: i.optional === true,
        }))
    : [];
  const share = r.share === "all" || r.share === "people" ? r.share : "private";
  return {
    id: r.id,
    name: r.name,
    emoji: typeof r.emoji === "string" && r.emoji ? r.emoji : "🍽️",
    description: typeof r.description === "string" ? r.description : "",
    category: typeof r.category === "string" ? r.category : "Inne",
    servings: Math.max(1, finite(r.servings) ?? 2),
    prepMinutes: finite(r.prepMinutes) ?? 0,
    cookMinutes: finite(r.cookMinutes) ?? 0,
    difficulty:
      r.difficulty === "medium" || r.difficulty === "hard"
        ? r.difficulty
        : "easy",
    ingredients,
    steps: Array.isArray(r.steps)
      ? (r.steps as unknown[]).filter(
          (s): s is string => typeof s === "string" && s.trim() !== "",
        )
      : [],
    notes: typeof r.notes === "string" ? r.notes : "",
    share,
    sharedWith:
      share === "people" && r.sharedWith && typeof r.sharedWith === "object"
        ? Object.keys(r.sharedWith as object).filter(
            (uid) => (r.sharedWith as Record<string, unknown>)[uid] === true,
          )
        : [],
    createdBy: typeof r.createdBy === "string" ? r.createdBy : "",
    authorName: typeof r.authorName === "string" ? r.authorName : "",
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",
  };
}
