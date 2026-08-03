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
├── routines.tsx           # liste, groupée par dossiers
├── routine/
│   ├── [id].tsx
│   └── edit/[id].tsx      # édition simplifiée
└── exercise/
    ├── new.tsx            # créer un exercice personnalisé
    └── [id].tsx
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

**Fait au 2026-08-02** : la grille de saisie, la coche, le chrono, la colonne « PRÉC. », le minuteur de repos, la sortie sans perte, et l'enregistrement. La séance se démarre depuis l'aperçu d'une routine.

**Fait au 2026-08-03** : la **séance libre** et l'**ajout d'un exercice en cours de séance**, tous deux servis par le sélecteur décrit ci-dessous.

**Pas encore** : le retour haptique et les notifications de fin de repos (`expo-haptics`, `expo-notifications` — deux modules natifs de plus, à ajouter quand le development build aura tourné) ; le balayage sur une série (`react-native-gesture-handler`), remplacé en attendant par un appui simple qui change de type et un appui long qui supprime — le geste destructeur est le plus difficile des deux, jamais celui qu'on déclenche en visant mal ; la barre persistante « Séance en cours » ; `expo-keep-awake`.

### Sélecteur d'exercices

Une modale posée sur la séance, qui partage la recherche, les filtres et la pagination du catalogue (`useExerciseSearch`) : seul l'effet d'un appui les distingue — ouvrir la fiche d'un côté, cocher de l'autre. Les mentions de copyright des médias (D17) vivent donc au même endroit pour les deux, une règle qu'on ne peut appliquer qu'une fois ne s'oubliant pas.

**La sélection est multiple et ordonnée.** On ajoute rarement un seul mouvement : une séance libre s'écrit en trois ou quatre exercices d'affilée, et valider un par un rouvrirait la liste autant de fois en perdant la recherche à chaque retour. La pastille porte le rang, pas une coche : c'est l'ordre d'entrée dans la séance, lisible tant qu'il est encore modifiable. La sélection tient à l'exercice et non à un index de liste, elle **survit donc au changement de filtre**.

**Le même exercice peut être ajouté deux fois** : l'enchaîner à deux charges différentes est un usage courant, et un ajout refusé sans explication ne se comprendrait pas à l'écran.

**L'ajout passe par le disque, comme le démarrage.** Le sélecteur relit le brouillon **après** l'appel réseau, y ajoute les exercices et le réécrit ; l'écran de séance reprend la version du disque en retrouvant le focus. Réécrire un brouillon capturé une requête plus tôt effacerait ce qui a été saisi entre-temps.

**Une séance libre démarre hors ligne** : sans exercice, il n'y a aucune performance passée à demander. Le chrono part au premier appui, avant le moindre choix — en salle, on commence l'échauffement puis on décide. Un exercice ajouté ouvre **une seule série vide** : la routine dit combien de séries prévoir, un ajout à la volée ne le dit pas, et « + Ajouter une série » recopie la précédente.

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

**Fait au 2026-08-02.** Le brouillon vit dans `src/features/workouts/draft-store.ts`, une seule clé (`draft/active`) : on ne fait pas deux séances en parallèle. Chaque mutation le réécrit, sans regroupement ni délai — étaler les écritures pour économiser quelques microsecondes rouvrirait exactement la fenêtre qu'on ferme.

Trois conséquences à connaître :

- **MMKV 4 casse l'API de la 3** : `createMMKV({ id })` et non `new MMKV()`, `remove()` et non `delete()`. La v4 est bâtie sur **Nitro Modules**, qui devient une dépendance de plus (voir [doc 10](10-versions.md)). Elle n'expose **pas** de config plugin, contrairement à ce que son `package.json` laisse croire : l'ajouter à `plugins` dans `app.json` fait échouer `expo export` sur une résolution ESM.
- **Le magasin s'ouvre paresseusement, et son échec est une information.** Sans MMKV — sur Expo Go —, le brouillon bascule en mémoire et `isDraftPersisted()` renvoie `false`, ce que l'écran de séance **affiche**. Le repli n'est pas silencieux : il ne tient pas la reprise après crash, et laisser croire le contraire serait la pire façon de l'apprendre. Ce mode dégradé sert à développer les autres écrans, jamais à s'entraîner pour de vrai.
- **Le brouillon passe par le disque, jamais par un paramètre de route.** « Démarrer cette routine » l'écrit puis navigue ; l'écran de séance le relit au montage, exactement comme il relirait une séance interrompue. Un seul chemin d'entrée, donc un seul à éprouver — et la reprise après crash cesse d'être un cas particulier. Le sélecteur d'exercices emprunte le même chemin, et l'écran de séance **relit le disque au retour du focus** dès que la version qui s'y trouve n'est pas la sienne. Le seul paramètre de route qui subsiste, `?fresh=1`, ne transporte pas le brouillon mais l'intention de l'entrée : commencer, et non reprendre — sans lui, l'écran annoncerait « séance reprise » à chaque démarrage, puisqu'il trouve toujours un brouillon déjà écrit.
- **Une séance en cours n'est jamais écrasée.** Si un brouillon existe, « Démarrer » devient « Reprendre la séance en cours ». Le cas arrive tout seul : on quitte l'écran par mégarde, on retombe sur ses routines, on appuie. Écraser silencieusement détruirait la seule donnée de l'app qui n'existe nulle part ailleurs.

