---
description: Vérifie tout le dépôt — build, typecheck, tests, lint, knip
allowed-tools: Bash, Read, Edit, Glob, Grep
---

Vérifie l'état du dépôt en lançant la chaîne complète, **dans cet ordre**, et en t'arrêtant
au premier échec pour le corriger avant de continuer :

1. `pnpm build`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm lint`
5. `pnpm knip`

Rends compte fidèlement : si quelque chose échoue, montre la sortie réelle plutôt que de la
résumer. Ne déclare jamais « tout est vert » sans avoir vu les cinq étapes passer.

**Si `typecheck` ou `build` échoue sur un `TS2724 : has no exported member` visant un symbole
qui existe bel et bien dans la source**, ce n'est pas une vraie erreur : c'est un `.tsbuildinfo`
périmé après des changements de branche. `turbo --force` ne suffit pas, il relance la tâche sans
toucher à l'incrémental de TypeScript. Le remède est paquet par paquet et **de bas en haut** :

```
pnpm --filter @better-lift/shared exec tsc --build --force
pnpm --filter @better-lift/api-client exec tsc --build --force
```

Sinon l'erreur remonte simplement d'un cran.
