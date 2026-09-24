import { texteRecherche } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import { filtreCatalogue, type LigneExercice, versDetail, versResume } from "./exercices.js";

const ligne: LigneExercice = {
  slug: "barbell-bench-press",
  name: "barbell bench press",
  nomFr: "Développé couché à la barre",
  bodyPart: "CHEST",
  equipment: "Barre",
  target: "Pectoraux",
  secondary: ["Triceps", "Deltoïdes"],
  instructions: ["Allonge-toi sur le banc.", "Descends la barre."],
  gifUrl: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efa/videos/0025.gif",
};

// Ce que le semis écrit dans la colonne pour cette ligne.
const colonne = texteRecherche(ligne.nomFr, ligne.name);

/** Rejoue le `contains` de Prisma : la colonne contient-elle ce que le filtre cherche ? */
function trouve(q: string): boolean {
  const filtre = filtreCatalogue({ q, page: 1, taille: 50 }) as {
    nomRecherche: { contains: string };
  };
  return colonne.includes(filtre.nomRecherche.contains);
}

describe("filtreCatalogue", () => {
  // Le critère de sortie du lot, réduit à des assertions — sans base, donc
  // exécutable en CI. L'erreur la plus coûteuse, et la plus silencieuse :
  // comparer la saisie brute à une colonne normalisée ne renvoie jamais rien.
  it("trouve l'exercice accentué en tapant sans accents", () => {
    expect(trouve("developpe couche")).toBe(true);
    expect(trouve("Développé Couché")).toBe(true);
  });

  it("trouve le même exercice par son nom anglais (D44)", () => {
    expect(trouve("bench press")).toBe(true);
    expect(trouve("Barbell Bench")).toBe(true);
  });

  it("ne trouve pas ce qui n'y est pas", () => {
    expect(trouve("squat")).toBe(false);
  });

  // Rien dans le type ne rappelle d'exclure les archivés : sans ce test, un
  // exercice archivé réapparaîtrait dans le catalogue.
  it("exclut toujours les exercices archivés", () => {
    expect(filtreCatalogue({ page: 1, taille: 50 })).toMatchObject({ archivedAt: null });
  });

  it("n'ajoute un filtre que pour les critères fournis", () => {
    expect(filtreCatalogue({ page: 1, taille: 50 })).toEqual({ archivedAt: null });
    expect(filtreCatalogue({ groupe: "BACK", page: 1, taille: 50 })).toEqual({
      archivedAt: null,
      bodyPart: "BACK",
    });
    expect(filtreCatalogue({ equipement: "Barre", page: 1, taille: 50 })).toEqual({
      archivedAt: null,
      equipment: "Barre",
    });
  });
});

describe("projections", () => {
  // Le résumé ne doit PAS transporter les instructions : une liste de 50
  // exercices ferait descendre 250 étapes que personne ne lit.
  it("réduit une ligne à ce qu'une liste affiche, sous son nom français", () => {
    expect(versResume(ligne)).toEqual({
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      groupe: "CHEST",
      equipement: "Barre",
    });
  });

  it("rend le détail complet : nom anglais, animation, instructions", () => {
    expect(versDetail(ligne)).toEqual({
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      nomAnglais: "barbell bench press",
      gif: ligne.gifUrl,
      groupe: "CHEST",
      equipement: "Barre",
      cible: "Pectoraux",
      secondaires: ["Triceps", "Deltoïdes"],
      instructions: ["Allonge-toi sur le banc.", "Descends la barre."],
    });
  });
});
