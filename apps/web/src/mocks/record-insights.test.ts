import { describe, expect, it } from "vitest";
import type { Performance } from "./exercise-stats";
import {
  groupByWeek,
  isStalled,
  recentTrend,
  recordCounts,
  recordDates,
  recordEvents,
  topSet,
  withinReach,
} from "./record-insights";

const TODAY = "2026-10-16";
const p = (date: string, sets: [number | null, number][]): Performance => ({
  date,
  sessionId: date,
  sets: sets.map(([kg, reps]) => ({ kg, reps })),
});

describe("topSet", () => {
  it("prend la série au meilleur 1RM estimé", () => {
    expect(
      topSet(
        p(TODAY, [
          [100, 5],
          [110, 1],
          [90, 10],
        ]),
      ),
    ).toEqual({ kg: 90, reps: 10 });
  });
  it("sans charge, prend la série la plus longue", () => {
    expect(
      topSet(
        p(TODAY, [
          [null, 8],
          [null, 12],
        ]),
      ),
    ).toEqual({ kg: null, reps: 12 });
  });
});

describe("withinReach", () => {
  it("propose une répétition de plus quand elle bat le 1RM", () => {
    const reach = withinReach([p("2026-10-01", [[100, 5]])], TODAY);
    expect(reach?.target).toEqual({ kg: 100, reps: 6 });
    expect(reach?.bodyweight).toBe(false);
  });
  it("rien à portée quand ni une répétition ni 2,5 kg ne suffisent", () => {
    // Record : 100 × 8 (126,7). 95 × 9 = 123,5 ; 97,5 × 8 = 123,5.
    expect(
      withinReach([p("2026-09-01", [[100, 8]]), p("2026-10-01", [[95, 8]])], TODAY),
    ).toBeNull();
    // Record : 100 × 6 (120). 100 × 6 = 120, pas mieux ; 102,5 × 5 = 119,6.
    expect(
      withinReach([p("2026-09-01", [[100, 6]]), p("2026-10-01", [[100, 5]])], TODAY),
    ).toBeNull();
  });
  it("préfère la répétition de plus quand elle suffit", () => {
    // Record : 101 × 5 (117,8). 100 × 6 = 120 suffit.
    expect(
      withinReach([p("2026-09-01", [[101, 5]]), p("2026-10-01", [[100, 5]])], TODAY)?.target,
    ).toEqual({ kg: 100, reps: 6 });
  });
  it("passe à +2,5 kg si la répétition de plus ne bat rien", () => {
    // Record : 21,5 × 1. Dernière : 20 × 1. 20 × 2 = 21,3 ne bat pas ; 22,5 × 1 bat.
    expect(
      withinReach([p("2026-09-01", [[21.5, 1]]), p("2026-10-01", [[20, 1]])], TODAY)?.target,
    ).toEqual({ kg: 22.5, reps: 1 });
  });
  it("ignore un exercice pas fait depuis plus de 30 jours", () => {
    expect(withinReach([p("2026-09-10", [[100, 5]])], TODAY)).toBeNull();
  });
  it("au poids du corps, vise une répétition de plus que le record si on l'a égalé", () => {
    const reach = withinReach(
      [p("2026-09-01", [[null, 12]]), p("2026-10-01", [[null, 12]])],
      TODAY,
    );
    expect(reach).toMatchObject({ target: { kg: null, reps: 13 }, record: 12, bodyweight: true });
    expect(
      withinReach([p("2026-09-01", [[null, 15]]), p("2026-10-01", [[null, 12]])], TODAY),
    ).toBeNull();
  });
});

describe("recentTrend", () => {
  it("mesure l'évolution du 1RM sur 4 semaines", () => {
    const t = recentTrend(
      [p("2026-08-01", [[50, 5]]), p("2026-09-20", [[100, 5]]), p("2026-10-10", [[110, 5]])],
      TODAY,
    );
    expect(t?.change).toBe(10);
    expect(t?.points).toHaveLength(2);
  });
  it("ne dit rien avec moins de deux séances sur la période", () => {
    expect(recentTrend([p("2026-10-10", [[110, 5]])], TODAY)).toBeNull();
  });
});

describe("recordDates", () => {
  it("garde les séances qui battent tout ce qui précède, sauf la première", () => {
    const h = [
      p("2026-09-01", [[100, 5]]),
      p("2026-09-08", [[105, 5]]),
      p("2026-09-15", [[100, 5]]),
      p("2026-09-22", [[110, 5]]),
    ];
    expect(recordDates(h)).toEqual(["2026-09-08", "2026-09-22"]);
  });
});

describe("isStalled", () => {
  const steady = (dates: string[]) => dates.map((d) => p(d, [[100, 5]]));
  it("vrai : 3 séances sur 6 semaines et aucun record depuis 4 semaines", () => {
    expect(isStalled(steady(["2026-09-10", "2026-09-24", "2026-10-08"]), TODAY)).toBe(true);
  });
  it("faux s'il a moins de 3 séances sur 6 semaines", () => {
    expect(isStalled(steady(["2026-09-24", "2026-10-08"]), TODAY)).toBe(false);
  });
  it("faux s'il a battu un record dans les 4 semaines", () => {
    const h = [...steady(["2026-09-10", "2026-09-24"]), p("2026-10-08", [[110, 5]])];
    expect(isStalled(h, TODAY)).toBe(false);
  });
});

describe("recordEvents", () => {
  it("liste les séries marquées record, la plus récente d'abord", () => {
    const events = recordEvents([
      {
        session: { id: "a", date: "2026-10-01" },
        exercises: [
          {
            slug: "squat",
            sets: [
              { kg: 100, reps: 5, record: true },
              { kg: 90, reps: 5 },
            ],
          },
        ],
      },
      {
        session: { id: "b", date: "2026-10-08" },
        exercises: [{ slug: "bench", sets: [{ kg: 80, reps: 5, record: true }] }],
      },
    ]);
    expect(events.map((e) => [e.sessionId, e.slug, e.kg])).toEqual([
      ["b", "bench", 80],
      ["a", "squat", 100],
    ]);
  });
});

describe("recordCounts", () => {
  it("compte la semaine, le mois civil et la série de semaines", () => {
    const events = [{ date: "2026-10-14" }, { date: "2026-10-02" }, { date: "2026-09-30" }];
    // Semaine du 12 oct. : 1 ; octobre : 2 ; semaines du 12, 28 sept. … : la semaine du 5 manque.
    expect(recordCounts(events, TODAY)).toEqual({ week: 1, month: 2, streak: 1 });
  });
});

describe("groupByWeek", () => {
  it("regroupe des éléments triés par semaine civile (lundi)", () => {
    const g = groupByWeek([{ date: "2026-10-14" }, { date: "2026-10-12" }, { date: "2026-10-08" }]);
    expect(g.map((w) => [w.week, w.items.length])).toEqual([
      ["2026-10-12", 2],
      ["2026-10-05", 1],
    ]);
  });
});
