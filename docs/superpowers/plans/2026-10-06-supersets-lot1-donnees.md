# Supersets, lot 1 — données et contrat : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Ici : exécution inline (préférence de l'utilisateur).**

**Goal:** Faire porter `supersetGroupe` par la base, `shared` et l'API (routines et séances), avec toute la logique pure des supersets testée, sans encore rien changer à l'écran.

**Architecture:** Un module pur `shared/supersets.ts`, générique sur `{ supersetGroupe?: number | null }`, porte la normalisation (D146), les opérations (D147) et le déplacement (D148). `seance.ts` s'en sert pour le repos (D149), la prochaine série (D150) et ses opérations ; `brouillon-routine.ts` pour l'aller-retour de l'éditeur. L'API normalise à l'écriture et rend le champ dans les détails.

**Tech Stack:** TypeScript 6.0.3, Zod, Vitest, Prisma 7 (Neon `dev`, base `betterlift`), Hono.

**Spec:** [`docs/superpowers/specs/2026-10-06-supersets-design.md`](../specs/2026-10-06-supersets-design.md)

## Global Constraints

- Branche `feat/supersets-donnees` (elle porte déjà le commit de la spec). Jamais de push sur `main` ; PR squash, check requis `Qualité · typecheck · test · build`.
- `packages/shared` : TypeScript pur, ni Prisma, ni React, ni `crypto.randomUUID`. Fonctions pures et immuables.
- Le champ est **facultatif** partout à l'entrée : `z.number().int().min(1).max(100).nullable().optional()`. Absent = `null`. Une séance en file d'une ancienne version doit passer (D57).
- Les types lus par les clients (`ExerciceRoutine`, exercices de `SeanceDetail`) portent `supersetGroupe?: number | null` : le cache hors ligne persisté du mobile peut dater d'avant.
- Records et « la dernière fois » ne changent pas.
- Commits en Conventional Commits, en français, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Commandes de test : `pnpm --filter @better-lift/shared test`, `pnpm --filter @better-lift/api test` (vérifier le nom des paquets dans leur `package.json` au premier lancement).

---

### Task 1 : `shared/supersets.ts` — normalisation, groupes, opérations, déplacement

**Files:**
- Create: `packages/shared/src/supersets.ts`
- Create: `packages/shared/src/supersets.test.ts`
- Modify: `packages/shared/src/index.ts` (exports)

**Interfaces:**
- Produces :
  - `type AvecGroupe = { supersetGroupe?: number | null }`
  - `type Groupe = { debut: number; fin: number; lettre: string }`
  - `normaliserGroupes<T extends AvecGroupe>(liste: readonly T[]): T[]`
  - `groupes(liste: readonly AvecGroupe[]): Groupe[]`
  - `groupeDe(liste: readonly AvecGroupe[], i: number): Groupe | null`
  - `lierAuSuivant<T extends AvecGroupe>(liste: readonly T[], i: number): T[]`
  - `retirerDuGroupe<T extends AvecGroupe>(liste: readonly T[], i: number): T[]`
  - `defaireGroupe<T extends AvecGroupe>(liste: readonly T[], i: number): T[]`
  - `deplacerAvecGroupes<T extends AvecGroupe>(liste: readonly T[], de: number, vers: number): T[]`

- [ ] **Step 1 : écrire les tests**

```ts
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
/** `l("a1 b1 c . d2 e2")` : un exercice par mot, le chiffre est le groupe, « . » ou rien = seul. */
const l = (s: string): E[] =>
  s.split(" ").map((m) => ({ nom: m[0] ?? "?", supersetGroupe: m[1] ? Number(m[1]) : null }));
/** Le même format en sortie, pour comparer d'un coup d'œil. */
const vue = (xs: readonly E[]) =>
  xs.map((x) => `${x.nom}${x.supersetGroupe ?? ""}`).join(" ");

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
    expect(vue(normaliserGroupes([{ nom: "a" }, { nom: "b" }]))).toBe("a b");
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
```

- [ ] **Step 2 : lancer, constater l'échec** — `pnpm --filter @better-lift/shared test supersets` → FAIL (module introuvable).

- [ ] **Step 3 : implémenter**

