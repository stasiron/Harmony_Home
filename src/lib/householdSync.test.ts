import { describe, expect, it } from "vitest";
import {
  diffCollection,
  indexById,
  stableStringify,
  takeWriteBudget,
} from "@/lib/householdSync";

describe("stableStringify", () => {
  it("nie zależy od kolejności pól i pomija undefined", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: undefined } })).toBe(
      stableStringify({ a: { d: 2 }, b: 1 }),
    );
  });
});

describe("diffCollection", () => {
  const known = indexById([
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ]);

  it("zapisuje tylko zmienione i nowe, usuwa brakujące", () => {
    const diff = diffCollection(known, [
      { id: "a", name: "A" },
      { id: "c", name: "C" },
    ]);
    expect(diff.upserts.map((i) => i.id)).toEqual(["c"]);
    expect(diff.deletes).toEqual(["b"]);
  });

  it("zmiana pola = zapis tylko tego elementu", () => {
    const diff = diffCollection(known, [
      { id: "a", name: "A2" },
      { id: "b", name: "B" },
    ]);
    expect(diff.upserts).toEqual([{ id: "a", name: "A2" }]);
    expect(diff.deletes).toEqual([]);
  });
});

describe("takeWriteBudget", () => {
  const budget = { commits: 3, windowMs: 1000 };

  it("wstrzymuje zapisy ponad limit w oknie", () => {
    const times: number[] = [];
    expect(takeWriteBudget(times, 0, budget)).toBe(true);
    expect(takeWriteBudget(times, 10, budget)).toBe(true);
    expect(takeWriteBudget(times, 20, budget)).toBe(true);
    expect(takeWriteBudget(times, 30, budget)).toBe(false);
  });

  it("po upływie okna znów pozwala", () => {
    const times: number[] = [];
    for (const t of [0, 10, 20]) takeWriteBudget(times, t, budget);
    expect(takeWriteBudget(times, 1005, budget)).toBe(true);
    expect(times).toEqual([10, 20, 1005]);
  });

  it("odrzucony zapis nie zajmuje miejsca w budżecie", () => {
    const times: number[] = [];
    for (const t of [0, 10, 20, 30, 40]) takeWriteBudget(times, t, budget);
    expect(times).toEqual([0, 10, 20]);
  });
});
