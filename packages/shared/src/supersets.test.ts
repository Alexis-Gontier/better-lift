import { describe, expect, it } from "vitest";
import {
  defaireGroupe,
  deplacerAvecGroupes,
  groupeDe,
  groupes,
  lierAuSuivant,
  normaliserGroupes,
  retirerDuGroupe,
} from "./supersets.js";

type E = { nom: string; supersetGroupe?: number | null };
/** `l("a1 b1 c d2 e2")` : un exercice par mot, le chiffre est le groupe, rien = seul. */
const l = (s: string): E[] =>
  s.split(" ").map((m) => ({ nom: m[0] ?? "?", supersetGroupe: m[1] ? Number(m[1]) : null }));
/** Le même format en sortie, pour comparer d'un coup d'œil. */
const vue = (xs: readonly E[]) => xs.map((x) => `${x.nom}${x.supersetGroupe ?? ""}`).join(" ");

describe("normaliserGroupes (D146)", () => {
  it("renumérote 1…n dans l'ordre d'apparition", () => {
    expect(vue(normaliserGroupes(l("a7 b7 c d3 e3")))).toBe("a1 b1 c d2 e2");
  });
  it("remet à null un groupe d'un seul exercice", () => {
    expect(vue(normaliserGroupes(l("a1 b c2 d2")))).toBe("a b c1 d1");
  });
  it("coupe un numéro qui reparaît plus loin", () => {
    expect(vue(normaliserGroupes(l("a1 b1 c d1 e1")))).toBe("a1 b1 c d2 e2");
  });
  it("lit un champ absent comme null", () => {
    expect(vue(normaliserGroupes<E>([{ nom: "a" }, { nom: "b" }]))).toBe("a b");
  });
  it("ne modifie pas la liste reçue", () => {
    const avant = l("a7 b7");
    normaliserGroupes(avant);
    expect(vue(avant)).toBe("a7 b7");
  });
});

describe("groupes", () => {
  it("rend les suites et leur lettre", () => {
    expect(groupes(l("a1 b1 c d2 e2 f2"))).toEqual([
      { debut: 0, fin: 1, lettre: "A" },
      { debut: 3, fin: 5, lettre: "B" },
    ]);
  });
  it("ignore une suite d'un seul", () => {
    expect(groupes(l("a1 b c"))).toEqual([]);
  });
  it("groupeDe trouve le groupe d'un exercice, null hors groupe", () => {
    const xs = l("a1 b1 c");
    expect(groupeDe(xs, 1)).toEqual({ debut: 0, fin: 1, lettre: "A" });
    expect(groupeDe(xs, 2)).toBeNull();
  });
});

describe("lierAuSuivant (D147)", () => {
  it("lie deux exercices seuls", () => {
    expect(vue(lierAuSuivant(l("a b c"), 0))).toBe("a1 b1 c");
  });
  it("agrandit un groupe par le bas : groupe de 3", () => {
    expect(vue(lierAuSuivant(l("a1 b1 c"), 1))).toBe("a1 b1 c1");
  });
  it("fait entrer l'exercice précédent dans le groupe qui suit", () => {
    expect(vue(lierAuSuivant(l("a b1 c1"), 0))).toBe("a1 b1 c1");
  });
  it("fusionne deux groupes voisins", () => {
    expect(vue(lierAuSuivant(l("a1 b1 c2 d2"), 1))).toBe("a1 b1 c1 d1");
  });
  it("ne fait rien sur le dernier", () => {
    expect(vue(lierAuSuivant(l("a b"), 1))).toBe("a b");
  });
});

describe("retirerDuGroupe (D147)", () => {
  it("détache le dernier, qui reste en place", () => {
    expect(vue(retirerDuGroupe(l("a1 b1 c1 d"), 2))).toBe("a1 b1 c d");
  });
  it("détache le premier, qui reste en place", () => {
    expect(vue(retirerDuGroupe(l("a1 b1 c1"), 0))).toBe("a b1 c1");
  });
  it("place un exercice du milieu juste après le groupe", () => {
    expect(vue(retirerDuGroupe(l("a1 b1 c1 d"), 1))).toBe("a1 c1 b d");
  });
  it("un groupe de deux disparaît", () => {
    expect(vue(retirerDuGroupe(l("a1 b1"), 0))).toBe("a b");
  });
  it("ne fait rien hors groupe", () => {
    expect(vue(retirerDuGroupe(l("a b1 c1"), 0))).toBe("a b1 c1");
  });
});

describe("defaireGroupe (D147)", () => {
  it("remet tout le groupe à null, et garde les autres", () => {
    expect(vue(defaireGroupe(l("a1 b1 c1 d2 e2"), 1))).toBe("a b c d1 e1");
  });
});

describe("deplacerAvecGroupes (D148)", () => {
  it("l'exercice déplacé quitte son groupe, qui se resserre", () => {
    expect(vue(deplacerAvecGroupes(l("a1 b1 c1 d"), 0, 3))).toBe("b1 c1 d a");
  });
  it("posé entre deux membres d'un groupe, il le rejoint", () => {
    expect(vue(deplacerAvecGroupes(l("a1 b1 c"), 2, 1))).toBe("a1 c1 b1");
  });
  it("posé sur un bord, il reste seul", () => {
    expect(vue(deplacerAvecGroupes(l("a1 b1 c"), 2, 0))).toBe("c a1 b1");
  });
  it("un groupe réduit à un seul disparaît", () => {
    expect(vue(deplacerAvecGroupes(l("a1 b1 c"), 0, 2))).toBe("b c a");
  });
  it("ignore un indice hors bornes ou un déplacement nul", () => {
    expect(vue(deplacerAvecGroupes(l("a1 b1"), 0, 0))).toBe("a1 b1");
    expect(vue(deplacerAvecGroupes(l("a1 b1"), 0, 5))).toBe("a1 b1");
  });
});
