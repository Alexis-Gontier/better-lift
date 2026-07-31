# 06 — Application mobile

Expo SDK 57 (React Native 0.86) + Expo Router. Le mobile est **l'outil de terrain** : une main, quelques secondes entre deux séries, parfois sans réseau. Tout le reste est secondaire face à la qualité de la saisie de séance.

## Navigation

```
app/
├── (auth)/
│   ├── login.tsx
│   └── signup.tsx
├── (tabs)/
│   ├── index.tsx          # Accueil
│   ├── routines.tsx       # Routines
│   ├── history.tsx        # Historique
│   ├── exercises.tsx      # Exercices
│   └── profile.tsx        # Profil
├── workout/
│   ├── active.tsx         # séance en cours (plein écran)
│   └── [id].tsx           # détail d'une séance passée
├── routine/
│   ├── [id].tsx
│   └── edit/[id].tsx      # édition simplifiée
└── exercise/[id].tsx
```

Cinq onglets, dont un seul compte vraiment. **Une barre persistante « Séance en cours »** flotte au-dessus des onglets tant qu'une séance est active : le chrono reste visible et un tap ramène à l'écran de saisie. Sans elle, l'utilisateur qui consulte une fiche exercice perd le fil de sa séance.

## Écran de séance active

C'est l'écran qui fait ou défait le produit.

```
┌─────────────────────────────────┐
│ ✕   Push A          42:18   ✓   │
├─────────────────────────────────┤
│ Développé couché barre      ⋯   │
│                                 │
│  #   PRÉC.     KG    REPS   ✓   │
│  É   —        40     10     ☑   │
│  1   100×5   [100]  [ 5 ]   ☑   │
│  2   100×5   [100]  [ 5 ]   ☐   │
│  3   100×5   [   ]  [   ]   ☐   │
│  + Ajouter une série            │
│                                 │
│ Développé militaire         ⋯   │
│  …                              │
│                                 │
│ + Ajouter un exercice           │
├─────────────────────────────────┤
│      Repos  1:47   [-15] [+15]  │
└─────────────────────────────────┘
```

### Ce qui doit être irréprochable

**La colonne « PRÉC. »** affiche la performance de la dernière séance sur cet exercice. C'est le repère qui permet de décider de sa charge sans réfléchir, et le champ de saisie est **pré-rempli** avec cette valeur. Dans le cas nominal, l'utilisateur ne tape rien : il coche.

**La coche valide la série** et déclenche le minuteur de repos. Un seul geste. Retour haptique à la validation (`expo-haptics`) — en salle, on ne regarde pas toujours l'écran.

**Le clavier numérique** avec `inputMode="decimal"`, et une barre d'accessoire portant `Suivant` / `Terminé` pour circuler entre les champs sans fermer le clavier. La liste défile automatiquement pour que le champ actif reste au-dessus du clavier.

