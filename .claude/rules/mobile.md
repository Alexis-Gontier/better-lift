---
paths:
  - "apps/mobile/**"
---

# Mobile

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
  builds natifs passent par **EAS**, l'émulateur (`better-lift`) ne sert qu'à exécuter. Icônes et
  écran de démarrage ne se voient que dans un build EAS.
- Dépendance Expo ou React Native : `npx expo install <paquet>`, jamais une version de mémoire.
  Metro lancé AVANT l'installation ne voit pas le paquet (« Unable to resolve ») : le relancer
  avec `--clear`.

## Livraison (EAS)

- `runtimeVersion: { policy: "appVersion" }` et `updates.url` dans `app.json` : un correctif JS
  part par `eas update --channel <canal>` sans nouvel APK, vers les builds de **même `version`**.
  Une dépendance native ajoutée ou un SDK changé : monter `version` et refaire un build.
- Profils `preview` (canal `preview`) et `production` (canal `production`, `autoIncrement`,
  `appVersionSource: "remote"` : EAS tient le `versionCode`). Chaque profil lit l'environnement
  EAS du même nom : `EXPO_PUBLIC_API_URL` doit y exister, sinon l'app vise `10.0.2.2`.

## Système (D101–D103)

Conception : [`2026-10-03-mobile-refonte-design.md`](../../docs/superpowers/specs/2026-10-03-mobile-refonte-design.md).

- **Couleurs par rôle, deux valeurs** (`lib/theme.ts`, type `Couleurs`). Le thème suit celui du
  téléphone (`useColorScheme`, `userInterfaceStyle: "automatic"`). Jamais de couleur en dur dans
  un écran : un rôle manque, il s'ajoute au type, dans les deux registres.
- **Styles** : `const useStyles = creerStyles((couleurs) => ({ … }))` au niveau du module, puis
  `const styles = useStyles()` dans le composant ; `useCouleurs()` pour une couleur passée en
  prop (icône, `placeholderTextColor`). **Jamais de `StyleSheet.create` au niveau du module** : il
  figerait les couleurs au chargement.
