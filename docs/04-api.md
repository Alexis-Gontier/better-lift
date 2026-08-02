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

Providers OAuth : **GitHub et Google** sont câblés en V1, Apple viendra. Apple est **obligatoire** sur iOS dès lors qu'un autre login social est proposé (règle App Store 4.8) — donc avant la première soumission mobile, pas avant, et il exige un compte Apple Developer payant.

Un fournisseur n'est enregistré que si ses deux variables sont renseignées : sans OAuth App, l'API démarre quand même et l'e-mail/mot de passe continue de fonctionner. Côté web les boutons restent affichés dans tous les cas — le navigateur n'a pas moyen de savoir ce qui est configuré côté serveur, et une erreur explicite se diagnostique mieux qu'un bouton absent.

### Routes servies par Better Auth

Elles sont hors du contrat OpenAPI de l'application : Better Auth publie le sien via son plugin `openAPI` si besoin.

| Chemin (`/api/auth/…`) | Rôle |
|---|---|
| `sign-up/email`, `sign-in/email`, `sign-out` | Cycle de vie e-mail/mot de passe |
| `sign-in/social`, `callback/:provider` | OAuth |
| `send-verification-email`, `verify-email` | Vérification d'adresse, **non bloquante** (D6) |
| `request-password-reset`, `reset-password` | Réinitialisation de mot de passe |

**Le parcours de réinitialisation fait un détour volontaire par l'API.** Le lien de l'e-mail pointe sur `/reset-password/:token`, qui valide le jeton *avant* de rediriger vers le web — avec `?token=` si valide, `?error=INVALID_TOKEN` sinon. On n'affiche donc jamais un formulaire dont on sait déjà qu'il échouera.

**Aucun envoi d'e-mail ne peut faire échouer la requête qui le déclenche** (D20). Sur `request-password-reset`, propager une erreur d'envoi répondrait 500 pour une adresse connue et 200 pour une inconnue : le formulaire deviendrait un moyen d'énumérer les comptes.

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

| Méthode | Chemin | Description | État |
|---|---|---|---|
| `GET` | `/v1/exercises` | Catalogue + exercices custom de l'utilisateur | ✅ |
| `GET` | `/v1/exercises/:id` | Fiche détaillée avec instructions localisées | ✅ |
| `POST` | `/v1/exercises` | Créer un exercice personnalisé | ✅ |
| `PATCH` | `/v1/exercises/:id` | Modifier — exercices custom uniquement | ✅ |
| `DELETE` | `/v1/exercises/:id` | Archiver — exercices custom uniquement | ✅ |
| `GET` | `/v1/exercises/:id/history` | Séries réalisées sur cet exercice, antéchronologique | après les séances |
| `GET` | `/v1/exercises/:id/records` | Records personnels sur cet exercice | après les séances |

**Exercices personnalisés.** Un exercice créé par un utilisateur porte son `ownerId` et n'est visible que de lui ; le catalogue commun a un `ownerId` nul et se voit de tous. Le champ `isCustom` de la réponse est **calculé** depuis ce seul propriétaire (D22). La clause de visibilité s'applique à toutes les lectures : deviner l'identifiant de l'exercice de quelqu'un d'autre donne un 404.

Trois particularités à connaître :

- **Aucun média.** `thumbnailUrl`, `animationUrl` et `attribution` restent nuls : les visuels du catalogue viennent d'un dataset sous licence (D17) et rien n'héberge d'image d'utilisateur. Les interfaces ont déjà leur repli.
- **Le nom est écrit dans toutes les locales servies.** L'utilisateur en saisit un seul ; le service le réplique. Les listes étant enracinées sur `ExerciseTranslation`, une locale sans ligne ferait disparaître l'exercice — sans erreur.
- **`equipment` est normalisé par le contrat** (minuscules, espaces en tirets bas), exactement comme au seed. « Body Weight » devient `body_weight`. Sans cela l'exercice existerait sans jamais répondre au filtre `?equipment=body_weight`.

**Modifier ou archiver, et les deux refus possibles.** Le premier est un 404 : l'exercice appartient à quelqu'un d'autre, et son existence ne doit pas fuiter (règle non négociable n°8). Le second est un **403** : l'exercice est du catalogue commun. C'est le seul endroit de l'API où un refus n'est pas un 404, et c'est délibéré — l'utilisateur vient peut-être d'afficher cette fiche, un « introuvable » contredirait le `GET` qui a réussi une seconde plus tôt, et il n'y a rien à protéger : le catalogue est public pour tous les comptes.

**`DELETE` archive, il ne supprime pas.** Une séance passée peut référencer l'exercice, et l'historique ne change jamais rétroactivement (invariant 8, doc 03). L'exercice disparaît du catalogue et des recherches ; les séances qui le citent restent lisibles.

Paramètres de `GET /v1/exercises` :

