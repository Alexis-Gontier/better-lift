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

## Navigation (D74–D80)

Conception : [`2026-09-24-mobile-onglets-design.md`](../../docs/superpowers/specs/2026-09-24-mobile-onglets-design.md).

- Quatre onglets : Accueil · Routines | **bouton central** | Stats · Profil. Barre pleine
  largeur, **onglet actif en lime** (D76 révisée à la demande de l'utilisateur). Icônes Lucide.
- Stats est vide pour l'instant ; **l'Accueil est le fil des séances** (D95,
  `components/historique/liste-seances.tsx`). La file d'envoi vit dans Profil
  (`components/file-envoi.tsx`). Historique et Exercices ont quitté la barre (`href: null`) mais
  restent joignables : détail d'une séance depuis l'Accueil, fiche d'exercice depuis le détail.
- Les onglets reviennent en arrière **par l'historique** (`backBehavior="history"`) : sans lui, le
  retour depuis un écran d'un onglet masqué ramène à l'Accueil.
- Le bouton central (aplat lime) reprend la séance en cours, sinon ouvre la modale
  `app/demarrer.tsx` (logique dans `lib/demarrer.ts`).
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
- Un rappel de modale qui attend (les précédents) applique son choix à la séance **du moment**
  (`useRef`), pas à celle capturée à l'ouverture.
- **Une relecture du brouillon n'écrase jamais un changement survenu pendant qu'elle lisait**
  (`recharger` et le compteur d'écritures de `lib/seance.tsx`) : l'écran relit le disque à chaque
  retour, y compris au retour de la modale qui vient d'ajouter des exercices.
- Une séance envoyée invalide `["seances"]` et `["records"]`.

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
