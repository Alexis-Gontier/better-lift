# Identité mobile — lot 1 : le système — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** l'app mobile change de peau — palette « Underground orange », Barlow / Barlow Condensed, rayons francs, chargement en squelette, logo orange — **sans qu'aucun écran change de mise en page**.

**Architecture :** tout passe déjà par `lib/theme.ts` (`creerStyles`, `useCouleurs`, `polices`, `rayon`). On sort la palette dans un fichier pur (`lib/palette.ts`, sans React Native) gardé par un test Vitest de contraste, on remplace les familles de police dans la table `polices` et dans `app/_layout.tsx`, puis on ajuste les rares styles qui échappent au thème (titres, rayons littéraux, couleurs de `app.json`, logo SVG et ses rendus PNG).

**Tech Stack :** Expo SDK 57 (Expo Go), React Native, `@expo-google-fonts/barlow` et `@expo-google-fonts/barlow-condensed`, Vitest 5 (catalogue pnpm), `@resvg/resvg-js` 2.6.2 (hors dépôt, pour les PNG).

**Spec :** [`docs/superpowers/specs/2026-10-11-mobile-identite-design.md`](../specs/2026-10-11-mobile-identite-design.md) — D161 à D164, D176 (squelettes), découpage « lot 1 ».

## Global Constraints

- L'application est en **français** : commentaires, micro-textes, messages de commit (Conventional Commits, sujet en minuscule, 100 caractères au plus).
- **Aucune mise en page ne change** dans ce lot : seules couleurs, polices, rayons et l'indicateur de chargement bougent. Les changements de structure sont aux lots 2 à 6.
- **Un token par rôle, deux valeurs** (sombre / clair) ; jamais de couleur en dur dans un écran.
- **Tout texte tient 4,5:1** sur la surface où il se pose, dans les deux registres — désormais vérifié par `lib/palette.test.ts`.
- **Une seule couleur pour l'action et le record** (orange), distinguée par la forme : aplat pour l'action, contour + flèche pour le record. Le lime disparaît du mobile.
- Barlow Condensed (`polices.affiche`) **seulement** pour les titres de page, les noms en tête, le chrono et les valeurs de record ; **jamais** dans un bouton, une étiquette, une puce ni un tableau.
- Styles par `creerStyles` ; **jamais de `StyleSheet.create` au niveau du module**.
- Dépendance Expo : `npx expo install <paquet>`, jamais une version de mémoire ; Metro relancé avec `--clear` après l'installation.
- `main` est protégée : une branche, une PR, squash. Le lot 0 (`chore/refonte-mobile-orange` : skills et spec) part en PR **avant** ce lot ; ce lot part d'elle.
- Knip refuse un export sans usage : n'exporter que ce qu'un autre fichier importe.

## Fichiers

| Fichier | Rôle dans ce lot |
|---|---|
| `apps/mobile/lib/palette.ts` (nouveau) | Type `Couleurs`, palettes `sombre` et `clair`. TypeScript pur |
| `apps/mobile/lib/palette.test.ts` (nouveau) | La garde de contraste et l'absence de lime |
| `apps/mobile/vitest.config.ts` (nouveau) | Vitest pour `lib/**/*.test.ts` |
| `apps/mobile/package.json` | Script `test`, `vitest` en dev, polices Barlow, retrait d'Archivo |
| `apps/mobile/lib/theme.ts` | Importe la palette ; `polices`, `famillePour`, `affiche`, `taille.titre`, `rayon` |
| `apps/mobile/app/_layout.tsx` | Charge Barlow et Barlow Condensed |
| 6 fichiers qui lisent `polices.condense` | Passent à `polices.affiche` |
| Titres d'écran (liste à la tâche 3) | Style `affiche` |
| Fichiers à `borderRadius` littéral 10, 12, 18, 20 | Passent par `rayon` |
| `apps/mobile/components/ui/etats.tsx` | `Chargement` devient un squelette |
| `apps/mobile/app/(onglets)/_layout.tsx` | La garde de session n'affiche rien pendant sa lecture |
| `apps/mobile/assets/logo.svg`, `icon.png`, `splash.png`, `app.json` | L'orange du logo et du système |
| `apps/mobile/components/ui/logo.tsx` | Commentaire (« aplat orange ») |
| Supprimés : `apps/mobile/assets/polices/`, `scripts/polices/` | La coupe condensée générée (D103) n'a plus lieu d'être |
| `.claude/rules/mobile.md`, la spec | Règles et une valeur corrigée |

