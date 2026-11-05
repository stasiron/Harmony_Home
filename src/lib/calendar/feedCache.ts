import type { CalendarFeedResult } from "@/lib/calendar-feed-types";

/**
 * Kalendarz synchronizuje się rzadko: tylko po wejściu w zakładkę, a dane z
 * pamięci przeglądarki są ważne do kolejnej 8:00 (codzienna synchronizacja)
 * i najwyżej FEED_MAX_AGE_MS. Wydarzenia idą z Google przez serwer — nie przez
 * Firebase, więc nie zużywają limitu bazy.
 */
export const DAILY_SYNC_HOUR = 8;
export const FEED_MAX_AGE_MS = 3 * 60 * 60 * 1000;
const CACHE_PREFIX = "calendar-feed:";
const CACHE_LIMIT = 12;

/** Ostatnia 8:00 nie późniejsza niż `now` */
export function lastDailySync(now: number): number {
  const d = new Date(now);
  d.setHours(DAILY_SYNC_HOUR, 0, 0, 0);
  if (d.getTime() > now) d.setDate(d.getDate() - 1);
  return d.getTime();
}

/** Ile ms dane pobrane o `fetchedAt` pozostają świeże (0 = do odświeżenia) */
export function msUntilStale(fetchedAt: number, now: number): number {
  if (!fetchedAt) return 0;
  if (fetchedAt < lastDailySync(now)) return 0;
  const next8 = lastDailySync(now) + 24 * 60 * 60 * 1000;
  const untilExpiry = fetchedAt + FEED_MAX_AGE_MS - now;
  return Math.max(0, Math.min(untilExpiry, next8 - now));
}

type CachedFeed = { fetchedAt: number; data: CalendarFeedResult };

export function readCachedFeed(key: string): CachedFeed | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFeed;
    return typeof parsed.fetchedAt === "number" && parsed.data ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedFeed(key: string, data: CalendarFeedResult) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ fetchedAt: Date.now(), data } satisfies CachedFeed),
    );
    // Stare zakresy dat nie zapychają pamięci
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .map((k) => ({ k, at: readCachedFeed(k.slice(CACHE_PREFIX.length)) }))
      .sort((a, b) => (b.at?.fetchedAt ?? 0) - (a.at?.fetchedAt ?? 0));
    for (const { k } of keys.slice(CACHE_LIMIT)) localStorage.removeItem(k);
  } catch {
    // brak miejsca / prywatne okno — następnym razem pobierze znowu
  }
}

/** Po wylogowaniu cudze wydarzenia nie zostają na wspólnym urządzeniu */
export function clearCachedFeeds() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    // nic
  }
}