```ts
/**
 * Les supersets (D145–D148) — sans plateforme, génériques : les mêmes règles
 * servent le brouillon de routine et la séance en cours.
 *
 * Un groupe est une suite CONSÉCUTIVE d'exercices portant le même numéro. Les
 * numéros n'ont pas de sens en soi : `normaliserGroupes` les renumérote, coupe
 * ce qui ne se suit plus et efface un groupe réduit à un seul. Toute opération
 * finit par elle — un groupe n'est jamais coupé en silence.
 */

export type AvecGroupe = { supersetGroupe?: number | null };
export type Groupe = { debut: number; fin: number; lettre: string };

const num = (x: AvecGroupe | undefined) => x?.supersetGroupe ?? null;
const avec = <T extends AvecGroupe>(x: T, n: number | null): T => ({ ...x, supersetGroupe: n });

/** Les suites maximales d'un même numéro non nul, d'au moins deux exercices. */
function suites(liste: readonly AvecGroupe[]): { debut: number; fin: number }[] {
  const res: { debut: number; fin: number }[] = [];
  let i = 0;
  while (i < liste.length) {
    const n = num(liste[i]);
    let j = i + 1;
    if (n !== null) while (j < liste.length && num(liste[j]) === n) j++;
    if (n !== null && j - i >= 2) res.push({ debut: i, fin: j - 1 });
    i = j;
  }
  return res;
}

/** A, B… Z, puis 27, 28 : au-delà de 26 groupes, une lettre ne se lit plus. */
const lettre = (rang: number) => (rang < 26 ? String.fromCharCode(65 + rang) : String(rang + 1));

export function normaliserGroupes<T extends AvecGroupe>(liste: readonly T[]): T[] {
  const res = liste.map((x) => avec(x, null));
  suites(liste).forEach(({ debut, fin }, rang) => {
    for (let k = debut; k <= fin; k++) res[k] = avec(liste[k] as T, rang + 1);
  });
  return res;
}

export function groupes(liste: readonly AvecGroupe[]): Groupe[] {
  return suites(liste).map((s, rang) => ({ ...s, lettre: lettre(rang) }));
}

export function groupeDe(liste: readonly AvecGroupe[], i: number): Groupe | null {
  return groupes(liste).find((g) => g.debut <= i && i <= g.fin) ?? null;
}

/** Lie `i` à `i + 1` (D147) ; fusionne leurs groupes s'ils en ont. */
export function lierAuSuivant<T extends AvecGroupe>(liste: readonly T[], i: number): T[] {
  if (i < 0 || i + 1 >= liste.length) return [...liste];
  const propre = normaliserGroupes(liste);
  const a = num(propre[i]);
  const b = num(propre[i + 1]);
  const max = Math.max(0, ...propre.map((x) => num(x) ?? 0));
  const cible = a ?? b ?? max + 1;
  return normaliserGroupes(
    propre.map((x, k) => {
      const n = num(x);
      const dedans = k === i || k === i + 1 || (n !== null && (n === a || n === b));
      return dedans ? avec(x, cible) : x;
    }),
  );
}

/** Détache `i` (D147) ; du milieu, il se place juste après le groupe. */
export function retirerDuGroupe<T extends AvecGroupe>(liste: readonly T[], i: number): T[] {
  const propre = normaliserGroupes(liste);
  const g = groupeDe(propre, i);
  if (!g) return propre;
  const res = [...propre];
  res[i] = avec(propre[i] as T, null);
  if (i > g.debut && i < g.fin) {
    const [sorti] = res.splice(i, 1);
    if (sorti) res.splice(g.fin, 0, sorti);
  }
  return normaliserGroupes(res);
}

export function defaireGroupe<T extends AvecGroupe>(liste: readonly T[], i: number): T[] {
  const propre = normaliserGroupes(liste);
  const g = groupeDe(propre, i);
  if (!g) return propre;
  return propre.map((x, k) => (k >= g.debut && k <= g.fin ? avec(x, null) : x));
}

/**
 * D148 : l'exercice déplacé quitte son groupe ; posé entre deux membres d'un
 * même groupe, il le rejoint. Sur un bord, il reste seul.
 */
export function deplacerAvecGroupes<T extends AvecGroupe>(
  liste: readonly T[],
  de: number,
  vers: number,
): T[] {
  const n = liste.length;
  if (de < 0 || de >= n || vers < 0 || vers >= n || de === vers) return [...liste];
  const res = normaliserGroupes(liste);
  const [bouge] = res.splice(de, 1);
  if (!bouge) return res;
  const avant = num(res[vers - 1]);
  const apres = num(res[vers]);
  res.splice(vers, 0, avec(bouge, avant !== null && avant === apres ? avant : null));
  return normaliserGroupes(res);
}
```

Puis dans `index.ts`, au rang alphabétique :

```ts
export {
  type AvecGroupe,
  defaireGroupe,
  deplacerAvecGroupes,
  type Groupe,
  groupeDe,
  groupes,
  lierAuSuivant,
  normaliserGroupes,
  retirerDuGroupe,
} from "./supersets.js";
```

- [ ] **Step 4 : lancer, constater le succès** — `pnpm --filter @better-lift/shared test supersets` → PASS.

- [ ] **Step 5 : commit** — `feat(shared): logique des supersets (D146–D148)`.

---

### Task 2 : contrats de routine et brouillon de l'éditeur

