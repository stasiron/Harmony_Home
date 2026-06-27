import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { HouseholdCalendar } from "@/components/calendar/HouseholdCalendar";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Kalendarz · Homebase" },
      {
        name: "description",
        content: "Google Calendar, obowiązki domowe i plany gości w jednym widoku.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <CalendarPage />
    </Shell>
  ),
});

function CalendarPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Kalendarz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Domyślnie 3 dni — przełącz na 7, 14 lub cały miesiąc. Google Calendar, obowiązki i plany
          gości.
        </p>
      </header>

      <HouseholdCalendar />
    </div>
  );
}
