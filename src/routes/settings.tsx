import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { HomeZoneEditor } from "@/components/chores/HomeZoneEditor";
import { GoogleAccountCard } from "@/components/settings/GoogleAccountCard";
import { SuperAdminCard } from "@/components/settings/SuperAdminCard";
import { MyCalendarCard } from "@/components/settings/MyCalendarCard";
import { ChoreWeightSettingsCard } from "@/components/settings/ChoreWeightSettingsCard";
import { FloorPlanCard } from "@/components/household/NoFloorPlan";
import { HouseholdSettingsCard } from "@/components/household/HouseholdSettingsCard";
import { useHousehold } from "@/context/HouseholdContext";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ustawienia · Homebase" },
      {
        name: "description",
        content: "Konto, kalendarz i ustawienia mieszkania.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <SettingsPage />
    </Shell>
  ),
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { household } = useHousehold();
  const [banner, setBanner] = useState<string | null>(null);

  // Powrót z Google (OAuth) — /settings?connected=1 albo ?error=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const connected = params.get("connected");
    if (error) setBanner(`Nie udało się połączyć kalendarza (${error}).`);
    if (connected) {
      setBanner(
        "Kalendarz Google połączony. Kalendarze, które mają zniknąć, wyłączysz w karcie „Mój kalendarz”.",
      );
      void queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
    }
    if (error || connected) {
      window.history.replaceState({}, "", "/settings");
    }
  }, [queryClient]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Ustawienia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Konto, kalendarz, mieszkanie, plan i strefy.
        </p>
      </header>

      {banner && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          {banner}
        </p>
      )}

      <SuperAdminCard />
      <GoogleAccountCard />
      <MyCalendarCard />

      {household && (
        <>
          <HouseholdSettingsCard />
          <FloorPlanCard />
          <HomeZoneEditor />
          <ChoreWeightSettingsCard />
        </>
      )}
    </div>
  );
}
