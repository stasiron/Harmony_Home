import type { Zadanie } from "@/types";

/**
 * Ustawienia liczenia wagi zadań (przy agregacji obowiązków i % wykonania).
 *
 * ## Wzór
 *
 * ```
 * WAGA = czas × (TRUDNOSC / MAKS_TRUDNOSC + 1)
 * ```
 *
 * | Symbol         | Znaczenie                                      |
 * |----------------|------------------------------------------------|
 * | `czas`         | `estimatedMinutes` — szacowany czas w minutach |
 * | `TRUDNOSC`     | `importance` — trudność / ważność (1 … max)    |
 * | `MAKS_TRUDNOSC`| górny limit skali trudności (patrz poniżej)      |
 *
 * Przykład przy `MAKS_TRUDNOSC = 5`:
 * - trudność 1 → mnożnik 1,2
 * - trudność 3 → mnożnik 1,6
 * - trudność 5 → mnożnik 2,0
 *
 * Waga wpływa na:
 * - próg 50% zadań do statusu „sugerowane” obowiązku
 * - % wykonania obowiązku per domownik (wg `lastCompletedBy`)
 */
export const CHORE_WEIGHT_SETTINGS = {
  /** Górna granica skali trudności w wzorze (obecnie UI: 1–5, można podnieść) */
  maksTrudnosc: 5,
  /** Maks. czas (min) w formularzach zadania / obowiązku */
  maksCzasMinut: 480,
  /** Minimalna waga wynikowa — unika dzielenia przez 0 i zerowych udziałów */
  minWaga: 1,
} as const;

export const WEIGHT_FORMULA_LATEX =
  "WAGA = czas × (TRUDNOSC / MAKS_TRUDNOSC + 1)";

export function clampTrudnosc(value: number): number {
  const { maksTrudnosc } = CHORE_WEIGHT_SETTINGS;
  return Math.min(maksTrudnosc, Math.max(1, value));
}

export function clampCzasMinut(value: number): number {
  const { maksCzasMinut, minWaga } = CHORE_WEIGHT_SETTINGS;
  return Math.min(maksCzasMinut, Math.max(minWaga, value));
}

/** Mnożnik trudności: TRUDNOSC / MAKS_TRUDNOSC + 1 */
export function trudnoscMultiplier(trudnosc: number): number {
  const { maksTrudnosc } = CHORE_WEIGHT_SETTINGS;
  return clampTrudnosc(trudnosc) / maksTrudnosc + 1;
}

/**
 * Waga pojedynczego zadania wg {@link CHORE_WEIGHT_SETTINGS} i wzoru powyżej.
 */
export function zadanieWeight(zadanie: Zadanie): number {
  const { minWaga } = CHORE_WEIGHT_SETTINGS;
  const czas = clampCzasMinut(zadanie.estimatedMinutes);
  const waga = czas * trudnoscMultiplier(zadanie.importance);
  return Math.max(minWaga, waga);
}
