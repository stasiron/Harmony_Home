import { normalizeTaskImportance } from "@/lib/choreImportance";
import { applyScheduleToTask } from "@/lib/choreRecurrence";
import { applyZadanieThresholds } from "@/lib/choreZadaniaStatus";
import type {
  ChoreRoom,
  HomeZone,
  HouseholdPresetId,
  RecurrenceSchedule,
  Task,
  TaskImportance,
  Zadanie,
} from "@/types";

/**
 * Presety nowego mieszkania (docs/ROADMAP.md, decyzja 4 i 6).
 * Przy tworzeniu preset kopiuje się do kolekcji mieszkania — potem każde
 * mieszkanie edytuje własną kopię, zmiana tutaj nie rusza istniejących.
 */

type ChoreDef = {
  id: string;
  name: string;
  description?: string;
  room: ChoreRoom;
  minutes: number;
  importance: TaskImportance;
  schedule: RecurrenceSchedule;
  zadania?: string[];
};

type ZadanieDef = {
  id: string;
  name: string;
  description?: string;
  room: ChoreRoom;
  minutes: number;
  importance: TaskImportance;
  tMin: number;
  tMax: number;
};

type ZoneDef = {
  id: string;
  name: string;
  room?: ChoreRoom;
  children?: ZoneDef[];
};

const days = (every: number): RecurrenceSchedule => ({
  type: "interval",
  unit: "days",
  every,
});
const weeks = (every: number): RecurrenceSchedule => ({
  type: "interval",
  unit: "weeks",
  every,
});

const CHORES = {
  trash: {
    id: "preset-trash",
    name: "Wynieś śmieci",
    room: "kitchen",
    minutes: 5,
    importance: 4,
    schedule: days(2),
  },
  dishes: {
    id: "preset-dishes",
    name: "Zmywanie / zmywarka",
    room: "kitchen",
    minutes: 15,
    importance: 4,
    schedule: days(1),
  },
  counters: {
    id: "preset-counters",
    name: "Wytrzyj blaty i kuchenkę",
    room: "kitchen",
    minutes: 10,
    importance: 3,
    schedule: days(2),
  },
  vacuum: {
    id: "preset-vacuum",
    name: "Odkurz mieszkanie",
    room: "whole",
    minutes: 30,
    importance: 3,
    schedule: weeks(1),
  },
  floors: {
    id: "preset-floors",
    name: "Umyj podłogi",
    room: "whole",
    minutes: 30,
    importance: 3,
    schedule: weeks(2),
  },
  bathroom: {
    id: "preset-bathroom",
    name: "Wyczyść łazienkę",
    description: "Szczegóły w zadaniach",
    room: "bathroom",
    minutes: 30,
    importance: 4,
    schedule: weeks(1),
    zadania: [
      "preset-z-sink",
      "preset-z-toilet",
      "preset-z-shower",
      "preset-z-mirror",
    ],
  },
  laundry: {
    id: "preset-laundry",
    name: "Pranie",
    room: "whole",
    minutes: 15,
    importance: 2,
    schedule: weeks(1),
  },
  bedding: {
    id: "preset-bedding",
    name: "Zmień pościel",
    room: "bedroom",
    minutes: 15,
    importance: 2,
    schedule: weeks(2),
  },
  fridge: {
    id: "preset-fridge",
    name: "Przejrzyj lodówkę",
    description: "Wyrzuć przeterminowane, dopisz braki do zakupów",
    room: "kitchen",
    minutes: 10,
    importance: 2,
    schedule: weeks(1),
  },
  groceries: {
    id: "preset-groceries",
    name: "Zakupy tygodniowe",
    room: "whole",
    minutes: 45,
    importance: 3,
    schedule: weeks(1),
  },
  plants: {
    id: "preset-plants",
    name: "Podlej kwiaty",
    room: "living",
    minutes: 5,
    importance: 2,
    schedule: days(4),
  },
  recycling: {
    id: "preset-recycling",
    name: "Segregacja: szkło, plastik, papier",
    room: "kitchen",
    minutes: 10,
    importance: 3,
    schedule: weeks(1),
  },
  supplies: {
    id: "preset-supplies",
    name: "Uzupełnij wspólne zapasy",
    description: "Papier, płyn do naczyń, środki czystości",
    room: "whole",
    minutes: 15,
    importance: 2,
    schedule: weeks(2),
  },
  sharedKitchen: {
    id: "preset-shared-kitchen",
    name: "Posprzątaj wspólną kuchnię",
    description: "Lodówka, szafki, zlew, podłoga",
    room: "kitchen",
    minutes: 25,
    importance: 4,
    schedule: weeks(1),
  },
  toys: {
    id: "preset-toys",
    name: "Posprzątaj zabawki",
    room: "living",
    minutes: 10,
    importance: 3,
    schedule: days(1),
  },
  kidsRooms: {
    id: "preset-kids-rooms",
    name: "Odkurz pokoje dzieci",
    room: "bedroom2",
    minutes: 20,
    importance: 3,
    schedule: weeks(1),
  },
  table: {
    id: "preset-table",
    name: "Nakryj i sprzątnij stół",
    room: "dining",
    minutes: 10,
    importance: 3,
    schedule: days(1),
  },
} satisfies Record<string, ChoreDef>;

