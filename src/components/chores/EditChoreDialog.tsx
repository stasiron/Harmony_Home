import { Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChoreItemFormWizard } from "@/components/chores/ChoreItemFormWizard";
import { LinkZadaniaPicker } from "@/components/chores/LinkZadaniaPicker";
import { loadHomeZones } from "@/config/homeZones";
import {
  canSubmitChoreItemForm,
  formToChoreItemInput,
  taskToChoreItemForm,
  type ChoreItemFormState,
} from "@/lib/choreItemForm";
import { zadanieIdsAttachedElsewhere } from "@/lib/zadania";
import type { Task } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditChoreDialog({ task }: { task: Task }) {
  const { users, tasks, zadania, updateTask } = useApp();
  const [open, setOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [form, setForm] = useState<ChoreItemFormState>(() =>
    taskToChoreItemForm(task),
  );
  const [homeZones, setHomeZones] = useState(() => loadHomeZones());

  const attachedElsewhere = useMemo(
    () => zadanieIdsAttachedElsewhere(tasks, task.id),
    [tasks, task.id],
  );

  useEffect(() => {
    if (!open) return;
    setHomeZones(loadHomeZones());
    setForm(taskToChoreItemForm(task));
    setResetToken((n) => n + 1);
    // Reset tylko przy otwarciu, nie przy nowej referencji task.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open only
  }, [open]);

  const handleSubmit = () => {
    const input = formToChoreItemInput(form);
    if (!input) return;

    updateTask(task.id, {
      ...input,
      linkedZadanieIds: form.linkedZadanieIds,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-muted"
          aria-label="Edytuj obowiązek"
        >
          <Pencil className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edytuj obowiązek</DialogTitle>
        </DialogHeader>
        <ChoreItemFormWizard
          mode="chore"
          form={form}
          onChange={setForm}
          users={users}
          homeZones={homeZones}
          resetToken={resetToken}
          onSubmit={handleSubmit}
          canSubmit={canSubmitChoreItemForm(form)}
          submitLabel="Zapisz zmiany"
          nameInputId="edit-chore-name"
          descInputId="edit-chore-desc"
          minutesInputId="edit-chore-minutes"
          extraSlot={
            <LinkZadaniaPicker
              zadania={zadania}
              selectedIds={form.linkedZadanieIds}
              attachedElsewhereIds={attachedElsewhere}
              onChange={(linkedZadanieIds) =>
                setForm((f) => ({ ...f, linkedZadanieIds }))
              }
            />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
