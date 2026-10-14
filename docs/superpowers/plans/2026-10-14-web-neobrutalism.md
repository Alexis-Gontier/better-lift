# Web Neobrutalism — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** passer le web au Neobrutalism (palette Orange, light seulement, Space Grotesk), séparer
l'auth en deux pages minimales et vider l'Accueil.

**Architecture:** les tokens de neobrutalism.dev remplacent ceux du projet dans `tokens.css` et
`globals.css` ; les primitives shadcn existantes (Radix) reçoivent la grammaire bordure + ombre
dure ; les pages gardées passent des anciens tokens aux rôles shadcn par une table de
correspondance. L'auth se scinde en `/connexion` et `/inscription` autour d'un formulaire commun
paramétré. `features/tableau/` disparaît.

**Tech Stack:** Vite + React 19, Tailwind 4, shadcn/ui (Radix), TanStack Router, Better Auth,
Vitest, `@fontsource/space-grotesk`.

**Spec:** `docs/superpowers/specs/2026-10-14-web-neobrutalism-design.md`

## Global Constraints

- L'application est en français ; commits en Conventional Commits, en français.
- Light seulement : aucune occurrence de `dark:`, `data-theme`, `--canvas`, `--surface-`,
  `--ink`, `--accent`, `--cal-`, `--float-` ne doit rester dans `apps/web/src` ni
  `apps/web/index.html`.
- Palette : fond `hsl(33 100% 92%)`, fond secondaire `#ffffff`, principal `#FF7A05`, texte sur
  principal `#000000`, encre / bordure / anneau `#000000`, ombre `4px 4px 0 0 var(--border)`,
  rayon `5px`, graisses 500 / 700.
- Le danger reste rouge et ne porte ni l'action ni le record ; le record = contour orange + texte
  `--main-ink` (≥ 4,5:1 sur le fond).
- Space Grotesk remplace Archivo ; `@fontsource-variable/archivo` est retiré.
- Auth : deux routes, ni logo, ni carte, ni sous-titre, ni pied de page, ni œil ; trois refus
  distincts ; `?redirect=` et `?etat=` gardés ; `minLength=8`.
- Ne pas toucher à l'API, à `shared`, au mobile.

---

### Task 1: Thème Neobrutalism, light seulement, Space Grotesk

**Files:**
- Modify: `apps/web/src/styles/tokens.css` (réécrit)
- Modify: `apps/web/src/styles/globals.css` (réécrit)
- Modify: `apps/web/index.html` (script de thème retiré)
- Modify: `apps/web/src/main.tsx:1-3` (import de police)
- Modify: `apps/web/package.json` (dépendances)
- Delete: `apps/web/src/lib/theme.ts`
- Modify: `apps/web/src/routes/_protege.profil.tsx` (section Thème retirée)
- Modify: tous les fichiers de `apps/web/src` qui citent un ancien token (table ci-dessous)

**Interfaces:**
- Produces : les classes Tailwind `bg-background`, `bg-secondary-background`, `bg-main`,
  `text-main-foreground`, `text-main-ink`, `border-main`, `bg-muted`, `text-muted-foreground`,
  `text-foreground`, `border-border`, `shadow-shadow`, `rounded-base`, `bg-overlay`,
  `translate-x-boxShadowX`, `translate-y-boxShadowY`, `text-destructive-ink`, `bg-image-bg`,
  `text-superset`, `border-superset`, et les rôles shadcn habituels (`primary`, `card`,
  `popover`, `accent`, `input`, `ring`, `sidebar-*`).

- [ ] **Step 1 : dépendances**

```bash
pnpm --filter @better-lift/web add @fontsource/space-grotesk
pnpm --filter @better-lift/web remove @fontsource-variable/archivo
```

- [ ] **Step 2 : `main.tsx`** — remplacer les trois premières lignes par :

```ts
// Space Grotesk (D195) : 500 pour le texte, 700 pour les titres et les chiffres.
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./styles/globals.css";
```

- [ ] **Step 3 : `tokens.css`** — une seule valeur par token (D194) :

