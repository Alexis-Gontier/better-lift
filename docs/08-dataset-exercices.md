# 08 — Dataset d'exercices

Source : [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset)

## Contenu

1 324 exercices, chacun avec catégorie, partie du corps, équipement, muscle cible, muscles secondaires, une vignette 180×180, un GIF d'animation, et des instructions pas à pas en 10 langues — dont le **français et l'anglais**, exactement ce dont on a besoin.

Répartition par partie du corps : bras (292), cuisses (227), dos (203), abdominaux/taille (169), pectoraux (163), épaules (143), mollets (59), avant-bras (37), cardio (29), cou (2).

Par équipement : poids du corps (325), haltères (294), poulie (157), barre (154), machine (81), élastique (54), Smith (48), kettlebell (41), et divers.

Environ un quart des exercices ne demandent aucun matériel.

## ⚠️ Licence — point de vigilance

**Le code, la structure et les textes d'instructions sont sous licence MIT. Les médias (images et GIF) sont © [Gym visual](https://gymvisual.com/)**, redistribués dans ce dépôt avec autorisation, en 180×180.

Conséquences concrètes :

1. La mention `© Gym visual — https://gymvisual.com/` doit rester attachée à chaque exercice et **être affichée** partout où le média apparaît (fiche exercice, sélecteur, séance).
2. La réutilisation des médias est régie par les conditions de Gym visual. **Pour un usage commercial, il faut acquérir sa propre licence auprès d'eux.**

   **Décision retenue (D17) :** l'application étant gratuite et sans monétisation prévue, on conserve les médias avec leur attribution. Ce point **redevient bloquant le jour où une monétisation est envisagée**. À faire malgré tout maintenant : lire les conditions de Gym visual pour vérifier que « gratuit » leur suffit — une demi-heure de lecture contre un risque non chiffré.
3. Le champ `attribution` est stocké en base et exposé par l'API précisément pour rendre cette obligation impossible à contourner par oubli.

**Plan de repli** si la licence ne convient pas : conserver les métadonnées (MIT, aucun problème) et remplacer les médias par des illustrations propres, ou n'afficher aucun visuel. Le modèle de données le permet — `thumbnailUrl` et `animationUrl` sont nullables. Autant vérifier ce point tôt : c'est le seul risque juridique du projet.

## Schéma source

```jsonc
{
  "id": "0001",
  "name": "3/4 sit-up",
  "category": "waist",
  "body_part": "waist",
  "equipment": "body weight",
  "target": "abs",
  "muscle_group": "hip flexors",
  "secondary_muscles": ["hip flexors", "lower back"],
  "instructions": { "en": "…", "fr": "…", /* 8 autres langues */ },
  "instruction_steps": { "en": ["…"], "fr": ["…"] },
  "media_id": "2gPfomN",
  "image": "images/0001-2gPfomN.jpg",
  "gif_url": "videos/0001-2gPfomN.gif",
  "attribution": "© Gym visual — https://gymvisual.com/",
  "created_at": "2026-03-18T12:31:32.854798+00:00"
}
```

## Mapping vers le modèle

| Source | Cible | Transformation |
|---|---|---|
| `id` | `Exercise.externalId` | tel quel, sert de clé d'idempotence du seed |
| `name` | `Exercise.name` + `ExerciseTranslation[en].name` | capitalisation propre (le dataset est en minuscules) |
| `body_part` | `Exercise.bodyPart` | table de correspondance vers l'énumération |
| `equipment` | `Exercise.equipment` | normalisé en `snake_case` |
| `target` | `Exercise.target` | tel quel |
| `secondary_muscles` | `Exercise.secondaryMuscles` | dédoublonné, `target` retiré s'il s'y trouve |
| `instruction_steps.{fr,en}` | `ExerciseTranslation.instructions` | seules `fr` et `en` importées |
| `image` / `gif_url` | `thumbnailUrl` / `animationUrl` | préfixés par `MEDIA_BASE_URL` |
| `attribution` | `Exercise.attribution` | tel quel, obligatoire |
| — | `Exercise.slug` | slugifié depuis le nom anglais, unicité garantie par suffixe |
| — | `Exercise.type` | **déduit — voir ci-dessous** |

