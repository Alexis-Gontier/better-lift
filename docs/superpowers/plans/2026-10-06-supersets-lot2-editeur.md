# Supersets, lot 2 — éditeur de routine (web et mobile) : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Exécution inline (préférence de l'utilisateur).**

**Goal:** Créer, voir et défaire un superset dans l'éditeur de routine du web et du mobile, et le voir sur la page d'une routine du mobile.

**Architecture:** Deux petites fonctions pures de plus dans `shared/supersets.ts` (rôle du repos, droit de lier) servent les deux surfaces. Un nouveau rôle de couleur `superset` (mobile `Couleurs`, web `--superset`). Le web regroupe les cartes d'un même groupe dans un bloc à filet ; le mobile pose une barre à gauche de chaque membre. Le glisser passe par `deplacerAvecGroupes`, le retrait par `normaliserGroupes`.

**Tech Stack:** React 19, dnd-kit et shadcn (web), React Native et `react-native-draggable-flatlist` (mobile), Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-06-supersets-design.md`](../specs/2026-10-06-supersets-design.md) — D147, D148, D149 (repos masqué), D151, D152.

## Global Constraints

- Branche `feat/supersets-editeur` depuis `main` (lot 1 fusionné, #98). PR squash, jamais de push sur `main`.
- **Couleur `superset`** : `#9a8cf0` en sombre, `#5a4bbf` en clair. Contrastes mesurés le 6 octobre : sombre 7,01 (canevas) · 6,60 (surface1) · 6,08 (surface2) · 5,63 (surface3) ; clair 6,08 · 6,58 (blanc) · 5,76 · 5,30. Ni lime ni `--danger`. Un token, deux valeurs ; jamais de couleur en dur.
- Repère : filet vertical de 3 px à gauche des membres du groupe + étiquette « SUPERSET A » en petites capitales, couleur `superset`, en tête du groupe.
- Menu ⋯ d'un exercice : « Superset avec le suivant » (visible inerte sur le dernier exercice, raison « dernier exercice ») ; dans un groupe, « Retirer du superset ». L'étiquette ouvre « Défaire le superset ».
- Repos (D149) : sur un membre qui n'est pas le dernier du groupe, le champ de repos est masqué (sa valeur est gardée) ; sur le dernier, il s'intitule « Repos après le groupe ».
- Mobile : `creerStyles`, `Appuyable`, cible de 48, `useFeuille`. Web : primitives shadcn, rôles traduits dans `@theme inline`.
- Commits Conventional Commits en français + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

### Task 1 : `roleRepos` et `peutLierAuSuivant` dans `shared`

**Files:**
- Modify: `packages/shared/src/supersets.ts`, `packages/shared/src/supersets.test.ts`, `packages/shared/src/index.ts`

**Interfaces:**
- Produces :
  - `type RoleRepos = "propre" | "masque" | "groupe"`
  - `roleRepos(liste: readonly AvecGroupe[], i: number): RoleRepos` — hors groupe `"propre"`, membre non dernier `"masque"`, dernier `"groupe"`.
  - `peutLierAuSuivant(liste: readonly AvecGroupe[], i: number): boolean` — vrai si `i` n'est pas le dernier de la liste ET (hors groupe OU dernier de son groupe).

- [ ] **Step 1 : tests** (ajoutés à `supersets.test.ts`, import complété)

```ts
describe("roleRepos (D149)", () => {
  it("hors groupe : son propre repos", () => {
    expect(roleRepos(l("a b1 c1"), 0)).toBe("propre");
  });
  it("membre non dernier : masqué ; dernier : repos du groupe", () => {
    const xs = l("a1 b1 c1");
    expect([0, 1, 2].map((i) => roleRepos(xs, i))).toEqual(["masque", "masque", "groupe"]);
  });
});

describe("peutLierAuSuivant (D152)", () => {
  it("vrai hors groupe, sauf sur le dernier exercice", () => {
    const xs = l("a b c");
    expect([0, 1, 2].map((i) => peutLierAuSuivant(xs, i))).toEqual([true, true, false]);
  });
  it("dans un groupe : seul son dernier peut l'agrandir", () => {
    const xs = l("a1 b1 c");
    expect([0, 1].map((i) => peutLierAuSuivant(xs, i))).toEqual([false, true]);
  });
});
```

