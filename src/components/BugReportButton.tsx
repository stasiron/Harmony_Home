import { useRouterState } from "@tanstack/react-router";
import { Bug, Crosshair, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { describeSpot, sendBugReport, type PickedSpot } from "@/lib/bugReports";
import { getReportTab } from "@/lib/reportContext";
import { APP_COMMIT, APP_VERSION } from "@/version";

type Mode = "idle" | "picking" | "describing";

/**
 * „Zgłoś błąd”: najpierw dotykasz miejsca z błędem (zapisujemy ekran,
 * zakładkę i element), potem opisujesz, co jest nie tak.
 */
export function BugReportButton() {
  const { syncUser } = useAuth();
  const { householdId, household, me } = useHousehold();
  const location = useRouterState({ select: (s) => s.location });
  const [mode, setMode] = useState<Mode>("idle");
  const [spot, setSpot] = useState<PickedSpot | null>(null);
  const [tab, setTab] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "picking") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode("idle");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  if (!syncUser) return null;

  const pick = (x: number, y: number, overlay: HTMLElement) => {
    // Nakładka zasłania stronę — na chwilę ją „przepuszczamy”
    overlay.style.pointerEvents = "none";
    const target = document.elementFromPoint(x, y);
    overlay.style.pointerEvents = "";
    setSpot(describeSpot(target, x, y));
    setTab(getReportTab());
    setMode("describing");
  };

  const send = async () => {
    setBusy(true);
    try {
      await sendBugReport({
        description: description.trim(),
        uid: syncUser.uid,
        email: syncUser.email ?? null,
        anonymous: syncUser.isAnonymous,
        householdId: householdId ?? null,
        householdName: household?.name ?? null,
        role: me?.role ?? null,
        path: location.pathname,
        search: location.searchStr ?? "",
        tab,
        selector: spot?.selector ?? null,
        elementText: spot?.elementText ?? null,
        heading: spot?.heading ?? null,
        x: spot?.x ?? null,
        y: spot?.y ?? null,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        scrollY: Math.round(window.scrollY),
        appVersion: APP_VERSION,
        appCommit: APP_COMMIT,
        userAgent: navigator.userAgent.slice(0, 300),
      });
      toast.success("Dzięki! Zgłoszenie wysłane.");
      setMode("idle");
      setDescription("");
      setSpot(null);
    } catch (err) {
      console.error("Bug report failed:", err);
      toast.error("Nie udało się wysłać zgłoszenia");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMode("picking")}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
        aria-label="Zgłoś błąd"
        title="Zgłoś błąd"
      >
        <Bug className="size-3.5" strokeWidth={1.75} />
        <span>Zgłoś błąd</span>
      </button>

      {mode === "picking" && (
        <div
          className="fixed inset-0 z-[100] cursor-crosshair bg-background/10"
          onClick={(e) => pick(e.clientX, e.clientY, e.currentTarget)}
        >
          <div
            className="fixed inset-x-0 top-0 flex items-center justify-center gap-3 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-elevated"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Crosshair className="size-4 shrink-0" />
            <span>Dotknij miejsca, gdzie jest błąd</span>
            <button
              type="button"
              className="rounded-full px-2 py-1 underline-offset-2 hover:underline"
              onClick={() => {
                setSpot(null);
                setTab(getReportTab());
                setMode("describing");
              }}
            >
              Pomiń
            </button>
            <button
              type="button"
              className="grid size-7 place-items-center rounded-full hover:bg-primary-foreground/15"
              onClick={() => setMode("idle")}
              aria-label="Anuluj"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={mode === "describing"}
        onOpenChange={(open) => !open && setMode("idle")}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="size-5" strokeWidth={1.75} />
              Zgłoś błąd
            </DialogTitle>
            <DialogDescription>
              Co jest nie tak? Miejsce na ekranie, wersję aplikacji i urządzenie
              dołączymy sami.
            </DialogDescription>
          </DialogHeader>
          {(spot?.elementText || spot?.heading || tab) && (
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Miejsce: {location.pathname}
              {tab && ` · ${tab}`}
              {spot?.heading && ` · ${spot.heading}`}
              {spot?.elementText && ` · „${spot.elementText}”`}
            </p>
          )}
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Np. po kliknięciu „Zapisz” nic się nie dzieje"
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode("picking")}>
              Wskaż inne miejsce
            </Button>
            <Button
              disabled={busy || !description.trim()}
              onClick={() => void send()}
            >
              {busy ? "Wysyłanie…" : "Wyślij"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
