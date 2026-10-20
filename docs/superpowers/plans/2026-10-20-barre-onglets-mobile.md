# Barre d'onglets du mobile — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remettre une barre d'onglets en bas du mobile — Routines · Historique · Profil —, le
bandeau « Reprendre » posé au-dessus, en wireframe gris.

**Architecture :** `app/(connecte)/_layout.tsx` garde la garde de session et remplace sa `Stack`
par les `Tabs` d'Expo Router, dont la prop `tabBar` rend un composant à nous
(`components/barre-onglets.tsx`) : le bandeau de séance puis la barre. L'onglet Historique n'a
qu'un état vide.

**Tech Stack :** Expo SDK 57, Expo Router 57 (`Tabs`), React Native Reusables sur Uniwind,
`lucide-react-native`, `react-native-safe-area-context`.

**Spec :** `docs/superpowers/specs/2026-10-20-barre-onglets-mobile-design.md`

## Global Constraints

- Tout en français : interface, commentaires, commits (Conventional Commits, sujet en minuscule,
  100 caractères au plus).
- Expo Go seulement (D80) : aucune dépendance ajoutée.
- Jamais de couleur en dur : classes de tokens (`bg-secondary`, `text-muted-foreground`,
  `border-border`…).
- `className` seulement sur les composants de React Native ou passés par `withUniwind` (`Icon`,
  `Ecran` le sont).
- Jamais d'import depuis `@react-navigation/*` (SDK 56+).
- Cible tactile de 48 au moins ; un titre porte `accessibilityRole="header"`.
- `git add <fichier>` seulement, jamais un dossier ; ne jamais pousser sur `main` ni fusionner.
- Le mobile n'a pas de tests unitaires d'écran : la preuve est `/verif` vert et les captures sur
  l'émulateur.

---

### Task 1 : la barre et les trois onglets

**Files :**
- Create : `apps/mobile/components/barre-onglets.tsx`
- Create : `apps/mobile/components/ui/titre-onglet.tsx`
- Create : `apps/mobile/app/(connecte)/historique.tsx`
- Modify : `apps/mobile/app/(connecte)/_layout.tsx`
- Modify : `apps/mobile/app/(connecte)/index.tsx`
- Modify : `apps/mobile/app/(connecte)/profil.tsx`
- Delete : `apps/mobile/components/ui/entete-retour.tsx` (le Profil était son seul usage ; Knip
  le signalerait)

**Interfaces :**
- Produces : `BarreOnglets(props)` — props de la `tabBar` des `Tabs` ; `TitreOnglet({ titre })`.

- [ ] **Step 1 : le titre d'un onglet** — `components/ui/titre-onglet.tsx`

```tsx
import { View } from "react-native";
import { Text } from "@/components/ui/text";

/** L'en-tête d'un onglet (D319). */
export function TitreOnglet({ titre }: { titre: string }) {
  return (
    <View className="h-14 justify-center px-4">
      <Text className="font-semibold text-2xl" accessibilityRole="header">
        {titre}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2 : la barre** — `components/barre-onglets.tsx`

```tsx
import { type Tabs } from "expo-router";
import { Dumbbell, History, type LucideIcon, User } from "lucide-react-native";
import type { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BandeauSeance } from "@/components/bandeau-seance";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

// `expo-router` n'exporte pas `BottomTabBarProps` à sa racine : on le tire de `Tabs`.
type Props = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const ONGLETS: Record<string, { libelle: string; icone: LucideIcon }> = {
  index: { libelle: "Routines", icone: Dumbbell },
  historique: { libelle: "Historique", icone: History },
  profil: { libelle: "Profil", icone: User },
};

/**
 * La barre d'onglets (D319) : la séance en cours au-dessus, puis les trois
 * onglets. L'onglet actif se marque par la forme — une pilule derrière l'icône,
 * le libellé en gras —, pas par la couleur (Material 3).
 */
