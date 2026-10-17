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

  it("reprend les séries réellement faites", () => {
    const detail = sessionDetail(s("hevy-2026-07-24", "2026-07-24", "Legs"));
    expect(detail.exercises[0]?.slug).toBe("sled-hack-squat");
    expect(detail.exercises[0]?.sets).toEqual([
      { kg: 20, reps: 5 },
      { kg: 20, reps: 5 },
      { kg: 20, reps: 5 },
      { kg: 20, reps: 5 },
    ]);
  });

  it("ne marque pas de record la première fois qu'un exercice est fait", () => {
    const detail = sessionDetail(s("hevy-2026-07-23", "2026-07-23", "Push"));
    expect(detail.exercises.flatMap((e) => e.sets).some((x) => x.record)).toBe(false);
  });

  it("marque la meilleure série qui bat les séances précédentes", () => {
    // 29 juillet : 85 × 7 au développé machine bat les 70 × 10 du 23.
    const detail = sessionDetail(s("hevy-2026-07-29", "2026-07-29", "Push"));
    const press = detail.exercises.find((e) => e.slug === "lever-chest-press");
    expect(press?.sets.map((x) => x.record ?? false)).toEqual([true, false, false]);
  });
});
