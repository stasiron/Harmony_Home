import { DEFAULT_MEMBERS } from "@/config/household";
import type { CalendarDisplayMode } from "@/config/calendars/types";
import { MEMBER_CALENDAR_CONFIGS } from "@/config/calendars";

export type CalendarMatchRule = {
  /** Regex na nazwę kalendarza z Google, np. `znajom|friend` */
  matchPattern: string;
  label: string;
  display: CalendarDisplayMode;
  color: string;
};

export type MemberCalendarRulesConfig = {
  memberId: string;
  /** Po OAuth — dopasuj kalendarze Google do trybu wyświetlania. */
  matchRules: CalendarMatchRule[];
};

const RULES_BY_MEMBER = new Map(
  MEMBER_CALENDAR_CONFIGS.map((member) => [
    member.memberId,
    member.matchRules ?? [],
  ]),
);

export function memberName(memberId: string): string {
  return DEFAULT_MEMBERS.find((m) => m.id === memberId)?.name ?? memberId;
}

export function classifyGoogleCalendar(
  memberId: string,
  summary: string,
): { label: string; display: CalendarDisplayMode; color: string } {
  const rules = RULES_BY_MEMBER.get(memberId) ?? [];
  for (const rule of rules) {
    const re = new RegExp(rule.matchPattern, "i");
    if (re.test(summary)) {
      return {
        label: rule.label,
        display: rule.display,
        color: rule.color,
      };
    }
  }
  return {
    label: summary,
    display: "full",
    color: DEFAULT_MEMBERS.find((m) => m.id === memberId)?.color ?? "chart-1",
  };
}