- [ ] **Step 2 :** `pnpm --filter @better-lift/shared test supersets` → FAIL.
- [ ] **Step 3 : implémenter** (fin de `supersets.ts`)

```ts
/** Le repos d'un exercice (D149) : le sien, masqué dans un groupe, ou celui du groupe. */
export type RoleRepos = "propre" | "masque" | "groupe";

export function roleRepos(liste: readonly AvecGroupe[], i: number): RoleRepos {
  const g = groupeDe(liste, i);
  if (!g) return "propre";
  return i === g.fin ? "groupe" : "masque";
}

/** D152 : « Superset avec le suivant » a un sens hors groupe ou au bout d'un groupe. */
export function peutLierAuSuivant(liste: readonly AvecGroupe[], i: number): boolean {
  if (i < 0 || i + 1 >= liste.length) return false;
  const g = groupeDe(liste, i);
  return !g || i === g.fin;
}
```

Exporter `peutLierAuSuivant`, `type RoleRepos`, `roleRepos` dans `index.ts` (bloc `./supersets.js`).

- [ ] **Step 4 :** PASS. **Step 5 :** commit `feat(shared): rôle du repos et droit de lier dans un superset (D149, D152)`.

---

### Task 2 : le rôle de couleur `superset`

**Files:**
- Modify: `apps/mobile/lib/theme.ts` (type `Couleurs`, `sombre`, `clair`)
- Modify: `apps/web/src/styles/tokens.css` (`:root` et `[data-theme="light"]`), `apps/web/src/styles/globals.css` (`@theme inline`)

- [ ] **Step 1 :** dans `Couleurs` :

```ts
  /**
   * Le repère d'un superset (D151) : filet et étiquette. Ni l'action ni le record
   * (lime), ni le danger. 5,6:1 à 7,0:1 sur les surfaces en sombre, 5,3:1 à 6,6:1 en clair.
   */
  superset: string;
```

`sombre` : `superset: "#9a8cf0",` ; `clair` : `superset: "#5a4bbf",`.

- [ ] **Step 2 :** web, `tokens.css` : `--superset: #9a8cf0; /* superset (D151) */` dans `:root`, `--superset: #5a4bbf;` dans `[data-theme="light"]` ; `globals.css`, `@theme inline` : `--color-superset: var(--superset);`.
- [ ] **Step 3 :** `pnpm typecheck` → vert. Commit `feat: rôle de couleur superset, web et mobile (D151)`.

---

### Task 3 : l'éditeur web

**Files:**
- Modify: `apps/web/src/features/routines/carte-exercice.tsx`
- Modify: `apps/web/src/features/routines/editeur-routine.tsx`

**Interfaces:**
- Consumes : `groupes`, `deplacerAvecGroupes`, `lierAuSuivant`, `retirerDuGroupe`, `defaireGroupe`, `normaliserGroupes`, `roleRepos`, `peutLierAuSuivant`, `type RoleRepos` (shared).
- `CarteExercice` reçoit en plus : `repos: RoleRepos`, `peutLier: boolean`, `dansGroupe: boolean`, `onLier: () => void`, `onDelier: () => void`.

- [ ] **Step 1 : la carte.** Le sélecteur de repos ne s'affiche pas si `repos === "masque"` ; son libellé devient `Repos après le groupe ${enChrono(...)}` (ou « Sans repos après le groupe ») si `repos === "groupe"` — étendre `libelleRepos(t, groupe: boolean)`. Dans le menu ⋯, avant « Retirer l'exercice », ajouter :

```tsx
<DropdownMenuItem onSelect={onLier} disabled={!peutLier}>
  <Link2 aria-hidden="true" />
  Superset avec le suivant
</DropdownMenuItem>
{dansGroupe ? (
  <DropdownMenuItem onSelect={onDelier}>
    <Unlink2 aria-hidden="true" />
    Retirer du superset
  </DropdownMenuItem>
) : null}
<DropdownMenuSeparator />
```

