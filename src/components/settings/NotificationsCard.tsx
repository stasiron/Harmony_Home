import { Bell, BellOff, Download, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { currentIdToken } from "@/lib/idToken";
import { sendTestPush } from "@/lib/notify/api";
import { NOTIFY_CATEGORIES } from "@/lib/notifyTypes";
import {
  currentSubscription,
  disablePush,
  enablePush,
  isIos,
  isStandalone,
  pushSupported,
  readNotifyPrefs,
  saveNotifyPrefs,
  type NotifyPrefs,
} from "@/lib/push";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

/** Android: przycisk „Zainstaluj” pojawia się po zdarzeniu przeglądarki */
let deferredPrompt: InstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
  });
}

/**
 * Aplikacja na ekranie głównym i powiadomienia (Android i iPhone).
 * iPhone pokazuje powiadomienia tylko w aplikacji dodanej do ekranu.
 */
export function NotificationsCard() {
  const { syncUser } = useAuth();
  const [standalone, setStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [prefs, setPrefs] = useState<Partial<NotifyPrefs>>({});
  const [busy, setBusy] = useState(false);
  const ios = typeof window !== "undefined" && isIos();
  const supported = typeof window !== "undefined" && pushSupported();

  useEffect(() => {
    setStandalone(isStandalone());
    setCanInstall(Boolean(deferredPrompt));
    const onPrompt = () => setCanInstall(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    void currentSubscription().then((sub) => setEnabled(Boolean(sub)));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    if (!syncUser) return;
    void readNotifyPrefs(syncUser.uid).then(setPrefs);
  }, [syncUser]);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    deferredPrompt = null;
    setCanInstall(false);
  };

  const turnOn = async () => {
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    if (result.ok) {
      setEnabled(true);
      toast.success("Powiadomienia włączone na tym urządzeniu");
      return;
    }
    toast.error(
      {
        unsupported: ios
          ? "Na iPhonie dodaj najpierw aplikację do ekranu głównego."
          : "Ta przeglądarka nie obsługuje powiadomień.",
        denied:
          "Powiadomienia są zablokowane — włącz je w ustawieniach przeglądarki lub telefonu.",
        "not-configured":
          "Serwer powiadomień nie jest jeszcze skonfigurowany (administrator).",
        "no-user": "Najpierw się zaloguj albo dołącz do mieszkania.",
        error: "Nie udało się włączyć powiadomień.",
      }[result.reason],
    );
  };

  const turnOff = async () => {
    setBusy(true);
    await disablePush().catch(() => undefined);
    setBusy(false);
    setEnabled(false);
    toast("Powiadomienia wyłączone na tym urządzeniu");
  };

  const test = async () => {
    setBusy(true);
    try {
      const result = await sendTestPush({
        data: { idToken: await currentIdToken() },
      });
      if (result.ok) toast.success("Wysłane — powinno zaraz przyjść");
      else toast.error("Nie udało się wysłać testowego powiadomienia");
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = async (id: keyof NotifyPrefs, value: boolean) => {
    if (!syncUser) return;
    const next = { ...prefs, [id]: value };
    setPrefs(next);
    try {
      await saveNotifyPrefs(syncUser.uid, next);
    } catch {
      toast.error("Nie udało się zapisać");
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Smartphone className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Aplikacja i powiadomienia</h2>
          <p className="text-sm text-muted-foreground">
            Dodaj HomeHarmony do ekranu głównego — działa jak aplikacja, bez
            paska przeglądarki, i może wysyłać przypomnienia.
          </p>
        </div>
      </div>

      {/* Instalacja */}
      <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3 text-sm">
        {standalone ? (
          <p className="text-safe">
            Aplikacja jest zainstalowana na tym urządzeniu.
          </p>
        ) : canInstall ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1">Zainstaluj aplikację na tym urządzeniu.</p>
            <Button onClick={() => void install()}>
              <Download className="size-4" />
              Zainstaluj
            </Button>
          </div>
        ) : ios ? (
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Otwórz tę stronę w Safari i stuknij{" "}
              <Share className="inline size-4 align-text-bottom" />{" "}
              <strong>Udostępnij</strong>.
            </li>
            <li>
              Wybierz <strong>Do ekranu początkowego</strong> →{" "}
              <strong>Dodaj</strong>.
            </li>
            <li>
              Otwórz HomeHarmony z ikony i wróć tu, żeby włączyć powiadomienia.
            </li>
          </ol>
        ) : (
          <p className="text-muted-foreground">
            W menu przeglądarki wybierz „Zainstaluj aplikację” albo „Dodaj do
            ekranu głównego”.
          </p>
        )}
      </div>

      {/* Powiadomienia */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {enabled ? (
            <Bell className="size-5 text-primary" />
          ) : (
            <BellOff className="size-5 text-muted-foreground" />
          )}
          <p className="flex-1 text-sm">
            {enabled
              ? "Powiadomienia włączone na tym urządzeniu."
              : !supported && ios && !standalone
                ? "Na iPhonie powiadomienia działają po dodaniu do ekranu głównego."
                : "Powiadomienia wyłączone na tym urządzeniu."}
          </p>
          {enabled ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void test()}
              >
                Wyślij testowe
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void turnOff()}
              >
                Wyłącz
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              disabled={busy || enabled === null}
              onClick={() => void turnOn()}
            >
              Włącz powiadomienia
            </Button>
          )}
        </div>

        {enabled && (
          <ul className="space-y-2 border-t border-border pt-3">
            {NOTIFY_CATEGORIES.map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <Switch
                  checked={prefs[c.id] !== false}
                  onCheckedChange={(v) => void toggleCategory(c.id, v)}
                  aria-label={c.label}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
