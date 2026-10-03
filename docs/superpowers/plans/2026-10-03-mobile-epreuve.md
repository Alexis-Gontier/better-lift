# Mobile prêt pour l'épreuve — plan d'implémentation

> **Pour les agents :** sous-skill requise : superpowers:subagent-driven-development (recommandé)
> ou superpowers:executing-plans, tâche par tâche. Les étapes se cochent (`- [ ]`).

**But :** rendre l'app mobile utilisable un mois entier en salle à la place de Hevy — branche
Hevy fusionnée sans casser la prod, historique accessible, séance qui démarre et s'envoie sans
réseau, APK branché sur la prod.

**Architecture :** rien de neuf côté serveur, sauf un champ `recherche` dans le résumé d'un
exercice. Le mobile gagne un cache TanStack Query persistant (AsyncStorage, filtré sur ce qui sert
hors ligne), un préchargement à l'ouverture des onglets, des lectures « réseau d'abord, cache en
repli » au démarrage d'une séance, et un envoi relancé au retour du réseau ou du premier plan.
L'Accueil, vide jusqu'ici, devient le fil des séances.

**Stack :** Expo SDK 57 (Expo Go), Expo Router, TanStack Query 5.103.2,
`@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` (5.103.2),
`expo-network`, AsyncStorage 2.2.0, Hono RPC, Vitest.

**Conception :** [`2026-09-22-better-lift-redemarrage-design.md`](../specs/2026-09-22-better-lift-redemarrage-design.md)
§ 2 (périmètre du jalon : « fonctionnement hors ligne intégral »), § 8 (invariant du mobile),
§ 12 (« synchronisation au retour du réseau ») ; [`2026-09-26-mobile-seance-hevy-design.md`](../specs/2026-09-26-mobile-seance-hevy-design.md).
Les décisions D95–D100 ci-dessous sont consignées dans une spec à la tâche 7.

## Contraintes globales

- L'application est en français : libellés, commentaires, commits (Conventional Commits).
- `main` est protégée : PR obligatoire, squash seul, check `Qualité · typecheck · test · build`.
  Ne jamais pousser sur `main`.
- `packages/shared` : TypeScript pur, ni React, ni Prisma, ni API de plateforme.
- Dépendance Expo ou React Native : `npx expo install <paquet>` depuis `apps/mobile`, jamais une
  version de mémoire. Les paquets TanStack s'épinglent en version **exacte** `5.103.2`, comme
  `@tanstack/react-query`.
- Aucune dépendance native hors SDK : tout doit tourner dans **Expo Go**.
- **Clés de cache** : toute écriture invalide une clé au moins aussi large que la lecture. Les
  précédents vivent sous `["seances", …]` pour que l'envoi d'une séance (qui invalide
  `["seances"]`) les rafraîchisse.
- Toute production (base `production`, Vercel, EAS) se touche **après confirmation explicite de
  l'utilisateur**.
- L'agent ne lit pas le `.env`. Compte de vérification : `controle@better-lift.local` (base
  `betterlift`, branche Neon `dev`) — ne pas le supprimer.
- Vérification d'écran sur l'émulateur `better-lift` (voir `.claude/rules/mobile.md`, section
  « Lancer »). Couper le réseau : `adb shell cmd connectivity airplane-mode enable` (rétablir :
  `disable`). Captures : `adb shell screencap -p /sdcard/x.png` puis `adb pull` (jamais
  `exec-out` sous PowerShell) ; sous Git Bash, préfixer `MSYS_NO_PATHCONV=1`.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D95** | **L'Accueil est le fil des séances** (la liste de l'historique). Le détail reste `/historique/[id]` ; le nom d'un exercice y mène à sa fiche `/exercices/[slug]`, qui porte ses records | L'Accueil était vide et l'historique injoignable (`href: null`, aucun lien). C'est l'accueil de Hevy |
| **D96** | **Cache de requêtes persistant**, une clé AsyncStorage `better-lift:cache-requetes`, une semaine, **filtré** : routines (liste et détails), catalogue complet, précédents. L'historique n'y entre pas | Démarrer hors ligne exige ces trois lectures ; l'historique grossit sans fin et une ligne AsyncStorage Android plafonne vers 2 Mo |
| **D97** | **Le catalogue complet descend une fois** (pages de 100, ~1 300 exercices, ~400 Ko) et se **filtre sur le téléphone** par `filtrerCatalogue` de `shared`. Le résumé d'un exercice porte `recherche` (la colonne `nomRecherche`) | Ajouter un exercice en salle sans réseau ; garder la recherche française ET anglaise (D44) sans dupliquer la normalisation |
| **D98** | **Démarrer lit réseau d'abord, cache en repli**, sous un délai (4 s la routine, 3 s les précédents). Hors ligne sans cache : la routine est indisponible, les précédents sont vides | Un réseau de salle « connecté mais lent » ne doit pas figer l'appui ; une donnée de la veille vaut mieux que rien |
| **D99** | **L'envoi se relance seul** au retour du réseau (`expo-network` → `onlineManager`) et au retour de l'app au premier plan (`AppState`) | § 12 : « synchronisation au retour du réseau ». Jusqu'ici : au lancement, à la fin d'une séance, ou à la main |
| **D100** | **La garde de session ne renvoie à la connexion que sur une absence de session confirmée**, jamais sur une erreur de lecture | Hors ligne, une garde trop zélée rendrait la séance en cours inaccessible en salle |

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `packages/shared/src/recherche.ts` (+ test) | `filtrerCatalogue` — le filtre local, même normalisation que l'API |
| `packages/shared/src/exercices.ts` | `ExerciceResume.recherche` |
| `apps/api/src/services/exercices.ts` (+ tests) | Le résumé lit et rend `nomRecherche` |
| `apps/mobile/components/historique/liste-seances.tsx` (créé) | La liste des séances, sortie de l'écran Historique |
| `apps/mobile/app/(onglets)/index.tsx` | L'Accueil rend la liste |
| `apps/mobile/app/(onglets)/historique/index.tsx` | Rend la même liste (écran conservé) |
| `apps/mobile/app/(onglets)/historique/[id].tsx` | Nom d'exercice appuyable → fiche |
| `apps/mobile/lib/hors-ligne.ts` (créé) | Persistance (persister, filtre), délai, réseau et premier plan |
| `apps/mobile/components/preparer-hors-ligne.tsx` (créé) | Préchargement du cache tant qu'il y a du réseau |
| `apps/mobile/lib/requetes.ts` | `optionsCatalogueComplet`, `optionsPrecedents`, `chargerRoutine`, `chargerPrecedents(client, …)` |
| `apps/mobile/app/_layout.tsx` | `PersistQueryClientProvider` |
| `apps/mobile/app/(onglets)/_layout.tsx` | Garde D100, `<PreparerHorsLigne />` |
| `apps/mobile/lib/seance.tsx` | Envoi relancé (D99) |
| `apps/mobile/lib/demarrer.ts`, `apps/mobile/app/seance.tsx` | Lectures D98 |
| `apps/mobile/app/choisir-exercices.tsx` | Catalogue complet filtré localement |
| `apps/mobile/app/demarrer.tsx` | État « hors ligne » au lieu d'un chargement sans fin |

