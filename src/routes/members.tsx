import { createFileRoute } from "@tanstack/react-router";
import {
  Flame,
  Link2,
  Mail,
  Pencil,
  Smartphone,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import { Shell } from "@/components/Shell";
import { ChoreCard } from "@/components/chores/ChoreCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { HouseholdMember, User } from "@/types";
import { effectiveAssignees } from "@/lib/rotation";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Domownicy · Homebase" },
      {
        name: "description",
        content: "Domownicy, ich konta i obowiązki.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <MembersPage />
    </Shell>
  ),
});

/** Jak opisać konto: Google, link e-mail, urządzenie bez konta */
function accountLabel(member: HouseholdMember) {
  if (member.anonymous) {
    return { icon: Smartphone, text: "Urządzenie bez konta", detail: null };
  }
  const detail = member.email ?? member.displayName;
  if (member.provider === "google.com") {
    return { icon: GoogleIcon, text: "Google", detail };
  }
  if (member.provider === "password") {
    return { icon: Mail, text: "Link e-mail", detail };
  }
  return { icon: Mail, text: "Konto", detail };
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center font-bold text-[#4285F4]",
        className,
      )}
    >
      G
    </span>
  );
}

function AccountChip({
  member,
  own,
  onUnlink,
}: {
  member: HouseholdMember;
  own: boolean;
  onUnlink?: () => void;
}) {
  const { icon: Icon, text, detail } = accountLabel(member);
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-xs">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">
        {detail ?? text}
        {own && <span className="text-primary"> (Ty)</span>}
      </span>
      {onUnlink && (
        <button
          type="button"
          onClick={onUnlink}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Odłącz konto od domownika"
          title="Odłącz konto"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

function fail(message: string) {
  return (err: unknown) => {
    console.error(message, err);
    toast.error(message);
  };
}

function MembersPage() {
  const {
    users,
    tasks,
    addUser,
    renameUser,
    removeUser,
    toggleUserHeavyDay,
    statusOf,
  } = useApp();
  // Domownicy to sprawa całego mieszkania — dodaje administrator (decyzja 3b)
  const { isAdmin, members, me, myProfileId, linkProfile, setMemberProfile } =
    useHousehold();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  const selected = users.find((u) => u.id === selectedId);
  const memberTasks = selected
    ? tasks.filter((t) => {
        if (!effectiveAssignees(t).includes(selected.id)) return false;
        if (selected.heavyDay) return statusOf(t) === "must";
        return true;
      })
    : [];

  const accountsOf = (profileId: string) =>
    members.filter((m) => m.profileId === profileId);
  const knownProfileIds = new Set(users.map((u) => u.id));
  const unlinked = members.filter(
    (m) => !m.profileId || !knownProfileIds.has(m.profileId),
  );

  const handleAddMember = () => {
    if (!name.trim()) return;
    addUser(name);
    setDialogOpen(false);
    setName("");
  };

  const link = (account: HouseholdMember, profileId: string | null) => {
    const own = account.uid === me?.uid;
    const action = own
      ? linkProfile(profileId)
      : setMemberProfile(account.uid, profileId);
    void action.catch(fail("Nie udało się połączyć konta."));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Domownicy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Osoby w mieszkaniu — z kontem albo bez. Gdy ktoś się zaloguje
            (Google, link e-mail) albo dołączy tabletem, połącz jego konto z
            właściwą osobą.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="shrink-0">
                <UserPlus className="size-4" />
                Dodaj domownika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj domownika</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="member-name">Imię</Label>
                  <Input
                    id="member-name"
                    placeholder="np. Ania"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Konto nie jest potrzebne — obowiązki przypiszesz po imieniu.
                  Konto połączysz później.
                </p>
                <Button
                  className="w-full"
                  onClick={handleAddMember}
                  disabled={!name.trim()}
                >
                  Dodaj
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Nikogo tu jeszcze nie ma</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dodaj domowników, żeby przypisywać im obowiązki.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {users.map((user) => (
            <MemberCard
              key={user.id}
              user={user}
              accounts={accountsOf(user.id)}
              isMe={user.id === myProfileId}
              taskCount={
                tasks.filter((t) => effectiveAssignees(t).includes(user.id))
                  .length
              }
              selected={selectedId === user.id}
              onSelect={() =>
                setSelectedId((id) => (id === user.id ? null : user.id))
              }
            />
          ))}
        </section>
      )}

      {selected && (
        <section className="space-y-4">
          <ProfilePanel
            user={selected}
            accounts={accountsOf(selected.id)}
            unlinked={unlinked}
            myUid={me?.uid ?? null}
            myProfileId={myProfileId}
            isAdmin={isAdmin}
            onLink={(account) => link(account, selected.id)}
            onUnlink={(account) => link(account, null)}
            onThisIsMe={() =>
              void linkProfile(selected.id).catch(
                fail("Nie udało się połączyć."),
              )
            }
            onRename={(next) => renameUser(selected.id, next)}
            onRemove={() => {
              for (const account of accountsOf(selected.id)) {
                link(account, null);
              }
              removeUser(selected.id);
              setSelectedId(null);
            }}
          />
          <HeavyDayToggle
            user={selected}
            onToggle={() => toggleUserHeavyDay(selected.id)}
          />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Obowiązki · {selected.name} · {memberTasks.length}
          </h2>
          {memberTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {selected.name} nie ma teraz przypisanych obowiązków.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {memberTasks.map((task) => (
                <ChoreCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
      )}

      {unlinked.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">
              Konta bez przypisanego domownika
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Ktoś dołączył, ale aplikacja nie wie, kim jest — wybierz osobę."
                : "Administrator połączy te konta z domownikami."}
            </p>
          </div>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {unlinked.map((account) => {
              const own = account.uid === me?.uid;
              return (
                <li
                  key={account.uid}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <AccountChip member={account} own={own} />
                  {(isAdmin || own) && users.length > 0 && (
                    <Select onValueChange={(value) => link(account, value)}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue
                          placeholder={own ? "To ja…" : "To jest…"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProfilePanel({
  user,
  accounts,
  unlinked,
  myUid,
  myProfileId,
  isAdmin,
  onLink,
  onUnlink,
  onThisIsMe,
  onRename,
  onRemove,
}: {
  user: User;
  accounts: HouseholdMember[];
  unlinked: HouseholdMember[];
  myUid: string | null;
  myProfileId: string | null;
  isAdmin: boolean;
  onLink: (account: HouseholdMember) => void;
  onUnlink: (account: HouseholdMember) => void;
  onThisIsMe: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user.name);
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-9 w-48"
              aria-label="Imię domownika"
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  onRename(draft);
                  setEditing(false);
                }
              }}
            />
            <Button
              size="sm"
              disabled={!draft.trim()}
              onClick={() => {
                onRename(draft);
                setEditing(false);
              }}
            >
              Zapisz
            </Button>
          </div>
        ) : (
          <h2 className="text-lg font-semibold">{user.name}</h2>
        )}
        {isAdmin && !editing && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(user.name);
                setEditing(true);
              }}
            >
              <Pencil className="size-3.5" />
              Zmień imię
            </Button>
            {confirmRemove ? (
              <Button size="sm" variant="destructive" onClick={onRemove}>
                Na pewno usunąć?
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="size-3.5" />
                Usuń
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Konta tej osoby
        </p>
        <div className="flex flex-wrap gap-1.5">
          {accounts.length === 0 && (
            <span className="text-sm text-muted-foreground">
              Bez konta — obowiązki i tak można przypisywać.
            </span>
          )}
          {accounts.map((account) => (
            <AccountChip
              key={account.uid}
              member={account}
              own={account.uid === myUid}
              onUnlink={
                isAdmin || account.uid === myUid
                  ? () => onUnlink(account)
                  : undefined
              }
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && unlinked.length > 0 && (
            <Select
              onValueChange={(uid) => {
                const account = unlinked.find((m) => m.uid === uid);
                if (account) onLink(account);
              }}
            >
              <SelectTrigger className="h-9 w-[220px]">
                <Link2 className="size-3.5" />
                <SelectValue placeholder="Połącz konto…" />
              </SelectTrigger>
              <SelectContent>
                {unlinked.map((account) => (
                  <SelectItem key={account.uid} value={account.uid}>
                    {accountLabel(account).detail ?? accountLabel(account).text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {myUid && myProfileId !== user.id && !isAdmin && (
            <Button size="sm" variant="outline" onClick={onThisIsMe}>
              To ja
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberCard({
  user,
  accounts,
  isMe,
  taskCount,
  selected,
  onSelect,
}: {
  user: User;
  accounts: HouseholdMember[];
  isMe: boolean;
  taskCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border bg-gradient-to-br from-surface-elevated via-surface to-card p-6 shadow-elevated transition-transform hover:-translate-y-0.5",
        selected
          ? "border-primary/40 text-primary ring-2 ring-primary/20"
          : "border-border text-foreground hover:border-primary/20",
        user.active === false && "opacity-60",
      )}
    >
      <div
        className="grid size-16 place-items-center rounded-full bg-background/40 text-2xl font-semibold"
        style={{ color: `var(--${user.color})` }}
      >
        {user.avatar}
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold tracking-tight">
          {user.name}
          {isMe && <span className="ml-1 text-xs text-primary">(Ty)</span>}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {user.heavyDay ? (
            <span className="text-warn">Heavy Day</span>
          ) : user.active !== false ? (
            `${taskCount} ${taskCount === 1 ? "obowiązek" : "obowiązków"}`
          ) : (
            "Nieobecny"
          )}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {accounts.length === 0
            ? "bez konta"
            : accounts
                .map((a) => accountLabel(a).text)
                .filter((t, i, all) => all.indexOf(t) === i)
                .join(" · ")}
        </div>
      </div>
    </button>
  );
}

function HeavyDayToggle({
  user,
  onToggle,
}: {
  user: User;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-colors",
        user.heavyDay && "border-warn/40 bg-warn/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-warn/15 text-warn">
          <Flame className="size-5" />
        </div>
        <div>
          <div className="font-semibold">Heavy Day — {user.name}</div>
          <div className="text-xs text-muted-foreground">
            {user.heavyDay
              ? "Tylko pilne obowiązki tej osoby"
              : "Odłóż mniej ważne zadania tej osoby na jutro"}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "h-6 w-10 shrink-0 rounded-full bg-muted p-0.5 transition-colors",
          user.heavyDay && "bg-warn",
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full bg-background transition-transform",
            user.heavyDay && "translate-x-4",
          )}
        />
      </div>
    </button>
  );
}
