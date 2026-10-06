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
- **Questions et menus ponctuels : `useConfirmer` / `useFeuille` / `useInformer`**
  (`lib/confirmation.tsx`, une feuille montée à la racine), jamais `Alert.alert` : l'alerte
  native reste blanche en thème sombre et ne distingue pas l'action destructive. L'action vient
  en tête (danger par défaut), « Annuler » en dernier. Toute feuille se ferme aussi en glissant
  vers le bas (80 px ou 800 px/s) ; sous Android, le contenu d'un `Modal` porte sa propre
  `GestureHandlerRootView`.
- **Contraste** : tout texte tient 4,5:1 sur la surface où il se pose, dans les deux registres
  (`encreAttenuee` comprise). Un nouveau token se mesure avant d'entrer.
- **Repère de superset (D151)** : rôle `superset` (`#9a8cf0` / `#5a4bbf`, 5,3:1 à 7,0:1 sur les
  surfaces) et `components/ui/repere-superset.tsx` : barre de 3 px à gauche de chaque membre,
  étiquette « SUPERSET A » au-dessus du premier. `marge` = marge du bas des éléments (la barre
  s'arrête avant, au dernier), `ecart` = `gap` du conteneur (la barre le franchit).
- **Fond des images d'exercice** : rôle `fondImage`, blanc dans les deux registres (les médias du
  catalogue sont détourés sur blanc).
- **Thème choisi (D128)** : Système · Sombre · Clair, gardé sur le téléphone
  (`lib/theme-choix.ts`, clé `better-lift:theme`) et appliqué par `Appearance.setColorScheme`,
  que `useColorScheme` — donc `useCouleurs` — suit partout. Lu dès le chargement de
  `app/_layout.tsx`, avant le premier écran.
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
  « Démarrer » (la feuille `components/feuille-demarrer.tsx`, D120, ouverte par l'état du
  `_layout` des onglets ; logique dans `lib/demarrer.ts`) qui devient
  « Reprendre » pendant une séance (`lancer.tsx` ne fait que réserver sa place). **Onglet actif
  en lime** (D115, remplace D106 à la demande de l'utilisateur) — token `ongletActif` : lime en
  sombre, olive en clair, où le lime ne tient que 1,8:1 sur la barre. Icônes Lucide.
- La carte « À suivre » de l'Accueil n'a pas d'aplat : elle ouvre la routine et porte « Lancer »
  en contour (`BoutonContour`, D118). La page d'une routine aussi (D122).
- **Bandeau « séance en cours »** (`components/bandeau-seance.tsx`, D107) : neutre, posé au-dessus
  de la barre par `tabBar` (avec `BottomTabBar` de `expo-router/tabs`), donc présent sur tous les
  onglets et leurs écrans empilés. Il se pose au-dessus du débord du rond (30), sinon le rond le
  recouvre. Repos restant s'il tourne, chrono sinon ; tout le bandeau
  ramène à la séance. Il ne dit pas « Reprendre » : le rond central le dit déjà.
- **L'Accueil, journal en tête (D117, D119)** : « À suivre » (`components/accueil/a-suivre.tsx`,
  `routineASuivre`, zones principales et durée tirées du détail en cache, masquée pendant une
  séance), puis le fil de TOUTES les séances (`CarteSeance` : tuiles durée · volume · séries, les
  trois premiers exercices et leur meilleure série — `SeanceFil.apercu`, calculé par l'API avec
  `apercuExercices` de `shared`). « Cette semaine » vit dans les Stats. La file d'envoi vit dans
  Profil (`components/file-envoi.tsx`). La pile `historique` ne garde que le détail (`[id]`).
- **Composants communs des pages (D118)** : `Section`, `Vignette` (fond `fondImage`, haltère sans
  image), `Tuile`, `BoutonContour`, `FeuilleBasse` (le conteneur glissable de toute feuille) dans
  `components/ui/`. Un composant naît dans le lot qui s'en sert (Knip).
- Les onglets reviennent en arrière **par l'historique** (`backBehavior="history"`) : sans lui, le
  retour depuis un écran d'un onglet masqué ramène à l'Accueil.
- **Piège** : une pile qui déclare ses écrans prend le premier pour route initiale —
  `(onglets)` est déclaré en tête dans `app/_layout.tsx`, sinon l'app s'ouvre sur une modale.
- Le `_layout` de `app/(onglets)/` porte la garde de session. `seance` et `fin` restent hors des
  onglets, en plein écran.