## Ordre et branches

- **Tâche 1** sur la branche actuelle `feat/mobile-seance-hevy`.
- **Tâches 2 à 7** sur `feat/mobile-epreuve`, créée depuis `main` **après** la fusion de la PR de
  la tâche 1 (pas de PR empilée : le squash les désaligne).
- **Tâche 8** (APK) après la fusion de la PR des tâches 2 à 7.

---

### Tâche 1 : migration de la note en production, puis PR de la séance façon Hevy

**Fichiers :** aucun changement de code.

**Interfaces :** aucune.

La migration `20260925233909_seance_exercice_note` est appliquée sur `dev` mais **pas sur
`production`** (vérifié le 3 octobre 2026 dans `_prisma_migrations`). La prod ne migre pas
seule : fusionner d'abord ferait écrire à l'API une colonne absente, et l'envoi de chaque séance
échouerait. La colonne est ajoutée en `NULL` : l'appliquer **avant** la fusion est sans risque
pour le code actuellement en ligne.

- [ ] **Étape 1 : demander le feu vert de l'utilisateur pour migrer la prod.** Ne rien faire sans
  lui. Lui proposer les deux chemins de l'étape 2.

- [ ] **Étape 2 : appliquer la migration sur `production`.**

  Chemin A, recommandé — l'utilisateur lance lui-même, avec l'URL **directe** (sans `-pooler`) de
  la base `betterlift` de la branche `production` :

  ```bash
  cd packages/db
  DIRECT_URL="postgresql://…/betterlift?sslmode=require" pnpm exec prisma migrate deploy
  ```

  Une variable d'environnement l'emporte sur le `.env` (`process.loadEnvFile` n'écrase pas).

  Chemin B, si l'utilisateur le demande — l'agent obtient l'URL par le MCP Neon
  (`get_connection_string`, projet `late-bar-51472267`, branche `br-purple-thunder-as4jo5s8`,
  base `betterlift`, rôle propriétaire, **non poolée**) et lance la même commande. Ne jamais
  écrire l'URL dans un fichier.

  Attendu : `1 migration found … Applying migration 20260925233909_seance_exercice_note … All
  migrations have been successfully applied.`

- [ ] **Étape 3 : vérifier sur la prod** (MCP Neon `run_sql`, branche `br-purple-thunder-as4jo5s8`,
  `database_name: "betterlift"`) :

  ```sql
  SELECT migration_name FROM _prisma_migrations ORDER BY started_at DESC LIMIT 1;
  SELECT column_name, data_type, character_maximum_length
  FROM information_schema.columns
  WHERE table_name = 'SeanceExercice' AND column_name = 'note';
  ```

  Attendu : `20260925233909_seance_exercice_note`, puis `note | character varying | 500`.

- [ ] **Étape 4 : vérifier la branche.** Lancer `/verif` (build, typecheck, test, lint, knip).
  Attendu : tout vert.

- [ ] **Étape 5 : pousser et ouvrir la PR.**

  ```bash
  git push -u origin feat/mobile-seance-hevy
  gh pr create --base main --title "feat(mobile): séance en cours façon Hevy, note et repos par exercice" --body "$(cat <<'EOF'
  ## Résumé
  - Écran de séance façon Hevy (D86–D94) : un bloc par exercice, colonne « Précédent », échelle compacte, actions rares en feuille basse.
  - Note libre par exercice, stockée (`SeanceExercice.note`, D90), affichée dans l'historique web et mobile.
  - Repos réglable par exercice (D91), type de série au numéro (D92), remplacer et réorganiser.

  ## Production
  - Migration `seance_exercice_note` déjà appliquée sur `production` avant la fusion (colonne nullable).

  ## Vérification
  - `/verif` vert ; écran vérifié sur l'émulateur.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```

- [ ] **Étape 6 : attendre le check requis**, puis laisser l'utilisateur fusionner (squash).
  Après fusion : `git switch main && git pull && git switch -c feat/mobile-epreuve`.

---

### Tâche 2 : le résumé d'un exercice porte son texte de recherche, et `shared` sait filtrer

**Fichiers :**
- Modifier : `packages/shared/src/exercices.ts` (type `ExerciceResume`)
- Modifier : `packages/shared/src/recherche.ts` (nouvelle fonction)
- Tester : `packages/shared/src/recherche.test.ts`
- Modifier : `apps/api/src/services/exercices.ts` (`CHAMPS_RESUME`, `versResume`)
- Tester : `apps/api/src/services/exercices.test.ts`, `apps/api/src/routes/exercices.test.ts`

**Interfaces :**
- Produit : `ExerciceResume.recherche: string` ;
  `filtrerCatalogue<T extends { recherche: string }>(liste: readonly T[], saisie: string): T[]`
  exporté par `@better-lift/shared`.

- [ ] **Étape 1 : écrire le test qui échoue** — ajouter à `packages/shared/src/recherche.test.ts` :

  ```ts
  import { filtrerCatalogue } from "./recherche.js";

  describe("filtrerCatalogue", () => {
    const liste = [
      { slug: "barbell-bench-press", recherche: "developpe couche a la barre barbell bench press" },
      { slug: "3-4-sit-up", recherche: "releve de buste 3 4 3 4 sit up" },
      { slug: "barbell-curl", recherche: "curl a la barre barbell curl" },
    ];

    it("rend tout, dans l'ordre reçu, quand la saisie est vide", () => {
      expect(filtrerCatalogue(liste, "   ").map((e) => e.slug)).toEqual([
        "barbell-bench-press",
        "3-4-sit-up",
        "barbell-curl",
      ]);
    });

    it("trouve en français malgré les accents et la casse", () => {
      expect(filtrerCatalogue(liste, "Développé COUCHÉ").map((e) => e.slug)).toEqual([
        "barbell-bench-press",
      ]);
    });

    it("trouve en anglais (D44)", () => {
      expect(filtrerCatalogue(liste, "bench press").map((e) => e.slug)).toEqual([
        "barbell-bench-press",
      ]);
    });

    it("traite les symboles comme des espaces, comme l'API", () => {
      expect(filtrerCatalogue(liste, "sit-up").map((e) => e.slug)).toEqual(["3-4-sit-up"]);
    });

    it("rend une liste vide quand rien ne correspond", () => {
      expect(filtrerCatalogue(liste, "squat")).toEqual([]);
    });
  });
  ```

  (Garder les imports `describe`/`it`/`expect` déjà présents en tête du fichier ; ajouter
  `filtrerCatalogue` à l'import existant de `./recherche.js` s'il y en a un.)

- [ ] **Étape 2 : vérifier l'échec.**
  Lancer : `pnpm --filter @better-lift/shared exec vitest run src/recherche.test.ts`
  Attendu : FAIL, `filtrerCatalogue` n'est pas exporté.

- [ ] **Étape 3 : implémenter** — ajouter à la fin de `packages/shared/src/recherche.ts` :

  ```ts
  /**
   * Le catalogue filtré SUR LE TÉLÉPHONE (D97), hors ligne compris. Même
   * normalisation que l'API, même sémantique (« contient ») : une saisie trouve
   * en ligne et hors ligne exactement les mêmes exercices. L'ordre reçu est gardé
   * — l'API trie déjà sur `nomRecherche`, donc sur le nom français.
   */
  export function filtrerCatalogue<T extends { recherche: string }>(
    liste: readonly T[],
    saisie: string,
  ): T[] {
    const q = normaliserRecherche(saisie);
    return q === "" ? [...liste] : liste.filter((e) => e.recherche.includes(q));
  }
  ```

  Vérifier que `packages/shared/src/index.ts` réexporte bien tout `./recherche.js`
  (`export * from "./recherche.js"`) ; sinon ajouter `filtrerCatalogue` à son export nommé.

- [ ] **Étape 4 : vérifier le succès.**
  Lancer : `pnpm --filter @better-lift/shared exec vitest run src/recherche.test.ts`
  Attendu : PASS.

- [ ] **Étape 5 : le type** — dans `packages/shared/src/exercices.ts`, ajouter à
  `ExerciceResume`, après `image` :

  ```ts
    /**
     * Les noms français et anglais normalisés (`nomRecherche`) : de quoi filtrer
     * le catalogue sur le téléphone, hors ligne, sans refaire la normalisation (D97).
     */
    recherche: string;
  ```

- [ ] **Étape 6 : le test API qui échoue** — dans `apps/api/src/services/exercices.test.ts`,
  le fixture `ligne` reçoit `nomRecherche: "developpe couche a la barre barbell bench press"`, et
  l'attendu de `versResume(ligne)` gagne `recherche: "developpe couche a la barre barbell bench press"`.
  L'attendu de `versDetail(ligne)` gagne la même ligne (le détail étend le résumé).
  Lancer : `pnpm --filter @better-lift/api exec vitest run src/services/exercices.test.ts`
  Attendu : FAIL sur `recherche`.

- [ ] **Étape 7 : implémenter côté API** — dans `apps/api/src/services/exercices.ts` :

  ```ts
  // Dans LigneExercice, après nomFr :
    /** Les deux noms normalisés (`texteRecherche`), écrits par le semis. */
    nomRecherche: string;

  // CHAMPS_RESUME gagne :
    nomRecherche: true,

  // versResume :
  export function versResume(
    ligne: Pick<LigneExercice, "slug" | "nomFr" | "nomRecherche" | "bodyPart" | "equipment" | "gifUrl">,
  ): ExerciceResume {
    return {
      slug: ligne.slug,
      nom: ligne.nomFr,
      groupe: ligne.bodyPart,
      equipement: ligne.equipment,
      image: imageDe(ligne.gifUrl),
      recherche: ligne.nomRecherche,
    };
  }
  ```

- [ ] **Étape 8 : le fixture de route** — dans `apps/api/src/routes/exercices.test.ts`, l'objet
  `resume: ExerciceResume` gagne `recherche: "developpe couche a la barre barbell bench press"`.

- [ ] **Étape 9 : tout vérifier.**
  Lancer : `pnpm test && pnpm typecheck`
  Attendu : vert. Si le web construit un `ExerciceResume` à la main quelque part, le typecheck le
  signale : y ajouter `recherche`.

- [ ] **Étape 10 : commit.**

  ```bash
  git add packages/shared/src/recherche.ts packages/shared/src/recherche.test.ts packages/shared/src/exercices.ts packages/shared/src/index.ts apps/api/src/services/exercices.ts apps/api/src/services/exercices.test.ts apps/api/src/routes/exercices.test.ts
  git commit -m "feat(catalogue): texte de recherche dans le résumé, filtre local partagé (D97)"
  ```

---

### Tâche 3 : l'Accueil devient le fil des séances, la fiche d'exercice redevient joignable

**Fichiers :**
- Créer : `apps/mobile/components/historique/liste-seances.tsx`
- Modifier : `apps/mobile/app/(onglets)/index.tsx`
- Modifier : `apps/mobile/app/(onglets)/historique/index.tsx`
- Modifier : `apps/mobile/app/(onglets)/historique/[id].tsx`

**Interfaces :**
- Consomme : `optionsSeances()` (`lib/requetes.ts`), `Chargement`, `Erreur`, `Vide`
  (`components/ui/etats.tsx`).
- Produit : `ListeSeances({ titre }: { titre: string })`.

- [ ] **Étape 1 : extraire la liste** — créer `apps/mobile/components/historique/liste-seances.tsx`
  avec **tout** le contenu actuel de `app/(onglets)/historique/index.tsx`, aux différences près :
  - la fonction s'appelle `ListeSeances`, est exportée nommément et reçoit `{ titre }: { titre: string }` ;
  - `<Text style={styles.titre}>Historique</Text>` devient `<Text style={styles.titre}>{titre}</Text>` ;
  - les imports relatifs remontent de deux niveaux au lieu de trois
    (`../ui/etats`, `../../lib/fuseau`, `../../lib/requetes`, `../../lib/temps`,
    `../../lib/theme`, `../../lib/unites`).

  En tête, ce commentaire :

  ```ts
  /**
   * Le fil des séances, antéchronologique (D95) : l'Accueil le montre, l'écran
   * Historique aussi. Le détail s'ouvre dans la pile de l'historique.
   */
  ```

- [ ] **Étape 2 : l'Accueil** — remplacer `apps/mobile/app/(onglets)/index.tsx` par :

  ```tsx
  import { ListeSeances } from "../../components/historique/liste-seances";

  /**
   * L'Accueil est le fil des séances (D95), comme celui de Hevy. Démarrer passe
   * par le bouton central, les routines par leur onglet, la file d'envoi par le
   * Profil.
   */
  export default function Accueil() {
    return <ListeSeances titre="Accueil" />;
  }
  ```

- [ ] **Étape 3 : l'écran Historique** — remplacer `apps/mobile/app/(onglets)/historique/index.tsx` par :

  ```tsx
  import { ListeSeances } from "../../../components/historique/liste-seances";

  export default function Historique() {
    return <ListeSeances titre="Historique" />;
  }
  ```

- [ ] **Étape 4 : la fiche depuis le détail** — dans `apps/mobile/app/(onglets)/historique/[id].tsx` :
  - importer `Pressable` depuis `react-native` et `useRouter` depuis `expo-router` ;
  - `const router = useRouter();` en tête du composant ;
  - remplacer `<Text style={styles.exercice}>{ex.nom}</Text>` par :

  ```tsx
  {/* La fiche porte les records de l'exercice (D95). */}
  <Pressable
    onPress={() => router.push(`/exercices/${ex.slug}`)}
    accessibilityRole="link"
    hitSlop={6}
  >
    <Text style={styles.exercice}>{ex.nom}</Text>
  </Pressable>
  ```

- [ ] **Étape 5 : typecheck.**
  Lancer : `pnpm --filter @better-lift/mobile typecheck`
  Attendu : vert.

- [ ] **Étape 6 : vérifier sur l'émulateur, les quatre états.** Connecté avec le compte de contrôle :
  1. Accueil : la liste des séances de démo s'affiche (nominal).
  2. Appui sur une séance : le détail s'ouvre ; **retour** ramène à l'Accueil.
  3. Appui sur un nom d'exercice : la fiche s'ouvre avec ses records.
  4. Mode avion puis tirer pour rafraîchir sans cache : l'état Erreur avec « Réessayer » (l'historique
     n'est pas persisté, D96 — c'est attendu).
  5. Chargement : visible au lancement à froid.
  6. Vide : non reproductible sur le compte de démo ; vérifier en lecture que la branche `Vide` est
     intacte dans `liste-seances.tsx`.

  Capturer l'Accueil et la fiche. Si un état manque, corriger avant de continuer.

