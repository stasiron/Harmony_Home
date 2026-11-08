import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";
import { normalizeRecipe } from "@/lib/kitchen";
import type { Recipe } from "@/types";

/**
 * Przepisy: `households/{id}/recipes/{recipeId}`. Każdy przepis ma autora
 * (konto). Reguły wpuszczają tylko: autora, wszystkich przy `share: "all"`
 * i konta z mapy `sharedWith` — dlatego czytamy trzema zapytaniami, które
 * reguły mogą sprawdzić, a nie całą kolekcją.
 */
function recipesRef(householdId: string) {
  const db = getFirestoreDb();
  return db ? collection(db, "households", householdId, "recipes") : null;
}

export function subscribeRecipes(
  householdId: string,
  uid: string,
  withAccount: boolean,
  onData: (recipes: Recipe[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const ref = recipesRef(householdId);
  if (!ref) return null;

  const parts = new Map<string, Map<string, Recipe>>();
  const emit = () => {
    const merged = new Map<string, Recipe>();
    for (const part of parts.values()) {
      for (const [id, recipe] of part) merged.set(id, recipe);
    }
    onData(
      [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "pl")),
    );
  };

  const queries = [
    ["all", query(ref, where("share", "==", "all"))] as const,
    ...(withAccount
      ? ([
          ["own", query(ref, where("createdBy", "==", uid))],
          ["people", query(ref, where(`sharedWith.${uid}`, "==", true))],
        ] as const)
      : []),
  ];

  const unsubs = queries.map(([key, q]) =>
    onSnapshot(
      q,
      (snap) => {
        parts.set(
          key,
          new Map(
            snap.docs
              .map((d) => normalizeRecipe({ ...d.data(), id: d.id }))
              .filter((r): r is Recipe => r !== null)
              .map((r) => [r.id, r]),
          ),
        );
        emit();
      },
      (err) => onError?.(err),
    ),
  );
  return () => unsubs.forEach((u) => u());
}

export async function saveRecipe(householdId: string, recipe: Recipe) {
  const ref = recipesRef(householdId);
  if (!ref) throw new Error("Firestore niedostępny");
  guardWriteBudget();
  const { sharedWith, ...rest } = recipe;
  await setDoc(doc(ref, recipe.id), {
    ...rest,
    sharedWith:
      recipe.share === "people"
        ? Object.fromEntries(sharedWith.map((uid) => [uid, true]))
        : {},
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRecipe(householdId: string, recipeId: string) {
  const ref = recipesRef(householdId);
  if (!ref) throw new Error("Firestore niedostępny");
  guardWriteBudget();
  await deleteDoc(doc(ref, recipeId));
}