**Files:**
- Modify: `packages/shared/src/routines.ts` (`ExerciceRoutine`, `exerciceSaisi`)
- Modify: `packages/shared/src/brouillon-routine.ts` (`ExerciceBrouillon`, `versBrouillon`, `nouvelExercice`, `versSaisie`)
- Test: `packages/shared/src/routines.test.ts`, `packages/shared/src/brouillon-routine.test.ts`

**Interfaces:**
- Consumes : `normaliserGroupes` (Task 1).
- Produces : `ExerciceRoutine.supersetGroupe?: number | null` ; `exerciceSaisi.supersetGroupe` facultatif ; `ExerciceBrouillon.supersetGroupe: number | null` ; `versSaisie` envoie des groupes normalisés.

- [ ] **Step 1 : tests**

Dans `routines.test.ts` :

```ts
describe("routineSaisie et les supersets (D145)", () => {
  const base = {
    nom: "Push",
    exercices: [{ slug: "a", reposSec: null, series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: null }] }],
  };
  it("accepte un exercice sans supersetGroupe", () => {
    expect(routineSaisie.safeParse(base).success).toBe(true);
  });
  it("accepte un groupe ou null", () => {
    const avec = (g: number | null) => ({ ...base, exercices: [{ ...base.exercices[0], supersetGroupe: g }] });
    expect(routineSaisie.safeParse(avec(1)).success).toBe(true);
    expect(routineSaisie.safeParse(avec(null)).success).toBe(true);
  });
  it("refuse un groupe nul ou négatif", () => {
    const zero = { ...base, exercices: [{ ...base.exercices[0], supersetGroupe: 0 }] };
    expect(routineSaisie.safeParse(zero).success).toBe(false);
  });
});
```

Dans `brouillon-routine.test.ts` (reprendre la fixture `RoutineDetail` existante du fichier ; ajouter `supersetGroupe` à deux exercices consécutifs) :

```ts
describe("supersets dans le brouillon (D145)", () => {
  it("versBrouillon lit le groupe, absent = null", () => {
    const b = versBrouillon(
      { id: "r", nom: "R", exercices: [exo("a", 1), exo("b", 1), { ...exo("c", null), supersetGroupe: undefined }] },
      "metrique",
    );
    expect(b.exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
  });
  it("nouvelExercice est hors groupe", () => {
    expect(nouvelExercice("a", "A").supersetGroupe).toBeNull();
  });
  it("versSaisie envoie des groupes normalisés", () => {
    const b = versBrouillon({ id: "r", nom: "R", exercices: [exo("a", 7), exo("b", 7), exo("c", 3)] }, "metrique");
    expect(versSaisie(b, "metrique").exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
  });
  it("l'empreinte change quand un groupe change", () => {
    const b = versBrouillon({ id: "r", nom: "R", exercices: [exo("a", null), exo("b", null)] }, "metrique");
    const lie = { ...b, exercices: b.exercices.map((e) => ({ ...e, supersetGroupe: 1 })) };
    expect(empreinte(lie)).not.toBe(empreinte(b));
  });
});
```

avec, en tête du fichier, l'aide (adapter la valeur du système d'unités au type `UnitSystem` réel de `units.ts`) :

```ts
const exo = (slug: string, g: number | null): ExerciceRoutine => ({
  slug,
  nom: slug,
  image: null,
  musclePrincipal: "pectorals",
  musclesSecondaires: [],
  reposSec: null,
  supersetGroupe: g,
  series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: null }],
});
```

- [ ] **Step 2 : lancer** — `pnpm --filter @better-lift/shared test routines brouillon` → FAIL.

- [ ] **Step 3 : implémenter**

`routines.ts`, dans `ExerciceRoutine` après `reposSec` :

```ts
  /**
   * Le groupe de superset (D145), `null` hors groupe. Facultatif : une routine
   * gardée hors ligne par une version antérieure du mobile ne l'a pas.
   */
  supersetGroupe?: number | null;
```

`exerciceSaisi` :

```ts
export const exerciceSaisi = z.object({
  slug: z.string().min(1).max(200),
  reposSec: z.number().int().min(0).max(3600).nullable(),
  // Facultatif (D145) : un éditeur d'avant les supersets ne l'envoie pas.
  supersetGroupe: z.number().int().min(1).max(100).nullable().optional(),
  series: z.array(serieSaisie).min(1).max(20),
});
```

`brouillon-routine.ts` : ajouter `supersetGroupe: number | null;` à `ExerciceBrouillon` ; dans `versBrouillon`, `supersetGroupe: e.supersetGroupe ?? null,` ; dans `nouvelExercice`, `supersetGroupe: null` ; `versSaisie` devient :

