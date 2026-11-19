import { describe, expect, it } from "vitest";
import { addMissingToShopping } from "@/lib/bills";
import {
  ingredientStatus,
  missingIngredients,
  newFridgeItem,
  planCooking,
  productKey,
} from "@/lib/kitchen";
import type { Product, Recipe } from "@/types";

const recipe: Recipe = {
  id: "r1",
  name: "Gulasz",
  emoji: "🍲",
  description: "",
  category: "Obiad",
  servings: 2,
  prepMinutes: 10,
  cookMinutes: 30,
  difficulty: "easy",
  ingredients: [
    {
      name: "Mięso",
      amount: 100,
      unit: "g",
      productId: productKey("Wołowina"),
    },
    { name: "Cebula", amount: 1, unit: "szt" },
  ],
  steps: [],
  notes: "",
  share: "all",
  sharedWith: [],
  createdBy: "u1",
  authorName: "Ala",
  createdAt: "",
  updatedAt: "",
};

const fridge = [
  newFridgeItem({
    name: "Wołowina",
    amount: 500,
    unit: "g",
    category: "meat",
    visibility: "public",
  }),
];

describe("przepis powiązany z produktem", () => {
  it("dopasowuje po produkcie, nawet gdy nazwy się różnią", () => {
    const status = ingredientStatus(recipe.ingredients[0]!, fridge, 1);
    expect(status.matches.map((m) => m.name)).toEqual(["Wołowina"]);
    expect(status.enough).toBe(true);
  });

  it("70% przepisu odejmuje 70 g zamiast 100 g", () => {
    const plan = planCooking(recipe, fridge, 0.7);
    expect(plan[0]).toMatchObject({ itemName: "Wołowina", amount: 70 });
  });

  it("200% przepisu i stały produkt przy zerze — brakuje", () => {
    const zero = [{ ...fridge[0]!, amount: 0, staple: true }];
    const missing = missingIngredients(recipe, zero, 2);
    expect(missing).toContainEqual({ name: "Mięso", amount: 200, unit: "g" });
    expect(missing).toContainEqual({ name: "Cebula", amount: 2, unit: "szt" });
  });
});

describe("brakujące do zakupów", () => {
  const products: Product[] = [
    {
      id: productKey("Cebula"),
      name: "Cebula",
      category: "produce",
      unit: "szt",
      lastPrice: null,
      lastAmount: null,
      lastBoughtAt: null,
      lastAddedAt: null,
      emoji: "🧅",
    },
  ];

  it("bez duplikatów, z kategorią i emotką z pamięci", () => {
    const { next, added } = addMissingToShopping(
      [
        {
          id: "s1",
          name: "mięso",
          amount: null,
          unit: "g",
          category: "meat",
          checked: false,
        },
      ],
      [
        { name: "Mięso", amount: 100, unit: "g" },
        { name: "Cebula", amount: 1, unit: "szt" },
      ],
      products,
      "public",
    );
    expect(added).toBe(1);
    expect(next.find((s) => s.name === "Cebula")).toMatchObject({
      category: "produce",
      emoji: "🧅",
    });
  });
});
