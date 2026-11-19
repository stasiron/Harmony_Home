import { describe, expect, it } from "vitest";
import { digestLines } from "@/lib/digest";
import type { Bill, Purchase, Task } from "@/types";

const NOW = new Date("2026-11-19T07:00:00Z");
const TODAY = "2026-11-19";

const chore = (patch: Partial<Task>): Task =>
  ({
    id: "c1",
    name: "Łazienka",
    room: "bathroom",
    category: "bathroom",
    estimatedMinutes: 30,
    assignedTo: ["adam"],
    recurrence: "recurring",
    source: "user",
    lastCompleted: "2026-10-20T07:00:00Z",
    tMin: 6,
    tSuggested: 7,
    tMax: 11,
    importance: 3,
    isGuestPriority: false,
    isExpressBlitz: false,
    ...patch,
  }) as Task;

const bill = (patch: Partial<Bill>): Bill => ({
  id: "b1",
  typeId: "electricity",
  name: "Prąd",
  month: "2026-11",
  amount: 24000,
  dueOn: "2026-11-20",
  paidBy: null,
  shares: { adam: 12000, bartek: 12000 },
  settled: {},
  ...patch,
});

const names: Record<string, string> = { adam: "Adam", bartek: "Bartek" };
const base = {
  bills: [] as Bill[],
  purchases: [] as Purchase[],
  items: [] as Task[],
  nameOf: (id: string) => names[id] ?? "ktoś",
  now: NOW,
  today: TODAY,
};

describe("poranne podsumowanie", () => {
  it("zaległy obowiązek osoby", () => {
    const lines = digestLines({
      ...base,
      profileId: "adam",
      items: [chore({})],
    });
    expect(lines).toEqual(["Obowiązki: Łazienka (zaległe: 1)"]);
    expect(
      digestLines({ ...base, profileId: "bartek", items: [chore({})] }),
    ).toEqual([]);
  });

  it("kolejka: tylko osoba z turą", () => {
    const item = chore({
      assignedTo: [],
      rotation: ["bartek", "adam"],
      rotationTurn: 1,
    });
    expect(
      digestLines({ ...base, profileId: "adam", items: [item] }),
    ).toHaveLength(1);
    expect(
      digestLines({ ...base, profileId: "bartek", items: [item] }),
    ).toHaveLength(0);
  });

  it("rachunek z terminem w ciągu 3 dni, nieopłacony", () => {
    expect(
      digestLines({ ...base, profileId: "adam", bills: [bill({})] })[0],
    ).toMatch(/^Prąd: 240,00\szł do 20\.11 \(Twoja część 120,00\szł\)$/);
    expect(
      digestLines({
        ...base,
        profileId: "adam",
        bills: [bill({ paidBy: "bartek" })],
      }),
    ).toEqual([]);
    expect(
      digestLines({
        ...base,
        profileId: "adam",
        bills: [bill({ dueOn: "2026-11-30" })],
      }),
    ).toEqual([]);
  });

  it("prośba o zwrot", () => {
    const purchase: Purchase = {
      id: "p1",
      title: "Chemia",
      items: [],
      total: 3000,
      paidBy: "bartek",
      shares: { adam: 1500, bartek: 1500 },
      settled: { bartek: "x" },
      refundRequestedAt: "2026-11-18T10:00:00Z",
      at: "2026-11-18T10:00:00Z",
    };
    expect(
      digestLines({ ...base, profileId: "adam", purchases: [purchase] })[0],
    ).toMatch(/^Do oddania: 15,00\szł \(Bartek\)$/);
    expect(
      digestLines({
        ...base,
        profileId: "adam",
        purchases: [{ ...purchase, refundRequestedAt: null }],
      }),
    ).toEqual([]);
  });
});
