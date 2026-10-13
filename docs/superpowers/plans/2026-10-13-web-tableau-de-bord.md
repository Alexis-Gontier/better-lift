# Tableau de bord web d'après les wireframes 2a — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passer le web au thème par défaut de shadcn (Neutral), puis faire évoluer le Tableau de bord vers la disposition 2a : comparaison au même moment, tuiles Séances · Séries de travail · Volume · Objectif, graphique sur douze semaines, muscles comparés à une référence, dernières séances, palette qui ouvre les routines, navigation dans le temps.

**Architecture:** Le thème : `globals.css` porte les variables Neutral de shadcn et le `@theme inline` canonique ; plus aucun token maison, les classes canoniques partout (`text-muted-foreground`, `bg-muted`…). Le calcul vit dans `packages/shared/src/stats.ts` (`calculerPeriode`, pur, testé) ; l'API (`services/stats.ts`) ne fait que lire la bonne fenêtre et passer le résultat. Le web (`apps/web/src/features/tableau/`) affiche, avec les composants shadcn déjà vendorisés. Aucune migration.

**Tech Stack:** TypeScript, Vitest, Hono + Prisma (API), Vite + React 19 + TanStack Router/Query + shadcn/ui + Recharts (web).

**Spec:** [`docs/superpowers/specs/2026-10-13-web-tableau-de-bord-design.md`](../specs/2026-10-13-web-tableau-de-bord-design.md) (D185–D192)

## Global Constraints

- **Un seul lot** : la branche `feat/web-tableau-de-bord` (partie de `main`), un commit par tâche, **une seule PR** à la fin (Task 9).
- Commits en Conventional Commits, en français, sujet en minuscule, ≤ 100 caractères.
- Dates découpées dans le fuseau, jamais en UTC ; l'arithmétique civile reste dans `shared`.
- Toute charge affichée passe par `formaterCharge(kg, SYSTEME_UNITES)`.
- **Style par défaut de shadcn** (D192) : variables du thème Neutral, classes canoniques (`text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-card`, `border-border`, `bg-primary`, `text-destructive`…). Aucun token maison (`--ink`, `--surface-*`, `--line`, `--accent-*`, `--cal-*`…), aucune couleur en dur — seule exception : `bg-white` derrière les GIF détourés sur blanc. Pas de retouche de style sur les primitives de `components/ui/`.
- Toute donnée de la clé de lecture est dans la clé d'écriture (piège TanStack de CLAUDE.md).
- Les quatre états de la page restent atteignables par `?etat=chargement|vide|erreur`.
- `packages/shared` n'importe ni React, ni Prisma, ni API de plateforme.
- Fin du lot : `/verif` vert (build, typecheck, test, lint, knip), puis vérification visuelle, en clair et en sombre, sur `http://localhost:3000` avec le compte `controle@better-lift.local`.

---

### Task 0: Le thème par défaut de shadcn (D192)

**Files:**
- Modify: `apps/web/src/styles/globals.css` (réécrit)
- Delete: `apps/web/src/styles/tokens.css`
- Modify: `apps/web/src/main.tsx` (retirer `import "@fontsource-variable/archivo/wdth.css"`)
- Modify: `apps/web/package.json` (`pnpm --filter @better-lift/web remove @fontsource-variable/archivo`)
- Modify: `apps/web/src/components/ui/chart.tsx` (`THEMES`)
- Modify: tous les fichiers de `apps/web/src` hors `components/ui/` qui emploient un token maison (une quarantaine ; la commande du Step 4 les liste)
- Modify: `apps/web/src/features/exercices/badge-record.tsx`, `apps/web/src/components/shell/palette.tsx`
- Modify: `.claude/rules/interface-web.md` (sections sur les tokens), `CLAUDE.md` (sections Interface et État)

**Interfaces:**
- Produces: les classes canoniques shadcn, seules autorisées dans les tâches suivantes.

- [ ] **Step 1: Réécrire `globals.css`**

`index.html` pose toujours `data-theme` (`light` ou `dark`) avant le rendu : le sombre se déclare sur `[data-theme="dark"]` plutôt que sur `.dark`. Valeurs du thème **Neutral** de shadcn (Tailwind v4) ; les **contrôler contre la doc** (Context7, bibliothèque shadcn/ui, page « Theming », thème Neutral) avant de commiter, et suivre la doc en cas d'écart.

```css
@import "tailwindcss";

/* Le thème Neutral par défaut de shadcn (D192). `index.html` pose `data-theme`
   avant le rendu : le sombre suit cet attribut, pas une classe `.dark`. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

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

[data-theme="dark"] {
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
    /* Tout chiffre s'aligne en colonne : charges, reps, durées, dates. */
    font-variant-numeric: tabular-nums;
  }
}

/* react-resizable-panels fixe `height: 100%` en style inline sur le groupe : sans
   cette chaîne, il s'effondre à la hauteur de son contenu. */
html,
body,
#root {
  height: 100%;
}

/* Le chiffre héros des tuiles et bilans. */
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

Supprimer `tokens.css`. Retirer la police Archivo (`main.tsx`, `package.json`) : la police est celle de Tailwind par défaut.

- [ ] **Step 2: `chart.tsx` suit `data-theme`**

Dans `components/ui/chart.tsx`, remplacer la constante des thèmes :

```ts
const THEMES = { light: "", dark: '[data-theme="dark"]' } as const;
```

- [ ] **Step 3: Remplacer les tokens maison, fichier par fichier**

Table de correspondance, à appliquer sur toutes les formes (`text-(--x)`, `bg-(--x)`, `border-(--x)`, `ring-(--x)`, `var(--x)`, `text-x`…) :

| Maison | Canonique |
|---|---|
| `--ink` | `foreground` |
| `--ink-muted`, `--ink-subtle`, `--ink-faint` | `muted-foreground` |
| `--canvas` | `background` |
| `--surface-1` | `card` |
| `--surface-2`, `--surface-3`, `--nav-active` | `muted` |
| `--line` | `border` (souvent : retirer la couleur, `border` suffit) |
| `--line-strong` | `input` |
| `--focus-ring` | `ring` (`ring-ring/50`) |
| `--danger`, `--danger-ink` | `destructive` ; le texte sur aplat rouge : comme `Button variant="destructive"` |
| `--accent` (aplat d'action) | `primary` / `primary-foreground` |
| `accent-ink`, `accent-line`, `accent-wash` (contour du record) | voir `BadgeRecord` ci-dessous |
| `--cal-0` … `--cal-4` | `bg-muted`, `bg-primary/25`, `bg-primary/50`, `bg-primary/75`, `bg-primary` |
| `--superset` | `chart-2` (`text-chart-2`, `border-chart-2`) |
| `--image-bg` | `bg-white` |
| `--float-*`, `--scrim` | supprimer : la primitive par défaut |

- `features/exercices/badge-record.tsx` : le record reste un **contour**, sans couleur de marque. Lire le fichier, garder sa signature, ne changer que l'apparence :

```tsx
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Le record (CLAUDE.md) : un contour, jamais un aplat. Thème par défaut (D192). */
export function BadgeRecord({ libelle }: { libelle: string }) {
  return (
    <Badge variant="outline" className="gap-1 font-semibold">
      <TrendingUp aria-hidden="true" />
      {libelle}
    </Badge>
  );
}
```

- `features/tableau/tuiles.tsx` : le badge d'écart devient `Badge variant="outline"` sans classe de couleur (hausse ou baisse : flèche et signe, pas de couleur).
- `components/shell/palette.tsx` : retirer `className` et `overlayClassName` du `CommandDialog`, et leur commentaire.
- Les commentaires qui justifiaient l'ancien vocabulaire (lime, Archivo, D27, D135…) sont retirés ou réduits à une ligne.

- [ ] **Step 4: Plus aucun token maison**

Run: `grep -rnE "\(--(ink|surface|line|canvas|accent|danger|cal|superset|image|float|scrim|focus|nav)|(text|bg|border|fill)-(ink|surface-|line|canvas|accent-(ink|line|wash)|cal-|superset|image-bg)" apps/web/src`
Expected: aucune ligne.

Run: `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected: PASS.