**Reprise après crash.** Au démarrage, l'app cherche un brouillon actif ; s'il existe, elle propose de reprendre la séance. À tester explicitement en tuant l'app en cours de séance — c'est la garantie de confiance la plus importante du produit.

**File de synchronisation.** Les séances non envoyées sont rejouées à la reconnexion (`expo-network` + retry avec backoff exponentiel). L'idempotence par identifiant client (doc 04) rend un rejeu multiple inoffensif.

**Cache de lecture.** TanStack Query avec persistance MMKV : routines, catalogue d'exercices et dernières performances restent consultables hors ligne. Le catalogue est préchargé après la connexion — une salle en sous-sol n'a pas de réseau, et chercher un exercice doit rester possible.

**Périmètre du hors ligne en V1 :** créer et remplir une séance, consulter routines et historique récent. Hors périmètre : créer une routine hors ligne (rare, et le web est là pour ça).

## Autres écrans

### Accueil
Séance en cours (le cas échéant), routines épinglées avec un gros bouton « Démarrer », résumé de la semaine (séances, volume), dernière séance, bouton « Séance libre ».

### Routines
Liste par dossiers, aperçu d'une routine (exercices et séries cibles), démarrage. L'édition mobile est **volontairement simplifiée** : ajouter/supprimer un exercice, ajuster les séries. La construction sérieuse se fait sur le web.

**Fait :** la liste et l'aperçu. Le regroupement par dossier se fait côté client, la liste n'étant pas paginée — et les dossiers vides sont masqués ici, contrairement au web : on ne les gère pas depuis le mobile, les afficher n'ajouterait qu'une ligne morte sur un petit écran.

**Pas encore :** l'édition simplifiée (D9). Le démarrage, lui, est fait : l'aperçu porte « Démarrer la séance », qui devient « Reprendre la séance en cours » tant qu'un brouillon existe.

`ScrollView` et non `FlatList` : quelques dizaines de routines au plus, et un regroupement par dossier demanderait des sections là où une boucle suffit (même raisonnement que [D21](09-decisions.md)).

### Historique
Liste antéchronologique infinie, résumé par carte (nom, date, durée, volume, records). Détail identique au web.

### Exercices
Recherche, filtres par partie du corps et équipement, fiche avec GIF, instructions, records et historique personnel. Un sélecteur d'origine sépare le catalogue commun des exercices personnalisés.

**Le mobile crée et archive, il ne modifie pas.** Le besoin de terrain est de nommer sur place un mouvement que le catalogue ignore, entre deux séries ; retoucher un exercice existant se fait sur le web, qui est l'atelier. Éviter un second formulaire ici, c'est autant de saisie tactile en moins à soigner.

Les choix se font par pastilles et non par un sélecteur natif : `@react-native-picker/picker` serait un module natif de plus, et le development build n'a toujours pas tourné sur appareil (même raisonnement que [D21](09-decisions.md)).

L'archivage se confirme en place plutôt que par une `Alert.alert` : une boîte système, sur un écran qu'on consulte d'un pouce en salle, se valide par réflexe.

### Profil
Statistiques, réglages, unités, langue, déconnexion.

## Contraintes techniques

**Development build obligatoire.** Expo Go ne suffit pas : `expo-secure-store`, MMKV, les notifications et Better Auth exigent du natif. Prévoir `eas build --profile development` dès la V0, sinon le mobile décroche du reste du monorepo au premier module natif.

**Constaté le 2026-08-02, au premier lancement réel sur appareil.** Scanner le QR code de `expo start` avec **Expo Go** échoue : `Failed to get NitroModules`. Expo Go embarque un jeu fixe de modules natifs et ne peut charger ni MMKV ni Nitro. Le malentendu à dissiper une fois pour toutes : un development build n'est pas une éjection. On le construit **une fois**, on installe l'APK, et le quotidien redevient identique — `pnpm dev`, on scanne le même QR code avec sa propre app au lieu d'Expo Go, même fast refresh. On ne reconstruit qu'en ajoutant ou retirant un module natif.