```ts
export function versSaisie(b: Brouillon, systeme: UnitSystem): RoutineSaisie {
  return {
    nom: b.nom.trim(),
    exercices: normaliserGroupes(b.exercices).map((e) => ({
      slug: e.slug,
      reposSec: lireEntier(e.repos, 3600),
      supersetGroupe: e.supersetGroupe,
      series: e.series.map((s) => ({
        type: s.type,
        repsCible: lireEntier(s.reps, 999),
        chargeCibleKg: lireCharge(s.charge, systeme),
      })),
    })),
  };
}
```

(`normaliserGroupes` rend `supersetGroupe` toujours défini ; si TypeScript le voit `number | null | undefined`, écrire `e.supersetGroupe ?? null`.)

- [ ] **Step 4 : lancer** — PASS, puis `pnpm typecheck` : corriger les fixtures web et mobile qui construisent un `ExerciceBrouillon` (le champ y devient obligatoire) en ajoutant `supersetGroupe: null`.

- [ ] **Step 5 : commit** — `feat(shared): les routines portent leurs supersets (D145)`.

---

### Task 3 : la séance — démarrage, opérations, envoi

**Files:**
- Modify: `packages/shared/src/seance.ts`
- Test: `packages/shared/src/seance.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes : `normaliserGroupes`, `lierAuSuivant`, `retirerDuGroupe`, `defaireGroupe`, `deplacerAvecGroupes` (Task 1) ; `ExerciceRoutine.supersetGroupe` (Task 2).
- Produces : `ExerciceEnCours.supersetGroupe?: number | null` ; `lierExercices(s, iE)`, `delierExercice(s, iE)`, `defaireSuperset(s, iE)` → `SeanceEnCours` ; `exerciceEnvoye.supersetGroupe` facultatif ; `versEnvoi` l'envoie normalisé.

- [ ] **Step 1 : tests** (dans `seance.test.ts` ; une aide locale `seanceDe(groupes)` qui construit une `SeanceEnCours` avec un exercice par groupe donné, 2 séries chacun)

```ts
const exoEnCours = (slug: string, g: number | null, nbSeries = 2, reposSec: number | null = null): ExerciceEnCours => ({
  slug,
  nom: slug,
  reposSec,
  supersetGroupe: g,
  series: Array.from({ length: nbSeries }, () => ({ type: "NORMALE" as const, reps: 8, chargeKg: 50, faite: false })),
});
const seanceAvec = (...exercices: ExerciceEnCours[]): SeanceEnCours => ({
  ...demarrerVide("s", T0),
  exercices,
});

describe("supersets en séance (D145, D147, D148)", () => {
  it("demarrerDepuisRoutine recopie les groupes, absents = null", () => {
    const r: RoutineDetail = {
      id: "r",
      nom: "R",
      exercices: ["a", "b", "c"].map((slug, i) => ({
        slug,
        nom: slug,
        image: null,
        musclePrincipal: "pectorals",
        musclesSecondaires: [],
        reposSec: null,
        ...(i < 2 ? { supersetGroupe: 4 } : {}),
        series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: null }],
      })),
    };
    expect(demarrerDepuisRoutine(r, "s", T0).exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
  });
  it("lierExercices, delierExercice et defaireSuperset", () => {
    const s = seanceAvec(exoEnCours("a", null), exoEnCours("b", null), exoEnCours("c", null));
    const lie = lierExercices(lierExercices(s, 0), 1);
    expect(lie.exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, 1]);
    expect(delierExercice(lie, 1).exercices.map((e) => [e.slug, e.supersetGroupe])).toEqual([
      ["a", 1], ["c", 1], ["b", null],
    ]);
    expect(defaireSuperset(lie, 0).exercices.map((e) => e.supersetGroupe)).toEqual([null, null, null]);
  });
  it("retirer un exercice resserre le groupe ; à un seul, il disparaît", () => {
    const s = seanceAvec(exoEnCours("a", 1), exoEnCours("b", 1), exoEnCours("c", null));
    expect(retirerExercice(s, 0).exercices.map((e) => e.supersetGroupe)).toEqual([null, null]);
  });
  it("remplacer garde la place et le groupe", () => {
    const s = seanceAvec(exoEnCours("a", 1), exoEnCours("b", 1));
    expect(remplacerExercice(s, 1, "z", "Z").exercices[1]?.supersetGroupe).toBe(1);
  });
  it("ajouter un exercice le met hors groupe", () => {
    const s = seanceAvec(exoEnCours("a", 1), exoEnCours("b", 1));
    expect(ajouterExercice(s, "c", "C").exercices[2]?.supersetGroupe).toBeNull();
  });
  it("deplacerExercice suit D148", () => {
    const s = seanceAvec(exoEnCours("a", 1), exoEnCours("b", 1), exoEnCours("c", null));
    expect(deplacerExercice(s, 2, 1).exercices.map((e) => [e.slug, e.supersetGroupe])).toEqual([
      ["a", 1], ["c", 1], ["b", 1],
    ]);
  });
  it("versEnvoi envoie les groupes normalisés", () => {
    const s = seanceAvec(exoEnCours("a", 5), exoEnCours("b", 5), exoEnCours("c", 9));
    expect(versEnvoi(s, plus(60)).exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
  });
  it("un vieux brouillon sans le champ s'envoie avec null", () => {
    const { supersetGroupe: _g, ...vieux } = exoEnCours("a", null);
    expect(versEnvoi(seanceAvec(vieux), plus(60)).exercices[0]?.supersetGroupe).toBeNull();
  });
  it("seanceSaisie accepte le champ absent, null ou un entier", () => {
    const envoi = versEnvoi(seanceAvec(exoEnCours("a", null)), plus(60));
    const { supersetGroupe: _g, ...sans } = envoi.exercices[0]!;
    expect(seanceSaisie.safeParse({ ...envoi, exercices: [sans] }).success).toBe(true);
    expect(seanceSaisie.safeParse(envoi).success).toBe(true);
    expect(seanceSaisie.safeParse({ ...envoi, exercices: [{ ...sans, supersetGroupe: 2 }] }).success).toBe(true);
  });
});
```

Ajouter à l'import du fichier : `defaireSuperset`, `delierExercice`, `lierExercices`, et les types `ExerciceEnCours`, `SeanceEnCours`.

- [ ] **Step 2 : lancer** — `pnpm --filter @better-lift/shared test seance` → FAIL.

- [ ] **Step 3 : implémenter** dans `seance.ts` :

1. Import : `import { defaireGroupe, deplacerAvecGroupes, lierAuSuivant, normaliserGroupes, retirerDuGroupe } from "./supersets.js";`
2. `ExerciceEnCours`, après `note` :

```ts
  /** Le groupe de superset (D145). Absent d'un brouillon antérieur : lu comme `null`. */
  supersetGroupe?: number | null;
