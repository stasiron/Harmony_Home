import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarCheck,
  Home,
  Map as MapIcon,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { HomeZoneEditor } from "@/components/chores/HomeZoneEditor";
import { GoogleAccountCard } from "@/components/settings/GoogleAccountCard";
import { SuperAdminCard } from "@/components/settings/SuperAdminCard";
import { MyCalendarCard } from "@/components/settings/MyCalendarCard";
import { ChoreWeightSettingsCard } from "@/components/settings/ChoreWeightSettingsCard";
import { FloorPlanCard } from "@/components/household/NoFloorPlan";
import { HouseholdSettingsCard } from "@/components/household/HouseholdSettingsCard";
import { useHousehold } from "@/context/HouseholdContext";
import { cn } from "@/lib/utils";

type Section = "account" | "calendar" | "household" | "plan" | "chores";
const SECTIONS: Section[] = [
  "account",
  "calendar",
  "household",
  "plan",
  "chores",
];

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): { section?: Section } =>
    SECTIONS.includes(search.section as Section)
      ? { section: search.section as Section }
      : {},
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
  const { household, isAdmin } = useHousehold();
  const { section: initialSection } = Route.useSearch();
  const [section, setSection] = useState<Section>(initialSection ?? "account");
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
      setSection("calendar");
      void queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
    }
    if (error || connected) {
      window.history.replaceState({}, "", "/settings");
    }
  }, [queryClient]);

  const tabs: {
    id: Section;
    label: string;
    icon: LucideIcon;
    show: boolean;
  }[] = [
    { id: "account", label: "Konto", icon: UserRound, show: true },
    { id: "calendar", label: "Mój kalendarz", icon: CalendarDays, show: true },
    { id: "household", label: "Mieszkanie", icon: Home, show: !!household },
    { id: "plan", label: "Plan i strefy", icon: MapIcon, show: !!household },
    {
      id: "chores",
      label: "Obowiązki",
      icon: CalendarCheck,
      show: !!household,
    },
  ];
  const visibleTabs = tabs.filter((t) => t.show);
  const current = visibleTabs.some((t) => t.id === section)
    ? section
    : "account";

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Ustawienia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {household && !isAdmin
            ? "Ustawienia mieszkania zmienia jego twórca, administrator mieszkania albo administrator ogólny."
            : "Konto, kalendarz, mieszkanie, plan i strefy."}
        </p>
      </header>

      {/* Podkategorie — na telefonie przewijane w bok */}
      <nav
        aria-label="Kategorie ustawień"
        className="hh-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      >
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            aria-current={current === id ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
              current === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      {banner && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          {banner}
        </p>
      )}

      <div className="space-y-6">
        {current === "account" && (
          <Group>
            <SuperAdminCard />
            <GoogleAccountCard />
          </Group>
        )}
        {current === "calendar" && <MyCalendarCard />}
        {household && current === "household" && <HouseholdSettingsCard />}
        {household && current === "plan" && (
          <Group>
            <FloorPlanCard />
            <HomeZoneEditor />
          </Group>
        )}
        {household && current === "chores" && <ChoreWeightSettingsCard />}
      </div>
    </div>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
