import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { MainNav } from "@/components/MainNav";
import { ClockWeather } from "@/components/dashboard/ClockWeather";
import { MemberMustTodos } from "@/components/dashboard/MemberMustTodos";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Homebase · Smart Home & Chores" },
      {
        name: "description",
        content:
          "A warm, minimalist kitchen-kiosk dashboard for chores, guests and smart-home automations.",
      },
      { property: "og:title", content: "Homebase · Smart Home & Chores" },
      {
        property: "og:description",
        content: "Kiosk-ready chores & smart-home dashboard.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <Dashboard />
    </Shell>
  ),
});

function Dashboard() {
  const { seeAsMemberId } = useAuth();

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <ClockWeather />
        <StatusBanner />
      </header>

      {seeAsMemberId ? (
        <section>
          <MemberMustTodos memberId={seeAsMemberId} />
        </section>
      ) : null}

      <section>
        <MainNav />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Quick Actions
        </h2>
        <QuickActions />
      </section>
    </div>
  );
}
