import { describe, expect, it } from "vitest";
import { DEFAULT_MEMBERS } from "@/config/household";
import { PERMANENT_CHORES } from "@/config/chores";
import { buildLegacyMigration } from "@/lib/legacyHousehold";
import type { Task } from "@/types";

describe("buildLegacyMigration", () => {
  it("pusty dokument → wbudowane obowiązki i domyślni domownicy", () => {
    const items = buildLegacyMigration(undefined, "owner");
    expect(items.chores.map((c) => c.id)).toEqual(
      PERMANENT_CHORES.map((c) => c.id),
    );
    expect(items.profiles.map((p) => p.id)).toEqual(
      DEFAULT_MEMBERS.map((m) => m.id),
    );
  });

  it("przenosi postęp, nadpisania i listy z twórcą = właściciel", () => {
    const builtin = PERMANENT_CHORES[0]!.id;
    const when = "2026-10-01T10:00:00.000Z";
    const items = buildLegacyMigration(
      {
        progress: { [builtin]: when },
        shopping: [
          {
            id: "s1",
            name: "Mleko",
            category: "dairy",
            qty: "1",
            checked: false,
          },
        ],
        todos: [
          {
            id: "t1",
            text: "Zadzwonić",
            done: false,
            createdAt: "2026-09-01T00:00:00.000Z",
            scope: "household",
          },
        ],
      },
      "owner",
    );

    expect(
      (items.chores.find((c) => c.id === builtin) as Task | undefined)
        ?.lastCompleted,
    ).toBe(when);
    expect(items.shopping[0]).toMatchObject({
      id: "s1",
      createdBy: "owner",
      locked: false,
    });
    // Istniejące createdAt zostaje — kolejność todo się nie zmienia
    expect(items.todos[0]?.createdAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("zachowuje kolejność przez rosnące createdAt", () => {
    const items = buildLegacyMigration(undefined, "owner");
    const stamps = items.chores.map((c) => c.createdAt!);
    expect([...stamps].sort()).toEqual(stamps);
  });
});
