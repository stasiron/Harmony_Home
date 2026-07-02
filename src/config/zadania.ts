import zadaniaData from "@content/data/zadania.json";
import { normalizeTaskImportance } from "@/lib/choreImportance";
import { applyZadanieThresholds } from "@/lib/choreZadaniaStatus";
import type { Zadanie } from "@/types";

type ZadanieDefinition = Omit<Zadanie, "lastCompleted" | "source" | "tSuggested"> & {
  tMin: number;
  tMax: number;
};

export const PERMANENT_ZADANIA: Omit<Zadanie, "lastCompleted">[] =
  zadaniaData.zadania.map((zadanie) => {
    const def = zadanie as ZadanieDefinition;
    return normalizeTaskImportance(
      applyZadanieThresholds(
        {
          ...def,
          source: "builtin",
          tSuggested: def.tMin,
        },
        def.tMin,
        def.tMax,
      ),
    );
  });

export const PERMANENT_ZADANIA_IDS = new Set(
  PERMANENT_ZADANIA.map((z) => z.id),
);
