# Mobile wireframe — lot 1 (socle et coquille) : plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUISE : superpowers:subagent-driven-development (recommandé)
> ou superpowers:executing-plans, tâche par tâche. Les étapes sont des cases à cocher (`- [ ]`).

**But :** poser React Native Reusables sur Uniwind dans `apps/mobile`, passer l'ancien thème au
gris, retirer les écrans écartés et la barre d'onglets, et refaire la connexion et un accueil
unique qui lance les séances.

**Architecture :** Reusables (composants copiés dans `components/ui/`, stylés par classes
Tailwind via Uniwind) pour le code neuf ; l'ancien `creerStyles` / `useCouleurs` reste pour la
séance, la fin et le Profil jusqu'aux lots 2 et 3, ses valeurs passées en `neutral`. Une garde
de session dans un groupe `(connecte)` remplace celle des onglets.

**Stack :** Expo SDK 57 (Expo Go), Expo Router, Uniwind (Tailwind 4), React Native Reusables,
`@rn-primitives/*`, TanStack Query.

**Spec :** `docs/superpowers/specs/2026-10-20-mobile-wireframe-design.md`

## Contraintes globales

- Tout en français : interface, commentaires, commits (Conventional Commits, sujet en minuscule,
  100 caractères au plus), docs.
- Expo Go seulement (D80) : aucune dépendance native hors SDK. Dépendance Expo / RN :
  `npx expo install <paquet>` depuis `apps/mobile`, jamais une version de mémoire. Metro lancé
  avant une installation se relance avec `--clear`.
- TypeScript 6.0.3 et React 19.2.3 fixés : ne rien monter.
- Version d'une bibliothèque : Context7 (`/uni-stack/uniwind`, `/founded-labs/react-native-reusables`).
- Toute charge passe par `formaterCharge` / `lireCharge` ; fuseau et unités dans `lib/fuseau.ts`
  et `lib/unites.ts`.
- Chaque écran porte quatre états (vide, chargement, erreur, nominal).
- Cible tactile de 48 au minimum ; titre avec `accessibilityRole="header"`.
- Jamais de couleur en dur : classes de tokens (`bg-background`, `text-muted-foreground`…) dans le
  code neuf, `useCouleurs()` dans l'ancien.
- `git add <fichier>` seulement, jamais un dossier. Jamais de push sur `main`.
- Une tâche finit par `pnpm --filter @better-lift/mobile typecheck` vert ; le lot par `/verif` et
  des captures sur l'émulateur, sombre et clair.
