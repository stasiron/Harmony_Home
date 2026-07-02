import { Label } from "@/components/ui/label";
import type { Zadanie } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  zadania: Zadanie[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function LinkZadaniaPicker({ zadania, selectedIds, onChange }: Props) {
  if (zadania.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        Brak zadań do przypisania. Najpierw dodaj zadanie przyciskiem „Dodaj
        zadanie”.
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
    <div className="space-y-2 rounded-2xl border border-border bg-muted/15 p-3">
      <div className="space-y-1">
        <Label>Przypisz istniejące zadania</Label>
        <p className="text-xs text-muted-foreground">
          Opcjonalnie podepnij gotowe zadania do tego obowiązku.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {zadania.map((zadanie) => {
          const selected = selectedIds.includes(zadanie.id);
          return (
            <button
              key={zadanie.id}
              type="button"
              onClick={() => toggle(zadanie.id)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-left text-xs transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {zadanie.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
