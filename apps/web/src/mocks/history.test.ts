import { describe, expect, it } from "vitest";
import { groupByMonth, previousOf, sessionDetail } from "./history";
import type { MockSession } from "./sessions";

const s = (id: string, date: string, routine = "Push A"): MockSession => ({
  id,
  date,
  routine,
  minutes: 60,
  volume: 1000,
  records: 0,
});

describe("groupByMonth", () => {
  it("regroupe par mois civil, le plus récent d'abord, sans changer l'ordre interne", () => {
    const groups = groupByMonth([s("3", "2026-10-15"), s("2", "2026-10-02"), s("1", "2026-09-30")]);
    expect(groups.map((g) => [g.month, g.sessions.map((x) => x.id)])).toEqual([
      ["2026-10", ["3", "2"]],
      ["2026-09", ["1"]],
    ]);
  });
});

describe("previousOf", () => {
  it("trouve la séance précédente de la même routine", () => {
    const sessions = [s("3", "2026-10-15"), s("2", "2026-10-12", "Pull A"), s("1", "2026-10-08")];
    expect(previousOf(sessions, "3")?.id).toBe("1");
    expect(previousOf(sessions, "1")).toBeUndefined();
  });
});

describe("sessionDetail", () => {
  it("est stable d'un appel à l'autre", () => {
    const session = s("42", "2026-10-15");
    expect(sessionDetail(session)).toEqual(sessionDetail(session));
  });

  it("reprend les exercices de la routine", () => {
    const detail = sessionDetail(s("42", "2026-10-15", "Push A"));
    expect(detail.exercises.map((e) => e.slug)).toEqual([
      "developpe-couche",
      "developpe-militaire",
      "elevations-laterales",
      "extension-triceps-poulie",
    ]);
  });
});
