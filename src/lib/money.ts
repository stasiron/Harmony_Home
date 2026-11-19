/**
 * Pieniądze w groszach (liczby całkowite) — bez błędów zaokrągleń przy
 * dzieleniu rachunków. Osoby to `User.id` (profile domowników).
 */

const PLN = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPLN(grosze: number): string {
  return PLN.format(grosze / 100);
}

/** „12,50”, „12.5”, „12 zł”, „1 234,99” → grosze; null gdy puste/niepoprawne */
export function parsePLN(text: string): number | null {
  const cleaned = text
    .replace(/zł|pln/gi, "")
    // \s obejmuje też twardą spację z Intl.NumberFormat
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!cleaned) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** Grosze jako tekst do pola edycji: 1250 → „12,50” */
export function toInputPLN(grosze: number | null | undefined): string {
  if (grosze === null || grosze === undefined) return "";
  return (grosze / 100).toFixed(2).replace(".", ",");
}

/**
 * Podział proporcjonalny do wag. Reszta groszy trafia kolejno do osób
 * z największą częścią ułamkową, więc suma zawsze zgadza się z `total`.
 */
export function splitByWeights(
  total: number,
  weights: Record<string, number>,
): Record<string, number> {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const sum = entries.reduce((acc, [, w]) => acc + w, 0);
  if (entries.length === 0 || sum <= 0 || total <= 0) {
    return Object.fromEntries(entries.map(([id]) => [id, 0]));
  }
  const raw = entries.map(([id, w]) => {
    const exact = (total * w) / sum;
    return { id, base: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let rest = total - raw.reduce((acc, r) => acc + r.base, 0);
  const order = [...raw].sort(
    (a, b) => b.frac - a.frac || (a.id < b.id ? -1 : 1),
  );
  const result: Record<string, number> = Object.fromEntries(
    raw.map((r) => [r.id, r.base]),
  );
  for (const r of order) {
    if (rest <= 0) break;
    result[r.id]! += 1;
    rest -= 1;
  }
  return result;
}

export function splitEqual(
  total: number,
  ids: readonly string[],
): Record<string, number> {
  return splitByWeights(
    total,
    Object.fromEntries([...new Set(ids)].map((id) => [id, 1])),
  );
}

/** Coś, co ktoś zapłacił za innych: rachunek albo wspólny zakup */
export type SharedCost = {
  id: string;
  paidBy: string | null;
  shares: Record<string, number>;
  /** profileId → kiedy oddał(a) swoją część */
  settled?: Record<string, string>;
};

/** Ile `debtor` jest jeszcze winien płacącemu za ten koszt */
export function openShare(cost: SharedCost, debtor: string): number {
  if (!cost.paidBy || debtor === cost.paidBy) return 0;
  if (cost.settled?.[debtor]) return 0;
  return cost.shares[debtor] ?? 0;
}

export type PairDebt = {
  /** Kto oddaje */
  from: string;
  /** Komu */
  to: string;
  amount: number;
  /** Koszty, które składają się na ten dług (w obie strony) */
  costIds: string[];
};

/**
 * Saldo par: długi w obie strony między dwiema osobami się znoszą,
 * zostaje jedna kwota „kto komu ile”. Rozliczenie pary zamyka wszystkie
 * jej koszty — dlatego nie upraszczamy długów przez trzecie osoby.
 */
export function pairBalances(costs: readonly SharedCost[]): PairDebt[] {
  const pairs = new Map<
    string,
    { a: string; b: string; net: number; costIds: Set<string> }
  >();
  for (const cost of costs) {
    if (!cost.paidBy) continue;
    for (const debtor of Object.keys(cost.shares)) {
      const amount = openShare(cost, debtor);
      if (amount <= 0) continue;
      const [a, b] =
        debtor < cost.paidBy ? [debtor, cost.paidBy] : [cost.paidBy, debtor];
      const key = `${a}|${b}`;
      const pair = pairs.get(key) ?? { a, b, net: 0, costIds: new Set() };
      // net > 0: a jest winien b
      pair.net += debtor === a ? amount : -amount;
      pair.costIds.add(cost.id);
      pairs.set(key, pair);
    }
  }
  const result: PairDebt[] = [];
  for (const { a, b, net, costIds } of pairs.values()) {
    if (net === 0) continue;
    result.push({
      from: net > 0 ? a : b,
      to: net > 0 ? b : a,
      amount: Math.abs(net),
      costIds: [...costIds],
    });
  }
  return result.sort((x, y) => y.amount - x.amount);
}

/** Bilans osoby: + należy jej się, − jest winna */
export function netFor(costs: readonly SharedCost[], person: string): number {
  let net = 0;
  for (const cost of costs) {
    if (!cost.paidBy) continue;
    if (cost.paidBy === person) {
      for (const debtor of Object.keys(cost.shares)) {
        net += openShare(cost, debtor);
      }
    } else {
      net -= openShare(cost, person);
    }
  }
  return net;
}

/**
 * Najmniej przelewów, żeby wszyscy byli na zero: największy dłużnik oddaje
 * największemu wierzycielowi, aż do wyrównania. Tylko podpowiedź —
 * rozliczenie dalej zaznacza się parami (wtedy wiadomo, które koszty).
 */
export function simplifyTransfers(
  costs: readonly SharedCost[],
  people: readonly string[],
): { from: string; to: string; amount: number }[] {
  const balances = people
    .map((id) => ({ id, net: netFor(costs, id) }))
    .filter((p) => p.net !== 0);
  const debtors = balances
    .filter((p) => p.net < 0)
    .map((p) => ({ id: p.id, left: -p.net }))
    .sort((a, b) => b.left - a.left);
  const creditors = balances
    .filter((p) => p.net > 0)
    .map((p) => ({ id: p.id, left: p.net }))
    .sort((a, b) => b.left - a.left);
  const transfers: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i]!.left, creditors[j]!.left);
    if (amount > 0) {
      transfers.push({ from: debtors[i]!.id, to: creditors[j]!.id, amount });
    }
    debtors[i]!.left -= amount;
    creditors[j]!.left -= amount;
    if (debtors[i]!.left === 0) i++;
    if (creditors[j]!.left === 0) j++;
  }
  return transfers;
}

/** Zamyka udziały między dwiema osobami (oba kierunki) */
export function settlePair<T extends SharedCost>(
  cost: T,
  x: string,
  y: string,
  at: string,
): T {
  if (!cost.paidBy || (cost.paidBy !== x && cost.paidBy !== y)) return cost;
  const debtor = cost.paidBy === x ? y : x;
  if (openShare(cost, debtor) <= 0) return cost;
  return { ...cost, settled: { ...(cost.settled ?? {}), [debtor]: at } };
}
