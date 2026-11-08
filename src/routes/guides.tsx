import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  ChefHat,
  Pencil,
  Plus,
  Search,
  Shirt,
  Trash2,
} from "lucide-react";
import { CustomTabPanel } from "@/components/guides/CustomTabPanel";
import { TabEditor } from "@/components/guides/TabEditor";
import { RecipesPanel } from "@/components/kitchen/RecipesPanel";
import { useKitchen } from "@/hooks/useKitchen";
import { useSyncedList } from "@/hooks/useSyncedList";
import { normalizeGuideEntry, normalizeGuideTab } from "@/lib/guideTabs";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { LaundryPanel } from "@/components/guides/LaundryPanel";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import { useVisibilityList } from "@/hooks/useVisibilityList";
import { FilterChip } from "@/components/FilterChip";
import { cn } from "@/lib/utils";
import type {
  GuideCategory,
  GuideEntry,
  GuideNote,
  GuideTab,
  ItemVisibility,
} from "@/types";

/** Wbudowane zakładki; własne mają id dokumentu */
type BuiltinTab = "notes" | "recipes" | "laundry";
const BUILTIN: BuiltinTab[] = ["notes", "recipes", "laundry"];

export const Route = createFileRoute("/guides")({
  validateSearch: (search: Record<string, unknown>): { tab?: BuiltinTab } =>
    BUILTIN.includes(search.tab as BuiltinTab)
      ? { tab: search.tab as BuiltinTab }
      : {},
  head: () => ({
    meta: [
      { title: "Poradnik · Homebase" },
      {
        name: "description",
        content:
          "Domowy poradnik: jak prać, jak obsługiwać sprzęty, jak sprzątać.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <GuidesPage />
    </Shell>
  ),
});

const CATEGORIES: { id: GuideCategory; label: string; emoji: string }[] = [
  { id: "cleaning", label: "Sprzątanie", emoji: "🧽" },
  { id: "devices", label: "Sprzęty", emoji: "🔌" },
  { id: "kitchen", label: "Kuchnia", emoji: "🍳" },
  { id: "home", label: "Dom", emoji: "🏠" },
  { id: "other", label: "Inne", emoji: "📌" },
];

const categoryInfo = (id: GuideCategory) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;

function normalizeGuide(raw: unknown): GuideNote | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.title !== "string") return null;
  return {
    ...(r as object),
    id: r.id,
    title: r.title,
    body: typeof r.body === "string" ? r.body : "",
    category: CATEGORIES.some((c) => c.id === r.category)
      ? (r.category as GuideCategory)
      : "other",
  } as GuideNote;
}

const byTitle = (a: GuideNote, b: GuideNote) =>
  a.title.localeCompare(b.title, "pl");

function GuidesPage() {
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<string>(initialTab ?? "notes");
  const [tabEditor, setTabEditor] = useState<GuideTab | "new" | null>(null);
  const { laundryPrograms } = useApp();
  const { syncUser } = useAuth();
  const { householdId, canEditItem } = useHousehold();
  const uid = syncUser?.uid ?? null;
  const privateOwner = syncUser && !syncUser.isAnonymous ? syncUser.uid : null;
  // Tylko na tej stronie — nie obciąża odczytami reszty aplikacji
  const [notes, setNotes] = useVisibilityList<GuideNote>({
    householdId,
    name: "guides",
    uid,
    privateOwner,
    normalize: normalizeGuide,
    sort: byTitle,
  });
  const [customTabs, setCustomTabs] = useSyncedList<GuideTab>({
    householdId,
    name: "guideTabs",
    uid,
    normalize: normalizeGuideTab,
    sort: (a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
  });
  const [entries, setEntries] = useVisibilityList<GuideEntry>({
    householdId,
    name: "guideEntries",
    uid,
    privateOwner,
    normalize: normalizeGuideEntry,
    sort: (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  });

  const activeCustom = customTabs.find((t) => t.id === tab) ?? null;
  // Usunięta zakładka — wróć do instrukcji
  const current =
    BUILTIN.includes(tab as BuiltinTab) || activeCustom ? tab : "notes";

  const tabs: { id: string; label: string; icon: ReactNode; count?: number }[] =
    [
      {
        id: "notes",
        label: "Instrukcje",
        icon: <BookOpen className="size-4" />,
        count: notes.length,
      },
      {
        id: "recipes",
        label: "Przepisy",
        icon: <ChefHat className="size-4" />,
      },
      {
        id: "laundry",
        label: "Pranie",
        icon: <Shirt className="size-4" />,
        count: laundryPrograms.length,
      },
      ...customTabs.map((t) => ({
        id: t.id,
        label: t.name,
        icon: <span className="text-base leading-none">{t.emoji}</span>,
        count: entries.filter((e) => e.tabId === t.id).length,
      })),
    ];

  const saveTab = (saved: GuideTab) => {
    setCustomTabs((prev) =>
      prev.some((t) => t.id === saved.id)
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [...prev, saved],
    );
    setTabEditor(null);
    setTab(saved.id);
  };

  const deleteTab = (target: GuideTab) => {
    const count = entries.filter((e) => e.tabId === target.id).length;
    const question =
      "Usunąć zakładkę „" +
      target.name +
      "”" +
      (count > 0 ? " razem z wpisami (" + count + ")?" : "?");
    if (!window.confirm(question)) return;
    setEntries((prev) => prev.filter((e) => e.tabId !== target.id));
    setCustomTabs((prev) => prev.filter((t) => t.id !== target.id));
    setTabEditor(null);
    setTab("notes");
    toast.success("Usunięto zakładkę.");
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Poradnik
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Domowa wiedza w jednym miejscu — instrukcje, przepisy, pranie i własne
          zakładki.
        </p>
      </header>

      <div
        role="tablist"
        className="hh-scroll -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {tabs.map(({ id, label, icon, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
              current === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {icon}
            {label}
            {count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  current === id ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {count}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTabEditor("new")}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-dashed border-border px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="size-4" />
          Nowa zakładka
        </button>
      </div>

      {current === "notes" && <NotesPanel notes={notes} setNotes={setNotes} />}
      {current === "recipes" && <GuideRecipes />}
      {current === "laundry" && <LaundryPanel />}
      {activeCustom && (
        <CustomTabPanel
          tab={activeCustom}
          entries={entries}
          setEntries={setEntries}
          onEditTab={() => setTabEditor(activeCustom)}
        />
      )}

      {tabEditor !== null && (
        <TabEditor
          tab={tabEditor === "new" ? null : tabEditor}
          onClose={() => setTabEditor(null)}
          onSave={saveTab}
          onDelete={
            tabEditor !== "new" && canEditItem(tabEditor)
              ? () => deleteTab(tabEditor)
              : undefined
          }
        />
      )}
    </div>
  );
}

/** Te same przepisy co w Kuchni — jedno źródło danych, dwa wejścia */
function GuideRecipes() {
  const kitchen = useKitchen();
  return <RecipesPanel kitchen={kitchen} />;
}

function NotesPanel({
  notes,
  setNotes,
}: {
  notes: GuideNote[];
  setNotes: (update: (prev: GuideNote[]) => GuideNote[]) => void;
}) {
  const [filter, setFilter] = useState<GuideCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<GuideNote | "new" | null>(null);
  const [reading, setReading] = useState<GuideNote | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter(
      (n) =>
        (filter === "all" || n.category === filter) &&
        (!q ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)),
    );
  }, [notes, filter, search]);

  const save = (note: GuideNote) => {
    setNotes((prev) =>
      prev.some((n) => n.id === note.id)
        ? prev.map((n) => (n.id === note.id ? note : n))
        : [...prev, note],
    );
    setEditing(null);
    setReading((current) => (current?.id === note.id ? note : current));
  };

  const remove = (note: GuideNote) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    setReading(null);
    toast.success("Usunięto instrukcję.");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj w poradniku…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Wszystko
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
            >
              {c.emoji} {c.label}
            </FilterChip>
          ))}
        </div>
        <Button className="lg:ml-auto" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          Nowa instrukcja
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
          <BookOpen className="mx-auto size-7 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            {notes.length === 0 ? "Poradnik jest pusty" : "Nic nie pasuje"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.length === 0
              ? "Zapisz np. jak odkamienić ekspres, gdzie jest zawór wody albo jak myć piekarnik."
              : "Zmień filtr albo wyszukiwanie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((note) => {
            const cat = categoryInfo(note.category);
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => setReading(note)}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 text-left transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{cat.emoji}</span>
                  {cat.label}
                  {note.visibility === "private" && (
                    <PrivateBadge className="ml-auto" />
                  )}
                </div>
                <h3 className="text-lg font-semibold leading-tight">
                  {note.title}
                </h3>
                <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
                  {note.body || "—"}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={reading !== null}
        onOpenChange={(o) => !o && setReading(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          {reading && (
            <>
              <DialogHeader>
                <p className="text-xs text-muted-foreground">
                  {categoryInfo(reading.category).emoji}{" "}
                  {categoryInfo(reading.category).label}
                </p>
                <DialogTitle className="text-2xl">{reading.title}</DialogTitle>
                <DialogDescription className="sr-only">
                  Treść instrukcji
                </DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {reading.body}
              </p>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => remove(reading)}
                >
                  <Trash2 className="size-4" />
                  Usuń
                </Button>
                <Button variant="outline" onClick={() => setEditing(reading)}>
                  <Pencil className="size-4" />
                  Edytuj
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {editing !== null && (
        <NoteEditor
          note={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function NoteEditor({
  note,
  onClose,
  onSave,
}: {
  note: GuideNote | null;
  onClose: () => void;
  onSave: (note: GuideNote) => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [category, setCategory] = useState<GuideCategory>(
    note?.category ?? "cleaning",
  );
  const [body, setBody] = useState(note?.body ?? "");
  const [visibility, setVisibility] = useState<ItemVisibility>(
    note?.visibility ?? "public",
  );

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      ...(note ?? { id: crypto.randomUUID() }),
      title: title.trim(),
      category,
      body: body.trim(),
      visibility: visibility === "private" ? "private" : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? "Edytuj instrukcję" : "Nowa instrukcja"}
          </DialogTitle>
          <DialogDescription>
            Krótko i po kolei — tak, żeby każdy domownik dał radę.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="guide-title">Tytuł</Label>
            <Input
              id="guide-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Odkamienianie ekspresu"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kategoria</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <FilterChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.emoji} {c.label}
                </FilterChip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guide-body">Jak to zrobić</Label>
            <Textarea
              id="guide-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder={"1. …\n2. …\n3. …"}
            />
          </div>
          <VisibilityPicker value={visibility} onChange={setVisibility} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
