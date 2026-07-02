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
