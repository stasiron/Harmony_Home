import type { Zadanie } from "@/types";

export function resolveLinkedZadania(
  linkedIds: string[] | undefined,
  zadania: Zadanie[],
): Zadanie[] {
  if (!linkedIds?.length) return [];
  const byId = new Map(zadania.map((z) => [z.id, z]));
  return linkedIds
    .map((id) => byId.get(id))
    .filter((z): z is Zadanie => z !== undefined);
}

export function zadaniaLinkedToChore(
  choreId: string,
  tasks: { id: string; linkedZadanieIds?: string[] }[],
): string[] {
  const chore = tasks.find((t) => t.id === choreId);
  return chore?.linkedZadanieIds ?? [];
}

/** Id zadań już podpiętych do innych obowiązków (nie do `exceptChoreId`). */
export function zadanieIdsAttachedElsewhere(
  tasks: { id: string; linkedZadanieIds?: string[] }[],
  exceptChoreId?: string,
): Set<string> {
  const attached = new Set<string>();
  for (const task of tasks) {
    if (exceptChoreId && task.id === exceptChoreId) continue;
    for (const id of task.linkedZadanieIds ?? []) attached.add(id);
  }
  return attached;
}