(`Link2`, `Unlink2` de `lucide-react`.)

- [ ] **Step 2 : l'éditeur.** Une aide `modifier(f: (xs: ExerciceBrouillon[]) => ExerciceBrouillon[])` applique `f` aux exercices du brouillon. Puis :
  - `deposer` : `modifier((xs) => deplacerAvecGroupes(xs, de, vers))` à la place d'`arrayMove` (retirer l'import d'`arrayMove`).
  - retrait : `modifier((xs) => normaliserGroupes(xs.filter((e) => e.cle !== ex.cle)))`.
  - `onLier={() => modifier((xs) => lierAuSuivant(xs, i))}`, `onDelier={() => modifier((xs) => retirerDuGroupe(xs, i))}`.
  - Le rendu découpe la liste en segments : pour chaque `g` de `groupes(brouillon.exercices)`, un `<li>` de groupe ; hors groupe, la carte seule. Le `SortableContext` garde la liste plate des `cle` : dnd-kit ne demande pas que le DOM soit plat.

```tsx
const blocs = groupes(brouillon.exercices);
const carte = (ex: ExerciceBrouillon, i: number) => (
  <CarteExercice
    key={ex.cle}
    exercice={ex}
    derniere={meilleureSerie(precedentes.data?.[ex.slug] ?? [])}
    repos={roleRepos(brouillon.exercices, i)}
    peutLier={peutLierAuSuivant(brouillon.exercices, i)}
    dansGroupe={roleRepos(brouillon.exercices, i) !== "propre"}
    onLier={() => modifier((xs) => lierAuSuivant(xs, i))}
    onDelier={() => modifier((xs) => retirerDuGroupe(xs, i))}
    onChange={…inchangé…}
    onRetirer={…normalisé…}
  />
);
// Dans le <ol> :
{brouillon.exercices.map((ex, i) => {
  const g = blocs.find((b) => b.debut === i);
  if (g)
    return (
      <li key={`groupe-${ex.cle}`}>
        <EtiquetteSuperset lettre={g.lettre} onDefaire={() => modifier((xs) => defaireGroupe(xs, i))} />
        <ol className="flex flex-col gap-3 border-l-[3px] border-superset pl-3">
          {brouillon.exercices.slice(g.debut, g.fin + 1).map((m, k) => carte(m, g.debut + k))}
        </ol>
      </li>
    );
  if (blocs.some((b) => i > b.debut && i <= b.fin)) return null;
  return carte(ex, i);
})}
```

`EtiquetteSuperset` (dans `carte-exercice.tsx` ou un fichier `etiquette-superset.tsx` du même dossier) : un `DropdownMenu` dont le déclencheur est un bouton texte `text-[11px] font-bold tracking-wider uppercase text-superset` « Superset {lettre} », et l'unique entrée « Défaire le superset » (icône `Unlink2`).

- [ ] **Step 3 :** `pnpm --filter @better-lift/web typecheck` et `pnpm lint` → verts.
- [ ] **Step 4 : à l'écran (Playwright, compte de contrôle).** Lancer `pnpm dev`, se connecter, ouvrir `/routines/nouvelle`, ajouter trois exercices, lier 1→2 puis 2→3 (groupe de 3, étiquette « SUPERSET A », filet violet, repos visible seulement sur le 3ᵉ, « Repos après le groupe »), retirer du superset l'exercice du milieu (il passe en 3ᵉ, hors groupe), glisser un exercice seul entre deux membres (il rejoint), défaire, puis relier et **enregistrer** ; recharger la page : le groupe est relu. Vérifier aussi en thème clair. **Supprimer ensuite cette routine de test** (les routines de démo restent intactes). Captures dans le dossier de travail temporaire.
- [ ] **Step 5 :** commit `feat(web): supersets dans l'éditeur de routine (D151, D152)`.

---

