import { Label } from "@/components/ui/label";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function AssigneeMultiPicker({ users, selectedIds, onChange }: Props) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-2">
      <Label>Osoby (można kilka)</Label>
      <p className="text-xs text-muted-foreground">
        Obowiązek przypisany do domowników — % wykonania liczy się z wag
        zadań, które dana osoba odhaczyła.
      </p>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
