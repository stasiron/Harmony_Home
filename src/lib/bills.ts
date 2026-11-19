import { BILL_PERIODS } from "@/config/billIcons";
import { convertAmount, foodKey, productKey } from "@/lib/kitchen";
import { splitByWeights, splitEqual } from "@/lib/money";
import type {
  Bill,
  BillSettings,
  BillTypeConfig,
  ItemVisibility,
  Product,
  Purchase,
  PurchaseLine,
  ShoppingCategory,
  ShoppingItem,
  StockState,
  User,
} from "@/types";

// ─── Rodzaje rachunków ─────────────────────────────────────────────────────

const BUILTIN_TYPES: BillTypeConfig[] = [
  builtin("rent", "Czynsz", true, 10, "home", "tag-1"),
  builtin("electricity", "Prąd", true, 15, "zap", "tag-2"),
  builtin("gas", "Gaz", false, 15, "flame", "tag-3"),
  builtin("internet", "Internet", true, 20, "wifi", "tag-6"),
];

function builtin(
  kind: BillTypeConfig["kind"],
  name: string,
  enabled: boolean,
  dueDay: number,
  icon: string,
  color: string,
): BillTypeConfig {
  return {
    id: kind,
    kind,
    name,
    enabled,
    dueDay,
    icon,
    color,
    defaultAmount: null,
    participants: [],
    splitMode: "equal",
    weights: {},
  };
}

/** Ustawienia z mieszkania + brakujące wbudowane rodzaje (czynsz, prąd…) */
export function resolveBillSettings(
  settings: BillSettings | null | undefined,
): BillSettings {
  const saved = settings?.types ?? [];
  const byId = new Map(saved.map((t) => [t.id, t]));
  const builtins = BUILTIN_TYPES.map((def) => ({
    ...def,
    ...(byId.get(def.id) ?? {}),
  }));
  const custom = saved.filter((t) => t.kind === "custom");
  return { types: [...builtins, ...custom] };
}

export function newCustomBillType(name: string): BillTypeConfig {
  return {
    id: `custom-${crypto.randomUUID().slice(0, 8)}`,
    kind: "custom",
    name: name.trim() || "Inny rachunek",
    icon: "receipt",
    color: "tag-5",
    enabled: true,
    dueDay: null,
    defaultAmount: null,
    participants: [],
    splitMode: "equal",
    weights: {},
  };
}

/** Kto dzieli się rachunkiem: wybrani albo wszyscy aktywni domownicy */
export function billParticipants(
  config: BillTypeConfig,
  users: readonly User[],
): string[] {
  const active = users.filter((u) => u.active !== false).map((u) => u.id);
  // Nieaktywni (np. wyprowadzeni) nie dostają udziału w nowych rachunkach
  const chosen = config.participants.filter((id) => active.includes(id));
  return chosen.length > 0 ? chosen : active;
}

export function billShares(
  config: BillTypeConfig,
  amount: number,
  users: readonly User[],
): Record<string, number> {
  const people = billParticipants(config, users);
  if (config.splitMode === "weights") {
    const weights = Object.fromEntries(
      people.map((id) => [id, config.weights[id] ?? 0]),
    );
    if (Object.values(weights).some((w) => w > 0)) {
      return splitByWeights(amount, weights);
    }
  }
  return splitEqual(amount, people);
}

// ─── Miesiące ──────────────────────────────────────────────────────────────

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return monthKey(new Date(y, m - 1 + delta, 1));
}

const MONTHS = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const name = MONTHS[m - 1] ?? month;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

/** Termin w danym miesiącu — dzień 31 w lutym to ostatni dzień lutego */
export function dueDateFor(
  month: string,
  dueDay: number | null,
): string | null {
  if (!dueDay) return null;
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(y, m, 0).getDate();
  const day = Math.min(Math.max(1, Math.round(dueDay)), last);
  return `${month}-${String(day).padStart(2, "0")}`;
}

/** Ile miesięcy między dwoma YYYY-MM (b − a) */
function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.split("-").map(Number) as [number, number];
  const [yb, mb] = b.split("-").map(Number) as [number, number];
  return (yb - ya) * 12 + (mb - ma);
}

/**
 * Czy rachunek wypada w tym miesiącu. Co miesiąc — zawsze; dłuższe okresy
 * liczone od miesiąca startu (np. co kwartał od stycznia: I, IV, VII, X).
 */
export function isDueInMonth(type: BillTypeConfig, month: string): boolean {
  const every = type.period?.everyMonths ?? 1;
  if (every <= 1) return true;
  const start = type.period?.startMonth ?? month;
  const diff = monthsBetween(start, month);
  return ((diff % every) + every) % every === 0;
}

