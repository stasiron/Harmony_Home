import type { ItemMeta, LaundryProgram, TodoFolder, TodoItem } from "@/types";

/** Pola ItemMeta z surowego dokumentu — normalizery budują obiekt od zera */
export function pickItemMeta(raw: object): ItemMeta {
  const meta = raw as ItemMeta;
  return {
    ...(typeof meta.createdBy === "string"
      ? { createdBy: meta.createdBy }
      : {}),
    ...(meta.locked === true ? { locked: true } : {}),
  };
}

export function normalizeTodoFolder(raw: unknown): TodoFolder | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<TodoFolder>;
  if (typeof f.id !== "string" || typeof f.name !== "string") return null;
  const name = f.name.trim();
  if (!name) return null;
  return {
    ...pickItemMeta(f),
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
    ...pickItemMeta(t),
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
    ...pickItemMeta(p),
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
