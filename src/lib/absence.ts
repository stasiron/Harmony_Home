import { normalizeAssignedTo } from "@/lib/choreAssignees";
import { isRotating, turnOrder } from "@/lib/rotation";
import type { Absence, Task, TurnRotation } from "@/types";

/**
 * Nieobecności i wyjazdy:
 * - kolejka „na zmianę” zawsze pomija nieobecnego — turę bierze następna
 *   obecna osoba,
 * - „przekaż innym”: obowiązek nieobecnego przechodzi na obecnych
 *   z przypisanych, a gdy nikogo — na wszystkich obecnych,
 * - „przesuń”: obowiązek czeka, a dni wyjazdu nie liczą się do zaległości.
 */

const DAY = 86_400_000;

/** YYYY-MM-DD w czasie lokalnym */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeAbsence(raw: unknown): Absence | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const date = (v: unknown) =>
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  const from = date(r.from);
  const to = date(r.to);
  if (typeof r.id !== "string" || typeof r.profileId !== "string") return null;
  if (!from || !to) return null;
  return {
    ...(r as object),
    id: r.id,
    profileId: r.profileId,
    from: from <= to ? from : to,
    to: from <= to ? to : from,
    note: typeof r.note === "string" ? r.note : "",
    mode: r.mode === "reassign" ? "reassign" : "shift",
  } as Absence;
}

/** Nieobecność osoby w dany dzień (albo null) */
export function absenceOn(
  absences: readonly Absence[],
  profileId: string,
  day: string,
): Absence | null {
  return (
    absences.find(
      (a) => a.profileId === profileId && a.from <= day && day <= a.to,
    ) ?? null
  );
}

/**
 * Kto ma dziś obowiązek, z uwzględnieniem nieobecności.
 * `everyone` — obecni domownicy (zastępstwo, gdy przypisani wyjechali).
 */
export function assigneesWithAbsences(
  item: TurnRotation & { assignedTo?: Task["assignedTo"] },
  absences: readonly Absence[],
  day: string,
  everyone: readonly string[],
): string[] {
  const absent = (id: string) => absenceOn(absences, id, day);

  if (isRotating(item)) {
    // Od osoby z turą — pierwsza obecna
    const next = turnOrder(item).find((id) => !absent(id));
    return next ? [next] : [];
  }

  const assigned = normalizeAssignedTo(item.assignedTo);
  if (assigned.length === 0) return [];
  const result = assigned.filter((id) => absent(id)?.mode !== "reassign");
  if (result.length > 0) return result;
  // Wszyscy przypisani oddali obowiązek — robi ktokolwiek obecny
  return everyone.filter((id) => !absent(id));
}

/**
 * Ile dni od ostatniego wykonania liczyć do zaległości: przy „przesuń”
 * odejmujemy dni wyjazdu wszystkich przypisanych (gdy każdy z nich był
 * wtedy nieobecny, nikt nie mógł tego zrobić).
 */
export function effectiveDaysSince(
  item: TurnRotation & {
    assignedTo?: Task["assignedTo"];
    lastCompleted: string;
  },
  absences: readonly Absence[],
  now: Date,
): number {
  const last = new Date(item.lastCompleted);
  const raw = Math.floor((now.getTime() - last.getTime()) / DAY);
  if (raw <= 0 || isRotating(item)) return raw;
  const assigned = normalizeAssignedTo(item.assignedTo);
  if (assigned.length === 0) return raw;

  let skipped = 0;
  const cursor = new Date(last);
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < raw; i++) {
    cursor.setTime(cursor.getTime() + DAY);
    const day = dayKey(cursor);
    const everyoneAway = assigned.every(
      (id) => absenceOn(absences, id, day)?.mode === "shift",
    );
    if (everyoneAway) skipped++;
  }
  return raw - skipped;
}

/** Ile dni z okresu osoba była obecna (do sprawiedliwego podziału) */
export function presentDays(
  absences: readonly Absence[],
  profileId: string,
  from: Date,
  to: Date,
): number {
  let days = 0;
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);
  const end = new Date(to);
  end.setHours(12, 0, 0, 0);
  while (cursor <= end) {
    if (!absenceOn(absences, profileId, dayKey(cursor))) days++;
    cursor.setTime(cursor.getTime() + DAY);
  }
  return days;
}
