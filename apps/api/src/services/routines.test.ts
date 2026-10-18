import { dureeEstimeeSec, type RoutineSaisie } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import {
  type LigneRoutine,
  SlugInconnu,
  versDetail,
  versEcriture,
  versResume,
} from "./routines.js";

const saisie: RoutineSaisie = {
  nom: "Push",
  exercices: [
    {
      slug: "barbell-bench-press",
      reposSec: 180,
      series: [
        { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
        { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
      ],
    },
    {
      slug: "pull-up",
      reposSec: null,
      series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: null }],
    },
    // Le même exercice deux fois : c'est permis.
    {
      slug: "barbell-bench-press",
      reposSec: null,
      series: [{ type: "ECHEC", repsCible: null, chargeCibleKg: 60 }],
    },
  ],
};

const ids = new Map([
  ["barbell-bench-press", "ex-1"],
  ["pull-up", "ex-2"],
]);

describe("versEcriture", () => {
  // L'ordre du tableau EST la position : c'est le seul endroit où elle naît.
  it("déduit les positions de l'ordre de la saisie", () => {
    const ecriture = versEcriture(saisie, ids);
    expect(ecriture.exercices.map((e) => [e.position, e.exerciseId])).toEqual([
      [0, "ex-1"],
      [1, "ex-2"],
      [2, "ex-1"],
    ]);
    expect(ecriture.exercices[0]?.series.map((s) => s.position)).toEqual([0, 1]);
  });

  it("recopie les cibles, absentes comprises", () => {
    const ecriture = versEcriture(saisie, ids);
    expect(ecriture.exercices[0]?.series[1]).toEqual({
      position: 1,
      type: "NORMALE",
      repsCible: 6,
      chargeCibleKg: 82.5,
    });
    expect(ecriture.exercices[1]?.reposSec).toBeNull();
  });

  it("refuse un slug absent du catalogue, en le nommant", () => {
    const sansTraction = new Map([["barbell-bench-press", "ex-1"]]);
    expect(() => versEcriture(saisie, sansTraction)).toThrow(SlugInconnu);
    expect(() => versEcriture(saisie, sansTraction)).toThrow(/pull-up/);
  });
});

// Prisma rend `chargeCibleKg` en `Decimal` : un objet, pas un nombre.
const decimal = (n: number) => ({ toString: () => String(n) });

const ligne: LigneRoutine = {
  id: "r1",
  nom: "Push",
  note: null,
  dossierId: null,
  seances: [],
  exercices: [
    {
      reposSec: 180,
      supersetGroupe: null,
      exercise: {
        slug: "barbell-bench-press",
        nomFr: "Développé couché à la barre",
        gifUrl: "https://cdn.example/videos/0025.gif",
        target: "Pectoraux",
        secondary: ["Triceps", "Épaules"],
      },
      series: [
        { type: "NORMALE", repsCible: 6, chargeCibleKg: decimal(82.5) },
        { type: "ECHEC", repsCible: null, chargeCibleKg: null },
      ],
    },
  ],
};

describe("projections", () => {
  it("rend le détail avec le nom français, l'image, les muscles et des charges en nombres", () => {
    expect(versDetail(ligne)).toEqual({
      id: "r1",
      nom: "Push",
      note: null,
      dossierId: null,
      exercices: [
        {
          slug: "barbell-bench-press",
          nom: "Développé couché à la barre",
          image: "https://cdn.example/images/0025.jpg",
          musclePrincipal: "Pectoraux",
          musclesSecondaires: ["Triceps", "Épaules"],
          reposSec: 180,
          supersetGroupe: null,
          series: [
            { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
            { type: "ECHEC", repsCible: null, chargeCibleKg: null },
          ],
        },
      ],
    });
  });

  it("résume en comptant exercices et séries", () => {
    expect(versResume(ligne)).toEqual({
      id: "r1",
      nom: "Push",
      nbExercices: 1,
      nbSeries: 2,
      dossierId: null,
      derniereSeance: null,
      exercices: [{ nom: "Développé couché à la barre", musclePrincipal: "Pectoraux" }],
      // Deux séries et le repos de 180 s qui les sépare : le calcul de shared.
      dureeEstimeeSec: dureeEstimeeSec([{ reposSec: 180, series: [1, 2] }]),
    });
  });
});

describe("supersets (D146)", () => {
  it("versEcriture normalise les groupes", () => {
    const s: RoutineSaisie = {
      ...saisie,
      exercices: saisie.exercices.map((e, i) => ({ ...e, supersetGroupe: i < 2 ? 7 : 3 })),
    };
    expect(versEcriture(s, ids).exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
  });

  it("versEcriture : champ absent = null", () => {
    expect(versEcriture(saisie, ids).exercices.map((e) => e.supersetGroupe)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("versDetail rend le groupe", () => {
    const l = { ...ligne, exercices: ligne.exercices.map((e) => ({ ...e, supersetGroupe: 1 })) };
    expect(versDetail(l).exercices[0]?.supersetGroupe).toBe(1);
  });
});

describe("note, dossier, dernière séance (D296, D310)", () => {
  it("versEcriture garde l'absence : rien à écrire (D298)", () => {
    const e = versEcriture(saisie, ids);
    expect("note" in e).toBe(false);
    expect("dossierId" in e).toBe(false);
  });

  it("versEcriture recopie note et dossier quand ils sont donnés, null compris", () => {
    expect(versEcriture({ ...saisie, note: null, dossierId: "d1" }, ids)).toMatchObject({
      note: null,
      dossierId: "d1",
    });
  });

  it("versDetail et versResume rendent note, dossier et la dernière séance en ISO", () => {
    const l = {
      ...ligne,
      note: "Lent",
      dossierId: "d1",
      seances: [{ debut: new Date("2026-10-10T08:00:00Z") }],
    };
    expect(versDetail(l)).toMatchObject({ note: "Lent", dossierId: "d1" });
    expect(versResume(l)).toMatchObject({
      dossierId: "d1",
      derniereSeance: "2026-10-10T08:00:00.000Z",
    });
  });
});
