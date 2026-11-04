import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkGuestCalendar } from "@/lib/calendar/api";

const GUEST_CALENDAR_REFRESH_MS = 15 * 60 * 1000;

export function useGuestCalendarSync(
  setGuestsMode: (v: boolean) => void,
  setGuestCalendarHint: (v: string | null) => void,
  enabled: boolean,
) {
  const runCheck = useServerFn(checkGuestCalendar);

  useEffect(() => {
    if (!enabled) {
      setGuestsMode(false);
      setGuestCalendarHint(null);
      return;
    }
    let cancelled = false;

    const sync = async () => {
      try {
        const status = await runCheck();
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
  }, [enabled, runCheck, setGuestsMode, setGuestCalendarHint]);
}
