import { Pencil, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FieldInput } from "@/components/guides/FieldInput";
import { PrivateBadge, VisibilityPicker } from "@/components/VisibilityPicker";
import { Button } from "@/components/ui/button";
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
import { useHousehold } from "@/context/HouseholdContext";
import {
  entryTitle,
  formatFieldValue,
  isEmptyValue,
  missingRequired,
} from "@/lib/guideTabs";
import type {
  GuideEntry,
  GuideFieldValue,
  GuideTab,
  ItemVisibility,
} from "@/types";

export function CustomTabPanel({
  tab,
  entries,
  setEntries,
  onEditTab,
}: {
  tab: GuideTab;
  entries: GuideEntry[];
  setEntries: (update: (prev: GuideEntry[]) => GuideEntry[]) => void;
  onEditTab: () => void;
}) {
  const { canEditItem } = useHousehold();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<GuideEntry | "new" | null>(null);
  const [reading, setReading] = useState<GuideEntry | null>(null);

  const mine = useMemo(
    () => entries.filter((e) => e.tabId === tab.id),
    [entries, tab.id],
  );
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mine;
    return mine.filter((e) =>
      tab.fields.some((f) =>
        formatFieldValue(f, e.values[f.id]).toLowerCase().includes(q),
      ),
    );
  }, [mine, search, tab.fields]);

  // Na karcie: pierwsze pole jest tytułem, kolejne 3 niepuste — podsumowaniem
  const titleField = tab.fields.find((f) => f.type === "text");
  const summaryFields = tab.fields.filter((f) => f !== titleField).slice(0, 4);

  const save = (entry: GuideEntry) => {
    setEntries((prev) =>
      prev.some((e) => e.id === entry.id)
        ? prev.map((e) => (e.id === entry.id ? entry : e))
        : [...prev, entry],
    );
    setEditing(null);
    setReading((current) => (current?.id === entry.id ? entry : current));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Szukaj w „${tab.name}”…`}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {canEditItem(tab) && (
            <Button variant="outline" onClick={onEditTab}>
              <Settings2 className="size-4" />
              Pola
            </Button>
          )}
          <Button
            onClick={() => setEditing("new")}
            className="flex-1 sm:flex-none"
          >
            <Plus className="size-4" />
            Nowy wpis
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <span className="text-3xl">{tab.emoji}</span>
          <h2 className="mt-2 text-lg font-semibold">
            {mine.length === 0 ? `„${tab.name}” jest puste` : "Nic nie pasuje"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.length === 0
              ? "Dodaj pierwszy wpis — formularz ma pola tej zakładki."
              : "Zmień wyszukiwanie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setReading(entry)}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-2">
                <h3 className="min-w-0 flex-1 truncate font-semibold">
                  {entryTitle(tab, entry)}
                </h3>
                {entry.visibility === "private" && <PrivateBadge />}
              </div>
              <dl className="space-y-1 text-sm">
                {summaryFields
                  .filter((f) => !isEmptyValue(entry.values[f.id]))
                  .map((f) => (
                    <div key={f.id} className="flex gap-2">
                      <dt className="shrink-0 text-muted-foreground">
                        {f.label}:
                      </dt>
                      <dd className="line-clamp-2 min-w-0">
                        {formatFieldValue(f, entry.values[f.id])}
                      </dd>
                    </div>
                  ))}
              </dl>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={reading !== null}
        onOpenChange={(o) => !o && setReading(null)}
      >
        <DialogContent className="hh-scroll max-h-[88vh] max-w-xl overflow-y-auto">
          {reading && (
            <>
              <DialogHeader>
                <p className="text-xs text-muted-foreground">
                  {tab.emoji} {tab.name}
                </p>
                <DialogTitle className="text-2xl">
                  {entryTitle(tab, reading)}
                </DialogTitle>
                <DialogDescription className="sr-only">Wpis</DialogDescription>
              </DialogHeader>
              <dl className="divide-y divide-border rounded-2xl border border-border">
                {tab.fields.map((f) => (
                  <div
                    key={f.id}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-3"
                  >
                    <dt className="text-sm text-muted-foreground">{f.label}</dt>
                    <dd className="whitespace-pre-line text-sm">
                      {formatFieldValue(f, reading.values[f.id])}
                    </dd>
                  </div>
                ))}
              </dl>
              {canEditItem(reading) && (
                <DialogFooter className="gap-2 sm:justify-between">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setEntries((prev) =>
                        prev.filter((e) => e.id !== reading.id),
                      );
                      setReading(null);
                      toast.success("Usunięto wpis.");
                    }}
                  >
                    <Trash2 className="size-4" />
                    Usuń
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(reading)}>
                    <Pencil className="size-4" />
                    Edytuj
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {editing !== null && (
        <EntryEditor
          tab={tab}
          entry={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function EntryEditor({
  tab,
  entry,
  onClose,
  onSave,
}: {
  tab: GuideTab;
  entry: GuideEntry | null;
  onClose: () => void;
  onSave: (entry: GuideEntry) => void;
}) {
  const [values, setValues] = useState<Record<string, GuideFieldValue>>(
    entry?.values ?? {},
  );
  const [visibility, setVisibility] = useState<ItemVisibility>(
    entry?.visibility ?? "public",
  );
  const [tried, setTried] = useState(false);
  const missing = missingRequired(tab.fields, values);

  const submit = () => {
    setTried(true);
    if (missing.length > 0) return;
    onSave({
      ...(entry ?? { id: crypto.randomUUID() }),
      tabId: tab.id,
      values,
      visibility: visibility === "private" ? "private" : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="hh-scroll max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tab.emoji} {entry ? "Edytuj wpis" : "Nowy wpis"}
          </DialogTitle>
          <DialogDescription>{tab.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {tab.fields.map((field) => {
            const id = `field-${field.id}`;
            const error = tried && missing.includes(field);
            return (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={id}>
                  {field.label}
                  {field.required && field.type !== "checkbox" && (
                    <span className="ml-0.5 text-alert">*</span>
                  )}
                </Label>
                <FieldInput
                  id={id}
                  field={field}
                  value={values[field.id]}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, [field.id]: value }))
                  }
                />
                {error && (
                  <p className="text-xs text-alert">To pole jest wymagane.</p>
                )}
              </div>
            );
          })}
          <VisibilityPicker value={visibility} onChange={setVisibility} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={submit}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
