import { describe, expect, it } from "vitest";
import { recordsBattus } from "./fin-seance.js";
import type { RecordExercice } from "./records.js";
import type { SeanceEnCours } from "./seance.js";

const seance: SeanceEnCours = {
  id: "s1",
  routineId: null,
  nom: "Push",
  debut: "2026-10-03T16:00:00.000Z",
  repos: null,
  exercices: [
    {
      slug: "bench",
      nom: "Développé couché",
      reposSec: 120,
      series: [
        { type: "ECHAUFFEMENT", reps: 10, chargeKg: 40, faite: true },
        { type: "NORMALE", reps: 6, chargeKg: 82.5, faite: true },
        { type: "NORMALE", reps: 8, chargeKg: 90, faite: false }, // pas faite : ne compte pas
      ],
    },
    {
      slug: "traction",
      nom: "Traction",
      reposSec: null,
      series: [{ type: "NORMALE", reps: 10, chargeKg: null, faite: true }],
    },
  ],
};

const rec = (
  type: RecordExercice["type"],
  valeur: number,
  reps: number,
  chargeKg: number | null,
) => ({
  type,
  valeur,
  reps,
  chargeKg,
  date: "2026-09-20T16:00:00.000Z",
});

describe("recordsBattus (D111)", () => {
  it("rend les séries faites qui battent les records d'avant, par exercice", () => {
    const r = recordsBattus(seance, {
      bench: [rec("CHARGE", 80, 8, 80), rec("UN_RM", 101.33, 8, 80), rec("VOLUME", 640, 8, 80)],
      traction: [rec("REPS", 12, 12, null)],
    });
    expect(r.incomplet).toBe(false);
    expect(r.battus).toEqual([
      { slug: "bench", nom: "Développé couché", reps: 6, chargeKg: 82.5, types: ["CHARGE"] },
    ]);
  });

  it("sans historique, la première série qui compte établit les records", () => {
    const r = recordsBattus(seance, { bench: [], traction: [] });
    expect(r.battus.map((b) => [b.slug, b.types])).toEqual([
      ["bench", ["CHARGE", "UN_RM", "VOLUME"]],
      ["traction", ["REPS"]],
    ]);
  });

  // Hors ligne, les records d'un exercice peuvent manquer : on ne déclare pas
  // de record sans pouvoir le prouver.
  it("ignore un exercice dont les records sont inconnus, et le signale", () => {
    const r = recordsBattus(seance, { bench: [] });
    expect(r.incomplet).toBe(true);
    expect(r.battus.map((b) => b.slug)).toEqual(["bench"]);
  });
});
