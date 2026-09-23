import { describe, expect, it } from "vitest";
import { estAutorisee, normaliserListe } from "./allowlist.js";

describe("normaliserListe", () => {
  it("découpe sur les virgules, détoure et met en minuscules", () => {
    expect(normaliserListe(" Alexis@Gmail.com , bob@example.com ")).toEqual([
      "alexis@gmail.com",
      "bob@example.com",
    ]);
  });

  it("ignore les entrées vides plutôt que de produire une chaîne vide", () => {
    expect(normaliserListe("a@b.c,,  ,d@e.f")).toEqual(["a@b.c", "d@e.f"]);
  });

  it("rend une liste vide quand la variable est absente", () => {
    expect(normaliserListe(undefined)).toEqual([]);
  });
});

describe("estAutorisee", () => {
  const liste = ["alexis@gmail.com"];

  it("accepte l'adresse exacte", () => {
    expect(estAutorisee("alexis@gmail.com", liste)).toBe(true);
  });

  it("accepte quelle que soit la casse et les espaces autour", () => {
    expect(estAutorisee("  Alexis@Gmail.COM ", liste)).toBe(true);
  });

  it("refuse une adresse absente", () => {
    expect(estAutorisee("inconnu@example.com", liste)).toBe(false);
  });

  // Le cas qui compte le plus : une liste vide ne doit JAMAIS tout laisser passer.
  it("refuse tout quand la liste est vide", () => {
    expect(estAutorisee("alexis@gmail.com", [])).toBe(false);
  });

  // Les alias `+` ne sont PAS traités comme équivalents : les considérer identiques
  // élargirait la liste blanche au lieu de la resserrer, et demanderait de connaître
  // les règles de chaque fournisseur.
  it("ne traite pas un alias + comme l'adresse de base", () => {
    expect(estAutorisee("alexis+spam@gmail.com", liste)).toBe(false);
  });
});
