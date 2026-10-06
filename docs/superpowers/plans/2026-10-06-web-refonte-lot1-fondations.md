# Refonte du web — lot 1 : fondations — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** poser l'habillage et la charpente du nouveau web : tokens alignés sur le mobile,
Archivo, barre latérale à cinq destinations, deux gabarits de page, Tableau de bord comme page
d'arrivée (encore vide), `/profil` à la place de `/parametres`, connexion épurée.

**Architecture :** la coquille actuelle (`AppShell`) se scinde en trois : `Coquille` (barre
latérale + zone flottante), `PageListeDetail` (l'ancien `AppShell`, inchangé dans son
fonctionnement) et `PageTableau` (en-tête de page + contenu défilant). Les routes de liste
(séances, routines, exercices) changent seulement d'import. Aucune donnée nouvelle : ce lot ne
touche ni l'API ni `shared`.

**Tech Stack :** Vite 8, React 19.2.3, TanStack Router 1.170, Tailwind 4.3 (`@theme inline`),
shadcn/ui (`Sidebar`, `Command`), `@fontsource-variable/archivo` 5.3.0.

**Spec :** [`docs/superpowers/specs/2026-10-06-web-refonte-design.md`](../specs/2026-10-06-web-refonte-design.md)
(D133, D134, D135, D136, D144 ; « Découpage », lot 1).

## Global Constraints

- L'application est en **français** : identifiants, commentaires, libellés, commits.
- Un seul lime (`#a8cf45`) pour l'action (aplat, `bg-primary`) et le record (contour,
  `--accent-ink`) ; l'entrée active de la navigation est une **surface** (`--nav-active`), jamais
  le lime. `bg-accent` reste la surface de survol shadcn.
