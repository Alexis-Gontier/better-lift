import { describe, expect, it } from "vitest";
import { filtrerCatalogue, normaliserRecherche, slugifier, texteRecherche } from "./recherche.js";

describe("normaliserRecherche", () => {
  it("dépouille les accents, cédille comprise", () => {
    expect(normaliserRecherche("Développé couché")).toBe("developpe couche");
    expect(normaliserRecherche("Élévations latérales")).toBe("elevations laterales");
    expect(normaliserRecherche("Français")).toBe("francais");
  });

  it("met en minuscules", () => {
    expect(normaliserRecherche("SQUAT BARRE")).toBe("squat barre");
  });

  it("détoure et réduit les espaces internes", () => {
    expect(normaliserRecherche("  curl   barre ")).toBe("curl barre");
  });

  it("remplace apostrophes et traits d'union par un espace", () => {
    expect(normaliserRecherche("Rowing haltère à un bras")).toBe("rowing haltere a un bras");
    expect(normaliserRecherche("L'écarté sit-up")).toBe("l ecarte sit up");
  });

  // Les noms du catalogue portent des chiffres et des symboles : « 3/4 sit-up »,
  // « 45° side bend ». Ils ne doivent ni disparaître ni coller au mot voisin.
  it("garde les chiffres et neutralise les symboles", () => {
    expect(normaliserRecherche("3/4 sit-up")).toBe("3 4 sit up");
    expect(normaliserRecherche("Flexion latérale à 45°")).toBe("flexion laterale a 45");
  });

  // Le test qui compte le plus : la colonne en base est le résultat de cette
  // fonction, et la saisie y repasse. Si elle n'était pas idempotente, comparer
  // les deux ne voudrait rien dire.
  it("est idempotente", () => {
    const nom = "Écarté couché aux haltères sur banc incliné à 30 degrés";
    const une = normaliserRecherche(nom);
    expect(normaliserRecherche(une)).toBe(une);
  });

  it("rend une chaîne vide pour une saisie vide ou purement ponctuelle", () => {
    expect(normaliserRecherche("")).toBe("");
    expect(normaliserRecherche("  —  ")).toBe("");
  });
});

// Le critère de sortie du lot, réduit à des assertions pures : la colonne
// `nomRecherche` est `texteRecherche(nomFr, name)`, et la saisie passe par
// `normaliserRecherche` avant un `contains`. Si ces deux-là s'accordent, la
// recherche trouve — en français sans accents comme en anglais.
describe("texteRecherche", () => {
  const colonne = texteRecherche("Développé couché aux haltères", "dumbbell bench press");

  it("porte le nom français, dépouillé de ses accents", () => {
    expect(colonne).toContain(normaliserRecherche("developpe couche"));
    expect(colonne).toContain(normaliserRecherche("Développé Couché"));
  });

  it("porte aussi le nom anglais d'origine (D44)", () => {
    expect(colonne).toContain(normaliserRecherche("Bench Press"));
    expect(colonne).toContain(normaliserRecherche("dumbbell"));
  });

  it("met le français en tête, pour que le tri de la liste suive le nom affiché", () => {
    expect(colonne.startsWith("developpe couche")).toBe(true);
  });

  it("est déjà normalisé", () => {
    expect(normaliserRecherche(colonne)).toBe(colonne);
  });
});

describe("slugifier", () => {
  it("rend un slug lisible, sans accent ni ponctuation", () => {
    expect(slugifier("dumbbell bench press")).toBe("dumbbell-bench-press");
    expect(slugifier("3/4 sit-up")).toBe("3-4-sit-up");
    expect(slugifier("Développé couché")).toBe("developpe-couche");
  });

  // Le slug DOIT dériver de la même normalisation que `nomRecherche` : deux
  // normalisations différentes feraient diverger l'identifiant d'URL et la
  // colonne de recherche, pour le même nom.
  it("n'est que la normalisation de recherche, espaces en tirets", () => {
    const nom = "Élévations latérales à la poulie";
    expect(slugifier(nom)).toBe(normaliserRecherche(nom).replace(/ /g, "-"));
  });

  it("ne produit jamais de tiret en tête, en queue ni en double", () => {
    expect(slugifier("  Squat   avant  ")).toBe("squat-avant");
  });
});

describe("filtrerCatalogue", () => {
  const liste = [
    { slug: "barbell-bench-press", recherche: "developpe couche a la barre barbell bench press" },
    { slug: "3-4-sit-up", recherche: "releve de buste 3 4 3 4 sit up" },
    { slug: "barbell-curl", recherche: "curl a la barre barbell curl" },
  ];

  it("rend tout, dans l'ordre reçu, quand la saisie est vide", () => {
    expect(filtrerCatalogue(liste, "   ").map((e) => e.slug)).toEqual([
      "barbell-bench-press",
      "3-4-sit-up",
      "barbell-curl",
    ]);
  });

  it("trouve en français malgré les accents et la casse", () => {
    expect(filtrerCatalogue(liste, "Développé COUCHÉ").map((e) => e.slug)).toEqual([
      "barbell-bench-press",
    ]);
  });

  it("trouve en anglais (D44)", () => {
    expect(filtrerCatalogue(liste, "bench press").map((e) => e.slug)).toEqual([
      "barbell-bench-press",
    ]);
  });

  it("traite les symboles comme des espaces, comme l'API", () => {
    expect(filtrerCatalogue(liste, "sit-up").map((e) => e.slug)).toEqual(["3-4-sit-up"]);
  });

  it("rend une liste vide quand rien ne correspond", () => {
    expect(filtrerCatalogue(liste, "squat")).toEqual([]);
  });
});