```css
/* Neobrutalism, palette Orange de neobrutalism.dev (D193), light seulement (D194). */
:root {
  --background: hsl(33 100% 92%);
  --secondary-background: #ffffff;
  --foreground: #000000;
  --main: #ff7a05;
  --main-foreground: #000000;
  /* L'orange en TEXTE (le record) : #ff7a05 ne fait que ~2:1 sur le crème. */
  --main-ink: #a33f00;
  --muted: #f6dcc2;
  --muted-foreground: #4d4036;
  --border: #000000;
  --ring: #000000;
  --overlay: rgb(0 0 0 / 0.6);
  --shadow: 4px 4px 0 0 var(--border);
  --radius-base: 5px;

  /* Danger (D36) : borné au danger, ni l'action ni le record. */
  --destructive: #e5484d;
  --destructive-foreground: #000000;
  --destructive-ink: #b42318;

  /* Repère de superset (D151). */
  --superset: #5a4bbf;
  /* Les images du catalogue sont détourées sur blanc. */
  --image-bg: #ffffff;
}
```

Vérifier au calculateur de contraste : `--main-ink` et `--muted-foreground` ≥ 4,5:1 sur
`--background` et sur `--muted` ; `--destructive-ink` ≥ 4,5:1 sur `--background`. Foncer la
valeur si un ratio échoue.

- [ ] **Step 4 : `globals.css`** — réécrire :

```css
@import "tailwindcss";
@import "./tokens.css";

@layer base {
  *,
  ::before,
  ::after {
    border-color: var(--border);
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
  }
}

@theme inline {
  --font-sans: "Space Grotesk", system-ui, sans-serif;

  --color-background: var(--background);
  --color-secondary-background: var(--secondary-background);
  --color-foreground: var(--foreground);
  --color-main: var(--main);
  --color-main-foreground: var(--main-foreground);
  --color-main-ink: var(--main-ink);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-overlay: var(--overlay);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-ink: var(--destructive-ink);
  --color-superset: var(--superset);
  --color-image-bg: var(--image-bg);

  /* Le vocabulaire des primitives shadcn : un rôle absent n'émet AUCUNE règle. */
  --color-primary: var(--main);
  --color-primary-foreground: var(--main-foreground);
  --color-secondary: var(--secondary-background);
  --color-secondary-foreground: var(--foreground);
  /* `accent` = surface de survol chez shadcn, pas la marque. */
  --color-accent: var(--muted);
  --color-accent-foreground: var(--foreground);
  --color-card: var(--secondary-background);
  --color-card-foreground: var(--foreground);
  --color-popover: var(--secondary-background);
  --color-popover-foreground: var(--foreground);
  --color-input: var(--border);
  --color-sidebar: var(--background);
  --color-sidebar-foreground: var(--foreground);
  --color-sidebar-primary: var(--main);
  --color-sidebar-primary-foreground: var(--main-foreground);
  --color-sidebar-accent: var(--main);
  --color-sidebar-accent-foreground: var(--main-foreground);
  --color-sidebar-border: var(--border);
  --color-sidebar-ring: var(--ring);

  --radius-base: var(--radius-base);
  --shadow-shadow: var(--shadow);
  --spacing-boxShadowX: 4px;
  --spacing-boxShadowY: 4px;
  --spacing-reverseBoxShadowX: -4px;
  --spacing-reverseBoxShadowY: -4px;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

/* Le chiffre héros (D195) : gras, serré, plus condensé. */
@utility chiffre {
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    /* biome-ignore lint/complexity/noImportantStyles: la réduction de mouvement doit primer sur toute animation déclarée ailleurs. */
    animation-duration: 0.01ms !important;
    /* biome-ignore lint/complexity/noImportantStyles: même raison, pour les transitions. */
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5 : `index.html`** — supprimer le bloc `<script>` de thème dans `<head>`.

- [ ] **Step 6 : Profil** — dans `_protege.profil.tsx`, retirer l'import de `@/lib/theme`, la
  constante `THEMES`, l'état `theme`, `choisirTheme` et la section qui les affiche, ainsi que les
  icônes devenues inutiles. Supprimer `src/lib/theme.ts`.

- [ ] **Step 7 : passer les pages aux nouveaux rôles** — appliquer cette table dans tout
  `apps/web/src` (hors `features/tableau/`, supprimé à la tâche 4) :

| Ancien | Nouveau |
|---|---|
| `text-(--ink)`, `text-(--ink-muted)`, `var(--ink)`, `var(--ink-muted)` | `text-foreground`, `var(--foreground)` |
| `text-(--ink-subtle)`, `text-(--ink-faint)` | `text-muted-foreground` |
| `border-(--line)`, `border-(--line-strong)`, `border-(--ink)`, `border-(--float-line)`, `var(--line-strong)` | `border-border`, `var(--border)` |
| `bg-(--line)` | `bg-border` |
| `bg-(--canvas)` | `bg-background` |
| `bg-(--surface-1)`, `bg-(--float-bg)` | `bg-secondary-background` |
| `bg-(--surface-2)`, `bg-(--surface-3)`, `var(--surface-3)` | `bg-muted`, `var(--muted)` |
| `bg-(--ink-muted)` | `bg-foreground` |
| `bg-(--scrim)` | `bg-overlay` |
| `shadow-(--float-shadow)` | `shadow-shadow` |
| `ring-(--focus-ring)`, `outline-(--focus-ring)`, `outline-(--ink)` | `ring-ring`, `outline-ring` |
| `text-(--danger-ink)` | `text-destructive-ink` |
| `text-accent-ink` | `text-main-ink` |
| `border-accent-line` | `border-main` |
| `bg-accent-wash` | `bg-main/15` |
| `var(--accent)` | `var(--main)` |

Puis supprimer toute classe `dark:…` restante dans `src/components/ui/`.

- [ ] **Step 8 : vérifier**

```bash
grep -rnE "dark:|data-theme|--canvas|--surface-|--ink|--accent|--float-|--line|--focus-ring|--scrim|--danger|accent-ink|accent-line|accent-wash" apps/web/src apps/web/index.html | grep -v features/tableau
pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web build
```

Attendu : aucune ligne, puis build vert.

- [ ] **Step 9 : commit** — `feat(web): thème Neobrutalism, light seulement, Space Grotesk (D193–D195)`

### Task 2: Primitives réhabillées

**Files:** `apps/web/src/components/ui/{button,input,badge,card,checkbox,select,dropdown-menu,dialog,sheet,tabs,toggle,toggle-group,table,tooltip,command,skeleton,sidebar}.tsx`

**Interfaces:**
- Consumes : les classes de la tâche 1.
- Produces : les mêmes composants, mêmes props et mêmes noms de variantes.

- [ ] **Step 1 : `button.tsx`** — base et variantes :

```ts
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-base text-sm font-bold whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-2 border-border bg-main text-main-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        destructive:
          "border-2 border-border bg-destructive text-destructive-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        outline:
          "border-2 border-border bg-secondary-background text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        secondary:
          "border-2 border-border bg-secondary-background text-foreground hover:bg-muted",
        ghost: "hover:bg-muted",
        link: "text-foreground underline decoration-2 underline-offset-4",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