- [ ] **Étape 7 : commit.**

  ```bash
  git add apps/mobile/components/historique/liste-seances.tsx "apps/mobile/app/(onglets)/index.tsx" "apps/mobile/app/(onglets)/historique/index.tsx" "apps/mobile/app/(onglets)/historique/[id].tsx"
  git commit -m "feat(mobile): l'Accueil devient le fil des séances, fiche joignable depuis le détail (D95)"
  ```

---

### Tâche 4 : le cache persistant et l'envoi qui se relance seul

**Fichiers :**
- Modifier : `apps/mobile/package.json` (dépendances)
- Créer : `apps/mobile/lib/hors-ligne.ts`
- Modifier : `apps/mobile/app/_layout.tsx`
- Modifier : `apps/mobile/lib/seance.tsx`
- Modifier : `apps/mobile/app/(onglets)/profil.tsx` (rien à changer si `client.clear()` y est
  déjà — à vérifier, voir étape 6)

**Interfaces :**
- Produit (dans `lib/hors-ligne.ts`) : `queryClient: QueryClient`, `persister`,
  `UNE_SEMAINE: number`, `gardeHorsLigne(query: Query): boolean`,
  `brancherReseauEtPremierPlan(): void`,
  `avantDelai<T>(promesse: Promise<T>, ms: number): Promise<T>`.