```
?q=bench          recherche sur le nom (locale courante)
&bodyPart=CHEST   filtre, répétable
&equipment=barbell  répétable, insensible à la casse
&type=WEIGHT_REPS   répétable
&custom=true|false  true : ses seuls exercices ; false : le seul catalogue
                    absent : les deux, ce qui est le cas courant
&locale=fr          "fr" par défaut
&limit=&cursor=     limit 20 par défaut, 100 au maximum
```

**La recherche et le tri portent sur le nom traduit**, pas sur le nom de base du catalogue. Conséquence sur l'implémentation, qui n'est pas un détail : la requête part de `ExerciseTranslation` filtrée par locale, et non de `Exercise` joint à ses traductions. Interroger `Exercise` donnerait un catalogue trié sur l'anglais pendant qu'on affiche du français, et une recherche aveugle aux noms traduits.

Cela suppose que **chaque exercice ait une traduction dans chaque locale servie**, sans quoi il disparaîtrait du catalogue. C'est ce que garantit le seed, qui écrit `fr` et `en` pour tous ; un test fige le lien entre les locales du contrat et celles du seed.

Le `cursor` est l'identifiant de la **traduction**, pas de l'exercice : c'est la ligne sur laquelle porte l'ordre. Il reste opaque pour le client, qui le renvoie tel quel.

Les paramètres répétables acceptent une occurrence unique (`?bodyPart=CHEST`) comme plusieurs (`?bodyPart=CHEST&bodyPart=BACK`) : Hono livre une chaîne dans le premier cas, un tableau dans le second.

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

| Méthode | Chemin | Description | État |
|---|---|---|---|
| `GET` | `/v1/routine-folders` | Dossiers avec compteur de routines | ✅ |
| `POST` | `/v1/routine-folders` | Créer | ✅ |
| `PATCH` | `/v1/routine-folders/:id` | Renommer | ✅ |
| `DELETE` | `/v1/routine-folders/:id` | Supprimer — les routines remontent à la racine | ✅ |
| `POST` | `/v1/routine-folders/reorder` | `{ "ids": ["a","b","c"] }` — ordre complet | ✅ |

`routineCount` **exclut les routines supprimées**. La suppression étant logique, compter la ligne restée en base ferait annoncer trois routines à un dossier qui n'en montre qu'une.

Supprimer un dossier ne supprime jamais son contenu : les routines remontent à la racine, et c'est `onDelete: SetNull` en base qui le garantit — pas une ligne de code qu'un appel pourrait oublier.

### Routines

| Méthode | Chemin | Description | État |
|---|---|---|---|
| `GET` | `/v1/routines` | Liste (`?folderId=`, `?sort=recent\|name\|position`) | ✅ |
| `POST` | `/v1/routines` | Créer avec ses exercices et séries | ✅ |
| `GET` | `/v1/routines/:id` | Détail complet | ✅ |
| `PUT` | `/v1/routines/:id` | **Remplacement complet** de la structure | ✅ |
| `PATCH` | `/v1/routines/:id` | Métadonnées seules (nom, notes, dossier) | ✅ |
| `DELETE` | `/v1/routines/:id` | Suppression logique | ✅ |
| `POST` | `/v1/routines/:id/duplicate` | Copie, suffixée « (copie) » | ✅ |
| `POST` | `/v1/routines/reorder` | Réordonner | ✅ |

**`GET /v1/routines` n'est pas paginée**, contrairement au catalogue. Le nombre de routines est borné par l'effort de leur auteur — quelques dizaines, jamais des milliers — et l'écran les affiche toutes, groupées par dossier. Un curseur imposerait en prime une clé composite dès qu'on trie par nom ou par dernière utilisation, deux colonnes non uniques : de la complexité pour une liste qui tient à l'écran.

Le tri `recent` place les routines **jamais faites en dernier**, pas en premier : sans `NULLS LAST`, Postgres remonte les `NULL` en tête d'un tri descendant.

Les deux `reorder` prennent la liste **complète** des identifiants dans leur nouvel ordre, jamais un déplacement relatif. Un « monte de deux » appliqué à une liste qui a bougé entre-temps range l'élément ailleurs, sans erreur. Ce qui n'appartient pas à l'appelant est ignoré plutôt que de faire échouer tout le geste : la requête vient d'un glisser-déposer, et une routine supprimée dans un autre onglet ne doit pas annuler le reste.

Le détail **embarque le résumé de chaque exercice**, dans la locale demandée, plutôt qu'un simple identifiant : sinon afficher une routine demanderait une requête par exercice, ou le catalogue entier chargé côté client pour résoudre des références.

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

L'ordre du tableau porte la position : le client n'envoie pas de champ `position`, le serveur l'assigne. Une source d'incohérence en moins — et le corps étant strict, un `position` envoyé quand même répond 422 plutôt que d'être ignoré.

Deux contrôles à connaître avant d'appeler ces routes :