```

3. `demarrerDepuisRoutine` : `exercices: normaliserGroupes(r.exercices.map((e) => ({ slug: e.slug, nom: e.nom, reposSec: e.reposSec, supersetGroupe: e.supersetGroupe ?? null, series: … })))` (le reste inchangé).
4. `ajouterExercice` : l'exercice ajouté porte `supersetGroupe: null`.
5. `retirerExercice` : `exercices: normaliserGroupes(s.exercices.filter((_, i) => i !== iE))`.
6. `deplacerExercice` : corps remplacé par `return { ...s, exercices: deplacerAvecGroupes(s.exercices, de, vers) };` (les bornes sont vérifiées dans `deplacerAvecGroupes` ; garder `if (de === vers) return s;` en tête pour conserver l'identité quand rien ne bouge).
7. `remplacerExercice` : ajouter `supersetGroupe: e.supersetGroupe ?? null,`.
8. Nouvelles fonctions, après `deplacerExercice` :

```ts
/** D147 : superset avec l'exercice suivant. */
export function lierExercices(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: lierAuSuivant(s.exercices, iE) };
}

/** D147 : retire l'exercice de son superset ; du milieu, il passe après le groupe. */
export function delierExercice(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: retirerDuGroupe(s.exercices, iE) };
}

export function defaireSuperset(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: defaireGroupe(s.exercices, iE) };
}
```

9. `exerciceEnvoye` : ajouter

```ts
  // Facultatif (D145) : une séance en file d'avant les supersets ne l'a pas (D57).
  supersetGroupe: z.number().int().min(1).max(100).nullable().optional(),