Deux chemins, aucun `eas.json` n'existant encore :

| Commande | Ce qu'il faut | Durée |
|---|---|---|
| `eas build --profile development -p android` | un compte Expo gratuit, rien d'installé localement | ~15 min, dans le nuage |
| `npx expo run:android` | Android Studio + JDK sur la machine | ~10 min, en local |

Sur Windows sans Android Studio, EAS demande nettement moins de mise en place.

**Le monorepo impose une étape que la documentation d'Expo ne mentionne pas.** `@better-lift/core`, `@better-lift/validators` et `@better-lift/api-client` se résolvent vers leur `dist/`, produit par `tsc --build` et **gitignoré**. Le nuage clone le dépôt, installe les dépendances… et Metro ne trouve rien à résoudre. D'où le crochet `eas-build-post-install` dans `apps/mobile/package.json`, qui rejoue exactement la commande de la CI :

```
cd ../.. && pnpm exec turbo run build --filter=mobile^...
```

`mobile^...` construit les **dépendances** de l'app, pas l'app elle-même — elle n'a pas de tâche `build`.

Le profil `development` d'`eas.json` porte `developmentClient: true` et `buildType: "apk"` : un APK s'installe directement sur un téléphone, là où l'AAB de production passe obligatoirement par le Play Store.

`EXPO_PUBLIC_API_URL` n'est **pas** déclarée dans `eas.json`, et c'est voulu : un development build charge son JavaScript depuis le serveur Metro, donc la valeur qui compte est celle d'`apps/mobile/.env` sur la machine de développement au moment du `pnpm dev`. La figer à la construction donnerait une URL périmée au premier changement d'IP.

**Cycle de vie du SDK.** Un SDK Expo est supporté environ un an. Le 57 date de fin juin 2026, le 58 est attendu vers septembre/octobre. Planifier la montée de version plutôt que de la subir quand un correctif de sécurité l'imposera.

**Better Auth en mode bearer.** Le plugin `@better-auth/expo` (1.6.x) stocke le token dans `expo-secure-store` et l'ajoute aux requêtes. Il faut installer `expo-secure-store` **et** `expo-network`, et déclarer le scheme de l'app dans `trustedOrigins` côté serveur (`betterlift://`). Le rafraîchissement doit être géré dans l'intercepteur du client API, avec une file d'attente pour éviter les rafraîchissements concurrents.

Attention à une nuance de nommage : le plugin stocke la session sous forme d'en-tête `Cookie` complet et `getCookie()` renvoie cette chaîne, **pas** le jeton nu. `apps/mobile/src/lib/auth-client.ts` en extrait `better-auth.session_token` pour le passer en `Authorization: Bearer` à `packages/api-client`, ce que le plugin `bearer()` du serveur attend.

**URL d'API en développement.** `localhost` désigne le téléphone. Utiliser l'IP LAN via `EXPO_PUBLIC_API_URL`. À écrire dans le README, cette question revient systématiquement.

**Performance des listes.** `FlashList` (Shopify) dès qu'une liste monte en mémoire des centaines de lignes. Ce n'est **pas** le cas du catalogue, paginé par curseur : il reste en `FlatList`, voir [D21](09-decisions.md). Le jour où une liste non paginée apparaît, `FlashList` reprend sa place.

**Précision des nombres.** Les charges circulent en chaînes décimales. Ne jamais utiliser `parseFloat` pour un calcul métier : passer par les helpers de `packages/core`.

**Sécurité de session.** Déconnexion propre en cas de `401` (purge de SecureStore et du cache), pas de boucle de redirection.

## Publication

- **iOS** : Apple Sign-In obligatoire dès qu'un autre login social est proposé — c'est le cas, GitHub l'est (D26). Prévoir la politique de confidentialité et le formulaire App Privacy avant la première soumission.
- **Android** : Data Safety à remplir dans la Play Console.
- **EAS Update** pour les correctifs JavaScript sans revue de store — utile pour les bugs de saisie découverts en production.
- Canaux `preview` (interne) et `production`.

**En V0, `updates.enabled` est à `false` dans `app.json`** : `expo-updates` n'est pas installé, et laisser la clé absente revient à déclarer un OTA qui n'existe pas. À basculer en même temps que l'installation du paquet, au moment de la première distribution EAS.
