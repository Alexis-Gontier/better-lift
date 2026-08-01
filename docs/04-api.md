# 04 — API

Base : `https://api.better-lift.app` · Préfixe de version : `/v1` · Format : JSON

## Conventions

- REST, ressources au pluriel, kebab-case dans les chemins, camelCase dans les payloads.
- Dates en ISO 8601 UTC (`2026-07-31T18:24:00.000Z`).
- **Toutes les charges sont en kg dans l'API.** La conversion en lb est une affaire de client.
- Les `Decimal` sont sérialisés en **chaînes** (`"82.50"`) pour éviter les pertes de précision des flottants JavaScript. Les clients les parsent via `packages/core`.
- Pagination par curseur, jamais par offset (l'historique s'insère par le haut, un offset décale les résultats).
- Validation d'entrée par Zod via `@hono/zod-openapi` ; toute route non validée est un bug.

## Authentification

Better Auth est monté sur `/api/auth/*` et gère l'ensemble du cycle de vie : inscription, connexion, OAuth, rafraîchissement, déconnexion.

| Client | Transport de session |
|---|---|
| Web | Cookie httpOnly, `SameSite=Lax` si l'API est sur un sous-domaine du web, sinon `None; Secure` |
| Mobile | Bearer token via le plugin Expo de Better Auth, stocké dans `expo-secure-store` |

Toutes les routes `/v1/*` exigent une session valide, sauf mention contraire. Le middleware injecte `c.get("user")` ; un handler ne lit **jamais** l'identifiant utilisateur depuis le body ou la query.

```ts
// middleware/auth.ts
export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new ApiError(401, "UNAUTHENTICATED");
  c.set("user", session.user);
  await next();
});
```

Providers OAuth : **GitHub d'abord** (V1), puis Google et Apple. Apple est **obligatoire** sur iOS dès lors qu'un autre login social est proposé (règle App Store 4.8) — donc avant la première soumission mobile, pas avant. Tant que l'app n'est pas soumise, GitHub seul ne pose aucun problème.

Le fournisseur n'est enregistré que si `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` sont renseignés : sans OAuth App, l'API démarre quand même et l'e-mail/mot de passe continue de fonctionner.

## Format d'erreur

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Le nom de la routine est requis.",
    "details": [{ "path": "name", "message": "String must contain at least 1 character(s)" }]
  }
}
```

| Code | HTTP | Signification |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Session absente ou expirée |
| `FORBIDDEN` | 403 | La ressource ne vous appartient pas |
| `NOT_FOUND` | 404 | Ressource inexistante ou hors périmètre |
| `VALIDATION_FAILED` | 422 | Payload invalide |
| `CONFLICT` | 409 | Contrainte d'unicité (nom d'utilisateur, positions) |
| `RATE_LIMITED` | 429 | Trop de requêtes |
| `INTERNAL` | 500 | Erreur inattendue (loguée avec un `requestId` renvoyé au client) |

**Une ressource appartenant à autrui renvoie `404`, pas `403`** — inutile de révéler son existence.

Deux points de mise en œuvre, appris en câblant les premières routes qui valident des entrées :

- Les erreurs de validation passent par un `defaultHook` posé sur chaque `OpenAPIHono`. Sans lui, `@hono/zod-openapi` répond **400 dans son propre format**, et un client qui aiguille sur `error.code` ne verrait jamais passer un `VALIDATION_FAILED`. Le crochet **ne s'hérite pas** des routeurs montés : le repasser à chaque nouveau routeur.
- **Un corps illisible est une erreur du client, pas une panne.** Hono lève un 400 sur un JSON tronqué ; il est traduit en `VALIDATION_FAILED` / 422. Le classer en `INTERNAL` laissait croire à un incident serveur, et le contrat ne connaît pas le 400.

## Pagination

```
GET /v1/workouts?limit=20&cursor=cm3x8k2p0000...
```

```json
{
  "data": [ /* … */ ],
  "nextCursor": "cm3x8k2p0001...",
  "hasMore": true
}
```

`limit` par défaut 20, maximum 100.

---

## Endpoints

### Compte

| Méthode | Chemin | Description | État |
|---|---|---|---|
| `GET` | `/v1/me` | Profil + préférences | ✅ |
| `PATCH` | `/v1/me` | Modifier profil et préférences | ✅ |
| `POST` | `/v1/me/export` | Déclenche l'export RGPD (JSON), envoyé par e-mail | à faire |
| `DELETE` | `/v1/me` | Suppression de compte, cascade complète. Exige la confirmation du mot de passe. | à faire |

Champs modifiables par `PATCH /v1/me` : `name`, `username`, `bio`, `unitSystem`, `locale`, `timezone`, `defaultRestSec`, `defaultVisibility`.

Trois particularités de cette route, toutes délibérées :

- **Le corps est strict**, alors que l'API tolère les champs inconnus partout ailleurs. Sur une écriture, un champ mal orthographié serait silencieusement ignoré et l'utilisateur croirait avoir enregistré son réglage : un `422` explicite vaut mieux. La tolérance existe pour les vieux clients mobiles en lecture, pas pour un formulaire de réglages.
- **`username` et `bio` acceptent `null`** pour être effacés — ce qu'une simple absence de clé ne permet pas d'exprimer, `PATCH` traitant l'absence comme « ne pas toucher ».
- **`username` est unique**, et le conflit est détecté par la contrainte de base, pas par une lecture préalable : entre un `SELECT` et l'`UPDATE`, deux clients peuvent choisir le même pseudo. La violation `P2002` est traduite en `409 CONFLICT`. C'est la seule version sans fenêtre de course.

**`unitSystem` est une préférence d'affichage, jamais une donnée de stockage.** Les charges restent en kg dans l'API et en base (règle non négociable n°3) ; la conversion appartient au client, via un composant unique.

### Exercices

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/v1/exercises` | Catalogue + exercices custom de l'utilisateur |
| `GET` | `/v1/exercises/:id` | Fiche détaillée avec instructions localisées |
| `POST` | `/v1/exercises` | Créer un exercice personnalisé |
| `PATCH` | `/v1/exercises/:id` | Modifier — exercices custom uniquement |
| `DELETE` | `/v1/exercises/:id` | Archiver — exercices custom uniquement |
| `GET` | `/v1/exercises/:id/history` | Séries réalisées sur cet exercice, antéchronologique |
| `GET` | `/v1/exercises/:id/records` | Records personnels sur cet exercice |

