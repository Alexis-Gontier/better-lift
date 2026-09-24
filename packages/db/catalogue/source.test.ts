import { readFileSync } from "node:fs";
import { GROUPES, slugifier } from "@better-lift/shared";
import { describe, expect, it } from "vitest";

type EntreeSource = {
  id: string;
  nom: string;
  groupe: string;
  equipement: string;
  cible: string;
  secondaires: string[];
  gif: string;
  etapes: string[];
};

const source = JSON.parse(
  readFileSync(new URL("./source.json", import.meta.url), "utf8"),
) as EntreeSource[];

describe("source.json", () => {
  it("porte 1 316 exercices", () => {
    expect(source).toHaveLength(1316);
  });

  // Le slug dérive du nom anglais, il est `@unique` en base et c'est la clé de
  // l'`upsert` : un doublon ici fait échouer le semis au milieu d'un lot, ou
  // pire, fait écraser un exercice par un autre.
  it("n'a ni id ni slug en double", () => {
    expect(new Set(source.map((e) => e.id)).size).toBe(source.length);
    expect(new Set(source.map((e) => slugifier(e.nom))).size).toBe(source.length);
  });

  it("garde des chemins de média relatifs, jamais des URL", () => {
    for (const e of source) expect(e.gif).toMatch(/^videos\/[\w-]+\.gif$/);
  });

  it("ne garde aucun nom abîmé par l'encodage", () => {
    const abimes = source.filter((e) => /в|_shoulder$/.test(e.nom));
    expect(abimes.map((e) => e.nom)).toEqual([]);
  });

  it("donne à chaque exercice un groupe connu et des instructions françaises", () => {
    for (const e of source) {
      expect(GROUPES).toContain(e.groupe);
      expect(e.etapes.length).toBeGreaterThan(0);
      expect(e.nom.trim()).not.toBe("");
    }
  });

  // Le pont entre l'enum Prisma et l'union `Groupe` de `shared`. `shared` n'a
  // pas le droit d'importer Prisma : la vérification se fait donc sur le texte
  // du schéma, ce qui couvre les DEUX sens — une valeur ajoutée d'un côté et
  // pas de l'autre fait échouer ce test.
  it("l'union Groupe de shared couvre exactement l'enum BodyPart du schéma", () => {
    const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
    const bloc = schema.match(/enum BodyPart \{([^}]*)\}/)?.[1] ?? "";
    const membres = bloc
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .sort();
    expect(membres).toEqual([...GROUPES].sort());
  });
});
