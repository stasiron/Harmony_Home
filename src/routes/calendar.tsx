import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { HouseholdCalendar } from "@/components/calendar/HouseholdCalendar";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Kalendarz · Homebase" },
      {
        name: "description",
        content:
          "Google Calendar, obowiązki domowe i plany gości w jednym widoku.",
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
    <div className="space-y-4 md:space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
          Kalendarz
        </h1>
        {/* Na telefonie bez opisu — kalendarz ma być od razu na ekranie */}
        <p className="mt-1 hidden text-sm text-muted-foreground md:block">
          Domyślnie 3 dni — przełącz na 7, 14 lub cały miesiąc. Google Calendar,
          obowiązki i plany gości.
        </p>
      </header>

      <HouseholdCalendar />
    </div>
  );
}
