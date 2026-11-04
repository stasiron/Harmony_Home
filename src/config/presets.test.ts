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

  it("rodzina pierze co 3 dni", () => {
    const { chores } = buildPresetItems("family", "uid-1");
    expect(chores.find((c) => c.id === "preset-laundry")?.schedule).toEqual({
      type: "interval",
      unit: "days",
      every: 3,
    });
  });
});
