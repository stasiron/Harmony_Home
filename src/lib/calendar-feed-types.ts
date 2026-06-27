import type { CalendarDisplayMode } from "@/config/calendars/types";

export type CalendarFeedEvent = {
  id: string;
  summary: string;
  location: string;
  start: string;
  end: string | null;
  isGuest: boolean;
  memberId: string;
  memberName: string;
  calendarId: string;
  calendarLabel: string;
  display: CalendarDisplayMode;
  color: string;
};

export type CalendarFeedResult = {
  configured: boolean;
  events: CalendarFeedEvent[];
};

export type GuestCalendarStatus = {
  active: boolean;
  eventTitle: string | null;
  eventStart: string | null;
  configured: boolean;
};
