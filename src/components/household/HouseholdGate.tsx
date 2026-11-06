import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { AuthUserBadge } from "@/components/AuthUserBadge";
import { HouseholdStart } from "@/components/household/HouseholdStart";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";

/**
 * Strony mieszkania pokazujemy dopiero, gdy wiadomo, że użytkownik ma do
 * niego dostęp (status "ready"). Bez mieszkania — ekran startowy z kodem
 * zaproszenia. W trakcie ładowania (także SSR) — neutralny ekran ładowania;
 * serwer i pierwszy render w przeglądarce dają ten sam wynik, więc hydracja
 * się zgadza, a nowy użytkownik nie widzi przez chwilę pustego pulpitu.
 */
export function HouseholdGate({ children }: { children: ReactNode }) {
  const { status } = useHousehold();
  const { configured, error: authError } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Ustawienia zostają dostępne — tam jest logowanie Google.
  // Bez konfiguracji Firebase nie ma mieszkań — zachowanie jak dotąd.
  if (status === "ready" || pathname === "/settings" || !configured) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        role="status"
        aria-live="polite"
      >
        {authError ? (
          <div className="max-w-md space-y-3 text-center">
            <p className="text-sm text-alert">{authError}</p>
            <Link to="/settings" className="text-sm underline">
              Przejdź do ustawień
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Wczytuję mieszkanie…</p>
        )}
      </div>
    );
  }

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