### Task 4 : le mobile — repère, éditeur, page d'une routine

**Files:**
- Create: `apps/mobile/components/ui/repere-superset.tsx`
- Modify: `apps/mobile/components/routines/carte-exercice-edition.tsx`
- Modify: `apps/mobile/app/routine-edition.tsx`
- Modify: `apps/mobile/app/(onglets)/routines/[id].tsx`

**Interfaces:**
- Produces : `RepereSuperset({ groupe, index, onDefaire?, children })` — `groupe: GroupeSuperset | null` ; sans groupe, rend `children` tel quel. Le lot 3 (séance) le réutilise.

- [ ] **Step 1 : le repère.**

```tsx
import type { GroupeSuperset } from "@better-lift/shared";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { creerStyles, espace, taille } from "../../lib/theme";
import { Appuyable } from "./appuyable";

/**
 * Le repère d'un superset (D151) : une barre de 3 px à gauche de chaque membre,
 * qui court sur toute la hauteur — marges comprises, d'où un filet continu d'un
 * membre à l'autre —, et l'étiquette « SUPERSET A » au-dessus du premier.
 * Le dernier membre arrête la barre au bas de son contenu (`fin`).
 */
export function RepereSuperset({
  groupe,
  index,
  onDefaire,
  children,
}: {
  groupe: GroupeSuperset | null;
  index: number;
  /** Absent : l'étiquette n'est qu'un repère (page d'une routine, historique). */
  onDefaire?: () => void;
  children: ReactNode;
}) {
  const styles = useStyles();
  if (!groupe) return <>{children}</>;
  const premier = index === groupe.debut;
  const dernier = index === groupe.fin;
  const etiquette = <Text style={styles.etiquette}>Superset {groupe.lettre}</Text>;
  return (
    <View style={styles.ligne}>
      <View style={[styles.barre, premier && styles.debut, dernier && styles.fin]} />
      <View style={styles.contenu}>
        {premier ? (
          onDefaire ? (
            <Appuyable
              onPress={onDefaire}
              style={styles.cibleEtiquette}
              accessibilityRole="button"
              accessibilityLabel={`Superset ${groupe.lettre}, options`}
            >
              {etiquette}
            </Appuyable>
          ) : (
            <View style={styles.cibleEtiquette}>{etiquette}</View>
          )
        ) : null}
        {children}
      </View>
    </View>
  );
}

const useStyles = creerStyles((couleurs) => ({
  ligne: { flexDirection: "row", gap: espace.s },
  barre: { width: 3, backgroundColor: couleurs.superset },
  debut: { borderTopLeftRadius: 2, borderTopRightRadius: 2, marginTop: espace.s },
  // Le dernier membre porte encore sa marge du bas : la barre s'arrête avant.
  fin: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginBottom: espace.m },
  contenu: { flex: 1, minWidth: 0 },
  cibleEtiquette: { minHeight: 32, justifyContent: "center", alignSelf: "flex-start", paddingRight: espace.m },
  etiquette: {
    color: couleurs.superset,
    fontSize: taille.petit,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
}));
```

(La cible de l'étiquette fait 32 de haut : ajouter `hitSlop={8}` pour atteindre 48. `fin.marginBottom` vaut la `marginBottom` de la carte d'édition, `espace.m` ; sur la page d'une routine, où les lignes n'ont pas de marge, passer une prop `marge={0}` si la barre s'arrête trop tôt — à régler à l'écran.)

- [ ] **Step 2 : la carte d'édition.** Nouvelles props `repos: RoleRepos`, `peutLier: boolean`, `dansGroupe: boolean`, `onLier`, `onDelier`. La ligne « Repos » n'est pas rendue si `repos === "masque"` ; son libellé est « Repos après le groupe » si `repos === "groupe"`. Le menu devient :

```ts
options: [
  {
    libelle: "Superset avec le suivant",
    icone: Link2,
    ...(peutLier ? { onPress: onLier } : { inactive: dansGroupe ? "dans le groupe" : "dernier exercice" }),
  },
  ...(dansGroupe ? [{ libelle: "Retirer du superset", icone: Unlink2, onPress: onDelier }] : []),
  { libelle: "Retirer l'exercice", … inchangé … },
],
```

