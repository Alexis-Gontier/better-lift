# better-lift

Tracker de musculation personnel pour deux ou trois comptes : web (préparer, relire) et mobile
(la salle). **Tout est en français** : interface, commentaires, commits, docs, réponses. Le but de
chaque arbitrage : moins de code, pas un SaaS.

- Conception : `docs/conception.md`. Décisions en vigueur : `docs/decisions.md` — le code les
  cite (« D57 ») ; une décision qui gêne se révise par une nouvelle, écrite dans ce registre.
- Consignes par zone, chargées avec leurs fichiers : `.claude/rules/` — `interface-web.md`,
  `mobile.md`, `catalogue-db.md`, `deploiement-ci.md`.
- Déploiement : `docs/deploiement.md`.

## Commandes

```
pnpm dev                             # API :3001, web :3000, Metro :8081
pnpm build | typecheck | test        # via turbo
pnpm lint                            # biome check depuis la racine (pas une tâche turbo)
pnpm knip
pnpm db:migrate | db:generate | db:seed
pnpm --filter @better-lift/web e2e   # Playwright contre l'API de dev
```

- `/verif` enchaîne build, typecheck, test, lint, knip. Une tâche n'est finie qu'avec `/verif`
  vert **et** l'écran vu tournant (capture web, émulateur pour le mobile).
- `/migration <nom>` crée une migration sur la bonne branche Neon.
- Un hook formate chaque fichier édité avec Biome ; Lefthook refait Biome et commitlint au commit.

## Architecture

- Web et mobile passent **tous deux par l'API** (Hono RPC) ; jamais d'accès à la base depuis un
  client. Zod dans `packages/shared` est la source unique du contrat.
- `packages/shared` : TypeScript pur — ni Prisma, ni React, ni API de plateforme (`Intl` toléré).
  Pas de `crypto.randomUUID` (absent sous Hermes). La logique d'écran commune y vit aussi.
- `packages/api-client` reçoit l'URL de base de l'appelant (`creerClient(baseUrl)`) : un paquet
  partagé qui lirait `import.meta.env` ne compilerait pas sous Expo.
- API : la logique dans `services/`, qui ne connaît jamais Hono. **Toute route de données
  personnelles passe par `exigerSession`** ; le service reçoit `userId` et filtre par lui. La
  donnée d'autrui répond **404, jamais 403**. Toute erreur répond `{ erreur }`.
- L'interface n'est pas partagée entre web et mobile.
- **Toute charge affichée ou saisie passe par `formaterCharge` / `lireCharge`** ; fuseau et unités
  sont fixés en un seul endroit par surface (web : `lib/locale.ts` ; mobile : `lib/unites.ts`,
  `lib/fuseau.ts`).
- **Records et totaux dérivés à la lecture** (`shared/records.ts`), jamais stockés. « La dernière
  fois » s'aligne position par position sur toutes les séries précédentes, comme Hevy.

## Interface

- Chaque écran porte **quatre états** (vide, chargement, erreur, nominal) dès son dessin ; sur le
  web, `?etat=` force chacun. On dessine et valide un écran avant de brancher ses données.
- Une couleur pour l'action et le record, distinguées par la forme : l'action est un aplat, le
  record un contour. Le danger a la sienne. Un token par rôle, deux valeurs (sombre / clair),
  jamais de couleur en dur. Mobile : wireframe Reusables en gris (`apps/mobile/global.css`,
  D316) ; web : wireframe shadcn en gris.

## Git et PR

- **`main` est protégée** : PR obligatoire, squash seul, check requis
  `Qualité · typecheck · test · build`. Ne jamais pousser sur `main`.
- **IMPORTANT : fusionner sur `main` déploie la production.** Jamais sans l'accord explicite de
  l'utilisateur ; s'arrêter à la PR ouverte et verte.
- Branches `feat/…`, `fix/…`, `chore/…`. Un correctif d'audit part de `main` sur sa propre
  branche, jamais dans une branche de fonctionnalité.
- Conventional Commits en français ; commitlint refuse un sujet en majuscule ou de plus de
  100 caractères.
- N'ajouter que ses propres fichiers (`git add <fichier>`) : l'utilisateur laisse parfois des
  modifications non commitées.

## Specs et plans

Les skills superpowers écrivent leurs specs et plans dans `docs/superpowers/` : ce sont des
documents de chantier. **Une fois le chantier fusionné**, reporter ses décisions dans
`docs/decisions.md` (et ce qui change dans `docs/conception.md` ou `.claude/rules/`), puis
supprimer la spec et le plan. Les numéros de décision continuent après D318.

## Environnement

- Windows : PowerShell et Git Bash. `core.autocrlf=true`.
- **L'agent ne lit pas le `.env`** (règle de permission) ; modèle : `.env.example`. Un worktree
  n'a donc pas de `.env` : prendre les valeurs factices de `.github/workflows/ci.yml` pour
  generate, build et test.
- **Neon** (MCP du plugin, pas de `.mcp.json`) : projet `late-bar-51472267`, branches
  `production` et `dev`. **Toute requête passe `database_name: "betterlift"`** : `neondb` porte
  encore la V1 et donne un état trompeur. Écrire en production demande l'accord de l'utilisateur.
- **Comptes de la branche `dev`** : `controle@better-lift.local` porte la démo, ne jamais le
  supprimer — réinitialiser son mot de passe par un hash `hashPassword` de `better-auth/crypto`
  écrit dans `account.password` (`providerId = 'credential'`). `e2e@better-lift.local` sert à
  Playwright (identifiants dans `apps/web/.env.e2e`). Créer un autre compte : relancer l'API avec
  `SIGNUP_ALLOWLIST=<adresse>`, `POST /api/auth/sign-up/email` avec
  `Origin: http://localhost:3000`, puis relancer sans la surcharge.
- **Context7** pour toute question de version d'une bibliothèque, plutôt que la mémoire.
- Le port 3001 peut être pris par un autre projet : ne pas tuer ce processus, demander.

## Pièges déjà payés

- **Dates** : découper dans le fuseau, **jamais en UTC** — le samedi 21 h à Paris est déjà
  dimanche en UTC. L'arithmétique civile vit dans `shared`.
- **Clés TanStack Query** : toute donnée de la clé de lecture doit être dans la clé invalidée à
  l'écriture, sinon l'écran garde les anciennes valeurs après un enregistrement réussi.
- **Formulaires** : tester `!data` sans l'état de chargement laisse le squelette pour toujours.
- **Versions fixées par Expo SDK 57** : TypeScript **6.0.3** et React **19.2.3** pour tout le
  monorepo ; `@types/react` épinglé en version exacte (`19.2.4`). Ne pas monter TypeScript en 7.
- **`TS2724 has no exported member` sur un symbole qui existe** : `.tsbuildinfo` périmé après des
  changements de branche. Reconstruire paquet par paquet, de bas en haut (`/verif` le détaille).
- **Client Prisma** : il suit la dernière branche installée, pas le schéma courant. Après un
  changement de branche autour d'une migration : `pnpm db:generate`.

## Skills

Installées en fichiers réels sous `.claude/skills/`, commitées ; **jamais de dossier `.agents/`**.
Une invocation par skill :

```
npx skills add <owner/repo> --skill <nom> --agent claude-code --copy -y
```

`--skill` attend le `name:` du frontmatter, pas le nom du dossier, et un mauvais nom échoue en
silence : vérifier `.claude/skills/` après coup. Biome et Knip excluent `.claude/`, le hook de
formatage `.claude/skills/` (sinon le hash de `skills-lock.json` diverge) : garder ces exclusions.