- Un token par rôle, deux valeurs (sombre dans `:root`, clair dans `[data-theme="light"]`).
- Tout nouvel écran porte ses quatre états par `?etat=` (`champEtat`, `etatForceRendu`).
- Le web ne lance aucune séance (D132) : aucune entrée « Démarrer » nulle part.
- Commits en Conventional Commits, en français, terminés par
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `main` est protégée : la branche `feat/web-refonte` (déjà créée, porte la spec), une PR, squash.
- Knip refuse un export sans usage ; Biome formate chaque fichier édité.
- **Arrêter le serveur de dev avant tout changement de branche** (`routeTree.gen.ts`, voir
  `.claude/rules/interface-web.md`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `apps/web/package.json` | + `@fontsource-variable/archivo` |
| `apps/web/src/main.tsx` | Importe la police |
| `apps/web/src/styles/tokens.css` | Valeurs alignées sur `apps/mobile/lib/theme.ts`, tokens `--cal-*`, `--image-bg`, `--accent-line` |
| `apps/web/src/styles/globals.css` | Archivo, `--font-sans`, utilitaire `chiffre`, rôles `--color-cal-*` |
| `apps/web/src/components/shell/coquille.tsx` (nouveau) | Barre latérale + zone flottante |
| `apps/web/src/components/shell/page-tableau.tsx` (nouveau) | Gabarit des pages d'analyse et du Profil |
| `apps/web/src/components/shell/page-liste-detail.tsx` (renommé depuis `app-shell.tsx`) | Gabarit liste / détail |
| `apps/web/src/components/shell/nav-lateral.tsx` | Cinq destinations, Profil en pied |
| `apps/web/src/components/shell/palette.tsx` | Navigation vers les pages, plus d'actions mortes |
| `apps/web/src/routes/index.tsx` (supprimé) | L'écran de contrôle du lot 0 |
| `apps/web/src/routes/_protege.index.tsx` (nouveau) | Tableau de bord, vide jusqu'au lot 2 |
| `apps/web/src/routes/_protege.profil.tsx` (renommé depuis `_protege.parametres.tsx`) | Profil provisoire |
| `apps/web/src/routes/_protege.{seances,routines,exercices}.tsx` | Import `PageListeDetail` |
| `apps/web/src/routes/connexion.tsx` | Colonne centrée (D144), retour vers `/` |
| `.claude/rules/interface-web.md` | Coquille et écrans mis à jour |

---

### Task 1 : tokens et Archivo

**Files :**
- Modify : `apps/web/package.json`, `apps/web/src/main.tsx`, `apps/web/src/styles/tokens.css`,
  `apps/web/src/styles/globals.css`

**Interfaces :**
- Produces : variables CSS `--cal-0` … `--cal-4`, `--image-bg`, `--accent-line` ; classes
  Tailwind `bg-cal-0` … `bg-cal-4`, `bg-image-bg`, `font-sans` (Archivo) ; utilitaire
  `chiffre` (chiffre héros condensé). Les lots 2 à 6 s'en servent.

- [ ] **Step 1 : installer la police**

```bash
pnpm --filter @better-lift/web add @fontsource-variable/archivo@5.3.0
```

Vérifier que `apps/web/package.json` porte `"@fontsource-variable/archivo": "5.3.0"` (version
exacte, comme les autres dépendances épinglées du paquet).

- [ ] **Step 2 : importer la police dans `main.tsx`**

En tête de `apps/web/src/main.tsx`, avant `./styles/globals.css` :

```ts
// Les axes graisse ET largeur (D135) : la coupe condensée des chiffres héros est un
// simple `font-stretch`, là où le mobile doit générer un TTF.
import "@fontsource-variable/archivo/wdth.css";
import "./styles/globals.css";
```

- [ ] **Step 3 : aligner `tokens.css` sur le mobile**

Remplacer le contenu de `apps/web/src/styles/tokens.css` par :

```css
/* Les valeurs suivent `apps/mobile/lib/theme.ts` (D101, D135) : les deux surfaces
   partagent la palette. Nom web ← nom mobile en commentaire. */
:root {
  /* Surfaces — l'échelle porte la hiérarchie */
  --canvas: #08090a; /* canevas */
  --surface-1: #101214; /* surface1 */
  --surface-2: #181b1e; /* surface2 */
  --surface-3: #1e2226; /* surface3 */
  --nav-active: var(--surface-3);

  /* Filets */
  --line: #24272b; /* ligne */
  --line-strong: #32363b; /* ligneForte */

  /* Encre — quatre niveaux */
  --ink: #f2f3f5; /* encre */
  --ink-muted: #b6bcc4; /* encreSecondaire */
  --ink-subtle: #868d96; /* encreTertiaire */
  /* encreAttenuee : 5,4:1 sur le canevas, 4,7:1 sur --surface-2. */
  --ink-faint: #7f868f;

  /* Accent — aplat contre texte (D28, D29) */
  --accent: #a8cf45;
  --accent-on: #0b0f04;
  --accent-ink: #a8cf45; /* recordEncre */
  --accent-wash: rgb(168 207 69 / 0.14); /* recordFond */
  --accent-line: rgb(168 207 69 / 0.35); /* recordLigne */
  --focus-ring: rgb(168 207 69 / 0.45);

  /* Danger (D36) — borné au danger, ne porte jamais l'action ni le record.
     `--danger` est choisi sur deux contraintes à la fois : assez sombre pour que
     `--danger-on` tienne 5,65:1 dessus, assez clair pour que l'aplat lui-même se
     détache du fond à 3,24:1 — plus foncé, le bouton disparaîtrait dans la page. */
  --danger: #a83e39;
  --danger-on: #fdf3f2;
  --danger-ink: #e98b85;
  --danger-wash: rgb(168 62 57 / 0.16);

  /* Calendrier (D126, D127) : jour sans séance, puis quatre niveaux d'effort.
     Exception au lime de même nature que la carte du corps (D84) : une intensité,
     jamais une action ni un record. */
  --cal-0: #181b1e;
  --cal-1: rgb(168 207 69 / 0.25);
  --cal-2: rgb(168 207 69 / 0.5);
  --cal-3: rgb(168 207 69 / 0.75);
  --cal-4: #a8cf45;

  /* Vignettes et GIF d'exercice : blanc dans LES DEUX thèmes, les images du
     catalogue sont détourées sur blanc (fondImage). */
  --image-bg: #ffffff;

  /* Élévation — réservée au passager (D27) */
  --float-bg: rgb(28 32 36 / 0.9);
  --float-line: #383d44;
  --float-shadow: 0 20px 50px rgb(0 0 0 / 0.72), 0 3px 10px rgb(0 0 0 / 0.5);
  --scrim: rgb(4 5 6 / 0.45);

  --radius: 0.5rem;
}

[data-theme="light"] {
  --canvas: #f5f6f7;
  --surface-1: #ffffff;
  --surface-2: #eef0f2;
  --surface-3: #e4e7ea;
  /* L'entrée active de la navigation se pose sur le canevas : --surface-3 ne
     s'en détacherait qu'à peine. */
  --nav-active: #dde1e5;

  --line: #e1e4e8;
  --line-strong: #c9ced4;

  --ink: #0e1114;
  --ink-muted: #3e454d;
  --ink-subtle: #5f666f;
  --ink-faint: #656c75;

  /* L'aplat garde la même teinte : le texte sombre dessus passe largement.
     Le lime employé COMME TEXTE tombe sous 2:1 sur blanc — il passe à l'olive. */
  --accent: #a8cf45;
  --accent-on: #0b0f04;
  --accent-ink: #4d6a12;
  --accent-wash: rgb(168 207 69 / 0.22);
  --accent-line: rgb(77 106 18 / 0.35);
  --focus-ring: rgb(77 106 18 / 0.45);

  --danger: #a83e39;
  --danger-on: #fdf3f2;
  --danger-ink: #a83e39;
  --danger-wash: rgb(168 62 57 / 0.1);

  /* En clair, le lime pâle disparaît sur le blanc : le dégradé passe à l'olive. */
  --cal-0: #e4e7ea;
  --cal-1: rgb(77 106 18 / 0.2);
  --cal-2: rgb(77 106 18 / 0.42);
  --cal-3: rgb(77 106 18 / 0.68);
  --cal-4: #4d6a12;

  --image-bg: #ffffff;

  --float-bg: rgb(255 255 255 / 0.92);
  --float-line: #d6d6dc;
  --float-shadow: 0 18px 44px rgb(20 20 25 / 0.18), 0 3px 10px rgb(20 20 25 / 0.1);
  --scrim: rgb(20 20 25 / 0.28);
}
```

- [ ] **Step 4 : Archivo et rôles dans `globals.css`**

Dans le bloc `@theme inline`, ajouter après `--color-accent-ink` :

```css
  --color-accent-line: var(--accent-line);
  --color-accent-wash: var(--accent-wash);
  --color-image-bg: var(--image-bg);
  --color-cal-0: var(--cal-0);
  --color-cal-1: var(--cal-1);
  --color-cal-2: var(--cal-2);
  --color-cal-3: var(--cal-3);
  --color-cal-4: var(--cal-4);

  /* Archivo partout (D135) ; la police système ne sert que pendant le chargement. */
  --font-sans: "Archivo Variable", system-ui, sans-serif;
```

Dans la règle `body`, remplacer la ligne `font-family: "Instrument Sans", …` (une police jamais
chargée : le web tombait sur la police système) par :

```css
  font-family: var(--font-sans);
  font-size: 14px;
  /* Tout chiffre s'aligne en colonne : charges, reps, durées, dates. */
  font-variant-numeric: tabular-nums;
```

Après la règle `body`, ajouter l'utilitaire des chiffres héros :

```css
/* Le chiffre héros (D103, D135) : tuiles, bilans. Sur le web, la coupe condensée
   est un réglage de l'axe `wdth`, pas une police à part. */
@utility chiffre {
  font-stretch: 72%;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 5 : vérifier**

```bash
pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web build
```

Attendu : succès ; `apps/web/dist/assets/` contient des fichiers `archivo-latin-wdth-normal-*.woff2`.

- [ ] **Step 6 : commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/src/main.tsx apps/web/src/styles
git commit -m "feat(web): tokens alignés sur le mobile et police Archivo (D135)"
```

---

### Task 2 : coquille, deux gabarits, barre latérale

**Files :**
- Create : `apps/web/src/components/shell/coquille.tsx`,
  `apps/web/src/components/shell/page-tableau.tsx`
- Rename : `apps/web/src/components/shell/app-shell.tsx` →
  `apps/web/src/components/shell/page-liste-detail.tsx`
- Modify : `apps/web/src/components/shell/nav-lateral.tsx`,
  `apps/web/src/routes/_protege.seances.tsx`, `_protege.routines.tsx`, `_protege.exercices.tsx`,
  `_protege.parametres.tsx`, `apps/web/src/routes/index.tsx`, `apps/web/src/routes/__root.tsx`
  (commentaire)

**Interfaces :**
- Produces :
  - `Coquille({ children }: { children: ReactNode })` — barre latérale de 220 px + zone
    flottante (`SidebarInset`).
  - `PageListeDetail({ titre, liste, detail?, disposition? })` — mêmes props que l'ancien
    `AppShell` (`disposition: "liste" | "colonne"`).
  - `PageTableau({ titre, actions?, largeur?, children })` — `largeur: "pleine" | "lecture"`
    (défaut `"pleine"`) ; `titre` est le `<h1>` visible.

- [ ] **Step 1 : extraire `Coquille`**

`apps/web/src/components/shell/coquille.tsx` :

```tsx
import type { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NavLaterale } from "./nav-lateral";

/**
 * La barre latérale fixe et la zone de contenu, communes aux deux gabarits (D133).
 * Montée par la route de chaque écran, jamais par `__root.tsx` : seul le gabarit
 * sait quels panneaux il pose dedans.
 */
export function Coquille({ children }: { children: ReactNode }) {
  return (
    // 220 px (D136) : shadcn lit la largeur dans `--sidebar-width`.
    <SidebarProvider className="h-svh" style={{ "--sidebar-width": "220px" } as CSSProperties}>
      <NavLaterale />

      {/* La seule surface permanente qui flotte (D71). La barre n'est pas
          repliable : shadcn n'applique alors plus les marges de l'`inset`, d'où
          leur recopie ici. */}
      <SidebarInset className="m-2 ml-0 min-h-0 overflow-hidden rounded-2xl bg-(--surface-1) shadow-sm">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2 : `git mv` puis adapter `PageListeDetail`**

```bash
git mv apps/web/src/components/shell/app-shell.tsx apps/web/src/components/shell/page-liste-detail.tsx
```

Dans ce fichier :
- renommer la fonction `AppShell` en `PageListeDetail` ;
- retirer les imports `SidebarInset`, `SidebarProvider`, `NavLaterale`, ajouter
  `import { Coquille } from "./coquille";` ;
- remplacer le `return` par :

```tsx
  return (
    <Coquille>
      <h1 className="sr-only">{titre}</h1>

      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className="min-h-0 flex-1"
      >
        {/* … les deux ResizablePanel et la ResizableHandle, INCHANGÉS … */}
      </ResizablePanelGroup>
    </Coquille>
  );
```

Garder à l'identique `TAILLES`, `useDefaultLayout` et ses clés de persistance
(`better-lift-contenu`, `better-lift-contenu-colonne`) : les tailles réglées par l'utilisateur
survivent ainsi à la refonte.

- [ ] **Step 3 : créer `PageTableau`**

`apps/web/src/components/shell/page-tableau.tsx` :

```tsx
import { cn } from "cn";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coquille } from "./coquille";

