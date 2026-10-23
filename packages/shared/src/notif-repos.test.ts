import { describe, expect, it } from "vitest";
import { formaterCharge } from "./charge.js";
import { appliquerActionRepos, contenuNotifRepos } from "./notif-repos.js";
import type { ExerciceEnCours, SeanceEnCours } from "./seance.js";

const T0 = new Date("2026-10-23T18:00:00.000Z");
const plus = (sec: number) => new Date(T0.getTime() + sec * 1000);

function exercice(nom: string, e: Partial<ExerciceEnCours> = {}): ExerciceEnCours {
  return {
    slug: nom.toLowerCase(),
    nom,
    reposSec: 90,
    series: [
      { type: "NORMALE", reps: 8, chargeKg: 80, faite: true },
      { type: "NORMALE", reps: 8, chargeKg: 80, faite: false },
    ],
    ...e,
  };
}

/** `duree` à `null` : un ancien brouillon, sans durée de repos. */
function seance(exercices: ExerciceEnCours[], duree: number | null = 90): SeanceEnCours {
  return {
    id: "s1",
    routineId: null,
    nom: "Push",
    debut: T0.toISOString(),
    exercices,
    repos: {
      fin: plus(90).toISOString(),
      signale: false,
      ...(duree === null ? {} : { duree }),
    },
  };
}

describe("contenuNotifRepos", () => {
  it("rend null sans repos", () => {
    const s = { ...seance([exercice("Développé couché")]), repos: null };
    expect(contenuNotifRepos(s, plus(30), "metric")).toBeNull();
  });

  it("annonce l'exercice et la série qui suit, avec ses valeurs", () => {
    const c = contenuNotifRepos(seance([exercice("Développé couché")]), plus(30), "metric");
    expect(c).toEqual({
      titre: "Repos · Développé couché",
      texte: `Ensuite : série 2/2 · ${formaterCharge(80, "metric")} × 8`,
      fin: plus(90).getTime(),
      duree: 90,
      restant: 60,
    });
  });

  it("prend le précédent quand la série n'a ni saisie ni cible", () => {
    const e = exercice("Squat", {
      series: [
        { type: "NORMALE", reps: 5, chargeKg: 100, faite: true },
        { type: "NORMALE", reps: null, chargeKg: null, faite: false },
      ],
      precedent: [
        { reps: 5, chargeKg: 100, faite: true },
        { reps: 6, chargeKg: 82.5, faite: true },
      ],
    });
    expect(contenuNotifRepos(seance([e]), plus(30), "metric")?.texte).toBe(
      `Ensuite : série 2/2 · ${formaterCharge(82.5, "metric")} × 6`,
    );
  });

  it("ignore un précédent pas fait : la série du dessus s'indique (D339)", () => {
    const e = exercice("Squat", {
      series: [
        { type: "NORMALE", reps: 5, chargeKg: 100, faite: true },
        { type: "NORMALE", reps: null, chargeKg: null, faite: false },
      ],
      precedent: [
        { reps: 5, chargeKg: 100, faite: true },
        { reps: 6, chargeKg: 82.5, faite: false },
      ],
    });
    expect(contenuNotifRepos(seance([e]), plus(30), "metric")?.texte).toBe(
      `Ensuite : série 2/2 · ${formaterCharge(100, "metric")} × 5`,
    );
  });

  it("écrit les reps seules quand il n'y a pas de charge", () => {
    const e = exercice("Tractions", {
      series: [
        { type: "NORMALE", reps: 10, chargeKg: null, faite: true },
        { type: "NORMALE", reps: 12, chargeKg: null, faite: false },
      ],
    });
    expect(contenuNotifRepos(seance([e]), plus(30), "metric")?.texte).toBe(
      "Ensuite : série 2/2 · 12 reps",
    );
  });

  it("suit l'ordre du superset : la série suivante est celle de l'autre exercice", () => {
    const a = exercice("Curl", {
      supersetGroupe: 1,
      series: [
        { type: "NORMALE", reps: 10, chargeKg: 12, faite: true },
        { type: "NORMALE", reps: 10, chargeKg: 12, faite: false },
      ],
    });
    const b = exercice("Extension", {
      supersetGroupe: 1,
      series: [
        { type: "NORMALE", reps: 12, chargeKg: 20, faite: false },
        { type: "NORMALE", reps: 12, chargeKg: 20, faite: false },
      ],
    });
    const c = contenuNotifRepos(seance([a, b]), plus(30), "metric");
    expect(c?.titre).toBe("Repos · Extension");
    expect(c?.texte).toBe(`Ensuite : série 1/2 · ${formaterCharge(20, "metric")} × 12`);
  });

  it("dit que tout est fait quand il ne reste aucune série", () => {
    const e = exercice("Squat", {
      series: [{ type: "NORMALE", reps: 5, chargeKg: 100, faite: true }],
    });
    const c = contenuNotifRepos(seance([e]), plus(30), "metric");
    expect(c?.titre).toBe("Repos");
    expect(c?.texte).toBe("Toutes les séries sont faites");
  });

  it("affiche la charge dans le système demandé", () => {
    const c = contenuNotifRepos(seance([exercice("Développé couché")]), plus(30), "imperial");
    expect(c?.texte).toBe(`Ensuite : série 2/2 · ${formaterCharge(80, "imperial")} × 8`);
  });

  it("rend restant 0 une fois la fin passée, et duree null pour un ancien brouillon", () => {
    const c = contenuNotifRepos(seance([exercice("Squat")], null), plus(120), "metric");
    expect(c?.restant).toBe(0);
    expect(c?.duree).toBeNull();
  });
});

describe("appliquerActionRepos", () => {
  const s = seance([exercice("Squat")]);

  it("+15 s repousse la fin", () => {
    expect(appliquerActionRepos(s, "plus", plus(30)).repos?.fin).toBe(plus(105).toISOString());
  });

  it("−15 s l'avance", () => {
    expect(appliquerActionRepos(s, "moins", plus(30)).repos?.fin).toBe(plus(75).toISOString());
  });

  it("Passer arrête le repos", () => {
    expect(appliquerActionRepos(s, "passer", plus(30)).repos).toBeNull();
  });
});
