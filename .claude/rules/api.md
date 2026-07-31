---
paths:
  - "apps/api/**"
  - "packages/validators/**"
---

# API — Hono + zod-openapi

## Structure

- `routes/` fait la validation et l'HTTP.
- `services/` porte la logique métier et **ne connaît jamais le contexte Hono** — c'est ce qui les rend testables directement.
- Un handler ne lit jamais l'identifiant utilisateur depuis le body ou la query : uniquement via `c.get("user")`, injecté par le middleware d'auth.

## Zod

Importer `z` depuis `@hono/zod-openapi`, **pas** depuis `zod` — sinon `.openapi()` n'existe pas.

Les schémas partagés vivent dans `packages/validators` et sont la source de vérité du contrat. Toute route non validée est un bug.

## Conventions

- Chemins en kebab-case, payloads en camelCase, ressources au pluriel.
- Dates ISO 8601 UTC.
- **Toutes les charges sont en kg dans l'API.** La conversion lb est l'affaire du client.
- Les `Decimal` sont sérialisés en **chaînes** (`"82.50"`), jamais en nombres.
- Pagination **par curseur**, jamais par offset.
- Préfixe `/v1`. L'API doit tolérer les champs inconnus en entrée sans échouer : les vieux clients mobiles restent en circulation.

## Erreurs

Format unique :

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [] } }
```

Codes : `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_FAILED` (422), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL` (500).

**Une ressource appartenant à autrui renvoie 404, pas 403.** Inutile de révéler son existence.

## Points de vigilance métier

- `POST /v1/workouts` est **idempotent** : l'`id` est généré par le client. Un `id` déjà connu renvoie 200 et la ressource existante, pas 201 ni un doublon.
- Les records sont calculés **serveur**, dans la transaction de fin de séance, à partir des seules séries `completed` et non `WARMUP`.
- Modifier une séance passée déclenche un **recalcul intégral** des records des exercices touchés, reconstruit depuis l'historique — pas un ajustement incrémental (un record peut être invalidé, il faut retrouver le second meilleur).
- `PUT /v1/routines/:id` **remplace intégralement** la structure. Pas de PATCH granulaire sur les sous-ressources imbriquées.

Contrat complet : `docs/04-api.md`.
