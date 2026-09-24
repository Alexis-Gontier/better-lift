import type { RoutineSaisie } from "@better-lift/shared";
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
  exercices: [
    {
      reposSec: 180,
      exercise: { slug: "barbell-bench-press", nomFr: "Développé couché à la barre" },
      series: [
        { type: "NORMALE", repsCible: 6, chargeCibleKg: decimal(82.5) },
        { type: "ECHEC", repsCible: null, chargeCibleKg: null },
      ],
    },
  ],
};

describe("projections", () => {
  it("rend le détail avec le nom français et des charges en nombres", () => {
    expect(versDetail(ligne)).toEqual({
      id: "r1",
      nom: "Push",
      exercices: [
        {
          slug: "barbell-bench-press",
          nom: "Développé couché à la barre",
          reposSec: 180,
          series: [
            { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
            { type: "ECHEC", repsCible: null, chargeCibleKg: null },
          ],
        },
      ],
    });
  });

  it("résume en comptant exercices et séries", () => {
    expect(versResume(ligne)).toEqual({ id: "r1", nom: "Push", nbExercices: 1, nbSeries: 2 });
  });
});
