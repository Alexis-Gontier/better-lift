import { describe, expect, it } from "vitest";
import { resumerExercicesFaits } from "./exercices-faits.js";

const s = (slug: string, date: string, chargeKg: number | null, reps: number, faite = true) => ({
  slug,
  date,
  chargeKg,
  reps,
  faite,
  type: "NORMALE" as const,
});

describe("resumerExercicesFaits (D312)", () => {
  it("rend, par exercice, la dernière date et le meilleur 1RM estimé", () => {
    const r = resumerExercicesFaits([
      s("bench", "2026-10-08T08:00:00.000Z", 82.5, 3),
      s("bench", "2026-10-01T08:00:00.000Z", 80, 5),
      s("squat", "2026-10-02T08:00:00.000Z", 100, 5),
    ]);
    // 80 × (1 + 5/30) = 93,3 bat 82,5 × 1,1 = 90,8 ; 100 × (1 + 5/30) = 116,7.
    expect(r).toEqual([
      { slug: "bench", derniereFois: "2026-10-08T08:00:00.000Z", meilleur1Rm: 93.3 },
      { slug: "squat", derniereFois: "2026-10-02T08:00:00.000Z", meilleur1Rm: 116.7 },
    ]);
  });

  it("un exercice sans série chargée qui compte a un 1RM null, mais une date", () => {
    expect(
      resumerExercicesFaits([
        s("dips", "2026-10-01T08:00:00.000Z", null, 10),
        s("curl", "2026-10-03T08:00:00.000Z", 20, 10, false),
      ]),
    ).toEqual([
      { slug: "dips", derniereFois: "2026-10-01T08:00:00.000Z", meilleur1Rm: null },
      { slug: "curl", derniereFois: "2026-10-03T08:00:00.000Z", meilleur1Rm: null },
    ]);
  });
});
