import { createServerFn } from "@tanstack/react-start";

export type {
  CalendarFeedEvent,
  CalendarFeedResult,
  GuestCalendarStatus,
} from "@/lib/calendar-feed-types";

export const fetchCalendarEvents = createServerFn({ method: "POST" })
  .validator((data: { from: string; to: string }) => data)
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

export const getCalendarConnectionStatus = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getCalendarConnectionStatusImpl } =
    await import("@/lib/calendar-settings.server");
  return getCalendarConnectionStatusImpl();
});

export const setMemberCalendarEnabled = createServerFn({ method: "POST" })
  .validator(
    (data: { memberId: string; googleCalendarId: string; enabled: boolean }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { setMemberCalendarEnabledImpl } =
      await import("@/lib/calendar-settings.server");
    return setMemberCalendarEnabledImpl(data);
  });

export const setMemberCalendarDisplay = createServerFn({ method: "POST" })
  .validator(
    (data: {
      memberId: string;
      googleCalendarId: string;
      display: "full" | "busy";
    }) => data,
  )
  .handler(async ({ data }) => {
    const { setMemberCalendarDisplayImpl } =
      await import("@/lib/calendar-settings.server");
    return setMemberCalendarDisplayImpl(data);
  });

export const disconnectMemberGoogle = createServerFn({ method: "POST" })
  .validator((data: { memberId: string }) => data)
  .handler(async ({ data }) => {
    const { disconnectMemberGoogleImpl } =
      await import("@/lib/calendar-settings.server");
    return disconnectMemberGoogleImpl(data);
  });

export const connectCalendarFromFirebase = createServerFn({ method: "POST" })
  .validator(
    (data: { memberId: string; accessToken: string; expiresIn?: number }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { saveFirebaseCalendarConnection } =
      await import("@/lib/calendar-settings.server");
    await saveFirebaseCalendarConnection(data);
    return { ok: true as const };
  });
