import type { Brouillon, RoutineResume, SeanceResume } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import {
  minutesEstimees,
  musclesRoutine,
  nomLibre,
  parDossier,
  seriesPrevues,
  statsRoutine,
  tendance,
  volumePrevu,
} from "./stats";

const brouillon: Brouillon = {
  nom: "Push",
  note: "",
  dossierId: null,
  exercices: [
    {
      cle: "a",
      slug: "a",
      nom: "A",
      image: null,
      repos: "90",
      supersetGroupe: null,
      series: [
        { type: "ECHAUFFEMENT", reps: "15", charge: "20" },
        { type: "NORMALE", reps: "10", charge: "82,5" },
        { type: "NORMALE", reps: "", charge: "" },
      ],
    },
  ],
};

describe("brouillon en chiffres", () => {
  it("volume prévu : charge × répétitions des séries notées", () => {
    expect(volumePrevu(brouillon)).toBe(15 * 20 + 10 * 82.5);
  });

  it("séries prévues hors échauffement", () => {
    expect(seriesPrevues(brouillon)).toBe(2);
  });

  it("durée estimée par shared, arrondie aux 5 minutes supérieures", () => {
    const m = minutesEstimees(brouillon);
    expect(m % 5).toBe(0);
    expect(m).toBeGreaterThan(0);
  });
});

describe("musclesRoutine", () => {
  it("ne colore en secondaire que ce qui n'est pas déjà principal", () => {
    expect(
      musclesRoutine([
        { musclePrincipal: "Pectoraux", musclesSecondaires: ["Triceps", "Épaules"] },
        { musclePrincipal: "Épaules", musclesSecondaires: ["Triceps"] },
      ]),
    ).toEqual({ primary: ["Pectoraux", "Épaules"], secondary: ["Triceps"] });
  });
});

const routine = (id: string, dossierId: string | null): RoutineResume => ({
  id,
  nom: id,
  nbExercices: 1,
  nbSeries: 1,
  dossierId,
  derniereSeance: null,
  exercices: [],
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

  it("trouve un nom de dossier libre", () => {
    expect(nomLibre("Nouveau dossier", ["Nouveau dossier", "Nouveau dossier 2"])).toBe(
      "Nouveau dossier 3",
    );
  });
});

const seance = (
  debut: string,
  minutes: number,
  volumeKg: number,
  extra: Partial<SeanceResume> = {},
): SeanceResume => ({
  id: debut,
  nom: "Push",
  routineId: "r1",
  debut,
  fin: new Date(Date.parse(debut) + minutes * 60_000).toISOString(),
  seriesFaites: 2,
  volumeKg,
  nbRecords: 0,
  ...extra,
});

describe("statsRoutine (D311)", () => {
  it("rien sans séance dans la fenêtre", () => {
    expect(
      statsRoutine(2, [seance("2026-01-01T10:00:00.000Z", 60, 1000)], "2026-07-01"),
    ).toBeNull();
  });

  it("moyennes, records, tendance et réalisation plafonnée à 1", () => {
    const s = statsRoutine(
      2,
      [
        seance("2026-10-08T10:00:00.000Z", 50, 1200, { nbRecords: 2, seriesFaites: 3 }),
        seance("2026-10-01T10:00:00.000Z", 70, 1000, { seriesFaites: 1 }),
      ],
      "2026-07-01",
    );
    expect(s).toEqual({
      nb: 2,
      volumeMoyen: 1100,
      tendanceVolume: 20,
      dureeMoyenneMin: 60,
      records: 2,
      realisation: 0.75,
    });
  });

  it("tendance : rien sous deux valeurs utiles", () => {
    expect(tendance([0, 500])).toBeNull();
  });
});
