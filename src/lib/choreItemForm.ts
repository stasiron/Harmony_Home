import type {
  ChoreRoom,
  MapPin,
  MapPoint,
  RecurrenceSchedule,
  Task,
  TaskImportance,
  TaskMapShape,
  TaskRecurrence,
  Zadanie,
} from "@/types";
import {
  MAP_LINE_SETTINGS,
  resolveMapLineWidth,
} from "@/config/mapLine";
import {
  defaultRecurrenceForm,
  formToSchedule,
  scheduleToForm,
  type RecurrenceForm,
} from "@/components/chores/RecurrencePicker";
import { normalizeAssignedTo } from "@/lib/choreAssignees";

export type ChoreItemFormState = {
  name: string;
  description: string;
  room: ChoreRoom;
  /** Multi-lokalizacja */
  rooms: ChoreRoom[];
  estimatedMinutes: string;
  assignedToIds: string[];
  mapPins: MapPin[];
  mapLine: MapPoint[];
  mapLineWidth: string;
  mapArea: MapPoint[];
  mapShape: TaskMapShape;
  zoneId: string;
  zoneIds: string[];
  recurrence: TaskRecurrence;
  recurrenceForm: RecurrenceForm;
  importance: `${TaskImportance}`;
  linkedZadanieIds: string[];
  /** Dni do pierwszego przypomnienia (tylko zadania) */
  tMinDays: string;
  /** Dni do stanu krytycznego (tylko zadania) */
  tMaxDays: string;
};

export function emptyChoreItemForm(): ChoreItemFormState {
  return {
    name: "",
    description: "",
    room: "kitchen",
    rooms: ["kitchen"],
    estimatedMinutes: "15",
    assignedToIds: [],
    mapPins: [],
    mapLine: [],
    mapLineWidth: String(MAP_LINE_SETTINGS.defaultWidth),
    mapArea: [],
    mapShape: "pin",
    zoneId: "",
    zoneIds: [],
    recurrence: "recurring",
    recurrenceForm: defaultRecurrenceForm(),
    importance: "3",
    linkedZadanieIds: [],
    tMinDays: "3",
    tMaxDays: "7",
  };
}

export type ChoreItemAddInput = {
  name: string;
  description?: string;
  room: ChoreRoom;
  rooms?: ChoreRoom[];
  estimatedMinutes: number;
  assignedTo?: string[];
  mapShape?: TaskMapShape;
  zoneId?: string;
  zoneIds?: string[];
  mapPins?: MapPin[];
  mapLine?: MapPoint[];
  mapLineWidth?: number;
  mapArea?: MapPoint[];
  recurrence?: TaskRecurrence;
  schedule?: RecurrenceSchedule;
  importance?: TaskImportance;
};

export type ZadanieAddInput = ChoreItemAddInput & {
  tMin: number;
  tMax: number;
};

function resolveLocationFromForm(form: ChoreItemFormState) {
  const zoneIds = form.zoneIds.length > 0 ? form.zoneIds : undefined;
  const rooms =
    !zoneIds && form.rooms.length > 0 ? form.rooms : undefined;
  if (!zoneIds && !rooms) return null;

  return {
    room: rooms?.[0] ?? form.room,
    zoneId: zoneIds?.[0],
    rooms,
    zoneIds,
    mapShape: (zoneIds
      ? "zone"
      : form.mapShape === "zone"
        ? "pin"
        : form.mapShape) as TaskMapShape,
  };
}

export function formToChoreItemInput(
  form: ChoreItemFormState,
): ChoreItemAddInput | null {
  if (!form.name.trim()) return null;
  if (form.linkedZadanieIds.length === 0) return null;

  const importance = Number.parseInt(form.importance, 10) as TaskImportance;

  return {
    name: form.name,
    description: form.description.trim() || undefined,
    /** Lokalizacja/czas/mapa obowiązków pochodzą z podpiętych zadań. */
    room: "whole",
    rooms: ["whole"],
    estimatedMinutes: 1,
    assignedTo: form.assignedToIds,
    mapShape: undefined,
    zoneId: undefined,
    zoneIds: undefined,
    mapPins: undefined,
    mapLine: undefined,
    mapLineWidth: undefined,
    mapArea: undefined,
    recurrence: form.recurrence,
    schedule:
      form.recurrence === "recurring"
        ? formToSchedule(form.recurrenceForm)
        : undefined,
    importance: Number.isNaN(importance) ? 3 : importance,
  };
}

