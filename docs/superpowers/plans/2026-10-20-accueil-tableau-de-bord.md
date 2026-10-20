# Accueil du web : tableau de bord — plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** remplacer l'Accueil vide du web (`/app/`) par un tableau de bord « bilan d'abord » :
chiffres clés sur une période, semaine en cours, tendance, muscles, records récents, dernières
séances.

**Architecture:** l'API rend, depuis une date, les **faits** de chaque séance (volume, séries,
séries par zone, muscles, records battus) avec le total de toujours, l'objectif hebdomadaire et
la routine à suivre (`GET /tableau-de-bord?depuis=`). Le web agrège ces faits **dans son
fuseau** avec des fonctions pures de `shared` (`tableau-de-bord.ts`). La page se dessine d'abord
sur une fixture, se valide à l'écran, puis se branche.

**Tech Stack:** Hono RPC, Prisma, Zod 4.6.5, React 19.2.3, TanStack Router/Query, shadcn
(`card`, `toggle-group`, `chart` sur Recharts 3.8.0, `empty`, `skeleton`), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-accueil-tableau-de-bord-design.md`

## Global Constraints

- Tout en français : interface, commentaires, commits (Conventional Commits, sujet en
  minuscule, ≤ 100 caractères).
- `packages/shared` : TypeScript pur — ni Prisma, ni React, ni API de plateforme (`Intl` toléré).
- Toute route de données personnelles passe par `exigerSession` ; le service reçoit `userId`.
  Toute erreur répond `{ erreur }`. Chaque `c.json` porte un code explicite, et chaque code a
  son test (D295).
- Dates découpées **dans le fuseau** (`cleJour`), jamais en UTC.
- Toute charge affichée passe par `formaterCharge` / `formatLoad` ; le fuseau du web vient de
  `lib/locale.ts` seul.
- Records et totaux dérivés à la lecture, jamais stockés.
- Une feature web n'importe pas une autre feature (D306).
- Clés TanStack : toute donnée de la clé de lecture doit être couverte par l'invalidation.
- Wireframe gris : aucun token, aucune couleur nouvelle ; la couleur ne porte jamais seule un
  sens.
- Quatre états par page, forçables par `?etat=`.
- Une tâche finie : `/verif` vert (build, typecheck, test, lint, knip) et l'écran vu.

## Fichiers

| Fichier | Rôle |
|---|---|
| `packages/shared/src/tableau-de-bord.ts` (créé) | Contrat (`FaitSeance`, `TableauDeBord`, `requeteTableauDeBord`, `PERIODES`) et agrégats purs |
| `packages/shared/src/tableau-de-bord.test.ts` (créé) | Tests des agrégats (fuseau, intervalles vides, écarts, records) |
| `packages/shared/src/index.ts` | Exports |
| `apps/api/src/services/tableau-de-bord.ts` (créé) | Lecture Prisma → `TableauDeBord` (réutilise `versDetail`, `historique`) |
| `apps/api/src/services/seances.ts` | Exporte `historique`, `LECTURE_SEANCE` |
| `apps/api/src/routes/tableau-de-bord.ts` (créé) + `.test.ts` | Route `GET /?depuis=` |
| `apps/api/src/app.ts` | Monte `/tableau-de-bord` |
| `apps/web/src/features/home/fixture.ts` (créé, retiré en tâche 4) | Données factices typées |
| `apps/web/src/features/home/home-page.tsx` (créé) | La page : en-tête, états, grille |
| `apps/web/src/features/home/kpi-cards.tsx` (créé) | Les quatre chiffres clés |
| `apps/web/src/features/home/this-week.tsx` (créé) | Semaine en cours, objectif, routine à suivre |
| `apps/web/src/features/home/trend-chart.tsx` (créé) | Histogramme séances / volume |
| `apps/web/src/features/home/muscles-card.tsx` (créé) | Barres par zone + `BodyMap` |
| `apps/web/src/features/home/recent-lists.tsx` (créé) | Records récents, dernières séances |
| `apps/web/src/features/home/home-skeleton.tsx` (créé) | Squelette de chargement |
| `apps/web/src/features/home/queries.ts` (créé, tâche 4) | `tableauDeBordQuery(depuis)` |
| `apps/web/src/routes/_app.index.tsx` | `validateSearch` (`periode`), préchargement, rendu |
| `apps/web/src/features/history/queries.ts` | Supprimer une séance invalide `["tableau-de-bord"]` |
| `apps/web/e2e/accueil.spec.ts` (créé) | La page s'affiche, la période change |
| `docs/decisions.md`, `docs/conception.md`, `.claude/rules/interface-web.md` | Tâche 5 |

---

### Task 1: le contrat et les agrégats dans `shared`

**Files:**
- Create: `packages/shared/src/tableau-de-bord.ts`
- Create: `packages/shared/src/tableau-de-bord.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Produces:
  - `PERIODES = ["4s", "3m", "1a"] as const`, `type Periode`, `LIBELLE_PERIODE: Record<Periode, string>`
  - `requeteTableauDeBord` (Zod : `{ depuis: ISO datetime }`)
  - `type FaitSeance`, `type RecordSeance`, `type TableauDeBord`
  - `bornesPeriode(periode: Periode, maintenant: Date, fuseau: string): Bornes`
  - `type Bornes = { unite: "semaine" | "mois"; intervalles: string[]; debut: string; precedente: string }`
  - `depuisPour(bornes: Bornes): string` (ISO à passer à l'API)
  - `chiffresCles(seances, bornes, fuseau): ChiffresCles`
  - `semaineEnCours(seances, maintenant, fuseau): { jours: boolean[]; seances: number }`
  - `tendance(seances, bornes, fuseau): { debut: string; seances: number; volumeKg: number }[]`
  - `repartitionMuscles(seances, bornes, fuseau): { zones: { zone: Zone; series: number }[]; principaux: string[]; secondaires: string[] }`
  - `recordsRecents(seances, bornes, fuseau, n): (RecordSeance & { date: string; seanceId: string })[]`

- [ ] **Step 1: écrire les tests**

```ts
// packages/shared/src/tableau-de-bord.test.ts
import { describe, expect, it } from "vitest";
import {
  bornesPeriode,
  chiffresCles,
  depuisPour,
  type FaitSeance,
  recordsRecents,
  repartitionMuscles,
  requeteTableauDeBord,
  semaineEnCours,
  tendance,
} from "./tableau-de-bord.js";

const PARIS = "Europe/Paris";
// Mercredi 15 octobre 2026, 10 h à Paris.
const MAINTENANT = new Date("2026-10-15T08:00:00.000Z");

const seance = (debut: string, p: Partial<FaitSeance> = {}): FaitSeance => ({
  id: debut,
  nom: "Push",
  debut,
  fin: debut,
  seriesFaites: 10,
  volumeKg: 1000,
  seriesParZone: { chest: 6, triceps: 4 },
  muscles: { principaux: ["Pectoraux", "Triceps"], secondaires: ["Épaules"] },
  records: [],
  ...p,
});

describe("bornesPeriode", () => {
  it("4 semaines : du lundi d'il y a 3 semaines, précédente 4 semaines avant", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    expect(b.unite).toBe("semaine");
    expect(b.intervalles).toEqual(["2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"]);
    expect(b.debut).toBe("2026-09-21");
    expect(b.precedente).toBe("2026-08-24");
  });

  it("3 mois : 13 semaines", () => {
    const b = bornesPeriode("3m", MAINTENANT, PARIS);
    expect(b.intervalles).toHaveLength(13);
    expect(b.intervalles.at(-1)).toBe("2026-10-12");
    expect(b.debut).toBe("2026-07-20");
  });

  it("1 an : 12 mois, du 1er du mois", () => {
    const b = bornesPeriode("1a", MAINTENANT, PARIS);
    expect(b.unite).toBe("mois");
    expect(b.intervalles[0]).toBe("2025-11-01");
    expect(b.intervalles.at(-1)).toBe("2026-10-01");
    expect(b.precedente).toBe("2024-11-01");
  });

  it("découpe dans le fuseau : dimanche 23 h à Paris reste dimanche", () => {
    // Lundi 12 octobre 0 h 30 à Paris = dimanche 11 octobre 22 h 30 UTC.
    const b = bornesPeriode("4s", new Date("2026-10-11T22:30:00.000Z"), PARIS);
    expect(b.intervalles.at(-1)).toBe("2026-10-12");
  });
});

describe("depuisPour", () => {
  it("prend un jour de marge avant la période précédente, en ISO", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    expect(depuisPour(b)).toBe("2026-08-23T00:00:00.000Z");
    expect(requeteTableauDeBord.parse({ depuis: depuisPour(b) })).toBeTruthy();
  });
});

describe("chiffresCles", () => {
  const b = bornesPeriode("4s", MAINTENANT, PARIS);
  it("compte la période et la précédente, en ignorant la marge", () => {
    const c = chiffresCles(
      [
        seance("2026-10-14T17:00:00.000Z", { records: [{ slug: "b", nom: "B", types: ["CHARGE"], reps: 5, chargeKg: 100 }] }),
        seance("2026-09-22T17:00:00.000Z"),
        seance("2026-09-01T17:00:00.000Z", { volumeKg: 500, seriesFaites: 4 }),
        seance("2026-08-23T17:00:00.000Z"), // la marge : hors des deux périodes
      ],
      b,
      PARIS,
    );
    expect(c.actuelle).toEqual({ seances: 2, volumeKg: 2000, series: 20, records: 1 });
    expect(c.precedente).toEqual({ seances: 1, volumeKg: 500, series: 4, records: 0 });
  });

  it("sans séance dans la période précédente, `precedente` est null", () => {
    const c = chiffresCles([seance("2026-10-14T17:00:00.000Z")], b, PARIS);
    expect(c.precedente).toBeNull();
  });
});

describe("semaineEnCours", () => {
  it("marque les jours entraînés du lundi au dimanche, dans le fuseau", () => {
    const s = semaineEnCours(
      [seance("2026-10-12T17:00:00.000Z"), seance("2026-10-14T21:30:00.000Z"), seance("2026-10-05T17:00:00.000Z")],
      MAINTENANT,
      PARIS,
    );
    // Mardi 14 octobre 21 h 30 UTC = mercredi 15 à 23 h 30 à Paris.
    expect(s.jours).toEqual([true, false, true, false, false, false, false]);
    expect(s.seances).toBe(2);
  });
});

describe("tendance", () => {
  it("rend chaque intervalle, vides compris", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    const t = tendance([seance("2026-10-14T17:00:00.000Z"), seance("2026-09-22T17:00:00.000Z")], b, PARIS);
    expect(t).toEqual([
      { debut: "2026-09-21", seances: 1, volumeKg: 1000 },
      { debut: "2026-09-28", seances: 0, volumeKg: 0 },
      { debut: "2026-10-05", seances: 0, volumeKg: 0 },
      { debut: "2026-10-12", seances: 1, volumeKg: 1000 },
    ]);
  });

  it("par mois sur un an", () => {
    const b = bornesPeriode("1a", MAINTENANT, PARIS);
    const t = tendance([seance("2026-10-01T17:00:00.000Z")], b, PARIS);
    expect(t).toHaveLength(12);
    expect(t.at(-1)).toEqual({ debut: "2026-10-01", seances: 1, volumeKg: 1000 });
  });
});

describe("repartitionMuscles", () => {
  it("additionne les séries par zone sur la période, triées, et réunit les muscles", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    const m = repartitionMuscles(
      [
        seance("2026-10-14T17:00:00.000Z"),
        seance("2026-10-13T17:00:00.000Z", {
          seriesParZone: { quadriceps: 8 },
          muscles: { principaux: ["Quadriceps"], secondaires: ["Fessiers", "Pectoraux"] },
        }),
        seance("2026-09-01T17:00:00.000Z", { seriesParZone: { biceps: 30 } }), // hors période
      ],
      b,
      PARIS,
    );
    expect(m.zones).toEqual([
      { zone: "quadriceps", series: 8 },
      { zone: "chest", series: 6 },
      { zone: "triceps", series: 4 },
    ]);
    expect(m.principaux).toEqual(["Pectoraux", "Triceps", "Quadriceps"]);
    // Un muscle principal ailleurs n'est pas aussi secondaire.
    expect(m.secondaires).toEqual(["Épaules", "Fessiers"]);
  });
});

describe("recordsRecents", () => {
  it("rend les n derniers records de la période, datés", () => {
    const b = bornesPeriode("4s", MAINTENANT, PARIS);
    const r1 = { slug: "a", nom: "A", types: ["CHARGE" as const], reps: 5, chargeKg: 100 };
    const r2 = { slug: "b", nom: "B", types: ["REPS" as const], reps: 12, chargeKg: null };
    const r = recordsRecents(
      [
        seance("2026-10-14T17:00:00.000Z", { records: [r1, r2] }),
        seance("2026-09-01T17:00:00.000Z", { records: [r1] }), // hors période
      ],
      b,
      PARIS,
      1,
    );
    expect(r).toEqual([{ ...r1, date: "2026-10-14T17:00:00.000Z", seanceId: "2026-10-14T17:00:00.000Z" }]);
  });
});
```

- [ ] **Step 2: les lancer, ils échouent** (module absent)

Run: `pnpm --filter @better-lift/shared exec vitest run src/tableau-de-bord.test.ts`
Expected: FAIL, « Failed to resolve import "./tableau-de-bord.js" ».

- [ ] **Step 3: écrire le module**

```ts
// packages/shared/src/tableau-de-bord.ts
import { z } from "zod";
import { cleJour } from "./calendar.js";
import type { Zone } from "./muscles.js";
import type { TypeRecord } from "./records.js";

/**
 * Le tableau de bord de l'Accueil du web (D330). L'API rend les FAITS de chaque séance depuis
 * une date ; ce module les agrège dans le fuseau de l'appelant — le samedi 21 h à Paris est
 * déjà dimanche en UTC. Tout se dérive à la lecture (D58).
 */

export const PERIODES = ["4s", "3m", "1a"] as const;
export type Periode = (typeof PERIODES)[number];
export const LIBELLE_PERIODE: Record<Periode, string> = {
  "4s": "4 sem.",
  "3m": "3 mois",
  "1a": "1 an",
};

export const requeteTableauDeBord = z.object({ depuis: z.iso.datetime() });

/** Une série qui a battu au moins un record, à ce moment-là (D64). */
export type RecordSeance = {
  slug: string;
  nom: string;
  types: TypeRecord[];
  reps: number | null;
  chargeKg: number | null;
};

export type FaitSeance = {
  id: string;
  nom: string;
  debut: string;
  fin: string;
  seriesFaites: number;
  volumeKg: number;
  /** Séries faites hors échauffement, comptées pour la zone du muscle principal. */
  seriesParZone: Partial<Record<Zone, number>>;
  /** Les muscles du catalogue, pour la carte du corps du web. */
  muscles: { principaux: string[]; secondaires: string[] };
  records: RecordSeance[];
};

export type TableauDeBord = {
  /** Depuis `depuis`, la plus récente d'abord. */
  seances: FaitSeance[];
  /** Les séances de toujours : 0 = jamais de séance, état vide. */
  total: number;
  objectifHebdo: number | null;
  routineASuivre: { id: string; nom: string } | null;
};

export type Bornes = {
  unite: "semaine" | "mois";
  /** Le premier jour civil de chaque intervalle, du plus ancien à celui en cours. */
  intervalles: string[];
  /** Le premier jour de la période. */
  debut: string;
  /** Le premier jour de la période précédente, de même longueur. */
  precedente: string;
};

const JOUR_MS = 86_400_000;
const enMs = (jour: string) => Date.parse(`${jour}T00:00:00.000Z`);
const enJour = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const moisDecale = (jour: string, n: number) => {
  const d = new Date(enMs(jour));
  return enJour(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
};

/** Les intervalles de la période, découpés dans le fuseau. */
export function bornesPeriode(periode: Periode, maintenant: Date, fuseau: string): Bornes {
  const aujourdhui = cleJour(maintenant.toISOString(), fuseau);
  if (periode === "1a") {
    const mois = `${aujourdhui.slice(0, 7)}-01`;
    const intervalles = Array.from({ length: 12 }, (_, i) => moisDecale(mois, i - 11));
    const debut = intervalles[0] ?? mois;
    return { unite: "mois", intervalles, debut, precedente: moisDecale(debut, -12) };
  }
  const n = periode === "4s" ? 4 : 13;
  // getUTCDay : 0 = dimanche. On veut 0 = lundi.
  const rang = (new Date(enMs(aujourdhui)).getUTCDay() + 6) % 7;
  const lundi = enMs(aujourdhui) - rang * JOUR_MS;
  const intervalles = Array.from({ length: n }, (_, i) => enJour(lundi - (n - 1 - i) * 7 * JOUR_MS));
  const debut = intervalles[0] ?? enJour(lundi);
  return { unite: "semaine", intervalles, debut, precedente: enJour(enMs(debut) - n * 7 * JOUR_MS) };
}

/**
 * L'instant à demander à l'API : un jour avant la période précédente, à minuit UTC. La marge
 * couvre tout décalage de fuseau ; ce qui la tombe est écarté à l'agrégation.
 */
export const depuisPour = (b: Bornes) => new Date(enMs(b.precedente) - JOUR_MS).toISOString();

const jour = (s: FaitSeance, fuseau: string) => cleJour(s.debut, fuseau);
const dans = (s: FaitSeance, b: Bornes, fuseau: string) => jour(s, fuseau) >= b.debut;
const avant = (s: FaitSeance, b: Bornes, fuseau: string) => {
  const j = jour(s, fuseau);
  return j >= b.precedente && j < b.debut;
};

export type Chiffres = { seances: number; volumeKg: number; series: number; records: number };
export type ChiffresCles = { actuelle: Chiffres; precedente: Chiffres | null };

function compter(seances: readonly FaitSeance[]): Chiffres {
  return {
    seances: seances.length,
    volumeKg: Math.round(seances.reduce((v, s) => v + s.volumeKg, 0)),
    series: seances.reduce((n, s) => n + s.seriesFaites, 0),
    records: seances.reduce((n, s) => n + s.records.length, 0),
  };
}

/** La période et la précédente ; sans séance dans la précédente, pas de comparaison. */
export function chiffresCles(
  seances: readonly FaitSeance[],
  b: Bornes,
  fuseau: string,
): ChiffresCles {
  const precedentes = seances.filter((s) => avant(s, b, fuseau));
  return {
    actuelle: compter(seances.filter((s) => dans(s, b, fuseau))),
    precedente: precedentes.length > 0 ? compter(precedentes) : null,
  };
}

/** Les sept jours de la semaine en cours, lundi d'abord, et ses séances. */
export function semaineEnCours(seances: readonly FaitSeance[], maintenant: Date, fuseau: string) {
  const lundi = bornesPeriode("4s", maintenant, fuseau).intervalles.at(-1) ?? "";
  const jours = Array.from({ length: 7 }, () => false);
  let n = 0;
  for (const s of seances) {
    const ecart = Math.round((enMs(jour(s, fuseau)) - enMs(lundi)) / JOUR_MS);
    if (ecart < 0 || ecart > 6) continue;
    jours[ecart] = true;
    n++;
  }
  return { jours, seances: n };
}

/** Séances et volume par intervalle, chacun présent même vide. */
export function tendance(seances: readonly FaitSeance[], b: Bornes, fuseau: string) {
  const points = b.intervalles.map((debut) => ({ debut, seances: 0, volumeKg: 0 }));
  for (const s of seances) {
    const j = jour(s, fuseau);
    if (j < b.debut) continue;
    // Le dernier intervalle commencé au plus tard ce jour-là.
    let i = -1;
    b.intervalles.forEach((d, k) => {
      if (d <= j) i = k;
    });
    const point = points[i];
    if (!point) continue;
    point.seances++;
    point.volumeKg = Math.round(point.volumeKg + s.volumeKg);
  }
  return points;
}

/** Les séries par zone sur la période, triées ; les muscles réunis pour le dessin. */
export function repartitionMuscles(seances: readonly FaitSeance[], b: Bornes, fuseau: string) {
  const parZone = new Map<Zone, number>();
  const principaux = new Set<string>();
  const secondaires = new Set<string>();
  for (const s of seances.filter((x) => dans(x, b, fuseau))) {
    for (const [zone, n] of Object.entries(s.seriesParZone) as [Zone, number][]) {
      parZone.set(zone, (parZone.get(zone) ?? 0) + n);
    }
    for (const m of s.muscles.principaux) principaux.add(m);
    for (const m of s.muscles.secondaires) secondaires.add(m);
  }
  return {
    zones: [...parZone]
      .map(([zone, series]) => ({ zone, series }))
      .sort((a, b2) => b2.series - a.series),
    principaux: [...principaux],
    secondaires: [...secondaires].filter((m) => !principaux.has(m)),
  };
}

/** Les `n` derniers records battus sur la période, la séance la plus récente d'abord. */
export function recordsRecents(
  seances: readonly FaitSeance[],
  b: Bornes,
  fuseau: string,
  n: number,
) {
  return seances
    .filter((s) => dans(s, b, fuseau))
    .flatMap((s) => s.records.map((r) => ({ ...r, date: s.debut, seanceId: s.id })))
    .slice(0, n);
}
```

Note : `seances` arrivent triées par l'API, la plus récente d'abord ; `recordsRecents` s'appuie
sur cet ordre.

- [ ] **Step 4: exporter**

Dans `packages/shared/src/index.ts`, à l'ordre alphabétique des modules :

```ts
export {
  bornesPeriode,
  type Bornes,
  type ChiffresCles,
  chiffresCles,
  depuisPour,
  type FaitSeance,
  LIBELLE_PERIODE,
  PERIODES,
  type Periode,
  type RecordSeance,
  recordsRecents,
  repartitionMuscles,
  requeteTableauDeBord,
  semaineEnCours,
  type TableauDeBord,
  tendance,
} from "./tableau-de-bord.js";
```

- [ ] **Step 5: lancer les tests, ils passent**

Run: `pnpm --filter @better-lift/shared exec vitest run src/tableau-de-bord.test.ts`
Expected: PASS (12 tests). Puis `pnpm --filter @better-lift/shared typecheck`.

- [ ] **Step 6: commit**

```bash
git add packages/shared/src/tableau-de-bord.ts packages/shared/src/tableau-de-bord.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): agrégats du tableau de bord de l'accueil"
```

---

### Task 2: dessiner la page sur une fixture (point d'arrêt : validation à l'écran)

**Files:**
- Create: `apps/web/src/features/home/fixture.ts`, `home-page.tsx`, `kpi-cards.tsx`,
  `this-week.tsx`, `trend-chart.tsx`, `muscles-card.tsx`, `recent-lists.tsx`,
  `home-skeleton.tsx`
- Modify: `apps/web/src/routes/_app.index.tsx`

**Interfaces:**
- Consumes: tout le module de la tâche 1 ; `BodyMap({ primary, secondary })`, `Page`,
  `etatAffiche`, `useEtat`, `StateError`, `formatKg`, `formatLoad`, `formatDelta`,
  `formatShortDay`, `formatMonth`, `formatMinutes`, `plural`, `jourCivil`, `LIBELLE_ZONE`,
  `LIBELLE_RECORD`.
- Produces: `HomePage({ periode, donnees, requete })` où `requete: { isPending: boolean;
  isError: boolean; refetch: () => void }` ; `validateSearch` de la route rend
  `{ periode: Periode }` (défaut `"3m"`).

- [ ] **Step 1: la fixture** — `fixture.ts` exporte `FIXTURE: TableauDeBord` : 30 séances
  réparties sur les 26 dernières semaines (Push / Pull / Jambes en alternance, 3 par semaine
  sauf deux semaines creuses), volumes 6 000 à 11 000 kg, `seriesParZone` cohérentes avec le
  nom, quatre séances avec 1 à 2 records, `total: 30`, `objectifHebdo: 3`,
  `routineASuivre: { id: "r-pull", nom: "Pull A" }`. Les dates sont **calculées depuis
  `new Date()`** (pour rester dans la période quel que soit le jour) :

```ts
import type { FaitSeance, TableauDeBord } from "@better-lift/shared";

const JOUR = 86_400_000;
const NOMS = ["Push A", "Pull A", "Jambes"] as const;
const ZONES: Record<(typeof NOMS)[number], FaitSeance["seriesParZone"]> = {
  "Push A": { chest: 8, deltoids: 5, triceps: 4 },
  "Pull A": { "upper-back": 9, biceps: 5, trapezius: 2 },
  Jambes: { quadriceps: 8, hamstring: 5, gluteal: 4, calves: 3 },
};
const MUSCLES: Record<(typeof NOMS)[number], FaitSeance["muscles"]> = {
  "Push A": { principaux: ["Pectoraux", "Épaules", "Triceps"], secondaires: ["Avant-bras"] },
  "Pull A": { principaux: ["Grand dorsal", "Biceps", "Trapèzes"], secondaires: ["Avant-bras"] },
  Jambes: { principaux: ["Quadriceps", "Ischio-jambiers", "Fessiers", "Mollets"], secondaires: [] },
};

/** Données factices du dessin (tâche 2) ; retirées au branchement (tâche 4). */
export const FIXTURE: TableauDeBord = (() => {
  const maintenant = Date.now();
  const seances: FaitSeance[] = [];
  for (let i = 0; i < 30; i++) {
    const semaine = Math.floor(i / 3);
    if (semaine === 4 || semaine === 7) continue; // deux semaines creuses
    const nom = NOMS[i % 3] ?? "Push A";
    const debut = new Date(maintenant - (semaine * 7 + (i % 3) * 2 + 1) * JOUR).toISOString();
    const volumeKg = 6000 + ((i * 1337) % 5000);
    const seriesFaites = Object.values(ZONES[nom]).reduce((a, b) => a + (b ?? 0), 0);
    seances.push({
      id: `s-${i}`,
      nom,
      debut,
      fin: new Date(Date.parse(debut) + (55 + (i % 4) * 5) * 60_000).toISOString(),
      seriesFaites,
      volumeKg,
      seriesParZone: ZONES[nom],
      muscles: MUSCLES[nom],
      records:
        i % 7 === 0
          ? [{ slug: "barbell-bench-press", nom: "Développé couché à la barre", types: ["CHARGE"], reps: 5, chargeKg: 90 + i }]
          : [],
    });
  }
  return { seances, total: seances.length, objectifHebdo: 3, routineASuivre: { id: "r-pull", nom: "Pull A" } };
})();
```

- [ ] **Step 2: la route** — `_app.index.tsx` :

```tsx
import { PERIODES, type Periode } from "@better-lift/shared";
import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/home/home-page";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  // La période vit dans l'URL : elle survit au rechargement et au retour (D330).
  validateSearch: (s: Record<string, unknown>): { periode: Periode } => ({
    periode: PERIODES.includes(s.periode as Periode) ? (s.periode as Periode) : "3m",
  }),
  component: function Accueil() {
    return <HomePage periode={Route.useSearch().periode} />;
  },
});
```

Si `_app.tsx` déclare déjà un `validateSearch` pour `etat`, vérifier que les deux se
superposent (TanStack fusionne les recherches validées des routes parentes) ; `?etat=` doit
continuer de marcher.

- [ ] **Step 3: la page et ses blocs** — `home-page.tsx` : `Page title="Accueil"` avec, en
  `actions`, un `ToggleGroup type="single"` (`LIBELLE_PERIODE`) qui navigue vers
  `{ search: (p) => ({ ...p, periode }) }`. Pendant le dessin, la page lit `FIXTURE` et un
  faux `requete = { isPending: false, isError: false, refetch: () => {} }`. État :
  `etatAffiche(useEtat(), requete, donnees.total === 0)` → `HomeSkeleton`, `StateError`
  (« L'accueil n'a pas pu se charger »), `Empty` (« Pas encore de séance », « Les séances
  enregistrées depuis le téléphone apparaîtront ici. », bouton-lien « Voir les routines »), ou
  la grille :

```tsx
<div className="grid gap-4 @3xl:grid-cols-4 @lg:grid-cols-2">  {/* KpiCards : 4 cartes */}
<div className="grid gap-4 @4xl:grid-cols-3">
  <ThisWeek className="@4xl:col-span-1" … />
  <TrendChart className="@4xl:col-span-2" … />
</div>
<MusclesCard … />
<div className="grid gap-4 @4xl:grid-cols-2">
  <RecentRecords … />
  <RecentSessions … />
</div>
```

  (`Page` porte déjà `@container` : on raisonne en largeur de contenu, pas de fenêtre.)

  Les blocs :
  - **`KpiCards`** — quatre `Card size="sm"` : libellé (`text-muted-foreground text-sm`),
    valeur `text-3xl font-semibold tabular-nums` (`plural` pour Séances, `formatKg` pour
    Volume), et dessous l'écart : icône `ArrowUp` / `ArrowDown` / `Minus` (lucide,
    `size-3.5`) + `formatDelta(actuel, précédent, true)` pour le volume, sans `true` pour les
    trois autres, + « vs période préc. » en `text-muted-foreground text-xs`. Sans
    `precedente` : « Première période » à la place. Pas de couleur.
  - **`ThisWeek`** — `Card` « Cette semaine » : sept pastilles `size-8 rounded-full` étiquetées
    L M M J V S D ; entraîné = `bg-primary text-primary-foreground`, sinon `border` ;
    aujourd'hui = `ring-2 ring-ring ring-offset-2`. Sous les pastilles : « 2 / 3 séances »
    (`objectifHebdo`), une `Progress` dessous ; sans objectif : « 2 séances ». En pied, si
    `routineASuivre` : « À suivre » + `Link to="/routines/$id"` sur son nom (bouton `outline`
    avec `ArrowRight`). Les pastilles portent `aria-label` « lundi, entraîné » etc.
  - **`TrendChart`** — `Card` « Tendance », à droite un `ToggleGroup` « Séances · Volume »
    (état local) ; `ChartContainer` (hauteur `h-56`, `config` d'une seule série
    `color: "var(--chart-1)"`) + `BarChart` : `XAxis dataKey="debut"` formaté par
    `formatShortDay` (semaines) ou `formatMonth` (mois), `YAxis` largeur 40 (volume en
    `formatKg` abrégé), `ChartTooltip` + `ChartTooltipContent`, `Bar radius={4}
    isAnimationActive={false}`. Sous le graphique, un `<p className="sr-only">` qui dit le
    total de la période (lecteur d'écran).
  - **`MusclesCard`** — `Card` « Muscles » : à gauche (`@3xl:grid-cols-[1fr_auto]`) une liste
    de lignes : libellé `LIBELLE_ZONE[zone]` (largeur fixe `w-32`), une barre
    `h-2 rounded-full bg-primary` de largeur `series / max * 100 %` sur un fond `bg-muted`,
    et le nombre « 24 séries » en `tabular-nums`. À droite, `BodyMap primary={principaux}
    secondary={secondaires}`. Sans zone : « Aucune séance sur la période ».
  - **`RecentRecords`** — `Card` « Records récents » + lien « Tous les records » (`/records`) :
    jusqu'à 5 lignes `nom` · `LIBELLE_RECORD[types[0]]` (+ « +1 » si plusieurs) ·
    `formatLoad(chargeKg) × reps` (ou « 12 rép. ») · `formatShortDay(jourCivil(date))`.
  - **`RecentSessions`** — `Card` « Dernières séances » + lien « Tout l'historique »
    (`/history`) : 5 lignes, chacune un `Link to="/history/$id"` : nom, date courte, durée
    (`formatMinutes`), volume (`formatKg`), et « 2 records » s'il y en a (icône `Trophy`).
  - **`HomeSkeleton`** — `Skeleton` de 4 cartes `h-28`, deux blocs `h-72` (1/3 – 2/3), un
    `h-64`, deux `h-64`.

  Chaque bloc a sa phrase de période vide (« Aucune séance sur la période »).

- [ ] **Step 4: vérifier à l'écran** — `pnpm dev` déjà lancé ; plugin Playwright sur
  `http://localhost:3000/app/` à 1280 × 800 puis 390 × 800, thèmes sombre et clair
  (`localStorage["better-lift-theme"]`, à remettre ensuite), et `?etat=chargement`, `vide`,
  `erreur`. Vérifier : alignements de la grille, valeurs lisibles, rien ne déborde à 390 px,
  le graphique suit le thème, la bascule de période change l'URL et les chiffres.

- [ ] **Step 5: `/verif` puis commit**

```bash
git add apps/web/src/features/home apps/web/src/routes/_app.index.tsx
git commit -m "feat(web): dessin du tableau de bord de l'accueil, sur données factices"
```

- [ ] **Step 6: STOP — montrer les captures à l'utilisateur et attendre sa validation.**
  Ses retours se font ici, avant toute API.

---

### Task 3: l'API — service et route

**Files:**
- Create: `apps/api/src/services/tableau-de-bord.ts`
- Create: `apps/api/src/routes/tableau-de-bord.ts`, `apps/api/src/routes/tableau-de-bord.test.ts`
- Modify: `apps/api/src/services/seances.ts` (exporter `historique`, `LECTURE_SEANCE`,
  `versDetail` l'est déjà), `apps/api/src/app.ts`, `apps/api/src/app.test.ts`

**Interfaces:**
- Consumes: `requeteTableauDeBord`, `TableauDeBord`, `FaitSeance`, `zoneDuMuscle`,
  `routineASuivre` de `shared` ; `versDetail`, `anterieurA`, `historique`, `LECTURE_SEANCE`,
  `depotPreferences`.
- Produces: `type DepotTableauDeBord = { lire(userId: string, depuis: Date): Promise<TableauDeBord> }`,
  `depotTableauDeBord`, `routesTableauDeBord(depot, lireSession)`, monté sur `/tableau-de-bord`.

- [ ] **Step 1: tests de la route**

```ts
// apps/api/src/routes/tableau-de-bord.test.ts
import type { TableauDeBord } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotTableauDeBord } from "../services/tableau-de-bord.js";
import { routesTableauDeBord } from "./tableau-de-bord.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

const VIDE: TableauDeBord = { seances: [], total: 0, objectifHebdo: null, routineASuivre: null };

function monter() {
  const appels: { userId: string; depuis: string }[] = [];
  const depot: DepotTableauDeBord = {
    async lire(userId, depuis) {
      appels.push({ userId, depuis: depuis.toISOString() });
      return VIDE;
    },
  };
  const app = new Hono().route("/tableau-de-bord", routesTableauDeBord(depot, lireSession));
  const lire = (q: string, user: string | null = "alice") =>
    app.request(`/tableau-de-bord${q}`, { headers: user ? { "x-test-user": user } : {} });
  return { lire, appels };
}

describe("GET /tableau-de-bord (D330)", () => {
  it("exige une session", async () => {
    const { lire } = monter();
    expect((await lire("?depuis=2026-08-23T00:00:00.000Z", null)).status).toBe(401);
  });

  it("refuse un `depuis` absent ou invalide", async () => {
    const { lire } = monter();
    expect((await lire("")).status).toBe(400);
    expect((await lire("?depuis=hier")).status).toBe(400);
  });

  it("passe l'utilisateur de la session et la date, et rend le tableau", async () => {
    const { lire, appels } = monter();
    const res = await lire("?depuis=2026-08-23T00:00:00.000Z");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(VIDE);
    expect(appels).toEqual([{ userId: "alice", depuis: "2026-08-23T00:00:00.000Z" }]);
  });
});
```

Si `zValidator` de l'app répond autre chose qu'un 400 `{ erreur }` sur une requête invalide,
reprendre le même emballage que `routes/seances.ts` (lire comment il traite `pagination`).

- [ ] **Step 2: les lancer, ils échouent** — `pnpm --filter @better-lift/api exec vitest run src/routes/tableau-de-bord.test.ts` : module absent.

- [ ] **Step 3: la route**

```ts
// apps/api/src/routes/tableau-de-bord.ts
import { requeteTableauDeBord } from "@better-lift/shared";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotTableauDeBord } from "../services/tableau-de-bord.js";
import { zValidator } from "../validation.js"; // le même import que routes/seances.ts

/** Le tableau de bord de l'Accueil du web (D330) : les faits des séances depuis une date. */
export function routesTableauDeBord(depot: DepotTableauDeBord, lireSession: LireSession) {
  return new Hono()
    .use(exigerSession(lireSession))
    .get("/", zValidator("query", requeteTableauDeBord), async (c) =>
      c.json(await depot.lire(c.get("userId"), new Date(c.req.valid("query").depuis)), 200),
    );
}
```

(Reprendre l'import exact de `zValidator` qu'utilise `routes/seances.ts`.)

- [ ] **Step 4: le service** — dans `services/seances.ts`, ajouter `export` devant
  `async function historique` et `const LECTURE_SEANCE`. Puis :

```ts
// apps/api/src/services/tableau-de-bord.ts
import { prisma } from "@better-lift/db";
import {
  type FaitSeance,
  routineASuivre,
  type TableauDeBord,
  type Zone,
  zoneDuMuscle,
} from "@better-lift/shared";
import { depotPreferences } from "./preferences.js";
import { anterieurA, historique, LECTURE_SEANCE, type LigneSeance, versDetail } from "./seances.js";

export type DepotTableauDeBord = {
  /** Les faits des séances depuis `depuis`, la plus récente d'abord, et le contexte de l'Accueil. */
  lire(userId: string, depuis: Date): Promise<TableauDeBord>;
};

/**
 * Les records se rejouent sur TOUT l'historique des exercices (D64) — un record se juge contre
 * tout le passé, pas contre la seule période — par `versDetail`, comme le détail d'une séance.
 */
export const depotTableauDeBord: DepotTableauDeBord = {
  async lire(userId, depuis) {
    const [lignes, total, preferences, routines, derniere] = await Promise.all([
      prisma.seance.findMany({
        where: { userId, debut: { gte: depuis } },
        orderBy: { debut: "desc" },
        select: {
          ...LECTURE_SEANCE,
          exercices: {
            ...LECTURE_SEANCE.exercices,
            select: {
              ...LECTURE_SEANCE.exercices.select,
              exercise: { select: { slug: true, nomFr: true, gifUrl: true, target: true, secondary: true } },
            },
          },
        },
      }),
      prisma.seance.count({ where: { userId } }),
      depotPreferences.lire(userId),
      // Même ordre que la liste des routines du web et du mobile.
      prisma.routine.findMany({ where: { userId }, orderBy: [{ position: "asc" }], select: { id: true, nom: true } }),
      prisma.seance.findMany({
        where: { userId, routineId: { not: null } },
        orderBy: { debut: "desc" },
        take: 1,
        select: { routineId: true, debut: true },
      }),
    ]);
    const exerciseIds = [...new Set(lignes.flatMap((l) => l.exercices.map((e) => e.exerciseId)))];
    const histo = await historique(userId, exerciseIds);
    const seances = lignes.map((l): FaitSeance => {
      const detail = versDetail(l as unknown as LigneSeance, anterieurA(histo, l.debut));
      const seriesParZone: Partial<Record<Zone, number>> = {};
      const principaux = new Set<string>();
      const secondaires = new Set<string>();
      for (const e of l.exercices) {
        principaux.add(e.exercise.target);
        for (const m of e.exercise.secondary) secondaires.add(m);
        const zone = zoneDuMuscle(e.exercise.target);
        const n = e.series.filter((s) => s.faite && s.type !== "ECHAUFFEMENT").length;
        if (zone && n > 0) seriesParZone[zone] = (seriesParZone[zone] ?? 0) + n;
      }
      return {
        id: detail.id,
        nom: detail.nom,
        debut: detail.debut,
        fin: detail.fin,
        seriesFaites: detail.seriesFaites,
        volumeKg: detail.volumeKg,
        seriesParZone,
        muscles: { principaux: [...principaux], secondaires: [...secondaires].filter((m) => !principaux.has(m)) },
        records: detail.exercices.flatMap((e) =>
          e.series
            .filter((s) => s.records.length > 0)
            .map((s) => ({ slug: e.slug, nom: e.nom, types: s.records, reps: s.reps, chargeKg: s.chargeKg })),
        ),
      };
    });
    const suivante = routineASuivre(
      routines,
      derniere.map((d) => ({ routineId: d.routineId, debut: d.debut.toISOString() })),
    );
    return {
      seances,
      total,
      objectifHebdo: preferences.objectifHebdo,
      routineASuivre: suivante ? { id: suivante.id, nom: suivante.nom } : null,
    };
  },
};
```

Avant d'écrire : vérifier dans `prisma/schema.prisma` le champ d'ordre des routines (`position`
et dossiers : reprendre exactement l'`orderBy` de `depotPrisma.lister` dans
`services/routines.ts`), et dans `services/seances.ts` la signature de `anterieurA` et ce que
`versDetail` attend (`LigneSeance` : si le `select` élargi le rend incompatible, construire
l'objet attendu plutôt que de transtyper). `zoneDuMuscle` et `routineASuivre` doivent être
exportés par `shared/index.ts` (les ajouter sinon).

- [ ] **Step 5: monter la route** — `app.ts` : importer `routesTableauDeBord` et
  `depotTableauDeBord`, `.route("/tableau-de-bord", routesTableauDeBord(depotTableauDeBord, lireSession))`
  après `/seances`. `app.test.ts` : ajouter `/tableau-de-bord?depuis=…` sans session → 401.

- [ ] **Step 6: tests verts, essai réel** — `pnpm --filter @better-lift/api test`, puis sur
  l'API de dev : `curl` avec une session du compte de contrôle n'est pas possible sans cookie ;
  vérifier plutôt par le navigateur (tâche 4). Typecheck et build de l'API.

- [ ] **Step 7: commit**

```bash
git add apps/api/src/services/tableau-de-bord.ts apps/api/src/services/seances.ts apps/api/src/routes/tableau-de-bord.ts apps/api/src/routes/tableau-de-bord.test.ts apps/api/src/app.ts apps/api/src/app.test.ts packages/shared/src/index.ts
git commit -m "feat(api): GET /tableau-de-bord, les faits des séances depuis une date (D330)"
```

---

### Task 4: brancher la page

**Files:**
- Create: `apps/web/src/features/home/queries.ts`, `apps/web/e2e/accueil.spec.ts`
- Modify: `home-page.tsx`, `_app.index.tsx`, `apps/web/src/features/history/queries.ts`
- Delete: `apps/web/src/features/home/fixture.ts` (créée en tâche 2)

**Interfaces:**
- Consumes: `api["tableau-de-bord"].$get`, `lire`, `bornesPeriode`, `depuisPour`.
- Produces: `tableauDeBordKeys.all = ["tableau-de-bord"]`, `tableauDeBordQuery(depuis: string)`.

- [ ] **Step 1: la requête**

```ts
// apps/web/src/features/home/queries.ts
import type { TableauDeBord } from "@better-lift/shared";
import { queryOptions } from "@tanstack/react-query";
import { api, lire } from "@/lib/api";

/** `["tableau-de-bord"]` : la racine qu'invalide la suppression d'une séance. */
export const tableauDeBordKeys = {
  all: ["tableau-de-bord"] as const,
  depuis: (depuis: string) => ["tableau-de-bord", depuis] as const,
};

export const tableauDeBordQuery = (depuis: string) =>
  queryOptions({
    queryKey: tableauDeBordKeys.depuis(depuis),
    queryFn: async (): Promise<TableauDeBord> => {
      const res = await lire(
        () => api["tableau-de-bord"].$get({ query: { depuis } }),
        "L'accueil n'a pas pu se charger.",
      );
      return res.json();
    },
  });
```

  Une feature n'important pas une autre (D306), l'invalidation depuis `features/history`
  passe par la **clé littérale** `["tableau-de-bord"]` dans `apres` de `useSupprimerSeance`
  (`apres: [["routines"], exercicesKeys.all, ["tableau-de-bord"]]`).

- [ ] **Step 2: la route précharge** — dans `_app.index.tsx`, `loaderDeps: ({ search }) =>
  ({ periode: search.periode })`, `loader: ({ context, deps }) => void
  context.queryClient.prefetchQuery(tableauDeBordQuery(depuisPour(bornesPeriode(deps.periode,
  new Date(), FUSEAU))))`. Le fuseau : exporter `FUSEAU` de `lib/locale.ts` (aujourd'hui
  privé), seul endroit qui le fixe.

- [ ] **Step 3: la page lit l'API** — `HomePage` calcule `bornes` (mémo sur la période et le
  jour), `useQuery(tableauDeBordQuery(depuisPour(bornes)))`, `placeholderData:
  keepPreviousData` pour que changer de période n'affiche pas le squelette ; supprimer
  `fixture.ts` et son import.

- [ ] **Step 4: e2e**

```ts
// apps/web/e2e/accueil.spec.ts
import { expect, test } from "./fixtures";

test("l'accueil montre le tableau de bord et change de période", async ({ page }) => {
  await page.goto("/app/");
  await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
  // Le compte E2E peut n'avoir aucune séance : l'un des deux états est attendu.
  const vide = page.getByText("Pas encore de séance");
  const chiffres = page.getByText("Séances", { exact: true });
  await expect(vide.or(chiffres).first()).toBeVisible();
  if (await chiffres.isVisible()) {
    await page.getByRole("radio", { name: "1 an" }).click();
    await expect(page).toHaveURL(/periode=1a/);
  }
});
```

  (Lire `e2e/fixtures.ts` et `records.spec.ts` pour l'import exact et la session.)

- [ ] **Step 5: vérifier sur les vraies données** — plugin Playwright, compte de contrôle :
  les chiffres de « 4 sem. » recoupés à la main avec l'Historique (nombre de séances, volume
  d'une séance), un record récent présent dans Records, la routine à suivre identique à celle
  du mobile. Supprimer une séance n'est **pas** à faire sur la démo.

- [ ] **Step 6: `/verif`, e2e, commit**

```bash
pnpm --filter @better-lift/web e2e
git add apps/web/src/features/home apps/web/src/routes/_app.index.tsx apps/web/src/features/history/queries.ts apps/web/src/lib/locale.ts apps/web/e2e/accueil.spec.ts
git commit -m "feat(web): tableau de bord de l'accueil branché sur l'API (D330)"
```

---

### Task 5: décisions et documentation

**Files:** `docs/decisions.md`, `docs/conception.md`, `.claude/rules/interface-web.md`

- [ ] **Step 1:** `decisions.md` — annoter D283 « *Révisée par D330.* » et ajouter, section
  « Interface web » :
  « **D330** — L'Accueil du web est un tableau de bord, bilan d'abord : période 4 sem. ·
  3 mois · 1 an dans l'URL (3 mois par défaut) ; quatre chiffres clés comparés à la période
  précédente (écart en texte et flèche, sans couleur) ; semaine en cours face à l'objectif et
  routine à suivre ; tendance en barres (semaines, ou mois sur un an) ; séries par zone et
  carte du corps ; records récents et dernières séances. `GET /tableau-de-bord?depuis=` rend
  les faits par séance (records rejoués sur tout l'historique) ; le web les agrège dans son
  fuseau par `shared/tableau-de-bord.ts`. »
- [ ] **Step 2:** `conception.md` — la section du web qui dit l'Accueil vide passe au
  tableau de bord (une phrase).
- [ ] **Step 3:** `.claude/rules/interface-web.md`, « Coquille et écrans » : une puce
  « Accueil (D330) : `features/home/`, une requête `tableauDeBordQuery(depuis)` ; la
  suppression d'une séance invalide `["tableau-de-bord"]`. »
- [ ] **Step 4:** commit `docs: le tableau de bord de l'accueil (D330)`, `/verif`, push, PR,
  CI verte ; **s'arrêter à la PR** (fusionner déploie la production). Après fusion : supprimer
  la spec et ce plan (`docs/superpowers/`).
