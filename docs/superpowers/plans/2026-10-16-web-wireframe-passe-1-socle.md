# Wireframe web — passe 1 : socle — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remettre `apps/web` à zéro et poser la coquille cliquable du wireframe (sidebar repliable en icônes, header avec recherche Ctrl K, raccourcis, barre de prototypage) avec toutes les routes présentes sous forme de pages-titres.

**Architecture:** SPA Vite + TanStack Router (routes en fichiers plats). Un layout sans chemin `_app` porte la coquille shadcn (`SidebarProvider` + `SidebarInset`), un layout `_auth` centre les pages d'authentification. Les paramètres de prototypage `?v=` et `?etat=` sont validés à la racine et lus partout par `useProto()`. Aucun appel à l'API.

**Tech Stack:** Vite 8, React 19.2.3, TanStack Router 1.170, Tailwind 4, shadcn/ui (style `new-york`, base neutre), lucide-react, cmdk, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-10-16-web-wireframe-design.md` (D221–D228, § 3 coquille, § 6 ordre des passes)

## Global Constraints

- Branche `feat/web-wireframe`, jamais de push sur `main`.
- Code, noms de fichiers et adresses en anglais ; **textes affichés en français**.
- Front seul (D222) : aucun import de `@better-lift/api-client`, `@better-lift/shared`, `better-auth`.
- Thème neutre shadcn par défaut, clair et sombre par la classe `.dark` sur `<html>` ; aucun style propre au projet (le style vient plus tard).
- Composants externes : uniquement shadcn dans cette passe. Tout autre composant se fait valider (D228).
- TypeScript 6.0.3 et React 19.2.3 imposés par le catalogue pnpm : ne pas les changer.
- Commits en Conventional Commits, en français, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Les commandes shadcn se lancent depuis la racine avec `-c apps/web`.
- Après chaque tâche visible : capture Playwright de `http://localhost:3000` (mémoire « vérifier après chaque changement »).

## Structure des fichiers (fin de passe 1)

```
apps/web/
  index.html                         script de thème (.dark)
  package.json                       dépendances nettoyées
  vite.config.ts                     sans proxy /api
  src/
    main.tsx                         routeur, 404 et erreur par défaut
    vite-env.d.ts                    (gardé)
    lib/utils.ts                     (gardé) cn
    lib/theme.ts                     lecture / écriture du thème
    styles/globals.css               thème neutre shadcn
    hooks/use-mobile.ts              (installé par sidebar)
    components/ui/*                  shadcn réinstallés
    components/states/router-pages.tsx   404 + erreur
    components/page-placeholder.tsx  page-titre de la passe 1
    components/shell/nav.ts          entrées de la sidebar
    components/shell/app-sidebar.tsx
    components/shell/site-header.tsx
    components/shell/app-breadcrumb.tsx
    components/shell/user-menu.tsx
    components/shell/theme-toggle.tsx
    components/shell/shell-dialogs.tsx   contexte d'ouverture palette / raccourcis
    components/shell/command-palette.tsx
    components/shell/shortcuts.ts        logique pure des raccourcis
    components/shell/shortcuts.test.ts
    components/shell/shortcut-listener.tsx
    components/shell/shortcuts-dialog.tsx
    components/proto/proto-search.ts     logique pure ?v= / ?etat=
    components/proto/proto-search.test.ts
    components/proto/use-proto.ts
    components/proto/proto-bar.tsx
    mocks/user.ts
    routes/__root.tsx
    routes/_app.tsx                  coquille
    routes/_auth.tsx                 layout centré
    routes/_app.*.tsx, routes/_auth.*.tsx   (table de la tâche 2)
```

---

### Task 1: Remise à zéro du web