- [ ] **Step 5: Les consignes**

- `.claude/rules/interface-web.md` : remplacer tout ce qui décrit les tokens maison, le lime, Archivo, l'élévation de la palette et la traduction du vocabulaire shadcn par une section :
  « **Thème par défaut de shadcn, Neutral (D192)** : classes canoniques seulement (`text-muted-foreground`, `bg-muted`, `bg-primary`…), aucun token maison, aucune couleur en dur (exception : `bg-white` derrière les GIF). Les primitives de `components/ui/` ne sont pas retouchées. L'action est `primary` en aplat ; le record est un `Badge variant="outline"` avec `TrendingUp` ; le danger est `destructive`. Le sombre suit `data-theme`. »
- `CLAUDE.md` : section Interface, première puce — « …celle du thème (orange sur le mobile ; sur le web, `primary` du thème Neutral de shadcn, D192)… » ; section État, puce Web — remplacer « Encore au lime ; sa bascule… n'est pas tranché » par « thème par défaut de shadcn (D192) ».

- [ ] **Step 6: Vérifier à l'œil, puis commit**

`pnpm dev`, parcourir Tableau de bord, Séances (liste et détail), Routines (liste et éditeur, superset compris), Exercices (liste et fiche), Profil, Connexion, palette Ctrl+K — en clair et en sombre (bascule du Profil). Rien d'illisible ; aucun aplat hors des boutons d'action.

```bash
git add -A apps/web .claude/rules/interface-web.md CLAUDE.md pnpm-lock.yaml
git commit -m "feat(web): thème par défaut de shadcn, sans tokens maison (D192)"
```


## Les données (shared + API)

### Task 1: `calculerPeriode` — même moment, séries de travail, douze semaines, référence des muscles

**Files:**
- Modify: `packages/shared/src/stats.ts:100-210` (constantes, types `Totaux`, `StatsPeriode`, fonction `calculerPeriode`)
- Modify: `packages/shared/src/index.ts` (exporter `semainesALire`, `SEMAINES_GRAPHIQUE`, `SEMAINES_REFERENCE`, `type SemaineVolume`, `type ZonePeriode`)
- Test: `packages/shared/src/stats.test.ts` (bloc `describe("calculerPeriode (D125)")`)

**Interfaces:**
- Produces:
  - `SEMAINES_GRAPHIQUE = 12`, `SEMAINES_REFERENCE = 8`
  - `semainesALire(periode: Periode): number`
  - `type SemaineVolume = { lundi: string; volumeKg: number; seances: number; series: number; dansPeriode: boolean }`
  - `type ZonePeriode = { zone: Zone; series: number; reference: number }`
  - `StatsPeriode.volumes: SemaineVolume[]` (les `max(12, n)` dernières semaines), `StatsPeriode.zones: ZonePeriode[]`
  - `Totaux.series` = séries de travail (hors échauffement)
  - `calculerPeriode(seances, maintenant, fuseau, periode)` : signature inchangée

- [ ] **Step 1: Réécrire les tests du bloc `calculerPeriode`**

Le helper `seance()` existant fait 4 + 3 = 7 séries comptées. Remplacer le bloc entier `describe("calculerPeriode (D125)", …)` par :

```ts
describe("calculerPeriode (D125, D185–D188)", () => {
  // Samedi 3 octobre 2026 : la semaine en cours commence le lundi 28 septembre ;
  // « mois » = 4 semaines depuis le lundi 7 septembre, comparées aux 4 d'avant.
  const seance = (id: string, debut: string, volumeKg = 1000): SeancePeriode => ({
    id,
    debut,
    fin: new Date(Date.parse(debut) + 45 * 60_000).toISOString(),
    volumeKg,
    seriesFaites: 10,
    exercices: [
      { musclePrincipal: "Pectoraux", musclesSecondaires: ["Triceps"], seriesComptees: 4 },
      { musclePrincipal: "Triceps", musclesSecondaires: [], seriesComptees: 3 },
    ],
  });

  it("compte la période, la précédente au même moment, et ignore le reste", () => {
    const p = calculerPeriode(
      [
        seance("a", "2026-10-01T17:00:00.000Z"),
        seance("b", "2026-09-01T17:00:00.000Z"),
        seance("c", "2026-08-01T17:00:00.000Z"),
      ],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p.nbSemaines).toBe(4);
    expect(p.premierLundi).toBe("2026-09-07");
    // Séries de travail : 4 + 3, l'échauffement n'y est pas (D186).
    expect(p.totaux).toEqual({ seances: 1, series: 7, dureeMin: 45, volumeKg: 1000 });
    expect(p.precedents).toEqual({ seances: 1, series: 7, dureeMin: 45, volumeKg: 1000 });
  });

  it("compare au même moment : le dimanche d'avant ne compte pas un samedi (D185)", () => {
    const p = calculerPeriode(
      [
        seance("sam", "2026-09-26T08:00:00.000Z"), // samedi 26 : même rang qu'aujourd'hui
        seance("dim", "2026-09-27T08:00:00.000Z"), // dimanche 27 : après ce rang
      ],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.precedents.seances).toBe(1);
  });

  it("découpe dans le fuseau : le dimanche 23 h 30 à Paris reste dans la semaine d'avant", () => {
    const p = calculerPeriode(
      [
        seance("dim", "2026-09-06T21:30:00.000Z"), // dimanche 6, 23 h 30 à Paris
        seance("lun", "2026-09-06T22:30:00.000Z"), // lundi 7, 0 h 30 à Paris
      ],
      maintenant,
      PARIS,
      "mois",
    );
    expect(p.totaux.seances).toBe(1);
    // Dimanche 6 est le dernier jour de la précédente : après le même moment (D185).
    expect(p.precedents.seances).toBe(0);
    expect(p.jours.map((j) => j.jour)).toEqual(["2026-09-07"]);
  });

  it("additionne les séances d'un même jour, et les séries par zone principale", () => {
    const p = calculerPeriode(
      [seance("a", "2026-10-01T08:00:00.000Z", 500), seance("b", "2026-10-01T17:00:00.000Z", 700)],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.jours).toEqual([{ jour: "2026-10-01", volumeKg: 1200, seances: ["a", "b"] }]);
    expect(p.zones).toEqual([
      { zone: "chest", series: 8, reference: 0 },
      { zone: "triceps", series: 6, reference: 0 },
    ]);
  });

  it("rend au moins douze semaines au graphique, la période marquée (D187)", () => {
    const p = calculerPeriode(
      [seance("a", "2026-10-01T08:00:00.000Z", 500), seance("v", "2026-08-12T08:00:00.000Z", 900)],
      maintenant,
      PARIS,
      "semaine",
    );
    expect(p.volumes).toHaveLength(12);
    expect(p.volumes[0]?.lundi).toBe("2026-07-13");
    expect(p.volumes.at(-1)).toEqual({
      lundi: "2026-09-28",
      volumeKg: 500,
      seances: 1,
      series: 7,
      dansPeriode: true,
    });
    expect(p.volumes.filter((v) => v.dansPeriode)).toHaveLength(1);
    // Mercredi 12 août : la semaine du lundi 10, hors période mais dans le graphique.
    expect(p.volumes.find((v) => v.lundi === "2026-08-10")?.volumeKg).toBe(900);
    expect(calculerPeriode([], maintenant, PARIS, "annee").volumes).toHaveLength(52);
  });

  it("compare chaque zone à la moyenne des huit semaines d'avant (D188)", () => {
    // Deux séances dans les 8 semaines avant le lundi 28 septembre, aucune pendant.
    const p = calculerPeriode(
      [seance("x", "2026-09-15T08:00:00.000Z"), seance("y", "2026-08-20T08:00:00.000Z")],
      maintenant,
      PARIS,
      "semaine",
    );
    // Pectoraux : 2 × 4 = 8 séries sur 8 semaines → 1 par semaine ; triceps : 2 × 3 / 8 → 1.
    expect(p.zones).toEqual([
      { zone: "chest", series: 0, reference: 1 },
      { zone: "triceps", series: 0, reference: 1 },
    ]);
  });

  it("ignore une séance après la fin de la période", () => {
    const p = calculerPeriode([seance("f", "2026-10-06T08:00:00.000Z")], maintenant, PARIS, "semaine");
    expect(p.totaux.seances).toBe(0);
  });
});

describe("semainesALire (D187, D188)", () => {
  it("couvre la période d'avant, la référence et le graphique, plus une de marge", () => {
    expect(semainesALire("semaine")).toBe(13);
    expect(semainesALire("mois")).toBe(13);
    expect(semainesALire("trimestre")).toBe(27);
    expect(semainesALire("annee")).toBe(105);
  });
});
```

