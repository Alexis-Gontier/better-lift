import { describe, expect, it } from "vitest";
import {
  bornesPeriode,
  chiffresCles,
  depuisPour,
  type FaitSeance,
  recordsRecents,
  repartitionMuscles,
  requeteTableauDeBord,
  semaineEnCours,
  tendance,
} from "./tableau-de-bord.js";

const PARIS = "Europe/Paris";
// Mercredi 15 octobre 2026, 10 h à Paris.
const MAINTENANT = new Date("2026-10-15T08:00:00.000Z");

const seance = (debut: string, p: Partial<FaitSeance> = {}): FaitSeance => ({
  id: debut,
  nom: "Push",
  debut,
  fin: debut,
  seriesFaites: 10,
  volumeKg: 1000,
  muscles: { principaux: ["Pectoraux", "Triceps"], secondaires: ["Épaules"] },
  records: [],
  ...p,
});

describe("bornesPeriode", () => {
  it("4 semaines : du lundi d'il y a 3 semaines, précédente 4 semaines avant", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    expect(b.unite).toBe("semaine");
    expect(b.intervalles).toEqual(["2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"]);
    expect(b.debut).toBe("2026-09-21");
    expect(b.precedente).toBe("2026-08-24");
  });

  it("3 mois : 13 semaines", () => {
    const b = bornesPeriode("3m", MAINTENANT, PARIS);
    expect(b.intervalles).toHaveLength(13);
    expect(b.intervalles.at(-1)).toBe("2026-10-12");
    expect(b.debut).toBe("2026-07-20");
  });

  it("1 an : 12 mois, du 1er du mois", () => {
    const b = bornesPeriode("1a", MAINTENANT, PARIS);
    expect(b.unite).toBe("mois");
    expect(b.intervalles[0]).toBe("2025-11-01");
    expect(b.intervalles.at(-1)).toBe("2026-10-01");
    expect(b.precedente).toBe("2024-11-01");
  });

  it("découpe dans le fuseau : dimanche 23 h à Paris reste dimanche", () => {
    // Lundi 12 octobre 0 h 30 à Paris = dimanche 11 octobre 22 h 30 UTC.
    const b = bornesPeriode("4s", new Date("2026-10-11T22:30:00.000Z"), PARIS);
    expect(b.intervalles.at(-1)).toBe("2026-10-12");
  });
});

describe("depuisPour", () => {
  it("prend un jour de marge avant la période précédente, en ISO", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    expect(depuisPour(b)).toBe("2026-08-23T00:00:00.000Z");
    expect(requeteTableauDeBord.parse({ depuis: depuisPour(b) })).toBeTruthy();
  });
});

describe("chiffresCles", () => {
  const b = bornesPeriode("4s", MAINTENANT, PARIS);
  it("compte la période et la précédente, en ignorant la marge", () => {
    const c = chiffresCles(
      [
        seance("2026-10-14T17:00:00.000Z", {
          records: [{ slug: "b", nom: "B", types: ["CHARGE"], reps: 5, chargeKg: 100 }],
        }),
        seance("2026-09-22T17:00:00.000Z"),
        seance("2026-09-01T17:00:00.000Z", { volumeKg: 500, seriesFaites: 4 }),
        seance("2026-08-23T17:00:00.000Z"), // la marge : hors des deux périodes
      ],
      b,
      PARIS,
    );
    expect(c.actuelle).toEqual({ seances: 2, volumeKg: 2000, series: 20, records: 1 });
    expect(c.precedente).toEqual({ seances: 1, volumeKg: 500, series: 4, records: 0 });
  });

  it("sans séance dans la période précédente, `precedente` est null", () => {
    const c = chiffresCles([seance("2026-10-14T17:00:00.000Z")], b, PARIS);
    expect(c.precedente).toBeNull();
  });
});

describe("semaineEnCours", () => {
  it("marque les jours entraînés du lundi au dimanche, dans le fuseau", () => {
    const s = semaineEnCours(
      [
        seance("2026-10-12T17:00:00.000Z"),
        seance("2026-10-14T21:30:00.000Z"),
        seance("2026-10-05T17:00:00.000Z"),
      ],
      MAINTENANT,
      PARIS,
    );
    // Mardi 14 octobre 21 h 30 UTC = mercredi 15 à 23 h 30 à Paris.
    expect(s.jours).toEqual([true, false, true, false, false, false, false]);
    expect(s.seances).toBe(2);
  });
});

describe("tendance", () => {
  it("rend chaque intervalle, vides compris", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    const t = tendance(
      [seance("2026-10-14T17:00:00.000Z"), seance("2026-09-22T17:00:00.000Z")],
      b,
      PARIS,
    );
    expect(t).toEqual([
      { debut: "2026-09-21", seances: 1, volumeKg: 1000 },
      { debut: "2026-09-28", seances: 0, volumeKg: 0 },
      { debut: "2026-10-05", seances: 0, volumeKg: 0 },
      { debut: "2026-10-12", seances: 1, volumeKg: 1000 },
    ]);
  });

  it("par mois sur un an", () => {
    const b = bornesPeriode("1a", MAINTENANT, PARIS);
    const t = tendance([seance("2026-10-01T17:00:00.000Z")], b, PARIS);
    expect(t).toHaveLength(12);
    expect(t.at(-1)).toEqual({ debut: "2026-10-01", seances: 1, volumeKg: 1000 });
  });
});

describe("repartitionMuscles", () => {
  it("réunit les muscles de la période", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    const m = repartitionMuscles(
      [
        seance("2026-10-14T17:00:00.000Z"),
        seance("2026-10-13T17:00:00.000Z", {
          muscles: { principaux: ["Quadriceps"], secondaires: ["Fessiers", "Pectoraux"] },
        }),
        seance("2026-09-01T17:00:00.000Z", {
          muscles: { principaux: ["Biceps"], secondaires: [] },
        }), // hors période
      ],
      b,
      PARIS,
    );
    expect(m.principaux).toEqual(["Pectoraux", "Triceps", "Quadriceps"]);
    // Un muscle principal ailleurs n'est pas aussi secondaire.
    expect(m.secondaires).toEqual(["Épaules", "Fessiers"]);
  });
});

describe("recordsRecents", () => {
  it("rend les n derniers records de la période, datés", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    const r1 = { slug: "a", nom: "A", types: ["CHARGE" as const], reps: 5, chargeKg: 100 };
    const r2 = { slug: "b", nom: "B", types: ["REPS" as const], reps: 12, chargeKg: null };
    const r = recordsRecents(
      [
        seance("2026-10-14T17:00:00.000Z", { records: [r1, r2] }),
        seance("2026-09-01T17:00:00.000Z", { records: [r1] }), // hors période
      ],
      b,
      PARIS,
      1,
    );
    expect(r).toEqual([
      { ...r1, date: "2026-10-14T17:00:00.000Z", seanceId: "2026-10-14T17:00:00.000Z" },
    ]);
  });
});