**Files:**
- Delete: tout `apps/web/src` sauf `main.tsx`, `vite-env.d.ts`, `lib/utils.ts`, `routeTree.gen.ts` (regénéré)
- Modify: `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/index.html`, `apps/web/src/main.tsx`
- Create: `apps/web/src/styles/globals.css`, `apps/web/src/lib/theme.ts`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/index.tsx` (temporaire, supprimé en tâche 2)

**Interfaces:**
- Produces: `getTheme(): Theme`, `setTheme(t: Theme): void`, `type Theme = "light" | "dark"` dans `lib/theme.ts` ; clé localStorage `better-lift-theme`.

- [ ] **Step 1: Supprimer l'ancien code**

```bash
cd apps/web/src
rm -rf components features hooks routes styles
find lib -type f ! -name utils.ts -delete
rm -f routeTree.gen.ts
```

- [ ] **Step 2: Nettoyer les dépendances**

```bash
pnpm --filter @better-lift/web remove @better-lift/api-client @better-lift/shared better-auth @tanstack/react-query @fontsource-variable/archivo @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts zod react-resizable-panels
pnpm --filter @better-lift/web add -D tw-animate-css
```

(`react-resizable-panels`, `recharts`, `zod`, `@dnd-kit/*` reviendront avec les composants qui en ont besoin.)

- [ ] **Step 3: `vite.config.ts` sans proxy**

Retirer le bloc `proxy` ; garder `server: { port: 3000 }`, les plugins et l'alias `@`.

- [ ] **Step 4: Thème neutre shadcn — `src/styles/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: `src/lib/theme.ts`**

```ts
export type Theme = "light" | "dark";

const KEY = "better-lift-theme";

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Stockage indisponible (navigation privée) : le thème vaut pour la session.
  }
}
```

- [ ] **Step 6: `index.html` — script de thème sur la classe `.dark`**

Remplacer le script existant par :

```html
    <script>
      (() => {
        var t;
        try {
          t = localStorage.getItem("better-lift-theme");
        } catch (_e) {}
        if (t !== "dark" && t !== "light") {
          t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        if (t === "dark") document.documentElement.classList.add("dark");
      })();
    </script>
```

- [ ] **Step 7: `src/routes/__root.tsx` et `src/routes/index.tsx` minimaux**

```tsx
// __root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({ component: Outlet });
```

```tsx
// index.tsx (temporaire)
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <h1 className="p-6 text-2xl font-semibold">better-lift</h1>,
});
```

- [ ] **Step 8: `src/main.tsx`**

```tsx
import "./styles/globals.css";

import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

- [ ] **Step 9: Vérifier**

Run: `pnpm --filter @better-lift/web build && pnpm --filter @better-lift/web typecheck`
Expected: succès (le build regénère `routeTree.gen.ts`). Puis `pnpm --filter @better-lift/web dev` et capture de `http://localhost:3000` : « better-lift » sur fond blanc.

- [ ] **Step 10: Commit**

```bash
git add -A apps/web pnpm-lock.yaml
git commit -m "chore(web): remise à zéro du web, thème neutre shadcn (D221)"
```

---

### Task 2: Toutes les routes, en pages-titres

**Files:**
- Install (shadcn): `button`
- Create: `src/components/page-placeholder.tsx`, `src/components/states/router-pages.tsx`, `src/routes/_app.tsx` (provisoire : `<Outlet />` dans un `<main>`), `src/routes/_auth.tsx`, toutes les routes de la table
- Delete: `src/routes/index.tsx`
- Modify: `src/main.tsx` (404 et erreur par défaut), `src/routes/__root.tsx` (déclaration de `staticData`)

**Interfaces:**
- Produces: `staticData.crumb: string` sur chaque route de la coquille (lu par le fil d'Ariane en tâche 3) ; `PagePlaceholder({ title, description })` ; `NotFoundPage`, `ErrorPage`.

- [ ] **Step 1: Installer `button`**

Run: `npx shadcn@latest add button -c apps/web -y`

- [ ] **Step 2: Déclarer `staticData` — ajouter à `__root.tsx`**

```tsx
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /** Libellé de la route dans le fil d'Ariane. */
    crumb?: string;
  }
}
```

- [ ] **Step 3: `src/components/page-placeholder.tsx`**

```tsx
type Props = { title: string; description: string };

