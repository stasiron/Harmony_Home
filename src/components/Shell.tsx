import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AuthUserBadge } from "@/components/AuthUserBadge";
import { HouseholdSwitcher } from "@/components/household/HouseholdSwitcher";
import { StartButton, SubpageClock } from "@/components/SubpageHeader";
import { cn } from "@/lib/utils";

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
        {children}
      </main>
    </div>
  );
}