type Props = {
  titre: string;
  /** À droite du titre : sélecteur de période, boutons. */
  actions?: ReactNode;
  /** `pleine` : la grille d'analyse ; `lecture` : une colonne centrée (Profil). */
  largeur?: "pleine" | "lecture";
  children: ReactNode;
};

/** Le gabarit des pages d'analyse (D133) : un en-tête, puis le contenu qui défile. */
export function PageTableau({ titre, actions, largeur = "pleine", children }: Props) {
  return (
    <Coquille>
      <ScrollArea className="h-full">
        <div
          className={cn(
            "flex flex-col gap-6 px-8 py-7",
            largeur === "lecture" && "mx-auto w-full max-w-2xl",
          )}
        >
          <header className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-[26px] font-extrabold tracking-tight">{titre}</h1>
            {actions}
          </header>
          {children}
        </div>
      </ScrollArea>
    </Coquille>
  );
}
```

- [ ] **Step 4 : la barre latérale (D134, D136)**

Dans `apps/web/src/components/shell/nav-lateral.tsx` :

1. Remplacer `ENTREES` :

```tsx
// Le Tableau de bord est la page d'arrivée (D134) ; le Profil vit en pied de barre.
const ENTREES = [
  { to: "/", label: "Tableau de bord", icone: LayoutDashboard },
  { to: "/seances", label: "Séances", icone: History },
  { to: "/routines", label: "Routines", icone: ListChecks },
  { to: "/exercices", label: "Exercices", icone: Dumbbell },
] as const;
```

2. Sur le `Link` des entrées, `activeOptions={{ includeSearch: false, exact: to === "/" }}` :
   sans `exact`, `/` resterait actif sur toutes les pages.
3. Sur `SidebarMenuButton` des entrées, ajouter
   `className="h-9 data-[active=true]:font-bold"` (ligne de 36 px, D136 ; l'actif en gras,
   sur `--nav-active` que shadcn pose déjà via `sidebar-accent`).
4. Dans l'en-tête, le nom à côté du logo : `className="text-base font-extrabold tracking-tight text-(--ink)"`.
5. Remplacer tout le `SidebarFooter` (le menu déroulant du compte) par un lien vers le Profil — la
   déconnexion vit dans le Profil :

```tsx
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Profil" className="data-[active=true]:font-bold">
              <Link to="/profil" activeProps={{ "data-active": true, "aria-current": "page" }}>
                <Avatar className="size-7 rounded-full">
                  <AvatarFallback className="rounded-full bg-(--surface-3) text-xs font-bold">
                    {initiales(email)}
                  </AvatarFallback>
                </Avatar>
                <span>Profil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
