import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeople } from "@/hooks/usePeople";
import type { SplitResult } from "@/lib/bills";
import { formatPLN, parsePLN, splitEqual, toInputPLN } from "@/lib/money";
import type { PurchaseLine } from "@/types";

/**
 * Kto zapłacił i między kogo podzielić. Z pozycjami (zakupy z kuchni) suma
 * liczy się sama; bez nich — wpisujesz kwotę (np. „Środki czystości”).
 */
export function SplitDialog({
  open,
  onOpenChange,
  lines,
  defaultTitle,
  description,
  onConfirm,
  onSkip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines?: PurchaseLine[];
  defaultTitle: string;
  description?: string;
  onConfirm: (result: SplitResult) => void;
  /** „Bez podziału” — np. kupione tylko dla siebie */
  onSkip?: () => void;
}) {
  const { active, actorId, nameOf } = usePeople();
  const linesTotal = useMemo(
    () => (lines ?? []).reduce((sum, l) => sum + l.price, 0),
    [lines],
  );
  const [title, setTitle] = useState(defaultTitle);
  const [totalText, setTotalText] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [people, setPeople] = useState<string[]>([]);
  const [manual, setManual] = useState(false);
  const [manualShares, setManualShares] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle);
    setTotalText(lines?.length ? toInputPLN(linesTotal) : "");
    setPaidBy(
      actorId && active.some((u) => u.id === actorId)
        ? actorId
        : (active[0]?.id ?? ""),
    );
    setPeople(active.map((u) => u.id));
    setManual(false);
    setManualShares({});
    // Tylko przy otwarciu — później to pola formularza
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = lines?.length ? linesTotal : (parsePLN(totalText) ?? 0);
  const shares = useMemo(() => {
    if (!manual) return splitEqual(total, people);
    return Object.fromEntries(
      people.map((id) => [id, parsePLN(manualShares[id] ?? "") ?? 0]),
    );
  }, [manual, total, people, manualShares]);
  const sharesSum = Object.values(shares).reduce((s, v) => s + v, 0);
  const valid =
    total > 0 &&
    paidBy !== "" &&
    people.length > 0 &&
    sharesSum === total &&
    title.trim() !== "";

  const toggle = (id: string) =>
    setPeople((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Zakup dla domu</DialogTitle>
          <DialogDescription>
            {description ??
              "Wszyscy domownicy zobaczą, co kupiono, ile kosztowało i kto ile oddaje."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Co kupione, np. Środki czystości"
            aria-label="Nazwa zakupu"
          />

          {lines?.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border text-sm">
              {lines.map((l, i) => (
                <li key={i} className="flex justify-between px-3 py-2">
                  <span className="truncate">{l.name}</span>
                  <span className="tabular-nums">{formatPLN(l.price)}</span>
                </li>
              ))}
              <li className="flex justify-between px-3 py-2 font-semibold">
                <span>Razem</span>
                <span className="tabular-nums">{formatPLN(linesTotal)}</span>
              </li>
            </ul>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              Kwota
              <Input
                value={totalText}
                onChange={(e) => setTotalText(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-32"
                aria-label="Kwota w złotych"
              />
              zł
            </label>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Zapłacił(a)
            </p>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger aria-label="Kto zapłacił">
                <SelectValue placeholder="Wybierz osobę" />
              </SelectTrigger>
              <SelectContent>
                {active.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Podział
              </p>
              <div className="flex gap-1 text-xs">
                {(
                  [
                    [false, "Po równo"],
                    [true, "Ręcznie"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setManual(value);
                      if (value) {
                        setManualShares(
                          Object.fromEntries(
                            Object.entries(splitEqual(total, people)).map(
                              ([id, v]) => [id, toInputPLN(v)],
                            ),
                          ),
                        );
                      }
                    }}
                    className={
                      manual === value
                        ? "rounded-lg bg-primary px-2 py-1 text-primary-foreground"
                        : "rounded-lg border border-border px-2 py-1"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ul className="space-y-1.5">
              {active.map((u) => {
                const included = people.includes(u.id);
                return (
                  <li key={u.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={included}
                      onCheckedChange={() => toggle(u.id)}
                      aria-label={`Dzieli: ${u.name}`}
                    />
                    <span className="flex-1 text-sm">{nameOf(u.id)}</span>
                    {included &&
                      (manual ? (
                        <Input
                          value={manualShares[u.id] ?? ""}
                          onChange={(e) =>
                            setManualShares((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          inputMode="decimal"
                          className="h-8 w-24 text-right"
                          aria-label={`Część ${u.name}`}
                        />
                      ) : (
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {formatPLN(shares[u.id] ?? 0)}
                        </span>
                      ))}
                  </li>
                );
              })}
            </ul>
            {manual && sharesSum !== total && (
              <p className="text-xs text-alert">
                Części dają {formatPLN(sharesSum)}, a razem jest{" "}
                {formatPLN(total)}.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Bez podziału
              </Button>
            )}
            <Button
              disabled={!valid}
              onClick={() =>
                onConfirm({ title: title.trim(), total, paidBy, shares })
              }
            >
              Zapisz i podziel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
