import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  disconnectMemberGoogle,
  getCalendarConnectionStatus,
  setMemberCalendarDisplay,
  setMemberCalendarEnabled,
} from "@/lib/calendar/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ustawienia · Homebase" },
      { name: "description", content: "Połączenia Google Calendar domowników." },
    ],
  }),
  component: () => (
    <Shell>
      <SettingsPage />
    </Shell>
  ),
});

type Status = Awaited<ReturnType<typeof getCalendarConnectionStatus>>;

function SettingsPage() {
  const loadStatus = useServerFn(getCalendarConnectionStatus);
  const toggleEnabled = useServerFn(setMemberCalendarEnabled);
  const toggleDisplay = useServerFn(setMemberCalendarDisplay);
  const disconnect = useServerFn(disconnectMemberGoogle);

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setStatus(await loadStatus());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const connected = params.get("connected");
    if (error) setBanner(`Błąd połączenia: ${error}`);
    if (connected) setBanner("Kalendarz Google połączony. Wszystkie kalendarze włączone — wyłącz tu te, które mają zniknąć.");
    if (error || connected) {
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  if (loading && !status) {
    return <p className="text-sm text-muted-foreground">Ładowanie ustawień…</p>;
  }

  if (!status) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Ustawienia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Każdy domownik loguje się Google — kalendarze widoczne dla wszystkich. Tu wyłączasz te,
          które mają zniknąć z widoku.
        </p>
      </header>

      {banner && (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm">{banner}</p>
      )}

      {!status.oauthReady && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-4 py-4 text-sm text-muted-foreground">
          Ustaw <code className="text-foreground">GOOGLE_CLIENT_ID</code>,{" "}
          <code className="text-foreground">GOOGLE_CLIENT_SECRET</code> i{" "}
          <code className="text-foreground">AUTH_SECRET</code> w env. Redirect URI w Google Cloud:{" "}
          <code className="text-foreground">https://twoja-domena/api/auth/google/callback</code>
        </div>
      )}

      <div className="space-y-4">
        {status.members.map((member) => (
          <section
            key={member.memberId}
            className="rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{member.memberName}</h2>
                {member.connected && member.connection ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.connection.googleEmail} · {member.connection.calendars.length}{" "}
                    kalendarzy
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Nie połączono z Google</p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {status.oauthReady && (
                  <Button asChild variant={member.connected ? "outline" : "default"}>
                    <a href={`/api/auth/google?memberId=${member.memberId}`}>
                      {member.connected ? "Połącz ponownie" : "Połącz Google"}
                    </a>
                  </Button>
                )}
                {member.connected && (
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={async () => {
                      await disconnect({ data: { memberId: member.memberId } });
                      await refresh();
                    }}
                  >
                    Odłącz
                  </Button>
                )}
              </div>
            </div>

            {member.connection && member.connection.calendars.length > 0 && (
              <ul className="mt-5 space-y-3 border-t border-border pt-4">
                {member.connection.calendars.map((calendar) => (
                  <li
                    key={calendar.googleCalendarId}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{calendar.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {calendar.label}
                        {calendar.display === "busy" ? " · tylko zajęty/wolny" : " · pełne szczegóły"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${member.memberId}-${calendar.googleCalendarId}-enabled`}
                          checked={calendar.enabled}
                          onCheckedChange={async (enabled) => {
                            await toggleEnabled({
                              data: {
                                memberId: member.memberId,
                                googleCalendarId: calendar.googleCalendarId,
                                enabled,
                              },
                            });
                            await refresh();
                          }}
                        />
                        <Label
                          htmlFor={`${member.memberId}-${calendar.googleCalendarId}-enabled`}
                          className="text-xs"
                        >
                          Widoczny
                        </Label>
                      </div>

                      <div className="flex gap-1 rounded-xl border border-border p-1">
                        {(["full", "busy"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={cn(
                              "rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                              calendar.display === mode
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted",
                            )}
                            onClick={async () => {
                              await toggleDisplay({
                                data: {
                                  memberId: member.memberId,
                                  googleCalendarId: calendar.googleCalendarId,
                                  display: mode,
                                },
                              });
                              await refresh();
                            }}
                          >
                            {mode === "full" ? "Szczegóły" : "Zajęty"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
