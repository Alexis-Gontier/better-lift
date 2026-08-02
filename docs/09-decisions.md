# 09 — Décisions

Toutes les décisions structurantes sont tranchées. Ce document sert de référence : si une question revient, la réponse est ici, avec sa raison. Une décision se change, mais explicitement, en modifiant cette page.

## Architecture

### D1 — Contrat d'API : `@hono/zod-openapi` (1.5.x)

Plutôt que Hono RPC. On obtient un contrat OpenAPI publiable et une doc Swagger gratuite, sans dégrader les temps de compilation TypeScript quand le routeur grossit. Zod v4 requis.

### D2 — Domaines : sous-domaine

`better-lift.app` pour le web, `api.better-lift.app` pour l'API. Cookies de session en `SameSite=Lax` sur le web, sans les contorsions de `SameSite=None; Secure`.

### D3 — Le web passe toujours par l'API

Aucun accès Prisma depuis les Server Components Next.js, même là où ce serait pratique. Règle sans exception : dès qu'on en accorde une, elle s'érode.

Bénéfice inattendu : le bug de résolution entre le générateur Prisma 7 et Turbopack ne nous touche pas, puisque `apps/web` n'importe jamais Prisma.

### D4 — Base : Neon, région UE

Les branches par PR valent leur poids pendant le développement. RGPD couvert par la région.

**Pas de repli Postgres local.** Le `docker-compose.yml` de la V0 a été retiré le 31 juillet 2026 : une branche Neon couvre les deux usages qui le justifiaient — isoler un essai, éprouver une migration — sans imposer d'entretenir une seconde base alignée sur la version distante. Ce qu'on perd, et qu'on assume : le développement hors ligne.

Concrètement : projet `better-lift` (`late-bar-51472267`), **Francfort `aws-eu-central-1`**, PostgreSQL 18, branche par défaut `production`. Francfort plutôt que Londres, hors UE depuis le Brexit et couvert par une décision d'adéquation révocable. À noter pour plus tard : le MCP Neon ne permet pas de choisir la région, et l'organisation sort en `us-east-1` par défaut — créer les projets depuis la console.

### D5 — Runtime API : Node 24

Pas Cloudflare Workers. Prisma 7 sur Workers ajoute une complexité sans contrepartie à ce stade.

### D19 — Outillage qualité : Biome, Lefthook, Knip

Numéro pris à la suite : les décisions ne sont jamais renumérotées, même quand une nouvelle rejoint une section antérieure.

**Biome remplace ESLint + Prettier.** Un binaire, un `biome.json` à la racine, plus de `packages/config/eslint` ni de configuration par package. Ce qu'on gagne : le passage complet tombe de quelques secondes à ~35 ms sur les 80 fichiers du dépôt, ce qui rend la tâche Turborepo `lint` inutile — `pnpm lint` appelle Biome directement, sans orchestration ni cache. Et le conflit chronique formateur/linter disparaît, les deux étant le même outil.

Ce qu'on perd, et qu'il faut accepter : pas de règles typées (`no-floating-promises` et consorts), pas d'`eslint-config-next`. Le typecheck et la CI couvrent l'essentiel du manque ; le domaine `types` de Biome, qui apporte l'inférence, est encore trop jeune pour qu'on s'appuie dessus.

L'interdiction d'importer Prisma hors de l'API (D3) est portée par `noRestrictedImports` dans un `overrides` de `biome.json`, appliqué à `apps/web` **et** `apps/mobile` — l'ancienne configuration ESLint ne couvrait que le web alors que la règle vaut pour les deux.

**Lefthook remplace husky + lint-staged.** Les deux rôles — poser les hooks, ne traiter que les fichiers indexés — tiennent dans un seul `lefthook.yml`, et `stage_fixed` réindexe ce que Biome a corrigé. Le pré-commit reste volontairement court : formatage, lint, `prisma format`. Pas de typecheck, c'est le rôle de la CI.

