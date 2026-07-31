# 07 — Conventions & workflow

## Prérequis

| Outil | Version |
|---|---|
| Node | **24 LTS** « Krypton » (fixée dans `.nvmrc`). Node 20 est EOL depuis avril 2026. |
| pnpm | **11.x** (via `packageManager` dans le `package.json` racine), avec catalogs |
| Docker | pour Postgres en local |
| EAS CLI | pour les builds mobiles |

## Installation

```bash
git clone git@github.com:<org>/better-lift.git
cd better-lift
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed              # importe le catalogue d'exercices (explicite : Prisma 7 ne le fait plus seul)
pnpm dev
```

## Scripts racine

| Script | Effet |
|---|---|
| `pnpm dev` | Lance web, api et mobile via Turborepo |
| `pnpm dev --filter=web` | Une seule app |
| `pnpm build` | Build de tout le graphe |
| `pnpm lint` / `pnpm typecheck` | Qualité |
| `pnpm test` | Vitest sur tous les packages |
| `pnpm test:e2e` | Playwright (web) |
| `pnpm db:migrate` / `db:seed` / `db:studio` / `db:reset` | Base |
| `pnpm clean` | Purge des artefacts et caches |

## Git

**Branches.** `main` protégée et déployable en permanence. Branches courtes : `feat/…`, `fix/…`, `chore/…`, `docs/…`.

**Commits.** Conventional Commits, avec le périmètre :

```
feat(routines): ajout du glisser-déposer sur les séries
fix(mobile): le chrono ne dérive plus en arrière-plan
chore(db): migration supersetGroup
```

Le périmètre correspond au package ou au domaine, ce qui rend le changelog exploitable.

**Pull requests.** Squash merge. Une PR contient : ce qui change, pourquoi, comment le tester. Capture d'écran ou vidéo obligatoire pour toute modification d'UI. CI verte requise.

**Versionnement.** Changesets pour les packages internes, `semver` pour l'app mobile (le `versionCode` / `buildNumber` est géré par EAS). Les versions des dépendances tierces partagées sont déclarées une seule fois via les **pnpm catalogs** — voir doc 10.

## Qualité de code

- **TypeScript `strict`**, plus `noUncheckedIndexedAccess`. `any` interdit — `unknown` puis affinage.
- **ESLint** avec configuration partagée dans `packages/config`, `import/order` activé.
- **Prettier**, 100 colonnes, pas de point-virgule optionnel laissé au hasard.
- **Hooks pré-commit** : `lint-staged` (Prettier + ESLint sur les fichiers modifiés) et `commitlint`. Pas de typecheck complet en pré-commit — trop lent, c'est le rôle de la CI.

**Nommage.** Fichiers en `kebab-case`, composants React en `PascalCase`, hooks préfixés `use`, constantes en `SCREAMING_SNAKE_CASE`. Domaines métier au singulier dans le code (`routine.service.ts`), au pluriel dans les URL (`/v1/routines`).

**Découpage par fonctionnalité, pas par type technique.** `features/routines/{components,hooks,api,types}.ts` plutôt qu'un dossier `components/` contenant toute l'application. Sur un produit à plusieurs domaines, le second modèle devient illisible vers 50 fichiers.

## Tests

| Niveau | Outil | Cible |
|---|---|---|
| Unitaire | Vitest | `packages/core` — couverture élevée, c'est de la logique pure |
| Intégration API | Vitest + Testcontainers ou base dédiée | Services et routes, base réelle |
| Composants web | Testing Library | Éditeur de routines, formulaires |
| E2E web | Playwright | Inscription → création de routine → séance |
| Mobile | Maestro | Parcours de séance |

**Ce qu'il faut absolument couvrir**, indépendamment de tout objectif chiffré :

1. Calcul du volume, en incluant les cas tordus (échauffement exclu, assisté, durée).
2. Détection des records et non-régression (un record ne baisse jamais).
3. Idempotence de `POST /v1/workouts` (double envoi ⇒ une seule séance).
4. Réordonnancement des positions (contrainte d'unicité respectée).
5. Isolation par utilisateur : accéder à la routine d'un autre renvoie 404.
6. Reprise d'une séance après tuage de l'app mobile.

Ces six points-là couvrent l'essentiel du risque réel. Un pourcentage de couverture global ne dit rien d'utile.

## CI — GitHub Actions

```yaml
on: [pull_request, push]
jobs:
  quality:
    steps:
      - pnpm install --frozen-lockfile
      - pnpm db:generate      # Prisma 7 : plus de generate implicite
      - pnpm lint
      - pnpm typecheck
      - pnpm test
      - pnpm build
```

Cache Turborepo (remote cache) pour éviter de tout rebuilder. Job séparé pour les migrations en preview. E2E uniquement sur les PR ciblant `main`, pour ne pas allonger chaque poussée.

## Observabilité

| Besoin | Outil |
|---|---|
| Erreurs API et web | Sentry |
| Erreurs et crashs mobiles | Sentry (`sentry-expo`) |
| Logs structurés | Pino, format JSON, `requestId` propagé |
| Analytics produit | PostHog (auto-hébergeable, compatible RGPD) |
| Disponibilité | Ping sur `/health` |

**Événements produit à instrumenter dès la V1** : inscription terminée, première routine créée, première séance terminée, séance abandonnée, saisie hors ligne synchronisée. Ce sont les points de bascule de l'activation ; sans eux, on optimise à l'aveugle.

Aucune donnée personnelle dans les logs. Les identifiants suffisent.

## Sécurité

- Secrets via variables d'environnement uniquement, jamais commités. `.env.example` documente les clés sans valeur.
- Validation Zod sur **toutes** les entrées, y compris les paramètres de route.
- Vérification systématique de l'appartenance des ressources dans les services, pas dans les routes — c'est là qu'on l'oublie.
- CORS restreint aux origines connues, jamais `*`.
- Rate limiting sur l'authentification.
- `helmet` / `secureHeaders`, HTTPS partout, HSTS.
- `pnpm audit` en CI, Renovate pour les mises à jour (groupées, avec auto-merge des correctifs de sécurité si la CI passe).
- **Next.js est à tenir à jour sérieusement** : un cluster d'avis de sécurité en mai 2026 couvrait contournement d'autorisation dans le middleware, SSRF et empoisonnement de cache. Rester sur l'Active LTS (16.x).

## RGPD

- Hébergement en région UE (base et API).
- Export complet des données au format JSON, à la demande.
- Suppression de compte effective avec cascade réelle en base, pas un simple drapeau.
- Politique de confidentialité et CGU publiées avant la mise en production.
- Consentement analytics explicite ; PostHog en mode sans cookie tant que rien n'est accepté.
- Registre des sous-traitants (hébergeur, Sentry, PostHog, stores).

## Définition de « terminé »

Une fonctionnalité est terminée quand :

- [ ] Le code est relu et fusionné dans `main`
- [ ] Les tests pertinents sont écrits et passent
- [ ] Les états de chargement, d'erreur et vide sont traités
- [ ] Les libellés existent en fr et en en
- [ ] L'accessibilité clavier et lecteur d'écran est vérifiée (web)
- [ ] Le comportement hors ligne est défini (mobile)
- [ ] La documentation est à jour si le contrat d'API change