- [ ] **Étape 1 : dépendances.** Depuis `apps/mobile` :

  ```bash
  npx expo install expo-network
  pnpm add @tanstack/react-query-persist-client@5.103.2 @tanstack/query-async-storage-persister@5.103.2
  ```

  Vérifier que `package.json` porte `5.103.2` **sans** `^` pour les deux paquets TanStack (les
  corriger à la main sinon), et une plage `~57.x` pour `expo-network`.

- [ ] **Étape 2 : créer `apps/mobile/lib/hors-ligne.ts`** :

  ```ts
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
  import { focusManager, onlineManager, type Query, QueryClient } from "@tanstack/react-query";
  import * as Network from "expo-network";
  import { AppState } from "react-native";

  /**
   * Ce qui permet de s'entraîner sans réseau (D96–D99).
   *
   * Le BROUILLON et la FILE d'envoi ne passent pas par ici : ils ont leur propre
   * disque (`stockage.ts`, § 8). Ce module ne garde que des LECTURES, pour que
   * démarrer une routine et ajouter un exercice marchent en salle.
   */

  export const UNE_SEMAINE = 7 * 24 * 60 * 60 * 1000;

  // `gcTime` doit valoir au moins `maxAge` : une requête ramassée avant
  // l'écriture sur disque ne serait jamais persistée.
  export const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: UNE_SEMAINE } },
  });

  export const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "better-lift:cache-requetes",
  });

  /**
   * Ce qui entre dans le cache persistant (D96) : les routines, le catalogue
   * complet, les précédents. Pas l'historique : il grossit sans fin, et une
   * ligne AsyncStorage Android plafonne vers 2 Mo.
   */
  export function gardeHorsLigne(query: Query): boolean {
    if (query.state.status !== "success") return false;
    const [domaine, sorte] = query.queryKey as unknown[];
    return (
      domaine === "routines" ||
      (domaine === "exercices" && sorte === "complet") ||
      (domaine === "seances" && sorte === "precedents")
    );
  }

  /**
   * Le réseau et le premier plan, branchés sur TanStack Query (D99). Sans le
   * premier, `onlineManager` croit toujours être en ligne sous React Native ;
   * sans le second, `focusManager` ne sait jamais que l'app revient au premier plan.
   * `isConnected` plutôt que `isInternetReachable`, qui vaut souvent `null` sur
   * l'émulateur. Appelée UNE fois, au chargement du module de la racine.
   */
  export function brancherReseauEtPremierPlan(): void {
    onlineManager.setEventListener((setOnline) => {
      const abonnement = Network.addNetworkStateListener((etat) => {
        setOnline(Boolean(etat.isConnected));
      });
      return () => abonnement.remove();
    });
    focusManager.setEventListener((setFocused) => {
      const abonnement = AppState.addEventListener("change", (etat) => {
        setFocused(etat === "active");
      });
      return () => abonnement.remove();
    });
  }

  /**
   * Une promesse qui abandonne au bout de `ms` (D98) : un réseau de salle
   * « connecté mais lent » ne doit pas figer un appui. La requête sous-jacente
   * continue ; si elle aboutit, elle remplit le cache pour la fois suivante.
   */
  export function avantDelai<T>(promesse: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resoudre, rejeter) => {
      const minuteur = setTimeout(() => rejeter(new Error("Délai dépassé.")), ms);
      promesse.then(
        (v) => {
          clearTimeout(minuteur);
          resoudre(v);
        },
        (e) => {
          clearTimeout(minuteur);
          rejeter(e);
        },
      );
    });
  }
  ```