```

- [ ] **Step 2 : `input.tsx`** — classe :

```ts
"h-10 w-full min-w-0 rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-sm font-medium transition-shadow outline-none selection:bg-main selection:text-main-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
"focus-visible:shadow-shadow",
"aria-invalid:border-destructive",
```

- [ ] **Step 3 : surfaces** — `card` : `rounded-base border-2 border-border bg-card shadow-shadow` ;
  `badge` : `rounded-base border-2 border-border`, `default` = `bg-main text-main-foreground`,
  `outline` = `bg-secondary-background` ; `checkbox` : `border-2 border-border rounded-[4px]`,
  coché `bg-main text-main-foreground` ; contenus de `select`, `dropdown-menu`, `command`,
  `tooltip` : `rounded-base border-2 border-border bg-secondary-background shadow-shadow`,
  items survolés `bg-main text-main-foreground` ; `dialog` et `sheet` : `border-2 border-border
  shadow-shadow`, voile `bg-overlay` ; `tabs` : liste `border-2 border-border bg-muted`, onglet
  actif `bg-main text-main-foreground` ; `toggle`/`toggle-group` : actif `bg-main
  text-main-foreground` ; `table` : en-tête `bg-main/20 font-bold`, filets `border-border` ;
  `skeleton` : `bg-muted` ; `sidebar` : élément actif `bg-main text-main-foreground border-2
  border-border`. Retirer les `rounded-md/lg/xl/full` au profit de `rounded-base` sur ces surfaces.

- [ ] **Step 4 : vérifier** — `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web build`.

- [ ] **Step 5 : commit** — `feat(web): primitives shadcn à la grammaire Neobrutalism (D193)`

### Task 3: L'auth en deux pages minimales

**Files:**
- Create: `apps/web/src/features/auth/refus.ts`, `apps/web/src/features/auth/refus.test.ts`
- Modify: `apps/web/src/features/auth/formulaire-connexion.tsx` → renommé `formulaire-auth.tsx`
- Modify: `apps/web/src/routes/connexion.tsx`
- Create: `apps/web/src/routes/inscription.tsx`
- Delete (si plus utilisé) : `apps/web/src/components/logo.tsx`

**Interfaces:**
- Produces : `type GenreRefus = "identifiants" | "listeBlanche" | "reseau"`,
  `refusDe(status: number): GenreRefus`, `MESSAGES_REFUS: Record<GenreRefus, string>`,
  `<FormulaireAuth mode="connexion" | "inscription" redirect?: string onSucces: () => void />`.

- [ ] **Step 1 : test** — `refus.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { MESSAGES_REFUS, refusDe } from "./refus";

