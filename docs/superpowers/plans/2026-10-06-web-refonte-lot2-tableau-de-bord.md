# Refonte du web — lot 2 : Tableau de bord — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplir `/` avec les stats par période (D137), le calendrier de 12 mois (D138) et la
carte du corps web (D139).

**Architecture :** deux lectures, `GET /stats/periode` (période choisie, et `annee` pour le
calendrier) et `GET /preferences` (objectif). Le calcul propre au web (grille de 52 semaines,
écarts, volumes par mois) est une fonction pure testée dans `features/tableau/calculs.ts` ; les
composants ne font qu'afficher. Aucun changement d'API ni de `shared`.

**Spec :** [`2026-10-06-web-refonte-design.md`](../specs/2026-10-06-web-refonte-design.md) (D137–D139).

## Global Constraints

Celles du [lot 1](2026-10-06-web-refonte-lot1-fondations.md), plus :
- Dates découpées dans `FUSEAU` (`lib/fuseau.ts`), jamais en UTC : `cleJour` de `shared`.
- Charges par `formaterCharge(kg, SYSTEME_UNITES)`.
- Le lime n'apparaît que dans le calendrier et la carte du corps (`--cal-*`, intensité) et dans les
  pastilles record (contour). Les barres de volume et de muscles sont neutres.
- Branche `feat/web-refonte-lot2`, empilée sur `feat/web-refonte` (PR #92) : rebaser sur `main`
  après la fusion de #92, puis cibler `main`.

## Fichiers (`apps/web/src/features/tableau/`)

| Fichier | Rôle |
|---|---|
| `calculs.ts` + `calculs.test.ts` | `ecart`, `dureeTexte`, `grilleAnnee`, `volumesAffiches` (purs) |
| `requetes.ts` | `optionsStatsPeriode(periode)`, `optionsPreferences()` — clés `["stats","periode",periode,FUSEAU]`, `["preferences"]` (mêmes que le mobile) |
| `corps-svg.ts` (généré, MIT) | Tracés face/dos de `react-native-body-highlighter` |
| `carte-corps.tsx` | Silhouettes face/dos, zones principales `--cal-4`, secondaires `--cal-2` |
| `selecteur-periode.tsx` | Semaine · Mois · 3 mois · Année, dans l'URL |
| `tuiles.tsx` | Séances, séries, durée + écart ; objectif hebdo (`semainesTenues`) |
| `calendrier.tsx` | 52 colonnes × 7, période en clair, reste atténué, clic → séance |
| `muscles.tsx` | Carte du corps + barres de séries par zone (6 premières) |
| `volume.tsx` | Barres par semaine (par mois en Année) |
| `records.tsx` | Tableau des records, ligne → fiche |
| `routes/_protege.index.tsx` | `?periode=` (défaut `mois`), quatre états, grille 12 colonnes |

## Tâches

- [ ] **1. Calculs (TDD).** Tests d'abord, puis l'implémentation :
  - `ecart(valeur, avant, enPourcent)` : `=` → « = avant », `avant = 0` → « rien avant »,
    sinon « ↗ +3 » / « ↘ −12 % ».
  - `dureeTexte(min)` : `45` → « 45 min », `125` → « 2 h 05 ».
  - `grilleAnnee(jours, premierLundi, debutPeriode, aujourdhui)` → `CaseCalendrier[][]`
    (52 colonnes de 7, `{ jour, niveau 0–4, seances, dansPeriode, aujourdhui, futur }`) et les
    libellés de mois (colonne où commence chaque mois). Niveaux par `niveauxCalendrier`.
  - `volumesAffiches(volumes, periode)` : par semaine, sauf `annee` → 12 sommes mensuelles
    (mois du lundi).
  - `pnpm --filter @better-lift/web test` vert ; commit.
- [ ] **2. Requêtes et carte du corps.** `requetes.ts` ; générer `corps-svg.ts` depuis
  `apps/mobile/node_modules/react-native-body-highlighter/dist/assets/body{Front,Back}.js`
  (script Node ponctuel, non versionné ; en-tête : provenance et licence MIT) ;
  `carte-corps.tsx` (viewBox `0 0 724 1448` face, `724 0 724 1448` dos). Typecheck ; commit.
- [ ] **3. Composants et page.** Les six composants et la route : tuiles (4 col.), calendrier
  (12), muscles (7) + volume (5), records (12) ; sous `lg`, tout passe en une colonne. États :
  `?etat=` forcé, chargement (squelettes), erreur (Réessayer), vide (`nbSeances === 0` : « Pas
  encore de séance. Les stats apparaissent après ta première séance sur le téléphone. »).
  Commit.
- [ ] **4. Vérifier, documenter, PR.** build, typecheck, test, lint, knip ; Playwright (compte de
  contrôle) : les quatre périodes, sombre et clair, 1280 et 1920 px, clic sur un jour et sur un
  record ; règles `interface-web.md` (Tableau de bord) ; PR empilée.
