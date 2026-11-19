import { Luggage, Pencil, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import { usePeople } from "@/hooks/usePeople";
import { dayKey } from "@/lib/absence";
import { notify } from "@/lib/push";
import { cn } from "@/lib/utils";
import type { Absence, GuestPlan } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → wartość pola datetime-local (czas lokalny) */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shortDay(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function shortWhen(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Wydarzenia domu w kalendarzu: zapowiedzi gości i nieobecności. Przyciski
 * u góry kalendarza + lista najbliższych z edycją i usuwaniem.
 */
export function HouseEvents() {
  const { guestPlans, absences, removeGuestPlan, removeAbsence } = useApp();
  const { canEditItem } = useHousehold();
  const { nameOf } = usePeople();
  const [guestDialog, setGuestDialog] = useState<GuestPlan | "new" | null>(
    null,
  );
  // null — zamknięte, "new" — nowa, obiekt — edycja
  const [absenceDialog, setAbsenceDialog] = useState<Absence | "new" | null>(
    null,
  );

  const today = dayKey(new Date());
  const upcoming = useMemo(() => {
    const now = Date.now();
    const guests = guestPlans
      .filter((p) => {
        const end = Date.parse(p.until ?? p.when) || Date.parse(p.when);
        return end >= now - 3 * 3600_000;
      })
      .map((p) => ({ kind: "guest" as const, sort: p.when, plan: p }));
    const away = absences
      .filter((a) => a.to >= today)
      .map((a) => ({ kind: "absence" as const, sort: a.from, absence: a }));
    return [...guests, ...away].sort((a, b) => a.sort.localeCompare(b.sort));
  }, [guestPlans, absences, today]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setGuestDialog("new")}>
          <UserPlus className="size-4" />
          Zapowiedz gościa
        </Button>
        <Button variant="outline" onClick={() => setAbsenceDialog("new")}>
          <Luggage className="size-4" />
          Nie ma mnie / wyjazd
        </Button>
      </div>

      {upcoming.length > 0 && (
        <ul className="hh-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {upcoming.map((entry) =>
            entry.kind === "guest" ? (
              <li
                key={entry.plan.id}
                className="flex min-w-60 shrink-0 items-start gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm"
              >
                <UserPlus className="mt-0.5 size-4 shrink-0 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {entry.plan.title || entry.plan.notes || "Goście"}
                    {entry.plan.overnight && " · na noc"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shortWhen(entry.plan.when)}
                    {entry.plan.hostId && ` · ${nameOf(entry.plan.hostId)}`}
                  </p>
                </div>
                {canEditItem(entry.plan) && (
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setGuestDialog(entry.plan)}
                      aria-label="Edytuj zapowiedź"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:text-destructive"
                      onClick={() => removeGuestPlan(entry.plan.id)}
                      aria-label="Usuń zapowiedź"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ) : (
              <li
                key={entry.absence.id}
                className="flex min-w-60 shrink-0 items-start gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <Luggage className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {nameOf(entry.absence.profileId)} — nieobecność
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shortDay(entry.absence.from)} –{" "}
                    {shortDay(entry.absence.to)} ·{" "}
                    {entry.absence.mode === "reassign"
                      ? "robią inni"
                      : "obowiązki czekają"}
                  </p>
                </div>
                {canEditItem(entry.absence) && (
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setAbsenceDialog(entry.absence)}
                      aria-label="Edytuj nieobecność"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:text-destructive"
                      onClick={() => removeAbsence(entry.absence.id)}
                      aria-label="Usuń nieobecność"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      <GuestPlanDialog
        value={guestDialog}
        onClose={() => setGuestDialog(null)}
      />
      <AbsenceDialog
        open={absenceDialog !== null}
        absence={absenceDialog === "new" ? null : absenceDialog}
        onOpenChange={(open) => !open && setAbsenceDialog(null)}
      />
    </section>
  );
}

function GuestPlanDialog({
  value,
  onClose,
}: {
  value: GuestPlan | "new" | null;
  onClose: () => void;
}) {
  const open = value !== null;
  const editing = value && value !== "new" ? value : null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Zapowiedź gościa" : "Zapowiedz gościa"}
          </DialogTitle>
          <DialogDescription>
            Domownicy dostaną powiadomienie, a wizyta pojawi się w kalendarzu.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <GuestPlanForm
            key={editing?.id ?? "new"}
            plan={editing}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GuestPlanForm({
  plan,
  onDone,
}: {
  plan: GuestPlan | null;
  onDone: () => void;
}) {
  const { addGuestPlan, updateGuestPlan } = useApp();
  const { householdId } = useHousehold();
  const { active, actorId } = usePeople();
  const defaultStart = () => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d.toISOString();
  };
  const [title, setTitle] = useState(plan?.title ?? plan?.notes ?? "");
  const [host, setHost] = useState(plan?.hostId ?? actorId ?? "");
  const [start, setStart] = useState(
    toLocalInput(plan?.when ?? defaultStart()),
  );
  const [until, setUntil] = useState(toLocalInput(plan?.until));
  const [guests, setGuests] = useState(plan?.guests ? String(plan.guests) : "");
  const [overnight, setOvernight] = useState(plan?.overnight ?? false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const when = new Date(start);
    if (!title.trim() || Number.isNaN(when.getTime())) return;
    const untilDate = until ? new Date(until) : null;
    const next = {
      when: when.toISOString(),
      notes: title.trim(),
      title: title.trim(),
      until: untilDate && untilDate > when ? untilDate.toISOString() : null,
      hostId: host || null,
      guests: Number(guests) > 0 ? Math.round(Number(guests)) : null,
      overnight,
    };
    if (plan) {
      updateGuestPlan({ ...plan, ...next });
      toast.success("Zapowiedź zapisana");
    } else {
      const id = addGuestPlan(next);
      notify(householdId, "guest", id);
      toast.success("Gość zapowiedziany");
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Kto przychodzi, np. Kasia z siostrą"
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <label className="space-y-1">
          Od
          <Input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          Do (opcjonalnie)
          <Input
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Select
          value={host || "__none__"}
          onValueChange={(v) => setHost(v === "__none__" ? "" : v)}
        >
          <SelectTrigger
            className="h-9 w-auto min-w-40"
            aria-label="Kto zaprasza"
          >
            <SelectValue placeholder="Kto zaprasza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">kto zaprasza?</SelectItem>
            {active.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-muted-foreground">
          Osób
          <Input
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            inputMode="numeric"
            className="h-9 w-14"
          />
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={overnight}
            onCheckedChange={(v) => setOvernight(v === true)}
          />
          Na noc
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Anuluj
        </Button>
        <Button type="submit" disabled={!title.trim() || !start}>
          {plan ? "Zapisz" : "Zapowiedz"}
        </Button>
      </div>
    </form>
  );
}

/** Dodanie albo edycja nieobecności — kalendarz i strona Domownicy */
export function AbsenceDialog({
  open,
  onOpenChange,
  absence = null,
  defaultProfileId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edytowana nieobecność; null — nowa */
  absence?: Absence | null;
  /** Kto domyślnie (np. wybrany domownik) */
  defaultProfileId?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nieobecność / wyjazd</DialogTitle>
          <DialogDescription>
            Kolejka „na zmianę” pominie tę osobę. Obowiązki przypisane do niej
            mogą poczekać albo przejść na pozostałych.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AbsenceForm
            key={absence?.id ?? "new"}
            absence={absence}
            defaultProfileId={defaultProfileId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AbsenceForm({
  absence,
  defaultProfileId,
  onDone,
}: {
  absence: Absence | null;
  defaultProfileId?: string | null;
  onDone: () => void;
}) {
  const { addAbsence, updateAbsence } = useApp();
  const { householdId } = useHousehold();
  const { active, actorId } = usePeople();
  const today = dayKey(new Date());
  const [who, setWho] = useState(
    absence?.profileId ?? defaultProfileId ?? actorId ?? active[0]?.id ?? "",
  );
  const [from, setFrom] = useState(absence?.from ?? today);
  const [to, setTo] = useState(absence?.to ?? today);
  const [mode, setMode] = useState<Absence["mode"]>(absence?.mode ?? "shift");
  const [note, setNote] = useState(absence?.note ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!who || !from || !to) return;
    const fields = {
      profileId: who,
      from: from <= to ? from : to,
      to: from <= to ? to : from,
      mode,
      note: note.trim(),
    };
    if (absence) {
      updateAbsence({ ...absence, ...fields });
    } else {
      const id = addAbsence(fields);
      notify(householdId, "absence", id);
    }
    toast.success("Nieobecność zapisana");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Select value={who} onValueChange={setWho}>
        <SelectTrigger aria-label="Kto">
          <SelectValue placeholder="Kto wyjeżdża" />
        </SelectTrigger>
        <SelectContent>
          {active.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <label className="space-y-1">
          Od
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          Do (włącznie)
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <div className="space-y-1.5">
        {(
          [
            [
              "shift",
              "Przesuń moje obowiązki",
              "Poczekają do powrotu — dni wyjazdu nie liczą się do zaległości.",
            ],
            [
              "reassign",
              "Przekaż innym",
              "W tym czasie zrobią je pozostali domownicy.",
            ],
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              mode === value
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-muted/50",
            )}
          >
            <span className="font-medium">{label}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </button>
        ))}
      </div>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notatka (opcjonalnie), np. święta u rodziców"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Anuluj
        </Button>
        <Button type="submit" disabled={!who}>
          Zapisz
        </Button>
      </div>
    </form>
  );
}
