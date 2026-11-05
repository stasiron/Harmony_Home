import type {
  TodoFolder,
  TodoHouseholdMode,
  TodoItem,
  TodoScope,
  User,
} from "@/types";

export type TodoAddInput = {
  text: string;
  scope: TodoScope;
  householdMode?: TodoHouseholdMode;
  /** Tylko personal — id domownika */
  assignedTo?: string | null;
  folderId?: string | null;
  /** "private" = tylko autor (zapis w prywatnej ścieżce) */
  visibility?: "public" | "private";
};

export function activeMembers(users: User[]): User[] {
  return users.filter((u) => u.active !== false);
}

export function isTodoOpen(todo: TodoItem, users: User[]): boolean {
  if (todo.scope !== "household" || todo.householdMode !== "everyone") {
    return !todo.done;
  }
  const needed = activeMembers(users).map((u) => u.id);
  // Brak aktywnych domowników → nie traktuj jako zrobione
  if (needed.length === 0) return !todo.done;
  const doneSet = new Set(todo.completedBy ?? []);
  return needed.some((id) => !doneSet.has(id));
}

export function todoDoneForMember(todo: TodoItem, memberId: string): boolean {
  if (todo.scope === "household" && todo.householdMode === "everyone") {
    return (todo.completedBy ?? []).includes(memberId);
  }
  return todo.done;
}

export function applyTodoToggle(
  todo: TodoItem,
  users: User[],
  memberId: string | null,
): TodoItem {
  if (todo.scope !== "household") {
    return { ...todo, done: !todo.done, completedBy: [] };
  }

  const mode = todo.householdMode ?? "anyone";

  if (mode === "anyone") {
    if (todo.done) {
      return { ...todo, done: false, completedBy: [] };
    }
    return {
      ...todo,
      done: true,
      completedBy: memberId ? [memberId] : [],
    };
  }

  // everyone — wymaga memberId
  if (!memberId) return todo;

  const prev = new Set(todo.completedBy ?? []);
  if (prev.has(memberId)) prev.delete(memberId);
  else prev.add(memberId);

  const completedBy = [...prev];
  const needed = activeMembers(users).map((u) => u.id);
  const done =
    needed.length > 0 && needed.every((id) => completedBy.includes(id));

  return { ...todo, completedBy, done };
}

export function buildTodoItem(input: TodoAddInput): TodoItem | null {
  const trimmed = input.text.trim();
  if (!trimmed) return null;

  const scope = input.scope;
  const householdMode =
    scope === "household" ? (input.householdMode ?? "anyone") : undefined;
  const assignedTo = scope === "personal" ? (input.assignedTo ?? null) : null;

  return {
    id: crypto.randomUUID(),
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
    scope,
    folderId: input.folderId ?? null,
    assignedTo,
    ...(householdMode ? { householdMode } : {}),
    ...(input.visibility === "private" && scope === "personal"
      ? { visibility: "private" as const }
      : {}),
    completedBy: [],
  };
}

export function buildTodoFolder(name: string): TodoFolder | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
}

export function todoInFolder(todo: TodoItem, folderId: string | null): boolean {
  const id = todo.folderId ?? null;
  return id === folderId;
}

export type TodoExportPayload = {
  exportedAt: string;
  folders: TodoFolder[];
  todos: TodoItem[];
};

export function buildTodoExport(
  folders: TodoFolder[],
  todos: TodoItem[],
): TodoExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    folders,
    todos,
  };
}

export function downloadTodoJson(payload: TodoExportPayload): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const stamp = payload.exportedAt.slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homeharmony-todos-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