/** Page-titre de la passe 1 : un nom, une phrase, un cadre vide. */
export function PagePlaceholder({ title, description }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex min-h-64 flex-1 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Zone à dessiner
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `src/components/states/router-pages.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-mono text-muted-foreground text-sm">404</p>
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <Button asChild variant="outline">
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </div>
  );
}

export function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground text-sm">Cette page n'a pas pu s'afficher.</p>
      <Button variant="outline" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
```

Dans `main.tsx` : `createRouter({ routeTree, defaultNotFoundComponent: NotFoundPage, defaultErrorComponent: ErrorPage })`.

- [ ] **Step 5: Layouts provisoires**

```tsx
// routes/_app.tsx (remplacé par la coquille en tâche 3)
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: () => (
    <main className="flex min-h-svh flex-col p-6">
      <Outlet />
    </main>
  ),
});
```

```tsx
// routes/_auth.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: () => (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </main>
  ),
});
```

- [ ] **Step 6: Créer les routes de la table**

Chaque fichier suit exactement ce modèle (ici `_app.planning.tsx`) ; seules changent les valeurs de la table :

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/planning")({
  staticData: { crumb: "Planning" },
  component: () => (
    <PagePlaceholder
      title="Planning"
      description="Calendrier semaine ou mois : routines planifiées et séances faites."
    />
  ),
});
```

| Fichier | Id de route | crumb | title | description |
|---|---|---|---|---|
| `_app.index.tsx` | `/_app/` | Accueil | Accueil | Aujourd'hui, la semaine, la régularité, les objectifs et le poids. |
| `_app.planning.tsx` | `/_app/planning` | Planning | Planning | Calendrier semaine ou mois : routines planifiées et séances faites. |
| `_app.routines.tsx` | `/_app/routines` | Routines | *(layout : `component: Outlet`, pas de PagePlaceholder)* | — |
| `_app.routines.index.tsx` | `/_app/routines/` | *(aucun)* | Routines | Dossiers de routines, détail d'une routine à droite. |
| `_app.routines.$id.tsx` | `/_app/routines/$id` | Détail | Routine | Exercices, séries cibles, supersets et dernière exécution. |
| `_app.routines.new.tsx` | `/_app/routines/new` | Nouvelle | Nouvelle routine | Éditeur : exercices réordonnables, séries, supersets, notes. |
| `_app.routines.$id_.edit.tsx` | `/_app/routines/$id_/edit` | Modifier | Modifier la routine | Éditeur : exercices réordonnables, séries, supersets, notes. |
| `_app.exercises.tsx` | `/_app/exercises` | Exercices | *(layout : `component: Outlet`)* | — |
| `_app.exercises.index.tsx` | `/_app/exercises/` | *(aucun)* | Exercices | Catalogue filtrable, détail d'un exercice à droite. |
| `_app.exercises.$slug.tsx` | `/_app/exercises/$slug` | Détail | Exercice | Résumé, historique et records de l'exercice. |
| `_app.history.tsx` | `/_app/history` | Historique | *(layout : `component: Outlet`)* | — |
| `_app.history.index.tsx` | `/_app/history/` | *(aucun)* | Historique | Séances par mois, détail d'une séance à droite. |
| `_app.history.$id.tsx` | `/_app/history/$id` | Détail | Séance | Exercices, séries, records et écart avec la séance précédente. |
| `_app.progress.tsx` | `/_app/progress` | Progression | Progression | Graphiques par période et tableau des records. |
| `_app.body.tsx` | `/_app/body` | Corps | Corps | Poids avec moyenne sur 7 jours, objectif et mensurations. |
| `_app.settings.tsx` | `/_app/settings` | Paramètres | *(layout : `component: Outlet`)* | — |
| `_app.settings.index.tsx` | `/_app/settings/` | *(aucun)* | *(voir ci-dessous : redirection)* | — |
| `_app.settings.account.tsx` | `/_app/settings/account` | Compte | Compte | Profil, sécurité, sessions ouvertes et zone de danger. |
| `_app.settings.preferences.tsx` | `/_app/settings/preferences` | Préférences | Préférences | Unités, format de date, premier jour de la semaine, apparence. |
| `_app.settings.training.tsx` | `/_app/settings/training` | Entraînement | Entraînement | Repos, incréments, barre, disques, formule du 1RM, RPE / RIR. |
| `_app.settings.data.tsx` | `/_app/settings/data` | Données | Données | Import Hevy, export CSV / JSON, suppression des données. |
| `_auth.login.tsx` | `/_auth/login` | — | Connexion | E-mail et mot de passe. |
| `_auth.register.tsx` | `/_auth/register` | — | Inscription | Nom, e-mail et mot de passe. |
| `_auth.forgot-password.tsx` | `/_auth/forgot-password` | — | Mot de passe oublié | Recevoir un lien de réinitialisation. |
| `_auth.reset-password.tsx` | `/_auth/reset-password` | — | Nouveau mot de passe | Choisir un nouveau mot de passe. |

Les routes d'auth n'ont pas de `staticData`. Les layouts (`routines`, `exercises`, `history`, `settings`) :

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/routines")({
  staticData: { crumb: "Routines" },
  component: Outlet,
});
```

