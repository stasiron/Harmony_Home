import { DEFAULT_MEMBERS } from "@/config/household";
import type {
  GuestPlan,
  LaundryProgram,
  ShoppingItem,
  TodoFolder,
  TodoItem,
  User,
} from "@/types";

const STORAGE_KEY = "homeharmony-app";

type AppStorage = {
  users: User[];
  shopping: ShoppingItem[];
  guestPlans: GuestPlan[];
  todos: TodoItem[];
  todoFolders: TodoFolder[];
  laundryPrograms: LaundryProgram[];
};

function emptyStorage(): AppStorage {
  return {
    users: [],
    shopping: [],
    guestPlans: [],
    todos: [],
    todoFolders: [],
    laundryPrograms: [],
  };
}

export function normalizeTodoFolder(raw: unknown): TodoFolder | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<TodoFolder>;
  if (typeof f.id !== "string" || typeof f.name !== "string") return null;
  const name = f.name.trim();
  if (!name) return null;
  return {
    id: f.id,
    name,
    createdAt:
      typeof f.createdAt === "string" ? f.createdAt : new Date().toISOString(),
  };
}

export function normalizeTodo(raw: unknown): TodoItem | null {
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
    folderId: typeof t.folderId === "string" ? t.folderId : null,
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

export function normalizeLaundryProgram(raw: unknown): LaundryProgram | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<LaundryProgram>;
  if (typeof p.id !== "string" || typeof p.name !== "string") return null;
  if (typeof p.mode !== "string") return null;
  const name = p.name.trim();
  const mode = p.mode.trim();
  if (!name || !mode) return null;
  const temperature = Number(p.temperature);
  const rinses = Number(p.rinses);
  const spin = Number(p.spin);
  if (
    !Number.isFinite(temperature) ||
    !Number.isFinite(rinses) ||
    !Number.isFinite(spin)
  ) {
    return null;
  }
  if (temperature < 0 || rinses < 0 || spin < 0) return null;
  return {
    id: p.id,
    name,
    mode,
    temperature: Math.round(temperature),
    rinses: Math.round(rinses),
    spin: Math.round(spin),
    createdAt:
      typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
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
      todoFolders: Array.isArray(parsed.todoFolders)
        ? parsed.todoFolders
            .map(normalizeTodoFolder)
            .filter((f): f is TodoFolder => f !== null)
        : [],
      laundryPrograms: Array.isArray(parsed.laundryPrograms)
        ? parsed.laundryPrograms
            .map(normalizeLaundryProgram)
            .filter((p): p is LaundryProgram => p !== null)
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

export function loadInitialTodoFolders(): TodoFolder[] {
  return readAppStorage().todoFolders;
}

export function loadInitialLaundryPrograms(): LaundryProgram[] {
  return readAppStorage().laundryPrograms;
}

export function persistAppState(state: AppStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