---

### Task 0 : partir de la bonne base

**Files :** aucun.

- [ ] **Step 1 : pousser le lot 0 et ouvrir sa PR** (demander l'accord de l'utilisateur avant de pousser).

```bash
git switch chore/refonte-mobile-orange
git push -u origin chore/refonte-mobile-orange
gh pr create --base main --title "chore: skills de design et conception de la nouvelle identité mobile (D161–D177)" --body "Lot 0 de la spec docs/superpowers/specs/2026-10-11-mobile-identite-design.md : skills impeccable, emil-design-eng, industrial-brutalist-ui (--copy) et la conception.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 2 : créer la branche du lot 1 depuis le lot 0**

```bash
git switch -c feat/mobile-identite-systeme
```

Après la fusion (squash) du lot 0 : `git rebase --onto origin/main <ancienne pointe de chore/refonte-mobile-orange> feat/mobile-identite-systeme`, puis recibler la PR sur `main`.

---

### Task 1 : la palette, sortie du thème et gardée par un test

**Files :**
- Create : `apps/mobile/lib/palette.ts`
- Create : `apps/mobile/lib/palette.test.ts`
- Create : `apps/mobile/vitest.config.ts`
- Modify : `apps/mobile/package.json` (script `test`, `vitest` en devDependencies)
- Modify : `apps/mobile/lib/theme.ts` (le type `Couleurs`, `LIME`, `sombre`, `clair` partent dans `palette.ts`)

**Interfaces :**
- Produces : `export type Couleurs` et `export const sombre: Couleurs`, `export const clair: Couleurs` dans `lib/palette.ts`. Mêmes clés qu'aujourd'hui (aucune ajoutée ni retirée). `theme.ts` les importe ; `useCouleurs()` ne change pas de signature.

- [ ] **Step 1 : installer Vitest dans le mobile**

Dans `apps/mobile/package.json`, ajouter `"test": "vitest run"` aux `scripts` et `"vitest": "catalog:"` aux `devDependencies`, puis :

```bash
pnpm install
```

Créer `apps/mobile/vitest.config.ts` :

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
```

- [ ] **Step 2 : déplacer la palette ACTUELLE dans `lib/palette.ts`**

Couper de `lib/theme.ts` le type `Couleurs` (avec ses commentaires), `const LIME`, `const sombre` et `const clair`, et les coller tels quels dans `lib/palette.ts`, en exportant `Couleurs`, `sombre` et `clair`. Aucun import de `react-native` dans ce fichier. Dans `theme.ts` :

```ts
import { type Couleurs, clair, sombre } from "./palette";
```

Personne d'autre n'importe `Couleurs` depuis `theme.ts` : ne pas le ré-exporter (Knip).

Vérifier que rien n'a bougé :

```bash
pnpm --filter mobile typecheck
```

Attendu : succès.

- [ ] **Step 3 : écrire le test qui échoue**

Créer `apps/mobile/lib/palette.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { type Couleurs, clair, sombre } from "./palette";

type Rgba = [number, number, number, number];

/** `#rrggbb` ou `rgba(r, g, b, a)`. */
function lire(couleur: string): Rgba {
  if (couleur.startsWith("#")) {
    const n = (i: number) => Number.parseInt(couleur.slice(i, i + 2), 16);
    return [n(1), n(3), n(5), 1];
  }
  const [r, g, b, a] = couleur.replace(/[^\d.,]/g, "").split(",").map(Number);
  return [r, g, b, a ?? 1];
}

