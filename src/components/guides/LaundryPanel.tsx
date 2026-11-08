import { Plus, Shirt, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import { ItemLockButton } from "@/components/household/ItemLock";
import type { LaundryProgram } from "@/types";

/** Poradnik → Pranie: programy prania zapisane dla całego domu */
export function LaundryPanel() {
  const { laundryPrograms, addLaundryProgram, removeLaundryProgram } = useApp();

  const [name, setName] = useState("");
  const [mode, setMode] = useState("");
  const [temperature, setTemperature] = useState("40");
  const [rinses, setRinses] = useState("2");
  const [spin, setSpin] = useState("800");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addLaundryProgram({
      name,
      mode,
      temperature: Number(temperature),
      rinses: Number(rinses),
      spin: Number(spin),
    });
    setName("");
    setMode("");
    setTemperature("40");
    setRinses("2");
    setSpin("800");
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-elevated"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shirt className="size-4 text-primary" />
          Nowa pozycja
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ubrania / materiały">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. ręczniki bawełniane"
              required
            />
          </Field>
          <Field label="Tryb pralki">
            <Input
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              placeholder="np. Bawełna, Delikatne"
              required
            />
          </Field>
          <Field label="Temperatura (°C)">
            <Input
              type="number"
              min={0}
              max={95}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              required
            />
          </Field>
          <Field label="Ilość płukań">
            <Input
              type="number"
              min={0}
              max={10}
              value={rinses}
              onChange={(e) => setRinses(e.target.value)}
              required
            />
          </Field>
          <Field label="Obroty">
            <Input
              type="number"
              min={0}
              max={1600}
              step={100}
              value={spin}
              onChange={(e) => setSpin(e.target.value)}
              required
            />
          </Field>
        </div>
        <Button type="submit" className="gap-2">
          <Plus className="size-4" />
          Dodaj
        </Button>
      </form>

      {laundryPrograms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Brak programów prania</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dodaj pierwszy program — np. ręczniki, pościel, ubrania sportowe.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {laundryPrograms.map((program) => (
            <LaundryCard
              key={program.id}
              program={program}
              onRemove={() => removeLaundryProgram(program.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function LaundryCard({
  program,
  onRemove,
}: {
  program: LaundryProgram;
  onRemove: () => void;
}) {
  const { canEditItem } = useHousehold();
  return (
    <li className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-elevated">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-background/60">
        <Shirt className="size-5 text-primary" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="truncate text-lg font-semibold tracking-tight">
          {program.name}
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <Stat label="Tryb" value={program.mode} />
          <Stat label="Temp." value={`${program.temperature}°C`} />
          <Stat label="Płukania" value={String(program.rinses)} />
          <Stat label="Obroty" value={String(program.spin)} />
        </dl>
      </div>
      <ItemLockButton kind="laundry" item={program} />
      {canEditItem(program) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Usuń program"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
