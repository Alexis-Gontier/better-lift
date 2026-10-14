import { texteRecherche } from "@better-lift/shared";
import { describe, expect, it } from "vitest";
import {
  choisirVariantes,
  filtreCatalogue,
  imageDe,
  type LigneExercice,
  versDetail,
  versResume,
} from "./exercices.js";

const ligne: LigneExercice = {
  slug: "barbell-bench-press",
  name: "barbell bench press",
  nomFr: "Développé couché à la barre",
  nomRecherche: "developpe couche a la barre barbell bench press",
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
  it("réduit une ligne à ce qu'une liste affiche, sous son nom français et avec sa vignette", () => {
    expect(versResume(ligne)).toEqual({
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      groupe: "CHEST",
      equipement: "Barre",
      cible: "Pectoraux",
      recherche: "developpe couche a la barre barbell bench press",
      image:
        "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efa/images/0025.jpg",
    });
  });

  it("déduit l'image fixe de l'animation, jamais d'une URL qui ne suit pas la convention", () => {
    expect(imageDe(null)).toBeNull();
    expect(imageDe("https://exemple.test/autre/0025.png")).toBeNull();
    expect(imageDe("https://exemple.test/videos/0025-ab.gif")).toBe(
      "https://exemple.test/images/0025-ab.jpg",
    );
  });

  it("rend le détail complet : nom anglais, animation, instructions", () => {
    expect(versDetail(ligne)).toEqual({
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      nomAnglais: "barbell bench press",
      gif: ligne.gifUrl,
      image: imageDe(ligne.gifUrl),
      recherche: "developpe couche a la barre barbell bench press",
      groupe: "CHEST",
      equipement: "Barre",
      cible: "Pectoraux",
      secondaires: ["Triceps", "Deltoïdes"],
      instructions: ["Allonge-toi sur le banc.", "Descends la barre."],
    });
  });
});

describe("choisirVariantes (D204)", () => {
  const ex = (slug: string, equipement: string, recherche = slug) => ({
    slug,
    nom: slug,
    groupe: "CHEST" as const,
    equipement,
    cible: "Pectoraux",
    image: null,
    recherche,
  });

  it("garde un exercice par autre équipement, les principaux d'abord, puis par nom", () => {
    const choix = choisirVariantes(
      { slug: "bench", equipement: "Barre", recherche: "developpe couche barre" },
      [
        ex("bench", "Barre"),
        ex("incline-barre", "Barre"),
        ex("z-machine", "Machine à levier", "z"),
        ex("a-machine", "Machine à levier", "a"),
        ex("pompe", "Poids du corps"),
        ex("bosu-push", "Bosu"),
        ex("halteres", "Haltères"),
      ],
    );
    expect(choix.map((c) => c.slug)).toEqual(["pompe", "halteres", "a-machine", "bosu-push"]);
  });

  it("préfère, par équipement, le nom le plus proche de la source", () => {
    const choix = choisirVariantes(
      { slug: "bench", equipement: "Barre", recherche: "developpe couche barre" },
      [
        ex("breeding", "Haltères", "breeding incline halteres"),
        ex("db-bench", "Haltères", "developpe couche halteres"),
      ],
    );
    expect(choix.map((c) => c.slug)).toEqual(["db-bench"]);
  });

  it("s'arrête à 8", () => {
    const candidats = Array.from({ length: 12 }, (_, i) => ex(`e${i}`, `Équipement ${i}`));
    expect(
      choisirVariantes({ slug: "x", equipement: "Barre", recherche: "x" }, candidats),
    ).toHaveLength(8);
  });
});
