# Web tournée vers les records — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** retirer le Planning, refaire l'Accueil autour des records (trois variantes), créer la page
Records, ajouter la vue « Par routine » à Progression et des stats au détail d'une routine, recentrer
Corps sur le poids.

**Architecture :** on reste dans le wireframe (`apps/web`, données factices de `src/mocks/`). Les
calculs (records à portée, tendance, stagnation, épinglés, stats de routine, force relative) sont
des fonctions pures dans `src/mocks/`, testées par Vitest ; les écrans les lisent. Rien côté API.

**Tech stack :** React 19, TanStack Router (routes en fichiers plats), shadcn/ui, Recharts, Vitest,
Biome, Knip.

**Spec :** [`docs/superpowers/specs/2026-10-18-web-records-design.md`](../specs/2026-10-18-web-records-design.md) (D274–D281).

## Contraintes globales

- Branche `feat/web-wireframe`, un commit par tâche, Conventional Commits **en français**, terminés
  par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Jamais de push sur `main`.
- Textes de l'interface en français ; code, fichiers et adresses en anglais.
- Dates : chaînes civiles `YYYY-MM-DD`, jamais d'objet `Date` local ; `TODAY` = `"2026-10-16"`
  (`mocks/today.ts`).
- Chaque page répond aux quatre états `?etat=nominal|vide|chargement|erreur` (`useProto`).
- Charges affichées par `formatKg` / `formatLoad`, nombres par `formatNumber` (`lib/format.ts`).
- Après chaque tâche : `pnpm --filter @better-lift/web typecheck`, `pnpm --filter @better-lift/web test`,
  `pnpm --filter @better-lift/web build`, `pnpm lint`, `pnpm knip` passent, puis une capture
  Playwright de chaque page touchée (serveur `http://localhost:3000`, fichiers sous
  `.playwright-mcp/`). Biome formate à l'enregistrement (hook) : `pnpm lint:fix` si besoin.
- Seuils fixés par la spec : à portée = **+1 rep ou +2,5 kg**, dernière exécution dans les **30**
  jours ; stagnation = au moins **3** exécutions sur **42** jours et aucun record depuis **28** jours ;
  épinglés **8** au plus, **6** par défaut sur **90** jours.

---

### Task 1 : retirer le Planning (D274)

**Files :**
- Delete : `apps/web/src/routes/_app.planning.tsx`, `apps/web/src/features/planning/planning-view.tsx`,
  `apps/web/src/mocks/planning.ts`, `apps/web/src/mocks/calendar.ts`, `apps/web/src/mocks/calendar.test.ts`,
  `apps/web/src/features/home/today-card.tsx`, `apps/web/src/features/home/week-stats.tsx`
- Modify : `apps/web/src/components/shell/nav.ts`, `apps/web/src/components/shell/command-palette.tsx`,
  `apps/web/src/features/routines/routine-card.tsx`, `apps/web/src/features/routines/routine-pane.tsx`,
  `apps/web/src/routes/_app.index.tsx`, `apps/web/src/features/home/home-states.tsx`,
  `apps/web/src/mocks/stats.ts`, `apps/web/src/mocks/stats.test.ts`

**Interfaces :**
- Produit : `weekStreak(items: readonly { date: string }[], today: string): number` (signature
  élargie, utilisée par la tâche 2).

- [ ] **Step 1 : supprimer les fichiers du planning**

```bash
cd apps/web/src
git rm routes/_app.planning.tsx features/planning/planning-view.tsx mocks/planning.ts \
  mocks/calendar.ts mocks/calendar.test.ts features/home/today-card.tsx features/home/week-stats.tsx
```

- [ ] **Step 2 : la navigation**

Dans `components/shell/nav.ts`, retirer `CalendarDays` de l'import et la ligne
`{ title: "Planning", to: "/planning", icon: CalendarDays },`.

Dans `components/shell/command-palette.tsx`, retirer `CalendarPlus` de l'import lucide et la ligne
`{ label: "Planifier une routine", to: "/planning", icon: CalendarPlus },`.

- [ ] **Step 3 : l'action « Planifier » des routines**

Dans `features/routines/routine-card.tsx`, retirer `CalendarPlus` de l'import et la première entrée
du tableau rendu par `routineActions` :

```ts
    { label: "Planifier", icon: CalendarPlus, onSelect: () => navigate({ to: "/planning" }) },
```

Dans `features/routines/routine-pane.tsx`, retirer :

```tsx
          <DropdownMenuItem onSelect={() => navigate({ to: "/planning" })}>
            Planifier
          </DropdownMenuItem>
```

Si `navigate` n'est plus utilisé dans ce composant, typecheck le dira : ne retirer la variable que
dans ce cas.

- [ ] **Step 4 : l'Accueil provisoire**