/** Une couleur translucide posée sur un fond opaque. */
function poser(couleur: string, fond: string): Rgba {
  const [r, g, b, a] = lire(couleur);
  const [fr, fg, fb] = lire(fond);
  return [r * a + fr * (1 - a), g * a + fg * (1 - a), b * a + fb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(a: Rgba, b: Rgba): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const TEXTES = [
  "encre",
  "encreSecondaire",
  "encreTertiaire",
  "encreAttenuee",
  "dangerEncre",
  "superset",
] as const satisfies readonly (keyof Couleurs)[];

describe.each([
  ["sombre", sombre],
  ["clair", clair],
] as const)("la palette %s", (_nom, c) => {
  // Le canevas, les cartes, les feuilles : là où du texte se pose.
  const surfaces = [c.canevas, c.surface1, c.surface2];

  it.each(TEXTES)("%s tient 4,5:1 sur chaque surface", (role) => {
    for (const s of surfaces) {
      expect(contraste(lire(c[role]), lire(s))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("le texte posé sur l'aplat d'action tient 4,5:1", () => {
    expect(contraste(lire(c.surAction), lire(c.action))).toBeGreaterThanOrEqual(4.5);
  });

  it("le texte posé sur l'aplat de danger tient 4,5:1", () => {
    expect(contraste(lire(c.surDanger), lire(c.danger))).toBeGreaterThanOrEqual(4.5);
  });

  it("le badge record se lit sur son fond teinté, sur le canevas et les cartes", () => {
    for (const s of [c.canevas, c.surface1]) {
      expect(contraste(lire(c.recordEncre), poser(c.recordFond, s))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("le lime a quitté la palette (D161)", () => {
    expect(JSON.stringify(c)).not.toMatch(/a8cf45|168, ?207, ?69|4d6a12/i);
  });
});
```

- [ ] **Step 4 : le lancer, il doit échouer**

```bash
pnpm --filter mobile test
```

Attendu : FAIL sur « le lime a quitté la palette » dans les deux registres (la palette actuelle est encore lime). Les tests de contraste peuvent passer : la palette actuelle les tient déjà.

- [ ] **Step 5 : écrire la palette « Underground orange » (D161)**

Dans `lib/palette.ts`, remplacer `const LIME = …` et les deux objets par ce qui suit (le type `Couleurs` et ses commentaires restent ; mettre à jour le commentaire d'en-tête : « Le lime ne porte que deux rôles » devient « L'orange ne porte que deux rôles… Exceptions : la carte du corps, le calendrier (D162) »).

```ts
const ORANGE = "#f47a20";
/** L'orange franc de Basic-Fit, pour le registre clair (D161). */
const ORANGE_CLAIR = "#fe7000";

export const sombre: Couleurs = {
  canevas: "#121412",
  surface1: "#1b1e1b",
  surface2: "#242824",
  surface3: "#2c312c",
  ligne: "#2b302b",
  ligneFaite: "#262b26",
  ligneForte: "#3d433d",
  encre: "#f3f4f1",
  encreSecondaire: "#c3c8c3",
  encreTertiaire: "#9aa09b",
  // 5,2:1 sur les feuilles (surface2), 6,4:1 sur le canevas.
  encreAttenuee: "#939a93",
  action: ORANGE,
  surAction: "#121412",
  // D165 : l'onglet actif n'est plus coloré ; l'indicateur en pilule arrive au lot 2.
  ongletActif: "#f3f4f1",
  recordEncre: ORANGE,
  recordFond: "rgba(244, 122, 32, 0.14)",
  recordLigne: "rgba(244, 122, 32, 0.4)",
  danger: "#c42443",
  surDanger: "#ffffff",
  // Rouge rosé : l'ancien rouge se confondait avec l'orange de l'action.
  dangerEncre: "#ff4d6d",
  voile: "rgba(0, 0, 0, 0.6)",
  superset: "#9a8cf0",
  corps: ORANGE,
  corpsSecondaire: "rgba(244, 122, 32, 0.45)",
  calendrier: [
    "#242824",
    "rgba(244, 122, 32, 0.25)",
    "rgba(244, 122, 32, 0.5)",
    "rgba(244, 122, 32, 0.75)",
    ORANGE,
  ],
  fondImage: "#ffffff",
};

export const clair: Couleurs = {
  canevas: "#f4f4f2",
  surface1: "#ffffff",
  surface2: "#ebebe7",
  surface3: "#e1e1dc",
  ligne: "#dcdcd7",
  ligneFaite: "#e6e6e1",
  ligneForte: "#b9bdb6",
  encre: "#121412",
  encreSecondaire: "#3b403c",
  encreTertiaire: "#5c625d",
  // 4,8:1 sur les feuilles (surface2), 5,2:1 sur le canevas.
  encreAttenuee: "#626862",
  action: ORANGE_CLAIR,
  surAction: "#121412",
  ongletActif: "#121412",
  // L'orange en texte ne se lit pas sur fond clair : le record passe à l'orange brûlé.
  recordEncre: "#a84800",
  recordFond: "rgba(254, 112, 0, 0.1)",
  recordLigne: "rgba(168, 72, 0, 0.4)",
  danger: "#c4213f",
  surDanger: "#ffffff",
  dangerEncre: "#c4213f",
  voile: "rgba(0, 0, 0, 0.4)",
  superset: "#5a4bbf",
  corps: ORANGE_CLAIR,
  corpsSecondaire: "rgba(254, 112, 0, 0.4)",
  calendrier: [
    "#e1e1dc",
    "rgba(254, 112, 0, 0.22)",
    "rgba(254, 112, 0, 0.45)",
    "rgba(254, 112, 0, 0.7)",
    "#e06300",
  ],
  fondImage: "#ffffff",
};
```

- [ ] **Step 6 : relancer le test, il doit passer**

```bash
pnpm --filter mobile test
```

Attendu : PASS, 20 tests (10 par registre). Si un contraste échoue, ajuster **la valeur du token** (jamais le seuil) et noter la nouvelle mesure dans son commentaire.

- [ ] **Step 7 : vérifier et commiter**

```bash
pnpm --filter mobile typecheck && pnpm lint && pnpm knip
git add apps/mobile/lib/palette.ts apps/mobile/lib/palette.test.ts apps/mobile/lib/theme.ts apps/mobile/vitest.config.ts apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(mobile): palette underground orange, gardée par un test de contraste (D161)"
```

(Terminer chaque message de commit par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.)

---

### Task 2 : Barlow et Barlow Condensed (D163)

**Files :**
- Modify : `apps/mobile/package.json` (dépendances de police)
- Modify : `apps/mobile/lib/theme.ts` (`polices`, `famillePour`, commentaires)
- Modify : `apps/mobile/app/_layout.tsx:1-50` (chargement des polices)
- Modify : `polices.condense` → `polices.affiche` dans `components/seance/pave-numerique.tsx:201`, `components/seance/bandeau-repos.tsx:101`, `components/bandeau-seance.tsx:80`, `app/seance.tsx:511`, `app/fin.tsx:324`
- Delete : `apps/mobile/assets/polices/` (dossier), `scripts/polices/` (dossier)

**Interfaces :**
- Produces : `polices = { regulier, moyen, demiGras, gras, affiche }` (chaînes de famille). `polices.extraGras` et `polices.condense` disparaissent. `famillePour` : `"400"`/`"normal"` → `regulier` ; absent ou `"500"` → `moyen` ; `"600"` → `demiGras` ; `"700"`, `"bold"`, `"800"`, `"900"` → `gras` (l'interface plafonne à 700 ; l'affiche se pose explicitement).

- [ ] **Step 1 : installer les polices, retirer Archivo**

```bash
cd apps/mobile
npx expo install @expo-google-fonts/barlow @expo-google-fonts/barlow-condensed
pnpm remove @expo-google-fonts/archivo
cd ../..
```

- [ ] **Step 2 : la table des polices**

Dans `lib/theme.ts`, remplacer le bloc `polices` et `famillePour` par :

```ts
/**
 * Les polices (D163) : une famille, deux largeurs. Barlow pour toute
 * l'interface ; Barlow Condensed (l'« affiche ») seulement pour les titres de
 * page, les noms en tête, le chrono et les valeurs de record — jamais dans un
 * bouton, une étiquette ni un tableau. Chargées par `expo-font` dans
 * `app/_layout.tsx`. Une police chargée ne se met pas en gras toute seule sous
 * Android : chaque graisse est une famille à part.
 */
export const polices = {
  regulier: "Barlow_400Regular",
  moyen: "Barlow_500Medium",
  demiGras: "Barlow_600SemiBold",
  gras: "Barlow_700Bold",
  affiche: "BarlowCondensed_800ExtraBold",
} as const;

function famillePour(graisse: TextStyle["fontWeight"]): string {
  switch (String(graisse ?? "500")) {
    case "400":
    case "normal":
      return polices.regulier;
    case "600":
      return polices.demiGras;
    case "700":
    case "bold":
    case "800":
    case "900":
      return polices.gras;
    default:
      return polices.moyen;
  }
}
```

Mettre à jour le commentaire d'`avecPolices` (« la famille Archivo » → « la famille Barlow »).

- [ ] **Step 3 : les charger à la racine**

Dans `app/_layout.tsx`, remplacer l'import d'Archivo et l'appel à `useFonts` :

```ts
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
  useFonts,
} from "@expo-google-fonts/barlow";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed";
```

```ts
  const [policesPretes, erreurPolices] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_800ExtraBold,
  });
```

Retirer `polices` de l'import de `../lib/theme` s'il n'y sert plus.

- [ ] **Step 4 : `polices.condense` → `polices.affiche`**

Dans les cinq fichiers listés, remplacer `polices.condense` par `polices.affiche`. Vérifier qu'il n'en reste aucun :

```bash
grep -rn "polices\.condense\|polices\.extraGras\|Archivo" apps/mobile --include=*.ts --include=*.tsx | grep -v node_modules
```

Attendu : aucune ligne.

- [ ] **Step 5 : supprimer la coupe générée**

```bash
git rm -r apps/mobile/assets/polices scripts/polices
grep -rn "condenser-archivo\|assets/polices" . --include=*.md --include=*.json --include=*.ts --include=*.tsx | grep -v node_modules
```

Attendu après le `grep` : seulement des mentions dans `.claude/rules/mobile.md` et les anciennes specs (traitées à la tâche 6 pour les règles ; les specs restent un historique).

- [ ] **Step 6 : vérifier et commiter**

```bash
pnpm --filter mobile typecheck && pnpm --filter mobile test && pnpm lint && pnpm knip
```

Lancer l'app (voir `.claude/rules/mobile.md`, « Lancer ») avec `npx expo start --clear` : l'écran de démarrage se lève, le texte est en Barlow, le chrono de séance en Barlow Condensed.

```bash
git add -A apps/mobile scripts pnpm-lock.yaml
git commit -m "feat(mobile): barlow et barlow condensed remplacent archivo (D163)"
```

---

### Task 3 : rayons francs et titres d'affiche (D163, D164)

**Files :**
- Modify : `apps/mobile/lib/theme.ts` (`rayon`, `taille.titre`, nouveau style `affiche`)
- Modify : titres — `app/(onglets)/index.tsx:73`, `app/(onglets)/profil.tsx:296` et `:326`, `app/(onglets)/routines/index.tsx:126`, `app/(onglets)/stats.tsx:249` et `:276`, `app/connexion.tsx:169`, `app/fin.tsx:284` et `:306`, `components/exercices/progression.tsx:88`, `components/feuille-demarrer.tsx:146`, `components/ui/entete-retour.tsx:45`
- Modify : tout fichier où `grep` trouve un `borderRadius` littéral de 10, 12, 18 ou 20

**Interfaces :**
- Consumes : `polices.affiche` (tâche 2).
- Produces : `export const affiche` dans `lib/theme.ts` — `{ fontFamily: polices.affiche, textTransform: "uppercase", letterSpacing: 0.3 } as const`, à étaler dans un style (`{ ...affiche, color, fontSize }`). `rayon = { cellule: 6, bouton: 6, bandeau: 6, carte: 6, feuille: 16 }`. `taille.titre` passe de 26 à 32 (le condensé se lit plus petit à taille égale).

- [ ] **Step 1 : l'échelle**

Dans `lib/theme.ts` :

```ts
/** Les rayons par rôle (D164) : francs, comme On Air, sans être tranchants. */
export const rayon = { cellule: 6, bouton: 6, bandeau: 6, carte: 6, feuille: 16 } as const;

/**
 * L'affiche (D163) : Barlow Condensed en capitales, pour les titres de page, le
 * nom en tête d'une routine ou d'un exercice, le chrono, les valeurs de record.
 * `fontFamily` posée ici, `creerStyles` la respecte.
 */
export const affiche = {
  fontFamily: polices.affiche,
  textTransform: "uppercase",
  letterSpacing: 0.3,
} as const;
```

Et dans `taille` : `titre: 32,` (commentaire : « en affiche »).

- [ ] **Step 2 : les titres passent à l'affiche**

Dans chaque style listé ci-dessus, étaler `affiche` et retirer `fontWeight` (l'affiche porte sa graisse). Exemple, `app/(onglets)/index.tsx` :

```ts
  titre: {
    ...affiche,
    color: couleurs.encre,
    fontSize: taille.titre,
    paddingTop: espace.l,
  },
```

Exemple, `app/fin.tsx:284` (une valeur de record) :

```ts
  medailleTexte: { ...affiche, color: couleurs.recordEncre, fontSize: 28 },
```

Ajouter `affiche` à l'import de `lib/theme` dans chaque fichier touché. **Ne pas** toucher `feuille-demarrer.tsx:158` (`aplatTexte`, un bouton : il reste en Barlow, sa graisse 800 donne désormais Barlow 700 par `famillePour`). `components/ui/ecran-erreur.tsx` garde Barlow : l'écran de secours ne doit dépendre de rien de plus que nécessaire.

- [ ] **Step 3 : les rayons littéraux**

```bash
grep -rnE "borderRadius: (10|12|18|20)\b" apps/mobile --include=*.tsx | grep -v node_modules
```

Pour chaque ligne : une cellule, une case ou une puce rectangulaire → `rayon.cellule` ; un bouton → `rayon.bouton` ; un bandeau → `rayon.bandeau` ; une carte → `rayon.carte`. **Exception** : un élément rond (rayon = moitié de sa taille, ex. un cercle de 20 × 20 à `borderRadius: 10`) reste tel quel. Les rayons de 2 à 8 (barres, points) et 999 (pilules) ne changent pas.

- [ ] **Step 4 : vérifier sur l'émulateur, sombre et clair**

```bash
pnpm --filter mobile typecheck && pnpm lint && pnpm knip
```

Sur l'émulateur, Accueil, Routines, Stats, Profil, une routine, une fiche, la séance et la fin : titres en capitales condensées, aucun texte rogné, rayons à 6. Passer en clair par Profil → Thème. Taille du texte système à 1,3 (`adb shell settings put system font_scale 1.3`, remettre `1.0` après) : les titres longs passent à la ligne sans couper.

- [ ] **Step 5 : commiter**

```bash
git add -A apps/mobile
git commit -m "feat(mobile): rayons francs et titres en affiche condensée (D163, D164)"
```

---

### Task 4 : le chargement en squelette (D176)

**Files :**
- Modify : `apps/mobile/components/ui/etats.tsx` (`Chargement`)
- Modify : `apps/mobile/app/(onglets)/_layout.tsx` (la garde de session)

**Interfaces :**
- Produces : `Chargement()` sans prop, même nom, mêmes appelants (10 usages). Il dessine trois blocs à la forme de cartes, qui pulsent ; immobiles si le téléphone demande de réduire les animations.

- [ ] **Step 1 : le squelette**

Dans `components/ui/etats.tsx`, remplacer `Chargement` (et retirer `ActivityIndicator` de l'import s'il ne sert plus) :

```tsx
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Le chargement d'une page (D176) : un squelette de cartes, pas un indicateur
 * au milieu du contenu (NN/g : de 1 à 10 s, la forme de la page rassure). Il
 * pulse doucement, immobile si le téléphone demande moins d'animations.
 */
export function Chargement() {
  const styles = useStyles();
  const reduit = useReducedMotion();
  const opacite = useSharedValue(1);
  useEffect(() => {
    if (reduit) return;
    opacite.value = withRepeat(withTiming(0.5, { duration: 900 }), -1, true);
  }, [reduit, opacite]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacite.value }));
  return (
    <Animated.View
      style={[styles.squelette, pulse]}
      accessible
      accessibilityLabel="Chargement"
      accessibilityRole="progressbar"
    >
      <View style={[styles.bloc, { height: 96 }]} />
      <View style={[styles.bloc, { height: 64 }]} />
      <View style={[styles.bloc, { height: 64 }]} />
    </Animated.View>
  );
}
```

Dans `useStyles` du même fichier, ajouter :

```ts
  squelette: { flex: 1, gap: espace.m, padding: espace.l },
  bloc: { borderRadius: rayon.carte, backgroundColor: couleurs.surface1 },
```

- [ ] **Step 2 : la garde de session n'affiche rien**

Dans `app/(onglets)/_layout.tsx`, la lecture de session dure moins d'une seconde : un squelette y clignoterait. Remplacer `if (isPending || (error && cookieGarde === null)) return <Chargement />;` par :

```tsx
  // Moins d'une seconde en général : rien plutôt qu'un squelette qui clignote (NN/g).
  if (isPending || (error && cookieGarde === null)) {
    return <View style={{ flex: 1, backgroundColor: couleurs.canevas }} />;
  }
```

Retirer `Chargement` de l'import s'il n'y sert plus.

- [ ] **Step 3 : vérifier**

```bash
pnpm --filter mobile typecheck && pnpm lint && pnpm knip
```

Sur l'émulateur : ouvrir Stats sur une période jamais chargée (le squelette apparaît puis la page) ; activer « Supprimer les animations » dans les options d'accessibilité Android et revérifier (squelette immobile).

- [ ] **Step 4 : commiter**

```bash
git add apps/mobile/components/ui/etats.tsx "apps/mobile/app/(onglets)/_layout.tsx"
git commit -m "feat(mobile): chargement en squelette (D176)"
```

---

### Task 5 : le logo et l'application en orange

**Files :**
- Modify : `apps/mobile/assets/logo.svg` (fond `#a8cf45` → `#f47a20`, encre `#0b0f04` → `#121412`)
- Modify : `apps/mobile/assets/icon.png` (1024 × 1024, carré plein, régénéré)
- Modify : `apps/mobile/assets/splash.png` (512 × 512, coins arrondis, régénéré)
- Modify : `apps/mobile/app.json` (`expo-notifications.color`, `android.adaptiveIcon.backgroundColor` → `#f47a20` ; `expo-splash-screen.backgroundColor` → `#121412`)
- Modify : `apps/mobile/components/ui/logo.tsx` (commentaire : « aplat orange »)

`adaptive.png` (haltère à l'encre sur transparent) et `monochrome.png` ne changent pas.

- [ ] **Step 1 : le SVG**

Dans `assets/logo.svg`, remplacer `fill="#a8cf45"` par `fill="#f47a20"` et `stroke="#0b0f04"` par `stroke="#121412"`.

- [ ] **Step 2 : rendre les PNG** (outil hors dépôt, dans le dossier temporaire de session)

```bash
D="$TEMP/rendu-logo" && mkdir -p "$D" && cd "$D" && npm init -y >/dev/null && npm i @resvg/resvg-js@2.6.2 --silent
cat > rendre.cjs <<'EOF'
const { Resvg } = require("@resvg/resvg-js");
const fs = require("node:fs");
const [, , source, sortie, largeur] = process.argv;
const png = new Resvg(fs.readFileSync(source, "utf8"), {
  fitTo: { mode: "width", value: Number(largeur) },
}).render().asPng();
fs.writeFileSync(sortie, png);
EOF
L=/c/Users/alexi/Desktop/dev/better-lift/apps/mobile/assets
# L'icône est un carré plein : sans coins arrondis (le lanceur les découpe lui-même).
sed 's/rx="22"/rx="0"/' "$L/logo.svg" > carre.svg
node rendre.cjs carre.svg "$L/icon.png" 1024
node rendre.cjs "$L/logo.svg" "$L/splash.png" 512
cd /c/Users/alexi/Desktop/dev/better-lift
```

Ouvrir `icon.png` et `splash.png` (outil de lecture d'image) : haltère à l'encre sur orange, centrée comme avant.

- [ ] **Step 3 : `app.json` et le commentaire du logo**

Les trois couleurs de la liste ci-dessus ; dans `components/ui/logo.tsx`, « en encre sur un aplat lime » → « en encre sur un aplat orange ».

```bash
grep -rn "a8cf45\|08090a" apps/mobile --include=*.json --include=*.svg --include=*.tsx --include=*.ts | grep -v node_modules
```

Attendu : aucune ligne.

- [ ] **Step 4 : commiter**

L'icône et l'écran de démarrage ne se voient que dans un build EAS (`.claude/rules/mobile.md`) : le dire dans la PR, ne pas lancer de build sans l'accord de l'utilisateur.

```bash
git add apps/mobile/assets apps/mobile/app.json apps/mobile/components/ui/logo.tsx
git commit -m "feat(mobile): logo, icône et écran de démarrage en orange"
```

---

### Task 6 : les règles, la vérification complète, la PR

**Files :**
- Modify : `.claude/rules/mobile.md`
- Modify : `docs/superpowers/specs/2026-10-11-mobile-identite-design.md` (D161 : record clair `#b34d00` → `#a84800`, mesuré à la tâche 1)

- [ ] **Step 1 : les règles**

Dans `.claude/rules/mobile.md`, section « Système » :
- Titre : `## Système (D101–D103, D161–D164)` et un lien vers la nouvelle spec.
- « Couleurs par rôle » : la palette vit dans `lib/palette.ts` (TypeScript pur) ; **`lib/palette.test.ts` vérifie chaque texte à 4,5:1 sur le canevas, les cartes et les feuilles, les aplats et le badge record** — un token qui échoue se corrige par sa valeur, jamais par le seuil.
- Remplacer la puce « Archivo » par : « **Barlow** et **Barlow Condensed** (D163, `@expo-google-fonts`, chargées à la racine). `creerStyles` traduit `fontWeight` en famille Barlow (plafond 700) ; l'**affiche** (`affiche` de `lib/theme.ts` : Barlow Condensed en capitales) se pose explicitement, seulement sur titres de page, noms en tête, chrono et valeurs de record — jamais sur un bouton, une étiquette ou un tableau. »
- « Contraste » : ajouter « (vérifié par `lib/palette.test.ts`) ».
- « Carte du corps » et « Routines » : « Les muscles sont en vert (D84 révisée) : seul usage du lime… » → « Les muscles sont en orange (D162) : exception bornée au dessin du corps, avec le calendrier ».
- Section « Navigation » : « un **rond lime** » → « un **rond orange** » ; « **Onglet actif en lime** (D115…) — token `ongletActif` : lime en sombre, olive en clair… » → « **Onglet actif à l'encre** en attendant l'indicateur en pilule de Material 3 (D165, lot 2) ».
- Section « Stats » : « token `calendrier[0..4]`, D127 » → « token `calendrier[0..4]`, orange depuis D162 ».
- Ajouter à « Système » : « **États (D176)** : `Chargement` dessine un squelette de cartes qui pulse (immobile si les animations sont réduites) ; une attente de moins d'une seconde (garde de session) n'affiche rien. »

- [ ] **Step 2 : la spec**

Dans D161, remplacer « `#b34d00` en clair (5,3:1 sur blanc, 4,8:1 sur le canevas clair) » par « `#a84800` en clair (5,3:1 sur le canevas clair, 4,8:1 sur son fond teinté) ».

- [ ] **Step 3 : tout vérifier**

Lancer la skill `/verif` (build, typecheck, test, lint, knip). Attendu : tout vert, dont les 20 tests de `palette.test.ts`.

Puis l'émulateur, **sombre puis clair**, une capture par écran (`adb exec-out screencap -p > …` dans le dossier temporaire) : Accueil, feuille Démarrer, séance (série faite, prochaine, à venir, bandeau de repos, pavé), fin de séance avec un record, Routines, une routine, Stats, une fiche, Profil, connexion. Pour chacune : aucun lime, l'orange seulement sur l'aplat d'action, les badges record, la carte du corps et le calendrier ; aucun texte rogné ; titres en affiche. Les états : chargement (squelette), vide (une période sans séance), hors ligne (`adb shell cmd connectivity airplane-mode enable`, puis Reload ; le rétablir après).

- [ ] **Step 4 : commiter, pousser, ouvrir la PR** (demander l'accord avant de pousser)

```bash
git add .claude/rules/mobile.md docs/superpowers/specs/2026-10-11-mobile-identite-design.md
git commit -m "docs: règles du mobile pour la nouvelle identité (D161–D164, D176)"
git push -u origin feat/mobile-identite-systeme
gh pr create --base chore/refonte-mobile-orange --title "feat(mobile): nouvelle identité, lot 1 — le système (D161–D164, D176)" --body "Lot 1 de docs/superpowers/specs/2026-10-11-mobile-identite-design.md : palette underground orange gardée par un test de contraste, Barlow / Barlow Condensed, rayons francs, titres en affiche, chargement en squelette, logo orange. Aucune mise en page ne change.

L'icône et l'écran de démarrage ne se voient que dans un build EAS (non lancé).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Si le lot 0 est déjà fusionné, passer `--base main` (après le rebase de la tâche 0).
