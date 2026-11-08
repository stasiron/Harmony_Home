import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  Download,
  Eye,
  FolderInput,
  FolderPlus,
  Home,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  User,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
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

  const renameFolder = () => {
    if (!activeFolder) return;
    const next = window.prompt("Nowa nazwa folderu", activeFolder.name);
    if (next == null) return;
    renameTodoFolder(activeFolder.id, next);
  };

  const deleteFolder = () => {
    if (!activeFolder) return;
    const question =
      "Usunąć folder „" +
      activeFolder.name +
      "”? Sprawy wrócą do „Bez folderu”.";
    if (!window.confirm(question)) return;
    removeTodoFolder(activeFolder.id);
    setActiveFolderId(null);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            TODO
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sprawy do zapamiętania — dla domu, dla kogoś albo tylko Twoje.
          </p>
        </div>
        {/* Rzadkie akcje w jednym menu zamiast osobnych przycisków */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl"
              aria-label="Więcej opcji"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setAddingFolder(true)}>
              <FolderPlus className="size-4" />
              Nowy folder
            </DropdownMenuItem>
            {activeFolder && (
              <>
                <DropdownMenuItem onClick={renameFolder}>
                  <Pencil className="size-4" />
                  Zmień nazwę folderu
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={deleteFolder}
                  className="text-alert focus:text-alert"
                >
                  <Trash2 className="size-4" />
                  Usuń folder
                </DropdownMenuItem>
              </>
            )}
            {doneCount > 0 && (
              <DropdownMenuItem onClick={() => clearDoneTodos(activeFolderId)}>
                <Trash2 className="size-4" />
                Wyczyść zrobione ({doneCount})
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onExport}
              disabled={todos.length === 0 && todoFolders.length === 0}
            >
              <Download className="size-4" />
              Eksportuj JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-3">
        <div className="hh-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
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
          <button
            type="button"
            onClick={() => setAddingFolder(true)}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            aria-label="Nowy folder"
            title="Nowy folder"
          >
            <FolderPlus className="size-4" />
          </button>
        </div>

        {addingFolder ? (
          <form onSubmit={onCreateFolder} className="flex max-w-md gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nazwa folderu…"
              className="h-10 rounded-xl border-border bg-surface px-3"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!newFolderName.trim()}
              className="h-10 rounded-xl"
            >
              Utwórz
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl"
              onClick={() => {
                setAddingFolder(false);
                setNewFolderName("");
              }}
            >
              Anuluj
            </Button>
          </form>
        ) : null}
      </div>

      {/* Jeden pasek dodawania: treść + dla kogo + tryb/osoba */}
      <form
        onSubmit={onSubmit}
        className={cn(
          "rounded-2xl border bg-surface p-2 transition-colors",
          kind === "private" ? "border-warn/50" : "border-border",
        )}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
            className="h-11 flex-1 border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0"
            aria-label="Nowa sprawa"
          />
          <div className="flex items-center gap-2">
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as typeof kind)}
            >
              <SelectTrigger
                className="h-10 min-w-0 flex-1 rounded-xl md:w-auto md:min-w-[8.5rem] md:flex-none"
                aria-label="Dla kogo"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="household">
                  <span className="flex items-center gap-2">
                    <Home className="size-3.5" />
                    Dla domu
                  </span>
                </SelectItem>
                <SelectItem value="person">
                  <span className="flex items-center gap-2">
                    <User className="size-3.5" />
                    Dla osoby
                  </span>
                </SelectItem>
                <SelectItem value="private" disabled={!hasAccount}>
                  <span className="flex items-center gap-2">
                    <Lock className="size-3.5" />
                    {hasAccount ? "Prywatne" : "Prywatne (konto)"}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {kind === "household" && (
              <Select
                value={householdMode}
                onValueChange={(v) => setHouseholdMode(v as TodoHouseholdMode)}
              >
                <SelectTrigger
                  className="h-10 min-w-0 flex-1 rounded-xl md:w-auto md:min-w-[9.5rem] md:flex-none"
                  aria-label="Kto ma zrobić"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">Ktokolwiek raz</SelectItem>
                  <SelectItem value="everyone">Każdy po razie</SelectItem>
                </SelectContent>
              </Select>
            )}
            {kind === "person" && (
              <Select
                value={assigneeId ?? "none"}
                onValueChange={(v) => setAssigneeId(v === "none" ? null : v)}
              >
                <SelectTrigger
                  className="h-10 min-w-0 flex-1 rounded-xl md:w-auto md:min-w-[8rem] md:flex-none"
                  aria-label="Dla kogo dokładnie"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nikt</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="submit"
              disabled={!draft.trim()}
              className="h-10 shrink-0 rounded-xl px-4"
              aria-label="Dodaj"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Dodaj</span>
            </Button>
          </div>
        </div>
        {kind === "private" && (
          <p className="px-3 pb-1 pt-2 text-xs text-warn">
            <Lock className="mr-1 inline size-3" />
            Tylko Ty to zobaczysz — nikt inny, nawet administrator.
          </p>
        )}
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
  const { canEditItem, canLockItem } = useHousehold();
  const { setTodoVisibility, setItemLocked } = useApp();
  // Zablokowane: odhaczać może każdy, zmieniać tylko twórca i admin
  const editable = canEditItem(item);
  const canLock = canLockItem(item);
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

  const canAssign = isPersonal && editable && !isPrivate;
  const canMove = editable && folders.length > 0;
  const hasMenu = canAssign || canMove || isPrivate || canLock || editable;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 sm:px-4",
        bordered && "border-t border-border",
      )}
    >
      {isEveryone && actorId ? (
        <Checkbox
          className="size-5"
          checked={actorDone}
          onCheckedChange={() => onToggle(item.id, actorId)}
          aria-label={
            actorDone ? "Cofnij swoje odhaczenie" : "Oznacz że zrobiłeś/aś"
          }
        />
      ) : !isEveryone ? (
        <Checkbox
          className="size-5"
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
            "flex items-center gap-2 font-medium",
            !open && "text-muted-foreground line-through",
          )}
        >
          <span className="truncate">{item.text}</span>
          {isPrivate && <PrivateBadge />}
          {item.locked && (
            <Lock
              className="size-3 shrink-0 text-muted-foreground"
              aria-label="Zablokowane do edycji"
            />
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.scope === "household"
            ? isEveryone
              ? `Każdy po razie · ${completedBy.length}/${members.length}`
              : isAnyone
                ? "Ktokolwiek raz"
                : null
            : isPrivate
              ? "Widzisz tylko Ty"
              : assignee
                ? `Dla: ${assignee.name}`
                : "Bez przypisania"}
        </div>
      </div>

      {/* „Każdy po razie” — kto już zrobił; klik odhacza za tę osobę */}
      {isEveryone ? (
        <div className="flex shrink-0 -space-x-1">
          {members.map((m) => {
            const done = completedBy.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(item.id, m.id)}
                title={done ? `${m.name} — cofnij` : `${m.name} — zrobił(a)`}
                className={cn(
                  "grid size-7 place-items-center rounded-full border-2 border-surface text-[10px] font-semibold transition-colors",
                  done
                    ? "bg-safe/30 text-safe"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {m.avatar}
              </button>
            );
          })}
        </div>
      ) : null}

      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Opcje sprawy"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {canAssign && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserRound className="size-4" />
                  Przypisz do
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={item.assignedTo ?? "none"}
                    onValueChange={(v) =>
                      onAssign(item.id, v === "none" ? null : v)
                    }
                  >
                    <DropdownMenuRadioItem value="none">
                      Nikt
                    </DropdownMenuRadioItem>
                    {members.map((m) => (
                      <DropdownMenuRadioItem key={m.id} value={m.id}>
                        {m.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {canMove && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="size-4" />
                  Przenieś do folderu
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={item.folderId ?? "none"}
                    onValueChange={(v) =>
                      onMoveFolder(item.id, v === "none" ? null : v)
                    }
                  >
                    <DropdownMenuRadioItem value="none">
                      Bez folderu
                    </DropdownMenuRadioItem>
                    {folders.map((f) => (
                      <DropdownMenuRadioItem key={f.id} value={f.id}>
                        {f.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {isPrivate && (
              <DropdownMenuItem
                onClick={() => setTodoVisibility(item.id, "public")}
              >
                <Eye className="size-4" />
                Pokaż domownikom
              </DropdownMenuItem>
            )}
            {canLock && (
              <DropdownMenuItem
                onClick={() => setItemLocked("todos", item.id, !item.locked)}
              >
                {item.locked ? (
                  <LockOpen className="size-4" />
                ) : (
                  <Lock className="size-4" />
                )}
                {item.locked ? "Odblokuj edycję" : "Zablokuj edycję"}
              </DropdownMenuItem>
            )}
            {editable && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemove(item.id)}
                  className="text-alert focus:text-alert"
                >
                  <Trash2 className="size-4" />
                  Usuń
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
