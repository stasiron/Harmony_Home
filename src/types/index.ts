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
  /**
   * Powiązany produkt (`p-…` z nazwy w lodówce / pamięci produktów) —
   * dopasowanie do lodówki niezależnie od odmiany nazwy
   */
  productId?: string;
}

/** Zaplanowany przepis — w sklepie widać, czego brakuje */
export interface RecipePlan extends ItemMeta {
  id: string;
  recipeId: string;
  recipeName: string;
  emoji: string;
  /** 1 = 100% przepisu */
  scale: number;
  /** YYYY-MM-DD — kiedy gotujemy (opcjonalnie) */
  plannedFor: string | null;
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
  /** Cena całej pozycji w groszach; null/brak — nie podano */
  price?: number | null;
  /** Dlaczego na liście: zapas się kończy albo go brak */
  reason?: StockState | null;
  emoji?: string | null;
  /** Token koloru etykiety, np. "tag-3" */
  color?: string | null;
}

/** Stan zapasu: wystarczy / kończy się / brak */
export type StockState = "ok" | "low" | "out";

/**
 * Pamięć produktu (`products`) — ostatnia cena, kiedy kupione, a dla zapasów
 * (papier, płyn do naczyń…) ile jest i od ilu „kończy się”. Prywatna pamięć
 * leży w ścieżce prywatnej — ceny widzi tylko właściciel.
 */
export interface Product extends ItemMeta {
  /** `p-` + nazwa bez polskich znaków (patrz productId) */
  id: string;
  name: string;
  category: ShoppingCategory;
  unit: string;
  /** Ostatnia cena w groszach za `lastAmount` × `unit` */
  lastPrice: number | null;
  lastAmount: number | null;
  lastBoughtAt: string | null;
  lastAddedAt: string | null;
  /** Zapas domowy — widoczny w zakładce Zapasy */
  supply?: boolean;
  stockAmount?: number | null;
  /** Przy tej ilości lub mniej — „kończy się” */
  lowAt?: number | null;
  stock?: StockState;
  emoji?: string | null;
  color?: string | null;
}

/** Wbudowane rodzaje rachunków + własne */
export type BillKind = "rent" | "electricity" | "gas" | "internet" | "custom";

export type BillSplitMode = "equal" | "weights";

/** Rodzaj rachunku w ustawieniach mieszkania */
export interface BillTypeConfig {
  /** Wbudowane: jak `kind`; własne: losowe id */
  id: string;
  kind: BillKind;
  name: string;
  enabled: boolean;
  /** Dzień miesiąca terminu płatności (1–31) */
  dueDay: number | null;
  /** Stała kwota co miesiąc (np. czynsz, internet), grosze */
  defaultAmount: number | null;
  /** Kto płaci; puste = wszyscy aktywni domownicy */
  participants: string[];
  splitMode: BillSplitMode;
  /** Udziały przy `weights` — np. większy pokój = większa część czynszu */
  weights: Record<string, number>;
  /** Klucz ikony (src/config/billIcons.ts) */
  icon?: string;
  /** Token koloru, np. "tag-2" */
  color?: string | null;
  /** Co ile miesięcy i od którego (YYYY-MM); brak = co miesiąc */
  period?: BillPeriod | null;
}

export interface BillPeriod {
  everyMonths: 1 | 2 | 3 | 6 | 12;
  startMonth: string;
}

export interface BillSettings {
  types: BillTypeConfig[];
  /** Kto (User.id) rozlicza rachunki obok administratorów: zatwierdza wpłaty */
  managers?: string[];
}

/** Rachunek za dany miesiąc (`bills/{month}_{typeId}`) */
export interface Bill extends ItemMeta {
  id: string;
  typeId: string;
  name: string;
  /** YYYY-MM */
  month: string;
  /** Grosze */
  amount: number;
  /** YYYY-MM-DD */
  dueOn: string | null;
  /** Kto zapłacił dostawcy / właścicielowi (User.id); null — jeszcze nikt */
  paidBy: string | null;
  /** User.id → grosze */
  shares: Record<string, number>;
  /** User.id → kiedy oddał(a) swoją część płacącemu */
  settled: Record<string, string>;
  /** User.id → kiedy płacący potwierdził, że pieniądze doszły */
  confirmed?: Record<string, string>;
  /** User.id → ile już wpłacił(a), gdy nie całość (grosze) */
  payments?: Record<string, number>;
}

export interface PurchaseLine {
  name: string;
  amount: number | null;
  unit: string;
  /** Grosze */
  price: number;
}

