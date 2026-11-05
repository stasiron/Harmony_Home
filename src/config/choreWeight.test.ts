import { describe, expect, it } from "vitest";
import {
  resolveChoreWeights,
  trudnoscMultiplier,
  zadanieWeight,
} from "@/config/choreWeight";
import { summarizeLinkedZadania } from "@/lib/choreZadaniaStatus";
import type { Status, Zadanie } from "@/types";

const z = (id: string, minutes: number, importance: number) =>
  ({ id, estimatedMinutes: minutes, importance }) as unknown as Zadanie;

describe("wagi zadań mieszkania", () => {
  it("domyślnie liczą jak wcześniej", () => {
    expect(trudnoscMultiplier(5)).toBe(2);
    expect(zadanieWeight(z("a", 10, 5))).toBe(20);
  });

  it("„tylko czas” ignoruje trudność", () => {
    const settings = resolveChoreWeights({ difficultyImpact: 0 });
    expect(zadanieWeight(z("a", 10, 5), settings)).toBe(10);
  });

  it("zakresy są pilnowane", () => {
    expect(
      resolveChoreWeights({ difficultyImpact: 9, suggestThresholdPct: 5 }),
    ).toEqual({ difficultyImpact: 2, suggestThresholdPct: 10 });
    expect(resolveChoreWeights(undefined)).toEqual({
      difficultyImpact: 1,
      suggestThresholdPct: 50,
    });
  });

  it("próg „Warto zrobić” z ustawień", () => {
    const linked = [z("a", 30, 3), z("b", 10, 3)];
    const status = (item: Zadanie): Status =>
      item.id === "b" ? "suggested" : "done";
    // b = 25% wagi
    expect(summarizeLinkedZadania(linked, status).choreStatus).toBe("safe");
    expect(
      summarizeLinkedZadania(
        linked,
        status,
        resolveChoreWeights({ suggestThresholdPct: 20 }),
      ).choreStatus,
    ).toBe("suggested");
  });
});
