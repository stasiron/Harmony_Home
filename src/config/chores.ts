import choresData from "@content/data/chores.json";
import { normalizeTaskImportance } from "@/lib/choreImportance";
import { applyScheduleToTask } from "@/lib/choreRecurrence";
import type { Task } from "@/types";

type ChoreDefinition = Omit<Task, "lastCompleted" | "source">;

/**
 * Stałe obowiązki — edytuj content/data/chores.json.
 * Nie dodawaj ich ręcznie w UI; ładują się przy każdym starcie.
 * `assignedTo` = id z src/config/household.ts (member-1 …).
 */
export const PERMANENT_CHORES: Omit<Task, "lastCompleted">[] =
  choresData.chores.map((chore) =>
    normalizeTaskImportance(
      applyScheduleToTask({
        ...(chore as ChoreDefinition),
        source: "builtin",
      }),
    ),
  );

export const PERMANENT_CHORE_IDS = new Set(PERMANENT_CHORES.map((t) => t.id));
