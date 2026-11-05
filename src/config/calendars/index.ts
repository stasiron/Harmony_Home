import { householdCalendar } from "@/config/calendars/dom";
import type { MemberCalendarSource } from "@/config/calendars/types";

export type {
  CalendarDisplayMode,
  MemberCalendarSource,
} from "@/config/calendars/types";

export { householdCalendar };

export type RegisteredCalendar = MemberCalendarSource & {
  memberId: string;
  memberName: string;
};

/**
 * Wspólny kalendarz domu z env (GOOGLE_CALENDAR_ICAL_URL) — osobiste
 * kalendarze są per konto (src/lib/memberCalendars.server.ts).
 */
export function getIcalFallbackSources(): RegisteredCalendar[] {
  return [
    {
      ...householdCalendar,
      memberId: "household",
      memberName: "Dom",
    },
  ];
}
