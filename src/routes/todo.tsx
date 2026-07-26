import { createFileRoute } from "@tanstack/react-router";
import { Home, Plus, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { activeMembers, isTodoOpen } from "@/lib/todoHelpers";
import { cn } from "@/lib/utils";
import type {
  TodoHouseholdMode,
  TodoItem,
  TodoScope,
  User as HouseholdUser,
} from "@/types";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "TODO · Homebase" },
      {
        name: "description",
        content: "Proste sprawy do zapamiętania — nie obowiązki domowe.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <TodoPage />
    </Shell>
  ),
});

function TodoPage() {
  const {
    todos,
    users,
    addTodo,
    toggleTodo,
    setTodoAssignee,
    removeTodo,
    clearDoneTodos,
  } = useApp();
  const { memberId, seeAsMemberId } = useAuth();
  const actorId = seeAsMemberId ?? memberId;

  const [draft, setDraft] = useState("");
  const [scope, setScope] = useState<TodoScope>("personal");
  const [householdMode, setHouseholdMode] =
    useState<TodoHouseholdMode>("anyone");
  const [assigneeId, setAssigneeId] = useState<string | null>(actorId);

  const members = useMemo(() => activeMembers(users), [users]);

  useEffect(() => {
    if (assigneeId && members.some((m) => m.id === assigneeId)) return;
    setAssigneeId(actorId && members.some((m) => m.id === actorId) ? actorId : null);
  }, [actorId, assigneeId, members]);

  const personalOpen = useMemo(
    () => todos.filter((t) => t.scope !== "household" && isTodoOpen(t, users)),
    [todos, users],
  );
  const personalDone = useMemo(
    () => todos.filter((t) => t.scope !== "household" && !isTodoOpen(t, users)),
    [todos, users],
  );
  const houseOpen = useMemo(
    () => todos.filter((t) => t.scope === "household" && isTodoOpen(t, users)),
    [todos, users],
  );
  const houseDone = useMemo(
    () => todos.filter((t) => t.scope === "household" && !isTodoOpen(t, users)),
    [todos, users],
  );

  const doneCount = personalDone.length + houseDone.length;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addTodo({
      text: draft,
      scope,
      householdMode: scope === "household" ? householdMode : undefined,
      assignedTo: scope === "personal" ? assigneeId : null,
    });
    setDraft("");
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          TODO
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Osobiste (z właścicielem) albo sprawy domu — kto może, ten robi.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <ScopeChip
            active={scope === "personal"}
            onClick={() => setScope("personal")}
            icon={<User className="size-3.5" />}
            label="Osobiste"
          />
          <ScopeChip
            active={scope === "household"}
            onClick={() => setScope("household")}
            icon={<Home className="size-3.5" />}
            label="Dla domu"
          />
        </div>

        {scope === "personal" ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Dla kogo
            </div>
            <div className="flex flex-wrap gap-2">
              <AssigneeChip
                active={assigneeId === null}
                onClick={() => setAssigneeId(null)}
                label="Nikt"
                hint="Bez przypisania"
              />
              {members.map((m) => (
                <AssigneeChip
                  key={m.id}
                  active={assigneeId === m.id}
                  onClick={() => setAssigneeId(m.id)}
                  label={m.name}
                  avatar={m.avatar}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <ModeChip
              active={householdMode === "anyone"}
              onClick={() => setHouseholdMode("anyone")}
              label="Ktokolwiek raz"
              hint="Jeden wystarczy"
            />
            <ModeChip
              active={householdMode === "everyone"}
              onClick={() => setHouseholdMode("everyone")}
              label="Każdy po razie"
              hint="Wszyscy domownicy"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              scope === "household"
                ? householdMode === "everyone"
                  ? "Np. przeczytać regulamin, odebrać klucz…"
                  : "Np. wynieść kartony, kupić żarówkę…"
                : "Np. oddać książkę, zadzwonić do dentysty…"
            }
            className="h-12 rounded-2xl border-border bg-surface px-4 text-base"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!draft.trim()}
            className="h-12 shrink-0 rounded-2xl px-5"
          >
            <Plus className="size-4" />
            Dodaj
          </Button>
        </div>
      </form>

      {todos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Pusto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dodaj sprawę osobistą albo dla całego domu.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <TodoSection
            title="Dla domu"
            emptyHint="Brak spraw domowych."
            open={houseOpen}
            done={houseDone}
            members={members}
            actorId={actorId}
            onToggle={toggleTodo}
            onAssign={setTodoAssignee}
            onRemove={removeTodo}
          />

          <TodoSection
            title="Osobiste"
            emptyHint="Brak osobistych spraw."
            open={personalOpen}
            done={personalDone}
            members={members}
            actorId={actorId}
            onToggle={toggleTodo}
            onAssign={setTodoAssignee}
            onRemove={removeTodo}
          />

          {doneCount > 0 ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearDoneTodos}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Wyczyść wszystkie zrobione ({doneCount})
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ScopeChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ModeChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3.5 py-2 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-surface hover:border-primary/20",
      )}
    >
      <div
        className={cn(
          "text-sm font-medium",
          active ? "text-primary" : "text-foreground",
        )}
      >
        {label}
      </div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </button>
  );
}

