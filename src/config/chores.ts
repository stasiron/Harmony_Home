import type { Task } from "@/types";

/**
 * Stałe, powtarzalne obowiązki — edytuj ten plik.
 * Nie dodawaj ich ręcznie w UI; ładują się przy każdym starcie.
 * `assignedTo` = id z src/config/household.ts (member-1 …).
 *
 * Wyzeruj `[]` jeśli na razie bez stałych zadań.
 */
export const PERMANENT_CHORES: Omit<Task, "lastCompleted">[] = [
  {
    id: "permanent-trash",
    name: "Wynieś śmieci",
    description: "Worki do pojemnika na podwórku",
    room: "kitchen",
    category: "kitchen",
    estimatedMinutes: 5,
    assignedTo: "member-1",
    recurrence: "recurring",
    source: "builtin",
    tMin: 1,
    tSuggested: 2,
    tMax: 3,
    isGuestPriority: true,
    isExpressBlitz: false,
  },
  {
    id: "permanent-vacuum-living",
    name: "Odkurz salon",
    room: "living",
    category: "living",
    estimatedMinutes: 20,
    assignedTo: "member-2",
    mapPins: [{ x: 20, y: 24 }],
    recurrence: "recurring",
    source: "builtin",
    tMin: 3,
    tSuggested: 5,
    tMax: 7,
    isGuestPriority: true,
    isExpressBlitz: true,
  },
  {
    id: "permanent-bathroom",
    name: "Wyczyść łazienkę",
    room: "bathroom",
    category: "bathroom",
    estimatedMinutes: 25,
    assignedTo: "",
    recurrence: "recurring",
    source: "builtin",
    tMin: 5,
    tSuggested: 7,
    tMax: 10,
    isGuestPriority: true,
    isExpressBlitz: false,
  },
];

export const PERMANENT_CHORE_IDS = new Set(PERMANENT_CHORES.map((t) => t.id));