Remplacer le corps nominal de `routes/_app.index.tsx` (on garde le reste jusqu'à la tâche 5) :

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { GoalsCard } from "@/features/home/goals-card";
import { HomeEmpty, HomeSkeleton } from "@/features/home/home-states";
import { RecentRecords, RecentSessions } from "@/features/home/recent-lists";
import { WeightCard } from "@/features/home/weight-card";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

/** L'Accueil, en attendant sa refonte autour des records (D277). */
function HomePage() {
  const { state } = useProto();
  return (
    <Page
      title="Accueil"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/progress">
            Voir la progression <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      }
    >
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && (
        <div className="grid items-start gap-4 @3xl:grid-cols-3">
          <RecentSessions />
          <RecentRecords />
          <div className="flex flex-col gap-4">
            <WeightCard />
            <GoalsCard />
          </div>
        </div>
      )}
    </Page>
  );
}
```

Dans `features/home/home-states.tsx`, `HomeSkeleton` ne montre plus que les trois colonnes :

```tsx
/** Chargement : les trois colonnes. */
export function HomeSkeleton() {
  return (
    <div className="grid gap-4 @3xl:grid-cols-3">
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
```

- [ ] **Step 5 : `stats.ts` — `weekSummary` part, `weekStreak` s'élargit**

Dans `mocks/stats.ts`, supprimer `type WeekTotals`, `totals` et `weekSummary` (plus aucun
lecteur), puis remplacer `weekStreak` par :

```ts
/** Semaines consécutives avec au moins un élément, en partant de la semaine en cours si elle compte. */
export function weekStreak(items: readonly { date: string }[], today: string): number {
  const weeks = new Set(items.filter((s) => s.date <= today).map((s) => startOfWeek(s.date)));
  let week = startOfWeek(today);
  if (!weeks.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (weeks.has(week)) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}
```

Dans `mocks/stats.test.ts`, retirer `weekSummary` de l'import et son bloc `describe("weekSummary", …)`.

- [ ] **Step 6 : vérifier**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Si Knip signale `components/ui/calendar.tsx` ou une dépendance
(`react-day-picker`) désormais inutilisés, les retirer (`git rm`, `pnpm --filter @better-lift/web remove react-day-picker`)
et relancer. `routeTree.gen.ts` est régénéré par Vite : le serveur doit tourner, ou lancer
`pnpm --filter @better-lift/web build` qui le régénère.

Capture de `/` et `/routines/1` : plus de Planning dans la barre, ni dans le menu ⋯ d'une routine.

- [ ] **Step 7 : commit**

```bash
git add -A apps/web
git commit -m "feat(web): le planning part (D274)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : calculs des records (D275)

**Files :**
- Create : `apps/web/src/mocks/record-insights.ts`, `apps/web/src/mocks/record-insights.test.ts`
- Modify : `apps/web/src/mocks/progress.ts` (période « Tout »)

**Interfaces :**
- Consomme : `Performance`, `best1rmOf`, `estimate1rm` (`mocks/exercise-stats.ts`) ;
  `strengthTrend` (`mocks/progress.ts`) ; `addDays`, `startOfWeek`, `weekStreak` (`mocks/stats.ts`).
- Produit :
  - `topSet(p: Performance): MockSet | undefined`
  - `type Reach = { date: string; target: { kg: number | null; reps: number }; record: number; bodyweight: boolean }`
  - `withinReach(history: Performance[], today: string): Reach | null`
  - `type Trend = { points: { date: string; value: number }[]; last: number; change: number }`
  - `recentTrend(history: Performance[], today: string): Trend | null`
  - `recordDates(history: Performance[]): string[]`
  - `isStalled(history: Performance[], today: string): boolean`
  - `type RecordEvent = { id: string; sessionId: string; date: string; slug: string; kg: number | null; reps: number }`
  - `recordEvents(details: RecordSource[]): RecordEvent[]` (le plus récent d'abord)
  - `recordCounts(events: readonly { date: string }[], today: string): { week: number; month: number; streak: number }`
  - `groupByWeek<T extends { date: string }>(items: T[]): { week: string; items: T[] }[]`
  - dans `progress.ts` : `RECORD_PERIODS` (les quatre périodes plus `{ value: "tout", label: "Tout", days: 3650 }`),
    `Period` couvre désormais `"tout"`.

- [ ] **Step 1 : écrire les tests**

`apps/web/src/mocks/record-insights.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { Performance } from "./exercise-stats";
import {
  groupByWeek,
  isStalled,
  recentTrend,
  recordCounts,
  recordDates,
  recordEvents,
  topSet,
  withinReach,
} from "./record-insights";

const TODAY = "2026-10-16";
const p = (date: string, sets: [number | null, number][]): Performance => ({
  date,
  sessionId: date,
  sets: sets.map(([kg, reps]) => ({ kg, reps })),
});

describe("topSet", () => {
  it("prend la série au meilleur 1RM estimé", () => {
    expect(topSet(p(TODAY, [[100, 5], [110, 1], [90, 10]]))).toEqual({ kg: 90, reps: 10 });
  });
  it("sans charge, prend la série la plus longue", () => {
    expect(topSet(p(TODAY, [[null, 8], [null, 12]]))).toEqual({ kg: null, reps: 12 });
  });
});

describe("withinReach", () => {
  it("propose une répétition de plus quand elle bat le 1RM", () => {
    const reach = withinReach([p("2026-10-01", [[100, 5]])], TODAY);
    expect(reach?.target).toEqual({ kg: 100, reps: 6 });
    expect(reach?.bodyweight).toBe(false);
  });
  it("rien à portée quand ni une répétition ni 2,5 kg ne suffisent", () => {
    // Record : 100 × 8 (126,7). 95 × 9 = 123,5 ; 97,5 × 8 = 123,5.
    expect(withinReach([p("2026-09-01", [[100, 8]]), p("2026-10-01", [[95, 8]])], TODAY)).toBeNull();
    // Record : 100 × 6 (120). 100 × 6 = 120, pas mieux ; 102,5 × 5 = 119,6.
    expect(withinReach([p("2026-09-01", [[100, 6]]), p("2026-10-01", [[100, 5]])], TODAY)).toBeNull();
  });
  it("préfère la répétition de plus quand elle suffit", () => {
    // Record : 101 × 5 (117,8). 100 × 6 = 120 suffit.
    expect(
      withinReach([p("2026-09-01", [[101, 5]]), p("2026-10-01", [[100, 5]])], TODAY)?.target,
    ).toEqual({ kg: 100, reps: 6 });
  });
  it("passe à +2,5 kg si la répétition de plus ne bat rien", () => {
    // Record : 21,5 × 1. Dernière : 20 × 1. 20 × 2 = 21,3 ne bat pas ; 22,5 × 1 bat.
    expect(
      withinReach([p("2026-09-01", [[21.5, 1]]), p("2026-10-01", [[20, 1]])], TODAY)?.target,
    ).toEqual({ kg: 22.5, reps: 1 });
  });
  it("ignore un exercice pas fait depuis plus de 30 jours", () => {
    expect(withinReach([p("2026-09-10", [[100, 5]])], TODAY)).toBeNull();
  });
  it("au poids du corps, vise une répétition de plus que le record si on l'a égalé", () => {
    const reach = withinReach([p("2026-09-01", [[null, 12]]), p("2026-10-01", [[null, 12]])], TODAY);
    expect(reach).toMatchObject({ target: { kg: null, reps: 13 }, record: 12, bodyweight: true });
    expect(withinReach([p("2026-09-01", [[null, 15]]), p("2026-10-01", [[null, 12]])], TODAY)).toBeNull();
  });
});

describe("recentTrend", () => {
  it("mesure l'évolution du 1RM sur 4 semaines", () => {
    const t = recentTrend(
      [p("2026-08-01", [[50, 5]]), p("2026-09-20", [[100, 5]]), p("2026-10-10", [[110, 5]])],
      TODAY,
    );
    expect(t?.change).toBe(10);
    expect(t?.points).toHaveLength(2);
  });
  it("ne dit rien avec moins de deux séances sur la période", () => {
    expect(recentTrend([p("2026-10-10", [[110, 5]])], TODAY)).toBeNull();
  });
});

describe("recordDates", () => {
  it("garde les séances qui battent tout ce qui précède, sauf la première", () => {
    const h = [
      p("2026-09-01", [[100, 5]]),
      p("2026-09-08", [[105, 5]]),
      p("2026-09-15", [[100, 5]]),
      p("2026-09-22", [[110, 5]]),
    ];
    expect(recordDates(h)).toEqual(["2026-09-08", "2026-09-22"]);
  });
});

describe("isStalled", () => {
  const steady = (dates: string[]) => dates.map((d) => p(d, [[100, 5]]));
  it("vrai : 3 séances sur 6 semaines et aucun record depuis 4 semaines", () => {
    expect(isStalled(steady(["2026-09-10", "2026-09-24", "2026-10-08"]), TODAY)).toBe(true);
  });
  it("faux s'il a moins de 3 séances sur 6 semaines", () => {
    expect(isStalled(steady(["2026-09-24", "2026-10-08"]), TODAY)).toBe(false);
  });
  it("faux s'il a battu un record dans les 4 semaines", () => {
    const h = [...steady(["2026-09-10", "2026-09-24"]), p("2026-10-08", [[110, 5]])];
    expect(isStalled(h, TODAY)).toBe(false);
  });
});

describe("recordEvents", () => {
  it("liste les séries marquées record, la plus récente d'abord", () => {
    const events = recordEvents([
      {
        session: { id: "a", date: "2026-10-01" },
        exercises: [{ slug: "squat", sets: [{ kg: 100, reps: 5, record: true }, { kg: 90, reps: 5 }] }],
      },
      {
        session: { id: "b", date: "2026-10-08" },
        exercises: [{ slug: "bench", sets: [{ kg: 80, reps: 5, record: true }] }],
      },
    ]);
    expect(events.map((e) => [e.sessionId, e.slug, e.kg])).toEqual([
      ["b", "bench", 80],
      ["a", "squat", 100],
    ]);
  });
});

describe("recordCounts", () => {
  it("compte la semaine, le mois civil et la série de semaines", () => {
    const events = [{ date: "2026-10-14" }, { date: "2026-10-02" }, { date: "2026-09-30" }];
    // Semaine du 12 oct. : 1 ; octobre : 2 ; semaines du 12, 28 sept. … : la semaine du 5 manque.
    expect(recordCounts(events, TODAY)).toEqual({ week: 1, month: 2, streak: 1 });
  });
});

describe("groupByWeek", () => {
  it("regroupe des éléments triés par semaine civile (lundi)", () => {
    const g = groupByWeek([{ date: "2026-10-14" }, { date: "2026-10-12" }, { date: "2026-10-08" }]);
    expect(g.map((w) => [w.week, w.items.length])).toEqual([
      ["2026-10-12", 2],
      ["2026-10-05", 1],
    ]);
  });
});
```

- [ ] **Step 2 : lancer les tests, ils échouent**

Run : `pnpm --filter @better-lift/web test -- record-insights`
Expected : FAIL, « Failed to resolve import "./record-insights" ».

- [ ] **Step 3 : écrire `record-insights.ts`**

```ts
import { best1rmOf, estimate1rm, type Performance } from "./exercise-stats";
import { strengthTrend } from "./progress";
import type { MockSet } from "./routines";
import { addDays, startOfWeek, weekStreak } from "./stats";

/**
 * Les records vus de l'avant (D275) : ce qu'on peut battre, ce qui monte, ce qui ne bouge plus.
 * Tout se dérive des séances, rien n'est stocké. Remplacé par `shared` au branchement de l'API.
 */

/** Un exercice est « à portée » s'il a été fait dans ces jours-là. */
const REACH_DAYS = 30;
/** Le plus petit saut de charge : deux disques de 1,25 kg. */
const STEP_KG = 2.5;
/** La tendance se lit sur quatre semaines. */
const TREND_DAYS = 28;
/** Stagnation : au moins 3 séances sur 6 semaines, sans record depuis 4 semaines. */
const STALL_WINDOW_DAYS = 42;
const STALL_MIN_SESSIONS = 3;
const STALL_DAYS = 28;

const oneRmOf = (s: MockSet) => estimate1rm(s.kg ?? 0, s.reps);

/** La meilleure série d'une exécution au 1RM estimé ; sans charge, la plus longue. */
export function topSet(p: Performance): MockSet | undefined {
  return p.sets.reduce<MockSet | undefined>((best, s) => {
    if (!best) return s;
    const a = oneRmOf(s);
    const b = oneRmOf(best);
    return a > b || (a === b && s.reps > best.reps) ? s : best;
  }, undefined);
}

export type Reach = {
  /** La dernière exécution, sur laquelle la cible est calculée. */
  date: string;
  /** La série qui suffit : une répétition de plus, sinon 2,5 kg de plus. */
  target: { kg: number | null; reps: number };
  /** Le record à battre : 1RM estimé, ou répétitions au poids du corps. */
  record: number;
  bodyweight: boolean;
};

/**
 * Un record atteignable à la prochaine séance : la dernière meilleure série, à une répétition
 * ou 2,5 kg près, battrait le 1RM estimé. Au poids du corps : égaler son record de répétitions
 * suffit pour viser une de plus.
 */
export function withinReach(history: Performance[], today: string): Reach | null {
  const last = history.at(-1);
  if (!last || last.date < addDays(today, -REACH_DAYS)) return null;
  const top = topSet(last);
  if (!top) return null;
  if (!top.kg) {
    const best = Math.max(...history.flatMap((p) => p.sets.map((s) => s.reps)));
    return top.reps >= best
      ? { date: last.date, target: { kg: null, reps: best + 1 }, record: best, bodyweight: true }
      : null;
  }
  const record = Math.max(...history.map(best1rmOf));
  const candidates = [
    { kg: top.kg, reps: top.reps + 1 },
    { kg: top.kg + STEP_KG, reps: top.reps },
  ];
  const target = candidates.find((c) => estimate1rm(c.kg, c.reps) > record);
  return target ? { date: last.date, target, record, bodyweight: false } : null;
}

export type Trend = { points: { date: string; value: number }[]; last: number; change: number };

/** L'évolution du 1RM estimé sur les quatre dernières semaines ; `null` sous deux séances. */
export function recentTrend(history: Performance[], today: string): Trend | null {
  const from = addDays(today, -TREND_DAYS);
  return strengthTrend(
    history.filter((p) => p.date >= from).map((p) => ({ date: p.date, value: best1rmOf(p) })),
  );
}

/**
 * Les dates où l'exercice a battu son 1RM estimé, comme dans l'historique : la première fois ne
 * compte pas, il n'y avait rien à battre.
 */
export function recordDates(history: Performance[]): string[] {
  const out: string[] = [];
  let best: number | undefined;
  for (const p of history) {
    const value = best1rmOf(p);
    if (best !== undefined && value > best) out.push(p.date);
    best = Math.max(best ?? 0, value);
  }
  return out;
}

/** Fait régulièrement, mais plus aucun record depuis quatre semaines. */
export function isStalled(history: Performance[], today: string): boolean {
  const recent = history.filter((p) => p.date >= addDays(today, -STALL_WINDOW_DAYS));
  if (recent.length < STALL_MIN_SESSIONS) return false;
  const last = recordDates(history).at(-1);
  return !last || last < addDays(today, -STALL_DAYS);
}

export type RecordEvent = {
  id: string;
  sessionId: string;
  date: string;
  slug: string;
  kg: number | null;
  reps: number;
};

type RecordSource = {
  session: { id: string; date: string };
  exercises: { slug: string; sets: { kg: number | null; reps: number; record?: boolean }[] }[];
};

/** Chaque série marquée record dans les séances, la plus récente d'abord. */
export function recordEvents(details: RecordSource[]): RecordEvent[] {
  return details
    .flatMap((d) =>
      d.exercises.flatMap((e) =>
        e.sets
          .filter((s) => s.record)
          .map((s) => ({
            id: `${d.session.id}-${e.slug}`,
            sessionId: d.session.id,
            date: d.session.date,
            slug: e.slug,
            kg: s.kg,
            reps: s.reps,
          })),
      ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Les records de la semaine, du mois civil, et les semaines d'affilée avec au moins un record. */
export function recordCounts(events: readonly { date: string }[], today: string) {
  const week = startOfWeek(today);
  const month = today.slice(0, 7);
  const past = events.filter((e) => e.date <= today);
  return {
    week: past.filter((e) => startOfWeek(e.date) === week).length,
    month: past.filter((e) => e.date.slice(0, 7) === month).length,
    streak: weekStreak(past, today),
  };
}

/** Regroupe des éléments déjà triés (le plus récent d'abord) par semaine, du lundi. */
export function groupByWeek<T extends { date: string }>(items: T[]) {
  const groups: { week: string; items: T[] }[] = [];
  for (const item of items) {
    const week = startOfWeek(item.date);
    const last = groups.at(-1);
    if (last?.week === week) last.items.push(item);
    else groups.push({ week, items: [item] });
  }
  return groups;
}
```

- [ ] **Step 4 : la période « Tout » dans `progress.ts`**

Remplacer le haut de `mocks/progress.ts` (jusqu'à `daysOf` inclus) par :

```ts
import { addDays, startOfWeek } from "./stats";

export const PERIODS = [
  { value: "4s", label: "4 sem.", days: 28 },
  { value: "3m", label: "3 mois", days: 91 },
  { value: "6m", label: "6 mois", days: 182 },
  { value: "1a", label: "1 an", days: 364 },
] as const;
/** Records regarde aussi tout l'historique (D278) ; Progression et Corps s'en tiennent aux quatre. */
export const RECORD_PERIODS = [...PERIODS, { value: "tout", label: "Tout", days: 3650 }] as const;
export type Period = (typeof RECORD_PERIODS)[number]["value"];

const daysOf = (period: Period) => RECORD_PERIODS.find((p) => p.value === period)?.days ?? 91;
```

Et dans `features/progress/period-toggle.tsx`, une prop `all` :

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PERIODS, type Period, RECORD_PERIODS } from "@/mocks/progress";

/** La période en boutons (D267), la même sur Corps ; Records y ajoute « Tout » (D278). */
export function PeriodToggle({
  value,
  onChange,
  all = false,
}: {
  value: Period;
  onChange: (period: Period) => void;
  all?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Période"
      value={value}
      onValueChange={(v) => v && onChange(v as Period)}
    >
      {(all ? RECORD_PERIODS : PERIODS).map((p) => (
        <ToggleGroupItem key={p.value} value={p.value}>
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
```

- [ ] **Step 5 : lancer les tests, ils passent**

Run : `pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web typecheck`
Expected : PASS. Un test qui échoue sur une valeur numérique se corrige dans le **test** seulement
si le commentaire de calcul du test est faux ; sinon c'est le code.

- [ ] **Step 6 : commit**

```bash
git add apps/web/src/mocks apps/web/src/features/progress/period-toggle.tsx
git commit -m "feat(web): records à portée, tendance et stagnation (D275)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : épinglés et cibles (D276)

**Files :**
- Create : `apps/web/src/mocks/pins.ts`, `apps/web/src/mocks/pins.test.ts`, `apps/web/src/mocks/targets.ts`,
  `apps/web/src/features/records/pin-button.tsx`
- Delete : `apps/web/src/mocks/goals.ts`, `apps/web/src/features/home/goals-card.tsx`
- Modify : `apps/web/src/features/exercises/exercise-detail.tsx`, `apps/web/src/routes/_app.exercises.$slug.tsx`,
  `apps/web/src/routes/_app.index.tsx`

**Interfaces :**
- Produit :
  - `MAX_PINS = 8`
  - `defaultPins(done: readonly { slug: string; date: string }[], today: string): string[]`
  - `togglePin(list: readonly string[], slug: string): string[] | null` (`null` : liste pleine)
  - `usePins(): { slugs: string[]; isDefault: boolean }`
  - `applyPin(current: readonly string[], slug: string): "pinned" | "unpinned" | "full"`
  - `targetOf(slug: string): number | undefined`
  - `<PinButton slug={string} />`

- [ ] **Step 1 : les tests**

`apps/web/src/mocks/pins.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { defaultPins, MAX_PINS, togglePin } from "./pins";

const TODAY = "2026-10-16";

describe("defaultPins", () => {
  it("prend les six exercices les plus faits sur 90 jours", () => {
    const done = [
      ...["a", "a", "a", "b", "b", "c", "d", "e", "f", "g"].map((slug) => ({ slug, date: "2026-10-01" })),
      { slug: "z", date: "2026-01-01" },
      { slug: "z", date: "2026-01-02" },
      { slug: "z", date: "2026-01-03" },
    ];
    expect(defaultPins(done, TODAY)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });
});

describe("togglePin", () => {
  it("ajoute à la fin, retire s'il y est", () => {
    expect(togglePin(["a"], "b")).toEqual(["a", "b"]);
    expect(togglePin(["a", "b"], "a")).toEqual(["b"]);
  });
  it("refuse au-delà du maximum", () => {
    const full = Array.from({ length: MAX_PINS }, (_, i) => `e${i}`);
    expect(togglePin(full, "x")).toBeNull();
    expect(togglePin(full, "e0")).toHaveLength(MAX_PINS - 1);
  });
});
```

Run : `pnpm --filter @better-lift/web test -- pins` → FAIL (module introuvable).

- [ ] **Step 2 : `mocks/pins.ts`**

```ts
import { workouts } from "./generated-workouts";
import { signal } from "./signal";
import { addDays } from "./stats";
import { TODAY } from "./today";

/** Huit exercices épinglés au plus (D276) : au-delà, l'Accueil redevient un catalogue. */
export const MAX_PINS = 8;
const DEFAULT_COUNT = 6;
const DEFAULT_DAYS = 90;

/** À défaut d'épinglés, les six exercices les plus faits sur 90 jours (égalité : ordre du nom). */
export function defaultPins(done: readonly { slug: string; date: string }[], today: string) {
  const from = addDays(today, -DEFAULT_DAYS);
  const counts = new Map<string, number>();
  for (const d of done)
    if (d.date >= from && d.date <= today) counts.set(d.slug, (counts.get(d.slug) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, DEFAULT_COUNT)
    .map(([slug]) => slug);
}

/** Épingle à la fin ou désépingle ; `null` si la liste est pleine. */
export function togglePin(list: readonly string[], slug: string): string[] | null {
  if (list.includes(slug)) return list.filter((s) => s !== slug);
  if (list.length >= MAX_PINS) return null;
  return [...list, slug];
}

const DEFAULTS = defaultPins(
  workouts.flatMap((w) => w.exercises.map((e) => ({ slug: e.slug, date: w.date }))),
  TODAY,
);

/** Les épinglés choisis ; `null` : aucun, on montre ceux par défaut. En mémoire (wireframe). */
const pinned = signal<string[] | null>(null);

export function usePins(): { slugs: string[]; isDefault: boolean } {
  const chosen = pinned.use();
  return chosen ? { slugs: chosen, isDefault: false } : { slugs: DEFAULTS, isDefault: true };
}

/**
 * Épingle ou désépingle à partir de la liste affichée : désépingler un exercice par défaut fige
 * les autres. Une liste vidée revient aux exercices par défaut.
 */
export function applyPin(current: readonly string[], slug: string): "pinned" | "unpinned" | "full" {
  const next = togglePin(current, slug);
  if (next === null) return "full";
  pinned.set(next.length > 0 ? next : null);
  return current.includes(slug) ? "unpinned" : "pinned";
}
```

Run : `pnpm --filter @better-lift/web test -- pins` → PASS.

- [ ] **Step 3 : `mocks/targets.ts`, et `goals.ts` part**

```ts
/**
 * La cible d'un exercice (D276) : la charge visée, tracée sur sa courbe, montrée sur sa carte
 * épinglée et dans le palmarès. Remplace les objectifs de force ; celui du poids vit dans Corps.
 */
const TARGETS: Record<string, number> = {
  "lever-chest-press": 90,
  "dumbbell-incline-bench-press": 32,
};

export const targetOf = (slug: string): number | undefined => TARGETS[slug];
```

```bash
git rm apps/web/src/mocks/goals.ts apps/web/src/features/home/goals-card.tsx
```

Dans `features/exercises/exercise-detail.tsx` :
- remplacer `import { mockGoals } from "@/mocks/goals";` par `import { targetOf } from "@/mocks/targets";` ;
- dans `ProgressChart`, remplacer `const goal = mockGoals.find((g) => g.slug === exercise.slug);`
  par `const target = targetOf(exercise.slug);` ;
- remplacer chaque `goal.target` / `goal?.target` par `target`, `goal ?` par `target !== undefined ?`
  et `{goal && (` par `{target !== undefined && (` ; le texte devient
  `` `Cible : ${formatKg(target)} en pointillés` ``.

Dans `routes/_app.index.tsx`, retirer l'import de `GoalsCard` et `<GoalsCard />`.

- [ ] **Step 4 : `features/records/pin-button.tsx`**

```tsx
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyPin, MAX_PINS, usePins } from "@/mocks/pins";

/** La punaise d'un exercice (D276) : sur la fiche et sur chaque carte de l'Accueil. */
export function PinButton({ slug, className }: { slug: string; className?: string }) {
  const { slugs, isDefault } = usePins();
  const pinned = !isDefault && slugs.includes(slug);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={pinned}
      aria-label={pinned ? "Désépingler de l'accueil" : "Épingler à l'accueil"}
      title={pinned ? "Désépingler de l'accueil" : "Épingler à l'accueil"}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Par défaut, rien n'est encore choisi : la première punaise part d'une liste vide.
        const result = applyPin(isDefault ? [] : slugs, slug);
        if (result === "full")
          toast.error(`${MAX_PINS} exercices au plus : désépinglez-en un d'abord`);
        else toast(result === "pinned" ? "Épinglé à l'accueil" : "Désépinglé de l'accueil");
      }}
    >
      <Pin className={cn(pinned && "fill-current text-foreground")} />
    </Button>
  );
}
```

Note : tant qu'aucun exercice n'est choisi, l'Accueil montre les six par défaut et aucune punaise
n'est pleine ; la première punaise posée remplace les défauts.

- [ ] **Step 5 : la punaise sur la fiche Exercice**

Dans `routes/_app.exercises.$slug.tsx`, importer `PinButton` et passer à `DetailHeader` :

```tsx
        actions={
          <>
            <PinButton slug={exercise.slug} />
            {edit.actions(null)}
          </>
        }
```

- [ ] **Step 6 : vérifier et commiter**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Capture de `/exercises/lever-chest-press` : punaise dans l'en-tête,
« Cible : 90 kg » sur la courbe ; un clic sur la punaise la remplit et affiche le toast.

```bash
git add -A apps/web
git commit -m "feat(web): épingler un exercice, la cible remplace l'objectif (D276)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : la page Records (D278)

**Files :**
- Create : `apps/web/src/routes/_app.records.tsx`, `apps/web/src/features/records/insights.ts`,
  `apps/web/src/features/records/record-row.tsx`, `apps/web/src/features/records/lift-lists.tsx`,
  `apps/web/src/features/records/records-view.tsx`
- Move : `apps/web/src/features/progress/records-table.tsx` → `apps/web/src/features/records/records-table.tsx`
- Modify : `apps/web/src/components/shell/nav.ts`, `apps/web/src/features/progress/progress-view.tsx` (import)

**Interfaces :**
- Consomme : tout ce que produit la tâche 2 ; `targetOf` (tâche 3) ; `exerciseHistory`, `mockExercises`,
  `sessionDetail`, `useSessions`.
- Produit :
  - `type Insight = { slug: string; name: string; muscle: string; history: Performance[]; best1rm: number; reach: Reach | null; trend: Trend | null; stalled: boolean; lastRecord: string | null }`
  - `INSIGHTS: Insight[]`, `insightOf(slug: string): Insight | undefined`
  - `pinnedFirst<T extends { slug: string }>(items: T[], pins: readonly string[]): T[]`
  - `useRecordEvents(): RecordEvent[]`
  - `setText(s: { kg: number | null; reps: number }): string`
  - `<RecordRow event={RecordEvent} />`
  - `<ReachList items={Insight[]} limit?={number} />`, `<TrendList items={Insight[]} limit?={number} />`,
    `<StalledList items={Insight[]} limit?={number} />`
  - `<RecordsView period={Period} />`, `<RecordsSkeleton />`

- [ ] **Step 1 : déplacer le tableau**

```bash
git mv apps/web/src/features/progress/records-table.tsx apps/web/src/features/records/records-table.tsx
```

Dans `features/progress/progress-view.tsx`, l'import devient
`import { RecordsTable } from "@/features/records/records-table";` (la tâche 6 le retirera).

Dans `records-table.tsx` :
- ajouter `import { targetOf } from "@/mocks/targets";` ;
- ajouter `target: number | undefined;` au type `Row`, et `target: targetOf(e.slug),` dans l'objet
  rendu par `rowsFor` ;
- ajouter `"target"` à `SortKey` et la colonne
  `{ key: "target", label: "Cible", numeric: true },` avant `date` dans `COLUMNS` ;
- le tri traite `undefined` comme 0 : remplacer les deux lignes `const av = a[sort.key];` /
  `const bv = b[sort.key];` par `const av = a[sort.key] ?? 0;` / `const bv = b[sort.key] ?? 0;` ;
- ajouter la cellule, avant celle de la date :

```tsx
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {r.target !== undefined ? formatKg(r.target) : "—"}
                  </TableCell>
```

- retirer `search={{ onglet: "records" }}` du lien (la fiche n'a plus d'onglets).

- [ ] **Step 2 : `features/records/insights.ts`**

```ts
import { best1rmOf, type Performance } from "@/mocks/exercise-stats";
import { exerciseHistory } from "@/mocks/exercise-history";
import { mockExercises } from "@/mocks/exercises";
import { sessionDetail } from "@/mocks/history";
import {
  isStalled,
  type Reach,
  type RecordEvent,
  recentTrend,
  recordDates,
  recordEvents,
  type Trend,
  withinReach,
} from "@/mocks/record-insights";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

export type Insight = {
  slug: string;
  name: string;
  muscle: string;
  history: Performance[];
  best1rm: number;
  reach: Reach | null;
  trend: Trend | null;
  stalled: boolean;
  lastRecord: string | null;
};

/** Ce qu'on sait de chaque exercice déjà fait : calculé une fois, les séances factices sont figées. */
export const INSIGHTS: Insight[] = mockExercises.flatMap((e) => {
  const history = exerciseHistory(e.slug);
  if (history.length === 0) return [];
  return [
    {
      slug: e.slug,
      name: e.name,
      muscle: e.muscle,
      history,
      best1rm: Math.max(...history.map(best1rmOf)),
      reach: withinReach(history, TODAY),
      trend: recentTrend(history, TODAY),
      stalled: isStalled(history, TODAY),
      lastRecord: recordDates(history).at(-1) ?? null,
    },
  ];
});

export const insightOf = (slug: string) => INSIGHTS.find((i) => i.slug === slug);

/** Les épinglés d'abord, dans leur ordre ; les autres gardent le leur. */
export function pinnedFirst<T extends { slug: string }>(items: T[], pins: readonly string[]): T[] {
  const rank = (slug: string) => {
    const i = pins.indexOf(slug);
    return i === -1 ? pins.length : i;
  };
  return [...items].sort((a, b) => rank(a.slug) - rank(b.slug));
}

/** Tous les records battus, le plus récent d'abord. */
export function useRecordEvents(): RecordEvent[] {
  return recordEvents(useSessions().map(sessionDetail));
}
```

- [ ] **Step 3 : `features/records/record-row.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Trophy } from "lucide-react";
import { formatKg, formatShortDay } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import type { RecordEvent } from "@/mocks/record-insights";

/** « 92,5 kg × 5 », ou « 12 reps » sans charge. */
export const setText = (s: { kg: number | null; reps: number }) =>
  s.kg ? `${formatKg(s.kg)} × ${s.reps}` : `${s.reps} reps`;

/** Un record battu : l'exercice, la série, la date ; ouvre sa séance. */
export function RecordRow({ event }: { event: RecordEvent }) {
  return (
    <Link
      to="/history/$id"
      params={{ id: event.sessionId }}
      className="flex items-center gap-3 border-t px-4 py-2.5 transition-colors hover:bg-muted/40"
    >
      <Trophy className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm">
        {exerciseBySlug(event.slug)?.name ?? event.slug}
      </span>
      <span className="shrink-0 text-sm tabular-nums">{setText(event)}</span>
      <span className="w-16 shrink-0 text-right text-muted-foreground text-xs">
        {formatShortDay(event.date)}
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
```

- [ ] **Step 4 : `features/records/lift-lists.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDaysAgo, formatKg, formatNumber } from "@/lib/format";
import { daysSince } from "@/mocks/routine-stats";
import { TODAY } from "@/mocks/today";
import type { Insight } from "./insights";
import { setText } from "./record-row";

function LiftList({
  title,
  description,
  empty,
  items,
  limit,
  render,
}: {
  title: string;
  description: string;
  empty: string;
  items: Insight[];
  limit?: number;
  render: (i: Insight) => ReactNode;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {shown.length === 0 ? (
        <p className="border-t px-4 py-6 text-center text-muted-foreground text-sm">{empty}</p>
      ) : (
        shown.map((i) => (
          <Link
            key={i.slug}
            to="/exercises/$slug"
            params={{ slug: i.slug }}
            className="flex items-center gap-3 border-t px-4 py-2.5 transition-colors hover:bg-muted/40"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{i.name}</span>
              <span className="text-muted-foreground text-xs">{i.muscle}</span>
            </span>
            {render(i)}
          </Link>
        ))
      )}
    </Card>
  );
}

/** Les records atteignables à la prochaine séance, avec la série qui suffit (D275). */
export function ReachList({ items, limit }: { items: Insight[]; limit?: number }) {
  return (
    <LiftList
      title="À portée"
      description="Une répétition ou 2,5 kg de plus suffisent"
      empty="Rien à portée pour l'instant."
      items={items.filter((i) => i.reach)}
      limit={limit}
      render={(i) => (
        <span className="flex shrink-0 flex-col items-end">
          <span className="font-medium text-sm tabular-nums">
            {i.reach && setText(i.reach.target)}
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {i.reach?.bodyweight
              ? `record ${i.reach.record} reps`
              : `bat ${formatKg(Math.round(i.reach?.record ?? 0))}`}
          </span>
        </span>
      )}
    />
  );
}

/** Le 1RM estimé en hausse sur quatre semaines, le plus fort d'abord (D275). */
export function TrendList({ items, limit }: { items: Insight[]; limit?: number }) {
  return (
    <LiftList
      title="En progression"
      description="1RM estimé sur 4 semaines"
      empty="Aucune hausse sur 4 semaines."
      items={items.filter((i) => (i.trend?.change ?? 0) > 0)}
      limit={limit}
      render={(i) => (
        <Badge variant="outline" className="shrink-0 tabular-nums">
          +{formatNumber(i.trend?.change ?? 0)} %
        </Badge>
      )}
    />
  );
}

/** Fait régulièrement, sans record depuis quatre semaines (D275). */
export function StalledList({ items, limit }: { items: Insight[]; limit?: number }) {
  return (
    <LiftList
      title="En stagnation"
      description="Fait souvent, sans record depuis 4 semaines"
      empty="Rien ne stagne."
      items={items.filter((i) => i.stalled)}
      limit={limit}
      render={(i) => (
        <span className="shrink-0 text-muted-foreground text-xs">
          {i.lastRecord
            ? `Dernier record ${formatDaysAgo(daysSince(i.lastRecord, TODAY)).toLowerCase()}`
            : "Jamais de record"}
        </span>
      )}
    />
  );
}
```

`TrendList` reçoit des éléments déjà triés par l'appelant (tri par `trend.change` décroissant).

- [ ] **Step 5 : `features/records/records-view.tsx`**

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDaysAgo, formatShortDay } from "@/lib/format";
import { inPeriod, type Period, previousRange } from "@/mocks/progress";
import { groupByWeek } from "@/mocks/record-insights";
import { daysSince } from "@/mocks/routine-stats";
import { TODAY } from "@/mocks/today";
import { INSIGHTS, useRecordEvents } from "./insights";
import { ReachList, StalledList } from "./lift-lists";
import { RecordRow } from "./record-row";
import { RecordsTable } from "./records-table";

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0");

/**
 * Records (D278) : le bandeau de la période, ce qui est à portée et ce qui stagne, le palmarès
 * par exercice, puis la chronologie de tous les records, semaine par semaine.
 */
export function RecordsView({ period }: { period: Period }) {
  const events = useRecordEvents();
  const current = inPeriod(events, period, TODAY);
  const before = previousRange(period, TODAY);
  const previous = events.filter((e) => e.date >= before.from && e.date <= before.to);
  const last = events[0];
  const figures = [
    {
      label: "Records battus",
      value: String(current.length),
      hint: period === "tout" ? "depuis le début" : `${signed(current.length - previous.length)} vs période précédente`,
    },
    {
      label: "Exercices en progrès",
      value: String(new Set(current.map((e) => e.slug)).size),
      hint: "avec au moins un record",
    },
    {
      label: "Dernier record",
      value: last ? formatDaysAgo(daysSince(last.date, TODAY)) : "—",
      hint: last ? formatShortDay(last.date) : "aucun encore",
    },
  ];
  return (
    <>
      <Card size="sm">
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 @xl:grid-cols-3">
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">{f.label}</span>
              <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{f.hint}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid items-start gap-4 @3xl:grid-cols-2">
        <ReachList items={INSIGHTS} />
        <StalledList items={INSIGHTS} />
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-lg">Palmarès</h2>
        <RecordsTable period={period} />
      </section>
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-3">
          <CardTitle>Chronologie</CardTitle>
          <CardDescription>Chaque record battu sur la période ; un clic ouvre sa séance</CardDescription>
        </CardHeader>
        {current.length === 0 ? (
          <p className="border-t px-4 py-6 text-center text-muted-foreground text-sm">
            Aucun record sur la période.
          </p>
        ) : (
          groupByWeek(current).map((g) => (
            <div key={g.week}>
              <div className="border-t bg-muted/40 px-4 py-1.5 text-muted-foreground text-xs">
                Semaine du {formatShortDay(g.week)} · {g.items.length}
              </div>
              {g.items.map((e) => (
                <RecordRow key={e.id} event={e} />
              ))}
            </div>
          ))
        )}
      </Card>
    </>
  );
}

export function RecordsSkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-4 @3xl:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </>
  );
}
```

- [ ] **Step 6 : la route `routes/_app.records.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PeriodToggle } from "@/features/progress/period-toggle";
import { RecordsSkeleton, RecordsView } from "@/features/records/records-view";
import type { Period } from "@/mocks/progress";

export const Route = createFileRoute("/_app/records")({
  staticData: { crumb: "Records" },
  component: RecordsPage,
});

function RecordsPage() {
  const { state } = useProto();
  const [period, setPeriod] = useState<Period>("3m");
  return (
    <Page title="Records" actions={<PeriodToggle all value={period} onChange={setPeriod} />}>
      {state === "chargement" && <RecordsSkeleton />}
      {state === "erreur" && <StateError title="Les records n'ont pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Pas encore de record</EmptyTitle>
            <EmptyDescription>
              Un record se bat dès la deuxième séance d'un exercice : la première sert de repère.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {state === "nominal" && <RecordsView period={period} />}
    </Page>
  );
}
```

- [ ] **Step 7 : la barre**

Dans `components/shell/nav.ts`, importer `Trophy` et ouvrir le groupe Analyse par
`{ title: "Records", to: "/records", icon: Trophy },`. La palette suit `NAV_GROUPS` : rien à y faire.

- [ ] **Step 8 : vérifier et commiter**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Captures de `/records` dans les quatre états, puis avec « Tout » : la
chronologie remonte à juillet ; un clic sur un record ouvre sa séance.

```bash
git add -A apps/web
git commit -m "feat(web): une page Records (D278)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : l'Accueil des records (D277)

**Files :**
- Create : `apps/web/src/features/home/records-strip.tsx`, `apps/web/src/features/home/lift-card.tsx`,
  `apps/web/src/features/home/home-pinned.tsx`, `apps/web/src/features/home/home-feed.tsx`,
  `apps/web/src/features/home/home-to-beat.tsx`
- Delete : `apps/web/src/features/home/recent-lists.tsx`, `apps/web/src/features/home/weight-card.tsx`,
  `apps/web/src/mocks/records.ts`
- Modify : `apps/web/src/routes/_app.index.tsx`, `apps/web/src/features/home/home-states.tsx`

**Interfaces :**
- Consomme : `INSIGHTS`, `insightOf`, `pinnedFirst`, `useRecordEvents`, `RecordRow`, `setText`,
  `ReachList`, `TrendList`, `StalledList` (tâche 4) ; `usePins`, `PinButton`, `targetOf` (tâche 3) ;
  `recordCounts`, `topSet` (tâche 2).
- Produit : `<RecordsStrip />`, `<LiftCard insight={Insight} />`, `<HomePinned />`, `<HomeFeed />`,
  `<HomeToBeat />`.

- [ ] **Step 1 : `features/home/records-strip.tsx`**

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { plural } from "@/lib/format";
import { recordCounts } from "@/mocks/record-insights";
import { TODAY } from "@/mocks/today";
import { useRecordEvents } from "../records/insights";

/** La ligne de tête de l'Accueil (D277), commune aux trois variantes. */
export function RecordsStrip() {
  const counts = recordCounts(useRecordEvents(), TODAY);
  const figures = [
    { label: "Cette semaine", value: plural(counts.week, "record") },
    { label: "Ce mois", value: plural(counts.month, "record") },
    {
      label: "Semaines d'affilée",
      value: counts.streak > 0 ? plural(counts.streak, "semaine") : "—",
      hint: "avec au moins un record",
    },
  ];
  return (
    <Card size="sm">
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 @xl:grid-cols-3">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
            {f.hint && <span className="text-muted-foreground text-xs">{f.hint}</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2 : `features/home/lift-card.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { Line, LineChart, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatDaysAgo, formatKg } from "@/lib/format";
import { best1rmOf } from "@/mocks/exercise-stats";
import { topSet } from "@/mocks/record-insights";
import { daysSince } from "@/mocks/routine-stats";
import { addDays } from "@/mocks/stats";
import { targetOf } from "@/mocks/targets";
import { TODAY } from "@/mocks/today";
import type { Insight } from "../records/insights";
import { PinButton } from "../records/pin-button";
import { setText } from "../records/record-row";

const config = { value: { label: "1RM estimé", color: "var(--foreground)" } } satisfies ChartConfig;

/**
 * Un exercice épinglé (D277 A) : son meilleur 1RM estimé, sa courbe sur 3 mois, la dernière fois
 * et ce qu'il faut pour le prochain record — ou sa cible.
 */
export function LiftCard({ insight }: { insight: Insight }) {
  const last = insight.history.at(-1);
  const top = last && topSet(last);
  const charged = insight.best1rm > 0;
  const points = insight.history
    .filter((p) => p.date >= addDays(TODAY, -91))
    .map((p) => ({ date: p.date, value: best1rmOf(p) }));
  const target = targetOf(insight.slug);
  return (
    <Card size="sm" className="gap-2 px-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/exercises/$slug"
          params={{ slug: insight.slug }}
          className="min-w-0 hover:underline"
        >
          <span className="block truncate font-medium" title={insight.name}>
            {insight.name}
          </span>
          <span className="text-muted-foreground text-xs">{insight.muscle}</span>
        </Link>
        <PinButton slug={insight.slug} className="-mt-1 -mr-2 shrink-0" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-2xl tabular-nums">
          {charged ? formatKg(Math.round(insight.best1rm)) : `${Math.max(...insight.history.flatMap((p) => p.sets.map((s) => s.reps)))} reps`}
        </span>
        <span className="text-muted-foreground text-xs">{charged ? "1RM estimé" : "record"}</span>
      </div>
      {charged && points.length > 1 && (
        <ChartContainer config={config} className="aspect-auto h-10 w-full">
          <LineChart data={points} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      )}
      <div className="flex flex-col gap-0.5 text-xs">
        {last && top && (
          <span className="text-muted-foreground tabular-nums">
            {setText(top)} · {formatDaysAgo(daysSince(last.date, TODAY)).toLowerCase()}
          </span>
        )}
        {insight.reach ? (
          <span className="font-medium tabular-nums">
            {setText(insight.reach.target)} bat ton record
          </span>
        ) : target !== undefined ? (
          <span className="tabular-nums">Cible {formatKg(target)}</span>
        ) : null}
      </div>
    </Card>
  );
}
```

- [ ] **Step 3 : variante A, `features/home/home-pinned.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePins } from "@/mocks/pins";
import { insightOf, useRecordEvents } from "../records/insights";
import { RecordRow } from "../records/record-row";
import { LiftCard } from "./lift-card";

/** Variante A (D277) : les épinglés en grille, les derniers records en colonne étroite. */
export function HomePinned() {
  const { slugs, isDefault } = usePins();
  const lifts = slugs.flatMap((s) => insightOf(s) ?? []);
  const events = useRecordEvents().slice(0, 8);
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-medium text-lg">Épinglés</h2>
          {isDefault && (
            <span className="text-muted-foreground text-xs">
              Vos exercices les plus faits ; la punaise choisit les vôtres
            </span>
          )}
        </div>
        <div className="grid gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
          {lifts.map((i) => (
            <LiftCard key={i.slug} insight={i} />
          ))}
        </div>
      </section>
      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Derniers records</CardTitle>
            <CardDescription>Un clic ouvre la séance</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/records">Tous</Link>
          </Button>
        </CardHeader>
        {events.map((e) => (
          <RecordRow key={e.id} event={e} />
        ))}
      </Card>
    </div>
  );
}
```

- [ ] **Step 4 : variante B, `features/home/home-feed.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKg, formatMinutes, formatWeekdayDay } from "@/lib/format";
import { usePins } from "@/mocks/pins";
import { useSessions } from "@/mocks/session-store";
import { insightOf, useRecordEvents } from "../records/insights";
import { setText } from "../records/record-row";
import { PinButton } from "../records/pin-button";

/** Variante B (D277) : les dernières séances résumées par leurs records ; les épinglés à droite. */
export function HomeFeed() {
  const sessions = useSessions().slice(0, 8);
  const events = useRecordEvents();
  const { slugs } = usePins();
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-lg">Dernières séances</h2>
        {sessions.map((s) => {
          const these = events.filter((e) => e.sessionId === s.id);
          return (
            <Link key={s.id} to="/history/$id" params={{ id: s.id }} className="group">
              <Card
                size="sm"
                className={
                  these.length === 0
                    ? "gap-0 px-4 text-muted-foreground transition-colors group-hover:bg-muted/40"
                    : "gap-2 px-4 transition-colors group-hover:bg-muted/40"
                }
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium first-letter:uppercase">
                    {s.routine} · {formatWeekdayDay(s.date)}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatMinutes(s.minutes)} · {formatKg(s.volume)}
                    {these.length === 0 && " · aucun record"}
                  </span>
                </div>
                {these.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <Trophy className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{insightOf(e.slug)?.name ?? e.slug}</span>
                    <span className="shrink-0 tabular-nums">{setText(e)}</span>
                  </div>
                ))}
              </Card>
            </Link>
          );
        })}
      </section>
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-3">
          <CardTitle>Épinglés</CardTitle>
        </CardHeader>
        {slugs.flatMap((slug) => {
          const i = insightOf(slug);
          if (!i) return [];
          return (
            <div key={slug} className="flex items-center gap-2 border-t py-2 pr-2 pl-4">
              <Link
                to="/exercises/$slug"
                params={{ slug }}
                className="flex min-w-0 flex-1 flex-col hover:underline"
              >
                <span className="truncate text-sm">{i.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {i.reach ? `${setText(i.reach.target)} bat le record` : i.best1rm > 0 ? `1RM ${formatKg(Math.round(i.best1rm))}` : i.muscle}
                </span>
              </Link>
              <PinButton slug={slug} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
```

- [ ] **Step 5 : variante C, `features/home/home-to-beat.tsx`**

```tsx
import { usePins } from "@/mocks/pins";
import { INSIGHTS, pinnedFirst } from "../records/insights";
import { ReachList, StalledList, TrendList } from "../records/lift-lists";

/** Variante C (D277) : à portée, en progression, en stagnation ; les épinglés en tête. */
export function HomeToBeat() {
  const { slugs } = usePins();
  const byTrend = [...INSIGHTS].sort((a, b) => (b.trend?.change ?? 0) - (a.trend?.change ?? 0));
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-3">
      <ReachList items={pinnedFirst(INSIGHTS, slugs)} limit={6} />
      <TrendList items={pinnedFirst(byTrend, slugs)} limit={6} />
      <StalledList items={pinnedFirst(INSIGHTS, slugs)} limit={6} />
    </div>
  );
}
```

- [ ] **Step 6 : la route, avec ses variantes**

`routes/_app.index.tsx` :

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { HomeFeed } from "@/features/home/home-feed";
import { HomePinned } from "@/features/home/home-pinned";
import { HomeEmpty, HomeSkeleton } from "@/features/home/home-states";
import { HomeToBeat } from "@/features/home/home-to-beat";
import { RecordsStrip } from "@/features/home/records-strip";

export const Route = createFileRoute("/_app/")({
  staticData: {
    crumb: "Accueil",
    proto: {
      variants: [
        { value: "a", label: "Épinglés" },
        { value: "b", label: "Fil des records" },
        { value: "c", label: "À battre" },
      ],
    },
  },
  component: HomePage,
});

/** L'Accueil parle de records (D277) : la ligne de tête, puis la variante choisie. */
function HomePage() {
  const { state, variant } = useProto();
  return (
    <Page
      title="Accueil"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/records">
            Tous les records <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      }
    >
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && (
        <>
          <RecordsStrip />
          {variant === "a" && <HomePinned />}
          {variant === "b" && <HomeFeed />}
          {variant === "c" && <HomeToBeat />}
        </>
      )}
    </Page>
  );
}
```

`HomeSkeleton` (dans `home-states.tsx`) devient la ligne de tête puis une grille :

```tsx
/** Chargement : la ligne de tête, puis une grille de cartes. */
export function HomeSkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 7 : ce qui part**

```bash
git rm apps/web/src/features/home/recent-lists.tsx apps/web/src/features/home/weight-card.tsx apps/web/src/mocks/records.ts
```

- [ ] **Step 8 : vérifier et commiter**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Captures de `/?v=a`, `/?v=b`, `/?v=c` et des trois autres états.
Sur `?v=a` : épingler un exercice depuis sa fiche, revenir : il est seul dans la grille ; le
désépingler : les six par défaut reviennent.

```bash
git add -A apps/web
git commit -m "feat(web): l'accueil parle de records, trois variantes (D277)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : Progression, vue d'ensemble ou une routine (D279)

**Files :**
- Create : `apps/web/src/mocks/routine-history.ts`, `apps/web/src/mocks/routine-history.test.ts`,
  `apps/web/src/features/progress/routine-progress.tsx`
- Modify : `apps/web/src/features/progress/progress-view.tsx`, `apps/web/src/routes/_app.progress.tsx`

**Interfaces :**
- Consomme : `sessionDetail`, `SessionDetail` (`mocks/history.ts`) ; `estimate1rm` ; `strengthTrend` ;
  `daysSince` ; `MockRoutine`.
- Produit :
  - `type RoutineRun = { id: string; date: string; minutes: number; volume: number; records: number; doneSets: number; plannedSets: number; completion: number }`
  - `routineRuns(routine: MockRoutine, details: RunSource[]): RoutineRun[]` (chronologique)
  - `runFrequency(runs: RoutineRun[]): { count: number; avgGapDays: number | null }`
  - `routineLifts(routine: MockRoutine, details: RunSource[]): { slug: string; points: { date: string; value: number }[]; change: number | null }[]`
  - `<RoutineProgress routineId={string} period={Period} onRoutine={(id: string) => void} />`
  - route `/progress` : recherche `{ routine?: string }`

- [ ] **Step 1 : les tests**

`apps/web/src/mocks/routine-history.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { routineLifts, routineRuns, runFrequency } from "./routine-history";
import type { MockRoutine } from "./routines";

const routine: MockRoutine = {
  id: "1",
  name: "Push",
  folder: "",
  lastDone: null,
  exercises: [
    {
      slug: "bench",
      restSeconds: 90,
      sets: [
        { kg: null, reps: 10, type: "warmup" },
        { kg: 80, reps: 5 },
        { kg: 80, reps: 5 },
      ],
    },
    { slug: "fly", restSeconds: 60, sets: [{ kg: 20, reps: 12 }] },
  ],
};

const run = (id: string, date: string, routineName: string, bench: [number, number][]) => ({
  session: { id, date, routine: routineName, minutes: 50, volume: 1000, records: 1 },
  exercises: [{ slug: "bench", sets: bench.map(([kg, reps]) => ({ kg, reps })) }],
});

const details = [
  run("c", "2026-10-15", "Push", [[85, 5], [85, 5]]),
  run("x", "2026-10-10", "Pull", [[50, 5]]),
  run("a", "2026-10-01", "Push", [[80, 5]]),
];

describe("routineRuns", () => {
  it("garde les séances de la routine, dans l'ordre chronologique, avec leur réalisation", () => {
    const runs = routineRuns(routine, details);
    expect(runs.map((r) => r.id)).toEqual(["a", "c"]);
    // 3 séries prévues hors échauffement ; 1 puis 2 faites.
    expect(runs.map((r) => r.completion)).toEqual([1 / 3, 2 / 3]);
  });
});

describe("runFrequency", () => {
  it("compte les séances et l'intervalle moyen", () => {
    expect(runFrequency(routineRuns(routine, details))).toEqual({ count: 2, avgGapDays: 14 });
  });
  it("pas d'intervalle sous deux séances", () => {
    expect(runFrequency([])).toEqual({ count: 0, avgGapDays: null });
  });
});

describe("routineLifts", () => {
  it("suit la meilleure série de chaque exercice d'une séance à l'autre", () => {
    const [bench, fly] = routineLifts(routine, details);
    expect(bench?.points.map((p) => p.date)).toEqual(["2026-10-01", "2026-10-15"]);
    expect(bench?.change).toBeCloseTo(6.3, 1);
    expect(fly).toEqual({ slug: "fly", points: [], change: null });
  });
});
```

Run : `pnpm --filter @better-lift/web test -- routine-history` → FAIL (module introuvable).

- [ ] **Step 2 : `mocks/routine-history.ts`**

```ts
import { estimate1rm } from "./exercise-stats";
import { strengthTrend } from "./progress";
import { daysSince } from "./routine-stats";
import type { MockRoutine } from "./routines";

/**
 * Les stats d'une routine (D279, D280), séance par séance : ce qui manquait au wireframe, qui
 * n'avait que des estimations. La routine est reconnue à son nom, comme dans l'historique.
 */

type RunSource = {
  session: { id: string; date: string; routine: string; minutes: number; volume: number; records: number };
  exercises: { slug: string; sets: { kg: number | null; reps: number }[] }[];
};

export type RoutineRun = {
  id: string;
  date: string;
  minutes: number;
  volume: number;
  records: number;
  doneSets: number;
  plannedSets: number;
  /** Séries faites sur séries prévues (hors échauffement), plafonné à 1. */
  completion: number;
};

const plannedSetsOf = (routine: MockRoutine) =>
  routine.exercises.reduce((n, e) => n + e.sets.filter((s) => s.type !== "warmup").length, 0);

/** Les séances de la routine, la plus ancienne d'abord. */
export function routineRuns(routine: MockRoutine, details: RunSource[]): RoutineRun[] {
  const planned = plannedSetsOf(routine);
  return details
    .filter((d) => d.session.routine === routine.name)
    .map((d) => {
      const done = d.exercises.reduce((n, e) => n + e.sets.length, 0);
      return {
        id: d.session.id,
        date: d.session.date,
        minutes: d.session.minutes,
        volume: d.session.volume,
        records: d.session.records,
        doneSets: done,
        plannedSets: planned,
        completion: planned > 0 ? Math.min(1, done / planned) : 1,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Combien de fois, et tous les combien de jours en moyenne. */
export function runFrequency(runs: RoutineRun[]) {
  const first = runs[0];
  const last = runs.at(-1);
  return {
    count: runs.length,
    avgGapDays:
      first && last && runs.length > 1
        ? Math.round(daysSince(first.date, last.date) / (runs.length - 1))
        : null,
  };
}

/** Pour chaque exercice de la routine : la meilleure série de chaque séance et son évolution. */
export function routineLifts(routine: MockRoutine, details: RunSource[]) {
  const runs = details
    .filter((d) => d.session.routine === routine.name)
    .sort((a, b) => a.session.date.localeCompare(b.session.date));
  const slugs = [...new Set(routine.exercises.map((e) => e.slug))];
  return slugs.map((slug) => {
    const points = runs.flatMap((d) => {
      const sets = d.exercises.find((e) => e.slug === slug)?.sets ?? [];
      const value = Math.max(0, ...sets.map((s) => estimate1rm(s.kg ?? 0, s.reps)));
      return value > 0 ? [{ date: d.session.date, value: Math.round(value * 10) / 10 }] : [];
    });
    return { slug, points, change: strengthTrend(points)?.change ?? null };
  });
}
```

Run : `pnpm --filter @better-lift/web test -- routine-history` → PASS.
(Contrôle du test : 80 × 5 → 93,3 ; 85 × 5 → 99,2 ; écart +6,3 %.)

- [ ] **Step 3 : `features/progress/routine-progress.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKg, formatMinutes, formatNumber, formatShortDay } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { sessionDetail } from "@/mocks/history";
import { inPeriod, type Period } from "@/mocks/progress";
import { routineLifts, routineRuns, runFrequency } from "@/mocks/routine-history";
import { useRoutines } from "@/mocks/routine-store";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

const volumeConfig = { volume: { label: "Volume", color: "var(--foreground)" } } satisfies ChartConfig;
const pct = (n: number) => `${Math.round(n * 100)} %`;
const signedPct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n))} %`;

/**
 * Une routine dans le temps (D279) : sa fréquence, son volume, sa durée et ses records séance par
 * séance, sa réalisation, et l'exercice qui la tire ou celui qui stagne.
 */
export function RoutineProgress({
  routineId,
  period,
  onRoutine,
}: {
  routineId: string;
  period: Period;
  onRoutine: (id: string) => void;
}) {
  const routines = useRoutines();
  const routine = routines.find((r) => r.id === routineId) ?? routines[0];
  const details = inPeriod(useSessions(), period, TODAY).map(sessionDetail);
  if (!routine) return null;
  const runs = routineRuns(routine, details);
  const freq = runFrequency(runs);
  const lifts = routineLifts(routine, details);
  const avg = (f: (r: (typeof runs)[number]) => number) =>
    runs.length ? runs.reduce((n, r) => n + f(r), 0) / runs.length : 0;
  const figures = [
    {
      label: "Séances",
      value: String(freq.count),
      hint: freq.avgGapDays ? `tous les ${freq.avgGapDays} j en moyenne` : "sur la période",
    },
    { label: "Durée moyenne", value: formatMinutes(Math.round(avg((r) => r.minutes))), hint: "par séance" },
    { label: "Réalisation", value: pct(avg((r) => r.completion)), hint: "séries faites / prévues" },
    { label: "Records", value: String(runs.reduce((n, r) => n + r.records, 0)), hint: "battus dans cette routine" },
  ];
  return (
    <>
      <Select value={routine.id} onValueChange={onRoutine}>
        <SelectTrigger aria-label="Routine" className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {routines.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {runs.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
          « {routine.name} » n'a pas été faite sur la période.
        </p>
      ) : (
        <>
          <Card size="sm">
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 @3xl:grid-cols-4">
              {figures.map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">{f.label}</span>
                  <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
                  <span className="text-muted-foreground text-xs">{f.hint}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Volume par séance</CardTitle>
              <CardDescription>Charge × répétitions des séries faites</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={volumeConfig} className="aspect-auto h-56 w-full">
                <LineChart data={runs} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={formatShortDay} minTickGap={32} />
                  <YAxis tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(d) => formatShortDay(String(d))}
                        formatter={(v) => formatKg(Number(v))}
                      />
                    }
                  />
                  <Line dataKey="volume" type="monotone" stroke="var(--color-volume)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <div className="grid items-start gap-4 @4xl:grid-cols-2">
            <Card className="gap-0 pb-0">
              <CardHeader className="pb-3">
                <CardTitle>Par exercice</CardTitle>
                <CardDescription>Meilleure série (1RM estimé), première et dernière séance</CardDescription>
              </CardHeader>
              {lifts.map((l) => (
                <Link
                  key={l.slug}
                  to="/exercises/$slug"
                  params={{ slug: l.slug }}
                  className="flex items-center gap-3 border-t px-4 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{exerciseBySlug(l.slug)?.name ?? l.slug}</span>
                  <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                    {l.points.at(-1) ? formatKg(Math.round(l.points.at(-1)?.value ?? 0)) : "sans charge"}
                  </span>
                  <Badge variant="outline" className="w-16 shrink-0 justify-center tabular-nums">
                    {l.change === null ? "—" : signedPct(l.change)}
                  </Badge>
                </Link>
              ))}
            </Card>
            <Card className="gap-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Séance</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="pr-4 text-right">Réalisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...runs].reverse().map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4">
                        <Link to="/history/$id" params={{ id: r.id }} className="hover:underline">
                          {formatShortDay(r.date)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMinutes(r.minutes)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(r.volume)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.records || "—"}</TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">{pct(r.completion)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 4 : la vue d'ensemble perd ses records**

Dans `features/progress/progress-view.tsx` :
- supprimer la fonction `RecentRecords` entière et son appel dans `ProgressView` ; la colonne de
  droite ne garde que `<Regularity … />` :

```tsx
      <div className="grid gap-4 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SetsPerMuscle sessions={current} period={period} />
        <Regularity sessions={sessions} period={period} />
      </div>
```

- retirer les imports devenus inutiles : `ArrowUpRight`, `Trophy`, `Button`, les `Sheet*`,
  `formatLoad`, `RecordsTable` ;
- dans `ProgressSkeleton`, la colonne de droite devient `<Skeleton className="h-40 rounded-xl" />`
  seule ;
- le commentaire de `ProgressView` : « … la force exercice par exercice, la dose par muscle et la
  régularité. Les records ont leur page (D278). »

- [ ] **Step 5 : la route `routes/_app.progress.tsx`**

Remplacer le fichier par :

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PeriodToggle } from "@/features/progress/period-toggle";
import { ProgressSkeleton, ProgressView } from "@/features/progress/progress-view";
import { RoutineProgress } from "@/features/progress/routine-progress";
import { inPeriod, type Period } from "@/mocks/progress";
import { useRoutines } from "@/mocks/routine-store";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

export const Route = createFileRoute("/_app/progress")({
  staticData: { crumb: "Progression" },
  // `?routine=` ouvre la vue Par routine sur cette routine (D279) ; sans lui, la vue d'ensemble.
  validateSearch: (search: Record<string, unknown>): { routine?: string } =>
    typeof search.routine === "string" && search.routine !== "" ? { routine: search.routine } : {},
  component: ProgressPage,
});

function ProgressPage() {
  const { state } = useProto();
  const { routine } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const sessions = useSessions();
  const routines = useRoutines();
  const [period, setPeriod] = useState<Period>("3m");

  // Par défaut, la routine la plus faite sur la période.
  const mostDone = () => {
    const counts = new Map<string, number>();
    for (const s of inPeriod(sessions, period, TODAY)) counts.set(s.routine, (counts.get(s.routine) ?? 0) + 1);
    const name = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return routines.find((r) => r.name === name)?.id ?? routines[0]?.id ?? "";
  };
  const setRoutine = (id: string | undefined) =>
    navigate({ search: (s) => ({ ...s, routine: id }), replace: true });

  return (
    <Page
      title="Progression"
      actions={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Vue"
            value={routine ? "routine" : "ensemble"}
            onValueChange={(v) => v && setRoutine(v === "routine" ? mostDone() : undefined)}
          >
            <ToggleGroupItem value="ensemble">Vue d'ensemble</ToggleGroupItem>
            <ToggleGroupItem value="routine">Par routine</ToggleGroupItem>
          </ToggleGroup>
          <PeriodToggle value={period} onChange={setPeriod} />
        </>
      }
    >
      {state === "chargement" && <ProgressSkeleton />}
      {state === "erreur" && <StateError title="La progression n'a pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp />
            </EmptyMedia>
            <EmptyTitle>Pas encore de quoi mesurer</EmptyTitle>
            <EmptyDescription>
              La force, la dose par muscle et la régularité apparaissent après quelques séances.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {state === "nominal" &&
        (routine ? (
          <RoutineProgress routineId={routine} period={period} onRoutine={setRoutine} />
        ) : (
          <ProgressView sessions={sessions} period={period} />
        ))}
    </Page>
  );
}
```

Si TypeScript refuse `search: (s) => ({ ...s, routine: id })` parce que le parent impose ses
propres clés, garder ce spread : il conserve `v`, `etat`, `onglet`.

- [ ] **Step 6 : vérifier et commiter**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Captures de `/progress` (plus de « Derniers records ») et de
`/progress?routine=1` puis de chaque routine Push, Pull, Legs ; un clic sur une ligne du tableau
ouvre la séance.

```bash
git add -A apps/web
git commit -m "feat(web): progression par routine, les records quittent la vue d'ensemble (D279)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : les stats d'une routine dans son détail (D280)

**Files :**
- Modify : `apps/web/src/features/routines/routine-overview.tsx`

**Interfaces :**
- Consomme : `routineRuns`, `runFrequency` (tâche 6) ; `sessionDetail` ; `useSessions` ; `strengthTrend`.

- [ ] **Step 1 : la carte Stats**

Dans `routine-overview.tsx`, ajouter les imports :

```tsx
import { Button } from "@/components/ui/button";
import { sessionDetail } from "@/mocks/history";
import { strengthTrend } from "@/mocks/progress";
import { routineRuns } from "@/mocks/routine-history";
import { addDays } from "@/mocks/stats";
```

(`formatKg`, `formatMinutes`, `Link`, `useSessions`, `TODAY`, `SummaryCard` et `SummaryRow` sont
déjà importés.)

Puis, avant `RoutineOverview`, la fonction :

```tsx
/**
 * La routine dans le temps, en bref (D280) : séances, volume moyen et sa tendance, records et
 * réalisation sur trois mois ; le détail s'ouvre dans Progression.
 */
function RoutineStats({ routine }: { routine: MockRoutine }) {
  const from = addDays(TODAY, -91);
  const details = useSessions()
    .filter((s) => s.date >= from)
    .map(sessionDetail);
  const runs = routineRuns(routine, details);
  if (runs.length === 0) return null;
  const avg = (f: (r: (typeof runs)[number]) => number) =>
    runs.reduce((n, r) => n + f(r), 0) / runs.length;
  const trend = strengthTrend(runs.map((r) => ({ date: r.date, value: r.volume })));
  const rows: SummaryRow[] = [
    { label: "Séances sur 3 mois", value: String(runs.length) },
    {
      label: "Volume moyen",
      value: formatKg(Math.round(avg((r) => r.volume))),
      delta: trend ? `${trend.change > 0 ? "+" : trend.change < 0 ? "−" : "±"}${Math.abs(Math.round(trend.change))} %` : undefined,
      hint: trend ? "de la première à la dernière" : undefined,
    },
    { label: "Durée moyenne", value: formatMinutes(Math.round(avg((r) => r.minutes))) },
    { label: "Records battus", value: String(runs.reduce((n, r) => n + r.records, 0)) },
    { label: "Réalisation", value: `${Math.round(avg((r) => r.completion) * 100)} %` },
  ];
  return (
    <div className="flex flex-col gap-2">
      <SummaryCard title="Stats" rows={rows} />
      <Button variant="outline" size="sm" asChild>
        <Link to="/progress" search={{ routine: routine.id }}>
          Analyser dans Progression
        </Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2 : la placer**

Dans `RoutineOverview`, juste après `<Summary routine={routine} saved={saved} />` :

```tsx
      {saved && <RoutineStats routine={saved} />}
```

`saved` n'existe que pour une routine enregistrée : la création n'a pas de stats.

- [ ] **Step 3 : vérifier et commiter**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Captures de `/routines/1` (carte Stats sous le résumé) et de
`/routines/new` (pas de carte) ; « Analyser dans Progression » ouvre `/progress?routine=1`.

```bash
git add -A apps/web
git commit -m "feat(web): les stats d'une routine dans son détail (D280)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : Corps, c'est le poids (D281)

**Files :**
- Modify : `apps/web/src/mocks/body.ts`, `apps/web/src/mocks/body.test.ts`,
  `apps/web/src/features/body/body-view.tsx`, `apps/web/src/routes/_app.body.tsx`

**Interfaces :**
- Produit : `relativeStrength(oneRm: number, bodyweight: number): number`,
  `weightAt(weights: readonly { date: string; kg: number }[], date: string): number | null`,
  `<EntryDialog open onOpenChange onWeight />`, `<BodyView period entering onEntering />`.

- [ ] **Step 1 : les tests**

Ajouter à `mocks/body.test.ts` (et `relativeStrength, weightAt` à son import) :

```ts
describe("relativeStrength", () => {
  it("rapporte le 1RM au poids de corps, à deux décimales", () => {
    expect(relativeStrength(92, 80)).toBe(1.15);
    expect(relativeStrength(92, 0)).toBe(0);
  });
});

describe("weightAt", () => {
  const weights = [
    { date: "2026-10-01", kg: 80 },
    { date: "2026-10-02", kg: 82 },
    { date: "2026-10-10", kg: 90 },
  ];
  it("moyenne les sept dernières pesées jusqu'à la date", () => {
    expect(weightAt(weights, "2026-10-05")).toBe(81);
  });
  it("rien avant la première pesée", () => {
    expect(weightAt(weights, "2026-09-01")).toBeNull();
  });
});
```

Run : `pnpm --filter @better-lift/web test -- body` → FAIL (exports absents).

- [ ] **Step 2 : `mocks/body.ts`**

Supprimer `type Measurement`, `series` et `mockMeasurements` (et l'import de `seeded` s'il ne sert
plus) ; ajouter :

```ts
/** Le 1RM estimé rapporté au poids de corps (D281), à deux décimales. */
export function relativeStrength(oneRm: number, bodyweight: number): number {
  return bodyweight > 0 ? Math.round((oneRm / bodyweight) * 100) / 100 : 0;
}

/** Le poids à une date : la moyenne des sept dernières pesées jusqu'à elle. */
export function weightAt(weights: readonly Weighing[], date: string): number | null {
  const upTo = weights.filter((w) => w.date <= date).slice(-7);
  return upTo.length ? upTo.reduce((n, w) => n + w.kg, 0) / upTo.length : null;
}
```

Run : `pnpm --filter @better-lift/web test -- body` → PASS.

- [ ] **Step 3 : `features/body/body-view.tsx` — les mensurations partent**

- Supprimer `MeasurementCard` entière et la `section` « Mensurations » de `BodyView`, ainsi que
  l'état `measurements` et `addMeasure`.
- Remplacer `export type Entry = "poids" | "mesure";` et `EntryDialog` par une saisie du poids
  seule :

```tsx
/** La pesée du jour : là dès l'état vide, pour la première pesée. */
export function EntryDialog({
  open,
  onOpenChange,
  onWeight,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onWeight: (kg: number) => void;
}) {
  const [value, setValue] = useState("");
  const number = parseKg(value);
  const valid = number !== null && number > 0;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setValue("");
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Noter mon poids</DialogTitle>
          <DialogDescription>Pour aujourd'hui, {formatWeekdayDay(TODAY)}.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="entry-value">Poids (kg)</FieldLabel>
            <Input
              id="entry-value"
              inputMode="decimal"
              autoFocus
              placeholder="79,4"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              if (number === null) return;
              onWeight(number);
              setValue("");
              onOpenChange(false);
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- Ajouter la carte de force relative, avant `BodyView` :

```tsx
/**
 * La force rapportée au poids (D281) : pour chaque exercice épinglé chargé, le meilleur 1RM estimé
 * divisé par le poids moyen, aujourd'hui et au début de la période.
 */
function RelativeStrength({ weights, period }: { weights: Weighing[]; period: Period }) {
  const { slugs } = usePins();
  const start = periodStart(period, TODAY);
  const nowWeight = weightAt(weights, TODAY);
  const thenWeight = weightAt(weights, start);
  const rows = slugs.flatMap((slug) => {
    const history = exerciseHistory(slug);
    const best = (until: string) =>
      Math.max(0, ...history.filter((p) => p.date <= until).map(best1rmOf));
    const now = nowWeight ? relativeStrength(best(TODAY), nowWeight) : 0;
    if (now === 0) return [];
    const then = thenWeight ? relativeStrength(best(start), thenWeight) : 0;
    return [{ slug, name: exerciseBySlug(slug)?.name ?? slug, now, delta: then > 0 ? now - then : null }];
  });
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>Force relative</CardTitle>
        <CardDescription>1RM estimé des épinglés, en fois le poids de corps</CardDescription>
      </CardHeader>
      {rows.length === 0 ? (
        <p className="border-t px-4 py-6 text-center text-muted-foreground text-sm">
          Épinglez un exercice chargé pour voir sa force relative.
        </p>
      ) : (
        rows.map((r) => (
          <div key={r.slug} className="flex items-center gap-3 border-t px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
            <span className="shrink-0 font-medium text-sm tabular-nums">
              {formatPrecise(r.now)} × PDC
            </span>
            <span className="w-24 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
              {r.delta === null ? "—" : `${signed(r.delta, "")} sur la période`}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}
```

  Imports à ajouter : `usePins` (`@/mocks/pins`), `exerciseHistory`, `best1rmOf`, `exerciseBySlug`,
  `periodStart` (rejoint l'import de `@/mocks/progress`), `relativeStrength` et `weightAt` (rejoignent
  celui de `@/mocks/body`), `formatPrecise` (rejoint `@/lib/format`). Retirer `Plus`, `Select*`,
  `Badge` et `Measurement` / `mockMeasurements` s'ils ne servent plus (Biome et typecheck le disent).
  `signed(n, "")` rend « +0,1 » : il existe déjà en tête du fichier.

- `BodyView` devient :

```tsx
/**
 * Corps (D281), une seule page : à gauche le poids (bandeau, courbe sur la période) puis la force
 * relative ; à droite le journal des pesées. Le wireframe tient tout en mémoire.
 */
export function BodyView({
  period,
  entering,
  onEntering,
}: {
  period: Period;
  entering: boolean;
  onEntering: (open: boolean) => void;
}) {
  const [weights, setWeights] = useState<Weighing[]>(mockWeights);
  const addWeight = (kg: number) => {
    setWeights((w) => [...w.filter((x) => x.date !== TODAY), { date: TODAY, kg }]);
    toast.success(`${formatKg(kg)} noté pour aujourd'hui`);
  };
  return (
    <>
      <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <WeightFigures weights={weights} />
          <WeightChart weights={weights} period={period} />
          <RelativeStrength weights={weights} period={period} />
        </div>
        <WeightJournal weights={weights} onChange={setWeights} />
      </div>
      <EntryDialog open={entering} onOpenChange={onEntering} onWeight={addWeight} />
    </>
  );
}
```

- Dans `BodySkeleton`, remplacer la grille de quatre mesures par `<Skeleton className="h-48 rounded-xl" />`.

- [ ] **Step 4 : la route `routes/_app.body.tsx`**

- `import { BodySkeleton, BodyView, EntryDialog } from "@/features/body/body-view";` (plus d'`Entry`) ;
- `const [entering, setEntering] = useState(false);` remplace l'état `entry` ;
- les deux boutons « Noter mon poids » : `onClick={() => setEntering(true)}` ;
- `<BodyView period={period} entering={entering} onEntering={setEntering} />` ;
- hors nominal :

```tsx
      {state !== "nominal" && (
        <EntryDialog
          open={entering}
          onOpenChange={setEntering}
          onWeight={(kg) => toast.success(`${formatKg(kg)} noté pour aujourd'hui`)}
        />
      )}
```

- le commentaire de `BodyPage` : « Corps (D281) : le poids, sur une page ; la période et la pesée en tête. »

- [ ] **Step 5 : vérifier et commiter**

Run : `pnpm --filter @better-lift/web typecheck && pnpm --filter @better-lift/web test && pnpm --filter @better-lift/web build && pnpm lint && pnpm knip`
Expected : tout passe. Captures de `/body` dans les quatre états : plus de mensurations, la carte
« Force relative » liste les épinglés chargés.

```bash
git add -A apps/web
git commit -m "feat(web): corps recentré sur le poids, force relative (D281)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9 : documentation et vérification finale

**Files :**
- Modify : `docs/superpowers/specs/2026-10-16-web-wireframe-design.md`,
  `docs/superpowers/specs/2026-10-18-web-records-design.md`

- [ ] **Step 1 : renvois dans le wireframe**

En tête des § 4.2 (Accueil), 4.3 (Planning), 4.7 (Progression) et 4.8 (Corps) du wireframe, une
ligne :

```markdown
> Révisé le 2026-10-18 par [`2026-10-18-web-records-design.md`](2026-10-18-web-records-design.md) (D274–D281).
```

Dans le schéma de la coquille (§ 3), remplacer la ligne `│ ▦ Planning` par rien et ajouter
`│ ★ Records` en tête du groupe ANALYSE.

- [ ] **Step 2 : avancement dans la spec records**

Ajouter à la fin de la § 4 de `2026-10-18-web-records-design.md` :

```markdown
**Avancement** : les sept étapes sont faites (2026-10-18). Reste ouvert le choix d'une variante
de l'Accueil (A, B ou C).
```

- [ ] **Step 3 : la vérification complète**

Run : `pnpm build && pnpm typecheck && pnpm test && pnpm lint && pnpm knip`
Expected : tout passe, sur tout le dépôt.

- [ ] **Step 4 : commit**

```bash
git add docs/superpowers/specs
git commit -m "docs: wireframe renvoie aux décisions records (D274–D281)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
