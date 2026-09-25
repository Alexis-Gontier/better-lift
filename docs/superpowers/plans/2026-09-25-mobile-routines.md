# Routines sur mobile — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** le mobile lit une routine comme opengym (carte des muscles d'abord) et crée, modifie, supprime les routines sans le web.

**Architecture:** `shared` porte la correspondance muscles → zones (`muscles.ts`) et la copie de travail de l'éditeur (`brouillon-routine.ts`), partagées et testées ; l'API enrichit le détail d'une routine (image, muscles) ; le mobile ajoute une page de lecture refaite, un écran d'édition plein écran et une modale de choix d'exercices.

**Tech Stack:** Expo SDK 57 (Expo Go), Expo Router, TanStack Query, `react-native-body-highlighter`, `react-native-draggable-flatlist` (+ `react-native-reanimated`, `react-native-gesture-handler`), Hono RPC, Prisma 7, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-25-mobile-routines-design.md`

## Global Constraints

- Français partout (interface, commits en Conventional Commits français).
- `packages/shared` : TypeScript pur, ni React, ni Prisma, ni API de plateforme (pas de `crypto.randomUUID`, absent de Hermes).
- Dépendances Expo / React Native : `npx expo install <paquet>`, jamais une version de mémoire ; rien hors Expo Go.
- Toute charge affichée ou saisie passe par `formaterCharge` / `chargeEnTexte` / `lireCharge` avec `SYSTEME_UNITES`.
- Le lime ne porte que l'action (aplat) et le record ; les muscles sont à l'encre (D84).
- Cibles tactiles ≥ 48 px (`CIBLE`) sur mobile.
- Metro tourne en `CI=1` : le relancer après chaque modification pour vérifier à l'émulateur.

---

### Task 1 : l'API renvoie image et muscles de chaque exercice d'une routine

**Files:**
- Modify: `packages/shared/src/routines.ts` (type `ExerciceRoutine`)
- Modify: `apps/api/src/services/routines.ts` (`LigneRoutine`, `versDetail`, `select`)
- Modify: fixtures de `apps/api/src/services/routines.test.ts`, `apps/api/src/routes/routines.test.ts`, `packages/shared/src/seance.test.ts`
- Test: `apps/api/src/services/routines.test.ts`

**Interfaces:**
- Produces: `ExerciceRoutine = { slug; nom; image: string | null; musclePrincipal: string; musclesSecondaires: string[]; reposSec; series }`

- [ ] **Step 1 : test** — dans `routines.test.ts` (service), un cas `versDetail` : une ligne dont `exercise` vaut `{ slug: "bench", nomFr: "Développé couché", gifUrl: "https://x/videos/0025.gif", target: "Pectoraux", secondary: ["Triceps"] }` donne `image: "https://x/images/0025.jpg"`, `musclePrincipal: "Pectoraux"`, `musclesSecondaires: ["Triceps"]`.
- [ ] **Step 2 :** `pnpm --filter @better-lift/api test` → échec (champs absents).
- [ ] **Step 3 : implémenter** — `ExerciceRoutine` gagne les trois champs ; `LigneRoutine.exercices[].exercise` devient `{ slug; nomFr; gifUrl: string | null; target: string; secondary: string[] }` ; le `select` Prisma lit `gifUrl`, `target`, `secondary` ; `versDetail` pose `image: imageDe(e.exercise.gifUrl)` (import depuis `./exercices.js`, exporter `imageDe` s'il ne l'est pas), `musclePrincipal: e.exercise.target`, `musclesSecondaires: e.exercise.secondary`.
- [ ] **Step 4 :** corriger les fixtures qui construisent un `RoutineDetail` / une `LigneRoutine` (typecheck les désigne) ; `pnpm typecheck && pnpm test` → vert.
- [ ] **Step 5 : commit** `feat(api): image et muscles des exercices dans le détail d'une routine`.

### Task 2 : `shared/muscles.ts` — des muscles du catalogue aux zones du corps

