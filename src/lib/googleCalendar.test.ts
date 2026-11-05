import { describe, expect, it } from "vitest";
import { isGuestCalendarEvent } from "@/lib/googleCalendar";

describe("isGuestCalendarEvent", () => {
  it("słowo w tytule wystarcza", () => {
    expect(isGuestCalendarEvent("Goście u nas", "")).toBe(true);
    expect(isGuestCalendarEvent("Wizyta babci", "gdziekolwiek")).toBe(true);
  });

  it("adres z ustawień mieszkania — wszystkie fragmenty, bez polskich znaków", () => {
    const address = ["Andersa", "Częstochowa"];
    expect(
      isGuestCalendarEvent("Kolacja", "ul. Andersa 5, Czestochowa", address),
    ).toBe(true);
    expect(isGuestCalendarEvent("Kolacja", "Andersa 5, Kraków", address)).toBe(
      false,
    );
  });

  it("bez adresu w ustawieniach miejsce nic nie włącza", () => {
    expect(isGuestCalendarEvent("Kolacja", "ul. Andersa 5, Częstochowa")).toBe(
      false,
    );
  });
});
