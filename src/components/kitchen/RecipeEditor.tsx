import {
  ArrowDown,
  ArrowUp,
  Lock,
  Plus,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMemberNames } from "@/hooks/useKitchenPrefs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_LABELS, RECIPE_CATEGORIES, UNITS } from "@/lib/kitchen";
import { saveRecipe } from "@/lib/recipes";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types";

type IngredientRow = {
  key: string;
  name: string;
  amount: string;
  unit: string;
  optional: boolean;
};

const EMOJIS = [
  "🍝",
  "🥘",
  "🍲",
  "🥗",
  "🍳",
  "🥞",
  "🍕",
  "🍰",
  "🥪",
  "🍜",
  "🐟",
  "🍗",
];

const newRow = (): IngredientRow => ({
  key: crypto.randomUUID(),
  name: "",
  amount: "",
  unit: "g",
  optional: false,
});

export function RecipeEditor({
  householdId,
  uid,
  authorName,
  recipe,
  onClose,
}: {
  householdId: string;
  uid: string;
  authorName: string;
  recipe: Recipe | null;
  onClose: (saved?: Recipe) => void;
}) {
  const members = useMemberNames().filter((m) => !m.anonymous && m.uid !== uid);
  const [name, setName] = useState(recipe?.name ?? "");
  const [emoji, setEmoji] = useState(recipe?.emoji ?? "🍝");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [category, setCategory] = useState(recipe?.category ?? "Obiad");
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [prep, setPrep] = useState(String(recipe?.prepMinutes ?? 15));
  const [cook, setCook] = useState(String(recipe?.cookMinutes ?? 20));
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"]>(
    recipe?.difficulty ?? "easy",
  );
  const [rows, setRows] = useState<IngredientRow[]>(() =>
    recipe && recipe.ingredients.length > 0
      ? recipe.ingredients.map((i) => ({
          key: crypto.randomUUID(),
          name: i.name,
          amount: i.amount === null ? "" : String(i.amount).replace(".", ","),
          unit: i.unit,
          optional: Boolean(i.optional),
        }))
      : [newRow(), newRow()],
  );
  const [steps, setSteps] = useState<string[]>(
    recipe && recipe.steps.length > 0 ? recipe.steps : [""],
  );
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [share, setShare] = useState<Recipe["share"]>(
    recipe?.share ?? "private",
  );
  const [sharedWith, setSharedWith] = useState<string[]>(
    recipe?.sharedWith ?? [],
  );
  const [busy, setBusy] = useState(false);

  const updateRow = (key: string, patch: Partial<IngredientRow>) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  const moveStep = (index: number, dir: -1 | 1) =>
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const num = (text: string, fallback: number) => {
    const n = Number(text.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  const ingredientsFilled = rows.some((r) => r.name.trim());
  const canSave =
    name.trim() &&
    ingredientsFilled &&
    (share !== "people" || sharedWith.length > 0) &&
    !busy;

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    const now = new Date().toISOString();
    const saved: Recipe = {
      id: recipe?.id ?? crypto.randomUUID(),
      name: name.trim(),
      emoji,
      description: description.trim(),
      category,
      servings: Math.max(1, Math.round(num(servings, 2))),
      prepMinutes: Math.round(num(prep, 0)),
      cookMinutes: Math.round(num(cook, 0)),
      difficulty,
      ingredients: rows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name.trim(),
          amount: r.amount.trim() ? num(r.amount, 0) : null,
          unit: r.unit,
          ...(r.optional ? { optional: true } : {}),
        })),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      notes: notes.trim(),
      share,
      sharedWith: share === "people" ? sharedWith : [],
      createdBy: recipe?.createdBy || uid,
      authorName: recipe?.authorName || authorName,
      createdAt: recipe?.createdAt || now,
      updatedAt: now,
    };
    try {
      await saveRecipe(householdId, saved);
      toast.success(recipe ? "Przepis zapisany." : "Nowy przepis gotowy.");
      onClose(saved);
    } catch (err) {
      console.error("Recipe save failed:", err);
      toast.error("Nie udało się zapisać przepisu.");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hh-scroll max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recipe ? "Edytuj przepis" : "Nowy przepis"}
          </DialogTitle>
          <DialogDescription>
            Przepis jest Twój — sam decydujesz, komu go pokazać.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Podstawy */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={emoji} onValueChange={setEmoji}>
                <SelectTrigger className="h-11 w-16 text-xl" aria-label="Ikona">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-0">
                  {EMOJIS.map((e) => (
                    <SelectItem key={e} value={e} className="text-xl">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa, np. Spaghetti bolognese"
                className="h-11 flex-1 text-base"
                aria-label="Nazwa przepisu"
              />
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krótki opis (opcjonalnie)"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Kategoria
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                label="Porcje"
                value={servings}
                onChange={setServings}
              />
              <NumberField
                label="Przygotowanie (min)"
                value={prep}
                onChange={setPrep}
              />
              <NumberField
                label="Gotowanie (min)"
                value={cook}
                onChange={setCook}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Trudność</Label>
              <div className="flex gap-1.5">
                {(Object.keys(DIFFICULTY_LABELS) as Recipe["difficulty"][]).map(
                  (d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      aria-pressed={difficulty === d}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm transition-colors",
                        difficulty === d
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Składniki */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Składniki</h3>
            <p className="text-xs text-muted-foreground">
              Na podaną liczbę porcji. Bez ilości — „do smaku”. Nazwy jak w
              lodówce, wtedy po ugotowaniu zdejmiemy je automatycznie.
            </p>
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.key}
                  className="flex flex-wrap gap-2 sm:flex-nowrap"
                >
                  <Input
                    value={row.name}
                    onChange={(e) =>
                      updateRow(row.key, { name: e.target.value })
                    }
                    placeholder="np. makaron"
                    className="min-w-0 flex-1 basis-full sm:basis-auto"
                    aria-label="Składnik"
                  />
                  <Input
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(row.key, { amount: e.target.value })
                    }
                    inputMode="decimal"
                    placeholder="Ilość"
                    className="w-20"
                    aria-label="Ilość"
                  />
                  <Select
                    value={row.unit}
                    onValueChange={(unit) => updateRow(row.key, { unit })}
                  >
                    <SelectTrigger className="w-28" aria-label="Jednostka">
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
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox
                      checked={row.optional}
                      onCheckedChange={(v) =>
                        updateRow(row.key, { optional: v === true })
                      }
                    />
                    opcj.
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((prev) => prev.filter((r) => r.key !== row.key))
                    }
                    aria-label="Usuń składnik"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              <Plus className="size-4" />
              Składnik
            </Button>
          </section>

          {/* Kroki */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Kroki</h3>
            <ol className="space-y-2">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-2 grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <Textarea
                    value={step}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s, i) => (i === index ? e.target.value : s)),
                      )
                    }
                    rows={2}
                    placeholder="Co zrobić…"
                    className="min-h-0 flex-1"
                  />
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={index === 0}
                      onClick={() => moveStep(index, -1)}
                      aria-label="Wyżej"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={index === steps.length - 1}
                      onClick={() => moveStep(index, 1)}
                      aria-label="Niżej"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      disabled={steps.length === 1}
                      onClick={() =>
                        setSteps((prev) => prev.filter((_, i) => i !== index))
                      }
                      aria-label="Usuń krok"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSteps((prev) => [...prev, ""])}
            >
              <Plus className="size-4" />
              Krok
            </Button>
          </section>

          <div className="space-y-1.5">
            <Label htmlFor="recipe-notes">Wskazówki</Label>
            <Textarea
              id="recipe-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="np. dzień później smakuje jeszcze lepiej"
            />
          </div>

          {/* Udostępnianie */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Kto widzi przepis</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <ShareOption
                active={share === "private"}
                onClick={() => setShare("private")}
                icon={<Lock className="size-4 text-warn" />}
                title="Tylko ja"
                hint="Prywatny"
              />
              <ShareOption
                active={share === "all"}
                onClick={() => setShare("all")}
                icon={<Users className="size-4" />}
                title="Wszyscy"
                hint="Cały dom, też tablet"
              />
              <ShareOption
                active={share === "people"}
                onClick={() => setShare("people")}
                icon={<UserCheck className="size-4" />}
                title="Wybrane osoby"
                hint="Konta, które wskażesz"
                disabled={members.length === 0}
              />
            </div>
            {share === "people" && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-border p-3">
                {members.map((m) => {
                  const on = sharedWith.includes(m.uid);
                  return (
                    <label
                      key={m.uid}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                        on
                          ? "border-primary/50 bg-primary/10"
                          : "border-border",
                      )}
                    >
                      <Checkbox
                        checked={on}
                        onCheckedChange={() =>
                          setSharedWith((prev) =>
                            on
                              ? prev.filter((u) => u !== m.uid)
                              : [...prev, m.uid],
                          )
                        }
                      />
                      {m.name}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onClose()}>
            Anuluj
          </Button>
          <Button onClick={() => void submit()} disabled={!canSave}>
            {busy ? "Zapisywanie…" : "Zapisz przepis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
      />
    </div>
  );
}

function ShareOption({
  active,
  onClick,
  icon,
  title,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-primary/50 bg-primary/10"
          : "border-border hover:bg-muted/40",
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
