# Refonte des pages — lot 2 : Accueil et Démarrer — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** l'Accueil devient « À suivre » neutre puis le fil riche des séances (D119) ; le rond
central ouvre la feuille Démarrer (D120) ; l'écran `demarrer.tsx` et la liste orpheline de
l'historique disparaissent (D117).

**Architecture :** `shared` calcule l'aperçu d'une séance (`meilleureSerie`, `apercuExercices`) ;
`GET /seances` rend des `SeanceFil` (résumé + `nbExercices` + `apercu`) ; le mobile gagne
`FeuilleBasse` (le conteneur glissable extrait de `Feuille`), les composants `Section`, `Vignette`,
`Tuile`, `BoutonContour`, puis `CarteSeance`, `ASuivre` et `FeuilleDemarrer`.

**Tech Stack :** TypeScript, Zod, Hono, Prisma 7, Vitest, Expo SDK 57, `expo-image`.

**Spec :** [`2026-10-05-mobile-refonte-pages-design.md`](../specs/2026-10-05-mobile-refonte-pages-design.md) — D117, D118, D119, D120.

## Global Constraints

- Français partout ; commits Conventional Commits en français, **sujet en minuscule**
  (commitlint refuse « GET … »), terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `shared` sans Prisma, React ni API de plateforme. Un seul aplat lime par écran (D105) ;
  « Lancer » en contour (D118). Charges par `formaterCharge` / `formaterSerie`, jours par
  `formatJour(…, FUSEAU)`.
- Quatre états par écran (vide, chargement, erreur, nominal), vérifiés en sombre et en clair.
- Knip : aucun export sans usage ; supprimer ce que le lot rend inutile.
- `pnpm lint` en local bute sur `.superpowers/` (maquettes hors git) : vérifier par
  `pnpm exec biome check apps packages docs .claude/rules`.

Branche : `git switch main && git pull --ff-only && git switch -c feat/refonte-accueil`.

---

### Task 1 : l'aperçu d'une séance dans `shared`

**Files :** Create `packages/shared/src/apercu.ts`, `packages/shared/src/apercu.test.ts` ;
Modify `packages/shared/src/records.ts`, `packages/shared/src/index.ts`.

**Produces :** `type ApercuExercice = { slug; nom; image: string | null; nbSeries: number; meilleure: { chargeKg: number | null; reps: number } | null }` ;
`meilleureSerie(series)` ; `apercuExercices(exercices, n = 3)` ;
`type SeanceFil = SeanceResume & { nbExercices: number; apercu: ApercuExercice[] }`.

- [ ] **Step 1 : tests** — `apercu.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { apercuExercices, meilleureSerie } from "./apercu.js";

const s = (reps: number | null, chargeKg: number | null, faite = true, type = "NORMALE" as const) =>
  ({ type, reps, chargeKg, faite }) as const;

describe("meilleureSerie (D119)", () => {
  it("garde la plus lourde, puis à charge égale la plus longue", () => {
    expect(meilleureSerie([s(8, 80), s(5, 85), s(6, 85)])).toEqual({ chargeKg: 85, reps: 6 });
  });
  it("ignore l'échauffement et les séries non faites", () => {
    expect(
      meilleureSerie([{ type: "ECHAUFFEMENT", reps: 10, chargeKg: 100, faite: true }, s(5, 120, false), s(5, 80)]),
    ).toEqual({ chargeKg: 80, reps: 5 });
  });
  it("au poids du corps, garde la plus longue ; une charge l'emporte sur le poids du corps", () => {
    expect(meilleureSerie([s(8, null), s(12, null)])).toEqual({ chargeKg: null, reps: 12 });
    expect(meilleureSerie([s(12, null), s(5, 10)])).toEqual({ chargeKg: 10, reps: 5 });
  });
  it("rend null sans série qui compte", () => {
    expect(meilleureSerie([s(null, 80), s(5, 80, false)])).toBeNull();
  });
});

describe("apercuExercices (D119)", () => {
  const ex = (slug: string) => ({ slug, nom: slug, image: null, series: [s(5, 80), s(5, 80, false)] });
  it("rend les trois premiers exercices, leurs séries faites et leur meilleure série", () => {
    const a = apercuExercices([ex("a"), ex("b"), ex("c"), ex("d")]);
    expect(a.map((e) => e.slug)).toEqual(["a", "b", "c"]);
    expect(a[0]).toEqual({ slug: "a", nom: "a", image: null, nbSeries: 1, meilleure: { chargeKg: 80, reps: 5 } });
  });
});
```

