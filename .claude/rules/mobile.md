---
paths:
  - "apps/mobile/**"
---

# Mobile

Ce fichier ne décrit pas les écrans (ils peuvent changer) : seulement les contraintes et les
pièges qui ont déjà coûté.

## Lancer (Expo Go)

Une seule dépendance native hors SDK, notify-kit, absente d'Expo Go : la notification de repos
ne s'y montre pas, le reste tourne dans **Expo Go** (d'où AsyncStorage plutôt que MMKV).

```
npx expo start                      # depuis apps/mobile
adb reverse tcp:8081 tcp:8081
adb reverse tcp:3001 tcp:3001
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

- Par l'IP du réseau local, Expo Go affiche un ancien bundle en cache (« Cannot connect to Expo
  CLI »). En `CI=1`, Metro ne surveille pas les fichiers : le relancer après chaque modification.
- `expo run:android` est bloqué sur cette machine (chemins pnpm trop longs pour CMake) : les
  builds natifs passent par **EAS**, l'émulateur (`better-lift`) ne sert qu'à exécuter. Icônes,
  écran de démarrage et notifications ne se voient que dans un build EAS.
- Dépendance Expo ou React Native : `npx expo install <paquet>`, jamais une version de mémoire.
  Metro lancé AVANT l'installation ne voit pas le paquet (« Unable to resolve ») : le relancer
  avec `--clear`.
- Livraison (EAS, `eas update`) : voir `docs/deploiement.md`.

## Système

- **Le code neuf passe par React Native Reusables sur Uniwind** : composants dans
  `components/ui/` (ajoutés par `npx @react-native-reusables/cli@latest add <nom>
  --styling-library uniwind`), `cn` de `lib/utils.ts`, classes de tokens (`bg-background`,
  `text-muted-foreground`…). Les tokens vivent dans `global.css` (`@variant light` /
  `@variant dark`) : **jamais de couleur en dur**.
- **`className` ne marche que sur les composants de React Native.** Un composant tiers passe
  par `withUniwind`. Une couleur hors `style` (`placeholderTextColor`, `color` d'un
  `ActivityIndicator`…) passe par `{prop}ClassName="accent-…"` ; une couleur lue en JS, par
  `useCSSVariable`. Le registre Reusables peut viser une version antérieure d'Uniwind :
  `typecheck` le dit.
- **Metro ne relit `global.css`, les alias `@/` du `tsconfig` ni une dépendance ajoutée qu'au
  démarrage** : relancer avec `--clear`. Expo Go garde alors l'ancien bundle : `force-stop` puis
  le lien `exp://127.0.0.1:8081` deux fois. **Une classe jamais écrite ailleurs** (`w-8`,
  `ml-auto`…) n'est pas générée non plus avant ce redémarrage : sans effet, en silence. Pour ne
  pas couper `pnpm dev`, un second Metro : `npx expo start --port 8082 --clear`, `adb reverse
  tcp:8082 tcp:8082`, lien `exp://127.0.0.1:8082`.
