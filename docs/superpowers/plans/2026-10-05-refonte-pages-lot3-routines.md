# Refonte des pages — lot 3 : Routines — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal :** l'onglet Routines porte « Mes routines » | « Exercices » (D121) ; la page d'une routine
se lit, puis se modifie (D122). Aucune API ne change : les noms et la durée viennent du détail
des routines, déjà en cache (`useQueries`), « la dernière fois » de `/seances/precedentes`.

**Spec :** [`2026-10-05-mobile-refonte-pages-design.md`](../specs/2026-10-05-mobile-refonte-pages-design.md) — D118, D121, D122.

## Global Constraints

Celles du lot 2 (français, commits en minuscule, un seul aplat, « Lancer » en contour, quatre
états, sombre et clair, Knip, `biome check apps packages docs .claude/rules`).

Branche : `feat/refonte-routines` depuis `main`.

### Task 1 : `Segments`

`components/ui/segments.tsx` : `Segments<T extends string>({ options: { valeur: T; libelle: string }[], valeur, onChange })`
— piste `surface2` rayon `cellule`, segment actif `surface3` + encre 700, inactif `encreTertiaire` ;
hauteur `CIBLE` - 8 ; `accessibilityRole="tablist"`, chaque segment `tab` avec `selected`.

### Task 2 : la vue Exercices

`components/exercices/catalogue.tsx` : la recherche de `exercices/index.tsx` sur le catalogue
COMPLET (`optionsCatalogueComplet` + `filtrerCatalogue`, hors ligne compris), plus une rangée de
puces de groupe défilante (« Tous » + `GROUPES` / `LIBELLE_GROUPE`, filtre côté téléphone). Ligne :
`Vignette` 40, nom, « groupe · équipement » ; appui → `/exercices/<slug>`. États : hors ligne sans
cache, chargement, erreur, aucun résultat. Supprimer `app/(onglets)/exercices/index.tsx` (la pile
garde la fiche) et adapter le commentaire du `Tabs.Screen name="exercices"`.

### Task 3 : la liste des routines

`routines/index.tsx` : titre + « Nouvelle » (contour, seulement sur « Mes routines »), `Segments`,
puis la vue choisie. `CarteRoutine` (`components/routines/carte-routine.tsx`) : carte `surface1`
rayon `carte` → page de la routine ; nom (17 / 700) + puce « À suivre » ; « n exercices · n séries ·
≈ m min » ; les noms des exercices en une phrase (deux lignes au plus, `encreTertiaire`) ;
`BoutonContour` « Lancer » (`useDemarrer().routine`, `occupe`), absent pendant une séance.
Intervalle `espace.m`, marges `espace.l`. Les quatre états restent.

### Task 4 : la page d'une routine (D122)

`routines/[id].tsx` : nom, résumé, zones principales (`zonesTravaillees`, comme l'Accueil), puis
`BoutonContour` « Lancer » sous le résumé (désactivé sans exercice, absent pendant une séance) —
**le pied fixe à l'aplat disparaît** (l'aplat de l'écran est le rond central, D105). Chaque
exercice : `Vignette` 48, nom, `resumeSeries`, repos, et « Dernière fois : \<meilleure série\> »
(`meilleureSerie` de `shared` sur `optionsPrecedents` — à exporter de `lib/requetes.ts`), chevron
→ fiche. La carte du corps reste après la liste.

### Task 5 : l'éditeur, au même style

`components/routines/carte-exercice-edition.tsx` : sa vignette passe par `Vignette` (44). Rien
d'autre ne change (D85).

### Task 6 : vérification et PR

Typage, Knip ; émulateur sombre et clair : les deux vues, une recherche, un filtre de groupe, une
fiche ouverte depuis la vue Exercices, la page d'une routine (dernière fois visible), « Lancer »
(séance abandonnée ensuite) ; règles `mobile.md` (Routines) ; PR, CI, fusion.
