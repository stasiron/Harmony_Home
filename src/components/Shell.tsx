import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Eye, Hourglass, Lock } from "lucide-react";
import { RestrictedMark } from "@/components/FeatureGate";
import { pageFeatureKey } from "@/config/features";
import { Button } from "@/components/ui/button";
import { useHousehold } from "@/context/HouseholdContext";
import { useFeature } from "@/hooks/useFeature";
import { AuthUserBadge } from "@/components/AuthUserBadge";
import { HouseholdSwitcher } from "@/components/household/HouseholdSwitcher";
import { StartButton, SubpageClock } from "@/components/SubpageHeader";
import { cn } from "@/lib/utils";

/**
 * Strona zablokowana albo ukryta przez administratora — karta
 * „W przygotowaniu” zamiast treści (także po wejściu z linku).
 */
function PageGate({
  pathname,
  children,
}: {
  pathname: string;
  children: ReactNode;
}) {
  const section = `/${pathname.split("/")[1] ?? ""}`;
  const view = useFeature(pageFeatureKey(section) ?? "");
  const { role } = useHousehold();
  // Na pulpicie bez dopisku — tam nic się nie wpisuje
  const readOnly =
    section === "/"
      ? null
      : role === "guest"
        ? "Tryb gościa — tylko podgląd."
        : role === "device" && section === "/bills"
          ? "Na tym urządzeniu rachunki są tylko do podglądu."
          : null;
  if (view.state === "on") {
    return (
      <>
        {view.forOthers !== "on" && (
          <div className="mb-4 flex justify-end">
            <RestrictedMark view={view} />
          </div>
        )}
        {readOnly ? (
          <div className="hh-readonly">
            <p className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground">
              <Eye className="size-4 shrink-0" />
              {readOnly}
            </p>
            {children}
          </div>
        ) : (
          children
        )}
      </>
    );
  }
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      {view.byRole ? (
        <Lock
          className="mx-auto size-10 text-muted-foreground"
          strokeWidth={1.4}
        />
      ) : (
        <Hourglass
          className="mx-auto size-10 text-muted-foreground"
          strokeWidth={1.4}
        />
      )}
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {view.byRole ? "Niedostępne" : "W przygotowaniu"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {view.byRole
          ? section === "/stats" && role === "member"
            ? "Statystyki w tym mieszkaniu widzą tylko administratorzy."
            : "Ta część nie jest dostępna dla Twojej roli w mieszkaniu. Rolę zmienia administrator."
          : "Ta część aplikacji jest jeszcze dopracowywana. Administrator włączy ją, gdy będzie gotowa."}
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Wróć na pulpit</Link>
      </Button>
    </div>
  );
}

/**
 * Górny pasek jest w przepływie strony (nie `fixed`), więc nie nachodzi na
 * zegar ani treść. Na pulpicie od tabletu wzwyż leży w prawym górnym rogu,
 * obok dużego zegara.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen">
      <main className="relative mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-8">
        <header
          className={cn(
            "mb-6 flex items-center gap-3 md:mb-8",
            isHome && "md:absolute md:right-8 md:top-8 md:z-10 md:mb-0",
          )}
        >
          {!isHome && (
            <>
              <span className="md:hidden">
                <StartButton compact />
              </span>
              <SubpageClock className="hidden md:block" />
            </>
          )}
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {!isHome && (
              <span className="hidden md:block">
                <StartButton />
              </span>
            )}
            <HouseholdSwitcher />
            <AuthUserBadge />
          </div>
        </header>
        <PageGate pathname={pathname}>{children}</PageGate>
      </main>
    </div>
  );
}
