import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { HouseholdStart } from "@/components/household/HouseholdStart";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/context/HouseholdContext";

export const Route = createFileRoute("/households")({
  head: () => ({
    meta: [
      { title: "Mieszkania · Homebase" },
      {
        name: "description",
        content:
          "Twoje mieszkania — przełączanie, nowe mieszkanie, dołączanie.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <HouseholdsPage />
    </Shell>
  ),
});

function HouseholdsPage() {
  const { memberships, householdId, household, switchHousehold } =
    useHousehold();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Mieszkania
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Każde mieszkanie widzą tylko jego domownicy.
        </p>
      </header>

      {memberships.length > 0 && (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-surface shadow-elevated">
          {memberships.map((membership) => {
            const active = membership.householdId === householdId;
            return (
              <li
                key={membership.householdId}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {active && household ? household.name : membership.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {membership.role === "admin" ? "Administrator" : "Domownik"}
                  </p>
                </div>
                {active ? (
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <Check className="size-4" />
                    Aktywne
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchHousehold(membership.householdId)}
                  >
                    Przełącz
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <HouseholdStart />
    </div>
  );
}