- [ ] **Step 2 :** `pnpm --filter @better-lift/shared exec vitest run src/apercu.test.ts` → FAIL (module absent).
- [ ] **Step 3 : code** — `apercu.ts` :

```ts
import type { TypeSerie } from "./routines.js";

type SerieApercu = { type: TypeSerie; reps: number | null; chargeKg: number | null; faite: boolean };

/** Un exercice tel que le fil de l'Accueil le montre (D119). */
export type ApercuExercice = {
  slug: string;
  nom: string;
  image: string | null;
  /** Les séries faites, échauffement compris : ce qu'on a fait de l'exercice. */
  nbSeries: number;
  /** La meilleure série faite hors échauffement, `null` sans série qui compte. */
  meilleure: { chargeKg: number | null; reps: number } | null;
};

/**
 * La meilleure série : la plus lourde, puis à charge égale la plus longue ; au
 * poids du corps (charge nulle), la plus longue. L'échauffement ne compte pas (D5).
 */
export function meilleureSerie(series: readonly SerieApercu[]): ApercuExercice["meilleure"] {
  let m: ApercuExercice["meilleure"] = null;
  for (const x of series) {
    if (!x.faite || x.type === "ECHAUFFEMENT" || x.reps === null || x.reps <= 0) continue;
    const charge = x.chargeKg ?? 0;
    const max = m?.chargeKg ?? 0;
    if (!m || charge > max || (charge === max && x.reps > m.reps)) {
      m = { chargeKg: x.chargeKg, reps: x.reps };
    }
  }
  return m;
}

/** Les `n` premiers exercices d'une séance, pour le fil (D119). */
export function apercuExercices(
  exercices: readonly { slug: string; nom: string; image: string | null; series: readonly SerieApercu[] }[],
  n = 3,
): ApercuExercice[] {
  return exercices.slice(0, n).map((e) => ({
    slug: e.slug,
    nom: e.nom,
    image: e.image,
    nbSeries: e.series.filter((x) => x.faite).length,
    meilleure: meilleureSerie(e.series),
  }));
}
```

`records.ts` : `import type { ApercuExercice } from "./apercu.js";` et, après `SeanceResume` :

```ts
/** Une séance dans le fil de l'Accueil (D119) : son résumé et ses premiers exercices. */
export type SeanceFil = SeanceResume & { nbExercices: number; apercu: ApercuExercice[] };
```

`index.ts` : `export { type ApercuExercice, apercuExercices, meilleureSerie } from "./apercu.js";`
(en tête, ordre alphabétique) et `type SeanceFil` dans l'export de `./records.js`.

- [ ] **Step 4 :** `pnpm --filter @better-lift/shared exec vitest run && pnpm --filter @better-lift/shared exec tsc --noEmit` → PASS.
- [ ] **Step 5 :** commit `feat(shared): aperçu d'une séance pour le fil de l'accueil (D119)`.

---

### Task 2 : `GET /seances` rend le fil

**Files :** Modify `apps/api/src/services/seances.ts`, `apps/api/src/services/stats.ts`,
`apps/api/src/services/seances.test.ts`, `apps/api/src/routes/seances.test.ts`.

**Produces :** `versFil(l: LigneSeance): Pick<SeanceFil, "nbExercices" | "apercu">` ;
`DepotLectureSeances.lister` rend `{ seances: SeanceFil[]; total }`.

- [ ] **Step 1 : test** — dans `services/seances.test.ts`, chaque `exercise` de la fixture `ligne`
  gagne `gifUrl: null` ; importer `versFil` ; ajouter :

```ts
describe("versFil (D119)", () => {
  it("compte les exercices et rend leur aperçu, charges en nombres", () => {
    const f = versFil(ligne);
    expect(f.nbExercices).toBe(3);
    expect(f.apercu[0]).toEqual({
      slug: "barbell-bench-press",
      nom: "Développé couché à la barre",
      image: null,
      nbSeries: 2,
      meilleure: { chargeKg: 100, reps: 5 },
    });
  });
});
```

- [ ] **Step 2 :** `pnpm --filter @better-lift/api exec vitest run src/services/seances.test.ts` → FAIL.
- [ ] **Step 3 : code** — `LigneSeance.exercices[].exercise` devient
  `{ slug: string; nomFr: string; gifUrl: string | null }` ; `LECTURE_SEANCE` lit
  `exercise: { select: { slug: true, nomFr: true, gifUrl: true } }` ; `services/stats.ts` ajoute
  `gifUrl: true` à son `select` de `exercise`. Puis :

