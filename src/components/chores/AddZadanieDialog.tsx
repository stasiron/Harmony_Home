import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChoreItemFormWizard } from "@/components/chores/ChoreItemFormWizard";
import { useHousehold } from "@/context/HouseholdContext";
import {
  canSubmitZadanieForm,
  emptyChoreItemForm,
  formToZadanieInput,
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

export function AddZadanieDialog() {
  const { users, addZadanie } = useApp();
  const [open, setOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [form, setForm] = useState<ChoreItemFormState>(() =>
    emptyChoreItemForm(),
  );
  const { zones: homeZones } = useHousehold();

  useEffect(() => {
    if (!open) return;
    setForm(emptyChoreItemForm());
    setResetToken((n) => n + 1);
  }, [open]);

  const handleSubmit = () => {
    const input = formToZadanieInput(form);
    if (!input) return;
    addZadanie(input);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <Plus className="size-4" />
          Dodaj zadanie
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Dodaj zadanie</DialogTitle>
        </DialogHeader>
        <ChoreItemFormWizard
          mode="zadanie"
          form={form}
          onChange={setForm}
          users={users}
          homeZones={homeZones}
          resetToken={resetToken}
          onSubmit={handleSubmit}
          canSubmit={canSubmitZadanieForm(form)}
          submitLabel="Dodaj zadanie"
          nameInputId="zadanie-name"
          descInputId="zadanie-desc"
          minutesInputId="zadanie-minutes"
        />
      </DialogContent>
    </Dialog>
  );
}
