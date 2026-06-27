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

/** Lokalizacja — wystarczy fragment „Andersa” + Częstochowa. */
export const GUEST_LOCATION_MARKERS = ["andersa", "częstochowa", "czestochowa"] as const;

/** Po starcie wydarzenia tryb gości trzyma się jeszcze tyle godzin. */
export const GUEST_TAIL_HOURS = 3;

/**
 * Kalendarz domu — env: GOOGLE_CALENDAR_ICAL_URL
 * Konfiguracja: src/config/calendars/dom.ts
 */
