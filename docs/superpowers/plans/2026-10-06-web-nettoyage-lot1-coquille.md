# Nettoyage du web — lot 1 : coquille — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** une coquille de console plate — barre latérale pleine hauteur en groupes, pied
`NavUser`, en-tête de 44 px commun à toutes les pages avec fil d'Ariane — et la `Card` shadcn
restylée pour les lots suivants.

**Architecture :** `Coquille` quitte la zone flottante (D154). Un nouveau composant
`EnTetePage` (D157) est posé par les deux gabarits : il rend le `Breadcrumb` (le `h1` est le nom
de la page) et un emplacement d'actions. Le détail ouvert d'une page liste / détail s'y inscrit
par `<DansEnTete titre="…">` : le titre passe par un état du contexte (une chaîne, stable), les
actions par un portail dans l'emplacement. Les écrans ne changent pas encore d'habillage ; leurs
actions montent dans l'en-tête aux lots 3 à 5.

**Tech Stack :** React 19.2.3, TanStack Router 1.170, Tailwind 4.3, shadcn/ui (`Sidebar`,
`Breadcrumb`, `DropdownMenu`, `Avatar`, `Card`), Vitest.

**Spec :** [`docs/superpowers/specs/2026-10-06-web-nettoyage-design.md`](../specs/2026-10-06-web-nettoyage-design.md)
(D154–D158 ; « Découpage », lot 1).

## Global Constraints

- L'application est en **français** : identifiants, commentaires, libellés, commits.
- Un seul lime (`#a8cf45`) : aplat = action (`bg-primary`), contour = record (`--accent-ink`).
  L'entrée active de la navigation et l'entrée sélectionnée d'une liste sont des **surfaces**,
  jamais le lime. `bg-accent` reste la surface de survol shadcn.
- **Aucune valeur de token ne change** (`tokens.css` intact) : seul leur emploi change.
- Rien de permanent ne flotte (D154) : ombre, flou et voile restent au passager.
- Chaque écran garde ses quatre états par `?etat=`.
- Commits en Conventional Commits, en français, terminés par
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Branche `feat/web-nettoyage-lot-1` (déjà créée, porte la spec). `main` protégée : PR, squash.
- Knip refuse un export sans usage ; Biome formate chaque fichier édité.
- **Arrêter le serveur de dev avant tout changement de branche** (`routeTree.gen.ts`).
- `toggle-group` et `chart` (D159) arrivent au lot 2, où ils servent : un composant sans usage
  n'a pas sa place ici.

## Fichiers

| Fichier | Rôle |
|---|---|
| `apps/web/src/components/shell/nom-compte.ts` (nouveau) | `initiales`, `nomAffiche` tirés de l'adresse |
| `apps/web/src/components/shell/nom-compte.test.ts` (nouveau) | Leurs tests |
| `apps/web/src/components/ui/breadcrumb.tsx` (nouveau, CLI shadcn) | Primitive du fil d'Ariane |
| `apps/web/src/components/shell/en-tete-page.tsx` (nouveau) | `EnTetePage`, `DansEnTete` |
| `apps/web/src/components/shell/page-tableau.tsx` | Pose `EnTetePage`, plus de `h1` de 26 px |
| `apps/web/src/components/shell/page-liste-detail.tsx` | Pose `EnTetePage`, plus de `h1` `sr-only`, prop `vers` |
| `apps/web/src/routes/_protege.{seances,routines,exercices}.tsx` | Passent `vers` |
| `apps/web/src/features/{seances/detail-seance,routines/editeur-routine,exercices/detail-exercice}.tsx` | `<DansEnTete titre>` |
| `apps/web/src/components/shell/coquille.tsx` | Plate (D154) |
| `apps/web/src/components/shell/nav-lateral.tsx` | Groupes, champ de recherche, `NavUser` (D155, D156) |
| `apps/web/src/components/ui/card.tsx` | Restylée (D158) |
| `apps/web/src/styles/globals.css` | `--color-card` → `--surface-1`, commentaire de la sidebar |
| `.claude/rules/interface-web.md` | Coquille mise à jour |

---

### Task 1 : le nom du compte

