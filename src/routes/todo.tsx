import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  Download,
  FolderPlus,
  Home,
  Lock,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { ItemLockButton } from "@/components/household/ItemLock";
import { PrivateBadge } from "@/components/VisibilityPicker";
import {
  activeMembers,
  buildTodoExport,
  downloadTodoJson,
  isTodoOpen,
  todoInFolder,
} from "@/lib/todoHelpers";
import { cn } from "@/lib/utils";
import type {
  TodoFolder,
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
    todoFolders,
    users,
    addTodo,
    toggleTodo,
    setTodoAssignee,
    setTodoFolder,
    removeTodo,
    clearDoneTodos,
    addTodoFolder,
    renameTodoFolder,
    removeTodoFolder,
  } = useApp();
  const { seeAsMemberId } = useAuth();
  const { myProfileId } = useHousehold();
  const actorId = seeAsMemberId ?? myProfileId;

  const [draft, setDraft] = useState("");
  // Domyślnie wspólne — „do szuflady” tylko świadomie (prywatne)
  const [kind, setKind] = useState<"household" | "person" | "private">(
    "household",
  );
  const scope: TodoScope = kind === "household" ? "household" : "personal";
  const [showOthers, setShowOthers] = useState(false);
  const { hasAccount } = useHousehold();
  const [householdMode, setHouseholdMode] =
    useState<TodoHouseholdMode>("anyone");
  const [assigneeId, setAssigneeId] = useState<string | null>(actorId);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);

  const members = useMemo(() => activeMembers(users), [users]);

  useEffect(() => {
    if (assigneeId && members.some((m) => m.id === assigneeId)) return;
    setAssigneeId(
      actorId && members.some((m) => m.id === actorId) ? actorId : null,
    );
  }, [actorId, assigneeId, members]);

  useEffect(() => {
    if (activeFolderId === null) return;
    if (!todoFolders.some((f) => f.id === activeFolderId)) {
      setActiveFolderId(null);
    }
  }, [activeFolderId, todoFolders]);

  const folderTodos = useMemo(
    () => todos.filter((t) => todoInFolder(t, activeFolderId)),
    [todos, activeFolderId],
  );

  // Sprawy osób: moje / prywatne / innych (innych nie podsuwamy, ale można
  // podejrzeć, co ktoś ma do zrobienia)
  const isPrivateTodo = (t: TodoItem) => t.visibility === "private";
  const isMineTodo = (t: TodoItem) =>
    !t.assignedTo || (actorId !== null && t.assignedTo === actorId);
  const personalTodos = useMemo(
    () => folderTodos.filter((t) => t.scope !== "household"),
    [folderTodos],
  );
  const privateTodos = personalTodos.filter(isPrivateTodo);
  const mineTodos = personalTodos.filter(
    (t) => !isPrivateTodo(t) && isMineTodo(t),
  );
  const othersTodos = personalTodos.filter(
    (t) => !isPrivateTodo(t) && !isMineTodo(t),
  );
  const personalOpen = mineTodos.filter((t) => isTodoOpen(t, users));
  const personalDone = mineTodos.filter((t) => !isTodoOpen(t, users));
  const privateOpen = privateTodos.filter((t) => isTodoOpen(t, users));
  const privateDone = privateTodos.filter((t) => !isTodoOpen(t, users));
  const othersOpen = othersTodos.filter((t) => isTodoOpen(t, users));
  const houseOpen = useMemo(
    () =>
      folderTodos.filter(
        (t) => t.scope === "household" && isTodoOpen(t, users),
      ),
    [folderTodos, users],
  );
  const houseDone = useMemo(
    () =>
      folderTodos.filter(
        (t) => t.scope === "household" && !isTodoOpen(t, users),
      ),
    [folderTodos, users],
  );

  const doneCount = personalDone.length + houseDone.length + privateDone.length;

  const inboxCount = useMemo(
    () => todos.filter((t) => todoInFolder(t, null)).length,
    [todos],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    addTodo({
      text: draft,
      scope,
      householdMode: scope === "household" ? householdMode : undefined,
      assignedTo:
        kind === "private" ? actorId : kind === "person" ? assigneeId : null,
      folderId: activeFolderId,
      visibility: kind === "private" ? "private" : "public",
    });
    setDraft("");
  };

  const onCreateFolder = (e: FormEvent) => {
    e.preventDefault();
    const id = addTodoFolder(newFolderName);
    if (!id) return;
    setNewFolderName("");
    setAddingFolder(false);
    setActiveFolderId(id);
  };

  const onExport = () => {
    downloadTodoJson(buildTodoExport(todoFolders, todos));
  };

  const activeFolder = todoFolders.find((f) => f.id === activeFolderId);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            TODO
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Foldery do grupowania spraw. Eksport = ten sam JSON co w syncu.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={todos.length === 0 && todoFolders.length === 0}
          className="h-10 shrink-0 rounded-2xl"
        >
          <Download className="size-4" />
          Eksportuj JSON
        </Button>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <FolderTab
            active={activeFolderId === null}
            onClick={() => setActiveFolderId(null)}
            label="Bez folderu"
            count={inboxCount}
          />
          {todoFolders.map((folder) => (
            <FolderTab
              key={folder.id}
              active={activeFolderId === folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              label={folder.name}
              count={todos.filter((t) => todoInFolder(t, folder.id)).length}
            />
          ))}
          {!addingFolder ? (
            <button
              type="button"
              onClick={() => setAddingFolder(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <FolderPlus className="size-3.5" />
              Nowy folder
            </button>
          ) : null}
        </div>

        {addingFolder ? (
          <form onSubmit={onCreateFolder} className="flex max-w-md gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nazwa folderu…"
              className="h-10 rounded-2xl border-border bg-surface px-3"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!newFolderName.trim()}
              className="h-10 rounded-2xl"
            >
              Utwórz
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-2xl"
              onClick={() => {
                setAddingFolder(false);
                setNewFolderName("");
              }}
            >
              Anuluj
            </Button>
          </form>
        ) : null}

        {activeFolder ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Folder:</span>
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => {
                const next = window.prompt(
                  "Nowa nazwa folderu",
                  activeFolder.name,
                );
                if (next == null) return;
                renameTodoFolder(activeFolder.id, next);
              }}
            >
              {activeFolder.name}
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    `Usunąć folder „${activeFolder.name}”? Sprawy wrócą do „Bez folderu”.`,
                  )
                ) {
                  return;
                }
                removeTodoFolder(activeFolder.id);
                setActiveFolderId(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-alert"
            >
              <Trash2 className="size-3.5" />
              Usuń folder
            </button>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <ScopeChip
            active={kind === "household"}
            onClick={() => setKind("household")}
            icon={<Home className="size-3.5" />}
            label="Dla domu"
          />
          <ScopeChip
            active={kind === "person"}
            onClick={() => setKind("person")}
            icon={<User className="size-3.5" />}
            label="Dla osoby"
          />
          <ScopeChip
            active={kind === "private"}
            onClick={() => hasAccount && setKind("private")}
            icon={<Lock className="size-3.5" />}
            label={hasAccount ? "Prywatne" : "Prywatne (wymaga konta)"}
            tone="private"
            disabled={!hasAccount}
          />
        </div>

        {kind === "private" ? (
          <p className="rounded-2xl border border-warn/40 bg-warn/10 px-4 py-2 text-sm text-warn">
            <Lock className="mr-1 inline size-3.5" />
            Tylko Ty to zobaczysz — nikt inny, nawet administrator. Sprawy dla
            domu albo dla kogoś zapisuj jako „Dla domu” / „Dla osoby”.
          </p>
        ) : kind === "person" ? (
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
              kind === "household"
                ? householdMode === "everyone"
                  ? "Np. przeczytać regulamin, odebrać klucz…"
                  : "Np. wynieść kartony, kupić żarówkę…"
                : kind === "private"
                  ? "Np. prezent dla kogoś, prywatna sprawa…"
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

      {folderTodos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Pusto</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeFolder
              ? `Brak spraw w folderze „${activeFolder.name}”.`
              : "Dodaj sprawę osobistą albo dla całego domu."}
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
            folders={todoFolders}
            actorId={actorId}
            onToggle={toggleTodo}
            onAssign={setTodoAssignee}
            onMoveFolder={setTodoFolder}
            onRemove={removeTodo}
          />

          <TodoSection
            title="Moje"
            emptyHint="Nic nie czeka na Ciebie."
            open={personalOpen}
            done={personalDone}
            members={members}
            folders={todoFolders}
            actorId={actorId}
            onToggle={toggleTodo}
            onAssign={setTodoAssignee}
            onMoveFolder={setTodoFolder}
            onRemove={removeTodo}
          />

          {privateTodos.length > 0 && (
            <TodoSection
              title="Prywatne — tylko Ty"
              emptyHint=""
              open={privateOpen}
              done={privateDone}
              members={members}
              folders={todoFolders}
              actorId={actorId}
              onToggle={toggleTodo}
              onAssign={setTodoAssignee}
              onMoveFolder={setTodoFolder}
              onRemove={removeTodo}
            />
          )}

          {othersOpen.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowOthers(!showOthers)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    showOthers && "rotate-180",
                  )}
                />
                {showOthers ? "Ukryj" : "Podejrzyj"} sprawy innych (
                {othersOpen.length})
              </button>
              {showOthers &&
                members
                  .filter((m) => othersOpen.some((t) => t.assignedTo === m.id))
                  .map((m) => (
                    <TodoSection
                      key={m.id}
                      title={`Do zrobienia: ${m.name}`}
                      emptyHint=""
                      open={othersOpen.filter((t) => t.assignedTo === m.id)}
                      done={[]}
                      members={members}
                      folders={todoFolders}
                      actorId={actorId}
                      onToggle={toggleTodo}
                      onAssign={setTodoAssignee}
                      onMoveFolder={setTodoFolder}
                      onRemove={removeTodo}
                    />
                  ))}
            </div>
          )}

          {doneCount > 0 ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => clearDoneTodos(activeFolderId)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Wyczyść zrobione w tej zakładce ({doneCount})
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FolderTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
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
      <span className="truncate max-w-[10rem]">{label}</span>
      <span
        className={cn(
          "rounded-lg px-1.5 py-0.5 text-[10px] tabular-nums",
          active ? "bg-primary/15" : "bg-background/70",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ScopeChip({
  active,
  onClick,
  icon,
  label,
  tone = "default",
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  tone?: "default" | "private";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? tone === "private"
            ? "border-warn/60 bg-warn/15 text-warn"
            : "border-primary/40 bg-primary/10 text-primary"
          : tone === "private"
            ? "border-dashed border-border bg-surface text-muted-foreground hover:text-foreground"
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
  folders,
  actorId,
  onToggle,
  onAssign,
  onMoveFolder,
  onRemove,
}: {
  title: string;
  emptyHint: string;
  open: TodoItem[];
  done: TodoItem[];
  members: HouseholdUser[];
  folders: TodoFolder[];
  actorId: string | null;
  onToggle: (id: string, memberId?: string | null) => void;
  onAssign: (id: string, memberId: string | null) => void;
  onMoveFolder: (id: string, folderId: string | null) => void;
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
          folders={folders}
          actorId={actorId}
          onToggle={onToggle}
          onAssign={onAssign}
          onMoveFolder={onMoveFolder}
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
            folders={folders}
            actorId={actorId}
            onToggle={onToggle}
            onAssign={onAssign}
            onMoveFolder={onMoveFolder}
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
  folders,
  actorId,
  onToggle,
  onAssign,
  onMoveFolder,
  onRemove,
  muted,
}: {
  items: TodoItem[];
  members: HouseholdUser[];
  folders: TodoFolder[];
  actorId: string | null;
  onToggle: (id: string, memberId?: string | null) => void;
  onAssign: (id: string, memberId: string | null) => void;
  onMoveFolder: (id: string, folderId: string | null) => void;
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
          folders={folders}
          actorId={actorId}
          onToggle={onToggle}
          onAssign={onAssign}
          onMoveFolder={onMoveFolder}
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
  folders,
  actorId,
  onToggle,
  onAssign,
  onMoveFolder,
  onRemove,
  bordered,
}: {
  item: TodoItem;
  members: HouseholdUser[];
  folders: TodoFolder[];
  actorId: string | null;
  onToggle: (id: string, memberId?: string | null) => void;
  onAssign: (id: string, memberId: string | null) => void;
  onMoveFolder: (id: string, folderId: string | null) => void;
  onRemove: (id: string) => void;
  bordered: boolean;
}) {
  const { canEditItem } = useHousehold();
  const { setTodoVisibility } = useApp();
  // Zablokowane: odhaczać może każdy, zmieniać tylko twórca i admin
  const editable = canEditItem(item);
  const isPrivate = item.visibility === "private";
  const isEveryone =
    item.scope === "household" && item.householdMode === "everyone";
  const isAnyone =
    item.scope === "household" && item.householdMode !== "everyone";
  const isPersonal = item.scope !== "household";
  const completedBy = item.completedBy ?? [];
  const assignee = members.find((m) => m.id === item.assignedTo);
  const open = isTodoOpen(item, members);
  const actorDone =
    isEveryone && actorId ? completedBy.includes(actorId) : !open;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center",
        bordered && "border-t border-border",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {isEveryone && actorId ? (
          <Checkbox
            className="mt-0.5"
            checked={actorDone}
            onCheckedChange={() => onToggle(item.id, actorId)}
            aria-label={
              actorDone ? "Cofnij swoje odhaczenie" : "Oznacz że zrobiłeś/aś"
            }
          />
        ) : !isEveryone ? (
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
              !open && "text-muted-foreground line-through",
            )}
          >
            {item.text}
            {isPrivate && <PrivateBadge className="ml-2 align-middle" />}
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
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {isPrivate
                ? "Widzisz tylko Ty"
                : assignee
                  ? `Dla: ${assignee.name} · widoczne dla domu`
                  : "Bez przypisania · widoczne dla domu"}
              {isPrivate && (
                <button
                  type="button"
                  onClick={() => setTodoVisibility(item.id, "public")}
                  className="font-medium text-primary hover:underline"
                >
                  Pokaż domownikom
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {editable && folders.length > 0 ? (
        <label className="sr-only" htmlFor={`folder-${item.id}`}>
          Folder
        </label>
      ) : null}
      {editable && folders.length > 0 ? (
        <select
          id={`folder-${item.id}`}
          value={item.folderId ?? ""}
          onChange={(e) =>
            onMoveFolder(item.id, e.target.value ? e.target.value : null)
          }
          className="h-9 max-w-[10rem] shrink-0 rounded-xl border border-border bg-background/60 px-2 text-xs text-foreground"
          title="Przenieś do folderu"
        >
          <option value="">Bez folderu</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      ) : null}

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

      {isPersonal && editable ? (
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

      <ItemLockButton kind="todos" item={item} />
      {editable && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="grid size-8 shrink-0 place-items-center self-end rounded-lg text-muted-foreground transition-colors hover:bg-alert/10 hover:text-alert sm:self-center"
          aria-label="Usuń"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
