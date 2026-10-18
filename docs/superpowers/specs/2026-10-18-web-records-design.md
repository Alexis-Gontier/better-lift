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

- **D282 — L'Accueil résume les autres pages** (2026-10-18, révise D277 : les variantes A, B, C
  et la ligne de tête partent). En tête, quatre tuiles — records sur 30 jours, séances et volume
  par semaine sur 4 semaines, poids moyen sur 7 jours —, chacune avec son écart à la période
  d'avant en pastille et sa mini-courbe sur 12 semaines (30 jours pour le poids) ; un clic ouvre
  la page. Puis des cartes à graphique, chacune avec « Voir … → » en pied : **Records** (barres
  par semaine sur 12 semaines, les trois derniers, le nombre à portée), **Épinglés** (1RM, courbe
  sur 3 mois, évolution sur 4 semaines), **Force** (les trois premiers épinglés chargés en % de
  leur 1RM au départ des 3 mois), **Routines** (séances par routine sur 3 mois, la dernière),
  **Corps** (poids moyen sur 90 jours, objectif en pointillés).

- **D283 — L'Accueil est vide** (2026-10-18, révise D282). Tuiles et cartes partent : elles
  doublaient Records, Progression et Corps. La page ne garde que son titre ; son contenu viendra
  quand l'usage dira ce qui y sert.

- **D284 — Records se lit en graphiques** (2026-10-18, révise D278). Records par semaine en
  barres avec le total et son écart ; par muscle, la silhouette et des barres ; « À portée » en
  jauges de 90 à 100 % du record ; « En stagnation » en barres de jours sans record ; le palmarès
  en cartes à courbe du 1RM (un point par record, la cible en pointillés), triables par record
  récent, 1RM ou muscle et filtrées par muscle ; la chronologie en nuage de points, un clic ouvre
  la séance. Le tableau et la liste groupée par semaine partent.

- **D285 — Records, Progression et Corps partent** (2026-10-18, révise D278, D279, D281, D284).
  Le groupe Analyse quitte la barre ; la punaise (D276) part avec eux, elle ne servait qu'à ces
  pages et à l'Accueil. Restent la cible d'un exercice sur sa fiche (D276) et les stats d'une
  routine dans son détail (D280), sans lien vers Progression. Les calculs de records, de
  progression et de poids sont retirés des mocks ; on les retrouvera dans l'historique git.

- **D286 — Pas d'exercice personnel** (2026-10-18, révise D240 et D264). Le catalogue suffit :
  plus de création (`/exercises/new`, « Exercice personnalisé »), ni d'onglets Catalogue | Mes
  exercices, ni de suppression. Une fiche ne modifie que sa note épinglée. À l'import Hevy, un
  exercice inconnu se rattache au catalogue ou s'ignore. Côté API, rien à prévoir : `Exercise`
  reste un catalogue commun, sans propriétaire.

- **D287 — L'Accueil est un tableau de bord** (2026-10-18, révise D283). Records, Progression
  et Corps partis, il ne double plus rien. De haut en bas : quatre cartes chiffrées — la semaine
  face à l'objectif des Paramètres (barre, semaines d'affilée), puis volume, séances et records
  des 4 dernières semaines, chacun face aux 4 d'avant (pastille fléchée) ; le **calendrier
  d'assiduité** façon GitHub sur 12 mois (Kibo *Contribution Graph*, une case par jour, lundi en
  haut, teinte par quartile du volume du jour, calé sur la fin quand il défile) ; le **volume par
  semaine** sur 16 semaines (barres) ; les **5 dernières séances** à côté des **séances par
  routine** sur 3 mois. Les calculs vivent dans `mocks/dashboard.ts`, testés. Quatre états par
  `?etat=` ; `vide` reprend l'accueil de l'Historique (import Hevy).

- **D288 — L'Accueil redevient vide** (2026-10-18, révise D287, revient à D283). Les tuiles
  (essayées en bandeau, tuiles, éditorial, puis sans graphique : sobre, avant / après, icône),
  le calendrier, les graphiques et les dernières séances partent, avec `mocks/dashboard.ts`.
  L'historique git les garde.

## 3. Barre latérale

```
Accueil
ENTRAÎNEMENT   Routines · Exercices · Historique
Paramètres
```

(Révisé par D285 : le groupe Analyse est parti.)

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

**Avancement** : les sept étapes sont faites (2026-10-18). L'Accueil, après trois variantes (D277)
puis un résumé à graphiques (D282), est vide (D283).

## 5. Vérification

- `typecheck`, `build`, Biome et Knip propres ; les calculs de `mocks/` testés (Vitest), comme
  `progress.test.ts` aujourd'hui.
- Chaque page, chaque variante et chaque état atteignable par l'URL et vérifié par une capture
  Playwright.

## 6. Hors périmètre

Branchement de l'API, mobile, style définitif, retour d'une notion de séance prévue.
