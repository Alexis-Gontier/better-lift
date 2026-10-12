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

## Système (D101–D103, D161–D164, D176)

Conception : [`2026-10-03-mobile-refonte-design.md`](../../docs/superpowers/specs/2026-10-03-mobile-refonte-design.md),
puis [`2026-10-11-mobile-identite-design.md`](../../docs/superpowers/specs/2026-10-11-mobile-identite-design.md)
(identité « Underground orange »), puis [`2026-10-13-mobile-themes-design.md`](../../docs/superpowers/specs/2026-10-13-mobile-themes-design.md)
(thèmes interchangeables, Basic-Fit). Le système en une page : [`DESIGN.md`](../../DESIGN.md).

- **Un fichier par thème (D182)** : `themes/<nom>/couleurs.ts` (TypeScript pur, `sombre` et
  `clair` de type `Couleurs`) et `themes/<nom>/index.ts` (type `Theme` : couleurs, polices et
  leurs fichiers, rayons, style d'affiche). `themes/index.ts` et `themes/couleurs.ts` les
  recensent ; **`lib/theme-actif.ts` choisit le thème en une ligne** (actif : **Basic-Fit**,
  D183 ; Underground orange reste pour revenir en arrière). `lib/theme.ts` garde son API
  (`useCouleurs`, `creerStyles`, `polices`, `rayon`, `affiche`) et lit le thème actif ;
  `app/_layout.tsx` charge ses polices. Espacements, tailles, `CIBLE` restent communs. Nouveau
  thème : un dossier, une entrée dans les deux registres, polices par `npx expo install`, Metro
  relancé en `--clear`.
- **`lib/couleurs-en-dur.test.ts`** échoue sur toute couleur littérale (`"#…"`, `rgba(`) dans
  `app/`, `components/` ou `lib/` : les couleurs ne vivent que dans `themes/`.
- **Couleurs par rôle, deux valeurs.** **`lib/themes.test.ts` vérifie, pour chaque thème,
  chaque texte à 4,5:1 sur le canevas,
  les cartes et les feuilles, les aplats d'action et de danger, le badge record sur son fond
  teinté, et l'absence de lime** : un token qui échoue se corrige par sa valeur, jamais par le
  seuil. L'orange ne porte que l'action (aplat) et le record (contour) ; exceptions bornées
  (D162) : la carte du corps, le calendrier, puis l'horloge de salle et l'onglet actif avec
  son halo (D181). Le thème suit celui du
  téléphone (`useColorScheme`, `userInterfaceStyle: "automatic"`). Jamais de couleur en dur dans
  un écran : un rôle manque, il s'ajoute au type, dans les deux registres.
- **Styles** : `const useStyles = creerStyles((couleurs) => ({ … }))` au niveau du module, puis
  `const styles = useStyles()` dans le composant ; `useCouleurs()` pour une couleur passée en
  prop (icône, `placeholderTextColor`). **Jamais de `StyleSheet.create` au niveau du module** : il
  figerait les couleurs au chargement.
- **Polices du thème** (D163, D182 ; Basic-Fit : Archivo et Archivo Black, Underground : Barlow
  et Barlow Condensed ; `@expo-google-fonts`, chargées à la racine, écran de démarrage tenu
  jusque-là). `creerStyles` traduit `fontWeight` en famille de la bonne graisse (plafond 700) :
  un style hors de la fabrique (options d'Expo Router) pose `fontFamily: polices.…` lui-même.
  L'**affiche** (`affiche` de `lib/theme.ts` : la police d'affiche du thème en capitales, à
  étaler dans un style) se pose explicitement, seulement sur titres de page, noms
  en tête, chrono et valeurs de record — jamais sur un bouton, une étiquette ou un tableau.
- **Rayons du thème (D164, D182)** — Basic-Fit : 12 pour les cartes, 8 pour boutons, cellules et
  bandeaux ; Underground : 6 partout ; 16 pour les feuilles,
  la pilule pour les puces ; toujours par `rayon`, jamais en littéral (sauf un cercle).
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
  (`encreAttenuee` comprise). Un nouveau token entre dans `themes.test.ts` avant l'écran.
- **États (D176)** : `Chargement` dessine un squelette de cartes qui pulse (immobile si les
  animations sont réduites, `useReducedMotion`) ; une attente de moins d'une seconde (garde de
  session) n'affiche rien.
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
  séance (lignes de série, en-têtes de colonnes, bandeau de repos), plafonnés par
  `maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}` (1,3). Un nouvel élément de hauteur fixe le
  reçoit ; une colonne étroite ajoute `numberOfLines={1} adjustsFontSizeToFit`.
