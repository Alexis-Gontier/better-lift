---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# Tests

Vitest partout. Testing Library pour les composants web, Playwright pour l'E2E web, Maestro pour le mobile.

Nommage : `should [résultat attendu] when [condition]`.

## Ce qui doit être couvert

Un pourcentage global ne dit rien d'utile. Ces six points portent l'essentiel du risque réel :

1. Calcul du volume, cas tordus inclus : échauffement exclu, `ASSISTED_BODYWEIGHT` à contribution nulle, exercices en durée.
2. Détection des records et **non-régression** : un record ne baisse jamais.
3. Idempotence de `POST /v1/workouts` : double envoi ⇒ une seule séance.
4. Réordonnancement des positions : contrainte d'unicité respectée.
5. Isolation par utilisateur : accéder à la routine d'un autre renvoie 404.
6. Reprise d'une séance après tuage de l'app mobile.

## Principes

- Mocker les dépendances externes, pas les modules internes.
- `packages/core` se teste en isolation, sans base ni réseau — c'est sa raison d'être.
- Les tests d'intégration API tournent contre une vraie base (Testcontainers ou base dédiée), pas contre un mock de Prisma.
- Nettoyer les effets de bord en `afterEach`.