- [ ] **Step 3 : l'éditeur.** `const blocs = groupes(brouillon.exercices);` puis :
  - `onDragEnd={({ from, to }) => setBrouillon((b) => ({ ...b, exercices: deplacerAvecGroupes(b.exercices, from, to) }))}`.
  - `renderItem={({ item, drag, isActive, getIndex }) => { const i = getIndex() ?? 0; const g = blocs.find((b) => b.debut <= i && i <= b.fin) ?? null; return (<RepereSuperset groupe={g} index={i} onDefaire={() => feuille({ titre: \`Superset ${g?.lettre}\`, options: [{ libelle: "Défaire le superset", icone: Unlink2, onPress: () => modifier((xs) => defaireGroupe(xs, i)) }] })}><CarteExerciceEdition … repos={roleRepos(brouillon.exercices, i)} peutLier={peutLierAuSuivant(brouillon.exercices, i)} dansGroupe={g !== null} onLier={() => modifier((xs) => lierAuSuivant(xs, i))} onDelier={() => modifier((xs) => retirerDuGroupe(xs, i))} onRetirer={() => modifier((xs) => normaliserGroupes(xs.filter((x) => x.cle !== item.cle)))} /></RepereSuperset>); }}`
  - `modifier` : `(f) => setBrouillon((b) => ({ ...b, exercices: f(b.exercices) }))` ; `feuille` de `useFeuille()`.

- [ ] **Step 4 : la page d'une routine.** Dans `r.exercices.map((ex, i) => …)`, envelopper chaque `Appuyable` dans `<RepereSuperset groupe={…} index={i}>` (sans `onDefaire`) ; la ligne de repos n'apparaît pas pour un rôle `"masque"` et devient « Repos après le groupe {durée} » pour `"groupe"`. Les groupes viennent de `groupes(r.exercices)` (un cache antérieur sans le champ : aucun groupe).
- [ ] **Step 5 :** `pnpm --filter mobile typecheck` (ou `pnpm typecheck`) et `pnpm lint` → verts.
- [ ] **Step 6 :** commit `feat(mobile): supersets dans l'éditeur et la page d'une routine (D151, D152)`.

---

### Task 5 : documentation, vérification, PR

- [ ] `CLAUDE.md` (État : lot 2 fait) ; `.claude/rules/interface-web.md` (Écrans → Routines : groupes de superset, filet `--superset`, étiquette « Défaire ») ; `.claude/rules/mobile.md` (Routines : `RepereSuperset`, menu ⋯) ; `.claude/rules/mobile.md` Système : rôle `superset` et ses contrastes.
- [ ] `/verif` (les cinq étapes ; les erreurs de `.superpowers/` sont hors CI).
- [ ] Commit `docs: supersets, lot 2`, push, PR `feat: supersets, lot 2 — éditeur de routine (D151, D152)`.
- [ ] **Liste à éprouver sur le téléphone** (à donner à l'utilisateur, Expo Go) :
  1. Modifier une routine : ⋯ d'un exercice → « Superset avec le suivant » ; l'étiquette « SUPERSET A » et la barre violette apparaissent, continues d'un exercice à l'autre.
  2. Le repos n'est plus éditable sur le premier ; le second dit « Repos après le groupe ».
  3. Lier encore le second au troisième : groupe de 3. Sur le dernier exercice de la routine, l'entrée est grisée « dernier exercice ».
  4. ⋯ de l'exercice du milieu → « Retirer du superset » : il passe juste après le groupe.
  5. Appui long sur ⋮⋮ et glisser un exercice seul entre deux membres : il rejoint le groupe.
  6. Toucher l'étiquette → « Défaire le superset ».
  7. Relier, Enregistrer : la page de la routine montre le groupe ; le web aussi après rechargement.
  8. Thème clair (Profil) : la barre reste lisible.