```ts
/** Ce que le fil de l'Accueil montre d'une séance, au-delà de son résumé (D119). */
export function versFil(l: LigneSeance): Pick<SeanceFil, "nbExercices" | "apercu"> {
  return {
    nbExercices: l.exercices.length,
    apercu: apercuExercices(
      l.exercices.map((e) => ({
        slug: e.exercise.slug,
        nom: e.exercise.nomFr,
        image: imageDe(e.exercise.gifUrl),
        series: e.series.map((s) => ({ ...s, chargeKg: enNombre(s.chargeKg) })),
      })),
    ),
  };
}
```

  (`imageDe` vient de `./exercices.js`, `apercuExercices` et `SeanceFil` de `@better-lift/shared`.)
  Dans `lister`, `return { ...resume, ...versFil(l as LigneSeance) };` et le type de
  `DepotLectureSeances.lister` passe à `SeanceFil[]`. Dans `routes/seances.test.ts`, les séances
  du faux dépôt gagnent `nbExercices: 0, apercu: []`.
- [ ] **Step 4 :** `pnpm --filter @better-lift/api exec vitest run && pnpm typecheck` → PASS
  (le web lit `/seances` : son typage doit tenir).
- [ ] **Step 5 :** commit `feat(api): le fil des séances porte l'aperçu des exercices (D119)`.

---

### Task 3 : composants communs et `FeuilleBasse`

**Files :** Create `apps/mobile/components/ui/{feuille-basse,section,vignette,tuile,bouton-contour}.tsx` ;
Modify `apps/mobile/components/ui/feuille.tsx`.

**Produces :**
- `FeuilleBasse({ visible, onFermer, children })` — `Modal` transparent + `GestureHandlerRootView`
  + voile + feuille `surface2` (rayon `feuille`, poignée, `paddingBottom` = zone de geste) qui se
  ferme en glissant (code du lot 1, déplacé tel quel). `Feuille` n'en garde que son contenu.
- `Section({ titre, style? })` — `Text` en-tête : `encreAttenuee`, 12, 600, `letterSpacing` 0,8,
  capitales, `accessibilityRole="header"`.
- `Vignette({ image, taille = 36 })` — `expo-image` sur `fondImage`, rayon 8, `cachePolicy="disk"` ;
  sans image, un carré `surface3` avec l'icône `Dumbbell` en `encreAttenuee`.
- `Tuile({ libelle, valeur })` — libellé 12 `encreTertiaire`, valeur 17 / 700 `encre`, chiffres
  tabulaires ; `accessible` avec `accessibilityLabel={`${libelle} : ${valeur}`}`.
- `BoutonContour({ libelle, onPress, icone?, occupe? })` — hauteur `CIBLE`, bordure 1,5 `encre`,
  rayon `bouton`, texte 15 / 700 ; `occupe` montre un `ActivityIndicator` et désactive.

- [ ] **Step 1 :** écrire les cinq composants, puis réécrire `Feuille` sur `FeuilleBasse`.
- [ ] **Step 2 :** `pnpm --filter @better-lift/mobile exec tsc --noEmit` → OK. Sur l'émulateur,
  une feuille existante (options d'un exercice dans l'éditeur de routine) s'ouvre et se ferme en
  glissant comme au lot 1. Commit `refactor(mobile): FeuilleBasse et composants communs des pages (D118)`
  — les composants sans usage encore sont commités avec la tâche qui s'en sert (Knip).

---

### Task 4 : la feuille Démarrer (D120)

**Files :** Create `apps/mobile/components/feuille-demarrer.tsx` ; Modify
`apps/mobile/app/(onglets)/_layout.tsx`, `apps/mobile/lib/demarrer.ts`, `apps/mobile/app/_layout.tsx` ;
Delete `apps/mobile/app/demarrer.tsx`.

- `FeuilleDemarrer({ visible, onFermer })` dans `FeuilleBasse` : titre « Démarrer » ; si
  `routineASuivre` existe : `Section` « À suivre », son nom (22 / 800), « n exercices · ≈ m min »
  (`dureeEstimeeSec` du détail en cache), puis **l'aplat** « Commencer \<nom\> » ; ensuite
  `Section` « Autres routines » (sans la suivante) en lignes (nom, « n exercices · n séries »,
  `Play` en contour) ; enfin la ligne « Séance vide » (`Plus`). États : hors ligne, chargement,
  erreur avec « Réessayer », aucune routine (« Pas encore de routine. Crée-en une dans l'onglet
  Routines. »). Chaque choix **ferme la feuille d'abord** (`onFermer()`), puis lance
  `useDemarrer().routine(id)` ou `.vide()` : un `Modal` resterait au-dessus de la séance.