Paramètres de `GET /v1/exercises` :

```
?q=bench          recherche sur le nom (locale courante)
&bodyPart=CHEST   filtre, répétable
&equipment=barbell
&type=WEIGHT_REPS
&custom=true|false
&locale=fr
&limit=&cursor=
```

Réponse (extrait) :

```json
{
  "data": [{
    "id": "cm3x...",
    "name": "Développé couché à la barre",
    "type": "WEIGHT_REPS",
    "bodyPart": "CHEST",
    "equipment": "barbell",
    "target": "pectorals",
    "secondaryMuscles": ["triceps", "delts"],
    "thumbnailUrl": "https://cdn.../0025-EIeI8Vf.jpg",
    "animationUrl": "https://cdn.../0025-EIeI8Vf.gif",
    "attribution": "© Gym visual — https://gymvisual.com/",
    "isCustom": false
  }],
  "nextCursor": null,
  "hasMore": false
}
```

### Dossiers de routines

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/v1/routine-folders` | Dossiers avec compteur de routines |
| `POST` | `/v1/routine-folders` | Créer |
| `PATCH` | `/v1/routine-folders/:id` | Renommer |
| `DELETE` | `/v1/routine-folders/:id` | Supprimer — les routines remontent à la racine |
| `POST` | `/v1/routine-folders/reorder` | `{ "ids": ["a","b","c"] }` — ordre complet |

### Routines

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/v1/routines` | Liste (`?folderId=`, `?sort=recent\|name\|position`) |
| `POST` | `/v1/routines` | Créer avec ses exercices et séries |
| `GET` | `/v1/routines/:id` | Détail complet |
| `PUT` | `/v1/routines/:id` | **Remplacement complet** de la structure |
| `PATCH` | `/v1/routines/:id` | Métadonnées seules (nom, notes, dossier) |
| `DELETE` | `/v1/routines/:id` | Suppression logique |
| `POST` | `/v1/routines/:id/duplicate` | Copie, suffixée « (copie) » |
| `POST` | `/v1/routines/reorder` | Réordonner dans un dossier |

**Le `PUT` remplace intégralement** la liste d'exercices et de séries. Un PATCH granulaire sur des sous-ressources imbriquées (exercice 3, série 2) multiplierait les allers-retours et les états intermédiaires incohérents. L'éditeur travaille sur un brouillon local et envoie l'ensemble en une transaction.

```jsonc
// POST /v1/routines
{
  "name": "Push A",
  "folderId": "cm3x...",
  "notes": "Barre à 20 kg",
  "exercises": [
    {
      "exerciseId": "cm3x...",
      "restSec": 180,
      "notes": "Pause 1 s en bas",
      "supersetGroup": null,
      "sets": [
        { "type": "WARMUP", "targetReps": 10, "targetWeightKg": "40.00" },
        { "type": "NORMAL", "targetReps": 5,  "targetWeightKg": "100.00", "targetRpe": "8.0" },
        { "type": "NORMAL", "targetReps": 5,  "targetWeightKg": "100.00" }
      ]
    }
  ]
}
```

