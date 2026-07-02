export type Status = "safe" | "suggested" | "must" | "done";

export type ChoreRoom =
  | "living"
  | "dining"
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "bedroom2"
  | "hallway"
  | "whole";

export type MapPin = { x: number; y: number };

/** Wierzchołek wielokąta na planie (% 0–100) */
export type MapPoint = MapPin;

export type HomeZoneKind = "group" | "space";

/** Strefa w drzewie domu — grupa (folder) lub przestrzeń z wielokątem */
export interface HomeZone {
  id: string;
  name: string;
  parentId: string | null;
  kind: HomeZoneKind;
  polygon?: MapPoint[];
  room?: ChoreRoom;
}

/** @deprecated użyj HomeZone */
export interface MapZone {
  id: string;
  room: ChoreRoom;
  label: string;
  polygon: MapPoint[];
}

export type TaskMapShape = "pin" | "line" | "area" | "zone";

export type TaskRecurrence = "once" | "recurring";

export type TaskSource = "builtin" | "user";

/** 1 = najmniej ważne, 5 = krytyczne */
export type TaskImportance = 1 | 2 | 3 | 4 | 5;

/** ISO weekday: 1 = poniedziałek … 7 = niedziela */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RecurrenceSchedule =
  | { type: "interval"; unit: "days" | "weeks" | "months"; every: number }
  | { type: "weekly"; weekdays: Weekday[]; everyWeeks: number };

export interface Zadanie {
  id: string;
  name: string;
  description?: string;
  room: ChoreRoom;
  category:
    | "kitchen"
    | "bathroom"
    | "living"
    | "bedroom"
    | "outdoor"
    | "general";
  estimatedMinutes: number;
  mapShape?: TaskMapShape;
  zoneId?: string;
  mapPins?: MapPin[];
  mapLine?: MapPoint[];
  /** Grubość linii na mapie (kształt line) */
  mapLineWidth?: number;
  mapArea?: MapPoint[];
  recurrence: TaskRecurrence;
  schedule?: RecurrenceSchedule;
  source: TaskSource;
  lastCompleted: string;
  tMin: number;
  tSuggested: number;
  tMax: number;
  importance: TaskImportance;
  isGuestPriority: boolean;
  isExpressBlitz: boolean;
  smartDeviceId?: string;
  /** Kto ostatnio wykonał zadanie (dla % obowiązku) */
  lastCompletedBy?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string; // emoji or initial — easy to swap for image url
  color: string; // tailwind-compatible token (e.g. "chart-1")
  active: boolean;
  heavyDay: boolean;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  room: ChoreRoom;
  category:
    "kitchen" | "bathroom" | "living" | "bedroom" | "outdoor" | "general";
  estimatedMinutes: number;
  /** User.id — może być wielu domowników */
  assignedTo: string[];
  /** Kształt na mapie: pinezka, linia, obszar lub cała strefa */
  mapShape?: TaskMapShape;
  /** Strefa z drzewa domu (dla mapShape zone lub powiązanie) */
  zoneId?: string;
  mapPins?: MapPin[];
  mapLine?: MapPoint[];
  /** Grubość linii na mapie (kształt line) */
  mapLineWidth?: number;
  mapArea?: MapPoint[];
  recurrence: TaskRecurrence;
  /** Harmonogram powtarzania — tylko dla recurrence: "recurring" */
  schedule?: RecurrenceSchedule;
  source: TaskSource;
  /** ISO date string of last completion */
  lastCompleted: string;
  /** earliest you'd consider doing it again */
  tMin: number;
  /** start nagging gently */
  tSuggested: number;
  /** hard deadline → red alert */
  tMax: number;
  /** 1 = najmniej ważne, 5 = krytyczne — kolejność w trybie PANIC_GOSCIE */
  importance: TaskImportance;
  isGuestPriority: boolean;
  isExpressBlitz: boolean;
  smartDeviceId?: string;
  /** Id zadań przypiętych do obowiązku */
  linkedZadanieIds?: string[];
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  timeMinutes: number;
  ingredients: { name: string; category: ShoppingCategory; qty: string }[];
}

export type ShoppingCategory =
  "produce" | "dairy" | "bakery" | "pantry" | "frozen" | "household";

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  qty: string;
  checked: boolean;
}

export interface SmartHomeDevice {
  id: string;
  name: string;
  room: string;
  type: "vacuum" | "washer" | "dryer" | "dishwasher" | "sensor";
  triggered: boolean;
  /** task id that this device auto-completes / generates */
  linkedTaskId?: string;
  /** if set, when triggered, generates a new high-priority task with this name */
  generatesTask?: string;
}

export interface GuestPlan {
  id: string;
  when: string; // ISO
  notes: string;
}

export interface PanicState {
  active: boolean;
}
