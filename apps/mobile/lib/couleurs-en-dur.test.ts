import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Les couleurs vivent dans les thèmes (D182) : changer d'interface ne doit
 * jamais vouloir dire fouiller les écrans. Une couleur littérale (`"#…"`,
 * `rgba(`) hors de `themes/` fait échouer ce test ; les commentaires sont lus
 * mais ignorés.
 */
const RACINE = join(__dirname, "..");
const LITTERAL = /["'`]#[0-9a-fA-F]{3,8}["'`]|rgba?\(/;

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) && !nom.endsWith(".test.ts") ? [chemin] : [];
  });
}

const fautive = (ligne: string) => {
  const t = ligne.trim();
  return !t.startsWith("//") && !t.startsWith("*") && LITTERAL.test(t);
};

describe("les couleurs vivent dans les thèmes (D182)", () => {
  it.each(["app", "components", "lib"])("aucune couleur littérale dans %s/", (dossier) => {
    const fautifs = fichiers(join(RACINE, dossier)).filter((f) =>
      readFileSync(f, "utf8").split("\n").some(fautive),
    );
    expect(fautifs).toEqual([]);
  });
});
