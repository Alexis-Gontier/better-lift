import { type Brouillon, type RoutineDetail, versBrouillon } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import {
  changeSummary,
  copyFirstToAll,
  fromLastTime,
  isDirty,
  saveBlocker,
  setLabels,
  setsSummary,
  supersetLetter,
} from "./routine-draft";

const routine: RoutineDetail = {
  id: "r1",
  nom: "Push",
  note: null,
  dossierId: "d1",
  exercices: [
    {
      slug: "lever-chest-press",
      nom: "Développé pectoraux à la machine",
      image: null,
      musclePrincipal: "Pectoraux",
      musclesSecondaires: [],
      reposSec: 150,
      supersetGroupe: null,
      series: [{ type: "NORMALE", repsCible: 10, chargeCibleKg: 80 }],
    },
    {
      slug: "dumbbell-lateral-raise",
      nom: "Élévations latérales",
      image: null,
      musclePrincipal: "Épaules",
      musclesSecondaires: [],
      reposSec: 90,
      supersetGroupe: null,
      series: [{ type: "NORMALE", repsCible: 12, chargeCibleKg: null }],
    },
  ],
};

const saved = versBrouillon(routine, "metric");
const serie = (
  type: Brouillon["exercices"][number]["series"][number]["type"],
  reps = "",
  charge = "",
) => ({
  type,
  reps,
  charge,
});

describe("brouillon de routine", () => {
  it("n'est pas modifié tant qu'on n'a rien changé, espaces du nom compris", () => {
    expect(isDirty(saved, saved)).toBe(false);
    expect(isDirty({ ...saved, nom: " Push " }, saved)).toBe(false);
  });

  it("est modifié dès qu'une série change", () => {
    const [first, ...rest] = saved.exercices;
    if (!first) throw new Error("exercice attendu");
    const changed = {
      ...saved,
      exercices: [{ ...first, series: [serie("NORMALE", "10", "82,5")] }, ...rest],
    };
    expect(isDirty(changed, saved)).toBe(true);
  });

  it("dit pourquoi il ne s'enregistre pas : nom, exercice, puis saisie illisible", () => {
    expect(saveBlocker({ ...saved, nom: " " })).toBe("Donnez-lui un nom");
    expect(saveBlocker({ ...saved, exercices: [] })).toBe("Ajoutez au moins un exercice");
    const [first, ...rest] = saved.exercices;
    if (!first) throw new Error("exercice attendu");
    expect(
      saveBlocker({
        ...saved,
        exercices: [{ ...first, series: [serie("NORMALE", "dix")] }, ...rest],
      }),
    ).toBe("Vérifiez les charges et répétitions");
    expect(saveBlocker(saved)).toBeNull();
  });
});

describe("étiquettes et supersets", () => {
  it("numérote les séries normales entre elles, lettres pour les autres", () => {
    expect(
      setLabels([
        serie("ECHAUFFEMENT"),
        serie("NORMALE"),
        serie("NORMALE"),
        serie("DEGRESSIVE"),
        serie("ECHEC"),
      ]),
    ).toEqual(["W", "1", "2", "D", "F"]);
  });

  it("donne la lettre du superset, A puis B dans l'ordre", () => {
    const liste = [{ supersetGroupe: 3 }, { supersetGroupe: 3 }, { supersetGroupe: null }];
    expect(supersetLetter(liste, 0)).toBe("A");
    expect(supersetLetter(liste, 2)).toBeNull();
  });
});

describe("actions groupées sur les séries", () => {
  it("donne la première série normale aux autres, sans toucher aux séries typées", () => {
    expect(
      copyFirstToAll([
        serie("ECHAUFFEMENT", "15", "20"),
        serie("NORMALE", "8", "60"),
        serie("NORMALE", "6", ""),
        serie("ECHEC", "", ""),
      ]),
    ).toEqual([
      serie("ECHAUFFEMENT", "15", "20"),
      serie("NORMALE", "8", "60"),
      serie("NORMALE", "8", "60"),
      serie("ECHEC", "", ""),
    ]);
  });

  it("recopie la dernière séance rang par rang, puis la dernière série connue", () => {
    const precedentes = [
      { reps: 10, chargeKg: 82.5, faite: true },
      { reps: 8, chargeKg: null, faite: true },
    ];
    expect(
      fromLastTime([serie("NORMALE"), serie("NORMALE"), serie("NORMALE")], precedentes),
    ).toEqual([
      serie("NORMALE", "10", "82,5"),
      serie("NORMALE", "8", ""),
      serie("NORMALE", "8", ""),
    ]);
    expect(fromLastTime([serie("NORMALE", "5")], [])).toEqual([serie("NORMALE", "5")]);
  });
});

describe("résumé d'un exercice replié", () => {
  it("résume des séries identiques, puis des plages", () => {
    expect(setsSummary([serie("NORMALE", "12", "10"), serie("NORMALE", "12", "10")])).toBe(
      "2 × 12 · 10 kg",
    );
    expect(setsSummary([serie("NORMALE", "10", "8"), serie("NORMALE", "12", "10,5")])).toBe(
      "2 × 10–12 · 8–10,5 kg",
    );
  });

  it("met les échauffements devant et tolère ce qui n'est pas noté", () => {
    expect(setsSummary([serie("ECHAUFFEMENT", "15"), serie("NORMALE", "12")])).toBe("1 W + 1 × 12");
    expect(setsSummary([serie("NORMALE"), serie("NORMALE")])).toBe("2 séries");
  });
});

describe("ce que le brouillon change", () => {
  it("ne compte rien sur une routine intacte", () => {
    expect(changeSummary(saved, saved).count).toBe(0);
  });

  it("marque l'exercice modifié, l'ajouté, le retiré, le nom et le dossier", () => {
    const [first] = saved.exercices;
    if (!first) throw new Error("exercice attendu");
    const ajoute = { ...first, cle: "nouvelle", slug: "pull-up" };
    const draft: Brouillon = {
      ...saved,
      nom: "Push lourd",
      dossierId: null,
      exercices: [{ ...first, repos: "180" }, ajoute],
    };
    const c = changeSummary(draft, saved);
    expect(c.changed.has(first.cle)).toBe(true);
    expect(c.added.has("nouvelle")).toBe(true);
    expect(c.removed).toBe(1);
    expect(c.others).toBe(2);
    expect(c.count).toBe(5);
  });

  it("compte un nouvel ordre pour un seul changement", () => {
    const draft = { ...saved, exercices: [...saved.exercices].reverse() };
    expect(changeSummary(draft, saved).count).toBe(1);
  });
});