/** Najbliższy miesiąc płatności od `from` włącznie */
export function nextDueMonth(type: BillTypeConfig, from: string): string {
  let month = from;
  for (let i = 0; i < 12; i++) {
    if (isDueInMonth(type, month)) return month;
    month = shiftMonth(month, 1);
  }
  return from;
}

/** „co kwartał”, „co rok”… */
export function periodLabel(type: BillTypeConfig): string {
  const every = type.period?.everyMonths ?? 1;
  return BILL_PERIODS.find((p) => p.months === every)?.label ?? "co miesiąc";
}

/** „≈ 120 zł/mies.” przy rachunku co kilka miesięcy */
export function monthlyEquivalent(
  type: BillTypeConfig,
  amount: number,
): number | null {
  const every = type.period?.everyMonths ?? 1;
  return every > 1 ? Math.round(amount / every) : null;
}

export function billId(month: string, typeId: string): string {
  return `${month}_${typeId}`;
}

// ─── Normalizacja dokumentów ───────────────────────────────────────────────

function grosze(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function shareMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      grosze(v),
    ]),
  );
}

function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string" && v,
    ) as [string, string][],
  );
}

export function normalizeBill(raw: unknown): Bill | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.month !== "string") return null;
  return {
    ...(r as object),
    id: r.id,
    typeId: typeof r.typeId === "string" ? r.typeId : "custom",
    name: typeof r.name === "string" && r.name ? r.name : "Rachunek",
    month: r.month,
    amount: grosze(r.amount),
    dueOn: typeof r.dueOn === "string" && r.dueOn ? r.dueOn : null,
    paidBy: typeof r.paidBy === "string" && r.paidBy ? r.paidBy : null,
    shares: shareMap(r.shares),
    settled: stringMap(r.settled),
    confirmed: stringMap(r.confirmed),
  } as Bill;
}

export function normalizePurchase(raw: unknown): Purchase | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.paidBy !== "string") return null;
  const items = Array.isArray(r.items)
    ? (r.items as Record<string, unknown>[])
        .filter((i) => i && typeof i.name === "string")
        .map((i): PurchaseLine => ({
          name: String(i.name),
          amount: typeof i.amount === "number" ? i.amount : null,
          unit: typeof i.unit === "string" ? i.unit : "szt",
          price: grosze(i.price),
        }))
    : [];
  return {
    ...(r as object),
    id: r.id,
    title: typeof r.title === "string" && r.title ? r.title : "Zakupy",
    items,
    total: grosze(r.total),
    paidBy: r.paidBy,
    shares: shareMap(r.shares),
    settled: stringMap(r.settled),
    confirmed: stringMap(r.confirmed),
    refundRequestedAt:
      typeof r.refundRequestedAt === "string" ? r.refundRequestedAt : null,
    at:
      typeof r.at === "string"
        ? r.at
        : typeof r.createdAt === "string"
          ? r.createdAt
          : new Date(0).toISOString(),
  } as Purchase;
}

const STOCK: StockState[] = ["ok", "low", "out"];

export function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (typeof r.id !== "string" || !name) return null;
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
  return {
    ...(r as object),
    id: r.id,
    name,
    category: (typeof r.category === "string"
      ? r.category
      : "other") as ShoppingCategory,
    unit: typeof r.unit === "string" && r.unit ? r.unit : "szt",
    lastPrice: num(r.lastPrice),
    lastAmount: num(r.lastAmount),
    lastBoughtAt: typeof r.lastBoughtAt === "string" ? r.lastBoughtAt : null,
    lastAddedAt: typeof r.lastAddedAt === "string" ? r.lastAddedAt : null,
    supply: r.supply === true,
    stockAmount: num(r.stockAmount),
    lowAt: num(r.lowAt),
    stock: STOCK.includes(r.stock as StockState)
      ? (r.stock as StockState)
      : undefined,
  } as Product;
}

// ─── Pamięć produktów ──────────────────────────────────────────────────────

/** Id dokumentu produktu: „Mozzarella” i „mozzarella ” to ten sam produkt */
export function productId(name: string): string {
  return productKey(name);
}

const visibilityOf = (item: { visibility?: ItemVisibility }) =>
  item.visibility === "private" ? "private" : "public";

/**
 * Produkt z pamięci dla nazwy: najpierw prywatny (moje ceny), potem wspólny.
 */
export function findProduct(
  products: readonly Product[],
  name: string,
  prefer: ItemVisibility = "private",
): Product | null {
  const id = productId(name);
  const matches = products.filter((p) => p.id === id);
  return matches.find((p) => visibilityOf(p) === prefer) ?? matches[0] ?? null;
}

