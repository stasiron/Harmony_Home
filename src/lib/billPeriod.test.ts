import { describe, expect, it } from "vitest";
import {
  isDueInMonth,
  monthlyEquivalent,
  nextDueMonth,
  periodLabel,
  resolveBillSettings,
} from "@/lib/bills";
import type { BillTypeConfig } from "@/types";

const base = resolveBillSettings(undefined).types[0]!;
const quarterly: BillTypeConfig = {
  ...base,
  period: { everyMonths: 3, startMonth: "2026-01" },
};

describe("okres rachunku", () => {
  it("bez okresu — co miesiąc", () => {
    expect(isDueInMonth(base, "2026-02")).toBe(true);
    expect(periodLabel(base)).toBe("co miesiąc");
    expect(monthlyEquivalent(base, 600)).toBeNull();
  });

  it("co kwartał od stycznia: I, IV, VII, X", () => {
    const due = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-10"].map(
      (m) => isDueInMonth(quarterly, m),
    );
    expect(due).toEqual([true, false, false, true, true]);
    expect(isDueInMonth(quarterly, "2027-01")).toBe(true);
  });

  it("miesiące przed startem liczą się wstecz", () => {
    expect(isDueInMonth(quarterly, "2025-10")).toBe(true);
    expect(isDueInMonth(quarterly, "2025-11")).toBe(false);
  });

  it("co rok i najbliższy termin", () => {
    const yearly: BillTypeConfig = {
      ...base,
      period: { everyMonths: 12, startMonth: "2026-09" },
    };
    expect(nextDueMonth(yearly, "2026-11")).toBe("2027-09");
    expect(nextDueMonth(quarterly, "2026-11")).toBe("2027-01");
  });

  it("≈ kwota na miesiąc", () => {
    expect(monthlyEquivalent(quarterly, 36000)).toBe(12000);
  });

  it("wbudowane mają ikonę i kolor", () => {
    expect(base).toMatchObject({ icon: "home", color: "tag-1" });
  });
});