- **Écran de secours** : `ErrorBoundary` exporté par `app/_layout.tsx` (toutes les routes) et par
  `app/seance.tsx` (« rien n'est perdu »), dans `components/ui/ecran-erreur.tsx`. Il ne lit aucun
  contexte de l'app : c'est peut-être lui qui a planté.
- **Carte du corps** : la bibliothèque peint chaque partie d'une couleur codée en dur qui
  l'emporte sur `defaultFill` — chaque partie non travaillée reçoit `styles.fill` du thème.

## Navigation (D178, D179 : MVP, barre façon Hevy, bandeau D107)

Conception : [`2026-10-13-mobile-mvp-retrait-design.md`](../../docs/superpowers/specs/2026-10-13-mobile-mvp-retrait-design.md).

- **Deux onglets, Entraînement · Profil** (D179) : des destinations seulement, pas d'action au
  centre. Accueil, Progrès et détail d'une séance sont retirés (D178) ; l'historique se lit sur le
  web. `index.tsx` redirige vers `/routines` (la route garde son nom, le titre est
  « Entraînement ») pour que `/` reste valide.
- **Barre classique** (D181, `components/barre-onglets.tsx`, passée en `tabBar` sous le bandeau) :
  une icône et son libellé par onglet, sans pilule. **L'actif est teinté `ongletActif`**
  (l'orange de l'app ; en clair un orange brûlé `#b04c00`, 4,5:1), les autres en
  `encreAttenuee`. **À l'appui, un halo orange** (opacité 0,22 → 0, échelle 0,3 → 1 en 800 ms ;
  sans élargissement si les animations sont réduites) naît au centre de l'onglet et s'efface,
  **rogné par l'onglet** (`overflow: "hidden"`) : il ne sort jamais de la barre. L'onglet ne
  pâlit pas. Seuls les écrans qui déclarent `tabBarIcon` y figurent. Icônes Lucide, l'haltère
  redressée de 45°.
- **Démarrer vit en tête de l'onglet Entraînement** (D179, reprend la feuille D120) : la routine
  à suivre (`routineASuivre`) et son aplat « Commencer … », puis « Séance vide » ; pendant une
  séance, un aplat « Reprendre la séance » à la place. Puis « Mes routines » et « + Nouvelle ».
  Logique de démarrage dans `lib/demarrer.ts`.
- **Bandeau « séance en cours »** (`components/bandeau-seance.tsx`, D107) : neutre, posé au-dessus
  de la barre par `tabBar` (avec `BottomTabBar` de `expo-router/tabs`), donc présent sur tous les
  onglets et leurs écrans empilés. Repos restant s'il tourne, chrono sinon ; tout le bandeau
  ramène à la séance.
- **Composants communs des pages (D118)** : `Section`, `Vignette` (fond `fondImage`, haltère sans
  image), `Tuile`, `BoutonContour`, `FeuilleBasse` (le conteneur glissable de toute feuille) dans
  `components/ui/`. Un composant naît dans le lot qui s'en sert (Knip).
- Les onglets reviennent en arrière **par l'historique** (`backBehavior="history"`).
- **Piège** : une pile qui déclare ses écrans prend le premier pour route initiale —
  `(onglets)` est déclaré en tête dans `app/_layout.tsx`, sinon l'app s'ouvre sur une modale.
- Le `_layout` de `app/(onglets)/` porte la garde de session. `seance` et `fin` restent hors des
  onglets, en plein écran.
- Hauteur de la barre : onglets de 60, plus la marge du bas (`useSafeAreaInsets`) en `paddingBottom`.

## Routines (D82–D85)

