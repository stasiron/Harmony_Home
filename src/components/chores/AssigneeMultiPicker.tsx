import { Label } from "@/components/ui/label";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  description?: string;
  /** Numer przy zaznaczonych — kolejność kliknięć (np. kolejka tur) */
  numbered?: boolean;
};

const DEFAULT_DESCRIPTION =
  "Obowiązek przypisany do domowników — % wykonania liczy się z wag zadań, które dana osoba odhaczyła.";

export function AssigneeMultiPicker({
  users,
  selectedIds,
  onChange,
  label = "Osoby (można kilka)",
  description = DEFAULT_DESCRIPTION,
  numbered = false,
}: Props) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {users.map((user) => {
          const selected = selectedIds.includes(user.id);
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => toggle(user.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              <span
                className="grid size-5 place-items-center rounded-full bg-background/30 text-[10px] font-bold"
                style={{ color: selected ? undefined : `var(--${user.color})` }}
              >
                {user.avatar}
              </span>
              {user.name}
              {numbered && selected && (
                <span className="font-bold tabular-nums">
                  {selectedIds.indexOf(user.id) + 1}.
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