/**
 * Podpowiedź ceny: ostatnia cena przeliczona na nową ilość, jeśli jednostki
 * da się przeliczyć (500 g za 6 zł → 1 kg ≈ 12 zł).
 */
export function suggestPrice(
  product: Product | null,
  amount: number | null,
  unit: string,
): number | null {
  if (!product || product.lastPrice === null) return null;
  if (
    amount === null ||
    product.lastAmount === null ||
    product.lastAmount <= 0
  ) {
    return product.lastPrice;
  }
  const converted = convertAmount(amount, unit, product.unit);
  if (converted === null) return product.lastPrice;
  return Math.round((product.lastPrice * converted) / product.lastAmount);
}

export type BoughtItem = {
  name: string;
  amount: number | null;
  unit: string;
  category: ShoppingCategory;
  price: number | null;
  visibility: ItemVisibility;
};

function withStock(product: Product): Product {
  if (!product.supply) return product;
  return { ...product, stock: stockStateOf(product) };
}

/**
 * Zapisuje zakup w pamięci: data, cena, a zapasom dokłada ilość.
 * Zwraca całą listę po zmianach (dla settera useVisibilityList).
 */
export function rememberBought(
  products: readonly Product[],
  bought: readonly BoughtItem[],
  now: string,
): Product[] {
  const next = [...products];
  for (const item of bought) {
    const id = productId(item.name);
    const index = next.findIndex(
      (p) => p.id === id && visibilityOf(p) === item.visibility,
    );
    const existing = index >= 0 ? next[index]! : null;
    const base: Product = existing ?? {
      id,
      name: item.name.trim(),
      category: item.category,
      unit: item.unit,
      lastPrice: null,
      lastAmount: null,
      lastBoughtAt: null,
      lastAddedAt: null,
      ...(item.visibility === "private" ? { visibility: "private" } : {}),
    };
    let updated: Product = {
      ...base,
      category: item.category,
      lastBoughtAt: now,
      ...(item.price !== null && item.price > 0
        ? { lastPrice: item.price, lastAmount: item.amount, unit: item.unit }
        : {}),
    };
    // Zapas liczony w starej jednostce — przelicz stan i próg na nową
    // (2 kg + zakup 500 g = 2500 g, nie 502 g). Gdy się nie da (kg ↔ szt.),
    // zapas zostaje w swojej jednostce.
    if (updated.supply && updated.unit !== base.unit) {
      const convert = (value: number | null | undefined) =>
        value === null || value === undefined
          ? value
          : convertAmount(value, base.unit, updated.unit);
      const stockAmount = convert(base.stockAmount);
      const lowAt = convert(base.lowAt);
      if (stockAmount === null && base.stockAmount != null) {
        updated = { ...updated, unit: base.unit };
      } else if (lowAt === null && base.lowAt != null) {
        updated = { ...updated, unit: base.unit };
      } else {
        updated = { ...updated, stockAmount, lowAt };
      }
    }
    if (updated.supply && item.amount !== null) {
      const added = convertAmount(item.amount, item.unit, updated.unit);
      if (added !== null) {
        updated = {
          ...updated,
          stockAmount: (updated.stockAmount ?? 0) + added,
        };
      }
    }
    updated = withStock(updated);
    if (index >= 0) next[index] = updated;
    else next.push(updated);
  }
  return next;
}

/** Zapamiętuje, kiedy produkt ostatnio trafił na listę zakupów */
export function rememberAdded(
  products: readonly Product[],
  item: {
    name: string;
    unit: string;
    category: ShoppingCategory;
    visibility: ItemVisibility;
    emoji?: string | null;
    color?: string | null;
  },
  now: string,
): Product[] {
  const id = productId(item.name);
  const index = products.findIndex(
    (p) => p.id === id && visibilityOf(p) === item.visibility,
  );
  const next = [...products];
  const looks = {
    ...(item.emoji ? { emoji: item.emoji } : {}),
    ...(item.color ? { color: item.color } : {}),
  };
  if (index >= 0) {
    next[index] = { ...next[index]!, lastAddedAt: now, ...looks };
  } else {
    next.push({
      id,
      name: item.name.trim(),
      category: item.category,
      unit: item.unit,
      lastPrice: null,
      lastAmount: null,
      lastBoughtAt: null,
      lastAddedAt: now,
      ...looks,
      ...(item.visibility === "private" ? { visibility: "private" } : {}),
    });
  }
  return next;
}

// ─── Zapasy ────────────────────────────────────────────────────────────────

