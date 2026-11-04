import { describe, expect, it } from "vitest";
import { PERMANENT_CHORES } from "@/config/chores";
import { PERMANENT_ZADANIA } from "@/config/zadania";
import {
  buildTasksFromParts,
  buildZadaniaFromParts,
  splitChoreState,
} from "@/lib/choreStorage";
import type { Task, Zadanie } from "@/types";

const builtinChoreId = PERMANENT_CHORES[0].id;
const builtinZadanieId = PERMANENT_ZADANIA[0].id;

function userTask(id: string): Task {
  return {
    ...buildTasksFromParts({}, [])[0],
    id,
    name: "Własny obowiązek",
    source: "user",
  };
}

describe("splitChoreState / buildTasksFromParts", () => {
  it("nie zapisuje nieedytowanych wbudowanych obowiązków w całości", () => {
    const tasks = buildTasksFromParts({}, []);
    const parts = splitChoreState(tasks, []);

    expect(parts.userTasks).toEqual([]);
    expect(parts.progress[builtinChoreId]).toBeDefined();
  });

  it("zachowuje edycję wbudowanego obowiązku po zapisie i odczycie", () => {
    const tasks = buildTasksFromParts({}, []).map((task) =>
      task.id === builtinChoreId
        ? { ...task, name: "Zmieniona nazwa", customized: true }
        : task,
    );

    const parts = splitChoreState(tasks, []);
    const restored = buildTasksFromParts(parts.progress, parts.userTasks);

    const edited = restored.filter((t) => t.id === builtinChoreId);
    expect(edited).toHaveLength(1);
    expect(edited[0].name).toBe("Zmieniona nazwa");
    expect(restored).toHaveLength(PERMANENT_CHORES.length);
  });

  it("dokleja własne obowiązki za wbudowanymi", () => {
    const restored = buildTasksFromParts({}, [userTask("custom-1")]);

    expect(restored.map((t) => t.id)).toContain("custom-1");
    expect(restored).toHaveLength(PERMANENT_CHORES.length + 1);
  });

  it("bierze datę wykonania z progress", () => {
    const when = "2026-01-02T03:04:05.000Z";
    const restored = buildTasksFromParts({ [builtinChoreId]: when }, []);

    expect(restored.find((t) => t.id === builtinChoreId)?.lastCompleted).toBe(
      when,
    );
  });
});

describe("buildZadaniaFromParts", () => {
  it("zachowuje lastCompletedBy wbudowanego zadania przez progressBy", () => {
    const zadania: Zadanie[] = buildZadaniaFromParts({}, []).map((z) =>
      z.id === builtinZadanieId ? { ...z, lastCompletedBy: "member-2" } : z,
    );

    const parts = splitChoreState([], zadania);
    expect(parts.userZadania).toEqual([]);

    const restored = buildZadaniaFromParts(
      parts.progress,
      parts.userZadania,
      parts.progressBy,
    );
    expect(
      restored.find((z) => z.id === builtinZadanieId)?.lastCompletedBy,
    ).toBe("member-2");
  });
});