const ZADANIA: ZadanieDef[] = [
  {
    id: "preset-z-sink",
    name: "Umyj umywalkę",
    description: "Bateria, misa, okolice lustra",
    room: "bathroom",
    minutes: 8,
    importance: 4,
    tMin: 4,
    tMax: 10,
  },
  {
    id: "preset-z-toilet",
    name: "Wyczyść toaletę",
    room: "bathroom",
    minutes: 10,
    importance: 4,
    tMin: 3,
    tMax: 7,
  },
  {
    id: "preset-z-shower",
    name: "Kabina / wanna",
    room: "bathroom",
    minutes: 15,
    importance: 3,
    tMin: 5,
    tMax: 14,
  },
  {
    id: "preset-z-mirror",
    name: "Lustro i półki",
    room: "bathroom",
    minutes: 5,
    importance: 2,
    tMin: 5,
    tMax: 14,
  },
];

const BASE: ChoreDef[] = [
  CHORES.trash,
  CHORES.dishes,
  CHORES.counters,
  CHORES.vacuum,
  CHORES.bathroom,
  CHORES.laundry,
  CHORES.bedding,
  CHORES.fridge,
];

export type HouseholdPreset = {
  id: HouseholdPresetId;
  name: string;
  description: string;
  chores: ChoreDef[];
  zones: ZoneDef[];
};

export const HOUSEHOLD_PRESETS: HouseholdPreset[] = [
  {
    id: "family",
    name: "Rodzina",
    description: "Dorośli i dzieci — codzienne porządki, pokoje dzieci, stół",
    chores: [
      ...BASE.map((chore) =>
        chore.id === CHORES.laundry.id
          ? { ...chore, schedule: days(3) }
          : chore,
      ),
      CHORES.floors,
      CHORES.groceries,
      CHORES.toys,
      CHORES.kidsRooms,
      CHORES.table,
    ],
    zones: [
      {
        id: "zone-day",
        name: "Strefa dzienna",
        children: [
          { id: "zone-living", name: "Salon", room: "living" },
          { id: "zone-dining", name: "Jadalnia", room: "dining" },
          { id: "zone-kitchen", name: "Kuchnia", room: "kitchen" },
        ],
      },
      {
        id: "zone-night",
        name: "Strefa nocna",
        children: [
          { id: "zone-bedroom", name: "Sypialnia rodziców", room: "bedroom" },
          { id: "zone-kids", name: "Pokój dzieci", room: "bedroom2" },
        ],
      },
      { id: "zone-bathroom", name: "Łazienka", room: "bathroom" },
      { id: "zone-hallway", name: "Przedpokój", room: "hallway" },
    ],
  },
  {
    id: "student",
    name: "Studenckie",
    description: "Współlokatorzy — wspólna kuchnia i łazienka, własne pokoje",
    chores: [
      ...BASE,
      CHORES.floors,
      CHORES.recycling,
      CHORES.supplies,
      CHORES.sharedKitchen,
    ],
    zones: [
      {
        id: "zone-shared",
        name: "Części wspólne",
        children: [
          { id: "zone-kitchen", name: "Kuchnia", room: "kitchen" },
          { id: "zone-bathroom", name: "Łazienka", room: "bathroom" },
          { id: "zone-hallway", name: "Przedpokój", room: "hallway" },
        ],
      },
      {
        id: "zone-rooms",
        name: "Pokoje",
        children: [
          { id: "zone-room-1", name: "Pokój 1", room: "bedroom" },
          { id: "zone-room-2", name: "Pokój 2", room: "bedroom2" },
        ],
      },
    ],
  },
  {
    id: "couple",
    name: "Para",
    description: "Dwie osoby — podział domowych obowiązków na pół",
    chores: [...BASE, CHORES.floors, CHORES.groceries, CHORES.plants],
    zones: [
      {
        id: "zone-day",
        name: "Strefa dzienna",
        children: [
          { id: "zone-living", name: "Salon", room: "living" },
          { id: "zone-kitchen", name: "Kuchnia", room: "kitchen" },
        ],
      },
      { id: "zone-bedroom", name: "Sypialnia", room: "bedroom" },
      { id: "zone-bathroom", name: "Łazienka", room: "bathroom" },
      { id: "zone-hallway", name: "Przedpokój", room: "hallway" },
    ],
  },
  {
    id: "single",
    name: "Jednoosobowe",
    description: "Tylko Ty — minimum, żeby mieszkanie nie zarosło",
    chores: BASE,
    zones: [
      { id: "zone-living", name: "Pokój", room: "living" },
      { id: "zone-kitchen", name: "Kuchnia", room: "kitchen" },
      { id: "zone-bathroom", name: "Łazienka", room: "bathroom" },
      { id: "zone-hallway", name: "Przedpokój", room: "hallway" },
    ],
  },
];

