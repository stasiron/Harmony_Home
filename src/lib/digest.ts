import { thresholdStatus } from "@/lib/choreZadaniaStatus";
import { formatPLN, openShare } from "@/lib/money";
import { effectiveAssignees } from "@/lib/rotation";
import type { Bill, Purchase, Task, Zadanie } from "@/types";

/**
 * Poranne podsumowanie jednej osoby — czysta funkcja (serwer wysyła wynik
 * jako powiadomienie). Puste = nic do przypomnienia.
 */

const daysSince = (iso: string, now: Date) =>
  Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);

/** Obowiązki osoby na dziś: należne i zaległe */
export function choresFor(
  profileId: string,
  items: readonly (Task | Zadanie)[],
  now: Date,
  /** Kto dziś jest — nieobecnych pomija kolejka (etap nieobecności) */
  assigneesOf: (item: Task | Zadanie) => string[] = (item) =>
    effectiveAssignees(item as Task),
): { due: number; overdue: number; names: string[] } {
  let due = 0;
  let overdue = 0;
  const names: string[] = [];
  for (const item of items) {
    if (!item.lastCompleted) continue;
    const status = thresholdStatus(
      daysSince(item.lastCompleted, now),
      item.tMin,
      item.tMax,
    );
    if (status !== "must" && status !== "suggested") continue;
    if (!assigneesOf(item).includes(profileId)) continue;
    if (status === "must") overdue++;
    else due++;
    if (names.length < 3) names.push(item.name);
  }
  return { due, overdue, names };
}

const shortDate = (iso: string) => iso.slice(5).split("-").reverse().join(".");

export function digestLines({
  profileId,
  items,
  bills,
  purchases,
  nameOf,
  now,
  today,
  assigneesOf,
}: {
  profileId: string;
  items: readonly (Task | Zadanie)[];
  bills: readonly Bill[];
  purchases: readonly Purchase[];
  nameOf: (profileId: string) => string;
  now: Date;
  /** YYYY-MM-DD w czasie polskim */
  today: string;
  assigneesOf?: (item: Task | Zadanie) => string[];
}): string[] {
  const lines: string[] = [];
  const chore = choresFor(profileId, items, now, assigneesOf);
  const total = chore.due + chore.overdue;
  if (total > 0) {
    lines.push(
      `Obowiązki: ${chore.names.join(", ")}${total > chore.names.length ? "…" : ""}${
        chore.overdue > 0 ? ` (zaległe: ${chore.overdue})` : ""
      }`,
    );
  }

  const soon = new Date(`${today}T12:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 3);
  const soonIso = soon.toISOString().slice(0, 10);
  for (const bill of bills) {
    const share = bill.shares?.[profileId] ?? 0;
    if (share <= 0 || bill.paidBy || !bill.dueOn) continue;
    if (bill.dueOn < today || bill.dueOn > soonIso) continue;
    lines.push(
      `${bill.name}: ${formatPLN(bill.amount)} do ${shortDate(bill.dueOn)} (Twoja część ${formatPLN(share)})`,
    );
  }

  const refunds = purchases.filter(
    (p) => p.refundRequestedAt && openShare(p, profileId) > 0,
  );
  if (refunds.length > 0) {
    const sum = refunds.reduce((s, p) => s + openShare(p, profileId), 0);
    const to = [...new Set(refunds.map((p) => nameOf(p.paidBy)))].join(", ");
    lines.push(`Do oddania: ${formatPLN(sum)} (${to})`);
  }
  return lines;
}
