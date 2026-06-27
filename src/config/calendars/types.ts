/** `full` — tytuł i szczegóły; `busy` — tylko blok „Zajęty”. */
export type CalendarDisplayMode = "full" | "busy";

/** Legacy iCal — opcjonalny fallback (dom). */
export type MemberCalendarSource = {
  id: string;
  label: string;
  display: CalendarDisplayMode;
  color: string;
  envKey: string;
};

export type CalendarMatchRule = {
  matchPattern: string;
  label: string;
  display: CalendarDisplayMode;
  color: string;
};

export type MemberCalendarsConfig = {
  memberId: string;
  /** Reguły po OAuth — dopasowanie nazwy kalendarza Google. */
  matchRules: CalendarMatchRule[];
  /** Opcjonalny fallback iCal (bez OAuth). */
  calendars?: MemberCalendarSource[];
};