La redirection des paramètres :

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings/")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/account" });
  },
});
```

Supprimer `routes/index.tsx`.

- [ ] **Step 7: Vérifier**

Run: `pnpm --filter @better-lift/web build && pnpm --filter @better-lift/web typecheck`
Expected: succès. Visiter `/`, `/routines/12/edit`, `/settings` (→ `/settings/account`), `/login`, `/nimporte` (404) ; capture de chacune.

- [ ] **Step 8: Commit**

```bash
git add -A apps/web
git commit -m "feat(web): toutes les routes du wireframe en pages-titres"
```

---

### Task 3: Coquille — sidebar, header, fil d'Ariane, thème, compte

**Files:**
- Install (shadcn): `sidebar breadcrumb dropdown-menu avatar tooltip separator kbd`
- Create: `src/mocks/user.ts`, `src/components/shell/nav.ts`, `app-sidebar.tsx`, `site-header.tsx`, `app-breadcrumb.tsx`, `user-menu.tsx`, `theme-toggle.tsx`, `shell-dialogs.tsx`
- Modify: `src/routes/_app.tsx`, `src/routes/__root.tsx` (`TooltipProvider`)

**Interfaces:**
- Consumes: `staticData.crumb` (tâche 2), `getTheme` / `setTheme` (tâche 1).
- Produces: `useShellDialogs(): { paletteOpen: boolean; setPaletteOpen(o: boolean): void; helpOpen: boolean; setHelpOpen(o: boolean): void }` et `ShellDialogsProvider` ; `NAV_GROUPS: NavGroup[]` avec `type NavItem = { title: string; to: FileRouteTypes["to"]; icon: LucideIcon }`.

- [ ] **Step 1: Installer les composants**

Run: `npx shadcn@latest add sidebar breadcrumb dropdown-menu avatar tooltip separator kbd -c apps/web -y`
Vérifier que `src/hooks/use-mobile.ts` et les fichiers `ui/*` sont présents.

- [ ] **Step 2: `src/mocks/user.ts`**

```ts
export const mockUser = {
  name: "Alexis Gontier",
  email: "alexis@example.com",
  initials: "AG",
};
```

- [ ] **Step 3: `src/components/shell/nav.ts`**

```ts
import {
  CalendarDays,
  Dumbbell,
  History,
  House,
  ListChecks,
  type LucideIcon,
  Scale,
  TrendingUp,
} from "lucide-react";
import type { FileRouteTypes } from "@/routeTree.gen";

export type NavItem = { title: string; to: FileRouteTypes["to"]; icon: LucideIcon };
export type NavGroup = { label: string | null; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ title: "Accueil", to: "/", icon: House }] },
  {
    label: "Entraînement",
    items: [
      { title: "Planning", to: "/planning", icon: CalendarDays },
      { title: "Routines", to: "/routines", icon: ListChecks },
      { title: "Exercices", to: "/exercises", icon: Dumbbell },
      { title: "Historique", to: "/history", icon: History },
    ],
  },
  {
    label: "Analyse",
    items: [
      { title: "Progression", to: "/progress", icon: TrendingUp },
      { title: "Corps", to: "/body", icon: Scale },
    ],
  },
];

/** L'entrée est active sur sa page et ses sous-pages ; l'Accueil, seulement sur « / ». */
export function isActive(to: string, pathname: string): boolean {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}
```

- [ ] **Step 4: `src/components/shell/shell-dialogs.tsx`**

```tsx
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

type ShellDialogs = {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
};

const Ctx = createContext<ShellDialogs | null>(null);

export function ShellDialogsProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const value = useMemo(
    () => ({ paletteOpen, setPaletteOpen, helpOpen, setHelpOpen }),
    [paletteOpen, helpOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShellDialogs(): ShellDialogs {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShellDialogs hors de ShellDialogsProvider");
  return ctx;
}
```

- [ ] **Step 5: `src/components/shell/user-menu.tsx`**

Contenu partagé par le pied de sidebar et l'avatar du header.

```tsx
import { Link, useNavigate } from "@tanstack/react-router";
import { Keyboard, LogOut, Settings } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { mockUser } from "@/mocks/user";
import { useShellDialogs } from "./shell-dialogs";

export function UserMenuItems() {
  const navigate = useNavigate();
  const { setHelpOpen } = useShellDialogs();
  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="font-medium">{mockUser.name}</div>
        <div className="text-muted-foreground text-xs">{mockUser.email}</div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/settings/account">
          <Settings /> Paramètres
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setHelpOpen(true)}>
        <Keyboard /> Raccourcis clavier
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => navigate({ to: "/login" })}>
        <LogOut /> Se déconnecter
      </DropdownMenuItem>
    </>
  );
}
```

- [ ] **Step 6: `src/components/shell/app-sidebar.tsx`**

```tsx
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronsUpDown, Dumbbell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { mockUser } from "@/mocks/user";
import { isActive, NAV_GROUPS } from "./nav";
import { UserMenuItems } from "./user-menu";

