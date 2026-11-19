import { describe, expect, it } from "vitest";
import { fillGrid, parseFeatureFlags, resolveFeature } from "@/config/features";

const member = { superAdmin: false, admin: false };
const admin = { superAdmin: false, admin: true };
const superAdmin = { superAdmin: true, admin: true };

describe("blokady funkcji", () => {
  it("obowiązuje ostrzejsze z globalnego i mieszkania", () => {
    const view = resolveFeature(
      "page:/bills",
      { "page:/bills": "locked" },
      { "page:/bills": "hidden" },
      member,
    );
    expect(view).toEqual({ state: "hidden", forOthers: "hidden" });
  });

  it("administrator mieszkania omija swoje blokady, ale nie globalne", () => {
    expect(
      resolveFeature("btn:panic", {}, { "btn:panic": "hidden" }, admin),
    ).toEqual({ state: "on", forOthers: "hidden" });
    expect(
      resolveFeature("btn:panic", { "btn:panic": "locked" }, {}, admin),
    ).toEqual({ state: "locked", forOthers: "locked" });
  });

  it("administrator ogólny widzi wszystko, ze znaczkiem", () => {
    expect(
      resolveFeature(
        "tab:bills.balance",
        { "tab:bills.balance": "hidden" },
        {},
        superAdmin,
      ),
    ).toEqual({ state: "on", forOthers: "hidden" });
  });

  it("nieznane klucze i stany z bazy są pomijane", () => {
    expect(
      parseFeatureFlags({
        "page:/bills": "locked",
        "page:/nope": "hidden",
        "btn:panic": "maybe",
      }),
    ).toEqual({ "page:/bills": "locked" });
  });
});

describe("siatka kafelków bez dziur", () => {
  it("pełna siatka zostaje bez zmian", () => {
    expect(fillGrid([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], 3)).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2,
    ]);
    expect(fillGrid([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], 4)).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2,
    ]);
  });

  it("po ukryciu jednego kafelka ostatni się rozciąga", () => {
    // 9 małych + szeroki: na 3 kolumnach szeroki zaczyna nowy wiersz
    expect(fillGrid([1, 1, 1, 1, 1, 1, 1, 1, 1, 2], 3)).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 3,
    ]);
    // na 4 kolumnach: 8 + (1, 2) → ostatni wiersz 3/4, szeroki dostaje 3
    expect(fillGrid([1, 1, 1, 1, 1, 1, 1, 1, 1, 2], 4)).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 3,
    ]);
  });

  it("szeroki, który nie mieści się w wierszu, rozciąga poprzedni", () => {
    // 3 kolumny: [1,1] + szeroki nie wejdzie → drugi kafelek dostaje 2
    expect(fillGrid([1, 1, 2], 3)).toEqual([1, 2, 3]);
  });
});