```

6. Nettoyer les imports devenus inutiles (`ChevronsUpDown`, `LogOut`, `Settings`, le
   `DropdownMenu*`, `useDeconnexion`) ; ajouter `LayoutDashboard`. Knip et Biome signalent tout
   oubli.

- [ ] **Step 5 : brancher les routes existantes**

- `_protege.seances.tsx`, `_protege.exercices.tsx`, `_protege.routines.tsx` : remplacer
  `import { AppShell } from "@/components/shell/app-shell";` par
  `import { PageListeDetail } from "@/components/shell/page-liste-detail";` et `<AppShell` par
  `<PageListeDetail`.
- `_protege.parametres.tsx` : remplacer `<AppShell titre="Paramètres" liste={<ScrollArea …>…</ScrollArea>} />`
  par `<PageTableau titre="Paramètres" largeur="lecture">…</PageTableau>`, en gardant le contenu
  du `div` intérieur (les `Section`) et en retirant le `ScrollArea` et son `div` (fournis par le
  gabarit). Il sera renommé en tâche 3.
- `routes/index.tsx` : remplacer `<AppShell titre="Accueil" liste={<Sante />} />` par
  `<PageTableau titre="Accueil"><Sante /></PageTableau>` (provisoire : le fichier disparaît en
  tâche 3).
- `__root.tsx` : dans le commentaire, remplacer « `AppShell` » par « les gabarits
  (`PageListeDetail`, `PageTableau`) ».

- [ ] **Step 6 : vérifier**

```bash
pnpm --filter @better-lift/web typecheck && pnpm lint && pnpm knip
```

Attendu : aucun « AppShell » restant (`git grep AppShell apps/web/src` ne renvoie que
`routeTree.gen.ts`, s'il y figure, sinon rien).

- [ ] **Step 7 : commit**

```bash
git add -A apps/web/src
git commit -m "feat(web): coquille, gabarits PageTableau et PageListeDetail, barre latérale (D133, D134, D136)"
```

---

### Task 3 : Tableau de bord en page d'arrivée, `/profil`, palette

**Files :**
- Delete : `apps/web/src/routes/index.tsx`
- Create : `apps/web/src/routes/_protege.index.tsx`
- Rename : `apps/web/src/routes/_protege.parametres.tsx` → `apps/web/src/routes/_protege.profil.tsx`
- Modify : `apps/web/src/components/shell/palette.tsx`, `apps/web/src/routes/connexion.tsx`
  (redirection par défaut)

**Interfaces :**
- Consumes : `PageTableau` (tâche 2), `champEtat`, `etatForceRendu`, `EtatVide`.
- Produces : route `/` protégée (fichier `_protege.index.tsx`, composant `TableauDeBord`) que le
  lot 2 remplit ; route `/profil` que le lot 6 refait.

- [ ] **Step 1 : le Tableau de bord, protégé**

```bash
git rm apps/web/src/routes/index.tsx
```

`apps/web/src/routes/_protege.index.tsx` :

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EtatVide } from "@/components/etats/etat-vide";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { PageTableau } from "@/components/shell/page-tableau";

const recherche = z.object({ etat: champEtat });

// La page d'arrivée (D134), sous la garde de `_protege` : l'ancien `/` du lot 0
// était public. Ses stats arrivent au lot 2.
export const Route = createFileRoute("/_protege/")({
  validateSearch: recherche,
  component: TableauDeBord,
});

function TableauDeBord() {
  const { etat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const force = etatForceRendu(etat, "Les statistiques n'ont pas pu être chargées.", () =>
    navigate({ search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <PageTableau titre="Tableau de bord">
      {force ?? (
        <div className="h-80">
          <EtatVide
            titre="Bientôt ici : tes statistiques."
            message="Séances, régularité, muscles travaillés et records, par période."
          />
        </div>
      )}
    </PageTableau>
  );
}
```