Conception : [`2026-09-25-mobile-routines-design.md`](../../docs/superpowers/specs/2026-09-25-mobile-routines-design.md).

- Le mobile crée, modifie et supprime les routines, indépendamment du web.
- **L'onglet Entraînement (D171, D179)** : Démarrer en tête, puis la liste, **sans segments** —
  le catalogue complet ne vit que dans `app/choisir-exercices.tsx`. Les cartes
  (`components/routines/carte-routine.tsx`, nom en affiche) tirent noms et durée des détails en
  cache (`useQueries`) ; **pas de « Lancer »** sur la carte, qui ouvre la routine. La pile
  `exercices` ne garde que la fiche.
- Page d'une routine (D122), qu'on lit avant de la modifier : résumé (`dureeEstimeeSec`), zones
  principales, « Lancer » en contour,
  exercices « 3 × 8 · 60 kg » (`resumeSeries`) avec « Dernière fois » (`meilleureSerie` sur
  `optionsPrecedents`), chacun ouvrant sa fiche, puis la ligne **« Carte du corps »** qui déplie
  la carte des muscles face/dos (D172)
  (`react-native-body-highlighter`, `zonesTravaillees` de `shared/muscles.ts` — chaque muscle du
  catalogue a une zone ou figure dans `MUSCLES_SANS_ZONE`) — repliée par défaut : elle prenait
  un écran entier, et les zones sont déjà dites en tête. **Les muscles sont en orange** (D162) : exception bornée au
  dessin du corps, avec le calendrier.
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
  36 px, cible tenue par `hitSlop`.
- **Supersets en séance (D149–D152)** : chaque bloc est enveloppé dans `RepereSuperset` (la `View`
  à `onLayout` reste à l'extérieur : les positions de défilement comptent l'étiquette). Menu ⋯ :
  « Superset avec le suivant » (inerte : « dernier exercice » ou « dans le groupe ») / « Retirer du
  superset » ; l'étiquette ouvre « Défaire ». Puce de repos masquée sur les membres non derniers,
  « Après le groupe · 1 min 30 » sur le dernier. Le reste vient de `shared` : repos au bout du tour
  (`validerSerie`), prochaine série tour par tour (`prochaineSerie`), donc le défilement aussi. La
  réorganisation montre la lettre du groupe.
- **En-tête resserré (D169)** : chevron qui replie vers les onglets, nom en affiche, une ligne
  « 3 / 15 séries · 0:42 · 1,2 t », « Terminer » en **secondaire** à droite (D105, loin du pouce
  exprès), puis la barre de progression des séries. Noms d'exercice en affiche.
- **L'horloge de salle (D168)** (`components/seance/horloge-repos.tsx`) : toute coche qui lance un
  repos monte une feuille aux deux tiers de l'écran (non modale, `SlideInDown`, fondu si les
  animations sont réduites) — décompte en affiche orange (troisième exception, D162), barre du
  repos écoulé, « Ensuite » (`prochaineSerie`), −15 s · +15 s · Passer. Le brouillon ne garde que
  la fin du repos : la durée totale vit dans l'état de l'écran (`horloge.total`, ajustée avec
  ±15). Glissée vers le bas ou « Réduire », elle redevient `BandeauRepos`, dont le centre la
  rouvre ; à zéro, elle se ferme et le bandeau dit « Repos terminé ».
