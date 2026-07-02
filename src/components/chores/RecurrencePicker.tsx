import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAY_LABELS } from "@/lib/choreRecurrence";
import type { RecurrenceSchedule, Weekday } from "@/types";

export type RecurrenceMode =
  | "interval-days"
  | "interval-weeks"
  | "interval-months"
  | "weekly";

export type RecurrenceForm = {
  mode: RecurrenceMode;
  every: string;
  weekdays: Weekday[];
  everyWeeks: string;
};

export const defaultRecurrenceForm = (): RecurrenceForm => ({
  mode: "interval-days",
  every: "7",
  weekdays: [1],
  everyWeeks: "1",
});

const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as Weekday[];

export function formToSchedule(form: RecurrenceForm): RecurrenceSchedule {
  const every = Math.max(1, Number.parseInt(form.every, 10) || 1);
  const everyWeeks = Math.max(1, Number.parseInt(form.everyWeeks, 10) || 1);

  switch (form.mode) {
    case "interval-days":
      return { type: "interval", unit: "days", every };
    case "interval-weeks":
      return { type: "interval", unit: "weeks", every };
    case "interval-months":
      return { type: "interval", unit: "months", every };
    case "weekly":
      return {
        type: "weekly",
        weekdays: form.weekdays.length > 0 ? form.weekdays : [1],
        everyWeeks,
      };
  }
}

export function scheduleToForm(schedule: RecurrenceSchedule): RecurrenceForm {
  if (schedule.type === "interval") {
    return {
      mode: `interval-${schedule.unit}` as RecurrenceMode,
      every: String(schedule.every),
      weekdays: [1],
      everyWeeks: "1",
    };
  }
  return {
    mode: "weekly",
    every: "7",
    weekdays: schedule.weekdays,
    everyWeeks: String(schedule.everyWeeks),
  };
}

type RecurrencePickerProps = {
  value: RecurrenceForm;
  onChange: (next: RecurrenceForm) => void;
};

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const toggleWeekday = (day: Weekday) => {
    const next = value.weekdays.includes(day)
      ? value.weekdays.filter((d) => d !== day)
      : [...value.weekdays, day].sort((a, b) => a - b);
    onChange({ ...value, weekdays: next.length > 0 ? next : [day] });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="space-y-1.5">
        <Label>Jak często?</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as RecurrenceMode })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interval-days">Co X dni</SelectItem>
            <SelectItem value="interval-weeks">Co X tygodni</SelectItem>
            <SelectItem value="interval-months">Co X miesięcy</SelectItem>
            <SelectItem value="weekly">Wybrane dni tygodnia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.mode === "weekly" ? (
        <>
          <div className="space-y-1.5">
            <Label>Dni tygodnia</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_WEEKDAYS.map((day) => (
                <label
                  key={day}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={value.weekdays.includes(day)}
                    onCheckedChange={() => toggleWeekday(day)}
                  />
                  {WEEKDAY_LABELS[day]}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurrence-every-weeks">Co ile tygodni</Label>
            <Input
              id="recurrence-every-weeks"
              type="number"
              min={1}
              max={52}
              value={value.everyWeeks}
              onChange={(e) =>
                onChange({ ...value, everyWeeks: e.target.value })
              }
            />
          </div>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="recurrence-every">
            {value.mode === "interval-days" && "Co ile dni"}
            {value.mode === "interval-weeks" && "Co ile tygodni"}
            {value.mode === "interval-months" && "Co ile miesięcy"}
          </Label>
          <Input
            id="recurrence-every"
            type="number"
            min={1}
            max={365}
            value={value.every}
            onChange={(e) => onChange({ ...value, every: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}