- **Archivo** (`expo-font`, chargée à la racine, écran de démarrage tenu jusque-là).
  `creerStyles` traduit `fontWeight` en famille Archivo de la bonne graisse : un style hors de la
  fabrique (options d'Expo Router, `tabBarLabelStyle`) pose `fontFamily: polices.…` lui-même.
  Chiffres héros : `polices.condense`, coupe générée par `scripts/polices/condenser-archivo.py`.
- **Tout élément appuyable passe par `Appuyable`** (`components/ui/appuyable.tsx`) : il pâlit
  sous le doigt. Un style en fonction (`({ pressed }) => …`) garde la main sur l'état appuyé.
  Seuls les voiles sous les feuilles restent des `Pressable` nus. Cible de 48 au minimum
  (`CIBLE`, ou `hitSlop` qui l'atteint) ; un titre d'écran ou de section porte
  `accessibilityRole="header"`.
- **Contraste** : tout texte tient 4,5:1 sur la surface où il se pose, dans les deux registres
  (`encreAttenuee` comprise). Un nouveau token se mesure avant d'entrer.
- **Fond des images d'exercice** : rôle `fondImage`, blanc dans les deux registres (les médias du
  catalogue sont détourés sur blanc).
- **Taille du texte du système** : suivie partout, sauf dans les éléments de hauteur fixe de la
  séance (lignes de série, en-têtes de colonnes, pavé, bandeau de repos), plafonnés par
  `maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}` (1,3). Un nouvel élément de hauteur fixe le
  reçoit ; une colonne étroite ajoute `numberOfLines={1} adjustsFontSizeToFit`.
- **Écran de secours** : `ErrorBoundary` exporté par `app/_layout.tsx` (toutes les routes) et par
  `app/seance.tsx` (« rien n'est perdu »), dans `components/ui/ecran-erreur.tsx`. Il ne lit aucun
  contexte de l'app : c'est peut-être lui qui a planté.
- **Carte du corps** : la bibliothèque peint chaque partie d'une couleur codée en dur qui
  l'emporte sur `defaultFill` — chaque partie non travaillée reçoit `styles.fill` du thème.

## Navigation (D115 : barre D74 rétablie, bandeau D107)

Conception : [`2026-10-03-mobile-refonte-design.md`](../../docs/superpowers/specs/2026-10-03-mobile-refonte-design.md).

- Quatre onglets **Accueil · Routines · Stats · Profil** et, au centre, un **rond lime**
  « Démarrer » (feuille `app/demarrer.tsx`, logique dans `lib/demarrer.ts`) qui devient
  « Reprendre » pendant une séance (`lancer.tsx` ne fait que réserver sa place). **Onglet actif
  en lime** (D115, remplace D106 à la demande de l'utilisateur) — token `ongletActif` : lime en
  sombre, olive en clair, où le lime ne tient que 1,8:1 sur la barre. Icônes Lucide.
- La carte « À suivre » de l'Accueil n'a pas d'aplat : elle ouvre la routine. La page d'une
  routine garde « Démarrer la routine », dégagé du débord du rond (30).
- **Bandeau « séance en cours »** (`components/bandeau-seance.tsx`, D107) : neutre, posé au-dessus
  de la barre par `tabBar` (avec `BottomTabBar` de `expo-router/tabs`), donc présent sur tous les
  onglets et leurs écrans empilés. Il se pose au-dessus du débord du rond (30), sinon le rond le
  recouvre. Repos restant s'il tourne, chrono sinon ; tout le bandeau
  ramène à la séance.
- **L'Accueil (D110)** : « Cette semaine » (`resumeSemaine`, dans
  le fuseau), « À suivre » (`routineASuivre` : la routine qui suit la dernière faite, carte
  masquée pendant une séance), puis le fil des séances (`LigneSeance`, avec le
  nombre de records que l'API compte dans `nbRecords`). L'écran Historique garde la liste seule. La file d'envoi vit dans Profil
  (`components/file-envoi.tsx`). Historique et Exercices sont hors de la barre (`href: null`) mais
  joignables : détail d'une séance depuis l'Accueil, fiche d'exercice depuis le détail.
- Les onglets reviennent en arrière **par l'historique** (`backBehavior="history"`) : sans lui, le
  retour depuis un écran d'un onglet masqué ramène à l'Accueil.
- **Piège** : une pile qui déclare ses écrans prend le premier pour route initiale —
  `(onglets)` est déclaré avant `demarrer` dans `app/_layout.tsx`, sinon l'app s'ouvre sur la
  modale.
- Le `_layout` de `app/(onglets)/` porte la garde de session. `seance` et `fin` restent hors des
  onglets, en plein écran.
- Pas de hauteur fixe sur la barre d'onglets : elle recouvrirait la zone de geste d'Android.

## Routines (D82–D85)

Conception : [`2026-09-25-mobile-routines-design.md`](../../docs/superpowers/specs/2026-09-25-mobile-routines-design.md).

- Le mobile crée, modifie et supprime les routines, indépendamment du web.
- Page d'une routine : résumé (`dureeEstimeeSec`), **carte des muscles** face/dos
  (`react-native-body-highlighter`, `zonesTravaillees` de `shared/muscles.ts` — chaque muscle du
  catalogue a une zone ou figure dans `MUSCLES_SANS_ZONE`), cartes « 3 × 8 · 60 kg »
  (`resumeSeries`), Démarrer fixé. **Les muscles sont en vert** (D84 révisée) : seul usage du
  lime hors action et record, borné au dessin du corps.
- Édition plein écran `app/routine-edition.tsx` (`?id=` pour modifier) :
  `react-native-draggable-flatlist`, `GestureHandlerRootView` à la racine, sortie avec
  changements confirmée (`beforeRemove`). Choix d'exercices par la modale
  `app/choisir-exercices.tsx`, qui rend sa sélection par `lib/choix-exercices.ts`.
- **Supprimer une routine retire son détail du cache (`removeQueries`)** : l'invalider referait
  la requête, 404, et les tentatives de TanStack Query bloqueraient l'écran plusieurs secondes.

## Séance

- **Le disque d'abord.** Tout changement écrit le brouillon (`better-lift:seance-en-cours`) ;
  démarrer relit le disque à l'appui ; terminer met en file AVANT d'effacer le brouillon.
  La logique vit dans `shared` (`seance.ts`, `file-envoi.ts`) ; le mobile garde le disque et les
  écrans.
- Vignette GIF par exercice (`expo-image`, cache disque), écran maintenu allumé (`useKeepAwake`),
  repos en bandeau d'une ligne avec −15 s / +15 s (`ajusterRepos`).
- **Écran façon Hevy (D86–D94)** — conception :
  [`2026-09-26-mobile-seance-hevy-design.md`](../../docs/superpowers/specs/2026-09-26-mobile-seance-hevy-design.md).
  Un bloc par exercice (note, repos réglable, tableau `Série · Précédent · KG · Reps · ✓`), actions
  rares dans une feuille basse (`components/ui/feuille.tsx`), réorganisation `app/reorganiser.tsx`,
  ajout et remplacement par `choisir-exercices` (`?mode=remplacer`). Échelle compacte : cases de
  36 px, cible tenue par `hitSlop`. Supersets : lot B, l'entrée du menu est inerte.
- **Direction « Carnet » (D108)** : en-tête compact (chevron qui replie vers les onglets, nom,
  « Démarrée à », chrono en `polices.condense`, volume, séries), « Terminer » en **secondaire**
  (D105). Repos et note en deux **puces** ; la note s'édite au toucher de sa puce. Ligne de série
  en trois états (`EtatSerie`) : faite (teintée, ✓ neutre) · **prochaine** (seule ✓ lime de
  l'écran, `prochaineSerie` de `shared`) · à venir (cibles en valeurs fantômes, ✓ en contour).
  Cases de 40, ligne de 52.
- **Pavé intégré (D109)** : les cases kg / reps ne sont pas des `TextInput` ; un appui ouvre
  `components/seance/pave-numerique.tsx`, et l'écran de séance tient la saisie (`Edition` dans
  `app/seance.tsx`). La logique des touches (`toucherPave`, `ajusterSurPave`, `lireReps`) vit
  dans `shared/pave.ts`. Le retour Android ferme le pavé en gardant la saisie (`BackHandler`),
  au lieu de quitter la séance. Une saisie invalide n'est jamais écrite ; la ligne saisie défile au
  quart haut de l'écran (positions des blocs et des lignes par `onLayout`).
- **Fin du repos app fermée** : notification locale programmée à `repos.fin`
  (`lib/notification-repos.ts`, appelée par le `SeanceProvider`), dérivée de l'état : tout
  changement de `repos.fin` reprogramme ou annule, en file. Masquée au premier plan (l'écran vibre
  déjà) ; canal choisi par le réglage Vibrations. **Absente d'Expo Go sous Android** : l'import
  d'`expo-notifications` y lève une erreur, le module n'est donc chargé qu'à la demande et hors
  Expo Go. Ne s'éprouve que sur un build EAS.
- **Vibrations** : toujours par `lib/vibrations.ts` (`vibrer.valider`, `selection`, `finRepos`),
  jamais `expo-haptics` en direct : le réglage « Vibrations » du Profil (`useVibrations`, clé
  `better-lift:vibrations`, gardé sur le téléphone) les coupe toutes là (D113).
- Un rappel de modale qui attend (les précédents) applique son choix à la séance **du moment**
  (`useRef`), pas à celle capturée à l'ouverture.
- **Une relecture du brouillon n'écrase jamais un changement survenu pendant qu'elle lisait**
  (`recharger` et le compteur d'écritures de `lib/seance.tsx`) : l'écran relit le disque à chaque
  retour, y compris au retour de la modale qui vient d'ajouter des exercices.
- **Fin de séance (D111)** : records battus calculés sur le téléphone (`recordsBattus` de
  `shared`) contre les records en cache (`["records", slug]`, persistés et préchargés pour les
  exercices des routines) ; un exercice aux records inconnus est écarté, sans record déclaré.
  Sans série validée, la séance ne s'enregistre pas. Hors ligne : un encart pointillé, pas une
  alerte.
- **Démarrer** est une feuille basse (`presentation: "transparentModal"`) : l'écran dessine le
  voile et la feuille ; « À suivre » marque la routine de `routineASuivre`.
- Une séance envoyée invalide `["seances"]`, `["records"]` et `["stats"]`.

## Fiche d'exercice et détail d'une séance

- **Fiche** : records d'abord, puis carte du corps et exécution. Hors ligne, elle s'appuie sur la
  ligne du catalogue complet (lue par `getQueryData`, jamais chargée par la fiche) et sur les
  records en cache, et dit ce qui manque.
- **`expo-image` dans un écran réutilisé** (même route, autre paramètre) : `recyclingKey={source}`,
  sinon l'image du précédent reste affichée tant que la nouvelle ne charge pas — hors ligne, pour
  toujours. Un `onError` rabat sur l'haltère.
- **Détail d'une séance** : étiquettes de séries comme en séance (D92) ; non gardé hors ligne
  (D96), il dit « Hors ligne ».

## Stats (D112)

- `GET /stats?fuseau=` (`apps/api/src/services/stats.ts`) : 12 semaines (`semainesRecentes` de
  `shared`, que `resumeSemaine` de l'Accueil réutilise), records des 4 dernières semaines jugés
  contre tout l'historique, exercices de la même fenêtre pour la carte du corps.
- Persistées hors ligne (`gardeHorsLigne`) ; l'écran dit leur date de calcul (`dataUpdatedAt`).
  Sous deux séances, un état vide plutôt que des courbes muettes.

## Hors ligne (D96–D100)

Conception : [`2026-10-03-mobile-epreuve-design.md`](../../docs/superpowers/specs/2026-10-03-mobile-epreuve-design.md).

- Cache TanStack Query persistant (`lib/hors-ligne.ts`, clé `better-lift:cache-requetes`),
  **filtré** par `gardeHorsLigne` sur la présence d'une donnée : routines, catalogue complet,
  précédents. Une nouvelle lecture utile hors ligne s'y ajoute explicitement. Forme d'une réponse
  persistée changée : monter `buster` dans `app/_layout.tsx`.
- `<PreparerHorsLigne />` (`components/preparer-hors-ligne.tsx`, sous la garde de session)
  remplit ce cache en ligne.
- Démarrer lit réseau d'abord sous délai, cache en repli, cache direct hors ligne
  (`chargerRoutine`, `chargerPrecedents`). **Jamais `fetchQuery` nu dans un chemin de salle** :
  hors ligne, il se met en pause et l'appui ne rend jamais la main.
- **Une lecture sans réseau se met en pause** : tout écran de données traite
  `isPending && fetchStatus === "paused"` (« Hors ligne ») et montre sa donnée avant l'erreur
  (`isError && !data`).
- Le catalogue se filtre sur le téléphone (`filtrerCatalogue` de `shared`).
- L'envoi se relance au retour du réseau et du premier plan (`lib/seance.tsx`).
- La garde de session ne redirige que sur une absence confirmée : une erreur de lecture laisse
  passer seulement si un cookie de session est gardé sur le téléphone (installation neuve hors
  ligne → connexion).
- **Éprouver** : Expo Go ne démarre pas à froid en mode avion. Couper le réseau app ouverte
  (`adb shell cmd connectivity airplane-mode enable`), puis menu de dev → Reload. Le démarrage à
  froid hors ligne ne se vérifie que sur l'APK. `uiautomator dump` échoue sur l'écran de séance
  (le chrono l'empêche d'être « au repos ») : passer par des captures.

## Pièges

- **Après `signIn`, relire la session avant de naviguer** (`await refetch()` de `useSession`) :
  sinon la garde des onglets la lit encore absente et renvoie à une connexion vide.
- **Cookie de session** : `authClient.getCookie()` est ASYNCHRONE. Sans `await` dans l'en-tête,
  chaque requête part sans session.
- **Metro et les paquets du dépôt** : `packages/*` s'importe en `./x.js`, ce que Metro ne résout
  pas seul — `metro.config.js` essaie la variante `.ts`.
- Sur une icône `lucide-react-native`, `style` est ignoré : la rotation se pose sur une `View`
  parente.
- Logo : `components/ui/logo.tsx`, source `assets/logo.svg`. Les PNG d'icône Android en sont des
  rendus, à régénérer si le logo change.
- **Dette connue** : l'avertissement « error during concurrent rendering » au démarrage, présent
  depuis le lot 3. React s'en remet seul.
