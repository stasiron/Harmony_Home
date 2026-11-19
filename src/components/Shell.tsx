import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Hourglass } from "lucide-react";
import { RestrictedMark } from "@/components/FeatureGate";
import { pageFeatureKey } from "@/config/features";
import { Button } from "@/components/ui/button";
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
  if (view.state === "on") {
    return (
      <>
        {view.forOthers !== "on" && (
          <div className="mb-4 flex justify-end">
            <RestrictedMark view={view} />
          </div>
        )}
        {children}
      </>
    );
  }
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      <Hourglass
        className="mx-auto size-10 text-muted-foreground"
        strokeWidth={1.4}
      />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        W przygotowaniu
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ta część aplikacji jest jeszcze dopracowywana. Administrator włączy ją,
        gdy będzie gotowa.
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
