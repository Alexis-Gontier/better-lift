# Lot 4 — le catalogue français : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** mettre en base les 1 316 exercices du catalogue, avec leur nom anglais et leur nom
français, et les servir aux écrans dessinés au lot 2 — de sorte que n'importe quel exercice se
retrouve par une recherche tapée sans accents, en français comme en anglais.

**Architecture :** le nom français est **une donnée écrite**, pas le produit d'un moteur (D45) :
`noms-fr.json` (id du dataset → nom français) est rédigé une fois, commité, relu en diff, et le
semis le lit à côté de l'extrait vendorisé `source.json`. Le nom anglais reste en `name`, le
français s'ajoute en `nomFr` (D44). La recherche s'appuie sur une colonne `nomRecherche` qui porte
**les deux noms**, normalisés au semis par **la même fonction** que celle qui normalise la saisie.
Les animations s'affichent depuis le dépôt du dataset, URL figée sur un commit (D46).

**Tech Stack :** Prisma 7 (`prisma-client`, `prisma.config.ts`), PostgreSQL sur Neon (branche
`dev`), Hono + Hono RPC, `@hono/zod-validator`, Zod 4, TanStack Query, Vitest 5, Biome 2.5.14,
Knip 6, tsx.

> **Plan régénéré le 24 septembre 2026** après la révision de la conception (D37 et D38
> abandonnées, D44 à D46 ajoutées). Les tâches 1, 2 et la PR 2 reprennent l'essentiel du plan
> précédent ; la chaîne glossaire → moteur → traductions générées a disparu au profit de la
> tâche 4.

**Spec :** [`docs/superpowers/specs/2026-09-23-lot-4-catalogue-francais-design.md`](../specs/2026-09-23-lot-4-catalogue-francais-design.md)

---

## Global Constraints

Ces règles valent pour **toutes** les tâches. Elles viennent de `CLAUDE.md` et de la conception
principale, et sont recopiées à l'identique.

- **L'application est en français.** Tout libellé visible, tout commentaire, tout message de
  commit est en français.
- **Le web et le mobile passent tous deux par l'API.** Jamais d'accès direct à la base depuis un
  client.
- **`packages/shared` n'importe jamais Prisma, React ni une API de plateforme.** TypeScript pur,
  `Intl` toléré pour les dates. *(Conséquence directe dans ce lot : le type des groupes
  musculaires ne peut pas être l'enum Prisma — voir la tâche 2.)*
- **La logique métier vit dans `services/` côté API et ne connaît jamais le contexte Hono.**
- **Contrat typé par Hono RPC, pas d'OpenAPI. Zod dans `shared` est la source unique.**
- **Commits en Conventional Commits, en français.** `commitlint` applique la règle `subject-case` :
  **le sujet ne doit pas commencer par une majuscule**. `feat: ajoute…` passe, `feat: Ajoute…` est
  rejeté, et un sujet commençant par un identifiant capitalisé (`D39`, `CLAUDE.md`) l'est aussi.
- **Jamais de secret dans le code : tout passe par `.env`, gitignoré.** Le `.env` réel n'est pas
  lisible par l'agent.
- **En développement, viser la branche Neon `dev` — jamais `production`.** Vérifier l'endpoint par
  l'API Neon avant toute migration.
- **Turborepo filtre l'environnement en mode strict.** Une variable non déclarée dans le bloc `env`
  de la tâche `turbo.json` n'atteint jamais le processus, même posée sur l'étape du workflow.
  `pnpm test` et `pnpm build` passent par turbo ; `pnpm knip` et `prisma generate` sont des appels
  pnpm directs.
- **La CI n'a pas de base de données.** Aucun test ajouté par ce lot ne doit se connecter à
  PostgreSQL : les tests de données lisent des fichiers, les tests de service utilisent un double.
- **`main` est protégée** : PR obligatoire, squash seul, check requis nommé exactement
  `Qualité · typecheck · test · build`. Ne jamais pousser directement sur `main`.
- **Ne jamais laisser Biome ou Knip toucher `.claude/`.**
- **Un lot n'est pas fini tant que `/verif` n'est pas vert** : `pnpm build`, `pnpm typecheck`,
  `pnpm test`, `pnpm lint`, `pnpm knip`, dans cet ordre.
- **Les quatre états restent atteignables depuis l'URL** (`?etat=chargement`, `?etat=erreur`,
  `?etat=vide`), derrière `import.meta.env.DEV`.
- **Piège des clés de cache TanStack Query** : toute donnée présente dans la clé de lecture doit
  l'être dans la clé d'écriture.
- **Serveur de dev laissé tournant** : arrêter Vite avant tout changement de branche ou fusion, et
  vérifier que le port 3000 est libre — `TaskStop` ne tue pas toujours le processus enfant.

---

## Ce que l'exploration a corrigé dans la spec

Quatre écarts entre la conception et le terrain, relevés avant d'écrire les tâches. Chacun est
absorbé par le plan ; ils sont listés ici pour que l'écart soit visible plutôt que caché.

| # | La spec dit | Le terrain dit | Ce que fait le plan |
|---|---|---|---|
| 1 | **1 318 exercices** (six paires de doublons exacts) | Deux paires de plus ne diffèrent que par la ponctuation — `dumbbell close-grip press` / `dumbbell close grip press`, et `… curl (over incline bench)` / `… curl over incline bench` — avec groupe, équipement, cible et muscles identiques. Elles produisent le **même slug** | Déduplication sur le **slug du nom anglais**, et non sur le nom brut, id le plus petit conservé → **1 316 exercices**. Le slug devient unique par construction, ce qui permet à l'`upsert` du semis de s'y appuyer. Tâche 3. |
| 2 | `normaliserRecherche` est en PR 1 | Le semis a besoin de plus : composer les deux noms avant de normaliser | `texteRecherche(nomFr, nomAnglais)` s'ajoute à côté, dans `shared`, testée. Le semis et les tests de service l'emploient tous deux. Tâche 1. |
| 3 | Le dataset est « cloné dans `Desktop/dev/exercises-dataset` » | Ce chemin est **hors du dépôt** : ni la CI ni un clone nu ne pourraient lancer les tests de données ou le semis | Un extrait des champs utiles (0,89 Mo) est **vendorisé** en `packages/db/catalogue/source.json`. La licence le permet : les **données** du dataset sont MIT. Tâche 3. |
| 4 | — | Cinq noms portent un **mojibake** (`sled 45в° leg press` et ses variantes, 4 entrées : `°` décodé en cp1251) et un porte un artefact de colonne (`dumbbell rear delt row_shoulder`) | Réparés à l'extraction, et un test refuse qu'il en reste. Tâche 3. |

---

## Structure des fichiers

### PR 1 — fabriquer le catalogue

| Fichier | Responsabilité |
|---|---|
| `packages/shared/src/recherche.ts` | `normaliserRecherche`, `texteRecherche`, `slugifier` — la seule normalisation, écriture et lecture |
| `packages/shared/src/recherche.test.ts` | Ses tests (TDD) |
| `packages/shared/src/vocabulaire.ts` | L'union `Groupe` et ses dix libellés français |
| `packages/shared/src/vocabulaire.test.ts` | Unicité et exhaustivité des libellés |
| `packages/db/catalogue/extraire.ts` | Script manuel : lit le dataset externe, répare, déduplique, écrit `source.json` |
| `packages/db/catalogue/source.json` | **Généré une fois, commité.** 1 316 entrées, champs utiles, noms anglais |
| `packages/db/catalogue/source.test.ts` | Les invariants de l'extrait : compte, unicité, propreté |
| `packages/db/catalogue/LICENSE-dataset.md` | L'avis MIT des données, et le statut des médias (D46) |
| `packages/db/catalogue/vocabulaire.json` | **Écrit.** Équipements, cibles, muscles : anglais → français |
| `packages/db/catalogue/noms-fr.json` | **Écrit.** id → nom français (D45) |
| `packages/db/catalogue/noms-fr.test.ts` | Complétude et unicité des noms, couverture des vocabulaires |
| `packages/db/prisma/seed.ts` | Le semis : lit les trois JSON, `upsert` par lots sur le slug |
| `packages/db/prisma/env.ts` | Charge le `.env` avant l'import du client Prisma |
| `packages/db/prisma/schema.prisma` | `nomFr`, `nomRecherche` et son index |
| `packages/db/vitest.config.ts` | Nouveau : `packages/db` n'avait pas de tests |

### PR 2 — servir le catalogue

| Fichier | Responsabilité |
|---|---|
| `packages/shared/src/exercices.ts` | Les schémas Zod du contrat : requête de liste, forme d'un exercice |
| `packages/shared/src/exercices.test.ts` | Les bornes du schéma : pagination, valeurs refusées |
| `apps/api/src/services/exercices.ts` | La logique : recherche, filtres, pagination, détail. Ignore Hono |
| `apps/api/src/services/exercices.test.ts` | Ses tests : fonctions pures, sans base |
| `apps/api/src/routes/exercices.ts` | Les deux routes Hono, validation Zod, rien d'autre |
| `apps/api/src/routes/exercices.test.ts` | Le montage, les codes de retour, le 404 |
| `packages/api-client/` | D42 : le client RPC, extrait de `apps/web/src/lib/api.ts` |
| `apps/web/src/features/exercices/requetes.ts` | Les `queryOptions` TanStack Query, clés comprises |
| `apps/web/src/routes/_protege.exercices.tsx` | Branchement : `EXERCICES` factice → `useQuery` |
| `apps/web/src/features/exercices/liste-exercices.tsx` | Le type change, le dessin ne change pas |
| `apps/web/src/features/exercices/detail-exercice.tsx` | Idem, plus le nom anglais, l'animation, les muscles et les instructions |
| `apps/web/src/features/exercices/animation-exercice.tsx` | Le GIF, son attribution, et son repli s'il ne charge pas (D46) |

---

# PR 1 — fabriquer le catalogue

Branche : `feat/lot-4-catalogue-francais` (déjà créée, elle porte la conception).
À la fin de cette PR, le catalogue est en base et interrogeable à la main. Rien n'est encore à
l'écran, et c'est voulu : cette PR se relit **en lisant du français**.

---

### Task 1: `normaliserRecherche`

C'est la pièce dont tout le reste dépend : la colonne `nomRecherche` est remplie par elle au
semis, et la saisie de l'utilisateur passe par elle à la lecture. **Si les deux normalisaient
différemment, ne serait-ce que d'une casse, la colonne serait inutile et rien ne se trouverait.**
D'où sa place dans `shared`, et d'où le TDD.

**Files:**
- Create: `packages/shared/src/recherche.ts`
- Test: `packages/shared/src/recherche.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: rien.
- Produces, exportés depuis `@better-lift/shared` :
  - `normaliserRecherche(valeur: string): string`
  - `texteRecherche(nomFr: string, nomAnglais: string): string` — ce que le semis écrit dans
    `nomRecherche` : les deux noms, normalisés (D44)
  - `slugifier(nom: string): string` — la même normalisation, espaces en tirets

- [ ] **Step 1: Write the failing test**

Créer `packages/shared/src/recherche.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { normaliserRecherche, slugifier, texteRecherche } from "./recherche.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @better-lift/shared exec vitest run src/recherche.test.ts`
Expected: FAIL — `Failed to resolve import "./recherche.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/shared/src/recherche.ts` :

```ts
/**
 * La normalisation de recherche, en un seul endroit.
 *
 * Elle sert DEUX FOIS et doit donc être unique : le semis la passe sur les noms
 * pour remplir `Exercise.nomRecherche`, et l'API la passe sur la saisie
 * avant de comparer. Deux implémentations qui divergeraient d'une casse ou d'un
 * accent rendraient la colonne inutile — la requête ne trouverait rien, sans la
 * moindre erreur pour le signaler.
 *
 * `NFD` sépare la lettre de son diacritique, `\p{Diacritic}` retire le second :
 * « é » devient « e », « ç » devient « c ». Tout ce qui n'est ni lettre ASCII ni
 * chiffre devient un espace — les symboles ne collent donc jamais deux mots
 * ensemble, et « 3/4 sit-up » se cherche en tapant « 3 4 sit up » comme en
 * tapant « sit up ».
 */
export function normaliserRecherche(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Le contenu de `Exercise.nomRecherche` : le nom français PUIS le nom anglais,
 * normalisés ensemble (D44). « developpe couche » et « bench press » trouvent
 * donc le même exercice. Le français vient en tête pour que trier sur cette
 * colonne revienne à trier sur le nom affiché.
 */
export function texteRecherche(nomFr: string, nomAnglais: string): string {
  return normaliserRecherche(`${nomFr} ${nomAnglais}`);
}

/**
 * Le slug d'un exercice : son identifiant dans l'URL.
 *
 * Il est tiré du nom ANGLAIS, qui ne bouge jamais : corriger un nom français ne
 * doit pas casser une URL, ni faire créer une ligne de plus au semis, qui
 * `upsert` sur le slug. Il dérive de `normaliserRecherche` plutôt que d'avoir sa
 * propre normalisation, et le détourage fait le reste : aucun tiret en tête, en
 * queue, ni en double.
 */
export function slugifier(nom: string): string {
  return normaliserRecherche(nom).replace(/ /g, "-");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @better-lift/shared exec vitest run src/recherche.test.ts`