- [ ] **Étape 3 : la racine** — dans `apps/mobile/app/_layout.tsx` :
  - supprimer `const queryClient = new QueryClient();` et l'import de `QueryClient` /
    `QueryClientProvider` ;
  - ajouter :

  ```tsx
  import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
  import {
    brancherReseauEtPremierPlan,
    gardeHorsLigne,
    persister,
    queryClient,
    UNE_SEMAINE,
  } from "../lib/hors-ligne";

  brancherReseauEtPremierPlan();
  ```

  - remplacer `<QueryClientProvider client={queryClient}>` … `</QueryClientProvider>` par :

  ```tsx
  {/* Le cache des lectures survit à l'arrêt de l'app (D96) : routines,
      catalogue et précédents restent lisibles sans réseau. `buster` se monte
      quand la forme d'une réponse change, pour jeter un cache incompatible. */}
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister,
      maxAge: UNE_SEMAINE,
      buster: "1",
      dehydrateOptions: { shouldDehydrateQuery: gardeHorsLigne },
    }}
  >
    …
  </PersistQueryClientProvider>
  ```

- [ ] **Étape 4 : l'envoi qui se relance (D99)** — dans `apps/mobile/lib/seance.tsx` :
  - importer `onlineManager` depuis `@tanstack/react-query` (à côté de `useQueryClient`) et
    `AppState` depuis `react-native` ;
  - après l'effet « Au démarrage : relire le disque… », ajouter :

  ```tsx
  // D99 : retenter dès que le réseau revient, et à chaque retour au premier plan
  // — jusqu'ici, une séance terminée en salle attendait le prochain lancement.
  // `synchroniser` est verrouillée : deux déclencheurs simultanés n'envoient
  // qu'une fois.
  useEffect(() => {
    const finReseau = onlineManager.subscribe((enLigne) => {
      if (enLigne) void synchroniser();
    });
    const finPremierPlan = AppState.addEventListener("change", (etat) => {
      if (etat === "active") void synchroniser();
    });
    return () => {
      finReseau();
      finPremierPlan.remove();
    };
  }, [synchroniser]);
  ```

- [ ] **Étape 5 : typecheck et lint.**
  Lancer : `pnpm --filter @better-lift/mobile typecheck && pnpm lint`
  Attendu : vert.

- [ ] **Étape 6 : la déconnexion vide aussi le disque.** Lire `app/(onglets)/profil.tsx` :
  `seDeconnecter` appelle `client.clear()`. Le `PersistQueryClientProvider` persiste le cache vidé ;
  vérifier sur l'émulateur à l'étape 7 qu'après déconnexion puis reconnexion avec un autre compte,
  aucune routine du premier n'apparaît. Si elle apparaît, ajouter
  `await persister.removeClient();` après `client.clear()` (import depuis `../../lib/hors-ligne`).

