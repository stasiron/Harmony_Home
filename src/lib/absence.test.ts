import { describe, expect, it } from "vitest";
import {
  absenceOn,
  assigneesWithAbsences,
  effectiveDaysSince,
  presentDays,
} from "@/lib/absence";
import { advanceRotationPast } from "@/lib/rotation";
import type { Absence } from "@/types";

const away = (
  profileId: string,
  from: string,
  to: string,
  mode: Absence["mode"],
): Absence => ({
  id: `${profileId}-${from}`,
  profileId,
  from,
  to,
  note: "",
  mode,
});

const EVERYONE = ["ala", "bob", "cela"];

describe("nieobecności", () => {
  it("dzień nieobecności liczony włącznie", () => {
    const list = [away("ala", "2026-11-20", "2026-11-22", "shift")];
    expect(absenceOn(list, "ala", "2026-11-20")).not.toBeNull();
    expect(absenceOn(list, "ala", "2026-11-22")).not.toBeNull();
    expect(absenceOn(list, "ala", "2026-11-23")).toBeNull();
    expect(absenceOn(list, "bob", "2026-11-21")).toBeNull();
  });

  it("kolejka pomija nieobecnego, zastępca nie dostaje od razu kolejnej tury", () => {
    const item = { rotation: ["ala", "bob", "cela"], rotationTurn: 0 };
    const list = [away("ala", "2026-11-20", "2026-11-25", "shift")];
    const day = "2026-11-21";
    expect(assigneesWithAbsences(item, list, day, EVERYONE)).toEqual(["bob"]);
    const after = advanceRotationPast(item, "bob");
    expect(assigneesWithAbsences(after, list, day, EVERYONE)).toEqual(["cela"]);
  });

  it("„przekaż innym” — robią pozostali, a gdy nikt z przypisanych — wszyscy obecni", () => {
    const list = [away("ala", "2026-11-20", "2026-11-25", "reassign")];
    const day = "2026-11-21";
    expect(
      assigneesWithAbsences(
        { assignedTo: ["ala", "bob"] },
        list,
        day,
        EVERYONE,
      ),
    ).toEqual(["bob"]);
    expect(
      assigneesWithAbsences({ assignedTo: ["ala"] }, list, day, EVERYONE),
    ).toEqual(["bob", "cela"]);
  });

  it("„przesuń” — obowiązek zostaje przy osobie", () => {
    const list = [away("ala", "2026-11-20", "2026-11-25", "shift")];
    expect(
      assigneesWithAbsences(
        { assignedTo: ["ala"] },
        list,
        "2026-11-21",
        EVERYONE,
      ),
    ).toEqual(["ala"]);
  });

  it("„przesuń” — dni wyjazdu nie liczą się do zaległości", () => {
    const item = { assignedTo: ["ala"], lastCompleted: "2026-11-10T12:00:00" };
    const now = new Date("2026-11-20T12:00:00");
    expect(effectiveDaysSince(item, [], now)).toBe(10);
    const list = [away("ala", "2026-11-14", "2026-11-17", "shift")];
    expect(effectiveDaysSince(item, list, now)).toBe(6);
    // Przekazanie innym nie wstrzymuje licznika
    const handed = [away("ala", "2026-11-14", "2026-11-17", "reassign")];
    expect(effectiveDaysSince(item, handed, now)).toBe(10);
  });

  it("dni obecności w okresie", () => {
    const list = [away("ala", "2026-11-03", "2026-11-05", "shift")];
    expect(
      presentDays(
        list,
        "ala",
        new Date("2026-11-01T08:00:00"),
        new Date("2026-11-10T20:00:00"),
      ),
    ).toBe(7);
  });
});