- **Thème** appliqué par `Uniwind.setTheme` **et** `Appearance.setColorScheme` (composants
  natifs, barre d'état).
- Cible de 48 au minimum ; un titre porte `accessibilityRole="header"`. La taille du texte du
  système est suivie, sauf dans les éléments de hauteur fixe, plafonnés par
  `maxFontSizeMultiplier`.
- **Jamais `Alert.alert`** : l'alerte native reste blanche en sombre et ne distingue pas le
  danger (`lib/confirmation.tsx`). Sous Android, le contenu d'un `Modal` porte sa propre
  `GestureHandlerRootView`. `PortalHost` est posé à la racine : menus et fenêtres de Reusables
  s'y rendent.
- **États** : `Chargement`, `Erreur`, `Vide` (`components/ui/etats.tsx`) ; une attente de moins
  d'une seconde n'affiche rien. Le mobile n'a pas de `?etat=` : forcer `true ||` sur la
  condition le temps d'une capture.
- Les images du catalogue sont détourées sur blanc : fond `bg-white` dans les deux thèmes.
- L'écran de secours (`ErrorBoundary`) ne lit aucun contexte de l'app.

## Navigation

- Le `_layout` de `(connecte)` porte la garde de session ; les écrans poussés par-dessus les
  onglets sont hors de la garde, sur la pile racine.
- Une pile qui déclare ses écrans prend le premier pour route initiale : `(connecte)` est
  déclaré en tête dans `app/_layout.tsx`, sinon l'app s'ouvre sur une modale.
- **Revenir à l'accueil : `router.dismissTo("/")`**, jamais `replace("/")`, qui empile un
  second accueil (le retour y menait).
- **Rafraîchir une liste : `useTirerPourRafraichir`** (`lib/rafraichir.ts`), jamais
  `refreshing={isRefetching}` : sous Android, le rond d'une relecture de fond restait figé.
- Sous Android, un fond ajouté à une vue déjà affichée perd son arrondi : monter le fond et
  jouer sur l'opacité. Une marge posée sur une vue bordée mange sa bordure du bas : préférer
  un padding autour.

## Séance

- **Le disque d'abord.** Tout changement écrit le brouillon (`better-lift:seance-en-cours`) ;
  démarrer relit le disque à l'appui ; terminer met en file AVANT d'effacer le brouillon. La
  logique vit dans `shared` (`seance.ts`, `file-envoi.ts`, `pave.ts`, `supersets.ts`) ; le mobile
  garde le disque et les écrans.
- **Une relecture du brouillon n'écrase jamais un changement survenu pendant qu'elle lisait**
  (compteur d'écritures de `lib/seance.tsx`).
- Un rappel de modale qui attend applique son choix à la séance **du moment** (`useRef`), pas à
  celle capturée à l'ouverture.
- **Toute écriture de l'écran passe par `changer(f)`** (`app/seance.tsx`), qui part de
  `courante.current` : la fin de saisie et la coche arrivent dans la même frame, la seconde
  écraserait la première.
- **Saisie au clavier du système** (`Input`, `decimal-pad` / `number-pad`) :
  - ce qu'une case montre vient de `valeurAffichee` (`shared`) ;
  - `selectTextOnFocus` plutôt qu'une `selection` contrôlée, qui arrive trop tard au premier
    toucher ;
  - **rien ne change le style d'une case pendant la frappe** : sous Android, ça relance la
    sélection de tout ;
  - la valeur s'écrit à `onEndEditing`, **lue dans l'événement** (`nativeEvent.text`, l'état
    peut manquer le dernier chiffre) ;
  - **quitter l'écran clavier ouvert ne passe pas par `onEndEditing`** : la saisie en attente
    s'écrit au démontage de la case ;
  - cocher ferme le clavier d'abord (`Keyboard.dismiss`) ; hors édition, un `Pressable` couvre
    la case pour que le défilement qui part d'elle défile.
- **Éprouver la saisie** : l'AVD `better-lift` garde `hw.keyboard=yes` et l'émulateur porte
  `settings put secure show_ime_with_hard_keyboard 1`, sans quoi Android cache le pavé virtuel.
- **Notification de repos** : `lib/notification-repos.ts` avec `react-native-notify-kit`
  (module natif chargé par `require` seulement sous Android hors Expo Go) ; contenu et effet des
  boutons dans `shared/notif-repos.ts`. Service et boutons s'enregistrent dans `index.ts`,
  avant l'app. Ne s'éprouve que sur un build EAS ; le volet des notifications n'est pas lisible
  par `describe` : taper d'après une capture.
- **Vibrations** : toujours par `lib/vibrations.ts`, jamais `expo-haptics` en direct (le réglage
  les coupe toutes là).
- Une séance envoyée invalide `["seances"]`.

## Hors ligne

- Cache TanStack Query persistant (`lib/hors-ligne.ts`), **filtré** par `gardeHorsLigne`. Une
  nouvelle lecture utile hors ligne s'y ajoute explicitement. Forme d'une réponse persistée
  changée : monter `buster` dans `app/_layout.tsx`.
- **Jamais `fetchQuery` nu dans un chemin de salle** : hors ligne, il se met en pause et l'appui
  ne rend jamais la main (lire sous délai).
- **Une lecture sans réseau se met en pause** : tout écran de données traite
  `isPending && fetchStatus === "paused"` et montre sa donnée avant l'erreur (`isError && !data`).
- La garde de session ne redirige que sur une absence confirmée : une erreur de lecture laisse
  passer si un cookie de session est gardé.
- **Éprouver** : Expo Go ne démarre pas à froid en mode avion. Couper le réseau app ouverte
  (`adb shell cmd connectivity airplane-mode enable`), puis menu de dev → Reload. Le démarrage à
  froid hors ligne ne se vérifie que sur l'APK. `uiautomator dump` échoue sur l'écran de séance
  (le chrono) : passer par des captures.

## Pièges

- **Après `signIn`, relire la session avant de naviguer** (`await refetch()`) : sinon la garde
  la lit encore absente et renvoie à une connexion vide.
- **Cookie de session** : `authClient.getCookie()` est ASYNCHRONE. Sans `await` dans l'en-tête,
  chaque requête part sans session.
- **Metro et les paquets du dépôt** : `packages/*` s'importe en `./x.js`, que Metro ne résout pas
  seul — `metro.config.js` essaie la variante `.ts`.
- Sur une icône `lucide-react-native`, `style` est ignoré : la rotation se pose sur une `View`
  parente.
- **Dette connue** : l'avertissement « error during concurrent rendering » au démarrage. React
  s'en remet seul.
