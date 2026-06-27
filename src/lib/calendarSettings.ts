import { createServerFn } from "@tanstack/react-start";

export const getCalendarConnectionStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getCalendarConnectionStatusImpl } = await import("@/lib/calendar-settings.server");
  return getCalendarConnectionStatusImpl();
});

export const setMemberCalendarEnabled = createServerFn({ method: "POST" })
  .validator((data: { memberId: string; googleCalendarId: string; enabled: boolean }) => data)
  .handler(async ({ data }) => {
    const { setMemberCalendarEnabledImpl } = await import("@/lib/calendar-settings.server");
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
    const { setMemberCalendarDisplayImpl } = await import("@/lib/calendar-settings.server");
    return setMemberCalendarDisplayImpl(data);
  });

export const disconnectMemberGoogle = createServerFn({ method: "POST" })
  .validator((data: { memberId: string }) => data)
  .handler(async ({ data }) => {
    const { disconnectMemberGoogleImpl } = await import("@/lib/calendar-settings.server");
    return disconnectMemberGoogleImpl(data);
  });
