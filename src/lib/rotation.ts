import type { Task, TurnRotation } from "@/types";
import { normalizeAssignedTo } from "@/lib/choreAssignees";

/**
 * Obowiązek / zadanie „na zmianę”: `rotation` = domownicy po kolei,
 * `rotationTurn` = indeks osoby, która ma teraz turę. Po odhaczeniu tura
 * przechodzi na następną osobę (niezależnie od tego, kto odhaczył).
 */

/** Kolejka bez pustych i powtórzonych id */
export function rotationMembers(item: TurnRotation): string[] {
  const seen = new Set<string>();
  return (item.rotation ?? []).filter((id) => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Rotacja ma sens od dwóch osób */
export function isRotating(item: TurnRotation): boolean {
  return rotationMembers(item).length >= 2;
}

function turnIndex(item: TurnRotation, length: number): number {
  const raw = Math.trunc(item.rotationTurn ?? 0);
  return ((raw % length) + length) % length;
}

/** Id osoby, która ma teraz turę (null, gdy brak rotacji) */
export function currentTurn(item: TurnRotation): string | null {
  const members = rotationMembers(item);
  if (members.length < 2) return null;
  return members[turnIndex(item, members.length)] ?? null;
}

/** Kolejne osoby od obecnej tury, np. [Ala, Olek, Ola] */
export function turnOrder(item: TurnRotation): string[] {
  const members = rotationMembers(item);
  if (members.length < 2) return members;
  const start = turnIndex(item, members.length);
  return [...members.slice(start), ...members.slice(0, start)];
}

/** Tura przechodzi na następną osobę */
export function advanceRotation<T extends TurnRotation>(item: T): T {
  const members = rotationMembers(item);
  if (members.length < 2) return item;
  return {
    ...item,
    rotationTurn: (turnIndex(item, members.length) + 1) % members.length,
  };
}

/**
 * Kto jest „przypisany” teraz — przy rotacji tylko osoba z turą, inaczej
 * wszyscy z `assignedTo`. Widoki (karta, domownicy, kalendarz) używają tego
 * zamiast samego `assignedTo`.
 */
export function effectiveAssignees(
  item: TurnRotation & { assignedTo?: Task["assignedTo"] },
): string[] {
  const turn = currentTurn(item);
  if (turn) return [turn];
  return normalizeAssignedTo(item.assignedTo);
}

/**
 * Indeks tury po zmianie listy osób: zostaje przy tej samej osobie, jeśli
 * nadal jest na liście; inaczej od pierwszej.
 */
export function keepTurnForList(
  previousIds: string[],
  previousTurn: number,
  nextIds: string[],
): number {
  const current = previousIds[previousTurn];
  const index = current ? nextIds.indexOf(current) : -1;
  return index >= 0 ? index : 0;
}

/**
 * Domownik usunięty z mieszkania znika z kolejki (tura zostaje u tej samej
 * osoby, a gdy była jego — przechodzi na następną) i z przypisanych.
 * Zwraca ten sam obiekt, gdy nic się nie zmienia (bez zbędnych zapisów).
 */
export function withoutPerson<
  T extends TurnRotation & { assignedTo?: string[] },
>(item: T, personId: string): T {
  const inRotation = (item.rotation ?? []).includes(personId);
  const inAssigned = (item.assignedTo ?? []).includes(personId);
  if (!inRotation && !inAssigned) return item;
  const next = { ...item };
  if (inRotation) {
    const before = rotationMembers(item);
    const after = before.filter((id) => id !== personId);
    const turn = before.length ? turnIndex(item, before.length) : 0;
    // Tura usuniętej osoby → następna w kolejce (ten sam indeks po usunięciu)
    next.rotation = after;
    next.rotationTurn =
      before[turn] === personId
        ? after.length
          ? turn % after.length
          : 0
        : keepTurnForList(before, turn, after);
  }
  if (inAssigned) {
    next.assignedTo = (item.assignedTo ?? []).filter((id) => id !== personId);
  }
  return next;
}

/**
 * Tura po wykonaniu przez konkretną osobę z kolejki: następna po niej.
 * Ważne przy nieobecnościach — zastępca nie dostaje od razu kolejnej tury.
 */
export function advanceRotationPast<T extends TurnRotation>(
  item: T,
  profileId: string | null | undefined,
): T {
  const members = rotationMembers(item);
  const index = profileId ? members.indexOf(profileId) : -1;
  if (members.length < 2 || index < 0) return advanceRotation(item);
  return { ...item, rotationTurn: (index + 1) % members.length };
}
