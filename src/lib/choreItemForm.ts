import type {
  ChoreRoom,
  MapPin,
  MapPoint,
  RecurrenceSchedule,
  TaskImportance,
  TaskMapShape,
  TaskRecurrence,
} from "@/types";
import {
  MAP_LINE_SETTINGS,
  resolveMapLineWidth,
} from "@/config/mapLine";
import {
  defaultRecurrenceForm,
  formToSchedule,
  type RecurrenceFormState,
} from "@/components/chores/RecurrencePicker";

export type ChoreItemFormState = {
  name: string;
  description: string;
  room: ChoreRoom;
  estimatedMinutes: string;
  assignedToIds: string[];
  mapPins: MapPin[];
  mapLine: MapPoint[];
  mapLineWidth: string;
  mapArea: MapPoint[];
  mapShape: TaskMapShape;
  zoneId: string;
  recurrence: TaskRecurrence;
  recurrenceForm: RecurrenceFormState;
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
    estimatedMinutes: "15",
    assignedToIds: [],
    mapPins: [],
    mapLine: [],
    mapLineWidth: String(MAP_LINE_SETTINGS.defaultWidth),
    mapArea: [],
    mapShape: "pin",
    zoneId: "",
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
  estimatedMinutes: number;
  assignedTo?: string[];
  mapShape?: TaskMapShape;
  zoneId?: string;
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

function parseSharedForm(form: ChoreItemFormState, includeAssignees: boolean) {
  const minutes = Number.parseInt(form.estimatedMinutes, 10);
  if (!form.name.trim() || Number.isNaN(minutes) || minutes < 1) return null;

  return {
    name: form.name,
    description: form.description.trim() || undefined,
    room: form.room,
    estimatedMinutes: minutes,
    ...(includeAssignees ? { assignedTo: form.assignedToIds } : {}),
    mapShape: form.mapShape,
    zoneId: form.zoneId || undefined,
    mapPins:
      form.mapShape === "pin" && form.mapPins.length > 0
        ? form.mapPins
        : undefined,
    mapLine:
      form.mapShape === "line" && form.mapLine.length >= 2
        ? form.mapLine
        : undefined,
    mapLineWidth:
      form.mapShape === "line" && form.mapLine.length >= 2
        ? resolveMapLineWidth(Number.parseFloat(form.mapLineWidth))
        : undefined,
    mapArea:
      form.mapShape === "area" && form.mapArea.length >= 3
        ? form.mapArea
        : undefined,
    importance: Number.parseInt(form.importance, 10) as TaskImportance,
  };
}

export function formToChoreItemInput(
  form: ChoreItemFormState,
): ChoreItemAddInput | null {
  const shared = parseSharedForm(form, true);
  if (!shared) return null;

  return {
    ...shared,
    recurrence: form.recurrence,
    schedule:
      form.recurrence === "recurring"
        ? formToSchedule(form.recurrenceForm)
        : undefined,
  };
}

export function formToZadanieInput(
  form: ChoreItemFormState,
): ZadanieAddInput | null {
  const shared = parseSharedForm(form, false);
  if (!shared) return null;

  const tMin = Number.parseInt(form.tMinDays, 10);
  const tMax = Number.parseInt(form.tMaxDays, 10);
  if (Number.isNaN(tMin) || Number.isNaN(tMax) || tMin < 0 || tMax <= tMin) {
    return null;
  }

  return { ...shared, tMin, tMax };
}

export function canSubmitChoreItemForm(form: ChoreItemFormState): boolean {
  return formToChoreItemInput(form) !== null;
}

export function canSubmitZadanieForm(form: ChoreItemFormState): boolean {
  return formToZadanieInput(form) !== null;
}