describe("refusDe", () => {
  it("lit 403 comme une adresse hors liste blanche", () => {
    expect(refusDe(403)).toBe("listeBlanche");
  });
  it("lit tout autre refus comme des identifiants faux", () => {
    expect(refusDe(401)).toBe("identifiants");
    expect(refusDe(422)).toBe("identifiants");
  });
  it("a un message pour chaque refus", () => {
    expect(Object.keys(MESSAGES_REFUS).sort()).toEqual(["identifiants", "listeBlanche", "reseau"]);
  });
});
```

- [ ] **Step 2 : le voir échouer** — `pnpm --filter @better-lift/web test -- refus` → FAIL (module absent).

- [ ] **Step 3 : `refus.ts`**

```ts
// Trois refus, trois gestes différents : ne pas laisser retaper dix fois un mot de
// passe correct pour une adresse qui ne sera jamais acceptée.
export type GenreRefus = "identifiants" | "listeBlanche" | "reseau";

export const MESSAGES_REFUS: Record<GenreRefus, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  listeBlanche: "Cette adresse n'est pas autorisée à créer un compte.",
  reseau: "L'API est injoignable. Réessaie dans un instant.",
};

/** 403 est le code du garde de liste blanche ; tout autre refus vise les identifiants. */
export function refusDe(status: number): GenreRefus {
  return status === 403 ? "listeBlanche" : "identifiants";
}
```

- [ ] **Step 4 : le voir passer** — même commande → PASS.

- [ ] **Step 5 : `formulaire-auth.tsx`** (remplace `formulaire-connexion.tsx`)

```tsx
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { type GenreRefus, MESSAGES_REFUS, refusDe } from "./refus";

const TEXTES = {
  connexion: {
    titre: "Connexion",
    action: "Se connecter",
    question: "Pas de compte ?",
    lien: "Créer un compte",
    vers: "/inscription",
  },
  inscription: {
    titre: "Créer un compte",
    action: "Créer le compte",
    question: "Déjà un compte ?",
    lien: "Se connecter",
    vers: "/connexion",
  },
} as const;

type Props = {
  mode: keyof typeof TEXTES;
  redirect?: string;
  onSucces: () => void;
};

