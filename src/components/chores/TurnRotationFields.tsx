import { Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  users: User[];
  /** Kolejka w kolejności tur */
  memberIds: string[];
  turn: number;
  onTurnChange: (turn: number) => void;
  /** Obowiązek: przełącznik „Na zmianę”; zadanie: zawsze włączone od 2 osób */
  toggle?: { on: boolean; onChange: (on: boolean) => void };
};

/** Kolejka „na zmianę” — kto po kim i czyja tura teraz */
export function TurnRotationFields({
  users,
  memberIds,
  turn,
  onTurnChange,
  toggle,
}: Props) {
  if (memberIds.length < 2) return null;
  const active = toggle ? toggle.on : true;

  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-3">
      {toggle && (
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="turn-rotation"
            className="flex items-center gap-1.5 font-medium"
          >
            <Repeat className="size-3.5" />
            Na zmianę — każdy po kolei ma swoją turę
          </Label>
          <Switch
            id="turn-rotation"
            checked={toggle.on}
            onCheckedChange={toggle.onChange}
          />
        </div>
      )}
      {active && (
        <>
          <p className="text-xs text-muted-foreground">
            Kolejność = kolejność zaznaczania. Po odhaczeniu tura przechodzi na
            następną osobę. Kliknij osobę, żeby zmienić, czyja tura jest teraz.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {memberIds.map((id, index) => {
              const user = users.find((u) => u.id === id);
              const current = index === turn;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTurnChange(index)}
                  aria-pressed={current}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    current
                      ? "border-primary bg-primary/15 font-semibold text-primary"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span className="tabular-nums">{index + 1}.</span>
                  {user?.name ?? "?"}
                  {current && <span className="text-[10px]">· teraz</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
