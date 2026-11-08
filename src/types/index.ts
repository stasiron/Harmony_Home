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
/**
 * Publiczne (domyślnie) — widzi każdy domownik, choć może należeć do jednej
 * osoby. Prywatne — wyjątek: zapisane w households/{id}/private/{uid}/…,
 * widzi tylko autor (wymaga konta).
 */
export type ItemVisibility = "public" | "private";

export interface ItemMeta {
  /** uid konta Firebase, które stworzyło element */
  createdBy?: string;
  createdAt?: string;
  locked?: boolean;
  /** Brak = publiczne */
  visibility?: ItemVisibility;
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

export interface RecipeIngredient {
  name: string;
  /** null — „do smaku”, bez ilości */
  amount: number | null;
  unit: string;
  /** Opcjonalny — nie blokuje „możesz ugotować” */
  optional?: boolean;
}

/**
 * Przepis — zawsze czyjś (konto). `share`: tylko autor, wszyscy domownicy
 * albo wybrane konta (`sharedWith`, w Firestore jako mapa uid → true).
 */
export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  steps: string[];
  notes: string;
  share: "private" | "all" | "people";
  sharedWith: string[];
  createdBy: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export type ShoppingCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "bakery"
  | "pantry"
  | "frozen"
  | "drinks"
  | "household"
  | "other";

export interface ShoppingItem extends ItemMeta {
  id: string;
  name: string;
  category: ShoppingCategory;
  /** null — bez ilości */
  amount: number | null;
  unit: string;
  checked: boolean;
}

/** Produkt w lodówce / spiżarni */
export interface FridgeItem extends ItemMeta {
  id: string;
  name: string;
  category: ShoppingCategory;
  amount: number | null;
  unit: string;
  /** Termin przydatności, YYYY-MM-DD */
  expiresOn: string | null;
}

/** Wpis w Poradniku — „jak to zrobić” (sprzątanie, sprzęty, kuchnia…) */
export interface GuideNote extends ItemMeta {
  id: string;
  title: string;
  category: GuideCategory;
  body: string;
  updatedAt?: string;
}

export type GuideCategory =
  "cleaning" | "devices" | "kitchen" | "home" | "other";

/** Rodzaj pola we własnej zakładce Poradnika */
export type GuideFieldType =
  | "text" // krótki tekst
  | "longtext" // opis
  | "choice" // jedna z listy (a/b/c)
  | "multi" // kilka z listy
  | "scale" // skala słów: mało / średnio / dużo
  | "range" // liczba z zakresu (suwak)
  | "number" // dowolna liczba
  | "checkbox" // tak / nie
  | "date";

export interface GuideField {
  id: string;
  label: string;
  type: GuideFieldType;
  required: boolean;
  /** choice / multi / scale */
  options?: string[];
  /** range / number */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/** Własna zakładka Poradnika — jak arkusz: nazwa + pola */
export interface GuideTab extends ItemMeta {
  id: string;
  name: string;
  emoji: string;
  fields: GuideField[];
}

export type GuideFieldValue = string | number | boolean | string[] | null;

/** Wpis we własnej zakładce — wartości pól po id pola */
export interface GuideEntry extends ItemMeta {
  id: string;
  tabId: string;
  values: Record<string, GuideFieldValue>;
  updatedAt?: string;
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
  /** Wspólny dla mieszkania — kiedy i kto włączył */
  startedAt?: string;
  startedBy?: string;
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

/** Jak liczyć wagę zadań w obowiązku — ustawia admin mieszkania */
export interface ChoreWeightSettings {
  /** 0 = liczy się tylko czas, 1 = domyślnie, 2 = trudność waży podwójnie */
  difficultyImpact: number;
  /** % wagi zaległych zadań, od którego obowiązek jest „Warto zrobić” */
  suggestThresholdPct: number;
}

export interface SharedCalendarSettings {
  /** Link iCal (Google / Outlook / iCloud) */
  icalUrl: string;
  label?: string;
  /**
   * Fragmenty adresu, np. ["andersa", "częstochowa"] — wydarzenie z takim
   * miejscem (wszystkie fragmenty) włącza tryb gości. Pusta lista: tylko
   * słowa w tytule (goście, wizyta…).
   */
  guestLocationKeywords?: string[];
}

export interface WeatherLocation {
  /** Do wyświetlania, np. „Kraków” */
  name: string;
  /** Np. „małopolskie, Polska” */
  region?: string;
  latitude: number;
  longitude: number;
}

export interface HouseholdMeta {
  id: string;
  name: string;
  preset: HouseholdPresetId | null;
  ownerId: string;
  createdAt: string;
  zones: HomeZone[];
  floorPlan: FloorPlanRef;
  /** Zdjęcie na ekranie wejścia (households/{id}/assets/cover); brak = gradient */
  cover?: { updatedAt: string } | null;
  /** Aktualny kod zaproszenia (invites/{code}) */
  inviteCode?: string;
  /** Skąd pogoda na pulpicie (wybierane przy tworzeniu / w Ustawieniach) */
  weatherLocation?: WeatherLocation;
  /** Tryb PANIC (goście) — wspólny dla wszystkich urządzeń mieszkania */
  panic?: PanicState | null;
  /** Wspólny kalendarz domu — widzą wszyscy; włącza tryb gości */
  sharedCalendar?: SharedCalendarSettings | null;
  /** Brak = domyślne (CHORE_WEIGHT_DEFAULTS) */
  choreWeights?: ChoreWeightSettings;
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