export function formToZadanieInput(
  form: ChoreItemFormState,
): ZadanieAddInput | null {
  const minutesRaw = form.estimatedMinutes.trim();
  const minutes =
    minutesRaw === "" ? 15 : Number.parseInt(minutesRaw, 10);
  if (!form.name.trim() || Number.isNaN(minutes) || minutes < 1) return null;

  const location = resolveLocationFromForm(form);
  if (!location) return null;

  const tMinRaw = form.tMinDays.trim();
  const tMaxRaw = form.tMaxDays.trim();
  const tMin = tMinRaw === "" ? 3 : Number.parseInt(tMinRaw, 10);
  const tMax = tMaxRaw === "" ? 7 : Number.parseInt(tMaxRaw, 10);
  if (Number.isNaN(tMin) || Number.isNaN(tMax) || tMin < 0 || tMax <= tMin) {
    return null;
  }

  return {
    name: form.name,
    description: form.description.trim() || undefined,
    ...location,
    estimatedMinutes: minutes,
    mapPins:
      location.mapShape === "pin" && form.mapPins.length > 0
        ? form.mapPins
        : undefined,
    mapLine:
      location.mapShape === "line" && form.mapLine.length >= 2
        ? form.mapLine
        : undefined,
    mapLineWidth:
      location.mapShape === "line" && form.mapLine.length >= 2
        ? resolveMapLineWidth(Number.parseFloat(form.mapLineWidth))
        : undefined,
    mapArea:
      location.mapShape === "area" && form.mapArea.length >= 3
        ? form.mapArea
        : undefined,
    importance: Number.parseInt(form.importance, 10) as TaskImportance,
    tMin,
    tMax,
  };
}

export function taskToChoreItemForm(task: Task): ChoreItemFormState {
  const zoneIds = task.zoneIds?.length
    ? task.zoneIds
    : task.zoneId
      ? [task.zoneId]
      : [];
  const rooms = zoneIds.length
    ? []
    : task.rooms?.length
      ? task.rooms
      : [task.room];

  return {
    name: task.name,
    description: task.description ?? "",
    room: task.room,
    rooms,
    estimatedMinutes: String(task.estimatedMinutes),
    assignedToIds: normalizeAssignedTo(task.assignedTo),
    mapPins: task.mapPins ?? [],
    mapLine: task.mapLine ?? [],
    mapLineWidth: String(
      task.mapLineWidth ?? MAP_LINE_SETTINGS.defaultWidth,
    ),
    mapArea: task.mapArea ?? [],
    mapShape: task.mapShape ?? (zoneIds.length > 0 ? "zone" : "pin"),
    zoneId: zoneIds[0] ?? "",
    zoneIds,
    recurrence: task.recurrence,
    recurrenceForm: task.schedule
      ? scheduleToForm(task.schedule)
      : defaultRecurrenceForm(),
    importance: String(resolveImportanceSafe(task.importance)) as `${TaskImportance}`,
    linkedZadanieIds: task.linkedZadanieIds ?? [],
    tMinDays: "3",
    tMaxDays: "7",
  };
}

export function zadanieToChoreItemForm(zadanie: Zadanie): ChoreItemFormState {
  const zoneIds = zadanie.zoneIds?.length
    ? zadanie.zoneIds
    : zadanie.zoneId
      ? [zadanie.zoneId]
      : [];
  const rooms = zoneIds.length
    ? []
    : zadanie.rooms?.length
      ? zadanie.rooms
      : [zadanie.room];

  return {
    name: zadanie.name,
    description: zadanie.description ?? "",
    room: zadanie.room,
    rooms: rooms.length > 0 ? rooms : ["kitchen"],
    estimatedMinutes: String(zadanie.estimatedMinutes || 15),
    assignedToIds: [],
    mapPins: zadanie.mapPins ?? [],
    mapLine: zadanie.mapLine ?? [],
    mapLineWidth: String(
      zadanie.mapLineWidth ?? MAP_LINE_SETTINGS.defaultWidth,
    ),
    mapArea: zadanie.mapArea ?? [],
    mapShape: zadanie.mapShape ?? (zoneIds.length > 0 ? "zone" : "pin"),
    zoneId: zoneIds[0] ?? "",
    zoneIds,
    recurrence: "once",
    recurrenceForm: defaultRecurrenceForm(),
    importance: String(
      resolveImportanceSafe(zadanie.importance),
    ) as `${TaskImportance}`,
    linkedZadanieIds: [],
    tMinDays: String(zadanie.tMin),
    tMaxDays: String(zadanie.tMax),
  };
}