- [ ] **Step 2 : `/parametres` devient `/profil`**

```bash
git mv apps/web/src/routes/_protege.parametres.tsx apps/web/src/routes/_protege.profil.tsx
```

Dans le fichier : `createFileRoute("/_protege/profil")({ component: Profil })`, renommer la
fonction `Parametres` en `Profil` et `titre="Paramètres"` en `titre="Profil"`. Le contenu reste
celui de `/parametres` jusqu'au lot 6.

- [ ] **Step 3 : la connexion revient au Tableau de bord**

Dans `apps/web/src/routes/connexion.tsx`, `await navigate({ to: redirect ?? "/seances" })` devient
`await navigate({ to: redirect ?? "/" })`.

- [ ] **Step 4 : la palette navigue**

Les deux actions actuelles (« Démarrer une séance libre », « Créer une routine ») ne font rien,
et la première contredit D132. Dans `apps/web/src/components/shell/palette.tsx` :

```tsx
import { useNavigate } from "@tanstack/react-router";
// … imports existants …

// Les destinations de la barre latérale (D134). Exercices, routines et séances
// s'ajoutent à la palette avec leurs lots.
const PAGES = [
  { to: "/", label: "Tableau de bord" },
  { to: "/seances", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercices", label: "Exercices" },
  { to: "/profil", label: "Profil" },
] as const;
```

