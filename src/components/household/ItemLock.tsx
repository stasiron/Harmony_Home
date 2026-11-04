import { Lock, LockOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useApp, type LockableKind } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import type { ItemMeta } from "@/types";
import { cn } from "@/lib/utils";

/**
 * „Zablokuj edycję” (docs/ROADMAP.md, decyzja 3a): włącza twórca z kontem
 * albo admin. Zablokowany element edytuje tylko twórca i admin.
 */
export function ItemLockControl({
  kind,
  item,
  className,
}: {
  kind: LockableKind;
  item: ItemMeta & { id: string };
  className?: string;
}) {
  const { setItemLocked } = useApp();
  const { canLockItem, hasAccount } = useHousehold();
  const id = `lock-${kind}-${item.id}`;

  if (!canLockItem(item)) {
    if (!item.locked) return null;
    return (
      <p
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <Lock className="size-3.5" />
        Zablokowane przez twórcę — edytuje tylko twórca i administrator.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <Label htmlFor={id} className="flex items-center gap-2">
          <Lock className="size-3.5" />
          Zablokuj edycję
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {hasAccount
            ? "Zmieniać mogą tylko twórca i administrator — odhaczać każdy."
            : "Wymaga konta Google."}
        </p>
      </div>
      <Switch
        id={id}
        checked={Boolean(item.locked)}
        onCheckedChange={(locked) => setItemLocked(kind, item.id, locked)}
      />
    </div>
  );
}

/** Zamiast przycisku edycji, gdy element jest zablokowany dla tej osoby */
export function LockedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground",
        className,
      )}
      title="Zablokowane — edytuje twórca i administrator"
      aria-label="Zablokowane do edycji"
    >
      <Lock className="size-4" />
    </span>
  );
}

/** Mała wersja przełącznika — do wierszy list (todo, pranie) */
export function ItemLockButton({
  kind,
  item,
}: {
  kind: LockableKind;
  item: ItemMeta & { id: string };
}) {
  const { setItemLocked } = useApp();
  const { canLockItem } = useHousehold();
  const canLock = canLockItem(item);
  if (!canLock && !item.locked) return null;

  const Icon = item.locked ? Lock : LockOpen;
  return (
    <button
      type="button"
      disabled={!canLock}
      onClick={() => setItemLocked(kind, item.id, !item.locked)}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
        item.locked ? "text-primary" : "text-muted-foreground/60",
        canLock && "hover:bg-muted hover:text-foreground",
      )}
      title={
        item.locked
          ? "Zablokowane — edytuje twórca i administrator"
          : "Zablokuj edycję"
      }
      aria-label={item.locked ? "Odblokuj edycję" : "Zablokuj edycję"}
      aria-pressed={Boolean(item.locked)}
    >
      <Icon className="size-4" />
    </button>
  );
}