**Knip est ajouté**, il ne remplace rien. Il détecte dépendances, fichiers et exports morts — angle mort réel d'un monorepo, où une dépendance retirée d'un import reste dans le `package.json` pour toujours. Il tourne en CI, pas en pré-commit : trop lent, et sans intérêt sur un diff partiel. Un export volontairement conservé avant son premier usage se marque `@public` en JSDoc.

### D20 — E-mails transactionnels : Resend, derrière une interface d'un seul appel

Deux e-mails seulement en V1 — vérification d'adresse et réinitialisation de mot de passe — mais tous les deux sur le chemin critique du compte.

**Resend** plutôt que SES ou Postmark : mise en route en quelques minutes contre une demi-journée de configuration IAM, et un SDK qui ne réserve pas de surprise. Le volume attendu tient très largement dans l'offre gratuite.

Trois points à connaître avant d'y toucher :

- **Le SDK ne lève pas d'exception.** Il renvoie `{ data, error }`. Un `try/catch` seul laisse passer les échecs en silence — c'est le piège n°1 de leur propre documentation.
- **La clé d'idempotence porte le jeton, pas l'utilisateur.** Resend déduplique sur 24 h : une clé du type `reset-password/<userId>` ferait disparaître la seconde demande de réinitialisation d'une même personne, ce qui est exactement le cas où elle en a besoin.
- **Aucun envoi ne peut faire échouer la requête qui le déclenche.** Tout passe par `sendEmailSafely`, qui journalise et n'propage jamais. Deux raisons : la vérification est non bloquante par décision (D6), et sur `request-password-reset`, une erreur propagée répondrait 500 pour une adresse connue et 200 pour une inconnue — le formulaire deviendrait un oracle d'existence de comptes.

**Ce qui reste à trancher avant la production, et qui est le vrai point faible de ce choix :** Resend est une société américaine. Les adresses e-mail transitant chez elle sont des données personnelles, et l'hébergement UE est un objectif affiché (doc 01). Leur résidence des données en Europe existe mais n'est pas sur l'offre gratuite. **À vérifier et à arbitrer avant la mise en production**, au même titre que les conditions Gym visual (D17) — le repli étant un fournisseur européen, ce qui est précisément ce que l'interface à un seul appel de `apps/api/src/lib/mailer.ts` rend peu coûteux.

**Limitation assumée du rate limiting.** Les quotas d'authentification de la doc 04 sont appliqués par Better Auth avec un stockage **en mémoire**, donc par instance d'API. Suffisant tant qu'elle tourne sur un seul processus. Le jour où elle est répliquée, il faudra passer au stockage base (modèle `rateLimit` et migration) ou à un stockage secondaire — sans quoi le quota réel devient le quota multiplié par le nombre d'instances.

## Produit

### D6 — Vérification d'e-mail non bloquante en V1

L'e-mail part, l'accès n'est pas conditionné. La friction sur le premier parcours coûte plus que les faux comptes à ce stade. À rendre bloquant si l'abus apparaît.

**Mis en œuvre le 1er août 2026.** Concrètement : `emailVerification.sendOnSignUp: true` et `emailAndPassword.requireEmailVerification: false` — c'est la combinaison des deux qui fait la « vérification non bloquante », l'une sans l'autre donne soit un envoi qui enferme, soit un compte jamais vérifié. Corollaire à ne pas oublier : puisque rien n'oblige à confirmer, quelque chose doit le rappeler, sinon « non bloquant » revient en pratique à « jamais vérifié ». D'où le bandeau permanent du tableau de bord, avec renvoi de l'e-mail.

### D7 — La saisie de séance existe aussi sur le web

Dès la V1. L'API est déjà là, et ça couvre deux cas réels : corriger une séance mal saisie, et noter son entraînement depuis un ordinateur. Sans en faire un parcours mis en avant.

### D8 — Supersets : modèle en V1, interface en V2

`supersetGroup` est présent dès la première migration. L'affichage correct (alternance des exercices, repos partagé) est un vrai chantier d'UI qui n'a pas sa place dans le MVP. Avoir le champ dès le départ évite une migration de données plus tard.

