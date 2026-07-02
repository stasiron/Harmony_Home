import type { Status, TaskImportance } from "@/types";

export type MapDisplayMode = "initials" | "status" | "panic";

export type MapVisualStatus = Status;

export const MAP_MODE_LABELS: Record<MapDisplayMode, string> = {
  initials: "Inicjały",
  status: "Kolory",
  panic: "PANIC",
};

/**
 * Tryby widoczne w przełączniku mapy.
 * `panic` zamrożony — logika zostaje w kodzie, UI wyłączone.
 * @see docs/gaps/04-panic.md
 */
export const MAP_DISPLAY_MODES_UI: MapDisplayMode[] = ["initials", "status"];

export const MAP_STATUS_LEGEND: Record<
  MapVisualStatus,
  { label: string; hint: string }
> = {
  done: {
    label: "Szary",
    hint: "Wykonane lub brak potrzeby",
  },
  safe: {
    label: "Zielony",
    hint: "Za chwilę do wykonania",
  },
  suggested: {
    label: "Pomarańczowy",
    hint: "Wykonaj",
  },
  must: {
    label: "Czerwony",
    hint: "Zapomniane — koniecznie wykonaj",
  },
};

export const MAP_STATUS_STYLES: Record<
  MapVisualStatus,
  {
    fill: string;
    border: string;
    text: string;
    showBang: boolean;
    pulse: boolean;
    svgFill: string;
    svgStroke: string;
  }
> = {
  done: {
    fill: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
    showBang: false,
    pulse: false,
    svgFill: "fill-muted/25",
    svgStroke: "stroke-border",
  },
  safe: {
    fill: "bg-safe",
    border: "border-safe",
    text: "text-safe-foreground",
    showBang: false,
    pulse: false,
    svgFill: "fill-safe/25",
    svgStroke: "stroke-safe",
  },
  suggested: {
    fill: "bg-warn",
    border: "border-warn",
    text: "text-warn-foreground",
    showBang: true,
    pulse: false,
    svgFill: "fill-warn/30",
    svgStroke: "stroke-warn",
  },
  must: {
    fill: "bg-alert",
    border: "border-alert",
    text: "text-alert-foreground",
    showBang: true,
    pulse: true,
    svgFill: "fill-alert/35",
    svgStroke: "stroke-alert",
  },
};

/** PANIC: ważność → ta sama kolorystyka co tryb statusu */
export function importanceToMapStatus(
  importance: TaskImportance,
): MapVisualStatus {
  if (importance >= 5) return "must";
  if (importance >= 4) return "suggested";
  if (importance >= 3) return "safe";
  return "done";
}

export const PANIC_MAP_LEGEND: { status: MapVisualStatus; hint: string }[] = [
  { status: "must", hint: "Krytyczne — zrób teraz przed gośćmi" },
  { status: "suggested", hint: "Wysokie — zrób jeśli starczy czasu" },
  { status: "safe", hint: "Średnie — opcjonalnie" },
];
