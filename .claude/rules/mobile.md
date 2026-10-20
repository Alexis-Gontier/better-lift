---
paths:
  - "apps/mobile/**"
---

# Mobile

Écrans depuis D316 : l'accueil (routines à lancer, séance vide), la séance (avec choix et
réorganisation des exercices), la fin, le Profil, la connexion. Le mobile est repris en
wireframe en trois lots (spec `docs/superpowers/specs/2026-10-20-mobile-wireframe-design.md`).
Décisions : `docs/decisions.md`.

## Lancer (Expo Go)

Aucune dépendance native hors SDK : le mobile tourne dans **Expo Go** (d'où AsyncStorage, D55).

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

## Système (D316)

- **Le code neuf passe par React Native Reusables sur Uniwind** : composants dans
  `components/ui/` (ajoutés par `npx @react-native-reusables/cli@latest add <nom>
  --styling-library uniwind`), `cn` de `lib/utils.ts`, classes de tokens (`bg-background`,
  `text-muted-foreground`, `border-border`…). Les tokens vivent dans `global.css` (palette
  `neutral`, `@variant light` / `@variant dark`) : **jamais de couleur en dur**. Police système.
- **`className` ne marche que sur les composants de React Native.** Un composant tiers passe
  par `withUniwind` (`Ecran` = `SafeAreaView` de `components/ui/ecran.tsx`). Une couleur hors
  `style` (`placeholderTextColor`, `color` d'un `ActivityIndicator`…) passe par
  `{prop}ClassName="accent-…"`. Le registre Reusables peut viser une version antérieure
  d'Uniwind (le `placeholderClassName` de `input.tsx` a dû être corrigé) : `typecheck` le dit.
- **Metro ne relit `global.css`, les alias `@/` du `tsconfig` ni une dépendance ajoutée qu'au
  démarrage** : relancer avec `--clear`. Expo Go garde alors l'ancien bundle : `force-stop` puis
  le lien `exp://127.0.0.1:8081` deux fois.
- **L'ancien thème est provisoire** : `lib/theme.ts` (`creerStyles`, `useCouleurs`) et
  `lib/palette.ts`, passés au gris, ne servent plus qu'à la séance, la fin et le Profil jusqu'à
  leur réécriture (lots 2 et 3). Ne pas l'étendre. `palette.test.ts` tient les contrastes et
  l'absence de teinte.
- **Thème** : Système · Sombre · Clair, gardé sur le téléphone (`lib/theme-choix.ts`), appliqué
  par `Uniwind.setTheme` ET `Appearance.setColorScheme` (l'ancien thème lit `useColorScheme`).
- Cible de 48 au minimum ; un titre porte `accessibilityRole="header"`.
- **Questions et menus : `useConfirmer` / `useFeuille` / `useInformer`** (`lib/confirmation.tsx`),
  jamais `Alert.alert` : l'alerte native reste blanche en sombre et ne distingue pas le danger.
  Toute feuille se ferme en glissant vers le bas ; sous Android, le contenu d'un `Modal` porte
  sa propre `GestureHandlerRootView`.
- **États** : `Chargement`, `Erreur`, `Vide` (`components/ui/etats.tsx`) ; une attente de moins
  d'une seconde n'affiche rien.
- **Taille du texte du système** suivie partout, sauf dans les éléments de hauteur fixe de la
  séance, plafonnés par `maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}`.
- **Écran de secours** : `ErrorBoundary` exporté par `app/_layout.tsx` et `app/seance.tsx`
  (`components/ui/ecran-erreur.tsx`) ; il ne lit aucun contexte de l'app.
- `PortalHost` est posé à la racine : les menus et fenêtres de Reusables s'y rendent.

## Navigation (D316)

- **Un seul accueil, sans onglets** : `app/(connecte)/index.tsx`. « Séance vide » en tête, la
  liste des routines (l'appui lance la séance par `lib/demarrer.ts`), le Profil par l'icône de
  l'en-tête (`/profil`), le bandeau « Reprendre » (`components/bandeau-seance.tsx`) en bas.
- Le `_layout` de `(connecte)` porte la garde de session et `PreparerHorsLigne`. `seance`,
  `fin`, `choisir-exercices`, `reorganiser` sont hors de la garde.
- Une pile qui déclare ses écrans prend le premier pour route initiale : `(connecte)` est
  déclaré en tête dans `app/_layout.tsx`, sinon l'app s'ouvre sur une modale.

## Séance

- **Le disque d'abord.** Tout changement écrit le brouillon (`better-lift:seance-en-cours`) ;
  démarrer relit le disque à l'appui ; terminer met en file AVANT d'effacer le brouillon. La
  logique vit dans `shared` (`seance.ts`, `file-envoi.ts`, `pave.ts`, `supersets.ts`) ; le mobile
  garde le disque et les écrans.
- **Une relecture du brouillon n'écrase jamais un changement survenu pendant qu'elle lisait**
  (compteur d'écritures de `lib/seance.tsx`) : l'écran relit le disque à chaque retour, y compris
  de la modale qui vient d'ajouter des exercices.
- Un rappel de modale qui attend applique son choix à la séance **du moment** (`useRef`), pas à
  celle capturée à l'ouverture.
- Ligne de série en trois états (`EtatSerie`) : faite (fond `ligneFaite`, ✓ pleine à l'encre) ·
  prochaine (case vide au contour épais, liseré) · à venir (cibles en valeurs fantômes). **Aucune
  ✓ sur une série à faire, pas d'orange sur les lignes.** Après une coche, l'écran défile vers
  la prochaine si elle est cachée.
- **Cible ou saisie** : `saisi` (par champ) marque ce qui a été tapé ; ouvrir puis fermer le pavé
  sans toucher ne saisit rien (`Edition.neuf`). Local : `versEnvoi` ne l'envoie pas.
- **Pavé intégré** (`components/seance/pave-numerique.tsx`) : les cases ne sont pas des
  `TextInput`. Le retour Android ferme le pavé en gardant la saisie (`BackHandler`). Une saisie
  invalide n'est jamais écrite.
- **Horloge de salle** (`components/seance/horloge-repos.tsx`) : le brouillon ne garde que la fin
  du repos ; la durée totale vit dans l'état de l'écran (`horloge.total`). Réduite, elle devient
  `BandeauRepos`.
- **Fin du repos app fermée** : notification locale (`lib/notification-repos.ts`), dérivée de
  `repos.fin`. **Absente d'Expo Go sous Android** (l'import d'`expo-notifications` y lève) : le
  module n'est chargé qu'à la demande, hors Expo Go. Ne s'éprouve que sur un build EAS.
- **Vibrations** : toujours par `lib/vibrations.ts`, jamais `expo-haptics` en direct — le réglage
  du Profil les coupe toutes là.
- Écran maintenu allumé (`useKeepAwake`) ; vignettes par `expo-image` (cache disque).
- **Fin de séance** : records battus calculés sur le téléphone (`recordsBattus`) contre les
  records en cache (`["records", slug]`, préchargés pour les exercices des routines) ; un
  exercice aux records inconnus est écarté. Sans série validée, rien ne s'enregistre. Une séance
  envoyée invalide `["seances"]`, `["records"]` et `["stats"]`.

## Profil

- Bilan de toujours (`GET /stats/bilan`), file d'envoi **seulement si une séance attend**, puis
  Entraînement (objectif et repos par défaut, sur le compte, écrits de façon optimiste, gardés
  hors ligne) · Ce téléphone (thème, vibrations) · Données (export CSV) · Compte. Réduit au
  lot 3 (D316) : thème, repos par défaut, vibrations, déconnexion.

## Hors ligne (D96–D100)

- Cache TanStack Query persistant (`lib/hors-ligne.ts`), **filtré** par `gardeHorsLigne` sur la
  présence d'une donnée. Une nouvelle lecture utile hors ligne s'y ajoute explicitement. Forme
  d'une réponse persistée changée : monter `buster` dans `app/_layout.tsx`.
- `<PreparerHorsLigne />` remplit ce cache en ligne.
- **Jamais `fetchQuery` nu dans un chemin de salle** : hors ligne, il se met en pause et l'appui
  ne rend jamais la main (`chargerRoutine`, `chargerPrecedents` lisent sous délai).
- **Une lecture sans réseau se met en pause** : tout écran de données traite
  `isPending && fetchStatus === "paused"` (« Hors ligne ») et montre sa donnée avant l'erreur
  (`isError && !data`).
- La garde de session ne redirige que sur une absence confirmée : une erreur de lecture laisse
  passer si un cookie de session est gardé sur le téléphone.
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
