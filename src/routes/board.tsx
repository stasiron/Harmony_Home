import { createFileRoute } from "@tanstack/react-router";
import {
  Megaphone,
  Pencil,
  Pin,
  PinOff,
  Plus,
  ScrollText,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LandlordCard } from "@/components/board/LandlordCard";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { useMemberNames } from "@/hooks/useKitchenPrefs";
import { useSyncedList } from "@/hooks/useSyncedList";
import { daysAgoLabel } from "@/lib/bills";
import {
  isAnnouncementActive,
  saveHouseRules,
  subscribeHouseRules,
  type HouseRules,
} from "@/lib/houseRules";
import { notify } from "@/lib/push";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "Ogłoszenia · Homebase" },
      {
        name: "description",
        content:
          "Tablica ogłoszeń, regulamin mieszkania i kontakt z właścicielem.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <BoardPage />
    </Shell>
  ),
});

function normalizeAnnouncement(raw: unknown): Announcement | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (typeof r.id !== "string" || !title) return null;
  return {
    ...(r as object),
    id: r.id,
    title,
    body: typeof r.body === "string" ? r.body : "",
    pinned: r.pinned === true,
    expiresOn:
      typeof r.expiresOn === "string" && r.expiresOn ? r.expiresOn : null,
  } as Announcement;
}

// Przypięte na górze, potem najnowsze
const byPinnedThenNewest = (a: Announcement, b: Announcement) =>
  Number(b.pinned) - Number(a.pinned) ||
  (b.createdAt ?? "").localeCompare(a.createdAt ?? "");