Dans `Palette`, `const navigate = useNavigate();`, `description="Aller à une page"`,
`placeholder="Aller à…"`, et remplacer le `CommandGroup` « Actions » par :

```tsx
        <CommandGroup heading="Pages">
          {PAGES.map(({ to, label }) => (
            <CommandItem
              key={to}
              onSelect={() => {
                setOuverte(false);
                navigate({ to });
              }}
            >
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
```

- [ ] **Step 5 : vérifier**

```bash
pnpm --filter @better-lift/web typecheck && pnpm lint && pnpm knip
```

`routeTree.gen.ts` est régénéré par le greffon de routes au `build` / `dev` : lancer
`pnpm --filter @better-lift/web build` si le typecheck se plaint d'une route inconnue, puis
relancer le typecheck. Attendu : succès, `git grep -n parametres apps/web/src` ne renvoie rien.

- [ ] **Step 6 : commit**

```bash
git add -A apps/web/src
git commit -m "feat(web): Tableau de bord en page d'arrivée, /profil, palette de navigation (D134)"
```

---

### Task 4 : connexion épurée (D144)

**Files :**
- Modify : `apps/web/src/routes/connexion.tsx`, `apps/web/src/features/auth/formulaire-connexion.tsx`

**Interfaces :**
- Consumes : `Logo`, `FormulaireConnexion` (props inchangées : `{ onSucces }`).

- [ ] **Step 1 : une colonne centrée**

Dans `connexion.tsx`, supprimer `POINTS`, la `section` d'accroche et les imports `ListChecks`,
`LucideIcon`, `Trophy`, `WifiOff`. Le `return` devient :

```tsx
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-10">
      <div className="flex w-full max-w-sm flex-1 flex-col justify-center">
        {/* D131 au bureau : la marque en tête, le formulaire dessous. */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <Logo className="size-14" />
          <span className="text-xl font-extrabold tracking-tight">better-lift</span>
        </div>
        {force ?? (
          <FormulaireConnexion
            onSucces={async () => {
              // Relire la session PUIS invalider : sans l'invalidation, le
              // `beforeLoad` de `_protege` relirait l'ancien contexte et
              // renverrait aussitôt vers /connexion.
              await chargerSession();
              await router.invalidate();
              await navigate({ to: redirect ?? "/" });
            }}
          />
        )}
      </div>
      <p className="text-xs text-(--ink-faint)">Un carnet privé, pour quelques comptes.</p>
    </main>
  );
```

