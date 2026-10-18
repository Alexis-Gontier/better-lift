---
paths:
  - "apps/mobile/**"
---

# Mobile

Écrans gardés depuis D178 : Routines (liste, page, édition, choix et réorganisation des
exercices), la séance (Démarrer, séance, fin), la fiche d'un exercice, le Profil, la connexion.
Système visuel : `DESIGN.md`. Décisions : `docs/decisions.md`.

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

## Système (D101–D104, D161–D176)

- **Couleurs par rôle, deux valeurs** (`lib/palette.ts`, TypeScript pur, type `Couleurs` ;
  `lib/theme.ts` les sert). **`lib/palette.test.ts` vérifie chaque contraste** (texte à 4,5:1
  sur canevas, cartes, feuilles ; aplats d'action et de danger ; badge record) : un token qui
  échoue se corrige par sa valeur, jamais par le seuil. Un nouveau token entre dans ce test avant
  l'écran. **Jamais de couleur en dur dans un écran** : un rôle manque, il s'ajoute au type, dans
  les deux registres.
- **L'orange ne porte que l'action (aplat) et le record (contour)** ; exceptions bornées : la
  carte du corps et l'horloge de salle (D162).
- **Styles** : `const useStyles = creerStyles((couleurs) => ({ … }))` au niveau du module, puis
  `const styles = useStyles()` dans le composant ; `useCouleurs()` pour une couleur passée en
  prop. **Jamais de `StyleSheet.create` au niveau du module** : il figerait les couleurs.
- **Barlow et Barlow Condensed** (D163, chargées à la racine, écran de démarrage tenu jusque-là).
  `creerStyles` traduit `fontWeight` en famille Barlow (plafond 700) : un style hors de la
  fabrique (options d'Expo Router, `tabBarLabelStyle`) pose `fontFamily: polices.…` lui-même.
  L'**affiche** (`affiche` de `lib/theme.ts`) se pose seulement sur titres de page, noms en tête,
  chrono, horloge et valeurs de record — jamais sur un bouton, une étiquette ou un tableau.
- **Rayons** (D164) : toujours par `rayon` (6, 16, pilule), jamais en littéral sauf un cercle.
- **Tout élément appuyable passe par `Appuyable`** (`components/ui/appuyable.tsx`). Seuls les
  voiles sous les feuilles restent des `Pressable` nus. Cible de 48 au minimum (`CIBLE`, ou
  `hitSlop` qui l'atteint) ; un titre porte `accessibilityRole="header"`.
- **Questions et menus : `useConfirmer` / `useFeuille` / `useInformer`** (`lib/confirmation.tsx`),
  jamais `Alert.alert` : l'alerte native reste blanche en sombre et ne distingue pas le danger.
  L'action en tête (danger par défaut), « Annuler » en dernier. Toute feuille se ferme en glissant
  vers le bas (80 px ou 800 px/s) ; sous Android, le contenu d'un `Modal` porte sa propre
  `GestureHandlerRootView`.
- **Composants communs** dans `components/ui/` : `Section`, `Vignette`, `Tuile`, `BoutonContour`,
  `FeuilleBasse`, `RepereSuperset`, `EnteteRetour`, états. Un composant naît dans le lot qui s'en
  sert (Knip).
- **États** : `Chargement` dessine un squelette qui pulse (immobile si les animations sont
  réduites) ; une attente de moins d'une seconde n'affiche rien.
- **Thème** : Système · Sombre · Clair, gardé sur le téléphone (`lib/theme-choix.ts`), appliqué
  par `Appearance.setColorScheme` et lu avant le premier écran.
- **Taille du texte du système** suivie partout, sauf dans les éléments de hauteur fixe de la
  séance (lignes de série, en-têtes de colonnes, pavé, bandeau de repos), plafonnés par
  `maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}`. Une colonne étroite ajoute
  `numberOfLines={1} adjustsFontSizeToFit`.
- **Écran de secours** : `ErrorBoundary` exporté par `app/_layout.tsx` et `app/seance.tsx`
  (`components/ui/ecran-erreur.tsx`) ; il ne lit aucun contexte de l'app.
- **Carte du corps** : la bibliothèque peint chaque partie d'une couleur en dur qui l'emporte sur
  `defaultFill` — chaque partie non travaillée reçoit `styles.fill` du thème.

## Navigation (D178)

- Barre **Routines · rond orange Démarrer / Reprendre · Profil**. `(onglets)/index.tsx` redirige
  vers `/routines` (cachée de la barre) pour que `/` reste une adresse valide. La pile
  `exercices` (cachée) ne garde que la fiche. Onglet actif dans une pilule `surface3`.
- Le rond ouvre la feuille Démarrer (`components/feuille-demarrer.tsx`, logique dans
  `lib/demarrer.ts`), ou ramène à la séance en cours.
- **Bandeau « séance en cours »** (`components/bandeau-seance.tsx`) posé par `tabBar` au-dessus de
  la barre, donc sur tous les onglets ; au-dessus du débord du rond (30), sinon le rond le couvre.
- `backBehavior="history"` : sans lui, le retour depuis un écran d'un onglet masqué ramène au
  premier onglet.
- Une pile qui déclare ses écrans prend le premier pour route initiale : `(onglets)` est déclaré
  en tête dans `app/_layout.tsx`, sinon l'app s'ouvre sur une modale.
- Le `_layout` de `(onglets)` porte la garde de session. `seance`, `fin`, `routine-edition`,
  `choisir-exercices`, `reorganiser` sont hors des onglets.
- Hauteur de la barre : `49 + 8 + bottom`. Expo Router la fixe à 49 + la marge du bas ; un
  `paddingTop` non compté pousse les libellés sous les boutons d'Android.

## Routines (D82–D85, D171, D172)

- Liste de cartes (`components/routines/carte-routine.tsx`) qui tirent noms et durée des détails
  en cache (`useQueries`) ; pas de « Lancer » sur la carte : le rond lance, la carte ouvre.
- Page d'une routine : résumé (`dureeEstimeeSec`), « Lancer » en contour, exercices
  « 3 × 8 · 60 kg » (`resumeSeries`) avec « Dernière fois » (`meilleureSerie`), carte du corps
  repliée (`zonesTravaillees` de `shared/muscles.ts` — chaque muscle du catalogue a une zone ou
  figure dans `MUSCLES_SANS_ZONE`).
- Édition plein écran `app/routine-edition.tsx` (`?id=` pour modifier) :
  `react-native-draggable-flatlist`, sortie avec changements confirmée (`beforeRemove`). Choix
  d'exercices par la modale `app/choisir-exercices.tsx`, qui rend sa sélection par
  `lib/choix-exercices.ts`. `note` et `dossierId` (non affichés) sont renvoyés tels quels (D298).
- Supersets : `RepereSuperset` autour de chaque membre ; glisser par
  `onDragEnd({ from, to })` → `deplacerAvecGroupes` ; repos masqué hors du dernier (`roleRepos`).
- **Supprimer une routine retire son détail du cache (`removeQueries`)** : l'invalider referait
  la requête, 404, et les tentatives de TanStack Query bloqueraient l'écran plusieurs secondes.

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
- **Démarrer** est une `FeuilleBasse` ; chaque choix ferme la feuille AVANT de lancer, sinon le
  `Modal` resterait au-dessus de la séance.
- **Fin de séance** : records battus calculés sur le téléphone (`recordsBattus`) contre les
  records en cache (`["records", slug]`, préchargés pour les exercices des routines) ; un
  exercice aux records inconnus est écarté. Sans série validée, rien ne s'enregistre. Une séance
  envoyée invalide `["seances"]`, `["records"]` et `["stats"]`.

## Fiche d'exercice et Profil

- Fiche (`app/(onglets)/exercices/[slug].tsx`) : 1RM estimé et sa courbe (`courbeUnRm` sur
  `GET /exercices/:slug/historique`, `react-native-svg`), records, historique (qui n'ouvre rien),
  consignes. Hors ligne, elle s'appuie sur la ligne du catalogue complet (lue par
  `getQueryData`) et sur les records en cache, et dit ce qui manque.
- **`expo-image` dans un écran réutilisé** (même route, autre paramètre) : `recyclingKey={source}`,
  sinon l'image du précédent reste affichée — hors ligne, pour toujours. `onError` rabat sur
  l'haltère.
- Profil : bilan de toujours (`GET /stats/bilan`), file d'envoi **seulement si une séance
  attend**, puis Entraînement (objectif et repos par défaut, sur le compte, écrits de façon
  optimiste, gardés hors ligne) · Ce téléphone (thème, vibrations) · Données (export CSV par
  `expo-file-system` puis `expo-sharing`) · Compte.

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
- Logo : `components/ui/logo.tsx`, source `assets/logo.svg` ; les PNG d'icône Android en sont des
  rendus, à régénérer si le logo change.
- **Dette connue** : l'avertissement « error during concurrent rendering » au démarrage. React
  s'en remet seul.
