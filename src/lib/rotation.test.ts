import { describe, expect, it } from "vitest";
import {
  advanceRotation,
  currentTurn,
  effectiveAssignees,
  isRotating,
  keepTurnForList,
  turnOrder,
} from "@/lib/rotation";

const queue = { rotation: ["ala", "olek", "ola"], rotationTurn: 0 };

describe("rotacja na zmianę", () => {
  it("tura krąży po kolei i wraca do pierwszej osoby", () => {
    let item = queue;
    const turns = [];
    for (let i = 0; i < 4; i++) {
      turns.push(currentTurn(item));
      item = advanceRotation(item);
    }
    expect(turns).toEqual(["ala", "olek", "ola", "ala"]);
  });

  it("kolejność od osoby z turą", () => {
    expect(turnOrder({ ...queue, rotationTurn: 1 })).toEqual([
      "olek",
      "ola",
      "ala",
    ]);
  });

  it("jedna osoba albo brak — to nie rotacja", () => {
    expect(isRotating({ rotation: ["ala"] })).toBe(false);
    expect(isRotating({})).toBe(false);
    expect(currentTurn({ rotation: ["ala"] })).toBeNull();
    expect(advanceRotation({ rotation: ["ala"], rotationTurn: 0 })).toEqual({
      rotation: ["ala"],
      rotationTurn: 0,
    });
  });

  it("indeks spoza zakresu i duplikaty nie psują tury", () => {
    expect(currentTurn({ rotation: ["ala", "olek"], rotationTurn: 5 })).toBe(
      "olek",
    );
    expect(
      currentTurn({ rotation: ["ala", "ala", "olek"], rotationTurn: 1 }),
    ).toBe("olek");
  });

  it("przypisani: przy rotacji tylko osoba z turą", () => {
    expect(
      effectiveAssignees({
        ...queue,
        rotationTurn: 2,
        assignedTo: queue.rotation,
      }),
    ).toEqual(["ola"]);
    expect(effectiveAssignees({ assignedTo: ["ala", "olek"] })).toEqual([
      "ala",
      "olek",
    ]);
  });

  it("edycja kolejki zostawia turę przy tej samej osobie", () => {
    const ids = ["ala", "olek", "ola"];
    expect(keepTurnForList(ids, 1, ["ola", "olek"])).toBe(1);
    expect(keepTurnForList(ids, 1, ["ala", "ola"])).toBe(0);
    expect(keepTurnForList(ids, 2, [...ids, "kuba"])).toBe(2);
  });
});
