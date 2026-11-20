import { Plus, Receipt, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BillLookPicker } from "@/components/bills/BillLook";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BILL_PERIODS } from "@/config/billIcons";
import { useHousehold } from "@/context/HouseholdContext";
import { usePeople } from "@/hooks/usePeople";
import {
  monthKey,
  monthLabel,
  newCustomBillType,
  resolveBillSettings,
  shiftMonth,
} from "@/lib/bills";
import { parsePLN, toInputPLN } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BillTypeConfig } from "@/types";

/**
 * Jakie rachunki ma mieszkanie: czynsz, prąd, gaz, internet i własne —
 * każdy włączany osobno, z terminem, stałą kwotą i podziałem.
 */
export function BillSettingsCard() {
  const { household, isAdmin, setBillSettings } = useHousehold();
  const { active } = usePeople();
  const saved = useMemo(
    () => resolveBillSettings(household?.billSettings),
    [household?.billSettings],
  );
  const [types, setTypes] = useState<BillTypeConfig[]>(saved.types);
  const [managers, setManagers] = useState<string[]>(saved.managers ?? []);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setTypes(saved.types);
    setManagers(saved.managers ?? []);
  }, [saved]);

  const dirty =
    JSON.stringify(types) !== JSON.stringify(saved.types) ||
    JSON.stringify([...managers].sort()) !==
      JSON.stringify([...(saved.managers ?? [])].sort());

  const patch = (id: string, change: Partial<BillTypeConfig>) =>
    setTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...change } : t)),
    );

  const save = async () => {
    setBusy(true);
    try {
      await setBillSettings({ types, managers });
      toast.success("Rachunki zapisane");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać rachunków");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Receipt className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Rachunki</h2>
          <p className="text-sm text-muted-foreground">
            Włącz te, które macie w mieszkaniu. Ikonę i kolor zmienisz, klikając
            ikonę. Stała kwota (np. czynsz) wpisze się jednym kliknięciem w
            każdym miesiącu płatności.
            {!isAdmin && " Zmienia je administrator mieszkania."}
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {types.map((type) => (
          <li
            key={type.id}
            className={cn(
              "space-y-3 rounded-2xl border bg-surface/60 px-4 py-3",
              type.enabled ? "border-border" : "border-border/50 opacity-70",
            )}
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={type.enabled}
                disabled={!isAdmin}
                onCheckedChange={(enabled) => patch(type.id, { enabled })}
                aria-label={`Włącz: ${type.name}`}
              />
              <BillLookPicker
                icon={type.icon}
                color={type.color}
                name={type.name}
                disabled={!isAdmin}
                onChange={(change) => patch(type.id, change)}
              />
              {type.kind === "custom" ? (
                <Input
                  value={type.name}
                  disabled={!isAdmin}
                  onChange={(e) => patch(type.id, { name: e.target.value })}
                  className="h-9 flex-1"
                  aria-label="Nazwa rachunku"
                />
              ) : (
                <span className="flex-1 font-medium">{type.name}</span>
              )}
              {type.kind === "custom" && isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setTypes((prev) => prev.filter((t) => t.id !== type.id))
                  }
                  aria-label={`Usuń ${type.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            {type.enabled && (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    Termin (dzień)
                    <Input
                      value={type.dueDay ?? ""}
                      disabled={!isAdmin}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        patch(type.id, {
                          dueDay:
                            e.target.value && n >= 1 && n <= 31
                              ? Math.round(n)
                              : null,
                        });
                      }}
                      inputMode="numeric"
                      className="h-8 w-16"
                    />
                  </label>
                  <PeriodPicker
                    type={type}
                    disabled={!isAdmin}
                    onChange={(period) => patch(type.id, { period })}
                  />
                  <label className="flex items-center gap-2 text-muted-foreground">
                    Stała kwota
                    <AmountInput
                      value={type.defaultAmount}
                      disabled={!isAdmin}
                      onChange={(defaultAmount) =>
                        patch(type.id, { defaultAmount })
                      }
                    />
                    zł
                  </label>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Podział:</span>
                    {(
                      [
                        ["equal", "po równo"],
                        ["weights", "własne udziały"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => patch(type.id, { splitMode: mode })}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs",
                          type.splitMode === mode
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {active.map((u) => {
                      const chosen =
                        type.participants.length === 0 ||
                        type.participants.includes(u.id);
                      return (
                        <li key={u.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={chosen}
                            disabled={!isAdmin}
                            onCheckedChange={() => {
                              const current =
                                type.participants.length === 0
                                  ? active.map((a) => a.id)
                                  : type.participants;
                              const next = current.includes(u.id)
                                ? current.filter((id) => id !== u.id)
                                : [...current, u.id];
                              patch(type.id, {
                                participants:
                                  next.length === active.length ? [] : next,
                              });
                            }}
                            aria-label={`${u.name} płaci ${type.name}`}
                          />
                          <span className="flex-1">{u.name}</span>
                          {type.splitMode === "weights" && chosen && (
                            <label className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Input
                                value={type.weights[u.id] ?? ""}
                                disabled={!isAdmin}
                                onChange={(e) => {
                                  const n = Number(
                                    e.target.value.replace(",", "."),
                                  );
                                  patch(type.id, {
                                    weights: {
                                      ...type.weights,
                                      [u.id]:
                                        Number.isFinite(n) && n >= 0 ? n : 0,
                                    },
                                  });
                                }}
                                inputMode="decimal"
                                className="h-7 w-14 text-right"
                                aria-label={`Udział ${u.name}`}
                              />
                              %
                            </label>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {type.splitMode === "weights" && (
                    <p className="text-xs text-muted-foreground">
                      Np. 40 / 30 / 30 — większy pokój płaci większą część.
                      Liczby nie muszą dawać 100, liczą się proporcje.
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="space-y-2 rounded-2xl border border-border bg-surface/60 px-4 py-3 text-sm">
        <div>
          <h3 className="font-medium">Kto rozlicza rachunki</h3>
          <p className="text-xs text-muted-foreground">
            Oprócz administratorów — ta osoba zatwierdza wpłaty, wpisuje, ile
            kto wpłacił, i zaznacza rachunek jako rozliczony.
          </p>
        </div>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Dodaj domowników, żeby kogoś wybrać.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {active.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <Checkbox
                  checked={managers.includes(u.id)}
                  disabled={!isAdmin}
                  onCheckedChange={() =>
                    setManagers((prev) =>
                      prev.includes(u.id)
                        ? prev.filter((id) => id !== u.id)
                        : [...prev, u.id],
                    )
                  }
                  aria-label={`${u.name} rozlicza rachunki`}
                />
                <span>{u.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Inny rachunek, np. woda, śmieci, Netflix"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                setTypes((prev) => [...prev, newCustomBillType(newName)]);
                setNewName("");
              }
            }}
          />
          <Button
            variant="outline"
            disabled={!newName.trim()}
            onClick={() => {
              setTypes((prev) => [...prev, newCustomBillType(newName)]);
              setNewName("");
            }}
          >
            <Plus className="size-4" />
            Dodaj rachunek
          </Button>
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-end gap-2">
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setTypes(saved.types);
                setManagers(saved.managers ?? []);
              }}
            >
              Cofnij zmiany
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

const START_MONTHS = 12;

/** „Co ile” i od którego miesiąca — np. co kwartał od stycznia */
function PeriodPicker({
  type,
  disabled,
  onChange,
}: {
  type: BillTypeConfig;
  disabled: boolean;
  onChange: (period: BillTypeConfig["period"]) => void;
}) {
  const every = type.period?.everyMonths ?? 1;
  const thisMonth = monthKey();
  const start = type.period?.startMonth ?? thisMonth;
  const starts = Array.from({ length: START_MONTHS }, (_, i) =>
    shiftMonth(thisMonth, i - 6),
  );
  if (!starts.includes(start)) starts.unshift(start);
  return (
    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
      Płatny
      <Select
        value={String(every)}
        disabled={disabled}
        onValueChange={(v) => {
          const months = Number(v) as 1 | 2 | 3 | 6 | 12;
          onChange(
            months === 1 ? null : { everyMonths: months, startMonth: start },
          );
        }}
      >
        <SelectTrigger className="h-8 w-36" aria-label="Jak często">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BILL_PERIODS.map((p) => (
            <SelectItem key={p.months} value={String(p.months)}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {every > 1 && (
        <>
          od
          <Select
            value={start}
            disabled={disabled}
            onValueChange={(startMonth) =>
              onChange({ everyMonths: every, startMonth })
            }
          >
            <SelectTrigger className="h-8 w-40" aria-label="Pierwszy miesiąc">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {starts.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}

function AmountInput({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState(toInputPLN(value));
  useEffect(() => setDraft(toInputPLN(value)), [value]);
  return (
    <Input
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const parsed = draft.trim() ? parsePLN(draft) : null;
        if (draft.trim() && parsed === null) {
          setDraft(toInputPLN(value));
          return;
        }
        onChange(parsed);
      }}
      inputMode="decimal"
      placeholder="—"
      className="h-8 w-24"
      aria-label="Stała kwota"
    />
  );
}
