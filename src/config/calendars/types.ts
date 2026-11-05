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