L'ordre du tableau porte la position : le client n'envoie pas de champ `position`, le serveur l'assigne. Une source d'incohérence en moins.

### Séances

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/v1/workouts` | Historique (`?from=&to=&routineId=`) |
| `POST` | `/v1/workouts` | Enregistrer une séance terminée |
| `GET` | `/v1/workouts/:id` | Détail |
| `PUT` | `/v1/workouts/:id` | Corriger une séance passée |
| `DELETE` | `/v1/workouts/:id` | Supprimer définitivement |
| `GET` | `/v1/workouts/last-performance?exerciseIds=a,b,c` | Dernières valeurs par exercice, pour les placeholders |

**Idempotence.** Le client génère l'identifiant de la séance (`cuid` local) et le transmet. Un `POST` avec un `id` déjà connu renvoie `200` et la ressource existante plutôt que `201`. Sans ça, une reconnexion réseau au mauvais moment crée des doublons — c'est le bug numéro un des trackers de sport.

```jsonc
// POST /v1/workouts
{
  "id": "cm3xlocal...",          // généré côté client
  "routineId": "cm3x...",
  "title": "Push A",
  "startedAt": "2026-07-31T17:02:00.000Z",
  "endedAt":   "2026-07-31T18:14:00.000Z",
  "notes": "Bonne séance, épaule OK",
  "exercises": [
    {
      "exerciseId": "cm3x...",
      "restSec": 180,
      "supersetGroup": null,
      "sets": [
        { "type": "WARMUP", "reps": 10, "weightKg": "40.00", "completed": true },
        { "type": "NORMAL", "reps": 5,  "weightKg": "102.50", "rpe": "9.0", "completed": true },
        { "type": "NORMAL", "reps": 4,  "weightKg": "102.50", "completed": true },
        { "type": "NORMAL", "reps": 5,  "weightKg": "102.50", "completed": false }
      ]
    }
  ]
}
```

Réponse : la séance persistée, agrégats calculés et records détectés.

```json
{
  "id": "cm3xlocal...",
  "durationSec": 4320,
  "totalVolumeKg": "1537.50",
  "totalSets": 3,
  "totalReps": 19,
  "prCount": 1,
  "newRecords": [{
    "exerciseId": "cm3x...",
    "exerciseName": "Développé couché à la barre",
    "type": "BEST_WEIGHT",
    "value": "102.50",
    "previousValue": "100.00"
  }]
}
```

Les records sont calculés **serveur**, jamais client : c'est la seule façon de garantir la cohérence entre deux appareils.

### Statistiques

| Méthode | Chemin | Description |
|---|---|---|
| `GET` | `/v1/stats/summary?range=7d\|30d\|90d\|1y\|all` | KPI du dashboard |
| `GET` | `/v1/stats/volume?groupBy=week\|month&from=&to=` | Séries temporelles de volume |
| `GET` | `/v1/stats/muscle-distribution?range=30d` | Répartition des séries par partie du corps |
| `GET` | `/v1/stats/streak` | Régularité (semaines consécutives avec ≥ 1 séance) |
| `GET` | `/v1/stats/records?limit=10` | Records les plus récents |

```json
// GET /v1/stats/summary?range=30d
{
  "range": "30d",
  "workoutCount": 14,
  "totalVolumeKg": "84250.00",
  "totalDurationSec": 61200,
  "avgDurationSec": 4371,
  "totalSets": 412,
  "prCount": 6,
  "previousPeriod": { "workoutCount": 11, "totalVolumeKg": "71300.00" }
}
```

`previousPeriod` permet d'afficher les variations sans second appel.

### Mensurations — V2

| Méthode | Chemin |
|---|---|
| `GET` / `POST` | `/v1/measurements` |
| `PATCH` / `DELETE` | `/v1/measurements/:id` |

### Santé

| Méthode | Chemin | Auth |
|---|---|---|
| `GET` | `/health` | non |
| `GET` | `/v1/version` | non |

```json
{ "status": "ok", "version": "0.1.0", "db": "ok", "uptimeSec": 8412 }
```

## Limitation de débit

| Portée | Limite |
|---|---|
| `/api/auth/sign-in`, `/sign-up` | 10 / 15 min / IP |
| `/v1/*` authentifié | 300 / min / utilisateur |
| `/v1/exercises` (recherche) | 60 / min / utilisateur |

## Versionnement

Le préfixe `/v1` est figé pour toute évolution rétrocompatible : ajout de champs, ajout d'endpoints, ajout de valeurs d'énumération optionnelles. Un `/v2` n'est créé qu'en cas de rupture.

Contrainte propre au mobile : **les anciennes versions de l'app restent installées pendant des mois.** Toute suppression de champ doit être précédée d'une période de dépréciation, et l'API doit tolérer les champs inconnus dans les payloads entrants sans échouer.
