# Web : l'application tournée vers les records

Date : 2026-10-18 · Branche : `feat/web-wireframe` (suite du wireframe,
[`2026-10-16-web-wireframe-design.md`](2026-10-16-web-wireframe-design.md))

## 1. Intention

Le web cesse d'être un tableau de bord. Ce qui compte, ce sont les **records** : ceux qu'on vient
de battre, ceux qu'on peut battre, ceux qui ne bougent plus. La routine du jour importe peu, le
planning ne sert pas : il part.

On reste dans le wireframe : données factices, quatre états par l'URL (`?etat=`), variantes par
`?v=` quand un choix reste ouvert. Le branchement de l'API vient après.

**Révise** D269 (Planning, retiré), D270 (Accueil), D267 (Progression) et D268 (Corps).

## 2. Décisions

- **D274 — Le Planning part** (2026-10-18, révise D269 et la § 4.3 du wireframe). Retirés avec lui :
  la route `/planning`, la carte « Aujourd'hui » et la bande de la semaine de l'Accueil, l'action
  *Planifier* des routines, l'entrée de la palette, les mocks de planning. Rien ne remplace la
  notion de séance prévue ; si elle revient, ce sera par une nouvelle décision.
- **D275 — Records : quatre types, tout dérivé** (2026-10-18). Les types restent ceux de
  `shared/records.ts` : charge, 1RM estimé, volume d'une série, reps (poids du corps). Trois
  notions s'y ajoutent, toutes calculées à la lecture :
  - **À portée** : un exercice fait dans les 30 derniers jours dont la dernière meilleure série,
    à **+1 rep ou +2,5 kg**, battrait le record de 1RM estimé (ou de reps sans charge). La carte
    dit la série qui suffit (« 92,5 × 6 bat ton 1RM »).
  - **En progression** : 1RM estimé en hausse sur 4 semaines, en %.
  - **En stagnation** : exercice fait au moins 3 fois sur les 6 dernières semaines, sans aucun
    record depuis 4 semaines.
  Les calculs vivent dans `mocks/` pour le wireframe et passeront dans `shared` au branchement.
- **D276 — Épingler un exercice** (2026-10-18). Une punaise sur la fiche Exercice et sur chaque
  carte de l'Accueil, huit exercices au plus. Sans épinglage, les six exercices les plus faits
  sur 90 jours en tiennent lieu : l'Accueil n'est jamais vide pour qui a des séances. Les
  **objectifs** de force deviennent la **cible** d'un exercice, visible sur sa carte épinglée et
  dans le palmarès ; l'objectif de poids reste dans Corps.
- **D277 — L'Accueil parle de records** (2026-10-18, révise D270). En tête, une ligne commune :
  records cette semaine, ce mois, et la série de semaines avec au moins un record. Puis trois
  variantes à comparer à l'écran :
  - **A — Épinglés d'abord** : une grille de cartes, une par exercice épinglé — meilleur 1RM
    estimé, mini-courbe sur 3 mois, dernière fois (« 92,5 × 5 il y a 3 j »), cible ou série à
    portée ; une colonne étroite des derniers records à droite.
  - **B — Fil des records** : les dernières séances, chacune résumée par ses records (une séance
    sans record tient sur une ligne grise) ; les épinglés en compact à droite.
  - **C — À battre** : trois listes, À portée, En progression, En stagnation ; les épinglés en
    tête de chacune.
  Quittent l'Accueil : la séance du jour, les chiffres de la semaine, les dernières séances
  génériques, le poids et les objectifs.
- **D278 — Une page Records** (2026-10-18). `/records`, un seul défilement, la période de
  Progression (4 sem., 3 mois, 6 mois, 1 an) plus « tout » :
  - **bandeau** : records sur la période face à la période précédente, exercices avec au moins
    un record, jours depuis le dernier ;
  - **À portée** et **En stagnation**, en listes complètes ;
  - **palmarès** : une ligne par exercice — meilleur 1RM estimé, meilleure charge, meilleur
    volume d'une série, cible, date du dernier record ; filtre par muscle, tri par colonne ;
    la ligne ouvre la fiche ;
  - **chronologie** : tous les records, groupés par semaine ; chacun ouvre sa séance.
  Le panneau « Tous les records » de Progression disparaît.
- **D279 — Progression : vue d'ensemble ou une routine** (2026-10-18, révise D267). En tête,
  **Vue d'ensemble | Par routine**. L'analyse d'**un exercice** reste dans sa fiche : Progression
  ne la double pas.
  - *Vue d'ensemble* : D267 moins les records — bandeau (séances et volume par semaine, durée
    moyenne), force (les six exercices les plus faits), séries par muscle face à la bande 10–20,
    régularité.
  - *Par routine* (`?routine=`, la plus faite par défaut) : fréquence (nombre de séances,
    intervalle moyen) ; volume, durée et records par séance, en courbe et en tableau ; taux de
    réalisation (séries faites / prévues) ; par exercice de la routine, la meilleure série de
    chaque séance et son évolution en %, pour voir lequel tire la routine et lequel stagne.
- **D280 — Les stats d'une routine dans son détail** (2026-10-18). Un bloc **Stats** compact
  dans le panneau de détail des Routines : dernière fois, séances sur 3 mois, tendance du volume,
  records battus dans cette routine, et « Analyser dans Progression » vers `?routine=`.
- **D281 — Corps, c'est le poids** (2026-10-18, révise D268). Restent le bandeau, la courbe,
  l'objectif et le journal des pesées. Les **mensurations** partent du wireframe. S'ajoute la
  **force relative** des exercices épinglés au poids moyen sur 7 jours (« Développé couché
  1,15 × PDC »), avec son évolution sur la période.

## 3. Barre latérale

```
Accueil
ENTRAÎNEMENT   Routines · Exercices · Historique
ANALYSE        Records · Progression · Corps
Paramètres
```

Records prend l'icône `Trophy`. La palette perd « Planifier » et gagne « Aller à Records ».

## 4. Ordre de construction

Un commit et une capture par étape, chacune validée à l'écran avant la suivante :

1. **Retrait du planning** (D274) : route, nav, palette, cartes de l'Accueil, action des
   routines, mocks. L'Accueil garde provisoirement le reste.
2. **Calculs de records** (D275, D276) : à portée, progression, stagnation, épinglés par défaut,
   dans `mocks/`, avec leurs tests.
3. **Page Records** (D278), quatre états.
4. **Accueil** (D277) : la ligne de tête, puis les variantes A, B, C ; la punaise sur la fiche
   Exercice.
5. **Progression** (D279) : retrait des records, sélecteur, vue Par routine.
6. **Détail de routine** (D280).
7. **Corps** (D281).

**Avancement** : les sept étapes sont faites (2026-10-18). Reste ouvert le choix d'une variante
de l'Accueil (A, B ou C).

## 5. Vérification

- `typecheck`, `build`, Biome et Knip propres ; les calculs de `mocks/` testés (Vitest), comme
  `progress.test.ts` aujourd'hui.
- Chaque page, chaque variante et chaque état atteignable par l'URL et vérifié par une capture
  Playwright.

## 6. Hors périmètre

Branchement de l'API, mobile, style définitif, retour d'une notion de séance prévue.
