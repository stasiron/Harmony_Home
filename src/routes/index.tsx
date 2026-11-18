import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { MainNav } from "@/components/MainNav";
import { ClockWeather } from "@/components/dashboard/ClockWeather";
import { MemberMustTodos } from "@/components/dashboard/MemberMustTodos";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useAuth } from "@/context/AuthContext";
import { useBills } from "@/hooks/useBills";
import { usePeople } from "@/hooks/usePeople";
import { openShare } from "@/lib/money";

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

/** Ile próśb o zwrot czeka na mnie — licznik na kafelku Rachunki */
function useRefundBadge(): number {
  const { purchases } = useBills();
  const { actorId } = usePeople();
  if (!actorId) return 0;
  return purchases.filter(
    (p) => p.refundRequestedAt && openShare(p, actorId) > 0,
  ).length;
}

function Dashboard() {
  const { seeAsMemberId } = useAuth();
  const refunds = useRefundBadge();

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
        <MainNav badges={{ "/bills": refunds }} />
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