- `_layout.tsx` des onglets : `const [demarrer, setDemarrer] = useState(false)` ; le rond central
  fait `seance ? router.push("/seance") : setDemarrer(true)` ; `<FeuilleDemarrer visible={demarrer}
  onFermer={() => setDemarrer(false)} />` à côté de `<Tabs>`.
- `lib/demarrer.ts` : retirer `depuisModale` (toujours `router.push("/seance")`) et mettre la
  doc à jour. `app/_layout.tsx` : retirer le `Stack.Screen name="demarrer"`.

- [ ] **Step 1 :** écrire, supprimer, typer (`tsc --noEmit`).
- [ ] **Step 2 : émulateur** — rond central → la feuille monte ; « Commencer Push A » lance la
  séance (puis l'abandonner) ; « Séance vide » idem ; glisser ferme ; pendant une séance, le rond
  ramène à la séance. Sombre et clair.
- [ ] **Step 3 :** commit `feat(mobile): démarrer devient une feuille basse sur le rond central (D120)`.

---

### Task 5 : l'Accueil (D119)

**Files :** Create `apps/mobile/components/accueil/{carte-seance,a-suivre}.tsx` ; Modify
`apps/mobile/app/(onglets)/index.tsx` ; Delete `apps/mobile/app/(onglets)/historique/index.tsx`,
`apps/mobile/components/historique/{liste-seances,ligne-seance}.tsx`.

- `ASuivre({ routines, seances })` — carte `surface1`, rayon `carte`, bordure `ligne` ; appui →
  `/routines/<id>`. Dedans : `Section` « À suivre », le nom (30 / 700), les zones principales
  (`zonesTravaillees` sur le détail en cache, `LIBELLE_ZONE`, trois au plus, « · ») et « ≈ m min »,
  « Dernière fois : \<jour\> », puis `BoutonContour` « Lancer » (`Play`) →
  `useDemarrer().routine(id)` avec `occupe={ouverture === id}`. Sans routine : le texte actuel
  « Ta première séance t'attend. » ; pendant une séance : rien (le bandeau D107 la reprend).
- `CarteSeance({ seance: SeanceFil })` — carte appuyable → `/historique/<id>`. Ligne de tête :
  nom (17 / 700) et jour (`formatJour`), `BadgeRecord` si `nbRecords` ; rangée de trois `Tuile`
  (Durée `dureeMin` + « min », Volume `formaterCharge`, Séries `seriesFaites`) ; filet ; une ligne
  par exercice de l'aperçu : `Vignette`, « \<nbSeries\> × \<nom\> » (une ligne, ellipse), meilleure
  série à droite (`formaterSerie`, `encreTertiaire`) ; « + n exercices » si `nbExercices >
  apercu.length`. `accessibilityLabel` résumant la séance.
- `index.tsx` : retirer `Semaine` (l'info vit dans Stats, D119) ; en-tête = titre + `ASuivre` +
  `Section` « Séances » ; `renderItem` = `CarteSeance` avec `marginHorizontal: espace.l`,
  `marginBottom: espace.m`. États inchangés (hors ligne, chargement, erreur) ; liste vide sans
  routine : `ASuivre` porte le message.
- `(onglets)/_layout.tsx` : le `Tabs.Screen name="historique"` reste en `href: null` (la pile du
  détail) ; son commentaire dit désormais « le détail d'une séance du fil ».

- [ ] **Step 1 :** écrire, supprimer, `tsc --noEmit`, `pnpm knip` (aucun export orphelin).
- [ ] **Step 2 : émulateur**, sombre et clair : Accueil nominal (capture), « Lancer » démarre
  Push A (abandonner ensuite), une carte ouvre son détail, tirer pour rafraîchir, défilement
  infini ; hors ligne (`adb shell svc wifi disable` + `svc data disable`, puis réactiver) :
  la dernière lecture s'affiche ou le message hors ligne.
- [ ] **Step 3 :** `.claude/rules/mobile.md` : remplacer la description de l'Accueil (D110) par
  D119 et celle de Démarrer par D120. Commit `feat(mobile): l'accueil devient le fil des séances (D119)`.

---

### Task 6 : vérification et PR

- [ ] `pnpm build && pnpm typecheck && pnpm test && pnpm exec biome check apps packages docs .claude/rules && pnpm knip`.
- [ ] `git push -u origin feat/refonte-accueil`, PR vers `main` (titre
  `feat: refonte des pages, lot 2 — accueil et démarrer (D119, D120)`), CI verte, fusion en squash.
  Pas de migration dans ce lot.
