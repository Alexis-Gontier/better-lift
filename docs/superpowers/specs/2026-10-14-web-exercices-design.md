# Web : la page Exercices, découvrir et analyser

Le 14 octobre 2026, sur `feat/web-refonte`. Première des trois pages repensées (Exercices, puis
Routines et Séances). Le web sert à préparer les routines, analyser la progression, relire et
corriger les séances, et découvrir des exercices ; cette page porte les deux derniers usages pour
un exercice : **découvrir** et **analyser**.

Maquettes validées : grille filtrée (A), fiche en page entière avec variantes (C), analyse de la
fiche. Les choix laissés ouverts ont été tranchés par l'agent à la demande de l'utilisateur.

## Ce que disent les données

1 316 exercices, **tous avec image**. 19 muscles ciblés, plus parlants que les 10 groupes (« Bras »
mêle biceps et triceps). Une trentaine d'équipements, dont **8 couvrent 95 %** du catalogue :
poids du corps, haltères, poulie, barre, machine à levier, élastique, Smith machine, kettlebell.
Environ 2 muscles secondaires et 6 étapes de consignes par exercice.

## D200 — La liste est une grille de cartes filtrées

Révise D141 (liste et fiche côte à côte) pour les exercices.

- `/exercises` est une **grille** de cartes : image fixe (JPG, comme aujourd'hui), nom, muscle
  ciblé · équipement, et une pastille en contour « ×9 » si l'exercice a été pratiqué.
- **Filtres en pastilles**, dans l'URL : `?q=` (texte), `?target=` (un muscle ciblé parmi 19 ;
  les 8 plus fournis visibles, les autres derrière « + 11 »), `?equipment=` (un des 8 principaux,
  les autres derrière « Autres »), `?mine=1` (« Mes exercices »). Une pastille active est l'aplat
  orange ; « Tous » efface le filtre.
- **Tri** : par nom par défaut ; avec « Mes exercices », par dernière fois ou par nombre de
  séances (`?sort=recent|count`).
- Défilement infini sur la pagination existante. **Quatre états** : chargement (cartes
  squelettes), erreur, vide (« Aucun exercice ne correspond », avec « Effacer les filtres »),
  nominal.
- Un clic sur une carte ouvre la fiche. La grille n'est plus un panneau : `ListDetailPage` n'est
  plus utilisé ici.

## D201 — La fiche est une page entière (révisée par D206)

`/exercises/$slug` devient une page à part (plus une route enfant rendue à côté de la liste), avec
un lien « ← Exercices » qui garde les filtres (`search`). De haut en bas :

1. **En-tête** : GIF, nom (`h1`), muscle ciblé en pastille contour, muscles secondaires en
   pastilles teintées, équipement — jamais l'orange, réservé à l'action et au record ; une ligne « 9 séances · dernière le 7 octobre » si l'exercice a été
   pratiqué.
2. **Analyse** (D202, D203) — seulement si l'exercice a été pratiqué ; sinon une carte « Pas
   encore pratiqué » à la place.
3. **Consignes** : les étapes numérotées.
4. **Variantes** (D204).

## D202 — L'analyse : quatre graphes et une période

- Onglets : **Charge max** (la plus lourde série de travail de chaque séance), **1RM estimé**
  (le meilleur de la séance, Epley), **Volume** (Σ charge × reps), **Reps** (Σ reps). Les
  échauffements sont exclus partout ; seules les séries faites comptent.
- **Période** : 1 M, 3 M (défaut), 6 M, 1 an, Tout, dans l'URL (`?period=`). Le découpage se fait
  dans le fuseau du profil.
- Au-dessus du graphe : la dernière valeur et son écart sur la période, en contour orange s'il
  monte. Le dernier point est en orange s'il est un record.
- **Sur la période** : séances, séries de travail, reps, volume total, volume moyen par séance.
- Un exercice au poids du corps (charges nulles) n'a ni Charge max ni 1RM : ces onglets
  disparaissent, Reps devient l'onglet par défaut.

