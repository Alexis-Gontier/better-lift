import { describe, expect, it } from "vitest";
import { dayEntries, monthGrid, repeatWeek, weekDays } from "./calendar";

const TODAY = "2026-10-16"; // vendredi

describe("weekDays", () => {
  it("rend les 7 jours du lundi au dimanche", () => {
    expect(weekDays("2026-10-14")).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
  });
});

describe("monthGrid", () => {
  it("rend des semaines complètes, du lundi précédant le 1er au dimanche suivant le dernier jour", () => {
    const grid = monthGrid("2026-10");
    expect(grid[0]?.[0]).toBe("2026-09-28");
    expect(grid.at(-1)?.at(-1)).toBe("2026-11-01");
    expect(grid.every((w) => w.length === 7)).toBe(true);
  });
});

describe("dayEntries", () => {
  const sessions = [{ id: "s1", date: "2026-10-13", routine: "Pull A" }];
  const planned = [
    { id: "p1", date: "2026-10-13", routineId: "2" },
    { id: "p2", date: "2026-10-14", routineId: "3" },
    { id: "p3", date: "2026-10-17", routineId: "1" },
  ];
  const name = (id: string) => ({ "1": "Push A", "2": "Pull A", "3": "Jambes A" })[id] ?? "?";

  it("une séance faite remplace la routine planifiée du même jour", () => {
    expect(dayEntries("2026-10-13", sessions, planned, TODAY, name)).toEqual([
      { kind: "done", id: "s1", routine: "Pull A" },
    ]);
  });

  it("une routine planifiée dans le passé et non faite est manquée", () => {
    expect(dayEntries("2026-10-14", sessions, planned, TODAY, name)).toEqual([
      { kind: "missed", id: "p2", routine: "Jambes A", routineId: "3" },
    ]);
  });

  it("une routine planifiée aujourd'hui ou plus tard est à venir", () => {
    expect(dayEntries("2026-10-17", sessions, planned, TODAY, name)).toEqual([
      { kind: "planned", id: "p3", routine: "Push A", routineId: "1" },
    ]);
  });
});

describe("repeatWeek", () => {
  it("copie les routines de la semaine sur les N semaines suivantes, sans doublon", () => {
    const planned = [
      { id: "a", date: "2026-10-12", routineId: "1" },
      { id: "b", date: "2026-10-19", routineId: "1" },
    ];
    const next = repeatWeek(planned, "2026-10-12", 2);
    expect(next.map((p) => `${p.date}:${p.routineId}`).sort()).toEqual([
      "2026-10-12:1",
      "2026-10-19:1",
      "2026-10-26:1",
    ]);
  });
});
