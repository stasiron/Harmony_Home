import { useCallback, useMemo, useRef } from "react";
import { useSyncedList, type ListUpdate } from "@/hooks/useSyncedList";
import type { SyncedCollection } from "@/lib/householdSync";
import type { ItemMeta } from "@/types";

type Options<T> = {
  householdId: string | null;
  name: SyncedCollection;
  uid: string | null;
  normalize?: (raw: unknown) => T | null;
  sort?: (a: T, b: T) => number;
  /** uid konta — prywatne elementy tylko z kontem; null = bez prywatnych */
  privateOwner: string | null;
};

const isPrivate = (item: ItemMeta) => item.visibility === "private";

/**
 * Publiczna lista mieszkania + prywatna lista tej osoby jako jedna lista.
 * Setter rozdziela elementy po `visibility`: zmiana widoczności przenosi
 * element (usuwa z jednej ścieżki, zapisuje w drugiej).
 */
export function useVisibilityList<T extends ItemMeta & { id: string }>({
  privateOwner,
  ...options
}: Options<T>): [T[], (update: ListUpdate<T>) => void, boolean] {
  const [publicItems, setPublic, ready] = useSyncedList<T>(options);
  const [privateItems, setPrivate] = useSyncedList<T>({
    ...options,
    privateList: true,
    privateOwner,
  });
  const privateEnabled = Boolean(privateOwner);

  const merged = useMemo(() => {
    const list = [
      // Stare dokumenty mogły mieć visibility — publiczna ścieżka = publiczne
      ...publicItems.map((item) =>
        isPrivate(item) ? { ...item, visibility: undefined } : item,
      ),
      ...(privateEnabled
        ? privateItems.map((item) =>
            isPrivate(item)
              ? item
              : { ...item, visibility: "private" as const },
          )
        : []),
    ];
    if (options.sort) list.sort(options.sort);
    return list;
    // options.sort jest stałą referencją z modułu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicItems, privateItems, privateEnabled]);

  // Kilka zmian w jednym ticku: kolejna bazuje na wyniku poprzedniej
  const currentRef = useRef(merged);
  const lastMergedRef = useRef(merged);
  if (lastMergedRef.current !== merged) {
    lastMergedRef.current = merged;
    currentRef.current = merged;
  }
  const privateEnabledRef = useRef(privateEnabled);
  privateEnabledRef.current = privateEnabled;

  const update = useCallback(
    (next: ListUpdate<T>) => {
      const resolved =
        typeof next === "function" ? next(currentRef.current) : next;
      currentRef.current = resolved;
      if (!privateEnabledRef.current) {
        // Bez konta nie ma prywatnych — nic nie może po cichu zniknąć
        setPublic(
          resolved.map((item) =>
            isPrivate(item) ? { ...item, visibility: undefined } : item,
          ),
        );
        return;
      }
      setPublic(resolved.filter((item) => !isPrivate(item)));
      setPrivate(resolved.filter(isPrivate));
    },
    [setPublic, setPrivate],
  );

  return [merged, update, ready];
}
