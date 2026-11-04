import { describe, expect, it } from "vitest";
import { localDate, versionFromCommitTimes } from "@/lib/appVersion.build";

const at = (iso: string) => Date.parse(iso) / 1000;

describe("versionFromCommitTimes", () => {
  it("liczy commity z dnia ostatniego commita", () => {
    expect(
      versionFromCommitTimes([
        at("2026-11-04T20:00:00Z"),
        at("2026-11-04T09:00:00Z"),
        at("2026-11-03T12:00:00Z"),
        at("2026-11-04T08:00:00Z"),
      ]),
    ).toBe("2026-11-04:2.0");
  });

  it("pierwszy commit dnia to 1.0", () => {
    expect(versionFromCommitTimes([at("2026-11-05T10:00:00Z")])).toBe(
      "2026-11-05:1.0",
    );
  });

  it("dzień według czasu w Warszawie", () => {
    // 23:30 UTC = 00:30 następnego dnia w Warszawie
    expect(localDate(at("2026-11-04T23:30:00Z"))).toBe("2026-11-05");
  });

  it("brak commitów", () => {
    expect(versionFromCommitTimes([])).toBeNull();
  });
});