**Files:**
- Create: `packages/shared/src/muscles.ts`, `packages/shared/src/muscles.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: `type Zone`, `LIBELLE_ZONE: Record<Zone, string>`, `zoneDuMuscle(nom: string): Zone | null`, `zonesTravaillees(exercices: { musclePrincipal: string; musclesSecondaires: string[] }[]): { zone: Zone; niveau: "principal" | "secondaire" }[]`, `MUSCLES_SANS_ZONE: readonly string[]`.

- [ ] **Step 1 : tests** —
  - chaque nom de `MUSCLES_CATALOGUE` (les 44 noms relevés sur `betterlift` le 25/09/2026, figés dans le test) a une zone OU figure dans `MUSCLES_SANS_ZONE` ;
  - `zonesTravaillees([{ musclePrincipal: "Pectoraux", musclesSecondaires: ["Triceps", "Épaules"] }, { musclePrincipal: "Triceps", musclesSecondaires: [] }])` → `chest` et `triceps` principaux, `deltoids` secondaire ; le principal l'emporte sur le secondaire ;
  - ordre : principaux d'abord, par fréquence décroissante ;
  - un nom inconnu ou « Système cardiovasculaire » est ignoré.
- [ ] **Step 2 :** `pnpm --filter @better-lift/shared test` → échec.
- [ ] **Step 3 : implémenter** la table `ZONE_DU_MUSCLE` (Triceps→triceps, Épaules/Deltoïdes/Deltoïdes postérieurs/Coiffe des rotateurs→deltoids, Biceps/Brachial→biceps, Ischio-jambiers→hamstring, Avant-bras/Poignets/Extenseurs du poignet/Fléchisseurs du poignet/Muscles de la prise→forearm, Fessiers/Abducteurs→gluteal, Pectoraux/Haut des pectoraux→chest, Quadriceps→quadriceps, Mollets/Soléaire→calves, Abdominaux/Gainage/Bas des abdominaux→abs, Haut du dos/Grand dorsal/Rhomboïdes/Dos→upper-back, Trapèzes/Élévateur de la scapula→trapezius, Obliques/Dentelé antérieur→obliques, Bas du dos/Érecteurs du rachis→lower-back, Adducteurs/Intérieur des cuisses→adductors, Tibias→tibialis, Sterno-cléido-mastoïdien→neck) ; `MUSCLES_SANS_ZONE` = Système cardiovasculaire, Fléchisseurs de hanche, Chevilles, Pieds, Mains, Stabilisateurs de la cheville.
- [ ] **Step 4 :** tests verts ; exporter depuis `index.ts`.
- [ ] **Step 5 : commit** `feat(shared): zones du corps travaillées par une routine`.

### Task 3 : la copie de travail de l'éditeur passe dans `shared`

**Files:**
- Create: `packages/shared/src/brouillon-routine.ts`, `packages/shared/src/brouillon-routine.test.ts`
- Delete: `apps/web/src/features/routines/brouillon.ts`
- Modify: `apps/web/src/features/routines/{editeur-routine,tableau-series,carte-exercice,requetes}.tsx|ts`, `packages/shared/src/index.ts`

**Interfaces:**
- Produces (toutes prennent `systeme: UnitSystem` quand une charge est en jeu) : types `SerieBrouillon`, `ExerciceBrouillon`, `Brouillon` ; `versBrouillon(r: RoutineDetail | null, systeme)`, `nouvelExercice(slug, nom)`, `repsInvalides(t)`, `chargeInvalide(t, systeme)`, `brouillonValide(b, systeme)`, `versSaisie(b, systeme): RoutineSaisie`, `empreinte(b): string`.
- `cle` : compteur + horodatage en base 36 (pas de `crypto`).

- [ ] **Step 1 : tests** — aller-retour `versBrouillon` → `versSaisie` d'une routine (charges 82,5 kg en métrique) ; saisie « 82, » refusée ; reps « 1000 » refusées ; repos « 3601 » refusé ; nom vide ou aucun exercice → invalide ; `empreinte` ignore `cle` ; `nouvelExercice` a trois séries normales vides.
- [ ] **Step 2 :** échec attendu.
- [ ] **Step 3 : implémenter** en déplaçant le code web (paramètre `systeme` à la place de `SYSTEME_UNITES`), `versSaisie` rendant directement la saisie de l'API (`{ nom, exercices: [{ slug, reposSec, series }] }`).
- [ ] **Step 4 :** brancher le web : imports depuis `@better-lift/shared`, `SYSTEME_UNITES` passé en argument ; `RoutineEnregistree` devient `RoutineSaisie` ; `requetes.ts` n'a plus de `versSaisie` propre. `pnpm typecheck && pnpm test && pnpm lint && pnpm knip` → vert ; capture Playwright de `/routines/$id` inchangée.
- [ ] **Step 5 : commit** `refactor: copie de travail des routines partagée entre web et mobile`.

### Task 4 : dépendances mobile

- [ ] `cd apps/mobile && npx expo install react-native-body-highlighter react-native-draggable-flatlist react-native-reanimated react-native-gesture-handler` (`body-highlighter` et `draggable-flatlist` ne sont pas suivis par Expo : `expo install` retombe sur `pnpm add`, vérifier la version posée).
- [ ] `app/_layout.tsx` : envelopper la pile dans `GestureHandlerRootView style={{ flex: 1 }}`.
- [ ] Relancer Metro, ouvrir l'app : aucune erreur de module natif dans Expo Go.
- [ ] **commit** `chore(mobile): carte du corps et glisser-déposer`.

### Task 5 : page d'une routine façon opengym

**Files:**
- Create: `apps/mobile/components/routines/carte-muscles.tsx`
- Modify: `apps/mobile/app/(onglets)/routines/[id].tsx`, `packages/shared/src/routines.ts` (+ test : `dureeEstimeeSec`, `resumeSeries`)

**Interfaces:**
- Produces: `dureeEstimeeSec(exercices: ExerciceRoutine[]): number` (40 s par série + repos entre séries), `resumeSeries(series: SerieRoutine[], systeme): string` (« 3 × 8 · 60 kg » sur les séries normales, « + 1 échauffement »).
- `CarteMuscles({ exercices })` : titre « Muscles travaillés », deux `Body` (`side="front"` / `"back"`, `scale` adapté à la demi-largeur), `data = zones.map(z => ({ slug: z.zone, intensity: z.niveau === "principal" ? 2 : 1 }))`, `colors = [encrePale, encre]`, `defaultFill = surface3`, `border="none"` ; pastilles `LIBELLE_ZONE` dessous (principales en encre, secondaires en encre pâle).

- [ ] **Step 1 :** tests `shared` de `dureeEstimeeSec` et `resumeSeries` → échec → implémenter → vert.
- [ ] **Step 2 :** composant `CarteMuscles` ; vérifier sur le code de la bibliothèque que `intensity` indexe `colors` (1 → `colors[0]`).
- [ ] **Step 3 :** page : `EnteteRetour` avec action ✎ (`router.push({ pathname: "/routine-edition", params: { id } })`), ligne de résumé, `CarteMuscles`, cartes d'exercice (vignette `expo-image` 56 px, nom, `resumeSeries`, repos), bouton « Démarrer la routine » fixé en bas hors du `ScrollView`. États chargement / erreur conservés ; routine sans exercice : invite « Ajoute des exercices » vers l'édition.
- [ ] **Step 4 :** émulateur (compte de contrôle) : capture de « Push A » ; typecheck, lint.
- [ ] **Step 5 : commit** `feat(mobile): page d'une routine avec carte des muscles`.

