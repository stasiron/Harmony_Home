import type { MemberCalendarsConfig } from "@/config/calendars/types";

/**
 * Stas — po zalogowaniu Google wszystkie kalendarze włączone domyślnie.
 * Nazwy dopasowują reguły poniżej (busy = tylko „Zajęty”).
 */
export const stasCalendars: MemberCalendarsConfig = {
  memberId: "member-3",
  matchRules: [
    {
      matchPattern: "zajęcia|zajecia|extra",
      label: "Zajęcia dodatkowe",
      display: "full",
      color: "chart-3",
    },
    {
      matchPattern: "wydarzenia|events?",
      label: "Wydarzenia",
      display: "full",
      color: "chart-5",
    },
    {
      matchPattern: "znajom|friends?|wyjścia|wyjscia",
      label: "Wyjścia ze znajomymi",
      display: "busy",
      color: "muted-foreground",
    },
  ],
  calendars: [
    {
      id: "extra-classes",
      label: "Zajęcia dodatkowe",
      display: "full",
      color: "chart-3",
      envKey: "STAS_CAL_ZAJECIA_ICAL_URL",
    },
    {
      id: "events",
      label: "Wydarzenia",
      display: "full",
      color: "chart-5",
      envKey: "STAS_CAL_WYDARZENIA_ICAL_URL",
    },
    {
      id: "friends",
      label: "Wyjścia ze znajomymi",
      display: "busy",
      color: "muted-foreground",
      envKey: "STAS_CAL_ZNAJOMI_ICAL_URL",
    },
  ],
};