- [ ] **Étape 7 : vérifier sur l'émulateur.** Relancer Metro (`CI=1` ne surveille pas les fichiers).
  1. Connecté, ouvrir l'onglet Routines (remplit le cache), puis fermer l'app (`adb shell am force-stop host.exp.exponent`).
  2. Mode avion, relancer : les routines s'affichent depuis le cache.
  3. Mode avion : faire une séance courte (vide, une série cochée faute d'exercice — l'ajout
     d'exercice hors ligne vient à la tâche 5), la terminer. Profil : « 1 séance en attente ».
  4. Couper le mode avion **sans toucher l'app** : en quelques secondes, Profil passe à « Rien »
     et la séance apparaît sur l'Accueil après rafraîchissement.
  5. Recommencer 3, puis mettre l'app en arrière-plan, couper le mode avion, la rouvrir :
     l'envoi part au retour au premier plan.
  6. Déconnexion / reconnexion (étape 6).

  Si une séance vide est refusée par l'API, en faire une depuis une routine (en ligne), puis passer
  en mode avion avant de la terminer.

- [ ] **Étape 8 : commit.**

  ```bash
  git add apps/mobile/package.json pnpm-lock.yaml apps/mobile/lib/hors-ligne.ts apps/mobile/app/_layout.tsx apps/mobile/lib/seance.tsx "apps/mobile/app/(onglets)/profil.tsx"
  git commit -m "feat(mobile): cache des lectures persistant, envoi relancé au retour du réseau (D96, D99)"
  ```

---

### Tâche 5 : démarrer et ajouter un exercice sans réseau

**Fichiers :**
- Modifier : `apps/mobile/lib/requetes.ts`
- Créer : `apps/mobile/components/preparer-hors-ligne.tsx`
- Modifier : `apps/mobile/lib/demarrer.ts`
- Modifier : `apps/mobile/app/seance.tsx`
- Modifier : `apps/mobile/app/choisir-exercices.tsx`
- Modifier : `apps/mobile/app/demarrer.tsx`
- Modifier : `apps/mobile/app/(onglets)/_layout.tsx`

**Interfaces :**
- Consomme : `avantDelai`, `queryClient` (tâche 4) ; `filtrerCatalogue`,
  `ExerciceResume.recherche` (tâche 2).
- Produit (dans `lib/requetes.ts`) : `optionsCatalogueComplet()`,
  `optionsPrecedents(slugs: string[])`,
  `chargerRoutine(client: QueryClient, id: string)`,
  `chargerPrecedents(client: QueryClient, slugs: string[]): Promise<Precedents>` (la signature
  change : le client en premier). Dans `components/preparer-hors-ligne.tsx` : `PreparerHorsLigne()`.

- [ ] **Étape 1 : les lectures** — dans `apps/mobile/lib/requetes.ts` :
  - importer `type QueryClient` depuis `@tanstack/react-query`, `type ExerciceResume` depuis
    `@better-lift/shared` et `avantDelai, UNE_SEMAINE` depuis `./hors-ligne` ;
  - ajouter après `optionsCatalogue` :

  ```ts
  /**
   * Le catalogue ENTIER, pour le filtrer sur le téléphone, hors ligne compris
   * (D97). Pages de 100 : l'API plafonne la taille, et c'est voulu. ~1 300
   * exercices, ~400 Ko, une fois par semaine au plus.
   */
  export function optionsCatalogueComplet() {
    return queryOptions({
      queryKey: ["exercices", "complet"],
      queryFn: async () => {
        const tous: ExerciceResume[] = [];
        for (let page = 1; ; page++) {
          const res = await api.exercices.$get({ query: { page: String(page), taille: "100" } });
          if (!res.ok) throw new Error("Le catalogue n'a pas pu être chargé.");
          const d = await res.json();
          tous.push(...d.exercices);
          if (d.exercices.length === 0 || tous.length >= d.total) return tous;
        }
      },
      // Le catalogue ne change qu'au semis.
      staleTime: UNE_SEMAINE,
    });
  }
  ```

  - remplacer le type `Precedents`, `chargerPrecedents` et son commentaire par :

  ```ts
  type Precedents = Record<
    string,
    { reps: number | null; chargeKg: number | null; faite: boolean }[]
  >;

  /**
   * Ce qui a été fait la dernière fois sur ces exercices (D67). Rangé sous
   * `["seances", …]` : l'envoi d'une séance invalide `["seances"]`, donc aussi
   * ceci. La clé trie les slugs : le même ensemble donne la même entrée.
   */
  export function optionsPrecedents(slugs: string[]) {
    const cle = [...new Set(slugs)].sort().join(",");
    return queryOptions({
      queryKey: ["seances", "precedents", cle],
      queryFn: async (): Promise<Precedents> => {
        const res = await api.seances.precedentes.$get({ query: { slugs: cle } });
        if (!res.ok) throw new Error("La dernière fois n'a pas pu être chargée.");
        return (await res.json()) as Precedents;
      },
    });
  }

  // Réseau d'abord, sans tentative ni pause hors ligne : la décision de se
  // rabattre sur le cache est prise ici, pas par TanStack Query (D98).
  const SANS_ATTENTE = { retry: false, networkMode: "always", staleTime: 0 } as const;

  /**
   * Ne BLOQUE jamais : réseau sous 3 s, sinon la dernière réponse en cache,
   * sinon rien. En salle, on démarre sans indication plutôt que d'attendre.
   */
  export async function chargerPrecedents(
    client: QueryClient,
    slugs: string[],
  ): Promise<Precedents> {
    if (slugs.length === 0) return {};
    const options = optionsPrecedents(slugs);
    try {
      return await avantDelai(client.fetchQuery({ ...options, ...SANS_ATTENTE }), 3000);
    } catch {
      return client.getQueryData(options.queryKey) ?? {};
    }
  }

  /**
   * Le détail d'une routine pour la démarrer : réseau sous 4 s, sinon le cache
   * (D98). Sans l'un ni l'autre, l'erreur remonte : l'appelant le dit.
   */
  export async function chargerRoutine(client: QueryClient, id: string) {
    const options = optionsRoutine(id);
    try {
      return await avantDelai(client.fetchQuery({ ...options, ...SANS_ATTENTE }), 4000);
    } catch (e) {
      const enCache = client.getQueryData(options.queryKey);
      if (enCache) return enCache;
      throw e;
    }
  }
  ```

- [ ] **Étape 2 : le préchargement** — créer `apps/mobile/components/preparer-hors-ligne.tsx` (un fichier à part : `requetes.ts` importe `hors-ligne.ts`, l'inverse ferait un cycle) :

  ```tsx
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import { useEffect } from "react";
  import {
    chargerPrecedents,
    optionsCatalogueComplet,
    optionsRoutine,
    optionsRoutines,
  } from "../lib/requetes";

  /**
   * Remplit le cache persistant pendant qu'il y a du réseau (D96) : la liste et
   * le détail de chaque routine, leurs précédents, le catalogue complet. Monté
   * sous la garde de session, il ne s'exécute que connecté. Ne rend rien.
   */
  export function PreparerHorsLigne() {
    const client = useQueryClient();
    const routines = useQuery(optionsRoutines());
    useQuery(optionsCatalogueComplet());

    useEffect(() => {
      if (!routines.data) return;
      for (const r of routines.data) {
        void client
          .fetchQuery(optionsRoutine(r.id))
          .then((d) => chargerPrecedents(client, d.exercices.map((e) => e.slug)))
          .catch(() => {});
      }
    }, [routines.data, client]);

    return null;
  }
  ```

- [ ] **Étape 3 : le monter** — dans `apps/mobile/app/(onglets)/_layout.tsx`, importer
  `PreparerHorsLigne` depuis `../../components/preparer-hors-ligne` et l'insérer comme premier enfant rendu,
  c'est-à-dire envelopper le retour :

  ```tsx
  return (
    <>
      {/* Hors ligne (D96) : remplir le cache tant qu'il y a du réseau. */}
      <PreparerHorsLigne />
      <Tabs …>…</Tabs>
    </>
  );
  ```

- [ ] **Étape 4 : démarrer** — dans `apps/mobile/lib/demarrer.ts` :
  - l'import devient `import { chargerPrecedents, chargerRoutine } from "./requetes";` ;
  - dans `routine`, remplacer les deux lectures par :

  ```ts
      // Réseau d'abord, cache en repli (D98) : en salle, la routine de la veille
      // vaut mieux qu'un refus.
      const detail = await chargerRoutine(client, id);
      // La dernière fois entre dans le brouillon AVANT son écriture (D67).
      const precedents = await chargerPrecedents(client, detail.exercices.map((e) => e.slug));
  ```

  - le message d'erreur devient :
    `Alert.alert("Routine indisponible", "Elle n'a jamais été chargée sur ce téléphone. Ouvre-la une fois avec du réseau.");`

- [ ] **Étape 5 : la séance** — dans `apps/mobile/app/seance.tsx` :
  - importer `useQueryClient` depuis `@tanstack/react-query` ; `const client = useQueryClient();`
    dans le composant ;
  - `chargerPrecedents(choix.map((c) => c.slug))` → `chargerPrecedents(client, choix.map((c) => c.slug))` ;
  - `chargerPrecedents([c.slug])` → `chargerPrecedents(client, [c.slug])`.

- [ ] **Étape 6 : le catalogue** — dans `apps/mobile/app/choisir-exercices.tsx` :
  - imports : `filtrerCatalogue` depuis `@better-lift/shared` (à côté de `LIBELLE_GROUPE`),
    `useMemo` depuis `react`, `optionsCatalogueComplet` au lieu de `optionsCatalogue` ;
  - remplacer `const catalogue = useQuery(optionsCatalogue(filtre.trim()));` par :

  ```tsx
    // Le catalogue entier, filtré ici (D97) : la recherche marche hors ligne et
    // répond à chaque lettre sans aller-retour.
    const catalogue = useQuery(optionsCatalogueComplet());
    const resultats = useMemo(
      () => (catalogue.data ? filtrerCatalogue(catalogue.data, filtre) : []),
      [catalogue.data, filtre],
    );
  ```

  - dans le rendu : `catalogue.data.length === 0` → `resultats.length === 0`, et
    `data={catalogue.data}` → `data={resultats}` ;
  - l'état Erreur reçoit un message qui couvre le hors ligne :
    `message="Le catalogue n'a pas pu être chargé. Il faut du réseau la première fois."`.

  Garder `optionsCatalogue` dans `requetes.ts` : l'écran `exercices/index.tsx` s'en sert toujours.

- [ ] **Étape 7 : « Démarrer » hors ligne sans cache** — dans `apps/mobile/app/demarrer.tsx`,
  hors ligne et sans cache, `routines.isPending` resterait vrai pour toujours (requête en pause).
  Remplacer la condition `routines.isPending ? (` par :

  ```tsx
  routines.isPending && routines.fetchStatus === "paused" ? (
    <Text style={styles.pale}>Hors ligne : les routines apparaîtront au retour du réseau.</Text>
  ) : routines.isPending ? (
  ```

  (garder la branche de chargement existante derrière ; `styles.pale` existe déjà dans l'écran).

- [ ] **Étape 8 : typecheck, tests, lint, knip.**
  Lancer : `pnpm typecheck && pnpm test && pnpm lint && pnpm knip`
  Attendu : vert. Si knip signale `optionsCatalogue` inutilisé, c'est que `exercices/index.tsx`
  ne l'importe plus — ne pas le supprimer sans vérifier.

- [ ] **Étape 9 : vérifier sur l'émulateur.**
  1. En ligne, connecté : ouvrir l'app et attendre ~10 s (préchargement), puis `force-stop`.
  2. Mode avion, relancer, bouton central → « Démarrer » : les routines sont listées. En démarrer
     une : la séance s'ouvre avec ses exercices **et la colonne « Précédent » remplie**.
  3. Toujours hors ligne : « + Ajouter un exercice » → chercher « développé » puis « bench » : des
     résultats dans les deux cas. En ajouter un.
  4. Terminer, couper le mode avion : l'envoi part seul (tâche 4).
  5. Ouvrir une routine **jamais vue** hors ligne n'est pas possible depuis l'interface (elles sont
     toutes préchargées) : vérifier en lecture que le message d'erreur de `demarrer.ts` reste
     atteignable.
  6. Mesurer : l'appui sur une routine hors ligne ouvre la séance en moins de ~4 s.

- [ ] **Étape 10 : commit.**

  ```bash
  git add apps/mobile/lib/requetes.ts apps/mobile/components/preparer-hors-ligne.tsx apps/mobile/lib/demarrer.ts apps/mobile/app/seance.tsx apps/mobile/app/choisir-exercices.tsx apps/mobile/app/demarrer.tsx "apps/mobile/app/(onglets)/_layout.tsx"
  git commit -m "feat(mobile): démarrer une routine et ajouter un exercice sans réseau (D97, D98)"
  ```

---

### Tâche 6 : la session tient sans réseau

**Fichiers :**
- Modifier : `apps/mobile/app/(onglets)/_layout.tsx`

**Interfaces :** aucune nouvelle.

Better Auth Expo garde une copie de la session dans SecureStore (`better-lift_session_data`) et
la réhydrate avant `get-session`. Ce qu'il fait quand la requête échoue ensuite n'est pas
documenté : on l'éprouve d'abord.

- [ ] **Étape 1 : éprouver.** Connecté, avec une séance en cours. `force-stop`, mode avion,
  relancer. Noter ce qui s'affiche : les onglets, ou l'écran de connexion ?

- [ ] **Étape 2 : durcir la garde (D100)**, quel que soit le résultat de l'étape 1 (le comportement
  de la bibliothèque peut changer avec une mise à jour). Dans `apps/mobile/app/(onglets)/_layout.tsx` :

  ```tsx
    const { data: session, isPending, error } = authClient.useSession();
    …
    if (isPending) return <Chargement />;
    // D100 : la connexion seulement quand le serveur a DIT « pas de session ».
    // Une erreur de lecture (hors ligne) laisse passer : le cookie est toujours
    // sur le téléphone, et la séance en cours doit rester joignable en salle.
    if (!session && !error) return <Redirect href="/connexion" />;
  ```

- [ ] **Étape 3 : typecheck.**
  Lancer : `pnpm --filter @better-lift/mobile typecheck`
  Attendu : vert.

- [ ] **Étape 4 : vérifier sur l'émulateur.**
  1. Rejouer l'étape 1 : les onglets s'affichent, le bouton central dit « Reprendre », la séance
     s'ouvre intacte.
  2. Couper le mode avion : les écrans se remplissent, l'envoi part.
  3. Se déconnecter (en ligne) : l'écran de connexion s'affiche bien (la garde redirige toujours
     sur une absence confirmée).

- [ ] **Étape 5 : commit.**

  ```bash
  git add "apps/mobile/app/(onglets)/_layout.tsx"
  git commit -m "fix(mobile): la garde de session laisse passer hors ligne (D100)"
  ```

---

### Tâche 7 : consigner les décisions, vérifier, ouvrir la PR

**Fichiers :**
- Créer : `docs/superpowers/specs/2026-10-03-mobile-epreuve-design.md`
- Modifier : `.claude/rules/mobile.md`
- Modifier : `CLAUDE.md` (section « État », une phrase)

- [ ] **Étape 1 : la spec** — créer `docs/superpowers/specs/2026-10-03-mobile-epreuve-design.md` :
  en-tête (date 3 octobre 2026, statut validée, surface mobile + `shared` + API), un paragraphe
  « But » (le § 2 promet le hors ligne intégral, l'audit du 3 octobre a montré trois trous :
  démarrer depuis une routine, ajouter un exercice, envoi au retour du réseau ; plus l'historique
  injoignable), puis **le tableau des décisions D95–D100 de ce plan, recopié tel quel**, puis
  « Hors périmètre » : historique hors ligne, précédents d'un exercice ajouté jamais vu en ligne,
  routines créées hors ligne.

- [ ] **Étape 2 : les règles mobiles** — dans `.claude/rules/mobile.md` :
  - section Navigation : « Accueil et Stats sont vides pour l'instant » devient « Stats est vide
    pour l'instant ; l'Accueil est le fil des séances (D95). Historique et Exercices ont quitté la
    barre mais restent joignables : détail d'une séance depuis l'Accueil, fiche d'exercice depuis
    le détail. » ;
  - nouvelle section **Hors ligne (D96–D100)** :

  ```md
  ## Hors ligne (D96–D100)

  Conception : [`2026-10-03-mobile-epreuve-design.md`](../../docs/superpowers/specs/2026-10-03-mobile-epreuve-design.md).

  - Cache TanStack Query persistant (`lib/hors-ligne.ts`, clé `better-lift:cache-requetes`),
    **filtré** par `gardeHorsLigne` : routines, catalogue complet, précédents. Une nouvelle
    lecture utile hors ligne s'y ajoute explicitement. Forme d'une réponse persistée changée :
    monter `buster` dans `app/_layout.tsx`.
  - `<PreparerHorsLigne />` (`components/preparer-hors-ligne.tsx`, sous la garde de session)
    remplit ce cache en ligne.
  - Démarrer lit réseau d'abord sous délai, cache en repli (`chargerRoutine`,
    `chargerPrecedents`). Jamais `fetchQuery` nu dans un chemin de salle : hors ligne, il se met
    en pause et l'appui ne rend jamais la main.
  - Le catalogue se filtre sur le téléphone (`filtrerCatalogue` de `shared`).
  - L'envoi se relance au retour du réseau et du premier plan (`lib/seance.tsx`).
  - La garde de session ne redirige que sur une absence confirmée, jamais sur une erreur.
  ```

- [ ] **Étape 3 : CLAUDE.md** — dans « État », après « plus les routines sur mobile (D82–D85) »,
  ajouter « , la séance façon Hevy (D86–D94) et le hors ligne du mobile (D95–D100) ».

- [ ] **Étape 4 : tout vérifier.** Lancer `/verif`. Attendu : vert.

- [ ] **Étape 5 : commit, push, PR.**

  ```bash
  git add docs/superpowers/specs/2026-10-03-mobile-epreuve-design.md .claude/rules/mobile.md CLAUDE.md
  git commit -m "docs: le hors ligne du mobile et l'Accueil en fil des séances (D95–D100)"
  git push -u origin feat/mobile-epreuve
  gh pr create --base main --title "feat(mobile): prêt pour l'épreuve — hors ligne et fil des séances" --body "$(cat <<'EOF'
  ## Résumé
  - L'Accueil devient le fil des séances ; la fiche d'exercice (records) se rejoint depuis le détail (D95).
  - Cache des lectures persistant et filtré : routines, catalogue complet, précédents (D96).
  - Catalogue filtré sur le téléphone, français et anglais, hors ligne (D97) — le résumé d'un exercice porte `recherche`.
  - Démarrer une routine sans réseau : réseau d'abord sous délai, cache en repli (D98).
  - Envoi relancé au retour du réseau et du premier plan (D99).
  - La garde de session laisse passer hors ligne (D100).

  ## Vérification
  - `/verif` vert.
  - Émulateur, mode avion : démarrer une routine avec précédents, ajouter un exercice, terminer, envoi automatique au retour du réseau, relance à froid avec séance en cours.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```

- [ ] **Étape 6 :** attendre le check requis ; l'utilisateur fusionne.

---

### Tâche 8 : l'APK de l'épreuve, branché sur la prod

**Fichiers :** aucun (sauf si l'étape 2 révèle une variable manquante).

**Interfaces :** aucune.

À faire **après** la fusion de la tâche 7 (la prod Vercel se redéploie à chaque fusion). Chaque
étape qui touche EAS se fait avec l'accord de l'utilisateur.

- [ ] **Étape 1 : la prod répond.**

  ```bash
  curl -s https://better-lift.vercel.app/api/health
  ```

  Attendu : une réponse 200 de l'API.

- [ ] **Étape 2 : l'URL d'API de l'APK.** Depuis `apps/mobile` :

  ```bash
  npx eas-cli env:list --environment preview
  ```

  Attendu : `EXPO_PUBLIC_API_URL=https://better-lift.vercel.app/api`. `lib/config.ts` retire le
  suffixe `/api` pour l'authentification. Si la variable manque ou diffère, **demander à
  l'utilisateur** avant de la créer :
  `npx eas-cli env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://better-lift.vercel.app/api --visibility plaintext`.

- [ ] **Étape 3 : l'origine de l'app est acceptée par l'API.** Vérifier que `trustedOrigins` de
  Better Auth (côté `apps/api`) contient `better-lift://` en production (grep
  `trustedOrigins` dans `apps/api/src`). Sinon, s'arrêter et le signaler.

- [ ] **Étape 4 : construire.**

  ```bash
  npx eas-cli build --profile preview --platform android --non-interactive
  ```

  File gratuite : jusqu'à une heure. Attendu : un lien d'APK. L'artefact expire au bout de
  14 jours — le dire à l'utilisateur.

- [ ] **Étape 5 : éprouver sur l'émulateur avant le téléphone.**

  ```bash
  adb install -r <chemin-de-l-apk>
  ```

  Se connecter avec le **vrai compte** de l'utilisateur (c'est lui qui saisit le mot de passe), puis
  rejouer en court la vérification de la tâche 5 (mode avion → routine → exercice ajouté → retour
  réseau → séance visible sur https://better-lift.vercel.app).

- [ ] **Étape 6 : remettre à l'utilisateur** le lien de l'APK pour son téléphone, et rappeler les
  deux gestes de l'épreuve : ouvrir l'app une fois avec du réseau avant d'aller en salle
  (préchargement), et vérifier dans Profil qu'il ne reste rien « en attente d'envoi ».
