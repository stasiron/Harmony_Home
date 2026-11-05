import type { ChoreWeightSettings, Status, Task, Zadanie } from "@/types";
import { CHORE_WEIGHT_DEFAULTS, zadanieWeight } from "@/config/choreWeight";

export { zadanieWeight } from "@/config/choreWeight";

export function thresholdStatus(
  daysSinceDone: number,
  tMin: number,
  tMax: number,
): Status {
  if (daysSinceDone < tMin) return "done";
  if (daysSinceDone >= tMax) return "must";
  if (daysSinceDone >= tMin) return "suggested";
  return "safe";
}

export type LinkedZadaniaSummary = {
  totalWeight: number;
  pendingWeight: number;
  criticalCount: number;
  pendingCount: number;
  choreStatus: Status;
};

export function summarizeLinkedZadania(
  linked: Zadanie[],
  statusOfZadanie: (zadanie: Zadanie) => Status,
  weights: ChoreWeightSettings = CHORE_WEIGHT_DEFAULTS,
): LinkedZadaniaSummary {
  const weightOf = (z: Zadanie) => zadanieWeight(z, weights);
  const totalWeight = linked.reduce((sum, z) => sum + weightOf(z), 0);
  let pendingWeight = 0;
  let criticalCount = 0;
  let pendingCount = 0;

  for (const zadanie of linked) {
    const status = statusOfZadanie(zadanie);
    if (status === "must") {
      criticalCount += 1;
      pendingCount += 1;
      pendingWeight += weightOf(zadanie);
    } else if (status === "suggested") {
      pendingCount += 1;
      pendingWeight += weightOf(zadanie);
    }
  }

  let choreStatus: Status = "safe";
  if (criticalCount > 0) {
    choreStatus = "must";
  } else if (
    totalWeight > 0 &&
    pendingWeight >= (totalWeight * weights.suggestThresholdPct) / 100
  ) {
    choreStatus = "suggested";
  } else if (
    linked.length > 0 &&
    linked.every((z) => statusOfZadanie(z) === "done")
  ) {
    choreStatus = "done";
  }

  return {
    totalWeight,
    pendingWeight,
    criticalCount,
    pendingCount,
    choreStatus,
  };
}

export function choreStatusFromLinkedZadania(
  task: Task,
  linked: Zadanie[],
  statusOfZadanie: (zadanie: Zadanie) => Status,
  weights: ChoreWeightSettings = CHORE_WEIGHT_DEFAULTS,
): Status | null {
  if (!task.linkedZadanieIds?.length || linked.length === 0) return null;
  return summarizeLinkedZadania(linked, statusOfZadanie, weights).choreStatus;
}

export function applyZadanieThresholds<
  T extends Omit<Zadanie, "lastCompleted">,
>(zadanie: T, tMin: number, tMax: number): T {
  const min = Math.max(0, tMin);
  const max = Math.max(min + 1, tMax);
  return {
    ...zadanie,
    recurrence: "recurring",
    schedule: undefined,
    tMin: min,
    tSuggested: min,
    tMax: max,
  };
}
