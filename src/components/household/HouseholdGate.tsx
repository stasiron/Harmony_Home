import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AuthUserBadge } from "@/components/AuthUserBadge";
import { HouseholdStart } from "@/components/household/HouseholdStart";
import { useHousehold } from "@/context/HouseholdContext";

/**
 * Bez żadnego mieszkania pokazujemy ekran startowy zamiast stron.
 * W trakcie ładowania renderujemy strony (tak samo jak SSR) — inaczej
 * hydracja by się nie zgadzała.
 */
export function HouseholdGate({ children }: { children: ReactNode }) {
  const { status } = useHousehold();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Ustawienia zostają dostępne — tam jest logowanie Google
  if (status !== "none" || pathname === "/settings") return <>{children}</>;

  return (
    <div className="min-h-screen">
      <div className="fixed right-4 top-4 z-50 md:right-8">
        <AuthUserBadge />
      </div>
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 md:px-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Witaj w HomeHarmony
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Załóż mieszkanie albo dołącz do istniejącego kodem zaproszenia.
          </p>
        </header>
        <HouseholdStart />
      </main>
    </div>
  );
}
