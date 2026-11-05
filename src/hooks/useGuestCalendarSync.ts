import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkGuestCalendar } from "@/lib/calendar/api";
import type { SharedCalendarSettings } from "@/types";

const GUEST_CALENDAR_REFRESH_MS = 15 * 60 * 1000;

export function useGuestCalendarSync(
  setGuestsMode: (v: boolean) => void,
  setGuestCalendarHint: (v: string | null) => void,
  shared: SharedCalendarSettings | null | undefined,
) {
  const runCheck = useServerFn(checkGuestCalendar);
  const sharedKey = shared
    ? `${shared.icalUrl}|${(shared.guestLocationKeywords ?? []).join(",")}`
    : "";

  useEffect(() => {
    if (!shared?.icalUrl) {
      setGuestsMode(false);
      setGuestCalendarHint(null);
      return;
    }
    let cancelled = false;

    const sync = async () => {
      try {
        const status = await runCheck({ data: { shared } });
        if (cancelled) return;
        setGuestsMode(status.active);
        setGuestCalendarHint(status.active ? status.eventTitle : null);
      } catch {
        if (!cancelled) setGuestCalendarHint(null);
      }
    };

    sync();
    const id = setInterval(sync, GUEST_CALENDAR_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // sharedKey zmienia się razem z ustawieniem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedKey, runCheck, setGuestsMode, setGuestCalendarHint]);
}
