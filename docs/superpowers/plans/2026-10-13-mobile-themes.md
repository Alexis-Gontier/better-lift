# Thèmes, Basic-Fit, clavier en séance — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre l'interface mobile interchangeable par fichier de thème, poser le thème Basic-Fit, et saisir kg / reps en séance au clavier du téléphone.

**Architecture:** Un thème = un dossier `apps/mobile/themes/<nom>/` (couleurs pures + polices, rayons, affiche). `lib/theme.ts` garde son API et lit `lib/theme-actif.ts`. La séance remplace le pavé maison par des `TextInput`.

**Tech Stack:** Expo SDK 57 (Expo Go), React Native, `@expo-google-fonts/*`, Vitest (Node).

**Spec:** [`docs/superpowers/specs/2026-10-13-mobile-themes-design.md`](../specs/2026-10-13-mobile-themes-design.md)

## Global Constraints

- Branche `feat/mobile-mvp-pages`, un commit par tâche, Conventional Commits en français.
- Tout texte tient 4,5:1 sur `canevas`, `surface1`, `surface2`, dans les deux registres de chaque thème.
- Une seule couleur d'action par thème ; pas de violet dans Basic-Fit.
- Polices installées par `npx expo install`, jamais une version de mémoire ; Metro relancé avec `--clear` après installation.
- `packages/shared` inchangé hormis le retrait de code sans appelant (`pave.ts`).
- Vérifier chaque tâche visible sur l'émulateur, en sombre et en clair (`adb shell cmd uimode night yes|no`).

---

### Task 1: Le socle des thèmes (aucun changement visible)

**Files:**
- Create: `apps/mobile/themes/type.ts` — `Couleurs` (déplacé de `lib/palette.ts`, commentaires compris) et `Theme`.
- Create: `apps/mobile/themes/underground/couleurs.ts` — `sombre`, `clair` (contenu actuel de `lib/palette.ts`).
- Create: `apps/mobile/themes/underground/index.ts` — le thème complet, polices Barlow.
- Create: `apps/mobile/themes/index.ts` — registre `themes`.
- Create: `apps/mobile/lib/theme-actif.ts` — la ligne qui choisit.
- Modify: `apps/mobile/lib/theme.ts` — lire le thème actif.
- Modify: `apps/mobile/app/_layout.tsx:1-8,42-48` — `useFonts(themeActif.polices.fichiers)`.
- Move/Modify: `apps/mobile/lib/palette.test.ts` → `apps/mobile/lib/themes.test.ts`, sur chaque thème.
- Create: `apps/mobile/lib/couleurs-en-dur.test.ts`.
- Delete: `apps/mobile/lib/palette.ts`.

**Interfaces:**
- Produces: `type Theme = { nom: string; couleurs: { sombre: Couleurs; clair: Couleurs }; polices: { fichiers: Record<string, number>; regulier; moyen; demiGras; gras; affiche: string }; rayon: { cellule; bouton; bandeau; carte; feuille: number }; affiche: { textTransform: "uppercase" | "none"; letterSpacing: number } }`; `couleursDesThemes: Record<string, {sombre, clair}>` (pur, pour les tests) ; `themeActif: Theme`.

- [ ] **Step 1: test des couleurs en dur (échoue tant qu'on ne l'a pas vérifié)**

```ts
// lib/couleurs-en-dur.test.ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const RACINE = join(__dirname, "..");
const LITTERAL = /["'`](#[0-9a-fA-F]{3,8})["'`]|rgba?\(/;

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) && !nom.endsWith(".test.ts") ? [chemin] : [];
  });
}

describe("les couleurs vivent dans les thèmes (D182)", () => {
  it.each(["app", "components", "lib"])("aucune couleur littérale dans %s/", (dossier) => {
    const fautifs = fichiers(join(RACINE, dossier)).filter((f) =>
      readFileSync(f, "utf8").split("\n").some((l) => !l.trim().startsWith("//") && LITTERAL.test(l)),
    );
    expect(fautifs).toEqual([]);
  });
});
```

Run: `pnpm --filter mobile test` — Expected: FAIL sur `lib/` (`palette.ts`).

- [ ] **Step 2: déplacer la palette dans `themes/`**, écrire `type.ts`, `underground/couleurs.ts` (valeurs identiques), `underground/index.ts` :

```ts
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold } from "@expo-google-fonts/barlow";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed";
import type { Theme } from "../type";
import { clair, sombre } from "./couleurs";