### Task 6 : éditer, créer, supprimer sur mobile

**Files:**
- Create: `apps/mobile/app/routine-edition.tsx`, `apps/mobile/app/choisir-exercices.tsx`, `apps/mobile/components/routines/carte-exercice-edition.tsx`, `apps/mobile/lib/choix-exercices.ts`
- Modify: `apps/mobile/lib/requetes.ts` (mutations), `apps/mobile/app/_layout.tsx` (écrans), `apps/mobile/app/(onglets)/routines/index.tsx` (« Nouvelle routine »), `apps/mobile/components/ui/entete-retour.tsx` si une action à droite manque

**Interfaces:**
- `useCreerRoutine()`, `useRemplacerRoutine(id)`, `useSupprimerRoutine()` : mêmes contrats que le web, invalidation de `["routines"]` entière, erreurs réseau traduites.
- `lib/choix-exercices.ts` : petit canal module (`attendreChoix(): Promise<{ slug; nom }[]>`, `rendreChoix(choix)`) pour que la modale rende sa sélection à l'écran d'édition sans passer par les paramètres d'URL.

- [ ] **Step 1 :** mutations dans `requetes.ts`.
- [ ] **Step 2 :** `routine-edition.tsx` : lit `id` optionnel ; `useState(versBrouillon(initiale, SYSTEME_UNITES))` ; en-tête Annuler · « Modifier » / « Nouvelle routine » · Enregistrer (désactivé si `!brouillonValide`) ; champ nom ; `DraggableFlatList` des `CarteExerciceEdition` (`onLongPress={drag}` sur la poignée) ; pied « Ajouter des exercices » ; ⋯ d'en-tête « Supprimer la routine » (`Alert` de confirmation, puis retour à la liste). Quitter avec `empreinte` différente → `Alert` « Abandonner les modifications ? ».
- [ ] **Step 3 :** `CarteExerciceEdition` : vignette, nom, ⋯ (Retirer), repos (`TextInput` numérique, secondes), lignes de série (étiquette `etiquettesSeries` cliquable pour changer de type via `Alert`/menu, champs kg et reps `keyboardType="decimal-pad"` / `"number-pad"`, bordure danger si invalide, retrait de la série), « Ajouter une série » (copie la dernière).
- [ ] **Step 4 :** `choisir-exercices.tsx` (modale) : recherche (`optionsCatalogue`), liste avec vignette et case cochée, compteur et « Ajouter (N) » ; rend le choix par `rendreChoix`.
- [ ] **Step 5 :** onglet Routines : bouton « Nouvelle routine » en tête de liste → `/routine-edition`.
- [ ] **Step 6 :** émulateur : modifier une série et un repos, réordonner, ajouter deux exercices, retirer un exercice, enregistrer (la page reflète le changement) ; créer une routine ; la supprimer. typecheck, lint, knip.
- [ ] **Step 7 : commit** `feat(mobile): créer, modifier et supprimer une routine`.

### Task 7 : documentation et PR

- [ ] `CLAUDE.md` : section mobile — D82–D85, l'écran d'édition, la carte des muscles à l'encre, `brouillon-routine` dans `shared`, le piège `crypto.randomUUID` absent de Hermes ; retirer « Pas de compte ? Il se crée depuis le web » n'est PAS dans ce lot.
- [ ] `/verif` complet ; push ; PR `feat(mobile): routines indépendantes du web, carte des muscles`.
