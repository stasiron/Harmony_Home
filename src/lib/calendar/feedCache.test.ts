import { describe, expect, it } from "vitest";
import {
  FEED_MAX_AGE_MS,
  lastDailySync,
  msUntilStale,
} from "@/lib/calendar/feedCache";

const at = (h: number, m = 0, day = 5) =>
  new Date(2026, 10, day, h, m).getTime();

describe("synchronizacja kalendarza", () => {
  it("ostatnia 8:00", () => {
    expect(lastDailySync(at(9))).toBe(at(8));
    expect(lastDailySync(at(7))).toBe(at(8, 0, 4));
  });

  it("dane sprzed 8:00 są nieaktualne po 8:00", () => {
    expect(msUntilStale(at(7, 50), at(8, 5))).toBe(0);
  });

  it("świeże dane ważne najwyżej FEED_MAX_AGE_MS", () => {
    expect(msUntilStale(at(9), at(9))).toBe(FEED_MAX_AGE_MS);
    expect(msUntilStale(at(9), at(13))).toBe(0);
  });

  it("wieczorem ważne do jutrzejszej 8:00, nie dłużej", () => {
    expect(msUntilStale(at(7), at(7, 30))).toBeLessThanOrEqual(30 * 60 * 1000);
  });

  it("brak danych — od razu do pobrania", () => {
    expect(msUntilStale(0, at(10))).toBe(0);
  });
});