export function stockStateOf(product: Product): StockState {
  const amount = product.stockAmount;
  if (amount === null || amount === undefined) return product.stock ?? "ok";
  if (amount <= 0) return "out";
  if (
    product.lowAt !== null &&
    product.lowAt !== undefined &&
    amount <= product.lowAt
  ) {
    return "low";
  }
  return "ok";
}

/** Zmiana ilości zapasu (zużycie −, dokupienie +) z nowym stanem */
export function changeStock(product: Product, delta: number): Product {
  const current = product.stockAmount ?? 0;
  const stockAmount = Math.max(0, Math.round((current + delta) * 100) / 100);
  return withStock({ ...product, stockAmount });
}

/** Czy zapas powinien trafić na listę zakupów */
export function needsRestock(product: Product): boolean {
  const state = product.supply ? stockStateOf(product) : product.stock;
  return state === "low" || state === "out";
}

export function stockLabel(state: StockState): string {
  return state === "out" ? "Brak" : state === "low" ? "Kończy się" : "Jest";
}

// ─── Daty „x dni temu” ─────────────────────────────────────────────────────

export function daysAgoLabel(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (!Number.isFinite(days)) return null;
  if (days <= 0) return "dziś";
  if (days === 1) return "wczoraj";
  return `${days} dni temu`;
}

// ─── Wspólne zakupy ────────────────────────────────────────────────────────

export type SplitResult = {
  title: string;
  total: number;
  paidBy: string;
  shares: Record<string, number>;
};

export function newPurchase(
  result: SplitResult,
  lines: PurchaseLine[],
  lock: boolean,
  now = new Date().toISOString(),
): Purchase {
  return {
    id: crypto.randomUUID(),
    title: result.title,
    items: lines,
    total: result.total,
    paidBy: result.paidBy,
    shares: result.shares,
    // Płacący oddaje sam sobie — od razu rozliczone
    settled: { [result.paidBy]: now },
    confirmed: { [result.paidBy]: now },
    refundRequestedAt: null,
    at: now,
    // Z kontem — zmienia tylko autor, pozostali mogą tylko „oddać”
    ...(lock ? { locked: true } : {}),
  };
}

/**
 * Oddanie części:
 * - paid — dłużnik (albo ktoś za niego) zaznacza „oddane”,
 * - confirm — płacący potwierdza, że pieniądze doszły,
 * - received — płacący sam zaznacza „otrzymane” (od razu potwierdzone),
 * - undo — cofnięcie obu.
 * „Oddane” liczy się w saldzie od razu; potwierdzenie to informacja dla
 * domowników, że płacący naprawdę dostał pieniądze.
 */
export type ShareAction = "paid" | "confirm" | "received" | "undo";

export function markShare<
  T extends {
    settled: Record<string, string>;
    confirmed?: Record<string, string>;
  },
>(
  item: T,
  person: string,
  action: ShareAction,
  at = new Date().toISOString(),
): T {
  const settled = { ...item.settled };
  const confirmed = { ...(item.confirmed ?? {}) };
  if (action === "undo") {
    delete settled[person];
    delete confirmed[person];
  } else {
    settled[person] ??= at;
    if (action !== "paid") confirmed[person] = at;
  }
  return { ...item, settled, confirmed };
}

// ─── Brakujące składniki na listę zakupów ─────────────────────────────────

export type MissingLine = { name: string; amount: number | null; unit: string };

/**
 * Dopisuje brakujące składniki do zakupów: bez duplikatów (to samo, co już
 * czeka na liście, zostaje), z kategorią i emotką z pamięci produktów.
 * Zwraca nową listę i ile pozycji doszło.
 */
export function addMissingToShopping(
  shopping: readonly ShoppingItem[],
  missing: readonly MissingLine[],
  products: readonly Product[],
  visibility: ItemVisibility,
): { next: ShoppingItem[]; added: number } {
  const next = [...shopping];
  let added = 0;
  for (const line of missing) {
    const waiting = next.some(
      (s) =>
        !s.checked &&
        foodKey(s.name) === foodKey(line.name) &&
        (s.visibility === "private" ? "private" : "public") === visibility,
    );
    if (waiting) continue;
    const known = findProduct(products, line.name, visibility);
    next.push({
      id: crypto.randomUUID(),
      name: line.name,
      amount: line.amount,
      unit: line.unit,
      category: known?.category ?? "other",
      checked: false,
      ...(known?.emoji ? { emoji: known.emoji } : {}),
      ...(known?.color ? { color: known.color } : {}),
      ...(visibility === "private" ? { visibility: "private" as const } : {}),
    });
    added++;
  }
  return { next, added };
}