### D9 — Édition de routine sur mobile : simplifiée

Ajouter/retirer un exercice, ajuster les séries. La construction sérieuse reste sur le web, c'est la raison d'être de l'app web.

### D10 — Modification d'une séance passée : autorisée, avec recalcul complet

Corriger une erreur de saisie est un besoin réel. Conséquence assumée : à chaque modification, les records de **tous les exercices touchés** sont recalculés intégralement depuis l'historique, pas ajustés à la marge. Un record peut donc être invalidé, ce qui impose de retrouver le second meilleur — d'où le recalcul complet plutôt qu'un correctif incrémental. Plus lent, mais correct, et l'opération est rare.

### D11 — 1RM : Epley

`1RM ≈ charge × (1 + reps / 30)`, appliqué pour 1 à 12 répétitions. Brzycki en option de réglage en V2.

### D12 — Poids de corps exclu du volume

Un exercice au poids de corps ne contribue pas au volume total, comme chez Hevy. Utiliser le poids de l'utilisateur rendrait le volume individuellement plus juste mais casserait toute comparaison dans le temps dès que le poids de corps varie — précisément la population qui prend ou perd du poids.

### D13 — Pas de programmes tout faits en V1

Bon pour l'activation des débutants, mais c'est du contenu à produire, traduire et maintenir. À réévaluer une fois qu'on saura où les nouveaux inscrits décrochent.

### D14 — Notes de séance : champ libre

Pas de champs structurés (sommeil, énergie, courbatures) tant qu'on n'a pas la preuve que les gens les remplissent.

### D15 — Social repoussé hors V2

Profils publics, abonnements, fil d'actualité : chantier majeur (modération, signalements, confidentialité, RGPD sur données publiées) pour un bénéfice incertain sur un produit d'abord personnel. Le modèle garde `Workout.visibility` et l'énumération `FOLLOWERS`, donc la porte reste ouverte sans coût aujourd'hui.

## Business & juridique

### D16 — Application gratuite, sans limite

Pas de plan, pas d'abonnement, pas de table de facturation en V1 ni V2. Décision à revisiter, mais tant qu'elle tient, ne pas modéliser par anticipation ce qui n'existe pas.

### D17 — Médias Gym visual : conservés avec attribution, à revoir avant toute monétisation

Les métadonnées et les instructions sont sous MIT, sans problème. **Les images et GIF sont © Gym visual**, redistribués avec autorisation dans le dépôt source.

Tant que l'app est gratuite, on conserve les médias en affichant l'attribution `© Gym visual — https://gymvisual.com/` partout où ils apparaissent. **Le jour où une monétisation est envisagée, ce point redevient bloquant** : il faudra acquérir sa propre licence auprès de Gym visual, ou retirer les médias.

Le modèle de données est prêt pour ce scénario : `thumbnailUrl` et `animationUrl` sont nullables, et `attribution` est stocké en base précisément pour que l'obligation d'affichage ne puisse pas être oubliée. Ne pas construire d'interface qui suppose la présence d'un visuel.

À faire malgré tout dès maintenant : lire les conditions de Gym visual pour vérifier que « gratuit » suffit à leurs yeux. C'est une demi-heure de lecture contre un risque non chiffré.

### D18 — Rétention : suppression immédiate

Un compte supprimé disparaît en base immédiatement, en cascade réelle (pas un drapeau). Les sauvegardes sont purgées sous 30 jours. Export JSON à la demande.

### D21 — Listes mobiles : `FlatList` tant que la pagination suffit

La [doc 06](06-app-mobile.md) prescrivait `FlashList` pour le catalogue, au motif de ses 1 324 exercices. Le motif ne tient pas : la liste est **paginée par curseur**, vingt lignes à la fois, et rien ne monte jamais le catalogue entier en mémoire. Sur ce volume, `FlatList` est indistinguable.

