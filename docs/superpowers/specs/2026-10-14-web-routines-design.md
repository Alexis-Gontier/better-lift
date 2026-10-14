# Web — la page Routines : préparer et analyser

Date : 14 octobre 2026. Branche `feat/web-refonte`. Suit la page Exercices
(`2026-10-14-web-exercices-design.md`, D200–D211).

## Le but

Sur le web, poste d'analyse (D132), une routine se **prépare** (exercices, séries, repos,
supersets) et se **juge** : combien de fois on l'a faite, et où en est chaque exercice. Le
téléphone l'exécute. Choix de l'utilisateur : l'édition reste sur la page, toujours ouverte, et
l'analyse s'y intègre. Le design est assumé provisoire : l'analyse vit dans des composants à part,
qu'on peut déplacer ou retirer sans toucher l'éditeur.

## D212 — La routine ouverte : toujours modifiable, actions rebranchées

Prolonge D81. L'éditeur reste modifiable sans mode lecture. Ses actions, perdues avec l'en-tête
commun (layout remis à zéro), reviennent **dans son propre en-tête**, à côté du nom :

- **Annuler / Enregistrer**, visibles seulement quand la copie diffère de la version enregistrée
  (`empreinte`). Enregistrer est le seul aplat orange de l'écran ; désactivé tant que le
  brouillon n'est pas valide (`brouillonValide`) ou pendant l'envoi. Une routine neuve montre
  toujours Enregistrer (désactivé si invalide) et Annuler, qui la ferme.
- **Menu ⋯ → Supprimer la routine**, en rouge, avec la confirmation existante
  (`ConfirmDelete`). Absent pour une routine neuve.

## D213 — Le résumé de la routine (retiré)

**Retiré le 14 octobre 2026** à la demande de l'utilisateur, après essai : la page revient à
l'éditeur seul. Gardé ici pour mémoire.


En tête, sous le nom, quatre tuiles jointives : **Séances** (faites avec la routine),
**Dernière** (date), **Durée moyenne**, **Volume moyen** (charge × reps des séries de travail
faites, échauffements exclus). Une routine jamais faite montre une ligne « Pas encore faite :
le résumé apparaîtra après ta première séance avec elle », sans tuiles vides. Une routine neuve
n'a pas de résumé.

Données : une route nouvelle, `GET /routines/:id/bilan` (derrière `exigerSession`, 404 sur la
routine d'autrui), qui lit les séances dont `routineId` est la routine. Le calcul est pur, dans
`shared/bilan-routine.ts` (`bilanRoutine`), et testé. Côté web, clé
`["sessions","routine-summary",id]` : sous `["sessions"]`, supprimer une séance l'invalide.

La liste de gauche affiche « dernière le 7 oct. » sous chaque routine faite : `RoutineResume`
gagne `derniere` (date ISO ou `null`), lu par `GET /routines`. Le mobile l'ignore.

## D214 — L'analyse sur chaque carte d'exercice (retirée)

**Retirée le 14 octobre 2026** avec D213 ; la « dernière fois » revient sous le nom.


Sous l'en-tête de chaque carte de l'éditeur, une bande d'analyse (`ExerciseTrend`), qui mène à
la fiche de l'exercice (`/exercises/$slug`) :

- **La dernière perf** : la meilleure série de la dernière séance (`meilleureSerie`, déjà lue par
  `previousOptions`), suivie de la **tendance** ↗ → ↘ (`tendance` de `shared`, testée : la
  dernière valeur face à celle d'il y a jusqu'à 4 séances).
- **Une mini-courbe** des 8 dernières séances : charge max, ou reps au poids du corps
  (`pointsExercice` et `avecCharge` de `shared/analyse-exercice.ts`). Trait d'encre, dernier point
  orange s'il est un record (D28 : le record a l'orange en contour ou en point, jamais l'action).
  SVG simple, sans axes : la fiche porte la courbe complète.
- La courbe suit **toutes** les séances de l'exercice, pas seulement celles de la routine : c'est
  sa progression réelle, et le même chiffre que sur sa fiche. Données : `historyOptions(slug)`,
  la requête de la fiche Exercices, partagée en cache.
- Jamais pratiqué : « Pas encore fait ». Historique en échec : la bande se tait (la carte reste
  éditable).

La « dernière fois » quitte la ligne grise sous le nom : elle vit dans la bande.

## Les quatre états

Liste et routine : vide, chargement, erreur, nominal, atteignables par `?state=`. Le résumé a
les siens (squelette, erreur discrète, « pas encore faite »).

## Étapes

1. `shared` : `bilanRoutine`, `tendance` (tests d'abord).
2. API : `derniere` dans `lister`, `bilan` au dépôt, route `GET /routines/:id/bilan` (tests de
   route : 200, 404).
3. Web : `routineSummaryOptions`, `RoutineSummary`, `ExerciseTrend`, en-tête de l'éditeur
   (D212), date dans la liste.
4. Vérification : `/verif`, captures Playwright (routine faite, jamais faite, neuve, modifiée).

## D216 — Les routines en cartes (14 octobre 2026)

Un premier resserrement (D215 : liste en lignes avec aperçu, cartes d'exercice serrées,
sélecteur aligné sur Exercices) a été essayé puis annulé à la demande de l'utilisateur, qui a
voulu revenir à l'état d'avant et passer les routines en **cartes**.

- **Comme la grille des exercices (D206)** : sans routine ouverte, les cartes prennent toute la
  largeur, sans panneau de droite ; une routine ouverte (ou neuve) les repousse dans le panneau
  de gauche (disposition `column`, 30 % par défaut) et s'édite à droite. Une croix ferme la
  routine, masquée tant qu'une modification attend (Annuler est là pour ça).
- **Une carte simple** : le nom et « N exercices · N séries », rien d'autre (l'aperçu des
  exercices a été essayé puis retiré). Toute la carte ouvre la routine ; elle s'enfonce au survol
  et reste enfoncée sur `bg-muted` une fois ouverte (D160). Une poignée en haut à droite la
  réordonne (souris, ou clavier : Espace, flèches, Espace), masquée pendant une recherche ;
  l'ordre est celui du mobile (D142). En glissant, la carte double son ombre (D193).
- « Nouvelle routine » est une carte en pointillés à la suite des autres.

## D217 — La carte d'exercice de l'éditeur

- **En-tête** : la vignette dans le cadre de la grille des exercices (bordure de 2 px) ; le nom
  est un lien vers la fiche de l'exercice ; dessous, le **muscle ciblé** et l'équipement (comme la
  page Exercices, plus le groupe). La « dernière fois » a été retirée de la carte (et sa requête
  avec). Le menu ⋯ est un bouton `outline` carré, de la hauteur du bouton Repos. Un filet de 2 px
  sépare l'en-tête de la table.
- **Table des séries** : colonnes serrées (rang, type, kg, reps, retrait), kg et reps juste après
  le type ; ligne d'en-tête sur `bg-muted/40`, séries séparées par un filet léger.
- **Poignée** : la bande de gauche garde toute la hauteur, avec un filet de 2 px et un fond en
  retrait.