function AssigneeChip({
  active,
  onClick,
  label,
  hint,
  avatar,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  avatar?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-surface hover:border-primary/20",
      )}
    >
      {avatar ? (
        <span
          className={cn(
            "grid size-7 place-items-center rounded-lg text-xs font-semibold",
            active
              ? "bg-primary/15 text-primary"
              : "bg-background/60 text-muted-foreground",
          )}
        >
          {avatar}
        </span>
      ) : null}
      <span>
        <span
          className={cn(
            "block text-sm font-medium",
            active ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </span>
        {hint ? (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </button>
  );
}

function TodoSection({
  title,
  emptyHint,
  open,
  done,
  members,
  actorId,
  onToggle,
  onAssign,
  onRemove,
}: {
  title: string;
  emptyHint: string;
  open: TodoItem[];
  done: TodoItem[];
  members: HouseholdUser[];
  actorId: string | null;
  onToggle: (id: string, memberId?: string | null) => void;
  onAssign: (id: string, memberId: string | null) => void;
  onRemove: (id: string) => void;
}) {
  if (open.length === 0 && done.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>

      {open.length > 0 ? (
        <TodoList
          items={open}
          members={members}
          actorId={actorId}
          onToggle={onToggle}
          onAssign={onAssign}
          onRemove={onRemove}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-6 text-center text-sm text-muted-foreground">
          Wszystko odhaczone.
        </div>
      )}

      {done.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Zrobione
          </h3>
          <TodoList
            items={done}
            members={members}
            actorId={actorId}
            onToggle={onToggle}
            onAssign={onAssign}
            onRemove={onRemove}
            muted
          />
        </div>
      ) : null}
    </div>
  );
}

function TodoList({
  items,
  members,
  actorId,
  onToggle,
  onAssign,
  onRemove,
  muted,
}: {
  items: TodoItem[];
  members: HouseholdUser[];
  actorId: string | null;
  onToggle: (id: string, memberId?: string | null) => void;
  onAssign: (id: string, memberId: string | null) => void;
  onRemove: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface",
        muted && "opacity-70",
      )}
    >
      {items.map((item, idx) => (
        <TodoRow
          key={item.id}
          item={item}
          members={members}
          actorId={actorId}
          onToggle={onToggle}
          onAssign={onAssign}
          onRemove={onRemove}
          bordered={idx > 0}
        />
      ))}
    </div>
  );
}

function TodoRow({
  item,
  members,
  actorId,
  onToggle,
  onAssign,
  onRemove,
  bordered,
}: {
  item: TodoItem;
  members: HouseholdUser[];
  actorId: string | null;
  onToggle: (id: string, memberId?: string | null) => void;
  onAssign: (id: string, memberId: string | null) => void;
  onRemove: (id: string) => void;
  bordered: boolean;
}) {
  const isEveryone =
    item.scope === "household" && item.householdMode === "everyone";
  const isAnyone =
    item.scope === "household" && item.householdMode !== "everyone";
  const isPersonal = item.scope !== "household";
  const completedBy = item.completedBy ?? [];
  const assignee = members.find((m) => m.id === item.assignedTo);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center",
        bordered && "border-t border-border",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {!isEveryone ? (
          <Checkbox
            className="mt-0.5"
            checked={item.done}
            onCheckedChange={() => onToggle(item.id, actorId)}
            aria-label={
              item.done ? "Oznacz jako niezrobione" : "Oznacz jako zrobione"
            }
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate font-medium",
              item.done && "text-muted-foreground line-through",
            )}
          >
            {item.text}
          </div>
          {item.scope === "household" ? (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {isEveryone
                ? `Każdy po razie · ${completedBy.length}/${members.length}`
                : isAnyone
                  ? "Ktokolwiek raz"
                  : null}
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {assignee ? `Dla: ${assignee.name}` : "Bez przypisania"}
            </div>
          )}
        </div>
      </div>

      {isEveryone ? (
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          {members.map((m) => {
            const done = completedBy.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(item.id, m.id)}
                title={done ? `${m.name} — cofnij` : `${m.name} — zrobił(a)`}
                className={cn(
                  "grid size-9 place-items-center rounded-xl border text-xs font-semibold transition-colors",
                  done
                    ? "border-safe/40 bg-safe/15 text-safe"
                    : "border-border bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {m.avatar}
              </button>
            );
          })}
        </div>
      ) : null}

      {isPersonal ? (
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          <button
            type="button"
            onClick={() => onAssign(item.id, null)}
            title="Bez przypisania"
            className={cn(
              "grid size-9 place-items-center rounded-xl border text-[10px] font-semibold transition-colors",
              !item.assignedTo
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            —
          </button>
          {members.map((m) => {
            const selected = item.assignedTo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onAssign(item.id, m.id)}
                title={`Przypisz: ${m.name}`}
                className={cn(
                  "grid size-9 place-items-center rounded-xl border text-xs font-semibold transition-colors",
                  selected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {m.avatar}
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="grid size-8 shrink-0 place-items-center self-end rounded-lg text-muted-foreground transition-colors hover:bg-alert/10 hover:text-alert sm:self-center"
        aria-label="Usuń"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
