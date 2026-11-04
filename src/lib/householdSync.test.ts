import { describe, expect, it } from "vitest";
import {
  diffCollection,
  indexById,
  stableStringify,
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
