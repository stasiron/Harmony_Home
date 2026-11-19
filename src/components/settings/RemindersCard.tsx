import { AlarmClock, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHousehold } from "@/context/HouseholdContext";
import { cn } from "@/lib/utils";
import type { ExtraReminder, ReminderSettings } from "@/types";

const DEFAULTS: ReminderSettings = { dailyHour: 8, extra: [] };
// Kolejność pon–niedz, wartości jak Date.getDay()
const DAYS = [
  [1, "pn"],
  [2, "wt"],
  [3, "śr"],
  [4, "cz"],
  [5, "pt"],
  [6, "sb"],
  [0, "nd"],
] as const;

/**
 * Godzina porannego podsumowania i dodatkowe przypomnienia mieszkania
 * (np. „Śmieci wystawiamy we wtorek o 19”). Ustawia administrator.
 */
export function RemindersCard() {
  const { household, isAdmin, setReminders } = useHousehold();
  const saved = useMemo(
    () => ({ ...DEFAULTS, ...(household?.reminders ?? {}) }),
    [household?.reminders],
  );
  const [draft, setDraft] = useState<ReminderSettings>(saved);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(saved), [saved]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const patchExtra = (id: string, change: Partial<ExtraReminder>) =>
    setDraft((d) => ({
      ...d,
      extra: d.extra.map((r) => (r.id === id ? { ...r, ...change } : r)),
    }));

  const save = async () => {
    setBusy(true);
    try {
      await setReminders({
        ...draft,
        extra: draft.extra.filter((r) => r.text.trim()),
      });
      toast.success("Przypomnienia zapisane");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <AlarmClock className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Przypomnienia</h2>
          <p className="text-sm text-muted-foreground">
            Każdy, kto włączył powiadomienia, dostaje rano podsumowanie: swoje
            obowiązki, rachunki z bliskim terminem i prośby o zwrot.
          </p>
        </div>
      </div>

      <label className="flex flex-wrap items-center gap-2 text-sm">
        Poranne podsumowanie o
        <Select
          value={String(draft.dailyHour)}
          disabled={!isAdmin}
          onValueChange={(v) =>
            setDraft((d) => ({ ...d, dailyHour: Number(v) }))
          }
        >
          <SelectTrigger className="h-9 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, h) => (
              <SelectItem key={h} value={String(h)}>
                {String(h).padStart(2, "0")}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Dodatkowe przypomnienia
        </p>
        {draft.extra.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Np. „Wystaw śmieci” we wtorki o 19:00.
          </p>
        )}
        {draft.extra.map((r) => (
          <div
            key={r.id}
            className="space-y-2 rounded-2xl border border-border bg-surface/60 p-3"
          >
            <div className="flex gap-2">
              <Input
                value={r.text}
                disabled={!isAdmin}
                onChange={(e) => patchExtra(r.id, { text: e.target.value })}
                placeholder="Treść, np. Wystaw śmieci"
                className="flex-1"
              />
              <Input
                type="time"
                step={3600}
                value={r.time}
                disabled={!isAdmin}
                onChange={(e) => patchExtra(r.id, { time: e.target.value })}
                className="w-28"
              />
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      extra: d.extra.filter((x) => x.id !== r.id),
                    }))
                  }
                  aria-label="Usuń przypomnienie"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {DAYS.map(([day, label]) => {
                const on = r.days.length === 0 || r.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => {
                      const current =
                        r.days.length === 0 ? DAYS.map(([d]) => d) : r.days;
                      const next = current.includes(day)
                        ? current.filter((d) => d !== day)
                        : [...current, day];
                      patchExtra(r.id, {
                        days: next.length === 7 ? [] : next,
                      });
                    }}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-xs",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                extra: [
                  ...d.extra,
                  {
                    id: crypto.randomUUID().slice(0, 8),
                    time: "19:00",
                    days: [],
                    text: "",
                  },
                ],
              }))
            }
          >
            <Plus className="size-4" />
            Dodaj przypomnienie
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Dodatkowe godziny działają, gdy serwer ma włączony wyzwalacz
          godzinowy; bez niego przychodzi tylko poranne podsumowanie.
        </p>
      </div>

      {isAdmin && (
        <div className="flex justify-end gap-2">
          {dirty && (
            <Button variant="ghost" onClick={() => setDraft(saved)}>
              Cofnij
            </Button>
          )}
          <Button disabled={!dirty || busy} onClick={() => void save()}>
            {busy ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      )}
    </section>
  );
}
