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

/**
 * Kto stworzył element i czy zablokował edycję (docs/ROADMAP.md, decyzja 3a).
 * Zablokowany edytuje tylko twórca i administrator — reszta może odhaczać.
 */
export interface ItemMeta {
  /** uid konta Firebase, które stworzyło element */
  createdBy?: string;
  createdAt?: string;
  locked?: boolean;
}

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

/** „Na zmianę”: domownicy po kolei, każdy ma swoją turę (src/lib/rotation.ts) */
export interface TurnRotation {
  /** User.id w kolejności tur; rotacja działa od 2 osób */
  rotation?: string[];
  /** Indeks w `rotation` — czyja tura teraz */
  rotationTurn?: number;
}

export interface Zadanie extends ItemMeta, TurnRotation {
  id: string;
  name: string;
  description?: string;
  room: ChoreRoom;
  category:
    "kitchen" | "bathroom" | "living" | "bedroom" | "outdoor" | "general";
  estimatedMinutes: number;
  mapShape?: TaskMapShape;
  zoneId?: string;
  /** Wiele stref naraz (zadania) — zoneId = pierwsza */
  zoneIds?: string[];
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
  /** Wiele pokoi naraz — room = pierwszy */
  rooms?: ChoreRoom[];
  /** Wbudowane zadanie edytowane w UI — zapisywane jako nadpisanie JSON */
  customized?: boolean;
}

export interface User extends ItemMeta {
  id: string;
  name: string;
  avatar: string; // emoji or initial — easy to swap for image url
  color: string; // tailwind-compatible token (e.g. "chart-1")
  active: boolean;
  heavyDay: boolean;
}

export interface Task extends ItemMeta, TurnRotation {
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
  /** Wiele stref naraz — zoneId = pierwsza */
  zoneIds?: string[];
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
  /** Wiele pokoi naraz — room = pierwszy */
  rooms?: ChoreRoom[];
  /** Wbudowany obowiązek edytowany w UI — zapisywany jako nadpisanie JSON */
  customized?: boolean;
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

export interface ShoppingItem extends ItemMeta {
  id: string;
  name: string;
  category: ShoppingCategory;
  qty: string;
  checked: boolean;
}

/** Proste zapamiętane sprawy — nie obowiązki domowe */
export type TodoScope = "personal" | "household";

/** Domowe: ktoś jeden raz, albo każdy domownik po razie */
export type TodoHouseholdMode = "anyone" | "everyone";

/** Folder / zakładka do grupowania todo */
export interface TodoFolder extends ItemMeta {
  id: string;
  name: string;
  createdAt: string;
}

export interface TodoItem extends ItemMeta {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  scope: TodoScope;
  /** null / brak = bez folderu (inbox) */
  folderId?: string | null;
  /** Tylko dla scope: personal — kto ma to zrobić */
  assignedTo?: string | null;
  /** Tylko dla scope: household */
  householdMode?: TodoHouseholdMode;
  /** Id domowników którzy odhaczyli (everyone / opcjonalnie anyone) */
  completedBy?: string[];
}

/** Instrukcja prania — jak prać dany materiał / zestaw ubrań */
export interface LaundryProgram extends ItemMeta {
  id: string;
  /** Nazwa ubrań / materiałów */
  name: string;
  /** Tryb pralki (np. Bawełna, Delikatne) */
  mode: string;
  /** Temperatura w °C */
  temperature: number;
  /** Ilość płukań */
  rinses: number;
  /** Obroty wirówki */
  spin: number;
  createdAt: string;
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

export interface GuestPlan extends ItemMeta {
  id: string;
  when: string; // ISO
  notes: string;
}

export interface PanicState {
  active: boolean;
}

export type HouseholdRole = "admin" | "member";

export type HouseholdPresetId = "family" | "student" | "couple" | "single";

/** Skąd brać plan mieszkania */
export type FloorPlanRef =
  | { kind: "none" }
  /** Obrazek z content/images — tylko zmigrowane mieszkanie testowe */
  | { kind: "bundled" }
  /** households/{id}/assets/floorPlan */
  | { kind: "upload"; width: number; height: number; updatedAt: string };

export interface HouseholdMeta {
  id: string;
  name: string;
  preset: HouseholdPresetId | null;
  ownerId: string;
  createdAt: string;
  zones: HomeZone[];
  floorPlan: FloorPlanRef;
  /** Aktualny kod zaproszenia (invites/{code}) */
  inviteCode?: string;
  features?: {
    /** Kalendarze Google z src/config/calendars — tylko pierwsze mieszkanie */
    legacyCalendar?: boolean;
  };
}

/** Konto (lub urządzenie bez konta) z dostępem do mieszkania */
export interface HouseholdMember {
  uid: string;
  role: HouseholdRole;
  /** Który domownik (User.id) to ten człowiek */
  profileId: string | null;
  anonymous: boolean;
  displayName: string | null;
  email: string | null;
  /** sign_in_provider z tokenu: google.com, password (link e-mail), anonymous */
  provider?: string | null;
  joinedAt: string;
  inviteCode?: string;
}

/** Wpis w users/{uid}/memberships — lista mieszkań użytkownika */
export interface Membership {
  householdId: string;
  name: string;
  role: HouseholdRole;
  joinedAt: string;
  /** Widoczne tylko jako administrator ogólny — bez członkostwa */
  superAdmin?: boolean;
}
