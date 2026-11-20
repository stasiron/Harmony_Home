import { describe, expect, it } from "vitest";
import {
  canSettleBills,
  isFullySettled,
  markShare,
  paidSoFar,
  setPaidAmount,
  settleAll,
} from "@/lib/bills";
import {
  netFor,
  openShare,
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

describe("rozliczanie przez opiekuna rachunków", () => {
  const bill = {
    id: "b1",
    paidBy: "ala" as string | null,
    shares: { ala: 1000, bob: 1000, cela: 1000 },
    settled: {} as Record<string, string>,
    confirmed: {} as Record<string, string>,
    payments: {} as Record<string, number>,
  };

  it("wpłata częściowa zmniejsza dług, całość zamyka i potwierdza", () => {
    const part = setPaidAmount(bill, "bob", 400, "t1");
    expect(part.payments?.bob).toBe(400);
    expect(part.settled.bob).toBeUndefined();
    expect(openShare(part, "bob")).toBe(600);
    expect(paidSoFar(part, "bob")).toBe(400);
    const full = setPaidAmount(part, "bob", 1000, "t2");
    expect(full.settled.bob).toBe("t2");
    expect(full.confirmed?.bob).toBe("t2");
    expect(full.payments?.bob).toBeUndefined();
    expect(openShare(full, "bob")).toBe(0);
    const zero = setPaidAmount(full, "bob", 0);
    expect(zero.settled.bob).toBeUndefined();
    expect(openShare(zero, "bob")).toBe(1000);
  });

  it("„Rozlicz” zamyka wszystkie części poza płacącym", () => {
    const partial = setPaidAmount(bill, "cela", 300, "t0");
    const done = settleAll(partial, "t1");
    expect(isFullySettled(done)).toBe(true);
    expect(done.settled.ala).toBeUndefined();
    expect(done.confirmed?.bob).toBe("t1");
    expect(done.payments?.cela).toBeUndefined();
    expect(netFor([done], "ala")).toBe(0);
  });

  it("bez płacącego też da się zbierać wpłaty", () => {
    const done = settleAll({ ...bill, paidBy: null }, "t1");
    expect(isFullySettled(done)).toBe(true);
    expect(Object.keys(done.settled)).toHaveLength(3);
  });

  it("opiekun z ustawień albo administrator", () => {
    const settings = { types: [], managers: ["bob"] };
    expect(canSettleBills(settings, "bob", false)).toBe(true);
    expect(canSettleBills(settings, "cela", false)).toBe(false);
    expect(canSettleBills(settings, null, true)).toBe(true);
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
