import { ChoreLocationPicker } from "@/components/chores/ChoreLocationPicker";
import { MapGeometryPicker } from "@/components/chores/MapGeometryPicker";
import { RecurrencePicker } from "@/components/chores/RecurrencePicker";
import { AssigneeMultiPicker } from "@/components/chores/AssigneeMultiPicker";
import { IMPORTANCE_LABELS } from "@/lib/choreImportance";
import { CHORE_WEIGHT_SETTINGS } from "@/config/choreWeight";
import { MAP_LINE_SETTINGS } from "@/config/mapLine";
import {
  type ChoreFormStepId,
  type ChoreItemFormState,
} from "@/lib/choreItemForm";
import { TASK_MAP_SHAPE_LABELS } from "@/lib/taskMap";
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
import type { HomeZone, TaskImportance, TaskMapShape, TaskRecurrence, User } from "@/types";

type Props = {
  form: ChoreItemFormState;
  onChange: (form: ChoreItemFormState) => void;
  users: User[];
  homeZones: HomeZone[];
  mode?: "chore" | "zadanie";
  /** When set, only that baby-step’s fields render. */
  step?: ChoreFormStepId;
  nameInputId?: string;
  descInputId?: string;
  minutesInputId?: string;
};

export function ChoreItemFormFields({
  form,
  onChange,
  users,
  homeZones,
  mode = "chore",
  step,
  nameInputId = "item-name",
  descInputId = "item-desc",
  minutesInputId = "item-minutes",
}: Props) {
  const setForm = (patch: Partial<ChoreItemFormState>) =>
    onChange({ ...form, ...patch });

  const show = (id: ChoreFormStepId) => step === undefined || step === id;

  const nameFields = (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={nameInputId}>Nazwa</Label>
        <Input
          id={nameInputId}
          placeholder="np. Odkurz salon"
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          autoFocus={false}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={descInputId}>Opis / szczegóły</Label>
        <Textarea
          id={descInputId}
          placeholder="Szczegóły, co dokładnie zrobić… (opcjonalnie)"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ description: e.target.value })}
        />
      </div>
    </>
  );

  const locationFields = (
    <ChoreLocationPicker
      multi
      zones={homeZones}
      rooms={form.rooms}
      zoneIds={form.zoneIds}
      onChangeRooms={(rooms) =>
        onChange({
          ...form,
          rooms: rooms.length > 0 ? rooms : [form.room || "kitchen"],
          room: rooms[0] ?? form.room ?? "kitchen",
          zoneId: "",
          zoneIds: [],
          mapShape: form.mapShape === "zone" ? "pin" : form.mapShape,
          mapPins: [],
          mapLine: [],
          mapArea: [],
        })
      }
      onChangeZoneIds={(zoneIds) => {
        if (zoneIds.length === 0) {
          onChange({
            ...form,
            zoneIds: [],
            zoneId: "",
            rooms: form.rooms.length > 0 ? form.rooms : [form.room || "kitchen"],
            mapShape: form.mapShape === "zone" ? "pin" : form.mapShape,
          });
          return;
        }
        const first = homeZones.find((z) => z.id === zoneIds[0]);
        onChange({
          ...form,
          zoneIds,
          zoneId: zoneIds[0] ?? "",
          rooms: [],
          mapShape: "zone",
          room: first?.room ?? form.room,
          mapPins: [],
          mapLine: [],
          mapArea: [],
        });
      }}
    />
  );

  const minutesField = (
    <div className="space-y-1.5">
      <Label htmlFor={minutesInputId}>
        {mode === "zadanie" ? "Trudność (min)" : "Czas (min)"}
      </Label>
      <Input
        id={minutesInputId}
        type="number"
        min={1}
        max={CHORE_WEIGHT_SETTINGS.maksCzasMinut}
        value={form.estimatedMinutes}
        onChange={(e) => setForm({ estimatedMinutes: e.target.value })}
      />
      {mode === "zadanie" && (
        <p className="text-xs text-muted-foreground">
          Czas (min) × mnożnik trudności — wpływa na próg 50% i % wykonania
          obowiązku.
        </p>
      )}
    </div>
  );

  const zadanieThresholds = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="zadanie-tmin">Min. czas (dni)</Label>
        <Input
          id="zadanie-tmin"
          type="number"
          min={0}
          max={365}
          value={form.tMinDays}
          onChange={(e) => setForm({ tMinDays: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Po ilu dniach zadanie prosi o wykonanie.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="zadanie-tmax">Maks. czas (dni)</Label>
        <Input
          id="zadanie-tmax"
          type="number"
          min={1}
          max={365}
          value={form.tMaxDays}
          onChange={(e) => setForm({ tMaxDays: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Po ilu dniach zadanie staje się krytyczne.
        </p>
      </div>
    </div>
  );

  const recurrenceFields = (
    <>
      <div className="space-y-1.5">
        <Label>Powtarzalność</Label>
        <Select
          value={form.recurrence}
          onValueChange={(v) => setForm({ recurrence: v as TaskRecurrence })}
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

      {form.recurrence === "recurring" && (
        <RecurrencePicker
          value={form.recurrenceForm}
          onChange={(recurrenceForm) => setForm({ recurrenceForm })}
        />
      )}
    </>
  );

  const importanceField = (
    <div className="space-y-1.5">
      <Label>Ważność</Label>
      <Select
        value={form.importance}
        onValueChange={(v) =>
          setForm({ importance: v as `${TaskImportance}` })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from(
            { length: CHORE_WEIGHT_SETTINGS.maksTrudnosc },
            (_, i) => CHORE_WEIGHT_SETTINGS.maksTrudnosc - i,
          ).map((level) => (
            <SelectItem key={level} value={String(level)}>
              {level}
              {" — "}
              {IMPORTANCE_LABELS[level as TaskImportance] ?? `Poziom ${level}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const mapFields = (
    <>
      <div className="space-y-1.5">
        <Label>Kształt na mapie</Label>
        <Select
          value={form.mapShape}
          onValueChange={(v) =>
            onChange({
              ...form,
              mapShape: v as TaskMapShape,
              mapPins: [],
              mapLine: [],
              mapArea: [],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TASK_MAP_SHAPE_LABELS) as TaskMapShape[])
              .filter((shape) => shape !== "zone")
              .map((shape) => (
                <SelectItem key={shape} value={shape}>
                  {TASK_MAP_SHAPE_LABELS[shape]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {form.mapShape === "line" && (
        <div className="space-y-1.5">
          <Label htmlFor="map-line-width">
            Grubość linii ({form.mapLineWidth})
          </Label>
          <input
            id="map-line-width"
            type="range"
            min={MAP_LINE_SETTINGS.minWidth}
            max={MAP_LINE_SETTINGS.maxWidth}
            step={MAP_LINE_SETTINGS.step}
            value={form.mapLineWidth}
            onChange={(e) => setForm({ mapLineWidth: e.target.value })}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Od {MAP_LINE_SETTINGS.minWidth} do {MAP_LINE_SETTINGS.maxWidth}{" "}
            — widoczna na mapie i w podglądzie poniżej.
          </p>
        </div>
      )}

      <MapGeometryPicker
        shape={form.mapShape === "zone" ? "pin" : form.mapShape}
        pins={form.mapPins}
        line={form.mapLine}
        lineWidth={Number.parseFloat(form.mapLineWidth)}
        area={form.mapArea}
        zones={homeZones}
        onPinsChange={(mapPins) => setForm({ mapPins })}
        onLineChange={(mapLine) => setForm({ mapLine })}
        onAreaChange={(mapArea) => setForm({ mapArea })}
      />
    </>
  );

  const usesZones = form.mapShape === "zone" || form.zoneIds.length > 0;

  return (
    <div className="space-y-4">
      {show("basics") && nameFields}

      {show("place") &&
        mode === "zadanie" && (
          <>
            {minutesField}
            {zadanieThresholds}
          </>
        )}

      {show("details") &&
        (mode === "chore" ? (
          <>
            {recurrenceFields}
            {importanceField}
            <AssigneeMultiPicker
              users={users}
              selectedIds={form.assignedToIds}
              onChange={(assignedToIds) => setForm({ assignedToIds })}
            />
          </>
        ) : (
          <>
            {locationFields}
            {importanceField}
          </>
        ))}

      {show("extra") &&
        mode === "zadanie" &&
        (usesZones ? (
          <p className="text-xs text-muted-foreground">
            Pozycja obejmuje{" "}
            {form.zoneIds.length > 1
              ? `wybrane strefy (${form.zoneIds.length})`
              : "całą wybraną strefę"}{" "}
            (bez dodatkowej geometrii).
          </p>
        ) : (
          mapFields
        ))}
    </div>
  );
}
