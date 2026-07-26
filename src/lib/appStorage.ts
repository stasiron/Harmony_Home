import { DEFAULT_MEMBERS } from "@/config/household";
import type { GuestPlan, ShoppingItem, TodoItem, User } from "@/types";

const STORAGE_KEY = "homeharmony-app";

type AppStorage = {
  users: User[];
  shopping: ShoppingItem[];
  guestPlans: GuestPlan[];
  todos: TodoItem[];
};

function emptyStorage(): AppStorage {
  return { users: [], shopping: [], guestPlans: [], todos: [] };
}

function normalizeTodo(raw: unknown): TodoItem | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<TodoItem>;
  if (typeof t.id !== "string" || typeof t.text !== "string") return null;
  const scope = t.scope === "household" ? "household" : "personal";
  const householdMode =
    scope === "household"
      ? t.householdMode === "everyone"
        ? "everyone"
        : "anyone"
      : undefined;
  return {
    id: t.id,
    text: t.text,
    done: Boolean(t.done),
    createdAt:
      typeof t.createdAt === "string" ? t.createdAt : new Date().toISOString(),
    scope,
    assignedTo:
      scope === "personal" && typeof t.assignedTo === "string"
        ? t.assignedTo
        : null,
    ...(householdMode ? { householdMode } : {}),
    completedBy: Array.isArray(t.completedBy)
      ? t.completedBy.filter((id): id is string => typeof id === "string")
      : [],
  };
}

export function readAppStorage(): AppStorage {
  if (typeof window === "undefined") return emptyStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as Partial<AppStorage>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
      guestPlans: Array.isArray(parsed.guestPlans) ? parsed.guestPlans : [],
      todos: Array.isArray(parsed.todos)
        ? parsed.todos
            .map(normalizeTodo)
            .filter((t): t is TodoItem => t !== null)
        : [],
    };
  } catch {
    return emptyStorage();
  }
}

export function loadInitialUsers(): User[] {
  const stored = readAppStorage().users;
  if (stored.length > 0) return stored;
  return [...DEFAULT_MEMBERS];
}

export function loadInitialShopping(): ShoppingItem[] {
  return readAppStorage().shopping;
}

export function loadInitialGuestPlans(): GuestPlan[] {
  return readAppStorage().guestPlans;
}

export function loadInitialTodos(): TodoItem[] {
  return readAppStorage().todos;
}

export function persistAppState(state: AppStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
