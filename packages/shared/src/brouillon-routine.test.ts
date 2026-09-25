import { describe, expect, it } from "vitest";
import {
  type Brouillon,
  brouillonValide,
  chargeInvalide,
  empreinte,
  nouvelExercice,
  repsInvalides,
  versBrouillon,
  versSaisie,
} from "./brouillon-routine.js";
import type { RoutineDetail } from "./routines.js";

const routine: RoutineDetail = {
  id: "r1",
  nom: "Push",
  exercices: [
    {
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      image: "https://cdn.example/images/0025.jpg",
      musclePrincipal: "Pectoraux",
      musclesSecondaires: ["Triceps"],
      reposSec: 180,
      series: [
        { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
        { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
      ],
    },
  ],
};

const valide = (b: Brouillon) => brouillonValide(b, "metric");

describe("versBrouillon / versSaisie", () => {
  it("fait l'aller-retour sans rien perdre", () => {
    const b = versBrouillon(routine, "metric");
    expect(b.exercices[0]?.series[1]).toEqual({ type: "NORMALE", reps: "6", charge: "82,5" });
    expect(versSaisie(b, "metric")).toEqual({
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
      ],
    });
  });

  it("part d'une routine vide quand il n'y a rien à modifier", () => {
    expect(versBrouillon(null, "metric")).toEqual({ nom: "", exercices: [] });
  });

  it("rend vide ce qui n'est pas saisi", () => {
    const b = versBrouillon(routine, "metric");
    const e = b.exercices[0];
    if (!e) throw new Error("exercice manquant");
    e.repos = "";
    e.series = [{ type: "NORMALE", reps: "", charge: "" }];
    expect(versSaisie(b, "metric").exercices[0]).toEqual({
      slug: "barbell-bench-press",
      reposSec: null,
      series: [{ type: "NORMALE", repsCible: null, chargeCibleKg: null }],
    });
  });
});

describe("validation", () => {
  it("refuse une charge illisible, des reps ou un repos hors bornes", () => {
    expect(chargeInvalide("82,", "metric")).toBe(true);
    expect(chargeInvalide("82,5", "metric")).toBe(false);
    expect(repsInvalides("1000")).toBe(true);
    expect(repsInvalides("12")).toBe(false);

    const b = versBrouillon(routine, "metric");
    const e = b.exercices[0];
    if (!e) throw new Error("exercice manquant");
    e.repos = "3601";
    expect(valide(b)).toBe(false);
  });

  it("exige un nom et au moins un exercice", () => {
    expect(valide({ nom: "", exercices: [nouvelExercice("a", "A")] })).toBe(false);
    expect(valide({ nom: "Push", exercices: [] })).toBe(false);
    expect(valide({ nom: "Push", exercices: [nouvelExercice("a", "A")] })).toBe(true);
  });
});

describe("nouvelExercice et empreinte", () => {
  it("ajoute trois séries normales vides, et une clé propre à chaque ajout", () => {
    const a = nouvelExercice("pull-up", "Traction", null);
    const b = nouvelExercice("pull-up", "Traction", null);
    expect(a.series).toEqual([
      { type: "NORMALE", reps: "", charge: "" },
      { type: "NORMALE", reps: "", charge: "" },
      { type: "NORMALE", reps: "", charge: "" },
    ]);
    expect(a.cle).not.toBe(b.cle);
  });

  it("ignore les clés locales", () => {
    expect(empreinte(versBrouillon(routine, "metric"))).toBe(
      empreinte(versBrouillon(routine, "metric")),
    );
  });
});
