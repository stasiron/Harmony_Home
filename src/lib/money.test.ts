import { describe, expect, it } from "vitest";
import {
  formatPLN,
  netFor,
  pairBalances,
  parsePLN,
  settlePair,
  splitByWeights,
  splitEqual,
  toInputPLN,
  type SharedCost,
} from "@/lib/money";

describe("parsePLN / formatPLN", () => {
  it("czyta polskie i angielskie zapisy", () => {
    expect(parsePLN("12,50")).toBe(1250);
    expect(parsePLN("12.5")).toBe(1250);
    expect(parsePLN("1 234,99 zł")).toBe(123499);
    expect(parsePLN("7")).toBe(700);
  });

  it("odrzuca śmieci", () => {
    expect(parsePLN("")).toBeNull();
    expect(parsePLN("abc")).toBeNull();
    expect(parsePLN("1,234")).toBeNull();
    expect(parsePLN("-5")).toBeNull();
  });

  it("formatuje i wraca do pola", () => {
    // pl-PL grupuje tysiące dopiero od 5 cyfr
    expect(formatPLN(1234567).replace(/\s/g, " ")).toBe("12 345,67 zł");
    expect(formatPLN(1250).replace(/\s/g, " ")).toBe("12,50 zł");
    expect(toInputPLN(1250)).toBe("12,50");
    expect(toInputPLN(null)).toBe("");
  });
});

describe("podział", () => {
  it("po równo — reszta groszy się nie gubi", () => {
    const shares = splitEqual(1000, ["a", "b", "c"]);
    expect(Object.values(shares).reduce((s, v) => s + v, 0)).toBe(1000);
    expect(Object.values(shares).sort()).toEqual([333, 333, 334]);
  });

  it("według wag (większy pokój płaci więcej)", () => {
    const shares = splitByWeights(200000, { a: 40, b: 30, c: 30 });
    expect(shares).toEqual({ a: 80000, b: 60000, c: 60000 });
  });

  it("zero osób albo zero kwoty", () => {
    expect(splitEqual(1000, [])).toEqual({});
    expect(splitEqual(0, ["a"])).toEqual({ a: 0 });
  });
});

describe("saldo", () => {
  const costs: SharedCost[] = [
    // a zapłacił 90 zł za trzy osoby
    { id: "p1", paidBy: "a", shares: { a: 3000, b: 3000, c: 3000 } },
    // b zapłacił 20 zł za siebie i a
    { id: "p2", paidBy: "b", shares: { a: 1000, b: 1000 } },
  ];

  it("długi pary się znoszą", () => {
    const debts = pairBalances(costs);
    expect(debts).toContainEqual(
      expect.objectContaining({ from: "c", to: "a", amount: 3000 }),
    );
    expect(debts).toContainEqual(
      expect.objectContaining({ from: "b", to: "a", amount: 2000 }),
    );
    expect(debts).toHaveLength(2);
  });

  it("bilans osoby", () => {
    expect(netFor(costs, "a")).toBe(5000);
    expect(netFor(costs, "b")).toBe(-2000);
    expect(netFor(costs, "c")).toBe(-3000);
  });

  it("rozliczona część znika", () => {
    const settled = costs.map((c) => settlePair(c, "a", "b", "2026-11-18"));
    const debts = pairBalances(settled);
    expect(debts).toEqual([
      expect.objectContaining({ from: "c", to: "a", amount: 3000 }),
    ]);
  });

  it("rachunek bez płacącego nie tworzy długów", () => {
    expect(
      pairBalances([{ id: "x", paidBy: null, shares: { a: 100, b: 100 } }]),
    ).toEqual([]);
  });
});