**Files:**
- Create: `apps/web/src/components/shell/nom-compte.ts`
- Test: `apps/web/src/components/shell/nom-compte.test.ts`
- Modify: `apps/web/src/components/shell/nav-lateral.tsx` (retirer `initiales`, l'importer)

**Interfaces:**
- Produces: `initiales(email: string): string`, `nomAffiche(email: string): string`

- [ ] **Step 1 : écrire les tests**

```ts
import { describe, expect, it } from "vitest";
import { initiales, nomAffiche } from "./nom-compte";

describe("initiales", () => {
  it("prend une lettre de chaque partie de l'adresse", () => {
    expect(initiales("alexis.gontier@gmail.com")).toBe("AG");
  });
  it("prend les deux premières lettres d'une partie unique", () => {
    expect(initiales("controle@better-lift.local")).toBe("CO");
  });
  it("rend « ? » pour une adresse vide", () => {
    expect(initiales("")).toBe("?");
  });
});

describe("nomAffiche", () => {
  it("capitalise chaque partie", () => {
    expect(nomAffiche("alexis.gontier03@gmail.com")).toBe("Alexis Gontier03");
  });
  it("garde une partie unique", () => {
    expect(nomAffiche("controle@better-lift.local")).toBe("Controle");
  });
  it("rend « Compte » pour une adresse vide", () => {
    expect(nomAffiche("")).toBe("Compte");
  });
});
```

- [ ] **Step 2 : vérifier l'échec**

Run: `pnpm --filter @better-lift/web exec vitest run src/components/shell/nom-compte.test.ts`
Expected: FAIL, module `./nom-compte` introuvable.

- [ ] **Step 3 : implémenter**

```ts
/** Les parties du nom local de l'adresse : « alexis.gontier » → ["alexis", "gontier"]. */
const parties = (email: string) => (email.split("@")[0] ?? "").split(/[._-]/).filter(Boolean);

/** Deux lettres tirées de l'adresse : « alexis.gontier » → « AG ». */
export function initiales(email: string) {
  const [a = "", b = ""] = parties(email);
  return (a.charAt(0) + (b.charAt(0) || a.charAt(1))).toUpperCase() || "?";
}

/** Le nom du pied de barre (D156), faute de profil nommé : « alexis.gontier » → « Alexis Gontier ». */
export function nomAffiche(email: string) {
  const mots = parties(email).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return mots.join(" ") || "Compte";
}
```

Dans `nav-lateral.tsx`, supprimer la fonction locale `initiales` et ajouter
`import { initiales } from "./nom-compte";`.

- [ ] **Step 4 : vérifier le succès**

Run: `pnpm --filter @better-lift/web exec vitest run src/components/shell/nom-compte.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5 : commit**

```bash
git add apps/web/src/components/shell/nom-compte.ts apps/web/src/components/shell/nom-compte.test.ts apps/web/src/components/shell/nav-lateral.tsx
git commit -m "refactor(web): nom du compte tiré de l'adresse, testé"
```

---

### Task 2 : l'en-tête commun (D157)

**Files:**
- Create: `apps/web/src/components/ui/breadcrumb.tsx` (CLI)
- Create: `apps/web/src/components/shell/en-tete-page.tsx`
- Modify: `apps/web/src/components/shell/page-tableau.tsx`, `page-liste-detail.tsx`
- Modify: `apps/web/src/routes/_protege.seances.tsx`, `_protege.routines.tsx`, `_protege.exercices.tsx`
- Modify: `apps/web/src/features/seances/detail-seance.tsx`, `features/routines/editeur-routine.tsx`, `features/exercices/detail-exercice.tsx`

**Interfaces:**
- Produces:
  - `EnTetePage({ titre: string; vers?: LinkProps["to"]; actions?: ReactNode; children: ReactNode })`
  - `DansEnTete({ titre: string; children?: ReactNode })` — inscrit le détail ouvert dans le fil
    et porte `children` dans l'emplacement d'actions. Utilisé par les lots 3 à 5.
  - `PageListeDetail` gagne la prop obligatoire `vers: "/seances" | "/routines" | "/exercices"`.

- [ ] **Step 1 : ajouter la primitive**

Run (depuis `apps/web`) : `pnpm dlx shadcn@latest add breadcrumb`
Puis vérifier que `src/components/ui/breadcrumb.tsx` existe et importe `cn` comme les autres
primitives (`import { cn } from "cn";`) ; corriger l'import si la CLI a écrit `@/lib/utils`.

- [ ] **Step 2 : écrire `en-tete-page.tsx`**

```tsx
import { Link, type LinkProps } from "@tanstack/react-router";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Contexte = {
  inscrire: (titre: string | null) => void;
  emplacement: HTMLElement | null;
};

const ContexteEnTete = createContext<Contexte>({ inscrire: () => {}, emplacement: null });

/**
 * L'en-tête commun (D157) : 44 px, le fil d'Ariane à gauche — son premier élément est le `h1`
 * de la page —, les actions à droite. Posé par les deux gabarits, jamais par un écran.
 */
export function EnTetePage({
  titre,
  vers,
  actions,
  children,
}: {
  titre: string;
  /** La liste de la page : avec un détail ouvert, le titre y ramène. */
  vers?: LinkProps["to"];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [detail, inscrire] = useState<string | null>(null);
  const [emplacement, setEmplacement] = useState<HTMLElement | null>(null);

  return (
    <ContexteEnTete.Provider value={{ inscrire, emplacement }}>
      <header className="flex h-11 shrink-0 items-center gap-3 border-b px-6">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <h1 className="text-sm font-semibold">
                {detail && vers ? (
                  <BreadcrumbLink asChild>
                    <Link to={vers} search={(s) => s}>
                      {titre}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{titre}</BreadcrumbPage>
                )}
              </h1>
            </BreadcrumbItem>
            {detail ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate font-semibold">{detail}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
        <div ref={setEmplacement} className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      </header>
      {children}
    </ContexteEnTete.Provider>
  );
}

/**
 * Le détail ouvert s'inscrit dans l'en-tête de sa page : son nom au bout du fil, ses actions
 * dans l'emplacement. Le titre passe par l'état (une chaîne, stable) ; les actions par un
 * portail, pour garder leurs gestionnaires dans le composant qui les possède.
 */
export function DansEnTete({ titre, children }: { titre: string; children?: ReactNode }) {
  const { inscrire, emplacement } = useContext(ContexteEnTete);
  useEffect(() => {
    inscrire(titre);
    return () => inscrire(null);
  }, [titre, inscrire]);
  return emplacement && children ? createPortal(children, emplacement) : null;
}
```

- [ ] **Step 3 : `PageTableau` pose l'en-tête**

Remplacer le rendu de `page-tableau.tsx` par :

```tsx
export function PageTableau({ titre, actions, largeur = "pleine", children }: Props) {
  return (
    <Coquille>
      <EnTetePage titre={titre} actions={actions}>
        <ScrollArea className="min-h-0 flex-1">
          <div
            className={cn(
              "flex flex-col gap-6 px-6 py-6",
              largeur === "lecture" && "mx-auto w-full max-w-2xl",
            )}
          >
            {children}
          </div>
        </ScrollArea>
      </EnTetePage>
    </Coquille>
  );
}
```

avec `import { EnTetePage } from "./en-tete-page";`, et la doc de la prop `actions` devient
« Dans l'en-tête, à droite : sélecteur de période, boutons. »

- [ ] **Step 4 : `PageListeDetail` pose l'en-tête**

Dans `page-liste-detail.tsx` : ajouter au type `Props`

```tsx
  /** La liste de la page : le titre du fil y ramène quand un détail est ouvert. */
  vers: "/seances" | "/routines" | "/exercices";
```

supprimer `<h1 className="sr-only">{titre}</h1>`, envelopper le `ResizablePanelGroup` dans
`<EnTetePage titre={titre} vers={vers}>…</EnTetePage>`, et retirer `bg-(--surface-1)` de
l'`aside` (le contenu est sur le canevas, D154) :

```tsx
              <aside aria-label="Détail" className="h-full">
```

Dans les trois routes, ajouter la prop : `vers="/seances"` (`_protege.seances.tsx`),
`vers="/routines"` (`_protege.routines.tsx`), `vers="/exercices"` (`_protege.exercices.tsx`).

- [ ] **Step 5 : les détails s'inscrivent**

En tête du JSX retourné, juste après la balise racine :
- `detail-seance.tsx` : `<DansEnTete titre={seance.nom} />`
- `detail-exercice.tsx` : `<DansEnTete titre={exercice.nom} />`
- `editeur-routine.tsx` : `<DansEnTete titre={brouillon.nom || "Nouvelle routine"} />`

avec `import { DansEnTete } from "@/components/shell/en-tete-page";`. Leurs titres internes
restent jusqu'à leur lot (3 à 5).

- [ ] **Step 6 : vérifier**

Run: `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test`
Expected: aucun erreur, tests verts.

- [ ] **Step 7 : commit**

```bash
git add apps/web/src
git commit -m "feat(web): en-tête commun avec fil d'Ariane sur toutes les pages (D157)"
```

---

### Task 3 : la coquille plate et la barre en groupes (D154–D156)

**Files:**
- Modify: `apps/web/src/components/shell/coquille.tsx`
- Modify: `apps/web/src/components/shell/nav-lateral.tsx`
- Modify: `apps/web/src/styles/globals.css` (commentaire de la sidebar)

**Interfaces:**
- Consumes: `initiales`, `nomAffiche` (Task 1) ; `OUVRIR_PALETTE` (`palette.tsx`) ;
  `useDeconnexion` (`lib/deconnexion.ts`).

- [ ] **Step 1 : `Coquille` plate**

```tsx
/**
 * La barre latérale et le contenu, communs aux deux gabarits (D133). Montée par la route de
 * chaque écran, jamais par `__root.tsx` : seul le gabarit sait quels panneaux il pose dedans.
 * Plate (D154) : rien de permanent ne flotte, le contenu est posé sur le canevas.
 */
export function Coquille({ children }: { children: ReactNode }) {
  return (
    // 220 px (D136) : shadcn lit la largeur dans `--sidebar-width`.
    <SidebarProvider className="h-svh" style={{ "--sidebar-width": "220px" } as CSSProperties}>
      <NavLaterale />
      <SidebarInset className="min-h-0 overflow-hidden bg-(--canvas)">{children}</SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2 : `NavLaterale` en groupes, avec `NavUser`**

Réécrire `nav-lateral.tsx` :

```tsx
import { Link, useRouteContext } from "@tanstack/react-router";
import {
  Dumbbell,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Search,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useDeconnexion } from "@/lib/deconnexion";
import { initiales, nomAffiche } from "./nom-compte";
import { OUVRIR_PALETTE } from "./palette";

// Le Tableau de bord seul en tête, puis les groupes (D155) ; le Profil vit dans le pied (D156).
const GROUPES = [
  { libelle: null, entrees: [{ to: "/", label: "Tableau de bord", icone: LayoutDashboard }] },
  {
    libelle: "Entraînement",
    entrees: [
      { to: "/seances", label: "Séances", icone: History },
      { to: "/routines", label: "Routines", icone: ListChecks },
    ],
  },
  { libelle: "Catalogue", entrees: [{ to: "/exercices", label: "Exercices", icone: Dumbbell }] },
] as const;

export function NavLaterale() {
  const email = useRouteContext({ strict: false }).auth?.session?.user.email ?? "";

  return (
    // Non repliable : shadcn rend alors un simple bloc, sans le filet de la variante
    // `sidebar` — il est posé ici (D154).
    <Sidebar collapsible="none" aria-label="Navigation principale" className="border-r">
      <SidebarHeader className="gap-3">
        <Link to="/" className="flex items-center gap-2 px-2 pt-1.5">
          <Logo />
          <span className="text-base font-extrabold tracking-tight text-(--ink)">better-lift</span>
        </Link>
        {/* Un champ en apparence (D155), un bouton en fait : il ouvre la palette. */}
        <button
          type="button"
          onClick={() => document.dispatchEvent(new Event(OUVRIR_PALETTE))}
          className="flex h-8 items-center gap-2 rounded-md border border-(--line-strong) bg-(--surface-1) px-2.5 text-[13px] text-(--ink-faint) outline-none hover:text-(--ink-muted) focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        >
          <Search className="size-3.5" aria-hidden="true" />
          Rechercher
          <kbd className="ml-auto rounded border border-(--line-strong) px-1 text-[11px]">
            Ctrl K
          </kbd>
        </button>
      </SidebarHeader>

      <SidebarContent>
        {GROUPES.map(({ libelle, entrees }) => (
          <SidebarGroup key={libelle ?? "accueil"} className="py-1">
            {libelle ? <SidebarGroupLabel>{libelle}</SidebarGroupLabel> : null}
            <SidebarMenu>
              {entrees.map(({ to, label, icone: Icone }) => (
                <SidebarMenuItem key={to}>
                  {/* `isActive` passe par le `data-active` du lien actif : la route décide. */}
                  <SidebarMenuButton asChild className="h-8 data-[active=true]:font-bold">
                    {/* Les filtres de l'URL ne doivent pas éteindre l'entrée ; sans `exact`,
                        `/` resterait actif sur toutes les pages. */}
                    <Link
                      to={to}
                      activeOptions={{ includeSearch: false, exact: to === "/" }}
                      activeProps={{ "data-active": true, "aria-current": "page" }}
                    >
                      <Icone aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <NavUser email={email} />
      </SidebarFooter>
    </Sidebar>
  );
}

/** Le pied de barre (D156) : le compte, et son menu Profil / Se déconnecter. */
function NavUser({ email }: { email: string }) {
  const seDeconnecter = useDeconnexion();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-7 rounded-full">
                <AvatarFallback className="rounded-full bg-(--surface-3) text-xs font-bold">
                  {initiales(email)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate font-semibold text-(--ink)">
                {nomAffiche(email)}
              </span>
              <MoreHorizontal className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
            <DropdownMenuLabel className="truncate font-normal text-(--ink-subtle)">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profil">
                <UserRound aria-hidden="true" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void seDeconnecter()}>
              <LogOut aria-hidden="true" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

- [ ] **Step 3 : commentaire de la sidebar dans `globals.css`**

Remplacer le commentaire au-dessus de `--color-sidebar` par :

```css
  /* La sidebar (D72, D154). Même fond que le canevas et le contenu : la coquille
     est plate, un filet sépare la barre du contenu. L'élément actif est une
     SURFACE, jamais le lime — `sidebar-primary` n'est utilisé par aucun bloc
     rendu ici, mais il reste traduit pour qu'aucun rôle n'émette en silence. */
```

- [ ] **Step 4 : vérifier**

Run: `pnpm --filter @better-lift/web typecheck && pnpm knip`
Expected: aucune erreur ; Knip ne signale rien (si `SidebarInput` ou un autre import reste sans
usage, le retirer).

- [ ] **Step 5 : commit**

```bash
git add apps/web/src
git commit -m "feat(web): coquille plate, barre en groupes et menu du compte (D154–D156)"
```

---

### Task 4 : la carte shadcn (D158)

**Files:**
- Modify: `apps/web/src/components/ui/card.tsx`
- Modify: `apps/web/src/styles/globals.css` (`--color-card`)

**Interfaces:**
- Produces: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`,
  `CardFooter` à l'échelle du web — utilisés par les lots 2 à 6. Aucun usage aujourd'hui.

- [ ] **Step 1 : `--color-card`**

Dans `globals.css` :

```css
  /* `card` (D158) : la carte se détache par son filet, une marche au-dessus du canevas. */
  --color-card: var(--surface-1);
```

- [ ] **Step 2 : restyler `card.tsx`**

Classes à remplacer, fonction par fonction :
- `Card` : `"flex flex-col gap-4 rounded-xl border bg-card py-5 text-card-foreground"` (plus
  d'ombre : rien de permanent ne flotte).
- `CardHeader` : `px-6` → `px-5`, `[.border-b]:pb-6` → `[.border-b]:pb-4`, `gap-2` → `gap-1`.
- `CardTitle` : `"text-sm leading-none font-bold text-(--ink)"`.
- `CardDescription` : `"text-[13px] text-(--ink-subtle)"`.
- `CardContent` : `px-6` → `px-5`.
- `CardFooter` : `"flex items-center px-5 text-[13px] text-(--ink-muted) [.border-t]:pt-4"`.

- [ ] **Step 3 : vérifier**

Run: `pnpm --filter @better-lift/web typecheck`
Expected: aucune erreur.

- [ ] **Step 4 : commit**

```bash
git add apps/web/src/components/ui/card.tsx apps/web/src/styles/globals.css
git commit -m "feat(web): carte shadcn à filet, à l'échelle du web (D158)"
```

---

### Task 5 : vérifier, documenter, PR

**Files:**
- Modify: `.claude/rules/interface-web.md`
- Modify: `docs/superpowers/specs/2026-10-06-web-nettoyage-design.md` (si un écart apparaît)

- [ ] **Step 1 : tout le dépôt**

Run: `/verif` (build, typecheck, test, lint, knip)
Expected: tout vert.

- [ ] **Step 2 : à l'écran**

`pnpm dev`, compte `controle@better-lift.local` (voir CLAUDE.md pour le mot de passe). Avec
Playwright, à 1280 et 1920 px, en sombre puis en clair (Profil → Thème) :
- `/` : en-tête « Tableau de bord » + sélecteur à droite, pas de zone flottante, filet entre la
  barre et le contenu ;
- `/seances` puis une séance : fil « Séances / <nom> », « Séances » ramène à la liste ;
- `/routines/nouvelle` : fil « Routines / Nouvelle routine », suit la saisie du nom ;
- `/exercices/<slug>` : fil « Exercices / <nom> » ;
- barre : groupes Entraînement et Catalogue, champ Rechercher ouvre la palette, `Ctrl K` aussi ;
- pied : « ⋯ » → Profil ouvre `/profil`, Se déconnecter ramène à `/connexion` ;
- `?etat=chargement|erreur|vide` sur `/` et `/seances` : les états tiennent sous l'en-tête.

- [ ] **Step 3 : `interface-web.md`**

Section « Coquille » : remplacer la puce `Sidebar variant="inset"…` par :

```markdown
- **Coquille plate (D154–D156, `2026-10-06-web-nettoyage-design.md`)** : `Sidebar
  collapsible="none"` (sans variante : non repliable, shadcn rend un simple bloc), filet `border-r`
  posé à la main, fond `--canvas` comme le contenu — **rien de permanent ne flotte**. Barre de
  220 px en groupes : Tableau de bord seul, **Entraînement** (Séances, Routines), **Catalogue**
  (Exercices). Champ « Rechercher » (ouvre la palette). Pied `NavUser` : nom tiré de l'adresse
  (`nom-compte.ts`), menu Profil / Se déconnecter.
- **En-tête commun `EnTetePage` (D157)**, posé par les deux gabarits : 44 px, fil d'Ariane dont le
  premier élément est le `h1` de la page, actions à droite. Un détail s'y inscrit par
  `<DansEnTete titre="…">actions</DansEnTete>` (titre par état, actions par portail).
```

Remplacer, dans la puce des gabarits, « (liste / détail, titre en `sr-only`) » par
« (liste / détail, prop `vers`) » et « (titre visible, … ) » par « (`largeur` `pleine` ou
`lecture`) ». Section « Élévation et thème » : remplacer la première puce par
« **Rien de permanent ne flotte** (D154, révise D71). Flou, ombre portée et voile sont réservés au
momentané (palette, menus, dialogues). Les cartes (`Card`, D158) se détachent par leur filet sur
`--surface-1`. »

- [ ] **Step 4 : commit et PR**

```bash
git add .claude/rules/interface-web.md docs/superpowers
git commit -m "docs(web): coquille plate et en-tête commun dans les consignes"
git push -u origin feat/web-nettoyage-lot-1
gh pr create --title "feat: nettoyage du web, lot 1 — coquille (D154–D158)" --body "…"
```

Corps de PR : résumé des décisions, captures sombre / clair, plan de test coché, et la ligne
`🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