Ajouter `semainesALire` à l'import en tête du fichier de test.

- [ ] **Step 2: Lancer les tests, ils échouent**

Run: `pnpm --filter @better-lift/shared exec vitest run src/stats.test.ts`
Expected: FAIL (`semainesALire` n'existe pas ; `series: 10` reçu au lieu de 7 ; `reference` absent).

- [ ] **Step 3: Implémenter dans `stats.ts`**

Sous `SEMAINES_PERIODE`, ajouter :

```ts
/** Le graphique montre au moins douze semaines, toute la période au-delà (D187). */
export const SEMAINES_GRAPHIQUE = 12;
/** Les semaines d'avant la période qui servent de référence aux muscles (D188). */
export const SEMAINES_REFERENCE = 8;

/**
 * Combien de semaines l'API lit pour une période : la plus longue des trois
 * fenêtres (période + précédente, référence, graphique), plus une de marge pour
 * le découpage civil, qui se fait ensuite dans le fuseau.
 */
export function semainesALire(periode: Periode): number {
  const n = SEMAINES_PERIODE[periode];
  return Math.max(2 * n, n + SEMAINES_REFERENCE, SEMAINES_GRAPHIQUE) + 1;
}
```

Remplacer le commentaire de `Totaux` et les champs `volumes` / `zones` de `StatsPeriode` :

```ts
/** `series` : les séries de travail, hors échauffement, comme le volume (D5, D186). */
export type Totaux = { seances: number; series: number; dureeMin: number; volumeKg: number };

/** Une semaine du graphique (D187). */
export type SemaineVolume = {
  lundi: string;
  volumeKg: number;
  seances: number;
  /** Les séries de travail. */
  series: number;
  /** La semaine appartient à la période choisie. */
  dansPeriode: boolean;
};

/** Les séries d'une zone, et sa référence : la moyenne des 8 semaines d'avant × n (D188). */
export type ZonePeriode = { zone: Zone; series: number; reference: number };
```

et dans `StatsPeriode` :

```ts
  /** Les `max(12, n)` dernières semaines, de la plus ancienne à la courante (D187). */
  volumes: SemaineVolume[];
  /** Les zones travaillées pendant la période ou la référence, de la plus travaillée à la moins. */
  zones: ZonePeriode[];
```

Remplacer `calculerPeriode` en entier :

```ts
const arrondi = (n: number) => Math.round(n * 100) / 100;
const seriesDeTravail = (s: SeancePeriode) =>
  s.exercices.reduce((total, e) => total + e.seriesComptees, 0);

function ajouterZones(zones: Map<Zone, number>, s: SeancePeriode) {
  for (const e of s.exercices) {
    const z = zoneDuMuscle(e.musclePrincipal);
    if (z && e.seriesComptees > 0) zones.set(z, (zones.get(z) ?? 0) + e.seriesComptees);
  }
}

/** Tout ce qui se calcule sans l'historique : les records s'ajoutent à part (D64). */
export function calculerPeriode(
  seances: readonly SeancePeriode[],
  maintenant: Date,
  fuseau: string,
  periode: Periode,
): Omit<StatsPeriode, "records" | "nbSeances"> {
  const n = SEMAINES_PERIODE[periode];
  const SEMAINE_MS = 7 * JOUR_MS;
  const { lundiMs, rang } = lundiCourant(maintenant, fuseau);
  const premierMs = lundiMs - (n - 1) * SEMAINE_MS;
  const finMs = lundiMs + SEMAINE_MS;
  const precedentMs = premierMs - n * SEMAINE_MS;
  // D185 : la période en cours se compare au même moment de la précédente.
  const joursEcoules = (n - 1) * 7 + rang;
  const referenceMs = premierMs - SEMAINES_REFERENCE * SEMAINE_MS;
  const nbBarres = Math.max(SEMAINES_GRAPHIQUE, n);
  const graphiqueMs = lundiMs - (nbBarres - 1) * SEMAINE_MS;

  const vide = (): Totaux => ({ seances: 0, series: 0, dureeMin: 0, volumeKg: 0 });
  const totaux = vide();
  const precedents = vide();
  const jours = new Map<string, JourEntraine>();
  const zones = new Map<Zone, number>();
  const zonesReference = new Map<Zone, number>();
  const courantes: SeancePeriode[] = [];
  const volumes: SemaineVolume[] = Array.from({ length: nbBarres }, (_, i) => {
    const ms = graphiqueMs + i * SEMAINE_MS;
    return {
      lundi: new Date(ms).toISOString().slice(0, 10),
      volumeKg: 0,
      seances: 0,
      series: 0,
      dansPeriode: ms >= premierMs,
    };
  });

  const ajouter = (t: Totaux, s: SeancePeriode, series: number) => {
    t.seances++;
    t.series += series;
    t.dureeMin += dureeMin(s);
    t.volumeKg = arrondi(t.volumeKg + s.volumeKg);
  };

  for (const s of seances) {
    const cle = cleJour(s.debut, fuseau);
    const ms = jourEnMs(cle);
    if (ms >= finMs) continue;
    const series = seriesDeTravail(s);

    const semaine = ms >= graphiqueMs ? volumes[Math.floor((ms - graphiqueMs) / SEMAINE_MS)] : undefined;
    if (semaine) {
      semaine.seances++;
      semaine.series += series;
      semaine.volumeKg = arrondi(semaine.volumeKg + s.volumeKg);
    }
    if (ms >= referenceMs && ms < premierMs) ajouterZones(zonesReference, s);

    if (ms >= premierMs) {
      ajouter(totaux, s, series);
      courantes.push(s);
      const jour = jours.get(cle) ?? { jour: cle, volumeKg: 0, seances: [] };
      jour.volumeKg = arrondi(jour.volumeKg + s.volumeKg);
      jour.seances.push(s.id);
      jours.set(cle, jour);
      ajouterZones(zones, s);
    } else if (ms >= precedentMs && (ms - precedentMs) / JOUR_MS <= joursEcoules) {
      ajouter(precedents, s, series);
    }
  }

  const toutesZones = new Set<Zone>([...zones.keys(), ...zonesReference.keys()]);
  return {
    periode,
    nbSemaines: n,
    premierLundi: new Date(premierMs).toISOString().slice(0, 10),
    totaux,
    precedents,
    jours: [...jours.values()].sort((a, b) => a.jour.localeCompare(b.jour)),
    volumes,
    zones: [...toutesZones]
      .map((zone) => ({
        zone,
        series: zones.get(zone) ?? 0,
        reference: Math.round(((zonesReference.get(zone) ?? 0) / SEMAINES_REFERENCE) * n),
      }))
      .sort((a, b) => b.series - a.series || b.reference - a.reference),
    muscles: courantes.flatMap((s) =>
      s.exercices.map((e) => ({
        musclePrincipal: e.musclePrincipal,
        musclesSecondaires: e.musclesSecondaires,
      })),
    ),
  };
}
```

Exporter les nouveaux noms dans `packages/shared/src/index.ts`, dans le bloc `from "./stats.js"` : `SEMAINES_GRAPHIQUE`, `SEMAINES_REFERENCE`, `semainesALire`, `type SemaineVolume`, `type ZonePeriode`.

- [ ] **Step 4: Les tests passent**

Run: `pnpm --filter @better-lift/shared exec vitest run src/stats.test.ts`
Expected: PASS. Si `semainesRecentes` n'a plus d'appelant hors de `Stats` (`lire`), le garder : `GET /stats` s'en sert.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/stats.ts packages/shared/src/stats.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): stats de période au même moment, sur douze semaines, muscles comparés (D185–D188)"
```

### Task 2: L'API lit la bonne fenêtre

**Files:**
- Modify: `apps/api/src/services/stats.ts:150-153` (`lirePeriode`)
- Modify: `apps/api/src/routes/stats.test.ts` (si le typecheck l'exige)

**Interfaces:**
- Consumes: `semainesALire(periode)` (Task 1).
- Produces: `GET /stats/periode` rend `StatsPeriode` à la nouvelle forme.

- [ ] **Step 1: Élargir la fenêtre lue**

Dans `lirePeriode`, remplacer :

```ts
    // Deux périodes et une semaine de marge : le découpage civil se fait ensuite.
    const semaines = 2 * SEMAINES_PERIODE[periode] + 1;
```

par :

```ts
    // La période, la précédente, la référence des muscles et le graphique (D185–D188).
    const semaines = semainesALire(periode);
```

et ajuster l'import (`semainesALire` au lieu de `SEMAINES_PERIODE` s'il ne sert plus ailleurs dans le fichier).

- [ ] **Step 2: Typecheck et tests de l'API**

Run: `pnpm --filter @better-lift/api typecheck && pnpm --filter @better-lift/api test`
Expected: PASS. Le dépôt factice de `routes/stats.test.ts` rend `volumes: []` et `zones: []` : il reste valide.

- [ ] **Step 3: Le web compile encore**

Run: `pnpm --filter @better-lift/web typecheck`
Expected: PASS. `volumesAffiches` lit `lundi`, `volumeKg` : toujours présents. Le graphique montre désormais douze barres, la dernière en encre : transition acceptée jusqu'au lot 2.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/services/stats.ts
git commit -m "feat(api): la période lit la fenêtre du graphique et de la référence (D187, D188)"
```

---

## L'écran

### Task 3: Tuiles Séances · Séries de travail · Volume · Objectif, et l'accueil d'un compte vide

**Files:**
- Modify: `apps/web/src/features/tableau/tuiles.tsx`
- Create: `apps/web/src/features/tableau/dialogue-objectif.tsx`
- Modify: `apps/web/src/routes/_protege.index.tsx` (passer les préférences entières ; état vide)

**Interfaces:**
- Consumes: `StatsPeriode` (Task 1), `semainesTenues` (shared), `useEcrirePreferences` (`features/profil/requetes.ts`), `type Preferences` (shared).
- Produces: `Tuiles({ stats, preferences }: { stats: StatsPeriode | null; preferences: Preferences | null })` — `stats === null` rend les quatre tuiles à « — » ; `DialogueObjectif({ preferences, children })`.

- [ ] **Step 1: Le dialogue de l'objectif**

```tsx
// dialogue-objectif.tsx
import type { Preferences } from "@better-lift/shared";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEcrirePreferences } from "@/features/profil/requetes";

const AUCUN = "aucun";

/** L'objectif hebdomadaire, réglé depuis sa tuile (D186). Le Profil garde son propre réglage. */
export function DialogueObjectif({
  preferences,
  children,
}: {
  preferences: Preferences;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [valeur, setValeur] = useState(String(preferences.objectifHebdo ?? AUCUN));
  const ecrire = useEcrirePreferences();

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        if (o) setValeur(String(preferences.objectifHebdo ?? AUCUN));
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Objectif hebdomadaire</DialogTitle>
          <DialogDescription>Le nombre de séances visé chaque semaine.</DialogDescription>
        </DialogHeader>
        <Select value={valeur} onValueChange={setValeur}>
          <SelectTrigger aria-label="Séances par semaine">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUCUN}>Aucun</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n > 1 ? "séances" : "séance"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ecrire.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {ecrire.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            disabled={ecrire.isPending}
            onClick={() =>
              ecrire.mutate(
                { ...preferences, objectifHebdo: valeur === AUCUN ? null : Number(valeur) },
                { onSuccess: () => setOuvert(false) },
              )
            }
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```


- [ ] **Step 2: Réécrire `Tuiles`**

Garder `tendance`, `avant` et `Tuile` tels quels ; remplacer le composant exporté :

```tsx
import { formaterCharge, type Preferences, type StatsPeriode, semainesTenues, SEMAINES_GRAPHIQUE } from "@better-lift/shared";
import { SYSTEME_UNITES } from "@/lib/unites";
import { DialogueObjectif } from "./dialogue-objectif";

const kg = (v: number) => formaterCharge(Math.round(v), SYSTEME_UNITES);

/**
 * Ligne 1 (D186) : trois chiffres comparés au même moment de la période d'avant,
 * puis l'objectif. Sans stats (compte sans séance), les tuiles gardent leur place.
 */
export function Tuiles({
  stats,
  preferences,
}: {
  stats: StatsPeriode | null;
  preferences: Preferences | null;
}) {
  if (!stats) {
    return (
      <>
        <Tuile titre="Séances" valeur="—">aucune séance</Tuile>
        <Tuile titre="Séries de travail" valeur="—">hors échauffement</Tuile>
        <Tuile titre="Volume" valeur="—">hors échauffement</Tuile>
        <TuileObjectif stats={null} preferences={preferences} />
      </>
    );
  }
  const { totaux, precedents } = stats;
  return (
    <>
      <Tuile
        titre="Séances"
        valeur={totaux.seances}
        tendance={tendance(totaux.seances, precedents.seances, false)}
      >
        {avant(precedents.seances, String(precedents.seances))}
      </Tuile>
      <Tuile
        titre="Séries de travail"
        valeur={totaux.series}
        tendance={tendance(totaux.series, precedents.series, true)}
      >
        {avant(precedents.series, String(precedents.series))}
      </Tuile>
      <Tuile
        titre="Volume"
        valeur={kg(totaux.volumeKg)}
        tendance={tendance(totaux.volumeKg, precedents.volumeKg, true)}
      >
        {avant(precedents.volumeKg, kg(precedents.volumeKg))}
      </Tuile>
      <TuileObjectif stats={stats} preferences={preferences} />
    </>
  );
}

/** « 2 / 3 cette semaine », une barre, puis la régularité sur douze semaines (D186). */
function TuileObjectif({
  stats,
  preferences,
}: {
  stats: StatsPeriode | null;
  preferences: Preferences | null;
}) {
  const objectif = preferences?.objectifHebdo ?? null;
  const regler = (libelle: string) =>
    preferences ? (
      <DialogueObjectif preferences={preferences}>
        <button type="button" className="underline underline-offset-4 hover:text-foreground">
          {libelle}
        </button>
      </DialogueObjectif>
    ) : null;

  if (!objectif) {
    return (
      <Tuile titre="Objectif" valeur="—">
        {regler("Fixer un objectif hebdomadaire")}
      </Tuile>
    );
  }
  const cetteSemaine = stats?.volumes.at(-1)?.seances ?? 0;
  const tenues = stats ? semainesTenues(stats.volumes.slice(-SEMAINES_GRAPHIQUE), objectif) : null;
  return (
    <Tuile
      titre="Objectif de la semaine"
      valeur={
        <>
          {cetteSemaine}
          <span className="text-2xl text-muted-foreground"> / {objectif}</span>
        </>
      }
    >
      <div className="flex w-full flex-col gap-2">
        <span className="h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, (cetteSemaine / objectif) * 100)}%` }}
          />
        </span>
        <span className="flex items-center justify-between gap-2">
          {tenues ? `tenu ${tenues.tenues} des ${tenues.sur} dernières sem.` : "pas encore de semaine"}
          {regler("Modifier")}
        </span>
      </div>
    </Tuile>
  );
}
```

Retirer l'import de `Link` et de `dureeTexte` s'ils ne servent plus dans ce fichier.

- [ ] **Step 3: Brancher la page et l'accueil du compte vide**

Dans `_protege.index.tsx` :
- `<Tuiles stats={stats.data} preferences={preferences.data ?? null} />` dans le cas nominal ;
- remplacer le bloc vide par :

```tsx
    if (estVideForce(etat) || stats.data.nbSeances === 0) {
      return (
        <div className={GRILLE}>
          <Tuiles stats={null} preferences={preferences.data ?? null} />
          <div className="h-72 lg:col-span-12">
            <EtatVide
              titre="Ta première séance remplira ce tableau."
              message="Crée une routine ici, puis note la séance sur le téléphone."
              action={{ libelle: "Créer une routine", to: "/routines/nouvelle" }}
            />
          </div>
        </div>
      );
    }
