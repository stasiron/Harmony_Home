import type { TodoHouseholdMode, TodoItem, TodoScope, User } from "@/types";

export type TodoAddInput = {
  text: string;
  scope: TodoScope;
  householdMode?: TodoHouseholdMode;
  /** Tylko personal — id domownika */
  assignedTo?: string | null;
};

export function activeMembers(users: User[]): User[] {
  return users.filter((u) => u.active);
}

export function isTodoOpen(todo: TodoItem, users: User[]): boolean {
  if (todo.scope !== "household" || todo.householdMode !== "everyone") {
    return !todo.done;
  }
  const needed = activeMembers(users).map((u) => u.id);
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
  const assignedTo =
    scope === "personal" ? (input.assignedTo ?? null) : null;

  return {
    id: crypto.randomUUID(),
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
    scope,
    assignedTo,
    ...(householdMode ? { householdMode } : {}),
    completedBy: [],
  };
}