export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Dumbbell className="size-4 -rotate-45" />
                </div>
                <span className="font-semibold">better-lift</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label ?? "root"}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive(item.to, pathname)}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md">{mockUser.initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{mockUser.name}</span>
                    <span className="truncate text-muted-foreground text-xs">{mockUser.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <UserMenuItems />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
```

- [ ] **Step 7: `src/components/shell/app-breadcrumb.tsx`**

```tsx
import { Link, useMatches } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppBreadcrumb() {
  const crumbs = useMatches()
    .filter((m) => m.staticData.crumb)
    .map((m) => ({ id: m.id, label: m.staticData.crumb as string, pathname: m.pathname }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => (
          <Fragment key={c.id}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={c.pathname}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

- [ ] **Step 8: `src/components/shell/theme-toggle.tsx`**

```tsx
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getTheme, setTheme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setLocal] = useState(getTheme);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Changer de thème"
          onClick={() => {
            setTheme(next);
            setLocal(next);
          }}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Thème clair" : "Thème sombre"}</TooltipContent>
    </Tooltip>
  );
}
```

- [ ] **Step 9: `src/components/shell/site-header.tsx`**

```tsx
import { Keyboard, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockUser } from "@/mocks/user";
import { AppBreadcrumb } from "./app-breadcrumb";
import { useShellDialogs } from "./shell-dialogs";
import { ThemeToggle } from "./theme-toggle";
import { UserMenuItems } from "./user-menu";

export function SiteHeader() {
  const { setPaletteOpen, setHelpOpen } = useShellDialogs();
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <AppBreadcrumb />
      </div>
      <Button
        variant="outline"
        className="w-full max-w-sm justify-between text-muted-foreground"
        onClick={() => setPaletteOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search /> Rechercher…
        </span>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <div className="flex flex-1 items-center justify-end gap-1">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Raccourcis clavier" onClick={() => setHelpOpen(true)}>
              <Keyboard />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Raccourcis clavier</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Compte">
              <Avatar className="size-8">
                <AvatarFallback>{mockUser.initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <UserMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 10: `src/routes/_app.tsx` — la coquille**

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ShellDialogsProvider } from "@/components/shell/shell-dialogs";
import { SiteHeader } from "@/components/shell/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <ShellDialogsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ShellDialogsProvider>
  );
}
```

Dans `__root.tsx`, envelopper l'`Outlet` d'un `TooltipProvider` (`delayDuration={0}`).

- [ ] **Step 11: Vérifier**

Run: `pnpm --filter @better-lift/web build && pnpm --filter @better-lift/web typecheck`
Expected: succès. Captures : `/` sidebar dépliée, sidebar repliée (Ctrl B — natif du composant `sidebar`), `/routines/3` (fil « Routines › Détail »), thème sombre, menu du compte ouvert.

- [ ] **Step 12: Commit**

```bash
git add -A apps/web pnpm-lock.yaml
git commit -m "feat(web): coquille du wireframe, sidebar repliable et header"
```

---

### Task 4: Palette de commandes et raccourcis clavier

**Files:**
- Install (shadcn): `command dialog`
- Create: `src/components/shell/shortcuts.ts`, `shortcuts.test.ts`, `shortcut-listener.tsx`, `command-palette.tsx`, `shortcuts-dialog.tsx`
- Modify: `src/routes/_app.tsx` (monter les trois composants)

**Interfaces:**
- Consumes: `useShellDialogs` (tâche 3), `NAV_GROUPS` (tâche 3).
- Produces: `resolveShortcut(pending: Pending, key: string): ShortcutResult`, `GO_TO`, `SHORTCUT_LIST`.

- [ ] **Step 1: Écrire les tests — `shortcuts.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { resolveShortcut } from "./shortcuts";

describe("resolveShortcut", () => {
  it("arme la séquence sur g", () => {
    expect(resolveShortcut(null, "g")).toEqual({ action: null, pending: "g" });
  });

  it("navigue sur g puis une lettre connue", () => {
    expect(resolveShortcut("g", "r")).toEqual({
      action: { type: "navigate", to: "/routines" },
      pending: null,
    });
    expect(resolveShortcut("g", "g")).toEqual({
      action: { type: "navigate", to: "/progress" },
      pending: null,
    });
  });

  it("abandonne la séquence sur une lettre inconnue", () => {
    expect(resolveShortcut("g", "z")).toEqual({ action: null, pending: null });
  });

  it("ouvre l'aide sur ?", () => {
    expect(resolveShortcut(null, "?")).toEqual({ action: { type: "help" }, pending: null });
  });

  it("demande une nouvelle routine sur n", () => {
    expect(resolveShortcut(null, "n")).toEqual({ action: { type: "new-routine" }, pending: null });
  });

  it("ignore la casse", () => {
    expect(resolveShortcut("g", "R")).toEqual({
      action: { type: "navigate", to: "/routines" },
      pending: null,
    });
  });

  it("ne fait rien sur une touche libre", () => {
    expect(resolveShortcut(null, "x")).toEqual({ action: null, pending: null });
  });
});
```

- [ ] **Step 2: Lancer les tests, ils échouent**

Run: `pnpm --filter @better-lift/web test`
Expected: FAIL, `./shortcuts` introuvable.

- [ ] **Step 3: `shortcuts.ts`**

```ts
import type { FileRouteTypes } from "@/routeTree.gen";

type To = FileRouteTypes["to"];

export type ShortcutAction =
  | { type: "navigate"; to: To }
  | { type: "help" }
  | { type: "new-routine" };

export type Pending = "g" | null;
export type ShortcutResult = { action: ShortcutAction | null; pending: Pending };

/** `G` puis une lettre : la lettre mène à la page. */
export const GO_TO: Record<string, To> = {
  a: "/",
  p: "/planning",
  r: "/routines",
  e: "/exercises",
  h: "/history",
  g: "/progress",
  c: "/body",
  s: "/settings/account",
};

export function resolveShortcut(pending: Pending, rawKey: string): ShortcutResult {
  const key = rawKey === "?" ? "?" : rawKey.toLowerCase();
  if (pending === "g") {
    const to = GO_TO[key];
    return { action: to ? { type: "navigate", to } : null, pending: null };
  }
  if (key === "g") return { action: null, pending: "g" };
  if (key === "?") return { action: { type: "help" }, pending: null };
  if (key === "n") return { action: { type: "new-routine" }, pending: null };
  return { action: null, pending: null };
}

/** Ce que liste la fenêtre des raccourcis. */
export const SHORTCUT_LIST: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "Ouvrir la recherche" },
  { keys: ["Ctrl", "B"], label: "Replier la barre latérale" },
  { keys: ["G", "A"], label: "Aller à l'Accueil" },
  { keys: ["G", "P"], label: "Aller au Planning" },
  { keys: ["G", "R"], label: "Aller aux Routines" },
  { keys: ["G", "E"], label: "Aller aux Exercices" },
  { keys: ["G", "H"], label: "Aller à l'Historique" },
  { keys: ["G", "G"], label: "Aller à la Progression" },
  { keys: ["G", "C"], label: "Aller à Corps" },
  { keys: ["G", "S"], label: "Aller aux Paramètres" },
  { keys: ["N"], label: "Nouvelle routine (sur Routines)" },
  { keys: ["?"], label: "Afficher les raccourcis" },
];
```

- [ ] **Step 4: Lancer les tests, ils passent**

Run: `pnpm --filter @better-lift/web test`
Expected: PASS, 7 tests.

- [ ] **Step 5: Installer `command` et `dialog`**

Run: `npx shadcn@latest add command dialog -c apps/web -y`

- [ ] **Step 6: `shortcut-listener.tsx`**

```tsx
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { type Pending, resolveShortcut } from "./shortcuts";
import { useShellDialogs } from "./shell-dialogs";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Écoute le clavier pour toute la coquille ; Ctrl B est géré par le composant sidebar. */
export function ShortcutListener() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setPaletteOpen, setHelpOpen } = useShellDialogs();
  const pending = useRef<Pending>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;

      const { action, pending: next } = resolveShortcut(pending.current, e.key);
      pending.current = next;
      window.clearTimeout(timer.current);
      if (next) timer.current = window.setTimeout(() => (pending.current = null), 1000);

      if (!action) return;
      e.preventDefault();
      if (action.type === "navigate") navigate({ to: action.to });
      if (action.type === "help") setHelpOpen(true);
      if (action.type === "new-routine" && pathname.startsWith("/routines")) {
        navigate({ to: "/routines/new" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, pathname, setPaletteOpen, setHelpOpen]);

  return null;
}
```

- [ ] **Step 7: `command-palette.tsx`**

```tsx
import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, FileUp, Plus, Scale } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { FileRouteTypes } from "@/routeTree.gen";
import { NAV_GROUPS } from "./nav";
import { useShellDialogs } from "./shell-dialogs";

const ACTIONS: { label: string; to: FileRouteTypes["to"]; icon: typeof Plus }[] = [
  { label: "Nouvelle routine", to: "/routines/new", icon: Plus },
  { label: "Planifier une routine", to: "/planning", icon: CalendarPlus },
  { label: "Noter mon poids", to: "/body", icon: Scale },
  { label: "Importer depuis Hevy", to: "/settings/data", icon: FileUp },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { paletteOpen, setPaletteOpen } = useShellDialogs();

  function go(to: FileRouteTypes["to"]) {
    setPaletteOpen(false);
    navigate({ to });
  }

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      title="Recherche"
      description="Aller à une page ou lancer une action"
    >
      <CommandInput placeholder="Rechercher une page, une action…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Aller à">
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
            <CommandItem key={item.to} onSelect={() => go(item.to)}>
              <item.icon /> {item.title}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => go("/settings/account")}>Paramètres</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {ACTIONS.map((a) => (
            <CommandItem key={a.label} onSelect={() => go(a.to)}>
              <a.icon /> {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

(Si la version installée de `CommandDialog` n'accepte pas `title` / `description`, les retirer et vérifier qu'aucun avertissement d'accessibilité Radix n'apparaît dans la console.)

- [ ] **Step 8: `shortcuts-dialog.tsx`**

```tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SHORTCUT_LIST } from "./shortcuts";
import { useShellDialogs } from "./shell-dialogs";

export function ShortcutsDialog() {
  const { helpOpen, setHelpOpen } = useShellDialogs();
  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>Ils ne s'appliquent pas pendant la saisie dans un champ.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {SHORTCUT_LIST.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-2 text-sm">
              <span>{s.label}</span>
              <KbdGroup>
                {s.keys.map((k, i) => (
                  // « G G » répète la même touche : l'index rend la clé unique.
                  <Kbd key={`${s.label}-${i}`}>{k}</Kbd>
                ))}
              </KbdGroup>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 9: Monter les trois composants dans `_app.tsx`**

Après `</SidebarInset>`, dans le `SidebarProvider` :

```tsx
        <CommandPalette />
        <ShortcutsDialog />
        <ShortcutListener />
```

- [ ] **Step 10: Vérifier**

Run: `pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm --filter @better-lift/web typecheck`
Expected: succès. Dans le navigateur : Ctrl K ouvre la palette, « rout » filtre, Entrée navigue ; `G` `H` mène à l'Historique ; `?` ouvre la fenêtre des raccourcis ; `N` sur `/routines` ouvre `/routines/new`. Captures de la palette et de la fenêtre.

- [ ] **Step 11: Commit**

```bash
git add -A apps/web pnpm-lock.yaml
git commit -m "feat(web): palette de commandes et raccourcis clavier"
```

---

### Task 5: Barre de prototypage (`?v=` et `?etat=`)

**Files:**
- Install (shadcn): `toggle-group select`
- Create: `src/components/proto/proto-search.ts`, `proto-search.test.ts`, `use-proto.ts`, `proto-bar.tsx`
- Modify: `src/routes/__root.tsx` (`validateSearch`, montage de `ProtoBar`), `src/components/page-placeholder.tsx` (affiche variante et état)

**Interfaces:**
- Produces: `parseProtoSearch(search: Record<string, unknown>): ProtoSearch`, `VARIANTS`, `PROTO_STATES`, `type Variant`, `type ProtoState`, `useProto(): { variant: Variant; state: ProtoState }` — consommés par toutes les pages des passes suivantes.

- [ ] **Step 1: Écrire les tests — `proto-search.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { parseProtoSearch } from "./proto-search";

describe("parseProtoSearch", () => {
  it("garde une variante et un état valides", () => {
    expect(parseProtoSearch({ v: "b", etat: "vide" })).toEqual({ v: "b", etat: "vide" });
  });

  it("omet les valeurs inconnues", () => {
    expect(parseProtoSearch({ v: "z", etat: "cassé" })).toEqual({});
  });

  it("omet les paramètres absents", () => {
    expect(parseProtoSearch({})).toEqual({});
  });

  it("ignore les autres paramètres", () => {
    expect(parseProtoSearch({ v: "c", q: "squat" })).toEqual({ v: "c" });
  });
});
```

- [ ] **Step 2: Lancer les tests, ils échouent**

Run: `pnpm --filter @better-lift/web test`
Expected: FAIL, `./proto-search` introuvable.

- [ ] **Step 3: `proto-search.ts`**

```ts
export const VARIANTS = ["a", "b", "c"] as const;
export const PROTO_STATES = ["nominal", "vide", "chargement", "erreur"] as const;

export type Variant = (typeof VARIANTS)[number];
export type ProtoState = (typeof PROTO_STATES)[number];
export type ProtoSearch = { v?: Variant; etat?: ProtoState };

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/** Ne garde que des valeurs connues : une adresse fausse retombe sur les défauts. */
export function parseProtoSearch(search: Record<string, unknown>): ProtoSearch {
  const out: ProtoSearch = {};
  if (isOneOf(VARIANTS, search.v)) out.v = search.v;
  if (isOneOf(PROTO_STATES, search.etat)) out.etat = search.etat;
  return out;
}
```

- [ ] **Step 4: Lancer les tests, ils passent**

Run: `pnpm --filter @better-lift/web test`
Expected: PASS (11 tests au total).

- [ ] **Step 5: `validateSearch` à la racine — `__root.tsx`**

```tsx
export const Route = createRootRoute({
  validateSearch: parseProtoSearch,
  component: Root,
});

function Root() {
  return (
    <TooltipProvider delayDuration={0}>
      <Outlet />
      <ProtoBar />
    </TooltipProvider>
  );
}
```

- [ ] **Step 6: `use-proto.ts`**

```ts
import { useSearch } from "@tanstack/react-router";
import type { ProtoState, Variant } from "./proto-search";

export function useProto(): { variant: Variant; state: ProtoState } {
  const search = useSearch({ strict: false });
  return { variant: search.v ?? "a", state: search.etat ?? "nominal" };
}
```

- [ ] **Step 7: Installer `toggle-group` et `select`**

Run: `npx shadcn@latest add toggle-group select -c apps/web -y`

- [ ] **Step 8: `proto-bar.tsx`**

```tsx
import { useNavigate } from "@tanstack/react-router";
import { FlaskConical, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROTO_STATES, type ProtoState, VARIANTS, type Variant } from "./proto-search";
import { useProto } from "./use-proto";

const STATE_LABELS: Record<ProtoState, string> = {
  nominal: "Nominal",
  vide: "Vide",
  chargement: "Chargement",
  erreur: "Erreur",
};

/** Outil de prototypage, retiré au branchement de l'API (D223). */
export function ProtoBar() {
  const navigate = useNavigate();
  const { variant, state } = useProto();
  const [open, setOpen] = useState(true);

  function set(patch: { v?: Variant; etat?: ProtoState }) {
    navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
  }

  if (!open) {
    return (
      <Button
        size="icon"
        variant="outline"
        className="fixed right-4 bottom-4 z-50 rounded-full shadow-md"
        aria-label="Ouvrir la barre de prototypage"
        onClick={() => setOpen(true)}
      >
        <FlaskConical />
      </Button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-md">
      <span className="px-1 font-medium text-muted-foreground text-xs">Proto</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={variant}
        onValueChange={(v) => v && set({ v: v as Variant })}
      >
        {VARIANTS.map((v) => (
          <ToggleGroupItem key={v} value={v} aria-label={`Variante ${v.toUpperCase()}`}>
            {v.toUpperCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={state} onValueChange={(etat) => set({ etat: etat as ProtoState })}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROTO_STATES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATE_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Replier" onClick={() => setOpen(false)}>
        <X />
      </Button>
    </div>
  );
}
```

- [ ] **Step 9: Afficher variante et état dans `PagePlaceholder`**

Remplacer le texte « Zone à dessiner » par :

```tsx
Zone à dessiner — variante {variant.toUpperCase()}, état « {state} »
```

avec `const { variant, state } = useProto();` en tête du composant.

- [ ] **Step 10: Vérifier**

Run: `pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm --filter @better-lift/web typecheck`
Expected: succès. `/planning?v=b&etat=vide` affiche « variante B, état « vide » » ; changer la variante dans la barre met à jour l'URL sans ajouter d'entrée d'historique ; `?v=z` retombe sur A. Captures.

- [ ] **Step 11: Commit**

```bash
git add -A apps/web pnpm-lock.yaml
git commit -m "feat(web): barre de prototypage, variantes et états par l'URL (D223)"
```

---

### Task 6: Vérification complète de la passe

**Files:** aucun nouveau ; corrections éventuelles de `knip.json` (entrée `apps/web`) si Knip signale du code shadcn inutilisé hors `components/ui`.

- [ ] **Step 1: Lancer `/verif`** (build, typecheck, test, lint, knip à la racine)

Expected: tout passe. Knip ne doit signaler aucune dépendance inutilisée dans `apps/web` ; si `cmdk`, `radix-ui` ou `lucide-react` sont signalés, c'est qu'un composant n'est pas monté : corriger le montage, pas la configuration.

- [ ] **Step 2: Parcours complet au navigateur, captures**

Sidebar dépliée puis repliée (tooltips au survol), chaque entrée de navigation, fil d'Ariane sur une page de détail, thème sombre, palette, raccourcis, barre de prototypage, une page d'auth, la 404.

- [ ] **Step 3: Commit des corrections éventuelles**

```bash
git add -A apps/web knip.json
git commit -m "chore(web): passe 1 du wireframe vérifiée"
```

- [ ] **Step 4: Point d'étape avec l'utilisateur**

Présenter les captures. La passe 2 (squelette des pages : zones, liste | détail redimensionnable, navigation secondaire des Paramètres) a son propre plan, écrit après validation.
