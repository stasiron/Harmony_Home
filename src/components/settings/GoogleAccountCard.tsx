import { useServerFn } from "@tanstack/react-start";
import { CalendarSync, LogIn, LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { getCalendarConnectionStatus } from "@/lib/calendar/api";
import { firebaseProjectId } from "@/lib/firebase";
import { guessMemberId } from "@/lib/memberLink";

type Status = Awaited<ReturnType<typeof getCalendarConnectionStatus>>;

export function GoogleAccountCard() {
  const { users } = useApp();
  const { household, myProfileId, linkProfile } = useHousehold();
  // Kalendarze Google są skonfigurowane tylko dla pierwszego mieszkania
  const legacyCalendar = Boolean(household?.features?.legacyCalendar);
  const {
    user,
    memberId,
    loading,
    syncingCalendar,
    calendarSyncTick,
    error,
    configured,
    signInWithGoogle,
    syncCalendar,
    connectPersistentCalendar,
    signOut,
    linkMember,
    clearError,
  } = useAuth();

  const loadStatus = useServerFn(getCalendarConnectionStatus);
  const [status, setStatus] = useState<Status | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      setStatus(await loadStatus());
    } finally {
      setStatusLoading(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    if (!legacyCalendar) return;
    void refreshStatus();
  }, [legacyCalendar, calendarSyncTick, refreshStatus]);

  useEffect(() => {
    if (!legacyCalendar || !user || memberId || !status) return;

    const byEmail = status.members.find(
      (member) =>
        member.connection?.googleEmail?.toLowerCase() ===
        user.email?.toLowerCase(),
    );
    const suggested = byEmail?.memberId ?? guessMemberId(user);
    if (suggested) {
      void linkMember(suggested);
    }
  }, [legacyCalendar, user, memberId, status, linkMember]);

  const myMember = status?.members.find(
    (member) => member.memberId === memberId,
  );
  const memberLabel = users.find((u) => u.id === myProfileId)?.name ?? null;

  const chooseProfile = (profileId: string) => {
    void linkProfile(profileId);
    if (legacyCalendar) void linkMember(profileId);
  };
  const persistentMode = status?.oauthServerConfigured ?? false;
  // Na Vercel bez Redis połączenie znika po chwili — przycisk tylko udaje
  const canPersist = status?.persistentStore ?? false;

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Konto Google</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Zaloguj się raz — aplikacja zapamięta konto i kalendarz na serwerze
            (działa też gdy nie masz telefonu przy sobie).
          </p>
        </div>

        {!configured && (
          <p className="rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-3 text-sm text-muted-foreground sm:max-w-md">
            Zarejestruj web app w Firebase Console (projekt{" "}
            <code className="text-foreground">{firebaseProjectId}</code>) i
            ustaw <code className="text-foreground">VITE_FIREBASE_API_KEY</code>
            , <code className="text-foreground">VITE_FIREBASE_APP_ID</code> w{" "}
            <code className="text-foreground">.env</code>.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-destructive">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Zamknij
          </Button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {loading && !user ? (
          <p className="text-sm text-muted-foreground">Sprawdzanie sesji…</p>
        ) : user ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                {user.photoURL ? (
                  <AvatarImage src={user.photoURL} alt="" />
                ) : null}
                <AvatarFallback>
                  {(user.displayName ?? user.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.displayName ?? "Użytkownik Google"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
                {memberLabel ? (
                  <p className="truncate text-xs text-primary">
                    Profil: {memberLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => void signOut()}
              disabled={!configured}
            >
              <LogOut />
              Wyloguj
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Nie zalogowano</p>
            <Button
              onClick={() => void signInWithGoogle()}
              disabled={!configured || loading}
            >
              <LogIn />
              Zaloguj przez Google
            </Button>
          </>
        )}
      </div>

      {user && household && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium">Twój profil domownika</p>
              <Select
                value={myProfileId ?? undefined}
                onValueChange={chooseProfile}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Wybierz domownika" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {legacyCalendar && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start sm:self-auto"
                onClick={() => void refreshStatus()}
                disabled={statusLoading}
              >
                <RefreshCw
                  className={statusLoading ? "animate-spin" : undefined}
                />
                Odśwież status
              </Button>
            )}
          </div>

          {!legacyCalendar ? null : !memberId ? (
            <p className="text-sm text-muted-foreground">
              Wybierz domownika, żeby połączyć kalendarz.
            </p>
          ) : myMember?.connected && myMember.connection ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  Kalendarz zapamiętany na serwerze
                  {memberLabel ? ` · ${memberLabel}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {myMember.connection.googleEmail} ·{" "}
                  {
                    myMember.connection.calendars.filter(
                      (calendar) => calendar.enabled,
                    ).length
                  }{" "}
                  aktywnych kalendarzy · widoczny w całej aplikacji
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  persistentMode
                    ? connectPersistentCalendar()
                    : void syncCalendar()
                }
                disabled={syncingCalendar}
              >
                <CalendarSync />
                Połącz ponownie
              </Button>
            </div>
          ) : status && !canPersist ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Kalendarz Google nie jest jeszcze skonfigurowany na serwerze
              </p>
              <p className="mt-1">
                {persistentMode
                  ? "Klucze Google są ustawione, ale brakuje bazy Redis na Vercel — bez niej połączenie znika po chwili."
                  : "Brakuje kluczy Google OAuth i bazy Redis na Vercel."}{" "}
                Instrukcja: <code>docs/KALENDARZ.md</code>. Po konfiguracji
                zgodę Google dajesz raz — potem kalendarz działa bez pytania.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Synchronizacja kalendarza</p>
                <p className="text-sm text-muted-foreground">
                  {persistentMode
                    ? "Zgodę Google dajesz raz — serwer zapamięta dostęp i kalendarz działa 24/7, także na tablecie."
                    : "Tryb lokalny: dostęp na godzinę z logowania Google. Stałe połączenie — docs/KALENDARZ.md."}
                </p>
              </div>
              <Button
                onClick={() => void syncCalendar()}
                disabled={syncingCalendar}
              >
                <CalendarSync />
                {syncingCalendar ? "Łączenie…" : "Połącz kalendarz"}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