## D203 — Les meilleures séries par reps, depuis toujours

- Lignes fixes **1, 3, 5, 6, 8, 10, 12 reps**. « Réalisé » : la meilleure charge d'une série de
  travail faite à **ce nombre exact** de reps, sa date, et le badge record. « Estimé » : la charge
  que le meilleur 1RM laisse viser à ce nombre de reps (Epley inversé), en encre secondaire.
- Le tableau **ignore la période** : ce sont des records, ils valent depuis toujours (dérivés à la
  lecture, jamais stockés, comme tous les records).
- Une série faite à un nombre de reps hors de la liste (7, 9, 15…) ne crée pas de ligne : elle
  compte dans le 1RM estimé.

## D204 — Les variantes : même muscle, autre équipement

Sous la fiche, une rangée d'au plus 8 cartes : même muscle ciblé, **un exercice par équipement
différent**, l'exercice ouvert exclu, les équipements principaux d'abord. Calculé par l'API
(public, comme le catalogue).

## D205 — Ce qui change côté API et `shared`

- `requeteCatalogue` gagne `cible` (un muscle ciblé) et `slugs` (liste, au plus 200, pour « Mes
  exercices »). `equipement` existe déjà.
- **`GET /exercices/pratiques`** (sous `exigerSession`) : par exercice pratiqué, `slug`,
  `nbSeances`, `derniere` (date). Sert la pastille « ×9 », le filtre et les tris de « Mes
  exercices ». Quelques dizaines de lignes : le client les garde en cache (`["exercises",
  "practiced"]`), invalidé avec `["sessions"]`.
- **`GET /exercices/:slug/variantes`** (public) : au plus 8 `ExerciceResume`.
- Les graphes, la période, le résumé et les meilleures séries se calculent **dans `shared`**
  (`analyse-exercice.ts`, testé) à partir de l'historique existant (`/exercices/:slug/historique`,
  qui renvoie déjà toutes les séries de toutes les séances). Pas de nouvelle route pour l'analyse ;
  le mobile pourra reprendre le même calcul.

## D206 — La grille et la fiche côte à côte, la liste redimensionnable

Révise D201 (fiche en page entière), à la demande de l'utilisateur.

- Sans exercice ouvert, la grille prend toute la largeur (D200 inchangé).
- Une fiche ouverte (`/exercises/$slug`, route ENFANT de la grille) repousse la grille dans un
  **panneau de gauche redimensionnable** à la poignée (`ListDetailPage`, disposition `catalog` :
  36 % / 64 %, liste entre 20 et 60 %, taille retenue). La fiche s'affiche à droite, avec une
  croix qui la ferme en gardant les filtres.
- Dans le panneau étroit, les deux rangées de pastilles deviennent deux menus déroulants
  (Muscle, Équipement) ; la grille passe à une, deux ou trois colonnes selon la largeur.
- La carte ouverte est enfoncée dans son ombre sur une surface en retrait (sélection, jamais
  l'orange de l'action, D160).

## D207 — Plus de mention Gym visual sur le web

Révise D46 pour le web, à la demande explicite de l'utilisateur (14 octobre 2026). La mention
« © Gym visual — https://gymvisual.com/ » ne s'affiche plus sous les animations de la fiche.
**C'est contraire à la permission de Gym visual**, qui exige une attribution visible (voir
`packages/db/catalogue/LICENSE-dataset.md`) : choix assumé pour une application privée à trois
comptes, à reprendre en premier si elle s'ouvrait. Le mobile garde la mention.

## Hors champ

La progression multi-exercices, la carte du corps, la création d'exercices personnels.
Routines et Séances viennent après, chacune avec sa conception.

## Vérification

Tests de `shared/analyse-exercice.ts` (période dans le fuseau, échauffements exclus, poids du
corps, reps hors liste, Epley inversé), tests des deux routes (session, 404, filtres). `/verif`,
puis capture de chaque état de la grille et de la fiche (pratiqué, jamais pratiqué, poids du
corps), connecté.
