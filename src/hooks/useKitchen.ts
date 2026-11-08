import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { useVisibilityList } from "@/hooks/useVisibilityList";
import { normalizeFridgeItem, normalizeShoppingItem } from "@/lib/kitchen";
import { subscribeRecipes } from "@/lib/recipes";
import type { FridgeItem, Recipe, ShoppingItem } from "@/types";

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "pl");

/**
 * Dane kuchni — subskrybowane tylko na stronie Kuchni (oszczędza odczyty
 * Firestore na pozostałych ekranach). Lodówka i zakupy: wspólne + prywatne
 * tej osoby jako jedna lista (prywatne tylko z kontem).
 */
export function useKitchen() {
  const { syncUser } = useAuth();
  const { householdId, hasAccount } = useHousehold();
  const uid = syncUser?.uid ?? null;
  const privateOwner = syncUser && !syncUser.isAnonymous ? syncUser.uid : null;

  const [fridge, setFridge, fridgeReady] = useVisibilityList<FridgeItem>({
    householdId,
    name: "fridge",
    uid,
    privateOwner,
    normalize: normalizeFridgeItem,
    sort: byName,
  });
  const [shopping, setShopping, shoppingReady] =
    useVisibilityList<ShoppingItem>({
      householdId,
      name: "shopping",
      uid,
      privateOwner,
      normalize: normalizeShoppingItem,
      sort: byName,
    });

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesReady, setRecipesReady] = useState(false);
  useEffect(() => {
    setRecipes([]);
    setRecipesReady(false);
    if (!householdId || !uid) return;
    const unsubscribe = subscribeRecipes(
      householdId,
      uid,
      hasAccount,
      (list) => {
        setRecipes(list);
        setRecipesReady(true);
      },
      (err) => console.error("Recipes sync failed:", err),
    );
    return () => unsubscribe?.();
  }, [householdId, uid, hasAccount]);

  return {
    uid,
    householdId,
    fridge,
    setFridge,
    shopping,
    setShopping,
    recipes,
    ready: fridgeReady && shoppingReady && recipesReady,
  };
}

export type KitchenData = ReturnType<typeof useKitchen>;
