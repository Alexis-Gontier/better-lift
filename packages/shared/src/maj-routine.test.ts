import { describe, expect, it } from "vitest";
import { majRoutine } from "./maj-routine.js";
import type { RoutineDetail } from "./routines.js";
import {
  ajouterExercice,
  ajouterSerie,
  demarrerDepuisRoutine,
  deplacerExercice,
  lierExercices,
  modifierReposExercice,
  modifierSerie,
  retirerExercice,
  type SeanceEnCours,
  validerSerie,
} from "./seance.js";

const T0 = new Date("2026-10-26T18:00:00.000Z");

const routine: RoutineDetail = {
  id: "r1",
  nom: "Push A",
  note: "Garder les coudes serrés",
  dossierId: "d1",
  exercices: [
    {
      slug: "bench",
      nom: "Développé couché",
      image: null,
      musclePrincipal: "Pectoraux",
      musclesSecondaires: [],
      reposSec: 120,
      series: [
        { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
        { type: "NORMALE", repsCible: 8, chargeCibleKg: 60 },
        { type: "NORMALE", repsCible: 8, chargeCibleKg: 60 },
      ],
    },
    {
      slug: "curl",
      nom: "Curl",
      image: null,
      musclePrincipal: "Biceps",
      musclesSecondaires: [],
      reposSec: null,
      series: [{ type: "NORMALE", repsCible: 12, chargeCibleKg: 10 }],
    },
  ],
};

const depart = () => demarrerDepuisRoutine(routine, "s1", T0);

/** Valide toutes les séries telles qu'elles sont. */
const toutValider = (s: SeanceEnCours) =>
  s.exercices.reduce(
    (acc, e, iE) => e.series.reduce((a, _, iS) => validerSerie(a, iE, iS, T0, null), acc),
    s,
  );

describe("majRoutine", () => {
  it("ne propose rien quand la séance a suivi la routine", () => {
    expect(majRoutine(routine, depart(), "metric")).toBeNull();
    expect(majRoutine(routine, toutValider(depart()), "metric")).toBeNull();
  });

  it("reprend les valeurs des séries faites, et dit l'écart de charge", () => {
    let s = modifierSerie(depart(), 0, 1, { chargeKg: 62.5 });
    s = modifierSerie(s, 0, 2, { chargeKg: 62.5, reps: 7 });
    s = toutValider(s);
    const maj = majRoutine(routine, s, "metric");
    expect(maj?.saisie.exercices[0]?.series).toEqual([
      { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
      { type: "NORMALE", repsCible: 8, chargeCibleKg: 62.5 },
      { type: "NORMALE", repsCible: 7, chargeCibleKg: 62.5 },
    ]);
    expect(maj?.changements).toEqual(["Développé couché : 60 kg → 62,5 kg, répétitions"]);
  });

  it("garde la cible d'une série non cochée, même tapée", () => {
    const s = modifierSerie(depart(), 1, 0, { chargeKg: 12 });
    expect(majRoutine(routine, s, "metric")).toBeNull();
  });

  it("garde le nom, et n'envoie ni note ni dossier (D298)", () => {
    const s = toutValider(modifierSerie(depart(), 1, 0, { reps: 15 }));
    const maj = majRoutine(routine, s, "metric");
    expect(maj?.saisie.nom).toBe("Push A");
    expect(maj?.saisie).not.toHaveProperty("note");
    expect(maj?.saisie).not.toHaveProperty("dossierId");
    expect(maj?.changements).toEqual(["Curl : 12 → 15 rép."]);
  });

  it("reprend la structure : séries, exercices, ordre, repos, supersets", () => {
    let s = ajouterSerie(depart(), 1);
    s = modifierReposExercice(s, 0, 90);
    s = ajouterExercice(s, "dips", "Dips");
    s = modifierSerie(s, 2, 0, { reps: 10 });
    s = toutValider(s);
    const maj = majRoutine(routine, s, "metric");
    expect(maj?.saisie.exercices.map((e) => e.slug)).toEqual(["bench", "curl", "dips"]);
    expect(maj?.saisie.exercices[1]?.series).toHaveLength(2);
    expect(maj?.saisie.exercices[0]?.reposSec).toBe(90);
    expect(maj?.changements).toEqual(["+ Dips", "Développé couché : repos", "Curl : 1 → 2 séries"]);

    const reordonnee = toutValider(deplacerExercice(depart(), 1, 0));
    expect(majRoutine(routine, reordonnee, "metric")?.changements).toEqual(["Ordre des exercices"]);

    const liee = lierExercices(depart(), 0);
    expect(majRoutine(routine, liee, "metric")?.changements).toEqual(["Supersets"]);
  });

  it("retire un exercice retiré de la séance", () => {
    const maj = majRoutine(routine, retirerExercice(depart(), 1), "metric");
    expect(maj?.saisie.exercices.map((e) => e.slug)).toEqual(["bench"]);
    expect(maj?.changements).toEqual(["− Curl"]);
  });

  it("ne propose rien qui ne passerait pas le contrat", () => {
    // Un exercice sans série serait refusé : il est laissé hors de la routine.
    let s = ajouterExercice(depart(), "dips", "Dips");
    s = { ...s, exercices: s.exercices.map((e, i) => (i === 2 ? { ...e, series: [] } : e)) };
    expect(majRoutine(routine, s, "metric")).toBeNull();
    // Une routine vidée ne se propose pas.
    const vide = retirerExercice(retirerExercice(depart(), 1), 0);
    expect(majRoutine(routine, vide, "metric")).toBeNull();
  });
});
