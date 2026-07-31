---
description: Scaffolde un nouvel endpoint API en respectant les conventions du projet — schéma Zod partagé, route zod-openapi, service testable, client typé et tests.
argument-hint: <méthode> <chemin> (ex. POST /v1/routines/:id/duplicate)
---

Crée l'endpoint `$ARGUMENTS` de bout en bout.

Avant d'écrire, lire `docs/04-api.md` et `.claude/rules/api.md`, et vérifier dans `docs/09-decisions.md` qu'aucune décision existante ne contraint ce choix.

Produire dans cet ordre :

1. **Schéma Zod** dans `packages/validators/src/`, avec le type inféré exporté. `z` importé depuis `@hono/zod-openapi`.
2. **Route** dans `apps/api/src/routes/`, via `createRoute` : validation d'entrée, réponses documentées avec leur code de statut explicite, y compris les cas d'erreur.
3. **Service** dans `apps/api/src/services/`, sans aucune référence au contexte Hono. C'est lui qui porte la logique et la vérification d'appartenance de la ressource.
4. **Client** dans `packages/api-client/`, avec le hook TanStack Query correspondant et les invalidations de cache adéquates.
5. **Tests** : un test d'intégration sur la route (cas nominal, payload invalide, ressource d'autrui ⇒ 404) et un test unitaire du service si la logique le mérite.

Points à ne pas rater :

- L'identifiant utilisateur vient de `c.get("user")`, jamais du payload.
- Ressource appartenant à autrui ⇒ **404**, pas 403.
- `Decimal` sérialisé en chaîne.
- Pagination par curseur si l'endpoint renvoie une liste.
- Si l'endpoint écrit une séance : idempotence par identifiant client, et recalcul des agrégats dans la transaction.

Terminer par un récapitulatif des fichiers créés et de la commande à lancer pour vérifier.