function BoardPage() {
  const { syncUser } = useAuth();
  const { householdId, isAdmin, canEditItem } = useHousehold();
  const uid = syncUser?.uid ?? null;
  const [posts, setPosts] = useSyncedList<Announcement>({
    householdId,
    name: "announcements",
    uid,
    normalize: normalizeAnnouncement,
    sort: byPinnedThenNewest,
  });
  const [showOld, setShowOld] = useState(false);
  const active = posts.filter((p) => isAnnouncementActive(p.expiresOn));
  const expired = posts.filter((p) => !isAnnouncementActive(p.expiresOn));

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
          <Megaphone className="size-8 text-primary" strokeWidth={1.6} />
          Ogłoszenia
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tablica ogłoszeń, regulamin mieszkania i kontakt z właścicielem.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="min-w-0 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Tablica
          </h2>
          <PostForm
            onAdd={(post) => {
              setPosts((prev) => [...prev, post]);
              notify(householdId, "announcement", post.id);
            }}
          />
          {active.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
              <Megaphone className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 font-semibold">Na tablicy pusto</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Napisz np. „W sobotę o 20 impreza” albo „Przyjdzie hydraulik”.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {active.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  canEdit={canEditItem(post)}
                  canPin={isAdmin || canEditItem(post)}
                  onChange={(next) =>
                    setPosts((prev) =>
                      prev.map((p) => (p.id === next.id ? next : p)),
                    )
                  }
                  onDelete={() =>
                    setPosts((prev) => prev.filter((p) => p.id !== post.id))
                  }
                />
              ))}
            </ul>
          )}
          {expired.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                {showOld ? "Ukryj" : "Pokaż"} wygasłe ({expired.length})
              </button>
              {showOld && (
                <ul className="mt-3 space-y-3 opacity-60">
                  {expired.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      canEdit={canEditItem(post)}
                      canPin={false}
                      onChange={() => undefined}
                      onDelete={() =>
                        setPosts((prev) => prev.filter((p) => p.id !== post.id))
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <aside className="min-w-0 space-y-6">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Kontakt z właścicielem
            </h2>
            <LandlordCard editable />
          </div>
          <RulesCard />
        </aside>
      </div>
    </div>
  );
}

function PostForm({ onAdd }: { onAdd: (post: Announcement) => void }) {
  const { hasAccount } = useHousehold();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [expiresOn, setExpiresOn] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      pinned,
      expiresOn: expiresOn || null,
      // Z kontem — przypiąć, zmienić i usunąć może tylko autor lub admin
      // (reguły „blokady”); tablet bez konta nie może blokować
      ...(hasAccount ? { locked: true } : {}),
    });
    setTitle("");
    setBody("");
    setPinned(false);
    setExpiresOn("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Nowe ogłoszenie
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tytuł, np. Sobota — impreza u nas"
        autoFocus
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Szczegóły (opcjonalnie)"
        rows={3}
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={pinned}
            onCheckedChange={(v) => setPinned(v === true)}
          />
          Przypnij na górze
        </label>
        <label className="flex items-center gap-2 text-muted-foreground">
          Ważne do
          <Input
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            className="h-9 w-40"
          />
        </label>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Opublikuj
          </Button>
        </div>
      </div>
    </form>
  );
}

function PostCard({
  post,
  canEdit,
  canPin,
  onChange,
  onDelete,
}: {
  post: Announcement;
  canEdit: boolean;
  canPin: boolean;
  onChange: (post: Announcement) => void;
  onDelete: () => void;
}) {
  const names = useMemberNames();
  const author = names.find((n) => n.uid === post.createdBy)?.name;
  const when = daysAgoLabel(post.createdAt);

  return (
    <li
      className={cn(
        "space-y-2 rounded-2xl border bg-surface p-4",
        post.pinned ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        {post.pinned && <Pin className="mt-1 size-4 shrink-0 text-primary" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{post.title}</h3>
          <p className="text-xs text-muted-foreground">
            {[author, when].filter(Boolean).join(" · ")}
            {post.expiresOn &&
              ` · do ${post.expiresOn.split("-").reverse().join(".")}`}
          </p>
        </div>
        {canPin && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            onClick={() => onChange({ ...post, pinned: !post.pinned })}
            aria-label={post.pinned ? "Odepnij" : "Przypnij"}
            title={post.pinned ? "Odepnij" : "Przypnij"}
          >
            {post.pinned ? (
              <PinOff className="size-4" />
            ) : (
              <Pin className="size-4" />
            )}
          </Button>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`Usuń ogłoszenie ${post.title}`}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      {post.body && <p className="whitespace-pre-wrap text-sm">{post.body}</p>}
    </li>
  );
}

function RulesCard() {
  const { householdId, isAdmin } = useHousehold();
  const { syncUser } = useAuth();
  const [rules, setRules] = useState<HouseRules | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRules(null);
    if (!householdId) return;
    const unsubscribe = subscribeHouseRules(householdId, setRules, (err) =>
      console.error("House rules sync failed:", err),
    );
    return () => unsubscribe?.();
  }, [householdId]);

  const updated = useMemo(
    () => (rules?.updatedAt ? daysAgoLabel(rules.updatedAt) : null),
    [rules?.updatedAt],
  );

  const save = async () => {
    if (!householdId || !syncUser) return;
    setBusy(true);
    try {
      await saveHouseRules(householdId, draft.trim(), syncUser.uid);
      setEditing(false);
      toast.success("Regulamin zapisany");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać regulaminu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Regulamin mieszkania
        {isAdmin && !editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 normal-case tracking-normal"
            onClick={() => {
              setDraft(rules?.body ?? "");
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
            Edytuj
          </Button>
        )}
      </h2>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder={
              "Np.\n1. Cisza nocna 22:00–7:00.\n2. Goście na noc — wpisz w kalendarz.\n3. Naczynia zmywamy tego samego dnia."
            }
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Anuluj
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? "Zapisywanie…" : "Zapisz"}
            </Button>
          </div>
        </div>
      ) : rules?.body ? (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {rules.body}
          </p>
          {updated && (
            <p className="mt-3 text-xs text-muted-foreground">
              Zmieniony {updated}
            </p>
          )}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-8 text-center">
          <ScrollText className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isAdmin
              ? "Spisz zasady: cisza nocna, goście, sprzątanie po sobie…"
              : "Administrator mieszkania jeszcze nie spisał regulaminu."}
          </p>
        </div>
      )}
    </div>
  );
}