Ce qu'on évite en attendant : un module natif de plus dans une application dont le **development build n'a toujours pas tourné sur appareil**. Chaque dépendance native ajoutée avant cette vérification allonge la liste des suspects le jour où le build échouera.

Le jour où une liste non paginée apparaît — l'historique complet, le sélecteur d'exercices d'une séance en cours —, ou si le défilement se dégrade à la mesure, `FlashList` reprend sa place. La décision est donc un report, pas un renoncement.

### D22 — Un exercice personnalisé se reconnaît à son propriétaire, pas à un booléen

La [doc 03](03-modele-de-donnees.md) prévoyait deux colonnes sur `Exercise` : `ownerId` et `isCustom`. La seconde a été écartée à la migration.

Un booléen qui double une clé étrangère est une invitation à la contradiction : rien n'empêche `isCustom = false` avec un `ownerId` renseigné, et la ligne devient alors invisible d'un côté, modifiable de l'autre, selon la colonne que le code interroge. Ce sont des incohérences qui ne se voient qu'en production, sur les seules lignes concernées.

`ownerId IS NULL` dit exactement la même chose, sans possibilité d'écart. Le champ `isCustom` reste dans la réponse de l'API — c'est le contrat, et il est plus lisible qu'un identifiant de propriétaire côté client — mais il est **calculé**, jamais stocké.

L'index composite `[isCustom, isArchived]` disparaît avec la colonne. `[ownerId]` le remplace : c'est lui que sert la clause de visibilité présente sur chaque lecture, et Postgres indexe les `NULL`, donc le cas « catalogue commun » en profite aussi.

### D23 — Un seul chemin pour les records : le recalcul complet, même à l'ajout

La [doc 03](03-modele-de-donnees.md) distinguait deux traitements : les records sont « recalculés à la fin d'une séance » (invariant 5) et une correction déclenche « un recalcul intégral » (invariant 7). Le premier suggère un ajustement incrémental — comparer les séries qui arrivent au record en place —, le second une reconstruction depuis l'historique.

**Les deux passent désormais par la reconstruction.** L'ajustement incrémental sait ajouter un record, jamais en retirer un : il n'a aucun moyen de connaître le second meilleur. Il faut donc de toute façon écrire le chemin complet pour les corrections et les suppressions. Garder les deux, c'était entretenir un chemin rapide et un chemin correct sur la même donnée, avec la certitude qu'ils finiraient par ne plus dire la même chose — et que l'écart n'apparaîtrait que sur les comptes ayant corrigé une séance.

Le coût redouté n'existe pas à cette échelle. La reconstruction ne lit que les séries des **exercices touchés** par l'écriture, pas tout l'historique : pour une séance de huit exercices, c'est huit lectures d'index sur `WorkoutExercise[exerciseId]`, quelques milliers de lignes après des années de pratique, une fois par séance enregistrée. La transaction reste sous la seconde en pratique ; son budget est relevé à 20 s pour absorber une base distante, échouer après coup revenant à perdre une séance réelle.

Ce qui distingue encore les appels est un paramètre, pas un chemin : l'ajout et la correction **créditent** la séance écrite et renvoient ses `newRecords`, la suppression ne crédite personne.

## Actions à mener (pas des décisions)

- [ ] **Nom et disponibilité** : vérifier le domaine `better-lift.app`, les identifiants App Store et Play Store, et l'absence de conflit de marque.
- [ ] **Conditions Gym visual** : lire, et trancher définitivement (voir D17).
- [ ] **Apple Developer + Google Play** : comptes à ouvrir tôt, les vérifications d'identité prennent parfois plusieurs semaines.
- [ ] **Politique de confidentialité et CGU** : à publier avant la mise en production.

## Points à valider techniquement en V0

Trois choses qui échouent souvent. Mieux vaut les découvrir maintenant qu'en V1, quand elles bloqueront une fonctionnalité attendue.

