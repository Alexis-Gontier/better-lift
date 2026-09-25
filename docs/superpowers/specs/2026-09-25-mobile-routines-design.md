# Routines sur mobile, indépendantes du web — conception

**Date** : 25 septembre 2026 · **Statut** : validée · **Surface** : mobile (Expo Go), API, `shared`.

## But

Le mobile doit se suffire pour les routines : les consulter comme sur opengym — carte des
muscles d'abord — et les créer, modifier, supprimer sans passer par le web. La création de
compte reste sur le web (hors périmètre).

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D82** | **Le mobile crée, modifie et supprime les routines** — D49 est levée. Écran d'édition plein écran à la Hevy, séparé de la page de lecture | L'application mobile doit être indépendante du web (demande de l'utilisateur) ; en salle, on ajuste une routine sans ordinateur |
| **D83** | **Carte des muscles en tête de la page d'une routine** : face et dos, `react-native-body-highlighter` (MIT, pur `react-native-svg`, compatible Expo Go), pastilles en français dessous | La capture d'opengym « What this session hits » ; les données existent déjà (`target`, `secondary`) |
| **D84** | **Les muscles se peignent en vert** (révisée le 25/09 à la demande de l'utilisateur, d'abord prévue à l'encre) : principal `accent` plein, secondaire `accentAttenue` (lime à 45 %), corps `surface3` ; les pastilles restent à l'encre | Comme la capture d'opengym. Troisième usage borné du lime, sur le seul dessin du corps : ni bouton ni texte, il ne se confond ni avec l'aplat d'action ni avec le contour de record |
| **D85** | **La copie de travail de l'éditeur passe dans `shared`** (`brouillon-routine.ts`), le système d'unités en paramètre | Web et mobile saisissent la même routine avec les mêmes règles (texte tapé, conversion à l'enregistrement) ; une seule version testée |

## Données

`ExerciceRoutine` (shared) gagne trois champs, lus dans la même requête Prisma que le nom :

```ts
image: string | null;          // imageDe(gifUrl), comme le catalogue
musclePrincipal: string;       // Exercise.target (français)
musclesSecondaires: string[];  // Exercise.secondary (français)
```

Le web les ignore. Aucune migration.

## Carte des muscles — `shared/muscles.ts`

- `ZONES` : les zones du dessin retenues (`chest`, `deltoids`, `biceps`, `triceps`, `forearm`,
  `abs`, `obliques`, `trapezius`, `upper-back`, `lower-back`, `gluteal`, `quadriceps`,
  `hamstring`, `adductors`, `calves`, `tibialis`, `neck`), chacune avec son libellé français.
- `ZONE_DU_MUSCLE : Record<string, Zone>` : les ~40 noms français du catalogue vers une zone
  (« Haut des pectoraux » → `chest`, « Grand dorsal » / « Rhomboïdes » → `upper-back`,
  « Érecteurs du rachis » → `lower-back`, « Gainage » → `abs`…). Un nom sans zone (« Système
  cardiovasculaire ») est ignoré, jamais une erreur.
- `zonesTravaillees(exercices) → { zone, niveau: "principal" | "secondaire" }[]` : le principal
  l'emporte ; ordre stable (principales d'abord, puis par fréquence).
- Testé : chaque nom présent dans le catalogue a une zone ou est explicitement ignoré (la liste
  des noms vient d'une requête sur `betterlift`, figée dans le test).

## Écrans mobile

```
app/
  (onglets)/routines/
    index.tsx        + bouton « Nouvelle routine »
    [id].tsx         lecture : en-tête ✎, résumé, carte des muscles, exercices, Démarrer fixe
  routine-edition.tsx  plein écran, hors onglets : ?id= pour modifier, sans id pour créer
  choisir-exercices.tsx  modale : recherche, filtre par groupe, multi-sélection
components/routines/
  carte-muscles.tsx, carte-exercice-edition.tsx, ligne-serie-edition.tsx
```

- **Lecture** : résumé « N exercices · N séries · ~X min » (durée estimée : 40 s par série +
  repos de chaque série sauf la dernière), carte d'exercice avec vignette (`expo-image`) et
  « 3 × 8 · 60 kg » (séries normales ; échauffements comptés à part).
- **Édition** : Annuler · titre · Enregistrer en en-tête ; nom ; cartes d'exercice (repos,
  séries type/kg/reps saisies sur place, « Ajouter une série », ⋯ retirer / remplacer) ;
  réordonner par appui long (`react-native-draggable-flatlist`, versions par `npx expo install`,
  avec `react-native-reanimated` et `react-native-gesture-handler` s'ils manquent) ;
  « Ajouter des exercices » ouvre la modale ; ⋯ d'en-tête : supprimer la routine (confirmation).
  Quitter avec des changements (`empreinte` différente) demande confirmation.
- **Enregistrer** : `POST /routines` ou `PUT /routines/:id` existants ; invalide `["routines"]` ;
  une création remplace l'écran par la page de la routine.
- **États** : chargement, erreur, vide (routine sans exercice : invite à en ajouter), nominal.

## Hors périmètre

Création de compte sur mobile ; carte des muscles sur le web ; lecture « fatigue / force »
d'opengym ; exercices personnalisés.

## Vérification

Tests `shared` (muscles, brouillon) ; typecheck, lint, knip ; parcours à l'émulateur : lire une
routine, la modifier (série, repos, ordre, ajout, retrait), en créer une, en supprimer une ;
l'éditeur web inchangé (capture Playwright).