```

Lire d'abord `components/etats/etat-vide.tsx` : si `EtatVide` n'accepte pas d'action, lui ajouter une prop optionnelle `action?: { libelle: string; to: string }` qui rend un `Button asChild` contenant un `Link`, sans changer ses autres appelants.

- [ ] **Step 4: Vérifier**

Run: `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test`
Expected: PASS. Puis `pnpm dev`, ouvrir `http://localhost:3000/`, `/?etat=vide`, `/?periode=semaine` : quatre tuiles, le dialogue s'ouvre depuis « Modifier » et la tuile suit l'enregistrement sans recharger.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/tableau/tuiles.tsx apps/web/src/features/tableau/dialogue-objectif.tsx apps/web/src/routes/_protege.index.tsx apps/web/src/components/etats/etat-vide.tsx
git commit -m "feat(web): tuiles séances, séries de travail, volume et objectif réglable (D186)"
```

### Task 4: Le graphique sur douze semaines, volume ou séries

**Files:**
- Modify: `apps/web/src/features/tableau/calculs.ts` (remplacer `volumesAffiches` par `barresGraphique`)
- Modify: `apps/web/src/features/tableau/calculs.test.ts` (bloc `volumesAffiches`)
- Modify: `apps/web/src/features/tableau/volume.tsx`

**Interfaces:**
- Consumes: `SemaineVolume` (Task 1).
- Produces: `type Mesure = "volume" | "series"`, `type Barre = { cle: string; libelle: string; valeur: number; dansPeriode: boolean }`, `barresGraphique(volumes: readonly SemaineVolume[], periode: Periode, mesure: Mesure): Barre[]`.

- [ ] **Step 1: Les tests**

Remplacer le bloc `describe("volumesAffiches", …)` et l'import :

```ts
describe("barresGraphique (D187)", () => {
  const s = (lundi: string, volumeKg: number, series: number, dansPeriode: boolean) => ({
    lundi,
    volumeKg,
    seances: 1,
    series,
    dansPeriode,
  });
  const volumes = [
    s("2026-08-24", 1000, 10, false),
    s("2026-08-31", 2000, 12, false),
    s("2026-09-07", 3000, 15, true),
  ];

  it("garde une barre par semaine et marque celles de la période", () => {
    const b = barresGraphique(volumes, "mois", "volume");
    expect(b.map((x) => x.libelle)).toEqual(["24 août", "31 août", "7 sept."]);
    expect(b.map((x) => x.dansPeriode)).toEqual([false, false, true]);
    expect(b.map((x) => x.valeur)).toEqual([1000, 2000, 3000]);
  });

  it("compte les séries de travail quand on bascule la mesure", () => {
    expect(barresGraphique(volumes, "semaine", "series").map((x) => x.valeur)).toEqual([10, 12, 15]);
  });

  it("regroupe par mois en Année, d'après le mois du lundi", () => {
    const b = barresGraphique(volumes, "annee", "volume");
    expect(b.map((x) => [x.libelle, x.valeur])).toEqual([
      ["août", 3000],
      ["sept.", 3000],
    ]);
  });
});
```

- [ ] **Step 2: Échec attendu**

Run: `pnpm --filter @better-lift/web exec vitest run src/features/tableau/calculs.test.ts`
Expected: FAIL (`barresGraphique` n'existe pas).

- [ ] **Step 3: Implémenter**

Dans `calculs.ts`, remplacer la section « Volume » :

```ts
// --- Graphique (D187) ---------------------------------------------------------