1. **pnpm 11 + Expo SDK 57 + Metro.** Les packages du workspace se résolvent-ils depuis `apps/mobile` sans `node-linker=hoisted` ? Tester avant d'activer le contournement.
2. **Better Auth 1.6 partagé web + mobile.** Une seule instance qui sert les cookies (web) et les bearer tokens (Expo) sans configuration divergente.
3. **Prisma 7 en monorepo ESM.** Générateur `prisma-client` avec `output`, `prisma.config.ts`, driver adapter, et `"type": "module"` — le tout consommé proprement par `apps/api`.

Ajouter à ces trois : **`packages/core` importé par les trois applications**, Metro compris.

### Résultats (31 juillet 2026)

| Point                          | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — pnpm 11 + Metro            | ✅ **Aucun `node-linker=hoisted` nécessaire**, mais la validation demande deux bundles distincts, pas un. Le bundle de **production** (`expo export`) embarque bien `@better-lift/core` et `@better-lift/api-client` (1 393 modules). Le bundle de **développement** est un chemin différent : il injecte le client HMR en remplaçant `react-native/Libraries/Utilities/HMRClient.js` par `expo/src/async-require/hmr.ts`, une résolution inter-paquets que l'export ne fait jamais. Il a échoué une fois (`Resolution of expo/src/async-require/hmr.ts failed`) juste après le renommage des paquets d'applications, et ne s'est plus reproduit après un `pnpm install` complet — l'arbre de liens pnpm était vraisemblablement resté incohérent. **Réflexe en cas de retour : relancer `pnpm install` d'abord ; `node-linker=hoisted` reste le filet de sécurité documenté.** Configuration Metro monorepo requise dans les deux cas : `watchFolders` sur la racine et `nodeModulesPaths` incluant le store racine (`apps/mobile/metro.config.js`). Le job CI de bundle couvre la production ; le mode dev, lui, ne se vérifie qu'à la main. |
| 2 — Better Auth partagé        | ✅ **Validé le 31 juillet 2026 par un spike, côté web.** Une instance unique dans `apps/api/src/lib/auth.ts` sert `/api/auth/*`. Le web sur `:3000` en obtient un cookie `better-auth.session_token` en `HttpOnly; SameSite=Lax; Max-Age=604800`, et ce cookie remonte jusqu'à une route applicative protégée : `GET /v1/me` répond 401 sans session, 200 avec, y compris après rechargement complet de la page. Deux conditions non évidentes : `credentials: "include"` côté client — sans quoi le navigateur n'émet rien, en silence — et l'origine web dans `trustedOrigins`, sinon Better Auth rejette au contrôle CSRF. **Versant mobile, ajouté le même jour** : les plugins `expo()` et `bearer()` rejoignent la même instance, et le scheme `betterlift://` les `trustedOrigins`. Vérifié hors navigateur : une connexion émise depuis l'origine `betterlift://` renvoie un en-tête `set-auth-token`, et ce jeton présenté en `Authorization: Bearer` sur `GET /v1/me` — **sans le moindre cookie** — renvoie 200 et le même utilisateur que la session web. Un jeton absent ou invalide renvoie 401. C'est le cœur du risque : une seule configuration, deux transports.

**Ce qui n'est toujours pas vérifié** : l'exécution sur appareil. `expo-secure-store` et le retour de redirection OAuth par deep link exigent un development build, impossible à produire ici. Le client Expo est écrit et il compile — `tsc` et le bundle Metro passent —, mais il n'a jamais tourné. À reprendre au premier development build.                                                                                                                                                                                                                                                                                 |
| 3 — Prisma 7 ESM               | ✅ Validé, avec deux pièges non documentés en amont — voir [doc 10](10-versions.md) : `@prisma/client` reste une dépendance obligatoire, et `prisma.config.ts` ne doit pas exiger `DATABASE_URL` sous peine de casser `generate` en CI.                                                                                                                                                                                                      |
| 4 — `core` dans les trois apps | ✅ Validé : consommé par l'API (`/v1/version`), le web (Server Component) et le mobile (présent dans le bundle Metro).                                                                                                                                                                                                                                                                                                                       |
