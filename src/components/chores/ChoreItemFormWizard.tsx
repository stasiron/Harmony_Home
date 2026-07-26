import { useEffect, useState, type ReactNode } from "react";
import { ChoreItemFormFields } from "@/components/chores/ChoreItemFormFields";
import {
  canProceedChoreFormStep,
  choreFormStepsFor,
  type ChoreFormStepId,
  type ChoreItemFormState,
} from "@/lib/choreItemForm";
import { Button } from "@/components/ui/button";
import type { HomeZone, User } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  mode: "chore" | "zadanie";
  form: ChoreItemFormState;
  onChange: (form: ChoreItemFormState) => void;
  users: User[];
  homeZones: HomeZone[];
  onSubmit: () => void;
  canSubmit: boolean;
  submitLabel: string;
  nameInputId: string;
  descInputId: string;
  minutesInputId: string;
  /** Extra content on last step (e.g. link zadania). */
  extraSlot?: ReactNode;
  /** Zmiana (np. przy otwarciu dialogu) resetuje krok do 0. */
  resetToken?: number | string | boolean;
};

export function ChoreItemFormWizard({
  mode,
  form,
  onChange,
  users,
  homeZones,
  onSubmit,
  canSubmit,
  submitLabel,
  nameInputId,
  descInputId,
  minutesInputId,
  extraSlot,
  resetToken = 0,
}: Props) {
  const steps = choreFormStepsFor(mode);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [resetToken]);

  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= steps.length - 1;
  const canNext = canProceedChoreFormStep(form, step.id, mode);

  const goTo = (index: number) => {
    // Po pełnym cyklu pointer (mouseup) — unikamy fałszywego „outside click”
    // Radixa przy zmianie wysokości DialogContent.
    window.setTimeout(() => {
      setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= stepIndex ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-sm font-medium">
              Krok {stepIndex + 1}/{steps.length}: {step.title}
            </p>
            <p className="text-xs text-muted-foreground">{step.hint}</p>
          </div>
        </div>
      </div>

      <ChoreItemFormFields
        mode={mode}
        form={form}
        onChange={onChange}
        users={users}
        homeZones={homeZones}
        step={step.id as ChoreFormStepId}
        nameInputId={nameInputId}
        descInputId={descInputId}
        minutesInputId={minutesInputId}
      />

      {step.id === "extra" && extraSlot}

      <div className="flex gap-2">
        {!isFirst && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => goTo(stepIndex - 1)}
          >
            Wstecz
          </Button>
        )}
        {isLast ? (
          <Button
            type="button"
            className="flex-1"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {submitLabel}
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1"
            onClick={() => goTo(stepIndex + 1)}
            disabled={!canNext}
          >
            Dalej
          </Button>
        )}
      </div>

      {!isLast && canSubmit && (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onSubmit}
        >
          Zapisz z domyślnymi ustawieniami
        </Button>
      )}
    </div>
  );
}
