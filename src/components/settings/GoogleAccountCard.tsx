import { LogIn, LogOut } from "lucide-react";
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
import { LoginDialog } from "@/components/auth/LoginDialog";
import { firebaseProjectId } from "@/lib/firebase";

/** Konto i „kim jestem w tym mieszkaniu” — kalendarz w MyCalendarCard */
export function GoogleAccountCard() {
  const { users } = useApp();
  const { household, myProfileId, linkProfile } = useHousehold();
  const { user, loading, error, configured, signOut, clearError } = useAuth();

  const memberLabel = users.find((u) => u.id === myProfileId)?.name ?? null;

  return (
    <section className="rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Konto</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Zaloguj się raz — przeglądarka zapamięta sesję.
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
                  {user.displayName ?? "Konto"}
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
            <LoginDialog
              trigger={
                <Button disabled={!configured || loading}>
                  <LogIn />
                  Zaloguj się
                </Button>
              }
            />
          </>
        )}
      </div>

      {household && users.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Kim jesteś w tym mieszkaniu</p>
          <Select
            value={myProfileId ?? undefined}
            onValueChange={(profileId) => void linkProfile(profileId)}
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
      )}
    </section>
  );
}
