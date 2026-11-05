import { describe, expect, it } from "vitest";
import { normalizeIcalUrl } from "@/lib/personalIcal";

describe("normalizeIcalUrl", () => {
  it("Google, Outlook i iCloud przechodzą", () => {
    expect(
      normalizeIcalUrl(
        "https://calendar.google.com/calendar/ical/abc%40group/private-x/basic.ics",
      ),
    ).toContain("calendar.google.com");
    expect(
      normalizeIcalUrl("https://outlook.office365.com/owa/calendar/x.ics"),
    ).not.toBeNull();
    expect(
      normalizeIcalUrl("webcal://p42-caldav.icloud.com/published/2/abc"),
    ).toMatch(/^https:\/\/p42-caldav\.icloud\.com\//);
  });

  it("http, adresy wewnętrzne i obce strony odrzucone", () => {
    expect(
      normalizeIcalUrl("http://calendar.google.com/calendar/ical/x.ics"),
    ).toBeNull();
    expect(normalizeIcalUrl("https://169.254.169.254/latest")).toBeNull();
    expect(normalizeIcalUrl("https://localhost/x.ics")).toBeNull();
    expect(
      normalizeIcalUrl("https://calendar.google.com.evil.com/x.ics"),
    ).toBeNull();
    expect(normalizeIcalUrl("nie link")).toBeNull();
  });
});
