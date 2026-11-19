import { describe, expect, it } from "vitest";
import { buildPresetItems, HOUSEHOLD_PRESETS } from "@/config/presets";

describe("presety mieszkań", () => {
  it("są cztery: rodzina, studenckie, para, jednoosobowe", () => {
    expect(HOUSEHOLD_PRESETS.map((p) => p.name)).toEqual([
      "Rodzina",
      "Studenckie",
      "Para",
      "Jednoosobowe",
    ]);
  });

  for (const preset of HOUSEHOLD_PRESETS) {
    it(`${preset.name}: spójne dane`, () => {
      const { chores, zadania, zones } = buildPresetItems(preset.id, "uid-1");
      const ids = chores.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);

      const zadaniaIds = new Set(zadania.map((z) => z.id));
      const zoneIds = new Set(zones.map((z) => z.id));
      for (const chore of chores) {
        expect(chore.createdBy).toBe("uid-1");
        expect(chore.assignedTo).toEqual([]);
        expect(chore.tMax).toBeGreaterThan(0);
        for (const id of chore.linkedZadanieIds ?? []) {
          expect(zadaniaIds.has(id)).toBe(true);
        }
        if (chore.zoneId) expect(zoneIds.has(chore.zoneId)).toBe(true);
      }
      for (const zone of zones) {
        if (zone.parentId) expect(zoneIds.has(zone.parentId)).toBe(true);
      }
    });
  }

  it("studenckie: pokój na osobę, wspólne na zmianę z rozłożonymi turami", () => {
    const people = ["a", "b", "c", "d"];
    const { chores, zones } = buildPresetItems("student", "uid-1", new Date(), {
      profileIds: people,
    });
    const rooms = zones.filter((z) => z.parentId === "zone-rooms");
    expect(rooms.map((r) => r.name)).toEqual([
      "Pokój 1",
      "Pokój 2",
      "Pokój 3",
      "Pokój 4",
    ]);
    for (const chore of chores) {
      expect(chore.rotation).toEqual(people);
      expect(chore.assignedTo).toEqual(people);
    }
    // Tury nie zaczynają się wszystkie od pierwszej osoby
    expect(new Set(chores.map((c) => c.rotationTurn)).size).toBe(4);
    // Prywatne sprawy (pościel, pranie) nie są wspólnym obowiązkiem
    expect(chores.some((c) => c.id === "preset-bedding")).toBe(false);
  });

  it("studenckie: wybrane obowiązki i granice liczby osób", () => {
    const { chores, zones } = buildPresetItems("student", "uid-1", new Date(), {
      choreIds: ["preset-trash", "preset-freezer"],
      profileIds: ["a", "b", "c", "d", "e", "f"],
    });
    expect(chores.map((c) => c.id)).toEqual(["preset-trash", "preset-freezer"]);
    expect(zones.filter((z) => z.parentId === "zone-rooms")).toHaveLength(5);
  });

  it("rodzina pierze co 3 dni", () => {
    const { chores } = buildPresetItems("family", "uid-1");
    expect(chores.find((c) => c.id === "preset-laundry")?.schedule).toEqual({
      type: "interval",
      unit: "days",
      every: 3,
    });
  });
});
