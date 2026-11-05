import type { CalendarDisplayMode } from "@/config/calendars/types";

/**
 * Własny kalendarz przez link iCal (np. Google: Ustawienia kalendarza →
 * „Tajny adres w formacie iCal”). Bez OAuth i bez ekranów zgody Google.
 * Zapisany prywatnie w users/{uid}/private/calendar — widzi tylko właściciel.
 */
export type PersonalIcal = {
  id: string;
  label: string;
  url: string;
  display: CalendarDisplayMode;
  color: string;
  enabled: boolean;
};

/**
 * Serwer pobiera te adresy w imieniu użytkownika — tylko https i tylko znani
 * dostawcy kalendarzy (żadnych adresów wewnętrznych / dowolnych stron).
 */
const ALLOWED_HOSTS = [
  "calendar.google.com",
  "outlook.live.com",
  "outlook.office365.com",
  "outlook.office.com",
];
const ALLOWED_SUFFIXES = [".icloud.com"];

export function normalizeIcalUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/^webcal:\/\//i, "https://");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const allowed =
    ALLOWED_HOSTS.includes(host) ||
    ALLOWED_SUFFIXES.some((suffix) => host.endsWith(suffix));
  return allowed ? url.toString() : null;
}

export const ICAL_COLORS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
];
