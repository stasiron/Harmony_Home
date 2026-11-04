import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  diffCollection,
  indexById,
  subscribeCollection,
  writeCollectionDiff,
  WriteBudgetExceededError,
  type SyncedCollection,
} from "@/lib/householdSync";
import type { ItemMeta } from "@/types";

export type ListUpdate<T> = T[] | ((prev: T[]) => T[]);

type Options<T> = {
  householdId: string | null;
  name: SyncedCollection;
  /** uid zapisującego — trafia do createdBy nowych elementów */
  uid: string | null;
  normalize?: (raw: unknown) => T | null;
  sort?: (a: T, b: T) => number;
};

/** Kolejność wg createdAt (Firestore zwraca dokumenty po id) */
export function byCreatedAt<T extends ItemMeta & { id: string }>(
  direction: "asc" | "desc",
) {
  const sign = direction === "asc" ? 1 : -1;
  return (a: T, b: T) => {
    const left = a.createdAt ?? "";
    const right = b.createdAt ?? "";
    if (left !== right) return left < right ? -sign : sign;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

function writeErrorMessage(err: unknown): string {
  if (err instanceof WriteBudgetExceededError) return err.message;
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  if (code === "permission-denied") {
    return "Brak uprawnień — element jest zablokowany albo wymaga administratora.";
  }
  return "Nie udało się zapisać zmian.";
}

/**
 * Lista zsynchronizowana z `households/{householdId}/{name}`.
 * Setter działa jak `setState`, a różnicę zapisuje od razu do Firestore
 * (dokument per element). Odrzucony zapis cofa Firestore — kolejny snapshot
 * przywraca stan z serwera.
 */
export function useSyncedList<T extends ItemMeta & { id: string }>({
  householdId,
  name,
  uid,
  normalize,
  sort,
}: Options<T>): [T[], (update: ListUpdate<T>) => void, boolean] {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef<T[]>([]);
  const knownRef = useRef<Map<string, string>>(new Map());
  const readyRef = useRef(false);
  const uidRef = useRef(uid);
  uidRef.current = uid;
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;
  const sortRef = useRef(sort);
  sortRef.current = sort;

  useEffect(() => {
    itemsRef.current = [];
    knownRef.current = new Map();
    readyRef.current = false;
    setItems([]);
    setReady(false);
    if (!householdId || !uid) return;

    const unsubscribe = subscribeCollection<T>(
      householdId,
      name,
      (raw) => {
        const normalizeItem = normalizeRef.current;
        const list = normalizeItem
          ? raw
              .map((item) => normalizeItem(item))
              .filter((item): item is T => item !== null)
          : raw;
        if (sortRef.current) list.sort(sortRef.current);
        knownRef.current = indexById(list);
        itemsRef.current = list;
        readyRef.current = true;
        setItems(list);
        setReady(true);
      },
      (err) => console.error(`Firestore ${name} sync failed:`, err),
    );
    return () => unsubscribe?.();
    // uid tylko włącza subskrypcję — zmiana konta i tak zmienia mieszkanie
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, name, Boolean(uid)]);

  const householdIdRef = useRef(householdId);
  householdIdRef.current = householdId;

  // Stabilna referencja (jak setState) — zmiana mieszkania idzie przez refy
  const update = useCallback(
    (next: ListUpdate<T>) => {
      const targetId = householdIdRef.current;
      if (!targetId || !readyRef.current) {
        console.warn(`Pominięto zmianę ${name} — mieszkanie się nie wczytało`);
        return;
      }
      const resolved =
        typeof next === "function" ? next(itemsRef.current) : next;
      const now = new Date().toISOString();
      const stamped = resolved.map((item) =>
        knownRef.current.has(item.id) || item.createdBy
          ? item
          : {
              ...item,
              createdBy: uidRef.current ?? undefined,
              createdAt: item.createdAt ?? now,
            },
      );
      const diff = diffCollection(knownRef.current, stamped);
      itemsRef.current = stamped;
      setItems(stamped);
      if (diff.upserts.length === 0 && diff.deletes.length === 0) return;

      knownRef.current = indexById(stamped);
      void writeCollectionDiff(targetId, name, diff).catch((err) => {
        console.error(`Firestore ${name} save failed:`, err);
        // Stałe id — przy serii odrzuconych zapisów jeden toast, nie dziesiątki
        toast.error(writeErrorMessage(err), { id: "firestore-write-error" });
      });
    },
    [name],
  );

  return [items, update, ready];
}
