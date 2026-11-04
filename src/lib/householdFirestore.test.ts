import { describe, expect, it } from "vitest";
import {
  seedEmptyListsFromLocal,
  type HouseholdSnapshot,
  type SeedableList,
} from "@/lib/householdFirestore";
import type { ShoppingItem } from "@/types";

const milk: ShoppingItem = {
  id: "s1",
  name: "Mleko",
  category: "dairy",
  qty: "1",
  checked: false,
};

function snapshot(patch: Partial<HouseholdSnapshot>): HouseholdSnapshot {
  return {
    progress: {},
    progressBy: {},
    userTasks: [],
    userZadania: [],
    users: [],
    shopping: [],
    guestPlans: [],
    todos: [],
    todoFolders: [],
    laundryPrograms: [],
    ...patch,
  };
}

describe("seedEmptyListsFromLocal", () => {
  it("uzupełnia listę, której pola nie ma w dokumencie", () => {
    const missing = new Set<SeedableList>(["shopping"]);
    const seeded = seedEmptyListsFromLocal(
      snapshot({}),
      snapshot({ shopping: [milk] }),
      missing,
    );

    expect(seeded.shopping).toEqual([milk]);
  });

  it("nie przywraca celowo wyczyszczonej listy z innego urządzenia", () => {
    const seeded = seedEmptyListsFromLocal(
      snapshot({ shopping: [] }),
      snapshot({ shopping: [milk] }),
      new Set(),
    );

    expect(seeded.shopping).toEqual([]);
  });
});
