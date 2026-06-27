import { createServerFn } from "@tanstack/react-start";
import { useRuntimeConfig } from "nitro/runtime-config";
import {
  GUEST_LEAD_HOURS,
  GUEST_TAIL_HOURS,
  GUEST_TITLE_KEYWORDS,
} from "@/config/guests";
import { parseIcalEvents } from "@/lib/ical";

export type GuestCalendarStatus = {
  active: boolean;
  eventTitle: string | null;
  eventStart: string | null;
  configured: boolean;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function isGuestEvent(summary: string, location: string): boolean {
  const title = normalize(summary);
  const loc = normalize(location);

  if (GUEST_TITLE_KEYWORDS.some((k) => title.includes(normalize(k)))) return true;

  const hasAndersa = loc.includes("andersa");
  const hasCzestochowa = loc.includes("czestochowa");
  return hasAndersa && hasCzestochowa;
}

function isGuestWindowActive(start: Date, end: Date | null, now: number): boolean {
  const leadMs = GUEST_LEAD_HOURS * 60 * 60 * 1000;
  const tailMs = GUEST_TAIL_HOURS * 60 * 60 * 1000;
  const startMs = start.getTime();
  const endMs = (end ?? new Date(startMs + 2 * 60 * 60 * 1000)).getTime();
  return now >= startMs - leadMs && now <= endMs + tailMs;
}

function resolveIcalUrl(): string {
  const direct = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim();
  if (direct) return direct;
  try {
    const cfg = useRuntimeConfig() as { googleCalendarIcalUrl?: string };
    return cfg.googleCalendarIcalUrl?.trim() ?? "";
  } catch {
    return "";
  }
}

export const checkGuestCalendar = createServerFn({ method: "GET" }).handler(
  async (): Promise<GuestCalendarStatus> => {
    const icalUrl = resolveIcalUrl();
    if (!icalUrl) {
      return { active: false, eventTitle: null, eventStart: null, configured: false };
    }

    const res = await fetch(icalUrl, { headers: { Accept: "text/calendar" } });
    if (!res.ok) {
      throw new Error("calendar fetch failed");
    }

    const ical = await res.text();
    const now = Date.now();
    const hits = parseIcalEvents(ical)
      .filter((e) => isGuestEvent(e.summary, e.location))
      .filter((e) => isGuestWindowActive(e.start, e.end, now))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const next = hits[0];
    return {
      active: Boolean(next),
      eventTitle: next?.summary ?? null,
      eventStart: next?.start.toISOString() ?? null,
      configured: true,
    };
  },
);