export type Mesure = "volume" | "series";
export type Barre = { cle: string; libelle: string; valeur: number; dansPeriode: boolean };

/** Une barre par semaine ; en Année, une par mois, d'après le mois du lundi. */
export function barresGraphique(
  volumes: readonly SemaineVolume[],
  periode: Periode,
  mesure: Mesure,
): Barre[] {
  const valeur = (v: SemaineVolume) => (mesure === "volume" ? v.volumeKg : v.series);
  if (periode !== "annee") {
    return volumes.map((v) => ({
      cle: v.lundi,
      libelle: JOUR_MOIS.format(enDate(v.lundi)),
      valeur: valeur(v),
      dansPeriode: v.dansPeriode,
    }));
  }
  const parMois = new Map<string, Barre>();
  for (const v of volumes) {
    const cle = v.lundi.slice(0, 7);
    const barre = parMois.get(cle) ?? {
      cle,
      libelle: MOIS.format(enDate(`${cle}-01`)),
      valeur: 0,
      dansPeriode: true,
    };
    barre.valeur = Math.round((barre.valeur + valeur(v)) * 100) / 100;
    parMois.set(cle, barre);
  }
  return [...parMois.values()];
}
```

Importer `type SemaineVolume` depuis `@better-lift/shared`.

Dans `volume.tsx`, remplacer le composant :

```tsx
import { formaterCharge, type StatsPeriode } from "@better-lift/shared";
import { useState } from "react";
import { Bar, BarChart, Cell, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SYSTEME_UNITES } from "@/lib/unites";
import { barresGraphique, type Mesure } from "./calculs";
import { Carte } from "./carte";

const CONFIG = { valeur: { label: "Valeur" } } satisfies ChartConfig;
const kg = (v: number) => formaterCharge(Math.round(v), SYSTEME_UNITES);

