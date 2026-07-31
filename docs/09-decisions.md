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

### D5 — Runtime API : Node 24
Pas Cloudflare Workers. Prisma 7 sur Workers ajoute une complexité sans contrepartie à ce stade.

## Produit

### D6 — Vérification d'e-mail non bloquante en V1
L'e-mail part, l'accès n'est pas conditionné. La friction sur le premier parcours coûte plus que les faux comptes à ce stade. À rendre bloquant si l'abus apparaît.

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
