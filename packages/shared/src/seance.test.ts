import { describe, expect, it } from "vitest";
import type { RoutineDetail } from "./routines.js";
import {
  ajouterExercice,
  ajouterSerie,
  ajusterRepos,
  arreterRepos,
  avecPrecedents,
  bilanSeance,
  demarrerDepuisRoutine,
  demarrerVide,
  deplacerExercice,
  marquerReposSignale,
  modifierNote,
  modifierReposExercice,
  modifierSerie,
  prochaineSerie,
  remplacerExercice,
  reposRestant,
  retirerExercice,
  retirerSerie,
  seanceSaisie,
  secondesEcoulees,
  validerSerie,
  versEnvoi,
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
      image: null,
      musclePrincipal: "Pectoraux",
      musclesSecondaires: ["Triceps"],
      reposSec: 120,
      series: [
        { type: "ECHAUFFEMENT", repsCible: 10, chargeCibleKg: 40 },
        { type: "NORMALE", repsCible: 6, chargeCibleKg: 82.5 },
      ],
    },
    {
      slug: "pull-up",
      nom: "Traction",
      image: null,
      musclePrincipal: "Grand dorsal",
      musclesSecondaires: ["Biceps"],
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
      // Recopiées, ses valeurs restent des cibles : rien n'y est saisi.
      saisi: {},
    });
  });

  it("marque saisi chaque champ modifié, pour lui seul, et jamais le type", () => {
    expect(s.exercices[0]?.series[1]?.saisi).toBeUndefined();
    const reps = modifierSerie(s, 0, 1, { reps: 5 });
    expect(reps.exercices[0]?.series[1]?.saisi).toEqual({ reps: true });
    const lesDeux = modifierSerie(reps, 0, 1, { chargeKg: null });
    expect(lesDeux.exercices[0]?.series[1]?.saisi).toEqual({ reps: true, chargeKg: true });
    expect(
      modifierSerie(s, 0, 1, { type: "ECHEC" }).exercices[0]?.series[1]?.saisi,
    ).toBeUndefined();
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

describe("bilanSeance", () => {
  // D5 : ni l'échauffement ni le poids du corps (charge absente) n'entrent dans
  // le volume. Seules les séries FAITES comptent.
  it("compte les séries faites et leur volume, sans échauffement ni série sans charge", () => {
    let s = demarrerDepuisRoutine(routine, "s1", T0);
    s = validerSerie(s, 0, 0, T0); // échauffement 10 × 40 : compté comme faite, pas dans le volume
    s = validerSerie(s, 0, 1, T0); // 6 × 82,5 = 495
    s = validerSerie(s, 1, 0, T0); // traction sans charge : faite, volume nul
    expect(bilanSeance(s)).toEqual({ seriesFaites: 3, volumeKg: 495 });
  });
});

describe("versEnvoi et seanceSaisie", () => {
  const fin = plus(3600);
  const envoi = () =>
    versEnvoi(validerSerie(demarrerDepuisRoutine(routine, "s1", T0), 0, 1, T0), fin);

  it("n'envoie pas le marquage local des champs saisis", () => {
    const saisie = modifierSerie(demarrerDepuisRoutine(routine, "s1", T0), 0, 1, { reps: 7 });
    expect(versEnvoi(saisie, fin).exercices[0]?.series[1]).not.toHaveProperty("saisi");
  });

  it("recopie la séance, ordre et valeurs compris, en dates ISO", () => {
    const e = envoi();
    expect(e).toMatchObject({
      id: "s1",
      routineId: "r1",
      nom: "Push",
      debut: T0.toISOString(),
      fin: fin.toISOString(),
    });
    expect(e.exercices.map((x) => x.slug)).toEqual(["barbell-bench-press", "pull-up"]);
    expect(e.exercices[0]?.series[1]).toEqual({
      type: "NORMALE",
      reps: 6,
      chargeKg: 82.5,
      faite: true,
    });
    expect(seanceSaisie.parse(e)).toEqual(e);
  });

  // D57 : perdre un entraînement réel envoyé par la file est pire qu'accepter
  // un champ ignoré. Une version plus récente du mobile peut en ajouter.
  it("tolère les champs inconnus, à tous les niveaux", () => {
    const e = envoi() as Record<string, unknown> & ReturnType<typeof envoi>;
    const avecExtras = {
      ...e,
      appareil: "pixel",
      exercices: e.exercices.map((x) => ({
        ...x,
        note: "x",
        series: x.series.map((s) => ({ ...s, rpe: 8 })),
      })),
    };
    expect(() => seanceSaisie.parse(avecExtras)).not.toThrow();
  });

  it("accepte une séance sans série faite, et une séance vide", () => {
    expect(() => seanceSaisie.parse(versEnvoi(demarrerVide("s2", T0), fin))).not.toThrow();
  });

  it("refuse une fin antérieure au début, et une date illisible", () => {
    expect(() => seanceSaisie.parse({ ...envoi(), fin: plus(-60).toISOString() })).toThrow();
    expect(() => seanceSaisie.parse({ ...envoi(), debut: "hier" })).toThrow();
  });

  it("refuse des valeurs hors bornes", () => {
    const e = envoi();
    const serie = (s: object) => ({
      ...e,
      exercices: [{ ...e.exercices[0], series: [{ ...e.exercices[0]?.series[0], ...s }] }],
    });
    expect(() => seanceSaisie.parse(serie({ reps: -1 }))).toThrow();
    expect(() => seanceSaisie.parse(serie({ chargeKg: 1001 }))).toThrow();
    expect(() => seanceSaisie.parse(serie({ type: "SUPER" }))).toThrow();
  });
});

describe("avecPrecedents", () => {
  const s = demarrerDepuisRoutine(routine, "s1", T0);

  // D67 : copiées DANS le brouillon, elles survivent hors ligne et à un arrêt forcé.
  it("attache à chaque exercice les séries de la dernière fois", () => {
    const avec = avecPrecedents(s, {
      "barbell-bench-press": [{ reps: 6, chargeKg: 80, faite: true }],
      "pull-up": [],
    });
    expect(avec.exercices[0]?.precedent).toEqual([{ reps: 6, chargeKg: 80, faite: true }]);
    // Aucune séance passée : pas d'indication, plutôt qu'une liste vide.
    expect(avec.exercices[1]?.precedent).toBeUndefined();
  });

  it("ne touche ni aux cibles ni à la séance d'origine (D59)", () => {
    const avec = avecPrecedents(s, {
      "barbell-bench-press": [{ reps: 6, chargeKg: 80, faite: true }],
    });
    expect(avec.exercices[0]?.series).toEqual(s.exercices[0]?.series);
    expect(s.exercices[0]?.precedent).toBeUndefined();
  });

  it("n'est jamais envoyé au serveur", () => {
    const avec = avecPrecedents(s, {
      "barbell-bench-press": [{ reps: 6, chargeKg: 80, faite: true }],
    });
    expect(JSON.stringify(versEnvoi(avec, T0))).not.toContain("precedent");
  });
});

describe("ajusterRepos", () => {
  const maintenant = new Date(T0.getTime() + 60_000);
  const enRepos = (restantSec: number, signale = false) => ({
    ...demarrerVide("s", T0),
    repos: { fin: new Date(maintenant.getTime() + restantSec * 1000).toISOString(), signale },
  });

  it("repousse ou avance la fin du repos", () => {
    expect(reposRestant(ajusterRepos(enRepos(60), 15, maintenant), maintenant)).toBe(75);
    expect(reposRestant(ajusterRepos(enRepos(60), -15, maintenant), maintenant)).toBe(45);
  });

  it("ne descend jamais sous zéro : le repos s'achève maintenant", () => {
    expect(reposRestant(ajusterRepos(enRepos(10), -15, maintenant), maintenant)).toBe(0);
  });

  it("rallonger un repos déjà annoncé le fera vibrer de nouveau", () => {
    const s = ajusterRepos(enRepos(0, true), 15, maintenant);
    expect(s.repos?.signale).toBe(false);
  });

  it("sans repos en cours, ne fait rien", () => {
    const s = demarrerVide("s", T0);
    expect(ajusterRepos(s, 15, maintenant)).toBe(s);
  });
});

describe("la carte d'exercice (D89–D92)", () => {
  const depart = () => demarrerDepuisRoutine(routine, "s", T0);

  it("écrit une note, et une note vide redevient null", () => {
    const s = modifierNote(depart(), 0, "Siège cran 4");
    expect(s.exercices[0]?.note).toBe("Siège cran 4");
    expect(modifierNote(s, 0, "   ").exercices[0]?.note).toBeNull();
  });

  it("règle le repos d'un exercice, ou le désactive", () => {
    expect(modifierReposExercice(depart(), 1, 90).exercices[1]?.reposSec).toBe(90);
    expect(modifierReposExercice(depart(), 0, null).exercices[0]?.reposSec).toBeNull();
  });

  it("déplace un exercice, sans toucher à l'original", () => {
    const s = depart();
    const apres = deplacerExercice(s, 0, 1);
    expect(apres.exercices.map((e) => e.slug)).toEqual(["pull-up", "barbell-bench-press"]);
    expect(s.exercices.map((e) => e.slug)).toEqual(["barbell-bench-press", "pull-up"]);
    expect(deplacerExercice(s, 0, 5)).toBe(s);
  });

  it("remplace un exercice : mêmes séries et même repos, valeurs, note et précédent vidés", () => {
    const s = modifierNote(
      avecPrecedents(validerSerie(depart(), 0, 1, T0), {
        "barbell-bench-press": [{ reps: 5, chargeKg: 80, faite: true }],
      }),
      0,
      "prise serrée",
    );
    const e = remplacerExercice(s, 0, "dumbbell-bench-press", "Développé couché haltères")
      .exercices[0];
    expect(e).toEqual({
      slug: "dumbbell-bench-press",
      nom: "Développé couché haltères",
      reposSec: 120,
      note: null,
      series: [
        { type: "ECHAUFFEMENT", reps: null, chargeKg: null, faite: false },
        { type: "NORMALE", reps: null, chargeKg: null, faite: false },
      ],
    });
  });

  it("envoie la note, null quand il n'y en a pas — un vieux brouillon n'en a pas", () => {
    const s = modifierNote(depart(), 0, "prise serrée");
    const e = versEnvoi(s, plus(60));
    expect(e.exercices.map((x) => x.note)).toEqual(["prise serrée", null]);
    expect(seanceSaisie.parse(e)).toEqual(e);
  });

  it("refuse une note trop longue, accepte un envoi sans note (vieux mobile, D57)", () => {
    const e = versEnvoi(depart(), plus(60));
    const longue = { ...e, exercices: [{ ...e.exercices[0], note: "x".repeat(501) }] };
    expect(() => seanceSaisie.parse(longue)).toThrow();
    const sansNote = { ...e, exercices: e.exercices.map(({ note: _, ...x }) => x) };
    expect(() => seanceSaisie.parse(sansNote)).not.toThrow();
  });
});

describe("prochaineSerie (D116)", () => {
  // Le repère de la ligne à faire : la série qui suit la dernière faite, dans
  // l'ordre des exercices puis des séries.
  it("désigne la première série non faite, dans l'ordre", () => {
    let s = demarrerDepuisRoutine(routine, "s1", T0);
    expect(prochaineSerie(s)).toEqual({ iE: 0, iS: 0 });
    s = validerSerie(s, 0, 0, T0);
    expect(prochaineSerie(s)).toEqual({ iE: 0, iS: 1 });
    s = validerSerie(s, 0, 1, T0);
    expect(prochaineSerie(s)).toEqual({ iE: 1, iS: 0 });
  });

  it("avance après la dernière série faite, sans revenir sur une série sautée", () => {
    let s = demarrerDepuisRoutine(routine, "s1", T0);
    s = validerSerie(s, 0, 1, T0);
    expect(prochaineSerie(s)).toEqual({ iE: 1, iS: 0 });
  });

  it("revient à la première série restante quand plus rien ne suit la dernière faite", () => {
    let s = demarrerDepuisRoutine(routine, "s1", T0);
    s = validerSerie(validerSerie(s, 0, 1, T0), 1, 0, T0);
    expect(prochaineSerie(s)).toEqual({ iE: 0, iS: 0 });
  });

  it("ne désigne rien quand tout est fait, ou qu'il n'y a pas de série", () => {
    let s = demarrerDepuisRoutine(routine, "s1", T0);
    s = validerSerie(validerSerie(validerSerie(s, 0, 0, T0), 0, 1, T0), 1, 0, T0);
    expect(prochaineSerie(s)).toBeNull();
    expect(prochaineSerie(demarrerVide("s2", T0))).toBeNull();
  });
});
