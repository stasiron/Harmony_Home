import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { EntryScreen } from "@/components/household/EntryScreen";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { takeInviteCodeFromLocation } from "@/lib/inviteLink";

/**
 * Strony mieszkania pokazujemy dopiero, gdy użytkownik wybrał mieszkanie na
 * ekranie wejścia i jest ono wczytane (status "ready"). Wcześniej — neutralny
 * ekran ładowania (ten sam na SSR i przy pierwszym renderze w przeglądarce,
 * więc hydracja się zgadza, a nowy użytkownik nie widzi przez chwilę pulpitu).
 */
export function HouseholdGate({ children }: { children: ReactNode }) {
  const { status, membershipsLoaded, memberships, entered } = useHousehold();
  const { configured, error: authError } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Wejście z linku w kodzie QR: /?join=KOD
  useEffect(() => {
    setInviteCode(takeInviteCodeFromLocation());
  }, []);

  // Ustawienia zostają dostępne — tam jest logowanie i wylogowanie.
  // Bez konfiguracji Firebase nie ma mieszkań — zachowanie jak dotąd.
  if (pathname === "/settings" || !configured) return <>{children}</>;

  if (membershipsLoaded && entered !== null) {
    if (memberships.length === 0 || !entered || inviteCode) {
      return (
        <EntryScreen
          inviteCode={inviteCode}
          onInviteDone={() => setInviteCode(null)}
        />
      );
    }
    if (status === "ready") return <>{children}</>;
  }

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
        <p className="text-sm text-muted-foreground">Wczytuję…</p>
      )}
    </div>
  );
}
