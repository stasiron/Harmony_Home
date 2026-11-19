import { describe, expect, it } from "vitest";
import { markShare } from "@/lib/bills";
import {
  netFor,
  pairBalances,
  simplifyTransfers,
  type SharedCost,
} from "@/lib/money";

describe("oddawanie i potwierdzanie", () => {
  const cost = {
    id: "p1",
    paidBy: "ala",
    shares: { ala: 500, bob: 500 },
    settled: { ala: "x" } as Record<string, string>,
    confirmed: { ala: "x" } as Record<string, string>,
  };

  it("dłużnik oddaje — saldo zamknięte, potwierdzenie czeka", () => {
    const paid = markShare(cost, "bob", "paid", "t1");
    expect(paid.settled.bob).toBe("t1");
    expect(paid.confirmed.bob).toBeUndefined();
    expect(netFor([paid], "ala")).toBe(0);
    const ok = markShare(paid, "bob", "confirm", "t2");
    expect(ok.confirmed.bob).toBe("t2");
    expect(ok.settled.bob).toBe("t1");
  });

  it("płacący zaznacza „otrzymane” — od razu potwierdzone; cofnięcie czyści oba", () => {
    const received = markShare(cost, "bob", "received", "t1");
    expect(received.settled.bob).toBe("t1");
    expect(received.confirmed.bob).toBe("t1");
    const undone = markShare(received, "bob", "undo");
    expect(undone.settled.bob).toBeUndefined();
    expect(undone.confirmed.bob).toBeUndefined();
  });
});

describe("najkrótsza lista przelewów", () => {
  // Ala płaci za Boba, Bob za Celę — zamiast 2 przelewów wystarczy 1
  const costs: SharedCost[] = [
    { id: "a", paidBy: "ala", shares: { bob: 1000 } },
    { id: "b", paidBy: "bob", shares: { cela: 1000 } },
  ];

  it("upraszcza łańcuch długów", () => {
    expect(pairBalances(costs)).toHaveLength(2);
    expect(simplifyTransfers(costs, ["ala", "bob", "cela"])).toEqual([
      { from: "cela", to: "ala", amount: 1000 },
    ]);
  });

  it("liczy też długi osoby, której nie ma już na liście", () => {
    const left: SharedCost[] = [
      { id: "1", paidBy: "a", shares: { a: 100, b: 100, c: 100 } },
    ];
    // c wyprowadził(a) się, ale dalej jest winien(a) a 100
    expect(simplifyTransfers(left, ["a", "b"])).toEqual(
      expect.arrayContaining([
        { from: "b", to: "a", amount: 100 },
        { from: "c", to: "a", amount: 100 },
      ]),
    );
  });

  it("suma przelewów wyrównuje wszystkich", () => {
    const many: SharedCost[] = [
      { id: "1", paidBy: "a", shares: { a: 300, b: 300, c: 300 } },
      { id: "2", paidBy: "b", shares: { a: 500, c: 500 } },
      { id: "3", paidBy: "c", shares: { a: 100, b: 100, c: 100, d: 100 } },
    ];
    const people = ["a", "b", "c", "d"];
    const transfers = simplifyTransfers(many, people);
    const after = Object.fromEntries(people.map((p) => [p, netFor(many, p)]));
    for (const t of transfers) {
      after[t.from]! += t.amount;
      after[t.to]! -= t.amount;
    }
    expect(Object.values(after).every((v) => v === 0)).toBe(true);
    expect(transfers.length).toBeLessThanOrEqual(people.length - 1);
  });
});
