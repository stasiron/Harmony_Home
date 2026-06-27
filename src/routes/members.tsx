import { createFileRoute } from "@tanstack/react-router";
import { Flame, UserPlus } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
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
import { cn } from "@/lib/utils";
import type { User } from "@/types";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members · Homebase" },
      {
        name: "description",
        content: "Household members and their assigned chores.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <MembersPage />
    </Shell>
  ),
});

function MembersPage() {
  const { users, tasks, addUser, toggleUserHeavyDay, statusOf } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  const selected = users.find((u) => u.id === selectedId);
  const memberTasks = selected
    ? tasks.filter((t) => {
        if (t.assignedTo !== selected.id) return false;
        if (selected.heavyDay) return statusOf(t) === "must";
        return true;
      })
    : [];

  const handleAddMember = () => {
    if (!name.trim()) return;
    addUser(name);
    setDialogOpen(false);
    setName("");
  };

  return (
    <div className="space-y-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Household members
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a person to see chores assigned to them.
          </p>
        </div>
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
      </header>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No members yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add household members to assign and track chores.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {users.map((user) => (
              <MemberCard
                key={user.id}
                user={user}
                taskCount={tasks.filter((t) => t.assignedTo === user.id).length}
                selected={selectedId === user.id}
                onSelect={() =>
                  setSelectedId((id) => (id === user.id ? null : user.id))
                }
              />
            ))}
          </section>

          {selected && (
            <section className="space-y-4">
              <HeavyDayToggle
                user={selected}
                onToggle={() => toggleUserHeavyDay(selected.id)}
              />
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {selected.name}&apos;s chores · {memberTasks.length}
              </h2>
              {memberTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No chores assigned to {selected.name}.
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
        </>
      )}
    </div>
  );
}

function MemberCard({
  user,
  taskCount,
  selected,
  onSelect,
}: {
  user: User;
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
        !user.active && "opacity-60",
      )}
    >
      <div
        className="grid size-16 place-items-center rounded-full bg-background/40 text-2xl font-semibold"
        style={{ color: `var(--${user.color})` }}
      >
        {user.avatar}
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold tracking-tight">{user.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {user.heavyDay ? (
            <span className="text-warn">Heavy Day</span>
          ) : user.active ? (
            `${taskCount} chore${taskCount === 1 ? "" : "s"}`
          ) : (
            "Away"
          )}
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
