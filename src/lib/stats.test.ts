import { describe, expect, it } from "vitest";
import { statsByPerson } from "@/lib/stats";
import type { Absence, Completion, User } from "@/types";

const user = (id: string): User => ({
  id,
  name: id.toUpperCase(),
  avatar: id[0]!.toUpperCase(),
  color: "chart-1",
  active: true,
  heavyDay: false,
});

const done = (by: string | null, weight: number, at: string): Completion => ({
  id: `${by}-${at}`,
  itemId: "x",
  kind: "chore",
  name: "Odkurzanie",
  by,
  at,
  minutes: 20,
  weight,
});

const FROM = new Date("2026-11-01T00:00:00");
const TO = new Date("2026-11-10T23:59:59");

describe("statystyki z wagami", () => {
  it("punkty, minuty i sprawiedliwa część", () => {
    const { people, unassigned, totalPoints } = statsByPerson(
      [
        done("ala", 30, "2026-11-02T10:00:00Z"),
        done("ala", 30, "2026-11-03T10:00:00Z"),
        done("bob", 30, "2026-11-04T10:00:00Z"),
        done(null, 10, "2026-11-05T10:00:00Z"),
        // poza okresem
        done("bob", 99, "2026-10-20T10:00:00Z"),
      ],
      [user("ala"), user("bob")],
      [],
      FROM,
      TO,
    );
    expect(totalPoints).toBe(90);
    expect(unassigned).toBe(1);
    const ala = people.find((p) => p.id === "ala")!;
    const bob = people.find((p) => p.id === "bob")!;
    expect(ala).toMatchObject({ count: 2, minutes: 40, points: 60 });
    expect(ala.fairPoints).toBe(45);
    expect(ala.fairShare).toBe(133);
    expect(bob.fairShare).toBe(67);
  });

  it("wyjazd zmniejsza sprawiedliwą część", () => {
    const away: Absence = {
      id: "a",
      profileId: "bob",
      from: "2026-11-01",
      to: "2026-11-05",
      note: "",
      mode: "shift",
    };
    const { people } = statsByPerson(
      [
        done("ala", 30, "2026-11-02T10:00:00Z"),
        done("bob", 15, "2026-11-08T10:00:00Z"),
      ],
      [user("ala"), user("bob")],
      [away],
      FROM,
      TO,
    );
    const bob = people.find((p) => p.id === "bob")!;
    // 10 dni Ali, 5 dni Boba → Bobowi wypada 1/3 z 45 punktów
    expect(bob.daysPresent).toBe(5);
    expect(bob.fairPoints).toBe(15);
    expect(bob.fairShare).toBe(100);
  });
});