export function FormulaireAuth({ mode, redirect, onSucces }: Props) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [refus, setRefus] = useState<GenreRefus | null>(null);
  const t = TEXTES[mode];

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setRefus(null);
    try {
      const { error } =
        mode === "connexion"
          ? await authClient.signIn.email({ email, password: motDePasse })
          : await authClient.signUp.email({ email, password: motDePasse, name: email });
      if (error) setRefus(refusDe(error.status));
      else onSucces();
    } catch {
      setRefus("reseau");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="flex w-full flex-col gap-4">
      <h1 className="mb-2 text-3xl">{t.titre}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        E-mail
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={refus !== null}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Mot de passe
        <Input
          type="password"
          autoComplete={mode === "connexion" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          aria-invalid={refus !== null}
        />
      </label>
      {refus ? (
        <p role="alert" className="text-sm text-destructive-ink">
          {MESSAGES_REFUS[refus]}
        </p>
      ) : null}
      <Button type="submit" disabled={enCours} className="mt-1">
        {enCours ? "…" : t.action}
      </Button>
      <p className="text-sm">
        {t.question}{" "}
        <Link to={t.vers} search={{ redirect }} className="font-bold underline decoration-2 underline-offset-4">
          {t.lien}
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 6 : routes** — `connexion.tsx` (et `inscription.tsx`, identique avec
  `createFileRoute("/inscription")`, `PageInscription`, `mode="inscription"`) :

```tsx
import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { FormulaireAuth } from "@/features/auth/formulaire-auth";
import { chargerSession } from "@/lib/auth-session";

const recherche = z.object({ redirect: z.string().optional(), etat: champEtat });

export const Route = createFileRoute("/connexion")({
  validateSearch: recherche,
  // Une session déjà ouverte n'a rien à faire ici (D196).
  beforeLoad: ({ context }) => {
    if (context.auth.session) throw redirect({ to: "/" });
  },
  component: PageConnexion,
});

function PageConnexion() {
  const { redirect: retour, etat } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  const force = etatForceRendu(etat, "L'API est injoignable.", () =>
    navigate({ to: "/connexion", search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xs">
        {force ?? (
          <FormulaireAuth
            mode="connexion"
            redirect={retour}
            onSucces={async () => {
              // Relire la session PUIS invalider : sinon `_protege` relirait l'ancien
              // contexte et renverrait aussitôt ici.
              await chargerSession();
              await router.invalidate();
              await navigate({ to: retour ?? "/" });
            }}
          />
        )}
      </div>
    </main>
  );
}
```

  Supprimer `components/logo.tsx` si plus aucun import ne le cite (sinon le garder pour la
  coquille).

- [ ] **Step 7 : vérifier** — `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build`.

- [ ] **Step 8 : commit** — `feat(web): connexion et inscription en deux pages minimales (D196)`

### Task 4: Accueil vide, `features/tableau/` supprimé

**Files:**
- Modify: `apps/web/src/routes/_protege.index.tsx`
- Delete: `apps/web/src/features/tableau/` (tout)
- Modify: `apps/web/src/features/seances/calculs.ts` (+ `dureeTexte`), `calculs.test.ts`
- Modify: `apps/web/src/features/seances/{liste-seances,detail-seance}.tsx` (import)
- Modify: `apps/web/src/features/profil/requetes.ts` (+ `optionsPreferences`)
- Modify: `apps/web/src/routes/_protege.profil.tsx` (import)

**Interfaces:**
- Produces : `dureeTexte(min: number): string` dans `@/features/seances/calculs` ;
  `optionsPreferences()` dans `@/features/profil/requetes`.

- [ ] **Step 1 : test déplacé** — ajouter à `features/seances/calculs.test.ts` :

```ts
describe("dureeTexte", () => {
  it("passe aux heures au-delà de 59 minutes", () => {
    expect(dureeTexte(45)).toBe("45 min");
    expect(dureeTexte(125)).toBe("2 h 05");
  });
});
```

  et `dureeTexte` à son import → FAIL attendu (`pnpm --filter @better-lift/web test -- seances`).

- [ ] **Step 2 : déplacer** — copier dans `features/seances/calculs.ts` :

```ts
export function dureeTexte(min: number): string {
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")}` : `${min} min`;
}
```

  et dans `features/profil/requetes.ts` (avec `api` déjà importé) :

```ts
/** Les préférences du compte (D129). */
export function optionsPreferences() {
  return queryOptions({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await api.preferences.$get();
      if (!res.ok) throw new Error("Les préférences n'ont pas pu être chargées.");
      return res.json();
    },
  });
}
```

  Mettre à jour les imports de `liste-seances.tsx`, `detail-seance.tsx`, `_protege.profil.tsx`.

- [ ] **Step 3 : Accueil vide** — `_protege.index.tsx` :

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { PageTableau } from "@/components/shell/page-tableau";

// L'Accueil (D197) : la coquille, sans contenu, en attendant la suite du chantier.
export const Route = createFileRoute("/_protege/")({
  component: Accueil,
});

function Accueil() {
  return <PageTableau titre="Accueil" />;
}
```

  Adapter aux props réelles de `PageTableau` (lire `components/shell/page-tableau.tsx`) ; si un
  enfant est requis, ne passer aucun contenu.

- [ ] **Step 4 : supprimer** `features/tableau/` ; `pnpm knip` et retirer les dépendances et
  composants signalés (ex. `recharts`/`chart.tsx` uniquement s'ils ne servent plus).

- [ ] **Step 5 : vérifier** — `pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web typecheck && pnpm knip`.

- [ ] **Step 6 : commit** — `feat(web): Accueil vide, tableau de bord retiré (D197)`

### Task 5: Consignes, vérification complète, captures, PR

**Files:** `CLAUDE.md`, `.claude/rules/interface-web.md`

- [ ] **Step 1 : consignes** — `CLAUDE.md` (État, Interface : la couleur du web devient l'orange
  `main` en Neobrutalism, light seulement) et `interface-web.md` (tokens, police, primitives,
  auth, Accueil) disent l'état D193–D197.
- [ ] **Step 2 :** `/verif` vert.
- [ ] **Step 3 : captures** Playwright (compte de contrôle) de `/connexion`, `/inscription`,
  `/connexion?etat=erreur`, un refus affiché, `/`, `/seances`, `/routines`, `/exercices`,
  `/profil` ; corriger ce qui détonne.
- [ ] **Step 4 : commit** `docs(web): consignes Neobrutalism (D193–D197)`, push, PR
  `feat/web-refonte` → `chore/docs-vers-main`.
