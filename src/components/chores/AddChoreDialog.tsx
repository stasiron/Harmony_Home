import { Plus } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { MapPinPicker } from "@/components/chores/MapPinPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROOM_OPTIONS } from "@/config/rooms";
import type { ChoreRoom, MapPin, TaskRecurrence } from "@/types";

const UNASSIGNED = "__none__";

const emptyForm = {
  name: "",
  description: "",
  room: "kitchen" as ChoreRoom,
  estimatedMinutes: "15",
  assignedTo: UNASSIGNED,
  mapPins: [] as MapPin[],
  recurrence: "recurring" as TaskRecurrence,
};

export function AddChoreDialog() {
  const { users, addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const reset = () => setForm(emptyForm);

  const handleSubmit = () => {
    const minutes = Number.parseInt(form.estimatedMinutes, 10);
    if (!form.name.trim() || Number.isNaN(minutes) || minutes < 1) return;

    addTask({
      name: form.name,
      description: form.description.trim() || undefined,
      room: form.room,
      estimatedMinutes: minutes,
      assignedTo: form.assignedTo === UNASSIGNED ? "" : form.assignedTo,
      mapPins: form.mapPins.length > 0 ? form.mapPins : undefined,
      recurrence: form.recurrence,
    });

    setOpen(false);
    reset();
  };

  const minutes = Number.parseInt(form.estimatedMinutes, 10);
  const canSubmit =
    form.name.trim().length > 0 && !Number.isNaN(minutes) && minutes >= 1;

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj obowiązek</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="chore-name">Nazwa</Label>
            <Input
              id="chore-name"
              placeholder="np. Odkurz salon"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chore-desc">Opis</Label>
            <Textarea
              id="chore-desc"
              placeholder="Szczegóły, co dokładnie zrobić…"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Pokój</Label>
              <Select
                value={form.room}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, room: v as ChoreRoom }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chore-minutes">Czas (min)</Label>
              <Input
                id="chore-minutes"
                type="number"
                min={1}
                max={480}
                value={form.estimatedMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Powtarzalność</Label>
            <Select
              value={form.recurrence}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, recurrence: v as TaskRecurrence }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">Powtarzalne</SelectItem>
                <SelectItem value="once">Jednorazowe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Osoba (opcjonalnie)</Label>
            <Select
              value={form.assignedTo}
              onValueChange={(v) => setForm((f) => ({ ...f, assignedTo: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kto robi?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>— Nikt —</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MapPinPicker
            pins={form.mapPins}
            onChange={(mapPins) => setForm((f) => ({ ...f, mapPins }))}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Dodaj
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
