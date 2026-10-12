# Retrait des pages hors MVP du mobile — conception

**Date** : 13 octobre 2026 · **Statut** : validée · **Surface** : mobile seulement (le web, l'API et
`shared` ne bougent pas).

## But

Repartir d'une base saine avant l'épreuve du jalon : le mobile ne garde que ce qui sert en salle.
On retire d'abord, puis on revoit **une par une** les pages gardées, chacune avec son propre
design.

## D178 — Le mobile se resserre sur les routines et la séance

**Retiré :**

- l'onglet **Accueil** (tableau de la semaine D166 : « À suivre », « Cette semaine », journal) et
  ses composants `components/accueil/` ;
- l'onglet **Progrès** (D173) et ses composants `components/stats/` ;
- le **détail d'une séance** (`historique/[id]`), qui ne s'ouvrait que depuis l'Accueil, le
  calendrier de Progrès et la fiche d'un exercice. **L'historique se consulte sur le web** ; son
  retour sur le mobile se décidera plus tard ;
- les requêtes devenues sans appelant : `optionsStatsPeriode`, `optionsStatsExercices`,
  `optionsSeance`, `useSupprimerSeance`.

**Gardé :** Routines (liste, page, édition, choix et réorganisation des exercices), la séance
(Démarrer, séance, fin), la fiche d'un exercice, le Profil, la connexion.

**Navigation :** la barre passe à trois places — **Routines · Démarrer · Profil** (révisé par D179). Routines est
l'écran d'arrivée : `index.tsx` devient une redirection vers `/routines`, cachée de la barre, pour
que `/` (ouverture de l'app, connexion, fin et abandon de séance) reste une adresse valide.

**Fiche d'un exercice :** sa liste « Historique » reste lisible mais n'ouvre plus rien.

**Fin de séance :** inchangée ; elle lit toujours la liste des séances pour se comparer à la
semaine et à la dernière fois. Elle sera revue avec les autres pages.

**Ce qui n'est pas touché :** les routes `/stats` et `/seances/:id` de l'API (le web s'en sert),
la persistance hors ligne du domaine `stats` (le bilan du Profil en dépend).

## D179 — Barre façon Hevy : Entraînement · Profil

Une barre de navigation porte des destinations, pas des actions (Material sépare barre de
navigation et barre d'app à bouton flottant) ; Hevy n'a pas de bouton central, son onglet Workout
porte les routines et « Start Empty Workout ». Avec deux destinations restantes, le rond central
n'avait plus de raison d'être.

- **Deux onglets : Entraînement · Profil.** Le rond central, la feuille Démarrer (D120) et
  `lancer.tsx` disparaissent.
- **L'onglet Entraînement** (route `/routines`, inchangée) porte **Démarrer en tête** : la routine
  à suivre en carte avec l'aplat « Commencer … », puis « Séance vide ». Une séance en cours
  remplace ce bloc par « Reprendre la séance ». Puis « Mes routines » et « + Nouvelle ». La puce
  « À suivre » quitte les cartes : la prochaine est déjà en tête.
- **L'appui sur un onglet** ne pâlit plus tout l'onglet (la pilule active se délavait) : une
  couche d'état, l'encre à 10 %, teinte la pilule (Material 3) ; icône et libellé restent nets.
- Le bandeau de la séance en cours (D107) reste au-dessus de la barre.

## Vérification

`/verif` (build, typecheck, test, lint, knip) — Knip confirme qu'aucun export orphelin ne reste.