**Le minuteur de repos** est affiché en bas en permanence, ajustable par ±15 s, avec notification locale quand il expire (utile quand l'écran s'éteint ou que l'utilisateur bascule sur une autre app).

**Le chrono de séance** est calculé depuis `startedAt`, jamais incrémenté par un `setInterval` — sinon il dérive dès que l'app passe en arrière-plan.

**L'écran reste allumé** pendant la séance (`expo-keep-awake`), avec une option pour désactiver.

**Balayage sur une série** : supprimer à gauche, changer de type (échauffement / dégressive / à l'échec) à droite.

**Un long appui sur une série** ouvre le sélecteur de type. Le menu `⋯` de l'exercice permet de remplacer l'exercice, régler le repos, ajouter des notes, réordonner, supprimer.

**Sortie sans perte.** `✕` ne quitte jamais : il propose « Reprendre plus tard » ou « Abandonner la séance ». Une séance abandonnée par erreur est un incident grave du point de vue de l'utilisateur.

## Persistance et hors ligne

La séance active est une machine à états locale. Le réseau n'intervient qu'à la fin.

```
Démarrage → brouillon écrit en MMKV (synchrone, à chaque mutation)
          → chaque modification réécrit le brouillon
Fin       → POST /v1/workouts (id généré localement)
          → succès : brouillon supprimé, historique invalidé
          → échec  : brouillon marqué « à synchroniser », file de retry
```

**MMKV plutôt qu'AsyncStorage** : les écritures sont synchrones, donc aucune fenêtre de perte si l'app est tuée entre deux séries.

**Reprise après crash.** Au démarrage, l'app cherche un brouillon actif ; s'il existe, elle propose de reprendre la séance. À tester explicitement en tuant l'app en cours de séance — c'est la garantie de confiance la plus importante du produit.

**File de synchronisation.** Les séances non envoyées sont rejouées à la reconnexion (`expo-network` + retry avec backoff exponentiel). L'idempotence par identifiant client (doc 04) rend un rejeu multiple inoffensif.

**Cache de lecture.** TanStack Query avec persistance MMKV : routines, catalogue d'exercices et dernières performances restent consultables hors ligne. Le catalogue est préchargé après la connexion — une salle en sous-sol n'a pas de réseau, et chercher un exercice doit rester possible.

**Périmètre du hors ligne en V1 :** créer et remplir une séance, consulter routines et historique récent. Hors périmètre : créer une routine hors ligne (rare, et le web est là pour ça).

## Autres écrans

### Accueil
Séance en cours (le cas échéant), routines épinglées avec un gros bouton « Démarrer », résumé de la semaine (séances, volume), dernière séance, bouton « Séance libre ».

### Routines
Liste par dossiers, aperçu d'une routine (exercices et séries cibles), démarrage. L'édition mobile est **volontairement simplifiée** : ajouter/supprimer un exercice, ajuster les séries. La construction sérieuse se fait sur le web.

### Historique
Liste antéchronologique infinie, résumé par carte (nom, date, durée, volume, records). Détail identique au web.

### Exercices
Recherche, filtres par partie du corps et équipement, fiche avec GIF, instructions, records et historique personnel.

### Profil
Statistiques, réglages, unités, langue, déconnexion.

## Contraintes techniques

**Development build obligatoire.** Expo Go ne suffit pas : `expo-secure-store`, MMKV, les notifications et Better Auth exigent du natif. Prévoir `eas build --profile development` dès la V0, sinon le mobile décroche du reste du monorepo au premier module natif.

**Cycle de vie du SDK.** Un SDK Expo est supporté environ un an. Le 57 date de fin juin 2026, le 58 est attendu vers septembre/octobre. Planifier la montée de version plutôt que de la subir quand un correctif de sécurité l'imposera.

**Better Auth en mode bearer.** Le plugin `@better-auth/expo` (1.6.x) stocke le token dans `expo-secure-store` et l'ajoute aux requêtes. Il faut installer `expo-secure-store` **et** `expo-network`, et déclarer le scheme de l'app dans `trustedOrigins` côté serveur (`betterlift://`). Le rafraîchissement doit être géré dans l'intercepteur du client API, avec une file d'attente pour éviter les rafraîchissements concurrents.

Attention à une nuance de nommage : le plugin stocke la session sous forme d'en-tête `Cookie` complet et `getCookie()` renvoie cette chaîne, **pas** le jeton nu. `apps/mobile/src/lib/auth-client.ts` en extrait `better-auth.session_token` pour le passer en `Authorization: Bearer` à `packages/api-client`, ce que le plugin `bearer()` du serveur attend.

**URL d'API en développement.** `localhost` désigne le téléphone. Utiliser l'IP LAN via `EXPO_PUBLIC_API_URL`. À écrire dans le README, cette question revient systématiquement.

**Performance des listes.** `FlashList` (Shopify) pour le catalogue de 1 324 exercices. Une `FlatList` classique tient, mais le défilement est perceptiblement moins fluide.

**Précision des nombres.** Les charges circulent en chaînes décimales. Ne jamais utiliser `parseFloat` pour un calcul métier : passer par les helpers de `packages/core`.

**Sécurité de session.** Déconnexion propre en cas de `401` (purge de SecureStore et du cache), pas de boucle de redirection.

## Publication

- **iOS** : Apple Sign-In obligatoire si Google Sign-In est proposé. Prévoir la politique de confidentialité et le formulaire App Privacy avant la première soumission.
- **Android** : Data Safety à remplir dans la Play Console.
- **EAS Update** pour les correctifs JavaScript sans revue de store — utile pour les bugs de saisie découverts en production.
- Canaux `preview` (interne) et `production`.

**En V0, `updates.enabled` est à `false` dans `app.json`** : `expo-updates` n'est pas installé, et laisser la clé absente revient à déclarer un OTA qui n'existe pas. À basculer en même temps que l'installation du paquet, au moment de la première distribution EAS.
