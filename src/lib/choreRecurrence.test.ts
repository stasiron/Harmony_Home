import { describe, expect, it } from "vitest";
import {
  applyScheduleToTask,
  DEFAULT_SCHEDULE,
  deriveThresholds,
} from "@/lib/choreRecurrence";

describe("applyScheduleToTask", () => {
  it("liczy progi z harmonogramu", () => {
    const schedule = {
      type: "interval",
      unit: "days",
      every: 2,
    } as const;
    const result = applyScheduleToTask({ recurrence: "recurring", schedule });

    expect(result).toMatchObject(deriveThresholds(schedule));
  });

  it("zostawia istniejące progi bez harmonogramu", () => {
    const result = applyScheduleToTask({
      recurrence: "once",
      tMin: 1,
      tSuggested: 2,
      tMax: 3,
    });

    expect(result).toMatchObject({ tMin: 1, tSuggested: 2, tMax: 3 });
  });

  it("jednorazowy bez progów dostaje zera", () => {
    expect(applyScheduleToTask({ recurrence: "once" })).toMatchObject({
      tMin: 0,
      tSuggested: 0,
      tMax: 0,
    });
  });

  it("powtarzalny bez harmonogramu i progów dostaje domyślny harmonogram", () => {
    expect(applyScheduleToTask({ recurrence: "recurring" })).toMatchObject(
      deriveThresholds(DEFAULT_SCHEDULE),
    );
  });
});
