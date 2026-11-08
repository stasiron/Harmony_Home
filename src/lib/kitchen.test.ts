import { describe, expect, it } from "vitest";
import {
  addToFridge,
  applyDeductions,
  convertAmount,
  ingredientStatus,
  missingIngredients,
  namesMatch,
  normalizeRecipe,
  normalizeShoppingItem,
  parseQty,
  planCooking,
  recipeAvailability,
} from "@/lib/kitchen";
import type { FridgeItem, Recipe } from "@/types";

const item = (over: Partial<FridgeItem>): FridgeItem => ({
  id: crypto.randomUUID(),
  name: "Produkt",
  category: "other",
  amount: 1,
  unit: "szt",
  expiresOn: null,
  ...over,
});

const recipe = (over: Partial<Recipe> = {}): Recipe =>
  normalizeRecipe({
    id: "r1",
    name: "Naleśniki",
    servings: 2,
    ingredients: [
      { name: "mąka", amount: 200, unit: "g" },
      { name: "mleko", amount: 0.5, unit: "l" },
      { name: "jajko", amount: 2, unit: "szt" },
      { name: "sól", amount: null, unit: "szczypta", optional: true },
    ],
    ...over,
  })!;

describe("jednostki i nazwy", () => {
  it("przelicza kg↔g i l↔ml, nie miesza masy z objętością", () => {
    expect(convertAmount(1.5, "kg", "g")).toBe(1500);
    expect(convertAmount(250, "ml", "l")).toBe(0.25);
    expect(convertAmount(1, "kg", "l")).toBeNull();
    expect(convertAmount(2, "szt", "szt")).toBe(2);
  });

  it("czyta stare pole qty", () => {
    expect(parseQty("2,5 kg")).toEqual({ amount: 2.5, unit: "kg" });
    expect(parseQty("3")).toEqual({ amount: 3, unit: "szt" });
    expect(parseQty("")).toEqual({ amount: null, unit: "szt" });
  });

  it("dopasowuje odmiany i dłuższe nazwy", () => {
    expect(namesMatch("Jajka L", "jajko")).toBe(true);
    expect(namesMatch("Mleko 3,2%", "mleko")).toBe(true);
    expect(namesMatch("Mąka pszenna", "mąka")).toBe(true);
    expect(namesMatch("masło", "mleko")).toBe(false);
  });

  it("stara pozycja zakupów dostaje amount/unit", () => {
    expect(
      normalizeShoppingItem({
        id: "s",
        name: "Mleko",
        qty: "2 l",
        category: "dairy",
      }),
    ).toMatchObject({ amount: 2, unit: "l", checked: false });
  });
});

describe("lodówka i przepisy", () => {
  const fridge = [
    item({ id: "f1", name: "Mąka pszenna", amount: 1, unit: "kg" }),
    item({ id: "f2", name: "Mleko", amount: 1, unit: "l" }),
    item({ id: "f3", name: "Jajka", amount: 1, unit: "szt" }),
  ];

  it("liczy dostępność w jednostce składnika", () => {
    const s = ingredientStatus(recipe().ingredients[0]!, fridge);
    expect(s.available).toBe(1000);
    expect(s.enough).toBe(true);
    expect(recipeAvailability(recipe(), fridge)).toEqual({
      have: 2,
      total: 3,
      ready: false,
    });
  });

  it("brakujące: tylko różnica, opcjonalne pomija", () => {
    expect(missingIngredients(recipe(), fridge)).toEqual([
      { name: "jajko", amount: 1, unit: "szt" },
    ]);
  });

  it("porcje skalują ilości", () => {
    const s = ingredientStatus(recipe().ingredients[1]!, fridge, 3);
    expect(s.needed).toBeCloseTo(1.5);
    expect(s.enough).toBe(false);
  });

  it("gotowanie zdejmuje zużyte i usuwa puste pozycje", () => {
    const plan = planCooking(recipe(), fridge);
    expect(plan.map((d) => [d.itemId, d.amount, d.unit])).toEqual([
      ["f1", 0.2, "kg"],
      ["f2", 0.5, "l"],
      ["f3", 1, "szt"],
    ]);
    const after = applyDeductions(fridge, plan);
    expect(after.map((f) => [f.id, f.amount])).toEqual([
      ["f1", 0.8],
      ["f2", 0.5],
    ]);
  });

  it("najpierw produkt z krótszym terminem", () => {
    const two = [
      item({
        id: "late",
        name: "mleko",
        amount: 1,
        unit: "l",
        expiresOn: "2026-12-01",
      }),
      item({
        id: "soon",
        name: "mleko",
        amount: 0.3,
        unit: "l",
        expiresOn: "2026-11-09",
      }),
    ];
    const plan = planCooking(
      recipe({ ingredients: [{ name: "mleko", amount: 0.5, unit: "l" }] }),
      two,
    );
    expect(plan.map((d) => [d.itemId, d.amount])).toEqual([
      ["soon", 0.3],
      ["late", 0.2],
    ]);
  });

  it("nieprzeliczalne jednostki: propozycja usunięcia, niezaznaczona", () => {
    const plan = planCooking(
      recipe({ ingredients: [{ name: "mąka", amount: 200, unit: "g" }] }),
      [item({ id: "op", name: "mąka", amount: 1, unit: "op" })],
    );
    expect(plan).toEqual([
      expect.objectContaining({ itemId: "op", amount: null, exact: false }),
    ]);
  });

  it("kupione do lodówki: ta sama nazwa i widoczność — sumuje", () => {
    const next = addToFridge(fridge, [
      {
        name: "mleko",
        amount: 500,
        unit: "ml",
        category: "dairy",
        visibility: "public",
      },
      {
        name: "mleko",
        amount: 1,
        unit: "l",
        category: "dairy",
        visibility: "private",
      },
    ]);
    expect(next.find((f) => f.id === "f2")?.amount).toBe(1.5);
    expect(next.filter((f) => f.name === "mleko")).toHaveLength(1);
    expect(next.at(-1)).toMatchObject({ visibility: "private", amount: 1 });
  });
});

describe("normalizeRecipe", () => {
  it("składnik bez ilości zostaje bez ilości", () => {
    expect(recipe().ingredients[3]).toMatchObject({
      amount: null,
      optional: true,
    });
  });

  it("udostępnienia tylko przy share == people", () => {
    expect(
      normalizeRecipe({
        id: "a",
        name: "x",
        share: "all",
        sharedWith: { u: true },
      })?.sharedWith,
    ).toEqual([]);
    expect(
      normalizeRecipe({
        id: "a",
        name: "x",
        share: "people",
        sharedWith: { u: true, v: false },
      })?.sharedWith,
    ).toEqual(["u"]);
  });
});
