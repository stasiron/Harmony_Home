import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChoreItemFormFields } from "@/components/chores/ChoreItemFormFields";
import { LinkZadaniaPicker } from "@/components/chores/LinkZadaniaPicker";
import { loadHomeZones } from "@/config/homeZones";
import {
  canSubmitChoreItemForm,
  emptyChoreItemForm,
  formToChoreItemInput,
  type ChoreItemFormState,
} from "@/lib/choreItemForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddChoreDialog() {
  const { users, zadania, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChoreItemFormState>(emptyChoreItemForm);
  const [homeZones, setHomeZones] = useState(() => loadHomeZones());

  useEffect(() => {
    if (open) setHomeZones(loadHomeZones());
  }, [open]);

  const reset = () => setForm(emptyChoreItemForm());

  const handleSubmit = () => {
    const input = formToChoreItemInput(form);
    if (!input) return;

    addTask({
      ...input,
      linkedZadanieIds:
        form.linkedZadanieIds.length > 0 ? form.linkedZadanieIds : undefined,
    });

    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" className="shrink-0">
          <Plus className="size-4" />
          Dodaj obowiązek
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj obowiązek</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ChoreItemFormFields
            form={form}
            onChange={setForm}
            users={users}
            homeZones={homeZones}
            nameInputId="chore-name"
            descInputId="chore-desc"
            minutesInputId="chore-minutes"
          />

          <LinkZadaniaPicker
            zadania={zadania}
            selectedIds={form.linkedZadanieIds}
            onChange={(linkedZadanieIds) =>
              setForm((f) => ({ ...f, linkedZadanieIds }))
            }
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmitChoreItemForm(form)}
          >
            Dodaj obowiązek
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
