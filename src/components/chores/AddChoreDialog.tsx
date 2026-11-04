import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChoreItemFormWizard } from "@/components/chores/ChoreItemFormWizard";
import { LinkZadaniaPicker } from "@/components/chores/LinkZadaniaPicker";
import { useHousehold } from "@/context/HouseholdContext";
import {
  canSubmitChoreItemForm,
  emptyChoreItemForm,
  formToChoreItemInput,
  type ChoreItemFormState,
} from "@/lib/choreItemForm";
import { zadanieIdsAttachedElsewhere } from "@/lib/zadania";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddChoreDialog() {
  const { users, tasks, zadania, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [form, setForm] = useState<ChoreItemFormState>(() =>
    emptyChoreItemForm(),
  );
  const { zones: homeZones } = useHousehold();

  const attachedElsewhere = useMemo(
    () => zadanieIdsAttachedElsewhere(tasks),
    [tasks],
  );

  useEffect(() => {
    if (!open) return;
    setForm(emptyChoreItemForm());
    setResetToken((n) => n + 1);
  }, [open]);

  const handleSubmit = () => {
    const input = formToChoreItemInput(form);
    if (!input) return;

    addTask({
      ...input,
      linkedZadanieIds: form.linkedZadanieIds,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="shrink-0">
          <Plus className="size-4" />
          Dodaj obowiązek
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Dodaj obowiązek</DialogTitle>
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
          submitLabel="Dodaj obowiązek"
          nameInputId="chore-name"
          descInputId="chore-desc"
          minutesInputId="chore-minutes"
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