export function BarreOnglets({ state, navigation }: Props) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View className="bg-background">
      <BandeauSeance />
      <View
        className="flex-row border-border border-t"
        style={{ paddingBottom: bottom }}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const onglet = ONGLETS[route.name];
          if (!onglet) return null;
          const actif = state.index === index;
          const appuyer = () => {
            const evenement = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!actif && !evenement.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={appuyer}
              accessibilityRole="tab"
              accessibilityState={{ selected: actif }}
              accessibilityLabel={onglet.libelle}
              className="min-h-16 flex-1 items-center justify-center gap-1 py-2"
            >
              <View
                className={cn(
                  "h-8 w-16 items-center justify-center rounded-full",
                  actif && "bg-secondary",
                )}
              >
                <Icon
                  as={onglet.icone}
                  className={cn("size-6", actif ? "text-foreground" : "text-muted-foreground")}
                />
              </View>
              <Text
                className={cn(
                  "text-xs",
                  actif ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {onglet.libelle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

Si `typecheck` refuse `import { type Tabs }` comme valeur dans `typeof`, écrire
`import type { Tabs } from "expo-router";` (`typeof` d'un import de type est permis).

- [ ] **Step 3 : le layout** — dans `app/(connecte)/_layout.tsx`, importer `Tabs` au lieu de
  `Stack` et `BarreOnglets` ; remplacer la ligne `<Stack screenOptions={{ headerShown: false }} />`
  et la docstring :

```tsx
import { Redirect, Tabs } from "expo-router";
// …
import { BarreOnglets } from "@/components/barre-onglets";
// …
/**
 * La garde de session (D316) : les onglets exigent un compte, et un seul
 * endroit le vérifie. Trois onglets, Routines · Historique · Profil (D319) ; la
 * séance et ses modales vivent sur la pile racine, par-dessus la barre.
 */
// …
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BarreOnglets {...props} />}
      >
        {/* L'ordre des onglets est celui de la barre. */}
        <Tabs.Screen name="index" />
        <Tabs.Screen name="historique" />
        <Tabs.Screen name="profil" />
      </Tabs>
```

- [ ] **Step 4 : l'onglet Historique** — `app/(connecte)/historique.tsx`

```tsx
import { Ecran } from "@/components/ui/ecran";
import { Vide } from "@/components/ui/etats";
import { TitreOnglet } from "@/components/ui/titre-onglet";

/**
 * L'onglet Historique (D319) : l'onglet seul pour l'instant. La liste et le
 * détail des séances viendront (`GET /seances`, `GET /seances/:id`).
 */
export default function Historique() {
  return (
    <Ecran className="flex-1 bg-background" edges={["top"]}>
      <TitreOnglet titre="Historique" />
      <Vide titre="Rien à afficher pour l'instant" message="Tes séances passées apparaîtront ici." />
    </Ecran>
  );
}
```

- [ ] **Step 5 : l'onglet Routines** — dans `app/(connecte)/index.tsx` :
  - remplacer tout le `<View className="h-14 …">…</View>` de l'en-tête par
    `<TitreOnglet titre="Routines" />` ;
  - retirer `<BandeauSeance />` et son import, `User` de l'import Lucide, `useRouter` et
    `const router`, et l'import d'`Icon` s'il ne sert plus (il sert encore à `Plus`) ;
  - `edges={["top", "bottom"]}` devient `edges={["top"]}` ;
  - docstring : « L'onglet Routines (D316, D319) : la séance vide, les routines qui se lancent
    d'un appui. La séance en cours s'affiche au-dessus de la barre. »

- [ ] **Step 6 : l'onglet Profil** — dans `app/(connecte)/profil.tsx` :
  - `<EnteteRetour titre="Profil" />` devient `<TitreOnglet titre="Profil" />` ; imports ajustés ;
  - `edges={["top", "bottom"]}` devient `edges={["top"]}`.
  - Supprimer `components/ui/entete-retour.tsx` (`git rm`).

- [ ] **Step 7 : typecheck et lint**

Run (depuis la racine) : `pnpm --filter @better-lift/mobile typecheck` puis `pnpm lint`
Expected : aucune erreur. Corriger avant de continuer.

- [ ] **Step 8 : commit**

La suppression d'`entete-retour.tsx` est déjà indexée par le `git rm` de l'étape 6.

```bash
git add "apps/mobile/components/barre-onglets.tsx" "apps/mobile/components/ui/titre-onglet.tsx" "apps/mobile/app/(connecte)/historique.tsx" "apps/mobile/app/(connecte)/_layout.tsx" "apps/mobile/app/(connecte)/index.tsx" "apps/mobile/app/(connecte)/profil.tsx"
git commit -m "feat(mobile): barre d'onglets Routines · Historique · Profil (D319)"
```

### Task 2 : voir tourner sur l'émulateur

**Files :** aucun (captures dans le scratchpad).

- [ ] **Step 1 : lancer** — recette de la mémoire « Émulateur Android sous Windows » : API sur
  :3001 (`pnpm dev` ou l'API seule), `npx expo start --clear` depuis `apps/mobile`,
  `adb reverse tcp:8081 tcp:8081`, `adb reverse tcp:3001 tcp:3001`, puis le lien
  `exp://127.0.0.1:8081` (force-stop d'Expo Go et le lien deux fois si l'ancien bundle reste).
  Compte `controle@better-lift.local`.
- [ ] **Step 2 : captures en sombre** (`adb exec-out screencap -p > …png`) : Routines,
  Historique, Profil ; puis lancer une routine, revenir (retour) : Routines avec le bandeau
  au-dessus de la barre ; la séance ouverte, sans barre.
- [ ] **Step 3 : retour Android** depuis Historique et Profil (`adb shell input keyevent 4`) :
  ramène à Routines.
- [ ] **Step 4 : thème clair** (Profil → Thème → Clair) et les mêmes captures des trois onglets
  et du bandeau.
- [ ] **Step 5 : lire chaque capture** : pilule visible sur l'onglet actif dans les deux thèmes,
  libellés lisibles, bandeau au-dessus du filet, rien sous la barre de navigation du système.
  Un défaut se corrige dans les fichiers de la Task 1, avec un commit `fix(mobile): …`.
- [ ] **Step 6** : terminer la séance de test sans l'enregistrer (ou la supprimer côté web) pour
  ne pas salir la démo.

### Task 3 : décisions, règles, PR

**Files :**
- Modify : `docs/decisions.md` (D319 après D318 ; « *Révisée par D319.* » sur D316 et D107)
- Modify : `.claude/rules/mobile.md` (première ligne et section Navigation)

- [ ] **Step 1 : D319** — à insérer après le paragraphe de D318 :

```markdown
- **D319** — Révise D316 : le mobile retrouve une barre d'onglets, **Routines · Historique ·
  Profil**, libellés toujours visibles (icônes Lucide `Dumbbell`, `History`, `User`). L'onglet
  actif se marque par la forme : pilule `bg-secondary` derrière l'icône, libellé en gras.
  `Tabs` d'Expo Router avec une barre à nous (`components/barre-onglets.tsx`), pas `NativeTabs`
  (ni Lucide, ni accessoire au-dessus de la barre sous Android). Le bandeau « Reprendre » se
  pose au-dessus de la barre, sur les trois onglets ; « Séance vide » reste en tête de Routines.
  L'onglet Historique n'a qu'un état vide pour l'instant ; son contenu viendra.
```

  Et préfixer D316 et D107 de « *Révisée par D319.* » (D107 : le bandeau revient au-dessus de la
  barre).

- [ ] **Step 2 : `.claude/rules/mobile.md`** — première ligne : « Écrans (D316–D319) : trois
  onglets (Routines, Historique, Profil), la séance (…), la fin, la connexion. » Section
  Navigation remplacée par :

```markdown
## Navigation (D319)

- **Trois onglets** : `app/(connecte)/` — `index` (Routines), `historique`, `profil`. `Tabs`
  d'Expo Router, barre à nous (`components/barre-onglets.tsx`) : le bandeau « Reprendre »
  (`components/bandeau-seance.tsx`) puis les onglets. Un onglet s'ouvre sur `TitreOnglet`.
- Routines : « Séance vide » en tête, la liste des routines (l'appui lance la séance par
  `lib/demarrer.ts`). Historique : état vide pour l'instant.
- Le `_layout` de `(connecte)` porte la garde de session et `PreparerHorsLigne`. `seance`,
  `fin`, `choisir-exercices`, `reorganiser` sont hors de la garde, sur la pile racine : la
  barre n'y paraît pas.
- Une pile qui déclare ses écrans prend le premier pour route initiale : `(connecte)` est
  déclaré en tête dans `app/_layout.tsx`, sinon l'app s'ouvre sur une modale.
```

- [ ] **Step 3 : `/verif`** (build, typecheck, test, lint, knip) — vert.
- [ ] **Step 4 : commit, push, PR**

```bash
git add docs/decisions.md .claude/rules/mobile.md
git commit -m "docs: D319, la barre d'onglets du mobile"
git push -u origin feat/mobile-barre-onglets
gh pr create --base main --title "feat(mobile): barre d'onglets Routines · Historique · Profil (D319)" --body "…"
```

  Corps de PR : résumé, captures décrites, plan de test ; finir par la ligne d'attribution. Attendre
  le check `Qualité · typecheck · test · build` vert. **Ne pas fusionner.**