- Hauteur de la barre d'onglets : `49 + 8 + bottom` (`useSafeAreaInsets`). Expo Router la fixe à
  49 + la marge du bas ; un `paddingTop` non compté pousse les libellés sous les boutons d'Android.

## Routines (D82–D85)

Conception : [`2026-09-25-mobile-routines-design.md`](../../docs/superpowers/specs/2026-09-25-mobile-routines-design.md).

- Le mobile crée, modifie et supprime les routines, indépendamment du web.
- **L'onglet (D121)** : `Segments` « Mes routines » | « Exercices ». Les cartes
  (`components/routines/carte-routine.tsx`) tirent noms et durée des détails en cache
  (`useQueries`) ; « Lancer » en contour. La vue Exercices (`components/exercices/catalogue.tsx`)
  filtre le catalogue COMPLET sur le téléphone, puces de groupe comprises ; la pile `exercices`
  ne garde que la fiche. Une rangée horizontale au-dessus d'une liste porte `flexShrink: 0`,
  sinon la liste la rogne.
- Page d'une routine (D122), qu'on lit avant de la modifier : résumé (`dureeEstimeeSec`), zones
  principales, « Lancer » en contour (plus d'aplat fixe : l'aplat de l'écran est le rond),
  exercices « 3 × 8 · 60 kg » (`resumeSeries`) avec « Dernière fois » (`meilleureSerie` sur
  `optionsPrecedents`), chacun ouvrant sa fiche, puis la **carte des muscles** face/dos
  (`react-native-body-highlighter`, `zonesTravaillees` de `shared/muscles.ts` — chaque muscle du
  catalogue a une zone ou figure dans `MUSCLES_SANS_ZONE`) — après la liste : en tête, elle
  prenait tout le premier écran. **Les muscles sont en vert** (D84 révisée) : seul usage du
  lime hors action et record, borné au dessin du corps.
- Édition plein écran `app/routine-edition.tsx` (`?id=` pour modifier) :
  `react-native-draggable-flatlist`, `GestureHandlerRootView` à la racine, sortie avec
  changements confirmée (`beforeRemove`). Choix d'exercices par la modale
  `app/choisir-exercices.tsx`, qui rend sa sélection par `lib/choix-exercices.ts`.
- **Supersets (D151, D152)** : l'éditeur et la page d'une routine enveloppent chaque exercice
  dans `RepereSuperset` ; menu ⋯ « Superset avec le suivant » / « Retirer du superset »,
  l'étiquette ouvre « Défaire le superset ». Glisser : `onDragEnd({ from, to })` →
  `deplacerAvecGroupes`. Repos masqué sur les membres non derniers (`roleRepos`).
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
  en trois états (`EtatSerie`), **comme une case à cocher (D116)** : faite (fond `ligneFaite`,
  ✓ pleine à l'encre) · **prochaine** (case vide au contour épais, liseré à gauche) · à venir
  (case vide, cibles en valeurs fantômes). **Aucune ✓ n'est dessinée sur une série à faire, et
  pas de lime sur les lignes** : une ✓ colorée se lit « fait ». La prochaine (`prochaineSerie`
  de `shared`) suit la dernière série faite. Après une coche, l'écran défile vers elle si elle est
  cachée (hors de l'écran ou sous le bandeau de repos), sinon rien ne bouge. L'en-tête dit
  « 3 / 16 ». Décocher vibre (`selection`). Cases de 40, ligne de 52.
- **Cible ou saisie** : `saisi` (`shared`, par champ : `chargeKg`, `reps`) marque ce qui a été
  tapé pendant la séance. Une case à venir non saisie montre sa cible en fantôme ; saisie, elle
  passe à l'encre. Ouvrir puis fermer le pavé sans toucher ne saisit rien (`Edition.neuf`).
  Local au téléphone : `versEnvoi` ne l'envoie pas.
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
- **Fin de séance, la récompense d'abord (D130)** : les records battus en vedette (médaille en
  contour record) ou, sans record, la régularité ; puis durée, séries et volume, chacun avec son
  écart avec la dernière séance de la même routine (lue dans le fil en cache ; une séance vide
  n'en a pas) ; puis la note de séance (`SeanceEnCours.note`, gardée au brouillon, envoyée rognée
  par `versEnvoi`, vide : absente). Le reste ci-dessous tient toujours.
- **Fin de séance (D111)** : records battus calculés sur le téléphone (`recordsBattus` de
  `shared`) contre les records en cache (`["records", slug]`, persistés et préchargés pour les
  exercices des routines) ; un exercice aux records inconnus est écarté, sans record déclaré.
  Sans série validée, la séance ne s'enregistre pas. Des séries restent à valider : un encart
  le dit au-dessus d'« Enregistrer » ; un échauffement fait : l'écran rappelle qu'il ne compte pas
  dans le volume (D5). Hors ligne : un encart pointillé, pas une
  alerte.
- **Démarrer (D120)** est une `FeuilleBasse` : « À suivre » et son aplat « Commencer … », la
  séance vide, puis les autres routines. Chaque choix ferme la feuille AVANT de lancer : un `Modal`
  resterait au-dessus de la séance. Séance vide : « Ajouter un exercice » devient l'aplat, faute
  de ✓.
- Une séance envoyée invalide `["seances"]`, `["records"]` et `["stats"]`.

## Fiche d'exercice et détail d'une séance

- **Fiche (D124)**, une page qui défile : animation, nom, **1RM estimé** et sa courbe
  (`courbeUnRm` de `shared` sur `GET /exercices/:slug/historique`, séries de 12 reps au plus
  comme le record ; `react-native-svg`, dernier point aux couleurs du record s'il est le plus haut),
  records, historique (chaque séance ouvre son détail), puis carte du corps et exécution. Hors ligne, elle s'appuie sur la
  ligne du catalogue complet (lue par `getQueryData`, jamais chargée par la fiche) et sur les
  records en cache, et dit ce qui manque.
- **`expo-image` dans un écran réutilisé** (même route, autre paramètre) : `recyclingKey={source}`,
  sinon l'image du précédent reste affichée tant que la nouvelle ne charge pas — hors ligne, pour
  toujours. Un `onError` rabat sur l'haltère.
- **Détail d'une séance (D123)** : étiquettes de séries comme en séance (D92), vignettes, et
  l'écart de chaque série avec la même position de la dernière occurrence antérieure de
  l'exercice (`precedentes`, rendues par `GET /seances/:id` ; `ecartSerie` de `shared`).
  « ⋯ » : refaire la routine d'origine, supprimer (`DELETE`, confirmé ; retire le détail du cache
  et invalide fil, stats, records). Non gardé hors ligne (D96), il dit « Hors ligne ».

## Profil (D128, D129)

- En-tête : le bilan de toujours (`GET /stats/bilan`). Entraînement : objectif hebdomadaire et
  repos par défaut, **sur le compte** (`GET` / `PUT /preferences`, écrits de façon optimiste,
  gardés hors ligne). Le repos par défaut entre dans `validerSerie` pour l'exercice sans repos
  propre ; l'objectif donne « Objectif tenu x / y semaines » au calendrier (`semainesTenues`).
- Réglages du téléphone : thème, vibrations. Export : `GET /export/seances.csv` (`versCsv`),
  écrit dans le cache (`expo-file-system`, `File` / `Paths`) puis `expo-sharing`.
- Une ligne qui ouvre un choix est appuyable en entier, chevron au bout ; le choix se fait dans
  une feuille (`useFeuille`, option `choisie`).

## Stats (D125–D127)

- `GET /stats/periode?periode=&fuseau=` (`depotStats.lirePeriode`) ; `GET /stats` garde la forme
  D112 pour le web. Une période = 1, 4, 13 ou 52 **semaines glissantes** alignées sur le lundi
  dans le fuseau, comparées aux mêmes semaines juste avant (`calculerPeriode` de `shared`) —
  pas des mois civils. L'écran le dit sous le sélecteur.
- Page : `Segments` (Semaine · Mois · 3 mois · Année), tuiles comparées, **calendrier**
  (`components/stats/calendrier.tsx` : niveaux par quartile de volume, `niveauxCalendrier` ;
  token `calendrier[0..4]`, D127 ; cases taillées sur la largeur, l'année défile en cases de 14
  ouverte sur la semaine en cours ; jour à venir en contour ; toucher un jour ouvre sa séance),
  carte du corps puis séries par zone, volume, records de la période.
- Persistées hors ligne (`gardeHorsLigne`, clé `["stats", "periode", …]`) ; l'écran dit leur
  date de calcul (`dataUpdatedAt`). Sous deux séances, un état vide.

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
