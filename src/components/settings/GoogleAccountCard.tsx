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
import { DEFAULT_MEMBERS } from "@/config/household";
import { useAuth } from "@/context/AuthContext";
import { getCalendarConnectionStatus } from "@/lib/calendar/api";
import { firebaseProjectId } from "@/lib/firebase";
import { guessMemberId, memberNameById } from "@/lib/memberLink";

type Status = Awaited<ReturnType<typeof getCalendarConnectionStatus>>;

export function GoogleAccountCard() {
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
    void refreshStatus();
  }, [calendarSyncTick, refreshStatus]);

  useEffect(() => {
    if (!user || memberId || !status) return;

    const byEmail = status.members.find(
      (member) =>
        member.connection?.googleEmail?.toLowerCase() ===
        user.email?.toLowerCase(),
    );
    const suggested = byEmail?.memberId ?? guessMemberId(user);
    if (suggested) {
      void linkMember(suggested);
    }
  }, [user, memberId, status, linkMember]);

  const myMember = status?.members.find(
    (member) => member.memberId === memberId,
  );
  const memberLabel = memberId ? memberNameById(memberId) : null;
  const persistentMode = status?.oauthServerConfigured ?? false;

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

      {user && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium">Twój profil domownika</p>
              <Select
                value={memberId ?? undefined}
                onValueChange={(value) => void linkMember(value)}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Wybierz domownika" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_MEMBERS.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          {!memberId ? (
            <p className="text-sm text-muted-foreground">
              Wybierz domownika — dla{" "}
              <code className="text-foreground">stasiron9102@gmail.com</code>{" "}
              ustawiamy automatycznie Stas.
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
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Synchronizacja kalendarza</p>
                <p className="text-sm text-muted-foreground">
                  {persistentMode
                    ? "Połączenie zapisze refresh token na serwerze — kalendarz działa 24/7 bez telefonu."
                    : "Ustaw GOOGLE_CLIENT_ID/SECRET w .env albo STAS_GOOGLE_CALENDAR_ICAL_URL dla stałego iCal."}
                </p>
              </div>
              <Button
                onClick={() => void syncCalendar()}
                disabled={syncingCalendar}
              >
                <CalendarSync />
                {syncingCalendar ? "Łączenie…" : "Synchronizuj kalendarz"}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
