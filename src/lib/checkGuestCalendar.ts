import { createServerFn } from "@tanstack/react-start";

export type { GuestCalendarStatus } from "@/lib/calendar-feed-types";

export const checkGuestCalendar = createServerFn({ method: "GET" }).handler(async () => {
  const { runCheckGuestCalendar } = await import("@/lib/check-guest-calendar.server");
  return runCheckGuestCalendar();
});