```

10. `versEnvoi` : `exercices: normaliserGroupes(s.exercices).map((e) => ({ slug: e.slug, reposSec: e.reposSec, note: e.note ?? null, supersetGroupe: e.supersetGroupe ?? null, series: … }))`.
11. `index.ts` : exporter `defaireSuperset`, `delierExercice`, `lierExercices` avec les autres exports de `./seance.js`.

- [ ] **Step 4 : lancer** — PASS (y compris les tests existants de `deplacerExercice`, `retirerExercice`, `remplacerExercice` ; un test existant qui compare un exercice entier par `toEqual` peut demander `supersetGroupe: null` : l'ajouter à l'attendu).

- [ ] **Step 5 : commit** — `feat(shared): la séance porte ses supersets (D145, D147, D148)`.

---

### Task 4 : repos au bout du tour et prochaine série tour par tour

**Files:**
- Modify: `packages/shared/src/seance.ts` (`validerSerie`, `prochaineSerie`)
- Test: `packages/shared/src/seance.test.ts`

**Interfaces:**
- Consumes : `groupeDe` (Task 1), aides de test `exoEnCours` / `seanceAvec` (Task 3).
- Produces : comportement D149 et D150, signatures inchangées.

- [ ] **Step 1 : tests**

```ts
describe("repos d'un superset (D149)", () => {
  // a et b en superset, repos 60 sur a, 120 sur b (le dernier).
  const s0 = () => seanceAvec(exoEnCours("a", 1, 2, 60), exoEnCours("b", 1, 2, 120), exoEnCours("c", null, 1, 90));

  it("cocher le premier du tour ne lance pas de repos", () => {
    expect(validerSerie(s0(), 0, 0, T0).repos).toBeNull();
  });
  it("le tour complet lance le repos du DERNIER exercice du groupe", () => {
    const s = validerSerie(validerSerie(s0(), 0, 0, T0), 1, 0, T0);
    expect(s.repos?.fin).toBe(plus(120).toISOString());
  });
  it("dans le désordre aussi : b puis a", () => {
    const s = validerSerie(validerSerie(s0(), 1, 0, T0), 0, 0, T0);
    expect(s.repos?.fin).toBe(plus(120).toISOString());
  });
  it("un tour incomplet ne touche pas au repos en cours", () => {
    const enRepos = { ...s0(), repos: { fin: plus(30).toISOString(), signale: false } };
    expect(validerSerie(enRepos, 0, 1, T0).repos).toEqual(enRepos.repos);
  });
  it("nombres de séries inégaux : le tour sans b se complète avec a seul", () => {
    const s = seanceAvec(exoEnCours("a", 1, 3, 60), exoEnCours("b", 1, 2, 120));
    expect(validerSerie(s, 0, 2, T0).repos?.fin).toBe(plus(120).toISOString());
  });
  it("le dernier sans repos propre : repos par défaut du compte", () => {
    const s = seanceAvec(exoEnCours("a", 1, 1, 60), exoEnCours("b", 1, 1, null));
    const fait = validerSerie(validerSerie(s, 0, 0, T0, 45), 1, 0, T0, 45);
    expect(fait.repos?.fin).toBe(plus(45).toISOString());
  });
  it("hors groupe, rien ne change", () => {
    expect(validerSerie(s0(), 2, 0, T0).repos?.fin).toBe(plus(90).toISOString());
  });
});

describe("prochaine série dans un superset (D150)", () => {
  it("passe tour par tour : a1, b1, a2, b2, puis c", () => {
    let s = seanceAvec(exoEnCours("a", 1), exoEnCours("b", 1), exoEnCours("c", null, 1));
    const ordre: string[] = [];
    for (let p = prochaineSerie(s); p; p = prochaineSerie(s)) {
      ordre.push(`${s.exercices[p.iE]?.slug}${p.iS + 1}`);
      s = validerSerie(s, p.iE, p.iS, T0);
    }
    expect(ordre).toEqual(["a1", "b1", "a2", "b2", "c1"]);
  });
  it("saute l'exercice qui n'a plus de série à ce rang", () => {
    let s = seanceAvec(exoEnCours("a", 1, 3), exoEnCours("b", 1, 1));
    const ordre: string[] = [];
    for (let p = prochaineSerie(s); p; p = prochaineSerie(s)) {
      ordre.push(`${s.exercices[p.iE]?.slug}${p.iS + 1}`);
      s = validerSerie(s, p.iE, p.iS, T0);
    }
    expect(ordre).toEqual(["a1", "b1", "a2", "a3"]);
  });
});
```

- [ ] **Step 2 : lancer** — FAIL.

- [ ] **Step 3 : implémenter**

`validerSerie`, après `if (etaitFaite) return apres;` :

```ts
  // D149 : dans un superset, le repos attend la fin du tour — toutes les séries
  // de ce rang cochées, dans n'importe quel ordre — et prend celui du dernier.
  const g = groupeDe(s.exercices, iE);
  if (g) {
    const membres = apres.exercices.slice(g.debut, g.fin + 1);
    const tourFini = membres.every((e) => e.series[iS]?.faite ?? true);
    if (!tourFini) return apres;
  }
  const reposSec = s.exercices[g ? g.fin : iE]?.reposSec ?? reposDefautSec;
