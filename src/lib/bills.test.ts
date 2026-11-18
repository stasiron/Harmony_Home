import { describe, expect, it } from "vitest";
import {
  billShares,
  changeStock,
  dueDateFor,
  findProduct,
  monthLabel,
  needsRestock,
  productId,
  rememberAdded,
  rememberBought,
  resolveBillSettings,
  shiftMonth,
  suggestPrice,
} from "@/lib/bills";
import type { Product, User } from "@/types";

const user = (id: string, active = true): User => ({
  id,
  name: id,
  avatar: id[0]!.toUpperCase(),
  color: "chart-1",
  active,
  heavyDay: false,
});

describe("ustawienia rachunków", () => {
  it("wbudowane rodzaje są zawsze, zapisane nadpisują", () => {
    const types = resolveBillSettings({
      types: [
        {
          id: "gas",
          kind: "gas",
          name: "Gaz",
          enabled: true,
          dueDay: 5,
          defaultAmount: null,
          participants: [],
          splitMode: "equal",
          weights: {},
        },
      ],
    }).types;
    expect(types.map((t) => t.id)).toEqual([
      "rent",
      "electricity",
      "gas",
      "internet",
    ]);
    expect(types.find((t) => t.id === "gas")?.enabled).toBe(true);
  });

  it("podział: wszyscy aktywni albo wagi", () => {
    const users = [user("a"), user("b"), user("c", false)];
    const [rent] = resolveBillSettings(null).types;
    expect(billShares(rent!, 1000, users)).toEqual({ a: 500, b: 500 });
    expect(
      billShares(
        { ...rent!, splitMode: "weights", weights: { a: 3, b: 1 } },
        1000,
        users,
      ),
    ).toEqual({ a: 750, b: 250 });
  });
});

describe("miesiące", () => {
  it("przesuwanie i nazwy", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(monthLabel("2026-11")).toBe("Listopad 2026");
  });

  it("termin nie wychodzi poza miesiąc", () => {
    expect(dueDateFor("2026-02", 31)).toBe("2026-02-28");
    expect(dueDateFor("2026-11", 10)).toBe("2026-11-10");
    expect(dueDateFor("2026-11", null)).toBeNull();
  });
});

describe("pamięć produktów", () => {
  it("id nie zależy od wielkości liter ani polskich znaków", () => {
    expect(productId("Mozzarella ")).toBe(productId("mozzarella"));
    expect(productId("Płyn do naczyń")).toBe("p-plyn-do-naczyn");
  });

  it("zapamiętuje cenę i podpowiada ją przeliczoną", () => {
    const products = rememberBought(
      [],
      [
        {
          name: "Ser żółty",
          amount: 500,
          unit: "g",
          category: "dairy",
          price: 1200,
          visibility: "public",
        },
      ],
      "2026-11-18T10:00:00Z",
    );
    const ser = findProduct(products, "ser zolty");
    expect(ser?.lastPrice).toBe(1200);
    expect(ser?.lastBoughtAt).toBe("2026-11-18T10:00:00Z");
    expect(suggestPrice(ser, 1, "kg")).toBe(2400);
    expect(suggestPrice(ser, null, "szt")).toBe(1200);
  });

  it("prywatna cena zostaje prywatna, wspólna osobno", () => {
    const products = rememberBought(
      [],
      [
        {
          name: "Kawa",
          amount: 1,
          unit: "op",
          category: "pantry",
          price: 3000,
          visibility: "private",
        },
      ],
      "2026-11-18T10:00:00Z",
    );
    expect(products[0]?.visibility).toBe("private");
    expect(findProduct(products, "kawa", "public")?.visibility).toBe("private");
    const withShared = rememberAdded(
      products,
      { name: "Kawa", unit: "op", category: "pantry", visibility: "public" },
      "2026-11-18T11:00:00Z",
    );
    expect(withShared).toHaveLength(2);
    expect(
      findProduct(withShared, "kawa", "public")?.visibility,
    ).toBeUndefined();
  });
});

describe("zapasy", () => {
  const paper: Product = {
    id: "p-papier-toaletowy",
    name: "Papier toaletowy",
    category: "household",
    unit: "szt",
    lastPrice: null,
    lastAmount: null,
    lastBoughtAt: null,
    lastAddedAt: null,
    supply: true,
    stockAmount: 4,
    lowAt: 2,
  };

  it("zużycie zmienia stan", () => {
    expect(changeStock(paper, -1).stock).toBe("ok");
    expect(changeStock(paper, -2).stock).toBe("low");
    expect(changeStock(paper, -10)).toMatchObject({
      stockAmount: 0,
      stock: "out",
    });
    expect(needsRestock(changeStock(paper, -2))).toBe(true);
    expect(needsRestock(paper)).toBe(false);
  });

  it("zakup uzupełnia zapas", () => {
    const [after] = rememberBought(
      [changeStock(paper, -4)],
      [
        {
          name: "papier toaletowy",
          amount: 8,
          unit: "szt",
          category: "household",
          price: 1999,
          visibility: "public",
        },
      ],
      "2026-11-18T10:00:00Z",
    );
    expect(after).toMatchObject({ stockAmount: 8, stock: "ok" });
  });
});
