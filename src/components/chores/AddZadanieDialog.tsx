import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChoreItemFormFields } from "@/components/chores/ChoreItemFormFields";
import { loadHomeZones } from "@/config/homeZones";
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
  const [form, setForm] = useState<ChoreItemFormState>(emptyChoreItemForm);
  const [homeZones, setHomeZones] = useState(() => loadHomeZones());

  useEffect(() => {
    if (open) setHomeZones(loadHomeZones());
  }, [open]);

  const reset = () => setForm(emptyChoreItemForm());

  const handleSubmit = () => {
    const input = formToZadanieInput(form);
    if (!input) return;
    addZadanie(input);
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
        <Button variant="outline" className="shrink-0">
          <Plus className="size-4" />
          Dodaj zadanie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj zadanie</DialogTitle>
        </DialogHeader>
        <ChoreItemFormFields
          mode="zadanie"
          form={form}
          onChange={setForm}
          users={users}
          homeZones={homeZones}
          nameInputId="zadanie-name"
          descInputId="zadanie-desc"
          minutesInputId="zadanie-minutes"
        />
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!canSubmitZadanieForm(form)}
        >
          Dodaj zadanie
        </Button>
      </DialogContent>
    </Dialog>
  );
}