```

(remplace l'ancienne ligne `const reposSec = …`.)

`prochaineSerie` : l'ordre se construit tour par tour dans un groupe.

```ts
/** L'ordre de passage des séries (D150) : tour par tour dans un superset. */
function ordreDePassage(s: SeanceEnCours): { iE: number; iS: number; faite: boolean }[] {
  const ordre: { iE: number; iS: number; faite: boolean }[] = [];
  let iE = 0;
  while (iE < s.exercices.length) {
    const g = groupeDe(s.exercices, iE);
    const fin = g ? g.fin : iE;
    const tours = Math.max(...s.exercices.slice(iE, fin + 1).map((e) => e.series.length));
    for (let iS = 0; iS < tours; iS++)
      for (let k = iE; k <= fin; k++) {
        const x = s.exercices[k]?.series[iS];
        if (x) ordre.push({ iE: k, iS, faite: x.faite });
      }
    iE = fin + 1;
  }
  return ordre;
}
```

et dans `prochaineSerie`, `const ordre = ordreDePassage(s);` à la place du `flatMap`. Hors groupe, l'ordre reste exercice puis série : les tests existants de `prochaineSerie` doivent passer sans changement. Importer `groupeDe`.

- [ ] **Step 4 : lancer** — `pnpm --filter @better-lift/shared test` → PASS en entier.

- [ ] **Step 5 : commit** — `feat(shared): repos au bout du tour, prochaine série tour par tour (D149, D150)`.

---

### Task 5 : migration `seance_exercice_superset`

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (`SeanceExercice`, commentaire de `RoutineExercice`)
- Create: `packages/db/prisma/migrations/<horodatage>_seance_exercice_superset/migration.sql` (généré)

- [ ] **Step 1 : suivre la commande `/migration seance_exercice_superset`** (`.claude/commands/migration.md`) : vérifier que le `.env` vise la branche Neon **`dev`**, base **`betterlift`** (sans lire le `.env` : demander à l'utilisateur s'il faut confirmer, ou s'appuyer sur `prisma migrate status` qui affiche l'hôte). La commande signale la branche `dev` comme archivée depuis le 13 septembre : si la migration échoue à se connecter, la réactiver par le MCP Neon (projet `late-bar-51472267`).
- [ ] **Step 2 : schéma.** Dans `SeanceExercice`, après `reposSec` (ou `note`) :

```prisma
  // D145 : le groupe de superset, recopié de la routine ou fait en séance.
  supersetGroupe Int?
```

Dans `RoutineExercice`, le commentaire devient `// D145 : le groupe de superset (D11 révisée : il entre dans l'interface).`

- [ ] **Step 3 :** `pnpm db:migrate --name seance_exercice_superset`. Relire le SQL : il doit se réduire à `ALTER TABLE "SeanceExercice" ADD COLUMN "supersetGroupe" INTEGER;` (nullable, aucune réécriture des lignes existantes).
- [ ] **Step 4 :** `pnpm db:generate`.
- [ ] **Step 5 : commit** — `feat(db): supersetGroupe sur SeanceExercice (D145)`.

---

### Task 6 : l'API écrit et rend les groupes

**Files:**
- Modify: `apps/api/src/services/routines.ts` (`ExerciceEcrit`, `versEcriture`, `LigneRoutine`, `versDetail`, `LECTURE`, `creationImbriquee`)
- Modify: `apps/api/src/services/seances.ts` (`ExerciceEcrit`, `versEcriture`, `enregistrer`, `LigneSeance`, `versDetail`, `LECTURE_SEANCE`)
- Modify: `apps/api/src/services/stats.ts` (les deux `select` qui construisent des `LigneSeance`, lignes ~118 et ~191 : ajouter `supersetGroupe: true`)
- Modify: `packages/shared/src/records.ts` (`SeanceDetail.exercices[].supersetGroupe?: number | null`)
- Test: `apps/api/src/services/routines.test.ts`, `apps/api/src/services/seances.test.ts`, et `apps/api/src/routes/seances.test.ts` (un envoi sans le champ passe)

**Interfaces:**
- Consumes : `normaliserGroupes` (Task 1), contrats des Tasks 2–3, colonne de la Task 5.
- Produces : `RoutineDetail.exercices[].supersetGroupe` et `SeanceDetail.exercices[].supersetGroupe` remplis par l'API — ce que lisent les lots 2 à 4.

- [ ] **Step 1 : tests**

`routines.test.ts` :

```ts
describe("supersets (D146)", () => {
  it("versEcriture normalise les groupes", () => {
    const s: RoutineSaisie = {
      ...saisie,
      exercices: saisie.exercices.map((e, i) => ({ ...e, supersetGroupe: i < 2 ? 7 : 3 })),
    };
    expect(versEcriture(s, ids).exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
  });
  it("versEcriture : champ absent = null", () => {
    expect(versEcriture(saisie, ids).exercices.map((e) => e.supersetGroupe)).toEqual([null, null, null]);
  });
});
```

et, dans le test existant de `versDetail`, ajouter `supersetGroupe: 1` à la ligne du premier exercice de la fixture `LigneRoutine` (et `null` aux autres) puis attendre `supersetGroupe` dans le détail rendu.

