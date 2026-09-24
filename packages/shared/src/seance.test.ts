import { describe, expect, it } from "vitest";
import type { RoutineDetail } from "./routines.js";
import {
  ajouterExercice,
  ajouterSerie,
  arreterRepos,
  demarrerDepuisRoutine,
  demarrerVide,
  marquerReposSignale,
  modifierSerie,
  reposRestant,
  retirerExercice,
  retirerSerie,
  secondesEcoulees,
  validerSerie,
} from "./seance.js";

const T0 = new Date("2026-09-24T18:00:00.000Z");
const plus = (sec: number) => new Date(T0.getTime() + sec * 1000);

const routine: RoutineDetail = {
  id: "r1",
  nom: "Push",
  exercices: [
    {
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      reposSec: 120,
      series: [
        { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
        { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
      ],
    },
    {
      slug: "pull-up",
      nom: "Traction",
      reposSec: null,
      series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: null }],
    },
  ],
};

describe("démarrer", () => {
  it("recopie la routine, cibles comprises, séries non faites (D59)", () => {
    const s = demarrerDepuisRoutine(routine, "s1", T0);
    expect(s).toMatchObject({
      id: "s1",
      routineId: "r1",
      nom: "Push",
      debut: T0.toISOString(),
      repos: null,
    });
    expect(s.exercices[0]?.series[1]).toEqual({
      type: "NORMALE",
      reps: 6,
      chargeKg: 82.5,
      faite: false,
    });
    expect(s.exercices[1]?.reposSec).toBeNull();
  });

  it("une séance vide n'a ni routine ni exercice", () => {
    expect(demarrerVide("s2", T0)).toEqual({
      id: "s2",
      routineId: null,
      nom: "Séance libre",
      debut: T0.toISOString(),
      exercices: [],
      repos: null,
    });
  });
});

describe("valider une série", () => {
  const s = demarrerDepuisRoutine(routine, "s1", T0);

  it("la coche et lance le repos de l'exercice", () => {
    const apres = validerSerie(s, 0, 0, plus(30));
    expect(apres.exercices[0]?.series[0]?.faite).toBe(true);
    expect(apres.repos).toEqual({ fin: plus(150).toISOString(), signale: false });
  });

  it("ne lance aucun repos quand l'exercice n'en a pas", () => {
    expect(validerSerie(s, 1, 0, plus(30)).repos).toBeNull();
  });

  it("décocher une série faite n'arme pas de repos", () => {
    const faite = validerSerie(s, 0, 0, plus(30));
    const defaite = validerSerie(faite, 0, 0, plus(40));
    expect(defaite.exercices[0]?.series[0]?.faite).toBe(false);
    expect(defaite.repos).toEqual(faite.repos);
  });

  // L'état est réécrit sur disque à chaque changement : une mutation en place
  // rendrait la comparaison « avant / après » impossible, et React ne verrait rien.
  it("ne modifie jamais la séance d'origine", () => {
    validerSerie(s, 0, 0, plus(30));
    expect(s.exercices[0]?.series[0]?.faite).toBe(false);
    expect(s.repos).toBeNull();
  });
});

describe("le temps, toujours depuis une heure stockée", () => {
  it("le chrono se déduit du début", () => {
    expect(secondesEcoulees(T0.toISOString(), plus(204))).toBe(204);
  });

  it("le repos décroît, puis disparaît une fois passé", () => {
    const s = validerSerie(demarrerDepuisRoutine(routine, "s1", T0), 0, 0, T0);
    expect(reposRestant(s, plus(20))).toBe(100);
    expect(reposRestant(s, plus(120))).toBe(0);
    expect(reposRestant(s, plus(125))).toBeNull();
    expect(reposRestant(arreterRepos(s), plus(20))).toBeNull();
  });

  it("mémorise que la fin du repos a été signalée", () => {
    const s = validerSerie(demarrerDepuisRoutine(routine, "s1", T0), 0, 0, T0);
    expect(marquerReposSignale(s).repos?.signale).toBe(true);
  });
});

describe("modifier la séance", () => {
  const s = demarrerDepuisRoutine(routine, "s1", T0);

  it("modifie reps et charge d'une série", () => {
    expect(modifierSerie(s, 0, 1, { reps: 5, chargeKg: 85 }).exercices[0]?.series[1]).toMatchObject(
      {
        reps: 5,
        chargeKg: 85,
      },
    );
  });

  it("ajoute une série qui recopie la dernière, non faite", () => {
    const faite = validerSerie(s, 0, 1, T0);
    const plusUne = ajouterSerie(faite, 0);
    expect(plusUne.exercices[0]?.series).toHaveLength(3);
    expect(plusUne.exercices[0]?.series[2]).toEqual({
      type: "NORMALE",
      reps: 6,
      chargeKg: 82.5,
      faite: false,
    });
  });

  it("retire une série et un exercice", () => {
    expect(retirerSerie(s, 0, 0).exercices[0]?.series).toHaveLength(1);
    expect(retirerExercice(s, 0).exercices.map((e) => e.slug)).toEqual(["pull-up"]);
  });

  it("ajoute un exercice avec trois séries normales vides", () => {
    const e = ajouterExercice(s, "barbell-curl", "Curl à la barre").exercices.at(-1);
    expect(e).toMatchObject({ slug: "barbell-curl", reposSec: null });
    expect(e?.series).toHaveLength(3);
    expect(e?.series[0]).toEqual({ type: "NORMALE", reps: null, chargeKg: null, faite: false });
  });
});
