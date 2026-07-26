import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ChoreItemFormWizard } from "@/components/chores/ChoreItemFormWizard";
import { loadHomeZones } from "@/config/homeZones";
import {
  canSubmitZadanieForm,
  formToZadanieInput,
  zadanieToChoreItemForm,
  type ChoreItemFormState,
} from "@/lib/choreItemForm";
import type { Zadanie } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditZadanieDialog({
  zadanie,
  compact,
}: {
  zadanie: Zadanie;
  compact?: boolean;
}) {
  const { users, updateZadanie } = useApp();
  const [open, setOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [form, setForm] = useState<ChoreItemFormState>(() =>
    zadanieToChoreItemForm(zadanie),
  );
  const [homeZones, setHomeZones] = useState(() => loadHomeZones());

  useEffect(() => {
    if (!open) return;
    setHomeZones(loadHomeZones());
    setForm(zadanieToChoreItemForm(zadanie));
    setResetToken((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open only
  }, [open]);

  const handleSubmit = () => {
    const input = formToZadanieInput(form);
    if (!input) return;
    updateZadanie(zadanie.id, input);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            compact
              ? "flex size-8 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-muted"
              : "flex size-9 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-muted"
          }
          aria-label="Edytuj zadanie"
        >
          <Pencil className={compact ? "size-3.5" : "size-4"} />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edytuj zadanie</DialogTitle>
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
          submitLabel="Zapisz zmiany"
          nameInputId="edit-zadanie-name"
          descInputId="edit-zadanie-desc"
          minutesInputId="edit-zadanie-minutes"
        />
      </DialogContent>
    </Dialog>
  );
}
