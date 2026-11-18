import { Bug, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/FilterChip";
import {
  deleteBugReport,
  setBugReportStatus,
  subscribeBugReports,
} from "@/lib/bugReports";
import { daysAgoLabel } from "@/lib/bills";
import { cn } from "@/lib/utils";
import type { BugReport } from "@/types";

const STATUS: { id: BugReport["status"]; label: string; className: string }[] =
  [
    { id: "new", label: "Nowe", className: "bg-alert/15 text-alert" },
    { id: "progress", label: "W toku", className: "bg-warn/20 text-warn" },
    { id: "fixed", label: "Naprawione", className: "bg-safe/15 text-safe" },
  ];

/** Zgłoszenia z przycisku „Zgłoś błąd” — widzi tylko administrator ogólny */
export function BugReportsCard() {
  const [reports, setReports] = useState<BugReport[] | null>(null);
  const [filter, setFilter] = useState<BugReport["status"] | "all">("new");

  useEffect(() => {
    const unsubscribe = subscribeBugReports(setReports, (err) => {
      console.error("Bug reports sync failed:", err);
      setReports([]);
    });
    return () => unsubscribe?.();
  }, []);

  const visible = (reports ?? []).filter(
    (r) => filter === "all" || r.status === filter,
  );

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać");
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Bug className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Zgłoszenia błędów</h2>
          <p className="text-sm text-muted-foreground">
            Z przycisku „Zgłoś błąd” na dole każdego ekranu — ze wszystkich
            mieszkań. Widzisz je tylko Ty.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[{ id: "all" as const, label: "Wszystkie" }, ...STATUS].map((s) => (
          <FilterChip
            key={s.id}
            active={filter === s.id}
            onClick={() => setFilter(s.id)}
          >
            {s.label}
            {s.id !== "all" &&
              ` · ${(reports ?? []).filter((r) => r.status === s.id).length}`}
          </FilterChip>
        ))}
      </div>

      {reports === null ? (
        <p className="text-sm text-muted-foreground">Wczytuję…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak zgłoszeń.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li
              key={r.id}
              className="space-y-2 rounded-2xl border border-border bg-surface/60 p-4"
            >
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 whitespace-pre-wrap font-medium">
                  {r.description}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => void act(() => deleteBugReport(r.id))}
                  aria-label="Usuń zgłoszenie"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <dt>Gdzie</dt>
                <dd className="break-all text-foreground">
                  {r.path}
                  {r.search && r.search !== "?" ? r.search : ""}
                  {r.tab && ` · ${r.tab}`}
                  {r.heading && ` · ${r.heading}`}
                </dd>
                {r.elementText && (
                  <>
                    <dt>Element</dt>
                    <dd className="break-words">„{r.elementText}”</dd>
                  </>
                )}
                {r.selector && (
                  <>
                    <dt>Selektor</dt>
                    <dd className="break-all font-mono">{r.selector}</dd>
                  </>
                )}
                <dt>Punkt</dt>
                <dd>
                  {r.x !== null ? `${r.x}, ${r.y}` : "nie wskazano"} · ekran{" "}
                  {r.viewport} · przewinięcie {r.scrollY}
                </dd>
                <dt>Kto</dt>
                <dd>
                  {r.email ?? (r.anonymous ? "urządzenie bez konta" : r.uid)}
                  {r.householdName && ` · ${r.householdName}`}
                  {r.role && ` (${r.role})`}
                </dd>
                <dt>Wersja</dt>
                <dd>
                  {r.appVersion}
                  {r.appCommit && ` · ${r.appCommit.slice(0, 7)}`} ·{" "}
                  {daysAgoLabel(r.createdAt)}
                </dd>
                <dt>Urządzenie</dt>
                <dd className="break-words">{r.userAgent}</dd>
              </dl>
              <div className="flex flex-wrap gap-1.5">
                {STATUS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      void act(() => setBugReportStatus(r.id, s.id))
                    }
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      r.status === s.id
                        ? s.className
                        : "border border-border text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
