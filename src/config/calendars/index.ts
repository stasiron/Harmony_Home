import { aniaCalendars } from "@/config/calendars/ania";
import { householdCalendar } from "@/config/calendars/dom";
import { maciekCalendars } from "@/config/calendars/maciek";
import { stasCalendars } from "@/config/calendars/stas";
import { tymekCalendars } from "@/config/calendars/tymek";
import type {
  MemberCalendarSource,
  MemberCalendarsConfig,
} from "@/config/calendars/types";
import { DEFAULT_MEMBERS } from "@/config/household";

export type {
  CalendarDisplayMode,
  MemberCalendarSource,
  MemberCalendarsConfig,
} from "@/config/calendars/types";

export { householdCalendar, stasCalendars };

export const MEMBER_CALENDAR_CONFIGS: MemberCalendarsConfig[] = [
  maciekCalendars,
  aniaCalendars,
  stasCalendars,
  tymekCalendars,
];

export type RegisteredCalendar = MemberCalendarSource & {
  memberId: string;
  memberName: string;
};

/** Fallback iCal — tylko wpisy z env + kalendarz domu. */
export function getIcalFallbackSources(): RegisteredCalendar[] {
  const memberSources = MEMBER_CALENDAR_CONFIGS.flatMap((member) => {
    const user = DEFAULT_MEMBERS.find((u) => u.id === member.memberId);
    const memberName = user?.name ?? member.memberId;
    return (member.calendars ?? []).map((calendar) => ({
      ...calendar,
      memberId: member.memberId,
      memberName,
    }));
  });

  return [
    ...memberSources,
    {
      ...householdCalendar,
      memberId: "household",
      memberName: "Dom",
    },
  ];
}

export function getMemberConfig(
  memberId: string,
): MemberCalendarsConfig | undefined {
  return MEMBER_CALENDAR_CONFIGS.find((c) => c.memberId === memberId);
}
