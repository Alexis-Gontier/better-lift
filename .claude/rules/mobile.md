---
paths:
  - "apps/mobile/**"
---

# Mobile

Écrans (D316–D319) : trois onglets (Routines, Historique, Profil), la séance (avec choix et
réorganisation des exercices), la fin, la connexion (seul écran à porter le logo, `Logo`, D326).
Style wireframe en gris, la direction artistique viendra après l'épreuve. Décisions : `docs/decisions.md`.

## Lancer (Expo Go)

Une seule dépendance native hors SDK, notify-kit (D338), absente d'Expo Go : la notification de
repos ne s'y montre pas, le reste tourne dans **Expo Go** (d'où AsyncStorage, D55).

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
  le lien `exp://127.0.0.1:8081` deux fois. **Une classe jamais écrite ailleurs** (`w-8`,
  `ml-auto`…) n'est pas générée non plus avant ce redémarrage : sans effet, en silence. Pour ne
  pas couper `pnpm dev`, un second Metro : `npx expo start --port 8082 --clear`, `adb reverse
  tcp:8082 tcp:8082`, lien `exp://127.0.0.1:8082`.
- **Thème** : Système · Sombre · Clair, gardé sur le téléphone (`lib/theme-choix.ts`), appliqué
  par `Uniwind.setTheme` et `Appearance.setColorScheme` (composants natifs, barre d'état).
- Cible de 48 au minimum ; un titre porte `accessibilityRole="header"`.
- **Questions et menus : `useConfirmer` / `useFeuille` / `useInformer`** (`lib/confirmation.tsx`),
  jamais `Alert.alert` : l'alerte native reste blanche en sombre et ne distingue pas le danger.
  Toute feuille se ferme en glissant vers le bas ; sous Android, le contenu d'un `Modal` porte
  sa propre `GestureHandlerRootView`.
- **États** : `Chargement`, `Erreur`, `Vide` (`components/ui/etats.tsx`) ; une attente de moins
  d'une seconde n'affiche rien. `Chargement` prend la `forme` de l'écran (D327) : un nouvel
  écran de données y ajoute la sienne. Pour la voir, forcer `true ||` sur la condition le temps
  d'une capture (le mobile n'a pas de `?etat=`).
- **Taille du texte du système** suivie partout, sauf dans les éléments de hauteur fixe de la
  séance, plafonnés par `maxFontSizeMultiplier={PLAFOND_TEXTE_DENSE}`
  (`components/seance/texte-dense.ts`).
- Le fond des images du catalogue est blanc dans les deux thèmes (`bg-white`) : elles sont
  détourées sur blanc.
- **Écran de secours** : `ErrorBoundary` exporté par `app/_layout.tsx` et `app/seance.tsx`
  (`components/ui/ecran-erreur.tsx`) ; il ne lit aucun contexte de l'app.
- `PortalHost` est posé à la racine : les menus et fenêtres de Reusables s'y rendent.

## Navigation (D319)

- **Trois onglets** : `app/(connecte)/` — `index` (Routines), `historique`, `profil`. `Tabs`
  d'Expo Router, barre à nous (`components/barre-onglets.tsx`) : le bandeau « Reprendre »
  (`components/bandeau-seance.tsx`) puis les onglets. Un onglet s'ouvre sur `TitreOnglet`.
  Le bandeau (D336, D337) : chevron vers le haut à gauche, le temps puis l'exercice en cours,
  une corbeille (abandon confirmé) ; tout le reste du bandeau reprend la séance.
