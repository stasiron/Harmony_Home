import type {
  GuideEntry,
  GuideField,
  GuideFieldType,
  GuideFieldValue,
  GuideTab,
} from "@/types";

export const FIELD_TYPES: {
  id: GuideFieldType;
  label: string;
  hint: string;
}[] = [
  { id: "text", label: "Krótki tekst", hint: "np. nazwa, model" },
  { id: "longtext", label: "Opis", hint: "dłuższy tekst, kroki" },
  { id: "choice", label: "Wybór jednej opcji", hint: "a / b / c" },
  { id: "multi", label: "Wybór kilku opcji", hint: "zaznacz kilka" },
  { id: "scale", label: "Skala słów", hint: "mało / średnio / dużo" },
  { id: "range", label: "Zakres liczb", hint: "suwak od–do" },
  { id: "number", label: "Liczba", hint: "dowolna wartość" },
  { id: "checkbox", label: "Tak / nie", hint: "przełącznik" },
  { id: "date", label: "Data", hint: "dzień" },
];

const TYPE_IDS = new Set(FIELD_TYPES.map((t) => t.id));

export const fieldTypeLabel = (type: GuideFieldType) =>
  FIELD_TYPES.find((t) => t.id === type)?.label ?? type;

export const hasOptions = (type: GuideFieldType) =>
  type === "choice" || type === "multi" || type === "scale";

export function newField(type: GuideFieldType = "text"): GuideField {
  return {
    id: crypto.randomUUID().slice(0, 8),
    label: "",
    type,
    required: false,
    ...(type === "scale"
      ? { options: ["mało", "średnio", "dużo"] }
      : hasOptions(type)
        ? { options: ["a", "b", "c"] }
        : {}),
    ...(type === "range" ? { min: 0, max: 10, step: 1 } : {}),
  };
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function normalizeGuideTab(raw: unknown): GuideTab | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.name !== "string") return null;
  const fields = Array.isArray(r.fields)
    ? (r.fields as Record<string, unknown>[])
        .filter(
          (f) =>
            f &&
            typeof f.id === "string" &&
            TYPE_IDS.has(f.type as GuideFieldType),
        )
        .map((f) => {
          const field: GuideField = {
            id: f.id as string,
            label: typeof f.label === "string" ? f.label : "",
            type: f.type as GuideFieldType,
            required: f.required === true,
          };
          if (Array.isArray(f.options)) {
            field.options = (f.options as unknown[]).filter(
              (o): o is string => typeof o === "string" && o.trim() !== "",
            );
          }
          const min = num(f.min);
          const max = num(f.max);
          const step = num(f.step);
          if (min !== undefined) field.min = min;
          if (max !== undefined) field.max = max;
          if (step !== undefined) field.step = step;
          if (typeof f.unit === "string" && f.unit) field.unit = f.unit;
          return field;
        })
    : [];
  return {
    ...(r as object),
    id: r.id,
    name: r.name,
    emoji: typeof r.emoji === "string" && r.emoji ? r.emoji : "📁",
    fields,
  } as GuideTab;
}

export function normalizeGuideEntry(raw: unknown): GuideEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.tabId !== "string") return null;
  return {
    ...(r as object),
    id: r.id,
    tabId: r.tabId,
    values:
      r.values && typeof r.values === "object"
        ? (r.values as Record<string, GuideFieldValue>)
        : {},
  } as GuideEntry;
}

export function isEmptyValue(value: GuideFieldValue | undefined): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Pola wymagane bez wartości — puste = można zapisać */
export function missingRequired(
  fields: GuideField[],
  values: Record<string, GuideFieldValue>,
): GuideField[] {
  return fields.filter(
    (f) => f.required && f.type !== "checkbox" && isEmptyValue(values[f.id]),
  );
}

/** Tekst wartości do kart i podglądu */
export function formatFieldValue(
  field: GuideField,
  value: GuideFieldValue | undefined,
): string {
  if (isEmptyValue(value)) return "—";
  if (field.type === "checkbox") return value ? "Tak" : "Nie";
  if (Array.isArray(value)) return value.join(", ");
  if (field.type === "date" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("pl-PL");
  }
  if (typeof value === "number") {
    return `${String(value).replace(".", ",")}${field.unit ? ` ${field.unit}` : ""}`;
  }
  return String(value);
}

/** Tytuł wpisu: pierwsze pole tekstowe, inaczej pierwsza niepusta wartość */
export function entryTitle(tab: GuideTab, entry: GuideEntry): string {
  const textField = tab.fields.find(
    (f) => f.type === "text" && !isEmptyValue(entry.values[f.id]),
  );
  if (textField) return String(entry.values[textField.id]);
  const any = tab.fields.find((f) => !isEmptyValue(entry.values[f.id]));
  return any ? formatFieldValue(any, entry.values[any.id]) : "Wpis";
}