/** Underground orange (D161–D177) : Barlow, rayons francs de 6. */
export const underground: Theme = {
  nom: "Underground orange",
  couleurs: { sombre, clair },
  polices: {
    fichiers: { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold, BarlowCondensed_800ExtraBold },
    regulier: "Barlow_400Regular", moyen: "Barlow_500Medium", demiGras: "Barlow_600SemiBold",
    gras: "Barlow_700Bold", affiche: "BarlowCondensed_800ExtraBold",
  },
  rayon: { cellule: 6, bouton: 6, bandeau: 6, carte: 6, feuille: 16 },
  affiche: { textTransform: "uppercase", letterSpacing: 0.3 },
};
```

`themes/index.ts` exporte `themes = { underground }` et `couleursDesThemes` (importé de chaque `couleurs.ts`, sans police). `lib/theme-actif.ts` : `export const themeActif = themes.underground;`.

- [ ] **Step 3: `lib/theme.ts` lit le thème actif** — `useCouleurs` renvoie `themeActif.couleurs.clair|sombre` ; `polices`, `rayon` et `affiche` sont dérivés de `themeActif` (mêmes noms exportés) ; `_layout.tsx` charge `themeActif.polices.fichiers`.

- [ ] **Step 4: `themes.test.ts`** : le contenu de `palette.test.ts`, englobé dans `describe.each(Object.entries(couleursDesThemes))`. Supprimer `palette.ts` et `palette.test.ts`.

- [ ] **Step 5: vérifier** — `pnpm --filter mobile test`, `pnpm --filter mobile typecheck`, `pnpm knip` : tout vert. Émulateur : l'écran Entraînement est identique à avant.

- [ ] **Step 6: commit** `refactor(mobile): thèmes interchangeables, un fichier par thème (D182)`

### Task 2: Le thème Basic-Fit

**Files:**
- Create: `apps/mobile/themes/basic-fit/couleurs.ts`, `apps/mobile/themes/basic-fit/index.ts`
- Modify: `apps/mobile/themes/index.ts`, `apps/mobile/lib/theme-actif.ts`, `apps/mobile/package.json` (polices)

**Interfaces:**
- Consumes: `Theme`, `Couleurs` (Task 1).
- Produces: `themes.basicFit`, thème actif.

- [ ] **Step 1: installer les polices** — `cd apps/mobile && npx expo install @expo-google-fonts/archivo @expo-google-fonts/archivo-black`, puis vérifier les noms exportés (`Archivo_400Regular`… `ArchivoBlack_400Regular`) dans `node_modules`.
- [ ] **Step 2: `basic-fit/couleurs.ts`** — sombre : canevas ≈ `#0f0f0f`, surfaces `#1a1a1a` / `#242424` / `#2e2e2e`, encre `#ffffff`, action `#eb6800`, `surAction` foncé, `ongletActif` / `recordEncre` orange lisible, danger dérivé de `#c73326` ; clair : canevas `#fbf7f0`, surface1 `#ffffff`, surface2 `#f2e8d6`, encre `#2d2d2d`, secondaire `#6b6b6b`, orange en texte `#bd5400`. Ajouter `basicFit` dans `couleursDesThemes`.
- [ ] **Step 3: lancer `themes.test.ts`** — corriger chaque valeur qui échoue par sa valeur, jamais par le seuil.
- [ ] **Step 4: `basic-fit/index.ts`** — Archivo 400/500/600/700, affiche `ArchivoBlack_400Regular`, rayons `{ cellule: 8, bouton: 8, bandeau: 8, carte: 12, feuille: 16 }`, affiche `{ textTransform: "uppercase", letterSpacing: 0 }`. `themeActif = themes.basicFit`.
- [ ] **Step 5: vérifier** — tests, typecheck, knip ; Metro `--clear` ; captures Entraînement, une routine, la séance, Profil, en sombre et en clair.
- [ ] **Step 6: commit** `feat(mobile): thème Basic-Fit (D183)`

### Task 3: Le clavier du téléphone en séance

**Files:**
- Modify: `apps/mobile/app/seance.tsx` (état `Edition`, `ouvrir` / `fermer` / `suivant`, `PaveNumerique`, `BackHandler`)
- Modify: `apps/mobile/components/seance/ligne-serie.tsx` (cases → `TextInput`)
- Modify: `apps/mobile/components/seance/carte-exercice.tsx` (props transmises)
- Delete: `apps/mobile/components/seance/pave-numerique.tsx`
- Modify: `packages/shared/src/pave.ts` (+ tests) — retirer ce que Knip signale sans appelant.

**Interfaces:**
- Consumes: `lireCharge`, `lireReps`, `saisi` de `shared` (inchangés).
- Produces: `LigneSerie` reçoit `onSaisir(champ, texte)`, `onSuivant(champ)` et une ref par champ pour passer de kg à reps.

- [ ] **Step 1: lire `seance.tsx`, `ligne-serie.tsx`, `carte-exercice.tsx`** pour l'état `Edition` (texte tapé, `neuf`, validité) et la mesure des positions.
- [ ] **Step 2: cases en `TextInput`** — kg `keyboardType="decimal-pad"`, reps `"number-pad"`, `returnKeyType="next"` sur kg (focus reps), `"done"` sur reps ; `placeholder` = cible (valeur fantôme, couleur `encreTertiaire`), `value` = saisie ; `maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}`, `selectTextOnFocus`.
- [ ] **Step 3: écriture** — au `onChangeText`, garder le texte dans `Edition` ; écrire dans la séance (`appliquer`) à la perte du focus et à « Suivant », jamais une saisie invalide (contour `dangerEncre` tant qu'elle l'est).
- [ ] **Step 4: retirer le pavé** — `PaveNumerique`, ±2,5, « Valider la série » du pavé, `BackHandler` du pavé (le retour ferme le clavier nativement), `paddingBottom` à 60 % ; le défilement amène la ligne en saisie au quart haut au focus.
- [ ] **Step 5: vérifier** — tests (`shared`, `mobile`), typecheck, knip (retirer de `shared/pave.ts` ce qui n'a plus d'appelant) ; émulateur : séance de démo, saisir 62,5 kg puis 8 reps, valider ✓, relire la valeur après rechargement.
- [ ] **Step 6: commit** `feat(mobile): clavier du téléphone en séance (D184)`

### Task 4: Documentation

**Files:**
- Modify: `.claude/rules/mobile.md` (Système, Séance : pavé → clavier), `DESIGN.md` (thème actif), `CLAUDE.md` (État).

- [ ] **Step 1:** décrire `themes/`, `theme-actif.ts`, les garde-fous, le thème Basic-Fit, la saisie au clavier ; retirer ce qui décrit le pavé D109.
- [ ] **Step 2:** `pnpm build && pnpm typecheck && pnpm test && pnpm exec biome check apps packages && pnpm knip`.
- [ ] **Step 3: commit** `docs(mobile): thèmes et clavier (D182–D184)`