function resolveImportanceSafe(value: TaskImportance | undefined): TaskImportance {
  if (value == null || Number.isNaN(Number(value))) return 3;
  return Math.min(5, Math.max(1, Number(value))) as TaskImportance;
}

export function canSubmitChoreItemForm(form: ChoreItemFormState): boolean {
  return formToChoreItemInput(form) !== null;
}

export function canSubmitZadanieForm(form: ChoreItemFormState): boolean {
  return formToZadanieInput(form) !== null;
}

/** Baby-steps: one concern per step, not all fields at once. */
export type ChoreFormStepId = "basics" | "place" | "details" | "extra";

export type ChoreFormStepMeta = {
  id: ChoreFormStepId;
  title: string;
  hint: string;
};

export const CHORE_FORM_STEPS: ChoreFormStepMeta[] = [
  {
    id: "basics",
    title: "Nazwa",
    hint: "Jak nazwać ten zbiór zadań?",
  },
  {
    id: "details",
    title: "Kto i rytm",
    hint: "Osoby, ważność, powtarzalność.",
  },
  {
    id: "extra",
    title: "Zadania",
    hint: "Podłącz wolne (niepodpięte) zadania.",
  },
];

export const ZADANIE_FORM_STEPS: ChoreFormStepMeta[] = [
  {
    id: "basics",
    title: "Nazwa",
    hint: "Jak nazwać to zadanie?",
  },
  {
    id: "place",
    title: "Progi czasu",
    hint: "Kiedy prosi, kiedy krytyczne.",
  },
  {
    id: "details",
    title: "Miejsce i waga",
    hint: "Gdzie i jak ważne.",
  },
  {
    id: "extra",
    title: "Mapa",
    hint: "Opcjonalnie — możesz pominąć.",
  },
];

export function choreFormStepsFor(
  mode: "chore" | "zadanie",
): ChoreFormStepMeta[] {
  return mode === "zadanie" ? ZADANIE_FORM_STEPS : CHORE_FORM_STEPS;
}

function hasLocation(form: ChoreItemFormState): boolean {
  return form.zoneIds.length > 0 || form.rooms.length > 0;
}

/** Soft check for Dalej — puste pola → domyślne wartości. */
function canProceedZadaniePlace(form: ChoreItemFormState): boolean {
  const minutesRaw = form.estimatedMinutes.trim();
  const minutes =
    minutesRaw === "" ? 15 : Number.parseInt(minutesRaw, 10);
  if (Number.isNaN(minutes) || minutes < 1) return false;

  const tMinRaw = form.tMinDays.trim();
  const tMaxRaw = form.tMaxDays.trim();
  const tMin = tMinRaw === "" ? 3 : Number.parseInt(tMinRaw, 10);
  const tMax = tMaxRaw === "" ? 7 : Number.parseInt(tMaxRaw, 10);
  if (Number.isNaN(tMin) || Number.isNaN(tMax) || tMin < 0 || tMax <= tMin) {
    return false;
  }
  return true;
}

/** Can leave current step and go forward. */
export function canProceedChoreFormStep(
  form: ChoreItemFormState,
  stepId: ChoreFormStepId,
  mode: "chore" | "zadanie",
): boolean {
  switch (stepId) {
    case "basics":
      return form.name.trim().length > 0;
    case "place":
      if (mode === "zadanie") return canProceedZadaniePlace(form);
      return true;
    case "details":
      if (mode === "chore") return true;
      return hasLocation(form);
    case "extra":
      return true;
  }
}
