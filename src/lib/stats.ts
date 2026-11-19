import { presentDays } from "@/lib/absence";
import type { Absence, Completion, User } from "@/types";

export type PersonStats = {
  id: string;
  name: string;
  count: number;
  minutes: number;
  /** Suma wag wykonanych obowiązków */
  points: number;
  /** Dni obecności w okresie */
  daysPresent: number;
  /** Ile punktów „wypadało” zrobić przy równym podziale (wg obecności) */
  fairPoints: number;
  /** points / fairPoints × 100; null — brak danych */
  fairShare: number | null;
};

/**
 * Kto ile zrobił w okresie — z historii wykonań. Sprawiedliwa część liczona
 * proporcjonalnie do dni obecności: kto wyjechał na tydzień, nie „odstaje”.
 */
export function statsByPerson(
  completions: readonly Completion[],
  users: readonly User[],
  absences: readonly Absence[],
  from: Date,
  to: Date,
): { people: PersonStats[]; unassigned: number; totalPoints: number } {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const inRange = completions.filter((c) => c.at >= fromIso && c.at <= toIso);
  const people = users.filter((u) => u.active !== false);

  const base = people.map((u) => {
    const mine = inRange.filter((c) => c.by === u.id);
    return {
      id: u.id,
      name: u.name,
      count: mine.length,
      minutes: mine.reduce((s, c) => s + (c.minutes || 0), 0),
      points:
        Math.round(mine.reduce((s, c) => s + (c.weight || 0), 0) * 10) / 10,
      daysPresent: presentDays(absences, u.id, from, to),
    };
  });

  const totalPoints = base.reduce((s, p) => s + p.points, 0);
  const totalDays = base.reduce((s, p) => s + p.daysPresent, 0);
  const result: PersonStats[] = base.map((p) => {
    const fairPoints =
      totalDays > 0 ? (totalPoints * p.daysPresent) / totalDays : 0;
    return {
      ...p,
      fairPoints: Math.round(fairPoints * 10) / 10,
      fairShare:
        fairPoints > 0 ? Math.round((p.points / fairPoints) * 100) : null,
    };
  });

  return {
    people: result.sort((a, b) => b.points - a.points),
    unassigned: inRange.filter((c) => !c.by).length,
    totalPoints: Math.round(totalPoints * 10) / 10,
  };
}