### Correspondance des parties du corps

```ts
const BODY_PART_MAP = {
  "chest": "CHEST",
  "back": "BACK",
  "shoulders": "SHOULDERS",
  "upper arms": "UPPER_ARMS",
  "lower arms": "LOWER_ARMS",
  "upper legs": "UPPER_LEGS",
  "lower legs": "LOWER_LEGS",
  "waist": "WAIST",
  "cardio": "CARDIO",
  "neck": "NECK",
} as const;
```

Le script doit **échouer bruyamment** sur une valeur inconnue plutôt que de la ranger dans un fourre-tout : un ajout amont passerait sinon inaperçu.

### Déduction de `ExerciseType`

C'est la seule information réellement manquante du dataset, et elle conditionne toute la saisie. Heuristique de départ :

```ts
function inferType(ex: SourceExercise): ExerciseType {
  const name = ex.name.toLowerCase();
  const eq = ex.equipment.toLowerCase();

  if (ex.body_part === "cardio")                     return "DISTANCE_DURATION";
  if (/plank|hold|hang|wall sit|isometric/.test(name)) return "DURATION";
  if (/assisted/.test(name))                          return "ASSISTED_BODYWEIGHT";
  if (eq === "body weight")                           return "BODYWEIGHT_REPS";
  if (eq === "weighted")                              return "WEIGHTED_BODYWEIGHT";
  return "WEIGHT_REPS";
}
```

Cette heuristique se trompera sur quelques dizaines de cas. Le correctif : un fichier `packages/db/seed/type-overrides.json` (`{ "0043": "WEIGHT_REPS" }`) appliqué après la déduction, et alimenté au fil des signalements. Bien plus simple à maintenir qu'une heuristique qu'on complexifie indéfiniment.

## Hébergement des médias

Ne **pas** servir les fichiers depuis GitHub en production (pas de garantie de disponibilité, ni de CDN, et c'est un usage abusif du dépôt).

1. Copier `images/` et `videos/` vers un bucket S3-compatible (Cloudflare R2 ou Scaleway pour la région UE).
2. Servir via CDN, cache long (les fichiers sont immuables, nommés par `media_id`).
3. `MEDIA_BASE_URL` en variable d'environnement, pour pouvoir basculer sans migration.

Les GIF ne sont que du 180×180 : légers, mais 1 324 × 2 fichiers. Précharger uniquement les vignettes côté mobile, charger le GIF à l'ouverture de la fiche.

## Script de seed

`packages/db/seed/exercises.ts` :

```
1. Charger data/exercises.json (vendorisé dans le repo, version figée)
2. Valider chaque enregistrement avec le schéma Zod (échec = arrêt)
3. Pour chaque exercice :
   - upsert sur externalId
   - upsert des traductions fr et en
4. Appliquer type-overrides.json
5. Signaler : créés / mis à jour / inchangés / rejetés
```

**Idempotent** : rejouable sans effet de bord, ce qui permet de le lancer en CI et à chaque déploiement.

**Vendoriser le JSON** dans le dépôt (`packages/db/seed/data/exercises.json`) plutôt que de le télécharger au build : builds reproductibles, aucune dépendance réseau, et une mise à jour amont devient un commit explicite et relisible.

## Mise à jour du dataset

Le dépôt source évolue. Procédure :

1. Récupérer la nouvelle version du JSON.
2. Diff des `id` : nouveaux, modifiés, disparus.
3. Rejouer le seed — les nouveaux sont créés, les existants mis à jour.
4. Les exercices disparus sont passés à `isArchived = true`, **jamais supprimés** : ils sont référencés dans l'historique des utilisateurs.
5. Relire les `type` déduits pour les nouveaux exercices.

## Exercices personnalisés

Un utilisateur peut créer son propre exercice : nom, `ExerciseType`, partie du corps, équipement, muscle cible, notes. `isCustom = true`, `ownerId` renseigné, aucun média.

Ils n'apparaissent que dans le catalogue de leur propriétaire et se comportent comme les autres partout ailleurs (routines, séances, records). La requête catalogue filtre donc sur `isCustom = false OR ownerId = :userId`.
