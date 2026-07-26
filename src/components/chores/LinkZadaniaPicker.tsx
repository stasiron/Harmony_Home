import { Label } from "@/components/ui/label";
import type { Zadanie } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  zadania: Zadanie[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Zadania już w innych obowiązkach — ukryte (chyba że właśnie wybrane). */
  attachedElsewhereIds?: Set<string>;
};

export function LinkZadaniaPicker({
  zadania,
  selectedIds,
  onChange,
  attachedElsewhereIds,
}: Props) {
  const available = zadania.filter(
    (z) =>
      selectedIds.includes(z.id) || !attachedElsewhereIds?.has(z.id),
  );

  if (available.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        Brak wolnych zadań. Dodaj zadanie albo odepnij je od innego obowiązku.
      </div>
    );
  }

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>Wolne zadania</Label>
        <p className="text-xs text-muted-foreground">
          Obowiązek = zbiór zadań. Wybierz niepodpięte zadania do wykonania.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {available.map((zadanie) => {
          const selected = selectedIds.includes(zadanie.id);
          return (
            <button
              key={zadanie.id}
              type="button"
              onClick={() => toggle(zadanie.id)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/30 hover:bg-muted",
              )}
            >
              <span className="font-medium">{zadanie.name}</span>
              {zadanie.description ? (
                <span
                  className={cn(
                    "mt-0.5 block text-xs line-clamp-1",
                    selected
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {zadanie.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Wybrane: {selectedIds.length}
        </p>
      )}
    </div>
  );
}
