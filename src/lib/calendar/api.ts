import { createServerFn } from "@tanstack/react-start";
import type { PersonalIcal } from "@/lib/personalIcal";

export type {
  CalendarFeedEvent,
  CalendarFeedResult,
  GuestCalendarStatus,
} from "@/lib/calendar-feed-types";

export const fetchCalendarEvents = createServerFn({ method: "POST" })
  .validator(
    (data: {
      from: string;
      to: string;
      idToken?: string | null;
      /** Własne linki iCal z prywatnego zapisu (users/{uid}/private) */
      icals?: PersonalIcal[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const { fetchCalendarEventsImpl } =
      await import("@/lib/memberCalendars.server");
    return fetchCalendarEventsImpl(data);
  });

export const checkGuestCalendar = createServerFn({ method: "GET" }).handler(
  async () => {
    const { runCheckGuestCalendar } =
      await import("@/lib/check-guest-calendar.server");
    return runCheckGuestCalendar();
  },
);

/** POST — ID token nie może trafić do adresu URL (logi) */
export const getCalendarConnectionStatus = createServerFn({
  method: "POST",
})
  .validator((data: { idToken?: string | null }) => data)
  .handler(async ({ data }) => {
    const { getCalendarConnectionStatusImpl } =
      await import("@/lib/calendar-settings.server");
    return getCalendarConnectionStatusImpl(data);
  });

/** Adres zgody Google dla tego konta (state niesie uid, nie token) */
export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .validator((data: { idToken?: string | null; origin?: string }) => data)
  .handler(async ({ data }) => {
    const { createGoogleCalendarAuthUrlImpl } =
      await import("@/lib/calendar-settings.server");
    return createGoogleCalendarAuthUrlImpl(data);
  });

export const setMemberCalendarEnabled = createServerFn({ method: "POST" })
  .validator(
    (data: {
      googleCalendarId: string;
      enabled: boolean;
      idToken?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { setMemberCalendarEnabledImpl } =
      await import("@/lib/calendar-settings.server");
    return setMemberCalendarEnabledImpl(data);
  });

export const setMemberCalendarDisplay = createServerFn({ method: "POST" })
  .validator(
    (data: {
      googleCalendarId: string;
      display: "full" | "busy";
      idToken?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { setMemberCalendarDisplayImpl } =
      await import("@/lib/calendar-settings.server");
    return setMemberCalendarDisplayImpl(data);
  });

export const disconnectMemberGoogle = createServerFn({ method: "POST" })
  .validator((data: { idToken?: string | null }) => data)
  .handler(async ({ data }) => {
    const { disconnectMemberGoogleImpl } =
      await import("@/lib/calendar-settings.server");
    return disconnectMemberGoogleImpl(data);
  });
