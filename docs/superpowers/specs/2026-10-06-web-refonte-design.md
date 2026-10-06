# Refonte du web — conception

**Date** : 6 octobre 2026 · **Statut** : validée (arbitrages du 6 octobre) · **Surface** : web seul.
Ni l'API, ni la base, ni `shared` ne changent.

**Source** : la séance de maquettes du 6 octobre (compagnon visuel, `.superpowers/brainstorm/`, non
versionné) : disposition, direction visuelle, Tableau de bord (v2), Séances. Cette spec consigne
les choix.

## But

Le web est resté au premier jalon (exercices, routines, séances, paramètres) pendant que le mobile
avançait jusqu'à D131 : pas de stats, pas de profil, pas de fiche avec 1RM. On repense **tout ce qui
se voit** — rôle, plan, mise en page, habillage — et on garde la plomberie qui marche. Le but est
une bonne app **vite** : chaque écran se branche sur des routes d'API qui existent déjà.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D132** | **Le web est le poste d'analyse** : on s'entraîne sur le mobile ; sur le web on **regarde** (stats, relevés comparés, progression par exercice) et on **prépare** (routines au clavier). **Pas de séance en direct sur le web**, donc pas de « Démarrer », de « Refaire » ni de séance en cours | Choix de l'utilisateur ; le grand écran sert l'analyse et l'édition, la séance existe déjà sur mobile et c'est la partie la plus chère |
| **D133** | **La forme suit le type de page** : une **barre latérale fixe** pour tout ; les pages d'analyse en **tableau de bord** pleine largeur (gabarit `PageTableau`) ; les collections en **liste / détail** redimensionnables (gabarit `PageListeDetail`, le mécanisme actuel de D69–D73 : détail dans le chemin, tailles persistées) | Choix de l'utilisateur (dispositions B et C) ; la grille sert les graphiques, la liste sert le parcours d'un élément à l'autre |
| **D134** | **Plan** : Tableau de bord · Séances · Routines · Exercices, et Profil en bas de la barre. **Le Tableau de bord est la page d'arrivée** (`/`) ; il n'y a pas d'Accueil. `/parametres` devient `/profil`. Palette `Ctrl K` conservée (pages, exercices, routines, séances) | Une page en moins ; « la dernière séance » est à un clic dans Séances, « À suivre » vit sur le mobile |
| **D135** | **Le langage du mobile, à la densité du web** : valeurs des tokens alignées sur D101 (noms CSS du web conservés ; `--ink-faint` → `#7a818a`), tokens `--cal-0..4` (D127, deux valeurs), **Archivo** par `@fontsource-variable/archivo` (axe `wdth` embarqué : la coupe condensée des chiffres héros est un `font-stretch: 72%`, sans TTF généré), `tabular-nums` pour tout chiffre. Cartes sur `--surface-2`, en-têtes de section en petites capitales `--ink-subtle`, vignette blanche d'exercice, pastille record en contour (D118) | Choix de l'utilisateur parmi quatre directions (mobile, instrument, éditorial, athlétique) ; rien à reconcevoir, les deux surfaces se ressemblent |
| **D136** | **Échelle du web** : texte 14 px, ligne 36 px, rayons 8 cellule · 10 bouton · 16 carte, marge de page 24–32 px, barre latérale 220 px. L'entrée active de la barre est `--nav-active` en gras, **jamais lime** | La densité vaut pour le web (CLAUDE.md) ; les rayons du mobile un cran plus petits |
| **D137** | **Tableau de bord** : sélecteur **Semaine · Mois · 3 mois · Année** dans l'URL (`?periode=`, défaut `mois`). Ligne 1 : tuiles séances · séries · durée comparées à la période précédente, et l'**objectif hebdomadaire** (semaines tenues, `semainesTenues` ; sans objectif, la tuile invite à le fixer dans Profil). Ligne 2 : le **calendrier** (D138). Ligne 3 : **muscles travaillés** (carte du corps face/dos + barres de séries par muscle, 7 col.) et **volume** par semaine (par mois en Année, 5 col. ; la semaine en cours en `--ink-muted`, pas en lime). Ligne 4 : **records de la période en tableau** (exercice, série, types, date) ; une ligne ouvre la fiche | D125 transposé à la grille ; le tableau profite de la largeur |
| **D138** | **Le calendrier du web montre toujours 12 mois** (53 semaines, lignes L → D), la période choisie **en clair**, le reste **atténué** ; niveaux de D126 (5, quantiles), aujourd'hui cerclé, infobulle au survol, clic → la séance (plusieurs : la première, les autres dans l'infobulle). Révise D126 **pour le web seulement** | En « Semaine », un calendrier qui suit la période ne garde qu'une colonne : sur grand écran, l'année entière est la vue que le téléphone ne peut pas offrir. Coût : une seconde requête `periode=annee` |
| **D139** | **Carte du corps web** : les tracés SVG de `react-native-body-highlighter` (MIT) recopiés dans un composant web, avec leur licence ; mêmes zones que `StatsPeriode.zones`, intensité par `--cal-1..4` (exception D84 / D127) | Même silhouette sur les deux surfaces ; la bibliothèque ne tourne pas sur le web |
| **D140** | **Séances** : à gauche, le fil groupé par mois (`GET /seances` paginé, page suivante au défilement), chaque entrée : nom, pastille de records, date · durée · volume · séries, premiers exercices ; ↑ ↓ passent d'une séance à l'autre. À droite, le **relevé comparé** (D123) : tuiles durée · volume · séries · records avec leur écart, la note, puis **une table par exercice** (Série · Charge × reps · La fois d'avant · Écart · Record) par `ecartSerie`. « Ouvrir la routine » si `routineId` ; menu « ⋯ » → **Supprimer** (confirmé, danger) | D119 et D123 à la largeur du web ; la table aligne les colonnes que le mobile empile |
| **D141** | **Exercices** : à gauche, le catalogue actuel (recherche, filtres de muscle, vignettes). À droite, la **fiche** (D124) : GIF et nom, **1RM estimé** et sa **courbe** en grand (`courbeUnRm`), records, historique en table (date, séance, séries, records), consignes | La courbe gagne la largeur ; le catalogue fonctionne déjà |
| **D142** | **Routines** : à gauche, les cartes, réordonnables par glisser (`PUT /routines/ordre`). À droite, **l'éditeur actuel**, fonctionnement inchangé (toujours modifiable, barre Annuler/Enregistrer par `empreinte`, cartes à la Hevy, `brouillon-routine.ts`), restylé selon D135 | La logique est dans `shared` et testée ; seul l'habillage change |
| **D143** | **Profil** (une colonne centrée) : bilan de toujours (`/stats/bilan`), objectif hebdomadaire et repos par défaut (`/preferences`, D129), thème (appareil, `localStorage`), unités et fuseau (affichés, fixés comme aujourd'hui), **export CSV**, déconnexion | D128–D129 ; remplace `/parametres` |
| **D144** | **Connexion** : D131 au bureau — colonne centrée, logo sur aplat lime et nom, e-mail, mot de passe, « Se connecter » | Même entrée sur les deux surfaces |

## Ce qui reste, ce qui part

**Reste** : `lib/` (client d'API, auth, config, `unites.ts`, `fuseau.ts`, thème, déconnexion), les
primitives `components/ui/`, `components/etats/` (quatre états par `?etat=`, pages 404 et erreur du
routeur), le mécanisme liste / détail et sa persistance, la palette, la logique de l'éditeur de
routine.

**Part ou se réécrit** : `tokens.css` et `globals.css` (valeurs, Archivo), `components/shell/`
(nouvelle barre, deux gabarits), toutes les routes, `features/` sauf la logique de l'éditeur,
`/parametres`.

## Données

Aucun changement d'API. Chaque écran lit des routes existantes :

| Écran | Routes |
|---|---|
| Tableau de bord | `GET /stats/periode?periode=…&fuseau=…` (période choisie) et `periode=annee` (calendrier), `GET /preferences` (objectif) |
| Séances | `GET /seances?page=…`, `GET /seances/:id`, `DELETE /seances/:id` |
| Exercices | `GET /exercices`, `GET /exercices/:slug`, `/:slug/records`, `/:slug/historique` |
| Routines | `GET`, `POST`, `PUT`, `DELETE /routines`, `PUT /routines/ordre`, `GET /seances/precedentes` |
| Profil | `GET /stats/bilan`, `GET` / `PUT /preferences`, `GET /export/seances.csv` |

Clés de cache : toute donnée de la clé de lecture est dans celle d'écriture (CLAUDE.md). La période
et le fuseau font partie de la clé des stats ; un `PUT /preferences` invalide la clé de l'objectif.

## Découpage

Une PR par lot, le web reste utilisable entre deux lots.

1. **Fondations** — tokens et Archivo (D135, D136), barre latérale et gabarits (D133, D134),
   `/profil` provisoire reprenant le contenu de `/parametres`, connexion (D144).
2. **Tableau de bord** — D137, D138, D139.
3. **Séances** — D140.
4. **Exercices** — D141.
5. **Routines** — D142.
6. **Profil** — D143, export.

## Tests

- Les tests existants restent verts ; la logique nouvelle éventuelle (placer 53 semaines, atténuer
  hors période, regrouper le fil par mois dans le fuseau) va dans une fonction pure testée par
  Vitest, dans `apps/web/src/lib/` si elle ne sert qu'au web.
- Chaque nouvel écran porte ses quatre états par `?etat=`.
- Chaque lot est vérifié à l'écran (Playwright, compte de contrôle, sombre et clair, largeurs
  1280 et 1920) avant sa PR.

## Hors périmètre

- Lancer, suivre ou refaire une séance sur le web (D132).
- La colonne « valeur battue » des records : l'API ne la fournit pas.
- Le réglage des unités et du fuseau par profil : ils restent fixés à un seul endroit (CLAUDE.md).
- Le web sur téléphone : la barre latérale fixe vise l'ordinateur, le téléphone a son app.
