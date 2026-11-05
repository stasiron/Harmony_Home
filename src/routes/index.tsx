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
      { title: "Homebase · dom i obowiązki" },
      {
        name: "description",
        content:
          "Domowy pulpit: obowiązki, zakupy, pranie, kalendarz i goście.",
      },
      { property: "og:title", content: "Homebase · dom i obowiązki" },
      {
        property: "og:description",
        content: "Domowy pulpit na tablet i telefon.",
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
          Szybkie akcje
        </h2>
        <QuickActions />
      </section>
    </div>
  );
}
