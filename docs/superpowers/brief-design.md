# Brief de design — redesign web et mobile

Document de chantier (2026-11-01), étape 2 de `methodologie-redesign.md`. Il fixe le problème,
pas la solution : aucune couleur ni police ici, elles viennent à l'étape 4.

## Qui, où, pour quoi faire

Deux ou trois comptes, des pratiquants réguliers qui connaissent leurs charges. Mode **Operate**
sur les deux surfaces : on vient accomplir une tâche, l'expression se loge dans la précision des
détails, pas dans la décoration.

| Surface | Situation | La seule chose à réussir |
|---|---|---|
| **Mobile** | En salle, debout, entre deux séries, une main, parfois en sueur, lumière variable, réseau incertain | Lire la série à faire et la valider en un geste, sans réfléchir |
| **Web** | Au bureau, grand écran, clavier, à tête reposée | Voir où l'on en est (Accueil) et préparer la suite (routines) |

## Ce qui est vrai ici et nulle part ailleurs

- **Les chiffres sont le contenu** : charge, répétitions, 1RM, volume. « 82,5 kg × 6 » doit se
  lire d'un coup d'œil, à 60 cm, essoufflé. La typographie des chiffres est la décision la plus
  importante du redesign.
- **Le record est le seul moment d'émotion de l'app.** Aujourd'hui il est traité comme une ligne
  de tableau : c'est le défaut relevé par l'utilisateur (« trop plat »). Il doit avoir une
  hiérarchie (un record héros, puis les autres) et un langage visuel propre : le **contour** (D28).
- Pas de public, pas d'onboarding marketing, pas de gamification : le plaisir vient de la
  progression réelle, rendue lisible.

## Direction

- **Redesign, pas retouche** : la structure, les fonctions et les textes restent ; l'apparence
  actuelle (wireframe gris, « gabarit shadcn ») est une preuve de ce qui marche, pas un style à
  polir.
- **Trois pistes à montrer côte à côte**, sans trancher avant de les voir :
  1. **Instrument sobre** — outil de précision, neutre, dense, chiffres en vedette, un seul accent.
  2. **Affiche de salle** — typo condensée en capitales pour titres et chiffres, accent franc
     (héritière d'« Underground orange », D161–D163).
  3. **Carnet d'athlète** — éditorial et chaleureux, encre et papier, un journal d'entraînement.
- **Thème clair dessiné en premier** ; le sombre suit par les mêmes tokens et sera vérifié
  avant toute livraison.

## Écrans témoins (étape 4)

Chaque piste se juge sur les trois mêmes écrans, avec du contenu réel :

1. **Mobile · séance en cours** — le cas le plus dur : densité, chiffres, validation, repos.
2. **Mobile · page d'exercice, bloc Records** — le défaut signalé ; le record héros s'y joue.
3. **Web · Accueil** — priorité web : statistiques, tendance, silhouette, dernières séances,
   records récents.

## Périmètre

- **Web** : l'apparence d'ensemble (coquille, barre latérale, cartes, tableaux) et l'Accueil en
  priorité ; la page Records refaite avec le même parti que le mobile.
- **Mobile** : direction artistique sur tous les écrans ; les records recomposés ; le reste ne
  bouge que si la direction l'exige.
- **Hors de ce brief** : nouvelles fonctionnalités (elles passent par le carnet des pistes,
  étape 3), toute la logique et les données.

## États et contenus réels

- Noms d'exercice longs (« Développé couché incliné aux haltères »), charges décimales
  (« 82,5 kg »), jusqu'à 12 séries par exercice, 7 exercices par routine.
- Records : de zéro (exercice jamais fait) à une dizaine par exercice ; un record battu
  aujourd'hui doit se distinguer d'un record ancien.
- Les quatre états de chaque écran : vide, chargement (squelette à la forme de l'écran),
  erreur, nominal.

## Contraintes non négociables

- Action en **aplat**, record en **contour**, une seule couleur pour les deux (D28) ; le danger a
  la sienne et ne porte rien d'autre (D36). Types de série W ambre, F rose, D bleu.
- Un token par rôle, deux valeurs (clair / sombre), jamais de couleur en dur ; la direction doit
  tenir **dans les tokens** de `apps/mobile/global.css` et `apps/web/src/styles/globals.css`.
- Mobile : cible de 48 minimum, taille de texte du système suivie (sauf éléments denses de la
  séance), Reusables + Uniwind. Web : shadcn (Nova), tout composant externe validé avant (D228).
- Contraste AA dans les deux thèmes. Animations coupées sous `prefers-reduced-motion`.
- Tout en français, typographie française (espace fine insécable dans « 25 kg × 15 »).

## Anti-références

Dégradés violets ou néon, verre dépoli, cartes dans des cartes, ombres partout, crème +
terracotta par défaut, icônes et illustrations décoratives, emojis, confettis, badges et
trophées de jeu vidéo, look « app de fitness » générique (photos d'athlètes, noir + vert
fluo). Et à l'inverse : ne pas rester un gabarit shadcn gris avec une couleur posée dessus.

## Décisions laissées ouvertes

- Le choix de la piste (étape 4), la police des chiffres, la place de la couleur au-delà de
  l'action et du record.
- Si le sombre reste le thème par défaut du web une fois le clair dessiné.
