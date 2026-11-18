import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { byCreatedAt, useSyncedList } from "@/hooks/useSyncedList";
import { useVisibilityList } from "@/hooks/useVisibilityList";
import { normalizeProduct, normalizePurchase } from "@/lib/bills";
import { normalizeFridgeItem, normalizeShoppingItem } from "@/lib/kitchen";
import { subscribeRecipes } from "@/lib/recipes";
import type {
  FridgeItem,
  Product,
  Purchase,
  Recipe,
  ShoppingItem,
} from "@/types";

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

  // Pamięć produktów: ceny, daty zakupu, zapasy (prywatne — tylko moje)
  const [products, setProducts, productsReady] = useVisibilityList<Product>({
    householdId,
    name: "products",
    uid,
    privateOwner,
    normalize: normalizeProduct,
    sort: byName,
  });
  // Wspólne zakupy — kuchnia tworzy je przy „Kupione”
  const [purchases, setPurchases] = useSyncedList<Purchase>({
    householdId,
    name: "purchases",
    uid,
    normalize: normalizePurchase,
    sort: byCreatedAt("desc"),
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
    products,
    setProducts,
    purchases,
    setPurchases,
    recipes,
    ready: fridgeReady && shoppingReady && recipesReady && productsReady,
  };
}

export type KitchenData = ReturnType<typeof useKitchen>;
