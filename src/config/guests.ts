/** Godziny przed wydarzeniem — tryb gości włącza się automatycznie. */
export const GUEST_LEAD_HOURS = 24;

/** Słowa w tytule wydarzenia (Google Calendar). */
export const GUEST_TITLE_KEYWORDS = [
  "spotkanie",
  "meeting",
  "goście",
  "goscie",
  "wizyta",
  "visitors",
  "guest",
] as const;

/** Po starcie wydarzenia tryb gości trzyma się jeszcze tyle godzin. */
export const GUEST_TAIL_HOURS = 3;

/** Wspólny kalendarz domu: Ustawienia → Mieszkanie (HouseholdMeta.sharedCalendar) */
