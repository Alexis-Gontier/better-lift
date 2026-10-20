import { describe, expect, it } from "vitest";
import {
  dureeRoutine,
  ilYa,
  joursEcoules,
  musclesRoutine,
  parDossier,
  resumeSeries,
  type SerieChiffree,
} from "./liste-routines.js";
import type { RoutineResume } from "./routines.js";

const routine = (id: string, dossierId: string | null, muscles: string[] = []): RoutineResume => ({
  id,
  nom: id,
  nbExercices: muscles.length,
  nbSeries: 1,
  dossierId,
  derniereSeance: null,
  exercices: muscles.map((m, i) => ({ nom: `e${i}`, musclePrincipal: m })),
  dureeEstimeeSec: 0,
});

describe("parDossier", () => {
  it("range dans l'ordre des dossiers, « Sans dossier » en dernier", () => {
    const g = parDossier(
      [routine("r1", null), routine("r2", "d2"), routine("r3", "inconnu")],
      [
        { id: "d1", nom: "PPL" },
        { id: "d2", nom: "Full body" },
      ],
    );
    expect(g.map((x) => [x.dossier?.nom ?? null, x.routines.map((r) => r.id)])).toEqual([
      ["PPL", []],
      ["Full body", ["r2"]],
      [null, ["r1", "r3"]],
    ]);
  });

  it("n'affiche pas « Sans dossier » quand tout est rangé", () => {
    expect(parDossier([routine("r1", "d1")], [{ id: "d1", nom: "PPL" }])).toHaveLength(1);
  });
});

describe("musclesRoutine", () => {
  it("garde l'ordre des exercices, sans doublon ni vide", () => {
    expect(
      musclesRoutine(routine("r", null, ["Pectoraux", "Triceps", "Pectoraux", "", "Deltoïdes"])),
    ).toEqual(["Pectoraux", "Triceps", "Deltoïdes"]);
  });
});

describe("dureeRoutine", () => {
  it("arrondit aux 5 minutes supérieures", () => {
    expect(dureeRoutine(26 * 60)).toBe("~30 min");
    expect(dureeRoutine(30 * 60)).toBe("~30 min");
  });

  it("passe en heures au-delà de 60 minutes", () => {
    expect(dureeRoutine(62 * 60)).toBe("~1 h 05");
  });

  it("ne descend jamais sous 5 minutes", () => {
    expect(dureeRoutine(0)).toBe("~5 min");
  });
});

describe("joursEcoules", () => {
  const maintenant = new Date("2026-10-18T10:00:00Z");

  it("découpe les jours dans le fuseau, jamais en UTC", () => {
    // 23 h 30 à Paris le 17 : déjà la veille, même si l'UTC dit encore le 17 à 21 h 30.
    expect(joursEcoules("2026-10-17T21:30:00Z", "Europe/Paris", maintenant)).toBe(1);
    // 0 h 30 à Paris le 18 : aujourd'hui, alors que l'UTC dit encore le 17.
    expect(joursEcoules("2026-10-17T22:30:00Z", "Europe/Paris", maintenant)).toBe(0);
  });

  it("compte les jours civils", () => {
    expect(joursEcoules("2026-10-01T12:00:00Z", "Europe/Paris", maintenant)).toBe(17);
  });
});

describe("ilYa", () => {
  it("dit quand une routine a été faite", () => {
    expect(ilYa(null)).toBe("Jamais faite");
    expect(ilYa(0)).toBe("Aujourd'hui");
    expect(ilYa(1)).toBe("Hier");
    expect(ilYa(17)).toBe("Il y a 17 j");
  });
});

const n = (reps: number | null, kg: number | null): SerieChiffree => ({
  type: "NORMALE",
  reps,
  kg,
});
const e = (reps: number | null, kg: number | null): SerieChiffree => ({
  type: "ECHAUFFEMENT",
  reps,
  kg,
});

describe("resumeSeries", () => {
  it("résume des séries identiques", () => {
    expect(resumeSeries([n(12, 10), n(12, 10)], "metric")).toBe("2 × 12 · 10 kg");
  });

  it("donne des plages quand les séries varient", () => {
    expect(resumeSeries([n(10, 8), n(12, 10.5)], "metric")).toBe("2 × 10–12 · 8–10,5 kg");
  });

  it("met les échauffements devant, avec l'abréviation demandée", () => {
    const series = [e(10, 40), n(8, 80), n(8, 80), n(8, 80)];
    expect(resumeSeries(series, "metric")).toBe("1 É + 3 × 8 · 80 kg");
    expect(resumeSeries(series, "metric", "W")).toBe("1 W + 3 × 8 · 80 kg");
  });

  it("résume ce qui est noté, sans cible inventée", () => {
    expect(resumeSeries([n(null, null), n(null, null), n(null, null)], "metric")).toBe("3 séries");
    expect(resumeSeries([e(10, 20), e(10, 30)], "metric")).toBe("2 É");
    expect(resumeSeries([], "metric")).toBe("Aucune série");
  });
});