- **Direction « Carnet » (D108)** : Repos et note en deux **puces** ; la note s'édite au toucher de sa puce. Ligne de série
  en trois états (`EtatSerie`), **comme une case à cocher (D116)** : faite (fond `ligneFaite`,
  ✓ pleine à l'encre) · **prochaine** (case vide au contour épais, liseré à gauche) · à venir
  (case vide, cibles en valeurs fantômes). **Aucune ✓ n'est dessinée sur une série à faire, et
  pas d'orange sur les lignes** : une ✓ colorée se lit « fait ». La prochaine (`prochaineSerie`
  de `shared`) suit la dernière série faite. Après une coche, l'écran défile vers elle si elle est
  cachée (hors de l'écran ou sous le bandeau de repos), sinon rien ne bouge. L'en-tête dit
  « 3 / 16 ». Décocher vibre (`selection`). Cases de 40, ligne de 52.
- **Cible ou saisie** : `saisi` (`shared`, par champ : `chargeKg`, `reps`) marque ce qui a été
  tapé pendant la séance. Une case à venir non saisie montre sa cible en fantôme ; saisie, elle
  passe à l'encre. Entrer puis sortir d'une case sans taper ne saisit rien (`Edition.neuf`).
  Local au téléphone : `versEnvoi` ne l'envoie pas.
- **Clavier du téléphone (D184, révise le pavé D109)** : les cases kg / reps sont des
  `TextInput` (`decimal-pad`, lu par `lireCharge` qui accepte « , » et « . » ; `number-pad`, lu
  par `lireReps` de `shared/saisie.ts`), texte sélectionné au focus. L'écran de séance tient la
  saisie (`Edition` dans `app/seance.tsx`) : `ouvrir` au focus, `taper` à chaque touche, `fermer`
  à la perte du focus. « Suivant » passe de kg à reps (`submitBehavior="submit"`), « Terminé »
  ferme. Le retour Android ferme le clavier SANS ôter le focus : `keyboardDidHide` appelle
  `Keyboard.dismiss()` pour que la case écrive sa saisie. Cocher ✓ clavier ouvert applique
  d'abord la saisie en cours. Une saisie invalide n'est jamais écrite (contour `dangerEncre`) ;
  la ligne saisie défile au quart haut de l'écran ; horloge et bandeau de repos se masquent
  pendant la saisie. **Émulateur** : `hw.keyboard=yes` n'affiche qu'une barre flottante ;
  `adb shell settings put secure show_ime_with_hard_keyboard 1` montre le clavier à l'écran.
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
- **Fin de séance, la récompense d'abord (D130, D170)** : titre « Séance terminée » ; les records
  battus dans un bloc entier en contour record (médaille comprise) ou, sans record, la régularité ; puis durée, séries et volume, chacun avec son
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
- **Démarrer (D179)** vit en tête de l'onglet Entraînement (voir Navigation). Séance vide :
  « Ajouter un exercice » devient l'aplat, faute de ✓.
- Une séance envoyée invalide `["seances"]`, `["records"]` et `["stats"]`.

## Fiche d'exercice

- **Fiche (D124, D174)**, une page qui défile : vignette et nom en tête (l'animation s'agrandit
  au toucher de la vignette), **1RM estimé** et sa courbe
  (`courbeUnRm` de `shared` sur `GET /exercices/:slug/historique`, séries de 12 reps au plus
  comme le record ; `react-native-svg`, dernier point aux couleurs du record s'il est le plus haut),
  records, historique (en lecture seule depuis D178), puis carte du corps et exécution. Hors
  ligne, elle s'appuie sur la ligne du catalogue complet (lue par `getQueryData`, jamais chargée
  par la fiche) et sur les records en cache, et dit ce qui manque.
- **`expo-image` dans un écran réutilisé** (même route, autre paramètre) : `recyclingKey={source}`,
  sinon l'image du précédent reste affichée tant que la nouvelle ne charge pas — hors ligne, pour
  toujours. Un `onError` rabat sur l'haltère.

## Profil (D128, D129, D175)

- Ordre : le bilan de toujours, la file d'envoi **seulement si une séance attend** (sinon rien),
  puis **Entraînement** (sur le compte) · **Ce téléphone** · **Données** · **Compte**.
- En-tête : le bilan de toujours (`GET /stats/bilan`). Entraînement : objectif hebdomadaire et
  repos par défaut, **sur le compte** (`GET` / `PUT /preferences`, écrits de façon optimiste,
  gardés hors ligne). Le repos par défaut entre dans `validerSerie` pour l'exercice sans repos
  propre.
- Réglages du téléphone : thème, vibrations. Export : `GET /export/seances.csv` (`versCsv`),
  écrit dans le cache (`expo-file-system`, `File` / `Paths`) puis `expo-sharing`.
- Une ligne qui ouvre un choix est appuyable en entier, chevron au bout ; le choix se fait dans
  une feuille (`useFeuille`, option `choisie`).

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
