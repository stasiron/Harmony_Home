import { Lock, Plus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
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
import { useRememberedVisibility } from "@/hooks/useKitchenPrefs";
import { FOOD_CATEGORIES, UNITS, type FoodInput } from "@/lib/kitchen";
import { cn } from "@/lib/utils";
import type { ItemVisibility, ShoppingCategory } from "@/types";

/** Wspólne / Prywatne — prywatne tylko z kontem */
export function VisibilityToggle({
  value,
  onChange,
  className,
}: {
  value: ItemVisibility;
  onChange: (value: ItemVisibility) => void;
  className?: string;
}) {
  const { hasAccount } = useHousehold();
  return (
    <div
      className={cn(
        "inline-flex shrink-0 rounded-xl border border-border bg-background/40 p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Kto widzi"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "public"}
        onClick={() => onChange("public")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
          value === "public"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Users className="size-3.5" />
        Wspólne
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "private"}
        disabled={!hasAccount}
        title={hasAccount ? "Widzisz tylko Ty" : "Prywatne wymagają konta"}
        onClick={() => onChange("private")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          value === "private"
            ? "bg-warn/20 text-warn"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Lock className="size-3.5" />
        Prywatne
      </button>
    </div>
  );
}

/**
 * Szybkie dodawanie produktu: nazwa, ilość, jednostka, kategoria, widoczność
 * (i termin — w lodówce). Enter w nazwie dodaje.
 */
export function FoodForm({
  onAdd,
  withExpiry = false,
  storageKey,
  placeholder,
  submitLabel = "Dodaj",
}: {
  onAdd: (input: FoodInput & { expiresOn?: string | null }) => void;
  withExpiry?: boolean;
  storageKey: string;
  placeholder: string;
  submitLabel?: string;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("szt");
  const [category, setCategory] = useState<ShoppingCategory>("other");
  const [expiresOn, setExpiresOn] = useState("");
  const [visibility, setVisibility] = useRememberedVisibility(storageKey);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsed = Number(amount.replace(",", "."));
    onAdd({
      name,
      amount: amount.trim() && Number.isFinite(parsed) ? parsed : null,
      unit,
      category,
      visibility,
      expiresOn: expiresOn || null,
    });
    setName("");
    setAmount("");
    setExpiresOn("");
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-3 sm:p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          className="h-11 flex-1"
          aria-label="Nazwa produktu"
        />
        <div className="flex gap-2">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Ilość"
            className="h-11 w-24"
            aria-label="Ilość"
          />
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-11 w-28" aria-label="Jednostka">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ShoppingCategory)}
        >
          <SelectTrigger className="h-9 w-auto min-w-40" aria-label="Kategoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOOD_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {withExpiry && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Ważne do
            <Input
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              className="h-9 w-40"
            />
          </label>
        )}
        <VisibilityToggle value={visibility} onChange={setVisibility} />
        <Button type="submit" className="ml-auto h-9" disabled={!name.trim()}>
          <Plus className="size-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