- [ ] **Step 2 : le formulaire à l'échelle D136**

Dans `formulaire-connexion.tsx` : titre `className="text-2xl font-extrabold tracking-tight"`,
`CHAMP = "h-10 rounded-[10px] bg-(--surface-1)"`, bouton
`className="mt-6 h-10 rounded-[10px] font-bold"`. Le reste (trois refus, bascule création) ne
change pas.

- [ ] **Step 3 : vérifier et commit**

```bash
pnpm --filter @better-lift/web typecheck && pnpm lint
git add apps/web/src/routes/connexion.tsx apps/web/src/features/auth/formulaire-connexion.tsx
git commit -m "feat(web): connexion en colonne centrée (D144)"
```

---

### Task 5 : vérification à l'écran, règles, PR

**Files :**
- Modify : `.claude/rules/interface-web.md`

- [ ] **Step 1 : `/verif`**

Lancer la skill `/verif` (build, typecheck, test, lint, knip). Attendu : tout vert.

- [ ] **Step 2 : vérifier à l'écran**

`pnpm dev`, puis avec Playwright sur `http://localhost:3000`, compte
`controle@better-lift.local` (voir CLAUDE.md pour réinitialiser son mot de passe), en sombre puis
en clair, à 1280 et 1920 px de large :

1. `/connexion` : logo et nom centrés, formulaire, pas d'accroche ; connexion → `/`.
2. `/` : barre latérale de 220 px, « Tableau de bord » actif en gras sur surface (pas de lime),
   titre visible, état vide ; `/?etat=chargement`, `/?etat=erreur`, `/?etat=vide` rendent les
   trois états.
3. `/seances`, `/routines`, `/exercices` : liste / détail comme avant, tailles de panneaux
   conservées ; une seule entrée active à la fois (« Tableau de bord » éteint).
4. `/profil` : colonne centrée, thème qui bascule ; « Profil » actif en pied de barre.
5. `Ctrl K` → « Séances » navigue.
6. Les chiffres et le texte sont en Archivo (outil de développement → Computed → `font-family`
   rendu : `Archivo Variable`).

Arrêter le serveur de dev ensuite, et vérifier que le port 3000 est libre.

- [ ] **Step 3 : mettre à jour `.claude/rules/interface-web.md`**

Dans « Coquille (D69–D73, D81) » :
- ajouter la référence `2026-10-06-web-refonte-design.md` (D132–D144) ;
- remplacer « `AppShell` est monté par la route de MISE EN PAGE… » par : « **Le gabarit est monté
  par la route de chaque écran, jamais par `__root.tsx`** : `PageListeDetail` (liste / détail,
  `_protege.{exercices,seances,routines}.tsx`) ou `PageTableau` (Tableau de bord, Profil). Les
  deux posent `Coquille` (barre latérale de 220 px + zone flottante). »
- ajouter : « **Le web est le poste d'analyse (D132)** : aucune entrée qui lance une séance. »

Dans « Écrans », remplacer la puce **Paramètres** par : « **Profil** (`/profil`) : compte, thème
(seul endroit où il se change), unités et fuseau. `/` est le Tableau de bord, protégé. »

Dans « Pièges », ajouter : « Le lien `/` de la barre latérale porte `exact` : sans lui, il reste
actif sur toutes les pages. »

- [ ] **Step 4 : commit, pousser, PR**

```bash
git add .claude/rules/interface-web.md docs/superpowers/plans/2026-10-06-web-refonte-lot1-fondations.md
git commit -m "docs: règles du web après le lot 1 de la refonte"
git push -u origin feat/web-refonte
gh pr create --title "feat: refonte du web, lot 1 — fondations (D132–D136, D144)" --body "…"
```

Corps de la PR : la spec en lien, ce que le lot change (tokens, Archivo, coquille et gabarits,
`/` protégé, `/profil`, palette, connexion), la vérification à l'écran faite, et la ligne
`🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

---

## Lots suivants

Chacun aura son plan, écrit au moment où il démarre, sur la base de ce lot fusionné :
2 Tableau de bord (D137–D139) · 3 Séances (D140) · 4 Exercices (D141) · 5 Routines (D142) ·
6 Profil (D143).