Expected: PASS — 14 tests.

- [ ] **Step 5: Exporter depuis l'index du paquet**

Modifier `packages/shared/src/index.ts` — les exports sont triés alphabétiquement par module :

```ts
export { estAutorisee, normaliserListe } from "./allowlist.js";
export { cleJour, formatJour, memeJour } from "./calendar.js";
export { normaliserRecherche, slugifier, texteRecherche } from "./recherche.js";
export { estimate1RM, type SetType, setVolume } from "./training.js";
export { kgToLb, lbToKg, type UnitSystem } from "./units.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/recherche.ts packages/shared/src/recherche.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): normalisation de recherche, unique pour l'écriture et la lecture"
```

---

### Task 2: les libellés des groupes musculaires

D41 : `bodyPart` reste l'enum anglaise — c'est une clé de données, elle sert aux filtres, aux
index et aux URL, et elle ne doit pas changer parce qu'un libellé change. Le français vient d'un
`Record<Groupe, string>` : **TypeScript refuse de compiler si une valeur n'a pas de libellé**,
ce qui rend l'exhaustivité structurelle plutôt que surveillée.

**Le piège à connaître :** `packages/shared` n'a pas le droit d'importer Prisma (règle
d'architecture). L'union ne peut donc pas être `BodyPart`. Elle est redéclarée ici, et le pont
avec l'enum est tenu par un test qui lit `schema.prisma` (tâche 3) — pas par une assertion de
type, qui se contenterait de valoir `never` sans rien signaler.

Les 87 autres termes des vocabulaires fixes — équipements, cibles, muscles secondaires — **ne
passent pas par `shared`** : la spec les fait stocker en français en base (§ 4), ils sont donc
traduits au semis et jamais au rendu. Les envoyer au navigateur serait 87 chaînes mortes. Ils
vivent en tâche 4, dans `packages/db/catalogue/vocabulaire.json`.

**Files:**
- Create: `packages/shared/src/vocabulaire.ts`
- Test: `packages/shared/src/vocabulaire.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: rien.
- Produces, exportés depuis `@better-lift/shared` :
  - `GROUPES: readonly Groupe[]` — les 10 valeurs, dans l'ordre d'affichage
  - `type Groupe = "CHEST" | "BACK" | "SHOULDERS" | "UPPER_ARMS" | "LOWER_ARMS" | "UPPER_LEGS" | "LOWER_LEGS" | "WAIST" | "CARDIO" | "NECK"`
  - `LIBELLE_GROUPE: Record<Groupe, string>`

- [ ] **Step 1: Write the failing test**

Créer `packages/shared/src/vocabulaire.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { GROUPES, LIBELLE_GROUPE } from "./vocabulaire.js";

describe("vocabulaire des groupes musculaires", () => {
  it("porte les dix valeurs de l'enum, sans doublon", () => {
    expect(GROUPES).toHaveLength(10);
    expect(new Set(GROUPES).size).toBe(10);
  });

  it("donne un libellé non vide à chaque groupe", () => {
    for (const groupe of GROUPES) {
      expect(LIBELLE_GROUPE[groupe]).toBeTruthy();
    }
  });

  // Deux groupes qui porteraient le même libellé seraient indistinguables dans
  // un filtre — le typage ne l'interdit pas, ce test si.
  it("ne donne jamais deux fois le même libellé", () => {
    const libelles = GROUPES.map((g) => LIBELLE_GROUPE[g]);
    expect(new Set(libelles).size).toBe(libelles.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @better-lift/shared exec vitest run src/vocabulaire.test.ts`
Expected: FAIL — `Failed to resolve import "./vocabulaire.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/shared/src/vocabulaire.ts` :

```ts
/**
 * Les groupes musculaires, et eux seuls.
 *
 * D41 : `bodyPart` reste une enum anglaise en base — c'est une clé de données,
 * elle sert aux filtres, aux index et aux URL, et elle ne doit pas bouger parce
 * qu'un libellé bouge. Seul l'affichage est français.
 *
 * L'union est REDÉCLARÉE ici plutôt qu'importée de Prisma : `shared` n'a pas le
 * droit d'importer Prisma (règle d'architecture), sans quoi le mobile et le web
 * traîneraient le client de base de données. Le pont avec l'enum réelle est tenu
 * par un test de `packages/db` qui relit `schema.prisma` — voir
 * `packages/db/catalogue/source.test.ts`.
 *
 * `Record<Groupe, string>` fait le reste : ajouter une valeur à `GROUPES` sans
 * lui donner de libellé ne compile pas.
 */
export const GROUPES = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "UPPER_ARMS",
  "LOWER_ARMS",
  "UPPER_LEGS",
  "LOWER_LEGS",
  "WAIST",
  "CARDIO",
  "NECK",
] as const;

export type Groupe = (typeof GROUPES)[number];

export const LIBELLE_GROUPE: Record<Groupe, string> = {
  CHEST: "Pectoraux",
  BACK: "Dos",
  SHOULDERS: "Épaules",
  UPPER_ARMS: "Bras",
  LOWER_ARMS: "Avant-bras",
  UPPER_LEGS: "Cuisses",
  LOWER_LEGS: "Mollets",
  WAIST: "Abdominaux",
  CARDIO: "Cardio",
  NECK: "Nuque",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @better-lift/shared exec vitest run src/vocabulaire.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Exporter depuis l'index du paquet**

Modifier `packages/shared/src/index.ts` :

```ts
export { estAutorisee, normaliserListe } from "./allowlist.js";
export { cleJour, formatJour, memeJour } from "./calendar.js";
export { normaliserRecherche, slugifier, texteRecherche } from "./recherche.js";
export { estimate1RM, type SetType, setVolume } from "./training.js";
export { kgToLb, lbToKg, type UnitSystem } from "./units.js";
export { type Groupe, GROUPES, LIBELLE_GROUPE } from "./vocabulaire.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/vocabulaire.ts packages/shared/src/vocabulaire.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): libellés français des groupes musculaires"
```

---

### Task 3: vendoriser l'extrait du dataset

Le dataset vit **hors du dépôt**, dans `C:\Users\alexi\Desktop\dev\exercises-dataset` (commit
`7455efa`). Les tests de données et le semis doivent tourner sur un clone nu et en CI : la source
doit donc entrer dans le dépôt. On n'y met pas les 17,5 Mo du fichier original — dix langues d'instructions,
des champs de média inutiles — mais un extrait des champs utiles, **0,89 Mo**.

**La licence le permet, et seulement pour les données.** Le `LICENSE` du dataset est MIT et
couvre explicitement « names, categories, body parts, equipment, targets, muscle groups, and
multilingual instructions ». Les **médias** en sont exclus : ils appartiennent à Gym visual,
redistribués dans ce dataset par permission écrite séparée, en 180×180, avec attribution
obligatoire, et le `NOTICE.md` précise que « cloning this repo is not a license ». On ne copie
donc **aucune image** ; `gif` garde le chemin relatif, et c'est le semis qui en fait une URL vers
le dépôt du dataset (D46, tâche 5).

Cette tâche installe aussi l'outillage de test de `packages/db`, qui n'en avait pas.

**Files:**
- Create: `packages/db/catalogue/extraire.ts`
- Create: `packages/db/catalogue/source.json` *(généré par le script ci-dessus)*
- Create: `packages/db/catalogue/LICENSE-dataset.md`
- Test: `packages/db/catalogue/source.test.ts`
- Create: `packages/db/vitest.config.ts`
- Modify: `packages/db/package.json`
- Modify: `packages/db/tsconfig.json`
- Modify: `biome.json`
- Modify: `knip.json`

**Interfaces:**
- Consumes: `GROUPES` de `@better-lift/shared` (tâche 2) ; `slugifier` (tâche 1).
- Produces : `packages/db/catalogue/source.json`, un tableau de

  ```ts
  type EntreeSource = {
    id: string;          // l'id du dataset, « 0001 » à « 3000 », conservé tel quel
    nom: string;         // le nom ANGLAIS, réparé. Le français vient en tâche 4
    groupe: string;      // une valeur de l'enum BodyPart : « CHEST », « UPPER_LEGS »…
    equipement: string;  // anglais : « dumbbell », « barbell »…
    cible: string;       // anglais : « pectorals », « quads »…
    secondaires: string[]; // anglais
    gif: string;         // chemin relatif dans le dataset, JAMAIS une URL
    etapes: string[];    // les instructions, DÉJÀ en français dans le dataset
  };
  ```

  `source.json` est **trié par id** et contient **1 316 entrées**, dont les slugs sont uniques.

- [ ] **Step 1: Installer l'outillage de test de `packages/db`**

Le paquet n'a ni `vitest` ni `tsx`. `tsx` sert à lancer les scripts de `catalogue/` et le semis.

```bash
pnpm --filter @better-lift/db add -D vitest@catalog: tsx
pnpm --filter @better-lift/db add @better-lift/shared@workspace:*
```

Créer `packages/db/vitest.config.ts` — calqué sur `packages/shared/vitest.config.ts`, mais
pointé sur `catalogue/` : les tests de ce paquet portent sur des **données**, pas sur `src/`.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["catalogue/**/*.test.ts"] },
});
```

Modifier `packages/db/package.json` — ajouter deux scripts à côté des existants :

```json
  "scripts": {
    "generate": "prisma generate",
    "migrate": "prisma migrate dev",
    "studio": "prisma studio",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo node_modules src/generated"
  },
```

Modifier `packages/db/tsconfig.json` — `catalogue/` et `prisma/` sont hors de `src/` :

```json
{
  "extends": "@better-lift/config/tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src/**/*.ts", "catalogue/**/*.ts", "prisma/*.ts"]
}
```

**Ne pas activer `resolveJsonModule`.** Les JSON du catalogue sont lus par `readFileSync`, jamais
par `import`. Un `import` de `source.json` ferait type-checker 0,89 Mo de littéral à chaque
`tsc`, pour un type que personne ne consulte.

- [ ] **Step 2: Écrire le script d'extraction**

Créer `packages/db/catalogue/extraire.ts` :

```ts
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Groupe, GROUPES, slugifier } from "@better-lift/shared";

/**
 * Extrait le catalogue depuis le dataset externe.
 *
 * Script MANUEL, lancé une fois — il ne tourne ni au semis, ni en CI, ni au
 * build. Son résultat, `source.json`, est commité : c'est lui que lisent les
 * tests et le semis, pour que le catalogue ne dépende pas d'un dossier qui vit
 * hors du dépôt.
 *
 *     pnpm --filter @better-lift/db exec tsx catalogue/extraire.ts \
 *       ../../../exercises-dataset/data/exercises.json
 *
 * Trois choses se passent ici, et une seule fois :
 *  - la RÉPARATION des noms abîmés dans la source ;
 *  - la DÉDUPLICATION, huit paires d'entrées étant identiques en tout sauf l'id
 *    et, pour deux d'entre elles, la ponctuation du nom ;
 *  - la RÉDUCTION aux champs utiles — 17,5 Mo de dix langues deviennent 0,89 Mo.
 */

type Brut = {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  secondary_muscles?: string[];
  gif_url: string;
  instruction_steps: Record<string, string[] | undefined>;
};

type EntreeSource = {
  id: string;
  nom: string;
  groupe: Groupe;
  equipement: string;
  cible: string;
  secondaires: string[];
  gif: string;
  etapes: string[];
};

// « upper legs » -> « UPPER_LEGS ». La correspondance est mécanique, mais elle
// est écrite plutôt que calculée : une valeur inattendue dans la source doit
// faire ÉCHOUER l'extraction, pas produire silencieusement un groupe inventé.
const GROUPE_DEPUIS_DATASET: Record<string, Groupe> = {
  chest: "CHEST",
  back: "BACK",
  shoulders: "SHOULDERS",
  "upper arms": "UPPER_ARMS",
  "lower arms": "LOWER_ARMS",
  "upper legs": "UPPER_LEGS",
  "lower legs": "LOWER_LEGS",
  waist: "WAIST",
  cardio: "CARDIO",
  neck: "NECK",
};

/**
 * Deux défauts d'encodage dans la source, repérés à l'exploration :
 *  - « sled 45в° leg press » et trois variantes : le `°` (C2 B0 en UTF-8) a été
 *    relu en cp1251, ce qui donne « в° ». Quatre entrées.
 *  - « dumbbell rear delt row_shoulder » : un reste de colonne collé au nom.
 * Sans cette réparation, le nom anglais affiché en sous-titre et la recherche
 * porteraient « 45в° ».
 */
function reparer(nom: string): string {
  return nom.replace(/в°/g, "°").replace(/_shoulder$/, "");
}

const chemin = process.argv[2];
if (!chemin) {
  throw new Error("Usage : tsx catalogue/extraire.ts <chemin vers data/exercises.json>");
}

const brut = JSON.parse(readFileSync(chemin, "utf8")) as Brut[];

// Déduplication sur le SLUG du nom réparé, l'id le plus petit l'emportant.
// Six paires d'entrées ne diffèrent que par l'id et le média : « lever chest
// press », « ez barbell spider curl », « barbell seated calf raise », « smith
// reverse calf raises », « self assisted inverse leg curl », « push-up (on
// stability ball) ». Deux autres ne diffèrent en plus que par la ponctuation —
// « dumbbell close-grip press » / « dumbbell close grip press », et « dumbbell
// standing one arm curl (over incline bench) » / « … over incline bench » —
// avec groupe, équipement, cible et muscles identiques : dédupliquer sur le nom
// brut les laisserait passer, et elles tomberaient sur le même slug. Le `slug`
// est `@unique` et c'est la clé de l'`upsert` du semis : cette passe le rend
// unique par construction.
const parSlug = new Map<string, EntreeSource>();

for (const e of [...brut].sort((a, b) => a.id.localeCompare(b.id))) {
  const nom = reparer(e.name);
  const slug = slugifier(nom);
  if (parSlug.has(slug)) continue;

  const groupe = GROUPE_DEPUIS_DATASET[e.body_part];
  if (!groupe) throw new Error(`body_part inconnu : « ${e.body_part} » (id ${e.id})`);

  const etapes = e.instruction_steps.fr;
  if (!etapes?.length) throw new Error(`instructions françaises absentes (id ${e.id})`);

  parSlug.set(slug, {
    id: e.id,
    nom,
    groupe,
    equipement: e.equipment,
    cible: e.target,
    secondaires: e.secondary_muscles ?? [],
    gif: e.gif_url,
    etapes,
  });
}

if (GROUPES.length !== Object.keys(GROUPE_DEPUIS_DATASET).length) {
  throw new Error("La correspondance des groupes ne couvre plus l'union `Groupe` de `shared`.");
}

const sortie = [...parSlug.values()].sort((a, b) => a.id.localeCompare(b.id));
const ici = path.dirname(fileURLToPath(import.meta.url));
writeFileSync(path.join(ici, "source.json"), `${JSON.stringify(sortie, null, 2)}\n`, "utf8");

console.log(`${sortie.length} exercices écrits dans source.json (${brut.length} en entrée)`);
```

- [ ] **Step 3: Lancer l'extraction**

```bash
pnpm --filter @better-lift/db exec tsx catalogue/extraire.ts \
  "C:/Users/alexi/Desktop/dev/exercises-dataset/data/exercises.json"
```

Expected : `1316 exercices écrits dans source.json (1324 en entrée)`.

Si le compte diffère, **ne pas ajuster le test** : le dataset a changé, et c'est l'écart qu'il
faut comprendre d'abord.

- [ ] **Step 4: Reprendre l'avis de licence**

Créer `packages/db/catalogue/LICENSE-dataset.md`. La MIT impose que l'avis accompagne toute
portion substantielle ; c'est le cas de `source.json`.

```markdown
# Origine des données du catalogue

`source.json` est un extrait de [exercises-dataset](https://github.com/yildirimemir/exercises-dataset),
réduit aux champs utilisés par better-lift et dédupliqué. Les **données** — noms, catégories,
groupes, équipements, cibles, instructions multilingues — sont sous licence MIT :

> MIT License — Copyright (c) 2026 Hasan Emir Yıldırım
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software
> and associated documentation and data files (the "Software"), to deal in the Software without
> restriction, including without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
> BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Les médias : affichés, jamais copiés (D46)

La MIT ci-dessus **ne couvre pas** les images et les GIF du dataset. Ils appartiennent à
**Gym visual — https://gymvisual.com/**, et n'y sont redistribués qu'en vertu d'une permission
écrite séparée, à trois conditions : résolution 180×180, attribution visible, et — textuellement —
« cloning this repo is not a license ».

better-lift est une application **privée, à trois comptes**, sans public ni monétisation. Le
24 septembre 2026, il a été décidé d'afficher les animations comme le fait opengym, sans les
héberger :

- **aucun média n'est copié** dans ce dépôt ;
- le champ `gif` de `source.json` garde le chemin relatif du dataset (`videos/0001-2gPfomN.gif`) ;
  le semis en fait une URL vers le dépôt du dataset, **figée sur le commit `7455efa`** ;
- chaque animation est affichée en 180×180 au plus, avec la mention **« © Gym visual —
  https://gymvisual.com/ »**.

Si l'application devait s'ouvrir à d'autres, cette décision serait la première à reprendre : il
faudrait alors une licence auprès de Gym visual, ou d'autres médias.
```

- [ ] **Step 5: Write the failing test**

Créer `packages/db/catalogue/source.test.ts` :

```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @better-lift/db exec vitest run catalogue/source.test.ts`
Expected: PASS — 6 tests. *(Le fichier `source.json` existe déjà depuis l'étape 3 : ce test
constate l'extraction plutôt que de la piloter. C'est délibéré — il n'y a pas de comportement à
faire émerger, seulement des invariants de données à verrouiller.)*

- [ ] **Step 7: Tenir Biome et Knip à l'écart des données**

Modifier `biome.json` — `source.json` est un fichier vendorisé, jamais retouché à la main ; le
reformater à chaque `pnpm lint` coûte du temps et produit un diff de 0,89 Mo au premier passage :

```json
  "files": {
    "includes": [
      "**",
      "!**/dist",
      "!**/.turbo",
      "!**/node_modules",
      "!.claude",
      "!**/.expo",
      "!**/generated",
      "!**/routeTree.gen.ts",
      "!packages/db/catalogue/source.json"
    ]
  },
```

Modifier `knip.json` — `catalogue/` et `prisma/` sortent de `src/`, et les scripts qui s'y
trouvent ne sont importés par personne : ce sont des points d'entrée, pas du code mort.

```json
    "packages/db": {
      "entry": ["src/index.ts", "catalogue/extraire.ts"],
      "project": ["src/**/*.ts", "catalogue/**/*.ts", "prisma/**/*.{ts,prisma}"]
    },
```

- [ ] **Step 8: Vérifier la chaîne complète**

```bash
pnpm typecheck && pnpm test && pnpm lint && pnpm knip
```

Expected: tout passe. `pnpm test` fait désormais tourner un quatrième paquet, `@better-lift/db`.

**`turbo.json` n'a rien à changer, et c'est vérifié plutôt que supposé** : ce lot n'introduit
aucune variable d'environnement. Les tests de `packages/db` lisent des fichiers et ne touchent ni
PostgreSQL ni `prisma.config.ts`. Si une variable devait apparaître plus tard, elle irait dans le
bloc `env` de la tâche concernée — la poser sur l'étape du workflow ne suffirait pas.

- [ ] **Step 9: Commit**

```bash
git add packages/db/catalogue packages/db/vitest.config.ts packages/db/package.json \
        packages/db/tsconfig.json biome.json knip.json pnpm-lock.yaml
git commit -m "feat(db): vendorise l'extrait du dataset, 1 316 exercices dédupliqués"
```

---

### Task 4: les noms français et les vocabulaires

D45 : **le nom français est une donnée écrite, pas le produit d'un moteur.** Il n'y a ni
glossaire, ni script de traduction, ni fichier généré. `noms-fr.json` est rédigé une fois, par
lots, relu en diff, et commité ; le semis le lit tel quel. Corriger un nom plus tard, c'est
modifier une ligne et relancer le semis.

Deux fichiers **écrits** entrent ici, tenus par un seul fichier de tests :

- `vocabulaire.json` — les trois vocabulaires fermés (28 équipements, 19 cibles, 40 muscles),
  stockés en français en base ;
- `noms-fr.json` — id du dataset → nom français, 1 316 entrées.

**Files:**
- Create: `packages/db/catalogue/vocabulaire.json`
- Create: `packages/db/catalogue/noms-fr.json`
- Test: `packages/db/catalogue/noms-fr.test.ts`
- Modify: `biome.json`

**Interfaces:**
- Consumes: `source.json` (tâche 3).
- Produces:
  - `vocabulaire.json` : `{ equipements: Record<string,string>, cibles: Record<string,string>, muscles: Record<string,string> }`
  - `noms-fr.json` : `Record<string, string>` — id du dataset (« 0001 ») → nom français, clés
    triées par id, 1 316 entrées

- [ ] **Step 1: Écrire les 87 termes des vocabulaires fixes**

Créer `packages/db/catalogue/vocabulaire.json`. Ces trois vocabulaires sont **fermés** et écrits
une fois. Ce sont des étiquettes d'affichage, sans usage de recherche : ils entrent en base
directement en français.

```json
{
  "equipements": {
    "assisted": "Assisté",
    "band": "Élastique",
    "barbell": "Barre",
    "body weight": "Poids du corps",
    "bosu ball": "Bosu",
    "cable": "Poulie",
    "dumbbell": "Haltères",
    "elliptical machine": "Vélo elliptique",
    "ez barbell": "Barre EZ",
    "hammer": "Masse",
    "kettlebell": "Kettlebell",
    "leverage machine": "Machine à levier",
    "medicine ball": "Médecine-ball",
    "olympic barbell": "Barre olympique",
    "resistance band": "Bande élastique",
    "roller": "Rouleau",
    "rope": "Corde",
    "skierg machine": "SkiErg",
    "sled machine": "Machine guidée",
    "smith machine": "Smith machine",
    "stability ball": "Swiss ball",
    "stationary bike": "Vélo d'appartement",
    "stepmill machine": "Escalier mécanique",
    "tire": "Pneu",
    "trap bar": "Trap bar",
    "upper body ergometer": "Ergomètre à bras",
    "weighted": "Lesté",
    "wheel roller": "Roue abdominale"
  },
  "cibles": {
    "abductors": "Abducteurs",
    "abs": "Abdominaux",
    "adductors": "Adducteurs",
    "biceps": "Biceps",
    "calves": "Mollets",
    "cardiovascular system": "Système cardiovasculaire",
    "delts": "Deltoïdes",
    "forearms": "Avant-bras",
    "glutes": "Fessiers",
    "hamstrings": "Ischio-jambiers",
    "lats": "Grand dorsal",
    "levator scapulae": "Élévateur de la scapula",
    "pectorals": "Pectoraux",
    "quads": "Quadriceps",
    "serratus anterior": "Dentelé antérieur",
    "spine": "Érecteurs du rachis",
    "traps": "Trapèzes",
    "triceps": "Triceps",
    "upper back": "Haut du dos"
  },
  "muscles": {
    "abdominals": "Abdominaux",
    "ankle stabilizers": "Stabilisateurs de la cheville",
    "ankles": "Chevilles",
    "back": "Dos",
    "biceps": "Biceps",
    "brachialis": "Brachial",
    "calves": "Mollets",
    "chest": "Pectoraux",
    "core": "Gainage",
    "deltoids": "Deltoïdes",
    "feet": "Pieds",
    "forearms": "Avant-bras",
    "glutes": "Fessiers",
    "grip muscles": "Muscles de la prise",
    "groin": "Adducteurs",
    "hamstrings": "Ischio-jambiers",
    "hands": "Mains",
    "hip flexors": "Fléchisseurs de hanche",
    "inner thighs": "Intérieur des cuisses",
    "latissimus dorsi": "Grand dorsal",
    "lats": "Grand dorsal",
    "lower abs": "Bas des abdominaux",
    "lower back": "Bas du dos",
    "obliques": "Obliques",
    "quadriceps": "Quadriceps",
    "rear deltoids": "Deltoïdes postérieurs",
    "rhomboids": "Rhomboïdes",
    "rotator cuff": "Coiffe des rotateurs",
    "shins": "Tibias",
    "shoulders": "Épaules",
    "soleus": "Soléaire",
    "sternocleidomastoid": "Sterno-cléido-mastoïdien",
    "trapezius": "Trapèzes",
    "traps": "Trapèzes",
    "triceps": "Triceps",
    "upper back": "Haut du dos",
    "upper chest": "Haut des pectoraux",
    "wrist extensors": "Extenseurs du poignet",
    "wrist flexors": "Fléchisseurs du poignet",
    "wrists": "Poignets"
  }
}
```

- [ ] **Step 2: Write the failing test**

Créer `packages/db/catalogue/noms-fr.test.ts`. C'est le **seul** garde-fou de D45 : il garantit
qu'aucun nom n'est **absent**, pas qu'il soit **bon** — la relecture de l'étape 5 s'en charge, et
un nom maladroit reste de toute façon trouvable par son nom anglais (D44).

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type EntreeSource = {
  id: string;
  nom: string;
  equipement: string;
  cible: string;
  secondaires: string[];
};

const lire = <T>(nom: string): T =>
  JSON.parse(readFileSync(new URL(`./${nom}`, import.meta.url), "utf8")) as T;

const source = lire<EntreeSource[]>("source.json");
const nomsFr = lire<Record<string, string>>("noms-fr.json");
const vocabulaire = lire<{
  equipements: Record<string, string>;
  cibles: Record<string, string>;
  muscles: Record<string, string>;
}>("vocabulaire.json");

describe("noms-fr.json", () => {
  // Le message nomme les exercices en cause, avec leur nom anglais : on sait
  // quoi écrire sans aller fouiller `source.json`.
  it("donne un nom français à chacun des exercices de la source", () => {
    const manquants = source
      .filter((e) => !nomsFr[e.id]?.trim())
      .map((e) => `${e.id} « ${e.nom} »`);
    expect(manquants).toEqual([]);
  });

  // Une entrée sur un id absent de la source ne fait rien et ne le dit pas —
  // typiquement une faute de frappe dans l'id, qui laisse le vrai sans nom.
  it("ne porte aucun id inconnu de la source", () => {
    const ids = new Set(source.map((e) => e.id));
    expect(Object.keys(nomsFr).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("n'a ni espace en bord, ni minuscule initiale", () => {
    const fautifs = Object.entries(nomsFr).filter(
      ([, nom]) => nom !== nom.trim() || nom[0] !== nom[0]?.toLocaleUpperCase("fr"),
    );
    expect(fautifs).toEqual([]);
  });

  // Deux exercices distincts affichés sous le même nom seraient
  // indistinguables dans la liste. Le typage ne l'interdit pas, ce test si :
  // quand deux noms anglais retombent sur le même français, c'est le détail que
  // l'anglais porte (prise, inclinaison, un bras…) qui doit les départager.
  it("ne donne jamais deux fois le même nom", () => {
    const parNom = new Map<string, string[]>();
    for (const [id, nom] of Object.entries(nomsFr)) {
      parNom.set(nom, [...(parNom.get(nom) ?? []), id]);
    }
    const doublons = [...parNom.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([nom, ids]) => `« ${nom} » <- ${ids.join(", ")}`);
    expect(doublons).toEqual([]);
  });

  it("garde ses clés triées par id, pour que le diff reste lisible", () => {
    const cles = Object.keys(nomsFr);
    expect(cles).toEqual([...cles].sort());
  });
});

describe("vocabulaire.json", () => {
  /**
   * L'exhaustivité que le typage ne tient pas. Pour `bodyPart`, c'est
   * `Record<Groupe, string>` qui refuse de compiler (D41) ; pour les trois
   * vocabulaires restants, c'est ce test — et il porte sur les valeurs
   * RÉELLEMENT présentes dans la source, ce qui est plus fort qu'une liste
   * recopiée à la main.
   */
  it("traduit tous les équipements, cibles et muscles présents dans la source", () => {
    const manquants: string[] = [];
    for (const e of source) {
      if (!vocabulaire.equipements[e.equipement]) manquants.push(`équipement « ${e.equipement} »`);
      if (!vocabulaire.cibles[e.cible]) manquants.push(`cible « ${e.cible} »`);
      for (const m of e.secondaires) {
        if (!vocabulaire.muscles[m]) manquants.push(`muscle « ${m} »`);
      }
    }
    expect([...new Set(manquants)].sort()).toEqual([]);
  });
});
```

Créer `packages/db/catalogue/noms-fr.json` avec un objet vide, pour que le test échoue sur ce
qui compte — les noms manquants — et non sur un fichier introuvable :

```json
{}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @better-lift/db exec vitest run catalogue/noms-fr.test.ts`
Expected: FAIL — « donne un nom français à chacun des exercices » liste les 1 316 ids manquants.
Le test du vocabulaire, lui, passe déjà.

- [ ] **Step 4: Écrire les 1 316 noms, par lots de 100**

Afficher un lot à la fois — une commande jetable, rien n'est commité :

```bash
node -e "
const s = require('./packages/db/catalogue/source.json');
const [debut, fin] = [0, 100];   // puis 100-200, 200-300… jusqu'à 1316
for (const e of s.slice(debut, fin)) console.log(e.id + '\t' + e.nom + '\t' + e.equipement);
"
```

Pour chaque lot, ajouter les entrées à `noms-fr.json`, **clés dans l'ordre des ids**. Les règles
de rédaction — c'est le « français d'usage » de la spec, celui qu'on tape dans une recherche :

**Structure : le mouvement d'abord, puis ses précisions, puis l'équipement en suffixe.**
L'anglais est à tête finale, le français à tête initiale : « Dumbbell Incline Bench Press »
devient « Développé couché incliné aux haltères », jamais « Haltères développé… ».

| Équipement (`equipement`) | Suffixe |
|---|---|
| dumbbell | aux haltères — **à l'haltère** si un seul est en jeu (*one arm*, *single*) |
| barbell | à la barre |
| ez barbell | à la barre EZ |
| olympic barbell | à la barre olympique |
| trap bar | à la trap bar |
| cable | à la poulie |
| leverage machine, sled machine | à la machine |
| smith machine | à la Smith machine |
| band, resistance band | à l'élastique |
| kettlebell | au kettlebell |
| medicine ball | au médecine-ball |
| stability ball | sur swiss ball |
| bosu ball | sur bosu |
| rope | à la corde |
| body weight | *(aucun suffixe)* |
| weighted | lesté(e), accordé au mouvement |
| assisted | assisté(e), accordé au mouvement |

**Les anglicismes d'usage restent** : curl, squat, pushdown, crunch, sit-up, shrug, hip thrust,
kickback, pullover, face pull, good morning, burpee, leg extension, leg curl, dips.

**Les termes qui se traduisent** :

| Anglais | Français |
|---|---|
| bench press | développé couché |
| shoulder press, overhead press, military press | développé militaire |
| arnold press | développé Arnold |
| deadlift | soulevé de terre |
| romanian deadlift | soulevé de terre roumain |
| row | rowing |
| pull-up / chin-up | traction / traction supination |
| push-up | pompe |
| lunge | fente |
| fly | écarté |
| lateral raise / front raise | élévations latérales / élévations frontales |
| calf raise | extension des mollets |
| leg press | presse à cuisses |
| skull crusher | barre au front |
| hammer curl / preacher curl / concentration curl | curl marteau / curl pupitre / curl concentré |
| plank | gainage |
| incline / decline | incliné / décliné |
| close grip / wide grip / reverse grip | prise serrée / prise large / prise inversée |
| one arm / single leg | à un bras / sur une jambe |
| seated / standing / lying / kneeling | assis / debout / allongé / à genoux |
| alternate | alterné |

**L'accord se fait** : « Traction assistée », « Pompe déclinée », « Fente lestée ».

**Majuscule à l'initiale seulement**, sauf noms propres et sigles (Arnold, Smith, EZ).

Un exemple de lot rédigé — des ids réels, clés dans l'ordre :

```json
{
  "0001": "Sit-up 3/4",
  "0017": "Traction assistée",
  "0025": "Développé couché à la barre",
  "0032": "Soulevé de terre à la barre",
  "0241": "Pushdown triceps à la poulie (barre en V)",
  "0289": "Développé couché aux haltères",
  "0314": "Développé couché incliné aux haltères",
  "0585": "Leg extension à la machine"
}
```

Après chaque lot, relancer le test : le nombre de manquants doit baisser de 100, et le test
d'unicité signale immédiatement deux noms qui se télescopent — c'est le détail de l'anglais
(prise, inclinaison, un bras, assis ou debout) qui doit les départager.

```bash
pnpm --filter @better-lift/db exec vitest run catalogue/noms-fr.test.ts
```

- [ ] **Step 5: Faire relire les exercices courants par l'utilisateur**

Les tests garantissent qu'aucun nom n'est absent ; seul un humain dit s'il est **bon**. La spec
prévoit une relecture ciblée : les exercices qu'on fait vraiment passent sous les yeux de
l'utilisateur, la longue traîne se corrige à l'usage.

Extraire les exercices courants — les mouvements de base, sur les équipements de base :

```bash
node -e "
const s = require('./packages/db/catalogue/source.json');
const fr = require('./packages/db/catalogue/noms-fr.json');
const base = /bench press|squat|deadlift|\brow\b|pull-up|chin-up|push-up|curl|shoulder press|overhead press|lateral raise|lunge|\bdip|leg press|leg extension|leg curl|hip thrust|pushdown|fly|shrug|calf raise|crunch|plank/;
const equip = new Set(['barbell','dumbbell','cable','leverage machine','body weight','smith machine','ez barbell']);
for (const e of s) if (base.test(e.nom) && equip.has(e.equipement) && e.nom.split(' ').length <= 4)
  console.log(e.id + '  ' + e.nom.padEnd(40) + '→ ' + fr[e.id]);
"
```

**Présenter cette liste à l'utilisateur dans la conversation, et attendre son retour.** Appliquer
ses corrections dans `noms-fr.json`, relancer le test.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @better-lift/db exec vitest run catalogue/`
Expected: PASS — les tests de `source.test.ts` et de `noms-fr.test.ts`.

- [ ] **Step 7: Tenir Biome à l'écart des noms**

Modifier `biome.json` — le diff de `noms-fr.json` ne doit montrer que des noms, jamais un
reformatage :

```json
      "!packages/db/catalogue/source.json",
      "!packages/db/catalogue/noms-fr.json"
```

- [ ] **Step 8: Vérifier, puis commit**

```bash
pnpm test && pnpm lint && pnpm knip
```

```bash
git add packages/db/catalogue biome.json
git commit -m "feat(db): noms français des 1 316 exercices et vocabulaires fixes"
```

---

### Task 5: le schéma, la migration et le semis

Dernière tâche de la PR 1. À la fin, les 1 316 exercices sont dans la branche Neon `dev`, avec
leurs deux noms, et se retrouvent par une requête SQL tapée sans accents — ou en anglais.

**Deux colonnes s'ajoutent** : `nomFr` (D44), le nom affiché, et `nomRecherche` (D39), les deux
noms normalisés. `name` garde le nom anglais du dataset.

**Le semis `upsert` sur le slug**, et c'est sûr parce que le slug dérive du **nom anglais**, qui
ne bouge jamais : corriger un nom français modifie `nomFr` et `nomRecherche`, jamais le slug, donc
jamais une URL ni l'identité d'une ligne. La tâche 3 a rendu les slugs uniques par construction.

> **Un écart de nommage à noter** : les champs du modèle sont en anglais depuis le lot 0 (`name`,
> `bodyPart`, `gifUrl`), et la spec nomme les deux nouvelles colonnes en français (`nomFr`,
> `nomRecherche`). Le plan suit la spec, qui fait foi.

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/env.ts`
- Create: `packages/db/prisma/seed.ts`
- Modify: `packages/db/package.json`
- Modify: `knip.json`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `texteRecherche`, `slugifier` de `@better-lift/shared` (tâche 1) ; `source.json`
  (tâche 3) ; `noms-fr.json` et `vocabulaire.json` (tâche 4).
- Produces: 1 316 lignes dans `Exercise`, sur la branche Neon `dev` ; `gifUrl` porte une URL
  complète.

- [ ] **Step 1: Vérifier la branche Neon visée — AVANT toute migration**

Le `.env` n'est pas lisible par l'agent : impossible de constater directement quelle base est
pointée. Même procédure qu'au lot 3 — passer par l'API Neon :

```
mcp__plugin_neon_neon__list_postgres_endpoints  (projet late-bar-51472267)
```

Relever l'endpoint et la branche à laquelle il appartient, et **confirmer que c'est `dev`, jamais
`production`**. Si le doute subsiste, demander à l'utilisateur de lire la valeur de `DIRECT_URL`
dans son `.env` et de confirmer l'identifiant d'endpoint. **Ne pas migrer tant que ce n'est pas
établi** : `production` porte le catalogue de la V1.

- [ ] **Step 2: Modifier le schéma**

Modifier `packages/db/prisma/schema.prisma`, modèle `Exercise` :

```prisma
model Exercise {
  id           String   @id @default(cuid())
  // Dérivé du nom ANGLAIS, qui ne bouge jamais : c'est la clé de l'`upsert` du
  // semis, et l'identifiant de l'URL. Corriger un nom français ne le change pas.
  slug         String   @unique
  // Le nom anglais du dataset, conservé pour la recherche (D44).
  name         String
  // Le nom français, affiché. Vient de `catalogue/noms-fr.json` (D45).
  nomFr        String
  // Les deux noms dépouillés de leurs accents et de leur casse, remplis au semis
  // par `texteRecherche` de `shared` — qui passe par LA MÊME fonction que celle
  // qui normalise la saisie à la lecture (D39, D40). Deux normalisations
  // différentes rendraient la colonne inutile sans la moindre erreur.
  nomRecherche String
  instructions String[]
  bodyPart     BodyPart
  target       String
  equipment    String
  secondary    String[]
  // URL de l'animation dans le dépôt du dataset, figée sur un commit. Les médias
  // appartiennent à Gym visual : affichés avec attribution, jamais copiés (D46)
  // — voir catalogue/LICENSE-dataset.md.
  gifUrl       String?
  archivedAt   DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([bodyPart])
  @@index([equipment])
  @@index([nomRecherche])
}
```

L'index sur `nomRecherche` est un B-tree ordinaire : **aucune extension PostgreSQL n'est
requise**. Pas de `unaccent` à activer sur chaque branche Neon, pas d'index d'expression, et un
comportement identique en local, en CI et sur Neon.

- [ ] **Step 3: Appliquer la migration**

La table est vide (la branche `dev` ne porte aucun exercice), donc les deux colonnes non nulles
`nomFr` et `nomRecherche` s'ajoutent sans valeur par défaut et sans invite.

```bash
pnpm db:migrate --name catalogue_recherche
```

Expected : une migration créée sous `packages/db/prisma/migrations/`, appliquée sans invite.

Si Prisma réclame une valeur par défaut, **s'arrêter** : cela signifie que la table n'est pas
vide, donc que ce n'est pas la base attendue. Reprendre l'étape 1.

- [ ] **Step 4: Écrire le chargeur d'environnement du semis**

Créer `packages/db/prisma/env.ts` — même raison, et même piège, que `apps/api/src/env.ts` : les
imports ESM sont hissés, donc `@better-lift/db` lirait `DATABASE_URL` avant qu'une instruction
placée en tête de `seed.ts` ne s'exécute. En faire un **import à part entière, placé en premier**,
force l'ordre d'évaluation.

```ts
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Node ne charge pas le `.env` tout seul, et Prisma 7 ne le fait plus non plus :
// sans ce module, `process.env.DATABASE_URL` vaut `undefined` au moment où
// `../src/index.ts` construit son adaptateur. Il doit être le PREMIER import de
// `seed.ts` — les imports statiques sont hissés, et le corps d'un module ne
// s'exécute qu'une fois toutes ses dépendances évaluées.
const ici = path.dirname(fileURLToPath(import.meta.url));
const cheminEnv = path.join(ici, "../../../.env");

if (existsSync(cheminEnv)) {
  process.loadEnvFile(cheminEnv);
}
```

- [ ] **Step 5: Écrire le semis**

Créer `packages/db/prisma/seed.ts` :

```ts
import "./env.js";

import { readFileSync } from "node:fs";
import { type Groupe, slugifier, texteRecherche } from "@better-lift/shared";
import { prisma } from "../src/index.js";

/**
 * Le semis du catalogue.
 *
 * Il ne traduit RIEN : il lit `noms-fr.json`, écrit et commité (D45). Corriger
 * un nom, c'est modifier une ligne de ce fichier et relancer le semis.
 *
 *     pnpm db:seed
 *
 * Il est REJOUABLE : `upsert` sur le slug, jamais `create`. Le slug dérive du
 * nom anglais, qui ne bouge pas ; le relancer ne duplique rien et n'échoue pas.
 */

// Les animations restent dans le dépôt du dataset (D46) : on n'en copie aucune.
// L'URL est FIGÉE sur un commit, pour qu'un renommage en amont ne casse rien.
const BASE_MEDIAS =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/7455efae41b330c265e7cd4b78dfa848e7ce5ebd";

type EntreeSource = {
  id: string;
  nom: string;
  groupe: Groupe;
  equipement: string;
  cible: string;
  secondaires: string[];
  gif: string;
  etapes: string[];
};

type Vocabulaire = {
  equipements: Record<string, string>;
  cibles: Record<string, string>;
  muscles: Record<string, string>;
};

const lire = <T>(nom: string): T =>
  JSON.parse(readFileSync(new URL(`../catalogue/${nom}`, import.meta.url), "utf8")) as T;

const source = lire<EntreeSource[]>("source.json");
const nomsFr = lire<Record<string, string>>("noms-fr.json");
const vocabulaire = lire<Vocabulaire>("vocabulaire.json");

// Les 1 316 lignes en une seule transaction sont lentes depuis Francfort et
// tiennent un verrou bien trop longtemps. Par lots de 100, chaque lot est un
// aller-retour et une transaction courte.
const TAILLE_LOT = 100;

async function semer(): Promise<void> {
  let faits = 0;

  for (let debut = 0; debut < source.length; debut += TAILLE_LOT) {
    const lot = source.slice(debut, debut + TAILLE_LOT);

    await prisma.$transaction(
      lot.map((e) => {
        const nomFr = nomsFr[e.id];
        if (!nomFr) throw new Error(`Aucun nom français pour l'exercice ${e.id} (« ${e.nom} »)`);

        const equipment = vocabulaire.equipements[e.equipement];
        const target = vocabulaire.cibles[e.cible];
        if (!equipment) throw new Error(`Équipement non traduit : « ${e.equipement} »`);
        if (!target) throw new Error(`Cible non traduite : « ${e.cible} »`);

        const secondary = e.secondaires.map((m) => {
          const fr = vocabulaire.muscles[m];
          if (!fr) throw new Error(`Muscle non traduit : « ${m} »`);
          return fr;
        });

        const slug = slugifier(e.nom);
        const donnees = {
          name: e.nom,
          nomFr,
          nomRecherche: texteRecherche(nomFr, e.nom),
          instructions: e.etapes,
          bodyPart: e.groupe,
          target,
          equipment,
          secondary,
          gifUrl: `${BASE_MEDIAS}/${e.gif}`,
        };

        return prisma.exercise.upsert({
          where: { slug },
          create: { slug, ...donnees },
          update: donnees,
        });
      }),
    );

    faits += lot.length;
    console.log(`${faits} / ${source.length}`);
  }
}

await semer();
await prisma.$disconnect();
console.log(`Catalogue semé : ${source.length} exercices.`);
```

Modifier `packages/db/package.json` — ajouter le script que la racine appelle déjà via
`pnpm db:seed` :

```json
    "seed": "tsx prisma/seed.ts",
```

Modifier `knip.json` — `prisma/seed.ts` est un point d'entrée de plus :

```json
    "packages/db": {
      "entry": ["src/index.ts", "catalogue/extraire.ts", "prisma/seed.ts"],
      "project": ["src/**/*.ts", "catalogue/**/*.ts", "prisma/**/*.{ts,prisma}"]
    },
```

- [ ] **Step 6: Semer, puis semer une seconde fois**

```bash
pnpm db:seed
```

Expected : le compteur monte de 100 en 100 jusqu'à `1316 / 1316`, puis
`Catalogue semé : 1316 exercices.`

**Relancer immédiatement la même commande.** C'est le contrôle de rejouabilité, et il ne coûte
rien :

```bash
pnpm db:seed
```

Expected : même sortie, sans erreur de contrainte d'unicité.

- [ ] **Step 7: Vérifier en base — c'est le critère de sortie de la PR 1**

Par le MCP Neon (`run_sql`, branche `dev`) :

```sql
-- 1 316, et pas un de plus après deux semis.
SELECT count(*) FROM "Exercise";

-- Le critère de sortie du lot, réduit à deux requêtes : trouver un exercice
-- accentué en tapant sans accents, puis le même en tapant son nom anglais.
SELECT slug, "nomFr" FROM "Exercise" WHERE "nomRecherche" LIKE '%developpe couche%' LIMIT 5;
SELECT slug, "nomFr" FROM "Exercise" WHERE "nomRecherche" LIKE '%bench press%' LIMIT 5;

-- Aucun résidu anglais visible sur les vocabulaires fixes.
SELECT DISTINCT equipment FROM "Exercise" ORDER BY 1;

-- Une URL d'animation complète, figée sur le commit.
SELECT "gifUrl" FROM "Exercise" LIMIT 1;
```

Expected : 1 316 lignes ; les deux requêtes de recherche rendent les mêmes développés couchés ;
la troisième ne rend que du français ; la dernière une URL `https://raw.githubusercontent.com/…/7455efae…/videos/….gif`
— l'ouvrir dans un navigateur doit afficher l'animation.

- [ ] **Step 8: Mettre `CLAUDE.md` à jour**

Trois points de ce lot appartiennent à la mémoire durable du dépôt, pas au plan. Ajouter à la
section **Pièges qui coûtent cher** :

```markdown
- **Le catalogue porte deux noms.** `name` est l'anglais du dataset, `nomFr` le français
  affiché, et `nomRecherche` les deux normalisés : la recherche trouve dans les deux langues.
  Les noms français sont **écrits** dans `packages/db/catalogue/noms-fr.json`, par id du
  dataset — corriger un nom, c'est modifier une ligne et relancer `pnpm db:seed`. Le slug
  dérive du nom anglais et ne bouge donc jamais.
- **Les médias du catalogue sont affichés, jamais copiés.** Les données du dataset sont MIT, les
  GIF appartiennent à **Gym visual**. Choix assumé pour une application privée (D46) :
  `gifUrl` pointe vers le dépôt du dataset, figé sur un commit, et l'attribution « © Gym
  visual » accompagne chaque animation. Aucun média n'entre dans le dépôt.
```

Et mettre à jour la section **État** : le lot 3 est fusionné, le lot 4 est en cours.
La ligne `Branches production (catalogue semé, 1 324 exercices) et dev (archivée, à réactiver)`
de la section **MCP** devient :

```markdown
  Branches `production` (catalogue de la V1, non repris) et `dev` (active — catalogue semé,
  1 316 exercices).
```

- [ ] **Step 9: `/verif` et commit**

```bash
pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm knip
```

```bash
git add packages/db CLAUDE.md knip.json
git commit -m "feat(db): colonne de recherche, migration et semis du catalogue"
```

- [ ] **Step 10: Ouvrir la PR 1**

```bash
git push -u origin feat/lot-4-catalogue-francais
gh pr create --title "feat: lot 4 (1/2) — le catalogue français, fabriqué et semé" --body "..."
```

Le corps de la PR doit dire, en clair : le compte réel (1 316 et pourquoi pas 1 324), ce que les
tests garantissent (aucun nom absent ni en double) et ce qu'ils ne garantissent pas (la qualité
d'un nom — relue sur les exercices courants), et le statut des médias (D46). Attendre le check
`Qualité · typecheck · test · build`, puis fusionner en squash.

---

# PR 2 — servir le catalogue

Branche : `feat/lot-4-catalogue-a-l-ecran`, **partant de `main` après la fusion de la PR 1**.
Cette PR se relit en lisant du TypeScript. À la fin, les exercices sont à l'écran et la recherche
marche à la frappe.

---

### Task 6: le contrat partagé

Zod dans `shared` est la source unique du contrat (règle d'architecture). Ce module ne décrit que
**l'entrée** : la sortie, elle, est inférée par Hono RPC depuis le gestionnaire — la décrire deux
fois ferait diverger les deux descriptions.

**Files:**
- Create: `packages/shared/src/exercices.ts`
- Test: `packages/shared/src/exercices.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: `GROUPES`, `type Groupe` de `./vocabulaire.js` (tâche 2).
- Produces, exportés depuis `@better-lift/shared` :
  ```ts
  export const requeteCatalogue: z.ZodType<RequeteCatalogue>;
  export type RequeteCatalogue = {
    q?: string; groupe?: Groupe; equipement?: string; page: number; taille: number;
  };
  export type ExerciceResume = { slug: string; nom: string; groupe: Groupe; equipement: string };
  export type ExerciceDetail = ExerciceResume & {
    nomAnglais: string; gif: string | null;
    cible: string; secondaires: string[]; instructions: string[];
  };
  export const ATTRIBUTION_MEDIAS: string; // « © Gym visual — https://gymvisual.com/ »
  ```

- [ ] **Step 1: Write the failing test**

Créer `packages/shared/src/exercices.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { requeteCatalogue } from "./exercices.js";

describe("requeteCatalogue", () => {
  it("accepte une requête vide et pose ses valeurs par défaut", () => {
    expect(requeteCatalogue.parse({})).toEqual({ page: 1, taille: 50 });
  });

  // Les paramètres d'URL arrivent en chaînes : sans coercition, `page=2`
  // échouerait au parse et l'API répondrait 400 sur une requête valide.
  it("convertit les nombres reçus en chaînes", () => {
    expect(requeteCatalogue.parse({ page: "3", taille: "20" })).toMatchObject({
      page: 3,
      taille: 20,
    });
  });

  it("refuse un groupe qui n'est pas dans l'enum", () => {
    expect(() => requeteCatalogue.parse({ groupe: "PECTORAUX" })).toThrow();
    expect(requeteCatalogue.parse({ groupe: "CHEST" })).toMatchObject({ groupe: "CHEST" });
  });

  // La borne qui protège l'API : sans plafond, `taille=100000` fait remonter
  // tout le catalogue à chaque appel.
  it("borne la pagination", () => {
    expect(() => requeteCatalogue.parse({ taille: "0" })).toThrow();
    expect(() => requeteCatalogue.parse({ taille: "1000" })).toThrow();
    expect(() => requeteCatalogue.parse({ page: "0" })).toThrow();
  });

  it("détoure la recherche", () => {
    expect(requeteCatalogue.parse({ q: "  squat " })).toMatchObject({ q: "squat" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @better-lift/shared exec vitest run src/exercices.test.ts`
Expected: FAIL — `Failed to resolve import "./exercices.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `packages/shared/src/exercices.ts` :

```ts
import { z } from "zod";
import type { Groupe } from "./vocabulaire.js";
import { GROUPES } from "./vocabulaire.js";

/**
 * Le contrat du catalogue, côté entrée.
 *
 * Seule la requête est décrite ici : la forme de la réponse est INFÉRÉE par Hono
 * RPC depuis le gestionnaire. La décrire aussi en Zod donnerait deux
 * descriptions à tenir d'accord, et elles divergeraient.
 *
 * `z.coerce` est indispensable : les paramètres d'URL arrivent toujours en
 * chaînes, et `page=2` échouerait au parse sans lui.
 */
export const requeteCatalogue = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  groupe: z.enum(GROUPES).optional(),
  equipement: z.string().trim().min(1).max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Plafonnée : sans borne, une requête ferait remonter tout le catalogue.
  taille: z.coerce.number().int().min(1).max(100).default(50),
});

export type RequeteCatalogue = z.infer<typeof requeteCatalogue>;

/** Ce qu'une ligne de liste montre — et rien de plus. */
export type ExerciceResume = {
  slug: string;
  /** Le nom français, affiché (D44). */
  nom: string;
  /** La clé de données, pas le libellé : le français vient de `LIBELLE_GROUPE`. */
  groupe: Groupe;
  equipement: string;
};

export type ExerciceDetail = ExerciceResume & {
  /**
   * Le nom d'origine, affiché en sous-titre : il explique pourquoi « bench » a
   * trouvé « Développé couché », et reste la référence si un nom français est
   * maladroit (D44).
   */
  nomAnglais: string;
  /** URL de l'animation, ou `null` : l'interface a toujours un repli sans visuel. */
  gif: string | null;
  cible: string;
  secondaires: string[];
  instructions: string[];
};

/**
 * La mention que chaque animation doit porter (D46). Elle vit ici, et non dans
 * un composant, pour que le web et le mobile affichent exactement la même.
 */
export const ATTRIBUTION_MEDIAS = "© Gym visual — https://gymvisual.com/";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @better-lift/shared exec vitest run src/exercices.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Exporter, et ajouter Zod aux dépendances de `shared`**

`packages/shared` n'avait pas Zod — il ne portait que du calcul pur.

```bash
pnpm --filter @better-lift/shared add zod@4.6.5
```

Modifier `packages/shared/src/index.ts` :

```ts
export { estAutorisee, normaliserListe } from "./allowlist.js";
export { cleJour, formatJour, memeJour } from "./calendar.js";
export {
  ATTRIBUTION_MEDIAS,
  type ExerciceDetail,
  type ExerciceResume,
  requeteCatalogue,
  type RequeteCatalogue,
} from "./exercices.js";
export { normaliserRecherche, slugifier, texteRecherche } from "./recherche.js";
export { estimate1RM, type SetType, setVolume } from "./training.js";
export { kgToLb, lbToKg, type UnitSystem } from "./units.js";
export { type Groupe, GROUPES, LIBELLE_GROUPE } from "./vocabulaire.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared pnpm-lock.yaml
git commit -m "feat(shared): contrat zod du catalogue"
```

---

### Task 7: le service du catalogue

La logique métier vit dans `services/` et **ne connaît jamais le contexte Hono** (règle
d'architecture). Elle est ici découpée en deux : des **fonctions pures** — construction du filtre,
projection des lignes — qui portent tout ce qui peut se tromper et se testent sans base ; et un
**dépôt** qui ne fait que les appels Prisma.

Ce découpage n'est pas de la cérémonie : **la CI n'a pas de base de données**. Un test qui aurait
besoin de PostgreSQL ne tournerait jamais. Les fonctions pures, elles, tournent partout, et ce
sont elles qui portent les deux erreurs coûteuses du lot — oublier de normaliser la recherche, et
oublier d'exclure les archivés.

**Files:**
- Create: `apps/api/src/services/exercices.ts`
- Test: `apps/api/src/services/exercices.test.ts`

**Interfaces:**
- Consumes: `normaliserRecherche`, `requeteCatalogue`, `type RequeteCatalogue`,
  `type ExerciceResume`, `type ExerciceDetail`, `type Groupe` de `@better-lift/shared`
  (tâches 1, 2, 6) ; `prisma` de `@better-lift/db`.
- Produces:
  ```ts
  export type LigneExercice = {
    slug: string; name: string; nomFr: string; bodyPart: Groupe; equipment: string;
    target: string; secondary: string[]; instructions: string[]; gifUrl: string | null;
  };
  export function filtreCatalogue(r: RequeteCatalogue): Record<string, unknown>;
  export function versResume(l: LigneExercice): ExerciceResume;
  export function versDetail(l: LigneExercice): ExerciceDetail;
  export type DepotExercices = {
    lister(r: RequeteCatalogue): Promise<{ exercices: ExerciceResume[]; total: number }>;
    parSlug(slug: string): Promise<ExerciceDetail | null>;
  };
  export const depotPrisma: DepotExercices;
  ```

- [ ] **Step 1: Write the failing test**

Créer `apps/api/src/services/exercices.test.ts` :

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @better-lift/api exec vitest run src/services/exercices.test.ts`
Expected: FAIL — `Failed to resolve import "./exercices.js"`.

- [ ] **Step 3: Write minimal implementation**

Créer `apps/api/src/services/exercices.ts` :

```ts
import { prisma } from "@better-lift/db";
import type {
  ExerciceDetail,
  ExerciceResume,
  Groupe,
  RequeteCatalogue,
} from "@better-lift/shared";
import { normaliserRecherche } from "@better-lift/shared";

/**
 * Le catalogue, côté métier. Ce module ne connaît pas Hono : il ne voit ni
 * requête, ni contexte, ni code de statut.
 *
 * Il est coupé en deux à dessein. Les fonctions PURES portent tout ce qui peut
 * se tromper — le filtre, la projection — et se testent sans base, ce qui compte
 * parce que la CI n'en a pas. Le DÉPÔT ne fait que les appels Prisma, et c'est
 * lui qu'un test de route remplace par un double.
 */

/** Ce qu'on lit en base. Les champs sont ceux du modèle, donc en anglais. */
export type LigneExercice = {
  slug: string;
  /** Le nom anglais du dataset (D44). */
  name: string;
  nomFr: string;
  bodyPart: Groupe;
  equipment: string;
  target: string;
  secondary: string[];
  instructions: string[];
  gifUrl: string | null;
};

const CHAMPS_RESUME = { slug: true, nomFr: true, bodyPart: true, equipment: true } as const;
const CHAMPS_DETAIL = {
  ...CHAMPS_RESUME,
  name: true,
  target: true,
  secondary: true,
  instructions: true,
  gifUrl: true,
} as const;

export function filtreCatalogue(requete: RequeteCatalogue): Record<string, unknown> {
  const filtre: Record<string, unknown> = { archivedAt: null };

  // LA ligne qui fait tout marcher : la colonne contient les deux noms passés
  // par `normaliserRecherche` (via `texteRecherche`), la saisie doit donc y
  // passer aussi. Comparer la saisie brute ne rendrait jamais rien — et sans
  // erreur pour le dire.
  if (requete.q) filtre.nomRecherche = { contains: normaliserRecherche(requete.q) };
  if (requete.groupe) filtre.bodyPart = requete.groupe;
  if (requete.equipement) filtre.equipment = requete.equipement;

  return filtre;
}

// Ne reçoit que les champs du résumé : c'est tout ce que `CHAMPS_RESUME` lit.
export function versResume(
  ligne: Pick<LigneExercice, "slug" | "nomFr" | "bodyPart" | "equipment">,
): ExerciceResume {
  return {
    slug: ligne.slug,
    nom: ligne.nomFr,
    groupe: ligne.bodyPart,
    equipement: ligne.equipment,
  };
}

export function versDetail(ligne: LigneExercice): ExerciceDetail {
  return {
    ...versResume(ligne),
    nomAnglais: ligne.name,
    gif: ligne.gifUrl,
    cible: ligne.target,
    secondaires: ligne.secondary,
    instructions: ligne.instructions,
  };
}

export type DepotExercices = {
  lister(requete: RequeteCatalogue): Promise<{ exercices: ExerciceResume[]; total: number }>;
  parSlug(slug: string): Promise<ExerciceDetail | null>;
};

export const depotPrisma: DepotExercices = {
  async lister(requete) {
    const where = filtreCatalogue(requete);
    const [lignes, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        select: CHAMPS_RESUME,
        orderBy: { nomRecherche: "asc" },
        skip: (requete.page - 1) * requete.taille,
        take: requete.taille,
      }),
      prisma.exercise.count({ where }),
    ]);
    // `bodyPart` sort de Prisma typé par son enum, dont les valeurs sont celles de
    // `Groupe` — `source.test.ts` tient les deux d'accord.
    return { exercices: lignes.map((l) => versResume(l as Parameters<typeof versResume>[0])), total };
  },

  async parSlug(slug) {
    const ligne = await prisma.exercise.findUnique({
      where: { slug, archivedAt: null },
      select: CHAMPS_DETAIL,
    });
    return ligne ? versDetail(ligne as LigneExercice) : null;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @better-lift/api exec vitest run src/services/exercices.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services
git commit -m "feat(api): service du catalogue, filtre et projections testés sans base"
```

---

### Task 8: les deux routes

Les routes ne font que trois choses : valider, appeler le dépôt, choisir un code. Le dépôt est
**injecté**, ce qui rend les tests exécutables sans base — la CI n'en a pas.

> **Une décision à connaître, et que tu peux renverser : ces deux routes ne sont pas derrière une
> session.** La spec ne tranche pas. Le catalogue est une donnée de référence publique sous
> licence MIT : il n'y a rien à y protéger, et un garde coûterait une lecture de session à chaque
> frappe dans la recherche. Les routes qui porteront des données d'utilisateur — routines, séances,
> lots 5 et 6 — sont un tout autre cas, et elles, seront gardées. Si tu préfères fermer aussi le
> catalogue, c'est une ligne de middleware à ajouter ici, dis-le avant la PR.

**Files:**
- Create: `apps/api/src/routes/exercices.ts`
- Test: `apps/api/src/routes/exercices.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: `requeteCatalogue` de `@better-lift/shared` (tâche 6) ; `type DepotExercices`,
  `depotPrisma` de `../services/exercices.js` (tâche 7).
- Produces: `export function routesExercices(depot?: DepotExercices)`, et deux routes dans
  `AppType` :
  - `GET /exercices?q&groupe&equipement&page&taille`
    → `{ exercices: ExerciceResume[]; total: number; page: number; taille: number }`
  - `GET /exercices/:slug` → `ExerciceDetail`, ou 404 `{ erreur: string }`

- [ ] **Step 1: Installer le validateur**

```bash
pnpm --filter @better-lift/api add @hono/zod-validator@0.9.1
```

*(Ses pairs sont `zod: ^3.25.0 || ^4.0.0` et `hono: >=4.11.2` — le dépôt est en Zod 4.6.5 et Hono
4.13.8.)*

- [ ] **Step 2: Write the failing test**

Créer `apps/api/src/routes/exercices.test.ts` :

```ts
import type { ExerciceDetail, ExerciceResume } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { DepotExercices } from "../services/exercices.js";
import { routesExercices } from "./exercices.js";

const resume: ExerciceResume = {
  slug: "barbell-full-squat",
  nom: "Squat complet à la barre",
  groupe: "UPPER_LEGS",
  equipement: "Barre",
};

const detail: ExerciceDetail = {
  ...resume,
  nomAnglais: "barbell full squat",
  gif: null,
  cible: "Quadriceps",
  secondaires: ["Fessiers"],
  instructions: ["Place la barre sur tes trapèzes."],
};

// Un double, pas une base : la CI n'a pas de PostgreSQL, et ce qu'on vérifie
// ici est le comportement de la ROUTE — validation, codes, forme — pas celui
// de Prisma.
function fauxDepot(): DepotExercices & { derniereRequete?: unknown } {
  const depot = {
    derniereRequete: undefined as unknown,
    async lister(requete: Parameters<DepotExercices["lister"]>[0]) {
      depot.derniereRequete = requete;
      return { exercices: [resume], total: 1 };
    },
    async parSlug(slug: string) {
      return slug === resume.slug ? detail : null;
    },
  };
  return depot;
}

const monter = (depot: DepotExercices) => new Hono().route("/exercices", routesExercices(depot));

describe("GET /exercices", () => {
  it("rend la page et son total", async () => {
    const res = await monter(fauxDepot()).request("/exercices");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ exercices: [resume], total: 1, page: 1, taille: 50 });
  });

  it("transmet la recherche et les filtres au dépôt", async () => {
    const depot = fauxDepot();
    await monter(depot).request("/exercices?q=squat&groupe=UPPER_LEGS&page=2&taille=10");
    expect(depot.derniereRequete).toEqual({
      q: "squat",
      groupe: "UPPER_LEGS",
      page: 2,
      taille: 10,
    });
  });

  it("refuse une requête hors bornes plutôt que de la corriger en silence", async () => {
    const res = await monter(fauxDepot()).request("/exercices?taille=5000");
    expect(res.status).toBe(400);
  });

  it("refuse un groupe inconnu", async () => {
    const res = await monter(fauxDepot()).request("/exercices?groupe=PECTORAUX");
    expect(res.status).toBe(400);
  });
});

describe("GET /exercices/:slug", () => {
  it("rend le détail, instructions comprises", async () => {
    const res = await monter(fauxDepot()).request(`/exercices/${resume.slug}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(detail);
  });

  // Un slug absent doit faire 404, pas 200 avec un corps vide : côté client,
  // c'est la différence entre un état d'erreur et un écran blanc.
  it("rend 404 pour un slug inconnu", async () => {
    const res = await monter(fauxDepot()).request("/exercices/nexiste-pas");
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @better-lift/api exec vitest run src/routes/exercices.test.ts`
Expected: FAIL — `Failed to resolve import "./exercices.js"`.

- [ ] **Step 4: Write minimal implementation**

Créer `apps/api/src/routes/exercices.ts` :

```ts
import { requeteCatalogue } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type DepotExercices, depotPrisma } from "../services/exercices.js";

/**
 * Les deux routes du catalogue.
 *
 * Le dépôt est INJECTÉ, avec Prisma par défaut : c'est ce qui permet aux tests
 * de monter ces routes sans base — la CI n'en a pas. Ces routes ne portent
 * aucune logique : elles valident, appellent, et choisissent un code.
 *
 * Elles ne sont pas derrière une session : le catalogue est une donnée de
 * référence publique, et un garde coûterait une lecture de session à chaque
 * frappe dans la recherche. Les routes de données personnelles (lots 5 et 6)
 * seront gardées, elles.
 */
export function routesExercices(depot: DepotExercices = depotPrisma) {
  return new Hono()
    .get("/", zValidator("query", requeteCatalogue), async (c) => {
      const requete = c.req.valid("query");
      const { exercices, total } = await depot.lister(requete);
      return c.json({ exercices, total, page: requete.page, taille: requete.taille });
    })
    .get("/:slug", async (c) => {
      const exercice = await depot.parSlug(c.req.param("slug"));
      // 404 et non 200 à corps vide : côté client, c'est ce qui distingue un
      // état d'erreur d'un écran blanc.
      if (!exercice) return c.json({ erreur: "Exercice introuvable." }, 404);
      return c.json(exercice);
    });
}
```

Modifier `apps/api/src/app.ts` — monter les routes et les faire entrer dans `AppType` :

```ts
import { auth } from "./auth.js";
import { routesExercices } from "./routes/exercices.js";
import { health } from "./routes/health.js";

// …

const routes = app.route("/health", health).route("/exercices", routesExercices());

export type AppType = typeof routes;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @better-lift/api exec vitest run src/routes/exercices.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 6: Vérifier la route contre la vraie base**

Les tests ne touchent pas PostgreSQL — il faut donc voir la route fonctionner une fois pour de
bon. C'est le contrôle que la méthode du projet exige : *ne jamais considérer un écran comme
acquis sans l'avoir vu fonctionner*, et cela vaut aussi pour une route.

```bash
pnpm --filter @better-lift/api dev
```

Dans un autre terminal :

```bash
curl -s "http://localhost:3001/exercices?q=developpe%20couche&taille=3" | head -c 600
curl -s "http://localhost:3001/exercices?q=bench%20press&taille=3" | head -c 600
curl -s "http://localhost:3001/exercices/barbell-bench-press" | head -c 600
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3001/exercices/nexiste-pas"
```

Expected : les deux premières commandes rendent des développés couchés — **c'est le critère de
sortie du lot, tapé sans accents puis en anglais** ; la troisième rend le détail avec `nom`,
`nomAnglais` et une URL `gif` ; la dernière affiche `404`.

- [ ] **Step 7: Commit**

```bash
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): routes du catalogue, liste filtrée et détail par slug"
```

---

### Task 9: extraire `packages/api-client`

D42 : c'est le lot où ce paquet gagne sa raison d'être. La conception principale avait
explicitement reporté sa création faute d'un second consommateur ; il y en a deux maintenant.
L'extraction est mécanique — le client déménage, et ce qui reste côté web est la seule chose qui
lui soit propre : l'URL de base.

**Files:**
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create: `packages/api-client/src/index.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: `type AppType` de `@better-lift/api` (tâche 8).
- Produces:
  ```ts
  export function creerClient(baseUrl: string): Client;
  export type Client = ReturnType<typeof creerClient>;
  export type { AppType } from "@better-lift/api";
  ```

- [ ] **Step 1: Créer le paquet**

`packages/api-client/package.json` — calqué sur `packages/shared` :

```json
{
  "name": "@better-lift/api-client",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .turbo node_modules"
  },
  "dependencies": {
    "hono": "4.13.8"
  },
  "devDependencies": {
    "@better-lift/api": "workspace:*",
    "@better-lift/config": "workspace:*",
    "typescript": "catalog:"
  }
}
```

`packages/api-client/tsconfig.json` :

```json
{
  "extends": "@better-lift/config/tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src/**/*.ts"]
}
```

`packages/api-client/src/index.ts` :

```ts
import type { AppType } from "@better-lift/api";
import { hc } from "hono/client";

/**
 * Le client RPC de l'API, pour les DEUX surfaces (D42).
 *
 * Il vivait dans `apps/web/src/lib/api.ts` jusqu'ici : la conception principale
 * avait reporté ce paquet faute d'un second consommateur, et le lot 4 en fournit
 * un — le mobile lira le même catalogue.
 *
 * L'URL de base reste à l'appelant : elle vient de `import.meta.env` côté web et
 * d'une constante côté mobile, où l'émulateur joint l'API en 10.0.2.2. Un paquet
 * partagé qui lirait `import.meta.env` ne compilerait pas côté Expo.
 *
 * `credentials: "include"` est requis dès que le client et l'API sont sur deux
 * origines — c'est le cas en développement, 3000 contre 3001.
 */
export function creerClient(baseUrl: string) {
  return hc<AppType>(baseUrl, { init: { credentials: "include" } });
}

export type Client = ReturnType<typeof creerClient>;
export type { AppType } from "@better-lift/api";
```

- [ ] **Step 2: Rebrancher le web**

```bash
pnpm --filter @better-lift/web add @better-lift/api-client@workspace:*
pnpm --filter @better-lift/web remove @better-lift/api
```

Remplacer le contenu de `apps/web/src/lib/api.ts` :

```ts
import { creerClient } from "@better-lift/api-client";

/** L'URL de base est la seule chose propre au web : le client, lui, est partagé. */
export const api = creerClient(import.meta.env.VITE_API_URL ?? "http://localhost:3001");
```

- [ ] **Step 3: Vérifier que l'inférence RPC survit au déménagement**

C'est le seul risque réel de cette tâche : si `AppType` ne traverse pas la frontière de paquet,
`api.exercices.$get` devient `any` **sans erreur**, et toute la PR 2 perd son typage en silence.

Créer un contrôle temporaire dans `apps/web/src/lib/api.ts`, vérifier, puis le retirer :

```ts
// Contrôle temporaire : doit signaler une erreur de type. Si elle n'apparaît
// PAS, l'inférence est cassée et tout est devenu `any`.
const _controle = api.exercices.$get({ query: { taille: 5000, inconnu: true } });
```

Run: `pnpm typecheck`
Expected: une erreur de type sur `inconnu`. **Si `pnpm typecheck` passe, s'arrêter** : l'inférence
est perdue, et il faut la rétablir avant d'aller plus loin. Retirer ensuite le contrôle.

- [ ] **Step 4: Vérifier la chaîne**

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm knip
```

`knip` doit rester vert : `packages/*` est déjà couvert par `"project": "src/**/*.ts"`, et le
point d'entrée du nouveau paquet vient de son champ `exports`.

- [ ] **Step 5: Commit**

```bash
git add packages/api-client apps/web pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "refactor: extrait le client rpc dans packages/api-client"
```

---

### Task 10: brancher l'écran des exercices

**Le moment de vérité de la méthode du lot 2.** Les quatre états cessent d'être des simulations :
chargement et erreur deviennent réels. Si le dessin était juste, le branchement ne découvre rien.

Deux choses changent dans l'URL, et c'est voulu : `?id=` devient `?slug=` (le slug est
l'identifiant stable et lisible du catalogue), et `?groupe=` devient une valeur de l'enum
(`CHEST`) plutôt qu'un libellé.

> `QueryClientProvider` est déjà monté dans `apps/web/src/routes/__root.tsx` depuis le lot 1 :
> rien à installer.

**Files:**
- Create: `apps/web/src/features/exercices/requetes.ts`
- Create: `apps/web/src/features/exercices/animation-exercice.tsx`
- Modify: `apps/web/src/routes/_protege.exercices.tsx`
- Modify: `apps/web/src/features/exercices/liste-exercices.tsx`
- Modify: `apps/web/src/features/exercices/detail-exercice.tsx`
- Delete: `apps/web/src/mocks/exercices.ts`, `apps/web/src/mocks/exercices.test.ts`

**Interfaces:**
- Consumes: `api` de `@/lib/api` (tâche 9) ; `type ExerciceResume`, `type ExerciceDetail`,
  `type Groupe`, `GROUPES`, `LIBELLE_GROUPE`, `ATTRIBUTION_MEDIAS` de `@better-lift/shared`
  (tâches 2 et 6).
- Produces: `optionsCatalogue({ q, groupe })` et `optionsExercice(slug)`, deux `queryOptions`.

- [ ] **Step 1: Écrire les requêtes**

Créer `apps/web/src/features/exercices/requetes.ts` :

```ts
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { Groupe } from "@better-lift/shared";
import { api } from "@/lib/api";

type Filtres = { q?: string; groupe?: Groupe };

/**
 * La liste du catalogue.
 *
 * LE PIÈGE DES CLÉS DE CACHE : toute donnée qui entre dans la requête DOIT
 * entrer dans la clé. Une recherche ou un filtre absent de la clé ferait
 * réafficher les résultats précédents après un changement de critère — un défaut
 * qui ressemble à de la lenteur et qu'on ne soupçonne pas.
 *
 * `keepPreviousData` garde la liste affichée pendant la frappe : sans lui, chaque
 * lettre tapée renvoie l'écran à son état de chargement, ce qui clignote.
 */
export function optionsCatalogue({ q, groupe }: Filtres) {
  return queryOptions({
    queryKey: ["exercices", "liste", { q: q ?? null, groupe: groupe ?? null }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      // Les clés absentes sont omises plutôt que posées à `undefined` : le client
      // RPC sérialise ce qu'on lui donne, et `?q=undefined` serait une recherche.
      const res = await api.exercices.$get({
        query: { ...(q ? { q } : {}), ...(groupe ? { groupe } : {}) },
      });
      if (!res.ok) throw new Error("Le catalogue n'a pas pu être chargé.");
      return res.json();
    },
  });
}

export function optionsExercice(slug: string) {
  return queryOptions({
    queryKey: ["exercices", "detail", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].$get({ param: { slug } });
      if (!res.ok) throw new Error("Cet exercice n'a pas pu être chargé.");
      return res.json();
    },
  });
}
```

- [ ] **Step 2: Brancher la route**

Remplacer `apps/web/src/routes/_protege.exercices.tsx` :

```tsx
import { GROUPES } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailExercice } from "@/features/exercices/detail-exercice";
import { ListeExercices } from "@/features/exercices/liste-exercices";
import { optionsCatalogue, optionsExercice } from "@/features/exercices/requetes";

// Le détail ouvert et la recherche vivent dans l'URL, validés par schéma (D19).
// `slug` remplace `id` : c'est l'identifiant stable et lisible du catalogue.
// `.catch(undefined)` évite qu'une URL trafiquée fasse échouer tout l'écran —
// un filtre inconnu s'ignore, il ne casse pas la page.
const recherche = z.object({
  q: z.string().optional(),
  groupe: z.enum(GROUPES).optional().catch(undefined),
  slug: z.string().optional(),
  etat: champEtat,
});

export const Route = createFileRoute("/_protege/exercices")({
  validateSearch: recherche,
  component: PageExercices,
});

function PageExercices() {
  const { q, groupe, slug, etat } = Route.useSearch();
  const navigate = Route.useNavigate();

  const liste = useQuery(optionsCatalogue({ q, groupe }));
  const detail = useQuery({ ...optionsExercice(slug ?? ""), enabled: Boolean(slug) });

  const abandonner = () => navigate({ search: (s) => ({ ...s, etat: undefined }) });
  const exercices = estVideForce(etat) ? [] : (liste.data?.exercices ?? []);

  function panneauListe() {
    // Les états forcés par `?etat=` restent prioritaires, en développement
    // seulement : ils permettent de revoir chargement et erreur à la demande,
    // maintenant que les vrais ne se déclenchent plus qu'au hasard du réseau.
    const force = etatForceRendu(etat, "Le catalogue n'a pas pu être chargé.", abandonner);
    if (force) return force;

    if (liste.isPending) return <EtatChargement />;
    if (liste.isError) {
      return (
        <EtatErreur
          message="Le catalogue n'a pas pu être chargé."
          onReessayer={() => liste.refetch()}
        />
      );
    }

    return (
      <ListeExercices
        exercices={exercices}
        q={q ?? ""}
        slugSelectionne={slug}
        onRecherche={(valeur) => navigate({ search: (s) => ({ ...s, q: valeur || undefined }) })}
        onSelection={(choisi) => navigate({ search: (s) => ({ ...s, slug: choisi }) })}
      />
    );
  }

  function panneauDetail() {
    if (!slug) return undefined;
    if (detail.isPending) return <EtatChargement />;
    if (detail.isError) {
      return (
        <EtatErreur
          message="Cet exercice n'a pas pu être chargé."
          onReessayer={() => detail.refetch()}
        />
      );
    }
    return (
      <DetailExercice
        exercice={detail.data}
        onFermer={() => navigate({ search: (s) => ({ ...s, slug: undefined }) })}
      />
    );
  }

  return <AppShell liste={panneauListe()} detail={panneauDetail()} />;
}
```

- [ ] **Step 3: Adapter la liste**

Modifier `apps/web/src/features/exercices/liste-exercices.tsx`. **Le dessin ne change pas** —
seuls le type, la clé et la source du libellé de groupe changent :

```tsx
import { type ExerciceResume, LIBELLE_GROUPE } from "@better-lift/shared";
import { EtatVide } from "@/components/etats/etat-vide";

type Props = {
  exercices: ExerciceResume[];
  q: string;
  slugSelectionne?: string;
  onRecherche: (v: string) => void;
  onSelection: (slug: string) => void;
};
```

Dans le corps, trois remplacements :

- `key={ex.id}` → `key={ex.slug}`, `onClick={() => onSelection(ex.id)}` → `onSelection(ex.slug)`,
  `ex.id === idSelectionne` → `ex.slug === slugSelectionne` ;
- `{ex.groupe} · {ex.equipement}` → `{LIBELLE_GROUPE[ex.groupe]} · {ex.equipement}` — le libellé
  français vient de `shared`, la base ne stocke que la clé (D41) ;
- retirer `{ex.record ? <BadgeRecord … /> : null}` et l'import de `BadgeRecord`.

> **Le badge de record disparaît de cette liste, et c'est normal :** un record vient des séances,
> pas du catalogue, et les séances arrivent au lot 6. `BadgeRecord` reste utilisé par
> `features/seances/detail-seance.tsx`, donc Knip ne le signalera pas. L'invariant D28 — l'aplat
> pour l'action, le contour pour le record — reste éprouvable sur l'écran des séances.

- [ ] **Step 4: L'animation, son attribution et son repli**

Créer `apps/web/src/features/exercices/animation-exercice.tsx`. Trois exigences de D46, et une
de la méthode du projet :

- **180×180 au plus** — la résolution que Gym visual autorise ;
- **l'attribution sous chaque visuel**, lue depuis `shared` pour que le mobile affiche la même ;
- **un repli** : si l'URL est absente ou que le chargement échoue — dépôt amont indisponible,
  réseau coupé en salle —, le bloc disparaît et la fiche reste lisible. Une image cassée n'est
  jamais affichée.

```tsx
import { ATTRIBUTION_MEDIAS } from "@better-lift/shared";
import { useState } from "react";

/**
 * L'animation d'un exercice (D46).
 *
 * Le GIF reste dans le dépôt du dataset : on l'affiche, on ne le copie pas. Il
 * appartient à Gym visual, d'où la mention sous le visuel, et la taille bornée
 * à 180×180 — la résolution à laquelle il est distribué.
 *
 * L'appelant passe `key={gif}` : changer d'exercice remonte le composant, ce qui
 * remet `echec` à faux sans effet à écrire.
 */
export function AnimationExercice({ gif, nom }: { gif: string | null; nom: string }) {
  const [echec, setEchec] = useState(false);

  // Le repli : pas d'URL, ou une URL qui n'a pas chargé. Rien plutôt qu'une
  // image cassée — la fiche reste complète sans visuel.
  if (!gif || echec) return null;

  return (
    <figure className="flex flex-col items-center gap-1.5">
      <img
        src={gif}
        alt={`Animation de l'exercice : ${nom}`}
        width={180}
        height={180}
        loading="lazy"
        onError={() => setEchec(true)}
        className="size-45 rounded-md bg-white object-contain"
      />
      <figcaption className="text-[11px] text-(--ink-faint)">{ATTRIBUTION_MEDIAS}</figcaption>
    </figure>
  );
}
```

*(Le fond blanc est voulu : les GIF du dataset sont dessinés sur blanc, et les poser sur la
surface sombre du thème ferait apparaître un carré clair aux bords irréguliers. Un cadre franc
reste plus propre.)*

- [ ] **Step 5: Adapter le détail, et lui donner ce que l'API rend en plus**

Modifier `apps/web/src/features/exercices/detail-exercice.tsx` : le type devient `ExerciceDetail`,
et le panneau gagne ce que le catalogue permet enfin d'afficher — le nom anglais, l'animation, les
muscles et les instructions.

```tsx
import { type ExerciceDetail, LIBELLE_GROUPE } from "@better-lift/shared";
import { AnimationExercice } from "./animation-exercice";

export function DetailExercice({
  exercice,
  onFermer,
}: {
  exercice: ExerciceDetail;
  onFermer: () => void;
}) {
```

- l'en-tête : sous le `<h2>` du nom français, ajouter le nom d'origine en sous-titre discret —
  c'est lui qui explique pourquoi « bench » a trouvé « Développé couché » (D44) :

  ```tsx
  <h2 className="text-base font-semibold tracking-tight">{exercice.nom}</h2>
  <p className="mt-0.5 text-xs text-(--ink-faint)">{exercice.nomAnglais}</p>
  <p className="mt-1 text-xs text-(--ink-subtle)">
    {LIBELLE_GROUPE[exercice.groupe]} · {exercice.equipement}
  </p>
  ```

- en tête du corps (`<div className="flex flex-col gap-4 px-5 py-4">`), **avant** le bouton :

  ```tsx
  <AnimationExercice key={exercice.gif ?? exercice.slug} gif={exercice.gif} nom={exercice.nom} />
  ```

- le bouton `Démarrer la séance` reste — c'est l'aplat de D28, et il est toujours là ;
- le bloc `Record` est remplacé par les trois blocs ci-dessous, la phrase « Aucun record pour
  l'instant » étant reprise telle quelle dans le dernier.

```tsx
<div>
  <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Muscles</p>
  <p className="text-sm text-(--ink)">
    {exercice.cible}
    {exercice.secondaires.length > 0 ? (
      <span className="text-(--ink-faint)"> · {exercice.secondaires.join(", ")}</span>
    ) : null}
  </p>
</div>

<div>
  <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Exécution</p>
  <ol className="flex flex-col gap-2">
    {exercice.instructions.map((etape, i) => (
      <li key={etape} className="flex gap-2.5 text-sm leading-relaxed text-(--ink)">
        <span className="shrink-0 font-mono text-xs text-(--ink-faint)">{i + 1}</span>
        <span>{etape}</span>
      </li>
    ))}
  </ol>
</div>

<div>
  <p className="mb-2 text-[11px] uppercase tracking-wide text-(--ink-subtle)">Record</p>
  <p className="text-sm text-(--ink-faint)">
    Aucun record pour l'instant — il apparaîtra après ta première séance.
  </p>
</div>
```

- [ ] **Step 6: Supprimer les données factices**

```bash
git rm apps/web/src/mocks/exercices.ts apps/web/src/mocks/exercices.test.ts
```

Elles ont fait leur travail : éprouver le dessin avant les données. Les garder ferait deux
sources de vérité pour le même écran.

- [ ] **Step 7: Le voir fonctionner — et ne rien déclarer avant**

*Ne jamais considérer un écran comme acquis sans l'avoir vu fonctionner.* Les défauts marquants
de l'ancien projet étaient tous invisibles à la lecture comme aux tests unitaires.

```bash
pnpm dev
```

Sur `http://localhost:3000/exercices`, vérifier **une par une** :

1. la liste se remplit, et le compteur affiche un nombre cohérent ;
2. taper `developpe couche` **sans accents** filtre bien sur « Développé couché », et taper
   `bench press` rend les mêmes — c'est le critère de sortie du lot ;
3. taper n'importe quoi rend l'état vide, avec le terme cherché dans le message ;
4. cliquer un exercice ouvre le détail : nom français, nom anglais en sous-titre, **l'animation
   avec « © Gym visual — https://gymvisual.com/ » dessous**, les muscles et les étapes
   numérotées ;
5. dans les outils de développement, bloquer `raw.githubusercontent.com` et rouvrir un
   exercice : **l'animation disparaît proprement**, sans image cassée, et la fiche reste
   complète ;
6. **recharger la page** : la recherche et le détail ouvert sont toujours là — c'est D19 ;
7. `?etat=chargement`, `?etat=erreur`, `?etat=vide` rendent toujours les trois états ;
8. couper l'API (`Ctrl+C` sur le terminal de `@better-lift/api`), recharger : **l'état d'erreur
   réel s'affiche**, et le bouton « Réessayer » refonctionne une fois l'API relancée. C'est la
   seule vérification que le lot 2 ne pouvait pas faire.

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat(web): branche l'écran des exercices sur le catalogue"
```

---

### Task 11: clôture du lot

- [ ] **Step 1: `/verif`, en entier**

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm knip
```

S'arrêter au premier échec et le corriger avant de continuer. **Ne jamais déclarer « tout est
vert » sans avoir vu les cinq étapes passer.**

Si `typecheck` ou `build` échoue sur un `TS2724 : has no exported member` visant un symbole qui
existe bel et bien dans la source, c'est un `.tsbuildinfo` périmé, pas une vraie erreur. Le remède
est paquet par paquet et **de bas en haut** — et ce lot ajoute un maillon au milieu :

```bash
pnpm --filter @better-lift/shared exec tsc --build --force
pnpm --filter @better-lift/api exec tsc --build --force
pnpm --filter @better-lift/api-client exec tsc --build --force
```

- [ ] **Step 2: Mettre `CLAUDE.md` à jour**

- Section **État** : les lots 0 à 4 sont fusionnés. Décrire le lot 4 en deux lignes — le
  catalogue français en base, servi par l'API, et l'écran des exercices branché.
- Section **Stack**, ligne des paquets : `packages/{db,shared,api-client}` est déjà écrit ainsi
  dans `CLAUDE.md` — c'est maintenant vrai, rien à changer, mais le vérifier.
- Ajouter aux **Règles d'architecture** :

```markdown
- **Le client d'API vit dans `packages/api-client`, l'URL de base chez l'appelant.** Le paquet
  expose `creerClient(baseUrl)` ; le web la tire de `import.meta.env`, le mobile d'une constante
  (l'émulateur joint l'API en `10.0.2.2`). Un paquet partagé qui lirait `import.meta.env` ne
  compilerait pas côté Expo.
```

- [ ] **Step 3: Ouvrir la PR 2**

```bash
git push -u origin feat/lot-4-catalogue-a-l-ecran
gh pr create --title "feat: lot 4 (2/2) — le catalogue servi et à l'écran" --body "..."
```

Le corps doit dire : les deux routes et ce qu'elles ne gardent pas (pas de session sur le
catalogue, et pourquoi), l'extraction de `api-client` et le contrôle d'inférence RPC, le passage
de `?id=` à `?slug=` (slug tiré du nom anglais), la recherche bilingue, les animations affichées
depuis le dépôt du dataset avec leur attribution (D46), et la disparition du badge de record en
attendant le lot 6.

Attendre `Qualité · typecheck · test · build`, puis fusionner en squash.

- [ ] **Step 4: Nettoyer**

```bash
git checkout main && git pull
git branch -d feat/lot-4-catalogue-francais feat/lot-4-catalogue-a-l-ecran
```

Arrêter le serveur de dev **avant** le changement de branche, et vérifier que le port 3000 est
libre : le greffon de routes réécrit `routeTree.gen.ts` en arrière-plan, et `core.autocrlf=true`
sur cette machine le rend « modifié » sans la moindre différence de contenu — ce qui bloque un
`git pull` avec un `git diff` vide, donc incompréhensible.

---

## Ce que ce lot ne fait pas

Repris de la spec § 11, pour qu'aucune de ces absences ne passe pour un oubli.

- **L'hébergement des GIF** — on pointe vers le dépôt du dataset (D46). Si l'application
  s'ouvrait un jour, il faudrait une licence auprès de Gym visual.
- **Le glossaire et la traduction générée** — abandonnés (D37, D38) : les noms sont écrits.
- **Les animations sur mobile** — `ATTRIBUTION_MEDIAS` est dans `shared` pour que le lot 6 les
  affiche avec la même mention.
- **La recherche floue** (tolérance aux fautes de frappe) — la normalisation des accents couvre le
  cas fréquent ; le reste attendra qu'il manque vraiment.
- **Les exercices personnalisés** créés par l'utilisateur — hors du catalogue, et hors de ce lot.
- **Les routines et les séances côté serveur** — lots 5 et 6. Les deux écrans correspondants
  restent sur leurs données factices.
- **Le mobile** — `api-client` est extrait pour lui, mais aucun écran mobile n'est branché ici.
  Le lot 6 s'en charge, et c'est là que se règlera l'avertissement de rendu concurrent laissé
  ouvert au lot 3.
