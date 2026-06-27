import type { MemberCalendarSource } from "@/config/calendars/types";

/**
 * Wspólny kalendarz domu (goście, wydarzenia rodzinne).
 * Używany też przez automatyczny tryb gości (`checkGuestCalendar`).
 */
export const householdCalendar: MemberCalendarSource = {
  id: "household",
  label: "Kalendarz domu",
  display: "full",
  color: "primary",
  envKey: "GOOGLE_CALENDAR_ICAL_URL",
};
