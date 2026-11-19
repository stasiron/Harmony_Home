import { describe, expect, it } from "vitest";
import { suggestEmoji } from "@/config/foodEmoji";
import { addToFridge, applyDeductions, newFridgeItem } from "@/lib/kitchen";

const mozzarella = newFridgeItem({
  name: "Mozzarella",
  amount: null,
  unit: "szt",
  category: "dairy",
  visibility: "public",
  staple: true,
});

describe("stałe produkty w lodówce", () => {
  it("bez ilości startuje od 0 i zostaje", () => {
    expect(mozzarella).toMatchObject({ staple: true, amount: 0 });
  });

  it("kupione bez ilości dokłada +1 do stałego zamiast nowej pozycji", () => {
    const after = addToFridge(
      [mozzarella],
      [
        {
          name: "mozzarella",
          amount: null,
          unit: "szt",
          category: "dairy",
          visibility: "public",
        },
      ],
    );
    expect(after).toHaveLength(1);
    expect(after[0]!.amount).toBe(1);
  });

  it("kupione z ilością przelicza jednostki", () => {
    const ser = newFridgeItem({
      name: "Ser żółty",
      amount: 200,
      unit: "g",
      category: "dairy",
      visibility: "public",
      staple: true,
    });
    const [after] = addToFridge(
      [ser],
      [
        {
          name: "ser zolty",
          amount: 0.5,
          unit: "kg",
          category: "dairy",
          visibility: "public",
        },
      ],
    );
    expect(after!.amount).toBe(700);
  });

  it("prywatny zakup nie dokłada do wspólnego stałego", () => {
    const after = addToFridge(
      [mozzarella],
      [
        {
          name: "Mozzarella",
          amount: 1,
          unit: "szt",
          category: "dairy",
          visibility: "private",
        },
      ],
    );
    expect(after).toHaveLength(2);
  });

  it("gotowanie zdejmuje do zera, ale stały produkt zostaje", () => {
    const stocked = { ...mozzarella, amount: 2 };
    const after = applyDeductions(
      [stocked],
      [{ itemId: stocked.id, amount: 5 } as never],
    );
    expect(after).toEqual([{ ...stocked, amount: 0 }]);
    const whole = applyDeductions(
      [stocked],
      [{ itemId: stocked.id, amount: null } as never],
    );
    expect(whole[0]!.amount).toBe(0);
  });
});

describe("podpowiedź emotki", () => {
  it("po nazwie produktu", () => {
    expect(suggestEmoji("Mozzarella")).toBe("🧀");
    expect(suggestEmoji("Papier toaletowy")).toBe("🧻");
    expect(suggestEmoji("Płyn do naczyń")).toBe("🧴");
    expect(suggestEmoji("xyz")).toBeNull();
  });
});