/** Wspólny zakup dla domu — podzielony między domowników */
export interface Purchase extends ItemMeta {
  id: string;
  title: string;
  items: PurchaseLine[];
  /** Grosze */
  total: number;
  paidBy: string;
  shares: Record<string, number>;
  settled: Record<string, string>;
  /** User.id → płacący potwierdził zwrot */
  confirmed?: Record<string, string>;
  /** ISO — płacący poprosił o zwrot */
  refundRequestedAt?: string | null;
  /** ISO — kiedy kupione */
  at: string;
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
  /**
   * Stały produkt (np. mozzarella): zostaje na liście także przy 0 —
   * po zakupach tylko dokładasz „+”, zamiast wpisywać go od nowa
   */
  staple?: boolean;
  emoji?: string | null;
  color?: string | null;
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
  /** Tylko w folderze Usterki: nowa → zgłoszona właścicielowi → naprawiona */
  issueStatus?: IssueStatus;
}

export type IssueStatus = "new" | "reported" | "fixed";

/** Dodatkowe przypomnienie ustawione przez administratora mieszkania */
export interface ExtraReminder {
  id: string;
  /** HH:MM (czas polski; liczy się pełna godzina) */
  time: string;
  /** 0 = niedziela … 6 = sobota; puste = codziennie */
  days: number[];
  text: string;
}

export interface ReminderSettings {
  /** Godzina porannego podsumowania (0–23) */
  dailyHour: number;
  extra: ExtraReminder[];
}

/** Kontakt do właściciela / administracji budynku */
export interface LandlordContact {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

/** Ogłoszenie na tablicy mieszkania */
export interface Announcement extends ItemMeta {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  /** YYYY-MM-DD — po tej dacie znika z tablicy */
  expiresOn: string | null;
}

/** Zgłoszenie błędu z przycisku „Zgłoś błąd” (bugReports/{id}) */
export interface BugReport {
  id: string;
  description: string;
  status: "new" | "progress" | "fixed";
  createdAt: string;
  uid: string;
  email: string | null;
  anonymous: boolean;
  householdId: string | null;
  householdName: string | null;
  role: string | null;
  path: string;
  search: string;
  tab: string | null;
  selector: string | null;
  elementText: string | null;
  heading: string | null;
  x: number | null;
  y: number | null;
  viewport: string;
  scrollY: number;
  appVersion: string;
  appCommit: string;
  userAgent: string;
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
  /** Krótko: kto przychodzi */
  title?: string;
  /** ISO — do kiedy (brak = ok. godziny) */
  until?: string | null;
  /** Kto zaprasza (User.id) */
  hostId?: string | null;
  guests?: number | null;
  overnight?: boolean;
}

/** Nieobecność / wyjazd domownika */
export interface Absence extends ItemMeta {
  id: string;
  profileId: string;
  /** YYYY-MM-DD, włącznie */
  from: string;
  to: string;
  note: string;
  /** shift — obowiązki czekają; reassign — robią je pozostali */
  mode: "shift" | "reassign";
}

/** Wpis historii: kto i kiedy wykonał obowiązek (tylko dopisywany) */
export interface Completion extends ItemMeta {
  id: string;
  itemId: string;
  kind: "chore" | "zadanie";
  name: string;
  /** User.id; null — nie wiadomo kto (np. tablet bez wyboru osoby) */
  by: string | null;
  /** ISO */
  at: string;
  minutes: number;
  /** Waga wg ustawień mieszkania w chwili wykonania */
  weight: number;
}

export interface PanicState {
  active: boolean;
  /** Wspólny dla mieszkania — kiedy i kto włączył */
  startedAt?: string;
  startedBy?: string;
}

/** Opisy i uprawnienia: src/config/roles.ts i firestore.rules */
export type HouseholdRole = "admin" | "member" | "guest" | "device";

/** Kto widzi statystyki: wszyscy / każdy swoje / tylko administratorzy */
export type StatsVisibility = "all" | "own" | "admins";

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
  statsVisibility?: StatsVisibility;
  /** Rachunki mieszkania (włączone rodzaje, terminy, podział) */
  billSettings?: BillSettings;
  /** Kontakt do właściciela — Ogłoszenia i folder Usterki w TODO */
  landlord?: LandlordContact | null;
  /** Powiadomienia: godzina porannego podsumowania + dodatkowe przypomnienia */
  reminders?: ReminderSettings;
  features?: {
    /** Kalendarze Google z src/config/calendars — tylko pierwsze mieszkanie */
    legacyCalendar?: boolean;
    /** Zablokowane / ukryte funkcje (src/config/features.ts) */
    flags?: Partial<Record<string, "on" | "locked" | "hidden">>;
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