- Lancer l'app : voir `.claude/rules/mobile.md` (Metro, `adb reverse`, lien Expo Go nommant
  `host.exp.exponent`, pas de `force-stop`). Compte : `controle@better-lift.local` (mot de passe
  donné par l'utilisateur ; ne jamais supprimer ce compte).

---

### Tâche 1 : Uniwind dans Expo Go (essai bloquant)

**Fichiers :**
- Créer : `apps/mobile/global.css`
- Modifier : `apps/mobile/metro.config.js`, `apps/mobile/app/_layout.tsx`, `apps/mobile/package.json`
- Créer (généré) : `apps/mobile/uniwind-types.d.ts`

**Interfaces :**
- Produit : les classes de tokens `background`, `foreground`, `card`, `card-foreground`,
  `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`,
  `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`,
  `destructive`, `border`, `input`, `ring` ; `Uniwind.setTheme('light' | 'dark' | 'system')`.

- [ ] **Étape 1 : installer**

```bash
cd apps/mobile && npx expo install uniwind tailwindcss
```

Vérifier dans `package.json` que `tailwindcss` est en 4.x (le web est en `4.3.3` : aligner si
`expo install` en propose une autre 4.x).

- [ ] **Étape 2 : `global.css`** — tokens `neutral` de shadcn, deux registres

```css
@import "tailwindcss";
@import "uniwind";

/* Tokens du mobile (spec 2026-10-20) : palette neutral de shadcn, comme le web.
   La direction artistique viendra après l'app construite : on ne change que ces valeurs. */
@layer theme {
  :root {
    @variant light {
      --color-background: #ffffff;
      --color-foreground: #0a0a0a;
      --color-card: #ffffff;
      --color-card-foreground: #0a0a0a;
      --color-popover: #ffffff;
      --color-popover-foreground: #0a0a0a;
      --color-primary: #171717;
      --color-primary-foreground: #fafafa;
      --color-secondary: #f5f5f5;
      --color-secondary-foreground: #171717;
      --color-muted: #f5f5f5;
      --color-muted-foreground: #737373;
      --color-accent: #f5f5f5;
      --color-accent-foreground: #171717;
      --color-destructive: #dc2626;
      --color-border: #e5e5e5;
      --color-input: #e5e5e5;
      --color-ring: #a1a1a1;
    }
    @variant dark {
      --color-background: #0a0a0a;
      --color-foreground: #fafafa;
      --color-card: #171717;
      --color-card-foreground: #fafafa;
      --color-popover: #171717;
      --color-popover-foreground: #fafafa;
      --color-primary: #fafafa;
      --color-primary-foreground: #171717;
      --color-secondary: #262626;
      --color-secondary-foreground: #fafafa;
      --color-muted: #262626;
      --color-muted-foreground: #a3a3a3;
      --color-accent: #262626;
      --color-accent-foreground: #fafafa;
      --color-destructive: #f87171;
      --color-border: #262626;
      --color-input: #262626;
      --color-ring: #737373;
    }
  }
}
```

Vérifier la syntaxe exacte des thèmes dans Context7 (`/uni-stack/uniwind`, « theming ») ;
ajouter `--radius` ou les autres variables que les composants Reusables de la tâche 2
réclament (la doc Reusables, variante Uniwind, donne le `global.css` complet attendu).

- [ ] **Étape 3 : Metro** — `withUniwindConfig` en enveloppe la plus externe, la résolution
  `.js` → `.ts` des paquets gardée

```js
const { withUniwindConfig } = require("uniwind/metro");
// … config existante inchangée (resolveRequest) …
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
```

- [ ] **Étape 4 : importer la feuille** en tête de `app/_layout.tsx` : `import "../global.css";`
  (dans le layout, pas dans un index : sinon le rechargement à chaud casse).

- [ ] **Étape 5 : essai visible** — dans `app/connexion.tsx`, poser provisoirement
  `className="bg-primary"` sur le `View` de `styles.marque`. Relancer Metro avec `--clear`,
  ouvrir dans Expo Go, faire une capture.

Attendu : le bloc de la marque prend un fond quasi noir (clair) ou quasi blanc (sombre).
**Si Uniwind ne tourne pas dans Expo Go (erreur de bundle, classe sans effet), s'arrêter et
le dire à l'utilisateur** : le repli NativeWind change tout le plan.

- [ ] **Étape 6 : retirer la classe d'essai**, `typecheck` vert, commit

```bash
git add apps/mobile/global.css apps/mobile/metro.config.js apps/mobile/app/_layout.tsx apps/mobile/package.json apps/mobile/uniwind-types.d.ts pnpm-lock.yaml
git commit -m "feat(mobile): uniwind et les tokens neutral"
```

(Si `uniwind-types.d.ts` est régénéré à chaque lancement et varie, l'ignorer dans `.gitignore`
plutôt que de le commiter ; s'assurer alors que `tsc` le trouve quand même — sinon le commiter.)

---

### Tâche 2 : React Native Reusables et le thème branché

**Fichiers :**
- Créer : `apps/mobile/components.json`, `apps/mobile/lib/utils.ts`,
  `apps/mobile/components/ui/{text,button,input,label,icon,separator}.tsx` (par la CLI)
- Modifier : `apps/mobile/tsconfig.json`, `apps/mobile/app/_layout.tsx`,
  `apps/mobile/lib/theme-choix.ts`, `knip.json`, `apps/mobile/package.json`

**Interfaces :**
- Consomme : les tokens de la tâche 1.
- Produit : `cn(...classes)` dans `@/lib/utils` ; `Text`, `Button` (`variant` :
  `default | outline | ghost | secondary | destructive | link`, `size` : `default | sm | lg | icon`),
  `Input`, `Label`, `Icon` (`<Icon as={Lucide} className="size-5 text-foreground" />`),
  `Separator`, importés par `@/components/ui/<nom>`. Alias `@/*` → `apps/mobile/*`.

- [ ] **Étape 1 : alias** — dans `tsconfig.json`, `compilerOptions.paths` :
  `{ "@/*": ["./*"] }` (Metro d'Expo lit les `paths`).

- [ ] **Étape 2 : `components.json`** (copier la variante Uniwind de la doc Reusables ;
  `baseColor: "neutral"`, `css: "global.css"`, alias `@/components`, `@/components/ui`,
  `@/lib/utils`, `@/lib`, `@/hooks`).

- [ ] **Étape 3 : dépendances et composants**

```bash
cd apps/mobile
npx expo install class-variance-authority clsx tailwind-merge @rn-primitives/portal @rn-primitives/slot
npx @react-native-reusables/cli@latest add text button input label icon separator --styling-library uniwind --yes
```

Vérifier que la CLI a écrit dans `components/ui/` et `lib/utils.ts` sans toucher aux composants
maison du même dossier (`appuyable`, `etats`, `ecran-erreur`… — aucun nom ne se recoupe).
Toute dépendance native ajoutée par la CLI doit être dans Expo Go ; sinon s'arrêter.

- [ ] **Étape 4 : `PortalHost`** en dernier enfant des fournisseurs de `app/_layout.tsx`

```tsx
import { PortalHost } from "@rn-primitives/portal";
// … après <Stack>…</Stack>, dans ConfirmationProvider :
<PortalHost />
```

- [ ] **Étape 5 : le choix du thème passe par Uniwind** — `lib/theme-choix.ts`

```ts
import { Uniwind } from "uniwind";

function appliquer(choix: ChoixTheme) {
  // Uniwind synchronise aussi `Appearance` : `useColorScheme`, donc l'ancien
  // `useCouleurs`, suit le même choix.
  Uniwind.setTheme(choix === "sombre" ? "dark" : choix === "clair" ? "light" : "system");
}
```

Retirer l'import d'`Appearance` devenu inutile. Vérifier sur l'émulateur que « Système » rend
bien la main au thème du téléphone pour les deux mondes (classes ET `useCouleurs`) ; si
`useColorScheme` reste figé après `setTheme('system')`, appeler aussi
`Appearance.setColorScheme("unspecified")` dans ce cas.

- [ ] **Étape 6 : Knip** — dans `knip.json`, sous `apps/mobile`, tolérer les exports livrés et
  pas encore utilisés des composants de registre (comme le web) :

```json
"ignoreIssues": {
  "components/ui/{text,button,input,label,icon,separator}.tsx": ["exports", "types"]
}
```

et ajouter `"lib/utils.ts"` aux `entry`.

- [ ] **Étape 7 :** `typecheck` vert, commit

```bash
git add apps/mobile/components.json apps/mobile/lib/utils.ts apps/mobile/components/ui/text.tsx apps/mobile/components/ui/button.tsx apps/mobile/components/ui/input.tsx apps/mobile/components/ui/label.tsx apps/mobile/components/ui/icon.tsx apps/mobile/components/ui/separator.tsx apps/mobile/tsconfig.json apps/mobile/app/_layout.tsx apps/mobile/lib/theme-choix.ts apps/mobile/package.json knip.json pnpm-lock.yaml
git commit -m "feat(mobile): react native reusables, thème choisi par uniwind"
```

---

### Tâche 3 : l'ancien thème passé au gris, Barlow retiré

**Fichiers :**
- Modifier : `apps/mobile/lib/palette.ts`, `apps/mobile/lib/palette.test.ts`,
  `apps/mobile/lib/theme.ts`, `apps/mobile/app/_layout.tsx`, `apps/mobile/package.json`,
  `apps/mobile/components/bandeau-seance.tsx`, `apps/mobile/components/seance/bandeau-repos.tsx`,
  `apps/mobile/components/seance/pave-numerique.tsx`

**Interfaces :**
- Consomme : rien de neuf.
- Produit : `polices` disparaît ; `affiche` devient `{ fontWeight: "700" }` (plus de capitales
  ni de famille) ; `creerStyles`, `useCouleurs`, `CIBLE`, `taille`, `espace`, `rayon`,
  `PLAFOND_TEXTE_DENSE` inchangés.

- [ ] **Étape 1 : le test d'abord** — dans `palette.test.ts`, ajouter un test qui fige le
  registre gris : aucun token n'est orange.

```ts
it("le registre est gris, sans orange (spec 2026-10-20)", () => {
  for (const c of [sombre, clair]) {
    for (const [role, valeur] of Object.entries(c)) {
      if (role === "danger" || role === "surDanger" || role === "dangerEncre" || role === "voile")
        continue;
      expect(valeur, role).toMatch(/^#([0-9a-f]{2})\1\1$/i);
    }
  }
});
```

- [ ] **Étape 2 :** `pnpm --filter @better-lift/mobile test` → ce test ÉCHOUE (orange,
  `superset` violet).

- [ ] **Étape 3 : valeurs `neutral`** dans `palette.ts` (garder le type `Couleurs` ; retirer
  `ORANGE`, `ORANGE_CLAIR` ; réécrire l'en-tête : « provisoire, aligné sur `global.css`,
  supprimé au lot 3 »). Point de départ, à ajuster jusqu'à ce que les tests de contraste
  passent (on corrige la valeur, jamais le seuil) :

| Rôle | sombre | clair |
|---|---|---|
| canevas | `#0a0a0a` | `#ffffff` |
| surface1 | `#171717` | `#fafafa` |
| surface2 | `#262626` | `#f5f5f5` |
| surface3 | `#262626` | `#e5e5e5` |
| ligne | `#262626` | `#e5e5e5` |
| ligneFaite | `#262626` | `#ededed` |
| ligneForte | `#525252` | `#a3a3a3` |
| encre | `#fafafa` | `#0a0a0a` |
| encreSecondaire | `#d4d4d4` | `#404040` |
| encreTertiaire | `#a3a3a3` | `#525252` |
| encreAttenuee | `#a3a3a3` | `#595959` |
| action | `#fafafa` | `#171717` |
| surAction | `#171717` | `#fafafa` |
| ongletActif | `#fafafa` | `#0a0a0a` |
| recordEncre | `#fafafa` | `#0a0a0a` |
| recordFond | `#262626` | `#f5f5f5` |
| recordLigne | `#a3a3a3` | `#525252` |
| danger | `#dc2626` | `#dc2626` |
| surDanger | `#ffffff` | `#ffffff` |
| dangerEncre | `#f87171` | `#b91c1c` |
| voile | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` |
| superset | `#a3a3a3` | `#525252` |
| corps | `#a3a3a3` | `#525252` |
| corpsSecondaire | `#525252` | `#d4d4d4` |
| fondImage | `#ffffff` | `#ffffff` |

(`corps*` et `ongletActif` partent à la tâche 4 avec leur dernier usage.)

- [ ] **Étape 4 :** `pnpm --filter @better-lift/mobile test` → tout passe.

- [ ] **Étape 5 : police système** — dans `lib/theme.ts`, retirer `polices`, `famillePour` et
  `avecPolices` (`creerStyles` passe `fabrique(c)` directement à `StyleSheet.create`) ; réécrire
  `affiche` :

```ts
/** Provisoire (lot 1) : l'ancienne « affiche » sans Barlow ni capitales. Partira au lot 3. */
export const affiche = { fontWeight: "700" } as const;
```

Dans `bandeau-seance.tsx`, `bandeau-repos.tsx`, `pave-numerique.tsx`, remplacer
`fontFamily: polices.affiche` par `fontWeight: "700"` et retirer l'import.

- [ ] **Étape 6 : `_layout.tsx`** — retirer `useFonts`, les imports Barlow, la garde
  `pret` et `SplashScreen.preventAutoHideAsync` ; cacher l'écran de démarrage au premier rendu :

```tsx
useEffect(() => {
  void SplashScreen.hideAsync();
}, []);
```

Puis `pnpm remove @expo-google-fonts/barlow @expo-google-fonts/barlow-condensed` (depuis
`apps/mobile`). Si `expo-font` n'a plus d'usage, Knip le dira : le retirer aussi.

- [ ] **Étape 7 :** `typecheck` et `test` verts, commit

```bash
git add apps/mobile/lib/palette.ts apps/mobile/lib/palette.test.ts apps/mobile/lib/theme.ts apps/mobile/app/_layout.tsx apps/mobile/package.json apps/mobile/components/bandeau-seance.tsx apps/mobile/components/seance/bandeau-repos.tsx apps/mobile/components/seance/pave-numerique.tsx pnpm-lock.yaml
git commit -m "feat(mobile): ancien thème passé au gris, police système"
```

---

### Tâche 4 : un seul accueil, les écrans écartés retirés

**Fichiers :**
- Supprimer : `app/(onglets)/` en entier (`_layout.tsx`, `index.tsx`, `lancer.tsx`,
  `routines/`, `exercices/`), `app/routine-edition.tsx`, `components/feuille-demarrer.tsx`,
  `components/routines/` (`carte-routine`, `carte-muscles`, `carte-exercice-edition`),
  `components/exercices/`, `components/ui/logo.tsx`, et tout composant ou module que Knip
  signale ensuite sans usage (probablement `vignette`, `section`, `bouton-contour`,
  `feuille-basse` : vérifier, ne supprimer que ce qui est réellement orphelin).
- Créer : `app/(connecte)/_layout.tsx`, `app/(connecte)/index.tsx`,
  `components/accueil/ligne-routine.tsx`
- Déplacer : `app/(onglets)/profil.tsx` → `app/(connecte)/profil.tsx`
- Modifier : `components/bandeau-seance.tsx` (réécrit en classes), `app/_layout.tsx`,
  `lib/palette.ts` et `palette.test.ts` (retirer `corps`, `corpsSecondaire`, `ongletActif`),
  `lib/demarrer.ts` (commentaire), `package.json` (retirer `react-native-body-highlighter`,
  et `react-native-draggable-flatlist` seulement si `reorganiser.tsx` ne s'en sert pas)

**Interfaces :**
- Consomme : `Text`, `Button`, `Icon`, `Separator`, `cn` (tâche 2) ; `useDemarrer()` →
  `{ vide, routine, ouverture }` (`lib/demarrer.ts`) ; `optionsRoutines`, `optionsRoutine`,
  `optionsSeances` (`lib/requetes.ts`) ; `routineASuivre`, `dureeEstimeeSec` (`shared`) ;
  `Chargement`, `Erreur`, `Vide` (`components/ui/etats.tsx`) ; `useSeance()`.
- Produit : la route `/` = l'accueil ; `/profil` ; la garde de session pour tout `(connecte)`.

- [ ] **Étape 1 : la garde** — `app/(connecte)/_layout.tsx` : reprendre telle quelle la logique
  de session de l'ancien `(onglets)/_layout.tsx` (session, cookie gardé, D100, redirection vers
  `/connexion`, `PreparerHorsLigne`), et rendre une pile au lieu des onglets :

```tsx
return (
  <>
    {/* Hors ligne (D96) : remplir le cache tant qu'il y a du réseau. */}
    <PreparerHorsLigne />
    <Stack screenOptions={{ headerShown: false }} />
  </>
);
```

Le fond d'attente (`isPending`) devient `<View className="flex-1 bg-background" />`.

- [ ] **Étape 2 : la ligne d'une routine** — `components/accueil/ligne-routine.tsx`

```tsx
import { dureeEstimeeSec, type RoutineDetail, type RoutineResume } from "@better-lift/shared";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Une routine de l'accueil : l'appui LANCE la séance (spec 2026-10-20, comme le
 * « Start Routine » de Hevy) ; la routine se prépare sur le web.
 */
export function LigneRoutine({
  routine,
  detail,
  aSuivre,
  enOuverture,
  onLancer,
}: {
  routine: RoutineResume;
  detail: RoutineDetail | undefined;
  aSuivre: boolean;
  enOuverture: boolean;
  onLancer: () => void;
}) {
  const minutes = detail ? Math.max(1, Math.round(dureeEstimeeSec(detail.exercices) / 60)) : null;
  return (
    <Pressable
      onPress={onLancer}
      disabled={enOuverture}
      accessibilityRole="button"
      accessibilityHint="Lance la séance"
      className="min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-accent"
    >
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="shrink font-medium text-base" numberOfLines={1}>
            {routine.nom}
          </Text>
          {aSuivre ? <Text className="text-muted-foreground text-xs">À suivre</Text> : null}
        </View>
        <Text className="text-muted-foreground text-sm">
          {pluriel(routine.nbExercices, "exercice")}
          {minutes ? ` · ≈ ${minutes} min` : ""}
        </Text>
      </View>
      {enOuverture ? <ActivityIndicator /> : null}
    </Pressable>
  );
}
```

- [ ] **Étape 3 : l'accueil** — `app/(connecte)/index.tsx`

```tsx
import { routineASuivre } from "@better-lift/shared";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Plus, User } from "lucide-react-native";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LigneRoutine } from "@/components/accueil/ligne-routine";
import { BandeauSeance } from "@/components/bandeau-seance";
import { Button } from "@/components/ui/button";
import { Chargement, Erreur, Vide } from "@/components/ui/etats";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useDemarrer } from "@/lib/demarrer";
import { optionsRoutine, optionsRoutines, optionsSeances } from "@/lib/requetes";

/**
 * L'accueil, seul écran de navigation (spec 2026-10-20) : la séance vide, les
 * routines qui se lancent d'un appui, le Profil en haut à droite, la séance en
 * cours en bas.
 */
export default function Accueil() {
  const router = useRouter();
  const { vide } = useDemarrer();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="h-14 flex-row items-center justify-between px-4">
        <Text className="font-semibold text-2xl" accessibilityRole="header">
          Routines
        </Text>
        <Button
          variant="ghost"
          size="icon"
          className="size-12"
          onPress={() => router.push("/profil")}
          accessibilityLabel="Profil"
        >
          <Icon as={User} className="size-6 text-foreground" />
        </Button>
      </View>
      <View className="px-4 pb-3">
        <Button variant="outline" className="h-12" onPress={() => void vide()}>
          <Icon as={Plus} className="size-5 text-foreground" />
          <Text>Séance vide</Text>
        </Button>
      </View>
      <ListeRoutines />
      <BandeauSeance />
    </SafeAreaView>
  );
}

function ListeRoutines() {
  const routines = useQuery(optionsRoutines());
  const seances = useInfiniteQuery(optionsSeances());
  // Les détails sont en cache (préchargés pour le hors ligne) : durée sans attente.
  const details = useQueries({
    queries: (routines.data ?? []).map((r) => optionsRoutine(r.id)),
  });
  const { routine: lancer, ouverture } = useDemarrer();
  const suivante = routines.data
    ? routineASuivre(routines.data, seances.data?.pages.flatMap((p) => p.seances) ?? [])
    : null;

  if (routines.isPending && routines.fetchStatus === "paused") {
    return <Vide titre="Hors ligne" message="Les routines apparaîtront au retour du réseau." />;
  }
  if (routines.isPending) return <Chargement />;
  if (routines.isError && !routines.data) {
    return (
      <Erreur
        message="Les routines n'ont pas pu se charger."
        onReessayer={() => routines.refetch()}
      />
    );
  }
  if (routines.data.length === 0) {
    return <Vide titre="Pas encore de routine." message="Prépare-la sur le web." />;
  }
  return (
    <FlatList
      className="flex-1"
      data={routines.data}
      keyExtractor={(r) => r.id}
      refreshing={routines.isRefetching}
      onRefresh={() => routines.refetch()}
      ItemSeparatorComponent={() => <Separator className="ml-4" />}
      renderItem={({ item, index }) => (
        <LigneRoutine
          routine={item}
          detail={details[index]?.data}
          aSuivre={suivante?.id === item.id}
          enOuverture={ouverture === item.id}
          onLancer={() => void lancer(item.id)}
        />
      )}
    />
  );
}
```

Si `@/components/ui/etats` entre en conflit d'alias avec les chemins relatifs, importer les
états par `../../components/ui/etats`. Les quatre états se vérifient sur l'émulateur : nominal
(compte de contrôle), vide (compte `e2e`, ou réponse vide simulée en local sans commit),
chargement (réseau lent), erreur (API coupée, sans cache).

- [ ] **Étape 4 : le bandeau de séance en classes** — réécrire `components/bandeau-seance.tsx`
  (même logique : `useSeance`, `reposRestant`, `secondesEcoulees`, `formaterDuree`,
  `useMaintenant` ; plus de `DEBORD_ROND`) :

```tsx
return (
  <Pressable
    onPress={() => router.push("/seance")}
    accessibilityRole="button"
    accessibilityLabel={`Reprendre la séance ${seance.nom}, ${temps}`}
    className="mx-4 mb-2 min-h-14 flex-row items-center gap-3 rounded-lg border border-border bg-secondary px-4 active:bg-accent"
  >
    <View className="flex-1 gap-0.5">
      <Text className="font-semibold" numberOfLines={1}>
        {seance.nom}
      </Text>
      <Text className="text-muted-foreground text-sm tabular-nums">{temps}</Text>
    </View>
    <Text className="font-medium">Reprendre</Text>
  </Pressable>
);
```

- [ ] **Étape 5 : le Profil déplacé** — `git mv "app/(onglets)/profil.tsx" "app/(connecte)/profil.tsx"`,
  corriger ses imports relatifs (`../../` reste juste depuis `(connecte)`), et remplacer son
  titre (le `Text` `styles.titre` sous le `SafeAreaView`) par
  `<EnteteRetour titre="Profil" />` (`components/ui/entete-retour.tsx`) : ce n'est plus un
  onglet, il faut un retour.

- [ ] **Étape 6 : la racine** — dans `app/_layout.tsx`, `<Stack.Screen name="(onglets)" />`
  devient `<Stack.Screen name="(connecte)" />` (toujours EN PREMIER) ; le commentaire de
  `choisir-exercices` ne parle plus de l'édition d'une routine.

- [ ] **Étape 7 : supprimer** les fichiers listés en tête de tâche (`git rm`), retirer
  `corps`, `corpsSecondaire`, `ongletActif` de `Couleurs` et de `palette.test.ts`, retirer
  `react-native-body-highlighter` (`pnpm remove`). Corriger le commentaire de `lib/demarrer.ts`
  (« partagé par l'accueil »).

- [ ] **Étape 8 :** `typecheck`, `test`, puis `pnpm knip` depuis la racine : supprimer chaque
  fichier ou export orphelin signalé dans `apps/mobile` (un export de `shared` signalé —
  `routineASuivre` reste utilisé — se discute avant suppression : le web peut s'en servir).

- [ ] **Étape 9 : voir tourner** — Metro `--clear`, Expo Go, captures de l'accueil en sombre
  et en clair, lancer une routine (la séance s'ouvre), revenir (le bandeau « Reprendre »
  apparaît), ouvrir le Profil et revenir.

- [ ] **Étape 10 :** commit

```bash
git add -A "apps/mobile/app" "apps/mobile/components" apps/mobile/lib/palette.ts apps/mobile/lib/palette.test.ts apps/mobile/lib/demarrer.ts apps/mobile/package.json pnpm-lock.yaml
git status   # vérifier qu'aucun fichier d'autrui n'est indexé
git commit -m "feat(mobile): un seul accueil qui lance les routines, écrans de préparation retirés"
```

(`git add -A` sur ces dossiers seulement parce qu'ils contiennent des suppressions de cette
tâche ; contrôler `git status` avant de commiter.)

---

### Tâche 5 : la connexion

**Fichiers :**
- Modifier : `apps/mobile/app/connexion.tsx` (réécrit)

**Interfaces :**
- Consomme : `Text`, `Button`, `Input`, `Label`, `Icon` ; `authClient` (`lib/auth-client.ts`).

- [ ] **Étape 1 : réécrire l'écran** — même logique (`signIn.email`, `relireSession` AVANT
  `router.replace("/")`, refus « identifiants » / « réseau », œil du mot de passe, enchaînement
  du clavier) ; plus de logo, d'accroche ni d'affiche :

```tsx
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, type TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

// La création de compte reste sur le web : ici, on ne fait qu'entrer.
type GenreRefus = "identifiants" | "reseau";

const MESSAGES: Record<GenreRefus, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  reseau: "Le serveur ne répond pas. Vérifie ta connexion, puis réessaie.",
};

/** Le nom en texte (D229, comme le web), le formulaire sous le pouce. */
export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [refus, setRefus] = useState<GenreRefus | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champMotDePasse = useRef<TextInput>(null);
  const { refetch: relireSession } = authClient.useSession();

  async function seConnecter() {
    setEnCours(true);
    setRefus(null);
    try {
      const { error } = await authClient.signIn.email({ email, password: motDePasse });
      if (error) {
        setRefus("identifiants");
        return;
      }
      // La session se relit AVANT de quitter l'écran : sinon la garde la lit
      // encore absente et renvoie ici, sur un formulaire vide.
      await relireSession();
      router.replace("/");
    } catch {
      setRefus("reseau");
    } finally {
      setEnCours(false);
    }
  }

  const invalide = refus === "identifiants";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          contentContainerClassName="flex-grow justify-end gap-6 p-6"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="font-semibold text-muted-foreground">better-lift</Text>
          <View className="gap-1">
            <Text className="font-semibold text-2xl" accessibilityRole="header">
              Connexion
            </Text>
            <Text className="text-muted-foreground">Pas de compte ? Il se crée depuis le web.</Text>
          </View>
          <View className="gap-2">
            <Label nativeID="libelle-email">Adresse e-mail</Label>
            <Input
              aria-labelledby="libelle-email"
              className={cn("h-12", invalide && "border-destructive")}
              placeholder="toi@exemple.fr"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => champMotDePasse.current?.focus()}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View className="gap-2">
            <Label nativeID="libelle-mdp">Mot de passe</Label>
            <View>
              <Input
                ref={champMotDePasse}
                aria-labelledby="libelle-mdp"
                className={cn("h-12 pr-12", invalide && "border-destructive")}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry={!visible}
                returnKeyType="go"
                value={motDePasse}
                onChangeText={setMotDePasse}
                onSubmitEditing={seConnecter}
              />
              <Pressable
                onPress={() => setVisible((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                accessibilityState={{ selected: visible }}
                className="absolute top-0 right-0 bottom-0 w-12 items-center justify-center"
              >
                <Icon as={visible ? EyeOff : Eye} className="size-5 text-muted-foreground" />
              </Pressable>
            </View>
            {refus ? (
              <Text className="text-destructive text-sm" accessibilityRole="alert">
                {MESSAGES[refus]}
              </Text>
            ) : null}
          </View>
          <Button className="h-12" onPress={seConnecter} disabled={enCours}>
            <Text>{enCours ? "Connexion…" : "Se connecter"}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

(Si `Input` de Reusables ne transmet pas `ref` sous React 19, vérifier son code : il le fait via
les props ; sinon l'adapter dans `components/ui/input.tsx`.)

- [ ] **Étape 2 :** `typecheck` vert ; sur l'émulateur, se déconnecter depuis le Profil, capturer
  la connexion (sombre, clair, refus d'identifiants), se reconnecter avec le compte de contrôle.

- [ ] **Étape 3 :** commit

```bash
git add apps/mobile/app/connexion.tsx
git commit -m "feat(mobile): connexion en wireframe, sans logo ni accroche"
```

---

### Tâche 6 : décisions, règles, vérification, PR

**Fichiers :**
- Modifier : `docs/decisions.md`, `docs/conception.md`, `.claude/rules/mobile.md`, `CLAUDE.md`

- [ ] **Étape 1 : `docs/decisions.md`** — en tête de « Interface mobile », une décision **D316**
  sur le modèle de D178 :

> **D316** — Le mobile repart de zéro en wireframe (spec 2026-10-20), en trois lots. Lot 1 :
> un seul accueil sans onglets (Séance vide, routines qui se lancent d'un appui, Profil en
> en-tête, bandeau « Reprendre ») ; retirés : l'édition des routines, la page d'une routine et
> sa carte du corps, la fiche d'un exercice, la feuille Démarrer, le logo et l'accroche.
> React Native Reusables sur Uniwind, tokens `neutral` de `global.css`, police système.
> L'ancien thème reste, au gris, pour la séance, la fin et le Profil jusqu'au lot 3. Révise
> D74, D82, D83, D84, D103, D120, D121, D122, D124, D161–D165, D171, D172, D174, D178.

Marquer chacune de ces décisions « *Révisée par D316* » à sa place, comme D178 l'a fait.

- [ ] **Étape 2 : `docs/conception.md`** — ligne Mobile du tableau des surfaces : « Accueil
  (routines, séance vide), séance, fin de séance, Profil, connexion » ; architecture :
  `mobile/ Expo SDK 57 (Expo Go), Expo Router, Reusables + Uniwind, TanStack Query, AsyncStorage`.

- [ ] **Étape 3 : `.claude/rules/mobile.md`** — écrans gardés ; section « Système » : le code
  neuf passe par Reusables (`components/ui/`, `cn`, classes de tokens, `global.css`) ; l'ancien
  `creerStyles` / `useCouleurs` ne sert plus qu'aux écrans des lots 2 et 3, ne pas l'étendre ;
  retirer Barlow, l'affiche, la barre et le rond ; navigation : un accueil, `/profil`, garde
  dans `(connecte)/_layout.tsx`. `CLAUDE.md`, section Interface : « Mobile : wireframe
  Reusables en gris (D316) ; web : wireframe shadcn en gris » ; « Les numéros de décision
  continuent après D316 ».

- [ ] **Étape 4 : `/verif`** (build, typecheck, test, lint, knip) — tout vert. Captures sur
  l'émulateur : connexion, accueil (sombre, clair), accueil avec séance en cours, Profil.

- [ ] **Étape 5 :** commit, push de la branche, PR (s'arrêter à la PR verte, ne pas fusionner)

```bash
git add docs/decisions.md docs/conception.md .claude/rules/mobile.md CLAUDE.md
git commit -m "docs(mobile): D316, le mobile repart de zéro en wireframe (lot 1)"
git push -u origin feat/mobile-wireframe
gh pr create --title "feat(mobile): wireframe, lot 1 — socle, accueil, connexion (D316)" --body "…"
```

Corps de la PR : résumé, ce qui est retiré, captures, et « 🤖 Generated with [Claude Code](https://claude.com/claude-code) ».