- **Tout `exerciseId` doit être visible de l'appelant** et non archivé, sinon 422. Sans cela, glisser l'identifiant d'un exercice personnalisé d'autrui dans le corps suffirait à le lire ensuite dans sa propre routine : la clé étrangère l'accepterait sans broncher.
- **Un `supersetGroup` resté seul est ramené à `null`** (invariant 4, doc 03). Le cas arrive tout seul : on crée un superset de deux exercices, puis on en supprime un — le survivant garderait sinon une marque de groupe invisible et fausse.

Le `PUT` supprime les exercices existants avant de les recréer. Les identifiants de `RoutineExercise` et de `RoutineSet` changent donc à chaque enregistrement, et personne ne doit s'y référer — une séance copie les valeurs, elle ne pointe pas ces lignes. Rapprocher les lignes une à une demanderait une clé stable que l'éditeur n'a pas, et un échange de positions violerait `@@unique([routineId, position])` en cours de route.

### Séances

| Méthode | Chemin | Description | État |
|---|---|---|---|
| `GET` | `/v1/workouts` | Historique (`?from=&to=&routineId=`) | ✅ |
| `POST` | `/v1/workouts` | Enregistrer une séance terminée | ✅ |
| `GET` | `/v1/workouts/:id` | Détail | ✅ |
| `PUT` | `/v1/workouts/:id` | Corriger une séance passée | ✅ |
| `DELETE` | `/v1/workouts/:id` | Supprimer définitivement | ✅ |
| `GET` | `/v1/workouts/last-performance?exerciseIds=a,b,c` | Dernières valeurs par exercice, pour les placeholders | ✅ |

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

Cinq particularités de ces routes, apprises en les câblant :

- **Le corps n'est pas strict**, contrairement à celui des routines et du profil : les champs inconnus sont ignorés au lieu de valoir 422. C'est le seul corps qu'un client envoie depuis une file de synchronisation, parfois plusieurs jours après coup ; perdre une séance réelle sur un champ ajouté depuis serait bien pire qu'un champ ignoré. La règle générale de l'API — tolérer les entrées inconnues pour les vieux clients mobiles — s'applique donc pleinement ici.
- **Un exercice archivé reste acceptable** dans une séance, alors qu'il est refusé dans une routine. L'archivage est une préférence de catalogue, pas une frontière de sécurité ; celle-là reste la visibilité, appliquée dans les deux cas. Un exercice personnalisé d'autrui vaut toujours 422.
- **Un identifiant déjà pris par la séance de quelqu'un d'autre répond 409**, et non 404. Le client doit en générer un autre, là où un 404 l'inviterait à réessayer à l'identique. Rien du contenu n'est révélé, et la collision de deux cuid relève du hasard pur.
- **Enregistrer, corriger et supprimer passent par le même recalcul de records**, qui les reconstruit depuis l'historique des exercices touchés. Corriger à la baisse peut invalider un record, et il faut alors retrouver le second meilleur — ce qu'un ajustement incrémental n'a aucun moyen de connaître. Faire vivre deux chemins, l'un rapide à l'ajout et l'autre complet à la correction, c'était garantir qu'ils finiraient par diverger.
- **`lastPerformedAt` d'une routine ne recule jamais** à l'enregistrement : une vieille séance remontée tardivement par la file de synchronisation ne doit pas faire paraître la routine plus ancienne qu'elle ne l'est. À la **suppression** d'une séance, en revanche, les deux compteurs sont relus depuis les séances restantes — laisser la date pointer une séance supprimée fausserait le tri « dernière utilisée » sans que rien ne le signale.

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

| Portée | Limite | État |
|---|---|---|
| `/api/auth/sign-in/email`, `sign-up/email` | 10 / 15 min / IP | ✅ appliqué |
| `/api/auth/request-password-reset`, `send-verification-email` | 5 / 15 min / IP | ✅ appliqué |
| Reste de `/api/auth/*` | 100 / min / IP | ✅ appliqué |
| `/v1/*` authentifié | 300 / min / utilisateur | à faire |
| `/v1/exercises` (recherche) | 60 / min / utilisateur | à faire |

Les quotas d'authentification sont ceux de Better Auth, **activés dans tous les environnements** — il ne les applique qu'en production par défaut, ce qui reviendrait à ne jamais les éprouver avant d'en avoir besoin. Leur stockage est en mémoire, donc par instance : voir la limitation notée en D20 avant de répliquer l'API.

## Versionnement

Le préfixe `/v1` est figé pour toute évolution rétrocompatible : ajout de champs, ajout d'endpoints, ajout de valeurs d'énumération optionnelles. Un `/v2` n'est créé qu'en cas de rupture.

Contrainte propre au mobile : **les anciennes versions de l'app restent installées pendant des mois.** Toute suppression de champ doit être précédée d'une période de dépréciation, et l'API doit tolérer les champs inconnus dans les payloads entrants sans échouer.