/**
 * Au moins douze semaines (D187), par mois en Année. Les barres de la période en
 * `primary`, les autres atténuées (D187, D192).
 */
export function Volume({ stats }: { stats: StatsPeriode }) {
  const [mesure, setMesure] = useState<Mesure>("volume");
  const barres = barresGraphique(stats.volumes, stats.periode, mesure);
  const format = (v: number) => (mesure === "volume" ? kg(v) : `${v} séries`);

  return (
    <Carte
      titre={stats.periode === "annee" ? "Par mois" : "Par semaine"}
      detail={
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Mesure"
          value={mesure}
          onValueChange={(v) => {
            if (v) setMesure(v as Mesure);
          }}
        >
          <ToggleGroupItem value="volume" className="px-2.5">Volume</ToggleGroupItem>
          <ToggleGroupItem value="series" className="px-2.5">Séries</ToggleGroupItem>
        </ToggleGroup>
      }
      className="lg:col-span-8"
    >
      <ChartContainer config={CONFIG} className="aspect-auto h-52 w-full">
        <BarChart data={barres} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="libelle"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
            fontSize={10.5}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideIndicator formatter={(v) => format(Number(v))} />}
          />
          {/* Les animations de Recharts échappent à `prefers-reduced-motion` : coupées. */}
          <Bar dataKey="valeur" radius={4} minPointSize={2} isAnimationActive={false}>
            {barres.map((b) => (
              <Cell
                key={b.cle}
                fill={b.dansPeriode ? "var(--primary)" : "var(--muted-foreground)"}
                fillOpacity={b.dansPeriode ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="sr-only">{barres.map((b) => `${b.libelle} : ${format(b.valeur)}`).join(", ")}</p>
    </Carte>
  );
}
```

- [ ] **Step 4: Tests et typecheck**

Run: `pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/tableau/calculs.ts apps/web/src/features/tableau/calculs.test.ts apps/web/src/features/tableau/volume.tsx
git commit -m "feat(web): graphique sur douze semaines, volume ou séries (D187)"
```

### Task 5: Muscles comparés, records resserrés, dernières séances, nouvelle grille

**Files:**
- Modify: `apps/web/src/features/tableau/muscles.tsx`
- Modify: `apps/web/src/features/tableau/records.tsx`
- Create: `apps/web/src/features/tableau/dernieres-seances.tsx`
- Modify: `apps/web/src/routes/_protege.index.tsx` (grille et squelette)

**Interfaces:**
- Consumes: `ZonePeriode` (Task 1), `optionsSeances()` (`features/seances/requetes.ts`), `type SeanceFil` (shared), `BadgeRecord` (`features/exercices/badge-record.tsx`), `dureeTexte` (`features/tableau/calculs.ts`).
- Produces: `DernieresSeances()` (sans prop : il lit sa propre requête).

- [ ] **Step 1: Muscles avec leur référence**

Dans `muscles.tsx`, garder la carte du corps ; la liste montre jusqu'à 8 zones, la barre est l'échelle commune `max(series, reference)`, un trait vertical marque la référence :

```tsx
export function Muscles({ stats }: { stats: StatsPeriode }) {
  const zones = stats.zones.slice(0, 8);
  const max = Math.max(1, ...zones.flatMap((z) => [z.series, z.reference]));

  return (
    <Carte
      titre="Séries par muscle"
      detail="trait : moyenne des 8 semaines d'avant"
      className="lg:col-span-7"
    >
      {zones.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune série comptée sur la période.
        </p>
      ) : (
        <div className="flex items-center gap-6">
          <CarteCorps zones={zonesTravaillees(stats.muscles)} />
          <ul className="flex flex-1 flex-col gap-2">
            {zones.map((z) => (
              <li
                key={z.zone}
                className="grid grid-cols-[110px_1fr_64px] items-center gap-3 text-[13px]"
              >
                <span>{LIBELLE_ZONE[z.zone]}</span>
                <span className="relative h-2 rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(z.series / max) * 100}%` }}
                  />
                  {z.reference > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 h-4 w-0.5 rounded bg-foreground"
                      style={{ left: `${(z.reference / max) * 100}%` }}
                    />
                  ) : null}
                </span>
                <span className="text-right text-muted-foreground">
                  {z.series}
                  <span className="text-muted-foreground/70"> / {z.reference}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Carte>
  );
}
```

- [ ] **Step 2: Records en liste de quatre**

Dans `records.tsx`, remplacer le `<table>` par une liste et borner à quatre ; la carte passe à `lg:col-span-4` :

```tsx
/** Les quatre records les plus récents de la période (D189) ; le nom ouvre la fiche. */
export function Records({ records }: { records: readonly RecordRecent[] }) {
  const affiches = records.slice(0, 4);
  return (
    <Carte
      titre="Records de la période"
      detail={records.length > 4 ? `${records.length} au total` : undefined}
      className="lg:col-span-4"
    >
      {affiches.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucun record sur la période.</p>
      ) : (
        <ul className="flex flex-col">
          {affiches.map((r) => (
            <li
              key={`${r.slug}-${r.date}`}
              className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
            >
              <div className="min-w-0">
                <Link
                  to="/exercices/$slug"
                  params={{ slug: r.slug }}
                  className="block truncate font-semibold hover:underline hover:underline-offset-4"
                >
                  {r.nom}
                </Link>
                <span className="text-xs text-muted-foreground">{DATE.format(new Date(r.date))}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-[13.5px]">
                <span>
                  {r.chargeKg === null
                    ? `${r.reps} reps`
                    : `${formaterCharge(r.chargeKg, SYSTEME_UNITES)} × ${r.reps}`}
                </span>
                {/* Le record est un CONTOUR (CLAUDE.md). */}
                <BadgeRecord libelle={r.types.map((t) => LIBELLE_RECORD[t]).join(" · ")} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
```

- [ ] **Step 3: Les dernières séances**

```tsx
// dernieres-seances.tsx
import { formaterCharge } from "@better-lift/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeRecord } from "@/features/exercices/badge-record";
import { optionsSeances } from "@/features/seances/requetes";
import { FUSEAU } from "@/lib/fuseau";
import { SYSTEME_UNITES } from "@/lib/unites";
import { dureeTexte } from "./calculs";
import { Carte } from "./carte";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: FUSEAU,
});
const minutes = (s: { debut: string; fin: string }) =>
  Math.round((Date.parse(s.fin) - Date.parse(s.debut)) / 60_000);

/**
 * Les cinq dernières séances, indépendantes de la période (D189). Sa propre requête :
 * elle charge et échoue seule, le reste de la page s'affiche.
 */
export function DernieresSeances() {
  const requete = useInfiniteQuery(optionsSeances());
  const seances = requete.data?.pages[0]?.seances.slice(0, 5) ?? [];

  return (
    <Carte
      titre="Dernières séances"
      detail={
        <Link to="/seances" className="hover:underline hover:underline-offset-4">
          Tout l'historique →
        </Link>
      }
      className="lg:col-span-5"
    >
      {requete.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 rounded-md bg-muted" />
          ))}
        </div>
      ) : requete.isError ? (
        <div className="flex flex-col items-start gap-2 py-4 text-sm">
          <p role="alert">L'historique n'a pas pu être chargé.</p>
          <Button variant="outline" size="sm" onClick={() => void requete.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : seances.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucune séance.</p>
      ) : (
        <ul className="flex flex-col">
          {seances.map((s) => (
            <li key={s.id} className="border-t border-border first:border-t-0">
              <Link
                to="/seances/$id"
                params={{ id: s.id }}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 py-2.5 text-[13.5px] hover:bg-muted"
              >
                <span className="min-w-0 truncate font-semibold">{s.nom}</span>
                <span className="text-right">
                  {formaterCharge(Math.round(s.volumeKg), SYSTEME_UNITES)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {DATE.format(new Date(s.debut))} · {dureeTexte(minutes(s))} · {s.seriesFaites} séries
                </span>
                <span className="justify-self-end">
                  {s.nbRecords > 0 ? (
                    <BadgeRecord libelle={`${s.nbRecords} record${s.nbRecords > 1 ? "s" : ""}`} />
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Carte>
  );
}
```

Vérifier la forme rendue par `optionsSeances` (`pages[0].seances`) dans `features/seances/liste-seances.tsx` et l'aligner si elle diffère.

- [ ] **Step 4: La grille et le squelette**

Dans `_protege.index.tsx`, l'ordre nominal devient :

```tsx
      <div className={GRILLE}>
        <Tuiles stats={stats.data} preferences={preferences.data ?? null} />
        <Volume stats={stats.data} />
        <Records records={stats.data.records} />
        <Muscles stats={stats.data} />
        <DernieresSeances />
        <Calendrier
          annee={annee.data}
          debutPeriode={stats.data.premierLundi}
          onOuvrir={(id) => navigate({ to: "/seances/$id", params: { id } })}
        />
      </div>
```

et le squelette :

```tsx
const SQUELETTE = [3, 3, 3, 3, 8, 4, 7, 5, 12] as const;
const SPAN: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  12: "lg:col-span-12",
};
```

- [ ] **Step 5: Vérifier**

Run: `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm lint`
Expected: PASS. Puis dans le navigateur : `/`, `/?periode=semaine`, `/?periode=annee`, `/?etat=chargement`, `/?etat=erreur`, `/?etat=vide`, en sombre et en clair ; à 1024 px de large la grille passe sur une colonne sans débordement.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/tableau/muscles.tsx apps/web/src/features/tableau/records.tsx apps/web/src/features/tableau/dernieres-seances.tsx apps/web/src/routes/_protege.index.tsx
git commit -m "feat(web): muscles comparés, records resserrés et dernières séances (D188, D189)"
```

---

## La palette

### Task 6: Routines et « Nouvelle routine » dans ⌘K

**Files:**
- Modify: `apps/web/src/components/shell/palette.tsx`

**Interfaces:**
- Consumes: `optionsRoutines()` (`features/routines/requetes.ts`, rend `RoutineResume[]` : `{ id, nom, nbExercices, nbSeries }`).

- [ ] **Step 1: Ajouter les groupes**

Sous le groupe « Pages », dans `CommandList` :

```tsx
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOuverte(false);
              navigate({ to: "/routines/nouvelle" });
            }}
          >
            Nouvelle routine
          </CommandItem>
        </CommandGroup>
        {routines.data?.length ? (
          <CommandGroup heading="Routines">
            {routines.data.map((r) => (
              <CommandItem
                key={r.id}
                // cmdk filtre sur `value` : le nom, l'id pour départager deux homonymes.
                value={`${r.nom} ${r.id}`}
                onSelect={() => {
                  setOuverte(false);
                  navigate({ to: "/routines/$id", params: { id: r.id } });
                }}
              >
                {r.nom}
                <span className="ml-auto text-xs text-muted-foreground">
                  {r.nbExercices} exercices
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
```

En tête du composant : `const routines = useQuery({ ...optionsRoutines(), enabled: ouverte });` (import de `useQuery` depuis `@tanstack/react-query`). La requête ne part qu'à l'ouverture et réutilise le cache de la page Routines. Mettre à jour le commentaire au-dessus de `PAGES` et la `description` du dialogue (« Aller à une page ou une routine »). `CommandInput` : `placeholder="Aller à… ou chercher une routine"`.

- [ ] **Step 2: Vérifier**

Run: `pnpm --filter @better-lift/web typecheck && pnpm lint`
Expected: PASS. Dans le navigateur : Ctrl+K, taper « pu » → Push A, Entrée ouvre l'éditeur ; « nouv » → Nouvelle routine.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shell/palette.tsx
git commit -m "feat(web): la palette ouvre les routines et crée une routine (D191)"
```

---

## Reculer dans le temps

### Task 7: `decalage` dans le calcul et l'API

**Files:**
- Modify: `packages/shared/src/stats.ts` (`calculerPeriode`)
- Test: `packages/shared/src/stats.test.ts`
- Modify: `apps/api/src/services/stats.ts` (`DepotStats.lirePeriode`, `lirePeriode`)
- Modify: `apps/api/src/routes/stats.ts` (`requetePeriode`, route `/periode`)
- Test: `apps/api/src/routes/stats.test.ts`

**Interfaces:**
- Produces: `calculerPeriode(seances, maintenant, fuseau, periode, decalage = 0)` ; `DepotStats.lirePeriode(userId, maintenant, fuseau, periode, decalage)` ; `GET /stats/periode?periode=…&fuseau=…&decalage=n` (entier 0–520, défaut 0).

- [ ] **Step 1: Les tests du calcul**

Ajouter dans le bloc `calculerPeriode` :

```ts
  it("recule d'une période entière, comparée entière à la précédente (D190)", () => {
    const p = calculerPeriode(
      [
        seance("cour", "2026-09-22T08:00:00.000Z"), // mardi 22 : semaine du 21
        seance("prec", "2026-09-20T08:00:00.000Z"), // dimanche 20 : semaine du 14, fin de semaine
      ],
      maintenant,
      PARIS,
      "semaine",
      1,
    );
    expect(p.premierLundi).toBe("2026-09-21");
    expect(p.totaux.seances).toBe(1);
    // Période passée : la précédente compte entière, dimanche compris.
    expect(p.precedents.seances).toBe(1);
    expect(p.volumes.at(-1)?.lundi).toBe("2026-09-21");
  });
```

Run: `pnpm --filter @better-lift/shared exec vitest run src/stats.test.ts` → FAIL.

- [ ] **Step 2: Implémenter**

Dans `calculerPeriode`, ajouter le paramètre `decalage = 0` et remplacer les deux premières lignes de calcul :

```ts
  const courant = lundiCourant(maintenant, fuseau);
  // D190 : reculer de `decalage` périodes. Une période passée est complète.
  const lundiMs = courant.lundiMs - decalage * n * SEMAINE_MS;
  const rang = decalage > 0 ? 6 : courant.rang;
```

(`SEMAINE_MS` doit être déclaré avant ces lignes.) Le reste ne change pas.

Run: tests shared → PASS.

- [ ] **Step 3: L'API**

Dans `services/stats.ts` : ajouter `decalage: number` à la signature de `lirePeriode` dans `DepotStats` et l'implémentation ; borner la lecture et les records :

```ts
    const SEMAINE_MS = 7 * JOUR_MS;
    const n = SEMAINES_PERIODE[periode];
    const finMs = maintenant.getTime() - decalage * n * SEMAINE_MS + SEMAINE_MS;
    const debut = new Date(finMs - (semainesALire(periode) + 1) * SEMAINE_MS);
```

avec `where: { userId, debut: { gte: debut, lt: new Date(finMs) } }`, puis `calculerPeriode(…, periode, decalage)`, et après `recordsRecents` :

```ts
    // Une période passée ne montre pas les records établis après elle : on lit
    // large (50), on coupe au lundi qui suit la période, puis on garde 10.
    const lundiSuivant =
      Date.parse(`${p.volumes.at(-1)?.lundi ?? p.premierLundi}T00:00:00Z`) + SEMAINE_MS;
    const records = recordsRecents(exercicesAvecHistorique, depuis, 50)
      .filter((r) => Date.parse(r.date) < lundiSuivant)
      .slice(0, 10);
```

où `exercicesAvecHistorique` est le tableau déjà passé aujourd'hui à `recordsRecents`. La coupe se fait à minuit UTC : une séance du lundi entre 0 h et 2 h à Paris passerait encore. C'est un écart accepté (records d'une période passée seulement).

Dans `routes/stats.ts` :

```ts
const requetePeriode = requete.extend({
  periode: z.enum(PERIODES),
  decalage: z.coerce.number().int().min(0).max(520).default(0),
});
```

et passer `decalage` à `depot.lirePeriode`. Dans `routes/stats.test.ts`, ajouter `decalage` aux appels enregistrés et un test : `GET /stats/periode?periode=semaine&decalage=2` → le dépôt reçoit `decalage: 2` ; `decalage=-1` → 400.

Run: `pnpm --filter @better-lift/api test && pnpm typecheck` → PASS. Le mobile n'appelle pas `/stats/periode` ; vérifier par `grep -rn "stats.periode" apps/mobile` (aucun résultat attendu).

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/stats.ts packages/shared/src/stats.test.ts apps/api/src/services/stats.ts apps/api/src/routes/stats.ts apps/api/src/routes/stats.test.ts
git commit -m "feat(api): stats d'une période passée par décalage (D190)"
```

### Task 8: ‹ › dans l'en-tête du Tableau de bord

**Files:**
- Modify: `apps/web/src/features/tableau/requetes.ts` (`optionsStatsPeriode(periode, decalage)`)
- Modify: `apps/web/src/features/tableau/selecteur-periode.tsx`
- Modify: `apps/web/src/features/tableau/calculs.ts` (+ test : `intervallePeriode`)
- Modify: `apps/web/src/features/tableau/tuiles.tsx` (objectif d'une période passée)
- Modify: `apps/web/src/routes/_protege.index.tsx`

**Interfaces:**
- Produces: `intervallePeriode(premierLundi: string, nbSemaines: number): string` (« 12 – 18 oct. 2026 », « 7 sept. – 4 oct. 2026 », « 6 oct. 2025 – 4 oct. 2026 ») ; `SelecteurPeriode({ periode, decalage, intervalle, onChange, onDecaler })`.

- [ ] **Step 1: Test de l'intervalle**

```ts
describe("intervallePeriode (D190)", () => {
  it("dit une semaine, un mois, une année à cheval", () => {
    expect(intervallePeriode("2026-10-12", 1)).toBe("12 – 18 oct. 2026");
    expect(intervallePeriode("2026-09-07", 4)).toBe("7 sept. – 4 oct. 2026");
    expect(intervallePeriode("2025-10-06", 52)).toBe("6 oct. 2025 – 4 oct. 2026");
  });
});
```

Run → FAIL. Implémenter dans `calculs.ts` :

```ts
const JOUR_MOIS_AN = formater({ day: "numeric", month: "short", year: "numeric" });
const JOUR = formater({ day: "numeric" });

/** L'intervalle d'une période, du lundi au dimanche (D190). */
export function intervallePeriode(premierLundi: string, nbSemaines: number): string {
  const dernier = plusJours(premierLundi, nbSemaines * 7 - 1);
  const debut = enDate(premierLundi);
  const fin = enDate(dernier);
  const memeAn = premierLundi.slice(0, 4) === dernier.slice(0, 4);
  const memeMois = memeAn && premierLundi.slice(5, 7) === dernier.slice(5, 7);
  if (memeMois) return `${JOUR.format(debut)} – ${JOUR_MOIS_AN.format(fin)}`;
  if (memeAn) return `${JOUR_MOIS.format(debut)} – ${JOUR_MOIS_AN.format(fin)}`;
  return `${JOUR_MOIS_AN.format(debut)} – ${JOUR_MOIS_AN.format(fin)}`;
}
```

Run → PASS (ajuster la casse de « sept. » si `Intl` rend « sept. » différemment : le test fait foi après une première lecture de la sortie réelle).

- [ ] **Step 2: La requête porte le décalage dans sa clé**

```ts
export function optionsStatsPeriode(periode: Periode, decalage = 0) {
  return queryOptions({
    queryKey: ["stats", "periode", periode, decalage, FUSEAU],
    queryFn: async () => {
      const res = await api.stats.periode.$get({
        query: { fuseau: FUSEAU, periode, decalage: String(decalage) },
      });
      if (!res.ok) throw new Error("Les statistiques n'ont pas pu être chargées.");
      return res.json();
    },
    placeholderData: (precedent) => precedent,
  });
}
```

`placeholderData` garde la période affichée pendant qu'on recule : la page ne repasse pas au squelette à chaque clic.

- [ ] **Step 3: Le sélecteur**

Ajouter à `SelecteurPeriode` deux boutons `Button variant="outline" size="icon"` (`ChevronLeft`, `ChevronRight` de `lucide-react`, `aria-label` « Période précédente » / « Période suivante »), l'intervalle entre eux en `text-sm tabular-nums`, › `disabled={decalage === 0}`. Props :

```ts
{
  periode: Periode;
  decalage: number;
  intervalle: string | null;
  onChange: (p: Periode) => void;
  onDecaler: (decalage: number) => void;
}
```

- [ ] **Step 4: La page**

```ts
const recherche = z.object({
  periode: z.enum(PERIODES).optional(),
  decalage: z.coerce.number().int().min(0).optional(),
  etat: champEtat,
});
```

`const { periode = "mois", decalage = 0, etat } = Route.useSearch();`, `useQuery(optionsStatsPeriode(periode, decalage))`. `onChange` remet `decalage: undefined` ; `onDecaler(d)` pose `decalage: d || undefined`. `intervalle = stats.data ? intervallePeriode(stats.data.premierLundi, stats.data.nbSemaines) : null`.

Dans `TuileObjectif`, recevoir `decalage` : à 0, inchangé ; au-delà, titre « Objectif » et valeur `tenues` / `sur` sur les semaines de la période (`stats.volumes.filter((v) => v.dansPeriode)`), sans barre ni « cette semaine ».

- [ ] **Step 5: Vérifier**

Run: `pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web typecheck && pnpm lint`
Expected: PASS. Dans le navigateur : ‹ recule, l'URL porte `?decalage=1`, › revient et se désactive à 0, changer de période remet à 0, le bouton Précédent du navigateur revient à l'état d'avant.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/tableau apps/web/src/routes/_protege.index.tsx
git commit -m "feat(web): reculer d'une période sur le tableau de bord (D190)"
```

---

### Task 9: Vérification et PR

- [ ] **Step 1: Tout vérifier**

`/verif` (build, typecheck, test, lint, knip) vert. Puis, avec `pnpm dev` et le compte `controle@better-lift.local` : chaque page du web en clair et en sombre, le Tableau de bord sur les quatre périodes, ‹ › et le retour arrière du navigateur, `?etat=chargement|vide|erreur`, Ctrl+K.

- [ ] **Step 2: Les consignes**

Dans `CLAUDE.md`, section État, puce Web : ajouter « Tableau de bord 2a (D185–D191) ».

```bash
git add CLAUDE.md
git commit -m "docs: état du web après le tableau de bord 2a et le thème shadcn"
```

- [ ] **Step 3: La PR**

Pousser `feat/web-tableau-de-bord`, ouvrir **une** PR vers `main` (titre : « feat(web): thème shadcn par défaut et tableau de bord 2a (D185–D192) »), fusionner en squash une fois le check `Qualité · typecheck · test · build` vert. La fusion déploie la production.

