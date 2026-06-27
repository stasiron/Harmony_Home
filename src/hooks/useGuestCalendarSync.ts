import { useEffect } from "react";
import { checkGuestCalendar } from "@/lib/checkGuestCalendar";

const GUEST_CALENDAR_REFRESH_MS = 15 * 60 * 1000;

export function useGuestCalendarSync(
  setGuestsMode: (v: boolean) => void,
  setGuestCalendarHint: (v: string | null) => void,
) {
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const status = await checkGuestCalendar();
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
  }, [setGuestsMode, setGuestCalendarHint]);
}
