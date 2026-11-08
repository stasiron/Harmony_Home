import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
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
import { FIELD_TYPES, hasOptions, newField } from "@/lib/guideTabs";
import type { GuideField, GuideFieldType, GuideTab } from "@/types";

const EMOJIS = [
  "📁",
  "🔧",
  "🧴",
  "🪴",
  "🚗",
  "🐾",
  "💊",
  "🧰",
  "📺",
  "🎮",
  "🧒",
  "💡",
];

/** Tworzenie i edycja własnej zakładki: nazwa, ikona, pola */
export function TabEditor({
  tab,
  onClose,
  onSave,
  onDelete,
}: {
  tab: GuideTab | null;
  onClose: () => void;
  onSave: (tab: GuideTab) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(tab?.name ?? "");
  const [emoji, setEmoji] = useState(tab?.emoji ?? "📁");
  const [fields, setFields] = useState<GuideField[]>(
    tab?.fields.length
      ? tab.fields
      : [{ ...newField("text"), label: "Nazwa", required: true }],
  );

  const update = (id: string, patch: Partial<GuideField>) =>
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );

  const changeType = (field: GuideField, type: GuideFieldType) => {
    const fresh = newField(type);
    update(field.id, {
      type,
      options: hasOptions(type)
        ? field.options?.length
          ? field.options
          : fresh.options
        : undefined,
      min:
        type === "range" || type === "number"
          ? (field.min ?? fresh.min)
          : undefined,
      max:
        type === "range" || type === "number"
          ? (field.max ?? fresh.max)
          : undefined,
      step: type === "range" ? (field.step ?? fresh.step) : undefined,
    });
  };

  const move = (index: number, dir: -1 | 1) =>
    setFields((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const valid =
    name.trim() &&
    fields.length > 0 &&
    fields.every(
      (f) =>
        f.label.trim() &&
        (!hasOptions(f.type) || (f.options?.length ?? 0) >= 2) &&
        (f.type !== "range" || (f.max ?? 0) > (f.min ?? 0)),
    );

  const submit = () => {
    if (!valid) return;
    onSave({
      ...(tab ?? { id: crypto.randomUUID() }),
      name: name.trim(),
      emoji,
      fields: fields.map((f) => {
        const clean: GuideField = {
          id: f.id,
          label: f.label.trim(),
          type: f.type,
          required: f.required,
        };
        if (hasOptions(f.type)) clean.options = f.options ?? [];
        if (f.type === "range" || f.type === "number") {
          if (f.min !== undefined) clean.min = f.min;
          if (f.max !== undefined) clean.max = f.max;
          if (f.unit) clean.unit = f.unit;
        }
        if (f.type === "range" && f.step) clean.step = f.step;
        return clean;
      }),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hh-scroll max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tab ? "Ustawienia zakładki" : "Nowa zakładka"}
          </DialogTitle>
          <DialogDescription>
            Zakładka to własna lista — np. „Sprzęty i gwarancje” albo „Rośliny”.
            Pola ustalasz sam; każdy wpis będzie je miał.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
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
              placeholder="Nazwa zakładki, np. Sprzęty i gwarancje"
              className="h-11 flex-1 text-base"
              aria-label="Nazwa zakładki"
            />
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Pola</h3>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-3 rounded-2xl border border-border bg-surface p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      update(field.id, { label: e.target.value })
                    }
                    placeholder="Nazwa pola"
                    className="min-w-0 flex-1 basis-40"
                    aria-label="Nazwa pola"
                  />
                  <Select
                    value={field.type}
                    onValueChange={(v) =>
                      changeType(field, v as GuideFieldType)
                    }
                  >
                    <SelectTrigger className="w-48" aria-label="Rodzaj pola">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                          <span className="ml-1 text-xs text-muted-foreground">
                            · {t.hint}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="ml-auto flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Wyżej"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Niżej"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      disabled={fields.length === 1}
                      onClick={() =>
                        setFields((prev) =>
                          prev.filter((f) => f.id !== field.id),
                        )
                      }
                      aria-label="Usuń pole"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                {hasOptions(field.type) && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {field.type === "scale"
                        ? "Stopnie skali, od najmniejszego (po przecinku)"
                        : "Opcje (po przecinku)"}
                    </Label>
                    <Input
                      defaultValue={(field.options ?? []).join(", ")}
                      onChange={(e) =>
                        update(field.id, {
                          options: e.target.value
                            .split(",")
                            .map((o) => o.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="np. mało, średnio, dużo"
                    />
                  </div>
                )}

                {(field.type === "range" || field.type === "number") && (
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["min", "Od"],
                        ["max", "Do"],
                        ...(field.type === "range" ? [["step", "Krok"]] : []),
                      ] as [keyof GuideField, string][]
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        {label}
                        <Input
                          inputMode="decimal"
                          defaultValue={
                            field[key] === undefined ? "" : String(field[key])
                          }
                          onChange={(e) => {
                            const n = Number(e.target.value.replace(",", "."));
                            update(field.id, {
                              [key]:
                                e.target.value.trim() === "" ||
                                !Number.isFinite(n)
                                  ? undefined
                                  : n,
                            });
                          }}
                          className="h-9 w-20"
                        />
                      </label>
                    ))}
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Jednostka
                      <Input
                        defaultValue={field.unit ?? ""}
                        onChange={(e) =>
                          update(field.id, { unit: e.target.value.trim() })
                        }
                        placeholder="np. zł, kg"
                        className="h-9 w-24"
                      />
                    </label>
                  </div>
                )}

                {field.type !== "checkbox" && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={field.required}
                      onCheckedChange={(v) =>
                        update(field.id, { required: v === true })
                      }
                    />
                    Wymagane — bez tego nie da się zapisać wpisu
                  </label>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFields((prev) => [...prev, newField("text")])}
            >
              <Plus className="size-4" />
              Pole
            </Button>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {onDelete && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
                Usuń zakładkę
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button onClick={submit} disabled={!valid}>
              Zapisz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