- **Reprise (D336)** : au démarrage de l'app, une séance en cours ouvre `/seance`
  (`RepriseAuDemarrage` dans la garde, une fois par démarrage ; sans animation, un voile
  couvre les onglets jusqu'au retour sur eux, D341) ; l'écran de séance s'ouvre
  défilé sur la prochaine série (`arriver`, dès que bloc et ligne sont mesurés).
- Routines (D320) : « Séance vide » en tête, puis les routines par dossier, comme le web
  (`DossierRoutines` repliable, `LigneRoutine` en carte ; calculs de `shared/liste-routines.ts`).
  La carte a deux actions (D321) : le segment « Lancer » (gris, D336) lance par `lib/demarrer.ts`, le reste
  ouvre `app/routine/[id].tsx` (lecture seule, pile racine, exercices repliés par
  `CarteExerciceRoutine`, carte des muscles `CarteMuscles` — couleurs du dessin lues par
  `useCSSVariable`). `optionsRoutines()` rend `{ routines, dossiers }`.
- **Historique (D345)** : `SectionList` par mois (`parMois`), `CarteSeance`
  (`components/historique/`), pages de `optionsSeances()` chargées en défilant. Les séances de
  la file d'envoi (`useSeance().file`, sans refus) viennent en tête par `filEnAttente`, sauf
  celles que la liste a déjà reçues. Détail `app/historique/[id].tsx` (pile racine) :
  `optionsSeance(id)` rend `null` sur un 404 ; `useSupprimerSeance` retire la séance des pages
  et du cache (sans relire le détail), relit précédents et routines.
- La pilule de l'onglet actif est toujours montée et se montre par l'opacité : sous Android, un
  fond ajouté à une vue déjà affichée perdait son arrondi.
- Le `_layout` de `(connecte)` porte la garde de session et `PreparerHorsLigne`. `seance`,
  `fin`, `choisir-exercices`, `reorganiser`, `routine/[id]`, `historique/[id]` sont hors de
  la garde, sur la pile racine : la barre n'y paraît pas.
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
- Un exercice par carte (D325, `CarteExercice`) ; l'écart est un `pb-3` autour de la carte :
  une marge posée sur une vue bordée mange sa bordure du bas sous Android.
- Ligne de série en trois états (`EtatSerie`) : faite (fond `bg-muted`, ✓ pleine) · prochaine
  (case au contour à l'encre, liseré) · à venir. Après une coche, l'écran défile vers la
  prochaine si elle est cachée.
- **Saisie au clavier du système (D317, D334, D339)** : les cases sont des `Input`
  (`decimal-pad` / `number-pad`). Ce qu'elles montrent vient de `valeurAffichee` (`shared`) :
  la saisie à l'encre, sinon le gris en `placeholder` (dernière fois > cible > série du dessus).
  Au toucher, une case non saisie s'ouvre **vide**, une case saisie se sélectionne toute
  (`selectTextOnFocus` : la `selection` contrôlée arrivait trop tard au premier toucher, curseur
  au milieu). `saisi` (par champ) marque ce qui a été tapé ; cocher (`validerSerie`) écrit le
  gris et marque les deux champs. **Rien ne change le style d'une case pendant la frappe** :
  sous Android, ça relance la sélection de tout. La valeur s'écrit à `onEndEditing`, **lue dans
  l'événement** (`nativeEvent.text`, l'état peut manquer le dernier chiffre), seulement si le
  texte a changé ; invalide, elle reste affichée en rouge et n'est pas écrite. « ✓ » du pavé
  écrit et ferme ; clavier fermé par « retour », la case lâche le focus. **Quitter l'écran
  clavier ouvert ne passe pas par `onEndEditing`** : la saisie en attente s'écrit au démontage
  de la case. Cocher ferme le clavier d'abord (`Keyboard.dismiss`). Hors édition, un
  `Pressable` couvre la case (le défilement qui part d'elle défile). Une série se supprime en
  la balayant à gauche (`ReanimatedSwipeable`) ou par son étiquette.
- **Éprouver la saisie** : l'AVD `better-lift` garde `hw.keyboard=yes` (le clavier du PC tape
  dans l'émulateur ; `no` le coupe) et l'émulateur porte
  `settings put secure show_ime_with_hard_keyboard 1`, sans quoi Android cache le pavé virtuel.
  Après une frappe au clavier du PC, Gboard peut se replier en barre flottante.
- **Toute écriture de l'écran passe par `changer(f)`** (`app/seance.tsx`), qui part de
  `courante.current`, pas de la séance du rendu : la fin de saisie et la coche arrivent dans la
  même frame, la seconde écraserait la première.
- **En-tête (D344)** : `EnTeteSeance` — replier, nom, Terminer ; durée, volume, séries, et la
  mini-silhouette (`Silhouettes` de `carte-muscles.tsx`) des exercices qui ont une série faite,
  muscles lus dans `optionsExercice` (persisté) ; un appui ouvre `CarteMuscles nu` en feuille.
- **Repos (D335)** : `BandeauRepos` collé en bas, tant qu'un repos court ou vient de finir ; le
  brouillon garde sa fin et sa durée (`partReposRestante` dessine la barre qui se vide).
- **Notification de repos (D338, D340)** : pendant le repos, le chrono et ses boutons ; après,
  la série suivante et « Terminer la série » (`contenuNotifSuivante`, même identifiant que
  l'ancienne « Repos terminé »). `lib/notification-repos.ts`, avec `react-native-notify-kit`
  (module natif : chargé par `require` seulement sous Android hors Expo Go). Elle dérive de
  l'état par `aligner(séance)` ; le contenu et l'effet des boutons sont dans
  `shared/notif-repos.ts`. Le service et les boutons s'enregistrent dans `index.ts`, avant
  l'app. Les boutons passent par `appliquer` du `SeanceProvider` quand l'app vit, sinon par
  le disque. Ne s'éprouve que sur un build EAS ; le volet des notifications n'est pas lisible
  par `describe` (le chrono) : taper d'après une capture.
- **Vibrations** : toujours par `lib/vibrations.ts`, jamais `expo-haptics` en direct — le réglage
  du Profil les coupe toutes là.
- Écran maintenu allumé (`useKeepAwake`) ; vignettes par `expo-image` (cache disque).
- **Fin de séance** (D318, D342, D343) : date, durée, séries, volume, la note ; Enregistrer,
  Reprendre, Abandonner. Date et durée se corrigent sur des roues (`components/ui/roue.tsx`)
  dans une `FeuilleBasse` montée à l'ouverture, `glisser={false}` ; elles partent par
  `terminer({ debut, fin })`. Sans série validée, rien ne s'enregistre. Une séance envoyée
  invalide `["seances"]`.

## Profil (D318)

- Thème, repos par défaut (sur le compte, écrit de façon optimiste, gardé hors ligne),
  vibrations, file d'envoi **seulement si une séance attend**, déconnexion (prévient si une
  séance est en cours ou attend). Le bilan, l'objectif et l'export vivent sur le web.

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