`seances.test.ts` : ajouter `supersetGroupe: null` aux exercices de la fixture `ligne` (le type l'exige désormais), puis :

```ts
it("rend le groupe de superset de chaque exercice (D153)", () => {
  const l = { ...ligne, exercices: ligne.exercices.map((e, i) => ({ ...e, supersetGroupe: i < 2 ? 1 : null })) };
  expect(versDetail(l, new Map()).exercices.map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
});
```

et pour `versEcriture` des séances (importer `versEcriture` et `SeanceSaisie`) :

```ts
it("versEcriture normalise les groupes, absents = null (D145, D146)", () => {
  const saisie: SeanceSaisie = {
    id: "s1", routineId: null, nom: "S", debut: "2026-10-06T18:00:00.000Z", fin: "2026-10-06T19:00:00.000Z",
    exercices: [
      { slug: "a", reposSec: null, supersetGroupe: 4, series: [] },
      { slug: "b", reposSec: null, supersetGroupe: 4, series: [] },
      { slug: "c", reposSec: null, series: [] },
    ],
  };
  const ids = new Map([["a", "A"], ["b", "B"], ["c", "C"]]);
  expect(versEcriture(saisie, ids).map((e) => e.supersetGroupe)).toEqual([1, 1, null]);
});
```

Route : dans `routes/seances.test.ts`, reprendre le test d'envoi existant avec un corps dont un exercice n'a pas `supersetGroupe` et vérifier le 201 (s'il n'existe pas déjà sous cette forme, c'est le test de non-régression de D145).

- [ ] **Step 2 : lancer** — `pnpm --filter @better-lift/api test` → FAIL.

- [ ] **Step 3 : implémenter**

Routines : `ExerciceEcrit.supersetGroupe: number | null` ; `versEcriture` itère sur `normaliserGroupes(saisie.exercices)` et pose `supersetGroupe: e.supersetGroupe ?? null` ; `LigneRoutine.exercices[].supersetGroupe: number | null` ; `LECTURE.exercices.select.supersetGroupe: true` ; `versDetail` rend `supersetGroupe: e.supersetGroupe` ; `creationImbriquee` écrit `supersetGroupe: e.supersetGroupe`.

Séances : `ExerciceEcrit.supersetGroupe: number | null` ; `versEcriture` sur `normaliserGroupes(saisie.exercices)` avec `supersetGroupe: e.supersetGroupe ?? null` ; `enregistrer` écrit `supersetGroupe: e.supersetGroupe` dans le `create` imbriqué ; `LigneSeance.exercices[].supersetGroupe: number | null` ; `LECTURE_SEANCE.exercices.select.supersetGroupe: true` ; `versDetail` rend `supersetGroupe: e.supersetGroupe`.

`records.ts`, dans le type des exercices de `SeanceDetail` :

```ts
    /** Le groupe de superset (D153), `null` hors groupe ; absent d'un cache antérieur. */
    supersetGroupe?: number | null;
```

Stats : `supersetGroupe: true` dans les deux `select` d'exercices.

- [ ] **Step 4 : lancer** — `pnpm --filter @better-lift/api test` → PASS ; `pnpm typecheck` → vert (corriger toute fixture web ou mobile de `SeanceDetail` / `LigneSeance` qui casse en ajoutant `supersetGroupe: null`).

- [ ] **Step 5 : commit** — `feat(api): routines et séances écrivent et rendent leurs supersets (D146, D153)`.

---

### Task 7 : documentation, vérification, PR

**Files:**
- Modify: `CLAUDE.md` (section État : une ligne « Supersets en cours (D145–D153, lot 1 : données et contrat) »)
- Modify: `.claude/rules/catalogue-db.md` si la section des modèles y décrit `RoutineExercice` / `SeanceExercice` (sinon rien)

- [ ] **Step 1 :** mettre à jour la ligne d'état de `CLAUDE.md`.
- [ ] **Step 2 :** `/verif` (build, typecheck, test, lint, knip). Knip : les exports de `supersets.ts` non encore utilisés par une app sont consommés par `seance.ts` et `brouillon-routine.ts` ; `groupes` et `retirerDuGroupe` passent par l'index de `shared`. Si Knip signale un export inutilisé (`groupes`, `defaireSuperset`…), vérifier comment il traite les autres exports de l'index ; ne pas supprimer ce que les lots 2–4 consomment, mais retirer l'export de l'index jusqu'au lot qui s'en sert si c'est la convention (« un composant naît dans le lot qui s'en sert »).
- [ ] **Step 3 :** commit `docs: état du dépôt, supersets lot 1`, push de la branche, PR `feat: supersets, lot 1 — données et contrat (D145–D150)` avec le résumé, les tests, la note de migration (appliquée sur `dev` seulement ; `production` au déploiement, selon `deploiement-ci.md`) et la ligne `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- [ ] **Step 4 :** pas de vérification à l'écran à ce lot (rien ne change à l'écran). Dire à l'utilisateur qu'aucun test téléphone n'est requis, sauf s'il veut éprouver que la séance se termine et s'envoie toujours (une séance courte, Terminer, la voir dans l'historique).
