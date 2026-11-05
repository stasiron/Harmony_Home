import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Link2, Lock, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import {
  disconnectMemberGoogle,
  getCalendarConnectionStatus,
  setMemberCalendarDisplay,
  setMemberCalendarEnabled,
  startGoogleCalendarConnect,
} from "@/lib/calendar/api";
import { currentIdToken } from "@/lib/idToken";
import { savePersonalIcals, usePersonalIcals } from "@/lib/personalCalendars";
import {
  ICAL_COLORS,
  normalizeIcalUrl,
  type PersonalIcal,
} from "@/lib/personalIcal";
import { cn } from "@/lib/utils";

type Status = Awaited<ReturnType<typeof getCalendarConnectionStatus>>;

function DisplayToggle({
  value,
  onChange,
}: {
  value: "full" | "busy";
  onChange: (value: "full" | "busy") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 text-xs">
      {(["full", "busy"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-md px-2 py-1",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {mode === "full" ? "Szczegóły" : "Tylko „zajęty”"}
        </button>
      ))}
    </div>
  );
}

/**
 * Kalendarz należy do konta (nie do mieszkania): linki iCal albo połączenie
 * Google. Widzisz go tylko Ty — w każdym mieszkaniu, do którego należysz.
 */
export function MyCalendarCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { icals } = usePersonalIcals();
  const loadStatus = useServerFn(getCalendarConnectionStatus);
  const startConnect = useServerFn(startGoogleCalendarConnect);
  const toggleEnabled = useServerFn(setMemberCalendarEnabled);
  const toggleDisplay = useServerFn(setMemberCalendarDisplay);
  const disconnect = useServerFn(disconnectMemberGoogle);

  const [status, setStatus] = useState<Status | null>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(
        await loadStatus({ data: { idToken: await currentIdToken() } }),
      );
    } catch (err) {
      console.error("Calendar status failed:", err);
    }
  }, [loadStatus]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  const feedChanged = () =>
    void queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });

  if (!user) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-elevated">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarDays className="size-5" />
          Mój kalendarz
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Zaloguj się, żeby dodać swój kalendarz — będzie widoczny tylko dla
          Ciebie.
        </p>
      </section>
    );
  }

  const saveIcals = async (next: PersonalIcal[]) => {
    try {
      await savePersonalIcals(user.uid, next);
      feedChanged();
    } catch (err) {
      console.error("Save icals failed:", err);
      toast.error("Nie udało się zapisać kalendarza.");
    }
  };

  const normalizedUrl = normalizeIcalUrl(url);
  const addIcal = async () => {
    if (!normalizedUrl) return;
    await saveIcals([
      ...icals,
      {
        id: crypto.randomUUID().slice(0, 8),
        label: label.trim() || "Mój kalendarz",
        url: normalizedUrl,
        display: "full",
        color: ICAL_COLORS[icals.length % ICAL_COLORS.length]!,
        enabled: true,
      },
    ]);
    setLabel("");
    setUrl("");
  };

  const patchIcal = (id: string, patch: Partial<PersonalIcal>) =>
    saveIcals(icals.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const googleReady = Boolean(
    status?.oauthServerConfigured && status.persistentStore,
  );

  const connectGoogle = async () => {
    setBusy(true);
    try {
      const { url: authUrl } = await startConnect({
        data: {
          idToken: await currentIdToken(),
          origin: window.location.origin,
        },
      });
      window.location.assign(authUrl);
    } catch (err) {
      console.error("Google connect failed:", err);
      toast.error("Nie udało się rozpocząć łączenia z Google.");
      setBusy(false);
    }
  };

  const withToken = async <T,>(fn: (idToken: string | null) => Promise<T>) => {
    try {
      await fn(await currentIdToken());
      await refresh();
      feedChanged();
    } catch (err) {
      console.error("Calendar update failed:", err);
      toast.error("Nie udało się zapisać zmiany.");
    }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarDays className="size-5" />
          Mój kalendarz
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-3.5" />
          Widzisz go tylko Ty — w zakładce Kalendarz, w każdym swoim mieszkaniu.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">
          Link iCal — najprościej, bez ekranów Google
        </p>
        <p className="text-xs text-muted-foreground">
          Google Calendar (komputer) → ⚙ Ustawienia → wybierz kalendarz → „Tajny
          adres w formacie iCal” → skopiuj. Działa też link z Outlooka i iCloud.
        </p>
        {icals.length > 0 && (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {icals.map((ical) => (
              <li
                key={ical.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--${ical.color})` }}
                  />
                  <span className="truncate font-medium">{ical.label}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <DisplayToggle
                    value={ical.display}
                    onChange={(display) => void patchIcal(ical.id, { display })}
                  />
                  <Switch
                    checked={ical.enabled !== false}
                    onCheckedChange={(enabled) =>
                      void patchIcal(ical.id, { enabled })
                    }
                    aria-label="Pokazuj ten kalendarz"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Usuń kalendarz"
                    onClick={() =>
                      void saveIcals(icals.filter((i) => i.id !== ical.id))
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nazwa, np. Praca"
            aria-label="Nazwa kalendarza"
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/…"
            aria-label="Link iCal"
          />
          <Button
            onClick={() => void addIcal()}
            disabled={!normalizedUrl || icals.length >= 10}
          >
            <Plus className="size-4" />
            Dodaj
          </Button>
        </div>
        {url.trim() && !normalizedUrl && (
          <p className="text-xs text-muted-foreground">
            To nie wygląda na link iCal z Google, Outlooka ani iCloud (musi
            zaczynać się od https:// albo webcal://).
          </p>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Link2 className="size-4" />
          Albo połączenie z kontem Google
        </p>
        {!status ? (
          <p className="text-xs text-muted-foreground">Sprawdzanie…</p>
        ) : status.connection ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Połączono: {status.connection.googleEmail}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() =>
                  void withToken((idToken) => disconnect({ data: { idToken } }))
                }
              >
                Odłącz
              </Button>
            </div>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {status.connection.calendars.map((calendar) => (
                <li
                  key={calendar.googleCalendarId}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="truncate font-medium">
                    {calendar.summary}
                  </span>
                  <div className="flex items-center gap-3">
                    <DisplayToggle
                      value={calendar.display}
                      onChange={(display) =>
                        void withToken((idToken) =>
                          toggleDisplay({
                            data: {
                              googleCalendarId: calendar.googleCalendarId,
                              display,
                              idToken,
                            },
                          }),
                        )
                      }
                    />
                    <Switch
                      checked={calendar.enabled}
                      onCheckedChange={(enabled) =>
                        void withToken((idToken) =>
                          toggleEnabled({
                            data: {
                              googleCalendarId: calendar.googleCalendarId,
                              enabled,
                              idToken,
                            },
                          }),
                        )
                      }
                      aria-label="Pokazuj ten kalendarz"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : googleReady ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Zgodę Google dajesz raz — potem kalendarze odświeżają się same.
              Google może pokazać ekran „aplikacja niezweryfikowana”:
              Zaawansowane → Przejdź do….
            </p>
            <Button onClick={() => void connectGoogle()} disabled={busy}>
              {busy ? "Przekierowuję…" : "Połącz Google"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Na serwerze nie ma jeszcze kluczy Google i bazy Redis
            (docs/KALENDARZ.md). Link iCal powyżej działa bez tego.
          </p>
        )}
      </div>
    </section>
  );
}