export function presetById(id: HouseholdPresetId): HouseholdPreset {
  const preset = HOUSEHOLD_PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown preset: ${id}`);
  return preset;
}

function roomCategory(room: ChoreRoom): Task["category"] {
  if (room === "kitchen") return "kitchen";
  if (room === "bathroom") return "bathroom";
  if (room === "bedroom" || room === "bedroom2") return "bedroom";
  if (room === "living" || room === "dining") return "living";
  return "general";
}

function flattenZones(defs: ZoneDef[], parentId: string | null): HomeZone[] {
  return defs.flatMap((def) => {
    const zone: HomeZone = {
      id: def.id,
      name: def.name,
      parentId,
      // Bez planu nie ma wielokątów — przestrzeń bez polygonu to tylko nazwa
      kind: def.children ? "group" : "space",
      ...(def.room ? { room: def.room } : {}),
    };
    return [zone, ...flattenZones(def.children ?? [], def.id)];
  });
}

/** Elementy presetu gotowe do zapisu w nowym mieszkaniu */
export function buildPresetItems(
  presetId: HouseholdPresetId,
  createdBy: string,
  now = new Date(),
): { chores: Task[]; zadania: Zadanie[]; zones: HomeZone[] } {
  const preset = presetById(presetId);
  const lastCompleted = now.toISOString();
  // Rosnące createdAt — zachowuje kolejność z presetu po syncu
  const stamp = (index: number) =>
    new Date(now.getTime() + index).toISOString();

  const chores = preset.chores.map((def, index): Task => {
    const zoneId = flattenZones(preset.zones, null).find(
      (zone) => zone.room === def.room,
    )?.id;
    return {
      ...normalizeTaskImportance(
        applyScheduleToTask({
          id: def.id,
          name: def.name,
          ...(def.description ? { description: def.description } : {}),
          room: def.room,
          category: roomCategory(def.room),
          estimatedMinutes: def.minutes,
          assignedTo: [],
          ...(zoneId ? { zoneId, mapShape: "zone" as const } : {}),
          recurrence: "recurring",
          schedule: def.schedule,
          source: "builtin",
          importance: def.importance,
          isGuestPriority: def.importance >= 4,
          isExpressBlitz: def.importance >= 5,
          ...(def.zadania ? { linkedZadanieIds: def.zadania } : {}),
        }),
      ),
      lastCompleted,
      createdBy,
      createdAt: stamp(index),
      locked: false,
    };
  });

  const usedZadania = new Set(preset.chores.flatMap((c) => c.zadania ?? []));
  const zadania = ZADANIA.filter((def) => usedZadania.has(def.id)).map(
    (def, index): Zadanie => ({
      ...applyZadanieThresholds(
        {
          id: def.id,
          name: def.name,
          ...(def.description ? { description: def.description } : {}),
          room: def.room,
          category: roomCategory(def.room),
          estimatedMinutes: def.minutes,
          recurrence: "recurring",
          source: "builtin",
          tMin: def.tMin,
          tSuggested: def.tMin,
          tMax: def.tMax,
          importance: def.importance,
          isGuestPriority: def.importance >= 4,
          isExpressBlitz: def.importance >= 5,
        },
        def.tMin,
        def.tMax,
      ),
      lastCompleted,
      createdBy,
      createdAt: stamp(index),
      locked: false,
    }),
  );

  return { chores, zadania, zones: flattenZones(preset.zones, null) };
}
